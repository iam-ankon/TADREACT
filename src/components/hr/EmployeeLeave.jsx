import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebars from "./sidebars";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  RefreshCw,
  User,
  Calendar,
  Hash,
  TrendingUp,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Grid,
  List,
  PieChart,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getEmployeeLeaves, deleteEmployeeLeave } from "../../api/employeeApi";

const EmployeeLeave = () => {
  const [allLeaves, setAllLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLeave, setExpandedLeave] = useState(null);
  const [sortBy, setSortBy] = useState("status_priority");
  const [sortOrder, setSortOrder] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Pagination states - 100 items per page
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100); // Fixed at 100
  const [paginatedLeaves, setPaginatedLeaves] = useState([]);

  const navigate = useNavigate();

  // Sort function: Pending first, then by start_date (newest first)
  const sortLeaves = (leavesArray) => {
    const statusOrder = { pending: 0, approved: 1, rejected: 2 };
    
    return [...leavesArray].sort((a, b) => {
      const statusA = (a.status || "").toLowerCase();
      const statusB = (b.status || "").toLowerCase();
      
      // First sort by status priority (pending first)
      const statusDiff = (statusOrder[statusA] ?? 3) - (statusOrder[statusB] ?? 3);
      if (statusDiff !== 0) return statusDiff;
      
      // Then sort by start_date (newest first)
      const dateA = new Date(a.start_date || 0);
      const dateB = new Date(b.start_date || 0);
      return dateB - dateA;
    });
  };

  // Function to fetch ALL leaves from backend
  const fetchAllLeaves = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📥 Fetching ALL leaves...");

      // Fetch all leaves with a large page size to get all records
      const response = await getEmployeeLeaves(1, 10000, {
        allPages: true, // This tells the API to fetch all pages
      });

      console.log("📊 API Response:", response);

      let leavesData = [];

      // Handle different response formats
      if (response.data && Array.isArray(response.data)) {
        leavesData = response.data;
      } else if (response.data && response.data.results) {
        leavesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        leavesData = response.data;
      } else if (response.data && response.data.data) {
        leavesData = response.data.data;
      }

      console.log(`✅ Loaded ${leavesData.length} total leaves`);

      // Remove duplicates by ID
      const uniqueLeaves = [];
      const seenIds = new Set();
      for (const leave of leavesData) {
        if (leave && leave.id && !seenIds.has(leave.id)) {
          seenIds.add(leave.id);
          uniqueLeaves.push(leave);
        }
      }

      // Sort: Pending first, then by date (newest first)
      const sortedLeaves = sortLeaves(uniqueLeaves);

      console.log(`✅ Sorted ${sortedLeaves.length} leaves with pending on top`);

      setAllLeaves(sortedLeaves);
      setFilteredLeaves(sortedLeaves);

      if (sortedLeaves.length === 0) {
        setError("No leave records found.");
      }
    } catch (err) {
      console.error("Error fetching leaves:", err);
      setError("Failed to load leave records. Please try again.");
      setAllLeaves([]);
      setFilteredLeaves([]);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  /* ------------------------------------------------------------------ *
   *  1. Load saved state + fetch ALL Leaves
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const savedSearch = localStorage.getItem("leaveListSearchQuery") || "";
    const savedStatus = localStorage.getItem("leaveListStatusFilter") || "all";
    const savedPage = parseInt(localStorage.getItem("leaveListPage") || "1");

    setSearchQuery(savedSearch);
    setStatusFilter(savedStatus);
    setCurrentPage(savedPage);

    fetchAllLeaves();
  }, []);

  /* ------------------------------------------------------------------ *
   *  2. Filter and Sort Leaves (client-side)
   * ------------------------------------------------------------------ */
  useEffect(() => {
    let filtered = [...allLeaves];

    // Apply status filter
    if (statusFilter !== "all") {
      const filterStatus = statusFilter.toLowerCase();
      filtered = filtered.filter(
        (leave) => (leave.status || "").toLowerCase() === filterStatus
      );
    }

    // Apply search filter
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (leave) =>
          (leave.employee_name || leave.employee?.name || "")
            .toLowerCase()
            .includes(query) ||
          (leave.leave_type || "").toLowerCase().includes(query) ||
          (leave.employee_code || leave.employee?.employee_id || "")
            .toLowerCase()
            .includes(query) ||
          (leave.reason || "").toLowerCase().includes(query)
      );
    }

    // Always sort: Pending first, then by date (newest first)
    filtered = sortLeaves(filtered);

    setFilteredLeaves(filtered);
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [allLeaves, searchQuery, statusFilter]);

  /* ------------------------------------------------------------------ *
   *  3. Handle Pagination
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedLeaves(filteredLeaves.slice(startIndex, endIndex));
  }, [filteredLeaves, currentPage, itemsPerPage]);

  /* ------------------------------------------------------------------ *
   *  4. Save state to localStorage
   * ------------------------------------------------------------------ */
  useEffect(() => {
    localStorage.setItem("leaveListSearchQuery", searchQuery);
    localStorage.setItem("leaveListStatusFilter", statusFilter);
    localStorage.setItem("leaveListPage", currentPage.toString());
  }, [searchQuery, statusFilter, currentPage]);

  /* ------------------------------------------------------------------ *
   *  Handlers
   * ------------------------------------------------------------------ */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave record?"))
      return;
    try {
      await deleteEmployeeLeave(id);
      // Remove from state
      const updatedLeaves = allLeaves.filter((leave) => leave.id !== id);
      const sortedLeaves = sortLeaves(updatedLeaves);
      setAllLeaves(sortedLeaves);
      setFilteredLeaves(sortedLeaves);
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

  const refreshData = async () => {
    await fetchAllLeaves();
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
  };

  // Pagination handlers
  const goToPage = (page) => {
    if (page !== currentPage) {
      setCurrentPage(page);
      const tableElement = document.querySelector('.table-container');
      if (tableElement) {
        tableElement.scrollTop = 0;
      }
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const getStats = () => {
    const totalLeaves = filteredLeaves.length;
    const approvedLeaves = filteredLeaves.filter(
      (leave) => (leave.status || "").toLowerCase() === "approved",
    ).length;
    const pendingLeaves = filteredLeaves.filter(
      (leave) => (leave.status || "").toLowerCase() === "pending",
    ).length;
    const rejectedLeaves = filteredLeaves.filter(
      (leave) => (leave.status || "").toLowerCase() === "rejected",
    ).length;
    const totalDays = filteredLeaves.reduce(
      (sum, leave) => sum + (leave.leave_days || 0),
      0,
    );

    return {
      totalLeaves,
      approvedLeaves,
      pendingLeaves,
      rejectedLeaves,
      totalDays,
    };
  };

  const stats = getStats();
  const totalItems = filteredLeaves.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Loading state
  if (loading && isInitialLoad) {
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
          margin: "0 auto",
          maxWidth: "1550px",
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
                    minWidth: "140px",
                  }}
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
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                  >
                    <option value="all">📋 All Status</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="approved">✅ Approved</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>

                <button
                  onClick={refreshData}
                  style={{
                    padding: "10px 14px",
                    background: "white",
                    border: "1px solid rgba(209, 213, 219, 0.8)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6B7280",
                    transition: "all 0.2s ease",
                  }}
                  title="Refresh data"
                >
                  <RefreshCw size={18} />
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
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginRight: "8px",
                    borderRight: "1px solid rgba(209, 213, 219, 0.3)",
                    paddingRight: "16px",
                  }}
                >
                  <Link
                    to="/employee_leave_balance"
                    style={{ textDecoration: "none" }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        padding: "10px 16px",
                        background:
                          "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <PieChart size={16} />
                      Leave Balances
                    </motion.button>
                  </Link>

                  <Link
                    to="/employee_leave_type"
                    style={{ textDecoration: "none" }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        padding: "10px 16px",
                        background:
                          "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Settings size={16} />
                      Leave Types
                    </motion.button>
                  </Link>
                </div>

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
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <List size={14} />
                    List
                  </button>
                </div>

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

        {/* Leave Records Display Area */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            minHeight: "0",
          }}
        >
          {filteredLeaves.length === 0 && !loading ? (
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
              }}
            >
              {paginatedLeaves.map((leave) => (
                <LeaveCard
                  key={leave.id}
                  leave={leave}
                  onEdit={handleEdit}
                  onDelete={setShowDeleteConfirm}
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

              <div
                className="table-container"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  maxHeight: "calc(100vh - 380px)",
                }}
              >
                {paginatedLeaves.map((leave, index) => (
                  <LeaveListItem
                    key={leave.id}
                    leave={leave}
                    index={index}
                    onEdit={handleEdit}
                    onDelete={setShowDeleteConfirm}
                    onView={handleView}
                    expandedLeave={expandedLeave}
                    setExpandedLeave={setExpandedLeave}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination Controls - 100 per page */}
        {filteredLeaves.length > 0 && (
          <div
            style={{
              marginTop: "6px",
              marginBottom: "-1px",
              padding: "10px 16px",
              background: "white",
              borderRadius: "12px",
              border: "1px solid rgba(229, 231, 235, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "14px", color: "#6B7280" }}>
              Showing{" "}
              <span style={{ fontWeight: "600", color: "#111827" }}>
                {startIndex}
              </span>{" "}
              to{" "}
              <span style={{ fontWeight: "600", color: "#111827" }}>
                {endIndex}
              </span>{" "}
              of{" "}
              <span style={{ fontWeight: "600", color: "#111827" }}>
                {totalItems}
              </span>{" "}
              results
              <span style={{ marginLeft: "12px", color: "#9CA3AF", fontSize: "12px" }}>
                (100 per page)
              </span>
            </div>

            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 12px",
                  background: currentPage === 1 ? "#F3F4F6" : "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  color: currentPage === 1 ? "#9CA3AF" : "#374151",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <div style={{ display: "flex", gap: "4px" }}>
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
                      onClick={() => goToPage(pageNum)}
                      style={{
                        padding: "8px 12px",
                        minWidth: "40px",
                        background:
                          currentPage === pageNum ? "#3B82F6" : "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        color: currentPage === pageNum ? "white" : "#374151",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: currentPage === pageNum ? "600" : "400",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                style={{
                  padding: "8px 12px",
                  background: currentPage === totalPages || totalPages === 0 ? "#F3F4F6" : "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  color: currentPage === totalPages || totalPages === 0 ? "#9CA3AF" : "#374151",
                  cursor: currentPage === totalPages || totalPages === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
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

      <style>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
        * { scrollbar-width: thin; scrollbar-color: #c1c1c1 #f1f1f1; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .table-container::-webkit-scrollbar { width: 8px; height: 8px; }
        .table-container::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .table-container::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        .table-container::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
      `}</style>
    </div>
  );
};

// Leave Card Component (unchanged - kept for brevity)
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
      approved: { bg: "#10B981", light: "#D1FAE5", label: "✅ Approved" },
      pending: { bg: "#F59E0B", light: "#FEF3C7", label: "⏳ Pending" },
      rejected: { bg: "#EF4444", light: "#FEE2E2", label: "❌ Rejected" },
    };
    return configs[(status || "").toLowerCase()] || configs.pending;
  };

  const status = getStatusConfig(leave.status);
  const employeeName =
    leave.employee_name || leave.employee?.name || "Unknown Employee";
  const leaveType = leave.leave_type?.replace(/_/g, " ") || "N/A";

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
                {employeeName}
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
              {leaveType}
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
              borderRadius: "8px",
              fontSize: "11px",
              color: "#8B5CF6",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
            }}
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
            <div style={{ fontSize: "11px", color: "#6B7280" }}>
              {leave.status || "Pending"}
            </div>
          </div>
        </div>
      </div>

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
          }}
        >
          <Edit size={14} /> Edit
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
            }}
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
            }}
          >
            <Eye size={14} />
          </button>
        </div>
      </div>

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
                <Eye size={14} /> Quick Details
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
                  <strong>Employee Code:</strong>{" "}
                  {leave.employee_code || leave.employee?.employee_id || "N/A"}
                </div>
                <div>
                  <strong>Leave Type:</strong> {leaveType}
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
                <Hash size={12} /> Leave ID: #{leave.id}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Leave List Item Component (unchanged - kept for brevity)
const LeaveListItem = ({ leave, index, onEdit, onDelete, onView }) => {
  const getStatusConfig = (status) => {
    const configs = {
      approved: { bg: "#10B981", light: "#D1FAE5", label: "Approved" },
      pending: { bg: "#F59E0B", light: "#FEF3C7", label: "Pending" },
      rejected: { bg: "#EF4444", light: "#FEE2E2", label: "Rejected" },
    };
    return configs[(status || "").toLowerCase()] || configs.pending;
  };

  const status = getStatusConfig(leave.status);
  const employeeName =
    leave.employee_name || leave.employee?.name || "Unknown Employee";
  const leaveType = leave.leave_type?.replace(/_/g, " ") || "N/A";

  return (
    <div
      style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        borderBottom: "1px solid #F3F4F6",
        background: index % 2 === 0 ? "white" : "#F9FAFB",
      }}
    >
      <div
        style={{ flex: 2, display: "flex", alignItems: "center", gap: "12px" }}
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
          {employeeName.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <div
            style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}
          >
            {employeeName}
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
          {leaveType}
        </div>
      </div>

      <div style={{ flex: 1, fontSize: "14px", color: "#374151" }}>
        {new Date(leave.start_date).toLocaleDateString()} -{" "}
        {new Date(leave.end_date).toLocaleDateString()}
      </div>

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

      <div style={{ flex: 1, display: "flex", gap: "8px" }}>
        <button
          onClick={() => onView(leave.id)}
          style={{
            padding: "8px 12px",
            background: "#EFF6FF",
            border: "none",
            borderRadius: "6px",
            color: "#3B82F6",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Eye size={14} />
        </button>
        <button
          onClick={() => onEdit(leave.id)}
          style={{
            padding: "8px 12px",
            background: "#FEF3C7",
            border: "none",
            borderRadius: "6px",
            color: "#D97706",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Edit size={14} />
        </button>
        <button
          onClick={() => onDelete(leave.id)}
          style={{
            padding: "8px 12px",
            background: "#FEE2E2",
            border: "none",
            borderRadius: "6px",
            color: "#EF4444",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default EmployeeLeave;