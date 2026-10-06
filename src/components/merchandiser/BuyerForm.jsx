// Shared Add / Edit form for buyers (AddBuyer.jsx, EditBuyer.jsx).
//
// Saves exactly what the old pages saved: name, email, phone, remarks,
// customers (ids) and row_data [{department, wgr_number, item,
// product_category}] - the backend rebuilds the buyer's rows from row_data.
// All calls go through the authenticated merchandiser API (token sent).
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBriefcase,
  FiCheckCircle,
  FiChevronRight,
  FiCopy,
  FiLayers,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiPlus,
  FiSave,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import { merchandiserApi } from "../../api/merchandiser";
import { AGENT_CSS, customerName, initialsOf } from "./agentTheme";

const MAX = { name: 100, phone: 15 };
const newRow = () => ({ key: `${Date.now()}-${Math.random()}`, department: "", wgr: "", item: "", productCategory: "" });
const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

// Searchable multi-select for customers.
function CustomerMultiSelect({ customers, selected, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const chosen = customers.filter((c) => selected.includes(String(c.id)));
  const options = customers
    .filter((c) => !selected.includes(String(c.id)))
    .filter((c) => customerName(c).toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => customerName(a).localeCompare(customerName(b)));

  const add = (c) => {
    onChange([...selected, String(c.id)]);
    setSearch("");
    setActive(0);
  };

  return (
    <div className="ag-ms" ref={ref}>
      <div className="ag-ms-box" onClick={() => !disabled && setOpen(true)}>
        {chosen.map((c) => (
          <span key={c.id} className="ag-chip blue">
            {customerName(c)}
            <button
              type="button"
              title="Remove"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                onChange(selected.filter((s) => s !== String(c.id)));
              }}
            >
              <FiX size={11} />
            </button>
          </span>
        ))}
        <input
          value={search}
          disabled={disabled}
          placeholder={chosen.length === 0 ? "Search and add customers…" : "Add more…"}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, options.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (options[active]) add(options[active]);
            } else if (e.key === "Backspace" && !search && chosen.length) {
              onChange(selected.slice(0, -1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </div>
      {open && !disabled && (
        <div className="ag-ms-list">
          {options.length === 0 ? (
            <div className="ag-ms-none">{customers.length === 0 ? "No customers available" : "No more matches"}</div>
          ) : (
            options.slice(0, 100).map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={`ag-ms-opt ${i === active ? "active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => add(c)}
              >
                {customerName(c)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function BuyerForm({ buyerId = null }) {
  const isEdit = buyerId !== null && buyerId !== undefined;
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", remarks: "" });
  const [rows, setRows] = useState([newRow()]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [suggestions, setSuggestions] = useState({ department: [], wgr: [], item: [], productCategory: [] });
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let alive = true;
    // Customers + existing buyers (for row suggestions) - neither blocks the form.
    merchandiserApi
      .get("customer/")
      .then((res) => alive && setCustomers(asList(res.data)))
      .catch(() => alive && setError("Could not load customers - you can still save the other details."));
    merchandiserApi
      .get("buyer/")
      .then((res) => {
        if (!alive) return;
        const sets = { department: new Set(), wgr: new Set(), item: new Set(), productCategory: new Set() };
        asList(res.data).forEach((b) =>
          (b.rows || []).forEach((r) => {
            if (r.department) sets.department.add(r.department);
            if (r.wgr_number) sets.wgr.add(r.wgr_number);
            if (r.item) sets.item.add(r.item);
            if (r.product_category) sets.productCategory.add(r.product_category);
          }),
        );
        setSuggestions(Object.fromEntries(Object.entries(sets).map(([k, s]) => [k, [...s].sort()])));
      })
      .catch(() => {});

    if (isEdit) {
      merchandiserApi
        .get(`buyer/${buyerId}/`)
        .then((res) => {
          if (!alive) return;
          const b = res.data || {};
          setForm({ name: b.name || "", email: b.email || "", phone: b.phone || "", remarks: b.remarks || "" });
          setRows(
            b.rows && b.rows.length
              ? b.rows.map((r, i) => ({
                  key: `${r.id || i}`,
                  department: r.department || "",
                  wgr: r.wgr_number || "",
                  item: r.item || "",
                  productCategory: r.product_category || "",
                }))
              : [newRow()],
          );
          setSelectedCustomers((b.customers || b.customer_ids || []).map(String));
        })
        .catch((err) => alive && setLoadError(err.response?.status === 404 ? "This buyer no longer exists." : "Failed to load the buyer."))
        .finally(() => alive && setLoading(false));
    }
    return () => {
      alive = false;
    };
  }, [buyerId, isEdit]);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setFieldErrors((p) => ({ ...p, [k]: undefined }));
  };
  const updateRow = (i, field, value) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  const addRow = () => setRows((rs) => [...rs, newRow()]);
  const duplicateRow = (i) => setRows((rs) => [...rs.slice(0, i + 1), { ...rs[i], key: newRow().key }, ...rs.slice(i + 1)]);
  const removeRow = (i) => setRows((rs) => (rs.length === 1 ? [newRow()] : rs.filter((_, idx) => idx !== i)));

  const filledRows = useMemo(
    () =>
      rows
        .map((r) => ({
          department: r.department.trim(),
          wgr_number: r.wgr.trim(),
          item: r.item.trim(),
          product_category: r.productCategory.trim(),
        }))
        .filter((r) => r.department || r.wgr_number || r.item || r.product_category),
    [rows],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const fe = {};
    if (!form.name.trim()) fe.name = "Buyer name is required.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) fe.email = "Enter a valid email address.";
    if (Object.keys(fe).length) {
      setFieldErrors(fe);
      setError("Please fix the highlighted fields.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      remarks: form.remarks.trim() || null,
      row_data: filledRows,
      customers: selectedCustomers.map(Number),
    };
    setSaving(true);
    try {
      if (isEdit) await merchandiserApi.put(`buyer/${buyerId}/`, payload);
      else await merchandiserApi.post("buyer/", payload);
      setSuccess(isEdit ? "Buyer saved." : "Buyer created.");
      setTimeout(() => navigate(isEdit ? `/buyer-details/${buyerId}` : "/buyers"), 800);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object" && !data.detail && !data.message) {
        const errs = {};
        Object.entries(data).forEach(([k, v]) => {
          let msg = Array.isArray(v) ? v.join(" ") : String(v);
          if (k === "email" && /already exists|unique/i.test(msg)) msg = "Another buyer already uses this email.";
          errs[k] = msg;
        });
        setFieldErrors(errs);
        const other = Object.entries(errs).filter(([k]) => !["name", "email", "phone", "remarks"].includes(k));
        setError(other.length ? other.map(([k, v]) => `${k}: ${v}`).join(" | ") : "Please fix the highlighted fields.");
      } else {
        setError(data?.detail || data?.message || `Failed to ${isEdit ? "save" : "create"} the buyer.`);
      }
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete buyer "${form.name}"? Its rows and customer links are removed too.`)) return;
    setDeleting(true);
    setError("");
    try {
      await merchandiserApi.delete(`buyer/${buyerId}/`);
      navigate("/buyers");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete the buyer.");
      setDeleting(false);
    }
  };

  const busy = saving || deleting;
  const textField = ({ name, label, icon, type = "text", required, placeholder }) => (
    <div className="ag-field">
      <label htmlFor={`bf-${name}`}>
        <span>
          {label} {required && <span className="req">*</span>}
        </span>
        {MAX[name] && (
          <span className="count">
            {form[name].length}/{MAX[name]}
          </span>
        )}
      </label>
      <div className="ag-input-wrap">
        {icon}
        <input
          id={`bf-${name}`}
          className={`ag-input ${fieldErrors[name] ? "invalid" : ""}`}
          type={type}
          value={form[name]}
          onChange={(e) => set(name, e.target.value)}
          maxLength={MAX[name]}
          placeholder={placeholder}
          disabled={busy}
        />
      </div>
      {fieldErrors[name] && <div className="ag-field-error">{fieldErrors[name]}</div>}
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div className="ag-app">
        <style>{AGENT_CSS}</style>
        <header className="ag-header">
          <div>
            <nav className="ag-crumbs" aria-label="Breadcrumb">
              <Link to="/buyers">Buyers</Link>
              <FiChevronRight />
              {isEdit && form.name ? (
                <>
                  <Link to={`/buyer-details/${buyerId}`}>{form.name}</Link>
                  <FiChevronRight />
                  <span>Edit</span>
                </>
              ) : (
                <span>New</span>
              )}
            </nav>
            <h1 className="ag-title">{isEdit ? "Edit Buyer" : "New Buyer"}</h1>
            <p className="ag-subtitle">Buyer contact, linked customers and their department / WGR / item / category rows.</p>
          </div>
          <div className="ag-actions">
            <button
              type="button"
              className="ag-btn ghost"
              onClick={() => navigate(isEdit ? `/buyer-details/${buyerId}` : "/buyers")}
              disabled={busy}
            >
              <FiArrowLeft /> Cancel
            </button>
            <button type="submit" form="buyer-form" className="ag-btn primary" disabled={busy || loading || !!loadError}>
              {saving ? <span className="ag-spinner sm" /> : <FiSave />} {saving ? "Saving…" : isEdit ? "Save changes" : "Create buyer"}
            </button>
          </div>
        </header>

        <div className="ag-body">
          {loading ? (
            <div className="ag-loading">
              <div className="ag-spinner" />
              Loading buyer…
            </div>
          ) : loadError ? (
            <div className="ag-alert err">
              <FiAlertTriangle />
              <span>{loadError}</span>
            </div>
          ) : (
            <form id="buyer-form" onSubmit={handleSubmit}>
              {error && (
                <div className="ag-alert err">
                  <FiAlertTriangle />
                  <span>{error}</span>
                  <button type="button" className="ag-icon-btn" onClick={() => setError("")} title="Dismiss">
                    <FiX />
                  </button>
                </div>
              )}
              {success && (
                <div className="ag-alert ok">
                  <FiCheckCircle />
                  <span>{success}</span>
                </div>
              )}

              <section className="ag-card ag-section">
                <div className="ag-section-head">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="ag-avatar">{form.name ? initialsOf(form.name) : <FiUser />}</span>
                    <div>
                      <h2>Basic information</h2>
                      <p>Only the name is required.</p>
                    </div>
                  </div>
                </div>
                <div className="ag-section-body">
                  {textField({ name: "name", label: "Buyer name", icon: <FiUser />, required: true, placeholder: "e.g. KiK Textilien" })}
                  <div className="ag-field-grid">
                    {textField({ name: "email", label: "Email", icon: <FiMail />, type: "email", placeholder: "buyer@company.com" })}
                    {textField({ name: "phone", label: "Phone", icon: <FiPhone />, type: "tel", placeholder: "+49…" })}
                  </div>
                </div>
              </section>

              <section className="ag-card ag-section" style={{ overflow: "visible" }}>
                <div className="ag-section-head">
                  <div>
                    <h2>
                      <FiBriefcase /> Customers
                    </h2>
                    <p>Which of our customers this buyer works with.</p>
                  </div>
                  <span className="ag-count">{selectedCustomers.length}</span>
                </div>
                <div className="ag-section-body">
                  <CustomerMultiSelect
                    customers={customers}
                    selected={selectedCustomers}
                    onChange={setSelectedCustomers}
                    disabled={busy}
                  />
                </div>
              </section>

              <section className="ag-card ag-section">
                <div className="ag-section-head">
                  <div>
                    <h2>
                      <FiLayers /> Departments, WGR, items &amp; categories
                    </h2>
                    <p>One row per combination. Empty rows are ignored.</p>
                  </div>
                  <button type="button" className="ag-btn ghost sm" onClick={addRow} disabled={busy}>
                    <FiPlus /> Add row
                  </button>
                </div>
                <div className="ag-table-wrap">
                  <table className="ag-rows">
                    <thead>
                      <tr>
                        <th className="idx">#</th>
                        <th>Department</th>
                        <th>WGR number</th>
                        <th>Item</th>
                        <th>Product category</th>
                        <th className="ops" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={r.key}>
                          <td className="idx">{i + 1}</td>
                          {[
                            ["department", "e.g. Ladies"],
                            ["wgr", "e.g. 123"],
                            ["item", "e.g. T-shirt"],
                            ["productCategory", "e.g. Knit"],
                          ].map(([field, ph]) => (
                            <td key={field}>
                              <input
                                className="ag-cell-input"
                                value={r[field]}
                                onChange={(e) => updateRow(i, field, e.target.value)}
                                placeholder={ph}
                                list={`bf-list-${field}`}
                                disabled={busy}
                              />
                            </td>
                          ))}
                          <td className="ops">
                            <button type="button" className="ag-icon-btn" title="Duplicate row" onClick={() => duplicateRow(i)} disabled={busy}>
                              <FiCopy />
                            </button>{" "}
                            <button type="button" className="ag-icon-btn danger" title="Remove row" onClick={() => removeRow(i)} disabled={busy}>
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {Object.entries(suggestions).map(([field, values]) => (
                  <datalist key={field} id={`bf-list-${field}`}>
                    {values.map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                ))}
              </section>

              <section className="ag-card ag-section">
                <div className="ag-section-head">
                  <h2>
                    <FiMessageSquare /> Remarks
                  </h2>
                </div>
                <div className="ag-section-body">
                  <textarea
                    className="ag-input ag-plain-input"
                    rows={3}
                    value={form.remarks}
                    onChange={(e) => set("remarks", e.target.value)}
                    placeholder="Optional notes about this buyer"
                    disabled={busy}
                  />
                </div>
              </section>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                {isEdit ? (
                  <button type="button" className="ag-btn danger-ghost" onClick={handleDelete} disabled={busy}>
                    {deleting ? <span className="ag-spinner sm" /> : <FiTrash2 />} {deleting ? "Deleting…" : "Delete buyer"}
                  </button>
                ) : (
                  <span />
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    className="ag-btn ghost"
                    onClick={() => navigate(isEdit ? `/buyer-details/${buyerId}` : "/buyers")}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="ag-btn primary" disabled={busy}>
                    {saving ? <span className="ag-spinner sm" /> : <FiSave />} {saving ? "Saving…" : isEdit ? "Save changes" : "Create buyer"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
