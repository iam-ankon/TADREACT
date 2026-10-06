/**
 * CompanyDocsDashboard.jsx
 *
 * Company Documents overview: totals, one card per company, add/edit/delete
 * company, and the expiry digest email. Look shared with CompanyDetail via
 * companyDocsTheme.js; sidebar comes from CompanyDocsLayout (App.jsx).
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiBriefcase,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiFileText,
  FiInbox,
  FiMail,
  FiMinusCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import {
  getCompanyDocsDashboard,
  sendExpiryNotifications,
  createCompany,
  updateCompany,
  getCompany,
  deleteCompany,
} from "../../api/companyDocsApi";
import {
  COMPANY_DOCS_CSS,
  apiErrorMessage,
  initialsOf,
  notifyCompanyDocsChanged,
} from "./companyDocsTheme";

// ── Company card ──────────────────────────────────────────────────────────────
const CompanyCard = ({ company, onOpen, onEdit, onDelete, editing }) => {
  const total = company.total || 0;
  const accent =
    total === 0
      ? "transparent"
      : company.expired > 0
        ? "#ef4444"
        : company.expiring_soon > 0
          ? "#f59e0b"
          : "#22c55e";
  const pct = (n) => (total ? `${((n || 0) / total) * 100}%` : "0%");

  return (
    <div
      className="cd-company"
      style={{ "--accent": accent }}
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
    >
      <div className="cd-company-top">
        <span className="cd-avatar">{initialsOf(company.short_name || company.name)}</span>
        <div style={{ minWidth: 0 }}>
          <h3 className="cd-company-name">{company.name}</h3>
          {company.short_name && <p className="cd-company-short">{company.short_name}</p>}
        </div>
        <div className="cd-company-actions">
          <button
            type="button"
            className="cd-icon-btn"
            title="Edit company"
            disabled={editing}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(company.id);
            }}
          >
            {editing ? <span className="cd-spinner sm" /> : <FiEdit2 />}
          </button>
          <button
            type="button"
            className="cd-icon-btn danger"
            title="Delete company"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(company.id, company.name);
            }}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <div className="cd-chips">
        {total === 0 && <span className="cd-pill neutral">No documents yet</span>}
        {company.expired > 0 && (
          <span className="cd-pill expired">
            <FiAlertTriangle /> {company.expired} expired
          </span>
        )}
        {company.expiring_soon > 0 && (
          <span className="cd-pill expiring_soon">
            <FiClock /> {company.expiring_soon} expiring
          </span>
        )}
        {company.valid > 0 && (
          <span className="cd-pill valid">
            <FiCheckCircle /> {company.valid} valid
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="cd-health" title="Expired · Expiring · Valid · Other">
          <span style={{ width: pct(company.expired), background: "#ef4444" }} />
          <span style={{ width: pct(company.expiring_soon), background: "#f59e0b" }} />
          <span style={{ width: pct(company.valid), background: "#22c55e" }} />
        </div>
      )}

      <div className="cd-company-foot">
        <span>
          {total} document{total !== 1 ? "s" : ""}
        </span>
        <span className="go">
          Open <FiChevronRight />
        </span>
      </div>
    </div>
  );
};

// ── Add / Edit Company Modal ──────────────────────────────────────────────────
const CompanyFormModal = ({ company, onClose, onSaved }) => {
  const isEdit = !!company;
  const [form, setForm] = useState({
    name: company?.name || "",
    short_name: company?.short_name || "",
    address: company?.address || "",
    email: company?.email || "",
    phone: company?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErr("Company name is required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        // On edit, send cleared fields too so they can actually be emptied.
        if (v.trim() || isEdit) fd.append(k, v.trim());
      });
      if (isEdit) {
        await updateCompany(company.id, fd);
      } else {
        await createCompany(fd);
      }
      onSaved();
      onClose();
    } catch (ex) {
      setErr(apiErrorMessage(ex, `Failed to ${isEdit ? "update" : "create"} company. Please try again.`));
      setSaving(false);
    }
  };

  return (
    <div className="cd-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <form className="cd-modal" style={{ maxWidth: 500 }} onSubmit={handleSubmit}>
        <div className="cd-modal-head">
          <div>
            <h2>{isEdit ? "Edit Company" : "Add New Company"}</h2>
            <p>{isEdit ? company.name : "Documents can be added after the company is created."}</p>
          </div>
          <button type="button" className="cd-icon-btn" onClick={onClose} title="Close">
            <FiX />
          </button>
        </div>

        <div className="cd-modal-body">
          {err && (
            <div className="cd-alert err">
              <FiAlertTriangle />
              <span>{err}</span>
            </div>
          )}
          <div className="cd-field">
            <label>
              Company Name <span className="req">*</span>
            </label>
            <input
              className="cd-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. KOI THE BANGLADESH LTD"
              required
              autoFocus
            />
          </div>
          <div className="cd-field-grid">
            <div className="cd-field">
              <label>Short Name</label>
              <input
                className="cd-input"
                value={form.short_name}
                onChange={(e) => set("short_name", e.target.value)}
                placeholder="e.g. KOI BD"
              />
            </div>
            <div className="cd-field">
              <label>Phone</label>
              <input
                className="cd-input"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+880..."
              />
            </div>
          </div>
          <div className="cd-field">
            <label>Email</label>
            <input
              className="cd-input"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="info@company.com"
            />
          </div>
          <div className="cd-field" style={{ marginBottom: 0 }}>
            <label>Address</label>
            <textarea
              className="cd-input"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Dhaka, Bangladesh"
              rows={2}
            />
          </div>
        </div>

        <div className="cd-modal-foot">
          <button type="button" className="cd-btn cd-btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="cd-btn cd-btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Company"}
          </button>
        </div>
      </form>
    </div>
  );
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "issues", label: "Needs attention" },
  { key: "expired", label: "Expired" },
  { key: "ok", label: "All valid" },
  { key: "empty", label: "No documents" },
];

// ── Main Dashboard ────────────────────────────────────────────────────────────
const CompanyDocsDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notifStatus, setNotifStatus] = useState(null);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null); // full company object being edited
  const [editLoadingId, setEditLoadingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchDashboard = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getCompanyDocsDashboard();
      setDashboard(res.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err.response?.data || err.message);
      setError(
        err.response?.status === 401
          ? "Session expired – please log in again."
          : err.response?.status === 404
            ? "API endpoint not found. Check backend setup."
            : `Failed to load dashboard: ${err.message}`,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // After a change: reload this page quietly and tell the sidebar.
  const afterChange = useCallback(() => {
    fetchDashboard({ quiet: true });
    notifyCompanyDocsChanged();
  }, [fetchDashboard]);

  const handleSendNotifications = async () => {
    if (
      !window.confirm(
        "Email the expiry digest now?\n\nIt lists every company's documents that are expired or expire within 90 days, and goes to the Company Documents team.",
      )
    )
      return;
    setSendingNotif(true);
    setNotifStatus(null);
    try {
      const res = await sendExpiryNotifications(90);
      setNotifStatus({ ok: true, msg: res.data.message });
    } catch (err) {
      setNotifStatus({ ok: false, msg: apiErrorMessage(err, "Failed to send notifications.") });
    } finally {
      setSendingNotif(false);
    }
  };

  const handleEditCompany = async (id) => {
    setEditLoadingId(id);
    setActionError(null);
    try {
      const res = await getCompany(id);
      setEditingCompany(res.data);
    } catch (err) {
      setActionError(apiErrorMessage(err, "Failed to load company details."));
    } finally {
      setEditLoadingId(null);
    }
  };

  const handleDeleteCompany = async (id, name) => {
    if (!window.confirm(`Delete company "${name}"?\nThis will also delete ALL its documents and files.`)) return;
    setActionError(null);
    try {
      await deleteCompany(id);
      afterChange();
    } catch (err) {
      setActionError(apiErrorMessage(err, "Failed to delete company."));
    }
  };

  const {
    total_companies = 0,
    total_documents = 0,
    expired = 0,
    expiring_soon = 0,
    valid = 0,
    not_available = 0,
    companies = [],
  } = dashboard || {};

  const visibleCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      if (q && !`${c.name || ""} ${c.short_name || ""}`.toLowerCase().includes(q)) return false;
      if (filter === "issues") return c.expired > 0 || c.expiring_soon > 0;
      if (filter === "expired") return c.expired > 0;
      if (filter === "ok") return c.total > 0 && !c.expired && !c.expiring_soon;
      if (filter === "empty") return !c.total;
      return true;
    });
  }, [companies, search, filter]);

  // ── Render states ─────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="cd-app">
        <style>{COMPANY_DOCS_CSS}</style>
        <div className="cd-loading">
          <div className="cd-spinner" />
          Loading companies…
        </div>
      </div>
    );

  if (error)
    return (
      <div className="cd-app">
        <style>{COMPANY_DOCS_CSS}</style>
        <div className="cd-body">
          <div className="cd-alert err">
            <FiAlertTriangle />
            <span>{error}</span>
          </div>
          <button type="button" className="cd-btn cd-btn-ghost" onClick={() => fetchDashboard()}>
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    );

  const kpis = [
    { label: "Companies", value: total_companies, icon: <FiBriefcase />, tone: "blue" },
    { label: "Total Documents", value: total_documents, icon: <FiFileText />, tone: "violet" },
    { label: "Expired", value: expired, icon: <FiAlertTriangle />, tone: "red", filter: "expired" },
    { label: "Expiring Soon", value: expiring_soon, icon: <FiClock />, tone: "amber", filter: "issues" },
    { label: "Valid", value: valid, icon: <FiCheckCircle />, tone: "green", filter: "ok" },
    { label: "Not Available", value: not_available, icon: <FiMinusCircle />, tone: "gray" },
  ];

  return (
    <div className="cd-app">
      <style>{COMPANY_DOCS_CSS}</style>

      <header className="cd-header">
        <div>
          <div className="cd-eyebrow">Company Documents</div>
          <h1 className="cd-title">
            Companies <span className="cd-count">{total_companies}</span>
          </h1>
          <p className="cd-subtitle">Regulatory licences and documents per company, with expiry tracking.</p>
        </div>
        <div className="cd-header-actions">
          <button
            type="button"
            className="cd-btn cd-btn-ghost"
            onClick={() => fetchDashboard({ quiet: true })}
            disabled={refreshing}
            title="Reload"
          >
            <FiRefreshCw className={refreshing ? "cd-spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            className="cd-btn cd-btn-warn"
            onClick={handleSendNotifications}
            disabled={sendingNotif}
            title="Email the expiry digest (all companies) to the Company Documents team"
          >
            <FiMail /> {sendingNotif ? "Sending…" : "Send Expiry Digest"}
          </button>
          <button type="button" className="cd-btn cd-btn-primary" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add Company
          </button>
        </div>
      </header>

      <div className="cd-body">
        {notifStatus && (
          <div className={`cd-alert ${notifStatus.ok ? "ok" : "err"}`}>
            {notifStatus.ok ? <FiCheckCircle /> : <FiAlertTriangle />}
            <span>{notifStatus.msg}</span>
            <button type="button" className="cd-icon-btn" onClick={() => setNotifStatus(null)} title="Dismiss">
              <FiX />
            </button>
          </div>
        )}
        {actionError && (
          <div className="cd-alert err">
            <FiAlertTriangle />
            <span>{actionError}</span>
            <button type="button" className="cd-icon-btn" onClick={() => setActionError(null)} title="Dismiss">
              <FiX />
            </button>
          </div>
        )}

        <div className="cd-kpis">
          {kpis.map((k) => {
            const Tag = k.filter ? "button" : "div";
            return (
              <Tag
                key={k.label}
                type={k.filter ? "button" : undefined}
                className={`cd-kpi tone-${k.tone} ${k.filter && filter === k.filter ? "active" : ""}`}
                onClick={k.filter ? () => setFilter(filter === k.filter ? "all" : k.filter) : undefined}
                title={k.filter ? "Filter companies" : undefined}
              >
                <span className="cd-kpi-icon">{k.icon}</span>
                <span>
                  <span className="cd-kpi-value">{k.value ?? 0}</span>
                  <span className="cd-kpi-label">{k.label}</span>
                </span>
              </Tag>
            );
          })}
        </div>

        {companies.length > 0 && (
          <div className="cd-toolbar">
            <div className="cd-search">
              <FiSearch />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies" />
              {search && (
                <button type="button" className="cd-search-clear" onClick={() => setSearch("")} title="Clear">
                  <FiX />
                </button>
              )}
            </div>
            <div className="cd-seg" role="tablist" aria-label="Filter companies">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={filter === f.key ? "on" : ""}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="cd-result-note">
              {visibleCompanies.length} of {companies.length} shown
            </span>
          </div>
        )}

        {companies.length === 0 ? (
          <div className="cd-state">
            <div className="cd-state-icon">
              <FiBriefcase />
            </div>
            <h3>No companies yet</h3>
            <p>Add a company, then track its licences and renewals.</p>
            <button type="button" className="cd-btn cd-btn-primary" onClick={() => setShowAddModal(true)}>
              <FiPlus /> Add Company
            </button>
          </div>
        ) : visibleCompanies.length === 0 ? (
          <div className="cd-state">
            <div className="cd-state-icon">
              <FiInbox />
            </div>
            <h3>No companies match</h3>
            <p>Try a different search or filter.</p>
            <button
              type="button"
              className="cd-btn cd-btn-ghost"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="cd-grid">
            {visibleCompanies.map((c) => (
              <CompanyCard
                key={c.id}
                company={c}
                editing={editLoadingId === c.id}
                onOpen={() => navigate(`/company-docs/${c.id}`)}
                onEdit={handleEditCompany}
                onDelete={handleDeleteCompany}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && <CompanyFormModal onClose={() => setShowAddModal(false)} onSaved={afterChange} />}
      {editingCompany && (
        <CompanyFormModal company={editingCompany} onClose={() => setEditingCompany(null)} onSaved={afterChange} />
      )}
    </div>
  );
};

export default CompanyDocsDashboard;
