// Shared Add / Edit form for agents (AddAgents.jsx, EditAgents.jsx).
// Uses the authenticated merchandiser API helpers (token sent).
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheckCircle,
  FiChevronRight,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiTrash2,
  FiUser,
  FiUserPlus,
} from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import { createAgent, deleteAgent, getAgentById, updateAgent } from "../../api/merchandiser";
import { AGENT_CSS, initialsOf } from "./agentTheme";

const EMPTY = { name: "", email: "", phone: "", address: "" };
// Limits from merchandiser.models.Agent
const MAX = { name: 100, phone: 15 };

export default function AgentForm({ agentId = null }) {
  const isEdit = agentId !== null && agentId !== undefined;
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let alive = true;
    setLoading(true);
    getAgentById(agentId)
      .then((res) => {
        if (!alive) return;
        const a = res.data || {};
        setForm({ name: a.name || "", email: a.email || "", phone: a.phone || "", address: a.address || "" });
      })
      .catch((err) => {
        if (!alive) return;
        setLoadError(err.response?.status === 404 ? "This agent no longer exists." : "Failed to load the agent.");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [agentId, isEdit]);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setFieldErrors((p) => ({ ...p, [k]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };
    setSaving(true);
    try {
      if (isEdit) await updateAgent(agentId, payload);
      else await createAgent(payload);
      setSuccess(isEdit ? "Agent updated." : "Agent added.");
      setTimeout(() => navigate("/agents"), 900);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object" && !data.detail) {
        const fe = {};
        Object.entries(data).forEach(([k, v]) => {
          let msg = Array.isArray(v) ? v.join(" ") : String(v);
          if (k === "email" && /already exists|unique/i.test(msg)) msg = "Another agent already uses this email.";
          fe[k] = msg;
        });
        setFieldErrors(fe);
        setError("Please fix the highlighted fields.");
      } else {
        setError(data?.detail || `Failed to ${isEdit ? "update" : "add"} the agent. Please try again.`);
      }
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete agent "${form.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError("");
    try {
      await deleteAgent(agentId);
      setSuccess("Agent deleted.");
      setTimeout(() => navigate("/agents"), 700);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete the agent.");
      setDeleting(false);
    }
  };

  const Field = ({ name, label, icon, type = "text", required = true, placeholder, multiline }) => {
    const Tag = multiline ? "textarea" : "input";
    return (
      <div className="ag-field">
        <label htmlFor={`ag-${name}`}>
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
            id={`ag-${name}`}
            className={`ag-input ${fieldErrors[name] ? "invalid" : ""}`}
            type={multiline ? undefined : type}
            value={form[name]}
            onChange={(e) => set(name, e.target.value)}
            required={required}
            maxLength={MAX[name]}
            placeholder={placeholder}
            disabled={saving || deleting}
          />
        </div>
        {fieldErrors[name] && <div className="ag-field-error">{fieldErrors[name]}</div>}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div className="ag-app">
        <style>{AGENT_CSS}</style>
        <header className="ag-header">
          <div>
            <nav className="ag-crumbs" aria-label="Breadcrumb">
              <Link to="/agents">Agents</Link>
              <FiChevronRight />
              <span>{isEdit ? "Edit" : "New"}</span>
            </nav>
            <h1 className="ag-title">{isEdit ? form.name || "Edit Agent" : "Add Agent"}</h1>
            <p className="ag-subtitle">
              {isEdit ? "Update the agent's contact details." : "Add a buying agent and their contact details."}
            </p>
          </div>
          <div className="ag-actions">
            <button type="button" className="ag-btn ghost" onClick={() => navigate("/agents")}>
              <FiArrowLeft /> Back to Agents
            </button>
          </div>
        </header>

        <div className="ag-body">
          {loading ? (
            <div className="ag-loading">
              <div className="ag-spinner" />
              Loading agent…
            </div>
          ) : loadError ? (
            <div className="ag-form-card">
              <div className="ag-alert err">
                <FiAlertTriangle />
                <span>{loadError}</span>
              </div>
            </div>
          ) : (
            <form className="ag-card ag-form-card" onSubmit={handleSubmit} noValidate={false}>
              <div className="ag-form-head">
                <span className="ag-avatar lg">{isEdit && form.name ? initialsOf(form.name) : <FiUserPlus />}</span>
                <div>
                  <h2>Agent details</h2>
                  <p>All fields are required. The email must be unique.</p>
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
                {Field({ name: "name", label: "Full name", icon: <FiUser />, placeholder: "e.g. Rahim Uddin" })}
                <div className="ag-field-grid">
                  {Field({ name: "email", label: "Email", icon: <FiMail />, type: "email", placeholder: "name@company.com" })}
                  {Field({ name: "phone", label: "Phone", icon: <FiPhone />, type: "tel", placeholder: "+8801XXXXXXXXX" })}
                </div>
                {Field({ name: "address", label: "Address", icon: <FiMapPin />, placeholder: "Street, city, country", multiline: true })}
              </div>
              <div className="ag-form-foot">
                {isEdit && (
                  <button type="button" className="ag-btn danger-ghost" onClick={handleDelete} disabled={saving || deleting}>
                    {deleting ? <span className="ag-spinner sm" /> : <FiTrash2 />} {deleting ? "Deleting…" : "Delete agent"}
                  </button>
                )}
                <div className="right">
                  <button type="button" className="ag-btn ghost" onClick={() => navigate("/agents")} disabled={saving || deleting}>
                    Cancel
                  </button>
                  <button type="submit" className="ag-btn primary" disabled={saving || deleting}>
                    {saving ? <span className="ag-spinner sm" /> : <FiSave />} {saving ? "Saving…" : isEdit ? "Save changes" : "Add agent"}
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
