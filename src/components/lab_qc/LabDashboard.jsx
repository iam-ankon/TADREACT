// src/components/lab_qc/LabDashboard.jsx
//
// Lab / QC overview. Same visual language as the rest of the TAD redesign
// (sticky header, white cards, Inter, blue primary - see
// merchandiser/agentTheme.js). Pass / Conditional / Fail always use the
// status colours below together with an icon + label, never colour alone.

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiClipboard,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiEdit3,
  FiFileText,
  FiPlus,
  FiPercent,
  FiX,
  FiChevronRight,
  FiInbox,
} from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getLabDashboard, getFactories, getQcUsers, getReports, isLabAdmin } from "../../api/labQc";
import { LabPageLayout, formatDate } from "./common";

// Status palette (fixed; see dataviz guidance) - marks only, never text.
const STATUS = {
  pass: { label: "Pass", color: "#0ca30c", Icon: FiCheckCircle },
  conditional: { label: "Conditional", color: "#fab219", Icon: FiAlertTriangle },
  fail: { label: "Fail", color: "#d03b3b", Icon: FiXCircle },
};
const SURFACE = "#ffffff";

const CSS = `
.lq-dash {
  --c-bg: #f3f5f9; --c-surface: #fff; --c-soft: #f8fafc; --c-border: #e6eaf0; --c-border-strong: #d5dbe4;
  --c-text: #0f172a; --c-text-2: #334155; --c-muted: #64748b; --c-faint: #94a3b8;
  --c-primary: #2563eb; --c-primary-dark: #1d4ed8; --c-primary-soft: #eef4ff;
  --c-green: #15803d; --c-green-soft: #f0fdf4; --c-red: #b91c1c; --c-red-soft: #fef2f2;
  --c-amber: #a16207; --c-amber-soft: #fefce8;
  margin: -2rem; min-height: 100vh; background: var(--c-bg); color: var(--c-text);
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; font-size: 14px;
}
.lq-dash *, .lq-dash *::before, .lq-dash *::after { box-sizing: border-box; }
.lq-dash button:focus-visible, .lq-dash select:focus-visible, .lq-dash input:focus-visible,
.lq-dash [role="button"]:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }

.lq-header {
  position: sticky; top: -2rem; z-index: 20; display: flex; align-items: flex-end; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; padding: 18px 28px 16px; background: rgba(255,255,255,.94);
  backdrop-filter: blur(8px); border-bottom: 1px solid var(--c-border);
}
.lq-eyebrow { font-size: 11.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--c-primary); margin-bottom: 4px; }
.lq-title { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
.lq-subtitle { margin: 4px 0 0; color: var(--c-muted); font-size: 13.5px; }
.lq-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.lq-body { padding: 22px 28px 36px; display: flex; flex-direction: column; gap: 18px; }

.lq-btn {
  display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 15px; border-radius: 10px;
  font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap;
  border: 1px solid transparent; transition: background .15s, border-color .15s;
}
.lq-btn.primary { background: var(--c-primary); color: #fff; box-shadow: 0 1px 2px rgba(37,99,235,.25); }
.lq-btn.primary:hover { background: var(--c-primary-dark); }
.lq-btn.ghost { background: var(--c-surface); color: var(--c-text-2); border-color: var(--c-border-strong); }
.lq-btn.ghost:hover { background: var(--c-soft); }
.lq-link { border: none; background: none; padding: 0; font: inherit; font-size: 12.5px; font-weight: 600; color: var(--c-primary); cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
.lq-link:hover { color: var(--c-primary-dark); }

.lq-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); min-width: 0; }
.lq-card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; border-bottom: 1px solid var(--c-border); }
.lq-card-title { margin: 0; font-size: 14.5px; font-weight: 650; }
.lq-card-sub { margin: 2px 0 0; font-size: 12.5px; color: var(--c-muted); }
.lq-card-body { padding: 16px 18px; }

.lq-filters { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; padding: 14px 18px; }
.lq-field { display: flex; flex-direction: column; gap: 5px; min-width: 190px; flex: 0 1 240px; }
.lq-field label { font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--c-muted); }
.lq-field select, .lq-field input {
  height: 38px; padding: 0 12px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-surface);
  font: inherit; font-size: 13.5px; color: var(--c-text); outline: none;
}
.lq-field select:focus, .lq-field input:focus { border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.lq-filter-note { margin-left: auto; font-size: 12.5px; color: var(--c-muted); align-self: center; }

.lq-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
.lq-kpi { padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
.lq-kpi-top { display: flex; align-items: center; justify-content: space-between; }
.lq-kpi-label { font-size: 12.5px; font-weight: 600; color: var(--c-muted); }
.lq-kpi-icon { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; font-size: 16px; }
.lq-kpi-value { font-size: 28px; font-weight: 700; letter-spacing: -.02em; line-height: 1; font-variant-numeric: tabular-nums; }
.lq-kpi-foot { font-size: 12.5px; color: var(--c-muted); }
.lq-meter { height: 6px; border-radius: 999px; background: #eef1f5; overflow: hidden; }
.lq-meter > span { display: block; height: 100%; border-radius: 999px; background: var(--c-primary); }

.lq-grid-2 { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 18px; }
@media (max-width: 1100px) { .lq-grid-2 { grid-template-columns: minmax(0, 1fr); } }

.lq-legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12.5px; color: var(--c-text-2); }
.lq-legend span { display: inline-flex; align-items: center; gap: 6px; }
.lq-swatch { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }

.lq-tooltip { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 10px; padding: 10px 12px; box-shadow: 0 10px 24px -10px rgba(15,23,42,.3); font-size: 12.5px; min-width: 150px; }
.lq-tooltip-title { font-weight: 650; margin-bottom: 6px; color: var(--c-text); }
.lq-tooltip-row { display: flex; align-items: center; gap: 8px; color: var(--c-text-2); padding: 1px 0; }
.lq-tooltip-row b { margin-left: auto; font-variant-numeric: tabular-nums; color: var(--c-text); }

.lq-dist { display: flex; height: 12px; border-radius: 999px; overflow: hidden; gap: 2px; background: #eef1f5; margin: 4px 0 18px; }
.lq-dist > span { height: 100%; }
.lq-dist-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid var(--c-border); }
.lq-dist-row:first-of-type { border-top: none; }
.lq-dist-row .name { display: inline-flex; align-items: center; gap: 8px; font-weight: 550; color: var(--c-text-2); }
.lq-dist-row .num { margin-left: auto; font-weight: 650; font-variant-numeric: tabular-nums; }
.lq-dist-row .pct { width: 52px; text-align: right; color: var(--c-muted); font-size: 12.5px; font-variant-numeric: tabular-nums; }

.lq-table-wrap { overflow-x: auto; }
.lq-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.lq-table th { padding: 10px 16px; text-align: left; white-space: nowrap; background: var(--c-soft); border-bottom: 1px solid var(--c-border); font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--c-muted); }
.lq-table th.num, .lq-table td.num { text-align: right; }
.lq-table td { padding: 12px 16px; border-bottom: 1px solid var(--c-border); color: var(--c-text-2); font-size: 13.5px; vertical-align: middle; }
.lq-table td.num { font-variant-numeric: tabular-nums; }
.lq-table tbody tr:last-child td { border-bottom: none; }
.lq-table tbody tr:hover td { background: #f8fafd; }
.lq-factory { font-weight: 600; color: var(--c-text); }
.lq-chips { display: flex; gap: 4px; flex-wrap: wrap; }
.lq-chip { font-size: 12px; font-weight: 550; padding: 2px 8px; border-radius: 999px; background: var(--c-soft); border: 1px solid var(--c-border); color: var(--c-text-2); }
.lq-rate { display: flex; align-items: center; gap: 10px; min-width: 150px; }
.lq-rate .lq-meter { flex: 1; }
.lq-rate b { width: 46px; text-align: right; font-variant-numeric: tabular-nums; color: var(--c-text); }

.lq-recent { list-style: none; margin: 0; padding: 0; }
.lq-recent li { display: flex; align-items: center; gap: 12px; padding: 11px 18px; border-bottom: 1px solid var(--c-border); cursor: pointer; transition: background .12s; }
.lq-recent li:last-child { border-bottom: none; }
.lq-recent li:hover { background: #f8fafd; }
.lq-recent .main { min-width: 0; flex: 1; }
.lq-recent .no { font-weight: 650; color: var(--c-text); font-size: 13.5px; }
.lq-recent .meta { font-size: 12px; color: var(--c-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lq-recent .chev { color: var(--c-faint); flex-shrink: 0; }

.lq-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 999px; white-space: nowrap; border: 1px solid; }
.lq-pill.pass { color: var(--c-green); background: var(--c-green-soft); border-color: #bbf7d0; }
.lq-pill.fail { color: var(--c-red); background: var(--c-red-soft); border-color: #fecaca; }
.lq-pill.conditional { color: var(--c-amber); background: var(--c-amber-soft); border-color: #fde68a; }
.lq-pill.draft { color: var(--c-muted); background: var(--c-soft); border-color: var(--c-border); }

.lq-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; padding: 36px 20px; color: var(--c-muted); font-size: 13.5px; }
.lq-empty svg { font-size: 26px; color: var(--c-faint); }
.lq-empty b { color: var(--c-text-2); font-size: 14px; }

.lq-skel { border-radius: 8px; background: linear-gradient(90deg, #eef1f5 25%, #f6f8fa 50%, #eef1f5 75%); background-size: 200% 100%; animation: lq-shimmer 1.2s infinite; }
@keyframes lq-shimmer { to { background-position: -200% 0; } }
`;

