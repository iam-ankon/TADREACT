import React, { useState, useEffect, useCallback } from "react";
import { FiUserPlus, FiPlus, FiEdit2, FiTrash2, FiAlertCircle } from "react-icons/fi";
import { getRecruitment, createRecruitment, updateRecruitment, deleteRecruitment } from "../../api/canadaApi";

const STAGE_STYLE = {
  open:         { bg: "#EEF2FF", color: "#1E40AF" },
  screening:    { bg: "#FFFBEB", color: "#92400E" },
  interviewing: { bg: "#F0F9FF", color: "#0369A1" },
  offer_sent:   { bg: "#ECFDF5", color: "#065F46" },
  hired:        { bg: "#F0FDF4", color: "#166534" },
  closed:       { bg: "#F1F5F9", color: "#475569" },
};

const PROVINCES = [
  ["ON","Ontario"],["BC","British Columbia"],["AB","Alberta"],
  ["QC","Quebec"],["MB","Manitoba"],["SK","Saskatchewan"],
  ["NS","Nova Scotia"],["NB","New Brunswick"],
];

const STAGES = [
  ["open","Open"],["screening","Screening"],["interviewing","Interviewing"],
  ["offer_sent","Offer Sent"],["hired","Hired"],["closed","Closed"],
];

export default function CanadaRecruitment() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    role: "", location: "", province: "ON", employment_type: "full_time",
    salary_min: "", salary_max: "", stage: "open", description: "",
  });

  const stats = {
    open: jobs.filter((j) => ["open","screening","interviewing"].includes(j.stage)).length,
    applications: jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0),
    interviewing: jobs.filter((j) => j.stage === "interviewing").length,
    offer_sent: jobs.filter((j) => j.stage === "offer_sent").length,
  };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getRecruitment();
      setJobs(Array.isArray(res.data) ? res.data : (res.data?.results ?? []));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createRecruitment(form);
      setShowNew(false);
      setForm({ role: "", location: "", province: "ON", employment_type: "full_time",
        salary_min: "", salary_max: "", stage: "open", description: "" });
      load();
    } catch (err) {
      alert("Failed: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleStageChange = async (id, stage) => {
    try {
      await updateRecruitment(id, { stage });
      load();
    } catch (err) { alert(err.message); }
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
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#0F172A", margin: 0 }}>Recruitment</h1>
          <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>Active job openings · Canada Office</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
          border: "none", borderRadius: 8, background: "#1B4FD8", color: "#fff",
          fontSize: 13, cursor: "pointer", fontWeight: 500,
        }}>
          <FiPlus /> New position
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Open positions", value: stats.open, color: "#1B4FD8" },
          { label: "Total applications", value: stats.applications, color: "#8B5CF6" },
          { label: "Interviewing", value: stats.interviewing, color: "#F59E0B" },
          { label: "Offers sent", value: stats.offer_sent, color: "#10B981" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#fff", border: "0.5px solid #E2E8F0",
            borderRadius: 12, padding: "12px 14px", textAlign: "center",
          }}>
            <div style={{ fontSize: 24, fontWeight: 500, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "0.5px solid #FECACA",
          borderRadius: 8, padding: "10px 14px", marginBottom: 12, color: "#991B1B", fontSize: 12.5 }}>
          {error}
        </div>
      )}

      <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading…</div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#94A3B8" }}>
            <FiUserPlus style={{ fontSize: 36, display: "block", margin: "0 auto 10px" }} />
            <div style={{ fontWeight: 500, color: "#64748B", marginBottom: 4 }}>No open positions</div>
            <div style={{ fontSize: 12 }}>Add your first Canada office job posting</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead style={{ background: "#F8FAFC" }}>
              <tr>
                {["Role","Location","Type","Applications","Stage","Actions"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "10px 12px", color: "#94A3B8",
                    fontWeight: 500, fontSize: 11, borderBottom: "0.5px solid #E2E8F0",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const s = STAGE_STYLE[j.stage] || STAGE_STYLE.closed;
                return (
                  <tr key={j.id}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ fontWeight: 500, color: "#0F172A" }}>{j.role}</div>
                      {j.salary_min && (
                        <div style={{ fontSize: 10.5, color: "#94A3B8" }}>
                          ${Number(j.salary_min).toLocaleString()} – ${Number(j.salary_max || 0).toLocaleString()} CAD
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "9px 12px", color: "#475569" }}>
                      {j.location}
                      <div style={{ fontSize: 10.5, color: "#94A3B8" }}>{j.province}</div>
                    </td>
                    <td style={{ padding: "9px 12px", color: "#475569", textTransform: "capitalize" }}>
                      {j.employment_type?.replace("_", "-")}
                    </td>
                    <td style={{ padding: "9px 12px", fontWeight: 500 }}>{j.applications_count}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <select
                        value={j.stage}
                        onChange={(e) => handleStageChange(j.id, e.target.value)}
                        style={{
                          padding: "3px 6px", borderRadius: 8,
                          border: "none", fontSize: 11, fontWeight: 500,
                          background: s.bg, color: s.color, cursor: "pointer",
                        }}
                      >
                        {STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <button
                        onClick={() => deleteRecruitment(j.id).then(load)}
                        style={{
                          padding: "4px 8px", border: "0.5px solid #FECACA",
                          borderRadius: 6, background: "#FEF2F2", color: "#991B1B",
                          cursor: "pointer", fontSize: 11,
                        }}
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showNew && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 460, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: "#0F172A" }}>New position</h3>
              <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8" }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {[
                { label: "Role *", key: "role", type: "text", req: true },
                { label: "Location *", key: "location", type: "text", req: true },
              ].map((f) => (
                <div key={f.key} style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 11.5, color: "#475569", fontWeight: 500 }}>{f.label}</label>
                  <input required={f.req} type={f.type} value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} style={inputStyle} />
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 11.5, color: "#475569", fontWeight: 500 }}>Province</label>
                  <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} style={inputStyle}>
                    {PROVINCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 11.5, color: "#475569", fontWeight: 500 }}>Type</label>
                  <select value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} style={inputStyle}>
                    {[["full_time","Full-time"],["part_time","Part-time"],["contract","Contract"],["intern","Intern"]].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 11.5, color: "#475569", fontWeight: 500 }}>Min salary (CAD)</label>
                  <input type="number" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} placeholder="60000" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 11.5, color: "#475569", fontWeight: 500 }}>Max salary (CAD)</label>
                  <input type="number" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} placeholder="80000" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 11.5, color: "#475569", fontWeight: 500 }}>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setShowNew(false)} style={{ flex: 1, padding: "9px 0", border: "0.5px solid #CBD5E1", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13 }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 8, background: "#1B4FD8", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Post position</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
