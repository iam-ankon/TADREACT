import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebars from "./sidebars";
import { getLeaveForm } from "../../api/employeeApi";

// Printable leave application form. All numbers come from the backend
// (GET employee_leaves/:id/form/, hrms/leave_policy.py leave_form_status) so the
// Leave Status table always adds up: entitled − availed = balance before,
// balance before − paid = balance after; days beyond the balance are unpaid.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10-01" -> "01 Oct 2026" (parsed as a calendar date, no timezone shift)
const fmtDate = (value) => {
  if (!value) return "";
  const [y, m, d] = String(value).split("T")[0].split("-").map(Number);
  if (!y || !m || !d) return String(value);
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`;
};

const STATUS = {
  approved: { label: "Approved", className: "lf-stamp lf-stamp--approved" },
  pending: { label: "Pending", className: "lf-stamp lf-stamp--pending" },
  rejected: { label: "Rejected", className: "lf-stamp lf-stamp--rejected" },
};

const Field = ({ label, value, wide }) => (
  <div className={`lf-field${wide ? " lf-field--wide" : ""}`}>
    <span className="lf-label">{label}</span>
    <span className="lf-value">{value || <span className="lf-empty">—</span>}</span>
  </div>
);

const SignatureLine = ({ label }) => (
  <div className="lf-sign">
    <div className="lf-sign-line" />
    <span>{label}</span>
  </div>
);

const LeaveRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getLeaveForm(id)
      .then((res) => active && setData(res.data))
      .catch((err) => {
        if (!active) return;
        setError(
          err.response?.status === 404
            ? "This leave request was not found, or you don't have access to it."
            : "Could not load the leave request. Please try again.",
        );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const shell = (content) => (
    <div className="lf-page">
      <style>{CSS}</style>
      <div className="lf-sidebar">
        <Sidebars />
      </div>
      <main className="lf-main">{content}</main>
    </div>
  );

  if (loading) return shell(<div className="lf-message">Loading leave request…</div>);
  if (error || !data)
    return shell(
      <div className="lf-message lf-message--error">
        {error || "Leave request not found."}
        <button className="lf-btn" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>,
    );

  const { leave, employee, status_table: table, leave_type_label: typeLabel } = data;
  const status = STATUS[leave.status] || STATUS.pending;
  const days = leave.leave_days || table.rows.find((r) => r.applied_for)?.applied_for || 0;
  // The form is a record: paid/unpaid days and the balance after are only shown
  // once the leave is approved (final). Pending forecasts live on the approval page.
  const isFinal = table.split_is_final;
  const unpaid = isFinal ? table.unpaid_days || 0 : 0;

  const statusRows = [
    { key: "entitled", label: "Leave entitled" },
    { key: "availed", label: "Leave availed (before this)" },
    { key: "balance_before", label: "Balance before this leave" },
    { key: "applied_for", label: "Applied for" },
    ...(isFinal
      ? [
          { key: "paid_days", label: "Paid from balance" },
          // Casual and Sick share one pool: days taken from the other type
          ...(table.borrowed_days > 0
            ? [{ key: "borrowed_days", label: "Used from this balance" }]
            : []),
          ...(unpaid > 0 ? [{ key: "unpaid_days", label: "Unpaid (salary deduction)" }] : []),
          { key: "balance_after", label: "Balance after" },
        ]
      : []),
  ];

  return shell(
    <>
      <div className="lf-toolbar">
        <button className="lf-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="lf-toolbar-right">
          <button className="lf-btn" onClick={() => navigate(`/edit-leave-request/${leave.id}`)}>
            Review / Edit
          </button>
          <button className="lf-btn lf-btn--primary" onClick={() => window.print()}>
            Print form
          </button>
        </div>
      </div>

      <article className="lf-sheet">
        <header className="lf-head">
          <div>
            <div className="lf-company">{employee.company || "TAD Group"}</div>
            <h1 className="lf-title">Leave Application Form</h1>
            <div className="lf-ref">
              Application #{leave.id} · Applied on {fmtDate(leave.date) || "—"}
            </div>
          </div>
          <div className={status.className}>{status.label}</div>
        </header>

        <section className="lf-section">
          <h2 className="lf-h2">Applicant</h2>
          <div className="lf-grid">
            <Field label="Name" value={employee.name} />
            <Field label="Employee ID" value={employee.employee_id} />
            <Field label="Designation" value={employee.designation} />
            <Field label="Department" value={employee.department} />
            <Field label="Joining date" value={fmtDate(employee.joining_date)} />
            <Field label="Reporting leader" value={employee.reporting_leader} />
            <Field label="Mobile no." value={employee.phone} />
            <Field label="Submitted to" value={leave.receiver_name || leave.to_email} />
          </div>
        </section>

        <section className="lf-section">
          <h2 className="lf-h2">Leave requested</h2>
          <p className="lf-statement">
            I wish to apply for <strong>{days} day{days === 1 ? "" : "s"}</strong> of{" "}
            <strong>{typeLabel}</strong> from <strong>{fmtDate(leave.start_date)}</strong> to{" "}
            <strong>{fmtDate(leave.end_date)}</strong>.
          </p>
          <div className="lf-grid">
            <Field label="Reason for leave" value={leave.reason} wide />
            <Field label="Whereabouts during leave" value={leave.whereabouts} />
            <Field label="Substitute person" value={leave.sub_person} />
            <Field label="Expected joining date" value={fmtDate(leave.date_of_joining_after_leave)} />
          </div>
          {unpaid > 0 && (
            <div className="lf-alert">
              <strong>
                {unpaid} of {days} day{days === 1 ? "" : "s"}{" "}
                are unpaid
              </strong>{" "}
              — Casual and Sick leave were both used up. One day's basic salary is deducted for
              each unpaid day.
            </div>
          )}
          <div className="lf-signs lf-signs--two">
            <SignatureLine label="Signature of substitute" />
            <SignatureLine label="Signature of applicant" />
          </div>
        </section>

        <section className="lf-section">
          <h2 className="lf-h2">Leave status (for official use)</h2>
          <table className="lf-table">
            <thead>
              <tr>
                <th />
                {table.rows.map((row) => (
                  <th
                    key={row.leave_type}
                    className={row.leave_type === leave.leave_type ? "lf-col-applied" : undefined}
                  >
                    {row.label}
                    {row.paused && <span className="lf-paused">paused</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statusRows.map(({ key, label }) => (
                <tr key={key} className={key === "unpaid_days" && unpaid > 0 ? "lf-row-unpaid" : undefined}>
                  <td className="lf-rowhead">{label}</td>
                  {table.rows.map((row) => (
                    <td
                      key={row.leave_type}
                      className={row.leave_type === leave.leave_type ? "lf-col-applied" : undefined}
                    >
                      {row[key] ?? "–"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="lf-grid">
            <Field label="Team leader comment" value={leave.teamleader} wide />
            <Field label="HR comment" value={leave.hrcomment} wide />
            <Field label="Management comment" value={leave.comment} wide />
          </div>
          <div className="lf-signs">
            <SignatureLine label="Head of Department" />
            <SignatureLine label="HR & Admin" />
            <SignatureLine label="Authorized signature" />
          </div>
        </section>

        <section className="lf-section">
          <h2 className="lf-h2">Report on joining after leave</h2>
          <div className="lf-grid">
            <Field label="Scheduled joining date" value={fmtDate(leave.date_of_joining_after_leave)} />
            <Field label="Actual joining date" value={fmtDate(leave.actual_date_of_joining)} />
            <Field label="Reason for delay" value={leave.reson_for_delay} wide />
          </div>
          <div className="lf-signs">
            <SignatureLine label="Applicant signature" />
            <SignatureLine label="HR & Admin" />
            <SignatureLine label="Authorized signature" />
          </div>
        </section>
      </article>
    </>,
  );
};

const CSS = `
.lf-page { display: flex; min-height: 100vh; background: #f1f4f8; }
.lf-main { flex: 1; min-width: 0; padding: 24px 16px 48px; overflow-y: auto; max-height: 100vh; box-sizing: border-box; }
.lf-message { max-width: 794px; margin: 48px auto; padding: 24px; background: #fff; border-radius: 10px;
  text-align: center; color: #475569; display: flex; flex-direction: column; gap: 16px; align-items: center; }
.lf-message--error { color: #991b1b; }

.lf-toolbar { max-width: 794px; margin: 0 auto 16px; display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.lf-toolbar-right { display: flex; gap: 8px; }
.lf-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; color: #1e293b;
  font-size: 14px; font-weight: 500; cursor: pointer; }
.lf-btn:hover { background: #f8fafc; }
.lf-btn--primary { background: #1e40af; border-color: #1e40af; color: #fff; }
.lf-btn--primary:hover { background: #1e3a8a; }

.lf-sheet { max-width: 794px; margin: 0 auto; background: #fff; border-radius: 10px; padding: 36px 40px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, .08), 0 8px 24px rgba(15, 23, 42, .06);
  color: #0f172a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  font-size: 13px; line-height: 1.45; box-sizing: border-box; }

.lf-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
  padding-bottom: 16px; border-bottom: 2px solid #0f172a; }
.lf-company { font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #475569; }
.lf-title { margin: 2px 0 4px; font-size: 22px; font-weight: 700; letter-spacing: .02em; text-transform: uppercase; }
.lf-ref { font-size: 12px; color: #64748b; }
.lf-stamp { flex-shrink: 0; padding: 6px 14px; border: 2px solid; border-radius: 6px; font-weight: 700;
  font-size: 13px; letter-spacing: .1em; text-transform: uppercase; transform: rotate(-4deg); margin-top: 6px; }
.lf-stamp--approved { color: #15803d; border-color: #15803d; }
.lf-stamp--pending { color: #b45309; border-color: #b45309; }
.lf-stamp--rejected { color: #b91c1c; border-color: #b91c1c; }

.lf-section { padding: 18px 0 4px; border-bottom: 1px dashed #cbd5e1; }
.lf-section:last-child { border-bottom: 0; }
.lf-h2 { margin: 0 0 12px; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #1e40af; }

.lf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 28px; margin-bottom: 12px; }
.lf-field { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.lf-field--wide { grid-column: 1 / -1; }
.lf-label { font-size: 11px; color: #64748b; }
.lf-value { padding: 2px 0 4px; border-bottom: 1px solid #e2e8f0; font-weight: 500; overflow-wrap: anywhere; min-height: 18px; }
.lf-empty { color: #cbd5e1; }

.lf-statement { margin: 0 0 14px; padding: 10px 14px; background: #f8fafc; border-left: 3px solid #1e40af; font-size: 14px; }
.lf-alert { margin: 4px 0 12px; padding: 10px 14px; border: 1px solid #fcd34d; background: #fffbeb; color: #92400e; border-radius: 6px; }

.lf-table { width: 100%; border-collapse: collapse; margin: 0 0 14px; font-size: 12.5px; }
.lf-table th, .lf-table td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: center; }
.lf-table th { background: #f1f5f9; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
.lf-table .lf-rowhead { text-align: left; color: #334155; }
.lf-table .lf-col-applied { background: #eff6ff; font-weight: 700; }
.lf-table th.lf-col-applied { background: #dbeafe; color: #1e3a8a; }
.lf-row-unpaid td.lf-col-applied { background: #fef3c7; color: #92400e; }
.lf-paused { display: block; font-size: 9px; font-weight: 500; color: #94a3b8; text-transform: none; letter-spacing: 0; }

.lf-signs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin: 28px 0 14px; }
.lf-signs--two { grid-template-columns: 1fr 1fr; }
.lf-sign { text-align: center; font-size: 11px; color: #475569; }
.lf-sign-line { border-top: 1px solid #0f172a; margin-bottom: 4px; }

@media (max-width: 640px) {
  .lf-sheet { padding: 20px 16px; }
  .lf-grid { grid-template-columns: 1fr; }
  .lf-signs { grid-template-columns: 1fr; }
  .lf-head { flex-direction: column; }
}

@media print {
  @page { size: A4; margin: 10mm; }
  body * { visibility: hidden; }
  .lf-sheet, .lf-sheet * { visibility: visible; }
  .lf-sheet { position: absolute; left: 0; top: 0; width: 100%; max-width: none; margin: 0;
    padding: 0; box-shadow: none; border-radius: 0; font-size: 10.5pt; }
  .lf-main { max-height: none; overflow: visible; padding: 0; }
  .lf-section { padding-top: 10px; break-inside: avoid; }
  .lf-signs { margin: 22px 0 8px; }
  .lf-statement, .lf-alert, .lf-table th, .lf-table .lf-col-applied {
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

export default LeaveRequestDetails;
