// src/components/stationery/StationeryDashboard.jsx
//
// Stationery overview for managers. Everything on this page comes from the
// live API (items, usage requests, stock transactions) - the old version's
// sample notifications, made-up trend percentages and "coming soon" tabs
// are gone; Inventory / Requests / Stock Report are their own pages in the
// sidebar.
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiDollarSign,
  FiInbox,
  FiPackage,
  FiRefreshCw,
  FiTrendingUp,
  FiXCircle,
} from "react-icons/fi";
import stationeryAPI, { getStockStatus, getTransactionLabel } from "../../api/stationery";
import { formatBDT } from "./stationeryShared";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const sameMonth = (iso, ref) => {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
};

const TX_TONE = { issue: "blue", order: "green", return: "violet", adjust: "amber", damage: "red" };

const StationeryDashboard = () => {
  const [items, setItems] = useState([]);
  const [usage, setUsage] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [loadedAt, setLoadedAt] = useState(null);

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [itemsRes, usageRes, txRes] = await Promise.all([
        stationeryAPI.fetchItems(),
        stationeryAPI.fetchUsage(),
        // Transactions are restricted to full-access users server-side; the
        // Admin team leader still gets the rest of the dashboard.
        stationeryAPI.fetchTransactions().catch(() => []),
      ]);
      setItems(Array.isArray(itemsRes) ? itemsRes : []);
      setUsage(Array.isArray(usageRes) ? usageRes : []);
      setTransactions(Array.isArray(txRes) ? txRes : []);
      setLoadedAt(new Date());
    } catch (err) {
      console.error("Error loading stationery dashboard:", err);
      setError(
        err.response?.status === 401
          ? "Session expired – please log in again."
          : "Could not load stationery data. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const data = useMemo(() => {
    const now = new Date();
    const withStatus = items.map((item) => ({ ...item, _status: getStockStatus(item).label }));
    const low = withStatus.filter((i) => i._status === "Low Stock");
    const out = withStatus.filter((i) => i._status === "Out of Stock");
    const reorder = [...out, ...low].sort((a, b) => (a.current_stock || 0) - (b.current_stock || 0));

    const priced = items.filter((i) => i.price_per_unit !== null && i.price_per_unit !== undefined && i.price_per_unit !== "");
    const stockValue = priced.reduce(
      (sum, i) => sum + Number(i.current_stock || 0) * Number(i.price_per_unit || 0),
      0,
    );

    const pending = usage
      .filter((u) => u.status === "pending")
      .sort((a, b) => new Date(b.date_requested) - new Date(a.date_requested));
    const toIssue = usage.filter((u) => u.status === "approved");

    // Most requested this month (approved / issued / completed requests).
    const counted = usage.filter(
      (u) => ["approved", "issued", "completed"].includes(u.status) && sameMonth(u.date_requested, now),
    );
    const byItem = {};
    counted.forEach((u) => {
      const name = u.stationery_item_name || u.stationery_name || "Unknown item";
      byItem[name] = byItem[name] || { name, qty: 0, unit: u.unit || "" };
      byItem[name].qty += Number(u.quantity || 0);
    });
    const topItems = Object.values(byItem)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    const recentTx = [...transactions]
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
      .slice(0, 8);

    return {
      low,
      out,
      reorder,
      stockValue,
      unpriced: items.length - priced.length,
      pending,
      toIssue,
      topItems,
      recentTx,
      requestsThisMonth: usage.filter((u) => sameMonth(u.date_requested, now)).length,
    };
  }, [items, usage, transactions]);

  if (loading) {
    return (
      <div className="st-dash">
        <style>{CSS}</style>
        <div className="st-loading">
          <div className="st-spinner" />
          Loading stationery…
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Items in catalogue", value: items.length, icon: <FiPackage />, tone: "blue", to: "/StationeryItems" },
    { label: "Low stock", value: data.low.length, icon: <FiAlertTriangle />, tone: "amber", to: "/StockReport" },
    { label: "Out of stock", value: data.out.length, icon: <FiXCircle />, tone: "red", to: "/StockReport" },
    { label: "Pending requests", value: data.pending.length, icon: <FiClock />, tone: "violet", to: "/StationeryUsage" },
    { label: "Approved, to issue", value: data.toIssue.length, icon: <FiCheckCircle />, tone: "green", to: "/StationeryUsage" },
    {
      label: "Stock value",
      value: formatBDT(data.stockValue),
      icon: <FiDollarSign />,
      tone: "gray",
      hint: data.unpriced > 0 ? `${data.unpriced} item(s) have no price` : "All items priced",
    },
  ];

  const maxTop = data.topItems[0]?.qty || 1;

  return (
    <div className="st-dash">
      <style>{CSS}</style>

      <header className="st-header">
        <div>
          <div className="st-eyebrow">Stationery</div>
          <h1 className="st-title">Overview</h1>
          <p className="st-subtitle">
            Stock levels, requests waiting for you and recent stock movements.
            {loadedAt && <span> Updated {loadedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}.</span>}
          </p>
        </div>
        <div className="st-actions">
          <button type="button" className="st-btn ghost" onClick={() => load({ quiet: true })} disabled={refreshing}>
            <FiRefreshCw className={refreshing ? "st-spin" : ""} /> Refresh
          </button>
          <Link to="/StationeryItems" className="st-btn ghost">
            <FiPackage /> Inventory
          </Link>
          <Link to="/StationeryUsage" className="st-btn primary">
            <FiClipboard /> Review requests
            {data.pending.length > 0 && <span className="st-badge">{data.pending.length}</span>}
          </Link>
        </div>
      </header>

      <div className="st-body">
        {error && (
          <div className="st-alert">
            <FiAlertTriangle />
            <span>{error}</span>
            <button type="button" className="st-btn ghost sm" onClick={() => load()}>
              Retry
            </button>
          </div>
        )}

        <div className="st-kpis">
          {kpis.map((k) => {
            const inner = (
              <>
                <span className={`st-kpi-icon tone-${k.tone}`}>{k.icon}</span>
                <span className="st-kpi-text">
                  <span className="st-kpi-value">{k.value}</span>
                  <span className="st-kpi-label">{k.label}</span>
                  {k.hint && <span className="st-kpi-hint">{k.hint}</span>}
                </span>
              </>
            );
            return k.to ? (
              <Link key={k.label} to={k.to} className="st-kpi link">
                {inner}
              </Link>
            ) : (
              <div key={k.label} className="st-kpi">
                {inner}
              </div>
            );
          })}
        </div>

        <div className="st-grid">
          {/* Needs reorder */}
          <section className="st-card">
            <div className="st-card-head">
              <h2>
                <FiAlertTriangle /> Needs reorder
                <span className="st-count">{data.reorder.length}</span>
              </h2>
              <Link to="/StockReport" className="st-link">
                Stock report <FiArrowRight />
              </Link>
            </div>
            {data.reorder.length === 0 ? (
              <Empty icon={<FiCheckCircle />} text="Every item is above its reorder level." />
            ) : (
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num">In stock</th>
                    <th className="num">Reorder at</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reorder.slice(0, 8).map((i) => (
                    <tr key={i.id}>
                      <td className="strong">{i.name}</td>
                      <td className="num">
                        {i.current_stock ?? 0} <span className="muted">{i.unit}</span>
                      </td>
                      <td className="num">{i.reorder_level ?? "—"}</td>
                      <td>
                        <span className={`st-pill ${i._status === "Out of Stock" ? "red" : "amber"}`}>{i._status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {data.reorder.length > 8 && <div className="st-more">+{data.reorder.length - 8} more in the stock report</div>}
          </section>

          {/* Pending requests */}
          <section className="st-card">
            <div className="st-card-head">
              <h2>
                <FiClock /> Waiting for approval
                <span className="st-count">{data.pending.length}</span>
              </h2>
              <Link to="/StationeryUsage" className="st-link">
                All requests <FiArrowRight />
              </Link>
            </div>
            {data.pending.length === 0 ? (
              <Empty icon={<FiInbox />} text="No requests are waiting for approval." />
            ) : (
              <ul className="st-list">
                {data.pending.slice(0, 8).map((u) => (
                  <li key={u.id}>
                    <span className="st-avatar">{(u.employee_name || "?").trim().charAt(0).toUpperCase()}</span>
                    <span className="grow">
                      <span className="strong">{u.employee_name || "Unknown employee"}</span>
                      <span className="muted">
                        {u.stationery_item_name || u.stationery_name} · {u.quantity} {u.unit || ""}
                        {u.employee_department ? ` · ${u.employee_department}` : ""}
                      </span>
                    </span>
                    <span className="muted nowrap">{fmtDate(u.date_requested)}</span>
                  </li>
                ))}
              </ul>
            )}
            {data.pending.length > 8 && <div className="st-more">+{data.pending.length - 8} more waiting</div>}
          </section>

          {/* Most requested */}
          <section className="st-card">
            <div className="st-card-head">
              <h2>
                <FiTrendingUp /> Most requested this month
              </h2>
              <span className="muted small">{data.requestsThisMonth} request(s) this month</span>
            </div>
            {data.topItems.length === 0 ? (
              <Empty icon={<FiTrendingUp />} text="No approved or issued requests yet this month." />
            ) : (
              <ul className="st-bars">
                {data.topItems.map((t) => (
                  <li key={t.name}>
                    <div className="row">
                      <span className="strong">{t.name}</span>
                      <span className="muted">
                        {t.qty} {t.unit}
                      </span>
                    </div>
                    <div className="track">
                      <span style={{ width: `${(t.qty / maxTop) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent movements */}
          <section className="st-card">
            <div className="st-card-head">
              <h2>
                <FiRefreshCw /> Recent stock movements
              </h2>
            </div>
            {data.recentTx.length === 0 ? (
              <Empty icon={<FiInbox />} text="No stock movements recorded yet." />
            ) : (
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Item</th>
                    <th className="num">Qty</th>
                    <th>By / to</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTx.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className={`st-pill ${TX_TONE[t.transaction_type] || "gray"}`}>
                          {getTransactionLabel(t.transaction_type)}
                        </span>
                      </td>
                      <td className="strong">{t.stationery_name || "—"}</td>
                      <td className="num">{t.quantity}</td>
                      <td className="muted">{t.employee_name || t.performed_by || "—"}</td>
                      <td className="muted nowrap">{fmtDate(t.transaction_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const Empty = ({ icon, text }) => (
  <div className="st-empty">
    <span>{icon}</span>
    {text}
  </div>
);

const CSS = `
.st-dash {
  --bg: #f3f5f9; --surface: #fff; --soft: #f8fafc; --border: #e6eaf0; --border-strong: #d5dbe4;
  --text: #0f172a; --text-2: #334155; --muted: #64748b; --faint: #94a3b8;
  --primary: #2563eb; --primary-dark: #1d4ed8; --primary-soft: #eef4ff;
  min-height: 100vh; background: var(--bg); color: var(--text);
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; font-size: 14px;
}
.st-dash *, .st-dash *::before, .st-dash *::after { box-sizing: border-box; }
.st-dash a:focus-visible, .st-dash button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.st-header {
  position: sticky; top: 0; z-index: 20; display: flex; align-items: flex-end; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; padding: 18px 28px 16px; background: rgba(255,255,255,.94);
  backdrop-filter: blur(8px); border-bottom: 1px solid var(--border);
}
.st-eyebrow { font-size: 11.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--primary); margin-bottom: 4px; }
.st-title { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
.st-subtitle { margin: 4px 0 0; color: var(--muted); font-size: 13.5px; }
.st-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.st-btn {
  display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 15px; border-radius: 10px;
  font: inherit; font-size: 13.5px; font-weight: 600; text-decoration: none; cursor: pointer; white-space: nowrap;
  border: 1px solid transparent; transition: background .15s, border-color .15s;
}
.st-btn:disabled { opacity: .6; cursor: not-allowed; }
.st-btn.primary { background: var(--primary); color: #fff; box-shadow: 0 1px 2px rgba(37,99,235,.25); }
.st-btn.primary:hover { background: var(--primary-dark); }
.st-btn.ghost { background: var(--surface); color: var(--text-2); border-color: var(--border-strong); }
.st-btn.ghost:hover:not(:disabled) { background: var(--soft); }
.st-btn.sm { height: 30px; padding: 0 10px; font-size: 12.5px; }
.st-badge { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: #fff; color: var(--primary-dark); font-size: 11.5px; font-weight: 700; display: inline-grid; place-items: center; }
.st-body { padding: 22px 28px 32px; max-width: 1600px; margin: 0 auto; }
.st-alert { display: flex; align-items: center; gap: 10px; padding: 10px 12px 10px 14px; margin-bottom: 16px; border-radius: 10px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-weight: 500; }
.st-alert span { flex: 1; }

.st-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin-bottom: 18px; }
.st-kpi { display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 14px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 1px 2px rgba(15,23,42,.04); color: inherit; text-decoration: none; transition: border-color .15s, box-shadow .15s, transform .15s; }
.st-kpi.link:hover { border-color: var(--border-strong); box-shadow: 0 4px 14px rgba(15,23,42,.06); transform: translateY(-1px); }
.st-kpi-icon { flex-shrink: 0; width: 42px; height: 42px; border-radius: 11px; display: grid; place-items: center; font-size: 19px; }
.st-kpi-text { display: flex; flex-direction: column; min-width: 0; }
.st-kpi-value { font-size: 22px; font-weight: 700; line-height: 1.15; letter-spacing: -.02em; }
.st-kpi-label { font-size: 13px; font-weight: 600; color: var(--text-2); margin-top: 2px; }
.st-kpi-hint { font-size: 11.5px; color: var(--faint); margin-top: 1px; }
.tone-blue { color: #1d4ed8; background: #eff6ff; } .tone-amber { color: #b45309; background: #fffbeb; }
.tone-red { color: #b91c1c; background: #fef2f2; } .tone-violet { color: #6d28d9; background: #f5f3ff; }
.tone-green { color: #15803d; background: #f0fdf4; } .tone-gray { color: #475569; background: #f1f5f9; }

.st-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.st-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden; display: flex; flex-direction: column; }
.st-card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.st-card-head h2 { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 14.5px; font-weight: 700; }
.st-card-head h2 svg { color: var(--muted); }
.st-count { font-size: 12px; font-weight: 600; color: var(--primary-dark); background: var(--primary-soft); border: 1px solid #dbe6fe; border-radius: 999px; padding: 1px 8px; }
.st-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--primary); text-decoration: none; white-space: nowrap; }
.st-link:hover { text-decoration: underline; }
.st-table { width: 100%; border-collapse: collapse; }
.st-table th { padding: 9px 16px; text-align: left; background: var(--soft); border-bottom: 1px solid var(--border); font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); }
.st-table td { padding: 10px 16px; border-bottom: 1px solid var(--border); font-size: 13.5px; color: var(--text-2); }
.st-table tr:last-child td { border-bottom: none; }
.st-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.strong { font-weight: 600; color: var(--text); }
.muted { color: var(--muted); }
.small { font-size: 12.5px; }
.nowrap { white-space: nowrap; }
.st-pill { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid; white-space: nowrap; }
.st-pill.red { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
.st-pill.amber { color: #b45309; background: #fffbeb; border-color: #fde68a; }
.st-pill.green { color: #15803d; background: #f0fdf4; border-color: #bbf7d0; }
.st-pill.blue { color: #1d4ed8; background: #eff6ff; border-color: #bfdbfe; }
.st-pill.violet { color: #6d28d9; background: #f5f3ff; border-color: #ddd6fe; }
.st-pill.gray { color: #475569; background: #f1f5f9; border-color: #e2e8f0; }
.st-list { list-style: none; margin: 0; padding: 4px 0; }
.st-list li { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid var(--border); }
.st-list li:last-child { border-bottom: none; }
.st-list .grow { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.st-list .grow .muted { font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-avatar { flex-shrink: 0; width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; font-weight: 700; font-size: 13px; color: var(--primary-dark); background: linear-gradient(135deg,#eef4ff,#e0e7ff); border: 1px solid #dbe6fe; }
.st-bars { list-style: none; margin: 0; padding: 12px 16px 16px; display: flex; flex-direction: column; gap: 12px; }
.st-bars .row { display: flex; justify-content: space-between; gap: 12px; font-size: 13.5px; margin-bottom: 5px; }
.st-bars .track { height: 8px; border-radius: 999px; background: #f1f5f9; overflow: hidden; }
.st-bars .track span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #3b82f6, #6366f1); }
.st-more { padding: 10px 16px; font-size: 12.5px; color: var(--muted); border-top: 1px solid var(--border); background: var(--soft); }
.st-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 36px 16px; color: var(--muted); font-size: 13.5px; text-align: center; }
.st-empty span { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; font-size: 20px; color: var(--faint); background: var(--soft); border: 1px solid var(--border); }
.st-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 60vh; color: var(--muted); }
.st-spinner { width: 34px; height: 34px; border-radius: 50%; border: 3px solid var(--border); border-top-color: var(--primary); animation: st-spin .8s linear infinite; }
.st-spin { animation: st-spin .8s linear infinite; }
@keyframes st-spin { to { transform: rotate(360deg); } }
@media (max-width: 1100px) { .st-grid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 760px) { .st-header, .st-body { padding-left: 16px; padding-right: 16px; } }
`;

export default StationeryDashboard;
