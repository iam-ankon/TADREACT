import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getSuppliers, deleteSupplier } from "../../api/supplierApi";

// Enhanced color system with better contrast and professional palette
const colors = {
  primary: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
  },
  secondary: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  danger: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
  info: {
    50: "#ecfeff",
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4",
    600: "#0891b2",
    700: "#0e7490",
    800: "#155e75",
    900: "#164e63",
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
};

// Enhanced status styles with better visual indicators
const statusStyles = {
  active: {
    bg: colors.success[50],
    text: colors.success[700],
    border: colors.success[200],
    label: "Active",
    icon: "●",
    dot: colors.success[500],
  },
  valid: {
    bg: colors.success[50],
    text: colors.success[700],
    border: colors.success[200],
    label: "Valid",
    icon: "✓",
    dot: colors.success[500],
  },
  pending: {
    bg: colors.warning[50],
    text: colors.warning[700],
    border: colors.warning[200],
    label: "Pending",
    icon: "○",
    dot: colors.warning[500],
  },
  "in progress": {
    bg: colors.info[50],
    text: colors.info[700],
    border: colors.info[200],
    label: "In Progress",
    icon: "◔",
    dot: colors.info[500],
  },
  expired: {
    bg: colors.danger[50],
    text: colors.danger[700],
    border: colors.danger[200],
    label: "Expired",
    icon: "✕",
    dot: colors.danger[500],
  },
  invalid: {
    bg: colors.danger[50],
    text: colors.danger[700],
    border: colors.danger[200],
    label: "Invalid",
    icon: "✕",
    dot: colors.danger[500],
  },
  cancelled: {
    bg: colors.gray[100],
    text: colors.gray[700],
    border: colors.gray[300],
    label: "Cancelled",
    icon: "−",
    dot: colors.gray[500],
  },
  unknown: {
    bg: colors.gray[100],
    text: colors.gray[700],
    border: colors.gray[300],
    label: "Unknown",
    icon: "?",
    dot: colors.gray[500],
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
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const itemsPerPage = 10;

  const NOTIFICATION_DAYS = [90, 75, 60];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const expiringParam = params.get('filter');
    
    if (expiringParam === 'expiring') {
      setFilterExpiring(true);
      setFilterStatus('all');
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

  const getExpiringCertifications = (supplier) => {
    const expiring = [];
    
    if (supplier.bsci_validity_days_remaining && 
        NOTIFICATION_DAYS.includes(supplier.bsci_validity_days_remaining)) {
      expiring.push({
        type: "BSCI",
        days: supplier.bsci_validity_days_remaining,
      });
    }
    
    if (supplier.oeko_tex_validity_days_remaining && 
        NOTIFICATION_DAYS.includes(supplier.oeko_tex_validity_days_remaining)) {
      expiring.push({
        type: "Oeko-Tex",
        days: supplier.oeko_tex_validity_days_remaining,
      });
    }
    
    if (supplier.gots_validity_days_remaining && 
        NOTIFICATION_DAYS.includes(supplier.gots_validity_days_remaining)) {
      expiring.push({
        type: "GOTS",
        days: supplier.gots_validity_days_remaining,
      });
    }
    
    if (supplier.fire_license_days_remaining && 
        NOTIFICATION_DAYS.includes(supplier.fire_license_days_remaining)) {
      expiring.push({
        type: "Fire License",
        days: supplier.fire_license_days_remaining,
      });
    }
    
    return expiring;
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedSuppliers = (suppliers) => {
    if (!sortConfig.key) return suppliers;

    return [...suppliers].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "status") {
        aValue = getEffectiveStatus(a);
        bValue = getEffectiveStatus(b);
      }

      if (aValue === bValue) return 0;
      
      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!supplier) return false;

    if (filterExpiring && !hasExpiringCertifications(supplier)) {
      return false;
    }

    const name = (supplier.supplier_name || supplier.name || "").toLowerCase();
    const vendorId = (supplier.supplier_id || supplier.vendor_id || "").toLowerCase();
    const email = (supplier.email || "").toLowerCase();
    const location = (supplier.location || "").toLowerCase();
    const category = (supplier.supplier_category || "").toLowerCase();
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !search ||
      name.includes(search) ||
      vendorId.includes(search) ||
      email.includes(search) ||
      location.includes(search) ||
      category.includes(search);

    const status = getEffectiveStatus(supplier);
    const matchesStatus = filterStatus === "all" || status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const sortedSuppliers = getSortedSuppliers(filteredSuppliers);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSuppliers.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(sortedSuppliers.length / itemsPerPage);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;

    try {
      setDeletingId(id);
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error deleting supplier:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSuppliers.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedSuppliers.length} suppliers?`)) return;

    try {
      for (const id of selectedSuppliers) {
        await deleteSupplier(id);
      }
      setSuppliers((prev) => prev.filter((s) => !selectedSuppliers.includes(s.id)));
      setSelectedSuppliers([]);
    } catch (error) {
      console.error("Error deleting suppliers:", error);
    }
  };

  const handleSelectAll = () => {
    if (selectedSuppliers.length === currentItems.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(currentItems.map(s => s.id));
    }
  };

  const handleSelect = (id) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const clearExpiringFilter = () => {
    setFilterExpiring(false);
    setCurrentPage(1);
    window.history.replaceState({}, '', '/suppliersCSR');
  };

  const expiringCount = suppliers.filter(hasExpiringCertifications).length;

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>
              Suppliers
              <span style={styles.titleBadge}>
                {suppliers.length} total
              </span>
            </h1>
            <p style={styles.subtitle}>
              Manage and monitor your supplier network
            </p>
          </div>
          
          <Link to="/add-supplierCSR" style={styles.primaryButton}>
            <span style={styles.buttonIcon}>+</span>
            Add Supplier
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading suppliers...</p>
        </div>
      ) : (
        <>
          {/* Expiring Banner */}
          {filterExpiring && (
            <div style={styles.expiringBanner}>
              <div style={styles.expiringBannerContent}>
                <span style={styles.expiringBannerIcon}>⚠️</span>
                <span>
                  <strong>{expiringCount} supplier{expiringCount !== 1 ? 's' : ''}</strong> with certifications at critical milestones
                </span>
              </div>
              <button onClick={clearExpiringFilter} style={styles.expiringBannerClose}>
                Clear filter
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, backgroundColor: colors.primary[50], color: colors.primary[600]}}>
                🏭
              </div>
              <div>
                <div style={styles.statValue}>{suppliers.length}</div>
                <div style={styles.statLabel}>Total Suppliers</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, backgroundColor: colors.success[50], color: colors.success[600]}}>
                ✓
              </div>
              <div>
                <div style={styles.statValue}>
                  {suppliers.filter(s => {
                    const status = getEffectiveStatus(s);
                    return status === 'active' || status === 'valid';
                  }).length}
                </div>
                <div style={styles.statLabel}>Active</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, backgroundColor: colors.warning[50], color: colors.warning[600]}}>
                ⚠️
              </div>
              <div>
                <div style={styles.statValue}>{expiringCount}</div>
                <div style={styles.statLabel}>Need Attention</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, backgroundColor: colors.secondary[50], color: colors.secondary[600]}}>
                📊
              </div>
              <div>
                <div style={styles.statValue}>{filteredSuppliers.length}</div>
                <div style={styles.statLabel}>Filtered</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={styles.filtersCard}>
            <div style={styles.filtersHeader}>
              <h3 style={styles.filtersTitle}>Filters</h3>
              {(searchTerm || filterStatus !== "all" || filterExpiring) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                    setFilterExpiring(false);
                    setCurrentPage(1);
                    window.history.replaceState({}, '', '/suppliersCSR');
                  }}
                  style={styles.clearButton}
                >
                  Clear all
                </button>
              )}
            </div>

            <div style={styles.filtersGrid}>
              <div style={styles.searchWrapper}>
                <span style={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, ID, email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={styles.searchInput}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    style={styles.clearSearch}
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setFilterExpiring(false);
                  setCurrentPage(1);
                }}
                style={styles.select}
              >
                <option value="all">All statuses</option>
                {Object.entries(statusStyles).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.quickFilters}>
              <button
                onClick={() => {
                  setFilterExpiring(true);
                  setFilterStatus("all");
                  setCurrentPage(1);
                }}
                style={{
                  ...styles.quickFilter,
                  ...(filterExpiring && styles.quickFilterActive),
                  backgroundColor: filterExpiring ? colors.warning[50] : colors.gray[100],
                  color: filterExpiring ? colors.warning[700] : colors.gray[700],
                }}
              >
                ⚠️ Expiring ({expiringCount})
              </button>
              {Object.entries(statusStyles).slice(0, 3).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => {
                    setFilterStatus(key);
                    setFilterExpiring(false);
                    setCurrentPage(1);
                  }}
                  style={{
                    ...styles.quickFilter,
                    ...(filterStatus === key && {
                      backgroundColor: value.bg,
                      color: value.text,
                    }),
                  }}
                >
                  {value.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedSuppliers.length > 0 && (
            <div style={styles.bulkActions}>
              <span style={styles.bulkSelected}>
                {selectedSuppliers.length} selected
              </span>
              <button onClick={handleBulkDelete} style={styles.bulkDeleteButton}>
                <span>🗑️</span>
                Delete selected
              </button>
            </div>
          )}

          {/* Table */}
          <div style={styles.tableCard}>
            {filteredSuppliers.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>📭</div>
                <h3 style={styles.emptyStateTitle}>No suppliers found</h3>
                <p style={styles.emptyStateText}>
                  {searchTerm || filterStatus !== "all" || filterExpiring
                    ? "Try adjusting your filters"
                    : "Add your first supplier to get started"}
                </p>
                {(!searchTerm && filterStatus === "all" && !filterExpiring) && (
                  <Link to="/add-supplierCSR" style={styles.primaryButton}>
                    + Add Supplier
                  </Link>
                )}
                {(searchTerm || filterStatus !== "all" || filterExpiring) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("all");
                      setFilterExpiring(false);
                    }}
                    style={styles.secondaryButton}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.checkboxCell}>
                          <input
                            type="checkbox"
                            checked={selectedSuppliers.length === currentItems.length}
                            onChange={handleSelectAll}
                            style={styles.checkbox}
                          />
                        </th>
                        <th style={styles.headerCell} onClick={() => handleSort("sl_no")}>
                          <div style={styles.headerCellContent}>
                            SL NO {getSortIcon("sl_no")}
                          </div>
                        </th>
                        <th style={styles.headerCell} onClick={() => handleSort("supplier_name")}>
                          <div style={styles.headerCellContent}>
                            Supplier {getSortIcon("supplier_name")}
                          </div>
                        </th>
                        <th style={styles.headerCell} onClick={() => handleSort("location")}>
                          <div style={styles.headerCellContent}>
                            Location {getSortIcon("location")}
                          </div>
                        </th>
                        <th style={styles.headerCell} onClick={() => handleSort("supplier_category")}>
                          <div style={styles.headerCellContent}>
                            Category {getSortIcon("supplier_category")}
                          </div>
                        </th>
                        <th style={styles.headerCell} onClick={() => handleSort("status")}>
                          <div style={styles.headerCellContent}>
                            Status {getSortIcon("status")}
                          </div>
                        </th>
                        <th style={styles.headerCell}>Certifications</th>
                        <th style={styles.headerCell}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((supplier, index) => {
                        const statusKey = getEffectiveStatus(supplier);
                        const statusInfo = statusStyles[statusKey] || statusStyles.unknown;
                        const expiring = hasExpiringCertifications(supplier);
                        const expiringCerts = getExpiringCertifications(supplier);

                        return (
                          <tr 
                            key={supplier.id} 
                            style={{
                              ...styles.row,
                              backgroundColor: expiring ? colors.warning[50] : index % 2 === 0 ? 'white' : colors.gray[50],
                            }}
                          >
                            <td style={styles.cell}>
                              <input
                                type="checkbox"
                                checked={selectedSuppliers.includes(supplier.id)}
                                onChange={() => handleSelect(supplier.id)}
                                style={styles.checkbox}
                              />
                            </td>
                            <td style={styles.cell}>
                              <span style={styles.id}>
                                {supplier.supplier_sl_no || supplier.sl_no || indexOfFirstItem + index + 1}
                              </span>
                            </td>
                            <td style={styles.cell}>
                              <Link to={`/suppliersCSR/${supplier.id}`} style={styles.supplierLink}>
                                <span style={styles.supplierName}>
                                  {supplier.supplier_name || supplier.name || "Unnamed"}
                                </span>
                                {supplier.email && (
                                  <span style={styles.supplierEmail}>{supplier.email}</span>
                                )}
                              </Link>
                            </td>
                            <td style={styles.cell}>
                              <span style={styles.location}>
                                📍 {supplier.location || "—"}
                              </span>
                            </td>
                            <td style={styles.cell}>
                              <span style={styles.category}>
                                {supplier.supplier_category || "—"}
                              </span>
                            </td>
                            <td style={styles.cell}>
                              <div style={{
                                ...styles.statusBadge,
                                backgroundColor: statusInfo.bg,
                                color: statusInfo.text,
                                borderColor: statusInfo.border,
                              }}>
                                <span style={{...styles.statusDot, backgroundColor: statusInfo.dot}}></span>
                                {statusInfo.label}
                              </div>
                            </td>
                            <td style={styles.cell}>
                              {expiring ? (
                                <div style={styles.expiringCerts}>
                                  {expiringCerts.map((cert, idx) => (
                                    <span 
                                      key={idx}
                                      style={styles.expiringCert}
                                      title={`${cert.type} - ${cert.days} days remaining`}
                                    >
                                      {cert.type}
                                      <span style={styles.expiringDays}>{cert.days}d</span>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={styles.noExpiring}>—</span>
                              )}
                            </td>
                            <td style={{...styles.cell, textAlign: "center"}}>
                              <div style={styles.actions}>
                                <Link
                                  to={`/edit-supplier/${supplier.id}`}
                                  style={styles.actionButton}
                                  title="Edit"
                                >
                                  ✎
                                </Link>
                                <button
                                  onClick={() => handleDelete(supplier.id)}
                                  disabled={deletingId === supplier.id}
                                  style={{
                                    ...styles.actionButton,
                                    ...(deletingId === supplier.id && styles.actionButtonDisabled),
                                  }}
                                  title="Delete"
                                >
                                  {deletingId === supplier.id ? "⋯" : "🗑️"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div style={styles.pagination}>
                  <div style={styles.paginationInfo}>
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSuppliers.length)} of {filteredSuppliers.length}
                  </div>
                  
                  <div style={styles.paginationControls}>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      style={{
                        ...styles.paginationArrow,
                        opacity: currentPage === 1 ? 0.5 : 1,
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      ←
                    </button>

                    <div style={styles.pageNumbers}>
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
                              ...styles.pageNumber,
                              ...(currentPage === page && styles.pageNumberActive),
                            }}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span style={styles.ellipsis}>...</span>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            style={styles.pageNumber}
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
                        ...styles.paginationArrow,
                        opacity: currentPage === totalPages ? 0.5 : 1,
                        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      }}
                    >
                      →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Professional styles
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: colors.gray[50],
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    backgroundColor: "white",
    borderBottom: `1px solid ${colors.gray[200]}`,
    padding: "1.5rem 4rem",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerContent: {
    maxWidth: "1440px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "28px",
    fontWeight: "600",
    color: colors.gray[900],
    margin: "0 0 4px 0",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  titleBadge: {
    fontSize: "14px",
    fontWeight: "500",
    color: colors.gray[600],
    backgroundColor: colors.gray[100],
    padding: "4px 10px",
    borderRadius: "20px",
  },
  subtitle: {
    fontSize: "14px",
    color: colors.gray[600],
    margin: 0,
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: colors.primary[600],
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: colors.primary[700],
    },
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: colors.gray[100],
    color: colors.gray[700],
    textDecoration: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    border: `1px solid ${colors.gray[200]}`,
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: colors.gray[200],
    },
  },
  buttonIcon: {
    fontSize: "18px",
    lineHeight: 1,
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: `3px solid ${colors.gray[200]}`,
    borderTopColor: colors.primary[600],
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  loadingText: {
    fontSize: "14px",
    color: colors.gray[600],
    margin: 0,
  },
  expiringBanner: {
    backgroundColor: colors.warning[50],
    border: `1px solid ${colors.warning[200]}`,
    borderRadius: "8px",
    padding: "12px 20px",
    margin: "24px 32px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expiringBannerContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: colors.warning[700],
    fontSize: "14px",
  },
  expiringBannerIcon: {
    fontSize: "16px",
  },
  expiringBannerClose: {
    padding: "6px 12px",
    backgroundColor: "transparent",
    border: `1px solid ${colors.warning[200]}`,
    borderRadius: "6px",
    color: colors.warning[700],
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: colors.warning[100],
    },
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    padding: "24px 32px",
    maxWidth: "1440px",
    margin: "0 auto",
  },
  statCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    border: `1px solid ${colors.gray[200]}`,
  },
  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "600",
    color: colors.gray[900],
    lineHeight: 1.2,
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "13px",
    color: colors.gray[600],
  },
  filtersCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    margin: "0 32px 24px",
    border: `1px solid ${colors.gray[200]}`,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  filtersHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  filtersTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: colors.gray[700],
    margin: 0,
  },
  clearButton: {
    padding: "4px 10px",
    backgroundColor: colors.gray[100],
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    color: colors.gray[600],
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: colors.gray[200],
    },
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 200px",
    gap: "12px",
    marginBottom: "12px",
  },
  searchWrapper: {
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: colors.gray[400],
    fontSize: "14px",
  },
  searchInput: {
    width: "100%",
    padding: "10px 12px 10px 36px",
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: "8px",
    fontSize: "14px",
    transition: "all 0.2s",
    outline: "none",
    ":focus": {
      borderColor: colors.primary[400],
      boxShadow: `0 0 0 3px ${colors.primary[100]}`,
    },
  },
  clearSearch: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    backgroundColor: colors.gray[200],
    border: "none",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    fontSize: "16px",
    color: colors.gray[600],
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    ":hover": {
      backgroundColor: colors.gray[300],
    },
  },
  select: {
    padding: "10px 12px",
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "white",
    cursor: "pointer",
    outline: "none",
    ":focus": {
      borderColor: colors.primary[400],
      boxShadow: `0 0 0 3px ${colors.primary[100]}`,
    },
  },
  quickFilters: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  quickFilter: {
    padding: "6px 14px",
    borderRadius: "20px",
    border: "none",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
    backgroundColor: colors.gray[100],
    color: colors.gray[700],
    ":hover": {
      backgroundColor: colors.gray[200],
    },
  },
  quickFilterActive: {
    backgroundColor: colors.primary[50],
    color: colors.primary[700],
  },
  bulkActions: {
    backgroundColor: colors.primary[50],
    border: `1px solid ${colors.primary[200]}`,
    borderRadius: "8px",
    padding: "12px 20px",
    margin: "0 32px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bulkSelected: {
    fontSize: "14px",
    fontWeight: "500",
    color: colors.primary[700],
  },
  bulkDeleteButton: {
    padding: "6px 14px",
    backgroundColor: "transparent",
    border: `1px solid ${colors.primary[200]}`,
    borderRadius: "6px",
    color: colors.primary[700],
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: colors.primary[100],
    },
  },
  tableCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    margin: "0 32px 32px",
    border: `1px solid ${colors.gray[200]}`,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  headerCell: {
    padding: "16px 20px",
    textAlign: "left",
    backgroundColor: colors.gray[50],
    borderBottom: `1px solid ${colors.gray[200]}`,
    color: colors.gray[600],
    fontWeight: "600",
    cursor: "pointer",
    transition: "color 0.2s",
    ":hover": {
      color: colors.primary[600],
    },
  },
  headerCellContent: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  checkboxCell: {
    padding: "16px 20px",
    backgroundColor: colors.gray[50],
    borderBottom: `1px solid ${colors.gray[200]}`,
    width: "40px",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    accentColor: colors.primary[600],
  },
  row: {
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: colors.primary[50] + " !important",
    },
  },
  cell: {
    padding: "16px 20px",
    borderBottom: `1px solid ${colors.gray[200]}`,
    color: colors.gray[700],
  },
  id: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: colors.primary[50],
    color: colors.primary[700],
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
  },
  supplierLink: {
    color: "inherit",
    textDecoration: "none",
  },
  supplierName: {
    display: "block",
    fontWeight: "500",
    color: colors.gray[900],
    marginBottom: "4px",
  },
  supplierEmail: {
    display: "block",
    fontSize: "12px",
    color: colors.gray[500],
  },
  location: {
    color: colors.gray[600],
    fontSize: "13px",
  },
  category: {
    display: "inline-block",
    padding: "4px 10px",
    backgroundColor: colors.gray[100],
    color: colors.gray[700],
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    border: "1px solid",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },
  expiringCerts: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  expiringCert: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    backgroundColor: colors.warning[50],
    color: colors.warning[700],
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "500",
    width: "fit-content",
  },
  expiringDays: {
    padding: "2px 4px",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: "3px",
    fontSize: "10px",
  },
  noExpiring: {
    color: colors.gray[400],
    fontSize: "12px",
  },
  actions: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
  },
  actionButton: {
    padding: "6px",
    backgroundColor: "transparent",
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: "6px",
    color: colors.gray[600],
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    ":hover": {
      backgroundColor: colors.gray[100],
      color: colors.gray[900],
    },
  },
  actionButtonDisabled: {
    opacity: 0.5,
    pointerEvents: "none",
  },
  pagination: {
    padding: "20px",
    borderTop: `1px solid ${colors.gray[200]}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  paginationInfo: {
    fontSize: "13px",
    color: colors.gray[600],
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  paginationArrow: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: `1px solid ${colors.gray[200]}`,
    backgroundColor: "white",
    color: colors.gray[700],
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ":hover": {
      backgroundColor: colors.gray[50],
    },
  },
  pageNumbers: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
  },
  pageNumber: {
    minWidth: "36px",
    height: "36px",
    borderRadius: "8px",
    border: `1px solid ${colors.gray[200]}`,
    backgroundColor: "white",
    color: colors.gray[700],
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ":hover": {
      backgroundColor: colors.gray[50],
    },
  },
  pageNumberActive: {
    backgroundColor: colors.primary[600],
    color: "white",
    borderColor: colors.primary[600],
    ":hover": {
      backgroundColor: colors.primary[700],
    },
  },
  ellipsis: {
    color: colors.gray[400],
    padding: "0 4px",
  },
  emptyState: {
    padding: "64px 24px",
    textAlign: "center",
  },
  emptyStateIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    color: colors.gray[400],
  },
  emptyStateTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: colors.gray[800],
    margin: "0 0 8px 0",
  },
  emptyStateText: {
    fontSize: "14px",
    color: colors.gray[600],
    margin: "0 0 24px 0",
  },
};

// Add global styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    background-color: ${colors.gray[50]};
  }
`;
document.head.appendChild(styleSheet);

export default SupplierListCSR;