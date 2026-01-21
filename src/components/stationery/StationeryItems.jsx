// src/components/stationery/StationeryItems.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  TrendingUp,
  BarChart3,
  Eye,
  MoreVertical,
  Hash,
  Info,
  Layers,
  Grid,
  List
} from "lucide-react";
import stationeryAPI, { getStockStatus } from "../../api/stationery";

const StationeryItems = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [expandedItem, setExpandedItem] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unit: "pcs",
    reorder_level: 10,
    current_stock: 0,
  });

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
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await stationeryAPI.updateItem(editingItem.id, formData);
      } else {
        await stationeryAPI.addItem(formData);
      }
      
      setShowForm(false);
      setEditingItem(null);
      setFormData({
        name: "",
        description: "",
        unit: "pcs",
        reorder_level: 10,
        current_stock: 0,
      });
      fetchItems();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      unit: item.unit,
      reorder_level: item.reorder_level,
      current_stock: item.current_stock,
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        console.log("Delete item:", itemId);
        fetchItems();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  const getStats = () => {
    const totalItems = items.length;
    const inStock = items.filter(i => getStockStatus(i).label === "In Stock").length;
    const lowStock = items.filter(i => getStockStatus(i).label === "Low Stock").length;
    const outOfStock = items.filter(i => getStockStatus(i).label === "Out of Stock").length;
    const totalStockValue = items.reduce((sum, item) => sum + item.current_stock, 0);
    
    return { totalItems, inStock, lowStock, outOfStock, totalStockValue };
  };

  if (loading) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
        <div style={{
          display: "inline-block",
          animation: "spin 1s linear infinite",
          width: "48px",
          height: "48px",
          border: "3px solid rgba(59, 130, 246, 0.2)",
          borderTopColor: "#3B82F6",
          borderRadius: "50%",
        }}></div>
        <p style={{ marginTop: "16px", color: "#6B7280" }}>Loading stationery items...</p>
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
              background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(59, 130, 246, 0.3)",
            }}>
              <Package style={{ color: "white" }} size={28} />
            </div>
            <div>
              <h2 style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#111827",
                margin: "0 0 4px 0",
                letterSpacing: "-0.025em",
              }}>
                Inventory Management
              </h2>
              <p style={{
                color: "#6B7280",
                fontSize: "14px",
                margin: 0,
              }}>
                Track and manage all stationery items in real-time
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
              background: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: "10px",
              fontSize: "14px",
            }}>
              <div style={{ color: "#3B82F6" }}>
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
                <AlertTriangle size={14} />
              </div>
              <div>
                <span style={{ fontWeight: "500", color: "#374151" }}>{stats.outOfStock}</span>
                <span style={{ color: "#6B7280", marginLeft: "4px" }}>Out of Stock</span>
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
                  placeholder="Search items by name or description..."
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
                    e.target.style.borderColor = "#3B82F6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
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
                    color: viewMode === "grid" ? "#3B82F6" : "#6B7280",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: viewMode === "grid" ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
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
                    boxShadow: viewMode === "list" ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
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
                Export
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEditingItem(null);
                  setFormData({
                    name: "",
                    description: "",
                    unit: "pcs",
                    reorder_level: 10,
                    current_stock: 0,
                  });
                  setShowForm(true);
                }}
                style={{
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
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
                  e.currentTarget.style.background = "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(59, 130, 246, 0.4)";
                }}
              >
                <Plus size={18} />
                Add Item
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Add/Edit Form */}
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
              <div style={{
                padding: "24px",
                borderBottom: "1px solid #F3F4F6",
                background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <h3 style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#111827",
                    margin: "0 0 4px 0",
                  }}>
                    {editingItem ? "Edit Item" : "Add New Item"}
                  </h3>
                  <p style={{
                    fontSize: "14px",
                    color: "#6B7280",
                    margin: 0,
                  }}>
                    {editingItem ? "Update the item details" : "Enter details for the new item"}
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
                  onMouseEnter={(e) => e.currentTarget.style.background = "#F3F4F6"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: "24px", overflowY: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}>
                      Item Name *
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
                        transition: "all 0.2s ease",
                      }}
                      placeholder="Enter item name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}>
                      Unit *
                    </label>
                    <select
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
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="pcs">🟢 Pieces</option>
                      <option value="box">📦 Box</option>
                      <option value="packet">📫 Packet</option>
                      <option value="ream">📄 Ream</option>
                      <option value="bottle">🧴 Bottle</option>
                      <option value="pack">🎒 Pack</option>
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}>
                      Current Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "#F9FAFB",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}>
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      min="1"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "#F9FAFB",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                </div>
                <div style={{ marginTop: "20px" }}>
                  <label style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "8px",
                  }}>
                    Description
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
                    placeholder="Enter item description (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  marginTop: "32px",
                  paddingTop: "20px",
                  borderTop: "1px solid #F3F4F6",
                }}>
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
                    onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "12px 32px",
                      background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
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
                      e.currentTarget.style.background = "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)";
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(59, 130, 246, 0.4)";
                    }}
                  >
                    {editingItem ? "Update Item" : "Add Item"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              Try adjusting your search or filter criteria. You can also add a new item to get started.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setShowForm(true);
              }}
              style={{
                padding: "12px 32px",
                background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
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
                e.currentTarget.style.background = "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(59, 130, 246, 0.4)";
              }}
            >
              Add Your First Item
            </motion.button>
          </div>
        ) : viewMode === "grid" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}>
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
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
              <ListItem
                key={item.id}
                item={item}
                index={index}
                onEdit={handleEdit}
                onDelete={handleDelete}
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
              {stats.lowStock} items need reorder • {stats.outOfStock} items out of stock
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
              Generate Report
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
              <BarChart3 size={16} />
              View Analytics
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
          Last updated: {new Date().toLocaleTimeString()} • Auto-refreshes every 5 minutes
        </div>
      </motion.div>
    </div>
  );
};

