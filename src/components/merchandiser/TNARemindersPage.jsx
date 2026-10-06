// src/components/merchandiser/TNARemindersPage.jsx
//
// TNA reminders: dates coming up in the next 10 days, missed approvals
// (lab dip / fabric / fit / PP sample) and missed shipments from the last
// 30 days. Approved stages drop off automatically. Tabs and counts are
// server-side for the whole set (the old page counted the current page
// only), and nothing uses alert()/confirm() any more.

import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiArrowLeft, FiCheck, FiChevronLeft, FiChevronRight, FiExternalLink, FiInbox, FiRefreshCw, FiX } from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import { ConfirmDialog, TNA_CSS, apiError, fmtDate, relDays, tnaApi } from "./tnaShared";

const TABS = [
  { key: "", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "urgent", label: "Due in 3 days" },
  { key: "normal", label: "Upcoming" },
];

export default function TNARemindersPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("");
  const [year, setYear] = useState("");
  const [years, setYears] = useState([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [dismissing, setDismissing] = useState(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const pageSize = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, page_size: pageSize };
      if (tab) params.urgency = tab;
      if (year) params.shipment_year = year;
      const res = await tnaApi.get("tna/reminders/", { params });
      setData(res.data);
    } catch (err) {
      setError(apiError(err, "Couldn't load reminders."));
    } finally {
      setLoading(false);
    }
  }, [page, tab, year]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    tnaApi.get("tna/reminders/years/").then((r) => setYears(r.data.years || [])).catch(() => {});
  }, []);

  const dismiss = async (r) => {
    setDismissing(r.id);
    try {
      await tnaApi.post(`tna/reminders/${r.id}/mark-read/`);
      setNotice(`Dismissed: ${r.order_no} · ${r.label}`);
      load();
    } catch (err) {
      setError(apiError(err, "Couldn't dismiss the reminder."));
    } finally {
      setDismissing(null);
    }
  };

  const dismissAll = async () => {
    setBusy(true);
    try {
      const res = await tnaApi.post("tna/reminders/mark-all-read/", null, { params: year ? { shipment_year: year } : {} });
      setNotice(`Dismissed ${res.data.dismissed_count} reminders.`);
      setConfirmAll(false);
      setPage(1);
      load();
    } catch (err) {
      setError(apiError(err, "Couldn't dismiss the reminders."));
      setConfirmAll(false);
    } finally {
      setBusy(false);
    }
  };

  const counts = data?.counts || { overdue: 0, urgent: 0, normal: 0 };
  const total = counts.overdue + counts.urgent + counts.normal;
  const tabCount = (k) => (k ? counts[k] : total);
  // order_no / label come from the current API; older responses only had order_number / message
  const items = (data?.results || []).map((r) => ({ ...r, order_no: r.order_no || r.order_number, label: r.label || r.message }));
  const totalPages = data?.total_pages || 1;

  return (
    <div className="tna-shell">
      <style>{TNA_CSS}</style>
      <Sidebar />
      <div className="tna-app">
        <header className="tna-header">
          <div>
            <div className="tna-crumbs"><Link to="/orders/tna">Time & Action</Link> <span>/</span> <span>Reminders</span></div>
            <h1 className="tna-title">TNA reminders {data && <span className="tna-pill-count">{total.toLocaleString("en-US")}</span>}</h1>
            <p className="tna-subtitle">
              Dates due in the next {data?.window?.ahead_days ?? 10} days, plus approvals and shipments missed in the last {data?.window?.overdue_days ?? 30} days.
              Approving a stage on its TNA clears its reminders.
            </p>
          </div>
          <div className="tna-actions">
            <button type="button" className="tna-btn ghost" onClick={() => navigate("/orders/tna")}><FiArrowLeft /> Time & Action</button>
            <button type="button" className="tna-btn ghost" onClick={load} disabled={loading}><FiRefreshCw /> Refresh</button>
            <button type="button" className="tna-btn ghost" onClick={() => setConfirmAll(true)} disabled={!total}><FiCheck /> Dismiss all</button>
          </div>
        </header>

        <div className="tna-body">
          {notice && (
            <div className="tna-alert ok" role="status"><FiCheck /><span>{notice}</span>
              <button type="button" className="x" onClick={() => setNotice(null)} aria-label="Dismiss"><FiX /></button>
            </div>
          )}
          {error && (
            <div className="tna-alert err"><FiAlertTriangle /><span>{error}</span>
              <button type="button" className="x" onClick={() => setError(null)} aria-label="Dismiss"><FiX /></button>
            </div>
          )}

          <div className="tna-kpis">
            {[
              { k: "overdue", label: "Overdue", foot: "Missed approvals & shipments", color: "#b91c1c" },
              { k: "urgent", label: "Due in 3 days", foot: "Today to 3 days ahead", color: "#a16207" },
              { k: "normal", label: "Upcoming", foot: "4–10 days ahead", color: "#1d4ed8" },
            ].map((c) => (
              <button key={c.k} type="button" className={`tna-card tna-kpi ${tab === c.k ? "active" : ""}`} onClick={() => { setTab(tab === c.k ? "" : c.k); setPage(1); }}>
                <span className="tna-kpi-label">{c.label}</span>
                <span className="tna-kpi-value" style={{ color: c.color }}>{data ? counts[c.k].toLocaleString("en-US") : <span className="tna-skel" style={{ width: 50, height: 26 }} />}</span>
                <span className="tna-kpi-foot">{c.foot}</span>
              </button>
            ))}
          </div>

          <section className="tna-card" style={{ overflow: "hidden" }}>
            <div className="tna-card-head">
              <div className="tna-tabs">
                {TABS.map((t) => (
                  <button key={t.key || "all"} type="button" className={`tna-tab ${tab === t.key ? "on" : ""}`} onClick={() => { setTab(t.key); setPage(1); }}>
                    {t.label} <span className="n">{tabCount(t.key).toLocaleString("en-US")}</span>
                  </button>
                ))}
              </div>
              <label className="tna-rows">
                Year
                <select value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }}>
                  <option value="">All</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
            </div>

            {items.length === 0 ? (
              <div className="tna-empty">
                <FiInbox />
                <b>{loading ? "Loading reminders…" : "Nothing needs attention here"}</b>
              </div>
            ) : (
              <ul className="tna-rem-list" style={loading ? { opacity: 0.55 } : undefined}>
                {items.map((r) => (
                  <li key={r.id} className={`tna-rem ${r.urgency_level}`}>
                    <span className="tna-rem-bar" />
                    <div className="tna-rem-main">
                      <div className="tna-rem-title">
                        {r.order_no} · {r.label}
                        <span className={`tna-chip ${r.urgency_level === "overdue" ? "red" : r.urgency_level === "urgent" ? "amber" : "blue"}`}>
                          {r.urgency_level === "overdue" ? "Overdue" : r.urgency_level === "urgent" ? "Due soon" : "Upcoming"}
                        </span>
                      </div>
                      <div className="tna-rem-meta">{[r.supplier, r.item, r.po_no && r.po_no !== r.order_no ? `PO ${r.po_no}` : null].filter(Boolean).join(" · ") || "—"}</div>
                    </div>
                    <div className="tna-rem-date">
                      <b>{fmtDate(r.reminder_date)}</b>
                      <span style={r.days_until < 0 ? { color: "#b91c1c", fontWeight: 600 } : undefined}>{relDays(r.days_until)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" className="tna-icon-btn" title="Open TNA plan" onClick={() => navigate(`/tna-details/${r.tna_id}`)}><FiExternalLink /></button>
                      <button type="button" className="tna-btn ghost sm" onClick={() => dismiss(r)} disabled={dismissing === r.id}>
                        {dismissing === r.id ? "…" : "Dismiss"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <div className="tna-pager">
                <span className="tna-note">Page {page} of {totalPages}</span>
                <div className="tna-pages">
                  <button type="button" className="tna-page" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><FiChevronLeft /></button>
                  <button type="button" className="tna-page" disabled={page >= totalPages} onClick={() => setPage(page + 1)} aria-label="Next page"><FiChevronRight /></button>
                </div>
                <span />
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAll}
        title="Dismiss all reminders?"
        message={<>All <b>{total.toLocaleString("en-US")}</b> current reminders{year ? ` for ${year}` : ""} will be hidden for everyone. A reminder comes back if its date changes.</>}
        confirmLabel="Dismiss all"
        busy={busy}
        onConfirm={dismissAll}
        onCancel={() => setConfirmAll(false)}
      />
    </div>
  );
}
