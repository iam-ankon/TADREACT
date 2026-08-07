import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../merchandiser/Sidebar.jsx";

const API_BASE = "http://119.148.51.38:8000/api/merchandiser/api";

const DevelopmentSamples = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(() => {
    const saved = localStorage.getItem("developmentSamplesShowFilters");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Filter states
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedGarment, setSelectedGarment] = useState("");

  // Save filter visibility to localStorage
  useEffect(() => {
    localStorage.setItem("developmentSamplesShowFilters", JSON.stringify(showFilters));
  }, [showFilters]);

  useEffect(() => {
    localStorage.setItem("developmentSamplesSearchTerm", searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem("developmentSamplesFilterStatus", filterStatus);
  }, [filterStatus]);

  useEffect(() => {
    localStorage.setItem("developmentSamplesSelectedYear", selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    localStorage.setItem("developmentSamplesSelectedSeason", selectedSeason);
  }, [selectedSeason]);

  useEffect(() => {
    localStorage.setItem("developmentSamplesSelectedGarment", selectedGarment);
  }, [selectedGarment]);

  // Load saved filter values on component mount
  useEffect(() => {
    const savedSearchTerm = localStorage.getItem("developmentSamplesSearchTerm");
    const savedFilterStatus = localStorage.getItem("developmentSamplesFilterStatus");
    const savedYear = localStorage.getItem("developmentSamplesSelectedYear");
    const savedSeason = localStorage.getItem("developmentSamplesSelectedSeason");
    const savedGarment = localStorage.getItem("developmentSamplesSelectedGarment");

    if (savedSearchTerm) setSearchTerm(savedSearchTerm);
    if (savedFilterStatus) setFilterStatus(savedFilterStatus);
    if (savedYear) setSelectedYear(savedYear);
    if (savedSeason) setSelectedSeason(savedSeason);
    if (savedGarment) setSelectedGarment(savedGarment);
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE}/inquiry/?page_size=10000`, {
        headers: {
          Authorization: token ? `Token ${token}` : "",
        },
      });
      
      console.log("Fetched inquiries:", response.data);
      
      let inquiriesData = [];
      if (response.data && response.data.results) {
        inquiriesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        inquiriesData = response.data;
      } else {
        inquiriesData = [];
      }
      
      console.log("Processed inquiries:", inquiriesData.length);
      
      // Log customer data for debugging
      if (inquiriesData.length > 0) {
        console.log("Sample inquiry customer data:", {
          customer_name: inquiriesData[0].customer_name,
          customer: inquiriesData[0].customer,
          buyer: inquiriesData[0].buyer
        });
      }
      
      setInquiries(inquiriesData);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      alert("Failed to fetch inquiries");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // FIXED: Better customer name extraction - using the serializer's customer_name field
  const getCustomerName = (inquiry) => {
    if (!inquiry) return "-";
    
    // Method 1: Use the customer_name field from the serializer (most reliable)
    if (inquiry.customer_name && inquiry.customer_name !== "-") {
      return inquiry.customer_name;
    }
    
    // Method 2: Check if customer is an object with customer_name
    if (inquiry.customer && typeof inquiry.customer === "object") {
      if (inquiry.customer.customer_name) return inquiry.customer.customer_name;
      if (inquiry.customer.name) {
        if (typeof inquiry.customer.name === "object") {
          if (inquiry.customer.name.customer_name) return inquiry.customer.name.customer_name;
          if (inquiry.customer.name.name) return inquiry.customer.name.name;
        }
        if (typeof inquiry.customer.name === "string") return inquiry.customer.name;
      }
      if (inquiry.customer.hrms_customer_name) return inquiry.customer.hrms_customer_name;
      if (inquiry.customer.display_name) return inquiry.customer.display_name;
      return `Customer ${inquiry.customer.id}`;
    }
    
    // Method 3: If customer is a string/ID
    if (inquiry.customer && typeof inquiry.customer === "string") {
      return inquiry.customer;
    }
    
    // Method 4: Check buyer as fallback
    if (inquiry.buyer) {
      if (typeof inquiry.buyer === "object" && inquiry.buyer.name) {
        return inquiry.buyer.name;
      }
      if (typeof inquiry.buyer === "string") {
        return inquiry.buyer;
      }
    }
    
    return "-";
  };

  const getSeasonDisplay = (season) => {
    if (!season) return "-";
    return season.charAt(0).toUpperCase() + season.slice(1);
  };

  const getStatusBadge = (status) => {
    if (status === "yes" || status === "Yes" || status === "YES") {
      return { bg: "#d1fae5", color: "#065f46", text: "Required" };
    } else if (status === "no" || status === "No" || status === "NO") {
      return { bg: "#fee2e2", color: "#991b1b", text: "Not Required" };
    } else {
      return { bg: "#f3f4f6", color: "#6b7280", text: "Not Specified" };
    }
  };

  const handleRowClick = (inquiryId) => {
    navigate(`/inquiries/${inquiryId}`);
  };

  // FIXED: Filter inquiries with proper customer name extraction
  const filteredInquiries = inquiries.filter((inquiry) => {
    const customerName = getCustomerName(inquiry);
    const inquiryNo = inquiry.inquiry_no || "";
    const style = inquiry.same_style || "";
    const garment = inquiry.garment || "";
    const season = inquiry.season || "";
    const year = inquiry.year || "";

    let searchPassed = true;
    if (searchTerm.trim()) {
      const searchTerms = searchTerm.toLowerCase().split(" ").filter(term => term.length > 0);
      
      if (searchTerms.length > 0) {
        searchPassed = searchTerms.some((term) => {
          return (
            inquiryNo.toLowerCase().includes(term) ||
            style.toLowerCase().includes(term) ||
            customerName.toLowerCase().includes(term) ||
            garment.toLowerCase().includes(term) ||
            season.toLowerCase().includes(term) ||
            year.toLowerCase().includes(term)
          );
        });
      }
    }

    let statusPassed = true;
    if (filterStatus === "yes") {
      statusPassed = inquiry.development_sample_status === "yes" ||
                     inquiry.development_sample_status === "Yes" ||
                     inquiry.development_sample_status === "YES";
    } else if (filterStatus === "no") {
      statusPassed = inquiry.development_sample_status === "no" ||
                     inquiry.development_sample_status === "No" ||
                     inquiry.development_sample_status === "NO";
    }

    const yearPassed = !selectedYear || inquiry.year === selectedYear;
    const seasonPassed = !selectedSeason || (inquiry.season || "").toLowerCase() === selectedSeason.toLowerCase();
    const garmentPassed = !selectedGarment || selectedGarment === "all" || (inquiry.garment || "").toLowerCase() === selectedGarment.toLowerCase();

    return searchPassed && statusPassed && yearPassed && seasonPassed && garmentPassed;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInquiries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);

  // Get unique values for filters
  const availableYears = [...new Set(inquiries.map(i => i.year).filter(y => y))].sort((a, b) => b - a);
  const seasons = ["spring", "summer", "autumn", "winter"];
  const garmentOptions = [
    { value: "all", label: "All" },
    { value: "knit", label: "Knit" },
    { value: "woven", label: "Woven" },
    { value: "sweater", label: "Sweater" },
    { value: "underwear", label: "Underwear" },
  ];

  // Calculate stats
  const stats = {
    total: inquiries.length,
    yes: inquiries.filter(i => i.development_sample_status === "yes" || 
                              i.development_sample_status === "Yes" || 
                              i.development_sample_status === "YES").length,
    no: inquiries.filter(i => i.development_sample_status === "no" || 
                             i.development_sample_status === "No" || 
                             i.development_sample_status === "NO").length,
    notSpecified: inquiries.filter(i => !i.development_sample_status ||
                              (i.development_sample_status !== "yes" &&
                               i.development_sample_status !== "Yes" &&
                               i.development_sample_status !== "YES" &&
                               i.development_sample_status !== "no" &&
                               i.development_sample_status !== "No" &&
                               i.development_sample_status !== "NO")).length,
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setSelectedYear("");
    setSelectedSeason("");
    setSelectedGarment("");
    setCurrentPage(1);
    localStorage.removeItem("developmentSamplesSearchTerm");
    localStorage.removeItem("developmentSamplesFilterStatus");
    localStorage.removeItem("developmentSamplesSelectedYear");
    localStorage.removeItem("developmentSamplesSelectedSeason");
    localStorage.removeItem("developmentSamplesSelectedGarment");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, selectedYear, selectedSeason, selectedGarment]);

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading development sample data...</p>
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
              <div style={styles.headerBadge}>🧪</div>
              <h1 style={styles.headerTitle}>Development Samples</h1>
            </div>
            <div style={styles.headerActions}>
              <button onClick={() => navigate("/inquiries")} style={styles.backButton}>
                ← Back to Inquiries
              </button>
            </div>
          </div>
          <p style={styles.headerSubtitle}>
            Track and manage development sample requirements across all inquiries
          </p>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{stats.total}</span>
              <span style={styles.statLabel}>Total Inquiries</span>
            </div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: "4px solid #10b981" }}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{stats.yes}</span>
              <span style={styles.statLabel}>Sample Required</span>
            </div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: "4px solid #ef4444" }}>
            <div style={styles.statIcon}>❌</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{stats.no}</span>
              <span style={styles.statLabel}>Not Required</span>
            </div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: "4px solid #f59e0b" }}>
            <div style={styles.statIcon}>⏳</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{stats.notSpecified}</span>
              <span style={styles.statLabel}>Not Specified</span>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div style={styles.filterSection}>
          <div style={styles.filterHeader} onClick={() => setShowFilters(!showFilters)}>
            <div style={styles.filterHeaderLeft}>
              <span style={styles.filterIcon}>🔍</span>
              <h3 style={styles.filterTitle}>Filters</h3>
              <span style={styles.filterBadge}>{filteredInquiries.length} results</span>
            </div>
            <button style={styles.filterToggle}>{showFilters ? "▲" : "▼"}</button>
          </div>

          {showFilters && (
            <div style={styles.filterBody}>
              <div style={styles.filterGrid}>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Search (multi-word supported)</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.filterInput}
                    placeholder="Search by Inquiry No, Customer, Style, Garment, Season, Year..."
                  />
                  <small style={styles.searchHint}>
                    Tip: You can search multiple words like "spring knit" or "summer 2024"
                  </small>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Sample Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="all">All</option>
                    <option value="yes">Required</option>
                    <option value="no">Not Required</option>
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="">All</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Season</label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="">All</option>
                    {seasons.map((season) => (
                      <option key={season} value={season}>
                        {season.charAt(0).toUpperCase() + season.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Garment</label>
                  <select
                    value={selectedGarment}
                    onChange={(e) => setSelectedGarment(e.target.value)}
                    style={styles.filterSelect}
                  >
                    {garmentOptions.map((garment) => (
                      <option key={garment.value} value={garment.value}>
                        {garment.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.searchButtons}>
                <button onClick={clearFilters} style={styles.btnClear}>
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Inquiry No</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Style</th>
                  <th style={styles.th}>Garment</th>
                  <th style={styles.th}>Season/Year</th>
                  <th style={styles.th}>Sample Status</th>
                  <th style={styles.th}>Sample Date</th>
                  <th style={styles.th}>Courier Reference</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((inquiry) => {
                    const status = getStatusBadge(inquiry.development_sample_status);
                    const customerName = getCustomerName(inquiry);

                    return (
                      <tr
                        key={inquiry.id}
                        style={styles.tr}
                        onClick={() => handleRowClick(inquiry.id)}
                        className="clickable-row"
                      >
                        <td style={styles.td}>
                          <strong>{inquiry.inquiry_no || "-"}</strong>
                        </td>
                        <td style={styles.td}>
                          <span title={customerName}>
                            {customerName.length > 40 ? customerName.substring(0, 40) + "..." : customerName}
                          </span>
                        </td>
                        <td style={styles.td}>{inquiry.same_style || "-"}</td>
                        <td style={styles.td}>{inquiry.garment || "-"}</td>
                        <td style={styles.td}>
                          {getSeasonDisplay(inquiry.season)} / {inquiry.year || "-"}
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.statusBadge, backgroundColor: status.bg, color: status.color }}>
                            {status.text}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {inquiry.development_sample_date ? formatDate(inquiry.development_sample_date) : "-"}
                        </td>
                        <td style={styles.td}>
                          {inquiry.development_sample_courrier_reference || "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" style={styles.emptyCell}>
                      <div>No development sample data found</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredInquiries.length > 0 && (
            <div style={styles.pagination}>
              <div style={styles.paginationLeft}>
                <span style={styles.paginationInfo}>
                  📊 Total: {filteredInquiries.length} samples
                </span>
              </div>
              <div style={styles.paginationControls}>
                <button
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  style={styles.paginationButton}
                >
                  ← Prev
                </button>
                <div style={styles.pageNumbers}>
                  {(() => {
                    const maxVisible = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }
                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) pages.push(i);
                    return pages.map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={pageNum === currentPage ? styles.paginationButtonActive : styles.paginationButtonNumber}
                      >
                        {pageNum}
                      </button>
                    ));
                  })()}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={styles.paginationButton}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f0f2f5",
    fontFamily: "'Inter', sans-serif",
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
    background: "linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)",
    borderRadius: "14px",
    padding: "20px 24px",
    marginBottom: "24px",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    flexWrap: "wrap",
    gap: "10px",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  headerBadge: {
    background: "rgba(255,255,255,0.2)",
    borderRadius: "12px",
    padding: "8px 12px",
    fontSize: "20px",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "white",
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.8)",
    margin: 0,
  },
  headerActions: { display: "flex", gap: "12px" },
  backButton: {
    background: "rgba(255,255,255,0.2)",
    color: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "white",
    borderRadius: "12px",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  statIcon: {
    fontSize: "28px",
    background: "#f0f2f5",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
  },
  statInfo: { display: "flex", flexDirection: "column" },
  statValue: { fontSize: "24px", fontWeight: "700", color: "#0f172a" },
  statLabel: { fontSize: "12px", color: "#64748b", marginTop: "2px" },
  filterSection: {
    background: "white",
    borderRadius: "12px",
    marginBottom: "20px",
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  filterHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #e2e8f0",
  },
  filterHeaderLeft: { display: "flex", alignItems: "center", gap: "8px" },
  filterIcon: { fontSize: "14px" },
  filterTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  filterBadge: {
    background: "#e2e8f0",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    color: "#475569",
  },
  filterToggle: {
    background: "none",
    border: "none",
    fontSize: "12px",
    cursor: "pointer",
    color: "#64748b",
  },
  filterBody: { padding: "16px" },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "12px",
  },
  filterGroup: { display: "flex", flexDirection: "column", gap: "4px" },
  filterLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
  },
  filterInput: {
    padding: "8px 10px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
  },
  filterSelect: {
    padding: "8px 10px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    background: "white",
  },
  searchHint: {
    fontSize: "10px",
    color: "#64748b",
    marginTop: "4px",
  },
  searchButtons: { display: "flex", justifyContent: "flex-end" },
  btnClear: {
    background: "white",
    color: "#64748b",
    padding: "6px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "12px",
    cursor: "pointer",
  },
  tableContainer: {
    background: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 200px)",
    minHeight: "550px",
  },
  tableWrapper: {
    flex: 1,
    overflow: "auto",
    minHeight: "450px",
    maxHeight: "calc(100vh - 220px)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
    fontSize: "12px",
  },
  th: {
    padding: "12px 14px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  td: {
    padding: "10px 14px",
    fontSize: "12px",
    color: "#334155",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
  },
  emptyCell: {
    padding: "40px",
    textAlign: "center",
    color: "#94a3b8",
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    padding: "16px",
    borderTop: "1px solid #e2e8f0",
    flexWrap: "wrap",
  },
  paginationLeft: {
    display: "flex",
    alignItems: "center",
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  paginationInfo: {
    fontSize: "12px",
    color: "#475569",
    fontWeight: "500",
    background: "#f1f5f9",
    padding: "4px 10px",
    borderRadius: "6px",
  },
  paginationButton: {
    padding: "6px 12px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  paginationButtonNumber: {
    padding: "6px 10px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  paginationButtonActive: {
    padding: "6px 10px",
    background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
  },
  pageNumbers: { display: "flex", gap: "4px" },
};

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .clickable-row:hover { background: #f8fafc; cursor: pointer; }
  `;
  document.head.appendChild(style);
}

export default DevelopmentSamples;