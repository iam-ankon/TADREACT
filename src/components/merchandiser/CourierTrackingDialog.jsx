// src/components/merchandiser/CourierTrackingDialog.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import {
  getCourierBookingById,
  updateCourierBookingStatus,
  addCourierTrackingEvent,
  getCourierTrackingEvents,
  getCourierStatusOptions,
} from '../../api/merchandiser';

const CourierTrackingDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [booking, setBooking] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventData, setEventData] = useState({
    event_date: new Date().toISOString().slice(0, 16),
    event_location: '',
    event_description: '',
    event_status: 'in_transit',
  });

  const statusOptions = getCourierStatusOptions();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingRes, eventsRes] = await Promise.all([
        getCourierBookingById(id),
        getCourierTrackingEvents(id),
      ]);
      setBooking(bookingRes.data);
      setEvents(eventsRes.data || []);
      setNewStatus(bookingRes.data.status || '');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    setError(null);
    try {
      await updateCourierBookingStatus(id, {
        status: newStatus,
        note: statusNote,
      });
      fetchData();
      setStatusNote('');
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddEvent = async () => {
    setUpdating(true);
    setError(null);
    try {
      await addCourierTrackingEvent(id, eventData);
      fetchData();
      setShowAddEvent(false);
      setEventData({
        event_date: new Date().toISOString().slice(0, 16),
        event_location: '',
        event_description: '',
        event_status: 'in_transit',
      });
    } catch (err) {
      console.error('Error adding event:', err);
      setError('Failed to add tracking event');
    } finally {
      setUpdating(false);
    }
  };

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
        padding: '4px 14px',
        background: color + '15',
        color: color,
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '500',
      }}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading tracking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.errorContainer}>
          <h2>Booking not found</h2>
          <button onClick={() => navigate('/courier')} style={styles.btnSecondary}>
            ← Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        {/* Page Header - Like Image */}
        <div style={styles.pageHeader}>
          <div style={styles.headerLeft}>
            <div>
              <h1 style={styles.pageTitle}>Shipment Details - {booking.tracking_number}</h1>
              <p style={styles.pageSubtitle}>
                <span style={styles.statusBadge}>{booking.status === 'delivered' ? 'Delivered' : 'In Transit'}</span>
                <span style={styles.headerMeta}>
                  {booking.courier_name_display || booking.courier_name} · 
                  Sent on {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'} · 
                  {booking.actual_delivery_date ? ` Delivered on ${new Date(booking.actual_delivery_date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Not delivered yet'}
                </span>
              </p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button onClick={() => navigate('/courier')} style={styles.btnOutline}>
              ← Back
            </button>
            <button
              onClick={() => navigate(`/courier/edit/${id}`)}
              style={styles.btnPrimary}
            >
              ✏️ Edit Booking
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={styles.errorAlert}>
            <span style={styles.errorIcon}>❌</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={styles.errorClose}>✕</button>
          </div>
        )}

        {/* Summary Cards - Like Image */}
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <span style={styles.summaryValue}>{booking.items?.length || 0}</span>
            <span style={styles.summaryLabel}>Total Items</span>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryValue}>{booking.packages || 1}</span>
            <span style={styles.summaryLabel}>Total Packages</span>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryValue}>{booking.weight ? `${booking.weight} KG` : '-'}</span>
            <span style={styles.summaryLabel}>Total Weight</span>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryValue}>${booking.total_value?.toFixed(2) || '0.00'}</span>
            <span style={styles.summaryLabel}>Total Value (USD)</span>
          </div>
        </div>

        {/* Items Table - Like Image */}
        <div style={styles.itemsSection}>
          <div style={styles.itemsHeader}>
            <span style={styles.itemsTitle}>Items in this Shipment ({booking.items?.length || 0})</span>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.itemsTable}>
              <thead>
                <tr>
                  <th style={styles.itemsTh}>SL</th>
                  <th style={styles.itemsTh}>ORDER NO</th>
                  <th style={styles.itemsTh}>ITEM</th>
                  <th style={styles.itemsTh}>WGR</th>
                  <th style={styles.itemsTh}>FACTORY</th>
                  <th style={styles.itemsTh}>SAMPLE</th>
                  <th style={styles.itemsTh}>SIZE</th>
                  <th style={styles.itemsTh}>QTY</th>
                  <th style={styles.itemsTh}>UNIT VALUE (USD)</th>
                  <th style={styles.itemsTh}>TOTAL VALUE (USD)</th>
                  <th style={styles.itemsTh}>HS CODE</th>
                  <th style={styles.itemsTh}>REMARKS</th>
                  <th style={styles.itemsTh}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {booking.items?.length > 0 ? (
                  booking.items.slice(0, 5).map((item, idx) => (
                    <tr key={idx} style={styles.itemsTr}>
                      <td style={styles.itemsTd}>{idx + 1}</td>
                      <td style={styles.itemsTd}>{item.order_no || '-'}</td>
                      <td style={styles.itemsTd}>{item.item_name || '-'}</td>
                      <td style={styles.itemsTd}>{item.wgr || '-'}</td>
                      <td style={styles.itemsTd}>{item.factory || '-'}</td>
                      <td style={styles.itemsTd}>{item.sample_type || '-'}</td>
                      <td style={styles.itemsTd}>{item.size || '-'}</td>
                      <td style={styles.itemsTd}>{item.quantity || 0}</td>
                      <td style={styles.itemsTd}>${item.unit_value?.toFixed(2) || '0.00'}</td>
                      <td style={styles.itemsTd}>${item.total_value?.toFixed(2) || '0.00'}</td>
                      <td style={styles.itemsTd}>{item.hs_code || '-'}</td>
                      <td style={styles.itemsTd}>
                        <span style={styles.remarksText}>{item.remarks || '-'}</span>
                      </td>
                      <td style={styles.itemsTd}>
                        <button style={styles.editIconBtn}>✏️</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="13" style={styles.emptyCell}>No items found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {booking.items?.length > 5 && (
            <div style={styles.addItemRow}>
              <button style={styles.addItemBtn}>+ Add Item</button>
              <span style={styles.moreItems}>+{booking.items.length - 5} more items</span>
            </div>
          )}
        </div>

        {/* Cost Summary - Like Image */}
        <div style={styles.costSection}>
          <div style={styles.costRow}>
            <span style={styles.costLabel}>Total Quantity</span>
            <span style={styles.costValue}>{booking.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0}</span>
          </div>
          <div style={styles.costRow}>
            <span style={styles.costLabel}>Total Item Value (USD)</span>
            <span style={styles.costValue}>${booking.total_value?.toFixed(2) || '0.00'}</span>
          </div>
          <div style={styles.costRow}>
            <span style={styles.costLabel}>Courier Charge (DHL)</span>
            <span style={styles.costValue}>${booking.courier_charge?.toFixed(2) || '25.00'}</span>
          </div>
          <div style={styles.costRow}>
            <span style={styles.costLabel}>Additional Cost</span>
            <span style={styles.costValue}>${booking.additional_cost?.toFixed(2) || '5.00'}</span>
          </div>
          <div style={{ ...styles.costRow, borderTop: '1px solid #e8ecf0', paddingTop: '12px', marginTop: '4px' }}>
            <span style={{ ...styles.costLabel, fontWeight: '700', color: '#0f172a' }}>Total Shipment Cost (USD)</span>
            <span style={{ ...styles.costValue, fontWeight: '700', color: '#0f172a' }}>
              ${(booking.total_value || 0) + (booking.courier_charge || 25) + (booking.additional_cost || 5)}
            </span>
          </div>
        </div>

        {/* Documents Section */}
        <div style={styles.documentsSection}>
          <h4 style={styles.sectionTitle}>📄 Documents</h4>
          <div style={styles.uploadArea}>
            <button style={styles.uploadBtn}>📎 Upload File</button>
            <span style={styles.uploadHint}>Supports PDF, JPG, PNG (Max 10MB each)</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        input:focus, select:focus {
          outline: none;
          border-color: #1a73e8;
          box-shadow: 0 0 0 3px rgba(26,115,232,0.1);
        }
      `}</style>
    </div>
  );
};

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
    borderTopColor: "#1a73e8",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
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
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  statusBadge: {
    display: "inline-block",
    padding: "2px 12px",
    background: "#22c55e15",
    color: "#22c55e",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
  },
  headerMeta: {
    color: "#64748b",
    fontSize: "13px",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  btnPrimary: {
    background: "#1a73e8",
    color: "white",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  btnSecondary: {
    background: "#f1f4f8",
    color: "#0f172a",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #d0d5dd",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnOutline: {
    background: "white",
    color: "#0f172a",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #d0d5dd",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  errorAlert: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid #fecaca",
  },
  errorIcon: {
    fontSize: "18px",
  },
  errorClose: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    color: "#991b1b",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  summaryCard: {
    background: "white",
    borderRadius: "10px",
    padding: "16px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    textAlign: "center",
  },
  summaryValue: {
    display: "block",
    fontSize: "26px",
    fontWeight: "700",
    color: "#0f172a",
  },
  summaryLabel: {
    display: "block",
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
  },
  itemsSection: {
    background: "white",
    borderRadius: "10px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    overflow: "hidden",
    marginBottom: "20px",
  },
  itemsHeader: {
    padding: "14px 20px",
    borderBottom: "1px solid #e8ecf0",
  },
  itemsTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  itemsTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
  },
  itemsTh: {
    padding: "10px 12px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    background: "#f8fafc",
    borderBottom: "1px solid #e8ecf0",
    whiteSpace: "nowrap",
  },
  itemsTr: {
    borderBottom: "1px solid #f1f4f8",
  },
  itemsTd: {
    padding: "8px 12px",
    fontSize: "12px",
    color: "#0f172a",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  remarksText: {
    fontSize: "11px",
    color: "#64748b",
  },
  editIconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    color: "#64748b",
  },
  emptyCell: {
    padding: "30px",
    textAlign: "center",
    color: "#94a3b8",
  },
  addItemRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 20px",
    borderTop: "1px solid #e8ecf0",
  },
  addItemBtn: {
    padding: "6px 16px",
    background: "#f1f4f8",
    border: "1px dashed #d0d5dd",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
    color: "#0f172a",
  },
  moreItems: {
    fontSize: "13px",
    color: "#64748b",
  },
  costSection: {
    background: "white",
    borderRadius: "10px",
    padding: "16px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    marginBottom: "20px",
  },
  costRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
  },
  costLabel: {
    fontSize: "14px",
    color: "#64748b",
  },
  costValue: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#0f172a",
  },
  documentsSection: {
    background: "white",
    borderRadius: "10px",
    padding: "16px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 12px 0",
  },
  uploadArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  uploadBtn: {
    padding: "8px 20px",
    background: "#f1f4f8",
    border: "1px dashed #d0d5dd",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
    color: "#0f172a",
  },
  uploadHint: {
    fontSize: "12px",
    color: "#94a3b8",
  },
};

export default CourierTrackingDetails;