const pct = (n, d) => (d > 0 ? Math.round((n / d) * 1000) / 10 : null);

const monthLabel = (ym) => {
  if (!ym) return "";
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

const ResultPill = ({ status, result }) => {
  if (status !== "submitted") return <span className="lq-pill draft"><FiEdit3 size={11} /> Draft</span>;
  const s = STATUS[result];
  if (!s) return <span className="lq-pill draft">Pending</span>;
  return (
    <span className={`lq-pill ${result}`}>
      <s.Icon size={11} /> {s.label}
    </span>
  );
};

const Kpi = ({ label, value, foot, icon, tint, children }) => (
  <div className="lq-card lq-kpi">
    <div className="lq-kpi-top">
      <span className="lq-kpi-label">{label}</span>
      <span className="lq-kpi-icon" style={{ background: tint.bg, color: tint.fg }}>
        {icon}
      </span>
    </div>
    <div className="lq-kpi-value">{value}</div>
    {children}
    {foot && <div className="lq-kpi-foot">{foot}</div>}
  </div>
);

const Empty = ({ title, text, action }) => (
  <div className="lq-empty">
    <FiInbox />
    <b>{title}</b>
    {text && <span>{text}</span>}
    {action}
  </div>
);

const MonthlyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="lq-tooltip">
      <div className="lq-tooltip-title">{monthLabel(label)}</div>
      {["pass", "conditional", "fail"].map((k) => (
        <div key={k} className="lq-tooltip-row">
          <span className="lq-swatch" style={{ background: STATUS[k].color }} />
          {STATUS[k].label}
          <b>{row[k]}</b>
        </div>
      ))}
      <div className="lq-tooltip-row" style={{ borderTop: "1px solid #e6eaf0", marginTop: 4, paddingTop: 5 }}>
        Total submitted <b>{row.total}</b>
      </div>
    </div>
  );
};

