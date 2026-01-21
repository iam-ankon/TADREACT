import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSuppliers, deleteSupplier } from "../../api/supplierApi";

const colors = {
  primary: "#0066cc",
  primaryDark: "#0052a3",
  success: "#059669",
  danger: "#dc2626",
  warning: "#d97706",
  info: "#0891b2",
  light: "#f9fafb",
  dark: "#111827",
  gray: "#6b7280",
  muted: "#9ca3af",
  border: "#d1d5db",
};

const statusStyles = {
  active: { bg: "#ecfdf5", text: "#065f46", label: "Active" },
  valid: { bg: "#ecfdf5", text: "#065f46", label: "Valid" },
  pending: { bg: "#fffbeb", text: "#92400e", label: "Pending" },
  "in progress": { bg: "#fffbeb", text: "#92400e", label: "In Progress" },
  expired: { bg: "#fef2f2", text: "#991b1b", label: "Expired" },
  invalid: { bg: "#fef2f2", text: "#991b1b", label: "Invalid" },
  cancelled: { bg: "#f3f4f6", text: "#374151", label: "Cancelled" },
  unknown: { bg: "#f3f4f6", text: "#374151", label: "Unknown" },
};

const SupplierListCSR = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
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
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      alert("Supplier deleted successfully");
    } catch (error) {
      console.error("Error deleting supplier:", error);
      alert("Failed to delete supplier");
    }
  };

  return (
    <div style={{
      padding: "2rem 1.5rem",
      backgroundColor: "#f9fafb",
      minHeight: "100vh",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2.5rem",
        flexWrap: "wrap",
        gap: "1.25rem",
      }}>
        <h1 style={{
          fontSize: "2.25rem",
          fontWeight: "700",
          color: colors.dark,
          margin: 0,
          letterSpacing: "-0.025em",
        }}>
          Suppliers
        </h1>

        <Link
          to="/add-supplierCSR"
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: colors.success,
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "0.95rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            transition: "all 0.2s",
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = "#047857"}
          onMouseOut={e => e.currentTarget.style.backgroundColor = colors.success}
        >
          + Add New Supplier
        </Link>
      </div>

      {loading ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          color: colors.gray,
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            border: "5px solid #e5e7eb",
            borderTopColor: colors.primary,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "1.5rem",
          }} />
          <p style={{ fontSize: "1.1rem" }}>Loading suppliers...</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div style={{
            backgroundColor: "white",
            padding: "1.25rem",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            marginBottom: "2rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "1.25rem",
            alignItems: "center",
          }}>
            <div style={{ position: "relative", flex: "1", minWidth: "260px" }}>
              <input
                type="text"
                placeholder="Search by name, ID or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.8rem 1rem 0.8rem 3rem",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  transition: "all 0.2s",
                }}
              />
              <span style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: colors.muted,
                fontSize: "1.2rem",
              }}>
                🔍
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <label style={{ fontWeight: "500", color: colors.gray, whiteSpace: "nowrap" }}>
                Status:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.7rem 1rem",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  backgroundColor: "white",
                  fontSize: "0.95rem",
                  minWidth: "160px",
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="valid">Valid</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table / Content Area */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            border: `1px solid ${colors.border}`,
          }}>
            {filteredSuppliers.length === 0 ? (
              <div style={{
                padding: "4rem 2rem",
                textAlign: "center",
                color: colors.gray,
              }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>📭</div>
                <h3 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", color: colors.dark }}>
                  No suppliers found
                </h3>
                <p style={{ marginBottom: "1.5rem" }}>
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter"
                    : "Get started by adding your first supplier"}
                </p>
                {(!searchTerm && filterStatus === "all") && (
                  <Link
                    to="/add-supplierCSR"
                    style={{
                      display: "inline-block",
                      padding: "0.8rem 1.6rem",
                      backgroundColor: colors.primary,
                      color: "white",
                      textDecoration: "none",
                      borderRadius: "8px",
                      fontWeight: "600",
                    }}
                  >
                    + Add New Supplier
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>SL NO</th>
                      <th style={tableHeaderStyle}>Factory Name</th>
                      <th style={tableHeaderStyle}>Location</th>
                      <th style={tableHeaderStyle}>Category</th>
                      <th style={tableHeaderStyle}>Status</th>
                      <th style={tableHeaderStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((supplier) => {
                      const statusKey = getEffectiveStatus(supplier);
                      const statusInfo = statusStyles[statusKey] || statusStyles.unknown;

                      return (
                        <tr key={supplier.id} style={tableRowStyle}>
                          <td style={tableCellStyle}>
                            {supplier.supplier_sl_no || supplier.sl_no || "—"}
                          </td>
                          <td style={tableCellStyle}>
                            <Link
                              to={`/suppliersCSR/${supplier.id}`}
                              style={{
                                color: colors.primary,
                                textDecoration: "none",
                                fontWeight: "500",
                              }}
                            >
                              {supplier.supplier_name || supplier.name || "Unnamed Supplier"}
                            </Link>
                          </td>
                          <td style={tableCellStyle}>
                            {supplier.location || "—"}
                          </td>
                          <td style={tableCellStyle}>
                            {supplier.supplier_category || "—"}
                          </td>
                          <td style={tableCellStyle}>
                            <span style={{
                              ...statusBadgeBase,
                              backgroundColor: statusInfo.bg,
                              color: statusInfo.text,
                            }}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td style={tableCellStyle}>
                            <div style={{ display: "flex", gap: "0.6rem" }}>
                              <Link
                                to={`/edit-supplier/${supplier.id}`}
                                style={editButtonStyle}
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(supplier.id)}
                                style={deleteButtonStyle}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination + Summary */}
          {filteredSuppliers.length > 0 && (
            <div style={{
              marginTop: "2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.25rem",
              color: colors.gray,
              fontSize: "0.9rem",
            }}>
              <div style={paginationContainerStyle}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    ...paginationButtonStyle,
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    ...paginationButtonStyle,
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
              </div>

              <div>
                Showing {currentItems.length} of {filteredSuppliers.length} suppliers
                {" • "} Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const tableHeaderStyle = {
  padding: "1.1rem 1.25rem",
  backgroundColor: "#f9fafb",
  textAlign: "left",
  fontSize: "0.82rem",
  fontWeight: "600",
  color: "#4b5563",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "2px solid #e5e7eb",
};

const tableCellStyle = {
  padding: "1.1rem 1.25rem",
  fontSize: "0.925rem",
  color: "#1f2937",
  borderBottom: "1px solid #f3f4f6",
};

const tableRowStyle = {
  transition: "background-color 0.15s",
  backgroundColor: "white",
  ":hover": { backgroundColor: "#f8fafc" },
};

const statusBadgeBase = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.35em 0.9em",
  borderRadius: "9999px",
  fontSize: "0.8rem",
  fontWeight: "600",
  whiteSpace: "nowrap",
};

const editButtonStyle = {
  padding: "0.4rem 1rem",
  backgroundColor: "#eff6ff",
  color: colors.primary,
  border: `1px solid #bfdbfe`,
  borderRadius: "6px",
  fontSize: "0.85rem",
  fontWeight: "500",
  textDecoration: "none",
  transition: "all 0.2s",
};

const deleteButtonStyle = {
  padding: "0.4rem 1rem",
  backgroundColor: "#fee2e2",
  color: colors.danger,
  border: `1px solid #fecaca`,
  borderRadius: "6px",
  fontSize: "0.85rem",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
};

const paginationContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "0.5rem",
};

const paginationButtonStyle = {
  minWidth: "38px",
  height: "38px",
  padding: "0 0.9rem",
  borderRadius: "8px",
  border: `1px solid ${colors.border}`,
  backgroundColor: "white",
  color: colors.primary,
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
};

export default SupplierListCSR;