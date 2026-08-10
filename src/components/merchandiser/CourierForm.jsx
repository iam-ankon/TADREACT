// src/components/merchandiser/CourierForm.jsx
//
// Step 1 of the Courier Management flow: "+ Add Booking" opens a form with
// just the header fields (Booking Date, Sender, Receiver, Tracking No.,
// Weight, Courier Name, Export/Import, Status, Delivery Date, Remarks).
// On save, redirects into the Shipment Details page, ready for items to be
// added.
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import {
  getCourierBookingById,
  createCourierBooking,
  updateCourierBooking,
  getCourierStatusOptions,
  getShipmentTypeOptions,
} from '../../api/merchandiser';

const CourierForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    booking_date: new Date().toISOString().split('T')[0],
    sender: '',
    receiver: '',
    tracking_no: '',
    weight: '',
    courier_name: 'DHL',
    type: 'export',
    status: 'booked',
    delivered_date: '',
    remarks: '',
  });

  const statusOptions = getCourierStatusOptions();
  // A brand-new booking has no items yet, so it can't start as In Transit
  // or Delivered (backend enforces this too - see the "≥1 item" rule).
  const availableStatusOptions = isEdit
    ? statusOptions
    : statusOptions.filter((opt) => opt.value === 'booked' || opt.value === 'cancelled');
  const shipmentTypeOptions = getShipmentTypeOptions();
  const courierOptions = [
    { value: 'DHL', label: 'DHL' },
    { value: 'UPS', label: 'UPS' },
    { value: 'FedEx', label: 'FedEx' },
  ];

  useEffect(() => {
    if (isEdit && id) {
      const fetchBooking = async () => {
        setLoading(true);
        try {
          const response = await getCourierBookingById(id);
          if (response && response.data) {
            const data = response.data;
            setFormData({
              booking_date: data.booking_date || new Date().toISOString().split('T')[0],
              sender: data.sender || '',
              receiver: data.receiver || '',
              tracking_no: data.tracking_no || '',
              weight: data.weight || '',
              courier_name: data.courier_name || 'DHL',
              type: data.type || 'export',
              status: data.status || 'booked',
              delivered_date: data.delivered_date || '',
              remarks: data.remarks || '',
            });
          }
        } catch (err) {
          console.error('Error fetching booking:', err);
          setError('Failed to load booking data');
        } finally {
          setLoading(false);
        }
      };
      fetchBooking();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!formData.tracking_no) {
      setError('Tracking No. is required');
      setSaving(false);
      return;
    }
    if (!formData.booking_date) {
      setError('Booking date is required');
      setSaving(false);
      return;
    }
    if (!formData.sender) {
      setError('Sender is required');
      setSaving(false);
      return;
    }
    if (!formData.receiver) {
      setError('Receiver is required');
      setSaving(false);
      return;
    }
    if (!formData.courier_name) {
      setError('Courier name is required');
      setSaving(false);
      return;
    }

    try {
      const submitData = {
        booking_date: formData.booking_date,
        sender: formData.sender,
        receiver: formData.receiver,
        tracking_no: formData.tracking_no,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        courier_name: formData.courier_name,
        type: formData.type,
        status: formData.status,
        delivered_date: formData.delivered_date || null,
        remarks: formData.remarks || '',
      };

      if (isEdit) {
        await updateCourierBooking(id, submitData);
        navigate(`/courier/${id}/items`);
      } else {
        const response = await createCourierBooking(submitData);
        const newId = response.data?.id;
        // On save -> redirect into the Shipment Details page, empty item
        // list, ready for items to be added.
        navigate(`/courier/${newId}/items`);
      }
    } catch (err) {
      console.error('Error saving booking:', err);
      const errorMessage =
        err.response?.data?.tracking_no?.[0] ||
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to save courier booking';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading courier booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>
              {isEdit ? 'Edit Courier Booking' : 'Add Booking'}
            </h1>
            <p style={styles.headerSubtitle}>
              {isEdit
                ? "Update this shipment's header details"
                : 'Step 1 of 2 - add the shipment header, then add items on the next screen'}
            </p>
          </div>
          <div style={styles.headerActions}>
            <button onClick={() => navigate('/courier')} style={styles.btnCancel}>
              ← Cancel
            </button>
            <button
              type="submit"
              form="courierForm"
              disabled={saving}
              style={{
                ...styles.btnSave,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : isEdit ? 'Update Booking' : 'Save & Add Items →'}
            </button>
          </div>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <span style={styles.errorIcon}>❌</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={styles.errorClose}>✕</button>
          </div>
        )}

        <form id="courierForm" onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📦 Booking Details</h3>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Booking Date <span style={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="booking_date"
                  value={formData.booking_date}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Tracking No. <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="tracking_no"
                  value={formData.tracking_no}
                  onChange={handleChange}
                  placeholder="e.g. TRK002451"
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="0.00"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Sender <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="sender"
                  value={formData.sender}
                  onChange={handleChange}
                  placeholder="e.g. Texweave, KLOTHEN, KOITHE..."
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Receiver <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="receiver"
                  value={formData.receiver}
                  onChange={handleChange}
                  placeholder="Country or company name"
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Courier Name <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="courier_name"
                  value={formData.courier_name}
                  onChange={handleChange}
                  list="courier-name-options"
                  placeholder="DHL, UPS, FedEx, or custom..."
                  style={styles.input}
                  required
                />
                <datalist id="courier-name-options">
                  {courierOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} />
                  ))}
                </datalist>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Export/Import <span style={styles.required}>*</span>
                </label>
                <select name="type" value={formData.type} onChange={handleChange} style={styles.select} required>
                  {shipmentTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select name="status" value={formData.status} onChange={handleChange} style={styles.select}>
                  {availableStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Delivery Date
                  {!isEdit && <span style={styles.fieldHint}> (set after items are added)</span>}
                </label>
                <input
                  type="date"
                  name="delivered_date"
                  value={formData.delivered_date}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={!isEdit}
                  title={!isEdit ? "Add items first, then set the delivered date from the Shipment Details page" : undefined}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, gridColumn: 'span 3' }}>
                <label style={styles.label}>Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows={3}
                  style={styles.textarea}
                  placeholder="Optional notes about this shipment..."
                />
              </div>
            </div>
          </div>
        </form>
      </div>
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
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  btnCancel: {
    padding: "10px 20px",
    background: "white",
    color: "#0f172a",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnSave: {
    padding: "10px 24px",
    background: "linear-gradient(135deg, #1a73e8, #1557b0)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  errorAlert: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
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
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  section: {
    background: "white",
    borderRadius: "12px",
    padding: "20px 24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 16px 0",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "16px",
    marginBottom: "12px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
  },
  required: {
    color: "#dc2626",
    fontWeight: "700",
  },
  fieldHint: {
    color: "#94a3b8",
    fontWeight: "400",
    fontSize: "11px",
  },
  input: {
    padding: "10px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  textarea: {
    padding: "10px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    transition: "all 0.2s",
    fontFamily: "inherit",
    resize: "vertical",
  },
  select: {
    padding: "10px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    background: "white",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

export default CourierForm;
