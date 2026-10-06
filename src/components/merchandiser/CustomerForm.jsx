// Shared Add / Edit form for customers (AddCustomer.jsx, EditCustomer.jsx).
//
// The backend links each merchandiser customer to an HRMS customer by name
// (created if missing). Name must be unique; email and code are unique too,
// so blanks are sent as null. All calls use the authenticated merchandiser API.
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBriefcase,
  FiCheckCircle,
  FiChevronRight,
  FiExternalLink,
  FiHash,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiPhone,
  FiSave,
} from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import { merchandiserApi } from "../../api/merchandiser";
import { AGENT_CSS, customerName, initialsOf } from "./agentTheme";

const EMPTY = { customer_name: "", customer_code: "", email: "", phone: "", address: "", remarks: "" };
const MAX = { customer_name: 255, customer_code: 50, phone: 15 };
const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const norm = (s) => (s || "").trim().toLowerCase();

export default function CustomerForm({ customerId = null }) {
  const isEdit = customerId !== null && customerId !== undefined;
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [original, setOriginal] = useState(EMPTY);
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let alive = true;
    merchandiserApi
      .get("customer/")
      .then((res) => alive && setOthers(asList(res.data).filter((c) => String(c.id) !== String(customerId))))
      .catch(() => {});
    if (isEdit) {
      merchandiserApi
        .get(`customer/${customerId}/`)
        .then((res) => {
          if (!alive) return;
          const c = res.data || {};
          const loaded = {
            customer_name: customerName(c) === `Customer ${c.id}` ? "" : customerName(c),
            customer_code: c.customer_code || "",
            email: c.email || "",
            phone: c.phone || "",
            address: c.address || "",
            remarks: c.remarks || "",
          };
          setForm(loaded);
          setOriginal(loaded);
        })
        .catch((err) => alive && setLoadError(err.response?.status === 404 ? "This customer no longer exists." : "Failed to load the customer."))
        .finally(() => alive && setLoading(false));
    }
    return () => {
      alive = false;
    };
  }, [customerId, isEdit]);

  // Live duplicate checks against the other customers.
  const duplicateName = useMemo(
    () => (form.customer_name.trim() ? others.find((c) => norm(customerName(c)) === norm(form.customer_name)) : null),
    [others, form.customer_name],
  );
  const duplicateCode = useMemo(
    () => (form.customer_code.trim() ? others.find((c) => norm(c.customer_code) === norm(form.customer_code)) : null),
    [others, form.customer_code],
  );
  const similar = useMemo(() => {
    const q = norm(form.customer_name);
    if (q.length < 2 || duplicateName) return [];
    return others.filter((c) => norm(customerName(c)).includes(q)).slice(0, 4);
  }, [others, form.customer_name, duplicateName]);

  const changed = Object.keys(EMPTY).some((k) => form[k] !== original[k]);
  const renamed = isEdit && original.customer_name && norm(form.customer_name) !== norm(original.customer_name);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setFieldErrors((p) => ({ ...p, [k]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const fe = {};
    if (!form.customer_name.trim()) fe.customer_name = "Customer name is required.";
    else if (duplicateName) fe.customer_name = "Another customer already has this name.";
    if (duplicateCode) fe.customer_code = "Another customer already uses this code.";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) fe.email = "Enter a valid email address.";
    if (Object.keys(fe).length) {
      setFieldErrors(fe);
      setError("Please fix the highlighted fields.");
      return;
    }
    const payload = {
      customer_name: form.customer_name.trim(),
      customer_code: form.customer_code.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      remarks: form.remarks.trim() || null,
    };
    setSaving(true);
    try {
      const res = isEdit ? await merchandiserApi.put(`customer/${customerId}/`, payload) : await merchandiserApi.post("customer/", payload);
      setSuccess(isEdit ? "Customer saved." : "Customer created and linked to HRMS.");
      const newId = isEdit ? customerId : res.data?.id;
      setTimeout(() => navigate(newId ? `/customer-details/${newId}` : "/customers"), 800);
    } catch (err) {
      const data = err.response?.data;
      if (Array.isArray(data)) {
        setError(data.join(" "));
      } else if (data && typeof data === "object" && !data.detail) {
        const errs = {};
        Object.entries(data).forEach(([k, v]) => {
          let msg = Array.isArray(v) ? v.join(" ") : String(v);
          if (/already exists/i.test(msg) && k === "email") msg = "Another customer already uses this email.";
          errs[k] = msg;
        });
        setFieldErrors(errs);
        const other = Object.entries(errs).filter(([k]) => !(k in EMPTY));
        setError(other.length ? other.map(([, v]) => v).join(" ") : "Please fix the highlighted fields.");
      } else {
        setError(data?.detail || `Failed to ${isEdit ? "save" : "create"} the customer.`);
      }
      setSaving(false);
    }
  };

  const field = ({ name, label, icon, type = "text", required, placeholder, multiline, hint }) => {
    const Tag = multiline ? "textarea" : "input";
    return (
      <div className="ag-field">
        <label htmlFor={`cf-${name}`}>
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
          <Tag
            id={`cf-${name}`}
            className={`ag-input ${fieldErrors[name] ? "invalid" : ""}`}
            type={multiline ? undefined : type}
            value={form[name]}
            onChange={(e) => set(name, e.target.value)}
            maxLength={MAX[name]}
            placeholder={placeholder}
            rows={multiline ? 3 : undefined}
            disabled={saving}
          />
        </div>
        {fieldErrors[name] && <div className="ag-field-error">{fieldErrors[name]}</div>}
        {!fieldErrors[name] && hint}
      </div>
    );
  };

  const back = isEdit ? `/customer-details/${customerId}` : "/customers";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div className="ag-app">
        <style>{AGENT_CSS}</style>
        <header className="ag-header">
          <div>
            <nav className="ag-crumbs" aria-label="Breadcrumb">
              <Link to="/customers">Customers</Link>
              <FiChevronRight />
              {isEdit && original.customer_name ? (
                <>
                  <Link to={`/customer-details/${customerId}`}>{original.customer_name}</Link>
                  <FiChevronRight />
                  <span>Edit</span>
                </>
              ) : (
                <span>New</span>
              )}
            </nav>
            <h1 className="ag-title">{isEdit ? "Edit Customer" : "New Customer"}</h1>
            <p className="ag-subtitle">The customer is linked to the HRMS customer list by name.</p>
          </div>
          <div className="ag-actions">
            <button type="button" className="ag-btn ghost" onClick={() => navigate(back)} disabled={saving}>
              <FiArrowLeft /> Cancel
            </button>
            <button
              type="submit"
              form="customer-form"
              className="ag-btn primary"
              disabled={saving || loading || !!loadError || (isEdit && !changed)}
            >
              {saving ? <span className="ag-spinner sm" /> : <FiSave />} {saving ? "Saving…" : isEdit ? "Save changes" : "Create customer"}
            </button>
          </div>
        </header>

        <div className="ag-body">
          {loading ? (
            <div className="ag-loading">
              <div className="ag-spinner" />
              Loading customer…
            </div>
          ) : loadError ? (
            <div className="ag-alert err">
              <FiAlertTriangle />
              <span>{loadError}</span>
            </div>
          ) : (
            <form id="customer-form" className="ag-card ag-form-card" style={{ maxWidth: 820 }} onSubmit={handleSubmit}>
              <div className="ag-form-head">
                <span className="ag-avatar lg">{form.customer_name ? initialsOf(form.customer_name) : <FiBriefcase />}</span>
                <div>
                  <h2>{form.customer_name || "Customer details"}</h2>
                  <p>Only the name is required.</p>
                </div>
              </div>
              <div className="ag-form-body">
                {error && (
                  <div className="ag-alert err">
                    <FiAlertTriangle />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="ag-alert ok">
                    <FiCheckCircle />
                    <span>{success}</span>
                  </div>
                )}

                <div className="ag-field-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
                  {field({
                    name: "customer_name",
                    label: "Customer name",
                    icon: <FiBriefcase />,
                    required: true,
                    placeholder: "e.g. KiK Textilien und Non-Food GmbH",
                    hint: duplicateName ? (
                      <div className="ag-field-error">
                        Already exists —{" "}
                        <Link to={`/customer-details/${duplicateName.id}`}>
                          open {customerName(duplicateName)} <FiExternalLink size={11} />
                        </Link>
                      </div>
                    ) : similar.length ? (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 5 }}>
                        Similar: {similar.map((c, i) => (
                          <span key={c.id}>
                            {i > 0 && ", "}
                            <Link to={`/customer-details/${c.id}`}>{customerName(c)}</Link>
                          </span>
                        ))}
                      </div>
                    ) : renamed ? (
                      <div style={{ fontSize: 12, color: "#b45309", marginTop: 5 }}>
                        Renaming also re-links this customer to the HRMS customer of the new name (created if missing).
                      </div>
                    ) : null,
                  })}
                  {field({
                    name: "customer_code",
                    label: "Customer code",
                    icon: <FiHash />,
                    placeholder: "Optional",
                    hint: duplicateCode ? (
                      <div className="ag-field-error">Used by {customerName(duplicateCode)}.</div>
                    ) : null,
                  })}
                </div>
                <div className="ag-field-grid">
                  {field({ name: "email", label: "Email", icon: <FiMail />, type: "email", placeholder: "orders@customer.com" })}
                  {field({ name: "phone", label: "Phone", icon: <FiPhone />, type: "tel", placeholder: "+49…" })}
                </div>
                {field({ name: "address", label: "Address", icon: <FiMapPin />, placeholder: "Street, city, country", multiline: true })}
                {field({ name: "remarks", label: "Remarks", icon: <FiMessageSquare />, placeholder: "Optional notes", multiline: true })}
              </div>
              <div className="ag-form-foot">
                <span style={{ fontSize: 12.5, color: "#64748b" }}>{isEdit && !changed ? "No changes yet." : ""}</span>
                <div className="right">
                  <button type="button" className="ag-btn ghost" onClick={() => navigate(back)} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="ag-btn primary" disabled={saving || (isEdit && !changed)}>
                    {saving ? <span className="ag-spinner sm" /> : <FiSave />} {saving ? "Saving…" : isEdit ? "Save changes" : "Create customer"}
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
