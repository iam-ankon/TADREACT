// BuyerDetails.jsx - Individual buyer details view
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";

// Helper function to get customer display name
const getCustomerDisplayName = (customer) => {
  if (!customer) return "-";
  if (typeof customer === "object") {
    if (customer.customer_name) return customer.customer_name;
    if (customer.name) {
      if (typeof customer.name === "object") {
        if (customer.name.customer_name) return customer.name.customer_name;
        if (customer.name.name) return customer.name.name;
      }
      if (typeof customer.name === "string") return customer.name;
    }
    if (customer.hrms_customer_name) return customer.hrms_customer_name;
    if (customer.display_name) return customer.display_name;
    return `Customer ${customer.id}`;
  }
  return customer.toString() || "-";
};

export default function BuyerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchBuyerDetails();
  }, [id]);

  const fetchBuyerDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [buyerRes, customersRes] = await Promise.all([
        axios.get(`http://119.148.51.38:8000/api/merchandiser/api/buyer/${id}/`),
        axios.get("http://119.148.51.38:8000/api/merchandiser/api/customer/"),
      ]);
      setBuyer(buyerRes.data);
      setCustomers(customersRes.data);
    } catch (err) {
      console.error("Error fetching buyer details:", err);
      setError("Failed to load buyer details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this buyer?")) {
      try {
        await axios.delete(`http://119.148.51.38:8000/api/merchandiser/api/buyer/${id}/`);
        navigate("/buyers");
      } catch (err) {
        console.error("Error deleting buyer:", err);
        setError("Failed to delete buyer. Please try again.");
      }
    }
  };

  // Get buyer's customers
  const getBuyerCustomers = () => {
    if (!buyer?.customers) return [];
    return customers.filter((customer) => buyer.customers.includes(customer.id));
  };

  // Get rows data
  const getRowsData = () => {
    return buyer?.rows || [];
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading buyer details...</p>
        </div>
      </div>
    );
  }

  if (error || !buyer) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>⚠️</div>
          <h2>{error || "Buyer not found"}</h2>
          <button onClick={() => navigate("/buyers")} style={styles.backButton}>
            Back to Buyers
          </button>
        </div>
      </div>
    );
  }

  const buyerCustomers = getBuyerCustomers();
  const rows = getRowsData();

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <button onClick={() => navigate("/buyers")} style={styles.backBtn}>
                ← Back
              </button>
              <div style={styles.headerBadge}>🏢</div>
              <div>
                <h1 style={styles.headerTitle}>{buyer.name || "Buyer Details"}</h1>
                <p style={styles.headerSubtitle}>View buyer information and assignments</p>
              </div>
            </div>
            <div style={styles.headerActions}>
              <Link to={`/edit-buyer/${buyer.id}`} style={styles.editBtn}>
                ✏️ Edit Buyer
              </Link>
              <button onClick={handleDelete} style={styles.deleteBtn}>
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>

        {/* Basic Information Card */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <div style={styles.cardIcon}>📋</div>
            Basic Information
          </div>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <label>Buyer Name</label>
              <div style={styles.infoValue}>{buyer.name || "-"}</div>
            </div>
            <div style={styles.infoItem}>
              <label>Email Address</label>
              <div style={styles.infoValue}>{buyer.email || "-"}</div>
            </div>
            <div style={styles.infoItem}>
              <label>Phone Number</label>
              <div style={styles.infoValue}>{buyer.phone || "-"}</div>
            </div>
          </div>
        </div>

        {/* Customers Card */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <div style={styles.cardIcon}>👥</div>
            Assigned Customers
          </div>
          {buyerCustomers.length > 0 ? (
            <div style={styles.customersGrid}>
              {buyerCustomers.map((customer) => (
                <div key={customer.id} style={styles.customerCard}>
                  <div style={styles.customerName}>{getCustomerDisplayName(customer)}</div>
                  {customer.email && <div style={styles.customerEmail}>{customer.email}</div>}
                  {customer.phone && <div style={styles.customerPhone}>{customer.phone}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>No customers assigned to this buyer</div>
          )}
        </div>

        {/* Department, WGR, Items & Categories Card */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <div style={styles.cardIcon}>📊</div>
            Department, WGR, Items & Product Categories
          </div>
          {rows.length > 0 ? (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Department</th>
                    <th style={styles.th}>WGR Number</th>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>Product Category</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td style={styles.td}>{idx + 1}</td>
                      <td style={styles.td}>{row.department || "-"}</td>
                      <td style={styles.td}>{row.wgr_number || "-"}</td>
                      <td style={styles.td}>{row.item || "-"}</td>
                      <td style={styles.td}>{row.product_category || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.emptyState}>No rows data available</div>
          )}
        </div>

        {/* Remarks Card */}
        {buyer.remarks && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <div style={styles.cardIcon}>📝</div>
              Remarks / Notes
            </div>
            <div style={styles.remarksText}>{buyer.remarks}</div>
          </div>
        )}


      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
    fontFamily: "'Inter', sans-serif",
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
  errorContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    textAlign: "center",
  },
  errorIcon: {
    fontSize: "48px",
  },
  backButton: {
    padding: "10px 24px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  header: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: "14px",
    padding: "20px 24px",
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
  backBtn: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
  },
  headerBadge: {
    background: "rgba(255,255,255,0.15)",
    borderRadius: "12px",
    padding: "8px 12px",
    fontSize: "20px",
  },
  headerTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "white",
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.8)",
    margin: "4px 0 0 0",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  editBtn: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    padding: "8px 20px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "600",
  },
  deleteBtn: {
    background: "#ef4444",
    color: "white",
    padding: "8px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  cardTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "2px solid #f1f5f9",
  },
  cardIcon: {
    fontSize: "18px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  infoValue: {
    fontSize: "15px",
    color: "#1e293b",
    fontWeight: "500",
    wordBreak: "break-word",
  },
  customersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
  },
  customerCard: {
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid #e2e8f0",
  },
  customerName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "8px",
  },
  customerEmail: {
    fontSize: "12px",
    color: "#3b82f6",
    marginBottom: "4px",
  },
  customerPhone: {
    fontSize: "12px",
    color: "#64748b",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    background: "#f8fafc",
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#94a3b8",
    fontSize: "14px",
  },
  remarksText: {
    fontSize: "14px",
    color: "#334155",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
};

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}