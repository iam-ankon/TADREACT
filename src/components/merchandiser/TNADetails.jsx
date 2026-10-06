// src/components/merchandiser/TNADetails.jsx
//
// One TNA plan: order info, the four approval stages (click to approve /
// undo - drives the progress %), and the full timeline of planned dates
// with what's done, late, passed or next. Errors show inline (the old page
// used alert(), which froze the tab when a TNA didn't exist).

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiAlertTriangle, FiArrowLeft, FiCheck, FiCheckCircle, FiEdit2, FiExternalLink, FiRefreshCw, FiTrash2, FiX,
} from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import {
  ConfirmDialog, GROUP_LABEL, ProgressBar, STAGES, TNA_CSS, apiError, daysFromToday, fmtDate, milestonePlan, relDays,
  shipStatus, tnaApi,
} from "./tnaShared";

export default function TNADetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [tna, setTna] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(location.state?.flash || null);
  const [updating, setUpdating] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    tnaApi
      .get(`tna/${id}/`)
      .then((res) => alive && setTna({
        ...res.data,
        order_no: res.data.order_no || res.data.order_number,
        supplier_name: res.data.supplier_name || (res.data.supplier || "").replace(" (None)", ""),
      }))
      .catch((err) => {
        if (!alive) return;
        if (err.response?.status === 404) setNotFound(true);
        else setError(apiError(err, "Couldn't load this TNA."));
      })
      .finally(() => alive && setLoading(false));
    if (location.state?.flash) navigate(location.pathname, { replace: true, state: null });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => setFlash(null), 6000);
    return () => clearTimeout(t);
  }, [flash]);

  const toggleStage = async (stage) => {
    const next = tna[stage.field] === "approved" ? "pending" : "approved";
    setUpdating(stage.field);
    setError(null);
    const before = tna;
    setTna({ ...tna, [stage.field]: next }); // optimistic
    try {
      const res = await tnaApi.patch(`tna/${id}/`, { [stage.field]: next });
      setTna(res.data);
    } catch (err) {
      setTna(before);
      setError(apiError(err, `Couldn't update ${stage.label}.`));
    } finally {
      setUpdating(null);
    }
  };

  const syncFromOrder = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await tnaApi.post(`tna/sync-from-order/${tna.order}/`);
      setTna(res.data);
      setFlash("Order details refreshed and the plan recalculated.");
    } catch (err) {
      setError(apiError(err, "Couldn't refresh from the order."));
    } finally {
      setSyncing(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await tnaApi.delete(`tna/${id}/`);
      navigate("/orders/tna", { state: { flash: `TNA for ${tna.order_no} deleted.` } });
    } catch (err) {
      setError(apiError(err, "Couldn't delete the TNA."));
      setConfirmDelete(false);
      setBusy(false);
    }
  };

  const shell = (content) => (
    <div className="tna-shell">
      <style>{TNA_CSS}</style>
      <Sidebar />
      <div className="tna-app">{content}</div>
    </div>
  );

  if (loading) {
    return shell(
      <div className="tna-body">
        <span className="tna-skel" style={{ height: 90 }} />
        <span className="tna-skel" style={{ height: 160 }} />
        <span className="tna-skel" style={{ height: 320 }} />
      </div>,
    );
  }

  if (notFound || !tna) {
    return shell(
      <div className="tna-body">
        <div className="tna-card tna-empty">
          <FiAlertTriangle />
          <b>{notFound ? "This TNA doesn't exist or you don't have access to it." : error || "Couldn't load this TNA."}</b>
          <Link className="tna-link" to="/orders/tna">Back to Time & Action</Link>
        </div>
      </div>,
    );
  }

  const plan = milestonePlan(tna);
  const nextKey = plan.find((m) => m.state === "upcoming")?.key;
  const ship = shipStatus(tna.shipment_date);
  const shipDays = daysFromToday(tna.shipment_date);
  // count stages, not dates (PP Sample has two dates: yardage + sample)
  const lateCount = new Set(plan.filter((m) => m.state === "overdue").map((m) => m.stage)).size;

  return shell(
    <>
      <header className="tna-header">
        <div>
          <div className="tna-crumbs">
            <Link to="/orders/tna">Time & Action</Link> <span>/</span> <span>{tna.order_no}</span>
          </div>
          <h1 className="tna-title">
            {tna.order_no || `TNA-${tna.id}`}
            <span className={`tna-chip ${ship.cls}`}>{ship.label}</span>
            {tna.fabric_type && <span className={`tna-chip ${tna.fabric_type === "imported" ? "violet" : "grey"}`}>{tna.fabric_type === "imported" ? "Imported fabric" : "Local fabric"}</span>}
          </h1>
          <p className="tna-subtitle">
            {[tna.customer_name, tna.supplier_name, tna.item].filter(Boolean).join(" · ") || "Time & Action plan"}
          </p>
        </div>
        <div className="tna-actions">
          <button type="button" className="tna-btn ghost" onClick={() => navigate("/orders/tna")}><FiArrowLeft /> Back</button>
          {tna.order && (
            <button type="button" className="tna-btn ghost" onClick={syncFromOrder} disabled={syncing} title="Pull the latest order details (shipment date, qty, supplier…) and recalculate">
              <FiRefreshCw /> {syncing ? "Refreshing…" : "Refresh from order"}
            </button>
          )}
          <button type="button" className="tna-btn danger-ghost" onClick={() => setConfirmDelete(true)}><FiTrash2 /> Delete</button>
          <button type="button" className="tna-btn primary" onClick={() => navigate(`/edit-tna/${tna.id}`)}><FiEdit2 /> Edit</button>
        </div>
      </header>

      <div className="tna-body">
        {flash && (
          <div className="tna-alert ok" role="status">
            <FiCheckCircle /><span>{flash}</span>
            <button type="button" className="x" onClick={() => setFlash(null)} aria-label="Dismiss"><FiX /></button>
          </div>
        )}
        {error && (
          <div className="tna-alert err">
            <FiAlertTriangle /><span>{error}</span>
            <button type="button" className="x" onClick={() => setError(null)} aria-label="Dismiss"><FiX /></button>
          </div>
        )}

        <div className="tna-kpis">
          <div className="tna-card tna-kpi">
            <span className="tna-kpi-label">Shipment</span>
            <span className="tna-kpi-value" style={{ fontSize: 22 }}>{fmtDate(tna.shipment_date)}</span>
            <span className="tna-kpi-foot" style={shipDays !== null && shipDays < 0 ? { color: "#b91c1c", fontWeight: 600 } : undefined}>
              {shipDays === null ? "No shipment date" : shipDays < 0 ? `${-shipDays} days past — not marked shipped` : `${relDays(shipDays)}`}
            </span>
          </div>
          <div className="tna-card tna-kpi">
            <span className="tna-kpi-label">Approval progress</span>
            <span className="tna-kpi-value">{tna.progress_percentage}%</span>
            <ProgressBar tna={tna} showLabel={false} />
          </div>
          <div className="tna-card tna-kpi">
            <span className="tna-kpi-label">Next milestone</span>
            <span className="tna-kpi-value" style={{ fontSize: 20 }}>{tna.next_milestone?.label || "—"}</span>
            <span className="tna-kpi-foot">{tna.next_milestone ? `${fmtDate(tna.next_milestone.date)} · ${relDays(tna.next_milestone.days)}` : "Nothing upcoming"}</span>
          </div>
          <div className="tna-card tna-kpi">
            <span className="tna-kpi-label">Late approvals</span>
            <span className="tna-kpi-value" style={{ color: lateCount ? "#b91c1c" : undefined }}>{lateCount}</span>
            <span className="tna-kpi-foot">{lateCount ? "Past planned date, still pending" : "None"}</span>
          </div>
        </div>

        <section className="tna-card">
          <div className="tna-card-head">
            <div>
              <h2 className="tna-card-title">Approvals</h2>
              <p className="tna-card-sub">Mark a stage approved once it's actually approved — progress is Lab Dip 10% · Fabric 40% · Fit 20% · PP Sample 30%.</p>
            </div>
          </div>
          <div className="tna-card-body">
            <div className="tna-stages">
              {STAGES.map((s) => {
                const approved = tna[s.field] === "approved";
                const due = tna[s.dateField];
                const d = daysFromToday(due);
                const late = !approved && d !== null && d < 0;
                return (
                  <div key={s.field} className={`tna-stage ${approved ? "done" : late ? "late" : ""}`}>
                    <div className="tna-stage-top">
                      <span className="tna-stage-name">{s.label}</span>
                      <span className="tna-stage-weight">{s.weight}%</span>
                    </div>
                    <div className="tna-stage-meta">
                      {due ? <>Planned {fmtDate(due)} · <span style={late ? { color: "#b91c1c", fontWeight: 600 } : undefined}>{relDays(d)}</span></> : "No planned date"}
                    </div>
                    <button
                      type="button"
                      className={`tna-btn sm ${approved ? "ghost" : "primary"}`}
                      onClick={() => toggleStage(s)}
                      disabled={updating === s.field}
                    >
                      {approved ? <><FiCheck /> Approved · undo</> : updating === s.field ? "Saving…" : "Mark approved"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="tna-grid-3">
          <section className="tna-card">
            <div className="tna-card-head">
              <div>
                <h2 className="tna-card-title">Timeline</h2>
                <p className="tna-card-sub">Planned dates, calculated from order booking, shipment date and fabric type.</p>
              </div>
            </div>
            <div className="tna-card-body">
              {plan.length === 0 ? (
                <div className="tna-empty" style={{ padding: 20 }}>No dates yet — set order booking, shipment date and fabric type.</div>
              ) : (
                <ul className="tna-timeline">
                  {plan.map((m) => (
                    <li key={m.key} className={`${m.state} ${m.key === nextKey ? "next" : ""}`}>
                      <span className="tna-dot">{m.state === "done" ? "✓" : ""}</span>
                      <div>
                        <div className="tna-tl-label">
                          {m.label}{" "}
                          {m.state === "done" && <span className="tna-chip green" style={{ marginLeft: 6 }}>Approved</span>}
                          {m.state === "overdue" && <span className="tna-chip red" style={{ marginLeft: 6 }}>Approval late</span>}
                          {m.key === nextKey && <span className="tna-chip blue" style={{ marginLeft: 6 }}>Next</span>}
                        </div>
                        <div className="tna-tl-rule">{GROUP_LABEL[m.group]}{m.rule ? ` · ${m.rule}` : ""}</div>
                      </div>
                      <div className="tna-tl-date">
                        <b>{fmtDate(m.date)}</b>
                        <span>{relDays(m.days)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="tna-card" style={{ alignSelf: "start" }}>
            <div className="tna-card-head">
              <div>
                <h2 className="tna-card-title">Order details</h2>
                <p className="tna-card-sub">Snapshot taken from the order — use “Refresh from order” after the order changes.</p>
              </div>
            </div>
            <div className="tna-card-body">
              <dl className="tna-dl">
                <div><dt>Order NO</dt><dd>{tna.order_no || "—"}</dd></div>
                <div><dt>PO</dt><dd>{tna.po_no || "—"}</dd></div>
                <div><dt>Customer</dt><dd>{tna.customer_name || "—"}</dd></div>
                <div><dt>Supplier</dt><dd>{tna.supplier_name || "—"}</dd></div>
                <div><dt>Item</dt><dd>{tna.item || "—"}</dd></div>
                <div><dt>Gender</dt><dd>{tna.gender || "—"}</dd></div>
                <div><dt>Total qty</dt><dd>{tna.total_qty ? Number(tna.total_qty).toLocaleString("en-US") : "—"}</dd></div>
                <div><dt>Size range</dt><dd>{tna.size_range || "—"}</dd></div>
                <div><dt>WGR</dt><dd>{tna.wgr || "—"}</dd></div>
                <div><dt>Fabric supplier</dt><dd>{tna.fabric_supplier || "—"}</dd></div>
                <div style={{ gridColumn: "1 / -1" }}><dt>Fabrication</dt><dd>{tna.fabrication || "—"}</dd></div>
                <div style={{ gridColumn: "1 / -1" }}><dt>Remarks</dt><dd style={{ whiteSpace: "pre-wrap" }}>{tna.remarks || "—"}</dd></div>
              </dl>
              {tna.order && (
                <Link to={`/orders/${tna.order}`} className="tna-btn ghost sm" style={{ marginTop: 16 }}>
                  <FiExternalLink /> Open order
                </Link>
              )}
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this TNA?"
        message={<>The Time & Action plan for <b>{tna.order_no}</b> will be removed. The order itself is not affected.</>}
        confirmLabel="Delete TNA"
        danger
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>,
  );
}
