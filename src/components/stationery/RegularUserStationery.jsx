// RegularUserStationery.jsx - "My Requests": an employee requests stationery
// and follows their own requests. Shared look: stationeryTheme.js.
//
// Kept from the earlier version: the employee comes from current_employee/,
// a new request shows in the list immediately (optimistic row) and the list
// reloads from the server a second later; the request list reader accepts
// several response shapes.
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiEdit3,
  FiInbox,
  FiPackage,
  FiRefreshCw,
  FiSend,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { REQUEST_TONE, STATIONERY_CSS, apiError, fmtDateTime } from "./stationeryTheme";

const API_BASE = "http://119.148.51.38:8000/api/hrms/api/";

const getCSRFToken = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="))
    ?.split("=")[1] || "";

const getAuthHeaders = () => ({
  Authorization: `Token ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
  "X-CSRFToken": getCSRFToken(),
});

const getStockStatus = (item) => {
  if (!item) return "Unknown";
  if (item.current_stock <= 0) return "Out of Stock";
  if (item.current_stock <= item.reorder_level) return "Low Stock";
  return "In Stock";
};

// Pull an array out of whatever shape the API answered with.
const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const key of ["results", "data", "stationery_usage"]) {
    if (Array.isArray(data[key])) return data[key];
  }
  if (data.id && data.stationery_item) return [data];
  const firstArray = Object.values(data).find(Array.isArray);
  return firstArray || [];
};

const relative = (iso) => {
  if (!iso) return "Just now";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return fmtDateTime(iso);
};

const EMPTY_FORM = { stationery_item: "", quantity: 1, purpose: "", remarks: "" };

const RegularUserStationery = () => {
  const [items, setItems] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(false); // submitting
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [requestForm, setRequestForm] = useState(EMPTY_FORM);

  const fetchCurrentEmployee = async () => {
    try {
      const response = await axios.get(`${API_BASE}current_employee/`, {
        headers: getAuthHeaders(),
        params: { employee_id: localStorage.getItem("employee_id") || "", _t: Date.now() },
      });
      setCurrentEmployee(response.data);
      return response.data;
    } catch {
      return null;
    }
  };

  const fetchStationeryItems = async () => {
    try {
      const response = await axios.get(`${API_BASE}stationery_items/`, {
        headers: getAuthHeaders(),
        params: { _t: Date.now() },
      });
      setItems(asArray(response.data));
    } catch {
      setError("Failed to load stationery items.");
      setItems([]);
    }
  };

  const fetchMyRequests = async (employee = currentEmployee) => {
    if (!employee?.id) {
      setMyRequests([]);
      return [];
    }
    try {
      const response = await axios.get(`${API_BASE}stationery_usage/`, {
        headers: getAuthHeaders(),
        params: { _t: Date.now(), employee: employee.id },
      });
      const requests = asArray(response.data)
        .map((req, index) => ({
          id: req.id || `temp-${Date.now()}-${index}`,
          stationery_item: req.stationery_item,
          quantity: req.quantity || 1,
          purpose: req.purpose || "",
          remarks: req.remarks || "",
          status: req.status || "pending",
          date_requested: req.date_requested || req.created_at || new Date().toISOString(),
          date_issued: req.date_issued,
          stationery_name:
            req.stationery_name ||
            req.stationery_item_name ||
            req.stationery_item?.name ||
            items.find((i) => i.id === req.stationery_item)?.name ||
            `Item #${req.stationery_item}`,
          unit: req.unit || "pcs",
        }))
        .sort((a, b) => new Date(b.date_requested) - new Date(a.date_requested));
      setMyRequests(requests);
      return requests;
    } catch (err) {
      setError(`Failed to load your requests: ${err.message}`);
      setMyRequests([]);
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      const [employee] = await Promise.all([fetchCurrentEmployee(), fetchStationeryItems()]);
      await fetchMyRequests(employee);
      setInitialLoad(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedItem = items.find((i) => String(i.id) === String(requestForm.stationery_item));
  const tooMany = selectedItem && Number(requestForm.quantity) > Number(selectedItem.current_stock || 0);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!requestForm.stationery_item) {
      setError("Please select a stationery item.");
      return;
    }
    if (!requestForm.purpose.trim()) {
      setError("Please say what you need it for.");
      return;
    }
    setLoading(true);
    const requestData = {
      stationery_item: parseInt(requestForm.stationery_item, 10),
      quantity: parseInt(requestForm.quantity, 10) || 1,
      purpose: requestForm.purpose.trim(),
      remarks: requestForm.remarks.trim(),
      employee: currentEmployee?.id,
    };
    try {
      const response = await axios.post(`${API_BASE}stationery_usage/`, requestData, { headers: getAuthHeaders() });
      setSuccess("Your request was submitted. You'll see its status here once it's reviewed.");
      // Show it straight away; the reload below replaces it with the server's copy.
      setMyRequests((prev) => [
        {
          id: response.data?.id || `temp-${Date.now()}`,
          stationery_item: requestData.stationery_item,
          stationery_name: selectedItem?.name || `Item #${requestData.stationery_item}`,
          quantity: requestData.quantity,
          purpose: requestData.purpose,
          remarks: requestData.remarks,
          status: "pending",
          date_requested: new Date().toISOString(),
          unit: selectedItem?.unit || "pcs",
        },
        ...prev,
      ]);
      setRequestForm(EMPTY_FORM);
      setTimeout(() => {
        fetchMyRequests();
        fetchStationeryItems();
      }, 1000);
      setTimeout(() => setSuccess(""), 6000);
    } catch (err) {
      setError(apiError(err, "Failed to submit the request."));
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = async () => {
    setRefreshing(true);
    setError("");
    const [employee] = await Promise.all([fetchCurrentEmployee(), fetchStationeryItems()]);
    await fetchMyRequests(employee || currentEmployee);
    setRefreshing(false);
  };

  const counts = useMemo(() => {
    const c = { all: myRequests.length };
    ["pending", "approved", "issued", "rejected"].forEach((s) => {
      c[s] = myRequests.filter((r) => r.status === s).length;
    });
    return c;
  }, [myRequests]);

  const shown = statusFilter === "all" ? myRequests : myRequests.filter((r) => r.status === statusFilter);
  const sortedItems = [...items].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  if (initialLoad) {
    return (
      <div className="sp-app">
        <style>{STATIONERY_CSS}</style>
        <div className="sp-loading">
          <div className="sp-spinner" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="sp-app">
      <style>{STATIONERY_CSS}</style>

      <header className="sp-header">
        <div>
          <div className="sp-eyebrow">Stationery</div>
          <h1 className="sp-title">My Requests</h1>
          <p className="sp-subtitle">
            {currentEmployee
              ? `${currentEmployee.name}${currentEmployee.designation ? ` · ${currentEmployee.designation}` : ""}${
                  currentEmployee.department?.department_name ? ` · ${currentEmployee.department.department_name}` : ""
                }`
              : "Request office supplies and follow their status."}
          </p>
        </div>
        <div className="sp-actions">
          <button type="button" className="sp-btn ghost" onClick={refreshAllData} disabled={refreshing}>
            <FiRefreshCw className={refreshing ? "sp-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      <div className="sp-body">
        {error && (
          <div className="sp-alert err">
            <FiAlertCircle />
            <span>{error}</span>
            <button type="button" className="sp-icon-btn" onClick={() => setError("")} title="Dismiss">
              <FiX />
            </button>
          </div>
        )}
        {success && (
          <div className="sp-alert ok">
            <FiCheckCircle />
            <span>{success}</span>
            <button type="button" className="sp-icon-btn" onClick={() => setSuccess("")} title="Dismiss">
              <FiX />
            </button>
          </div>
        )}
        {!currentEmployee && (
          <div className="sp-alert info">
            <FiAlertCircle />
            <span>Your employee profile could not be loaded, so you can't submit requests yet. Try Refresh, or contact HR.</span>
          </div>
        )}

        <div className="sp-two">
          {/* My requests */}
          <section className="sp-card">
            <div className="sp-card-head">
              <h2>
                <FiClipboard /> My requests <span className="sp-count">{myRequests.length}</span>
              </h2>
            </div>
            <div className="sp-toolbar">
              <div className="sp-seg" aria-label="Status">
                {["all", "pending", "approved", "issued", "rejected"].map((s) => (
                  <button key={s} type="button" className={statusFilter === s ? "on" : ""} onClick={() => setStatusFilter(s)}>
                    {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                    <span className="n">{counts[s]}</span>
                  </button>
                ))}
              </div>
            </div>
            {shown.length === 0 ? (
              <div className="sp-state">
                <div className="sp-state-icon">
                  <FiInbox />
                </div>
                <h3>{myRequests.length === 0 ? "No requests yet" : "Nothing here"}</h3>
                <p>
                  {myRequests.length === 0
                    ? "Use the form to request what you need."
                    : "You have no requests with this status."}
                </p>
              </div>
            ) : (
              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="num">Qty</th>
                      <th>Purpose</th>
                      <th>Requested</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => (
                      <tr key={r.id}>
                        <td className="strong">{r.stationery_name}</td>
                        <td className="num nowrap">
                          <span className="strong">{r.quantity}</span> <span className="muted small">{r.unit}</span>
                        </td>
                        <td>
                          <span className="sp-clamp muted" title={r.purpose}>
                            {r.purpose || "—"}
                          </span>
                          {r.status === "rejected" && r.remarks && (
                            <span className="sp-cell-sub" style={{ color: "#b91c1c", whiteSpace: "pre-wrap" }}>
                              {r.remarks}
                            </span>
                          )}
                        </td>
                        <td className="muted nowrap" title={fmtDateTime(r.date_requested)}>
                          {relative(r.date_requested)}
                          {r.date_issued && <span className="sp-cell-sub">Issued {fmtDateTime(r.date_issued)}</span>}
                        </td>
                        <td>
                          <span className={`sp-pill ${REQUEST_TONE[r.status] || "gray"}`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* New request */}
            <form className="sp-card" onSubmit={handleSubmitRequest}>
              <div className="sp-card-head">
                <h2>
                  <FiEdit3 /> New request
                </h2>
              </div>
              <div className="sp-card-body">
                <div className="sp-field">
                  <label>
                    Item <span className="req">*</span>
                  </label>
                  <select
                    className="sp-input"
                    value={requestForm.stationery_item}
                    onChange={(e) => setRequestForm({ ...requestForm, stationery_item: e.target.value })}
                    required
                    disabled={loading || !currentEmployee}
                  >
                    <option value="">Select an item…</option>
                    {sortedItems.map((item) => (
                      <option key={item.id} value={item.id} disabled={item.current_stock <= 0}>
                        {item.name} — {getStockStatus(item)}
                      </option>
                    ))}
                  </select>
                  {selectedItem && (
                    <div className={`sp-hint ${getStockStatus(selectedItem) === "In Stock" ? "" : "warn"}`}>
                      {selectedItem.current_stock} {selectedItem.unit} available
                    </div>
                  )}
                </div>
                <div className="sp-field">
                  <label>Quantity</label>
                  <input
                    className="sp-input"
                    type="number"
                    min="1"
                    value={requestForm.quantity}
                    onChange={(e) => setRequestForm({ ...requestForm, quantity: e.target.value })}
                    disabled={loading || !currentEmployee}
                  />
                  {tooMany && <div className="sp-hint err">More than is in stock — the request will be refused.</div>}
                </div>
                <div className="sp-field">
                  <label>
                    Purpose <span className="req">*</span>
                  </label>
                  <textarea
                    className="sp-input"
                    rows={3}
                    value={requestForm.purpose}
                    onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                    placeholder="What do you need it for?"
                    required
                    disabled={loading || !currentEmployee}
                  />
                </div>
                <div className="sp-field">
                  <label>Remarks</label>
                  <textarea
                    className="sp-input"
                    rows={2}
                    value={requestForm.remarks}
                    onChange={(e) => setRequestForm({ ...requestForm, remarks: e.target.value })}
                    placeholder="Optional"
                    disabled={loading || !currentEmployee}
                  />
                </div>
                <button
                  type="submit"
                  className="sp-btn primary"
                  style={{ width: "100%" }}
                  disabled={loading || !currentEmployee}
                >
                  <FiSend /> {loading ? "Submitting…" : "Submit request"}
                </button>
              </div>
            </form>

            {/* Summary */}
            <section className="sp-card">
              <div className="sp-card-head">
                <h2>Summary</h2>
              </div>
              <ul className="sp-stat-list">
                <li>
                  <span className="muted">
                    <FiClipboard style={{ verticalAlign: -2, marginRight: 6 }} />
                    Total requests
                  </span>
                  <b>{counts.all}</b>
                </li>
                <li>
                  <span className="muted">
                    <FiClock style={{ verticalAlign: -2, marginRight: 6 }} />
                    Waiting for approval
                  </span>
                  <b style={{ color: "#b45309" }}>{counts.pending}</b>
                </li>
                <li>
                  <span className="muted">
                    <FiCheckCircle style={{ verticalAlign: -2, marginRight: 6 }} />
                    Approved, ready to collect
                  </span>
                  <b style={{ color: "#1d4ed8" }}>{counts.approved}</b>
                </li>
                <li>
                  <span className="muted">
                    <FiPackage style={{ verticalAlign: -2, marginRight: 6 }} />
                    Issued
                  </span>
                  <b style={{ color: "#15803d" }}>{counts.issued}</b>
                </li>
                <li>
                  <span className="muted">
                    <FiXCircle style={{ verticalAlign: -2, marginRight: 6 }} />
                    Rejected
                  </span>
                  <b style={{ color: "#b91c1c" }}>{counts.rejected}</b>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegularUserStationery;
