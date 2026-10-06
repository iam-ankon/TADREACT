// src/components/merchandiser/TNADashboard.jsx
//
// Time & Action list. Server-side search / filters / sorting / paging;
// KPI cards double as status filters. Fixes over the old page: multi-status
// filter now applied (API ignored "a|b"), every column sorts (most were
// silently ignored), year filter lists every year (was only years on the
// current page), Export CSV exports all filtered rows (was the current page
// only), no window.confirm/alert, Order NO = Order.style like the rest of
// the app, supplier names without "(None)".

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiAlertTriangle, FiBell, FiCalendar, FiCheckCircle, FiChevronDown, FiChevronLeft, FiChevronRight,
  FiClock, FiColumns, FiDownload, FiEdit2, FiEye, FiInbox, FiPlus, FiSearch, FiTrash2, FiX, FiArrowUp, FiArrowDown,
} from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import { getSuppliers } from "../../api/merchandiser";
import {
  ConfirmDialog, ProgressBar, TNA_CSS, apiError, daysFromToday, fmtDate, relDays, shipStatus, tnaApi,
} from "./tnaShared";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_OPTIONS = [
  { value: "overdue", label: "Past ship date" },
  { value: "at_risk", label: "Ships ≤ 15 days" },
  { value: "on_track", label: "On track" },
  { value: "delayed", label: "Approvals delayed" },
];
const FABRIC_OPTIONS = [
  { value: "imported", label: "Imported" },
  { value: "local", label: "Local" },
];

// key, label, sort field (API ordering), default visible
const COLUMNS = [
  { key: "order", label: "Order NO", sort: "order__style", fixed: true },
  { key: "supplier", label: "Supplier", sort: "supplier" },
  { key: "item", label: "Item", sort: "item" },
  { key: "fabric_type", label: "Fabric", sort: "fabric_type" },
  { key: "shipment_date", label: "Shipment", sort: "shipment_date" },
  { key: "days_left", label: "Days left", sort: "execution_time" },
  { key: "progress", label: "Progress" },
  { key: "next", label: "Next milestone" },
  { key: "fabric_etd", label: "Fabric ETD", sort: "fabric_etd", hidden: true },
  { key: "fabric_eta", label: "Fabric ETA", sort: "fabric_eta", hidden: true },
  { key: "fabric_booking", label: "Fabric booking", sort: "fabric_booking_date", hidden: true },
  { key: "production_start", label: "Production start", sort: "production_start_date", hidden: true },
];
const DEFAULT_VISIBLE = COLUMNS.filter((c) => !c.hidden).map((c) => c.key);

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(`tnaList.${key}`);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`tnaList.${key}`, JSON.stringify(value));
    } catch {
      /* storage blocked - preferences just won't persist */
    }
  },
};

