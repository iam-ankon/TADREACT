// Delete-supplier confirmation (Suppliers list + details).
//
// A supplier is shared with CSR. Deleting it unlinks its orders and lab
// reports (SET_NULL) and DELETES its inquiry supplier prices, monthly
// capacity records, capacity snapshots and QC factory assignments
// (CASCADE). So the user always types the name, and sees the order count.
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiAlertTriangle, FiTrash2, FiX } from "react-icons/fi";
import { merchandiserApi } from "../../api/merchandiser";

const API = "http://119.148.51.38:8000/api/csr/api/supplier/";

export default function SupplierDeleteModal({ supplier, onClose, onDeleted }) {
  const name = supplier.supplier_name || `Supplier #${supplier.id}`;
  const [orderCount, setOrderCount] = useState(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const confirmed = typed.trim().toLowerCase() === name.trim().toLowerCase();

  useEffect(() => {
    let alive = true;
    merchandiserApi
      .get("orders/", { params: { supplier: supplier.id, page_size: 1 } })
      .then((res) => alive && setOrderCount(res.data?.count ?? null))
      .catch(() => alive && setOrderCount(null));
    return () => {
      alive = false;
    };
  }, [supplier.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!confirmed) return;
    setBusy(true);
    setError("");
    try {
      await axios.delete(`${API}${supplier.id}/`, { headers: { Authorization: `Token ${localStorage.getItem("token")}` } });
      onDeleted(supplier);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete the supplier.");
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
      <form className="ag-card" style={{ width: "100%", maxWidth: 500, boxShadow: "0 24px 64px rgba(15,23,42,.28)" }} onSubmit={submit}>
        <div className="ag-section-head">
          <h2 style={{ color: "#b91c1c" }}>
            <FiTrash2 style={{ color: "#b91c1c" }} /> Delete supplier
          </h2>
          <button type="button" className="ag-icon-btn" onClick={onClose} title="Close" disabled={busy}>
            <FiX />
          </button>
        </div>
        <div className="ag-section-body">
          <p style={{ margin: "0 0 12px", fontSize: 14 }}>
            Delete <b>{name}</b>? It is removed for <b>CSR as well</b> (same supplier record).
          </p>
          <div className="ag-alert err" style={{ marginBottom: 12 }}>
            <FiAlertTriangle />
            <span>
              {orderCount === null ? "Its orders" : `${orderCount.toLocaleString()} order(s)`} and lab reports lose their supplier. Its
              inquiry supplier prices, monthly capacity records and QC factory assignments are deleted. Certificates and documents go
              with it.
            </span>
          </div>
          <div className="ag-field" style={{ marginBottom: 0 }}>
            <label htmlFor="sdm-confirm">
              <span>
                Type <b>{name}</b> to confirm
              </span>
            </label>
            <input
              id="sdm-confirm"
              className="ag-input ag-plain-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              disabled={busy}
            />
          </div>
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
              {busy ? <span className="ag-spinner sm" /> : <FiTrash2 />} {busy ? "Deleting…" : "Delete supplier"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
