/**
 * VaultSharingOverview.jsx
 * Every credential the current user owns, each with who it's shared with —
 * lets shares be reviewed and revoked across the whole vault from one page
 * instead of opening each item's Share modal individually.
 */
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getVaultSharingOverview, removeVaultItemGrant } from "../../api/vaultApi";

const COLORS = {
  bg: "#f8fafc",
  border: "#e2e8f0",
  heading: "#0f172a",
  muted: "#64748b",
  blue: "#2563eb",
  red: "#dc2626",
  green: "#16a34a",
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

const VaultSharingOverview = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [onlyShared, setOnlyShared] = useState(false);
  const [revokingId, setRevokingId] = useState(null); // grant id currently being revoked

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getVaultSharingOverview();
      setItems(res.data);
    } catch (e) {
      console.error("Failed to load sharing overview:", e);
      setError("Could not load the sharing overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleRevoke = async (itemId, grantId) => {
    setRevokingId(grantId);
    try {
      await removeVaultItemGrant(itemId, grantId);
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? { ...it, shared_with: it.shared_with.filter((g) => g.id !== grantId) }
            : it,
        ),
      );
    } catch (e) {
      console.error("Failed to revoke share:", e);
      setError("Could not revoke that share. Please try again.");
    } finally {
      setRevokingId(null);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = items.filter((it) => {
    if (onlyShared && it.shared_with.length === 0) return false;
    if (!q) return true;
    const inTitle = it.title.toLowerCase().includes(q);
    const inPeople = it.shared_with.some(
      (g) =>
        (g.grantee_display_name || "").toLowerCase().includes(q) ||
        (g.grantee_username || "").toLowerCase().includes(q),
    );
    return inTitle || inPeople;
  });

  const totalShares = items.reduce((sum, it) => sum + it.shared_with.length, 0);
  const sharedItemCount = items.filter((it) => it.shared_with.length > 0).length;

  const stats = [
    { label: "Credentials you own", value: items.length, color: COLORS.blue, bg: "#eff6ff" },
    { label: "Shared with someone", value: sharedItemCount, color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Total active shares", value: totalShares, color: COLORS.green, bg: "#dcfce7" },
  ];

  return (
    <div style={{ padding: "30px 60px", background: COLORS.bg, minHeight: "100vh" }}>
      <style>{`
        .vault-btn { transition: filter .12s, transform .12s; }
        .vault-btn:hover { filter: brightness(0.96); }
        .vault-btn:active { transform: translateY(1px); }
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
              background: "#f5f3ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            🔗
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.heading }}>
              Sharing Overview
            </h1>
            <p style={{ margin: "4px 0 0", color: COLORS.muted, fontSize: 14 }}>
              Everyone your credentials are shared with, in one place
            </p>
          </div>
        </div>
        <button className="vault-btn" onClick={() => navigate("/vault")} style={buttonStyle("#f1f5f9", COLORS.heading)}>
          ← Back to Vault
        </button>
      </div>

      {/* ── Stat summary ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
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

      {/* ── Filters ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          marginBottom: 16,
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: "12px 16px",
          flexWrap: "wrap",
        }}
      >
        <input
          style={{ ...inputStyle, width: 280, maxWidth: "100%" }}
          placeholder="Search by credential or person…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.muted, cursor: "pointer" }}>
          <input type="checkbox" checked={onlyShared} onChange={(e) => setOnlyShared(e.target.checked)} />
          Only show shared credentials
        </label>
      </div>

      {/* ── List ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: "56px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: `3px solid ${COLORS.border}`,
                borderTop: `3px solid ${COLORS.blue}`,
                borderRadius: "50%",
                animation: "vault-sharing-spin .8s linear infinite",
              }}
            />
            <div style={{ fontSize: 13, color: COLORS.muted }}>Loading sharing overview…</div>
            <style>{`@keyframes vault-sharing-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${COLORS.border}`, textAlign: "center", padding: "64px 0", color: COLORS.muted }}>
            <div style={{ fontSize: 46, marginBottom: 12 }}>🔗</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.heading, marginBottom: 6 }}>
              {items.length === 0 ? "You don't own any credentials yet" : "No matches"}
            </div>
            <div style={{ fontSize: 13 }}>
              {items.length === 0
                ? "Credentials you add to the vault will show up here."
                : "Try a different search or clear the filter."}
            </div>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              style={{
                background: "#fff",
                borderRadius: 12,
                border: `1px solid ${COLORS.border}`,
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: item.shared_with.length ? 10 : 0 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.heading }}>{item.title}</div>
                  {item.website_url && (
                    <div style={{ fontSize: 12, color: COLORS.muted }}>{item.website_url}</div>
                  )}
                </div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    color: item.shared_with.length ? "#7c3aed" : COLORS.muted,
                    background: item.shared_with.length ? "#f5f3ff" : "#f1f5f9",
                  }}
                >
                  {item.shared_with.length === 0
                    ? "Not shared"
                    : `Shared with ${item.shared_with.length} ${item.shared_with.length === 1 ? "person" : "people"}`}
                </span>
              </div>

              {item.shared_with.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {item.shared_with.map((g) => (
                    <div
                      key={g.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 10px",
                        background: "#f8fafc",
                        borderRadius: 8,
                      }}
                    >
                      <span style={{ fontSize: 13, color: COLORS.heading }}>{g.grantee_display_name}</span>
                      <button
                        onClick={() => handleRevoke(item.id, g.id)}
                        disabled={revokingId === g.id}
                        style={{
                          ...buttonStyle("#fee2e2", COLORS.red),
                          padding: "4px 10px",
                          fontSize: 11,
                          opacity: revokingId === g.id ? 0.6 : 1,
                        }}
                      >
                        {revokingId === g.id ? "Revoking…" : "Revoke"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VaultSharingOverview;
