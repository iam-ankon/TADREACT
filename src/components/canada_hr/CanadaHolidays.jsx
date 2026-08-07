import React, { useState, useEffect } from "react";
import { FiUmbrella, FiPlus } from "react-icons/fi";
import { getCanadaHolidays, createHoliday } from "../../api/canadaApi";

export default function CanadaHolidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", province: "FED", is_paid: true, notes: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCanadaHolidays(year);
      setHolidays(Array.isArray(res.data) ? res.data : (res.data?.results ?? []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createHoliday(form);
      setShowNew(false);
      setForm({ name: "", date: "", province: "FED", is_paid: true, notes: "" });
      load();
    } catch (err) { alert(JSON.stringify(err.response?.data || err.message)); }
  };

  const PROVINCE_LABELS = {
    FED:"Federal (all)","ON":"Ontario","BC":"British Columbia","AB":"Alberta",
    "QC":"Quebec","MB":"Manitoba","SK":"Saskatchewan","NS":"Nova Scotia",
    "NB":"New Brunswick","NL":"Newfoundland","PE":"PEI","NT":"NWT","NU":"Nunavut","YT":"Yukon",
  };

  const inputStyle = {
    width: "100%", padding: "7px 10px", border: "0.5px solid #CBD5E1",
    borderRadius: 8, fontSize: 12.5, color: "#0F172A", background: "#fff",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#0F172A", margin: 0 }}>CA holidays</h1>
          <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>Federal + provincial statutory holidays</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ ...inputStyle, width: "auto" }}>
            {[2024,2025,2026,2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setShowNew(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            border: "none", borderRadius: 8, background: "#1B4FD8", color: "#fff",
            fontSize: 12.5, cursor: "pointer",
          }}>
            <FiPlus /> Add holiday
          </button>
        </div>
      </div>

      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg,#FEF2F2,#fff)",
        border: "0.5px solid #FECACA", borderRadius: 12, padding: "12px 16px",
        marginBottom: 16, display: "flex", alignItems: "center", gap: 12,
      }}>
        <FiUmbrella style={{ color: "#C8102E", fontSize: 20 }} />
        <div>
          <div style={{ fontWeight: 500, color: "#991B1B", fontSize: 13 }}>
            Canadian statutory holidays {year}
          </div>
          <div style={{ fontSize: 11.5, color: "#7F1D1D" }}>
            All paid statutory holidays. Provincial holidays vary by province — ensure compliance.
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#94A3B8" }}>Loading…</div>
      ) : holidays.length === 0 ? (
        <div style={{
          background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12,
          padding: "60px", textAlign: "center", color: "#94A3B8",
        }}>
          <FiUmbrella style={{ fontSize: 36, display: "block", margin: "0 auto 10px" }} />
          <div style={{ fontWeight: 500, color: "#64748B", marginBottom: 4 }}>No holidays for {year}</div>
          <div style={{ fontSize: 12 }}>Add holidays or seed from the Django shell (see BACKEND_SETUP.md)</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {holidays.map((h) => {
            const d = new Date(h.date);
            const isFed = h.province === "FED";
            return (
              <div key={h.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", background: "#fff",
                border: "0.5px solid #E2E8F0", borderRadius: 10,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 8,
                  background: isFed ? "#EEF2FF" : "#ECFDF5",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <div style={{ fontSize: 17, fontWeight: 500, color: isFed ? "#1B4FD8" : "#065F46", lineHeight: 1 }}>
                    {d.getDate()}
                  </div>
                  <div style={{ fontSize: 9, color: isFed ? "#1B4FD8" : "#065F46", textTransform: "uppercase", fontWeight: 500 }}>
                    {d.toLocaleString("en-CA", { month: "short" })}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{h.name}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>
                    {d.toLocaleDateString("en-CA", { weekday: "long" })} ·{" "}
                    {PROVINCE_LABELS[h.province] || h.province}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 10, fontSize: 10.5, fontWeight: 500,
                    background: isFed ? "#EEF2FF" : "#ECFDF5",
                    color: isFed ? "#1E40AF" : "#065F46",
                  }}>
                    {isFed ? "Federal" : PROVINCE_LABELS[h.province] || h.province}
                  </span>
                  {h.is_paid && (
                    <span style={{
                      padding: "2px 8px", borderRadius: 10, fontSize: 10.5,
                      background: "#F0FDF4", color: "#166534",
                    }}>Paid</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: "#0F172A" }}>Add holiday</h3>
              <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8" }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 11.5, color: "#475569", fontWeight: 500 }}>Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 11.5, color: "#475569", fontWeight: 500 }}>Date *</label>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 11.5, color: "#475569", fontWeight: 500 }}>Province</label>
                <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} style={inputStyle}>
                  {Object.entries(PROVINCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" id="paid" checked={form.is_paid}
                  onChange={(e) => setForm({ ...form, is_paid: e.target.checked })} />
                <label htmlFor="paid" style={{ fontSize: 12.5, color: "#475569" }}>Paid holiday</label>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setShowNew(false)} style={{ flex: 1, padding: "9px 0", border: "0.5px solid #CBD5E1", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13 }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 8, background: "#1B4FD8", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
