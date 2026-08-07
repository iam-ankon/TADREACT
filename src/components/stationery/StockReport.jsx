// src/components/stationery/StockReport.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Printer,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Package,
  BarChart3,
  PieChart,
  Eye,
  ShoppingCart,
  Bell,
  Plus,
  ChevronDown,
  ChevronUp,
  Search,
  MoreVertical,
  Clock,
  DollarSign,
  Users,
  TrendingUp as TrendingUpIcon,
  BarChart3 as BarChartIcon,
  Layers,
  Hash,
  Info
} from "lucide-react";
import stationeryAPI, { getStockStatus } from "../../api/stationery";

const StockReport = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [sortOrder, setSortOrder] = useState("desc");
  const [expandedItem, setExpandedItem] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await stationeryAPI.fetchItems();
      setItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        const status = getStockStatus(item);
        return status.label === statusFilter;
      });
    }

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "priority":
          const priorityA = getPriorityLevel(a);
          const priorityB = getPriorityLevel(b);
          aValue = priorityA;
          bValue = priorityB;
          break;
        case "stock":
          aValue = a.current_stock;
          bValue = b.current_stock;
          break;
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      return sortOrder === "asc" ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    setFilteredItems(filtered);
  }, [items, searchTerm, statusFilter, sortBy, sortOrder]);

  const getPriorityLevel = (item) => {
    if (item.current_stock <= item.reorder_level) return 3; // High priority
    if (item.current_stock <= item.reorder_level * 2) return 2; // Medium priority
    return 1; // Low priority
  };

  const getStats = () => {
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inStockCount = 0;
    let totalValue = 0;
    let criticalItems = 0;

    items.forEach((item) => {
      const status = getStockStatus(item);
      if (status.label === "In Stock") inStockCount++;
      else if (status.label === "Low Stock") lowStockCount++;
      else if (status.label === "Out of Stock") {
        outOfStockCount++;
        criticalItems++;
      }
      
      if (item.current_stock <= item.reorder_level * 0.5) criticalItems++;
      
      totalValue += item.current_stock * (item.unit_price || 10);
    });

    return {
      totalItems: items.length,
      inStock: inStockCount,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      totalValue: totalValue.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      }),
      criticalItems,
      healthScore: items.length === 0 ? 100 : 
        Math.round(((inStockCount - criticalItems * 0.5) / items.length) * 100)
    };
  };

  if (loading) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
        <div style={{
          display: "inline-block",
          animation: "spin 1s linear infinite",
          width: "48px",
          height: "48px",
          border: "3px solid rgba(139, 92, 246, 0.2)",
          borderTopColor: "#8B5CF6",
          borderRadius: "50%",
        }}></div>
        <p style={{ marginTop: "16px", color: "#6B7280" }}>Loading stock analytics...</p>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div style={{ padding: "24px" }}>
      {/* Modern Header with Stats */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "24px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "16px",
          }}>
            <div style={{
              padding: "14px",
              background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(139, 92, 246, 0.3)",
            }}>
              <BarChartIcon style={{ color: "white" }} size={28} />
            </div>
            <div>
              <h2 style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#111827",
                margin: "0 0 4px 0",
                letterSpacing: "-0.025em",
              }}>
                Stock Intelligence Dashboard
              </h2>
              <p style={{
                color: "#6B7280",
                fontSize: "14px",
                margin: 0,
              }}>
                Real-time analytics and predictive insights for inventory management
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            marginTop: "8px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: "#F5F3FF",
              border: "1px solid #DDD6FE",
              borderRadius: "10px",
              fontSize: "14px",
            }}>
              <div style={{ color: "#8B5CF6" }}>
                <Hash size={14} />
              </div>
              <div>
                <span style={{ fontWeight: "500", color: "#374151" }}>{stats.totalItems}</span>
                <span style={{ color: "#6B7280", marginLeft: "4px" }}>Total Items</span>
              </div>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "10px",
              fontSize: "14px",
            }}>
              <div style={{ color: "#10B981" }}>
                <CheckCircle size={14} />
              </div>
              <div>
                <span style={{ fontWeight: "500", color: "#374151" }}>{stats.inStock}</span>
                <span style={{ color: "#6B7280", marginLeft: "4px" }}>In Stock</span>
              </div>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: "10px",
              fontSize: "14px",
            }}>
              <div style={{ color: "#F59E0B" }}>
                <AlertTriangle size={14} />
              </div>
              <div>
                <span style={{ fontWeight: "500", color: "#374151" }}>{stats.lowStock}</span>
                <span style={{ color: "#6B7280", marginLeft: "4px" }}>Low Stock</span>
              </div>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: "10px",
              fontSize: "14px",
            }}>
              <div style={{ color: "#EF4444" }}>
                <XCircle size={14} />
              </div>
              <div>
                <span style={{ fontWeight: "500", color: "#374151" }}>{stats.outOfStock}</span>
                <span style={{ color: "#6B7280", marginLeft: "4px" }}>Out of Stock</span>
              </div>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: "10px",
              fontSize: "14px",
            }}>
              <div style={{ color: "#3B82F6" }}>
                <DollarSign size={14} />
              </div>
              <div>
                <span style={{ fontWeight: "500", color: "#374151" }}>{stats.totalValue}</span>
                <span style={{ color: "#6B7280", marginLeft: "4px" }}>Total Value</span>
              </div>
            </div>
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
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "space-between",
          }}>
            {/* Search and Filters */}
            <div style={{
              display: "flex",
              flex: 1,
              minWidth: "300px",
              gap: "16px",
              alignItems: "center",
            }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9CA3AF",
                }} size={20} />
                <input
                  type="text"
                  placeholder="Search items, categories, or descriptions..."
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
                    e.target.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(209, 213, 219, 0.8)";
                    e.target.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{
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
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#D1D5DB"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(209, 213, 219, 0.8)"}>
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
                  <option value="all">📦 All Items</option>
                  <option value="In Stock">✅ In Stock</option>
                  <option value="Low Stock">⚠️ Low Stock</option>
                  <option value="Out of Stock">❌ Out of Stock</option>
                </select>
              </div>

              <div style={{
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
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#D1D5DB"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(209, 213, 219, 0.8)"}>
                <TrendingUpIcon size={16} style={{ color: "#6B7280" }} />
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
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="priority">📊 Priority</option>
                  <option value="stock">📈 Stock Level</option>
                  <option value="name">🔤 Name</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}>
              {/* View Toggle */}
              <div style={{
                display: "flex",
                background: "rgba(243, 244, 246, 0.8)",
                borderRadius: "10px",
                padding: "4px",
                border: "1px solid rgba(209, 213, 219, 0.5)",
              }}>
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
                    boxShadow: viewMode === "grid" ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Layers size={14} />
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
                    boxShadow: viewMode === "list" ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <BarChartIcon size={14} />
                  Table
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchItems}
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
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#D1D5DB"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(209, 213, 219, 0.8)"}
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
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#D1D5DB"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(209, 213, 219, 0.8)"}
              >
                <Download size={16} />
                Export PDF
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
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#D1D5DB"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(209, 213, 219, 0.8)"}
              >
                <Printer size={16} />
                Print
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Health Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
          color: "white",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 8px 32px rgba(139, 92, 246, 0.3)",
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <div>
            <div style={{
              fontSize: "14px",
              opacity: 0.9,
              marginBottom: "8px",
            }}>
              Overall Inventory Health
            </div>
            <div style={{
              fontSize: "32px",
              fontWeight: "700",
              marginBottom: "4px",
            }}>
              {stats.healthScore}%
            </div>
            <div style={{
              fontSize: "14px",
              opacity: 0.8,
            }}>
              Based on {stats.totalItems} items • {stats.criticalItems} critical items need attention
            </div>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.1)",
              padding: "12px 20px",
              borderRadius: "12px",
              backdropFilter: "blur(10px)",
            }}>
              <div style={{ fontSize: "20px", fontWeight: "700" }}>{stats.inStock}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>In Stock</div>
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.1)",
              padding: "12px 20px",
              borderRadius: "12px",
              backdropFilter: "blur(10px)",
            }}>
              <div style={{ fontSize: "20px", fontWeight: "700" }}>{stats.lowStock}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>Low Stock</div>
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.1)",
              padding: "12px 20px",
              borderRadius: "12px",
              backdropFilter: "blur(10px)",
            }}>
              <div style={{ fontSize: "20px", fontWeight: "700" }}>{stats.outOfStock}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>Out of Stock</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Items Display */}
      <div>
        {filteredItems.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "64px 24px",
            background: "white",
            borderRadius: "16px",
            border: "1px solid rgba(229, 231, 235, 0.5)",
          }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#F3F4F6",
              marginBottom: "24px",
            }}>
              <Package style={{ color: "#9CA3AF" }} size={32} />
            </div>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#111827",
              margin: "0 0 8px 0",
            }}>
              No items found
            </h3>
            <p style={{
              color: "#6B7280",
              fontSize: "14px",
              margin: "0 0 24px 0",
              maxWidth: "400px",
              marginLeft: "auto",
              marginRight: "auto",
            }}>
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "20px",
          }}>
            {filteredItems.map((item) => (
              <ReportItemCard
                key={item.id}
                item={item}
                expandedItem={expandedItem}
                setExpandedItem={setExpandedItem}
              />
            ))}
          </div>
        ) : (
          <div style={{
            background: "white",
            borderRadius: "16px",
            border: "1px solid rgba(229, 231, 235, 0.5)",
            overflow: "hidden",
          }}>
            {filteredItems.map((item, index) => (
              <ReportListItem
                key={item.id}
                item={item}
                index={index}
                expandedItem={expandedItem}
                setExpandedItem={setExpandedItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginTop: "32px",
          padding: "24px",
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          color: "white",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <div>
            <div style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "4px",
            }}>
              Showing {filteredItems.length} of {items.length} items
            </div>
            <div style={{
              fontSize: "14px",
              opacity: 0.8,
            }}>
              Total inventory value: {stats.totalValue} • Health score: {stats.healthScore}%
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button style={{
              padding: "10px 20px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "10px",
              color: "white",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}>
              <Download size={16} style={{ marginRight: "8px" }} />
              Full Report
            </button>
            <button style={{
              padding: "10px 20px",
              background: "white",
              color: "#1E293B",
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
            onMouseEnter={(e) => e.currentTarget.style.background = "#F1F5F9"}
            onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
              <ShoppingCart size={16} />
              Generate Purchase Orders
            </button>
          </div>
        </div>
        <div style={{
          fontSize: "12px",
          opacity: 0.6,
          textAlign: "center",
          paddingTop: "16px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}>
          Analytics report generated at {new Date().toLocaleTimeString()} • Auto-refreshes every 15 minutes
        </div>
      </motion.div>
    </div>
  );
};

// Report Item Card Component
const ReportItemCard = ({ item, expandedItem, setExpandedItem }) => {
  const status = getStockStatus(item);
  const priority = getPriorityLevel(item);
  
  const statusColors = {
    "In Stock": { bg: "#10B981", light: "#D1FAE5" },
    "Low Stock": { bg: "#F59E0B", light: "#FEF3C7" },
    "Out of Stock": { bg: "#EF4444", light: "#FEE2E2" }
  };

  const priorityColors = {
    3: { bg: "#EF4444", text: "HIGH" },
    2: { bg: "#F59E0B", text: "MEDIUM" },
    1: { bg: "#10B981", text: "LOW" }
  };

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
      }}
      onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
    >
      {/* Card Header */}
      <div style={{
        padding: "20px",
        borderBottom: "1px solid #F3F4F6",
        background: expandedItem === item.id ? "#F9FAFB" : "white",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              padding: "12px",
              background: statusColors[status.label].light,
              borderRadius: "12px",
              color: statusColors[status.label].bg,
            }}>
              <Package size={20} />
            </div>
            <div>
              <h4 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#111827",
                margin: "0 0 4px 0",
              }}>
                {item.name}
              </h4>
              <div style={{
                fontSize: "13px",
                color: "#6B7280",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <span>{item.unit}</span>
                <span style={{ color: "#D1D5DB" }}>•</span>
                <span>{item.category || "General"}</span>
              </div>
            </div>
          </div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            background: priorityColors[priority].bg,
            color: "white",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "600",
          }}>
            {priorityColors[priority].text}
          </div>
        </div>

        {/* Stock Progress */}
        <div style={{ marginTop: "20px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "13px",
            color: "#6B7280",
            marginBottom: "8px",
          }}>
            <span>Stock Level</span>
            <span style={{ fontWeight: "600", color: "#374151" }}>
              {item.current_stock} / {item.reorder_level * 3}
            </span>
          </div>
          <div style={{
            height: "6px",
            background: "#E5E7EB",
            borderRadius: "3px",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${Math.min(100, (item.current_stock / (item.reorder_level * 3)) * 100)}%`,
              background: `linear-gradient(90deg, ${statusColors[status.label].bg}, ${statusColors[status.label].bg}80)`,
              borderRadius: "3px",
              transition: "width 0.5s ease",
            }}></div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginTop: "20px",
        }}>
          <div style={{
            textAlign: "center",
            padding: "12px",
            background: "#F9FAFB",
            borderRadius: "10px",
          }}>
            <div style={{
              fontSize: "18px",
              fontWeight: "700",
              color: status.label === "Out of Stock" ? "#EF4444" : 
                     status.label === "Low Stock" ? "#F59E0B" : "#111827",
            }}>
              {item.current_stock}
            </div>
            <div style={{
              fontSize: "11px",
              color: "#6B7280",
              marginTop: "4px",
            }}>
              Current
            </div>
          </div>
          <div style={{
            textAlign: "center",
            padding: "12px",
            background: "#F9FAFB",
            borderRadius: "10px",
          }}>
            <div style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#111827",
            }}>
              {item.reorder_level}
            </div>
            <div style={{
              fontSize: "11px",
              color: "#6B7280",
              marginTop: "4px",
            }}>
              Reorder At
            </div>
          </div>
          <div style={{
            textAlign: "center",
            padding: "12px",
            background: "#F9FAFB",
            borderRadius: "10px",
          }}>
            <div style={{
              fontSize: "18px",
              fontWeight: "700",
              color: item.current_stock < item.reorder_level ? "#EF4444" : "#111827",
            }}>
              {Math.max(0, item.reorder_level - item.current_stock)}
            </div>
            <div style={{
              fontSize: "11px",
              color: "#6B7280",
              marginTop: "4px",
            }}>
              Need
            </div>
          </div>
        </div>
      </div>

      {/* Status and Actions Bar */}
      <div style={{
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: "1px solid #F3F4F6",
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          background: statusColors[status.label].light,
          color: statusColors[status.label].bg,
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "600",
        }}>
          {status.label === "In Stock" && <CheckCircle size={12} />}
          {status.label === "Low Stock" && <AlertTriangle size={12} />}
          {status.label === "Out of Stock" && <XCircle size={12} />}
          {status.label}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={{
            padding: "8px",
            background: "#F3F4F6",
            border: "none",
            borderRadius: "8px",
            color: "#6B7280",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#E5E7EB"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#F3F4F6"}>
            <Eye size={14} />
          </button>
          <button style={{
            padding: "8px",
            background: "#F3F4F6",
            border: "none",
            borderRadius: "8px",
            color: "#6B7280",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#E5E7EB"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#F3F4F6"}>
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expandedItem === item.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "#F9FAFB",
              borderTop: "1px solid #E5E7EB",
            }}
          >
            <div style={{ padding: "20px" }}>
              <div style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <Info size={14} />
                Analytics Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px" }}>Suggested Order</div>
                  <div style={{ fontSize: "16px", fontWeight: "600", color: "#8B5CF6" }}>
                    {Math.max(0, item.reorder_level * 3 - item.current_stock)} {item.unit}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px" }}>Est. Value</div>
                  <div style={{ fontSize: "16px", fontWeight: "600", color: "#10B981" }}>
                    ${(item.current_stock * (item.unit_price || 10)).toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: "12px",
                color: "#9CA3AF",
                marginTop: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <Clock size={12} />
                Last analysis: {new Date().toLocaleDateString()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Report List Item Component
const ReportListItem = ({ item, index, expandedItem, setExpandedItem }) => {
  const status = getStockStatus(item);
  const priority = getPriorityLevel(item);
  
  const statusColors = {
    "In Stock": { bg: "#10B981", light: "#D1FAE5" },
    "Low Stock": { bg: "#F59E0B", light: "#FEF3C7" },
    "Out of Stock": { bg: "#EF4444", light: "#FEE2E2" }
  };

  const priorityColors = {
    3: { bg: "#EF4444", text: "HIGH" },
    2: { bg: "#F59E0B", text: "MEDIUM" },
    1: { bg: "#10B981", text: "LOW" }
  };

  return (
    <>
      <div style={{
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        borderBottom: "1px solid #F3F4F6",
        cursor: "pointer",
        transition: "background 0.2s ease",
        background: expandedItem === item.id ? "#F9FAFB" : index % 2 === 0 ? "white" : "#F9FAFB",
      }}
      onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}>
        <div style={{
          padding: "10px",
          background: statusColors[status.label].light,
          borderRadius: "10px",
          color: statusColors[status.label].bg,
        }}>
          <Package size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h4 style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#111827",
              margin: 0,
            }}>
              {item.name}
            </h4>
            <span style={{
              fontSize: "12px",
              color: "#6B7280",
              padding: "4px 8px",
              background: "#F3F4F6",
              borderRadius: "6px",
            }}>
              {item.unit}
            </span>
            <span style={{
              fontSize: "12px",
              color: "#6B7280",
              padding: "4px 8px",
              background: "#F5F3FF",
              borderRadius: "6px",
            }}>
              {item.category || "General"}
            </span>
          </div>
          <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>
            {item.description || "No description"}
          </div>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#111827" }}>
              {item.current_stock}
            </div>
            <div style={{ fontSize: "11px", color: "#6B7280" }}>Stock</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#111827" }}>
              {item.reorder_level}
            </div>
            <div style={{ fontSize: "11px", color: "#6B7280" }}>Reorder</div>
          </div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            background: priorityColors[priority].bg,
            color: "white",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "600",
          }}>
            {priorityColors[priority].text}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{
              padding: "8px",
              background: "#F3F4F6",
              border: "none",
              borderRadius: "8px",
              color: "#6B7280",
              cursor: "pointer",
            }}>
              <Eye size={14} />
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {expandedItem === item.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "#F3F4F6",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <div style={{ padding: "20px 20px 20px 76px" }}>
              <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "8px" }}>
                <strong>Analytics:</strong> Suggested order quantity: {Math.max(0, item.reorder_level * 3 - item.current_stock)} {item.unit} • Estimated value: ${(item.current_stock * (item.unit_price || 10)).toLocaleString()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const getPriorityLevel = (item) => {
  if (item.current_stock <= item.reorder_level) return 3;
  if (item.current_stock <= item.reorder_level * 2) return 2;
  return 1;
};

export default StockReport;