import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  Search,
  Filter,
  Download,
  RefreshCw,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  Calendar,
  Hash,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle,
  Briefcase,
  BarChart3,
  File,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Building,
  Users,
  Clock,
  ShieldAlert,
  Undo,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Hash as HashIcon,
} from "lucide-react";
import Sidebars from "./sidebars";
import { getTerminatedEmployees } from "../../api/employeeApi";

const TerminatedEmployeeArchive = () => {
  const [archivedEmployees, setArchivedEmployees] = useState([]);
  const [filteredArchives, setFilteredArchives] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedArchive, setExpandedArchive] = useState(null);
  const [sortBy, setSortBy] = useState("termination_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  // Fetch real data from backend
  useEffect(() => {
    const fetchArchivedEmployees = async () => {
      try {
        setLoading(true);
        const response = await getTerminatedEmployees();
        const data = Array.isArray(response.data) ? response.data : [];
        
        setArchivedEmployees(data);
        setFilteredArchives(data);
      } catch (err) {
        console.error("Failed to load archived employees:", err);
        setError("Could not load terminated employee records");
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedEmployees();
  }, []);

  // Filtering + Sorting logic - Simplified to match CVList pattern
  useEffect(() => {
    let filtered = [...archivedEmployees];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (archive) =>
          archive.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          archive.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          archive.department_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          archive.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          archive.original_employee_id?.toString().includes(searchQuery)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "completed") {
        filtered = filtered.filter(
          (archive) => 
            archive.exit_interview_completed && 
            archive.clearance_completed && 
            archive.final_settlement_paid
        );
      } else if (statusFilter === "pending") {
        filtered = filtered.filter(
          (archive) => 
            !archive.exit_interview_completed || 
            !archive.clearance_completed || 
            !archive.final_settlement_paid
        );
      } else if (statusFilter === "resignation") {
        filtered = filtered.filter((archive) => archive.termination_type === "resignation");
      } else if (statusFilter === "termination") {
        filtered = filtered.filter((archive) => archive.termination_type === "termination");
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "department":
          aValue = a.department_name?.toLowerCase() || "";
          bValue = b.department_name?.toLowerCase() || "";
          break;
        case "termination_date":
          aValue = new Date(a.termination_date);
          bValue = new Date(b.termination_date);
          break;
        case "designation":
          aValue = a.designation?.toLowerCase() || "";
          bValue = b.designation?.toLowerCase() || "";
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

    setFilteredArchives(filtered);
  }, [archivedEmployees, searchQuery, statusFilter, sortBy, sortOrder]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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
      const response = await getTerminatedEmployees();
      const data = Array.isArray(response.data) ? response.data : [];
      setArchivedEmployees(data);
      setFilteredArchives(data);
    } catch (err) {
      console.error("Failed to refresh archived employees:", err);
      setError("Could not refresh terminated employee records");
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const totalTerminated = archivedEmployees.length;
    const resignations = archivedEmployees.filter(item => item.termination_type === "resignation").length;
    const terminations = archivedEmployees.filter(item => item.termination_type === "termination").length;
    const completedProcess = archivedEmployees.filter(item => 
      item.exit_interview_completed && 
      item.clearance_completed && 
      item.final_settlement_paid
    ).length;
    const recentTerminations = archivedEmployees.filter(item => {
      const termDate = new Date(item.termination_date);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return termDate > monthAgo;
    }).length;

    return { totalTerminated, resignations, terminations, completedProcess, recentTerminations };
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
                borderTopColor: "#8B5CF6",
                borderRadius: "50%",
              }}
            ></div>
            <p
              style={{ marginTop: "16px", color: "#6B7280", fontSize: "14px" }}
            >
              Loading terminated employees...
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
                    "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                  borderRadius: "16px",
                  boxShadow: "0 4px 20px rgba(239, 68, 68, 0.3)",
                }}
              >
                <Archive style={{ color: "white" }} size={28} />
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
                  Terminated Employee Archive
                </h2>
                <p
                  style={{
                    color: "#6B7280",
                    fontSize: "14px",
                    margin: 0,
                  }}
                >
                  Track and manage all terminated employee records
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
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "10px",
                  fontSize: "14px",
                  minWidth: "150px",
                }}
              >
                <div style={{ color: "#EF4444" }}>
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    {stats.totalTerminated}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    Total Terminated
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
                  <Users size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    {stats.resignations}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    Resignations
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
                  <AlertCircle size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    {stats.terminations}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    Terminations
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
                    {stats.completedProcess}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    Completed Exit
                  </div>
                </div>
              </div>
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
                  <Clock size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    {stats.recentTerminations}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    Recent (30 Days)
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
                    placeholder="Search by name, ID, department, or company..."
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
                      e.target.style.borderColor = "#EF4444";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(239, 68, 68, 0.1)";
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
                    <option value="all">📋 All Status</option>
                    <option value="completed">✅ Completed Process</option>
                    <option value="pending">⏳ Pending Process</option>
                    <option value="resignation">👋 Resignation</option>
                    <option value="termination">⚠️ Termination</option>
                  </select>
                </div>

                {/* Sort Button */}
                <button
                  onClick={() => toggleSort("termination_date")}
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
                      color: viewMode === "grid" ? "#EF4444" : "#6B7280",
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
                      color: viewMode === "list" ? "#EF4444" : "#6B7280",
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
              </div>
            </div>
          </div>
        </div>

        {/* Search Info */}
        {searchQuery && (
          <div
            style={{
              backgroundColor: "#FEF2F2",
              padding: "12px 20px",
              borderRadius: "10px",
              marginBottom: "20px",
              border: "1px solid #FECACA",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px",
              fontWeight: "500",
              flexShrink: 0,
            }}
          >
            <span>
              Found {filteredArchives.length} terminated employee(s) matching "{searchQuery}"
            </span>
            <button
              onClick={clearSearch}
              style={{
                backgroundColor: "#EF4444",
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

        {/* Archives Display Area with Scrollbar */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            minHeight: "0",
          }}
        >
          {filteredArchives.length === 0 ? (
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
                <Archive style={{ color: "#9CA3AF" }} size={32} />
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 8px 0",
                }}
              >
                No terminated employees found
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
                  : "No terminated employee records available."}
              </p>
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
                scrollbarWidth: "thin",
                scrollbarColor: "#c1c1c1 #f1f1f1",
              }}
            >
              {filteredArchives.map((archive) => (
                <TerminatedEmployeeCard
                  key={archive.id}
                  archive={archive}
                  expandedArchive={expandedArchive}
                  setExpandedArchive={setExpandedArchive}
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
                  gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr",
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
                <div>Employee</div>
                <div>Department</div>
                <div>Termination Date</div>
                <div>Type</div>
                <div>Status</div>
              </div>

              {/* List Content with Scroll */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  maxHeight: "calc(100vh - 400px)",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#c1c1c1 #f1f1f1",
                }}
              >
                {filteredArchives.map((archive, index) => (
                  <TerminatedEmployeeListItem
                    key={archive.id}
                    archive={archive}
                    index={index}
                    expandedArchive={expandedArchive}
                    setExpandedArchive={setExpandedArchive}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {filteredArchives.length > 0 && (
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
                Showing {filteredArchives.length} terminated employees
              </div>
              <div
                style={{
                  fontSize: "12px",
                  opacity: 0.8,
                }}
              >
                Sorted by {sortBy.replace('_', ' ')} •{" "}
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

// Terminated Employee Card Component (Grid View)
const TerminatedEmployeeCard = ({
  archive,
  expandedArchive,
  setExpandedArchive,
}) => {
  const isProcessComplete = 
    archive.exit_interview_completed && 
    archive.clearance_completed && 
    archive.final_settlement_paid;

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
      onClick={() => setExpandedArchive(expandedArchive === archive.id ? null : archive.id)}
    >
      {/* Card Header */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #F3F4F6",
          background: expandedArchive === archive.id ? "#F9FAFB" : "white",
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
                background: "#FEF2F2",
                borderRadius: "12px",
                color: "#EF4444",
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
                {archive.name}
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
                <span>ID: #{archive.original_employee_id}</span>
              </div>
            </div>
          </div>
          <span
            style={{
              padding: "4px 12px",
              fontSize: "12px",
              fontWeight: "600",
              borderRadius: "9999px",
              background: archive.termination_type === "resignation" 
                ? "#DBEAFE" 
                : "#FEE2E2",
              color: archive.termination_type === "resignation" 
                ? "#1E40AF" 
                : "#991B1B",
            }}
          >
            {archive.termination_type}
          </span>
        </div>

        {/* Employee Info */}
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
            <Building size={14} style={{ color: "#EF4444", flexShrink: 0 }} />
            <span
              style={{
                color: "#6B7280",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {archive.department_name || "No department"}
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
            <Briefcase size={14} style={{ color: "#EF4444", flexShrink: 0 }} />
            <span style={{ color: "#6B7280" }}>{archive.designation || "No designation"}</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
            }}
          >
            <Calendar size={14} style={{ color: "#EF4444", flexShrink: 0 }} />
            <span style={{ color: "#6B7280" }}>{archive.termination_date}</span>
          </div>
        </div>

        {/* Status Indicators */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "10px",
              background: archive.exit_interview_completed ? "#F0FDF4" : "#FEF2F2",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: archive.exit_interview_completed ? "#10B981" : "#EF4444",
                marginBottom: "4px",
              }}
            >
              EXIT
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#6B7280",
              }}
            >
              Interview
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "10px",
              background: archive.clearance_completed ? "#F0FDF4" : "#FEF2F2",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: archive.clearance_completed ? "#10B981" : "#EF4444",
                marginBottom: "4px",
              }}
            >
              CLR
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#6B7280",
              }}
            >
              Clearance
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "10px",
              background: archive.final_settlement_paid ? "#F0FDF4" : "#FEF2F2",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: archive.final_settlement_paid ? "#10B981" : "#EF4444",
                marginBottom: "4px",
              }}
            >
              FNL
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#6B7280",
              }}
            >
              Settlement
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
        <div
          style={{
            padding: "6px 12px",
            background: isProcessComplete ? "#F0FDF4" : "#FEF2F2",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "600",
            color: isProcessComplete ? "#10B981" : "#EF4444",
          }}
        >
          {isProcessComplete ? "✓ Process Complete" : "⏳ In Progress"}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
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
        {expandedArchive === archive.id && (
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
                Termination Details
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
                  <strong>Company:</strong> {archive.company_name || "Not specified"}
                </div>
                <div>
                  <strong>Designation:</strong> {archive.designation || "Not specified"}
                </div>
                <div>
                  <strong>Reason:</strong> {archive.reason_for_termination || "Not specified"}
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
                Employee ID: #{archive.original_employee_id}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Terminated Employee List Item Component (List View)
const TerminatedEmployeeListItem = ({
  archive,
  index,
  expandedArchive,
  setExpandedArchive,
}) => {
  const isProcessComplete = 
    archive.exit_interview_completed && 
    archive.clearance_completed && 
    archive.final_settlement_paid;

  return (
    <>
      <div
        style={{
          padding: "16px 20px",
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr",
          gap: "16px",
          alignItems: "center",
          borderBottom: "1px solid #F3F4F6",
          cursor: "pointer",
          transition: "background 0.2s ease",
          background:
            expandedArchive === archive.id
              ? "#F9FAFB"
              : index % 2 === 0
              ? "white"
              : "#F9FAFB",
        }}
        onClick={() => setExpandedArchive(expandedArchive === archive.id ? null : archive.id)}
      >
        {/* Employee */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              padding: "8px",
              background: "#FEF2F2",
              borderRadius: "8px",
              color: "#EF4444",
            }}
          >
            <User size={16} />
          </div>
          <div>
            <div
              style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}
            >
              {archive.name}
            </div>
            <div
              style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}
            >
              ID: #{archive.original_employee_id}
            </div>
          </div>
        </div>

        {/* Department */}
        <div>
          <div
            style={{ fontSize: "13px", color: "#374151", marginBottom: "4px" }}
          >
            {archive.department_name || "—"}
          </div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>
            {archive.designation || "No designation"}
          </div>
        </div>

        {/* Termination Date */}
        <div>
          <div style={{ fontSize: "13px", color: "#374151" }}>
            {archive.termination_date}
          </div>
        </div>

        {/* Type */}
        <div>
          <div
            style={{
              fontSize: "13px",
              color: archive.termination_type === "resignation" ? "#1E40AF" : "#991B1B",
              padding: "4px 8px",
              background: archive.termination_type === "resignation" ? "#DBEAFE" : "#FEE2E2",
              borderRadius: "6px",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            {archive.termination_type}
          </div>
        </div>

        {/* Status */}
        <div>
          <div
            style={{
              fontSize: "13px",
              color: isProcessComplete ? "#10B981" : "#EF4444",
              padding: "4px 8px",
              background: isProcessComplete ? "#F0FDF4" : "#FEF2F2",
              borderRadius: "6px",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            {isProcessComplete ? "Complete" : "Pending"}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {expandedArchive === archive.id && (
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
                    <strong>Department:</strong> {archive.department_name || "Not specified"}
                  </div>
                  <div>
                    <strong>Designation:</strong> {archive.designation || "Not specified"}
                  </div>
                  <div>
                    <strong>Company:</strong> {archive.company_name || "Not specified"}
                  </div>
                </div>
                <div>
                  <div>
                    <strong>Termination Type:</strong> {archive.termination_type || "Not specified"}
                  </div>
                  <div>
                    <strong>Termination Date:</strong> {archive.termination_date || "Not specified"}
                  </div>
                  <div>
                    <strong>Reason:</strong> {archive.reason_for_termination || "Not specified"}
                  </div>
                </div>
              </div>
              {/* Process Status */}
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "13px",
                  color: "#6B7280",
                }}
              >
                <strong>Exit Process:</strong>{" "}
                {archive.exit_interview_completed ? "✓ Interview" : "✗ Interview"},{" "}
                {archive.clearance_completed ? "✓ Clearance" : "✗ Clearance"},{" "}
                {archive.final_settlement_paid ? "✓ Settlement" : "✗ Settlement"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TerminatedEmployeeArchive;