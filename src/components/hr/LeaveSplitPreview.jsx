// Live paid/unpaid split for a leave request, from the backend leave policy
// (TADDJANGO/hrms/leave_policy.py). Casual and Sick share one pool: a request
// uses its own balance, then the other type's; only days beyond BOTH are
// unpaid (one day's basic salary deducted per unpaid day).
import React, { useEffect, useState } from "react";
import { getLeavePolicy, previewLeave } from "../../api/employeeApi";

const DEFAULT_POLICY = {
  earned_leave_enabled: true,
  unpaid_allowed_types: ["casual_leave", "sick_leave"],
};

// Leave policy for the forms (e.g. hide Earned Leave while it is paused).
export const useLeavePolicy = () => {
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  useEffect(() => {
    let active = true;
    getLeavePolicy()
      .then((res) => active && setPolicy({ ...DEFAULT_POLICY, ...res.data }))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return policy;
};

const LeaveSplitPreview = ({
  leaveType,
  startDate,
  endDate,
  employee, // DB id; only honoured for HR/full-access users
  excludeId, // leave being edited, so it doesn't reserve its own days
  atApproval = false, // split that approving now would give (real balance only)
  onChange,
}) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!leaveType || !startDate || !endDate || endDate < startDate) {
      setPreview(null);
      onChange?.(null);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      const params = { leave_type: leaveType, start_date: startDate, end_date: endDate };
      if (employee) params.employee = employee;
      if (excludeId) params.exclude = excludeId;
      if (atApproval) params.at_approval = 1;
      previewLeave(params)
        .then((res) => {
          if (!active) return;
          setPreview(res.data);
          onChange?.(res.data);
        })
        .catch(() => {
          if (!active) return;
          setPreview(null);
          onChange?.(null);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveType, startDate, endDate, employee, excludeId, atApproval]);

  if (!preview || !preview.days) return null;

  const box = (bg, border, color) => ({
    background: bg,
    border: `1px solid ${border}`,
    color,
    borderRadius: 8,
    padding: "12px 14px",
    margin: "12px 0",
    fontSize: 14,
    lineHeight: 1.5,
  });

  if (!preview.allowed) {
    return (
      <div style={box("#fef2f2", "#fecaca", "#991b1b")} role="alert">
        <strong>{atApproval ? "Note:" : "Cannot apply:"}</strong> {preview.message}
      </div>
    );
  }

  const borrowed = preview.borrowed_days || 0;
  const ownPaid = preview.own_paid_days ?? (preview.paid_days || 0) - borrowed;
  const borrowedFrom = preview.borrowed_from_label || "other leave";

  if (!preview.unpaid_days) {
    return (
      <div style={box("#f0fdf4", "#bbf7d0", "#166534")}>
        All {preview.days} day(s) are paid
        {borrowed > 0 ? (
          <>
            : <strong>{ownPaid}</strong> from this balance and <strong>{borrowed}</strong> from
            your {borrowedFrom} balance (this one is used up)
          </>
        ) : (
          <>
            {" "}from the{" "}
            {atApproval ? `current balance (${preview.balance} day(s))` : "leave balance"}
          </>
        )}
        {preview.reserved_by_pending > 0 &&
          ` (${preview.reserved_by_pending} day(s) already held by pending requests)`}
        .
      </div>
    );
  }

  return (
    <div style={box("#fffbeb", "#fcd34d", "#92400e")} role="status">
      <div style={{ fontWeight: 700, marginBottom: 4 }}>
        ⚠️ {preview.unpaid_days} of {preview.days} day(s) will be unpaid
      </div>
      <div>
        Paid from this balance: <strong>{ownPaid}</strong> day(s)
        {borrowed > 0 && (
          <>
            {" "}· From {borrowedFrom}: <strong>{borrowed}</strong> day(s)
          </>
        )}
        {" "}· Unpaid: <strong>{preview.unpaid_days}</strong> day(s)
        {preview.reserved_by_pending > 0 &&
          ` · ${preview.reserved_by_pending} day(s) of the balance are already held by pending requests`}
      </div>
      <div style={{ marginTop: 4 }}>
        Casual and Sick leave are both used up. {atApproval ? "If approved, one" : "One"} day's
        basic salary will be deducted from salary for each unpaid day.
      </div>
    </div>
  );
};

// Confirmation text before submitting a request with unpaid days (null = nothing to confirm).
export const unpaidConfirmText = (preview) =>
  preview?.allowed && preview.unpaid_days > 0
    ? `Casual and Sick leave are both used up: ${preview.unpaid_days} of ${preview.days} day(s) will be UNPAID.\n\n` +
      `One day's basic salary will be deducted for each unpaid day.\n\nSubmit anyway?`
    : null;

export default LeaveSplitPreview;
