// src/components/stationery/StationeryUsage.jsx
//
// Requests & Usage: every stationery request. Approve, reject (with an
// optional reason) and issue; create a request on someone's behalf; search,
// filter by status, CSV export. Shared look: stationeryTheme.js.
import React, { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiDownload,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import stationeryAPI from "../../api/stationery";
import { downloadCSV, todayStamp } from "./stationeryShared";
import { REQUEST_TONE, STATIONERY_CSS, apiError, fmtDateTime } from "./stationeryTheme";

const EMPTY_FORM = { employee: "", stationery_item: "", quantity: 1, purpose: "", remarks: "" };

const itemName = (r) => r.stationery_item_name || r.stationery_name || `Item #${r.stationery_item}`;

// ── New request (on behalf of an employee) ───────────────────────────────────
const RequestFormModal = ({ items, employees, onClose, onSaved }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const selected = items.find((i) => String(i.id) === String(form.stationery_item));
  const tooMany = selected && Number(form.quantity) > Number(selected.current_stock || 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.employee || !form.stationery_item) {
      setErr("Choose an employee and an item.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await stationeryAPI.addUsage({
        ...form,
        employee: parseInt(form.employee, 10),
        stationery_item: parseInt(form.stationery_item, 10),
        quantity: parseInt(form.quantity, 10) || 1,
      });
      onSaved();
      onClose();
    } catch (ex) {
      setErr(apiError(ex, "Could not create the request."));
      setSaving(false);
    }
  };

  return (
    <div className="sp-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <form className="sp-modal" style={{ maxWidth: 560 }} onSubmit={submit}>
        <div className="sp-modal-head">
          <div>
            <h2>New Request</h2>
            <p>Create a stationery request on behalf of an employee.</p>
          </div>
          <button type="button" className="sp-icon-btn" onClick={onClose} title="Close">
            <FiX />
          </button>
        </div>
        <div className="sp-modal-body">
          {err && (
            <div className="sp-alert err">
              <FiAlertTriangle />
              <span>{err}</span>
            </div>
          )}
          <div className="sp-field">
            <label>
              Employee <span className="req">*</span>
            </label>
            <select className="sp-input" value={form.employee} onChange={(e) => set("employee", e.target.value)} required>
              <option value="">Select employee…</option>
              {[...employees]
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_id})
                  </option>
                ))}
            </select>
          </div>
          <div className="sp-field-grid" style={{ gridTemplateColumns: "1fr 140px" }}>
            <div className="sp-field">
              <label>
                Item <span className="req">*</span>
              </label>
              <select
                className="sp-input"
                value={form.stationery_item}
                onChange={(e) => set("stationery_item", e.target.value)}
                required
              >
                <option value="">Select item…</option>
                {[...items]
                  .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                  .map((item) => (
                    <option key={item.id} value={item.id} disabled={Number(item.current_stock || 0) <= 0}>
                      {item.name} — {item.current_stock ?? 0} {item.unit} in stock
                    </option>
                  ))}
              </select>
            </div>
            <div className="sp-field">
              <label>Quantity</label>
              <input
                className="sp-input"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </div>
          </div>
          {tooMany && (
            <div className="sp-hint warn" style={{ marginTop: -8, marginBottom: 12 }}>
              Only {selected.current_stock} {selected.unit} in stock — the request will be refused.
            </div>
          )}
          <div className="sp-field">
            <label>Purpose</label>
            <textarea
              className="sp-input"
              rows={2}
              value={form.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              placeholder="What is it for?"
            />
          </div>
          <div className="sp-field" style={{ marginBottom: 0 }}>
            <label>Remarks</label>
            <textarea className="sp-input" rows={2} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} />
          </div>
        </div>
        <div className="sp-modal-foot">
          <button type="button" className="sp-btn ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="sp-btn primary" disabled={saving}>
            <FiSend /> {saving ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Reject with reason ───────────────────────────────────────────────────────
const RejectModal = ({ record, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="sp-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form
        className="sp-modal"
        style={{ maxWidth: 460 }}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await onConfirm(reason.trim());
          setBusy(false);
        }}
      >
        <div className="sp-modal-head">
          <div>
            <h2>Reject Request</h2>
            <p>
              {record.employee_name} · {itemName(record)} · {record.quantity} {record.unit || ""}
            </p>
          </div>
          <button type="button" className="sp-icon-btn" onClick={onClose} title="Close">
            <FiX />
          </button>
        </div>
        <div className="sp-modal-body">
          <div className="sp-field" style={{ marginBottom: 0 }}>
            <label>Reason (optional)</label>
            <textarea
              className="sp-input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Saved in the request's remarks"
              autoFocus
            />
          </div>
        </div>
        <div className="sp-modal-foot">
          <button type="button" className="sp-btn ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="sp-btn danger" disabled={busy}>
            <FiXCircle /> {busy ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </form>
    </div>
  );
};

