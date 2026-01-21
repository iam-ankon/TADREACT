import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebars from "./sidebars";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  Mail,
  Phone,
  Calendar,
  Hash,
  TrendingUp,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  BarChart3,
  File,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Hash as HashIcon,
} from "lucide-react";
import { getCVs, deleteCV } from "../../api/employeeApi";

const CVList = () => {
  const [cvs, setCvs] = useState([]);
  const [filteredCvs, setFilteredCvs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCV, setExpandedCV] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  const navigate = useNavigate();

  /* ------------------------------------------------------------------ *
   *  1. Load saved state + fetch CVs
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const savedSearch = localStorage.getItem("cvListSearchQuery") || "";
    setSearchQuery(savedSearch);

    const fetchCVs = async () => {
      try {
        setLoading(true);
        const response = await getCVs();
        const data = response.data;
        setCvs(data);
        setFilteredCvs(data);
      } catch (err) {
        console.error("Error fetching CVs:", err);
        setError("Failed to load CVs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCVs();
  }, []);

  /* ------------------------------------------------------------------ *
   *  2. Filter and Sort CVs
   * ------------------------------------------------------------------ */
  useEffect(() => {
    let filtered = [...cvs];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (cv) =>
          cv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cv.position_for?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cv.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cv.phone?.includes(searchQuery)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "with-pdf") {
        filtered = filtered.filter((cv) => cv.cv_file);
      } else if (statusFilter === "with-reference") {
        filtered = filtered.filter((cv) => cv.reference);
      } else if (statusFilter === "recent") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter((cv) => {
          const cvDate = new Date(cv.created_at || Date.now());
          return cvDate > weekAgo;
        });
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "position":
          aValue = a.position_for?.toLowerCase() || "";
          bValue = b.position_for?.toLowerCase() || "";
          break;
        case "date":
          aValue = new Date(a.created_at || Date.now());
          bValue = new Date(b.created_at || Date.now());
          break;
        case "email":
          aValue = a.email?.toLowerCase() || "";
          bValue = b.email?.toLowerCase() || "";
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      return sortOrder === "asc"
        ? aValue > bValue
          ? 1
          : -1
        : aValue < bValue
        ? 1
        : -1;
    });

    setFilteredCvs(filtered);
  }, [cvs, searchQuery, statusFilter, sortBy, sortOrder]);

  /* ------------------------------------------------------------------ *
   *  3. Save search state
   * ------------------------------------------------------------------ */
  useEffect(() => {
    localStorage.setItem("cvListSearchQuery", searchQuery);
  }, [searchQuery]);

  /* ------------------------------------------------------------------ *
   *  Handlers
   * ------------------------------------------------------------------ */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this CV?")) return;
    try {
      await deleteCV(id);
      setCvs((prev) => prev.filter((cv) => cv.id !== id));
    } catch (e) {
      console.error("Delete error:", e);
      alert("Failed to delete CV. Please try again.");
    }
  };

  const handleEdit = (id) => navigate(`/cv-edit/${id}`);
  const handleView = (id) => navigate(`/cv-detail/${id}`);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      const response = await getCVs();
      const data = response.data;
      setCvs(data);
      setFilteredCvs(data);
    } catch (err) {
      console.error("Error refreshing CVs:", err);
      setError("Failed to refresh CVs.");
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const totalCVs = cvs.length;
    const withPDF = cvs.filter((cv) => cv.cv_file).length;
    const withReference = cvs.filter((cv) => cv.reference).length;
    const recentCVs = cvs.filter((cv) => {
      const cvDate = new Date(cv.created_at || Date.now());
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return cvDate > weekAgo;
    }).length;

    return { totalCVs, withPDF, withReference, recentCVs };
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "#F8FAFC",
        }}
      >
        <Sidebars />
        <div
          style={{
            flex: 1,
            padding: "48px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                animation: "spin 1s linear infinite",
                width: "48px",
                height: "48px",
                border: "3px solid rgba(59, 130, 246, 0.2)",
                borderTopColor: "#3B82F6",
                borderRadius: "50%",
              }}
            ></div>
            <p
              style={{ marginTop: "16px", color: "#6B7280", fontSize: "14px" }}
            >
              Loading CVs...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#F8FAFC",
        overflow: "hidden",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebars />

      <div
        style={{
          flex: 1,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          maxHeight: "100vh",
        }}
      >
        {/* Modern Header with Stats */}
        <div style={{ marginBottom: "24px", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  padding: "14px",
                  background:
                    "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                  borderRadius: "16px",
                  boxShadow: "0 4px 20px rgba(139, 92, 246, 0.3)",
                }}
              >
                <FileText style={{ color: "white" }} size={28} />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#111827",
                    margin: "0 0 4px 0",
                    letterSpacing: "-0.025em",
                  }}
                >
                  CV Management
                </h2>
                <p
                  style={{
                    color: "#6B7280",
                    fontSize: "14px",
                    margin: 0,
                  }}
                >
                  Track and manage all candidate CVs in one place
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  background: "#F5F3FF",
                  border: "1px solid #DDD6FE",
                  borderRadius: "10px",
                  fontSize: "14px",
                  minWidth: "150px",
                }}
              >
                <div style={{ color: "#8B5CF6" }}>
                  <HashIcon size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    {stats.totalCVs}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    Total CVs
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  background: "#F0F9FF",
                  border: "1px solid #BAE6FD",
                  borderRadius: "10px",
                  fontSize: "14px",
                  minWidth: "150px",
                }}
              >
                <div style={{ color: "#0EA5E9" }}>
                  <FileText size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    {stats.withPDF}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    With PDF
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  minWidth: "150px",
                }}
              >
                <div style={{ color: "#10B981" }}>
                  <CheckCircle size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    {stats.withReference}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    With Reference
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: "10px",
                  fontSize: "14px",
                  minWidth: "150px",
                }}
              >
                <div style={{ color: "#F59E0B" }}>
                  <TrendingUp size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    {stats.recentCVs}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    This Week
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                justifyContent: "space-between",
              }}
            >
              {/* Search and Filters */}
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  minWidth: "300px",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <div style={{ position: "relative", flex: 1 }}>
                  <Search
                    style={{
                      position: "absolute",
                      left: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9CA3AF",
                    }}
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search CVs by name, position, email, or phone..."
                    style={{
                      width: "100%",
                      padding: "12px 16px 12px 48px",
                      background: "white",
                      border: "1px solid rgba(209, 213, 219, 0.8)",
                      borderRadius: "12px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#8B5CF6";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(139, 92, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(209, 213, 219, 0.8)";
                      e.target.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                    }}
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#9CA3AF",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    background: "white",
                    border: "1px solid rgba(209, 213, 219, 0.8)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    minWidth: "140px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#D1D5DB")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(209, 213, 219, 0.8)")
                  }
                >
                  <Filter size={16} style={{ color: "#6B7280" }} />
                  <select
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: "14px",
                      color: "#374151",
                      outline: "none",
                      width: "100%",
                      cursor: "pointer",
                    }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">📄 All CVs</option>
                    <option value="recent">🆕 Recent (This Week)</option>
                    <option value="with-pdf">📁 With PDF</option>
                    <option value="with-reference">📋 With Reference</option>
                  </select>
                </div>

                {/* Sort Button */}
                <button
                  onClick={() => toggleSort("name")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    background: "white",
                    border: "1px solid rgba(209, 213, 219, 0.8)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "14px",
                    color: "#374151",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#D1D5DB")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(209, 213, 219, 0.8)")
                  }
                >
                  <ArrowUpDown size={16} />
                  Sort
                  {sortOrder === "asc" ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                {/* View Toggle */}
                <div
                  style={{
                    display: "flex",
                    background: "rgba(243, 244, 246, 0.8)",
                    borderRadius: "10px",
                    padding: "4px",
                    border: "1px solid rgba(209, 213, 219, 0.5)",
                  }}
                >
                  <button
                    onClick={() => setViewMode("grid")}
                    style={{
                      padding: "8px 16px",
                      background: viewMode === "grid" ? "white" : "transparent",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: viewMode === "grid" ? "#8B5CF6" : "#6B7280",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow:
                        viewMode === "grid"
                          ? "0 2px 8px rgba(0, 0, 0, 0.08)"
                          : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <BarChart3 size={14} />
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    style={{
                      padding: "8px 16px",
                      background: viewMode === "list" ? "white" : "transparent",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: viewMode === "list" ? "#8B5CF6" : "#6B7280",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow:
                        viewMode === "list"
                          ? "0 2px 8px rgba(0, 0, 0, 0.08)"
                          : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <File size={14} />
                    List
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={refreshData}
                  style={{
                    padding: "10px 16px",
                    background: "white",
                    border: "1px solid rgba(209, 213, 219, 0.8)",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#D1D5DB")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(209, 213, 219, 0.8)")
                  }
                >
                  <RefreshCw size={16} />
                  Refresh
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: "10px 16px",
                    background: "white",
                    border: "1px solid rgba(209, 213, 219, 0.8)",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#D1D5DB")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(209, 213, 219, 0.8)")
                  }
                >
                  <Download size={16} />
                  Export
                </motion.button>

                <Link to="/cv-add" style={{ textDecoration: "none" }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: "12px 24px",
                      background:
                        "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)";
                      e.currentTarget.style.boxShadow =
                        "0 6px 20px rgba(139, 92, 246, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 14px rgba(139, 92, 246, 0.4)";
                    }}
                  >
                    <Plus size={18} />
                    Add CV
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Search Info */}
        {searchQuery && (
          <div
            style={{
              backgroundColor: "#F5F3FF",
              padding: "12px 20px",
              borderRadius: "10px",
              marginBottom: "20px",
              border: "1px solid #DDD6FE",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px",
              fontWeight: "500",
              flexShrink: 0,
            }}
          >
            <span>
              Found {filteredCvs.length} CV(s) matching "{searchQuery}"
            </span>
            <button
              onClick={clearSearch}
              style={{
                backgroundColor: "#8B5CF6",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <X size={12} />
              Clear search
            </button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            style={{
              backgroundColor: "#FEF2F2",
              padding: "16px 20px",
              borderRadius: "10px",
              marginBottom: "20px",
              border: "1px solid #FECACA",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexShrink: 0,
            }}
          >
            <AlertCircle size={20} color="#EF4444" />
            <span style={{ color: "#EF4444", fontSize: "14px" }}>{error}</span>
            <button
              onClick={refreshData}
              style={{
                marginLeft: "auto",
                padding: "6px 12px",
                background: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* CVs Display Area with Scrollbar */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            minHeight: "0", // Important for flex child scrolling
          }}
        >
          {filteredCvs.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "64px 24px",
                background: "white",
                borderRadius: "16px",
                border: "1px solid rgba(229, 231, 235, 0.5)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#F3F4F6",
                  marginBottom: "24px",
                }}
              >
                <FileText style={{ color: "#9CA3AF" }} size={32} />
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 8px 0",
                }}
              >
                No CVs found
              </h3>
              <p
                style={{
                  color: "#6B7280",
                  fontSize: "14px",
                  margin: "0 0 24px 0",
                  maxWidth: "400px",
                }}
              >
                {searchQuery
                  ? "Try adjusting your search criteria."
                  : "Add your first CV to get started."}
              </p>
              <Link to="/cv-add" style={{ textDecoration: "none" }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: "12px 32px",
                    background:
                      "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(139, 92, 246, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 14px rgba(139, 92, 246, 0.4)";
                  }}
                >
                  Add Your First CV
                </motion.button>
              </Link>
            </div>
          ) : viewMode === "grid" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
                padding: "4px",
                height: "100%",
                overflowY: "auto",
                overflowX: "hidden",
                // Custom scrollbar styles
                scrollbarWidth: "thin",
                scrollbarColor: "#c1c1c1 #f1f1f1",
              }}
            >
              {filteredCvs.map((cv) => (
                <CVCard
                  key={cv.id}
                  cv={cv}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  expandedCV={expandedCV}
                  setExpandedCV={setExpandedCV}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                border: "1px solid rgba(229, 231, 235, 0.5)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* List Header */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "#F9FAFB",
                  borderBottom: "1px solid #E5E7EB",
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1fr 1.5fr 0.5fr",
                  gap: "16px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#6B7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  flexShrink: 0,
                }}
              >
                <div>Candidate</div>
                <div>Contact</div>
                <div>Position</div>
                <div>Reference</div>
                <div>Actions</div>
              </div>

              {/* List Content with Scroll */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  maxHeight: "calc(100vh - 400px)", // Adjust based on your header height
                  // Custom scrollbar styles
                  scrollbarWidth: "thin",
                  scrollbarColor: "#c1c1c1 #f1f1f1",
                }}
              >
                {filteredCvs.map((cv, index) => (
                  <CVListItem
                    key={cv.id}
                    cv={cv}
                    index={index}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    expandedCV={expandedCV}
                    setExpandedCV={setExpandedCV}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {filteredCvs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: "20px",
              padding: "16px 20px",
              background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
              color: "white",
              borderRadius: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "4px",
                }}
              >
                Showing {filteredCvs.length} CVs
              </div>
              <div
                style={{
                  fontSize: "12px",
                  opacity: 0.8,
                }}
              >
                Sorted by {sortBy} •{" "}
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                style={{
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.1)")
                }
              >
                Generate Report
              </button>
              <button
                style={{
                  padding: "8px 16px",
                  background: "white",
                  color: "#1E293B",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#F1F5F9")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "white")
                }
              >
                <BarChart3 size={14} />
                View Analytics
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Add CSS for custom scrollbars */}
      <style>{`
        /* Custom scrollbar for Webkit browsers (Chrome, Safari, Edge) */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        /* For Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: #c1c1c1 #f1f1f1;
        }

        /* Spin animation for loading */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Smooth scrolling */
        .scroll-container {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

// CV Card Component (Grid View)
const CVCard = ({
  cv,
  onEdit,
  onDelete,
  onView,
  expandedCV,
  setExpandedCV,
}) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      style={{
        background: "white",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(229, 231, 235, 0.5)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        height: "fit-content",
      }}
      onClick={() => setExpandedCV(expandedCV === cv.id ? null : cv.id)}
    >
      {/* Card Header */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #F3F4F6",
          background: expandedCV === cv.id ? "#F9FAFB" : "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                padding: "12px",
                background: "#F5F3FF",
                borderRadius: "12px",
                color: "#8B5CF6",
              }}
            >
              <User size={20} />
            </div>
            <div style={{ overflow: "hidden" }}>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 4px 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {cv.name}
              </h4>
              <div
                style={{
                  fontSize: "13px",
                  color: "#6B7280",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>ID: #{cv.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CV Info */}
        <div style={{ marginTop: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
              fontSize: "13px",
            }}
          >
            <Mail size={14} style={{ color: "#8B5CF6", flexShrink: 0 }} />
            <span
              style={{
                color: "#6B7280",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {cv.email || "No email"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
              fontSize: "13px",
            }}
          >
            <Phone size={14} style={{ color: "#8B5CF6", flexShrink: 0 }} />
            <span style={{ color: "#6B7280" }}>{cv.phone || "No phone"}</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
            }}
          >
            <Calendar size={14} style={{ color: "#8B5CF6", flexShrink: 0 }} />
            <span style={{ color: "#6B7280" }}>{cv.age || "No age"}</span>
          </div>
          {cv.position_for && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "10px",
                fontSize: "13px",
              }}
            >
              <Briefcase
                size={14}
                style={{ color: "#8B5CF6", flexShrink: 0 }}
              />
              <span
                style={{
                  color: "#6B7280",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {cv.position_for}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (cv.cv_file) {
                window.open(cv.cv_file, "_blank");
              }
            }}
            disabled={!cv.cv_file}
            style={{
              textAlign: "center",
              padding: "10px",
              background: cv.cv_file ? "#F0F9FF" : "#F3F4F6",
              border: "none",
              borderRadius: "8px",
              cursor: cv.cv_file ? "pointer" : "not-allowed",
              fontSize: "11px",
              color: cv.cv_file ? "#0EA5E9" : "#9CA3AF",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            onMouseEnter={(e) => {
              if (cv.cv_file) e.currentTarget.style.background = "#E0F2FE";
            }}
            onMouseLeave={(e) => {
              if (cv.cv_file) e.currentTarget.style.background = "#F0F9FF";
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              PDF
            </div>
            <div>View</div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(cv.id);
            }}
            style={{
              textAlign: "center",
              padding: "10px",
              background: "#F5F3FF",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "11px",
              color: "#8B5CF6",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#EDE9FE")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F5F3FF")}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              QR
            </div>
            <div>Code</div>
          </button>
          <div
            style={{
              textAlign: "center",
              padding: "10px",
              background: cv.reference ? "#F0FDF4" : "#F3F4F6",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: cv.reference ? "#10B981" : "#6B7280",
                marginBottom: "4px",
              }}
            >
              {cv.reference ? "REF" : "No"}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#6B7280",
              }}
            >
              {cv.reference ? "Yes" : "Ref"}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div
        style={{
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #F3F4F6",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(cv.id);
          }}
          style={{
            padding: "8px 14px",
            background: "#F3F4F6",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "500",
            color: "#3B82F6",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#E5E7EB")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#F3F4F6")}
        >
          <Edit size={14} />
          Edit
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(cv.id);
            }}
            style={{
              padding: "8px",
              background: "#FEF2F2",
              border: "none",
              borderRadius: "8px",
              color: "#EF4444",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF2F2")}
          >
            <Trash2 size={14} />
          </button>
          <button
            style={{
              padding: "8px",
              background: "#F3F4F6",
              border: "none",
              borderRadius: "8px",
              color: "#6B7280",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#E5E7EB")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F3F4F6")}
          >
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expandedCV === cv.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "#F9FAFB",
              borderTop: "1px solid #E5E7EB",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Eye size={14} />
                Quick Details
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6B7280",
                  lineHeight: "1.6",
                  margin: "0 0 12px 0",
                }}
              >
                <div>
                  <strong>Reference:</strong> {cv.reference || "None"}
                </div>
                <div>
                  <strong>Position:</strong>{" "}
                  {cv.position_for || "Not specified"}
                </div>
                <div>
                  <strong>Date of Birth:</strong> {cv.age || "Not specified"}
                </div>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#9CA3AF",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <HashIcon size={12} />
                CV ID: #{cv.id}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// CV List Item Component (List View)
const CVListItem = ({
  cv,
  index,
  onEdit,
  onDelete,
  onView,
  expandedCV,
  setExpandedCV,
}) => {
  return (
    <>
      <div
        style={{
          padding: "16px 20px",
          display: "grid",
          gridTemplateColumns: "2fr 2fr 1fr 1fr 1.5fr",
          gap: "16px",
          alignItems: "center",
          borderBottom: "1px solid #F3F4F6",
          cursor: "pointer",
          transition: "background 0.2s ease",
          background:
            expandedCV === cv.id
              ? "#F9FAFB"
              : index % 2 === 0
              ? "white"
              : "#F9FAFB",
        }}
        onClick={() => setExpandedCV(expandedCV === cv.id ? null : cv.id)}
      >
        {/* Candidate */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              padding: "8px",
              background: "#F5F3FF",
              borderRadius: "8px",
              color: "#8B5CF6",
            }}
          >
            <User size={16} />
          </div>
          <div>
            <div
              style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}
            >
              {cv.name}
            </div>
            <div
              style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}
            >
              ID: #{cv.id}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <div
            style={{ fontSize: "13px", color: "#374151", marginBottom: "4px" }}
          >
            {cv.email || "No email"}
          </div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>
            {cv.phone || "No phone"}
          </div>
        </div>

        {/* Position */}
        <div>
          <div
            style={{
              fontSize: "13px",
              color: "#374151",
              padding: "4px 8px",
              background: "#F3F4F6",
              borderRadius: "6px",
              textAlign: "center",
            }}
          >
            {cv.position_for || "N/A"}
          </div>
        </div>

        {/* Reference */}
        <div>
          <div
            style={{
              fontSize: "13px",
              color: cv.reference ? "#10B981" : "#6B7280",
              padding: "4px 8px",
              background: cv.reference ? "#F0FDF4" : "#F3F4F6",
              borderRadius: "6px",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            {cv.reference ? "Yes" : "No"}
          </div>
        </div>

        {/* Actions */}
        <div
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (cv.cv_file) {
                window.open(cv.cv_file, "_blank");
              }
            }}
            disabled={!cv.cv_file}
            style={{
              padding: "6px",
              background: cv.cv_file ? "#F0F9FF" : "#F3F4F6",
              border: "none",
              borderRadius: "6px",
              color: cv.cv_file ? "#0EA5E9" : "#9CA3AF",
              cursor: cv.cv_file ? "pointer" : "not-allowed",
            }}
            title="View PDF"
          >
            <FileText size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(cv.id);
            }}
            style={{
              padding: "6px",
              background: "#F5F3FF",
              border: "none",
              borderRadius: "6px",
              color: "#8B5CF6",
              cursor: "pointer",
            }}
            title="View QR Code"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(cv.id);
            }}
            style={{
              padding: "6px",
              background: "#F3F4F6",
              border: "none",
              borderRadius: "6px",
              color: "#3B82F6",
              cursor: "pointer",
            }}
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(cv.id);
            }}
            style={{
              padding: "6px",
              background: "#FEF2F2",
              border: "none",
              borderRadius: "6px",
              color: "#EF4444",
              cursor: "pointer",
            }}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {expandedCV === cv.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "#F3F4F6",
              borderBottom: "1px solid #E5E7EB",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px 20px 16px 120px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  fontSize: "13px",
                  color: "#6B7280",
                }}
              >
                <div>
                  <div>
                    <strong>Email:</strong> {cv.email || "Not specified"}
                  </div>
                  <div>
                    <strong>Phone:</strong> {cv.phone || "Not specified"}
                  </div>
                </div>
                <div>
                  <div>
                    <strong>Position:</strong>{" "}
                    {cv.position_for || "Not specified"}
                  </div>
                  <div>
                    <strong>Date of Birth:</strong> {cv.age || "Not specified"}
                  </div>
                </div>
              </div>
              {cv.reference && (
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "13px",
                    color: "#6B7280",
                  }}
                >
                  <strong>Reference:</strong> {cv.reference}
                </div>
              )}
              {cv.cv_file && (
                <div style={{ marginTop: "12px" }}>
                  <a
                    href={cv.cv_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      color: "#0EA5E9",
                      textDecoration: "none",
                      fontWeight: "500",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText size={12} />
                    View PDF CV
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CVList;
