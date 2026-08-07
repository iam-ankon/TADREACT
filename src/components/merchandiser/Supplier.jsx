import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Sidebar from "../merchandiser/Sidebar.jsx";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight,
  Package,
  MapPin,
  Mail,
  Building2,
  TrendingUp,
  TrendingDown,
  MoreVertical
} from "lucide-react";

const Supplier = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    expired: 0
  });
  const navigate = useNavigate();

  // Status colors mapping with modern gradients
  const statusStyles = {
    active: { 
      bg: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)", 
      text: "#065f46",
      icon: "✅"
    },
    valid: { 
      bg: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)", 
      text: "#065f46",
      icon: "✅"
    },
    pending: { 
      bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", 
      text: "#92400e",
      icon: "⏳"
    },
    "in progress": { 
      bg: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)", 
      text: "#1e40af",
      icon: "🔄"
    },
    expired: { 
      bg: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)", 
      text: "#991b1b",
      icon: "⚠️"
    },
    invalid: { 
      bg: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)", 
      text: "#991b1b",
      icon: "❌"
    },
    cancelled: { 
      bg: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)", 
      text: "#374151",
      icon: "🚫"
    },
  };

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          "http://119.148.51.38:8000/api/csr/api/supplier/"
        );
        let suppliersData = [];
        if (Array.isArray(response.data)) {
          suppliersData = response.data;
        } else if (response.data && Array.isArray(response.data.results)) {
          suppliersData = response.data.results;
        } else if (response.data && Array.isArray(response.data.data)) {
          suppliersData = response.data.data;
        } else {
          console.error("Unexpected API response structure:", response.data);
          toast.error("Unexpected data format from server");
          setSuppliers([]);
          return;
        }
        
        setSuppliers(suppliersData);
        
        // Calculate stats
        const total = suppliersData.length;
        const active = suppliersData.filter(s => 
          ['active', 'valid'].includes(getEffectiveStatus(s))
        ).length;
        const pending = suppliersData.filter(s => 
          ['pending', 'in progress'].includes(getEffectiveStatus(s))
        ).length;
        const expired = suppliersData.filter(s => 
          ['expired', 'invalid'].includes(getEffectiveStatus(s))
        ).length;
        
        setStats({ total, active, pending, expired });
        
      } catch (error) {
        console.error("API Error:", error);
        toast.error("Failed to fetch suppliers");
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await axios.delete(
          `http://119.148.51.38:8000/api/csr/api/supplier/${id}/`
        );
        setSuppliers(suppliers.filter((supplier) => supplier.id !== id));
        toast.success("Supplier deleted successfully");
      } catch (error) {
        console.error("Delete Error:", error);
        toast.error("Failed to delete supplier");
      }
    }
  };

  const getEffectiveStatus = (supplier) => {
    return (
      supplier.bsci_status ||
      supplier.sedex_status ||
      supplier.agreement_status ||
      "unknown"
    ).toLowerCase();
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!supplier) return false;
    
    const matchesSearch = (() => {
      const name = (supplier.supplier_name || supplier.name || "").toLowerCase();
      const vendorId = (supplier.supplier_id || supplier.vendor_id || "").toLowerCase();
      const email = (supplier.email || "").toLowerCase();
      const search = searchTerm.toLowerCase().trim();
      return name.includes(search) || vendorId.includes(search) || email.includes(search);
    })();
    
    const matchesFilter = selectedFilter === "all" || getEffectiveStatus(supplier) === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Stat cards data
  const statCards = [
    { label: "Total Suppliers", value: stats.total, icon: Building2, color: "#3b82f6", bg: "#eff6ff" },
    { label: "Active Suppliers", value: stats.active, icon: TrendingUp, color: "#10b981", bg: "#d1fae5" },
    { label: "Pending Review", value: stats.pending, icon: MoreVertical, color: "#f59e0b", bg: "#fef3c7" },
    { label: "Expired/Invalid", value: stats.expired, icon: TrendingDown, color: "#ef4444", bg: "#fee2e2" },
  ];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f3f4f6", // Light gray background instead of gradient
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebar />

      <div
        style={{
          flexGrow: 1,
          padding: "2rem",
          overflowY: "auto",
          maxHeight: "100vh",
        }}
      >
        {/* Header Section */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "0.5rem",
            }}
          >
            Supplier Management
          </h1>
          <p style={{ color: "#6b7280", fontSize: "1rem" }}>
            Manage and track all your supplier information in one place
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
                  e.currentTarget.style.boxShadow = "0 10px 40px rgba(0,0,0,0.1)";
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

        {/* Search and Filter Section */}
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
            {/* Search Box */}
            <div
              style={{
                flex: "1",
                minWidth: "250px",
                position: "relative",
              }}
            >
              <Search
                size={20}
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
                placeholder="Search suppliers by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.875rem 1rem 0.875rem 2.75rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.875rem",
                  transition: "all 0.3s ease",
                  outline: "none",
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

            {/* Filter Buttons */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {["all", "active", "pending", "expired"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    border: selectedFilter === filter ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                    background: selectedFilter === filter ? "#eff6ff" : "white",
                    color: selectedFilter === filter ? "#3b82f6" : "#6b7280",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    textTransform: "capitalize",
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Add Button */}
            <button
              onClick={() => navigate("/add-supplier")}
              style={{
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.75rem",
                padding: "0.75rem 1.5rem",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
              }}
            >
              <Plus size={18} />
              Add Supplier
            </button>
          </div>
        </div>

        {/* Suppliers Table with Scrollbar */}
        <div
          style={{
            background: "white",
            borderRadius: "1rem",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 380px)", // Adjust height to fit viewport
          }}
        >
          <div style={{ 
            overflowX: "auto", 
            overflowY: "auto",
            flex: 1,
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e1 #f1f5f9",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead style={{ position: "sticky", top: 0, background: "white", zIndex: 10 }}>
                <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                  {[
                    { label: "Vendor ID", icon: Building2 },
                    { label: "Supplier Name", icon: Package },
                    { label: "Location", icon: MapPin },
                    { label: "Email", icon: Mail },
                    { label: "Category", icon: Package },
                    { label: "Status", icon: null },
                    { label: "Actions", icon: null },
                  ].map((head, idx) => (
                    <th
                      key={idx}
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        color: "#4b5563",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        background: "#f9fafb",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {head.icon && <head.icon size={14} />}
                        {head.label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "3rem" }}>
                      <div style={{ display: "inline-block" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            border: "3px solid #e5e7eb",
                            borderTopColor: "#3b82f6",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 1rem",
                          }}
                        />
                        <p style={{ color: "#6b7280" }}>Loading suppliers...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "3rem" }}>
                      <div style={{ textAlign: "center" }}>
                        <Package size={48} style={{ color: "#d1d5db", marginBottom: "1rem" }} />
                        <p style={{ color: "#6b7280", fontSize: "1rem", fontWeight: "500" }}>
                          {suppliers.length === 0 
                            ? "No suppliers found. The API might be returning empty data." 
                            : "No suppliers match your search"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier, idx) => {
                    const status = getEffectiveStatus(supplier);
                    const statusStyle = statusStyles[status] || statusStyles.cancelled;
                    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

                    return (
                      <tr
                        key={supplier.id}
                        style={{
                          borderBottom: "1px solid #f3f4f6",
                          transition: "background 0.3s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f9fafb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <td style={{ padding: "1rem" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: "600",
                              color: "#4b5563",
                            }}
                          >
                            {supplier.supplier_id || supplier.vendor_id || "N/A"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontWeight: "600",
                            color: "#3b82f6",
                          }}
                        >
                          <div
                            onClick={() => navigate(`/suppliers/${supplier.id}`)}
                            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                          >
                            {supplier.supplier_name || supplier.name || "Unnamed Supplier"}
                            <ChevronRight size={14} />
                          </div>
                        </td>
                        <td style={{ padding: "1rem", color: "#6b7280" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <MapPin size={14} />
                            {supplier.location || "—"}
                          </div>
                        </td>
                        <td style={{ padding: "1rem", color: "#6b7280" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Mail size={14} />
                            <span style={{ fontSize: "0.875rem" }}>
                              {supplier.email || "—"}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "1rem", color: "#6b7280" }}>
                          <span
                            style={{
                              background: "#f3f4f6",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "0.375rem",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                            }}
                          >
                            {supplier.supplier_category || supplier.vendor_type || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <span
                            style={{
                              padding: "0.375rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              background: statusStyle.bg,
                              color: statusStyle.text,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.375rem",
                            }}
                          >
                            <span>{statusStyle.icon}</span>
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              onClick={() => navigate(`/edit/suppliers/${supplier.id}`)}
                              style={{
                                padding: "0.5rem",
                                color: "#3b82f6",
                                background: "#eff6ff",
                                border: "none",
                                borderRadius: "0.5rem",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#dbeafe";
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#eff6ff";
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(supplier.id)}
                              style={{
                                padding: "0.5rem",
                                color: "#dc2626",
                                background: "#fee2e2",
                                border: "none",
                                borderRadius: "0.5rem",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#fecaca";
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#fee2e2";
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Custom Scrollbar Styles */}
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            
            /* Custom scrollbar for webkit browsers */
            .supplier-table-container::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            
            .supplier-table-container::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 10px;
            }
            
            .supplier-table-container::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 10px;
            }
            
            .supplier-table-container::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
            
            /* Smooth scrolling */
            div {
              scroll-behavior: smooth;
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default Supplier;