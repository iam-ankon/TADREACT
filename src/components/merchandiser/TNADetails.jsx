// TNADetails.jsx - Without status fields
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const api = axios.create({
  baseURL: "http://119.148.51.38:8000/api/merchandiser/api/"
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Order matches the model's TNA.PROGRESS_WEIGHTS (must sum to 100).
const PROGRESS_STAGES = [
  { field: "lab_dip_status", label: "Lab Dip", weight: 10, color: "#8b5cf6" },
  { field: "fabric_status", label: "Fabric", weight: 40, color: "#3b82f6" },
  { field: "fit_sample_status", label: "Fit Sample", weight: 20, color: "#f59e0b" },
  { field: "pp_sample_status", label: "PP Sample", weight: 30, color: "#10b981" },
];

export default function TNADetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tna, setTna] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStage, setUpdatingStage] = useState(null);

  useEffect(() => {
    fetchTNA();
  }, [id]);

  const fetchTNA = async () => {
    setLoading(true);
    try {
      const response = await api.get(`tna/${id}/`);
      setTna(response.data);
    } catch (err) {
      console.error("Error fetching TNA:", err);
      alert("Failed to load TNA details");
    } finally {
      setLoading(false);
    }
  };

  const toggleStage = async (field, currentStatus) => {
    const nextStatus = currentStatus === "approved" ? "pending" : "approved";
    setUpdatingStage(field);
    // Optimistic update so the bar responds immediately.
    setTna((prev) => (prev ? { ...prev, [field]: nextStatus } : prev));
    try {
      const response = await api.patch(`tna/${id}/`, { [field]: nextStatus });
      setTna(response.data);
    } catch (err) {
      console.error("Error updating stage status:", err);
      alert("Failed to update status. Please try again.");
      // Roll back on failure.
      setTna((prev) => (prev ? { ...prev, [field]: currentStatus } : prev));
    } finally {
      setUpdatingStage(null);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this TNA record?")) {
      try {
        await api.delete(`tna/${id}/`);
        navigate("/orders/tna");
      } catch (err) {
        console.error("Error deleting TNA:", err);
        alert("Failed to delete TNA");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDaysToShipment = () => {
    if (!tna?.shipment_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shipment = new Date(tna.shipment_date);
    const diffTime = shipment - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading TNA details...</p>
        </div>
      </div>
    );
  }

  if (!tna) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.errorContainer}>
          <h2>TNA record not found</h2>
          <Link to="/orders/tna">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const daysToShipment = getDaysToShipment();
  const isOverdue = daysToShipment !== null && daysToShipment < 0;

  const getDaysDisplay = () => {
    if (daysToShipment === null) return { text: '-', color: '#64748b' };
    if (daysToShipment < 0) return { text: `${Math.abs(daysToShipment)} days overdue`, color: '#dc2626' };
    if (daysToShipment === 0) return { text: 'Today', color: '#f59e0b' };
    if (daysToShipment === 1) return { text: '1 day remaining', color: '#10b981' };
    return { text: `${daysToShipment} days remaining`, color: daysToShipment < 15 ? '#f59e0b' : '#10b981' };
  };

  const daysInfo = getDaysDisplay();

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <div style={styles.headerBadge}>📅</div>
              <div>
                <h1 style={styles.headerTitle}>
                  TNA Details: { tna.order_style ? tna.order_style : tna.order_number }
                </h1>
                <p style={styles.headerSubtitle}>
                  Complete timeline and production schedule information
                </p>
              </div>
            </div>
            <div style={styles.headerActions}>
              <Link to="/orders/tna" style={styles.btnSecondary}>← Back</Link>
              <Link to={`/edit-tna/${tna.id}`} style={styles.btnEdit}>✏️ Edit</Link>
              <button onClick={handleDelete} style={styles.btnDelete}>🗑️ Delete</button>
            </div>
          </div>
        </div>

        {/* Days to Shipment Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryContent}>
            <div style={styles.summaryIcon}>📊</div>
            <div style={styles.summaryInfo}>
              <span style={styles.summaryLabel}>Days to Shipment</span>
              <span style={{ ...styles.summaryValue, color: daysInfo.color }}>
                {daysInfo.text}
              </span>
              <span style={styles.summaryHint}>Shipment Date - Today</span>
            </div>
          </div>
        </div>

        {/* T&A Progress Bar */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionIcon}>📈</span>
            <h2 style={styles.sectionTitle}>T&A Progress</h2>
            <span style={styles.sectionHint}>
              Lab Dip 10% · Fabric 40% · Fit Sample 20% · PP Sample 30%
            </span>
          </div>
          <div style={styles.progressWrap}>
            <div style={styles.progressBarTrack}>
              {PROGRESS_STAGES.map((stage) => {
                const approved = tna[stage.field] === "approved";
                return (
                  <div
                    key={stage.field}
                    title={`${stage.label} - ${stage.weight}%${approved ? " (Approved)" : " (Pending)"}`}
                    style={{
                      ...styles.progressBarSegment,
                      width: `${stage.weight}%`,
                      backgroundColor: approved ? stage.color : "#e2e8f0",
                    }}
                  />
                );
              })}
            </div>
            <div style={styles.progressTotalRow}>
              <span style={styles.progressTotalLabel}>Overall Progress</span>
              <span style={styles.progressTotalValue}>
                {tna.progress_percentage ?? 0}%
              </span>
            </div>

            <div style={styles.progressStagesGrid}>
              {PROGRESS_STAGES.map((stage) => {
                const approved = tna[stage.field] === "approved";
                return (
                  <div key={stage.field} style={styles.progressStageCard}>
                    <div style={styles.progressStageHeader}>
                      <span
                        style={{ ...styles.progressStageDot, backgroundColor: stage.color }}
                      />
                      <span style={styles.progressStageLabel}>{stage.label}</span>
                      <span style={styles.progressStageWeight}>{stage.weight}%</span>
                    </div>
                    <button
                      onClick={() => toggleStage(stage.field, tna[stage.field])}
                      disabled={updatingStage === stage.field}
                      style={{
                        ...styles.progressStageBtn,
                        ...(approved ? styles.progressStageBtnApproved : {}),
                      }}
                    >
                      {updatingStage === stage.field
                        ? "Saving..."
                        : approved
                        ? "✓ Approved"
                        : "Mark Approved"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={styles.twoColumnGrid}>
          {/* Basic Information */}
          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>📋</span>
              <h3 style={styles.cardTitle}>Basic Order Information</h3>
            </div>
            <div style={styles.infoList}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Order Number:</span>
                <span style={styles.infoValue}>
                  {tna.order_style ? tna.order_style : tna.order_number || "-"}
                </span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Supplier:</span>
                <span style={styles.infoValue}>{tna.supplier || "-"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Gender:</span>
                <span style={styles.infoValue}>{tna.gender || "-"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Item:</span>
                <span style={styles.infoValue}>{tna.item || "-"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>WGR:</span>
                <span style={styles.infoValue}>{tna.wgr || "-"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Fabrication:</span>
                <span style={styles.infoValue}>{tna.fabrication || "-"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Size Range:</span>
                <span style={styles.infoValue}>{tna.size_range || "-"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Total Quantity:</span>
                <span style={styles.infoValue}>{tna.total_qty?.toLocaleString() || "-"}</span>
              </div>
            </div>
          </div>

          {/* Fabric Information */}
          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>🧵</span>
              <h3 style={styles.cardTitle}>Fabric Information</h3>
            </div>
            <div style={styles.infoList}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Fabric Type:</span>
                <span style={{
                  ...styles.fabricTypeBadge,
                  backgroundColor: tna.fabric_type === 'imported' ? '#8b5cf6' : '#f59e0b'
                }}>
                  {tna.fabric_type === 'imported' ? '🌍 Imported' : '🏠 Local'}
                </span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Fabric Supplier:</span>
                <span style={styles.infoValue}>{tna.fabric_supplier || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Dates Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionIcon}>📝</span>
            <h2 style={styles.sectionTitle}>Input Dates</h2>
            <span style={styles.sectionHint}>Base dates for calculations</span>
          </div>
          <div style={styles.datesGrid}>
            <div style={styles.dateCard}>
              <label style={styles.dateLabel}>Shipment Date</label>
              <div style={styles.dateValue}>{formatDate(tna.shipment_date)}</div>
            </div>
            <div style={styles.dateCard}>
              <label style={styles.dateLabel}>Order Booking Date</label>
              <div style={styles.dateValue}>{formatDate(tna.order_booking_date)}</div>
              <div style={styles.formulaHint}>→ Calculates: Lab Dip, Fit Sample</div>
            </div>
            <div style={styles.dateCard}>
              <label style={styles.dateLabel}>Fabric Booking Date</label>
              <div style={styles.dateValue}>{formatDate(tna.fabric_booking_date)}</div>
              <div style={styles.formulaHint}>→ Calculates: Fabric LC, Bulk Fabric Approve Date{tna.fabric_type !== 'imported' ? ', PPS' : ''}</div>
            </div>
          </div>
        </div>

        {/* Auto-Calculated Dates Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionIcon}>⚡</span>
            <h2 style={styles.sectionTitle}>Auto-Calculated Dates</h2>
            <span style={styles.sectionHint}>Generated automatically</span>
          </div>
          <div style={styles.calculatedColumns}>
            <div style={styles.calculatedColumn}>
              <div style={styles.calculatedCard}>
                <label style={styles.calculatedLabel}>Bulk Fabric Approve Date</label>
                <div style={styles.calculatedValue}>{formatDate(tna.bulk_fabric_approve_date)}</div>
                <div style={styles.formulaHint}>= Fabric Booking Date + 30 days</div>
              </div>
              <div style={styles.calculatedCard}>
                <label style={styles.calculatedLabel}>Fabric ETD</label>
                <div style={styles.calculatedValue}>{formatDate(tna.fabric_etd)}</div>
                <div style={styles.formulaHint}>= Bulk Fabric Approve Date + 35 days</div>
              </div>
              <div style={styles.calculatedCard}>
                <label style={styles.calculatedLabel}>Fabric ETA</label>
                <div style={styles.calculatedValue}>{formatDate(tna.fabric_eta)}</div>
                <div style={styles.formulaHint}>= Fabric ETD + 15 days</div>
              </div>
              <div style={styles.calculatedCard}>
                <label style={styles.calculatedLabel}>Fabric Inhouse Date</label>
                <div style={styles.calculatedValue}>{formatDate(tna.fabric_inhouse_date)}</div>
                <div style={styles.formulaHint}>= Fabric ETA + 10 days</div>
              </div>
              <div style={styles.calculatedCard}>
                <label style={styles.calculatedLabel}>Production Start Date</label>
                <div style={styles.calculatedValue}>{formatDate(tna.production_start_date)}</div>
                <div style={styles.formulaHint}>= Fabric Inhouse + 10 days</div>
              </div>
              {tna.fabric_type === 'imported' && (
                <div style={styles.calculatedCard}>
                  <label style={styles.calculatedLabel}>PP Sample Yardage (China)</label>
                  <div style={styles.calculatedValue}>{formatDate(tna.pp_sample_yardage_china_date)}</div>
                  <div style={styles.formulaHint}>= Fabric ETD - 7 days</div>
                </div>
              )}
            </div>

            <div style={styles.calculatedColumn}>
              <div style={styles.calculatedCard}>
                <label style={styles.calculatedLabel}>Lab Dip Date</label>
                <div style={styles.calculatedValue}>{formatDate(tna.lab_dip_date)}</div>
                <div style={styles.formulaHint}>= Order Booking Date + 15 days</div>
              </div>
              <div style={styles.calculatedCard}>
                <label style={styles.calculatedLabel}>Fit Sample Date</label>
                <div style={styles.calculatedValue}>{formatDate(tna.fit_sample_date)}</div>
                <div style={styles.formulaHint}>= Order Booking Date + 15 days</div>
              </div>
              <div style={styles.calculatedCard}>
                <label style={styles.calculatedLabel}>PS Date</label>
                <div style={styles.calculatedValue}>{formatDate(tna.ps_date)}</div>
                <div style={styles.formulaHint}>= Production Start + 10 days</div>
              </div>
              <div style={styles.calculatedCard}>
                <label style={styles.calculatedLabel}>PPS Date</label>
                <div style={styles.calculatedValue}>{formatDate(tna.pps_date)}</div>
                <div style={styles.formulaHint}>
                  {tna.fabric_type === 'imported'
                    ? '= PP Sample Yardage (China) + 12 days'
                    : '= Fabric Booking Date + 20 days'}
                </div>
              </div>
              <div style={styles.calculatedCard}>
                <label style={styles.calculatedLabel}>Test Samples Date</label>
                <div style={styles.calculatedValue}>{formatDate(tna.test_samples_date)}</div>
                <div style={styles.formulaHint}>= Production Start - 10 days</div>
              </div>
              <div style={styles.calculatedCard}>
                <label style={styles.calculatedLabel}>Fabric LC Date</label>
                <div style={styles.calculatedValue}>{formatDate(tna.fabric_lc_date)}</div>
                <div style={styles.formulaHint}>= Fabric Booking Date + 10 days</div>
              </div>
            </div>
          </div>
        </div>

        {/* Remarks Section */}
        {tna.remarks && (
          <div style={styles.remarksCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>📝</span>
              <h3 style={styles.cardTitle}>Remarks</h3>
            </div>
            <p style={styles.remarksText}>{tna.remarks}</p>
          </div>
        )}

        {/* Metadata */}
        <div style={styles.metadataCard}>
          <div style={styles.metadataRow}>
            <span style={styles.metadataLabel}>Created:</span>
            <span style={styles.metadataValue}>{formatDate(tna.created_at)}</span>
          </div>
          <div style={styles.metadataRow}>
            <span style={styles.metadataLabel}>Last Updated:</span>
            <span style={styles.metadataValue}>{formatDate(tna.updated_at)}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f0f2f5",
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
  errorContainer: {
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
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: "16px",
    padding: "24px 28px",
    marginBottom: "24px",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  headerBadge: {
    background: "rgba(255,255,255,0.15)",
    borderRadius: "14px",
    padding: "10px 14px",
    fontSize: "22px",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "white",
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.7)",
    margin: "4px 0 0 0",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.15)",
    color: "white",
    padding: "10px 20px",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "500",
  },
  btnEdit: {
    background: "#f59e0b",
    color: "white",
    padding: "10px 20px",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "500",
  },
  btnDelete: {
    background: "#ef4444",
    color: "white",
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  },
  summaryCard: {
    background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
  },
  summaryContent: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  summaryIcon: {
    fontSize: "48px",
  },
  summaryInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  summaryLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
  },
  summaryValue: {
    fontSize: "36px",
    fontWeight: "700",
    color: "white",
  },
  summaryHint: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.5)",
  },
  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
    marginBottom: "24px",
  },
  infoCard: {
    background: "white",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "16px 20px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  cardIcon: {
    fontSize: "18px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  infoList: {
    padding: "16px 20px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  infoLabel: {
    fontSize: "13px",
    color: "#64748b",
  },
  infoValue: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#1f2937",
  },
  fabricTypeBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    color: "white",
  },
  section: {
    background: "white",
    borderRadius: "16px",
    marginBottom: "24px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "16px 24px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  sectionIcon: {
    fontSize: "20px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  sectionHint: {
    fontSize: "11px",
    color: "#94a3b8",
    marginLeft: "auto",
  },
  datesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    padding: "24px",
  },
  dateCard: {
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  dateLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    display: "block",
    marginBottom: "8px",
  },
  dateValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
  },
  calculatedColumns: {
    display: "flex",
    gap: "16px",
    padding: "24px",
    flexWrap: "wrap",
  },
  calculatedColumn: {
    flex: "1 1 280px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  calculatedCard: {
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  calculatedLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    display: "block",
    marginBottom: "8px",
  },
  calculatedValue: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "6px",
  },
  formulaHint: {
    fontSize: "10px",
    color: "#8b5cf6",
  },
  progressWrap: {
    padding: "24px",
  },
  progressBarTrack: {
    display: "flex",
    width: "100%",
    height: "18px",
    borderRadius: "999px",
    overflow: "hidden",
    background: "#e2e8f0",
    border: "1px solid #e2e8f0",
  },
  progressBarSegment: {
    height: "100%",
    transition: "background-color 0.2s ease",
  },
  progressTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: "12px",
  },
  progressTotalLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
  },
  progressTotalValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
  },
  progressStagesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginTop: "20px",
  },
  progressStageCard: {
    padding: "14px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  progressStageHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  progressStageDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  progressStageLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
    flex: 1,
  },
  progressStageWeight: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#94a3b8",
  },
  progressStageBtn: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "white",
    color: "#334155",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  progressStageBtnApproved: {
    background: "#d1fae5",
    border: "1px solid #10b981",
    color: "#059669",
  },
  remarksCard: {
    background: "white",
    borderRadius: "16px",
    marginBottom: "24px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  remarksText: {
    padding: "16px 20px",
    fontSize: "14px",
    color: "#475569",
    lineHeight: "1.6",
    margin: 0,
  },
  metadataCard: {
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
  },
  metadataRow: {
    display: "flex",
    gap: "12px",
    fontSize: "12px",
  },
  metadataLabel: {
    color: "#64748b",
  },
  metadataValue: {
    color: "#1f2937",
    fontWeight: "500",
  },
};