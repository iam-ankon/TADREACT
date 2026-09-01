// CommissionDetails.jsx — TexWeave Dashboard Style with proper API client
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Sidebar from "../merchandiser/Sidebar";
import { getOrderById } from "../../api/merchandiser";
import { canViewOrderPricing } from "../../utils/accessControl";

const CommissionDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the authenticated API client instead of raw fetch
        const response = await getOrderById(id);
        setOrder(response.data);
      } catch (err) {
        console.error("Error fetching order:", err);
        if (err.response?.status === 401) {
          setError("Authentication failed. Please login again.");
          // Optionally redirect to login
          setTimeout(() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }, 2000);
        } else {
          setError(err.response?.data?.detail || err.message || "Order not found");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const fmt = (v) =>
    v == null
      ? "—"
      : `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtPct = (v) => (v == null ? "—" : `${Number(v).toFixed(2)}%`);
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const getStatusStyle = (status) => {
    const map = {
      Running: { background: "#dbeafe", color: "#1d4ed8" },
      Active: { background: "#dcfce7", color: "#15803d" },
      Shipped: { background: "#f1f5f9", color: "#475569" },
      Pending: { background: "#fef3c7", color: "#b45309" },
      Cancelled: { background: "#fee2e2", color: "#dc2626" },
      Received: { background: "#dcfce7", color: "#15803d" },
    };
    return map[status] || { background: "#f1f5f9", color: "#475569" };
  };

  const getCustomerName = (order) => {
    if (!order) return "—";
    if (order.customer_display) return order.customer_display;
    if (order.customer_name) return order.customer_name;
    if (order.customer) {
      if (typeof order.customer === 'object' && order.customer.customer_name) {
        return order.customer.customer_name;
      }
      if (typeof order.customer === 'string') return order.customer;
    }
    return "—";
  };

  const getSupplierName = (order) => {
    if (!order) return "—";
    if (order.supplier_name) return order.supplier_name;
    if (order.supplier) {
      if (typeof order.supplier === 'object') {
        return order.supplier.supplier_name || order.supplier.name || "—";
      }
      return order.supplier;
    }
    return "—";
  };

  if (loading) {
    return (
      <div style={S.appContainer}>
        <Sidebar />
        <div style={S.loaderArea}>
          <div style={S.spinner}></div>
          <p style={{ color: "#64748b", marginTop: 12, fontSize: 14 }}>
            Loading commission details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={S.appContainer}>
        <Sidebar />
        <div style={S.loaderArea}>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: "48px 40px",
              textAlign: "center",
              maxWidth: 480,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2
              style={{
                color: "#0f172a",
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {error || "Order not found"}
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
              {error?.includes("Authentication") 
                ? "Please login again to continue." 
                : "The order you're looking for doesn't exist."}
            </p>
            <button
              onClick={() => navigate("/commissions")}
              style={S.primaryBtn}
            >
              ← Back to Commission List
            </button>
          </div>
        </div>
      </div>
    );
  }

  const variance =
    order.estimated_commission && order.actual_commission
      ? Number(order.actual_commission) - Number(order.estimated_commission)
      : null;

  const st = getStatusStyle(order.status);
  const customerName = getCustomerName(order);
  const supplierName = getSupplierName(order);

  return (
    <div style={S.appContainer}>
      <Sidebar />
      <div style={S.main}>
        {/* ── Breadcrumb + Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "#94a3b8",
            marginBottom: 18,
          }}
        >
          <Link
            to="/commissions"
            style={{ color: "#94a3b8", textDecoration: "none" }}
          >
            Commission Records
          </Link>
          <span>/</span>
          <span style={{ color: "#0f172a", fontWeight: 500 }}>
            {order.pdm_no || (order.id ? `ORD${String(order.id).padStart(3, "0")}` : "Detail")}
          </span>
        </div>

        <div style={S.pageHeader}>
          <div>
            <h1 style={S.pageTitle}>Commission Details</h1>
            <p style={S.pageSubtitle}>
              Full breakdown for order {order.pdm_no || order.po_no || id}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => navigate("/commissions")}
              style={S.outlineBtn}
            >
              ← Back to List
            </button>
            {canViewOrderPricing() && (
              <Link to={`/commissions/edit/${id}`} style={S.primaryBtn}>
                ✏️ Edit Record
              </Link>
            )}
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div style={S.kpiStrip}>
          {[
            {
              label: "Order No.",
              value: order.id ? `ORD${String(order.id).padStart(3, "0")}` : "—",
              color: "#2563eb",
              icon: "🛒",
            },
            ...(canViewOrderPricing()
              ? [
                  {
                    label: "Total Value",
                    value: fmt(order.total_value),
                    color: "#16a34a",
                    icon: "💵",
                  },
                  {
                    label: "Est. Commission",
                    value: fmt(order.estimated_commission),
                    color: "#d97706",
                    icon: "%",
                  },
                  {
                    label: "Actual Commission",
                    value: fmt(order.actual_commission),
                    color: "#7c3aed",
                    icon: "💼",
                    green: true,
                  },
                  {
                    label: "Variance",
                    value:
                      variance === null
                        ? "—"
                        : `${variance < 0 ? "-" : "+"}$${Math.abs(variance).toFixed(2)}`,
                    color:
                      variance === null
                        ? "#64748b"
                        : variance < 0
                          ? "#dc2626"
                          : "#16a34a",
                    icon: "↕",
                    isVariance: true,
                    negative: variance !== null && variance < 0,
                  },
                ]
              : []),
          ].map((k) => (
            <div key={k.label} style={S.kpiCard}>
              <div style={{ ...S.kpiIcon, background: k.color + "18" }}>
                <span style={{ fontSize: 18 }}>{k.icon}</span>
              </div>
              <div>
                <div style={S.kpiLabel}>{k.label}</div>
                <div
                  style={{
                    ...S.kpiValue,
                    color: k.isVariance || k.green ? k.color : "#0f172a",
                  }}
                >
                  {k.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={S.columns}>
          {/* Left column */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Order Info */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>Order Information</span>
                <span style={{ ...S.badge, ...st }}>{order.status || "—"}</span>
              </div>
              <div style={S.infoGrid}>
                {[
                  ["Order No. (PDM)", order.pdm_no || order.po_no || "—"],
                  ["Style", order.style || "—"],
                  ["Customer", customerName],
                  ["Supplier", supplierName],
                  [
                    "Total Quantity",
                    order.total_qty
                      ? Number(order.total_qty).toLocaleString()
                      : "—",
                  ],
                  ...(canViewOrderPricing()
                    ? [
                        ["Total Value", fmt(order.total_value)],
                        [
                          "Unit Price",
                          order.unit_price
                            ? `$${Number(order.unit_price).toFixed(2)}`
                            : "—",
                        ],
                      ]
                    : []),
                  ["WGR", order.wgr || "—"],
                ].map(([label, value]) => (
                  <div key={label} style={S.infoItem}>
                    <span style={S.infoLabel}>{label}</span>
                    <span style={S.infoValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>Order Timeline</span>
              </div>
              <div style={S.infoGrid}>
                {[
                  ["Created At", fmtDate(order.created_at)],
                  ["Last Updated", fmtDate(order.updated_at)],
                  ["Shipment Date", fmtDate(order.shipment_date)],
                  ["ETD", fmtDate(order.etd)],
                ].map(([label, value]) => (
                  <div key={label} style={S.infoItem}>
                    <span style={S.infoLabel}>{label}</span>
                    <span style={S.infoValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div
            style={{
              width: 320,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Commission Breakdown */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>Commission Breakdown</span>
              </div>

              {!canViewOrderPricing() ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "24px 0",
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  Commission amounts are not visible for your role.
                </div>
              ) : !order.estimated_commission && !order.actual_commission ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "24px 0",
                    color: "#94a3b8",
                  }}
                >
                  <p style={{ marginBottom: 12 }}>
                    No commission data recorded.
                  </p>
                  <Link
                    to={`/commissions/edit/${id}`}
                    style={{ color: "#2563eb", fontSize: 13, fontWeight: 500, textDecoration: "none" }}
                  >
                    + Add Commission Details
                  </Link>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    {[
                      {
                        label: "Estimated Commission",
                        value: fmt(order.estimated_commission),
                        accent: "#d97706",
                      },
                      {
                        label: "Actual Commission",
                        value: fmt(order.actual_commission),
                        accent: "#16a34a",
                      },
                      {
                        label: "Commission %",
                        value: fmtPct(order.commission_percent),
                        accent: "#2563eb",
                      },
                      {
                        label: "Receipt Date",
                        value: fmtDate(order.commission_rec_date),
                        accent: "#7c3aed",
                      },
                    ].map(({ label, value, accent }) => (
                      <div
                        key={label}
                        style={{
                          ...S.commRow,
                          borderLeft: `3px solid ${accent}`,
                        }}
                      >
                        <span style={S.commLabel}>{label}</span>
                        <span
                          style={{
                            ...S.commValue,
                            color:
                              label === "Actual Commission"
                                ? "#16a34a"
                                : "#0f172a",
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {variance !== null && (
                    <div
                      style={{
                        ...S.varianceBox,
                        background: variance < 0 ? "#fef2f2" : "#f0fdf4",
                        border: `1px solid ${variance < 0 ? "#fecaca" : "#bbf7d0"}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#475569",
                        }}
                      >
                        Variance (Est. vs Actual)
                      </span>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: variance < 0 ? "#dc2626" : "#16a34a",
                        }}
                      >
                        {variance < 0 ? "-" : "+"}$ 
                        {Math.abs(variance).toFixed(2)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Remarks */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>Remarks</span>
              </div>
              {order.remarks ? (
                <p
                  style={{
                    fontSize: 13,
                    color: "#334155",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {order.remarks}
                </p>
              ) : (
                <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                  No remarks added.
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>Actions</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {canViewOrderPricing() && (
                  <Link
                    to={`/commissions/edit/${id}`}
                    style={{
                      ...S.primaryBtn,
                      textAlign: "center",
                      display: "block",
                      textDecoration: "none",
                    }}
                  >
                    ✏️ Edit Commission
                  </Link>
                )}
                <button
                  onClick={() => navigate("/commissions")}
                  style={S.outlineBtn}
                >
                  ← Back to List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const S = {
  appContainer: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  main: {
    flex: 1,
    padding: "28px 32px",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
  },
  loaderArea: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    minHeight: "100vh",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 12,
    flexWrap: "wrap",
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  pageSubtitle: { fontSize: 14, color: "#64748b", margin: "4px 0 0" },

  kpiStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 14,
    marginBottom: 20,
  },
  kpiCard: {
    background: "#fff",
    borderRadius: 12,
    padding: "16px 18px",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: 14,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  kpiIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kpiLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 500,
    marginBottom: 2,
  },
  kpiValue: { fontSize: 18, fontWeight: 700, color: "#0f172a" },

  columns: { display: "flex", gap: 16, alignItems: "flex-start" },

  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "20px 22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "1px solid #f1f5f9",
  },
  cardTitle: { fontSize: 15, fontWeight: 600, color: "#0f172a" },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px 20px",
  },
  infoItem: { display: "flex", flexDirection: "column", gap: 2 },
  infoLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  infoValue: { fontSize: 14, fontWeight: 500, color: "#0f172a" },

  commRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    background: "#f8fafc",
    borderRadius: "0 8px 8px 0",
    paddingLeft: 14,
  },
  commLabel: { fontSize: 13, color: "#64748b", fontWeight: 500 },
  commValue: { fontSize: 15, fontWeight: 700 },

  varianceBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: 8,
    marginTop: 4,
  },

  badge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },

  primaryBtn: {
    padding: "9px 20px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    display: "inline-block",
  },
  outlineBtn: {
    padding: "9px 20px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#475569",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    width: "100%",
    textAlign: "center",
  },
};

const styleEl = document.createElement("style");
styleEl.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleEl);

export default CommissionDetails;