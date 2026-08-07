import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus, FiCheck, FiX, FiRefreshCw, FiFilter, FiAlertCircle,
  FiCalendar, FiUser, FiChevronDown,
} from "react-icons/fi";
import {
  getCanadaLeaves, approveLeave, rejectLeave,
  createCanadaLeave, getCanadaEmployees,
} from "../../api/canadaApi";

const STATUS_STYLE = {
  pending:   { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
  approved:  { bg: "#ECFDF5", color: "#065F46", border: "#BBF7D0" },
  rejected:  { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
};

const LEAVE_TYPES = [
  ["vacation", "Vacation (ESA)"],
  ["sick", "Sick Leave"],
  ["personal", "Personal Day"],
  ["maternity", "Maternity Leave"],
  ["parental", "Parental Leave"],
  ["bereavement", "Bereavement Leave"],
  ["jury_duty", "Jury Duty"],
  ["family_responsibility", "Family Responsibility"],
  ["compassionate", "Compassionate Care"],
  ["fmla", "FMLA"],
];

const CA_ENTITLEMENTS = [
  { type: "Vacation (ESA)", entitlement: "2–3 weeks/year", note: "Based on service length" },
  { type: "Sick / personal", entitlement: "10 days/year", note: "Federal standard" },
  { type: "Maternity / parental", entitlement: "Up to 78 weeks", note: "EI benefit eligible" },
  { type: "Bereavement", entitlement: "3–5 days", note: "Per occurrence" },
  { type: "Jury duty", entitlement: "Duration of service", note: "Provincial rules apply" },
];

function Badge({ status }) {
  const s = STATUS_STYLE[status] || { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `0.5px solid ${s.border}`,
      padding: "2px 8px", borderRadius: 10,
      fontSize: 10.5, fontWeight: 500, textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
}

export default function CanadaLeave() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  const [form, setForm] = useState({
    employee: "", leave_type: "vacation",
    start_date: "", end_date: "", days: 1, reason: "",
  });

  const stats = {
    pending:  leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
    total:    leaves.length,
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const [leavesRes, empsRes] = await Promise.all([
        getCanadaLeaves(params),
        getCanadaEmployees(),
      ]);
      const ldata = Array.isArray(leavesRes.data) ? leavesRes.data : (leavesRes.data?.results ?? []);
      setLeaves(ldata);
      const edata = Array.isArray(empsRes.data) ? empsRes.data : (empsRes.data?.results ?? []);
      setEmployees(edata);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setActionLoading(id + "_approve");
    try {
      await approveLeave(id);
      load();
    } catch (e) {
      alert("Failed: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const note = window.prompt("Rejection note (optional):");
    if (note === null) return;
    setActionLoading(id + "_reject");
    try {
      await rejectLeave(id, note);
      load();
    } catch (e) {
      alert("Failed: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCanadaLeave(form);
      setShowNewForm(false);
      setForm({ employee: "", leave_type: "vacation", start_date: "", end_date: "", days: 1, reason: "" });
      load();
    } catch (err) {
      alert("Failed: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
  };

  const inputStyle = {
    width: "100%", padding: "7px 10px",
    border: "0.5px solid #CBD5E1", borderRadius: 8,
    fontSize: 12.5, color: "#0F172A", background: "#fff",
    outline: "none", boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block", marginBottom: 4,
    fontSize: 11.5, color: "#475569", fontWeight: 500,
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#0F172A", margin: 0 }}>Leave management</h1>
          <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
            Canadian leave entitlements & approval workflow
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", border: "none",
            borderRadius: 8, background: "#1B4FD8", color: "#fff",
            fontSize: 13, cursor: "pointer", fontWeight: 500,
          }}
        >
          <FiPlus /> New request
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Pending approval", value: stats.pending, color: "#F59E0B" },
          { label: "Approved this month", value: stats.approved, color: "#10B981" },
          { label: "Rejected", value: stats.rejected, color: "#EF4444" },
          { label: "Total requests", value: stats.total, color: "#1B4FD8" },
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

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {[
          ["", "All status"],
          ["pending", "Pending"],
          ["approved", "Approved"],
          ["rejected", "Rejected"],
        ].map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => setStatusFilter(val)}
            style={{
              padding: "6px 14px", borderRadius: 20,
              border: statusFilter === val ? "none" : "0.5px solid #CBD5E1",
              background: statusFilter === val ? "#1B4FD8" : "#fff",
              color: statusFilter === val ? "#fff" : "#475569",
              fontSize: 12, cursor: "pointer", fontWeight: statusFilter === val ? 500 : 400,
            }}
          >
            {lbl}
          </button>
        ))}
        <button
          onClick={load}
          style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", border: "0.5px solid #CBD5E1",
            borderRadius: 8, background: "#fff", cursor: "pointer",
            fontSize: 12, color: "#475569",
          }}
        >
          <FiRefreshCw style={{ fontSize: 12 }} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "#FEF2F2", border: "0.5px solid #FECACA",
          borderRadius: 8, padding: "10px 14px", marginBottom: 12,
          color: "#991B1B", fontSize: 12.5, display: "flex", gap: 8,
        }}>
          <FiAlertCircle /> {error}
        </div>
      )}

      {/* Leave table */}
      <div style={{
        background: "#fff", border: "0.5px solid #E2E8F0",
        borderRadius: 12, marginBottom: 16, overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading…</div>
        ) : leaves.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
            <FiCalendar style={{ fontSize: 32, marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
            <div style={{ fontWeight: 500, color: "#64748B" }}>No leave requests</div>
            <div style={{ fontSize: 12 }}>
              {statusFilter ? `No ${statusFilter} leaves found` : "No leaves yet"}
            </div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead style={{ background: "#F8FAFC" }}>
              <tr>
                {["Employee", "Type", "From", "To", "Days", "Reason", "Status", "Actions"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "10px 12px",
                    color: "#94A3B8", fontWeight: 500, fontSize: 11,
                    borderBottom: "0.5px solid #E2E8F0",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.id}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "9px 12px", fontWeight: 500 }}>
                    {leave.employee_name}
                    <div style={{ fontSize: 10.5, color: "#94A3B8", fontWeight: 400 }}>
                      {leave.employee_id_str}
                    </div>
                  </td>
                  <td style={{ padding: "9px 12px", color: "#475569", textTransform: "capitalize" }}>
                    {leave.leave_type?.replace(/_/g, " ")}
                  </td>
                  <td style={{ padding: "9px 12px", color: "#475569" }}>{leave.start_date}</td>
                  <td style={{ padding: "9px 12px", color: "#475569" }}>{leave.end_date}</td>
                  <td style={{ padding: "9px 12px" }}>{leave.days}</td>
                  <td style={{ padding: "9px 12px", color: "#64748B", maxWidth: 160 }}>
                    <span style={{
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap", display: "block",
                    }}>
                      {leave.reason || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    <Badge status={leave.status} />
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    {leave.status === "pending" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleApprove(leave.id)}
                          disabled={actionLoading === leave.id + "_approve"}
                          title="Approve"
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 28, height: 28, borderRadius: 6,
                            border: "0.5px solid #BBF7D0", background: "#ECFDF5",
                            color: "#065F46", cursor: "pointer",
                          }}
                        >
                          <FiCheck style={{ fontSize: 13 }} />
                        </button>
                        <button
                          onClick={() => handleReject(leave.id)}
                          disabled={actionLoading === leave.id + "_reject"}
                          title="Reject"
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 28, height: 28, borderRadius: 6,
                            border: "0.5px solid #FECACA", background: "#FEF2F2",
                            color: "#991B1B", cursor: "pointer",
                          }}
                        >
                          <FiX style={{ fontSize: 13 }} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Canadian entitlements reference */}
      <div style={{
        background: "#fff", border: "0.5px solid #E2E8F0",
        borderRadius: 12, padding: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", marginBottom: 12 }}>
          Canadian statutory leave entitlements
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr>
              {["Leave type", "Entitlement", "Notes"].map((h) => (
                <th key={h} style={{
                  textAlign: "left", padding: "8px 12px",
                  color: "#94A3B8", fontWeight: 500, fontSize: 11,
                  borderBottom: "0.5px solid #E2E8F0",
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CA_ENTITLEMENTS.map((r) => (
              <tr key={r.type}>
                <td style={{ padding: "8px 12px", fontWeight: 500, color: "#0F172A" }}>{r.type}</td>
                <td style={{ padding: "8px 12px", color: "#1B4FD8", fontWeight: 500 }}>{r.entitlement}</td>
                <td style={{ padding: "8px 12px", color: "#64748B" }}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New leave form modal */}
      {showNewForm && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#fff", borderRadius: 12,
            padding: "24px", width: 460, maxHeight: "90vh",
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "#0F172A" }}>New leave request</h3>
              <button onClick={() => setShowNewForm(false)} style={{
                background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94A3B8",
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Employee *</label>
                <select required value={form.employee}
                  onChange={(e) => setForm({ ...form, employee: e.target.value })}
                  style={inputStyle}>
                  <option value="">Select employee…</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Leave type *</label>
                <select required value={form.leave_type}
                  onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
                  style={inputStyle}>
                  {LEAVE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Start date *</label>
                  <input type="date" required value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>End date *</label>
                  <input type="date" required value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Number of days *</label>
                <input type="number" min="1" required value={form.days}
                  onChange={(e) => setForm({ ...form, days: parseInt(e.target.value) })}
                  style={inputStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Reason</label>
                <textarea rows={3} value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Optional reason for the leave request…"
                  style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setShowNewForm(false)}
                  style={{
                    flex: 1, padding: "9px 0", border: "0.5px solid #CBD5E1",
                    borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13,
                  }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{
                    flex: 1, padding: "9px 0", border: "none",
                    borderRadius: 8, background: "#1B4FD8", color: "#fff",
                    cursor: "pointer", fontSize: 13, fontWeight: 500,
                  }}>
                  Submit request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
