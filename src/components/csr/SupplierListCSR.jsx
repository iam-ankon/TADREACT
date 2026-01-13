import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSuppliers, deleteSupplier } from "../../api/supplierApi";

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
      // Ensure response.data is an array
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      alert("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!supplier) return false;
    
    // Use safe property access with optional chaining and nullish coalescing
    const name = supplier.supplier_name || supplier.name || "";
    const vendorId = supplier.supplier_id || supplier.vendor_id || "";
    const email = supplier.email || "";
    
    const matchesSearch = searchTerm.trim() === "" || 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Use the supplier's status or default to "active"
    const status = supplier.bsci_status || supplier.sedex_status || supplier.agreement_status || "active";
    const matchesStatus = filterStatus === "all" || status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await deleteSupplier(id);
        setSuppliers(suppliers.filter((s) => s.id !== id));
        alert("Supplier deleted successfully");
      } catch (error) {
        console.error("Error deleting supplier:", error);
        alert("Failed to delete supplier");
      }
    }
  };

  const getStatusColor = (status) => {
    if (!status) return "#e2e3e5";
    
    switch (status.toLowerCase()) {
      case "active":
      case "valid":
        return "#d4edda";
      case "pending":
      case "in progress":
        return "#fff3cd";
      case "expired":
      case "invalid":
        return "#f8d7da";
      case "cancelled":
        return "#e2e3e5";
      default:
        return "#e2e3e5";
    }
  };

  const getStatusTextColor = (status) => {
    if (!status) return "#383d41";
    
    switch (status.toLowerCase()) {
      case "active":
      case "valid":
        return "#155724";
      case "pending":
      case "in progress":
        return "#856404";
      case "expired":
      case "invalid":
        return "#721c24";
      case "cancelled":
        return "#383d41";
      default:
        return "#383d41";
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Suppliers</h1>
        <Link to="/add-supplierCSR" style={styles.addButton}>
          + Add New Supplier
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          Loading suppliers...
        </div>
      )}

      {/* Filters and Search - Only show when not loading */}
      {!loading && (
        <>
          <div style={styles.filters}>
            <div style={styles.searchBox}>
              <input
                type="text"
                placeholder="Search by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <span style={styles.searchIcon}>🔍</span>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Filter by Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={styles.filterSelect}
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

          {/* Suppliers Table */}
          <div style={styles.tableContainer}>
            {filteredSuppliers.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>📭</div>
                <h3>No suppliers found</h3>
                <p>
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter"
                    : "Add your first supplier to get started"}
                </p>
                {!searchTerm && filterStatus === "all" && (
                  <Link to="/add-supplierCSR" style={styles.addButton}>
                    + Add New Supplier
                  </Link>
                )}
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.tableHeaderCell}>SL NO</th>
                    <th style={styles.tableHeaderCell}>Factory Name</th>
                    <th style={styles.tableHeaderCell}>Location</th>
                    <th style={styles.tableHeaderCell}>Category</th>
                    <th style={styles.tableHeaderCell}>Status</th>
                    <th style={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSuppliers.map((supplier) => (
                    <tr key={supplier.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>
                        {supplier.supplier_sl_no || supplier.sl_no || "N/A"}
                      </td>
                      <td style={styles.tableCell}>
                        <Link 
                          to={`/suppliersCSR/${supplier.id}`} 
                          style={styles.link}
                        >
                          {supplier.supplier_name || supplier.name || "Unnamed Supplier"}
                        </Link>
                      </td>
                      <td style={styles.tableCell}>
                        {supplier.location || "N/A"}
                      </td>
                      <td style={styles.tableCell}>
                        {supplier.supplier_category || "N/A"}
                      </td>
                      <td style={styles.tableCell}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: getStatusColor(
                              supplier.bsci_status || supplier.sedex_status
                            ),
                            color: getStatusTextColor(
                              supplier.bsci_status || supplier.sedex_status
                            ),
                          }}
                        >
                          {(supplier.bsci_status || supplier.sedex_status || "Unknown")
                            .charAt(0)
                            .toUpperCase() +
                            (supplier.bsci_status || supplier.sedex_status || "Unknown")
                              .slice(1)}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.actionButtons}>
                          <Link
                            to={`/edit-supplier/${supplier.id}`}
                            style={styles.editButton}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            style={styles.deleteButton}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredSuppliers.length > 0 && totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  ...styles.pageButton,
                  ...(currentPage === 1 ? styles.disabledButton : {}),
                }}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    ...styles.pageButton,
                    ...(currentPage === page ? styles.activePageButton : {}),
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                style={{
                  ...styles.pageButton,
                  ...(currentPage === totalPages ? styles.disabledButton : {}),
                }}
              >
                Next
              </button>
            </div>
          )}

          {/* Summary */}
          {!loading && filteredSuppliers.length > 0 && (
            <div style={styles.summary}>
              <p>
                Showing {currentSuppliers.length} of {filteredSuppliers.length}{" "}
                suppliers (Page {currentPage} of {totalPages})
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
const styles = {
  container: {
    padding: "2rem",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#2c3e50",
    margin: 0,
  },
  addButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#28a745",
    color: "white",
    textDecoration: "none",
    borderRadius: "4px",
    fontWeight: "500",
    transition: "background-color 0.3s",
  },
  filters: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    gap: "1rem",
    flexWrap: "wrap",
  },
  searchBox: {
    position: "relative",
    flex: 1,
    maxWidth: "400px",
  },
  searchInput: {
    width: "100%",
    padding: "0.75rem 2.5rem 0.75rem 1rem",
    border: "1px solid #ced4da",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  searchIcon: {
    position: "absolute",
    right: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#6c757d",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  filterLabel: {
    fontWeight: "500",
    color: "#495057",
  },
  filterSelect: {
    padding: "0.5rem",
    border: "1px solid #ced4da",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    overflow: "hidden",
    marginBottom: "2rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    backgroundColor: "#f8f9fa",
    borderBottom: "2px solid #dee2e6",
  },
  tableHeaderCell: {
    padding: "1rem",
    textAlign: "left",
    fontWeight: "600",
    color: "#495057",
    borderBottom: "1px solid #dee2e6",
  },
  tableRow: {
    borderBottom: "1px solid #e9ecef",
    transition: "background-color 0.2s",
  },
  tableRowHover: {
    backgroundColor: "#f8f9fa",
  },
  tableCell: {
    padding: "1rem",
    textAlign: "left",
    color: "#212529",
  },
  ratingBadge: {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    borderRadius: "12px",
    fontWeight: "500",
    fontSize: "0.875rem",
  },
  statusBadge: {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontWeight: "500",
    fontSize: "0.875rem",
  },
  actionButtons: {
    display: "flex",
    gap: "0.5rem",
  },
  editButton: {
    padding: "0.25rem 0.75rem",
    backgroundColor: "#17a2b8",
    color: "white",
    textDecoration: "none",
    borderRadius: "4px",
    fontSize: "0.875rem",
  },
  deleteButton: {
    padding: "0.25rem 0.75rem",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "2rem",
  },
  pageButton: {
    padding: "0.5rem 1rem",
    border: "1px solid #dee2e6",
    backgroundColor: "white",
    color: "#007bff",
    cursor: "pointer",
    borderRadius: "4px",
    transition: "all 0.3s",
  },
  activePageButton: {
    backgroundColor: "#007bff",
    color: "white",
    borderColor: "#007bff",
  },
  disabledButton: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  summary: {
    textAlign: "center",
    color: "#6c757d",
    fontSize: "0.875rem",
  },
};

export default SupplierListCSR;
