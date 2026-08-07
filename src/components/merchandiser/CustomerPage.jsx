import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../merchandiser/Sidebar.jsx";
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  ArrowRight,
  Trash2,
  Search,
  Plus,
  Edit,
  Eye,
  Building2,
  Users,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  const [stats, setStats] = useState({
    total: 0,
    withEmail: 0,
    withPhone: 0,
    withBuyers: 0,
  });
  const navigate = useNavigate();

  const API_URL = "http://119.148.51.38:8000/api/merchandiser/api/customer/";
  const BUYER_URL = "http://119.148.51.38:8000/api/merchandiser/api/buyer/";

  useEffect(() => {
    async function fetchData() {
      try {
        const [custRes, buyerRes] = await Promise.all([
          axios.get(API_URL),
          axios.get(BUYER_URL),
        ]);

        let customersData = [];
        if (Array.isArray(custRes.data)) {
          customersData = custRes.data;
        } else if (custRes.data && Array.isArray(custRes.data.results)) {
          customersData = custRes.data.results;
        } else if (custRes.data && Array.isArray(custRes.data.data)) {
          customersData = custRes.data.data;
        } else {
          console.error("Unexpected API response structure:", custRes.data);
          setError("Unexpected data format from server");
          setCustomers([]);
          setFilteredCustomers([]);
          setLoading(false);
          return;
        }

        setCustomers(customersData);

        // Calculate stats
        const total = customersData.length;
        const withEmail = customersData.filter(
          (c) => c.email && c.email.trim(),
        ).length;
        const withPhone = customersData.filter(
          (c) => c.phone && c.phone.trim(),
        ).length;
        const withBuyers = customersData.filter(
          (c) => c.buyers && c.buyers.length > 0,
        ).length;

        setStats({ total, withEmail, withPhone, withBuyers });

        let buyersData = [];
        if (Array.isArray(buyerRes.data)) {
          buyersData = buyerRes.data;
        } else if (buyerRes.data && Array.isArray(buyerRes.data.results)) {
          buyersData = buyerRes.data.results;
        } else if (buyerRes.data && Array.isArray(buyerRes.data.data)) {
          buyersData = buyerRes.data.data;
        }
        setBuyers(buyersData);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter customers based on search and filter
  useEffect(() => {
    let filtered = [...customers];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((customer) => {
        const name = (
          customer.customer_name ||
          customer.hrms_customer_name ||
          ""
        ).toLowerCase();
        const email = (customer.email || "").toLowerCase();
        const phone = (customer.phone || "").toLowerCase();
        const code = (customer.customer_code || "").toLowerCase();
        return (
          name.includes(search) ||
          email.includes(search) ||
          phone.includes(search) ||
          code.includes(search)
        );
      });
    }

    // Apply status filter
    if (selectedFilter === "withEmail") {
      filtered = filtered.filter((c) => c.email && c.email.trim());
    } else if (selectedFilter === "withPhone") {
      filtered = filtered.filter((c) => c.phone && c.phone.trim());
    } else if (selectedFilter === "withBuyers") {
      filtered = filtered.filter((c) => c.buyers && c.buyers.length > 0);
    } else if (selectedFilter === "noEmail") {
      filtered = filtered.filter((c) => !c.email || !c.email.trim());
    }

    setFilteredCustomers(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, selectedFilter, customers, itemsPerPage]);

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  };

  const handleDelete = async (id, customerName) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${customerName}"? This will also remove from HRMS if linked.`,
      )
    ) {
      try {
        await axios.delete(`${API_URL}${id}/`);
        const updatedCustomers = customers.filter((cust) => cust.id !== id);
        setCustomers(updatedCustomers);

        // Update stats
        setStats((prev) => ({
          ...prev,
          total: prev.total - 1,
          withEmail: updatedCustomers.filter((c) => c.email && c.email.trim())
            .length,
          withPhone: updatedCustomers.filter((c) => c.phone && c.phone.trim())
            .length,
          withBuyers: updatedCustomers.filter(
            (c) => c.buyers && c.buyers.length > 0,
          ).length,
        }));
      } catch (err) {
        console.error(err);
        alert("Failed to delete customer.");
      }
    }
  };

  const getCustomerDisplayName = (customer) => {
    return (
      customer.customer_name ||
      customer.hrms_customer_name ||
      (customer.name && customer.name.customer_name) ||
      "Unnamed Customer"
    );
  };

  const getInitials = (name) => {
    if (!name || name === "Unnamed Customer") return "U";
    return name.charAt(0).toUpperCase();
  };

  const getRandomColor = (id) => {
    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
    ];
    return colors[id % colors.length];
  };

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top when page changes
      document
        .getElementById("customer-grid")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Get page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Stat cards
  const statCards = [
    {
      label: "Total Customers",
      value: stats.total,
      icon: Users,
      color: "#3b82f6",
      bg: "#eff6ff",
    },
    {
      label: "With Email",
      value: stats.withEmail,
      icon: Mail,
      color: "#10b981",
      bg: "#d1fae5",
    },
    {
      label: "With Phone",
      value: stats.withPhone,
      icon: Phone,
      color: "#f59e0b",
      bg: "#fef3c7",
    },
    {
      label: "With Buyers",
      value: stats.withBuyers,
      icon: Building2,
      color: "#8b5cf6",
      bg: "#ede9fe",
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "#f3f4f6",
        }}
      >
        <Sidebar />
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div className="spinner-large"></div>
            <p style={{ marginTop: "1rem", color: "#6b7280" }}>
              Loading customers...
            </p>
          </div>
        </div>
        <style>{`
          .spinner-large {
            width: 50px;
            height: 50px;
            border: 3px solid #e5e7eb;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "#f3f4f6",
        }}
      >
        <Sidebar />
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              textAlign: "center",
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "1rem",
              maxWidth: "400px",
            }}
          >
            <AlertCircle
              size={48}
              style={{ color: "#ef4444", marginBottom: "1rem" }}
            />
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              Error Loading Data
            </h3>
            <p style={{ color: "#6b7280", marginBottom: "1rem" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentItems = getCurrentPageItems();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          padding: "2rem",
          overflowY: "auto",
          maxHeight: "100vh",
          scrollBehavior: "smooth",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "0.5rem",
            }}
          >
            Customer Management
          </h1>
          <p style={{ color: "#6b7280" }}>
            Manage and track all your customer information
          </p>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                style={{
                  background: "white",
                  borderRadius: "1rem",
                  padding: "1.25rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 40px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      background: stat.bg,
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      display: "inline-flex",
                    }}
                  >
                    <Icon size={24} color={stat.color} />
                  </div>
                  <span
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: stat.color,
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    margin: 0,
                  }}
                >
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Search and Filter Bar */}
        <div
          style={{
            background: "white",
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            {/* Search */}
            <div style={{ flex: "1", minWidth: "250px", position: "relative" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                }}
              />
              <input
                type="text"
                placeholder="Search by name, email, phone, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Items Per Page Selector */}
            <div>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.875rem",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
                <option value={48}>48 per page</option>
                <option value={96}>96 per page</option>
              </select>
            </div>

            {/* Filter Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  backgroundColor:
                    selectedFilter !== "all" ? "#eff6ff" : "white",
                  border: `1px solid ${selectedFilter !== "all" ? "#3b82f6" : "#e5e7eb"}`,
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  color: selectedFilter !== "all" ? "#3b82f6" : "#6b7280",
                }}
              >
                <Filter size={16} />
                Filter
                {selectedFilter !== "all" && (
                  <span
                    style={{
                      backgroundColor: "#3b82f6",
                      color: "white",
                      borderRadius: "999px",
                      padding: "0.125rem 0.5rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    1
                  </span>
                )}
              </button>

              {showFilters && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "0.5rem",
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    zIndex: 10,
                    minWidth: "200px",
                  }}
                >
                  <div style={{ padding: "0.5rem" }}>
                    <button
                      onClick={() => {
                        setSelectedFilter("all");
                        setShowFilters(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "0.5rem 0.75rem",
                        backgroundColor:
                          selectedFilter === "all" ? "#eff6ff" : "transparent",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      All Customers
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFilter("withEmail");
                        setShowFilters(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "0.5rem 0.75rem",
                        backgroundColor:
                          selectedFilter === "withEmail"
                            ? "#eff6ff"
                            : "transparent",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      With Email
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFilter("noEmail");
                        setShowFilters(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "0.5rem 0.75rem",
                        backgroundColor:
                          selectedFilter === "noEmail"
                            ? "#eff6ff"
                            : "transparent",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      No Email
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFilter("withPhone");
                        setShowFilters(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "0.5rem 0.75rem",
                        backgroundColor:
                          selectedFilter === "withPhone"
                            ? "#eff6ff"
                            : "transparent",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      With Phone
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFilter("withBuyers");
                        setShowFilters(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "0.5rem 0.75rem",
                        backgroundColor:
                          selectedFilter === "withBuyers"
                            ? "#eff6ff"
                            : "transparent",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      With Buyers
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Add Button */}
            <button
              onClick={() => navigate("/add-customer")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: "600",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-1px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <Plus size={18} />
              Add Customer
            </button>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || selectedFilter !== "all") && (
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                Active filters:
              </span>
              {searchTerm && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.25rem 0.5rem",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                  }}
                >
                  Search: "{searchTerm}"
                  <X
                    size={12}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSearchTerm("")}
                  />
                </span>
              )}
              {selectedFilter !== "all" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.25rem 0.5rem",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                  }}
                >
                  Filter: {selectedFilter}
                  <X
                    size={12}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedFilter("all")}
                  />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Info */}
        <div
          style={{
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of{" "}
            {filteredCustomers.length} customers
          </p>
        </div>

        {/* Customers Grid with Scroll */}
        <div
          id="customer-grid"
          style={{
            maxHeight: "calc(100vh - 480px)",
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: "0.5rem",
            scrollBehavior: "smooth",
          }}
        >
          {filteredCustomers.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem",
                background: "white",
                borderRadius: "1rem",
              }}
            >
              <Users
                size={64}
                style={{ color: "#d1d5db", marginBottom: "1rem" }}
              />
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                }}
              >
                No customers found
              </h3>
              <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                {searchTerm
                  ? "No customers match your search criteria"
                  : "Get started by adding your first customer"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate("/add-customer")}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  + Add Customer
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {currentItems.map((customer) => {
                const displayName = getCustomerDisplayName(customer);
                const initials = getInitials(displayName);
                const avatarColor = getRandomColor(customer.id);

                // Get buyer names
                const customerBuyers = customer.buyers || [];
                const buyerNames = customerBuyers
                  .map((bid) => {
                    const buyer = buyers.find((b) => b.id === bid);
                    return buyer ? buyer.name : "";
                  })
                  .filter(Boolean);

                const hasEmail = customer.email && customer.email.trim();
                const hasPhone = customer.phone && customer.phone.trim();

                return (
                  <div
                    key={customer.id}
                    style={{
                      background: "white",
                      borderRadius: "1rem",
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow =
                        "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 1px 3px rgba(0,0,0,0.1)";
                    }}
                  >
                    {/* Card Header with Avatar */}
                    <div
                      style={{
                        padding: "1.5rem",
                        borderBottom: "1px solid #f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${avatarColor} 0%, ${avatarColor}dd 100%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "bold",
                          fontSize: "1.5rem",
                        }}
                      >
                        {initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: "700",
                            color: "#1f2937",
                            marginBottom: "0.25rem",
                          }}
                        >
                          {displayName}
                        </h3>
                        {customer.customer_code && (
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              fontFamily: "monospace",
                            }}
                          >
                            Code: {customer.customer_code}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: "1.5rem" }}>
                      {/* Contact Info */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.75rem",
                          marginBottom: "1rem",
                        }}
                      >
                        {hasEmail && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            <Mail size={16} style={{ color: "#3b82f6" }} />
                            <a
                              href={`mailto:${customer.email}`}
                              style={{
                                color: "#3b82f6",
                                textDecoration: "none",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {customer.email}
                            </a>
                          </div>
                        )}
                        {hasPhone && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            <Phone size={16} style={{ color: "#10b981" }} />
                            <a
                              href={`tel:${customer.phone}`}
                              style={{
                                color: "#374151",
                                textDecoration: "none",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {customer.phone}
                            </a>
                          </div>
                        )}
                        {customer.address && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.75rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            <MapPin
                              size={16}
                              style={{
                                color: "#f59e0b",
                                marginTop: "0.125rem",
                              }}
                            />
                            <span style={{ color: "#6b7280" }}>
                              {customer.address}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Buyers Tags */}
                      {buyerNames.length > 0 && (
                        <div style={{ marginBottom: "1rem" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <Building2 size={14} style={{ color: "#8b5cf6" }} />
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color: "#6b7280",
                              }}
                            >
                              Associated Buyers ({buyerNames.length})
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "0.5rem",
                            }}
                          >
                            {buyerNames.slice(0, 3).map((name, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: "0.25rem 0.5rem",
                                  backgroundColor: "#ede9fe",
                                  color: "#6d28d9",
                                  borderRadius: "0.375rem",
                                  fontSize: "0.75rem",
                                  fontWeight: "500",
                                }}
                              >
                                {name}
                              </span>
                            ))}
                            {buyerNames.length > 3 && (
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#6b7280",
                                }}
                              >
                                +{buyerNames.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Remarks */}
                      {customer.remarks && (
                        <div
                          style={{
                            marginBottom: "1rem",
                            padding: "0.5rem",
                            backgroundColor: "#f9fafb",
                            borderRadius: "0.5rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              marginBottom: "0.25rem",
                            }}
                          >
                            <FileText size={12} style={{ color: "#6b7280" }} />
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color: "#6b7280",
                              }}
                            >
                              Notes
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              margin: 0,
                            }}
                          >
                            {customer.remarks}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer - Actions */}
                    <div
                      style={{
                        padding: "1rem 1.5rem",
                        borderTop: "1px solid #f3f4f6",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "0.5rem",
                      }}
                    >
                      <button
                        onClick={() =>
                          navigate(`/customer-details/${customer.id}`)
                        }
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          padding: "0.5rem",
                          backgroundColor: "#eff6ff",
                          color: "#3b82f6",
                          border: "none",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#dbeafe";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#eff6ff";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/edit-customer/${customer.id}`)
                        }
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          padding: "0.5rem",
                          backgroundColor: "#fef3c7",
                          color: "#d97706",
                          border: "none",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#fde68a";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#fef3c7";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id, displayName)}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          padding: "0.5rem",
                          backgroundColor: "#fee2e2",
                          color: "#dc2626",
                          border: "none",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#fecaca";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#fee2e2";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredCustomers.length > 0 && (
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
              position: "sticky",
              bottom: 0,
              background: "#f3f4f6",
              padding: "1rem 0",
            }}
          >
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.5 : 1,
                transition: "all 0.2s",
              }}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && goToPage(page)}
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: currentPage === page ? "#3b82f6" : "white",
                  color: currentPage === page ? "white" : "#4b5563",
                  border: currentPage === page ? "none" : "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  cursor: typeof page === "number" ? "pointer" : "default",
                  fontWeight: currentPage === page ? "600" : "400",
                  transition: "all 0.2s",
                }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                opacity: currentPage === totalPages ? 0.5 : 1,
                transition: "all 0.2s",
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <style>{`
          /* Custom scrollbar styles */
          #customer-grid::-webkit-scrollbar {
            width: 8px;
          }
          
          #customer-grid::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          
          #customer-grid::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          
          #customer-grid::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          
          /* Smooth scrolling */
          * {
            scroll-behavior: smooth;
          }
        `}</style>
      </div>
    </div>
  );
}
