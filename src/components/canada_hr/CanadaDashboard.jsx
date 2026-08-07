import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers, FiUserCheck, FiClipboard, FiDollarSign,
  FiBriefcase, FiAward, FiRefreshCw, FiAlertCircle,
  FiTrendingUp, FiFlag, FiDownload,
} from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { getCanadaDashboard, getUpcomingHolidays } from "../../api/canadaApi";

const fmtCAD = (v) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD",
    maximumFractionDigits: 0 }).format(v || 0);

const DEPT_COLORS = ["#1B4FD8","#10B981","#F59E0B","#8B5CF6","#EF4444","#EC4899"];

const BADGE_STYLES = {
  pending:   { bg: "#FFFBEB", color: "#92400E" },
  approved:  { bg: "#ECFDF5", color: "#065F46" },
  rejected:  { bg: "#FEF2F2", color: "#991B1B" },
};

function StatCard({ icon, label, value, sub, subColor = "#10B981", borderColor }) {
  return (
    <div style={{
      background: "#fff",
      border: "0.5px solid #E2E8F0",
      borderRadius: 12,
      padding: "16px 18px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 3, background: borderColor,
      }} />
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        color: "#64748B", fontSize: 12, fontWeight: 500, marginBottom: 8,
      }}>
        {icon}
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, color: "#0F172A", lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: subColor, marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

