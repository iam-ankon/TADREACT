/**
 * VaultAuditLog.jsx
 * Read-only trail of who accessed/changed which vault item, and when —
 * mirrors Zoho Vault's audit log. Scoped server-side to the current user's
 * own items (see vault/views.py VaultAuditLogViewSet).
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getVaultAuditLogs } from "../../api/vaultApi";

const COLORS = {
  bg: "#f8fafc",
  border: "#e2e8f0",
  heading: "#0f172a",
  muted: "#64748b",
  blue: "#2563eb",
};

const ACTION_LABELS = {
  create: { label: "Created", color: "#16a34a", bg: "#dcfce7" },
  update: { label: "Updated", color: "#2563eb", bg: "#dbeafe" },
  delete: { label: "Deleted", color: "#dc2626", bg: "#fee2e2" },
  reveal: { label: "Password revealed", color: "#b45309", bg: "#fef3c7" },
};

const VaultAuditLog = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getVaultAuditLogs();
        setLogs(res.data.results || res.data);
      } catch (e) {
        console.error("Failed to load vault audit log:", e);
        setError("Could not load the audit log.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ padding: "30px 60px", background: COLORS.bg, minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.heading }}>📜 Vault Audit Log</h1>
          <p style={{ margin: "4px 0 0", color: COLORS.muted, fontSize: 14 }}>
            Every create, update, delete and password reveal on your vault
          </p>
        </div>
        <button
          onClick={() => navigate("/vault")}
          style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "#f1f5f9", color: COLORS.heading, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          ← Back to Vault
        </button>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>Loading…</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>No activity recorded yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase" }}>When</th>
                <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase" }}>Item</th>
                <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase" }}>Action</th>
                <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase" }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
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
                    <td style={{ padding: "10px 12px", fontSize: 12, color: COLORS.muted }}>{log.ip_address || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default VaultAuditLog;
