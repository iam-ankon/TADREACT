/**
 * OnTimeDeliveryScorecard.jsx
 *
 * Supplier on-time delivery dashboard. Backed by
 * GET /api/merchandiser/api/reports/on-time-delivery/
 *   ?start=YYYY-MM&end=YYYY-MM&supplier=1,2&buyer=3&basis=shipment_planned
 * (see getOnTimeDeliveryScorecard in api/merchandiser.js and the comment
 * above the Django view for the full definitions).
 *
 * On-time % = (early + in-time) ÷ scored styles. Orders of every status are
 * included (narrow with the Status filter). An order is "scored" when it has
 * both a planned and an actual date under the chosen basis; the rest are
 * listed under "Missing dates".
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LabelList, ReferenceLine, PieChart, Pie, Cell, Line, LineChart,
} from "recharts";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import {
  FiTruck, FiPrinter, FiDownload, FiAlertTriangle, FiAlertCircle, FiInbox, FiRefreshCw, FiSearch, FiCheckCircle, FiClock, FiTrendingUp, FiX, FiEdit2, FiCheck,
} from "react-icons/fi";
import { getOnTimeDeliveryScorecard, patchOrder } from "../../api/merchandiser";
import { canManageOrders, isMerchandiserProduction } from "../../utils/accessControl";
import Sidebar from "./Sidebar.jsx";

/* ─────────────────────────────── design tokens ─────────────────────────── */

const C = {
  page: "#eef2f6",
  surface: "#ffffff",
  border: "#e3e8ef",
  ink: "#0f2433",
  ink2: "#4a5b6b",
  muted: "#7b8a99",
  grid: "#e9edf2",
  hero: "#0d2b3e",
  heroSoft: "#16405a",
  primary: "#2a78d6",
  primarySoft: "#86b6ef",
  early: "#1baf7a",
  inTime: "#2a78d6",
  delayed: "#e34948",
  good: "#0ca30c",
  warn: "#c98500",
  bad: "#d03b3b",
  note: "#e7f0f4",
  missing: "#b8c2cc", // orders with a missing date (not part of the on-time %)
};
const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// Ordinal orange ramp for the delay buckets (light → dark = shorter → longer).
const BUCKET_COLORS = ["#f3a27f", "#eb6834", "#b8461b"];

// Planned = shipment date, actual = Ex-Factory is the only basis used
// (user decision 2026-09-25; replaced "Ex-Factory only", which was planned =
// Ex-Factory, actual = shipment date). There is no Planned date filter on
// the page any more; the label below is only shown in the header/export. The API still accepts
// etd_or_ex_factory / etd / ex_factory / shipment_date for other callers.
const BASIS_OPTIONS = [
  { value: "shipment_planned", label: "Shipment date (actual = Ex-Factory)" },
];

// Short tags shown next to a date to say which order field it came from.
const SOURCE_TAG = { etd: "ETD", ex_factory: "Ex-Fty", shipment_date: "Ship", today: "Today" };

/* Filters, target, active tab and table searches are remembered per browser
 * in localStorage. Storage can be unavailable (private mode, blocked site
 * data), so every access is wrapped and the page falls back to defaults. */
const STORAGE_KEY = "otdScorecard.v1";

const loadSaved = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) || {} : {};
  } catch {
    return {};
  }
};

const saveState = (patch) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadSaved(), ...patch }));
  } catch {
    /* storage unavailable — nothing to persist */
  }
};

const clearSaved = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
};

const STATUS_COLORS = {
  Shipped: ["#e6f6ee", "#0b7a4b"],
  Running: ["#e8f1fc", "#1c5cab"],
  Active: ["#fff4e0", "#8a5a00"],
  Pending: ["#f1f1ef", "#52514e"],
  Cancelled: ["#fde7e7", "#a4262c"],
};

/* ─────────────────────────────── helpers ───────────────────────────────── */

const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const PRESETS = [
  {
    key: "ytd", label: "This year",
    range: () => { const n = new Date(); return { start: `${n.getFullYear()}-01`, end: ym(n) }; },
  },
  {
    key: "6m", label: "Last 6 months",
    range: () => { const n = new Date(); return { start: ym(new Date(n.getFullYear(), n.getMonth() - 5, 1)), end: ym(n) }; },
  },
  {
    key: "12m", label: "Last 12 months",
    range: () => { const n = new Date(); return { start: ym(new Date(n.getFullYear(), n.getMonth() - 11, 1)), end: ym(n) }; },
  },
  {
    key: "ly", label: "Last year",
    range: () => { const y = new Date().getFullYear() - 1; return { start: `${y}-01`, end: `${y}-12` }; },
  },
];

const fmtInt = (n) => (n === null || n === undefined ? "—" : Math.round(n).toLocaleString("en-US"));

const fmtCompact = (n, digits = 2) => {
  if (n === null || n === undefined) return "—";
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(digits)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(digits)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
};

