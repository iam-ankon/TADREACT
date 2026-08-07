import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../merchandiser/Sidebar.jsx";

// Helper function to get customer display name from nested object
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

// ---- Customer multi-select with search ----
function CustomerMultiSelect({ customers, selected = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const safeSelected = Array.isArray(selected) ? selected : [];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedCustomers = customers.filter((c) =>
    safeSelected.includes(c.id?.toString()),
  );
  const filtered = customers.filter(
    (c) =>
      !safeSelected.includes(c.id?.toString()) &&
      getCustomerDisplayName(c).toLowerCase().includes(search.toLowerCase()),
  );

  const remove = (id) =>
    onChange(safeSelected.filter((s) => s !== id.toString()));
  const add = (id) => {
    onChange([...safeSelected, id.toString()]);
    setSearch("");
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "8px 12px",
          minHeight: "44px",
          background: "#fff",
          cursor: "text",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
      >
        {selectedCustomers.map((c) => (
          <span
            key={c.id}
            style={{
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "#334155",
            }}
          >
            {getCustomerDisplayName(c)}
            <span
              onClick={(e) => {
                e.stopPropagation();
                remove(c.id);
              }}
              style={{
                cursor: "pointer",
                color: "#94a3b8",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              ×
            </span>
          </span>
        ))}
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={safeSelected.length === 0 ? "Search customers..." : ""}
          style={{
            border: "none",
            outline: "none",
            fontSize: "13px",
            flex: 1,
            minWidth: "140px",
            background: "transparent",
            color: "#1e293b",
          }}
        />
        <span
          style={{ color: "#94a3b8", fontSize: "11px", marginLeft: "auto" }}
        >
          ▼
        </span>
      </div>
      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 5px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
            zIndex: 100,
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => add(c.id)}
              style={{
                padding: "10px 14px",
                fontSize: "13px",
                cursor: "pointer",
                color: "#334155",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f8fafc")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {getCustomerDisplayName(c)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AddBuyer() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    remarks: "",
  });

  // Each row has: department, wgr, item, productCategory (single value, not array)
  const [tableRows, setTableRows] = useState([
    { id: Date.now(), department: "", wgr: "", item: "", productCategory: "" },
  ]);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    axios
      .get("http://119.148.51.38:8000/api/merchandiser/api/customer/")
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error("Error fetching customers:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (fieldErrors[name])
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  const updateRow = (index, field, value) => {
    console.log(`📝 Updating row ${index}, field ${field}:`, value);
    setTableRows((prevRows) => {
      const newRows = [...prevRows];
      newRows[index] = { ...newRows[index], [field]: value };
      return newRows;
    });
  };

  const addRow = () => {
    const newRow = {
      id: Date.now(),
      department: "",
      wgr: "",
      item: "",
      productCategory: "",
    };
    setTableRows((prev) => [...prev, newRow]);
    console.log("➕ Added new row");
  };

  const removeRow = (index) => {
    if (tableRows.length === 1) {
      setTableRows([
        {
          id: Date.now(),
          department: "",
          wgr: "",
          item: "",
          productCategory: "",
        },
      ]);
    } else {
      setTableRows((prev) => prev.filter((_, i) => i !== index));
    }
    console.log("❌ Removed row", index);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Buyer name is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Build row_data array with correct field names for serializer
      const rowData = tableRows
        .map((row, idx) => ({
          department: row.department?.trim() || "",
          wgr_number: row.wgr?.trim() || "", // Changed from 'wgr' to 'wgr_number'
          item: row.item?.trim() || "",
          product_category: row.productCategory?.trim() || "", // Changed from 'productCategory' to 'product_category'
        }))
        .filter(
          (row) =>
            row.department ||
            row.wgr_number ||
            row.item ||
            row.product_category,
        );

      console.log("📦 row_data being sent:", rowData);

      const payload = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        remarks: form.remarks || null,
        row_data: rowData, // Send row_data instead of separate arrays
        customers: selectedCustomers.map((cid) => Number(cid)),
      };

      console.log("📤 Final Payload:", JSON.stringify(payload, null, 2));

      const response = await axios.post(
        "http://119.148.51.38:8000/api/merchandiser/api/buyer/",
        payload,
        { headers: { "Content-Type": "application/json" } },
      );

      console.log("✅ Success! Buyer created:", response.data);
      navigate("/buyers");
    } catch (err) {
      console.error("Error adding buyer:", err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Failed to add buyer. Please try again.",
      );
      if (err.response?.data) setFieldErrors(err.response.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={S.container}>
      <Sidebar />
      <div style={S.main}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <div style={S.headerIconBox}>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div>
              <div style={S.headerTitle}>Add New Buyer</div>
              <div style={S.headerSub}>Create a new buyer profile</div>
            </div>
          </div>
          <div style={S.headerActions}>
            <button onClick={() => navigate("/buyers")} style={S.cancelBtn}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={S.saveBtn}
            >
              {isSubmitting ? "Creating..." : "Create Buyer"}
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={S.errorBanner}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} style={S.errorClose}>
              ×
            </button>
          </div>
        )}

        <div style={S.content}>
          {/* Basic Information Card */}
          <div style={S.card}>
            <div style={S.cardTitle}>
              <div style={S.cardIcon}>📋</div>
              Basic Information
            </div>
            <div style={S.formGrid}>
              <div style={S.fieldGroup}>
                <label style={S.label}>
                  Buyer Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter buyer name"
                  style={{
                    ...S.input,
                    borderColor: fieldErrors.name ? "#ef4444" : "#e2e8f0",
                  }}
                />
                {fieldErrors.name && (
                  <span style={S.errorText}>{fieldErrors.name}</span>
                )}
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="buyer@company.com"
                  style={{
                    ...S.input,
                    borderColor: fieldErrors.email ? "#ef4444" : "#e2e8f0",
                  }}
                />
                {fieldErrors.email && (
                  <span style={S.errorText}>{fieldErrors.email}</span>
                )}
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  style={S.input}
                />
              </div>
            </div>
          </div>

          {/* Customer Assignment Card */}
          <div style={S.card}>
            <div style={S.cardTitle}>
              <div style={S.cardIcon}>🏢</div>
              Customer Assignment
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Select Customers</label>
              <CustomerMultiSelect
                customers={customers}
                selected={selectedCustomers}
                onChange={setSelectedCustomers}
              />
              <p style={S.hintText}>
                Search and select customers to assign to this buyer
              </p>
            </div>
          </div>

          {/* Dynamic Rows Card */}
          <div style={S.card}>
            <div style={S.cardTitle}>
              <div style={S.cardIcon}>📊</div>
              Department, WGR, Items & Product Category
            </div>

            <div style={S.tableWrapper}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Department</th>
                    <th style={S.th}>WGR Number</th>
                    <th style={S.th}>Item</th>
                    <th style={S.th}>Product Category</th>
                    <th
                      style={{ ...S.th, width: "50px", textAlign: "center" }}
                    ></th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      style={idx % 2 === 0 ? {} : { background: "#fafafa" }}
                    >
                      <td style={S.td}>
                        <input
                          type="text"
                          value={row.department}
                          onChange={(e) =>
                            updateRow(idx, "department", e.target.value)
                          }
                          placeholder="e.g., Merchandising, Sourcing"
                          style={S.tableInput}
                        />
                      </td>
                      <td style={S.td}>
                        <input
                          type="text"
                          value={row.wgr}
                          onChange={(e) =>
                            updateRow(idx, "wgr", e.target.value)
                          }
                          placeholder="e.g., WGR-001, WGR-002"
                          style={S.tableInput}
                        />
                      </td>
                      <td style={S.td}>
                        <input
                          type="text"
                          value={row.item}
                          onChange={(e) =>
                            updateRow(idx, "item", e.target.value)
                          }
                          placeholder="e.g., T-Shirt, Jacket, Dress"
                          style={S.tableInput}
                        />
                      </td>
                      <td style={S.td}>
                        <input
                          type="text"
                          value={row.productCategory}
                          onChange={(e) =>
                            updateRow(idx, "productCategory", e.target.value)
                          }
                          placeholder="e.g., T-Shirts, Pants, Jackets"
                          style={S.tableInput}
                        />
                      </td>
                      <td style={{ ...S.td, textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          style={S.deleteBtn}
                          title="Remove row"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" onClick={addRow} style={S.addRowBtn}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add New Row
            </button>

            <div style={S.infoBox}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <span>
                💡 Each row represents one product category. Add multiple rows
                for multiple categories.
              </span>
            </div>
          </div>

          {/* Additional Information Card */}
          <div style={S.card}>
            <div style={S.cardTitle}>
              <div style={S.cardIcon}>📝</div>
              Additional Information
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Remarks / Notes</label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                rows={4}
                placeholder="Any additional notes about this buyer..."
                style={S.textarea}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        * {
          box-sizing: border-box;
        }
        input:focus, select:focus, textarea:focus {
          outline: none !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important;
        }
        button {
          transition: all 0.2s ease;
        }
        button:hover {
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

const S = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%)",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    maxHeight: "100vh",
    overflowY: "auto",
  },
  header: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    padding: "20px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    flexShrink: 0,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  headerIconBox: {
    width: "48px",
    height: "48px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backdropFilter: "blur(10px)",
  },
  headerTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#fff",
    lineHeight: 1.2,
    letterSpacing: "-0.01em",
  },
  headerSub: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.6)",
    marginTop: "4px",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  cancelBtn: {
    padding: "8px 20px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#fff",
    cursor: "pointer",
    backdropFilter: "blur(10px)",
  },
  saveBtn: {
    padding: "8px 24px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(34,197,94,0.3)",
  },
  errorBanner: {
    margin: "20px 28px 0",
    padding: "12px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    color: "#b91c1c",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#b91c1c",
    fontSize: "18px",
    lineHeight: 1,
    padding: "0 4px",
  },
  content: {
    padding: "24px 28px 32px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    transition: "box-shadow 0.2s",
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
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    padding: "10px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1e293b",
    background: "#fff",
    transition: "all 0.2s",
  },
  textarea: {
    padding: "10px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1e293b",
    resize: "vertical",
    fontFamily: "inherit",
    width: "100%",
    transition: "all 0.2s",
  },
  errorText: {
    fontSize: "11px",
    color: "#ef4444",
    marginTop: "2px",
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
  tableInput: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#334155",
    background: "#fff",
    transition: "all 0.2s",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#ef4444",
    padding: "6px",
    borderRadius: "6px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  addRowBtn: {
    marginTop: "16px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 20px",
    background: "transparent",
    border: "2px dashed #cbd5e1",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#3b82f6",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  hintText: {
    marginTop: "8px",
    fontSize: "11px",
    color: "#94a3b8",
  },
  infoBox: {
    marginTop: "16px",
    padding: "12px 16px",
    background: "#f0f9ff",
    borderRadius: "10px",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    fontSize: "12px",
    color: "#0369a1",
    border: "1px solid #bae6fd",
  },
};
