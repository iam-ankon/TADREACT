// src/components/stationery/StationeryUsage.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  User,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  Download,
  Eye,
  MoreVertical,
  TrendingUp,
  BarChart3,
  Users,
  FileText,
} from "lucide-react";
import stationeryAPI from "../../api/stationery";

const StationeryUsage = () => {
  const [usage, setUsage] = useState([]);
  const [filteredUsage, setFilteredUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'

  const [formData, setFormData] = useState({
    employee: "",
    stationery_item: "",
    quantity: 1,
    purpose: "",
    remarks: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usageData, itemsData, employeesData] = await Promise.all([
        stationeryAPI.fetchUsage(),
        stationeryAPI.fetchItems(),
        stationeryAPI.fetchEmployees(),
      ]);

      setUsage(usageData);
      setFilteredUsage(usageData);
      setItems(itemsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...usage];

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.employee?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.stationery_item?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsage(filtered);
  }, [usage, statusFilter, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await stationeryAPI.addUsage(formData);
      setShowForm(false);
      setFormData({
        employee: "",
        stationery_item: "",
        quantity: 1,
        purpose: "",
        remarks: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error adding usage request:", error);
    }
  };

  const handleApprove = async (usageId) => {
    try {
      await stationeryAPI.approveUsage(usageId);
      fetchData();
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleReject = async (usageId) => {
    try {
      await stationeryAPI.rejectUsage(usageId);
      fetchData();
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const handleIssue = async (usageId) => {
    try {
      await stationeryAPI.issueUsage(usageId);
      fetchData();
    } catch (error) {
      console.error("Error issuing item:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} />;
      case "pending":
        return <Clock size={16} />;
      case "rejected":
        return <XCircle size={16} />;
      case "issued":
        return <Check size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: { bg: "#10B981", text: "#047857", light: "#D1FAE5" },
      pending: { bg: "#F59E0B", text: "#B45309", light: "#FEF3C7" },
      rejected: { bg: "#EF4444", text: "#B91C1C", light: "#FEE2E2" },
      issued: { bg: "#3B82F6", text: "#1D4ED8", light: "#DBEAFE" },
    };
    return (
      colors[status] || { bg: "#6B7280", text: "#374151", light: "#F3F4F6" }
    );
  };

  const getStats = () => {
    return {
      pending: usage.filter((u) => u.status === "pending").length,
      approved: usage.filter((u) => u.status === "approved").length,
      issued: usage.filter((u) => u.status === "issued").length,
      rejected: usage.filter((u) => u.status === "rejected").length,
      total: usage.length,
    };
  };

  if (loading) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
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
        <p style={{ marginTop: "16px", color: "#6B7280" }}>
          Loading usage records...
        </p>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div style={{ padding: "24px" }}>
      {/* Modern Header */}
      <div style={{ marginBottom: "32px" }}>
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
                background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
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
                Usage Management
              </h2>
              <p
                style={{
                  color: "#6B7280",
                  fontSize: "14px",
                  margin: 0,
                }}
              >
                Track and manage stationery requests and distributions
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 20px",
                background: "#F0F9FF",
                border: "1px solid #BAE6FD",
                borderRadius: "12px",
                flex: "1",
                minWidth: "180px",
              }}
            >
              <div
                style={{
                  padding: "10px",
                  background: "#E0F2FE",
                  borderRadius: "10px",
                  color: "#0369A1",
                }}
              >
                <Users size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#0C4A6E",
                    fontWeight: "600",
                  }}
                >
                  TOTAL REQUESTS
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#075985",
                  }}
                >
                  {stats.total}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 20px",
                background: "#FEF3C7",
                border: "1px solid #FDE68A",
                borderRadius: "12px",
                flex: "1",
                minWidth: "180px",
              }}
            >
              <div
                style={{
                  padding: "10px",
                  background: "#FEF3C7",
                  borderRadius: "10px",
                  color: "#B45309",
                }}
              >
                <Clock size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#92400E",
                    fontWeight: "600",
                  }}
                >
                  PENDING
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#B45309",
                  }}
                >
                  {stats.pending}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 20px",
                background: "#D1FAE5",
                border: "1px solid #A7F3D0",
                borderRadius: "12px",
                flex: "1",
                minWidth: "180px",
              }}
            >
              <div
                style={{
                  padding: "10px",
                  background: "#D1FAE5",
                  borderRadius: "10px",
                  color: "#047857",
                }}
              >
                <CheckCircle size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#065F46",
                    fontWeight: "600",
                  }}
                >
                  APPROVED
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#059669",
                  }}
                >
                  {stats.approved}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 20px",
                background: "#DBEAFE",
                border: "1px solid #BFDBFE",
                borderRadius: "12px",
                flex: "1",
                minWidth: "180px",
              }}
            >
              <div
                style={{
                  padding: "10px",
                  background: "#DBEAFE",
                  borderRadius: "10px",
                  color: "#1D4ED8",
                }}
              >
                <Check size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#1E40AF",
                    fontWeight: "600",
                  }}
                >
                  ISSUED
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#2563EB",
                  }}
                >
                  {stats.issued}
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
                gap: "16px",
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
                  placeholder="Search by employee, item, or purpose..."
                  style={{
                    width: "100%",
                    padding: "14px 16px 14px 48px",
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                  minWidth: "160px",
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
                  <option value="all">📦 All Requests</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="approved">✅ Approved</option>
                  <option value="issued">📤 Issued</option>
                  <option value="rejected">❌ Rejected</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchData}
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

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowForm(true)}
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
                New Request
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* New Request Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
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
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              style={{
                background: "white",
                borderRadius: "20px",
                width: "100%",
                maxWidth: "600px",
                maxHeight: "90vh",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: "24px",
                  borderBottom: "1px solid #F3F4F6",
                  background:
                    "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#111827",
                      margin: "0 0 4px 0",
                    }}
                  >
                    New Stationery Request
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6B7280",
                      margin: 0,
                    }}
                  >
                    Submit a request for stationery items
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#9CA3AF",
                    cursor: "pointer",
                    padding: "8px",
                    borderRadius: "8px",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F3F4F6")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <XCircle size={20} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{ padding: "24px", overflowY: "auto" }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      Employee *
                    </label>
                    <select
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "#F9FAFB",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                        cursor: "pointer",
                      }}
                      value={formData.employee}
                      onChange={(e) =>
                        setFormData({ ...formData, employee: e.target.value })
                      }
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.employee_id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      Stationery Item *
                    </label>
                    <select
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "#F9FAFB",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                        cursor: "pointer",
                      }}
                      value={formData.stationery_item}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stationery_item: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Stock: {item.current_stock} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "#F9FAFB",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      Purpose *
                    </label>
                    <input
                      type="text"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "#F9FAFB",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                      placeholder="e.g., Office use, Project work, etc."
                      value={formData.purpose}
                      onChange={(e) =>
                        setFormData({ ...formData, purpose: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div style={{ marginTop: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Remarks (Optional)
                  </label>
                  <textarea
                    rows="3"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "#F9FAFB",
                      border: "1px solid #D1D5DB",
                      borderRadius: "10px",
                      fontSize: "14px",
                      outline: "none",
                      resize: "vertical",
                    }}
                    placeholder="Additional notes or requirements..."
                    value={formData.remarks}
                    onChange={(e) =>
                      setFormData({ ...formData, remarks: e.target.value })
                    }
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    marginTop: "32px",
                    paddingTop: "20px",
                    borderTop: "1px solid #F3F4F6",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      padding: "12px 24px",
                      background: "white",
                      border: "1px solid #D1D5DB",
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F9FAFB")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "white")
                    }
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
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
                    Submit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Usage Table */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          border: "1px solid rgba(229, 231, 235, 0.5)",
          overflow: "hidden",
          marginBottom: "24px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #F3F4F6",
            background: "#F9FAFB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Package size={20} style={{ color: "#6B7280" }} />
            <span
              style={{ fontSize: "16px", fontWeight: "600", color: "#374151" }}
            >
              Usage Requests ({filteredUsage.length})
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{
                padding: "8px 16px",
                background: "#F3F4F6",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                color: "#6B7280",
                cursor: "pointer",
              }}
            >
              Quick Actions
            </button>
          </div>
        </div>

        {filteredUsage.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
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
              <Package style={{ color: "#9CA3AF" }} size={32} />
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#111827",
                margin: "0 0 8px 0",
              }}
            >
              No usage records found
            </h3>
            <p
              style={{
                color: "#6B7280",
                fontSize: "14px",
                margin: "0 0 24px 0",
              }}
            >
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <User size={14} />
                      Employee
                    </div>
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    Item & Purpose
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    Quantity
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsage.map((record, index) => {
                  const statusColor = getStatusColor(record.status);
                  return (
                    <React.Fragment key={record.id}>
                      <tr
                        style={{
                          background:
                            expandedRow === record.id ? "#F9FAFB" : "white",
                          borderBottom: "1px solid #F3F4F6",
                          transition: "background 0.2s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#F9FAFB")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            expandedRow === record.id ? "#F9FAFB" : "white")
                        }
                        onClick={() =>
                          setExpandedRow(
                            expandedRow === record.id ? null : record.id
                          )
                        }
                      >
                        <td style={{ padding: "20px 24px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                background:
                                  "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontWeight: "600",
                              }}
                            >
                              {record.employee?.name?.charAt(0) || "U"}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "600",
                                  color: "#111827",
                                  marginBottom: "2px",
                                }}
                              >
                                {record.employee_name || "Unknown"}
                              </div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#6B7280",
                                }}
                              >
                                {record.employee_employee_id ||
                                  (record.employee &&
                                    record.employee.employee_id) ||
                                  "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "20px 24px" }}>
                          <div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#111827",
                                marginBottom: "4px",
                              }}
                            >
                              {record.stationery_item?.name ||
                                record.stationery_item_name ||
                                "Unknown"}
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                color: "#6B7280",
                              }}
                            >
                              {record.purpose}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "20px 24px" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "8px 16px",
                              background: "#F3F4F6",
                              borderRadius: "8px",
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#111827",
                            }}
                          >
                            <span>{record.quantity}</span>
                            <span
                              style={{ color: "#6B7280", fontSize: "12px" }}
                            >
                              {record.stationery_item?.unit || "pcs"}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "20px 24px" }}>
                          <div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#111827",
                                marginBottom: "2px",
                              }}
                            >
                              {new Date(
                                record.date_requested
                              ).toLocaleDateString()}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#6B7280",
                              }}
                            >
                              {new Date(
                                record.date_requested
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "20px 24px" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "8px 16px",
                              background: statusColor.light,
                              color: statusColor.text,
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            {getStatusIcon(record.status)}
                            <span style={{ textTransform: "capitalize" }}>
                              {record.status}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "20px 24px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {record.status === "pending" && (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(record.id);
                                  }}
                                  style={{
                                    padding: "8px",
                                    background: "#D1FAE5",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "#047857",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  title="Approve"
                                >
                                  <CheckCircle size={16} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(record.id);
                                  }}
                                  style={{
                                    padding: "8px",
                                    background: "#FEE2E2",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "#B91C1C",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  title="Reject"
                                >
                                  <XCircle size={16} />
                                </motion.button>
                              </>
                            )}
                            {record.status === "approved" && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleIssue(record.id);
                                }}
                                style={{
                                  padding: "8px",
                                  background: "#DBEAFE",
                                  border: "none",
                                  borderRadius: "8px",
                                  color: "#1D4ED8",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                title="Issue Item"
                              >
                                <Check size={16} />
                              </motion.button>
                            )}
                            <button
                              style={{
                                padding: "8px",
                                background: "#F3F4F6",
                                border: "none",
                                borderRadius: "8px",
                                color: "#6B7280",
                                cursor: "pointer",
                              }}
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      <AnimatePresence>
                        {expandedRow === record.id && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <td colSpan="6" style={{ padding: "0" }}>
                              <div
                                style={{
                                  padding: "20px 24px",
                                  background: "#F9FAFB",
                                  borderBottom: "1px solid #E5E7EB",
                                }}
                              >
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "24px",
                                  }}
                                >
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        color: "#6B7280",
                                        marginBottom: "8px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                      }}
                                    >
                                      Details
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        color: "#374151",
                                      }}
                                    >
                                      <div style={{ marginBottom: "4px" }}>
                                        <strong>Item:</strong>{" "}
                                        {record.stationery_item?.name}
                                      </div>
                                      <div style={{ marginBottom: "4px" }}>
                                        <strong>Purpose:</strong>{" "}
                                        {record.purpose}
                                      </div>
                                      <div>
                                        <strong>Remarks:</strong>{" "}
                                        {record.remarks || "None"}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        color: "#6B7280",
                                        marginBottom: "8px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                      }}
                                    >
                                      Employee Info
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        color: "#374151",
                                      }}
                                    >
                                      <div style={{ marginBottom: "4px" }}>
                                        <strong>Department:</strong>{" "}
                                        {record.employee?.department ||
                                          "Not specified"}
                                      </div>
                                      <div>
                                        <strong>Requested on:</strong>{" "}
                                        {new Date(
                                          record.date_requested
                                        ).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "24px",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "white",
          borderRadius: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "4px",
            }}
          >
            Usage Summary
          </div>
          <div
            style={{
              fontSize: "14px",
              opacity: 0.8,
            }}
          >
            Total requests: {stats.total} • Pending: {stats.pending} • Approved:{" "}
            {stats.approved} • Issued: {stats.issued}
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            style={{
              padding: "10px 20px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "10px",
              color: "white",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")
            }
          >
            <BarChart3 size={16} />
            Analytics
          </button>
          <button
            style={{
              padding: "10px 20px",
              background: "white",
              color: "#0F172A",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default StationeryUsage;