// Short axis ticks: 800K, 1.6M — no trailing ".0" that gets clipped.
const fmtAxis = (n) => {
  const a = Math.abs(n);
  if (a >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${Math.round(n / 1e3)}K`;
  return `${n}`;
};

const StatusPill = ({ status }) => {
  const [bg, fg] = STATUS_COLORS[status] || ["#f1f1ef", "#52514e"];
  return (
    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: bg, color: fg }}>
      {status || "—"}
    </span>
  );
};

/**
 * Readable length for a number of days: 12 → "12 d", 230 → "7 mo 17 d",
 * 400 → "1 yr 1 mo". A month is the average 30.44 days, so this is for
 * reading at a glance; exact day counts stay in tooltips and the export.
 */
const DAYS_PER_MONTH = 365.25 / 12;
const fmtDuration = (days) => {
  if (days === null || days === undefined) return "—";
  const d = Math.round(Math.abs(days));
  if (d < 31) return `${d} d`;
  if (d < 365) {
    const months = Math.floor(d / DAYS_PER_MONTH);
    const rest = Math.round(d - months * DAYS_PER_MONTH);
    return rest ? `${months} mo ${rest} d` : `${months} mo`;
  }
  const years = Math.floor(d / 365.25);
  const months = Math.floor((d - years * 365.25) / DAYS_PER_MONTH);
  return months ? `${years} yr ${months} mo` : `${years} yr`;
};

/**
 * Exact calendar gap between two YYYY-MM-DD dates, e.g. 06 Feb → 24 Sep =
 * "7 mo 18 d". Used for individual orders, where both dates are known.
 */
const fmtDateGap = (from, to) => {
  if (!from || !to) return null;
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  let years = ty - fy;
  let months = tm - fm;
  let days = td - fd;
  if (days < 0) {
    months -= 1;
    days += new Date(ty, tm - 1, 0).getDate(); // days in the month before `to`
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const parts = [];
  if (years) parts.push(`${years} yr`);
  if (months) parts.push(`${months} mo`);
  if (days || !parts.length) parts.push(`${days} d`);
  return parts.join(" ");
};

const fmtPct = (p, digits = 0) => (p === null || p === undefined ? "—" : `${Number(p).toFixed(digits)}%`);

const fmtDate = (d) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const datedCell = (date, source) => (date
  ? <>{fmtDate(date)} <span style={{ color: "#7b8a99", fontSize: 11 }}>{SOURCE_TAG[source] || ""}</span></>
  : "—");

const monthShort = (monthKey) => {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
};

const periodLabel = (start, end) => {
  const f = (k, withYear) => {
    const [y, m] = k.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", withYear ? { month: "short", year: "numeric" } : { month: "short" });
  };
  if (!start || !end) return "";
  if (start === end) return f(start, true);
  return start.slice(0, 4) === end.slice(0, 4)
    ? `${f(start, false)}–${f(end, false)} ${start.slice(0, 4)}`
    : `${f(start, true)} – ${f(end, true)}`;
};

const verdictFor = (pct) => {
  if (pct === null || pct === undefined) return { text: "no scored shipments yet", color: C.muted };
  if (pct >= 90) return { text: "benchmark for reliability", color: C.good };
  if (pct >= 75) return { text: "reliable performer", color: C.primary };
  if (pct >= 50) return { text: "room to improve", color: C.warn };
  return { text: "delivery at risk", color: C.bad };
};

/** Longest run of consecutive months with 100% on-time (scored months only). */
const bestPerfectStreak = (monthly) => {
  let best = { len: 0, from: null, to: null, styles: 0 };
  let cur = { len: 0, from: null, styles: 0 };
  monthly.forEach((m) => {
    if (m.scored_styles > 0 && m.on_time_percent === 100) {
      cur = cur.len ? { ...cur, len: cur.len + 1, styles: cur.styles + m.scored_styles } : { len: 1, from: m.month, styles: m.scored_styles };
      if (cur.len > best.len) best = { ...cur, to: m.month };
    } else {
      cur = { len: 0, from: null, styles: 0 };
    }
  });
  return best;
};

/* ─────────────────────────────── small UI pieces ───────────────────────── */

const Card = ({ title, subtitle, right, children, style, bodyStyle }) => (
  <div className="otd-card" style={{
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
    boxShadow: "0 1px 2px rgba(15,36,51,.04)", display: "flex", flexDirection: "column", ...style,
  }}>
    {(title || right) && (
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "16px 20px 0" }}>
        <div>
          {title && <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
    )}
    <div style={{ padding: "12px 20px 18px", flex: 1, ...bodyStyle }}>{children}</div>
  </div>
);

const StatTile = ({ value, label, sub, accent, icon }) => (
  <div className="otd-card otd-lift" style={{
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
    padding: "18px 18px 16px", display: "flex", flexDirection: "column", justifyContent: "center",
    textAlign: "center", minHeight: 112,
  }}>
    <div style={{ fontFamily: FONT, letterSpacing: "-.02em", fontSize: 28, fontWeight: 700, color: accent || C.ink, lineHeight: 1.1 }}>
      {value}
    </div>
    <div style={{ fontSize: 13, color: C.ink2, marginTop: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {icon}{label}
    </div>
    {sub && <div style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>{sub}</div>}
  </div>
);

const TooltipBox = ({ title, rows }) => (
  <div style={{
    background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px",
    boxShadow: "0 8px 24px rgba(15,36,51,.14)", fontSize: 12.5, color: C.ink, minWidth: 170,
  }}>
    <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
    {rows.map(([label, value, color]) => (
      <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "2px 0" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.ink2 }}>
          {color && <span style={{ width: 9, height: 9, borderRadius: 2, background: color, display: "inline-block" }} />}
          {label}
        </span>
        <span style={{ fontWeight: 600 }}>{value}</span>
      </div>
    ))}
  </div>
);

const monthTooltip = (renderRows) => ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const m = payload[0].payload;
  return <TooltipBox title={m.label} rows={renderRows(m)} />;
};

const Legend = ({ items }) => (
  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: C.ink2 }}>
    {items.map(([label, color]) => (
      <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block" }} />
        {label}
      </span>
    ))}
  </div>
);

const EmptyChart = ({ text = "No scored shipments in this period" }) => (
  <div style={{ height: "100%", minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>
    {text}
  </div>
);

const axisProps = {
  tick: { fontSize: 12, fill: C.ink2 },
  axisLine: { stroke: "#cfd8e2" },
  tickLine: false,
};

/**
 * X-axis tick for stacked monthly charts: the month name plus one small line
 * per series (colour swatch + value), so the scored and missing-dates split is
 * readable without hovering, even when a bar segment is too thin for a label.
 */
const SplitTick = ({ x, y, payload, index, data, rows }) => {
  const m = data?.[index ?? payload?.index];
  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={12} textAnchor="middle" fill={C.ink2} fontSize={12}>{payload?.value}</text>
      {m && rows.map(([key, color, fmt], i) => (
        <g key={key} transform={`translate(0,${27 + i * 13})`}>
          <rect x={-21} y={-7} width={7} height={7} rx={1.5} fill={color} />
          <text x={-11} y={0} fontSize={10.5} fill={C.ink} fontWeight={600}>{m[key] ? fmt(m[key]) : "—"}</text>
        </g>
      ))}
    </g>
  );
};

/** In-segment count for stacked bars; skipped when the segment is too small to hold it. */
const segmentLabel = (color) => ({ x, y, width, height, value }) => {
  if (!value || height < 14 || width < 14) return null;
  return (
    <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700} fill={color} pointerEvents="none">
      {value}
    </text>
  );
};

/* ─────────────────────────────── sortable table ────────────────────────── */

const SortableTable = ({ columns, rows, initialSort, emptyText, storageKey }) => {
  const [sort, setSort] = useState(initialSort);
  const [query, setQuery] = useState(() => (storageKey && loadSaved().search?.[storageKey]) || "");
  const [limit, setLimit] = useState(25);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = q
      ? rows.filter((r) => columns.some((c) => String(c.search ? c.search(r) : r[c.key] ?? "").toLowerCase().includes(q)))
      : rows;
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      const get = col?.sortValue || ((r) => r[sort.key]);
      out = [...out].sort((a, b) => {
        const va = get(a); const vb = get(b);
        if (va === vb) return 0;
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        return (va > vb ? 1 : -1) * (sort.dir === "asc" ? 1 : -1);
      });
    }
    return out;
  }, [rows, columns, sort, query]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }} className="no-print">
        <div style={{ position: "relative", flex: "0 1 320px" }}>
          <FiSearch size={14} color={C.muted} style={{ position: "absolute", left: 10, top: 10 }} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(25);
              if (storageKey) saveState({ search: { ...loadSaved().search, [storageKey]: e.target.value } });
            }}
            placeholder="Search Order NO, supplier, buyer…"
            style={{ width: "100%", padding: "8px 10px 8px 30px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: "none" }}
          />
        </div>
        <span style={{ fontSize: 12, color: C.muted }}>{filtered.length} row{filtered.length === 1 ? "" : "s"}</span>
      </div>
      <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === "desc" ? "asc" : "desc" }))}
                  style={{
                    textAlign: c.align || "left", padding: "10px 12px", background: "#f5f7fa", color: C.ink2,
                    fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".03em",
                    borderBottom: `1px solid ${C.border}`, cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
                  }}
                >
                  {c.label}{sort?.key === c.key ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, limit).map((r) => (
              <tr key={r.id} className="otd-row">
                {columns.map((c) => (
                  <td key={c.key} style={{
                    padding: "9px 12px", borderBottom: `1px solid ${C.grid}`, color: C.ink,
                    textAlign: c.align || "left", whiteSpace: c.wrap ? "normal" : "nowrap", maxWidth: c.maxWidth,
                    overflow: "hidden", textOverflow: "ellipsis",
                  }} title={c.wrap ? undefined : String(c.render ? "" : r[c.key] ?? "")}>
                    {c.render ? c.render(r) : r[c.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={columns.length} style={{ padding: 24, textAlign: "center", color: C.muted }}>
                {rows.length && query.trim() ? `No rows match “${query.trim()}”.` : emptyText}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > limit && (
        <div style={{ textAlign: "center", marginTop: 12 }} className="no-print">
          <button className="otd-btn" onClick={() => setLimit((l) => l + 50)}>Show more ({filtered.length - limit} left)</button>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────── editable date cell ────────────────────── */

/**
 * Shows a date with a small edit button; the editor saves straight to the
 * order (PATCH /orders/:id/). Enter saves, Esc cancels. Order.save() on the
 * server recalculates the delay fields, so the score picks the change up.
 */
const DateEditCell = ({ row, field, label, canEdit, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row[field] || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!editing) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {fmtDate(row[field])}
        {canEdit && (
          <button
            type="button"
            className="otd-icon-btn no-print"
            title={`Edit ${label}`}
            aria-label={`Edit ${label} for Order NO ${row.style || ""}`}
            onClick={() => { setValue(row[field] || ""); setError(null); setEditing(true); }}
          >
            <FiEdit2 size={13} />
          </button>
        )}
      </span>
    );
  }

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await patchOrder(row.id, { [field]: value || null });
      setEditing(false);
      onSaved(row, label, value || null);
    } catch (err) {
      const data = err.response?.data;
      setError((data && (data[field]?.[0] || data.detail)) || "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      <input
        type="date"
        className="otd-input"
        style={{ height: 30, padding: "2px 6px", fontSize: 12.5 }}
        value={value}
        autoFocus
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <button type="button" className="otd-icon-btn save" title="Save" onClick={save} disabled={saving}>
        <FiCheck size={14} />
      </button>
      <button type="button" className="otd-icon-btn" title="Cancel" onClick={() => setEditing(false)} disabled={saving}>
        <FiX size={14} />
      </button>
      {error && <span style={{ color: C.bad, fontSize: 11.5, whiteSpace: "normal" }}>{error}</span>}
    </span>
  );
};

/* ─────────────────────────────── main component ────────────────────────── */

const defaultFilters = () => ({ ...PRESETS[0].range(), suppliers: [], buyers: [], statuses: [], basis: "shipment_planned" });

/** Saved filters merged over the defaults, dropping anything malformed. */
const initialFilters = () => {
  const d = defaultFilters();
  const saved = loadSaved().filters || {};
  const isMonth = (v) => typeof v === "string" && /^\d{4}-\d{2}$/.test(v);
  const ints = (v) => (Array.isArray(v) ? v.filter(Number.isInteger) : []);
  return {
    start: isMonth(saved.start) ? saved.start : d.start,
    end: isMonth(saved.end) ? saved.end : d.end,
    suppliers: ints(saved.suppliers),
    buyers: ints(saved.buyers),
    statuses: Array.isArray(saved.statuses) ? saved.statuses.filter((v) => typeof v === "string") : [],
    basis: BASIS_OPTIONS.some((o) => o.value === saved.basis) ? saved.basis : d.basis,
  };
};

const OnTimeDeliveryScorecard = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [target, setTarget] = useState(() => {
    const t = Number(loadSaved().target);
    return Number.isFinite(t) && t >= 0 && t <= 100 ? t : 90;
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tableTab, setTableTab] = useState(() => (loadSaved().tableTab === "unscored" ? "unscored" : "delayed"));
  // Confirmation shown after a date is saved from the Missing dates table.
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  // Tables remount on reset so their search boxes pick up the cleared state.
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => { saveState({ filters, target, tableTab }); }, [filters, target, tableTab]);

  const fetchReport = useCallback(async (f) => {
    if (!f.start || !f.end) return;
    if (f.start > f.end) { setError("Start month must not be after end month."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await getOnTimeDeliveryScorecard(f);
      setReport(res.data);
    } catch (err) {
      console.error("On-time delivery scorecard fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load the scorecard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Every filter change refetches straight away — no separate "Apply" step.
  useEffect(() => { fetchReport(filters); }, [filters, fetchReport]);

  const update = (patch) => setFilters((f) => ({ ...f, ...patch }));

  const supplierOptions = report?.filter_options?.suppliers || [];
  const buyerOptions = report?.filter_options?.buyers || [];
  const selectedSuppliers = supplierOptions.filter((s) => filters.suppliers.includes(s.id));
  const selectedBuyers = buyerOptions.filter((b) => filters.buyers.includes(b.id));
  const statusOptions = report?.filter_options?.statuses || [];
  // Keep a selected status visible even when the period has no orders in it.
  const statusValues = [...new Set([...statusOptions.map((o) => o.value), ...filters.statuses])].filter(Boolean);
  const statusCount = Object.fromEntries(statusOptions.map((o) => [o.value, o.styles]));

  const totals = report?.totals;
  const monthly = useMemo(
    () => (report?.monthly || []).map((m) => ({
      ...m,
      short: monthShort(m.month),
      total_styles: m.scored_styles + (m.unscored_styles || 0),
      total_qty: m.qty + (m.unscored_qty || 0),
      total_value: m.value + (m.unscored_value || 0),
      total_pos: m.orders + (m.unscored_orders || 0),
    })),
    [report],
  );
  const scoredMonths = monthly.filter((m) => m.scored_styles > 0);
  const buckets = report?.delay_buckets || [];
  const hasData = !!totals && totals.scored_styles > 0;

  /* ---- masthead text ---- */
  const title = selectedSuppliers.length === 1
    ? selectedSuppliers[0].name
    : selectedSuppliers.length > 1 ? `${selectedSuppliers.length} suppliers` : "All suppliers";
  const subtitleParts = [];
  if (selectedSuppliers.length === 1 && selectedSuppliers[0].category) subtitleParts.push(`${selectedSuppliers[0].category} factory`);
  subtitleParts.push(periodLabel(report?.period?.start || filters.start, report?.period?.end || filters.end));
  if (selectedBuyers.length) subtitleParts.push(selectedBuyers.map((b) => b.name).join(", "));
  if (filters.statuses.length) subtitleParts.push(filters.statuses.join(", "));
  const verdict = verdictFor(totals?.on_time_percent);

  /* ---- auto insights ---- */
  const insights = useMemo(() => {
    if (!hasData) return [];
    const out = [];
    out.push(`${fmtPct(totals.on_time_percent, 1)} on time or early: ${totals.on_time} of ${totals.scored_styles} orders (${totals.early} early, ${totals.in_time} exactly on the planned date).`);
    const streak = bestPerfectStreak(monthly);
    if (streak.len >= 2) {
      out.push(`100% on-time for ${streak.len} consecutive months (${monthShort(streak.from)}–${monthShort(streak.to)}), covering ${streak.styles} orders.`);
    }
    if (scoredMonths.length >= 2) {
      const best = [...scoredMonths].sort((a, b) => b.on_time_percent - a.on_time_percent || b.scored_styles - a.scored_styles)[0];
      const worst = [...scoredMonths].sort((a, b) => a.on_time_percent - b.on_time_percent || b.scored_styles - a.scored_styles)[0];
      if (best.month !== worst.month) {
        out.push(`Best month ${best.label} at ${fmtPct(best.on_time_percent)}; weakest ${worst.label} at ${fmtPct(worst.on_time_percent)} (${worst.delayed} of ${worst.scored_styles} orders late).`);
      }
      const peak = [...scoredMonths].sort((a, b) => b.qty - a.qty)[0];
      out.push(`Peak shipment month: ${peak.label} with ${fmtCompact(peak.qty)} pieces across ${peak.scored_styles} orders.`);
    }
    if (totals.qty > 0) out.push(`Value per piece: $${(totals.value / totals.qty).toFixed(2)} average across ${fmtCompact(totals.qty)} pieces.`);
    if (totals.delayed > 0) {
      const top = [...buckets].sort((a, b) => b.count - a.count)[0];
      out.push(`${totals.delayed} orders late, averaging ${fmtDuration(totals.avg_delay_days)}; most fall in the ${top.label} band (${fmtPct(top.percent_of_delayed)} of delays).`);
    }
    const bySup = (report?.by_supplier || []).filter((s) => s.scored_styles >= 5 && s.on_time_percent !== null);
    if (bySup.length > 1) {
      const lead = [...bySup].sort((a, b) => b.on_time_percent - a.on_time_percent || b.scored_styles - a.scored_styles)[0];
      out.push(`Most reliable supplier (5+ orders): ${lead.name} at ${fmtPct(lead.on_time_percent)} across ${lead.scored_styles} orders.`);
    }
    return out;
  }, [hasData, totals, monthly, scoredMonths, buckets, report]);

  const nextFocus = useMemo(() => {
    if (!hasData) return null;
    const pct = totals.on_time_percent;
    const longBucket = buckets.find((b) => b.key === "11_plus");
    if (pct >= 90) return "Sustain the on-time run into the next season's peak months.";
    if (longBucket?.count) return `Cut the ${longBucket.count} long delays (11+ days) first — they carry the biggest delivery risk.`;
    return `Close the ${fmtPct(Math.max(target - pct, 0), 0)} gap to the ${target}% target by tightening the 1–5 day slips.`;
  }, [hasData, totals, buckets, target]);

  /* ---- chart data ---- */
  const splitData = hasData ? [
    { name: "Early", value: totals.early, color: C.early },
    { name: "In time", value: totals.in_time, color: C.inTime },
    { name: "Delayed", value: totals.delayed, color: C.delayed },
  ] : [];

  const supplierRanking = useMemo(
    () => (report?.by_supplier || [])
      .filter((s) => s.scored_styles > 0 && s.id !== null)
      .sort((a, b) => b.on_time_percent - a.on_time_percent || b.scored_styles - a.scored_styles),
    [report],
  );

  /* ---- export ---- */
  const exportExcel = async () => {
    if (!report) return;
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const summary = [
      ["On-Time Delivery Scorecard"],
      ["Supplier", title],
      ["Buyer", selectedBuyers.map((b) => b.name).join(", ") || "All buyers"],
      ["Period", periodLabel(report.period.start, report.period.end)],
      ["Planned date", BASIS_OPTIONS.find((o) => o.value === report.basis)?.label],
      [],
      ["On-time % (early + in time)", totals.on_time_percent],
      ["Scored orders", totals.scored_styles],
      ["Early", totals.early], ["In time", totals.in_time], ["Delayed", totals.delayed],
      ["Pieces", totals.qty], ["Value ($)", totals.value], ["Orders", totals.orders],
      ["Avg delay (days, late orders)", totals.avg_delay_days],
      ["Status", filters.statuses.join(", ") || "All statuses"],
      ["Orders missing planned/actual date", totals.unscored_styles],
      [],
      ["Delay band", "Orders", "% of delayed", "% of all scored"],
      ...buckets.map((b) => [b.label, b.count, b.percent_of_delayed, b.percent_of_scored]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");
    const groupRows = (rows, nameKey) => rows.map((r) => ({
      [nameKey]: r.label || r.name, "Scored orders": r.scored_styles, Early: r.early, "In time": r.in_time,
      Delayed: r.delayed, "On-time %": r.on_time_percent, Pieces: r.qty, "Value ($)": r.value, Orders: r.orders,
      "Avg delay (days)": r.avg_delay_days, "Missing dates": r.unscored_styles,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(groupRows(monthly, "Month")), "Monthly");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(groupRows(report.by_supplier, "Supplier")), "By supplier");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(groupRows(report.by_buyer, "Buyer")), "By buyer");
    const orderRows = (rows) => rows.map((o) => ({
      "Order NO": o.style, Item: o.item, Supplier: o.supplier, Buyer: o.buyer,
      Status: o.status, ETD: o.etd, "Ex-Factory": o.ex_factory, "Shipment date": o.shipment_date,
      "Planned date": o.planned_date, "Actual date": o.actual_date,
      "Delay (days)": o.delay_days,
      Delay: o.delay_days > 0 ? fmtDateGap(o.planned_date, o.actual_date) || fmtDuration(o.delay_days) : null,
      Qty: o.qty, "Value ($)": o.value,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(orderRows(report.delayed_orders)), "Delayed orders");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(orderRows(report.unscored_orders)), "Missing dates");
    XLSX.writeFile(wb, `on-time-delivery_${report.period.start}_${report.period.end}.xlsx`);
  };

  /* ---- table columns ---- */
  const orderColumns = [
    { key: "style", label: "Order NO" },
    { key: "supplier", label: "Supplier", maxWidth: 200 },
    { key: "buyer", label: "Buyer", maxWidth: 180 },
    { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} /> },
    { key: "planned_date", label: "Planned", render: (r) => datedCell(r.planned_date, r.planned_source) },
    { key: "actual_date", label: "Actual", render: (r) => datedCell(r.actual_date, r.actual_source) },
    {
      key: "delay_days", label: "Delay", align: "right",
      render: (r) => (
        <span style={{
          display: "inline-block", minWidth: 54, padding: "2px 8px", borderRadius: 999, fontWeight: 700, fontSize: 12,
          background: r.delay_days > 10 ? "#fde7e7" : r.delay_days > 5 ? "#fdeee6" : "#fff4ec",
          color: r.delay_days > 10 ? "#a4262c" : "#b0431a",
        }} title={`${r.delay_days} days`}>+{fmtDateGap(r.planned_date, r.actual_date) || fmtDuration(r.delay_days)}</span>
      ),
    },
    { key: "qty", label: "Qty", align: "right", render: (r) => fmtInt(r.qty) },
    { key: "value", label: "Value", align: "right", render: (r) => `$${fmtInt(r.value)}` },
  ];
  // Same rules as the Orders page: full order editors may change any date;
  // Merchandiser - Production may only change Ex-Factory.
  const canEditDate = (field) =>
    canManageOrders() || (isMerchandiserProduction() && field === "ex_factory");

  const handleDateSaved = (row, label, value) => {
    setNotice(`${label} ${value ? `set to ${fmtDate(value)}` : "cleared"} for Order NO ${row.style || row.id}. Score updated.`);
    fetchReport(filters);
  };

  const dateCell = (row, field, label) => (
    <DateEditCell row={row} field={field} label={label} canEdit={canEditDate(field)} onSaved={handleDateSaved} />
  );

  const unscoredColumns = [
    { key: "style", label: "Order NO" },
    { key: "supplier", label: "Supplier", maxWidth: 200 },
    { key: "buyer", label: "Buyer", maxWidth: 180 },
    { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} /> },
    { key: "shipment_date", label: "Shipment date", render: (r) => dateCell(r, "shipment_date", "Shipment date") },
    { key: "etd", label: "ETD", render: (r) => dateCell(r, "etd", "ETD") },
    { key: "ex_factory", label: "Ex-Factory", render: (r) => dateCell(r, "ex_factory", "Ex-Factory") },
    { key: "qty", label: "Qty", align: "right", render: (r) => fmtInt(r.qty) },
  ];

  /* ─────────────────────────────── render ─────────────────────────────── */

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: C.page }}>
      <div className="no-print"><Sidebar /></div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <div id="otd-root" style={{ fontFamily: FONT, padding: "24px 32px 60px", minHeight: "100vh", maxWidth: 1480, margin: "0 auto" }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            #otd-root, #otd-root *, #otd-root .MuiAutocomplete-root *, #otd-root .recharts-wrapper text,
            #otd-root input, #otd-root select, #otd-root button {
              font-family: ${FONT} !important;
            }
            body > .MuiAutocomplete-popper, body > .MuiAutocomplete-popper * { font-family: ${FONT} !important; }
            #otd-root .otd-lift { transition: transform .15s ease, box-shadow .15s ease; }
            #otd-root .otd-lift:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(15,36,51,.08); }
            #otd-root .otd-row:hover td { background: #f7fafc; }
            #otd-root .otd-icon-btn {
              display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px;
              border-radius: 7px; border: 1px solid ${C.border}; background: #fff; color: ${C.ink2}; cursor: pointer;
              padding: 0; transition: background .12s ease, color .12s ease, border-color .12s ease;
            }
            #otd-root .otd-icon-btn:hover { background: #eef5fd; color: ${C.primary}; border-color: ${C.primary}; }
            #otd-root .otd-icon-btn.save { color: #0b7a4b; border-color: #9fd8bd; }
            #otd-root .otd-icon-btn.save:hover { background: #e6f6ee; }
            #otd-root .otd-icon-btn:disabled { opacity: .5; cursor: wait; }
            #otd-root .otd-btn {
              display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 9px;
              font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid ${C.border};
              background: #fff; color: ${C.ink}; transition: background .12s ease, box-shadow .12s ease;
            }
            #otd-root .otd-btn:hover { background: #f3f6f9; box-shadow: 0 2px 8px rgba(15,36,51,.08); }
            #otd-root .otd-btn.primary { background: ${C.hero}; color: #fff; border-color: ${C.hero}; }
            #otd-root .otd-btn.primary:hover { background: ${C.heroSoft}; }
            #otd-root .otd-chip {
              padding: 6px 12px; border-radius: 999px; font-size: 12.5px; font-weight: 600; cursor: pointer;
              border: 1px solid ${C.border}; background: #fff; color: ${C.ink2}; transition: all .12s ease;
            }
            #otd-root .otd-chip:hover { border-color: ${C.primary}; color: ${C.primary}; }
            #otd-root .otd-chip.active { background: ${C.hero}; border-color: ${C.hero}; color: #fff; }
            #otd-root .otd-input {
              padding: 8px 10px; border: 1px solid #cfd8e2; border-radius: 8px; font-size: 13px;
              color: ${C.ink}; background: #fff; outline: none; height: 40px; box-sizing: border-box;
            }
            #otd-root .otd-input:focus { border-color: ${C.primary}; box-shadow: 0 0 0 3px rgba(42,120,214,.15); }
            #otd-root .otd-label { display: block; font-size: 11.5px; font-weight: 700; color: ${C.ink2}; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .04em; }
            #otd-root .otd-grid-hero { display: grid; grid-template-columns: minmax(300px, 380px) 1fr; gap: 18px; }
            #otd-root .otd-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
            #otd-root .otd-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
            #otd-root .otd-tab { padding: 8px 14px; border: none; background: none; font-size: 13px; font-weight: 700; color: ${C.muted}; cursor: pointer; border-bottom: 2px solid transparent; }
            #otd-root .otd-tab.active { color: ${C.ink}; border-bottom-color: ${C.hero}; }
            #otd-root .recharts-bar-rectangle { cursor: pointer; }
            @media (max-width: 1100px) {
              #otd-root .otd-grid-hero, #otd-root .otd-grid-2 { grid-template-columns: 1fr; }
              #otd-root .otd-grid-4 { grid-template-columns: repeat(2, 1fr); }
            }
            @keyframes otd-spin { to { transform: rotate(360deg); } }
            @media print {
              body * { visibility: hidden; }
              #otd-root, #otd-root * { visibility: visible; }
              #otd-root { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
              .no-print { display: none !important; }
              #otd-root .otd-card { break-inside: avoid; box-shadow: none !important; }
            }
          `}</style>

          {/* ── Page header ── */}
          <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: C.hero, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FiTruck size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: C.ink }}>Supplier Score Card</h1>
                <div style={{ fontSize: 13, color: C.muted }}>On-time delivery performance of orders, all statuses</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="otd-btn" onClick={() => fetchReport(filters)} disabled={loading}>
                <FiRefreshCw size={14} style={loading ? { animation: "otd-spin 1s linear infinite" } : undefined} /> Refresh
              </button>
              <button className="otd-btn" onClick={exportExcel} disabled={!report}><FiDownload size={14} /> Excel</button>
              <button className="otd-btn primary" onClick={() => window.print()} disabled={!report}><FiPrinter size={14} /> Print</button>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="no-print otd-card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {PRESETS.map((p) => {
                const r = p.range();
                const active = r.start === filters.start && r.end === filters.end;
                return (
                  <button key={p.key} className={`otd-chip${active ? " active" : ""}`} onClick={() => update(r)}>{p.label}</button>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "140px 140px minmax(200px, 1.4fr) minmax(170px, 1fr) minmax(150px, .8fr) 80px auto", gap: 12, alignItems: "end" }}>
              <div>
                <label className="otd-label">From</label>
                <input type="month" className="otd-input" style={{ width: "100%" }} value={filters.start} max={filters.end}
                  onChange={(e) => e.target.value && update({ start: e.target.value })} />
              </div>
              <div>
                <label className="otd-label">To</label>
                <input type="month" className="otd-input" style={{ width: "100%" }} value={filters.end} min={filters.start}
                  onChange={(e) => e.target.value && update({ end: e.target.value })} />
              </div>
              <div>
                <label className="otd-label">Supplier</label>
                <Autocomplete
                  multiple size="small" limitTags={2} options={supplierOptions}
                  value={selectedSuppliers}
                  getOptionLabel={(o) => o.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  onChange={(_, v) => update({ suppliers: v.map((s) => s.id) })}
                  renderOption={(props, o) => (
                    <li {...props} key={o.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                      <span>{o.name}</span><span style={{ color: C.muted, fontSize: 12 }}>{o.styles}</span>
                    </li>
                  )}
                  renderTags={(value, getTagProps) => value.map((o, i) => (
                    <Chip {...getTagProps({ index: i })} key={o.id} label={o.name} size="small" />
                  ))}
                  renderInput={(params) => <TextField {...params} placeholder={selectedSuppliers.length ? "" : "All suppliers"} />}
                  sx={{ "& .MuiOutlinedInput-root": { background: "#fff", borderRadius: "8px", minHeight: 40, fontSize: 13 } }}
                />
              </div>
              <div>
                <label className="otd-label">Customer</label>
                <Autocomplete
                  multiple size="small" limitTags={2} options={buyerOptions}
                  value={selectedBuyers}
                  getOptionLabel={(o) => o.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  onChange={(_, v) => update({ buyers: v.map((b) => b.id) })}
                  renderOption={(props, o) => (
                    <li {...props} key={o.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                      <span>{o.name}</span><span style={{ color: C.muted, fontSize: 12 }}>{o.styles}</span>
                    </li>
                  )}
                  renderTags={(value, getTagProps) => value.map((o, i) => (
                    <Chip {...getTagProps({ index: i })} key={o.id} label={o.name} size="small" />
                  ))}
                  renderInput={(params) => <TextField {...params} placeholder={selectedBuyers.length ? "" : "All customers"} />}
                  sx={{ "& .MuiOutlinedInput-root": { background: "#fff", borderRadius: "8px", minHeight: 40, fontSize: 13 } }}
                />
              </div>
              <div>
                <label className="otd-label">Status</label>
                <Autocomplete
                  multiple size="small" limitTags={2} options={statusValues}
                  value={filters.statuses}
                  onChange={(_, v) => update({ statuses: v })}
                  renderOption={(props, o) => (
                    <li {...props} key={o} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                      <span>{o}</span><span style={{ color: C.muted, fontSize: 12 }}>{statusCount[o] ?? 0}</span>
                    </li>
                  )}
                  renderTags={(value, getTagProps) => value.map((o, i) => (
                    <Chip {...getTagProps({ index: i })} key={o} label={o} size="small" />
                  ))}
                  renderInput={(params) => <TextField {...params} placeholder={filters.statuses.length ? "" : "All statuses"} />}
                  sx={{ "& .MuiOutlinedInput-root": { background: "#fff", borderRadius: "8px", minHeight: 40, fontSize: 13 } }}
                />
              </div>
              <div>
                <label className="otd-label">Target %</label>
                <input type="number" min={0} max={100} className="otd-input" style={{ width: "100%" }} value={target}
                  onChange={(e) => setTarget(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
              </div>
              <button className="otd-btn" style={{ height: 40 }} onClick={() => {
                clearSaved();
                setFilters(defaultFilters());
                setTarget(90);
                setTableTab("delayed");
                setResetKey((k) => k + 1);
              }}>
                <FiX size={14} /> Reset
              </button>
            </div>
          </div>

          {error && (
            <div className="no-print" style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 16px", borderRadius: 10, background: "#fdecec", color: "#8f1d1d", border: "1px solid #f5c2c2", marginBottom: 18, fontSize: 13 }}>
              <FiAlertCircle /> {error}
            </div>
          )}

          {!report && loading && (
            <div style={{ padding: 80, textAlign: "center", color: C.muted }}>Loading scorecard…</div>
          )}

          {report && (
            <div style={{ opacity: loading ? 0.55 : 1, transition: "opacity .2s ease" }}>
              {/* ── Masthead ── */}
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ margin: 0, fontFamily: FONT, letterSpacing: "-.02em", fontSize: 34, fontWeight: 700, color: C.ink, lineHeight: 1.15 }}>
                  {title} <span style={{ color: verdict.color }}>— {verdict.text}</span>
                </h2>
                <div style={{ marginTop: 6, fontSize: 16, color: C.ink2 }}>
                  {subtitleParts.join("  |  ")}
                  <span style={{ marginLeft: 12, fontSize: 12, color: C.muted }}>
                    Planned date: {BASIS_OPTIONS.find((o) => o.value === report.basis)?.label}
                    {report.basis === "shipment_date" && report.as_of && ` · late = shipment date before ${fmtDate(report.as_of)}`}
                  </span>
                </div>
              </div>

              {totals?.unscored_styles > 0 && (
                <div className="no-print" style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
                  padding: "10px 16px", borderRadius: 10, background: "#fff7e6", border: "1px solid #f5d9a3",
                  color: "#7a4d00", fontSize: 13, marginBottom: 18,
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <FiAlertTriangle />
                    {totals.unscored_styles} order{totals.unscored_styles === 1 ? "" : "s"} ({fmtCompact(totals.unscored_qty)} pcs) are missing {report.basis === "ex_factory" || report.basis === "shipment_planned" ? "an Ex-Factory" : "a planned"} date and can't be scored yet.
                  </span>
                  <button className="otd-btn" style={{ padding: "5px 12px" }} onClick={() => {
                    setTableTab("unscored");
                    document.getElementById("otd-tables")?.scrollIntoView({ behavior: "smooth" });
                  }}>Review list</button>
                </div>
              )}

              {!hasData ? (
                <Card>
                  <div style={{ padding: "50px 0", textAlign: "center", color: C.muted }}>
                    <FiInbox size={34} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginTop: 10 }}>No scored shipments for these filters</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      Try a wider period, clear the supplier/buyer filter, or switch the planned-date basis.
                    </div>
                  </div>
                </Card>
              ) : (
                <>
                  {/* ── Hero + monthly charts ── */}
                  <div className="otd-grid-hero" style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div className="otd-card" style={{
                        background: `linear-gradient(145deg, ${C.hero}, ${C.heroSoft})`, color: "#fff", borderRadius: 14,
                        padding: "28px 24px", textAlign: "center", boxShadow: "0 10px 26px rgba(13,43,62,.28)",
                      }}>
                        <div style={{ fontFamily: FONT, letterSpacing: "-.02em", fontSize: 76, fontWeight: 700, lineHeight: 1 }}>
                          {fmtPct(totals.on_time_percent)}
                        </div>
                        <div style={{ fontSize: 17, marginTop: 10, opacity: 0.9 }}>on-time / early</div>
                        <div style={{ fontSize: 16, marginTop: 2, opacity: 0.9 }}>
                          {totals.on_time} of {totals.scored_styles} orders
                        </div>
                        <div style={{ marginTop: 14, height: 8, background: "rgba(255,255,255,.18)", borderRadius: 99, position: "relative", overflow: "visible" }}>
                          <div style={{ width: `${totals.on_time_percent}%`, height: "100%", borderRadius: 99, background: totals.on_time_percent >= target ? "#4cd67a" : "#8cc8ff" }} />
                          <div title={`Target ${target}%`} style={{ position: "absolute", left: `${target}%`, top: -4, width: 2, height: 16, background: "#fff" }} />
                        </div>
                        <div style={{ fontSize: 12, marginTop: 7, opacity: 0.8 }}>
                          {totals.on_time_percent >= target
                            ? <><FiCheckCircle style={{ verticalAlign: -2 }} /> On target ({target}%)</>
                            : <>{fmtPct(target - totals.on_time_percent, 1)} below the {target}% target</>}
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <StatTile value={fmtCompact(totals.qty)} label="pieces shipped"
                          sub={totals.unscored_qty ? `+${fmtCompact(totals.unscored_qty)} with missing dates` : null} />
                        <StatTile value={`$${fmtCompact(totals.value)}`} label="shipment value"
                          sub={totals.unscored_value ? `+$${fmtCompact(totals.unscored_value)} with missing dates` : null} />
                      </div>
                    </div>

                    <Card title="On-time / early % by month" subtitle={`Dashed line = ${target}% target · click a bar for its orders`}>
                      <div style={{ height: 190 }}>
                        <ResponsiveContainer>
                          <BarChart data={monthly} margin={{ top: 22, right: 8, left: -18, bottom: 0 }} barCategoryGap="18%">
                            <CartesianGrid vertical={false} stroke={C.grid} />
                            <XAxis dataKey="short" {...axisProps} />
                            <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} {...axisProps} axisLine={false} />
                            <Tooltip cursor={{ fill: "rgba(42,120,214,.06)" }} content={monthTooltip((m) => [
                              ["On-time %", fmtPct(m.on_time_percent, 1)],
                              ["Early", m.early, C.early], ["In time", m.in_time, C.inTime], ["Delayed", m.delayed, C.delayed],
                              ["Scored orders", m.scored_styles],
                            ])} />
                            <ReferenceLine y={target} stroke={C.ink2} strokeDasharray="4 4" />
                            <Bar dataKey="on_time_percent" radius={[4, 4, 0, 0]} maxBarSize={64} minPointSize={3}
                              onClick={() => { setTableTab("delayed"); document.getElementById("otd-tables")?.scrollIntoView({ behavior: "smooth" }); }}>
                              {monthly.map((m) => (
                                <Cell key={m.month} fill={m.on_time_percent >= target ? C.early : C.primary} />
                              ))}
                              <LabelList dataKey="on_time_percent" position="top" formatter={(v) => (v === null || v === undefined ? "" : fmtPct(v))}
                                style={{ fontSize: 12, fill: C.ink, fontWeight: 600 }} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <Legend items={[[`At or above ${target}%`, C.early], [`Below ${target}%`, C.primary]]} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, margin: "18px 0 0", flexWrap: "wrap" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Shipment quantity by month (pieces)</div>
                        <Legend items={[["Scored", "#5a9fcf"], ["Missing dates", C.missing]]} />
                      </div>
                      <div style={{ height: 212 }}>
                        <ResponsiveContainer>
                          <BarChart data={monthly} margin={{ top: 22, right: 8, left: -18, bottom: 0 }} barCategoryGap="14%" barGap={2}>
                            <CartesianGrid vertical={false} stroke={C.grid} />
                            <XAxis dataKey="short" {...axisProps} interval={0} />
                            <YAxis tickFormatter={fmtAxis} {...axisProps} axisLine={false} />
                            <Tooltip cursor={{ fill: "rgba(42,120,214,.06)" }} content={monthTooltip((m) => [
                              ["Scored pieces", fmtInt(m.qty), "#5a9fcf"], ["Missing dates", fmtInt(m.unscored_qty), C.missing],
                              ["Total pieces", fmtInt(m.total_qty)], ["Orders", m.total_styles],
                            ])} />
                            {/* Side by side (not stacked): scored and missing-dates quantity per month */}
                            <Bar dataKey="qty" fill="#5a9fcf" radius={[4, 4, 0, 0]} maxBarSize={30}>
                              <LabelList dataKey="qty" position="top" formatter={(v) => (v ? fmtAxis(v) : "")}
                                style={{ fontSize: 10.5, fill: C.ink, fontWeight: 600 }} />
                            </Bar>
                            <Bar dataKey="unscored_qty" fill={C.missing} radius={[4, 4, 0, 0]} maxBarSize={30}>
                              <LabelList dataKey="unscored_qty" position="top" formatter={(v) => (v ? fmtAxis(v) : "")}
                                style={{ fontSize: 10.5, fill: C.ink, fontWeight: 600 }} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </div>

                  {/* ── Secondary KPIs ── */}
                  <div className="otd-grid-4" style={{ marginBottom: 18 }}>
                    <StatTile value={fmtInt(totals.orders)} label="POs" sub={`${totals.scored_styles} orders`} />
                    <StatTile value={totals.qty ? `$${(totals.value / totals.qty).toFixed(2)}` : "—"} label="avg value per piece" />
                    <StatTile value={`${totals.early} / ${totals.in_time}`} label="early / in time" icon={<FiCheckCircle color={C.good} />}
                      sub={`${fmtPct((totals.early / totals.scored_styles) * 100)} early · ${fmtPct((totals.in_time / totals.scored_styles) * 100)} in time`} />
                    <StatTile value={totals.delayed} label="delayed orders" icon={<FiClock color={C.bad} />}
                      sub={totals.delayed ? `avg ${fmtDuration(totals.avg_delay_days)} late · ${fmtPct((totals.delayed / totals.scored_styles) * 100)} of orders` : "none late"} />
                  </div>

                  {/* ── Insights ── */}
                  <div className="otd-card" style={{ background: C.note, border: "1px solid #cfdfe7", borderRadius: 14, padding: "16px 22px", marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: C.ink, fontSize: 14, marginBottom: 6 }}>
                      <FiTrendingUp /> Key takeaways
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 22, color: C.ink, fontSize: 14.5, lineHeight: 1.75 }}>
                      {insights.map((t) => <li key={t}>{t}</li>)}
                      {nextFocus && <li><strong style={{ color: "#1c6f86" }}>Next focus:</strong> {nextFocus}</li>}
                    </ul>
                  </div>

                  {/* ── Delivery split + delay breakdown ── */}
                  <div className="otd-grid-2" style={{ marginBottom: 18 }}>
                    <Card title="Delivery split" subtitle="Early + in time = on time">
                      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                        <div style={{ width: 200, height: 200, position: "relative" }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie data={splitData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92}
                                stroke="#fff" strokeWidth={2} startAngle={90} endAngle={-270} isAnimationActive>
                                {splitData.map((d) => <Cell key={d.name} fill={d.color} />)}
                              </Pie>
                              <Tooltip content={({ active, payload }) => (active && payload?.length ? (
                                <TooltipBox title={payload[0].name} rows={[
                                  ["Orders", payload[0].value, payload[0].payload.color],
                                  ["Share", fmtPct((payload[0].value / totals.scored_styles) * 100, 1)],
                                ]} />
                              ) : null)} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>{fmtPct(totals.on_time_percent)}</div>
                            <div style={{ fontSize: 11.5, color: C.muted }}>on time</div>
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 12 }}>
                          {splitData.map((d) => {
                            const pct = (d.value / totals.scored_styles) * 100;
                            return (
                              <div key={d.name}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: C.ink }}>
                                    <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />{d.name}
                                  </span>
                                  <span style={{ color: C.ink, fontWeight: 700 }}>{d.value} <span style={{ color: C.muted, fontWeight: 500 }}>· {fmtPct(pct, 1)}</span></span>
                                </div>
                                <div style={{ height: 6, background: C.grid, borderRadius: 99 }}>
                                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: d.color }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>

                    <Card title="Delay breakdown" subtitle={totals.delayed ? `${totals.delayed} late orders · avg ${fmtDuration(totals.avg_delay_days)} late` : "No late orders in this period"}>
                      {totals.delayed ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 6 }}>
                          {buckets.map((b, i) => (
                            <div key={b.key}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{b.label} late</span>
                                <span style={{ fontSize: 13, color: C.ink2 }}>
                                  <strong style={{ fontSize: 18, color: C.ink }}>{fmtPct(b.percent_of_delayed, 1)}</strong> of delays
                                  <span style={{ color: C.muted }}> · {b.count} orders · {fmtPct(b.percent_of_scored, 1)} of all</span>
                                </span>
                              </div>
                              <div style={{ height: 12, background: C.grid, borderRadius: 99 }}>
                                <div style={{ width: `${b.percent_of_delayed || 0}%`, height: "100%", borderRadius: 99, background: BUCKET_COLORS[i], transition: "width .4s ease" }} />
                              </div>
                            </div>
                          ))}
                          <div style={{ fontSize: 12, color: C.muted }}>Delay = actual date − planned date, for orders that went out after their planned date.</div>
                        </div>
                      ) : (
                        <EmptyChart text="Every scored order shipped on time or early 🎉" />
                      )}
                    </Card>
                  </div>

                  {/* ── Orders & POs by month ── */}
                  <div className="otd-grid-2" style={{ marginBottom: 18 }}>
                    <Card title="Orders by month" subtitle="Split by delivery outcome; grey = missing dates"
                      right={<Legend items={[["Early", C.early], ["In time", C.inTime], ["Delayed", C.delayed], ["Missing dates", C.missing]]} />}>
                      <div style={{ height: 250 }}>
                        <ResponsiveContainer>
                          <BarChart data={monthly} margin={{ top: 16, right: 8, left: -18, bottom: 0 }} barCategoryGap="22%">
                            <CartesianGrid vertical={false} stroke={C.grid} />
                            <XAxis dataKey="short" {...axisProps} />
                            <YAxis allowDecimals={false} {...axisProps} axisLine={false} />
                            <Tooltip cursor={{ fill: "rgba(42,120,214,.06)" }} content={monthTooltip((m) => [
                              ["Early", m.early, C.early], ["In time", m.in_time, C.inTime], ["Delayed", m.delayed, C.delayed],
                              ["Missing dates", m.unscored_styles, C.missing],
                              ["Total orders", m.total_styles], ["On-time %", fmtPct(m.on_time_percent, 1)],
                            ])} />
                            <Bar dataKey="early" stackId="s" fill={C.early} stroke="#fff" strokeWidth={1} maxBarSize={48}>
                              <LabelList dataKey="early" content={segmentLabel("#fff")} />
                            </Bar>
                            <Bar dataKey="in_time" stackId="s" fill={C.inTime} stroke="#fff" strokeWidth={1} maxBarSize={48}>
                              <LabelList dataKey="in_time" content={segmentLabel("#fff")} />
                            </Bar>
                            <Bar dataKey="delayed" stackId="s" fill={C.delayed} stroke="#fff" strokeWidth={1} maxBarSize={48}>
                              <LabelList dataKey="delayed" content={segmentLabel("#fff")} />
                            </Bar>
                            <Bar dataKey="unscored_styles" stackId="s" fill={C.missing} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={48}>
                              <LabelList dataKey="unscored_styles" content={segmentLabel(C.ink)} />
                              <LabelList dataKey="total_styles" position="top" formatter={(v) => (v ? v : "")} style={{ fontSize: 12, fill: C.ink, fontWeight: 600 }} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card title="POs by month" subtitle="Distinct PO numbers; grey = missing dates"
                      right={<Legend items={[["Scored", C.primary], ["Missing dates", C.missing]]} />}>
                      <div style={{ height: 284 }}>
                        <ResponsiveContainer>
                          <BarChart data={monthly} margin={{ top: 22, right: 8, left: -18, bottom: 0 }} barCategoryGap="22%">
                            <CartesianGrid vertical={false} stroke={C.grid} />
                            <XAxis dataKey="short" {...axisProps} height={48} interval={0} tick={<SplitTick data={monthly} rows={[["orders", C.primary, (v) => fmtInt(v)], ["unscored_orders", C.missing, (v) => fmtInt(v)]]} />} />
                            <YAxis allowDecimals={false} {...axisProps} axisLine={false} />
                            <Tooltip cursor={{ fill: "rgba(42,120,214,.06)" }} content={monthTooltip((m) => [
                              ["Scored POs", m.orders, C.primary], ["Missing dates", m.unscored_orders, C.missing],
                              ["Total POs", m.total_pos], ["Orders", m.total_styles],
                            ])} />
                            <Bar dataKey="orders" stackId="p" fill={C.primary} stroke="#fff" strokeWidth={1} maxBarSize={48} />
                            <Bar dataKey="unscored_orders" stackId="p" fill={C.missing} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={48}>
                              <LabelList dataKey="total_pos" position="top" formatter={(v) => (v ? v : "")} style={{ fontSize: 12, fill: C.ink, fontWeight: 600 }} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </div>

                  {/* ── Value + average delay by month ── */}
                  <div className="otd-grid-2" style={{ marginBottom: 18 }}>
                    <Card title="Shipment value by month" subtitle="US$; grey = missing dates"
                      right={<Legend items={[["Scored", "#256abf"], ["Missing dates", C.missing]]} />}>
                      <div style={{ height: 264 }}>
                        <ResponsiveContainer>
                          <BarChart data={monthly} margin={{ top: 22, right: 8, left: -10, bottom: 0 }} barCategoryGap="22%">
                            <CartesianGrid vertical={false} stroke={C.grid} />
                            <XAxis dataKey="short" {...axisProps} height={48} interval={0} tick={<SplitTick data={monthly} rows={[["value", "#256abf", (v) => `$${fmtAxis(v)}`], ["unscored_value", C.missing, (v) => `$${fmtAxis(v)}`]]} />} />
                            <YAxis tickFormatter={(v) => `$${fmtAxis(v)}`} {...axisProps} axisLine={false} />
                            <Tooltip cursor={{ fill: "rgba(42,120,214,.06)" }} content={monthTooltip((m) => [
                              ["Scored value", `$${fmtInt(m.value)}`, "#256abf"], ["Missing dates", `$${fmtInt(m.unscored_value)}`, C.missing],
                              ["Total value", `$${fmtInt(m.total_value)}`],
                              ["Value / piece", m.total_qty ? `$${(m.total_value / m.total_qty).toFixed(2)}` : "—"],
                            ])} />
                            <Bar dataKey="value" stackId="v" fill="#256abf" stroke="#fff" strokeWidth={1} maxBarSize={48} />
                            <Bar dataKey="unscored_value" stackId="v" fill={C.missing} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={48}>
                              <LabelList dataKey="total_value" position="top" formatter={(v) => (v ? `$${fmtCompact(v, 1)}` : "")} style={{ fontSize: 11.5, fill: C.ink, fontWeight: 600 }} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card title="Average delay by month" subtitle="Days late, for delayed orders only">
                      <div style={{ height: 230 }}>
                        {monthly.some((m) => m.avg_delay_days) ? (
                          <ResponsiveContainer>
                            <LineChart data={monthly} margin={{ top: 22, right: 16, left: 0, bottom: 0 }}>
                              <CartesianGrid vertical={false} stroke={C.grid} />
                              <XAxis dataKey="short" {...axisProps} />
                              <YAxis allowDecimals={false} tickFormatter={(v) => (v >= 60 ? `${Math.round(v / DAYS_PER_MONTH)} mo` : `${v} d`)} {...axisProps} axisLine={false} />
                              <Tooltip cursor={{ stroke: C.muted, strokeDasharray: "3 3" }} content={monthTooltip((m) => [
                                ["Avg delay", m.avg_delay_days ? `${fmtDuration(m.avg_delay_days)} (${m.avg_delay_days} days)` : "—"], ["Delayed orders", m.delayed, C.delayed],
                              ])} />
                              <Line type="linear" dataKey="avg_delay_days" stroke={C.delayed} strokeWidth={2} connectNulls
                                dot={{ r: 4, fill: C.delayed, stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }}>
                                <LabelList dataKey="avg_delay_days" position="top" formatter={(v) => (v ? fmtDuration(v) : "")} style={{ fontSize: 11.5, fill: C.ink }} />
                              </Line>
                            </LineChart>
                          </ResponsiveContainer>
                        ) : <EmptyChart text="No late orders in this period" />}
                      </div>
                    </Card>
                  </div>

                  {/* ── Supplier ranking + buyer breakdown ── */}
                  <div className="otd-grid-2" style={{ marginBottom: 18 }}>
                    <Card title="Supplier ranking" subtitle={supplierRanking.length > 1 ? "On-time % · click a supplier to focus on it" : "Select fewer filters to compare suppliers"}>
                      {supplierRanking.length ? (
                        <div style={{ maxHeight: 380, overflowY: "auto", paddingRight: 4 }}>
                          {supplierRanking.map((s) => {
                            const active = filters.suppliers.includes(s.id);
                            return (
                              <div key={s.id} className="otd-row"
                                onClick={() => update({ suppliers: active ? [] : [s.id] })}
                                title={active ? "Click to show all suppliers" : "Click to focus on this supplier"}
                                style={{ display: "grid", gridTemplateColumns: "minmax(120px, 1.1fr) 2fr 52px", gap: 10, alignItems: "center", padding: "7px 6px", borderRadius: 8, cursor: "pointer", background: active ? "#eef5fd" : undefined }}>
                                <div style={{ fontSize: 12.5, color: C.ink, fontWeight: active ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                                <div style={{ position: "relative", height: 16, background: C.grid, borderRadius: 4 }}>
                                  <div style={{ width: `${s.on_time_percent}%`, height: "100%", borderRadius: 4, background: s.on_time_percent >= target ? C.early : C.primary }} />
                                  <div style={{ position: "absolute", left: `${target}%`, top: -2, bottom: -2, width: 1.5, background: C.ink2, opacity: 0.6 }} />
                                </div>
                                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, textAlign: "right" }}>
                                  {fmtPct(s.on_time_percent)}
                                  <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 500 }}>{s.on_time}/{s.scored_styles}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : <EmptyChart />}
                    </Card>

                    <Card title="By buyer" subtitle="Scored orders per buyer">
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                          <thead>
                            <tr>
                              {["Buyer", "Orders", "Early", "In time", "Delayed", "On-time %", "Pieces", "Value"].map((h, i) => (
                                <th key={h} style={{ textAlign: i ? "right" : "left", padding: "8px 8px", color: C.ink2, fontSize: 11, textTransform: "uppercase", letterSpacing: ".03em", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {report.by_buyer.filter((b) => b.scored_styles > 0).map((b) => (
                              <tr key={b.id ?? "none"} className="otd-row">
                                <td style={{ padding: "8px", color: C.ink, fontWeight: 600 }}>{b.name}</td>
                                <td style={{ padding: "8px", textAlign: "right" }}>{b.scored_styles}</td>
                                <td style={{ padding: "8px", textAlign: "right" }}>{b.early}</td>
                                <td style={{ padding: "8px", textAlign: "right" }}>{b.in_time}</td>
                                <td style={{ padding: "8px", textAlign: "right" }}>{b.delayed}</td>
                                <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>{fmtPct(b.on_time_percent, 1)}</td>
                                <td style={{ padding: "8px", textAlign: "right" }}>{fmtCompact(b.qty)}</td>
                                <td style={{ padding: "8px", textAlign: "right" }}>${fmtCompact(b.value)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                </>
              )}

              {/* ── Order lists ── */}
              <div id="otd-tables">
                <Card
                  title={
                    <div style={{ display: "flex", gap: 4, marginLeft: -14 }}>
                      <button className={`otd-tab${tableTab === "delayed" ? " active" : ""}`} onClick={() => setTableTab("delayed")}>
                        Delayed orders ({(report.delayed_orders || []).length})
                      </button>
                      <button className={`otd-tab${tableTab === "unscored" ? " active" : ""}`} onClick={() => setTableTab("unscored")}>
                        Missing dates ({totals?.unscored_styles ?? 0})
                      </button>
                    </div>
                  }
                  subtitle={tableTab === "delayed"
                    ? "Sorted by longest delay — fix the biggest slips first"
                    : "Orders without the dates the chosen planned-date basis needs. Click ✎ next to a date to fill it in; the order then counts in the score."}
                >
                  {notice && (
                    <div className="no-print" role="status" style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 12,
                      borderRadius: 8, background: "#e6f6ee", border: "1px solid #9fd8bd", color: "#0b5e3a", fontSize: 13,
                    }}>
                      <FiCheckCircle /> {notice}
                    </div>
                  )}
                  {tableTab === "delayed" ? (
                    <SortableTable key={`delayed-${resetKey}`} storageKey="delayed" columns={orderColumns} rows={report.delayed_orders || []}
                      initialSort={{ key: "delay_days", dir: "desc" }}
                      emptyText={totals?.scored_styles ? "No delayed orders 🎉" : "No scored orders for these filters yet."} />
                  ) : (
                    <SortableTable key={`unscored-${resetKey}`} storageKey="unscored" columns={unscoredColumns} rows={report.unscored_orders || []}
                      initialSort={{ key: "shipment_date", dir: "desc" }} emptyText="Every order has the dates it needs." />
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnTimeDeliveryScorecard;
