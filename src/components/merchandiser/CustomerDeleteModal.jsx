// Delete-customer confirmation shared by the Customers list and details page.
//
// Deleting a customer does NOT delete its orders/inquiries, but unlinks them
// (Order.customer / Inquiry.customer are SET_NULL) - they would drop out of
// every customer filter, dashboard and scorecard. So when the customer has
// orders or inquiries, the user must type the customer's name to confirm.
import React, { useState } from "react";
import { FiAlertTriangle, FiTrash2, FiX } from "react-icons/fi";
import { merchandiserApi } from "../../api/merchandiser";
import { customerName } from "./agentTheme";

export default function CustomerDeleteModal({ customer, onClose, onDeleted }) {
  const name = customerName(customer);
  const orders = customer.order_count || 0;
  const inquiries = customer.inquiry_count || 0;
  // Unknown counts (older API without order_count) are treated as risky.
  const countsUnknown = customer.order_count === undefined || customer.inquiry_count === undefined;
  const risky = countsUnknown || orders > 0 || inquiries > 0;
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const confirmed = !risky || typed.trim().toLowerCase() === name.trim().toLowerCase();

  const submit = async (e) => {
    e.preventDefault();
    if (!confirmed) return;
    setBusy(true);
    setError("");
    try {
      await merchandiserApi.delete(`customer/${customer.id}/`);
      onDeleted(customer);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete the customer.");
      setBusy(false);
    }
  };

  return (
    <div
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(15,23,42,.45)",
        backdropFilter: "blur(2px)",
      }}
    >
      <form className="ag-card" style={{ width: "100%", maxWidth: 480, boxShadow: "0 24px 64px rgba(15,23,42,.28)" }} onSubmit={submit}>
        <div className="ag-section-head">
          <h2 style={{ color: "#b91c1c" }}>
            <FiTrash2 style={{ color: "#b91c1c" }} /> Delete customer
          </h2>
          <button type="button" className="ag-icon-btn" onClick={onClose} title="Close" disabled={busy}>
            <FiX />
          </button>
        </div>
        <div className="ag-section-body">
          <p style={{ margin: "0 0 12px", fontSize: 14 }}>
            Delete <b>{name}</b>?
          </p>
          {risky ? (
            <>
              <div className="ag-alert err" style={{ marginBottom: 12 }}>
                <FiAlertTriangle />
                <span>
                  {countsUnknown
                    ? "This customer may have orders and inquiries."
                    : `${orders.toLocaleString()} order(s) and ${inquiries.toLocaleString()} inquiry(ies) belong to this customer.`}{" "}
                  They are not
                  deleted, but they lose their customer and drop out of customer filters, dashboards and scorecards. This can't be undone
                  from here.
                </span>
              </div>
              <div className="ag-field" style={{ marginBottom: 0 }}>
                <label htmlFor="cdm-confirm">
                  <span>
                    Type <b>{name}</b> to confirm
                  </span>
                </label>
                <input
                  id="cdm-confirm"
                  className="ag-input ag-plain-input"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoFocus
                  disabled={busy}
                />
              </div>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 13.5, color: "#64748b" }}>
              It has no orders or inquiries. Buyers linked to it are only unlinked. The HRMS customer record is kept.
            </p>
          )}
          {error && (
            <div className="ag-alert err" style={{ marginTop: 12, marginBottom: 0 }}>
              <FiAlertTriangle />
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="ag-form-foot">
          <div className="right">
            <button type="button" className="ag-btn ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              type="submit"
              className="ag-btn primary"
              style={{ background: confirmed ? "#b91c1c" : undefined, boxShadow: "none" }}
              disabled={busy || !confirmed}
            >
              {busy ? <span className="ag-spinner sm" /> : <FiTrash2 />} {busy ? "Deleting…" : "Delete customer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
