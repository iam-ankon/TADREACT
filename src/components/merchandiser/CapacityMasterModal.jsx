/**
 * CapacityMasterModal.jsx
 *
 * Lets a merchandiser set/edit the monthly Qty figure for one supplier
 * for one year. This is the manually-maintained number the report shows
 * on the top "Supplier" row. Capacity (the green row in the report) is
 * NOT set here — it's calculated automatically from Order data.
 * A simple 12-month grid, saved in one bulk request.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  getCapacityMasterForSupplierYear,
  bulkSaveCapacityMaster,
} from "../../api/merchandiser";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CapacityMasterModal = ({ suppliers, defaultYear, onClose, onSaved }) => {
  const [supplierId, setSupplierId] = useState(suppliers?.[0]?.id || "");
  const [year, setYear] = useState(defaultYear || new Date().getFullYear());
  const [months, setMonths] = useState({}); // { "1": 50000, "2": 50000, ... }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [success, setSuccess] = useState(false);

  const loadExisting = useCallback(async () => {
    if (!supplierId || !year) return;
    setLoading(true);
    setErr(null);
    setSuccess(false);
    try {
      const existing = await getCapacityMasterForSupplierYear(supplierId, year);
      const filled = {};
      for (let m = 1; m <= 12; m++) {
        filled[m] = existing[m] !== undefined ? existing[m] : "";
      }
      setMonths(filled);
    } catch (ex) {
      console.error("Failed to load existing Qty entries:", ex);
      const empty = {};
      for (let m = 1; m <= 12; m++) empty[m] = "";
      setMonths(empty);
    } finally {
      setLoading(false);
    }
  }, [supplierId, year]);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  const setMonthValue = (m, v) => {
    setMonths(prev => ({ ...prev, [m]: v }));
  };

  const applyToAll = () => {
    const first = months[1];
    if (first === "" || first === undefined) return;
    const next = {};
    for (let m = 1; m <= 12; m++) next[m] = first;
    setMonths(next);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!supplierId) { setErr("Please select a supplier."); return; }
    setSaving(true);
    setErr(null);
    setSuccess(false);
    try {
      await bulkSaveCapacityMaster(supplierId, year, months);
      setSuccess(true);
      onSaved?.();
    } catch (ex) {
      setErr(
        ex.response?.data?.detail ||
        "Failed to save Qty. Please check the values and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "6px 8px", borderRadius: 6,
    border: "1px solid #d1d5db", fontSize: 12, textAlign: "right",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 28,
        width: 640, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,.25)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h2 style={{ margin: 0, fontSize: 17, color: "#0f172a" }}>📝 Manage Supplier Qty</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <p style={{ margin: "0 0 18px", fontSize: 12, color: "#64748b" }}>
          Set the monthly Qty for a supplier — this is entered manually.
          Capacity is calculated automatically from Orders and shown for
          comparison; you don't need to enter it here.
        </p>

        {err && (
          <div style={{ padding: "10px 12px", background: "#fee2e2", color: "#dc2626", borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
            {err}
          </div>
        )}
        {success && (
          <div style={{ padding: "10px 12px", background: "#dcfce7", color: "#16a34a", borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
            ✓ Qty saved successfully.
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Supplier + Year selectors */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Supplier</label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                style={{ ...inputStyle, textAlign: "left", width: "100%" }}
              >
                <option value="">Select supplier…</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.supplier_name || s.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Year</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                style={{ ...inputStyle, textAlign: "left", width: "100%" }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 13 }}>
              Loading existing entries…
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={labelStyle}>Monthly Qty</label>
                <button
                  type="button"
                  onClick={applyToAll}
                  style={{ fontSize: 11, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                >
                  ↳ Copy January value to all months
                </button>
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
                marginBottom: 20, padding: 14, background: "#f8fafc", borderRadius: 10,
              }}>
                {MONTH_LABELS.map((label, idx) => {
                  const m = idx + 1;
                  return (
                    <div key={m}>
                      <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 3 }}>
                        {label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={months[m] ?? ""}
                        onChange={e => setMonthValue(m, e.target.value)}
                        placeholder="0"
                        style={inputStyle}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose}
              style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 13 }}>
              Close
            </button>
            <button type="submit" disabled={saving || loading || !supplierId}
              style={{
                padding: "8px 22px", borderRadius: 8, border: "none",
                background: "#2563eb", color: "#fff", fontWeight: 600, fontSize: 13,
                cursor: (saving || loading || !supplierId) ? "not-allowed" : "pointer",
                opacity: (saving || loading || !supplierId) ? 0.7 : 1,
              }}>
              {saving ? "Saving…" : "Save Qty"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 600, color: "#64748b",
  marginBottom: 4, textTransform: "uppercase", letterSpacing: ".3px",
};

export default CapacityMasterModal;