const STATUSES = ["pending", "approved", "issued", "rejected"];

// ── Page ─────────────────────────────────────────────────────────────────────
const StationeryUsage = () => {
  const [usage, setUsage] = useState([]);
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [notice, setNotice] = useState(null); // { ok, msg }
  const [showForm, setShowForm] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchData = async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    try {
      const [usageData, itemsData, employeesData] = await Promise.all([
        stationeryAPI.fetchUsage(),
        stationeryAPI.fetchItems(),
        stationeryAPI.fetchEmployees().catch(() => []), // only needed for "New Request"
      ]);
      setUsage(Array.isArray(usageData) ? usageData : []);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoadError(apiError(error, "Could not load requests."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const counts = useMemo(() => {
    const c = { all: usage.length };
    STATUSES.forEach((s) => {
      c[s] = usage.filter((u) => u.status === s).length;
    });
    return c;
  }, [usage]);

  const filteredUsage = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return usage
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      .filter(
        (r) =>
          !q ||
          [r.employee_name, r.employee_employee_id, r.employee_department, itemName(r), r.purpose]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)),
      )
      .sort((a, b) => new Date(b.date_requested) - new Date(a.date_requested));
  }, [usage, statusFilter, searchTerm]);

  // Run one workflow action, then reload; errors (e.g. not enough stock) are shown.
  const runAction = async (record, fn, okMsg) => {
    setBusyId(record.id);
    setNotice(null);
    try {
      await fn();
      setNotice({ ok: true, msg: okMsg });
      await fetchData({ quiet: true });
      return true;
    } catch (error) {
      setNotice({ ok: false, msg: apiError(error, "The action failed. Please try again.") });
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = (r) =>
    runAction(r, () => stationeryAPI.approveUsage(r.id), `Approved ${r.employee_name}'s request for ${itemName(r)}.`);
  const handleIssue = (r) =>
    runAction(r, () => stationeryAPI.issueUsage(r.id), `Issued ${r.quantity} ${r.unit || ""} ${itemName(r)} to ${r.employee_name}.`);
  const handleReject = async (reason) => {
    const r = rejecting;
    const ok = await runAction(r, () => stationeryAPI.rejectUsage(r.id, reason), `Rejected ${r.employee_name}'s request.`);
    if (ok) setRejecting(null);
  };

  const exportUsageCSV = () =>
    downloadCSV(`stationery-requests-${todayStamp()}.csv`, filteredUsage, [
      { label: "Requested", get: (r) => (r.date_requested ? new Date(r.date_requested).toLocaleString("en-GB") : "") },
      { label: "Employee", get: (r) => r.employee_name },
      { label: "Employee ID", get: (r) => r.employee_employee_id },
      { label: "Department", get: (r) => r.employee_department },
      { label: "Item", get: (r) => itemName(r) },
      { label: "Quantity", get: (r) => r.quantity },
      { label: "Unit", get: (r) => r.unit },
      { label: "Purpose", get: (r) => r.purpose },
      { label: "Remarks", get: (r) => r.remarks },
      { label: "Status", get: (r) => r.status },
      { label: "Issued", get: (r) => (r.date_issued ? new Date(r.date_issued).toLocaleString("en-GB") : "") },
    ]);

  if (loading) {
    return (
      <div className="sp-app">
        <style>{STATIONERY_CSS}</style>
        <div className="sp-loading">
          <div className="sp-spinner" />
          Loading requests…
        </div>
      </div>
    );
  }

  const kpis = [
    { key: "pending", label: "Pending approval", icon: <FiClock />, tone: "amber" },
    { key: "approved", label: "Approved, to issue", icon: <FiCheckCircle />, tone: "blue" },
    { key: "issued", label: "Issued", icon: <FiPackage />, tone: "green" },
    { key: "rejected", label: "Rejected", icon: <FiXCircle />, tone: "red" },
  ];

  return (
    <div className="sp-app">
      <style>{STATIONERY_CSS}</style>

      <header className="sp-header">
        <div>
          <div className="sp-eyebrow">Stationery</div>
          <h1 className="sp-title">
            Requests &amp; Usage <span className="sp-count">{usage.length}</span>
          </h1>
          <p className="sp-subtitle">Approve, reject and issue stationery requests.</p>
        </div>
        <div className="sp-actions">
          <button type="button" className="sp-btn ghost" onClick={() => fetchData({ quiet: true })} disabled={refreshing}>
            <FiRefreshCw className={refreshing ? "sp-spin" : ""} /> Refresh
          </button>
          <button type="button" className="sp-btn ghost" onClick={exportUsageCSV} disabled={filteredUsage.length === 0}>
            <FiDownload /> Export CSV
          </button>
          <button type="button" className="sp-btn primary" onClick={() => setShowForm(true)}>
            <FiPlus /> New Request
          </button>
        </div>
      </header>

      <div className="sp-body">
        {loadError && (
          <div className="sp-alert err">
            <FiAlertTriangle />
            <span>{loadError}</span>
            <button type="button" className="sp-btn ghost sm" onClick={() => fetchData()}>
              Retry
            </button>
          </div>
        )}
        {notice && (
          <div className={`sp-alert ${notice.ok ? "ok" : "err"}`}>
            {notice.ok ? <FiCheckCircle /> : <FiAlertTriangle />}
            <span>{notice.msg}</span>
            <button type="button" className="sp-icon-btn" onClick={() => setNotice(null)} title="Dismiss">
              <FiX />
            </button>
          </div>
        )}

        <div className="sp-kpis">
          {kpis.map((k) => (
            <button
              key={k.key}
              type="button"
              className={`sp-kpi k-${k.tone} ${statusFilter === k.key ? "active" : ""}`}
              onClick={() => setStatusFilter(statusFilter === k.key ? "all" : k.key)}
            >
              <span className="sp-kpi-icon">{k.icon}</span>
              <span>
                <span className="sp-kpi-value">{counts[k.key]}</span>
                <span className="sp-kpi-label">{k.label}</span>
              </span>
            </button>
          ))}
        </div>

        <section className="sp-card">
          <div className="sp-toolbar">
            <div className="sp-search">
              <FiSearch />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employee, ID, department, item or purpose"
              />
              {searchTerm && (
                <button type="button" className="clear" onClick={() => setSearchTerm("")} title="Clear">
                  <FiX />
                </button>
              )}
            </div>
            <div className="sp-seg" aria-label="Status">
              {["all", ...STATUSES].map((s) => (
                <button key={s} type="button" className={statusFilter === s ? "on" : ""} onClick={() => setStatusFilter(s)}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  <span className="n">{counts[s]}</span>
                </button>
              ))}
            </div>
            <span className="sp-spacer" />
            <span className="sp-note">{filteredUsage.length} shown</span>
          </div>

          {filteredUsage.length === 0 ? (
            <div className="sp-state">
              <div className="sp-state-icon">
                <FiClipboard />
              </div>
              <h3>{usage.length === 0 ? "No requests yet" : "No requests match"}</h3>
              <p>{usage.length === 0 ? "Requests from employees will appear here." : "Try a different search or status."}</p>
            </div>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Item</th>
                    <th className="num">Qty</th>
                    <th>Purpose</th>
                    <th>Requested</th>
                    <th>Status</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsage.map((r) => {
                    const open = expandedRow === r.id;
                    const busy = busyId === r.id;
                    return (
                      <React.Fragment key={r.id}>
                        <tr className={`row ${open ? "open" : ""}`} onClick={() => setExpandedRow(open ? null : r.id)}>
                          <td>
                            <div className="sp-person">
                              <span className="sp-avatar">{(r.employee_name || "?").trim().charAt(0).toUpperCase()}</span>
                              <span>
                                <span className="strong">{r.employee_name || "Unknown"}</span>
                                <span className="sp-cell-sub">
                                  {[r.employee_employee_id, r.employee_department].filter(Boolean).join(" · ") || "—"}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className="strong">{itemName(r)}</td>
                          <td className="num nowrap">
                            <span className="strong">{r.quantity}</span> <span className="muted small">{r.unit || ""}</span>
                          </td>
                          <td>
                            <span className="sp-clamp muted" title={r.purpose || ""}>
                              {r.purpose || "—"}
                            </span>
                          </td>
                          <td className="muted nowrap">{fmtDateTime(r.date_requested)}</td>
                          <td>
                            <span className={`sp-pill ${REQUEST_TONE[r.status] || "gray"}`}>{r.status}</span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="sp-actions-cell">
                              {busy && <span className="sp-spinner sm" />}
                              {r.status === "pending" && (
                                <>
                                  <button
                                    type="button"
                                    className="sp-btn success sm"
                                    disabled={busy}
                                    onClick={() => handleApprove(r)}
                                  >
                                    <FiCheck /> Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="sp-icon-btn danger"
                                    title="Reject"
                                    disabled={busy}
                                    onClick={() => setRejecting(r)}
                                  >
                                    <FiX />
                                  </button>
                                </>
                              )}
                              {r.status === "approved" && (
                                <>
                                  <button type="button" className="sp-btn primary sm" disabled={busy} onClick={() => handleIssue(r)}>
                                    <FiPackage /> Issue
                                  </button>
                                  <button
                                    type="button"
                                    className="sp-icon-btn danger"
                                    title="Reject"
                                    disabled={busy}
                                    onClick={() => setRejecting(r)}
                                  >
                                    <FiX />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {open && (
                          <tr className="sp-detail">
                            <td colSpan={7}>
                              <div className="sp-detail-grid">
                                <div>
                                  <div className="k">Purpose</div>
                                  <div className="v">{r.purpose || "—"}</div>
                                </div>
                                <div>
                                  <div className="k">Remarks</div>
                                  <div className="v">{r.remarks || "—"}</div>
                                </div>
                                <div>
                                  <div className="k">Employee</div>
                                  <div className="v">
                                    {r.employee_name || "—"}
                                    {r.employee_email ? `\n${r.employee_email}` : ""}
                                  </div>
                                </div>
                                <div>
                                  <div className="k">Requested / issued</div>
                                  <div className="v">
                                    {fmtDateTime(r.date_requested)}
                                    {"\n"}
                                    {r.date_issued ? `Issued ${fmtDateTime(r.date_issued)}` : "Not issued yet"}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showForm && (
        <RequestFormModal
          items={items}
          employees={employees}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setNotice({ ok: true, msg: "Request created." });
            fetchData({ quiet: true });
          }}
        />
      )}
      {rejecting && <RejectModal record={rejecting} onClose={() => setRejecting(null)} onConfirm={handleReject} />}
    </div>
  );
};

export default StationeryUsage;