const LabDashboard = () => {
  const navigate = useNavigate();
  const admin = isLabAdmin();

  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [factory, setFactory] = useState("");
  const [month, setMonth] = useState("");
  const [qcUser, setQcUser] = useState("");

  const [factoryOptions, setFactoryOptions] = useState([]);
  const [qcUserOptions, setQcUserOptions] = useState([]);

  useEffect(() => {
    // Every Lab/QC user (not just admins) needs the full factory list for
    // the "Factory" filter - it's just id+name, nothing sensitive.
    getFactories()
      .then((res) => setFactoryOptions(res.data || []))
      .catch(() => {});
    if (admin) {
      getQcUsers()
        .then((res) => setQcUserOptions(res.data || []))
        .catch(() => {});
    }
    getReports({ page: 1 })
      .then((res) => setRecent((res.data?.results || res.data || []).slice(0, 6)))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboard = useCallback(() => {
    setLoading(true);
    const params = {};
    if (factory) params.factory = factory;
    if (month) params.month = month;
    if (admin && qcUser) params.qc_user = qcUser;

    getLabDashboard(params)
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, [factory, month, qcUser, admin]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const summary = data?.summary || { total_reports: 0, passed: 0, failed: 0, conditional: 0, draft: 0 };
  const submitted = summary.passed + summary.failed + summary.conditional;
  const passRate = pct(summary.passed, submitted);

  const monthly = useMemo(
    () =>
      (data?.monthly || []).map((m) => ({
        month: m.month,
        total: m.total,
        pass: m.passed,
        fail: m.failed,
        conditional: Math.max(0, m.total - m.passed - m.failed),
      })),
    [data],
  );

  const factories = data?.factory_wise || [];
  const filtersOn = !!(factory || month || qcUser);
  const clearFilters = () => {
    setFactory("");
    setMonth("");
    setQcUser("");
  };

  const kpiValue = (v) => (loading ? <span className="lq-skel" style={{ display: "block", width: 64, height: 28 }} /> : v);

  return (
    <LabPageLayout>
      <style>{CSS}</style>
      <div className="lq-dash">
        <header className="lq-header">
          <div>
            <div className="lq-eyebrow">Merchandising · Lab / QC</div>
            <h1 className="lq-title">Lab / QC Dashboard</h1>
            <p className="lq-subtitle">Test results across factories. Pass rates count submitted reports only.</p>
          </div>
          <div className="lq-actions">
            <button type="button" className="lq-btn ghost" onClick={() => navigate("/lab-qc/reports")}>
              <FiFileText /> All reports
            </button>
            <button type="button" className="lq-btn primary" onClick={() => navigate("/lab-qc/reports/new")}>
              <FiPlus /> New report
            </button>
          </div>
        </header>

        <div className="lq-body">
          <div className="lq-card lq-filters">
            <div className="lq-field">
              <label htmlFor="lq-factory">Factory</label>
              <select id="lq-factory" value={factory} onChange={(e) => setFactory(e.target.value)}>
                <option value="">All factories</option>
                {factoryOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.supplier_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="lq-field" style={{ flexBasis: 180 }}>
              <label htmlFor="lq-month">Month</label>
              <input id="lq-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            {admin && (
              <div className="lq-field">
                <label htmlFor="lq-qc">QC officer</label>
                <select id="lq-qc" value={qcUser} onChange={(e) => setQcUser(e.target.value)}>
                  <option value="">All QC officers</option>
                  {qcUserOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_name || u.username}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {filtersOn && (
              <button type="button" className="lq-btn ghost" onClick={clearFilters} style={{ height: 38 }}>
                <FiX /> Clear filters
              </button>
            )}
            <span className="lq-filter-note">
              {admin ? "Showing all QC officers' reports" : "Showing your reports"}
            </span>
          </div>

          <div className="lq-kpis">
            <Kpi
              label="Total reports"
              value={kpiValue(summary.total_reports)}
              foot={`${submitted} submitted · ${summary.draft} draft${summary.draft === 1 ? "" : "s"}`}
              icon={<FiClipboard />}
              tint={{ bg: "#eef4ff", fg: "#2563eb" }}
            />
            <Kpi
              label="Pass rate"
              value={kpiValue(passRate === null ? "—" : `${passRate}%`)}
              icon={<FiPercent />}
              tint={{ bg: "#eef4ff", fg: "#2563eb" }}
              foot={submitted ? `${summary.passed} of ${submitted} submitted passed` : "No submitted reports yet"}
            >
              <div className="lq-meter">
                <span style={{ width: `${passRate || 0}%` }} />
              </div>
            </Kpi>
            {["pass", "conditional", "fail"].map((k) => {
              const n = k === "pass" ? summary.passed : k === "fail" ? summary.failed : summary.conditional;
              const share = pct(n, submitted);
              return (
                <Kpi
                  key={k}
                  label={STATUS[k].label === "Pass" ? "Passed" : STATUS[k].label === "Fail" ? "Failed" : "Conditional"}
                  value={kpiValue(n)}
                  icon={React.createElement(STATUS[k].Icon)}
                  tint={{ bg: `${STATUS[k].color}1a`, fg: STATUS[k].color }}
                  foot={share === null ? "—" : `${share}% of submitted`}
                />
              );
            })}
          </div>

          <div className="lq-grid-2">
            <section className="lq-card">
              <div className="lq-card-head">
                <div>
                  <h2 className="lq-card-title">Monthly results</h2>
                  <p className="lq-card-sub">Submitted reports by month and result</p>
                </div>
                <div className="lq-legend">
                  {["pass", "conditional", "fail"].map((k) => (
                    <span key={k}>
                      <i className="lq-swatch" style={{ background: STATUS[k].color }} />
                      {STATUS[k].label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="lq-card-body">
                {loading ? (
                  <div className="lq-skel" style={{ height: 280 }} />
                ) : monthly.length === 0 ? (
                  <Empty
                    title="No submitted reports yet"
                    text="Results appear here once reports are submitted."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthly} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barCategoryGap="32%">
                      <CartesianGrid vertical={false} stroke="#eef1f5" />
                      <XAxis
                        dataKey="month"
                        tickFormatter={monthLabel}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={{ stroke: "#e6eaf0" }}
                        tickLine={false}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<MonthlyTooltip />} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
                      <Bar dataKey="pass" stackId="r" fill={STATUS.pass.color} stroke={SURFACE} strokeWidth={2} maxBarSize={44} isAnimationActive={false} />
                      <Bar dataKey="conditional" stackId="r" fill={STATUS.conditional.color} stroke={SURFACE} strokeWidth={2} maxBarSize={44} isAnimationActive={false} />
                      <Bar dataKey="fail" stackId="r" fill={STATUS.fail.color} stroke={SURFACE} strokeWidth={2} maxBarSize={44} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="lq-card">
              <div className="lq-card-head">
                <div>
                  <h2 className="lq-card-title">Result breakdown</h2>
                  <p className="lq-card-sub">{submitted} submitted report{submitted === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div className="lq-card-body">
                {loading ? (
                  <div className="lq-skel" style={{ height: 160 }} />
                ) : submitted === 0 ? (
                  <Empty title="Nothing to break down yet" />
                ) : (
                  <>
                    <div className="lq-dist" role="img" aria-label="Share of results">
                      {["pass", "conditional", "fail"].map((k) => {
                        const n = k === "pass" ? summary.passed : k === "fail" ? summary.failed : summary.conditional;
                        return n > 0 ? (
                          <span key={k} title={`${STATUS[k].label}: ${n}`} style={{ width: `${(n / submitted) * 100}%`, background: STATUS[k].color }} />
                        ) : null;
                      })}
                    </div>
                    {["pass", "conditional", "fail"].map((k) => {
                      const n = k === "pass" ? summary.passed : k === "fail" ? summary.failed : summary.conditional;
                      const { Icon } = STATUS[k];
                      return (
                        <div key={k} className="lq-dist-row">
                          <span className="name">
                            <Icon style={{ color: STATUS[k].color }} />
                            {STATUS[k].label}
                          </span>
                          <span className="num">{n}</span>
                          <span className="pct">{pct(n, submitted)}%</span>
                        </div>
                      );
                    })}
                    {summary.draft > 0 && (
                      <div className="lq-dist-row">
                        <span className="name">
                          <FiEdit3 style={{ color: "#94a3b8" }} />
                          Drafts (not counted)
                        </span>
                        <span className="num">{summary.draft}</span>
                        <span className="pct" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>

          <div className="lq-grid-2">
            <section className="lq-card" style={{ overflow: "hidden" }}>
              <div className="lq-card-head">
                <div>
                  <h2 className="lq-card-title">Factory performance</h2>
                  <p className="lq-card-sub">Submitted reports and pass rate per factory</p>
                </div>
              </div>
              {loading ? (
                <div className="lq-card-body">
                  <div className="lq-skel" style={{ height: 140 }} />
                </div>
              ) : factories.length === 0 ? (
                <Empty
                  title={filtersOn ? "No reports match these filters" : "No factory results yet"}
                  action={
                    filtersOn && (
                      <button type="button" className="lq-link" onClick={clearFilters}>
                        Clear filters
                      </button>
                    )
                  }
                />
              ) : (
                <div className="lq-table-wrap">
                  <table className="lq-table">
                    <thead>
                      <tr>
                        <th>Factory</th>
                        <th>Assigned QC</th>
                        <th className="num">Reports</th>
                        <th className="num">Pass</th>
                        <th className="num">Fail</th>
                        <th>Pass rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {factories.map((f) => (
                        <tr key={f.factory_id}>
                          <td className="lq-factory">{f.factory_name}</td>
                          <td>
                            {(f.assigned_qc || []).length > 0 ? (
                              <div className="lq-chips">
                                {f.assigned_qc.map((q) => (
                                  <span key={q} className="lq-chip">
                                    {q}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>Not assigned</span>
                            )}
                          </td>
                          <td className="num">{f.reports_done}</td>
                          <td className="num">{f.passed}</td>
                          <td className="num">{f.failed}</td>
                          <td>
                            {f.pass_rate === null || f.pass_rate === undefined ? (
                              <span style={{ color: "#94a3b8" }}>—</span>
                            ) : (
                              <div className="lq-rate">
                                <div className="lq-meter">
                                  <span style={{ width: `${f.pass_rate}%` }} />
                                </div>
                                <b>{f.pass_rate}%</b>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="lq-card" style={{ overflow: "hidden" }}>
              <div className="lq-card-head">
                <div>
                  <h2 className="lq-card-title">Latest reports</h2>
                  <p className="lq-card-sub">Most recently created</p>
                </div>
                <button type="button" className="lq-link" onClick={() => navigate("/lab-qc/reports")}>
                  View all <FiChevronRight />
                </button>
              </div>
              {recent.length === 0 ? (
                <Empty
                  title="No reports yet"
                  action={
                    <button type="button" className="lq-btn primary" style={{ marginTop: 6 }} onClick={() => navigate("/lab-qc/reports/new")}>
                      <FiPlus /> Create the first report
                    </button>
                  }
                />
              ) : (
                <ul className="lq-recent">
                  {recent.map((r) => (
                    <li
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/lab-qc/reports/${r.id}`)}
                      onKeyDown={(e) => e.key === "Enter" && navigate(`/lab-qc/reports/${r.id}`)}
                    >
                      <div className="main">
                        <div className="no">{r.report_no}</div>
                        <div className="meta">
                          {[r.style, r.factory_name, formatDate(r.created_at)].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <ResultPill status={r.status} result={r.overall_result} />
                      <FiChevronRight className="chev" />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </LabPageLayout>
  );
};

export default LabDashboard;
