import React, { useState, useEffect, useCallback } from "react";
import { FiAward, FiPlus, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { getCanadaAppraisals, getCanadaEmployees, createAppraisal } from "../../api/canadaApi";

const METRICS = [
  ["job_knowledge","Job knowledge"],
  ["communication","Communication"],
  ["teamwork","Teamwork"],
  ["reliability","Reliability"],
  ["initiative","Initiative"],
];

function StarRow({ value, max = 5 }) {
  return (
    <span>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < Math.round(value) ? "#F59E0B" : "#E2E8F0", fontSize: 14 }}>★</span>
      ))}
    </span>
  );
}

function MetricBar({ value, max = 5 }) {
  const pct = (value / max) * 100;
  const color = pct >= 80 ? "#10B981" : pct >= 60 ? "#1B4FD8" : "#F59E0B";
  return (
    <div style={{ flex: 1, height: 5, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
    </div>
  );
}

export default function CanadaAppraisals() {
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [periodFilter, setPeriodFilter] = useState("");

  const [form, setForm] = useState({
    employee: "", review_period: "",
    job_knowledge: 3, communication: 3, teamwork: 3, reliability: 3, initiative: 3,
    comments: "", goals_next_period: "", promotion_recommended: false,
  });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = periodFilter ? { review_period: periodFilter } : {};
      const [aRes, eRes] = await Promise.all([
        getCanadaAppraisals(params),
        getCanadaEmployees(),
      ]);
      setAppraisals(Array.isArray(aRes.data) ? aRes.data : (aRes.data?.results ?? []));
      setEmployees(Array.isArray(eRes.data) ? eRes.data : (eRes.data?.results ?? []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [periodFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAppraisal(form);
      setShowNew(false);
      load();
    } catch (err) {
      alert("Failed: " + JSON.stringify(err.response?.data || err.message));
    }
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
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#0F172A", margin: 0 }}>Performance appraisals</h1>
          <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
            {appraisals.length} appraisals · Canada Office
          </p>
        </div>
        <button onClick={() => setShowNew(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
          border: "none", borderRadius: 8, background: "#1B4FD8", color: "#fff",
          fontSize: 13, cursor: "pointer", fontWeight: 500,
        }}>
          <FiPlus /> New appraisal
        </button>
      </div>

      {error && (
        <div style={{
          background: "#FEF2F2", border: "0.5px solid #FECACA",
          borderRadius: 8, padding: "10px 14px", marginBottom: 12,
          color: "#991B1B", fontSize: 12.5,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#94A3B8" }}>Loading…</div>
      ) : appraisals.length === 0 ? (
        <div style={{
          background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12,
          padding: "60px", textAlign: "center", color: "#94A3B8",
        }}>
          <FiAward style={{ fontSize: 40, marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
          <div style={{ fontWeight: 500, color: "#64748B", marginBottom: 4 }}>No appraisals yet</div>
          <div style={{ fontSize: 12 }}>Create the first Canada office performance appraisal</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
          {appraisals.map((a) => (
            <div key={a.id} style={{
              background: "#fff", border: "0.5px solid #E2E8F0",
              borderRadius: 12, padding: 16,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 500, color: "#0F172A", fontSize: 13 }}>{a.employee_name}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{a.review_period}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {a.overall_rating && <StarRow value={a.overall_rating} />}
                  {a.overall_rating && (
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>
                      {parseFloat(a.overall_rating).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              {METRICS.map(([key, label]) => (
                a[key] != null && (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                    <span style={{ fontSize: 11.5, color: "#64748B", width: 110, flexShrink: 0 }}>{label}</span>
                    <MetricBar value={a[key]} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#0F172A", width: 16, textAlign: "right" }}>
                      {a[key]}
                    </span>
                  </div>
                )
              ))}

              {a.promotion_recommended && (
                <div style={{
                  marginTop: 10, padding: "4px 8px",
                  background: "#ECFDF5", borderRadius: 6,
                  fontSize: 11, color: "#065F46", fontWeight: 500,
                }}>
                  ✓ Promotion recommended
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: 24, width: 480,
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: "#0F172A" }}>New appraisal</h3>
              <button onClick={() => setShowNew(false)} style={{
                background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8",
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 11.5, color: "#475569", fontWeight: 500 }}>Employee *</label>
                <select required value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} style={inputStyle}>
                  <option value="">Select employee…</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 11.5, color: "#475569", fontWeight: 500 }}>Review period *</label>
                <input required value={form.review_period} onChange={(e) => setForm({ ...form, review_period: e.target.value })}
                  placeholder="e.g. Q2 2026" style={inputStyle} />
              </div>
              {METRICS.map(([key, label]) => (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <label style={{ fontSize: 11.5, color: "#475569", fontWeight: 500 }}>{label}</label>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#1B4FD8" }}>{form[key]}/5</span>
                  </div>
                  <input type="range" min="1" max="5" step="1" value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) })}
                    style={{ width: "100%" }} />
                </div>
              ))}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 11.5, color: "#475569", fontWeight: 500 }}>Comments</label>
                <textarea rows={3} value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })}
                  style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" id="promo" checked={form.promotion_recommended}
                  onChange={(e) => setForm({ ...form, promotion_recommended: e.target.checked })} />
                <label htmlFor="promo" style={{ fontSize: 12.5, color: "#475569" }}>Recommend for promotion</label>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setShowNew(false)} style={{
                  flex: 1, padding: "9px 0", border: "0.5px solid #CBD5E1",
                  borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13,
                }}>Cancel</button>
                <button type="submit" style={{
                  flex: 1, padding: "9px 0", border: "none",
                  borderRadius: 8, background: "#1B4FD8", color: "#fff",
                  cursor: "pointer", fontSize: 13, fontWeight: 500,
                }}>Save appraisal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