function SectionCard({ title, action, children }) {
  return (
    <div style={{
      background: "#fff", border: "0.5px solid #E2E8F0",
      borderRadius: 12, padding: 16,
    }}>
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 14,
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = BADGE_STYLES[status] || { bg: "#F1F5F9", color: "#475569" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "2px 8px", borderRadius: 10,
      fontSize: 11, fontWeight: 500, textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
}

export default function CanadaDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getCanadaDashboard();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
        height: "60vh", color: "#64748B", flexDirection: "column", gap: 12 }}>
        <div style={{
          width: 36, height: 36, border: "3px solid #E2E8F0",
          borderTopColor: "#1B4FD8", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <span style={{ fontSize: 13 }}>Loading Canada HRMS dashboard…</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        margin: 24, background: "#FEF2F2", border: "0.5px solid #FECACA",
        borderRadius: 12, padding: "20px 24px", display: "flex",
        alignItems: "flex-start", gap: 12,
      }}>
        <FiAlertCircle style={{ color: "#EF4444", fontSize: 20, flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 500, color: "#991B1B", marginBottom: 4 }}>
            Failed to load dashboard
          </div>
          <div style={{ fontSize: 12.5, color: "#7F1D1D", marginBottom: 12 }}>{error}</div>
          <button
            onClick={() => load()}
            style={{
              padding: "6px 14px", background: "#EF4444", color: "#fff",
              border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12.5,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const d = data || {};
  const today = new Date();
  const monthName = today.toLocaleString("en-CA", { month: "long" });
  const year = today.getFullYear();

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#0F172A", margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
            Canada Office · {monthName} {year}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", border: "0.5px solid #CBD5E1",
              borderRadius: 8, background: "#fff", fontSize: 12.5,
              cursor: refreshing ? "not-allowed" : "pointer", color: "#475569",
            }}
          >
            <FiRefreshCw style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
            Refresh
          </button>
          <button
            onClick={() => navigate("/canada/employees/new")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", border: "none",
              borderRadius: 8, background: "#1B4FD8", color: "#fff",
              fontSize: 12.5, cursor: "pointer", fontWeight: 500,
            }}
          >
            + Add employee
          </button>
        </div>
      </div>

      {/* Canada Day / next holiday banner */}
      {d.upcoming_holidays?.[0] && (
        <div style={{
          background: "linear-gradient(135deg,#FEF2F2,#fff)",
          border: "0.5px solid #FECACA",
          borderRadius: 12, padding: "12px 16px",
          marginBottom: 20, display: "flex", alignItems: "center", gap: 12,
        }}>
          <FiFlag style={{ color: "#C8102E", fontSize: 20 }} />
          <div>
            <div style={{ fontWeight: 500, color: "#991B1B", fontSize: 13 }}>
              Upcoming: {d.upcoming_holidays[0].name}
            </div>
            <div style={{ fontSize: 11.5, color: "#7F1D1D" }}>
              {new Date(d.upcoming_holidays[0].date).toLocaleDateString("en-CA", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })} — ensure payroll is processed in advance
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12, marginBottom: 20,
      }}>
        <StatCard
          icon={<FiUsers style={{ fontSize: 14 }} />}
          label="Total employees"
          value={d.total_employees ?? "—"}
          sub={`${d.active_employees ?? 0} active`}
          borderColor="#1B4FD8"
        />
        <StatCard
          icon={<FiUserCheck style={{ fontSize: 14 }} />}
          label="On leave today"
          value={d.on_leave_today ?? "—"}
          sub={`${d.pending_leaves ?? 0} pending approval`}
          subColor="#F59E0B"
          borderColor="#10B981"
        />
        <StatCard
          icon={<FiClipboard style={{ fontSize: 14 }} />}
          label="Pending leaves"
          value={d.pending_leaves ?? "—"}
          sub="Awaiting approval"
          subColor="#F59E0B"
          borderColor="#F59E0B"
        />
        <StatCard
          icon={<FiDollarSign style={{ fontSize: 14 }} />}
          label="Monthly payroll"
          value={fmtCAD(d.monthly_payroll_cad)}
          sub="CAD net · this month"
          subColor="#64748B"
          borderColor="#8B5CF6"
        />
      </div>

      {/* Second row */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 16, marginBottom: 20,
      }}>
        {/* Department chart */}
        <SectionCard
          title="Headcount by department"
          action={
            <button onClick={() => navigate("/canada/employees")}
              style={{ background: "none", border: "none", color: "#1B4FD8",
                fontSize: 11.5, cursor: "pointer" }}>
              View all →
            </button>
          }
        >
          {d.dept_breakdown?.length ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={d.dept_breakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="department" tick={{ fontSize: 10, fill: "#94A3B8" }}
                  tickFormatter={(v) => v?.slice(0, 6) ?? ""} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <Tooltip
                  contentStyle={{ fontSize: 11.5, borderRadius: 8, border: "0.5px solid #E2E8F0" }}
                  cursor={{ fill: "#F8FAFC" }}
                />
                <Bar dataKey="count" fill="#1B4FD8" radius={[3, 3, 0, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 12.5, padding: "30px 0" }}>
              No department data yet
            </div>
          )}
        </SectionCard>

        {/* Employment type breakdown */}
        <SectionCard title="Employment type breakdown">
          {d.employment_type_breakdown?.length ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: "0 0 120px" }}>
                <PieChart width={120} height={120}>
                  <Pie
                    data={d.employment_type_breakdown}
                    dataKey="count"
                    nameKey="type"
                    cx="50%" cy="50%"
                    innerRadius={30} outerRadius={55}
                  >
                    {d.employment_type_breakdown.map((_, i) => (
                      <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                </PieChart>
              </div>
              <div style={{ flex: 1 }}>
                {d.employment_type_breakdown.map((item, i) => (
                  <div key={item.type} style={{
                    display: "flex", alignItems: "center",
                    gap: 8, marginBottom: 7, fontSize: 12,
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: DEPT_COLORS[i % DEPT_COLORS.length], flexShrink: 0,
                    }} />
                    <span style={{ flex: 1, color: "#64748B", textTransform: "capitalize" }}>
                      {item.type.replace("_", "-")}
                    </span>
                    <span style={{ fontWeight: 500, color: "#0F172A" }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 12.5, padding: "30px 0" }}>
              No employees linked yet
            </div>
          )}
        </SectionCard>
      </div>

      {/* Payroll summary + Recent leaves */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 16, marginBottom: 20 }}>
        {/* Payroll breakdown */}
        <SectionCard title={`Payroll — ${monthName} ${year}`}>
          {d.payroll_breakdown ? (
            <div>
              {[
                { label: "Gross salaries", v: d.payroll_breakdown.total_gross, bold: false },
                { label: "CPP deductions", v: d.payroll_breakdown.total_cpp, sub: true },
                { label: "EI premiums",    v: d.payroll_breakdown.total_ei, sub: true },
                { label: "Federal tax",    v: d.payroll_breakdown.total_fed_tax, sub: true },
                { label: "Provincial tax", v: d.payroll_breakdown.total_prov_tax, sub: true },
                { label: "Net payout",     v: d.payroll_breakdown.total_net, bold: true, green: true },
              ].map((row) => (
                <div key={row.label} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: row.bold ? "none" : "0.5px solid #F1F5F9",
                  fontWeight: row.bold ? 500 : 400,
                  fontSize: row.sub ? 12 : 12.5,
                  color: row.green ? "#10B981" : row.sub ? "#64748B" : "#0F172A",
                  marginTop: row.bold ? 4 : 0,
                }}>
                  <span>{row.label}</span>
                  <span>{fmtCAD(row.v)}</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 8 }}>
                {d.payroll_breakdown.employee_count ?? 0} employees processed
              </div>
            </div>
          ) : (
            <div style={{ color: "#94A3B8", fontSize: 12.5, padding: "20px 0", textAlign: "center" }}>
              No payroll data for this month yet.<br />
              <button
                onClick={() => navigate("/canada/payroll")}
                style={{ marginTop: 8, color: "#1B4FD8", background: "none",
                  border: "none", cursor: "pointer", fontSize: 12 }}>
                Go to Payroll →
              </button>
            </div>
          )}
        </SectionCard>

        {/* Recent leaves */}
        <SectionCard
          title="Recent leave requests"
          action={
            <button onClick={() => navigate("/canada/leave")}
              style={{ background: "none", border: "none", color: "#1B4FD8",
                fontSize: 11.5, cursor: "pointer" }}>
              View all →
            </button>
          }
        >
          {d.recent_leaves?.length ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr>
                  {["Employee", "Type", "Dates", "Days", "Status"].map((h) => (
                    <th key={h} style={{
                      textAlign: "left", padding: "0 8px 8px",
                      color: "#94A3B8", fontWeight: 500, fontSize: 11,
                      borderBottom: "0.5px solid #E2E8F0",
                      textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.recent_leaves.slice(0, 6).map((l) => (
                  <tr key={l.id} style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "8px 8px" }}>
                      <div style={{ fontWeight: 500 }}>{l.employee_name}</div>
                    </td>
                    <td style={{ padding: "8px 8px", color: "#64748B", textTransform: "capitalize" }}>
                      {l.leave_type?.replace(/_/g, " ")}
                    </td>
                    <td style={{ padding: "8px 8px", color: "#64748B", whiteSpace: "nowrap" }}>
                      {l.start_date} → {l.end_date}
                    </td>
                    <td style={{ padding: "8px 8px" }}>{l.days}</td>
                    <td style={{ padding: "8px 8px" }}>
                      <StatusBadge status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: "#94A3B8", fontSize: 12.5, padding: "20px 0", textAlign: "center" }}>
              No leave requests yet.
            </div>
          )}
        </SectionCard>
      </div>

      {/* Upcoming holidays strip */}
      {d.upcoming_holidays?.length > 0 && (
        <SectionCard title="Upcoming Canadian holidays">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {d.upcoming_holidays.map((h) => {
              const hDate = new Date(h.date);
              return (
                <div key={h.date + h.name} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 14px", background: "#F8FAFC",
                  border: "0.5px solid #E2E8F0", borderRadius: 8, flex: "1 1 200px",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: "#EEF2FF", display: "flex",
                    flexDirection: "column", alignItems: "center",
                    justifyContent: "center", flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 500, color: "#1B4FD8", lineHeight: 1 }}>
                      {hDate.getDate()}
                    </div>
                    <div style={{ fontSize: 9, color: "#1B4FD8", textTransform: "uppercase", fontWeight: 500 }}>
                      {hDate.toLocaleString("en-CA", { month: "short" })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: "#0F172A" }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>
                      {h.province === "FED" ? "Federal statutory" : `${h.province} provincial`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
