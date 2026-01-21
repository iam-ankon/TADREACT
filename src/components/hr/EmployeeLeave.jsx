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
  Clock,
  XCircle,
  Grid,
  List,
  PieChart,
  Settings,
} from "lucide-react";
import { getEmployeeLeaves, deleteEmployeeLeave } from "../../api/employeeApi";

const EmployeeLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLeave, setExpandedLeave] = useState(null);
  const [sortBy, setSortBy] = useState("start_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const navigate = useNavigate();

  /* ------------------------------------------------------------------ *
   *  1. Load saved state + fetch Leaves
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const savedSearch = localStorage.getItem("leaveListSearchQuery") || "";
    setSearchQuery(savedSearch);

    const fetchLeaves = async () => {
      try {
        setLoading(true);
        const response = await getEmployeeLeaves();
        const data = response.data;
        setLeaves(data);
        setFilteredLeaves(data);
      } catch (err) {
        console.error("Error fetching leaves:", err);
        setError("Failed to load leave records. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  /* ------------------------------------------------------------------ *
   *  2. Filter and Sort Leaves
   * ------------------------------------------------------------------ */
  useEffect(() => {
    let filtered = [...leaves];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (leave) =>
          leave.employee_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          leave.leave_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          leave.employee_code
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          leave.reason?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((leave) => {
        const leaveStatus = leave.status?.toLowerCase();
        const filterStatus = statusFilter.toLowerCase();
        return leaveStatus === filterStatus;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "employee_name":
          aValue = a.employee_name?.toLowerCase() || "";
          bValue = b.employee_name?.toLowerCase() || "";
          break;
        case "leave_type":
          aValue = a.leave_type?.toLowerCase() || "";
          bValue = b.leave_type?.toLowerCase() || "";
          break;
        case "start_date":
          aValue = new Date(a.start_date || Date.now());
          bValue = new Date(b.start_date || Date.now());
          break;
        case "end_date":
          aValue = new Date(a.end_date || Date.now());
          bValue = new Date(b.end_date || Date.now());
          break;
        case "leave_days":
          aValue = a.leave_days || 0;
          bValue = b.leave_days || 0;
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

    setFilteredLeaves(filtered);
  }, [leaves, searchQuery, statusFilter, sortBy, sortOrder]);

  /* ------------------------------------------------------------------ *
   *  3. Save search state
   * ------------------------------------------------------------------ */
  useEffect(() => {
    localStorage.setItem("leaveListSearchQuery", searchQuery);
  }, [searchQuery]);

  /* ------------------------------------------------------------------ *
   *  Handlers
   * ------------------------------------------------------------------ */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave record?"))
      return;
    try {
      await deleteEmployeeLeave(id);
      setLeaves((prev) => prev.filter((leave) => leave.id !== id));
      setShowDeleteConfirm(null);
    } catch (e) {
      console.error("Delete error:", e);
      alert("Failed to delete leave record. Please try again.");
    }
  };

  const handleEdit = (id) => navigate(`/edit-leave-request/${id}`);
  const handleView = (id) => navigate(`/leave-request-details/${id}`);

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
      const response = await getEmployeeLeaves();
      const data = response.data;
      setLeaves(data);
      setFilteredLeaves(data);
    } catch (err) {
      console.error("Error refreshing leaves:", err);
      setError("Failed to refresh leave records.");
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const totalLeaves = leaves.length;
    const approvedLeaves = leaves.filter(
      (leave) => leave.status?.toLowerCase() === "approved",
    ).length;
    const pendingLeaves = leaves.filter(
      (leave) => leave.status?.toLowerCase() === "pending",
    ).length;
    const rejectedLeaves = leaves.filter(
      (leave) => leave.status?.toLowerCase() === "rejected",
    ).length;
    const totalDays = leaves.reduce(
      (sum, leave) => sum + (leave.leave_days || 0),
      0,
    );
    const recentLeaves = leaves.filter((leave) => {
      const leaveDate = new Date(
        leave.created_at || leave.start_date || Date.now(),
      );
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return leaveDate > weekAgo;
    }).length;

    return {
      totalLeaves,
      approvedLeaves,
      pendingLeaves,
      rejectedLeaves,
      totalDays,
      recentLeaves,
    };
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
              Loading leave records...
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
                    "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                  borderRadius: "16px",
                  boxShadow: "0 4px 20px rgba(59, 130, 246, 0.3)",
                }}
              >
                <Calendar style={{ color: "white" }} size={28} />
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
                  Leave Management
                </h2>
                <p
                  style={{
                    color: "#6B7280",
                    fontSize: "14px",
                    margin: 0,
                  }}
                >
                  Track and manage all employee leave requests in one place
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
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: "10px",
                  fontSize: "14px",
                  minWidth: "150px",
                }}
              >
                <div style={{ color: "#3B82F6" }}>
                  <Hash size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    {stats.totalLeaves}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    Total Leaves
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
                    {stats.approvedLeaves}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    Approved
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
                    {stats.pendingLeaves}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    Pending
                  </div>
                </div>
              </div>
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
                  <XCircle size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    {stats.rejectedLeaves}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    Rejected
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
                    {stats.totalDays}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    Total Days
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
                    placeholder="Search by employee name, leave type, or reason..."
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
                      e.target.style.borderColor = "#3B82F6";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(59, 130, 246, 0.1)";
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
                    <option value="approved">✅ Approved</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>

                {/* Sort Button */}
                <button
                  onClick={() => toggleSort("start_date")}
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
                {/* Leave Management Navigation Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginRight: "8px",
                    borderRight: "1px solid rgba(209, 213, 219, 0.3)",
                    paddingRight: "16px",
                  }}
                >
                  <Link to="/employee_leave_balance" style={{ textDecoration: "none" }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        padding: "10px 16px",
                        background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(139, 92, 246, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(139, 92, 246, 0.3)";
                      }}
                    >
                      <PieChart size={16} />
                      Leave Balances
                    </motion.button>
                  </Link>

                  <Link to="/employee_leave_type" style={{ textDecoration: "none" }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        padding: "10px 16px",
                        background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, #059669 0%, #047857 100%)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(16, 185, 129, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, #10B981 0%, #059669 100%)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(16, 185, 129, 0.3)";
                      }}
                    >
                      <Settings size={16} />
                      Leave Types
                    </motion.button>
                  </Link>
                </div>

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
                      color: viewMode === "grid" ? "#3B82F6" : "#6B7280",
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
                    <Grid size={14} />
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
                      color: viewMode === "list" ? "#3B82F6" : "#6B7280",
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
                    <List size={14} />
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

                <Link
                  to="/add-leave-request"
                  style={{ textDecoration: "none" }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: "12px 24px",
                      background:
                        "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
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
                      boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)";
                      e.currentTarget.style.boxShadow =
                        "0 6px 20px rgba(59, 130, 246, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 14px rgba(59, 130, 246, 0.4)";
                    }}
                  >
                    <Plus size={18} />
                    New Leave
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
              backgroundColor: "#EFF6FF",
              padding: "12px 20px",
              borderRadius: "10px",
              marginBottom: "20px",
              border: "1px solid #BFDBFE",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px",
              fontWeight: "500",
              flexShrink: 0,
            }}
          >
            <span>
              Found {filteredLeaves.length} leave record(s) matching "
              {searchQuery}"
            </span>
            <button
              onClick={clearSearch}
              style={{
                backgroundColor: "#3B82F6",
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

        {/* Leave Records Display Area with Scrollbar */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            minHeight: "0", // Important for flex child scrolling
          }}
        >
          {filteredLeaves.length === 0 ? (
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
                <Calendar style={{ color: "#9CA3AF" }} size={32} />
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 8px 0",
                }}
              >
                No leave records found
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
                  : "Add your first leave request to get started."}
              </p>
              <Link to="/add-leave-request" style={{ textDecoration: "none" }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: "12px 32px",
                    background:
                      "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(59, 130, 246, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 14px rgba(59, 130, 246, 0.4)";
                  }}
                >
                  Add First Leave Request
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
              {filteredLeaves.map((leave) => (
                <LeaveCard
                  key={leave.id}
                  leave={leave}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  expandedLeave={expandedLeave}
                  setExpandedLeave={setExpandedLeave}
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
                  gridTemplateColumns: "2fr 1fr 0.9fr 1.1fr 1.1fr 0.8fr",
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
                <div>Leave Type</div>
                <div>Date Range</div>
                <div>Duration</div>
                <div>Status</div>
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
                {filteredLeaves.map((leave, index) => (
                  <LeaveListItem
                    key={leave.id}
                    leave={leave}
                    index={index}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    expandedLeave={expandedLeave}
                    setExpandedLeave={setExpandedLeave}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {filteredLeaves.length > 0 && (
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
                Showing {filteredLeaves.length} leave records
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "16px",
            }}
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "24px",
                maxWidth: "400px",
                width: "100%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: "8px",
                }}
              >
                Confirm Deletion
              </h3>
              <p
                style={{
                  color: "#6B7280",
                  fontSize: "14px",
                  marginBottom: "24px",
                }}
              >
                Are you sure you want to delete this leave record? This action
                cannot be undone.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  style={{
                    padding: "10px 20px",
                    background: "white",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  style={{
                    padding: "10px 20px",
                    background: "#EF4444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

// Leave Card Component (Grid View)
const LeaveCard = ({
  leave,
  onEdit,
  onDelete,
  onView,
  expandedLeave,
  setExpandedLeave,
}) => {
  const getStatusConfig = (status) => {
    const configs = {
      approved: {
        bg: "#10B981",
        light: "#D1FAE5",
        label: "✅ Approved",
        icon: <CheckCircle size={12} />,
      },
      pending: {
        bg: "#F59E0B",
        light: "#FEF3C7",
        label: "⏳ Pending",
        icon: <Clock size={12} />,
      },
      rejected: {
        bg: "#EF4444",
        light: "#FEE2E2",
        label: "❌ Rejected",
        icon: <XCircle size={12} />,
      },
    };
    return configs[leave.status?.toLowerCase()] || configs.pending;
  };

  const status = getStatusConfig(leave.status);

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
      onClick={() =>
        setExpandedLeave(expandedLeave === leave.id ? null : leave.id)
      }
    >
      {/* Card Header */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #F3F4F6",
          background: expandedLeave === leave.id ? "#F9FAFB" : "white",
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
                background: status.light,
                borderRadius: "12px",
                color: status.bg,
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
                {leave.employee_name || "Unknown Employee"}
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
                <span>ID: #{leave.id}</span>
                {leave.employee_code && <span>• {leave.employee_code}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Leave Info */}
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
            <Calendar size={14} style={{ color: status.bg, flexShrink: 0 }} />
            <span
              style={{
                color: "#6B7280",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {leave.leave_type?.replace(/_/g, " ") || "N/A"}
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
            <Clock size={14} style={{ color: status.bg, flexShrink: 0 }} />
            <span style={{ color: "#6B7280" }}>
              {leave.leave_days || 0} day{leave.leave_days !== 1 ? "s" : ""}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
            }}
          >
            <Calendar size={14} style={{ color: status.bg, flexShrink: 0 }} />
            <span style={{ color: "#6B7280" }}>
              {new Date(leave.start_date).toLocaleDateString()} -{" "}
              {new Date(leave.end_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
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
              background: "#F0F9FF",
              borderRadius: "8px",
              fontSize: "11px",
              color: "#0EA5E9",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              {leave.leave_days || 0}
            </div>
            <div>Days</div>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onView(leave.id);
            }}
            style={{
              textAlign: "center",
              padding: "10px",
              background: "#F5F3FF",
              border: "none",
              borderRadius: "8px",
              fontSize: "11px",
              color: "#8B5CF6",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
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
              View
            </div>
            <div>Details</div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "10px",
              background: status.light,
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: status.bg,
                marginBottom: "4px",
              }}
            >
              {status.label.split(" ")[0]}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#6B7280",
              }}
            >
              {leave.status || "Pending"}
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
            onEdit(leave.id);
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
              onDelete(leave.id);
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
            onClick={(e) => {
              e.stopPropagation();
              onView(leave.id);
            }}
            style={{
              padding: "8px",
              background: "#EFF6FF",
              border: "none",
              borderRadius: "8px",
              color: "#3B82F6",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#DBEAFE")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#EFF6FF")}
          >
            <Eye size={14} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expandedLeave === leave.id && (
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
                  <strong>Employee Code:</strong> {leave.employee_code || "N/A"}
                </div>
                <div>
                  <strong>Leave Type:</strong> {leave.leave_type || "N/A"}
                </div>
                <div>
                  <strong>Reason:</strong>{" "}
                  {leave.reason || "No reason provided"}
                </div>
                <div>
                  <strong>Date Range:</strong>{" "}
                  {new Date(leave.start_date).toLocaleDateString()} -{" "}
                  {new Date(leave.end_date).toLocaleDateString()}
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
                <Hash size={12} />
                Leave ID: #{leave.id}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Leave List Item Component (List View)
const LeaveListItem = ({
  leave,
  index,
  onEdit,
  onDelete,
  onView,
  expandedLeave,
  setExpandedLeave,
}) => {
  const getStatusConfig = (status) => {
    const configs = {
      approved: { bg: "#10B981", light: "#D1FAE5", label: "Approved" },
      pending: { bg: "#F59E0B", light: "#FEF3C7", label: "Pending" },
      rejected: { bg: "#EF4444", light: "#FEE2E2", label: "Rejected" },
    };
    return configs[leave.status?.toLowerCase()] || configs.pending;
  };

  const status = getStatusConfig(leave.status);

  return (
    <>
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          borderBottom: "1px solid #F3F4F6",
          background: index % 2 === 0 ? "white" : "#F9FAFB",
          transition: "background 0.2s ease",
        }}
      >
        {/* Employee Column */}
        <div
          style={{
            flex: 2,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: status.light,
              color: status.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            {leave.employee_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <div
              style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}
            >
              {leave.employee_name || "Unknown Employee"}
            </div>
            {leave.employee_code && (
              <div
                style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}
              >
                ID: {leave.employee_code}
              </div>
            )}
          </div>
        </div>

        {/* Leave Type Column */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "14px",
              color: "#374151",
              padding: "6px 12px",
              background: "#F3F4F6",
              borderRadius: "6px",
              display: "inline-block",
            }}
          >
            {leave.leave_type?.replace(/_/g, " ") || "N/A"}
          </div>
        </div>

        {/* Date Range Column */}
        <div style={{ flex: 1, fontSize: "14px", color: "#374151" }}>
          {new Date(leave.start_date).toLocaleDateString()} -{" "}
          {new Date(leave.end_date).toLocaleDateString()}
        </div>

        {/* Duration Column */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#111827",
              padding: "6px 12px",
              background: "#DBEAFE",
              borderRadius: "6px",
              display: "inline-block",
            }}
          >
            {leave.leave_days || 0} day{leave.leave_days !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Status Column */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background: status.bg,
              color: "white",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            {status.label}
          </div>
        </div>

        {/* Actions Column */}
        <div style={{ flex: 1, display: "flex", gap: "8px" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(leave.id); // ✅ Add leave.id
            }}
            style={{
              padding: "8px 12px",
              background: "#EFF6FF",
              border: "none",
              borderRadius: "6px",
              color: "#3B82F6",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#DBEAFE")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#EFF6FF")}
          >
            <Eye size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(leave.id); // ✅ Add leave.id
            }}
            style={{
              padding: "8px 12px",
              background: "#FEF3C7",
              border: "none",
              borderRadius: "6px",
              color: "#D97706",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FDE68A")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF3C7")}
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(leave.id); // ✅ Add leave.id
            }}
            style={{
              padding: "8px 12px",
              background: "#FEE2E2",
              border: "none",
              borderRadius: "6px",
              color: "#EF4444",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FECACA")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FEE2E2")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </>
  );
};

export default EmployeeLeave;