// Item Card Component
const ItemCard = ({ item, onEdit, onDelete, expandedItem, setExpandedItem }) => {
  const status = getStockStatus(item);
  const statusColors = {
    "In Stock": { bg: "#10B981", light: "#D1FAE5" },
    "Low Stock": { bg: "#F59E0B", light: "#FEF3C7" },
    "Out of Stock": { bg: "#EF4444", light: "#FEE2E2" }
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
                <span>ID: #{item.id}</span>
              </div>
            </div>
          </div>
          <StatusBadge item={item} />
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
              color: "#111827",
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
              color: "#111827",
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

      {/* Action Bar */}
      <div style={{
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: "1px solid #F3F4F6",
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          style={{
            padding: "8px 16px",
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
          onMouseEnter={(e) => e.currentTarget.style.background = "#E5E7EB"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#F3F4F6"}
        >
          <Edit size={14} />
          Edit
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
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
            onMouseEnter={(e) => e.currentTarget.style.background = "#FEE2E2"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#FEF2F2"}
          >
            <Trash2 size={14} />
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
                Details
              </div>
              <p style={{
                fontSize: "13px",
                color: "#6B7280",
                lineHeight: "1.6",
                margin: "0 0 16px 0",
              }}>
                {item.description || "No description provided."}
              </p>
              <div style={{
                fontSize: "12px",
                color: "#9CA3AF",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <TrendingUp size={12} />
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// List Item Component
const ListItem = ({ item, index, onEdit, onDelete, expandedItem, setExpandedItem }) => {
  const status = getStockStatus(item);
  const statusColors = {
    "In Stock": { bg: "#10B981", light: "#D1FAE5" },
    "Low Stock": { bg: "#F59E0B", light: "#FEF3C7" },
    "Out of Stock": { bg: "#EF4444", light: "#FEE2E2" }
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
            <StatusBadge item={item} />
            <span style={{
              fontSize: "13px",
              color: "#6B7280",
              padding: "4px 8px",
              background: "#F3F4F6",
              borderRadius: "6px",
            }}>
              {item.unit}
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
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              style={{
                padding: "8px",
                background: "#F3F4F6",
                border: "none",
                borderRadius: "8px",
                color: "#3B82F6",
                cursor: "pointer",
              }}
            >
              <Edit size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
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
                More details about this item...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Status Badge Component
const StatusBadge = ({ item }) => {
  const status = getStockStatus(item);
  const config = {
    "In Stock": {
      bg: "#10B981",
      color: "white",
      icon: <CheckCircle size={12} />
    },
    "Low Stock": {
      bg: "#F59E0B",
      color: "white",
      icon: <AlertTriangle size={12} />
    },
    "Out of Stock": {
      bg: "#EF4444",
      color: "white",
      icon: <AlertTriangle size={12} />
    }
  };

  const currentConfig = config[status.label];

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 12px",
      background: currentConfig.bg,
      color: currentConfig.color,
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      whiteSpace: "nowrap",
    }}>
      {currentConfig.icon}
      {status.label}
    </div>
  );
};

export default StationeryItems;