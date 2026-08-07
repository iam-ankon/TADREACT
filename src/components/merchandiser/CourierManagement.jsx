// src/components/merchandiser/CourierManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getCourierBookings,
  getCourierBookingStats,
  deleteCourierBooking,
  exportCourierBookings,
  getCourierStatusOptions,
  getShipmentTypeOptions,
} from '../../api/merchandiser';
import Sidebar from './Sidebar.jsx';

const statusColors = {
  booked: '#3b82f6',
  picked_up: '#8b5cf6',
  in_transit: '#f59e0b',
  out_for_delivery: '#06b6d4',
  delivered: '#22c55e',
  delayed: '#ef4444',
  customs_hold: '#f97316',
  returned: '#6b7280',
  cancelled: '#dc2626',
};

const statusLabels = {
  booked: 'Booked',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  delayed: 'Delayed',
  customs_hold: 'Customs Hold',
  returned: 'Returned',
  cancelled: 'Cancelled',
};

const StatusBadge = ({ status }) => {
  const color = statusColors[status] || '#6b7280';
  const label = statusLabels[status] || status;
  
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      background: color + '15',
      color: color,
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      letterSpacing: '0.3px',
    }}>
      {label}
    </span>
  );
};

export default function CourierManagement() {
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [courierFilter, setCourierFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [sortBy, setSortBy] = useState("booking_date");
  const [sortOrder, setSortOrder] = useState("desc");

  const statusOptions = getCourierStatusOptions();
  const shipmentTypeOptions = getShipmentTypeOptions();
  const courierOptions = [
    { value: 'all', label: 'All Couriers' },
    { value: 'DHL', label: 'DHL' },
    { value: 'UPS', label: 'UPS' },
    { value: 'FedEx', label: 'FedEx' },
    { value: 'Aramex', label: 'Aramex' },
    { value: 'TNT', label: 'TNT' },
    { value: 'EMS', label: 'EMS' },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        shipment_type: typeFilter !== 'all' ? typeFilter : '',
        courier_name: courierFilter !== 'all' ? courierFilter : '',
      };
      
      const [bookingsRes, statsRes] = await Promise.all([
        getCourierBookings(currentPage, itemsPerPage, { filters }),
        getCourierBookingStats(),
      ]);
      
      setBookings(bookingsRes.data || []);
      setTotalCount(bookingsRes.pagination?.count || 0);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error fetching courier data:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, typeFilter, courierFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, courierFilter]);

  const handleDelete = async (bookingId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this courier booking?")) {
      try {
        await deleteCourierBooking(bookingId);
        fetchData();
      } catch (err) {
        console.error("Error deleting booking:", err);
      }
    }
  };

  const handleExport = async () => {
    try {
      const filters = {
        status: statusFilter !== 'all' ? statusFilter : '',
        shipment_type: typeFilter !== 'all' ? typeFilter : '',
        courier_name: courierFilter !== 'all' ? courierFilter : '',
        search: searchTerm,
      };
      
      const response = await exportCourierBookings(filters);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `courier_bookings_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    let aVal = a[sortBy] || "";
    let bVal = b[sortBy] || "";
    
    if (sortBy === "booking_date" || sortBy === "actual_delivery_date") {
      aVal = a[sortBy] ? new Date(a[sortBy]).getTime() : 0;
      bVal = b[sortBy] ? new Date(b[sortBy]).getTime() : 0;
    }
    
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = sortedBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setCourierFilter("all");
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return "↕";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const statsData = stats || {
    total_bookings: 0,
    total_export: 0,
    total_import: 0,
    in_transit: 0,
    delivered: 0,
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading courier bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        {/* Page Header */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Courier Management</h1>
            <p style={styles.pageSubtitle}>Add Booking • Manage and Track Courier Bookings</p>
          </div>
          <div style={styles.headerActions}>
            <button onClick={handleExport} style={styles.btnOutline}>
              Export
            </button>
            <Link to="/courier/add" style={styles.btnPrimary}>
              + Add Booking
            </Link>
          </div>
        </div>

        {/* Stats Cards - Like Image */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{statsData.total_bookings}</span>
            <span style={styles.statLabel}>Total Bookings</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{statsData.total_export}</span>
            <span style={styles.statLabel}>Export Shipments</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{statsData.total_import}</span>
            <span style={styles.statLabel}>Import Shipments</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{statsData.in_transit}</span>
            <span style={styles.statLabel}>In Transit</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{statsData.delivered}</span>
            <span style={styles.statLabel}>Delivered</span>
          </div>
        </div>

        {/* Filter Bar - Like Image */}
        <div style={styles.filterBar}>
          <div style={styles.filterLeft}>
            <div style={styles.filterItem}>
              <span style={styles.filterLabel}>Courier Name</span>
              <select
                value={courierFilter}
                onChange={(e) => setCourierFilter(e.target.value)}
                style={styles.filterSelect}
              >
                {courierOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.filterItem}>
              <span style={styles.filterLabel}>Booking Date</span>
              <select style={styles.filterSelect}>
                <option>01-Jun-2026</option>
                <option>24-Jun-2026</option>
              </select>
            </div>
            <div style={styles.filterItem}>
              <span style={styles.filterLabel}>Export/Import</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All</option>
                {shipmentTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={styles.filterRight}>
            <div style={styles.searchWrapper}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
                placeholder="Search by Tracking No., Sender, Receiver..."
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} style={styles.clearBtn}>✕</button>
              )}
            </div>
            <button onClick={handleExport} style={styles.btnExport}>Export</button>
          </div>
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <span style={styles.tableTitle}>Courier Booking List ({totalCount})</span>
            <div style={styles.tableControls}>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                style={styles.perPageSelect}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span style={styles.perPageLabel}>entries</span>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th} onClick={() => handleSort("id")}>
                    SL No {getSortIcon("id")}
                  </th>
                  <th style={styles.th} onClick={() => handleSort("booking_date")}>
                    Booking Date {getSortIcon("booking_date")}
                  </th>
                  <th style={styles.th}>Sender</th>
                  <th style={styles.th}>Receiver</th>
                  <th style={styles.th} onClick={() => handleSort("tracking_number")}>
                    Tracking No. {getSortIcon("tracking_number")}
                  </th>
                  <th style={styles.th} onClick={() => handleSort("weight")}>
                    Weight {getSortIcon("weight")}
                  </th>
                  <th style={styles.th} onClick={() => handleSort("courier_name")}>
                    Courier Name {getSortIcon("courier_name")}
                  </th>
                  <th style={styles.th} onClick={() => handleSort("shipment_type")}>
                    Export/Import {getSortIcon("shipment_type")}
                  </th>
                  <th style={styles.th} onClick={() => handleSort("status")}>
                    Status {getSortIcon("status")}
                  </th>
                  <th style={styles.th} onClick={() => handleSort("actual_delivery_date")}>
                    Delivered Date {getSortIcon("actual_delivery_date")}
                  </th>
                  <th style={styles.th}>Remarks</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentBookings.length === 0 ? (
                  <tr>
                    <td colSpan="12" style={styles.emptyCell}>
                      <div style={styles.emptyState}>
                        <span style={styles.emptyIcon}>📭</span>
                        <h3>No courier bookings found</h3>
                        <p>Try adjusting your search or filters</p>
                        <button onClick={clearAllFilters} style={styles.clearFiltersBtn}>
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentBookings.map((booking, index) => (
                    <tr
                      key={booking.id}
                      style={styles.tr}
                      onClick={() => navigate(`/courier/tracking/${booking.id}`)}
                    >
                      <td style={styles.td}>{indexOfFirstItem + index + 1}</td>
                      <td style={styles.td}>
                        {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : '-'}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.partyName}>{booking.sender_name || '-'}</span>
                        {booking.sender_company && (
                          <span style={styles.partyCompany}>({booking.sender_company})</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.partyName}>{booking.receiver_name || '-'}</span>
                        {booking.receiver_company && (
                          <span style={styles.partyCompany}>({booking.receiver_company})</span>
                        )}
                      </td>
                      <td style={{ ...styles.td, fontWeight: '600', color: '#2563eb' }}>
                        {booking.tracking_number || '-'}
                      </td>
                      <td style={styles.td}>
                        {booking.weight ? `${booking.weight}kg` : '-'}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.courierBadge}>
                          {booking.courier_name_display || booking.courier_name}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.typeBadge,
                          background: booking.shipment_type === 'export' ? '#dbeafe' : '#fef3c7',
                          color: booking.shipment_type === 'export' ? '#1e40af' : '#92400e',
                        }}>
                          {booking.shipment_type_display || booking.shipment_type}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <StatusBadge status={booking.status} />
                      </td>
                      <td style={styles.td}>
                        {booking.actual_delivery_date ? new Date(booking.actual_delivery_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : '-'}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.remarksText}>
                          {booking.remarks || '-'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/courier/tracking/${booking.id}`)}
                            style={styles.viewBtn}
                            title="View"
                          >
                            👁
                          </button>
                          <button
                            onClick={() => navigate(`/courier/edit/${booking.id}`)}
                            style={styles.editBtn}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => handleDelete(booking.id, e)}
                            style={styles.deleteBtn}
                            title="Delete"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Like Image */}
          {totalCount > 0 && (
            <div style={styles.paginationBar}>
              <span style={styles.paginationInfo}>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalCount)} of {totalCount} entries
              </span>
              <div style={styles.paginationControls}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{ ...styles.pageBtn, ...(currentPage === 1 ? styles.pageBtnDisabled : {}) }}
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{ ...styles.pageBtn, ...(currentPage === 1 ? styles.pageBtnDisabled : {}) }}
                >
                  ←
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        ...styles.pageBtn,
                        ...(currentPage === pageNum ? styles.pageBtnActive : {})
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{ ...styles.pageBtn, ...(currentPage === totalPages ? styles.pageBtnDisabled : {}) }}
                >
                  →
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{ ...styles.pageBtn, ...(currentPage === totalPages ? styles.pageBtnDisabled : {}) }}
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f5f7fa",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  mainContent: {
    flex: 1,
    padding: "24px 32px",
    overflow: "auto",
    maxHeight: "100vh",
  },
  loadingContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  pageTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  btnPrimary: {
    background: "#1a73e8",
    color: "white",
    padding: "10px 24px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  btnOutline: {
    background: "white",
    color: "#1a73e8",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #d0d5dd",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnExport: {
    background: "white",
    color: "#0f172a",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #d0d5dd",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "white",
    borderRadius: "10px",
    padding: "16px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    textAlign: "center",
  },
  statNumber: {
    display: "block",
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
  },
  statLabel: {
    display: "block",
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
  },
  filterBar: {
    background: "white",
    borderRadius: "10px",
    padding: "16px 20px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  filterLeft: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  filterItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  filterLabel: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  filterSelect: {
    padding: "6px 10px",
    border: "1px solid #d0d5dd",
    borderRadius: "6px",
    fontSize: "13px",
    background: "white",
    cursor: "pointer",
    color: "#0f172a",
    minWidth: "120px",
  },
  filterRight: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "10px",
    fontSize: "14px",
    color: "#94a3b8",
  },
  searchInput: {
    padding: "8px 12px 8px 34px",
    border: "1px solid #d0d5dd",
    borderRadius: "6px",
    fontSize: "13px",
    width: "260px",
    outline: "none",
    transition: "all 0.2s",
  },
  clearBtn: {
    position: "absolute",
    right: "8px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    fontSize: "14px",
  },
  tableContainer: {
    background: "white",
    borderRadius: "10px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 20px",
    borderBottom: "1px solid #e8ecf0",
  },
  tableTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },
  tableControls: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  perPageSelect: {
    padding: "4px 8px",
    border: "1px solid #d0d5dd",
    borderRadius: "4px",
    fontSize: "13px",
  },
  perPageLabel: {
    fontSize: "13px",
    color: "#64748b",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    padding: "12px 14px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    background: "#f8fafc",
    borderBottom: "1px solid #e8ecf0",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
  },
  tr: {
    borderBottom: "1px solid #f1f4f8",
    transition: "background 0.2s",
    cursor: "pointer",
  },
  td: {
    padding: "10px 14px",
    fontSize: "13px",
    color: "#0f172a",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  partyName: {
    fontWeight: "500",
  },
  partyCompany: {
    fontSize: "11px",
    color: "#64748b",
    marginLeft: "4px",
  },
  courierBadge: {
    display: "inline-block",
    padding: "2px 10px",
    background: "#f1f4f8",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#0f172a",
  },
  typeBadge: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "500",
  },
  remarksText: {
    fontSize: "12px",
    color: "#64748b",
  },
  actionButtons: {
    display: "flex",
    gap: "4px",
  },
  viewBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 6px",
    borderRadius: "4px",
    transition: "background 0.2s",
  },
  editBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 6px",
    borderRadius: "4px",
    transition: "background 0.2s",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 6px",
    borderRadius: "4px",
    transition: "background 0.2s",
  },
  emptyCell: {
    padding: "60px",
    textAlign: "center",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  emptyIcon: {
    fontSize: "48px",
  },
  clearFiltersBtn: {
    padding: "8px 20px",
    background: "#1a73e8",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
  paginationBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    borderTop: "1px solid #e8ecf0",
    flexWrap: "wrap",
    gap: "8px",
  },
  paginationInfo: {
    fontSize: "13px",
    color: "#64748b",
  },
  paginationControls: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
  },
  pageBtn: {
    padding: "6px 12px",
    background: "white",
    border: "1px solid #d0d5dd",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#0f172a",
    transition: "all 0.2s",
    minWidth: "32px",
  },
  pageBtnActive: {
    background: "#1a73e8",
    color: "white",
    borderColor: "#1a73e8",
  },
  pageBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};