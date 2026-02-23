import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserMinus,
  User,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  Hash,
  TrendingUp,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
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
  ShieldAlert,
  Building,
  Users,
  Mail,
  Phone,
  TrendingDown,
  AlertTriangle,
  Archive,
} from "lucide-react";
import Sidebars from "./sidebars";
import { getEmployees, deleteEmployee } from "../../api/employeeApi";

const EmployeeTermination = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [employeeToTerminate, setEmployeeToTerminate] = useState(null);
  const [formData, setFormData] = useState({
    reason: "",
    type: "termination",
    exit_interview_completed: false,
    clearance_completed: false,
    final_settlement_paid: false,
  });

  const navigate = useNavigate();

  /* ------------------------------------------------------------------ *
   *  1. Load saved state + fetch Employees
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const savedSearch = localStorage.getItem("employeeListSearchQuery") || "";
    setSearchQuery(savedSearch);

    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await getEmployees();
        const data = response.data || [];
        setEmployees(data);
        setFilteredEmployees(data);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError("Failed to load employee records. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  /* ------------------------------------------------------------------ *
   *  2. Filter and Sort Employees
   * ------------------------------------------------------------------ */
  useEffect(() => {
    let filtered = [...employees];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.employee_id?.toString().includes(searchQuery) ||
          emp.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.department_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          emp.company_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((emp) => {
        const empStatus = emp.status?.toLowerCase();
        const filterStatus = statusFilter.toLowerCase();
        return empStatus === filterStatus;
      });
    }

    // Apply department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter(
        (emp) => emp.department_name === departmentFilter,
      );
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
        case "designation":
          aValue = a.designation?.toLowerCase() || "";
          bValue = b.designation?.toLowerCase() || "";
          break;
        case "employee_id":
          aValue = a.employee_id || "";
          bValue = b.employee_id || "";
          break;
        case "status":
          aValue = a.status?.toLowerCase() || "";
          bValue = b.status?.toLowerCase() || "";
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

    setFilteredEmployees(filtered);
  }, [
    employees,
    searchQuery,
    statusFilter,
    departmentFilter,
    sortBy,
    sortOrder,
  ]);

  /* ------------------------------------------------------------------ *
   *  3. Save search state
   * ------------------------------------------------------------------ */
  useEffect(() => {
    localStorage.setItem("employeeListSearchQuery", searchQuery);
  }, [searchQuery]);

  const initiateTermination = (employee) => {
    setEmployeeToTerminate(employee);
    setFormData({
      reason: "",
      type: "termination",
      exit_interview_completed: false,
      clearance_completed: false,
      final_settlement_paid: false,
    });
    setShowTerminateModal(true);
  };

  // Handle actual termination
  const handleConfirmTermination = async () => {
    if (!employeeToTerminate) return;

    // Basic validation
    if (!formData.reason.trim()) {
      alert("Please provide a termination reason");
      return;
    }

    if (
      !window.confirm(
        `Really terminate ${employeeToTerminate.name}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    const terminationDetails = {
      reason: formData.reason.trim(),
      type: formData.type,
      terminated_by: "Current User", // ← replace with real user name if available
      exit_interview_completed: formData.exit_interview_completed,
      clearance_completed: formData.clearance_completed,
      final_settlement_paid: formData.final_settlement_paid,
    };

    try {
      // Use your API function (adjust employee_id or id field name as needed)
      await deleteEmployee(
        employeeToTerminate.employee_id || employeeToTerminate.id,
        terminationDetails,
      );

      // Remove from list
      setEmployees((prev) =>
        prev.filter(
          (emp) =>
            emp.employee_id !== employeeToTerminate.employee_id &&
            emp.id !== employeeToTerminate.id,
        ),
      );

      setShowTerminateModal(false);
      setEmployeeToTerminate(null);
      alert("Employee terminated and archived successfully!");
    } catch (err) {
      console.error("Termination failed:", err);
      alert("Failed to terminate employee. Please check console.");
    }
  };

  /* ------------------------------------------------------------------ *
   *  Handlers
   * ------------------------------------------------------------------ */
  const handleEdit = (id) => navigate(`/edit-employee/${id}`);
  const handleView = (id) => navigate(`/employee/${id}`);

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
      const response = await getEmployees();
      const data = response.data || [];
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (err) {
      console.error("Error refreshing employees:", err);
      setError("Failed to refresh employee records.");
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(
      (emp) => emp.status?.toLowerCase() === "active",
    ).length;
    const terminatedEmployees = employees.filter(
      (emp) => emp.status?.toLowerCase() === "terminated",
    ).length;
    const pendingEmployees = employees.filter(
      (emp) => emp.status?.toLowerCase() === "pending",
    ).length;
    const departments = [
      ...new Set(employees.map((emp) => emp.department_name).filter(Boolean)),
    ];
    const recentTerminations = employees.filter((emp) => {
      if (emp.status?.toLowerCase() === "terminated") {
        const terminationDate = new Date(
          emp.termination_date || emp.updated_at || Date.now(),
        );
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return terminationDate > weekAgo;
      }
      return false;
    }).length;

    return {
      totalEmployees,
      activeEmployees,
      terminatedEmployees,
      pendingEmployees,
      departments,
      recentTerminations,
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
                border: "3px solid rgba(239, 68, 68, 0.2)",
                borderTopColor: "#EF4444",
                borderRadius: "50%",
              }}
            ></div>
            <p
              style={{ marginTop: "16px", color: "#6B7280", fontSize: "14px" }}
            >
              Loading employee records...
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
                <UserMinus style={{ color: "white" }} size={28} />
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
                  Employee Termination
                </h2>
                <p
                  style={{
                    color: "#6B7280",
                    fontSize: "14px",
                    margin: 0,
                  }}
                >
                  Manage employee termination and separation processes
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
                    {stats.totalEmployees}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    Total Employees
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
                    {stats.activeEmployees}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    Active
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
                    {stats.pendingEmployees}
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
                  <UserMinus size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "16px",
                    }}
                  >
                    {stats.terminatedEmployees}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: "12px" }}>
                    Terminated
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
                  <TrendingDown size={16} />
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
                    Recent
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
                    placeholder="Search by name, ID, designation, or department..."
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
                    <option value="active">✅ Active</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="terminated">❌ Terminated</option>
                  </select>
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
                  <Building size={16} style={{ color: "#6B7280" }} />
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
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  >
                    <option value="all">🏢 All Departments</option>
                    {stats.departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
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

                {/* NEW ARCHIVE BUTTON */}
                <Link
                  to="/terminated-employee-archive"
                  style={{ textDecoration: "none" }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: "10px 16px",
                      background: "#F59E0B",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 14px rgba(245, 158, 11, 0.4)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#D97706";
                      e.currentTarget.style.boxShadow =
                        "0 6px 20px rgba(245, 158, 11, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#F59E0B";
                      e.currentTarget.style.boxShadow =
                        "0 4px 14px rgba(245, 158, 11, 0.4)";
                    }}
                  >
                    <Archive size={16} />
                    View Archive
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
              Found {filteredEmployees.length} employee(s) matching "
              {searchQuery}"
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

        {/* Employee Records Display Area with Scrollbar */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            minHeight: "0", // Important for flex child scrolling
          }}
        >
          {filteredEmployees.length === 0 ? (
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
                <UserMinus style={{ color: "#9CA3AF" }} size={32} />
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 8px 0",
                }}
              >
                No employee records found
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
                  : "Add your first employee to get started."}
              </p>
              <Link to="/add-employee" style={{ textDecoration: "none" }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: "12px 32px",
                    background:
                      "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(239, 68, 68, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 14px rgba(239, 68, 68, 0.4)";
                  }}
                >
                  Add First Employee
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
              {filteredEmployees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={handleEdit}
                  onTerminate={initiateTermination}
                  onView={handleView}
                  expandedEmployee={expandedEmployee}
                  setExpandedEmployee={setExpandedEmployee}
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
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
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
                <div>Designation</div>
                <div>Company</div>
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
                {filteredEmployees.map((employee, index) => (
                  <EmployeeListItem
                    key={employee.id}
                    employee={employee}
                    index={index}
                    onEdit={handleEdit}
                    onTerminate={initiateTermination}
                    onView={handleView}
                    expandedEmployee={expandedEmployee}
                    setExpandedEmployee={setExpandedEmployee}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {filteredEmployees.length > 0 && (
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
                Showing {filteredEmployees.length} employee records
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

      {/* Termination Modal */}
      <AnimatePresence>
        {showTerminateModal && employeeToTerminate && (
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
            onClick={() => setShowTerminateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "24px",
                maxWidth: "500px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    padding: "12px",
                    background: "#FEF2F2",
                    borderRadius: "12px",
                    color: "#EF4444",
                  }}
                >
                  <UserMinus size={24} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#111827",
                      margin: "0 0 4px 0",
                    }}
                  >
                    Terminate Employee
                  </h3>
                  <p style={{ color: "#6B7280", fontSize: "14px", margin: 0 }}>
                    Terminating: {employeeToTerminate.name}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  Reason for Termination *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Enter reason for termination..."
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    minHeight: "80px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  Termination Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                >
                  <option value="termination">Termination</option>
                  <option value="resignation">Resignation</option>
                  <option value="retirement">Retirement</option>
                  <option value="layoff">Layoff</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.exit_interview_completed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          exit_interview_completed: e.target.checked,
                        })
                      }
                    />
                    <span style={{ fontSize: "14px" }}>
                      Exit Interview Completed
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.clearance_completed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          clearance_completed: e.target.checked,
                        })
                      }
                    />
                    <span style={{ fontSize: "14px" }}>
                      Clearance Completed
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.final_settlement_paid}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          final_settlement_paid: e.target.checked,
                        })
                      }
                    />
                    <span style={{ fontSize: "14px" }}>
                      Final Settlement Paid
                    </span>
                  </label>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                  marginTop: "24px",
                }}
              >
                <button
                  onClick={() => {
                    setShowTerminateModal(false);
                    setEmployeeToTerminate(null);
                  }}
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
                  onClick={handleConfirmTermination}
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
                  Confirm Termination
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    padding: "12px",
                    background: "#FEF2F2",
                    borderRadius: "12px",
                    color: "#EF4444",
                  }}
                >
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#111827",
                      margin: "0 0 4px 0",
                    }}
                  >
                    Confirm Termination
                  </h3>
                  <p style={{ color: "#6B7280", fontSize: "14px", margin: 0 }}>
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <p
                style={{
                  color: "#6B7280",
                  fontSize: "14px",
                  marginBottom: "24px",
                  lineHeight: "1.6",
                }}
              >
                Are you sure you want to terminate this employee? This will
                permanently remove the employee record and all associated data
                from the system.
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
                  onClick={() => {
                    // This modal is no longer used - termination happens through the other modal
                    setShowDeleteConfirm(null);
                  }}
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

// Employee Card Component (Grid View)
const EmployeeCard = ({
  employee,
  onEdit,
  onTerminate,
  onView,
  expandedEmployee,
  setExpandedEmployee,
}) => {
  const getStatusConfig = (status) => {
    const configs = {
      active: {
        bg: "#10B981",
        light: "#D1FAE5",
        label: "✅ Active",
        icon: <CheckCircle size={12} />,
      },
      pending: {
        bg: "#F59E0B",
        light: "#FEF3C7",
        label: "⏳ Pending",
        icon: <Clock size={12} />,
      },
      terminated: {
        bg: "#EF4444",
        light: "#FEE2E2",
        label: "❌ Terminated",
        icon: <UserMinus size={12} />,
      },
    };
    return configs[employee.status?.toLowerCase()] || configs.active;
  };

  const status = getStatusConfig(employee.status);

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
        setExpandedEmployee(
          expandedEmployee === employee.id ? null : employee.id,
        )
      }
    >
      {/* Card Header */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #F3F4F6",
          background: expandedEmployee === employee.id ? "#F9FAFB" : "white",
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
                {employee.name || "Unknown Employee"}
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
                <span>ID: {employee.employee_id || "N/A"}</span>
                {employee.email && <span>• {employee.email}</span>}
              </div>
            </div>
          </div>
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
            <Briefcase size={14} style={{ color: status.bg, flexShrink: 0 }} />
            <span
              style={{
                color: "#6B7280",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {employee.designation || "N/A"}
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
            <Building size={14} style={{ color: status.bg, flexShrink: 0 }} />
            <span style={{ color: "#6B7280" }}>
              {employee.department_name || "N/A"}
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
            <Building size={14} style={{ color: status.bg, flexShrink: 0 }} />
            <span style={{ color: "#6B7280" }}>
              {employee.company_name || "N/A"}
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
              ID: {employee.employee_id || "N/A"}
            </div>
            <div>Employee ID</div>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onView(employee.id);
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
            <div>Profile</div>
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
              {employee.status || "Active"}
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
            onEdit(employee.id);
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
              onTerminate(employee);
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
              onView(employee.id);
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
        {expandedEmployee === employee.id && (
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
                  <strong>Email:</strong> {employee.email || "N/A"}
                </div>
                <div>
                  <strong>Phone:</strong> {employee.phone || "N/A"}
                </div>
                <div>
                  <strong>Designation:</strong> {employee.designation || "N/A"}
                </div>
                <div>
                  <strong>Department:</strong>{" "}
                  {employee.department_name || "N/A"}
                </div>
                <div>
                  <strong>Company:</strong> {employee.company_name || "N/A"}
                </div>
                {employee.joining_date && (
                  <div>
                    <strong>Joining Date:</strong>{" "}
                    {new Date(employee.joining_date).toLocaleDateString()}
                  </div>
                )}
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
                Employee ID: {employee.employee_id || "N/A"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Employee List Item Component (List View)
const EmployeeListItem = ({
  employee,
  index,
  onEdit,
  onTerminate,
  onView,
  expandedEmployee,
  setExpandedEmployee,
}) => {
  const navigate = useNavigate(); // Add this line to get navigate function

  const getStatusConfig = (status) => {
    const configs = {
      active: { bg: "#10B981", light: "#D1FAE5", label: "Active" },
      pending: { bg: "#F59E0B", light: "#FEF3C7", label: "Pending" },
      terminated: { bg: "#EF4444", light: "#FEE2E2", label: "Terminated" },
    };
    return configs[employee.status?.toLowerCase()] || configs.active;
  };

  const status = getStatusConfig(employee.status);

  return (
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
        style={{ flex: 2, display: "flex", alignItems: "center", gap: "12px" }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: status.bg,
            color: status.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "600",
            fontSize: "16px",
          }}
        >
          {employee.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <div
            style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}
          >
            {employee.name || "Unknown Employee"}
          </div>
          {employee.employee_id && (
            <div
              style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}
            >
              ID: {employee.employee_id}
            </div>
          )}
        </div>
      </div>

      {/* Department Column */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "14px",
            color: "#374151",
            padding: "6px 12px",
            background: "#F3F4F6",
            borderRadius: "6px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Building size={12} />
          {employee.department_name || "N/A"}
        </div>
      </div>

      {/* Designation Column */}
      <div
        style={{
          flex: 1,
          fontSize: "14px",
          color: "#374151",
          fontWeight: "500",
        }}
      >
        {employee.designation || "N/A"}
      </div>

      {/* Company Column */}
      <div style={{ flex: 1, fontSize: "14px", color: "#374151" }}>
        {employee.company_name || "N/A"}
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
            color: status.color,
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
            onView(employee.id);
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
            navigate(`/attachments/${employee.id}`);
          }}
          style={{
            padding: "8px 12px",
            background: "#F3F4F6",
            border: "none",
            borderRadius: "6px",
            color: "#6B7280",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#E5E7EB")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#F3F4F6")}
        >
          <FileText size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTerminate(employee);
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
  );
};

export default EmployeeTermination;
