import React, { useState, useEffect } from "react";
import { FiClock, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { getCanadaAttendanceSummary } from "../../api/canadaApi";

export default function CanadaAttendance() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear]   = useState(today.getFullYear());
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await getCanadaAttendanceSummary(month, year);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year]);

  const monthName = new Date(year, month - 1).toLocaleString("en-CA", { month: "long" });

  const inputStyle = {
    padding: "7px 10px", border: "0.5px solid #CBD5E1",
    borderRadius: 8, fontSize: 12.5, color: "#0F172A", background: "#fff", outline: "none",
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#0F172A", margin: 0 }}>Attendance</h1>
          <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
            Canada Office attendance summary — {monthName} {year}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={inputStyle}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i).toLocaleString("en-CA", { month: "long" })}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={inputStyle}>
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={load} style={{ ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <FiRefreshCw style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: "#FEF2F2", border: "0.5px solid #FECACA",
          borderRadius: 8, padding: "10px 14px", marginBottom: 12,
          color: "#991B1B", fontSize: 12.5, display: "flex", gap: 8,
        }}>
          <FiAlertCircle /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#94A3B8" }}>Loading attendance…</div>
      ) : !data || (data.summary?.length === 0) ? (
        <div style={{
          background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12,
          padding: "60px", textAlign: "center", color: "#94A3B8",
        }}>
          <FiClock style={{ fontSize: 36, display: "block", margin: "0 auto 10px" }} />
          <div style={{ fontWeight: 500, color: "#64748B", marginBottom: 4 }}>
            No attendance data for {monthName} {year}
          </div>
          <div style={{ fontSize: 12 }}>
            Attendance records are linked from the existing TAD HRMS attendance module.
            Employees must be linked to a Canada profile to appear here.
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Canada employees", value: data.employee_count, color: "#1B4FD8" },
              { label: "Days present", value: data.summary?.reduce((s, e) => s + e.present, 0) ?? 0, color: "#10B981" },
              { label: "Late arrivals", value: data.summary?.reduce((s, e) => s + e.late, 0) ?? 0, color: "#F59E0B" },
            ].map((s) => (
              <div key={s.label} style={{
                background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, padding: "14px 16px",
              }}>
                <div style={{ fontSize: 22, fontWeight: 500, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead style={{ background: "#F8FAFC" }}>
                <tr>
                  {["Employee", "Days present", "Late arrivals"].map((h) => (
                    <th key={h} style={{
                      textAlign: h === "Employee" ? "left" : "center",
                      padding: "10px 14px",
                      color: "#94A3B8", fontWeight: 500, fontSize: 11,
                      borderBottom: "0.5px solid #E2E8F0",
                      textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.summary.map((emp) => (
                  <tr key={emp.name}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "9px 14px", fontWeight: 500, color: "#0F172A" }}>{emp.name}</td>
                    <td style={{ padding: "9px 14px", textAlign: "center" }}>
                      <span style={{
                        padding: "2px 10px", borderRadius: 10,
                        background: "#ECFDF5", color: "#065F46",
                        fontSize: 12, fontWeight: 500,
                      }}>
                        {emp.present}
                      </span>
                    </td>
                    <td style={{ padding: "9px 14px", textAlign: "center" }}>
                      {emp.late > 0 ? (
                        <span style={{
                          padding: "2px 10px", borderRadius: 10,
                          background: "#FFFBEB", color: "#92400E",
                          fontSize: 12, fontWeight: 500,
                        }}>
                          {emp.late}
                        </span>
                      ) : (
                        <span style={{ color: "#94A3B8" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
