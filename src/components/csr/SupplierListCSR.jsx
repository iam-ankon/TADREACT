import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSuppliers, deleteSupplier } from "../../api/supplierApi";

const colors = {
  primary: "#3b82f6",
  primaryLight: "#eff6ff",
  primaryDark: "#1d4ed8",
  success: "#10b981",
  successLight: "#d1fae5",
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  info: "#0ea5e9",
  muted: "#9ca3af",
  light: "#f8fafc",
  lighter: "#ffffff",
  dark: "#1f2937",
  darker: "#111827",
  border: "#e5e7eb",
  borderLight: "#f3f4f6",
  gray: "#6b7280",
  grayLight: "#f9fafb",
  shadow: "rgba(0, 0, 0, 0.08)",
  shadowHover: "rgba(0, 0, 0, 0.12)",
};

const statusStyles = {
  active: { 
    bg: "#d1fae5", 
    text: "#065f46", 
    border: "#a7f3d0",
    label: "Active",
    icon: "🟢"
  },
  valid: { 
    bg: "#d1fae5", 
    text: "#065f46", 
    border: "#a7f3d0",
    label: "Valid",
    icon: "✅"
  },
  pending: { 
    bg: "#fef3c7", 
    text: "#92400e", 
    border: "#fde68a",
    label: "Pending",
    icon: "⏳"
  },
  "in progress": { 
    bg: "#fef3c7", 
    text: "#92400e", 
    border: "#fde68a",
    label: "In Progress",
    icon: "🔄"
  },
  expired: { 
    bg: "#fee2e2", 
    text: "#991b1b", 
    border: "#fecaca",
    label: "Expired",
    icon: "⏰"
  },
  invalid: { 
    bg: "#fee2e2", 
    text: "#991b1b", 
    border: "#fecaca",
    label: "Invalid",
    icon: "❌"
  },
  cancelled: { 
    bg: "#f3f4f6", 
    text: "#374151", 
    border: "#e5e7eb",
    label: "Cancelled",
    icon: "🚫"
  },
  unknown: { 
    bg: "#f3f4f6", 
    text: "#374151", 
    border: "#e5e7eb",
    label: "Unknown",
    icon: "❓"
  },
};

