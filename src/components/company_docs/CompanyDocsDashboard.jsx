/**
 * CompanyDocsDashboard.jsx  –  fixed
 *
 * Bugs fixed:
 *  1. Error state was silently swallowing the real error – now logs + shows it
 *  2. After createCompany the form was not resetting the "saving" guard on error
 *  3. Company card border falls back to neutral gray when total===0 (no docs yet)
 *  4. Stat cards show 0 cleanly when value is undefined/null
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCompanyDocsDashboard,
  sendExpiryNotifications,
  createCompany,
  deleteCompany,
} from "../../api/companyDocsApi";

// ── Stat chip inside a card ───────────────────────────────────────────────────
const Chip = ({ count, label, color, bg }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "2px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      color,
      background: bg,
    }}
  >
    {count} {label}
  </span>
);

// ── Company card ──────────────────────────────────────────────────────────────
const CompanyCard = ({ company, onClick, onDelete }) => {
  const hasIssues = company.expired > 0 || company.expiring_soon > 0;
  let borderColor = "#e2e8f0"; // neutral – no docs yet
  if (company.total > 0) {
    borderColor =
      company.expired > 0
        ? "#fca5a5"
        : company.expiring_soon > 0
          ? "#fde68a"
          : "#bbf7d0";
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 12,
        border: `2px solid ${borderColor}`,
        padding: "20px 22px",
        cursor: "pointer",
        transition: "box-shadow .18s, transform .18s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.12)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      {hasIssues && (
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: company.expired > 0 ? "#ef4444" : "#f59e0b",
            boxShadow: "0 0 0 3px rgba(239,68,68,.2)",
          }}
        />
      )}

      <h3
        style={{
          margin: "0 0 4px",
          fontSize: 15,
          color: "#1e293b",
          fontWeight: 700,
        }}
      >
        {company.name}
      </h3>
      {company.short_name && (
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748b" }}>
          {company.short_name}
        </p>
      )}

      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}
      >
        {company.total === 0 && (
          <Chip count={0} label="No documents" color="#94a3b8" bg="#f1f5f9" />
        )}
        {company.expired > 0 && (
          <Chip
            count={company.expired}
            label="Expired"
            color="#dc2626"
            bg="#fee2e2"
          />
        )}
        {company.expiring_soon > 0 && (
          <Chip
            count={company.expiring_soon}
            label="Expiring"
            color="#d97706"
            bg="#fef3c7"
          />
        )}
        {company.valid > 0 && (
          <Chip
            count={company.valid}
            label="Valid"
            color="#16a34a"
            bg="#dcfce7"
          />
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, color: "#94a3b8" }}>
          {company.total} document{company.total !== 1 ? "s" : ""}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(company.id, company.name);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#cbd5e1",
            fontSize: 14,
            padding: "2px 6px",
            borderRadius: 4,
          }}
          onMouseEnter={(e) => (e.target.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.target.style.color = "#cbd5e1")}
          title="Delete company"
        >
          🗑
        </button>
      </div>
    </div>
  );
};

// ── Add Company Modal ─────────────────────────────────────────────────────────
const AddCompanyModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: "",
    short_name: "",
    address: "",
    email: "",
    phone: "",
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
        if (v.trim()) fd.append(k, v);
      });
      await createCompany(fd);
      onCreated();
      onClose();
    } catch (ex) {
      const msg = ex.response?.data
        ? typeof ex.response.data === "object"
          ? Object.entries(ex.response.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : String(ex.response.data)
        : "Failed to create company. Please try again.";
      setErr(msg);
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          width: 480,
          maxWidth: "95vw",
          boxShadow: "0 20px 60px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>
            Add New Company
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#94a3b8",
            }}
          >
            ×
          </button>
        </div>

        {err && (
          <div
            style={{
              padding: "10px 12px",
              background: "#fee2e2",
              color: "#dc2626",
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            {
              key: "name",
              label: "Company Name *",
              placeholder: "e.g. KOI THE BANGLADESH LTD",
            },
            {
              key: "short_name",
              label: "Short Name",
              placeholder: "e.g. KOI BD",
            },
            { key: "email", label: "Email", placeholder: "info@company.com" },
            { key: "phone", label: "Phone", placeholder: "+880..." },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 4,
                }}
              >
                {label}
              </label>
              <input
                type={key === "email" ? "email" : "text"}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                required={key === "name"}
                style={inputStyle}
              />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 4,
              }}
            >
              Address
            </label>
            <textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Dhaka, Bangladesh"
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "8px 22px",
                borderRadius: 8,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving…" : "Add Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const CompanyDocsDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifStatus, setNotifStatus] = useState(null);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCompanyDocsDashboard();
      setDashboard(res.data);
    } catch (err) {
      console.error(
        "Dashboard fetch error:",
        err.response?.data || err.message,
      );
      setError(
        err.response?.status === 401
          ? "Session expired – please log in again."
          : err.response?.status === 404
            ? "API endpoint not found. Check backend setup."
            : `Failed to load dashboard: ${err.message}`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleSendNotifications = async () => {
    setSendingNotif(true);
    setNotifStatus(null);
    try {
      const res = await sendExpiryNotifications(90);
      setNotifStatus({ ok: true, msg: res.data.message });
    } catch (err) {
      setNotifStatus({
        ok: false,
        msg: err.response?.data?.message || "Failed to send notifications.",
      });
    } finally {
      setSendingNotif(false);
    }
  };

  const handleDeleteCompany = async (id, name) => {
    if (
      !window.confirm(
        `Delete company "${name}"?\nThis will also delete ALL its documents and files.`,
      )
    )
      return;
    try {
      await deleteCompany(id);
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete company.");
    }
  };

  // ── Render states ─────────────────────────────────────────────────────────
  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid #e2e8f0",
            borderTop: "3px solid #2563eb",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Loading companies…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  if (error)
    return (
      <div style={{ padding: 40 }}>
        <div
          style={{
            padding: "16px 20px",
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: 10,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          ⚠️ {error}
        </div>
        <button
          onClick={fetchDashboard}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Retry
        </button>
      </div>
    );

  const {
    total_companies = 0,
    total_documents = 0,
    expired = 0,
    expiring_soon = 0,
    valid = 0,
    not_available = 0,
    companies = [],
  } = dashboard || {};

  const stats = [
    {
      label: "Companies",
      value: total_companies,
      color: "#2563eb",
      bg: "#eff6ff",
    },
    {
      label: "Total Docs",
      value: total_documents,
      color: "#7c3aed",
      bg: "#f5f3ff",
    },
    { label: "Expired", value: expired, color: "#dc2626", bg: "#fee2e2" },
    {
      label: "Expiring Soon",
      value: expiring_soon,
      color: "#d97706",
      bg: "#fef3c7",
    },
    { label: "Valid", value: valid, color: "#16a34a", bg: "#dcfce7" },
    {
      label: "Not Available",
      value: not_available,
      color: "#6b7280",
      bg: "#f3f4f6",
    },
  ];

  return (
    <div
      style={{
        padding: "30px 60px",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            🏢 Company Documents
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Regulatory licences and documents per company
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleSendNotifications}
            disabled={sendingNotif}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "none",
              cursor: sendingNotif ? "not-allowed" : "pointer",
              background: sendingNotif ? "#94a3b8" : "#f59e0b",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {sendingNotif ? "Sending…" : "📧 Send Expiry Alerts"}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            + Add Company
          </button>
        </div>
      </div>

      {/* ── Notification feedback ── */}
      {notifStatus && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 20,
            background: notifStatus.ok ? "#dcfce7" : "#fee2e2",
            color: notifStatus.ok ? "#16a34a" : "#dc2626",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {notifStatus.ok ? "✓" : "✗"} {notifStatus.msg}
        </div>
      )}

      {/* ── Global stats ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 14,
          marginBottom: 32,
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: s.bg,
              borderRadius: 12,
              padding: "16px 18px",
              border: `1px solid ${s.color}22`,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Company cards ── */}
      {companies.length === 0 ? (
        <div
          style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}
        >
          <div style={{ fontSize: 52, marginBottom: 14 }}>🏢</div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#64748b",
              marginBottom: 6,
            }}
          >
            No companies yet
          </div>
          <div style={{ fontSize: 13 }}>
            Click "+ Add Company" to get started.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {companies.map((c) => (
            <CompanyCard
              key={c.id}
              company={c}
              onClick={() => navigate(`/company-docs/${c.id}`)}
              onDelete={handleDeleteCompany}
            />
          ))}
        </div>
      )}

      {/* ── Add Company Modal ── */}
      {showAddModal && (
        <AddCompanyModal
          onClose={() => setShowAddModal(false)}
          onCreated={fetchDashboard}
        />
      )}
    </div>
  );
};

export default CompanyDocsDashboard;
