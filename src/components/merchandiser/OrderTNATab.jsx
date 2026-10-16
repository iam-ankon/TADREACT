// T&A tab on the order details page: progress, approval stages (approve / undo
// when allowed) and the planned-date timeline. Same pieces as TNADetails.jsx.
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiAlertTriangle, FiCheck, FiEdit2, FiExternalLink, FiPlus } from "react-icons/fi";
import {
  GROUP_LABEL, ProgressBar, STAGES, TNA_CSS, apiError, daysFromToday, fmtDate, milestonePlan, relDays, tnaApi,
} from "./tnaShared";

export default function OrderTNATab({ tna, loading, canEdit, onUpdated }) {
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState(null);

  // TNA_CSS styles live under .tna-app; undo its full-page layout here.
  const wrap = (content) => (
    <div className="tna-app" style={{ height: "auto", overflow: "visible", background: "transparent" }}>
      <style>{TNA_CSS}</style>
      {content}
    </div>
  );

  if (loading) return wrap(<span className="tna-skel" style={{ display: "block", height: 160 }} />);

  if (!tna) {
    return wrap(
      <div className="tna-card tna-empty" style={{ padding: 30 }}>
        <b>No Time & Action plan for this order yet.</b>
        {canEdit && (
          <Link className="tna-btn primary sm" to="/create-tna" style={{ marginTop: 10 }}><FiPlus /> New TNA</Link>
        )}
      </div>,
    );
  }

  const toggleStage = async (stage) => {
    const next = tna[stage.field] === "approved" ? "pending" : "approved";
    setUpdating(stage.field);
    setError(null);
    try {
      const res = await tnaApi.patch(`tna/${tna.id}/`, { [stage.field]: next });
      onUpdated(res.data);
    } catch (err) {
      setError(apiError(err, `Couldn't update ${stage.label}.`));
    } finally {
      setUpdating(null);
    }
  };

  const plan = milestonePlan(tna);
  const nextKey = plan.find((m) => m.state === "upcoming")?.key;
  const shipDays = daysFromToday(tna.shipment_date);
  const lateCount = new Set(plan.filter((m) => m.state === "overdue").map((m) => m.stage)).size;

  return wrap(
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && (
        <div className="tna-alert err"><FiAlertTriangle /><span>{error}</span></div>
      )}

      <div className="tna-kpis">
        <div className="tna-card tna-kpi">
          <span className="tna-kpi-label">Shipment</span>
          <span className="tna-kpi-value" style={{ fontSize: 20 }}>{fmtDate(tna.shipment_date)}</span>
          <span className="tna-kpi-foot" style={shipDays !== null && shipDays < 0 ? { color: "#b91c1c", fontWeight: 600 } : undefined}>
            {shipDays === null ? "No shipment date" : shipDays < 0 ? `${-shipDays} days past` : relDays(shipDays)}
          </span>
        </div>
        <div className="tna-card tna-kpi">
          <span className="tna-kpi-label">Approval progress</span>
          <span className="tna-kpi-value">{tna.progress_percentage}%</span>
          <ProgressBar tna={tna} showLabel={false} />
        </div>
        <div className="tna-card tna-kpi">
          <span className="tna-kpi-label">Next milestone</span>
          <span className="tna-kpi-value" style={{ fontSize: 18 }}>{tna.next_milestone?.label || "—"}</span>
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
            <p className="tna-card-sub">Lab Dip 10% · Fabric 40% · Fit 20% · PP Sample 30%</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link className="tna-btn ghost sm" to={`/tna-details/${tna.id}`}><FiExternalLink /> Open full T&A</Link>
            {canEdit && <Link className="tna-btn ghost sm" to={`/edit-tna/${tna.id}`}><FiEdit2 /> Edit</Link>}
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
                  {canEdit ? (
                    <button type="button" className={`tna-btn sm ${approved ? "ghost" : "primary"}`}
                      onClick={() => toggleStage(s)} disabled={updating === s.field}>
                      {approved ? <><FiCheck /> Approved · undo</> : updating === s.field ? "Saving…" : "Mark approved"}
                    </button>
                  ) : (
                    <span className={`tna-chip ${approved ? "green" : late ? "red" : "grey"}`}>{approved ? "Approved" : late ? "Late" : "Pending"}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="tna-card">
        <div className="tna-card-head">
          <div>
            <h2 className="tna-card-title">Timeline</h2>
            <p className="tna-card-sub">Planned dates from order booking, shipment date and fabric type.</p>
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
    </div>,
  );
}