const SupplierListCSR = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await getSuppliers();
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      alert("Failed to load suppliers");
    } finally {
      setLoading(false);
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

    const name = (supplier.supplier_name || supplier.name || "").toLowerCase();
    const vendorId = (supplier.supplier_id || supplier.vendor_id || "").toLowerCase();
    const email = (supplier.email || "").toLowerCase();
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !search ||
      name.includes(search) ||
      vendorId.includes(search) ||
      email.includes(search);

    const status = getEffectiveStatus(supplier);
    const matchesStatus = filterStatus === "all" || status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;

    try {
      setDeletingId(id);
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      alert("Supplier deleted successfully");
    } catch (error) {
      console.error("Error deleting supplier:", error);
      alert("Failed to delete supplier");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Suppliers</h1>
          <p style={subtitleStyle}>
            Manage your supplier database ({suppliers.length} total)
          </p>
        </div>

        <Link
          to="/add-supplierCSR"
          style={addButtonStyle}
          onMouseOver={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.25)"}
          onMouseOut={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(16, 185, 129, 0.2)"}
        >
          <span style={{ fontSize: "1.2rem", marginRight: "8px" }}>+</span>
          Add New Supplier
        </Link>
      </div>

      {loading ? (
        <div style={loadingContainerStyle}>
          <div style={spinnerStyle} />
          <p style={{ fontSize: "1.1rem", color: colors.gray, marginTop: "20px" }}>
            Loading suppliers...
          </p>
        </div>
      ) : (
        <>
          {/* Filters Card */}
          <div style={filtersCardStyle}>
            <div style={searchContainerStyle}>
              <span style={searchIconStyle}>🔍</span>
              <input
                type="text"
                placeholder="Search by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={searchInputStyle}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={clearSearchStyle}
                >
                  ×
                </button>
              )}
            </div>

            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>Status Filter</label>
              <div style={statusFilterContainerStyle}>
                <button
                  onClick={() => {
                    setFilterStatus("all");
                    setCurrentPage(1);
                  }}
                  style={{
                    ...statusFilterButtonStyle,
                    backgroundColor: filterStatus === "all" ? colors.primary : colors.lighter,
                    color: filterStatus === "all" ? colors.lighter : colors.dark,
                    borderColor: filterStatus === "all" ? colors.primary : colors.border,
                  }}
                >
                  All
                </button>
                {Object.entries(statusStyles).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFilterStatus(key);
                      setCurrentPage(1);
                    }}
                    style={{
                      ...statusFilterButtonStyle,
                      backgroundColor: filterStatus === key ? value.bg : colors.lighter,
                      color: filterStatus === key ? value.text : colors.dark,
                      borderColor: filterStatus === key ? value.border : colors.border,
                    }}
                  >
                    <span style={{ marginRight: "6px" }}>{value.icon}</span>
                    {value.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div style={statsContainerStyle}>
            <div style={statCardStyle}>
              <div style={statNumberStyle}>{suppliers.length}</div>
              <div style={statLabelStyle}>Total Suppliers</div>
            </div>
            <div style={statCardStyle}>
              <div style={statNumberStyle}>{filteredSuppliers.length}</div>
              <div style={statLabelStyle}>Filtered Results</div>
            </div>
            <div style={statCardStyle}>
              <div style={{...statNumberStyle, color: colors.success}}>
                {suppliers.filter(s => getEffectiveStatus(s) === 'active' || getEffectiveStatus(s) === 'valid').length}
              </div>
              <div style={statLabelStyle}>Active Suppliers</div>
            </div>
          </div>

          {/* Table Card */}
          <div style={tableCardStyle}>
            {filteredSuppliers.length === 0 ? (
              <div style={emptyStateStyle}>
                <div style={{ fontSize: "4rem", marginBottom: "1.5rem", opacity: 0.7 }}>📭</div>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "0.75rem", color: colors.darker }}>
                  No suppliers found
                </h3>
                <p style={{ marginBottom: "2rem", color: colors.gray, maxWidth: "400px" }}>
                  {searchTerm || filterStatus !== "all"
                    ? "No suppliers match your search criteria. Try adjusting your filters."
                    : "Get started by adding your first supplier to the database."}
                </p>
                {(!searchTerm && filterStatus === "all") && (
                  <Link
                    to="/add-supplierCSR"
                    style={emptyStateButtonStyle}
                  >
                    + Add New Supplier
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div style={tableHeaderStyle}>
                  <span style={{ fontWeight: "600", color: colors.dark }}>
                    Supplier List ({currentItems.length} of {filteredSuppliers.length})
                  </span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={tableHeaderCellStyle}>#</th>
                        <th style={tableHeaderCellStyle}>Factory Name</th>
                        <th style={tableHeaderCellStyle}>Location</th>
                        <th style={tableHeaderCellStyle}>Category</th>
                        <th style={tableHeaderCellStyle}>Status</th>
                        <th style={tableHeaderCellStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((supplier, index) => {
                        const statusKey = getEffectiveStatus(supplier);
                        const statusInfo = statusStyles[statusKey] || statusStyles.unknown;

                        return (
                          <tr 
                            key={supplier.id} 
                            style={{
                              ...tableRowStyle,
                              backgroundColor: index % 2 === 0 ? colors.lighter : colors.light
                            }}
                          >
                            <td style={tableCellStyle}>
                              <div style={slNoStyle}>
                                {supplier.supplier_sl_no || supplier.sl_no || indexOfFirstItem + index + 1}
                              </div>
                            </td>
                            <td style={tableCellStyle}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <Link
                                  to={`/suppliersCSR/${supplier.id}`}
                                  style={supplierNameStyle}
                                >
                                  {supplier.supplier_name || supplier.name || "Unnamed Supplier"}
                                </Link>
                                {supplier.email && (
                                  <span style={supplierEmailStyle}>{supplier.email}</span>
                                )}
                              </div>
                            </td>
                            <td style={tableCellStyle}>
                              <div style={locationStyle}>
                                <span style={{ marginRight: "6px" }}>📍</span>
                                {supplier.location || "—"}
                              </div>
                            </td>
                            <td style={tableCellStyle}>
                              <span style={categoryBadgeStyle}>
                                {supplier.supplier_category || "—"}
                              </span>
                            </td>
                            <td style={tableCellStyle}>
                              <div style={{
                                ...statusBadgeStyle,
                                backgroundColor: statusInfo.bg,
                                color: statusInfo.text,
                                borderColor: statusInfo.border,
                              }}>
                                <span style={{ marginRight: "6px" }}>{statusInfo.icon}</span>
                                {statusInfo.label}
                              </div>
                            </td>
                            <td style={tableCellStyle}>
                              <div style={actionButtonsStyle}>
                                <Link
                                  to={`/edit-supplier/${supplier.id}`}
                                  style={editButtonStyle}
                                >
                                  <span style={{ marginRight: "6px" }}>✏️</span>
                                  Edit
                                </Link>
                                <button
                                  onClick={() => handleDelete(supplier.id)}
                                  disabled={deletingId === supplier.id}
                                  style={{
                                    ...deleteButtonStyle,
                                    opacity: deletingId === supplier.id ? 0.7 : 1,
                                  }}
                                >
                                  {deletingId === supplier.id ? (
                                    "Deleting..."
                                  ) : (
                                    <>
                                      <span style={{ marginRight: "6px" }}>🗑️</span>
                                      Delete
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {filteredSuppliers.length > 0 && (
            <div style={paginationContainerStyle}>
              <div style={paginationInfoStyle}>
                Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredSuppliers.length)} of {filteredSuppliers.length} suppliers
              </div>
              
              <div style={paginationControlsStyle}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    ...paginationButtonStyle,
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Previous
                </button>

                <div style={pageNumbersStyle}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          ...paginationButtonStyle,
                          backgroundColor: currentPage === page ? colors.primary : "white",
                          color: currentPage === page ? "white" : colors.primary,
                          borderColor: currentPage === page ? colors.primary : colors.border,
                        }}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span style={{ color: colors.gray, padding: "0 8px" }}>...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        style={paginationButtonStyle}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    ...paginationButtonStyle,
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Enhanced Styles
const containerStyle = {
  padding: "3rem 5rem",
  backgroundColor: colors.light,
  minHeight: "100vh",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "2rem",
  flexWrap: "wrap",
  gap: "1.5rem",
};

const titleStyle = {
  fontSize: "2.5rem",
  fontWeight: "700",
  color: colors.darker,
  margin: "0 0 8px 0",
  letterSpacing: "-0.025em",
  background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const subtitleStyle = {
  fontSize: "1rem",
  color: colors.gray,
  margin: 0,
};

const addButtonStyle = {
  padding: "0.9rem 1.8rem",
  backgroundColor: colors.success,
  color: "white",
  textDecoration: "none",
  borderRadius: "10px",
  fontWeight: "600",
  fontSize: "0.95rem",
  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  border: "none",
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
};

const loadingContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "60vh",
};

const spinnerStyle = {
  width: "56px",
  height: "56px",
  border: "4px solid #e5e7eb",
  borderTopColor: colors.primary,
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const filtersCardStyle = {
  backgroundColor: colors.lighter,
  padding: "1.5rem",
  borderRadius: "16px",
  boxShadow: `0 4px 12px ${colors.shadow}`,
  marginBottom: "1.5rem",
  border: `1px solid ${colors.border}`,
};

const searchContainerStyle = {
  position: "relative",
  marginBottom: "1.25rem",
};

const searchIconStyle = {
  position: "absolute",
  left: "1rem",
  top: "50%",
  transform: "translateY(-50%)",
  color: colors.muted,
  fontSize: "1.1rem",
  zIndex: 1,
};

const searchInputStyle = {
  width: "100%",
  padding: "0.9rem 1rem 0.9rem 3rem",
  border: `1px solid ${colors.border}`,
  borderRadius: "10px",
  fontSize: "0.95rem",
  transition: "all 0.3s",
  backgroundColor: colors.lighter,
  boxShadow: `0 1px 2px ${colors.shadow}`,
};

const clearSearchStyle = {
  position: "absolute",
  right: "1rem",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  fontSize: "1.5rem",
  color: colors.gray,
  cursor: "pointer",
  padding: "0",
  width: "24px",
  height: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const filterGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const filterLabelStyle = {
  fontWeight: "600",
  color: colors.dark,
  fontSize: "0.9rem",
};

const statusFilterContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
};

const statusFilterButtonStyle = {
  padding: "0.6rem 1rem",
  borderRadius: "8px",
  border: `1px solid ${colors.border}`,
  fontSize: "0.85rem",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  whiteSpace: "nowrap",
};

const statsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "1rem",
  marginBottom: "1.5rem",
};

const statCardStyle = {
  backgroundColor: colors.lighter,
  padding: "1.25rem",
  borderRadius: "12px",
  boxShadow: `0 2px 8px ${colors.shadow}`,
  border: `1px solid ${colors.borderLight}`,
  textAlign: "center",
  transition: "transform 0.2s",
  cursor: "default",
};

const statNumberStyle = {
  fontSize: "2rem",
  fontWeight: "700",
  color: colors.primary,
  marginBottom: "0.5rem",
};

const statLabelStyle = {
  fontSize: "0.9rem",
  color: colors.gray,
  fontWeight: "500",
};

const tableCardStyle = {
  backgroundColor: colors.lighter,
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: `0 6px 20px ${colors.shadow}`,
  border: `1px solid ${colors.border}`,
  marginBottom: "2rem",
};

const tableHeaderStyle = {
  padding: "1.25rem 1.5rem",
  backgroundColor: colors.grayLight,
  borderBottom: `2px solid ${colors.border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const tableHeaderCellStyle = {
  padding: "1.25rem 1.5rem",
  backgroundColor: colors.grayLight,
  textAlign: "left",
  fontSize: "0.8rem",
  fontWeight: "600",
  color: colors.gray,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: `2px solid ${colors.border}`,
};

const tableRowStyle = {
  transition: "all 0.2s ease",
  ":hover": {
    backgroundColor: `${colors.primaryLight} !important`,
    transform: "translateY(-1px)",
    boxShadow: `0 2px 8px ${colors.shadowHover}`,
  },
};

const tableCellStyle = {
  padding: "1.25rem 1.5rem",
  fontSize: "0.925rem",
  color: colors.dark,
  borderBottom: `1px solid ${colors.borderLight}`,
};

const slNoStyle = {
  fontWeight: "600",
  color: colors.primary,
  backgroundColor: colors.primaryLight,
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto",
};

const supplierNameStyle = {
  color: colors.primaryDark,
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "1rem",
  transition: "all 0.2s",
  ":hover": {
    color: colors.primary,
    textDecoration: "underline",
  },
};

const supplierEmailStyle = {
  fontSize: "0.8rem",
  color: colors.gray,
  marginTop: "4px",
};

const locationStyle = {
  display: "flex",
  alignItems: "center",
  fontSize: "0.9rem",
  color: colors.dark,
};

const categoryBadgeStyle = {
  display: "inline-block",
  padding: "0.3rem 0.8rem",
  backgroundColor: colors.light,
  color: colors.dark,
  borderRadius: "6px",
  fontSize: "0.85rem",
  fontWeight: "500",
  border: `1px solid ${colors.border}`,
};

const statusBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.4rem 0.9rem",
  borderRadius: "9999px",
  fontSize: "0.8rem",
  fontWeight: "600",
  whiteSpace: "nowrap",
  border: "1px solid",
  transition: "all 0.2s",
};

const actionButtonsStyle = {
  display: "flex",
  gap: "0.75rem",
};

const editButtonStyle = {
  padding: "0.5rem 1rem",
  backgroundColor: colors.primaryLight,
  color: colors.primaryDark,
  border: `1px solid #bfdbfe`,
  borderRadius: "8px",
  fontSize: "0.85rem",
  fontWeight: "500",
  textDecoration: "none",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  ":hover": {
    backgroundColor: colors.primary,
    color: "white",
    transform: "translateY(-1px)",
  },
};

const deleteButtonStyle = {
  padding: "0.5rem 1rem",
  backgroundColor: colors.dangerLight,
  color: colors.danger,
  border: `1px solid #fecaca`,
  borderRadius: "8px",
  fontSize: "0.85rem",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  ":hover": {
    backgroundColor: colors.danger,
    color: "white",
    transform: "translateY(-1px)",
  },
};

const emptyStateStyle = {
  padding: "5rem 2rem",
  textAlign: "center",
};

const emptyStateButtonStyle = {
  display: "inline-block",
  padding: "0.9rem 2rem",
  backgroundColor: colors.primary,
  color: "white",
  textDecoration: "none",
  borderRadius: "10px",
  fontWeight: "600",
  fontSize: "0.95rem",
  boxShadow: `0 2px 8px ${colors.shadow}`,
  transition: "all 0.3s",
  ":hover": {
    backgroundColor: colors.primaryDark,
    transform: "translateY(-2px)",
    boxShadow: `0 4px 12px ${colors.shadowHover}`,
  },
};

const paginationContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1.25rem",
  color: colors.gray,
  fontSize: "0.9rem",
};

const paginationInfoStyle = {
  fontWeight: "500",
  color: colors.dark,
  backgroundColor: colors.lighter,
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  boxShadow: `0 1px 3px ${colors.shadow}`,
  border: `1px solid ${colors.border}`,
};

const paginationControlsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
  justifyContent: "center",
};

const pageNumbersStyle = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
};

const paginationButtonStyle = {
  minWidth: "40px",
  height: "40px",
  padding: "0 1rem",
  borderRadius: "8px",
  border: `1px solid ${colors.border}`,
  backgroundColor: "white",
  color: colors.primary,
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  ":hover": {
    backgroundColor: colors.primaryLight,
    transform: "translateY(-1px)",
  },
};

export default SupplierListCSR;