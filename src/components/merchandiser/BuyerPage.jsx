// BuyerPage.jsx - Complete version with authentication token
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Create axios instance with auth header
const api = axios.create({
  baseURL: "http://119.148.51.38:8000/api/merchandiser/api/"
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Helper function to get customer display name from nested object
const getCustomerDisplayName = (customer) => {
  if (!customer) return "-";
  if (typeof customer === "object") {
    if (customer.customer_name) return customer.customer_name;
    if (customer.name) {
      if (typeof customer.name === "object") {
        if (customer.name.customer_name) return customer.name.customer_name;
        if (customer.name.name) return customer.name.name;
      }
      if (typeof customer.name === "string") return customer.name;
    }
    if (customer.hrms_customer_name) return customer.hrms_customer_name;
    if (customer.display_name) return customer.display_name;
    return `Customer ${customer.id}`;
  }
  return customer.toString() || "-";
};

// Helper to get departments as array
const getDepartmentsArray = (buyer) => {
  if (buyer.departments_display && Array.isArray(buyer.departments_display)) {
    return buyer.departments_display.map(d => d.name);
  }
  if (buyer.departments && Array.isArray(buyer.departments)) {
    return buyer.departments;
  }
  return [];
};

// Helper to get WGR numbers as array
const getWgrArray = (buyer) => {
  if (buyer.wgr_numbers_display && Array.isArray(buyer.wgr_numbers_display)) {
    return buyer.wgr_numbers_display.map(w => w.wgr_number);
  }
  if (buyer.wgr_numbers && Array.isArray(buyer.wgr_numbers)) {
    return buyer.wgr_numbers;
  }
  if (buyer.wgr) return [buyer.wgr];
  return [];
};

// Helper to get items as array
const getItemsArray = (buyer) => {
  if (buyer.items_display && Array.isArray(buyer.items_display)) {
    return buyer.items_display.map(i => i.name);
  }
  if (buyer.items && Array.isArray(buyer.items)) {
    return buyer.items;
  }
  if (buyer.item) return [buyer.item];
  return [];
};

// Helper to get categories as array
const getCategoriesArray = (buyer) => {
  if (buyer.product_categories_display && Array.isArray(buyer.product_categories_display)) {
    return buyer.product_categories_display.map(c => c.name);
  }
  if (buyer.product_categories && Array.isArray(buyer.product_categories)) {
    return buyer.product_categories;
  }
  if (buyer.product_category) return [buyer.product_category];
  return [];
};

// Storage keys
const STORAGE_KEYS = {
  SEARCH_TERM: 'buyer_search_term',
  SELECTED_DEPARTMENT: 'buyer_selected_department',
  SHOW_FILTERS: 'buyer_show_filters',
  CURRENT_PAGE: 'buyer_current_page'
};

export default function BuyerPage() {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.SEARCH_TERM) || "";
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_PAGE);
    return saved ? parseInt(saved) : 1;
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_FILTERS);
    return saved !== null ? saved === 'true' : true;
  });
  const [selectedDepartment, setSelectedDepartment] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_DEPARTMENT) || "all";
  });
  const [departmentsList, setDepartmentsList] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEARCH_TERM, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_DEPARTMENT, selectedDepartment);
  }, [selectedDepartment]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOW_FILTERS, showFilters);
  }, [showFilters]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PAGE, currentPage);
  }, [currentPage]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [buyersRes, customersRes] = await Promise.all([
        api.get("buyer/"),
        api.get("customer/"),
      ]);
      setBuyers(buyersRes.data);
      setCustomers(customersRes.data);
      
      // Extract unique departments from all buyers
      const allDepts = new Set();
      buyersRes.data.forEach(buyer => {
        const depts = getDepartmentsArray(buyer);
        depts.forEach(d => allDepts.add(d));
      });
      setDepartmentsList(["all", ...Array.from(allDepts).sort()]);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const getBuyerCustomers = (buyer) => {
    if (!buyer.customers) return [];
    return customers.filter((customer) => buyer.customers.includes(customer.id));
  };

  const handleDelete = async (buyerId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this buyer?")) {
      try {
        await api.delete(`buyer/${buyerId}/`);
        setBuyers(buyers.filter((b) => b.id !== buyerId));
      } catch (err) {
        console.error("Error deleting buyer:", err);
      }
    }
  };

  // Apply filters and sorting
  const filteredBuyers = buyers.filter((buyer) => {
    const departments = getDepartmentsArray(buyer);
    const matchesSearch = !searchTerm ||
      (buyer.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (buyer.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (buyer.phone?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesDept = selectedDepartment === "all" || departments.includes(selectedDepartment);
    return matchesSearch && matchesDept;
  });

  // Apply sorting
  const sortedBuyers = [...filteredBuyers].sort((a, b) => {
    let aVal = a[sortBy] || "";
    let bVal = b[sortBy] || "";
    if (sortBy === "customers") {
      aVal = getBuyerCustomers(a).length;
      bVal = getBuyerCustomers(b).length;
    }
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination - Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBuyers = sortedBuyers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedBuyers.length / itemsPerPage);

  // Calculate stats
  const stats = {
    total: buyers.length,
    withEmail: buyers.filter(b => b.email).length,
    withPhone: buyers.filter(b => b.phone).length,
    departments: departmentsList.filter(d => d !== "all").length,
    totalRows: buyers.reduce((sum, b) => sum + (b.rows?.length || 0), 0),
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("all");
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return "↕️";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading buyer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <div style={styles.headerBadge}>👥</div>
              <div>
                <h1 style={styles.headerTitle}>Buyer Management</h1>
                <p style={styles.headerSubtitle}>Manage all buyers and their associated customers</p>
              </div>
            </div>
            <div style={styles.headerActions}>
              <Link to="/add-buyer" style={styles.btnPrimary}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Buyer
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: "#dbeafe" }}>👥</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{stats.total}</span>
              <span style={styles.statLabel}>Total Buyers</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: "#fef3c7" }}>🏢</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{stats.departments}</span>
              <span style={styles.statLabel}>Departments</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: "#f3e8ff" }}>🔗</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{stats.withEmail}</span>
              <span style={styles.statLabel}>With Email</span>
            </div>
          </div>
        </div>

        {/* Filter Section - Collapsible */}
        <div style={styles.filterSection}>
          <div style={styles.filterHeader} onClick={() => setShowFilters(!showFilters)}>
            <div style={styles.filterHeaderLeft}>
              <span style={styles.filterIcon}>🔍</span>
              <h3 style={styles.filterTitle}>Filters & Search</h3>
              {searchTerm || selectedDepartment !== "all" ? (
                <span style={styles.activeFilterBadge}>Active Filters</span>
              ) : (
                <span style={styles.filterBadge}>{filteredBuyers.length} results</span>
              )}
            </div>
            <button style={styles.filterToggle}>
              {showFilters ? "▲" : "▼"}
            </button>
          </div>
          {showFilters && (
            <div style={styles.filterBody}>
              <div style={styles.filterGrid}>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>
                    🔎 Search Buyers
                    <span style={styles.filterHint}>Search by name, email or phone</span>
                  </label>
                  <div style={styles.searchInputWrapper}>
                    <span style={styles.searchIcon}>🔍</span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={styles.filterInput}
                      placeholder="Type to search..."
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm("")}
                        style={styles.clearSearchBtn}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>
                    🏢 Department Filter
                    <span style={styles.filterHint}>Filter by department</span>
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    style={styles.filterSelect}
                  >
                    {departmentsList.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept === "all" ? "📋 All Departments" : dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>
                    📄 Items Per Page
                    <span style={styles.filterHint}>Rows to display</span>
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    style={styles.filterSelect}
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>
              </div>
              <div style={styles.searchButtons}>
                <button
                  onClick={clearAllFilters}
                  style={styles.btnClear}
                >
                  🗑️ Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div style={styles.resultsSummary}>
          <div style={styles.resultsLeft}>
            <span style={styles.resultsCount}>
              {filteredBuyers.length} buyer{filteredBuyers.length !== 1 ? 's' : ''} found
            </span>
            {searchTerm && (
              <span style={styles.activeFilter}>
                Searching: "{searchTerm}"
                <button onClick={() => setSearchTerm("")} style={styles.removeFilter}>✕</button>
              </span>
            )}
            {selectedDepartment !== "all" && (
              <span style={styles.activeFilter}>
                Department: {selectedDepartment}
                <button onClick={() => setSelectedDepartment("all")} style={styles.removeFilter}>✕</button>
              </span>
            )}
          </div>
          <div style={styles.resultsRight}>
            <span style={styles.pageInfo}>
              Page {currentPage} of {totalPages || 1}
            </span>
          </div>
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th} onClick={() => handleSort("name")} className="sortable">
                    Buyer {getSortIcon("name")}
                  </th>
                  <th style={styles.th} onClick={() => handleSort("email")} className="sortable">
                    Contact {getSortIcon("email")}
                  </th>
                  <th style={styles.th}>Departments</th>
                  <th style={styles.th}>WGR Numbers</th>
                  <th style={styles.th}>Items</th>
                  <th style={styles.th}>Categories</th>
                  <th style={styles.th} onClick={() => handleSort("customers")} className="sortable">
                    Customers {getSortIcon("customers")}
                  </th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentBuyers.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={styles.emptyCell}>
                      <div style={styles.emptyState}>
                        <span style={styles.emptyIcon}>🔍</span>
                        <h3>No buyers found</h3>
                        <p>Try adjusting your search or filters</p>
                        <button onClick={clearAllFilters} style={styles.clearFiltersBtn}>
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentBuyers.map((buyer) => {
                    const buyerCustomers = getBuyerCustomers(buyer);
                    const departments = getDepartmentsArray(buyer);
                    const wgrNumbers = getWgrArray(buyer);
                    const items = getItemsArray(buyer);
                    const categories = getCategoriesArray(buyer);
                    
                    return (
                      <tr
                        key={buyer.id}
                        style={styles.tr}
                        onClick={() => navigate(`/buyer-details/${buyer.id}`)}
                        className="clickable-row"
                      >
                        <td style={styles.td}>
                          <div style={styles.buyerInfo}>
                            <strong style={styles.buyerName}>{buyer.name || "-"}</strong>
                            {buyer.remarks && (
                              <span style={styles.remarksPreview} title={buyer.remarks}>
                                💬
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.contactInfo}>
                            {buyer.email && (
                              <div style={styles.emailText}>
                                <span style={styles.contactIcon}>📧</span> {buyer.email}
                              </div>
                            )}
                            {buyer.phone && (
                              <div style={styles.phoneText}>
                                <span style={styles.contactIcon}>📞</span> {buyer.phone}
                              </div>
                            )}
                            {!buyer.email && !buyer.phone && "-"}
                          </div>
                        </td>
                        <td style={styles.td}>
                          {departments.length > 0 ? (
                            <div style={styles.multiValueContainer}>
                              {departments.slice(0, 2).map((dept, idx) => (
                                <span key={idx} style={styles.departmentBadge}>{dept}</span>
                              ))}
                              {departments.length > 2 && (
                                <span style={styles.moreBadge}>+{departments.length - 2}</span>
                              )}
                            </div>
                          ) : "-"}
                        </td>
                        <td style={styles.td}>
                          {wgrNumbers.length > 0 ? (
                            <div style={styles.multiValueContainer}>
                              {wgrNumbers.slice(0, 2).map((wgr, idx) => (
                                <span key={idx} style={styles.wgrBadge}>{wgr}</span>
                              ))}
                              {wgrNumbers.length > 2 && (
                                <span style={styles.moreBadge}>+{wgrNumbers.length - 2}</span>
                              )}
                            </div>
                          ) : "-"}
                        </td>
                        <td style={styles.td}>
                          {items.length > 0 ? (
                            <div style={styles.multiValueContainer}>
                              {items.slice(0, 2).map((item, idx) => (
                                <span key={idx} style={styles.itemBadge}>{item}</span>
                              ))}
                              {items.length > 2 && (
                                <span style={styles.moreBadge}>+{items.length - 2}</span>
                              )}
                            </div>
                          ) : "-"}
                        </td>
                        <td style={styles.td}>
                          {categories.length > 0 ? (
                            <div style={styles.multiValueContainer}>
                              {categories.slice(0, 2).map((cat, idx) => (
                                <span key={idx} style={styles.categoryBadge}>{cat}</span>
                              ))}
                              {categories.length > 2 && (
                                <span style={styles.moreBadge}>+{categories.length - 2}</span>
                              )}
                            </div>
                          ) : "-"}
                        </td>
                        <td style={styles.td}>
                          {buyerCustomers.length > 0 ? (
                            <div style={styles.customersList}>
                              {buyerCustomers.slice(0, 2).map((customer) => (
                                <div key={customer.id} style={styles.customerName}>
                                  {getCustomerDisplayName(customer)}
                                </div>
                              ))}
                              {buyerCustomers.length > 2 && (
                                <span style={styles.moreCustomers}>
                                  +{buyerCustomers.length - 2} more
                                </span>
                              )}
                            </div>
                          ) : "-"}
                        </td>
                        <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                          <div style={styles.actionButtons}>
                            <button
                              onClick={() => navigate(`/edit-buyer/${buyer.id}`)}
                              style={styles.editBtn}
                              title="Edit Buyer"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => handleDelete(buyer.id, e)}
                              style={styles.deleteBtn}
                              title="Delete Buyer"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredBuyers.length > 0 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={styles.paginationButton}
              >
                ⏮ First
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={styles.paginationButton}
              >
                ← Prev
              </button>
              <div style={styles.pageNumbers}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        ...styles.pageNumberBtn,
                        ...(currentPage === pageNum ? styles.activePage : {})
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={styles.paginationButton}
              >
                Next →
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={styles.paginationButton}
              >
                Last ⏭
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .clickable-row:hover {
          background: #f8fafc !important;
          cursor: pointer;
        }
        .sortable {
          cursor: pointer;
          user-select: none;
          transition: background 0.2s;
        }
        .sortable:hover {
          background: #e2e8f0 !important;
        }
        input:focus, select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f0f2f5",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  mainContent: {
    flex: 1,
    padding: "24px 32px",
    overflow: "auto",
    maxHeight: "100vh",
  },
  loadingContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  header: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: "16px",
    padding: "24px 28px",
    marginBottom: "24px",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  headerBadge: {
    background: "rgba(255,255,255,0.15)",
    borderRadius: "14px",
    padding: "10px 14px",
    fontSize: "22px",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "white",
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.7)",
    margin: "4px 0 0 0",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white",
    padding: "10px 24px",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "white",
    borderRadius: "14px",
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  statIcon: {
    fontSize: "28px",
    width: "52px",
    height: "52px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
  },
  statValue: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#0f172a",
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },
  filterSection: {
    background: "white",
    borderRadius: "14px",
    marginBottom: "20px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  filterHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 20px",
    cursor: "pointer",
    borderBottom: "1px solid #e2e8f0",
    transition: "background 0.2s",
  },
  filterHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  filterIcon: {
    fontSize: "16px",
  },
  filterTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  filterBadge: {
    background: "#e2e8f0",
    padding: "2px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    color: "#475569",
    fontWeight: "500",
  },
  activeFilterBadge: {
    background: "#3b82f6",
    padding: "2px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    color: "white",
    fontWeight: "500",
  },
  filterToggle: {
    background: "none",
    border: "none",
    fontSize: "12px",
    cursor: "pointer",
    color: "#64748b",
    padding: "4px 8px",
  },
  filterBody: {
    padding: "20px",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginBottom: "20px",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  filterLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  filterHint: {
    fontSize: "10px",
    fontWeight: "normal",
    color: "#94a3b8",
    textTransform: "none",
  },
  searchInputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    fontSize: "14px",
    color: "#94a3b8",
  },
  filterInput: {
    width: "100%",
    padding: "10px 12px 10px 36px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "13px",
    outline: "none",
    transition: "all 0.2s",
  },
  clearSearchBtn: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    fontSize: "14px",
    padding: "2px 6px",
  },
  filterSelect: {
    padding: "10px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "13px",
    background: "white",
    cursor: "pointer",
  },
  searchButtons: {
    display: "flex",
    justifyContent: "flex-end",
  },
  btnClear: {
    background: "white",
    color: "#64748b",
    padding: "8px 20px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  resultsSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "12px",
  },
  resultsLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  resultsCount: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
  },
  activeFilter: {
    fontSize: "12px",
    background: "#f1f5f9",
    padding: "4px 8px 4px 12px",
    borderRadius: "20px",
    color: "#475569",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  removeFilter: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    fontSize: "12px",
    padding: "0 4px",
  },
  resultsRight: {
    display: "flex",
    alignItems: "center",
  },
  pageInfo: {
    fontSize: "12px",
    color: "#64748b",
  },
  tableContainer: {
    background: "white",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1200px",
    fontSize: "13px",
  },
  th: {
    padding: "14px 14px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.2s",
  },
  td: {
    padding: "12px 14px",
    fontSize: "13px",
    color: "#334155",
    verticalAlign: "middle",
  },
  buyerInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  buyerName: {
    fontSize: "14px",
    color: "#0f172a",
  },
  remarksPreview: {
    fontSize: "12px",
    cursor: "help",
  },
  contactInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  contactIcon: {
    fontSize: "11px",
    marginRight: "4px",
  },
  emailText: {
    fontSize: "12px",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
  },
  phoneText: {
    fontSize: "11px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
  },
  multiValueContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    alignItems: "center",
  },
  departmentBadge: {
    display: "inline-block",
    padding: "2px 8px",
    background: "#dbeafe",
    color: "#1e40af",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "500",
  },
  wgrBadge: {
    display: "inline-block",
    padding: "2px 8px",
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "500",
  },
  itemBadge: {
    display: "inline-block",
    padding: "2px 8px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "500",
  },
  categoryBadge: {
    display: "inline-block",
    padding: "2px 8px",
    background: "#f3e8ff",
    color: "#6b21a5",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "500",
  },
  moreBadge: {
    display: "inline-block",
    padding: "2px 6px",
    background: "#f1f5f9",
    color: "#475569",
    borderRadius: "10px",
    fontSize: "10px",
    fontWeight: "500",
  },
  customersList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  customerName: {
    fontSize: "12px",
    color: "#0f172a",
  },
  moreCustomers: {
    fontSize: "11px",
    color: "#64748b",
    fontStyle: "italic",
  },
  actionButtons: {
    display: "flex",
    gap: "6px",
  },
  editBtn: {
    background: "white",
    border: "1px solid #e2e8f0",
    padding: "6px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    transition: "all 0.2s",
  },
  deleteBtn: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    padding: "6px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#dc2626",
    transition: "all 0.2s",
  },
  emptyCell: {
    padding: "60px",
    textAlign: "center",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  emptyIcon: {
    fontSize: "48px",
  },
  clearFiltersBtn: {
    marginTop: "8px",
    padding: "8px 20px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    padding: "16px 20px",
    borderTop: "1px solid #e2e8f0",
    flexWrap: "wrap",
  },
  paginationButton: {
    padding: "6px 14px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  pageNumbers: {
    display: "flex",
    gap: "4px",
  },
  pageNumberBtn: {
    padding: "6px 12px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.2s",
  },
  activePage: {
    background: "#3b82f6",
    color: "white",
    borderColor: "#3b82f6",
  },
};