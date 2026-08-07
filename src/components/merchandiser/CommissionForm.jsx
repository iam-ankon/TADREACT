// CommissionForm.jsx — TexWeave Dashboard Style with proper API client
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Sidebar from "../merchandiser/Sidebar";
import { getOrderById, updateOrder, createOrder } from "../../api/merchandiser";

const CommissionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    po_no: "",
    style: "",
    customer_name: "",
    supplier: "",
    estimated_commission: "",
    actual_commission: "",
    commission_percent: "",
    commission_rec_date: "",
    status: "Running",
    total_value: "",
    total_qty: "",
    unit_price: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEdit) {
      const fetchOrder = async () => {
        try {
          const response = await getOrderById(id);
          const data = response.data;
          
          // Handle PO number - if it's an array or comma-separated string, take the first one
          let poNo = data.po_no || "";
          if (Array.isArray(poNo)) {
            poNo = poNo[0] || "";
          } else if (typeof poNo === 'string' && poNo.includes(',')) {
            // If multiple PO numbers are comma-separated, take the first one
            const parts = poNo.split(',').map(p => p.trim());
            poNo = parts[0] || poNo;
          }
          
          // Get customer name from various possible fields
          let customerName = "";
          if (data.customer_display) {
            customerName = data.customer_display;
          } else if (data.customer_name) {
            customerName = data.customer_name;
          } else if (data.customer) {
            if (typeof data.customer === 'object' && data.customer.customer_name) {
              customerName = data.customer.customer_name;
            } else if (typeof data.customer === 'string') {
              customerName = data.customer;
            }
          }
          
          // Get supplier name
          let supplierName = "";
          if (data.supplier_name) {
            supplierName = data.supplier_name;
          } else if (data.supplier) {
            if (typeof data.supplier === 'object') {
              supplierName = data.supplier.supplier_name || data.supplier.name || "";
            } else if (typeof data.supplier === 'string') {
              supplierName = data.supplier;
            }
          }
          
          setFormData({
            po_no: poNo,
            style: data.style || "",
            customer_name: customerName,
            supplier: supplierName,
            estimated_commission: data.estimated_commission || "",
            actual_commission: data.actual_commission || "",
            commission_percent: data.commission_percent || "",
            commission_rec_date: data.commission_rec_date || "",
            status: data.status || "Running",
            total_value: data.total_value || "",
            total_qty: data.total_qty || "",
            unit_price: data.unit_price || "",
            remarks: data.remarks || "",
          });
        } catch (error) {
          console.error("Error fetching order:", error);
          if (error.response?.status === 401) {
            setError("Authentication failed. Please login again.");
            setTimeout(() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }, 2000);
          } else {
            setError(error.response?.data?.detail || error.message || "Failed to load order data.");
          }
        } finally {
          setFetching(false);
        }
      };
      fetchOrder();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      estimated_commission: formData.estimated_commission
        ? parseFloat(formData.estimated_commission)
        : null,
      actual_commission: formData.actual_commission
        ? parseFloat(formData.actual_commission)
        : null,
      commission_percent: formData.commission_percent
        ? parseFloat(formData.commission_percent)
        : null,
      commission_rec_date: formData.commission_rec_date || null,
      status: formData.status,
      remarks: formData.remarks,
    };

    try {
      let result;
      if (isEdit) {
        result = await updateOrder(id, payload);
      } else {
        result = await createOrder({
          ...payload,
          po_no: formData.po_no || "N/A",
          style: formData.style || "N/A",
        });
      }
      navigate(`/commissions/${result.data.id}`);
    } catch (error) {
      console.error("Error saving commission:", error);
      if (error.response?.status === 401) {
        setError("Authentication failed. Please login again.");
        setTimeout(() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }, 2000);
      } else {
        setError(error.response?.data?.detail || error.message || "An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={S.appContainer}>
        <Sidebar />
        <div style={S.loaderArea}>
          <div style={S.spinner}></div>
          <p style={{ color: "#64748b", marginTop: 12, fontSize: 14 }}>
            Loading order data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={S.appContainer}>
      <Sidebar />
      <div style={S.main}>
        {/* Breadcrumb */}
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
            {isEdit ? "Edit Record" : "New Record"}
          </span>
        </div>

        {/* Header */}
        <div style={S.pageHeader}>
          <div>
            <h1 style={S.pageTitle}>
              {isEdit ? "Edit Commission" : "Add New Record"}
            </h1>
            <p style={S.pageSubtitle}>
              {isEdit
                ? `Updating record for ${formData.po_no || id}`
                : "Fill in the details to create a new commission record"}
            </p>
          </div>
          <button onClick={() => navigate("/commissions")} style={S.outlineBtn}>
            ← Back to List
          </button>
        </div>

        {error && (
          <div style={S.errorBox}>
            <span style={{ fontSize: 16, marginRight: 8 }}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={S.formLayout}>
            {/* Main column */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Order Information */}
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Order Information</span>
                  <span style={S.cardSubtitle}>
                    Read-only — managed from PO Management
                  </span>
                </div>
                <div style={S.grid2}>
                  <Field
                    label="PO Number"
                    name="po_no"
                    value={formData.po_no}
                    onChange={handleChange}
                    placeholder="e.g. PO45221"
                    readOnly
                  />
                  <Field
                    label="Style"
                    name="style"
                    value={formData.style}
                    onChange={handleChange}
                    placeholder="Style name"
                    readOnly
                  />
                  <Field
                    label="Customer"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    placeholder="Customer name"
                    readOnly
                  />
                  <Field
                    label="Supplier"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    placeholder="Supplier name"
                    readOnly
                  />
                  <Field
                    label="Total Quantity"
                    name="total_qty"
                    type="number"
                    value={formData.total_qty}
                    onChange={handleChange}
                    placeholder="0"
                    readOnly
                  />
                  <Field
                    label="Total Value ($)"
                    name="total_value"
                    type="number"
                    step="0.01"
                    value={formData.total_value}
                    onChange={handleChange}
                    placeholder="0.00"
                    readOnly
                  />
                  <Field
                    label="Unit Price ($)"
                    name="unit_price"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    readOnly
                  />
                </div>
              </div>

              {/* Commission Details */}
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Commission Details</span>
                </div>
                <div style={S.grid2}>
                  <Field
                    label="Estimated Commission ($)"
                    name="estimated_commission"
                    type="number"
                    step="0.01"
                    value={formData.estimated_commission}
                    onChange={handleChange}
                    placeholder="0.00"
                    helper="Expected commission amount"
                  />
                  <Field
                    label="Actual Commission ($)"
                    name="actual_commission"
                    type="number"
                    step="0.01"
                    value={formData.actual_commission}
                    onChange={handleChange}
                    placeholder="0.00"
                    helper="Commission amount received"
                    accent="#16a34a"
                  />
                  <Field
                    label="Commission Percentage (%)"
                    name="commission_percent"
                    type="number"
                    step="0.01"
                    value={formData.commission_percent}
                    onChange={handleChange}
                    placeholder="e.g. 5.00"
                    helper="e.g. 5.00 for 5%"
                  />
                  <Field
                    label="Receipt Date"
                    name="commission_rec_date"
                    type="date"
                    value={formData.commission_rec_date}
                    onChange={handleChange}
                    helper="Date commission was received"
                  />
                </div>

                {/* Live variance preview */}
                {formData.estimated_commission &&
                  formData.actual_commission && (
                    <div
                      style={{
                        ...S.varianceBox,
                        background:
                          parseFloat(formData.actual_commission) -
                            parseFloat(formData.estimated_commission) <
                          0
                            ? "#fef2f2"
                            : "#f0fdf4",
                        border: `1px solid ${parseFloat(formData.actual_commission) - parseFloat(formData.estimated_commission) < 0 ? "#fecaca" : "#bbf7d0"}`,
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
                          color:
                            parseFloat(formData.actual_commission) -
                              parseFloat(formData.estimated_commission) <
                            0
                              ? "#dc2626"
                              : "#16a34a",
                        }}
                      >
                        {(() => {
                          const v =
                            parseFloat(formData.actual_commission) -
                            parseFloat(formData.estimated_commission);
                          return `${v < 0 ? "-" : "+"}$${Math.abs(v).toFixed(2)}`;
                        })()}
                      </span>
                    </div>
                  )}
              </div>

              {/* Remarks */}
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Remarks</span>
                </div>
                <label style={S.label}>Notes / Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  style={S.textarea}
                  rows={3}
                  placeholder="Add any notes about this commission record..."
                />
              </div>
            </div>

            {/* Right sidebar — sticky */}
            <div
              style={{
                width: 260,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                position: "sticky",
                top: 24,
                alignSelf: "flex-start",
              }}
            >
              {/* Status */}
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Order Status</span>
                </div>
                <label style={S.label}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={S.select}
                >
                  <option value="Running">Running</option>
                  <option value="Active">Active</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <div style={{ marginTop: 12 }}>
                  {(() => {
                    const st = {
                      Running: { background: "#dbeafe", color: "#1d4ed8" },
                      Active: { background: "#dcfce7", color: "#15803d" },
                      Shipped: { background: "#f1f5f9", color: "#475569" },
                      Pending: { background: "#fef3c7", color: "#b45309" },
                      Cancelled: { background: "#fee2e2", color: "#dc2626" },
                    }[formData.status] || {
                      background: "#f1f5f9",
                      color: "#475569",
                    };
                    return (
                      <span style={{ ...S.badge, ...st }}>
                        {formData.status}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Summary preview */}
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Quick Summary</span>
                </div>
                {[
                  ["PO No.", formData.po_no || "—"],
                  ["Customer", formData.customer_name || "—"],
                  [
                    "Est. Commission",
                    formData.estimated_commission
                      ? `$${parseFloat(formData.estimated_commission).toFixed(2)}`
                      : "—",
                  ],
                  [
                    "Actual Commission",
                    formData.actual_commission
                      ? `$${parseFloat(formData.actual_commission).toFixed(2)}`
                      : "—",
                  ],
                  [
                    "Commission %",
                    formData.commission_percent
                      ? `${parseFloat(formData.commission_percent).toFixed(2)}%`
                      : "—",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid #f8fafc",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#64748b" }}>{label}</span>
                    <span style={{ color: "#0f172a", fontWeight: 500 }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={S.card}>
                <button
                  type="submit"
                  style={{
                    ...S.primaryBtn,
                    width: "100%",
                    marginBottom: 8,
                    opacity: loading ? 0.7 : 1,
                  }}
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : isEdit
                      ? "✓ Update Record"
                      : "+ Create Record"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/commissions")}
                  style={{ ...S.outlineBtn, width: "100%" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/* Reusable field component */
const Field = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  step,
  placeholder,
  helper,
  readOnly,
  accent,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={S.label}>{label}</label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      step={step}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        ...S.input,
        ...(readOnly
          ? { background: "#f8fafc", color: "#94a3b8", cursor: "not-allowed" }
          : {}),
        ...(accent ? { borderColor: accent + "60" } : {}),
      }}
    />
    {helper && <span style={S.helper}>{helper}</span>}
  </div>
);

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
    overflowY: "auto",
    height: "100vh",
    boxSizing: "border-box",
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

  formLayout: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    position: "relative",
  },

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
  cardSubtitle: { fontSize: 12, color: "#94a3b8" },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" },

  label: { fontSize: 12, fontWeight: 500, color: "#475569" },
  input: {
    padding: "9px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    background: "#fafbfc",
    color: "#0f172a",
    transition: "border-color 0.15s, box-shadow 0.15s",
    width: "100%",
    boxSizing: "border-box",
  },
  select: {
    padding: "9px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    background: "#fafbfc",
    color: "#0f172a",
    cursor: "pointer",
    width: "100%",
  },
  textarea: {
    padding: "9px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical",
    background: "#fafbfc",
    width: "100%",
    boxSizing: "border-box",
    color: "#0f172a",
  },
  helper: { fontSize: 11, color: "#94a3b8" },

  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#dc2626",
    fontSize: 14,
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
  },

  varianceBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: 8,
    marginTop: 14,
  },

  badge: {
    display: "inline-block",
    padding: "4px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },

  primaryBtn: {
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    display: "inline-block",
    textAlign: "center",
    boxSizing: "border-box",
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
    boxSizing: "border-box",
  },
};

const styleEl = document.createElement("style");
styleEl.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  input:focus, select:focus, textarea:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important;
  }
`;
document.head.appendChild(styleEl);

export default CommissionForm;