const MultiSelect = ({ label, options, selected, onChange, searchable }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const shown = searchable && q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;
  const text =
    selected.length === 0
      ? label
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label || selected[0]
        : `${label} · ${selected.length}`;
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <div className="tna-ms" ref={ref}>
      <button type="button" className={`tna-ms-btn ${selected.length ? "on" : ""}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{text}</span>
        <FiChevronDown />
      </button>
      {open && (
        <div className="tna-ms-menu">
          {searchable && <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" autoFocus />}
          {selected.length > 0 && (
            <button type="button" className="clr" onClick={() => onChange([])}>
              Clear selection
            </button>
          )}
          {shown.length === 0 && <div className="empty">No options</div>}
          {shown.map((o) => (
            <label key={o.value}>
              <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
              {o.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default function TNADashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState(() => store.get("search", ""));
  const [statuses, setStatuses] = useState(() => store.get("statuses", []));
  const [fabrics, setFabrics] = useState(() => store.get("fabrics", []));
  const [suppliers, setSuppliers] = useState(() => store.get("suppliers", []));
  const [years, setYears] = useState(() => store.get("years", []));
  const [months, setMonths] = useState(() => store.get("months", []));
  const [sort, setSort] = useState(() => store.get("sort", { field: "shipment_date", dir: "asc" }));
  const [pageSize, setPageSize] = useState(() => store.get("pageSize", 50));
  const [visible, setVisible] = useState(() => store.get("columns", DEFAULT_VISIBLE));

  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [reminderCount, setReminderCount] = useState(null);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(location.state?.flash || null);
  const [showCols, setShowCols] = useState(false);
  const colsRef = useRef(null);
  const requestId = useRef(0);

  // Persist preferences.
  useEffect(() => {
    store.set("search", search);
    store.set("statuses", statuses);
    store.set("fabrics", fabrics);
    store.set("suppliers", suppliers);
    store.set("years", years);
    store.set("months", months);
    store.set("sort", sort);
    store.set("pageSize", pageSize);
    store.set("columns", visible);
  }, [search, statuses, fabrics, suppliers, years, months, sort, pageSize, visible]);

  useEffect(() => {
    if (location.state?.flash) {
      navigate(location.pathname, { replace: true, state: null });
      const t = setTimeout(() => setFlash(null), 6000);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const close = (e) => colsRef.current && !colsRef.current.contains(e.target) && setShowCols(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const params = useMemo(() => {
    const p = { ordering: sort.dir === "desc" ? `-${sort.field}` : sort.field };
    if (search.trim()) p.search = search.trim();
    if (statuses.length) p.status = statuses.join("|");
    if (fabrics.length) p.fabric_type = fabrics.join("|");
    if (suppliers.length) p.supplier = suppliers.join("|");
    if (years.length) p.shipment_year = years.join("|");
    if (months.length) p.shipment_month = months.map((m) => MONTHS.indexOf(m) + 1).join("|");
    return p;
  }, [search, statuses, fabrics, suppliers, years, months, sort]);

  const load = useCallback(
    async (pageNo) => {
      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        const res = await tnaApi.get("tna/", { params: { ...params, page: pageNo, page_size: pageSize } });
        if (id !== requestId.current) return;
        // Fallbacks keep the list readable against an older API that
        // doesn't send order_no / supplier_name yet.
        setRows((res.data.results || []).map((t) => ({
          ...t,
          order_no: t.order_no || t.order_number,
          supplier_name: t.supplier_name || (t.supplier || "").replace(" (None)", ""),
        })));
        setCount(res.data.count || 0);
        setPage(pageNo);
        setSelected([]);
      } catch (err) {
        if (id === requestId.current) setError(apiError(err, "Couldn't load TNA records."));
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [params, pageSize],
  );

  const loadStats = useCallback(async () => {
    try {
      const res = await tnaApi.get("tna/stats/");
      setStats(res.data);
    } catch {
      /* KPI cards just stay empty */
    }
  }, []);

  // Debounced reload on any filter / sort / page size change.
  useEffect(() => {
    const t = setTimeout(() => load(1), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    loadStats();
    tnaApi.get("tna/reminders/count/").then((r) => setReminderCount(r.data.total)).catch(() => {});
    getSuppliers(1, 500, false)
      .then((r) => {
        const list = (Array.isArray(r?.data) ? r.data : r?.data?.results || [])
          .map((s) => s.supplier_name || s.name)
          .filter(Boolean);
        setSupplierOptions([...new Set(list)].sort().map((n) => ({ value: n, label: n })));
      })
      .catch(() => {});
  }, [loadStats]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageNumbers = (() => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    const out = [];
    for (let p = start; p <= Math.min(totalPages, start + 4); p++) out.push(p);
    return out;
  })();

  const filtersOn = search || statuses.length || fabrics.length || suppliers.length || years.length || months.length;
  const clearAll = () => {
    setSearch("");
    setStatuses([]);
    setFabrics([]);
    setSuppliers([]);
    setYears([]);
    setMonths([]);
  };

  const toggleSort = (field) =>
    setSort((s) => (s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" }));

  const cols = COLUMNS.filter((c) => c.fixed || visible.includes(c.key));

  const csvRow = (t) => [
    t.order_no, t.po_no, t.customer_name, t.supplier_name, t.item, t.fabric_type,
    t.order_booking_date, t.shipment_date, t.execution_time, `${t.progress_percentage}%`,
    t.next_milestone ? `${t.next_milestone.label} ${t.next_milestone.date}` : "",
    (t.overdue_approvals || []).map((a) => a.label).join("; "),
    t.fabric_booking_date, t.lab_dip_date, t.fit_sample_date, t.pps_date, t.fabric_etd, t.fabric_eta,
    t.fabric_inhouse_date, t.production_start_date, t.remarks,
  ];
  const CSV_HEAD = ["Order NO", "PO No", "Customer", "Supplier", "Item", "Fabric type", "Order booking", "Shipment",
    "Days left", "Progress", "Next milestone", "Delayed approvals", "Fabric booking", "Lab dip", "Fit sample",
    "PP sample", "Fabric ETD", "Fabric ETA", "Fabric in-house", "Production start", "Remarks"];

  const exportCsv = async () => {
    setExporting(true);
    setError(null);
    try {
      let data;
      if (selected.length) {
        data = rows.filter((r) => selected.includes(r.id));
      } else {
        data = [];
        for (let p = 1; p <= 50; p++) {
          const res = await tnaApi.get("tna/", { params: { ...params, page: p, page_size: 500 } });
          data = data.concat(res.data.results || []);
          if (!res.data.next) break;
        }
      }
      const csv = [CSV_HEAD, ...data.map(csvRow)].map((r) => r.map(csvCell).join(",")).join("\n");
      const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `TNA_${new Date().toISOString().slice(0, 10)}_${data.length}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(apiError(err, "Export failed."));
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await tnaApi.delete(`tna/${deleting.id}/`);
      setFlash(`TNA for ${deleting.order_no} deleted.`);
      setDeleting(null);
      load(page);
      loadStats();
    } catch (err) {
      setError(apiError(err, "Couldn't delete the TNA."));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const yearOptions = (stats?.years || []).map((y) => ({ value: String(y), label: String(y) }));
  const kpis = [
    { key: "", label: "Open TNAs", value: stats?.total_tna, foot: stats ? `${stats.imported} imported · ${stats.local} local fabric` : "", icon: <FiCalendar />, tint: ["#eef4ff", "#2563eb"] },
    { key: "delayed", label: "Approvals delayed", value: stats?.delayed, foot: "Lab dip / fabric / fit / PP past due", icon: <FiAlertTriangle />, tint: ["#fef2f2", "#b91c1c"] },
    { key: "overdue", label: "Past ship date", value: stats?.overdue, foot: "Not marked shipped yet", icon: <FiClock />, tint: ["#fff7ed", "#c2410c"] },
    { key: "at_risk", label: "Ships ≤ 15 days", value: stats?.at_risk, foot: "Shipping soon", icon: <FiClock />, tint: ["#fefce8", "#a16207"] },
    { key: "on_track", label: "On track", value: stats?.on_track, foot: "More than 15 days to ship", icon: <FiCheckCircle />, tint: ["#f0fdf4", "#15803d"] },
  ];
  const kpiActive = (key) => (key === "" ? statuses.length === 0 : statuses.length === 1 && statuses[0] === key);

  const renderCell = (t, key) => {
    switch (key) {
      case "order":
        return (
          <div>
            <div className="tna-order">{t.order_no || `TNA-${t.id}`}</div>
            <div className="tna-sub">{[t.customer_name, t.po_no && t.po_no !== t.order_no ? `PO ${t.po_no}` : null].filter(Boolean).join(" · ")}</div>
          </div>
        );
      case "supplier":
        return <div className="tna-ellipsis" title={t.supplier_name || ""}>{t.supplier_name || <span className="tna-faint">—</span>}</div>;
      case "item":
        return <div className="tna-ellipsis" title={t.item || ""}>{t.item || <span className="tna-faint">—</span>}</div>;
      case "fabric_type":
        return t.fabric_type ? (
          <span className={`tna-chip ${t.fabric_type === "imported" ? "violet" : "grey"}`}>{t.fabric_type === "imported" ? "Imported" : "Local"}</span>
        ) : (
          <span className="tna-faint">—</span>
        );
      case "shipment_date": {
        const st = shipStatus(t.shipment_date);
        return (
          <div>
            <div style={{ fontWeight: 600, color: "#0f172a" }}>{fmtDate(t.shipment_date)}</div>
            <span className={`tna-chip ${st.cls}`} style={{ marginTop: 4 }}>{st.label}</span>
          </div>
        );
      }
      case "days_left": {
        const d = daysFromToday(t.shipment_date);
        if (d === null) return <span className="tna-faint">—</span>;
        return <span style={{ fontWeight: 650, color: d < 0 ? "#b91c1c" : d <= 15 ? "#a16207" : "#0f172a" }}>{d < 0 ? `${-d} late` : d}</span>;
      }
      case "progress":
        return <ProgressBar tna={t} />;
      case "next":
        return (
          <div className="tna-next">
            {t.next_milestone ? (
              <>
                <b>{t.next_milestone.label}</b>
                <span>{fmtDate(t.next_milestone.date)} · {relDays(t.next_milestone.days)}</span>
              </>
            ) : (
              <span className="tna-faint">—</span>
            )}
            {t.overdue_approvals?.length > 0 && (
              <span className="tna-warn" title={t.overdue_approvals.map((a) => `${a.label} due ${a.date}`).join("\n")}>
                <FiAlertTriangle /> {t.overdue_approvals.length} approval{t.overdue_approvals.length > 1 ? "s" : ""} late
              </span>
            )}
          </div>
        );
      case "fabric_etd":
        return fmtDate(t.fabric_etd);
      case "fabric_eta":
        return fmtDate(t.fabric_eta);
      case "fabric_booking":
        return fmtDate(t.fabric_booking_date);
      case "production_start":
        return fmtDate(t.production_start_date);
      default:
        return null;
    }
  };

  return (
    <div className="tna-shell">
      <style>{TNA_CSS}</style>
      <Sidebar />
      <div className="tna-app">
        <header className="tna-header">
          <div>
            <div className="tna-eyebrow">Merchandising · Operations</div>
            <h1 className="tna-title">
              Time & Action {stats && <span className="tna-pill-count">{stats.total_tna.toLocaleString("en-US")}</span>}
            </h1>
            <p className="tna-subtitle">Production calendar for every open order — fabric, samples, production and shipment.</p>
          </div>
          <div className="tna-actions">
            <button type="button" className="tna-btn ghost" onClick={() => navigate("/tna-reminders")}>
              <FiBell /> Reminders {reminderCount > 0 && <span className="count">{reminderCount > 999 ? "999+" : reminderCount}</span>}
            </button>
            <button type="button" className="tna-btn ghost" onClick={exportCsv} disabled={exporting || count === 0}>
              <FiDownload /> {exporting ? "Exporting…" : selected.length ? `Export ${selected.length} selected` : "Export CSV"}
            </button>
            <button type="button" className="tna-btn primary" onClick={() => navigate("/create-tna")}>
              <FiPlus /> New TNA
            </button>
          </div>
        </header>

        <div className="tna-body">
          {flash && (
            <div className="tna-alert ok" role="status">
              <FiCheckCircle />
              <span>{flash}</span>
              <button type="button" className="x" onClick={() => setFlash(null)} aria-label="Dismiss"><FiX /></button>
            </div>
          )}
          {error && (
            <div className="tna-alert err">
              <FiAlertTriangle />
              <span>{error}</span>
              <button type="button" className="x" onClick={() => setError(null)} aria-label="Dismiss"><FiX /></button>
            </div>
          )}

          <div className="tna-kpis">
            {kpis.map((k) => (
              <button
                key={k.key || "all"}
                type="button"
                className={`tna-card tna-kpi ${kpiActive(k.key) ? "active" : ""}`}
                onClick={() => setStatuses(k.key ? [k.key] : [])}
                title={k.key ? `Show only: ${k.label}` : "Show all"}
              >
                <span className="tna-kpi-top">
                  <span className="tna-kpi-label">{k.label}</span>
                  <span className="tna-kpi-icon" style={{ background: k.tint[0], color: k.tint[1] }}>{k.icon}</span>
                </span>
                <span className="tna-kpi-value">{k.value === undefined ? <span className="tna-skel" style={{ width: 60, height: 26 }} /> : k.value.toLocaleString("en-US")}</span>
                <span className="tna-kpi-foot">{k.foot}</span>
              </button>
            ))}
          </div>

          <section className="tna-card">
            <div className="tna-filters">
              <div className="tna-search">
                <FiSearch />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order no, PO, supplier, item, customer…"
                  aria-label="Search TNA"
                />
                {search && (
                  <button type="button" className="clear" onClick={() => setSearch("")} aria-label="Clear search"><FiX /></button>
                )}
              </div>
              <MultiSelect label="Status" options={STATUS_OPTIONS} selected={statuses} onChange={setStatuses} />
              <MultiSelect label="Fabric" options={FABRIC_OPTIONS} selected={fabrics} onChange={setFabrics} />
              <MultiSelect label="Supplier" options={supplierOptions} selected={suppliers} onChange={setSuppliers} searchable />
              <MultiSelect label="Ship year" options={yearOptions} selected={years} onChange={setYears} />
              <MultiSelect label="Ship month" options={MONTHS.map((m) => ({ value: m, label: m }))} selected={months} onChange={setMonths} />
              {filtersOn ? (
                <button type="button" className="tna-link" onClick={clearAll}>Clear all</button>
              ) : null}
              <div style={{ flex: 1 }} />
              <div className="tna-ms" ref={colsRef}>
                <button type="button" className="tna-ms-btn" onClick={() => setShowCols((s) => !s)}>
                  <FiColumns /> <span>Columns</span>
                </button>
                {showCols && (
                  <div className="tna-ms-menu" style={{ left: "auto", right: 0 }}>
                    <button type="button" className="clr" onClick={() => setVisible(DEFAULT_VISIBLE)}>Reset to default</button>
                    {COLUMNS.filter((c) => !c.fixed).map((c) => (
                      <label key={c.key}>
                        <input
                          type="checkbox"
                          checked={visible.includes(c.key)}
                          onChange={() => setVisible((v) => (v.includes(c.key) ? v.filter((x) => x !== c.key) : [...v, c.key]))}
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="tna-card" style={{ overflow: "hidden" }}>
            <div className="tna-card-head">
              <div>
                <h2 className="tna-card-title">
                  TNA records <span className="tna-pill-count">{count.toLocaleString("en-US")}</span>
                </h2>
                <p className="tna-card-sub">Shipped orders are not listed. Click a row to open its plan.</p>
              </div>
            </div>
            <div className="tna-table-wrap">
              <table className="tna-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        aria-label="Select all on this page"
                        checked={rows.length > 0 && selected.length === rows.length}
                        onChange={() => setSelected(selected.length === rows.length ? [] : rows.map((r) => r.id))}
                      />
                    </th>
                    {cols.map((c) => (
                      <th
                        key={c.key}
                        className={`${c.sort ? "sortable" : ""} ${sort.field === c.sort ? "sorted" : ""}`}
                        onClick={c.sort ? () => toggleSort(c.sort) : undefined}
                      >
                        <span className="th">
                          {c.label}
                          {sort.field === c.sort && (sort.dir === "asc" ? <FiArrowUp /> : <FiArrowDown />)}
                        </span>
                      </th>
                    ))}
                    <th style={{ width: 110 }} />
                  </tr>
                </thead>
                <tbody className={loading ? "is-loading" : ""}>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={cols.length + 2}>
                        <div className="tna-empty">
                          <FiInbox />
                          <b>{loading ? "Loading…" : "No TNA records match"}</b>
                          {!loading && filtersOn ? <button type="button" className="tna-link" onClick={clearAll}>Clear filters</button> : null}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rows.map((t) => (
                      <tr key={t.id} className={selected.includes(t.id) ? "selected" : ""} onClick={() => navigate(`/tna-details/${t.id}`)}>
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${t.order_no}`}
                            checked={selected.includes(t.id)}
                            onChange={() => setSelected((s) => (s.includes(t.id) ? s.filter((x) => x !== t.id) : [...s, t.id]))}
                          />
                        </td>
                        {cols.map((c) => (
                          <td key={c.key}>{renderCell(t, c.key)}</td>
                        ))}
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button type="button" className="tna-icon-btn" title="Open plan" onClick={() => navigate(`/tna-details/${t.id}`)}><FiEye /></button>
                            <button type="button" className="tna-icon-btn" title="Edit" onClick={() => navigate(`/edit-tna/${t.id}`)}><FiEdit2 /></button>
                            <button type="button" className="tna-icon-btn danger" title="Delete" onClick={() => setDeleting(t)}><FiTrash2 /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="tna-pager">
              <span className="tna-note">
                {count === 0 ? "0" : `${((page - 1) * pageSize + 1).toLocaleString("en-US")}–${Math.min(page * pageSize, count).toLocaleString("en-US")}`} of {count.toLocaleString("en-US")}
              </span>
              <div className="tna-pages">
                <button type="button" className="tna-page" disabled={page <= 1} onClick={() => load(page - 1)} aria-label="Previous page"><FiChevronLeft /></button>
                {pageNumbers[0] > 1 && (
                  <>
                    <button type="button" className="tna-page" onClick={() => load(1)}>1</button>
                    {pageNumbers[0] > 2 && <span className="tna-faint">…</span>}
                  </>
                )}
                {pageNumbers.map((p) => (
                  <button key={p} type="button" className={`tna-page ${p === page ? "active" : ""}`} onClick={() => load(p)}>{p}</button>
                ))}
                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="tna-faint">…</span>}
                    <button type="button" className="tna-page" onClick={() => load(totalPages)}>{totalPages}</button>
                  </>
                )}
                <button type="button" className="tna-page" disabled={page >= totalPages} onClick={() => load(page + 1)} aria-label="Next page"><FiChevronRight /></button>
              </div>
              <label className="tna-rows">
                Rows
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  {[25, 50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Delete this TNA?"
        message={
          deleting && (
            <>
              The Time & Action plan for <b>{deleting.order_no}</b> will be removed. The order itself is not affected, and a new TNA can be
              created for it later.
            </>
          )
        }
        confirmLabel="Delete TNA"
        danger
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
