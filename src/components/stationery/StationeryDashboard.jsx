// src/components/stationery/StationeryDashboard.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  Clock,
  Search,
  Bell,
  Settings,
  Download,
  Filter,
  Plus,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  CheckCircle,
  RefreshCw,
  ChevronRight,
  X
} from "lucide-react";
import stationeryAPI from "../../api/stationery";
import StationeryItems from "./StationeryItems";
import StationeryUsage from "./StationeryUsage";
import StockReport from "./StockReport";

const StationeryDashboard = () => {
  const [activeTab, setActiveTab] = useState("items");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalUsage: 0,
    totalTransactions: 0,
    lowStockItems: 0,
    pendingRequests: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] = useState([
    { id: 1, message: "5 items below reorder level", type: "warning", time: "10 min ago" },
    { id: 2, message: "New request from John Doe", type: "info", time: "25 min ago" },
    { id: 3, message: "Monthly report ready", type: "success", time: "2 hours ago" },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      const [items, usage, transactions] = await Promise.all([
        stationeryAPI.fetchItems(),
        stationeryAPI.fetchUsage(),
        stationeryAPI.fetchTransactions(),
      ]);

      const lowStockItems = items.filter(
        (item) => item.current_stock <= item.reorder_level && item.current_stock > 0
      ).length;

      const pendingRequests = usage.filter(
        (req) => req.status === "pending"
      ).length;

      setStats({
        totalItems: items.length,
        totalUsage: usage.length,
        totalTransactions: transactions.length,
        lowStockItems,
        pendingRequests,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const tabs = [
    { id: "items", label: "Inventory", icon: <Package size={18} />, color: "#3B82F6" },
    { id: "usage", label: "Usage", icon: <ClipboardList size={18} />, color: "#10B981" },
    { id: "transactions", label: "Transactions", icon: <ShoppingCart size={18} />, color: "#8B5CF6" },
    { id: "stock-report", label: "Reports", icon: <BarChart3 size={18} />, color: "#F59E0B" },
    { id: "employee-report", label: "Employees", icon: <Users size={18} />, color: "#EC4899" },
  ];

  const quickActions = [
    { 
      label: "Add Item", 
      icon: <Plus size={16} />, 
      bg: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
      hoverBg: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)"
    },
    { 
      label: "Export Data", 
      icon: <Download size={16} />, 
      bg: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
      hoverBg: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)"
    },
    { 
      label: "Process All", 
      icon: <CheckCircle size={16} />, 
      bg: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      hoverBg: "linear-gradient(135deg, #059669 0%, #047857 100%)"
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "items":
        return <StationeryItems />;
      case "usage":
        return <StationeryUsage />;
      case "transactions":
        return <div style={{ padding: "32px", textAlign: "center", color: "#6B7280" }}>Transactions component coming soon</div>;
      case "stock-report":
        return <StockReport />;
      case "employee-report":
        return <div style={{ padding: "32px", textAlign: "center", color: "#6B7280" }}>Employee Report component coming soon</div>;
      default:
        return <StationeryItems />;
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
       padding: "24px 80px",

    }}>
      <div style={{  margin: "0 auto" }}>
        
        {/* Modern Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "32px",
          }}>
            {/* Top Row */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: "24px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}>
                <div style={{
                  width: "3px",
                  height: "28px",
                  background: "linear-gradient(to bottom, #3B82F6, #8B5CF6)",
                  borderRadius: "2px",
                }}></div>
                <div>
                  <h1 style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "-0.025em",
                    margin: 0,
                  }}>
                    Stationery Management
                  </h1>
                  <p style={{
                    color: "#6B7280",
                    fontSize: "14px",
                    margin: "4px 0 0 0",
                  }}>
                    Real-time inventory tracking and analytics dashboard
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "20px",
                marginLeft: "15px",
              }}>
                {quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 16px",
                      background: action.bg,
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                    onMouseEnter={(e) => e.target.style.background = action.hoverBg}
                    onMouseLeave={(e) => e.target.style.background = action.bg}
                  >
                    {action.icon}
                    {action.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}>
                {/* Search Bar */}
                <div style={{
                  position: "relative",
                  flex: "1",
                  minWidth: "280px",
                  maxWidth: "400px",
                }}>
                  <Search style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9CA3AF",
                  }} size={20} />
                  <input
                    type="text"
                    placeholder="Search items, requests, reports..."
                    style={{
                      width: "100%",
                      padding: "14px 16px 14px 48px",
                      background: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(209, 213, 219, 0.5)",
                      borderRadius: "14px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3B82F6";
                      e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(209, 213, 219, 0.5)";
                      e.target.style.boxShadow = "none";
                    }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}>
                  {/* Notifications */}
                  <div style={{ position: "relative" }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowNotifications(!showNotifications)}
                      style={{
                        position: "relative",
                        padding: "12px",
                        background: "white",
                        border: "1px solid rgba(209, 213, 219, 0.5)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                      }}
                      onMouseEnter={(e) => e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)"}
                      onMouseLeave={(e) => e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)"}
                    >
                      <Bell size={20} style={{ color: "#374151" }} />
                      {notifications.length > 0 && (
                        <span style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-4px",
                          width: "20px",
                          height: "20px",
                          background: "#EF4444",
                          color: "white",
                          fontSize: "11px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "600",
                        }}>
                          {notifications.length}
                        </span>
                      )}
                    </motion.button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "calc(100% + 8px)",
                          width: "320px",
                          background: "white",
                          borderRadius: "16px",
                          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                          zIndex: 50,
                          border: "1px solid rgba(209, 213, 219, 0.5)",
                          overflow: "hidden",
                        }}
                      >
                        <div style={{
                          padding: "16px",
                          borderBottom: "1px solid #F3F4F6",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}>
                          <h3 style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#111827",
                            margin: 0,
                          }}>
                            Notifications
                          </h3>
                          <button
                            onClick={() => setShowNotifications(false)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#9CA3AF",
                              cursor: "pointer",
                              padding: "4px",
                            }}
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                          {notifications.map((notif) => (
                            <div
                              key={notif.id}
                              style={{
                                padding: "16px",
                                borderBottom: "1px solid #F9FAFB",
                                cursor: "pointer",
                                transition: "background 0.2s ease",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                            >
                              <div style={{ display: "flex", gap: "12px" }}>
                                <div style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  marginTop: "6px",
                                  background: notif.type === 'warning' ? '#F59E0B' : 
                                            notif.type === 'success' ? '#10B981' : '#3B82F6',
                                }}></div>
                                <div style={{ flex: 1 }}>
                                  <p style={{
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#111827",
                                    margin: "0 0 4px 0",
                                  }}>
                                    {notif.message}
                                  </p>
                                  <p style={{
                                    fontSize: "12px",
                                    color: "#6B7280",
                                    margin: 0,
                                  }}>
                                    {notif.time}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Refresh Button */}
                  <motion.button
                    whileHover={{ rotate: 180, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={fetchDashboardStats}
                    style={{
                      padding: "12px",
                      background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)";
                      e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)";
                      e.target.style.boxShadow = "0 4px 14px rgba(59, 130, 246, 0.4)";
                    }}
                  >
                    <RefreshCw size={20} />
                  </motion.button>

                  {/* Settings */}
                  <button style={{
                    padding: "12px",
                    background: "white",
                    border: "1px solid rgba(209, 213, 219, 0.5)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
                    e.target.style.borderColor = "#D1D5DB";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
                    e.target.style.borderColor = "rgba(209, 213, 219, 0.5)";
                  }}>
                    <Settings size={20} style={{ color: "#374151" }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}>
            <StatCard
              title="Total Items"
              value={stats.totalItems}
              icon={<Package size={20} />}
              color="#3B82F6"
              loading={loading}
              trend={12.5}
              subtitle="Active items"
            />
            <StatCard
              title="Usage Records"
              value={stats.totalUsage}
              icon={<ClipboardList size={20} />}
              color="#10B981"
              loading={loading}
              trend={8.3}
              subtitle="This month"
            />
            <StatCard
              title="Transactions"
              value={stats.totalTransactions}
              icon={<ShoppingCart size={20} />}
              color="#8B5CF6"
              loading={loading}
              trend={15.2}
              subtitle="Processed"
            />
            <StatCard
              title="Low Stock"
              value={stats.lowStockItems}
              icon={<AlertTriangle size={20} />}
              color="#F59E0B"
              loading={loading}
              trend={-5.2}
              subtitle="Need attention"
            />
            <StatCard
              title="Pending Requests"
              value={stats.pendingRequests}
              icon={<Clock size={20} />}
              color="#EC4899"
              loading={loading}
              trend={3.7}
              subtitle="Awaiting approval"
            />
          </div>
        </div>

        {/* Tabs Navigation */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}>
            <div style={{
              display: "flex",
              background: "rgba(243, 244, 246, 0.8)",
              borderRadius: "14px",
              padding: "4px",
              gap: "4px",
            }}>
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    background: activeTab === tab.id ? "white" : "transparent",
                    color: activeTab === tab.id ? tab.color : "#6B7280",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: activeTab === tab.id ? "0 4px 12px rgba(0, 0, 0, 0.08)" : "none",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && (
                    <ChevronRight size={16} style={{ marginLeft: "4px" }} />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Tab Actions */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <button style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                background: "white",
                border: "1px solid rgba(209, 213, 219, 0.5)",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#F9FAFB";
                e.target.style.borderColor = "#D1D5DB";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "white";
                e.target.style.borderColor = "rgba(209, 213, 219, 0.5)";
              }}>
                <Filter size={16} />
                Filter
              </button>
              <button style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                background: "white",
                border: "1px solid rgba(209, 213, 219, 0.5)",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#F9FAFB";
                e.target.style.borderColor = "#D1D5DB";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "white";
                e.target.style.borderColor = "rgba(209, 213, 219, 0.5)";
              }}>
                <Download size={16} />
                Export
              </button>
              <button style={{
                padding: "10px",
                background: "white",
                border: "1px solid rgba(209, 213, 219, 0.5)",
                borderRadius: "12px",
                cursor: "pointer",
                color: "#374151",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#F9FAFB";
                e.target.style.borderColor = "#D1D5DB";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "white";
                e.target.style.borderColor = "rgba(209, 213, 219, 0.5)";
              }}>
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            background: "white",
            borderRadius: "20px",
            boxShadow: "0 20px 40px -20px rgba(0, 0, 0, 0.1), 0 10px 20px -10px rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(229, 231, 235, 0.5)",
            overflow: "hidden",
            minHeight: "500px",
          }}
        >
          {renderContent()}
        </motion.div>

        {/* Footer */}
        <div style={{
          marginTop: "32px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "14px",
            color: "#6B7280",
            flexWrap: "wrap",
            justifyContent: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "8px",
                height: "8px",
                background: "#10B981",
                borderRadius: "50%",
                animation: "pulse 2s infinite",
              }}></div>
              <span>All systems operational</span>
            </div>
            <span style={{ color: "#D1D5DB" }}>•</span>
            <span>Last updated: Just now</span>
            <span style={{ color: "#D1D5DB" }}>•</span>
            <span>Data refreshes every 5 minutes</span>
          </div>
          <div style={{
            fontSize: "13px",
            color: "#9CA3AF",
            textAlign: "center",
          }}>
            © 2024 Stationery Management System • Version 2.1.0
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, loading, trend, subtitle }) => {
  return (
    <motion.div
      whileHover={{ 
        y: -6,
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.04)",
      }}
      style={{
        background: "white",
        borderRadius: "18px",
        padding: "24px",
        border: `1px solid ${color}20`,
        transition: "all 0.3s ease",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative Accent */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: `linear-gradient(90deg, ${color}, ${color}80)`,
      }}></div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{
            fontSize: "13px",
            fontWeight: "500",
            color: "#6B7280",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            {title}
          </div>
          
          {loading ? (
            <div style={{
              width: "80px",
              height: "32px",
              background: "linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)",
              borderRadius: "8px",
              animation: "shimmer 2s infinite",
              backgroundSize: "200% 100%",
            }}></div>
          ) : (
            <div style={{
              fontSize: "32px",
              fontWeight: "700",
              background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "4px",
            }}>
              {value.toLocaleString()}
            </div>
          )}
          
          {subtitle && (
            <div style={{
              fontSize: "13px",
              color: "#9CA3AF",
              marginTop: "4px",
            }}>
              {subtitle}
            </div>
          )}
        </div>
        
        {/* Icon Container */}
        <div style={{
          padding: "12px",
          background: `${color}10`,
          borderRadius: "12px",
          border: `1px solid ${color}20`,
        }}>
          {React.cloneElement(icon, { 
            style: { 
              color: color,
              filter: `drop-shadow(0 2px 4px ${color}40)`,
            }
          })}
        </div>
      </div>
      
      {/* Trend Indicator */}
      {trend && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "20px",
          paddingTop: "16px",
          borderTop: `1px solid ${color}15`,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            {trend > 0 ? (
              <TrendingUp size={14} style={{ color: "#10B981" }} />
            ) : (
              <TrendingDown size={14} style={{ color: "#EF4444" }} />
            )}
            <span style={{
              fontSize: "13px",
              fontWeight: "600",
              color: trend > 0 ? "#10B981" : "#EF4444",
            }}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          </div>
          <span style={{
            fontSize: "12px",
            color: "#9CA3AF",
          }}>
            vs last month
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default StationeryDashboard;