import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const itemsPerPage = 10;

  // Target days for notifications
  const NOTIFICATION_DAYS = [90, 75, 60];

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(location.search);
    const expiringParam = params.get('filter');
    
    if (expiringParam === 'expiring') {
      setFilterExpiring(true);
      setFilterStatus('all'); // Reset status filter
    }
    
    fetchSuppliers();
  }, [location.search]);

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

  // Check if supplier has certifications at exactly 90, 75, or 60 days
  const hasExpiringCertifications = (supplier) => {
    return (
      (supplier.bsci_validity_days_remaining && 
       NOTIFICATION_DAYS.includes(supplier.bsci_validity_days_remaining)) ||
      (supplier.oeko_tex_validity_days_remaining && 
       NOTIFICATION_DAYS.includes(supplier.oeko_tex_validity_days_remaining)) ||
      (supplier.gots_validity_days_remaining && 
       NOTIFICATION_DAYS.includes(supplier.gots_validity_days_remaining)) ||
      (supplier.fire_license_days_remaining && 
       NOTIFICATION_DAYS.includes(supplier.fire_license_days_remaining))
    );
  };

  // Get expiring certifications with their days
  const getExpiringCertifications = (supplier) => {
    const expiring = [];
    
    if (supplier.bsci_validity_days_remaining && 
        NOTIFICATION_DAYS.includes(supplier.bsci_validity_days_remaining)) {
      expiring.push({
        type: "BSCI",
        days: supplier.bsci_validity_days_remaining
      });
    }
    
    if (supplier.oeko_tex_validity_days_remaining && 
        NOTIFICATION_DAYS.includes(supplier.oeko_tex_validity_days_remaining)) {
      expiring.push({
        type: "Oeko-Tex",
        days: supplier.oeko_tex_validity_days_remaining
      });
    }
    
    if (supplier.gots_validity_days_remaining && 
        NOTIFICATION_DAYS.includes(supplier.gots_validity_days_remaining)) {
      expiring.push({
        type: "GOTS",
        days: supplier.gots_validity_days_remaining
      });
    }
    
    if (supplier.fire_license_days_remaining && 
        NOTIFICATION_DAYS.includes(supplier.fire_license_days_remaining)) {
      expiring.push({
        type: "Fire License",
        days: supplier.fire_license_days_remaining
      });
    }
    
    return expiring;
  };

  // Format expiring text
  const getExpiringText = (supplier) => {
    const expiring = getExpiringCertifications(supplier);
    if (expiring.length === 0) return null;
    
    return expiring.map(e => `${e.type} (${e.days}d)`).join(', ');
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!supplier) return false;

    // Apply expiring filter first if active
    if (filterExpiring && !hasExpiringCertifications(supplier)) {
      return false;
    }

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

  // Clear expiring filter
  const clearExpiringFilter = () => {
    setFilterExpiring(false);
    setCurrentPage(1);
    // Update URL to remove filter parameter
    window.history.replaceState({}, '', '/suppliersCSR');
  };

  // Get count of suppliers with expiring certifications
  const expiringCount = suppliers.filter(hasExpiringCertifications).length;

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

      {/* Expiring Filter Banner */}
      {filterExpiring && (
        <div style={expiringBannerStyle}>
          <div style={expiringBannerContent}>
            <span style={expiringBannerIcon}>🔔</span>
            <span>
              <strong>Showing suppliers with certifications at 90, 75, or 60 days remaining</strong> ({expiringCount} found)
            </span>
          </div>
          <button 
            onClick={clearExpiringFilter}
            style={expiringBannerClose}
            onMouseOver={e => e.currentTarget.style.backgroundColor = "#ffecb5"}
            onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            ✕ Clear Filter
          </button>
        </div>
      )}

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
                    setFilterExpiring(false);
                    setCurrentPage(1);
                  }}
                  style={{
                    ...statusFilterButtonStyle,
                    backgroundColor: filterStatus === "all" && !filterExpiring ? colors.primary : colors.lighter,
                    color: filterStatus === "all" && !filterExpiring ? colors.lighter : colors.dark,
                    borderColor: filterStatus === "all" && !filterExpiring ? colors.primary : colors.border,
                  }}
                >
                  All
                </button>
                {Object.entries(statusStyles).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFilterStatus(key);
                      setFilterExpiring(false);
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
              <div style={{...statNumberStyle, color: colors.warning}}>
                {expiringCount}
              </div>
              <div style={statLabelStyle}>Need Attention (90/75/60d)</div>
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
                  {searchTerm || filterStatus !== "all" || filterExpiring
                    ? "No suppliers match your current filters. Try adjusting your search criteria."
                    : "Get started by adding your first supplier to the database."}
                </p>
                {(!searchTerm && filterStatus === "all" && !filterExpiring) && (
                  <Link
                    to="/add-supplierCSR"
                    style={emptyStateButtonStyle}
                  >
                    + Add New Supplier
                  </Link>
                )}
                {(searchTerm || filterStatus !== "all" || filterExpiring) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("all");
                      setFilterExpiring(false);
                      window.history.replaceState({}, '', '/suppliersCSR');
                    }}
                    style={clearFiltersButtonStyle}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div style={tableHeaderStyle}>
                  <span style={{ fontWeight: "600", color: colors.dark }}>
                    Supplier List ({currentItems.length} of {filteredSuppliers.length})
                  </span>
                  {filterExpiring && (
                    <span style={expiringBadgeStyle}>
                      🔔 {filteredSuppliers.length} need attention
                    </span>
                  )}
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
                        <th style={tableHeaderCellStyle}>Expiring Certifications</th>
                        <th style={tableHeaderCellStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((supplier, index) => {
                        const statusKey = getEffectiveStatus(supplier);
                        const statusInfo = statusStyles[statusKey] || statusStyles.unknown;
                        const expiring = hasExpiringCertifications(supplier);
                        const expiringText = getExpiringText(supplier);
                        const expiringCerts = getExpiringCertifications(supplier);

                        return (
                          <tr 
                            key={supplier.id} 
                            style={{
                              ...tableRowStyle,
                              backgroundColor: index % 2 === 0 ? colors.lighter : colors.light,
                              ...(expiring ? { borderLeft: `4px solid ${colors.warning}` } : {})
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
                              {expiring ? (
                                <div style={expiringDetailsStyle}>
                                  {expiringCerts.map((cert, idx) => (
                                    <div 
                                      key={idx}
                                      style={{
                                        ...expiringBadgeSmallStyle,
                                        backgroundColor: getDayColor(cert.days),
                                      }}
                                    >
                                      {cert.type}: {cert.days}d
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: colors.muted, fontSize: "0.8rem" }}>—</span>
                              )}
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

// Helper function to get color based on days
const getDayColor = (days) => {
  switch(days) {
    case 60:
      return "#fd7e14"; // Orange
    case 75:
      return "#ffc107"; // Yellow
    case 90:
      return "#17a2b8"; // Teal
    default:
      return "#6c757d"; // Gray
  }
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
  outline: "none",
  ":focus": {
    borderColor: colors.primary,
    boxShadow: `0 0 0 3px ${colors.primaryLight}`,
  },
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
  ":hover": {
    transform: "translateY(-2px)",
    boxShadow: `0 4px 12px ${colors.shadowHover}`,
  },
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

const clearFiltersButtonStyle = {
  display: "inline-block",
  padding: "0.9rem 2rem",
  backgroundColor: colors.gray,
  color: "white",
  textDecoration: "none",
  borderRadius: "10px",
  fontWeight: "600",
  fontSize: "0.95rem",
  border: "none",
  cursor: "pointer",
  transition: "all 0.3s",
  ":hover": {
    backgroundColor: colors.dark,
    transform: "translateY(-2px)",
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

// Expiring banner styles
const expiringBannerStyle = {
  backgroundColor: "#fff3cd",
  border: "1px solid #ffeaa7",
  borderRadius: "12px",
  padding: "1rem 1.5rem",
  marginBottom: "1.5rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "1rem",
};

const expiringBannerContent = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  color: "#856404",
  fontSize: "0.95rem",
};

const expiringBannerIcon = {
  fontSize: "1.25rem",
};

const expiringBannerClose = {
  padding: "0.5rem 1rem",
  backgroundColor: "transparent",
  color: "#856404",
  border: "1px solid #ffeaa7",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: "500",
  transition: "all 0.2s ease",
};

const expiringBadgeStyle = {
  backgroundColor: "#fd7e14",
  color: "white",
  padding: "0.25rem 0.75rem",
  borderRadius: "20px",
  fontSize: "0.75rem",
  fontWeight: "600",
};

const expiringBadgeSmallStyle = {
  padding: "0.2rem 0.5rem",
  borderRadius: "4px",
  fontSize: "0.7rem",
  fontWeight: "600",
  display: "inline-block",
  margin: "0.2rem",
  color: "white",
};

const expiringDetailsStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.25rem",
};

// Add CSS animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

export default SupplierListCSR;