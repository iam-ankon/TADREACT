/**
 * VaultAuditLog.jsx
 * Read-only trail of who accessed/changed which vault item, and when —
 * mirrors Zoho Vault's audit log. Scoped server-side to the current user's
 * own items (see vault/views.py VaultAuditLogViewSet).
 */
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getVaultAuditLogs, clearVaultAuditLogs } from "../../api/vaultApi";

// Only full-access TAD accounts may clear the audit log (see the main login
// flow in employeeApi.js loginUser, and the backend's IsFullAccessUser check
// on the "clear" action).
const isFullAccessUser = () => localStorage.getItem("mode") === "full_access";

const COLORS = {
  bg: "#f8fafc",
  border: "#e2e8f0",
  heading: "#0f172a",
  muted: "#64748b",
  blue: "#2563eb",
  red: "#dc2626",
};

const buttonStyle = (bg, color = "#fff") => ({
  padding: "9px 16px",
  borderRadius: 8,
  border: "none",
  background: bg,
  color,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
});

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  fontSize: 13,
  boxSizing: "border-box",
};

const ACTION_LABELS = {
  create: { label: "Created", color: "#16a34a", bg: "#dcfce7" },
  update: { label: "Updated", color: "#2563eb", bg: "#dbeafe" },
  delete: { label: "Deleted", color: "#dc2626", bg: "#fee2e2" },
  reveal: { label: "Password revealed", color: "#b45309", bg: "#fef3c7" },
  share: { label: "Access granted", color: "#7c3aed", bg: "#f5f3ff" },
  unshare: { label: "Access revoked", color: "#7c3aed", bg: "#f5f3ff" },
};

const VaultAuditLog = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const canClear = isFullAccessUser();

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getVaultAuditLogs();
      setLogs(res.data.results || res.data);
    } catch (e) {
      console.error("Failed to load vault audit log:", e);
      setError("Could not load the audit log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await clearVaultAuditLogs();
      setConfirmClear(false);
      setPage(1);
      await loadLogs();
    } catch (e) {
      console.error("Failed to clear vault audit log:", e);
      setError("Could not clear the audit log. Please try again.");
    } finally {
      setClearing(false);
    }
  };

  const revealCount = logs.filter((l) => l.action === "reveal").length;
  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedLogs = logs.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = logs.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, logs.length);

  const stats = [
    { label: "Total entries", value: logs.length, color: COLORS.blue, bg: "#eff6ff" },
    { label: "Password reveals", value: revealCount, color: "#b45309", bg: "#fef3c7" },
  ];

  return (
    <div style={{ padding: "30px 60px", background: COLORS.bg, minHeight: "100vh" }}>
      <style>{`
        .vault-btn { transition: filter .12s, transform .12s; }
        .vault-btn:hover { filter: brightness(0.96); }
        .vault-btn:active { transform: translateY(1px); }
        .vault-table thead th { position: sticky; top: 0; z-index: 1; }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            📜
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.heading }}>
              Vault Audit Log
            </h1>
            <p style={{ margin: "4px 0 0", color: COLORS.muted, fontSize: 14 }}>
              Every create, update, delete and password reveal on your vault
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {canClear && logs.length > 0 && (
            <button
              className="vault-btn"
              onClick={() => setConfirmClear(true)}
              style={buttonStyle("#fee2e2", COLORS.red)}
            >
              🗑️ Delete All
            </button>
          )}
          <button
            className="vault-btn"
            onClick={() => navigate("/vault")}
            style={buttonStyle("#f1f5f9", COLORS.heading)}
          >
            ← Back to Vault
          </button>
        </div>
      </div>

      {/* ── Stat summary ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 14,
          marginBottom: 24,
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
              boxShadow: "0 1px 2px rgba(15,23,42,.03)",
              transition: "transform .12s, box-shadow .12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(15,23,42,.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,.03)";
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: COLORS.red, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {logs.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 14,
            marginBottom: 16,
            background: "#fff",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: "12px 16px",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.muted }}>
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{ ...inputStyle, width: "auto", padding: "6px 8px" }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(15,23,42,.04)" }}>
        {loading ? (
          <div style={{ padding: "56px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: `3px solid ${COLORS.border}`,
                borderTop: `3px solid ${COLORS.blue}`,
                borderRadius: "50%",
                animation: "vault-audit-spin .8s linear infinite",
              }}
            />
            <div style={{ fontSize: 13, color: COLORS.muted }}>Loading audit log…</div>
            <style>{`@keyframes vault-audit-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: COLORS.muted }}>
            <div style={{ fontSize: 46, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.heading, marginBottom: 6 }}>
              No activity recorded yet
            </div>
            <div style={{ fontSize: 13 }}>Actions on your vault will show up here.</div>
          </div>
        ) : (
          <table className="vault-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase" }}>When</th>
                <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase" }}>Item</th>
                <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase" }}>Action</th>
                <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase" }}>Details</th>
                <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase" }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {pagedLogs.map((log) => {
                const meta = ACTION_LABELS[log.action] || { label: log.action, color: COLORS.muted, bg: "#f1f5f9" };
                return (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: COLORS.muted, whiteSpace: "nowrap" }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: COLORS.heading, fontWeight: 600 }}>
                      {log.item_title_snapshot || "(deleted item)"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: meta.color, background: meta.bg }}>
                        {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: COLORS.muted }}>{log.detail || "—"}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: COLORS.muted }}>{log.ip_address || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {logs.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              padding: "12px 16px",
              borderTop: `1px solid ${COLORS.border}`,
              background: "#f8fafc",
            }}
          >
            <span style={{ fontSize: 12, color: COLORS.muted }}>
              Showing {rangeStart}–{rangeEnd} of {logs.length}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                className="vault-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                style={{
                  ...buttonStyle("#fff", COLORS.heading),
                  padding: "6px 12px",
                  border: `1px solid ${COLORS.border}`,
                  opacity: safePage <= 1 ? 0.5 : 1,
                  cursor: safePage <= 1 ? "default" : "pointer",
                }}
              >
                ← Prev
              </button>
              <span style={{ fontSize: 12, color: COLORS.muted, padding: "0 4px" }}>
                Page {safePage} of {totalPages}
              </span>
              <button
                className="vault-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                style={{
                  ...buttonStyle("#fff", COLORS.heading),
                  padding: "6px 12px",
                  border: `1px solid ${COLORS.border}`,
                  opacity: safePage >= totalPages ? 0.5 : 1,
                  cursor: safePage >= totalPages ? "default" : "pointer",
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmClear && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => !clearing && setConfirmClear(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 24, width: 380, maxWidth: "90vw" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 16, color: COLORS.heading }}>Delete all audit log entries?</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: COLORS.muted }}>
              This permanently deletes all {logs.length} entries in your audit log. This cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setConfirmClear(false)} disabled={clearing} style={buttonStyle("#f1f5f9", COLORS.heading)}>
                Cancel
              </button>
              <button onClick={handleClearAll} disabled={clearing} style={buttonStyle(clearing ? "#94a3b8" : COLORS.red)}>
                {clearing ? "Deleting…" : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultAuditLog;
