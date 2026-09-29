/**
 * VaultDashboard.jsx
 * Zoho-Vault-style password manager: folders on the left, a searchable list
 * of stored website credentials on the right, an add/edit modal with a
 * built-in password generator, and reveal/copy actions that call the
 * server's audit-logged /reveal/ endpoint.
 *
 * Style follows the CompanyDocsDashboard convention used elsewhere in this
 * app (plain inline styles, same color palette) rather than MUI, to match
 * the newest modules in this codebase.
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getVaultItems,
  createVaultItem,
  updateVaultItem,
  deleteVaultItem,
  revealVaultItemPassword,
  generatePassword,
  getGrantableUsers,
  getVaultItemGrants,
  addVaultItemGrant,
  removeVaultItemGrant,
  downloadVaultExtensionZip,
} from "../../api/vaultApi";

// Only full-access TAD accounts may add/edit/delete/share credentials (set by
// the main login flow — see employeeApi.js loginUser). Everyone else only
// uses items explicitly shared with them.
const isFullAccessUser = () => localStorage.getItem("mode") === "full_access";

const COLORS = {
  bg: "#f8fafc",
  border: "#e2e8f0",
  heading: "#0f172a",
  muted: "#64748b",
  blue: "#2563eb",
  red: "#dc2626",
  green: "#16a34a",
  amber: "#f59e0b",
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  fontSize: 13,
  boxSizing: "border-box",
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

// A bare href like "cpanel.texweave.net" resolves as a path relative to the
// current page instead of navigating to that site — always force a scheme.
const toHref = (url) => {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

// navigator.clipboard is only defined in a "secure context" (HTTPS or
// localhost) — this app is served over plain HTTP from an IP address, so
// that API is undefined there and writeText() throws immediately. Fall back
// to the old execCommand("copy") trick, which still works over HTTP.
const copyTextToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through to the execCommand fallback below
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    const ok = document.execCommand("copy");
    if (!ok) throw new Error("execCommand copy failed");
  } finally {
    document.body.removeChild(textarea);
  }
};

const emptyForm = {
  id: null,
  title: "",
  website_url: "",
  username: "",
  password: "",
  notes: "",
  is_favorite: false,
};

// ─── Item form modal (add / edit) ────────────────────────────────────────────
const ItemModal = ({ initial, onClose, onSave }) => {
  const [form, setForm] = useState(initial);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const handleGenerate = () => {
    setForm((f) => ({ ...f, password: generatePassword({ length: 20 }) }));
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setErr("Title is required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        title: form.title.trim(),
        website_url: form.website_url.trim(),
        username: form.username.trim(),
        notes: form.notes,
        is_favorite: !!form.is_favorite,
      };
      // Only send password if the user actually typed/generated one — on
      // edit, leaving it blank means "keep the existing password".
      if (form.password) payload.password = form.password;

      if (form.id) {
        await updateVaultItem(form.id, payload);
      } else {
        await createVaultItem(payload);
      }
      onSave();
    } catch (e2) {
      console.error("Failed to save vault item:", e2);
      setErr(e2.response?.data?.detail || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 28,
          width: 460,
          maxWidth: "92vw",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <h2 style={{ margin: "0 0 18px", fontSize: 18, color: COLORS.heading }}>
          {form.id ? "Edit Credential" : "Add Credential"}
        </h2>

        {err && (
          <div
            style={{
              background: "#fee2e2",
              color: COLORS.red,
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {err}
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted }}>
            Title *
            <input
              style={inputStyle}
              value={form.title}
              onChange={set("title")}
              placeholder="e.g. Company Gmail"
              autoFocus
            />
          </label>

          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted }}>
            Website URL
            <input
              style={inputStyle}
              value={form.website_url}
              onChange={set("website_url")}
              placeholder="https://example.com"
            />
          </label>

          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted }}>
            Username / Email
            <input
              style={inputStyle}
              value={form.username}
              onChange={set("username")}
            />
          </label>

          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted }}>
            Password {form.id && "(leave blank to keep current password)"}
            <div style={{ display: "flex", gap: 6 }}>
              <input
                style={inputStyle}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                placeholder={form.id ? "••••••••" : ""}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                style={{ ...buttonStyle("#f1f5f9", COLORS.heading), padding: "8px 10px" }}
                title={showPassword ? "Hide" : "Show"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                style={{ ...buttonStyle(COLORS.blue), padding: "8px 10px", whiteSpace: "nowrap" }}
                title="Generate a strong password"
              >
                🎲 Generate
              </button>
            </div>
          </label>

          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted }}>
            Notes
            <textarea
              style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
              value={form.notes}
              onChange={set("notes")}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={form.is_favorite} onChange={set("is_favorite")} />
            Mark as favorite
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <button type="button" onClick={onClose} style={buttonStyle("#f1f5f9", COLORS.heading)}>
            Cancel
          </button>
          <button type="submit" disabled={saving} style={buttonStyle(saving ? "#94a3b8" : COLORS.blue)}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── One credential row ───────────────────────────────────────────────────────
const ItemRow = ({ item, onEdit, onDelete, onToggleFavorite, onShare }) => {
  const [revealed, setRevealed] = useState(null); // decrypted password, or null
  const [revealing, setRevealing] = useState(false);
  const [copyStatus, setCopyStatus] = useState(null);
  const [hovered, setHovered] = useState(false);
  const canManage = item.is_owner;

  useEffect(() => {
    if (revealed === null) return undefined;
    const timer = setTimeout(() => setRevealed(null), 20000); // auto-hide after 20s
    return () => clearTimeout(timer);
  }, [revealed]);

  const fetchDecrypted = async () => {
    const res = await revealVaultItemPassword(item.id);
    return res.data.password;
  };

  const handleToggleReveal = async () => {
    if (revealed !== null) {
      setRevealed(null);
      return;
    }
    setRevealing(true);
    try {
      setRevealed(await fetchDecrypted());
    } catch (e) {
      console.error("Failed to reveal password:", e);
      setCopyStatus("Failed to reveal");
      setTimeout(() => setCopyStatus(null), 2000);
    } finally {
      setRevealing(false);
    }
  };

  const handleCopy = async () => {
    try {
      const pw = revealed !== null ? revealed : await fetchDecrypted();
      await copyTextToClipboard(pw);
      setCopyStatus("Copied!");
    } catch (e) {
      console.error("Failed to copy password:", e);
      setCopyStatus("Copy failed");
    } finally {
      setTimeout(() => setCopyStatus(null), 1500);
    }
  };

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: `1px solid ${COLORS.border}`,
        background: hovered ? "#f8fafc" : "transparent",
        transition: "background .12s",
      }}
    >
      <td style={{ padding: "12px" }}>
        <button
          onClick={() => onToggleFavorite(item)}
          title={item.is_favorite ? "Unfavorite" : "Favorite"}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
        >
          {item.is_favorite ? "⭐" : "☆"}
        </button>
      </td>
      <td style={{ padding: "12px" }}>
        <div style={{ fontWeight: 600, color: COLORS.heading, fontSize: 13.5 }}>{item.title}</div>
        {item.website_url && (
          <a
            href={toHref(item.website_url)}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12, color: COLORS.blue, textDecoration: "none" }}
          >
            {item.website_url}
          </a>
        )}
      </td>
      <td style={{ padding: "12px", fontSize: 13, color: COLORS.muted }}>
        {item.username || "—"}
      </td>
      <td
        style={{
          padding: "12px",
          fontSize: 12,
          color: COLORS.muted,
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={item.notes || ""}
      >
        {item.notes || "—"}
      </td>
      <td style={{ padding: "12px" }}>
        {canManage ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 13,
                letterSpacing: revealed === null ? 2 : 0,
                minWidth: 116,
                display: "inline-block",
                background: "#f1f5f9",
                borderRadius: 6,
                padding: "4px 8px",
                color: COLORS.heading,
              }}
            >
              {revealing ? "…" : revealed !== null ? revealed : "••••••••••"}
            </span>
            <button
              onClick={handleToggleReveal}
              title={revealed !== null ? "Hide" : "Reveal"}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 4, borderRadius: 6 }}
            >
              {revealed !== null ? "🙈" : "👁"}
            </button>
            <button
              onClick={handleCopy}
              title="Copy password"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 4, borderRadius: 6 }}
            >
              📋
            </button>
            {copyStatus && (
              <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 600, whiteSpace: "nowrap" }}>{copyStatus}</span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: COLORS.muted, fontStyle: "italic" }}>
            Use the browser extension to log in
          </span>
        )}
      </td>
      <td style={{ padding: "12px", textAlign: "right", whiteSpace: "nowrap" }}>
        {canManage ? (
          <>
            <button
              onClick={() => onShare(item)}
              title={
                item.shared_with_count > 0
                  ? `Shared with ${item.shared_with_count} ${item.shared_with_count === 1 ? "person" : "people"} — click to manage`
                  : "Share this credential"
              }
              style={{ ...buttonStyle("#f1f5f9", COLORS.heading), padding: "6px 10px", marginRight: 6, display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              Share
              {item.shared_with_count > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 16,
                    height: 16,
                    padding: "0 4px",
                    borderRadius: 999,
                    background: COLORS.blue,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {item.shared_with_count}
                </span>
              )}
            </button>
            <button onClick={() => onEdit(item)} style={{ ...buttonStyle("#f1f5f9", COLORS.heading), padding: "6px 10px", marginRight: 6 }}>
              Edit
            </button>
            <button onClick={() => onDelete(item)} style={{ ...buttonStyle("#fee2e2", COLORS.red), padding: "6px 10px" }}>
              Delete
            </button>
          </>
        ) : (
          <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#b45309", background: "#fef3c7" }}>
            Shared with you
          </span>
        )}
      </td>
    </tr>
  );
};

// ─── Share modal: manage who a credential is granted to ─────────────────────
const ShareModal = ({ item, onClose }) => {
  const [grants, setGrants] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(null); // user id currently being added

  const loadGrants = useCallback(async () => {
    try {
      const res = await getVaultItemGrants(item.id);
      setGrants(res.data);
    } catch (e) {
      console.error("Failed to load grants:", e);
      setError("Could not load current shares.");
    } finally {
      setLoading(false);
    }
  }, [item.id]);

  useEffect(() => {
    loadGrants();
  }, [loadGrants]);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await getGrantableUsers(search);
        setCandidates(res.data);
      } catch (e) {
        console.error("Failed to load grantable users:", e);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const grantedIds = new Set(grants.map((g) => g.grantee));

  const handleAdd = async (userId) => {
    setAdding(userId);
    try {
      await addVaultItemGrant(item.id, userId);
      await loadGrants();
    } catch (e) {
      console.error("Failed to share item:", e);
      setError(e.response?.data?.error || "Failed to share.");
    } finally {
      setAdding(null);
    }
  };

  const handleRevoke = async (grantId) => {
    try {
      await removeVaultItemGrant(item.id, grantId);
      await loadGrants();
    } catch (e) {
      console.error("Failed to revoke share:", e);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 24, width: 420, maxWidth: "92vw", maxHeight: "85vh", overflowY: "auto" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 17, color: COLORS.heading }}>Share "{item.title}"</h2>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: COLORS.muted }}>
          People you add can log in via the browser extension. They never see the password on this page.
        </p>

        {error && (
          <div style={{ background: "#fee2e2", color: COLORS.red, padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 6 }}>
            CURRENTLY SHARED WITH{!loading && grants.length > 0 ? ` (${grants.length})` : ""}
          </div>
          {loading ? (
            <div style={{ fontSize: 12, color: COLORS.muted }}>Loading…</div>
          ) : grants.length === 0 ? (
            <div style={{ fontSize: 12, color: COLORS.muted }}>Not shared with anyone yet.</div>
          ) : (
            grants.map((g) => (
              <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                <span style={{ fontSize: 13 }}>{g.grantee_display_name}</span>
                <button onClick={() => handleRevoke(g.id)} style={{ ...buttonStyle("#fee2e2", COLORS.red), padding: "4px 8px", fontSize: 11 }}>
                  Revoke
                </button>
              </div>
            ))
          )}
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 6 }}>ADD SOMEONE</div>
          <input
            style={inputStyle}
            placeholder="Search by username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ marginTop: 8, maxHeight: 180, overflowY: "auto" }}>
            {candidates
              .filter((c) => !grantedIds.has(c.id))
              .map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                  <span style={{ fontSize: 13 }}>{c.display_name}</span>
                  <button
                    onClick={() => handleAdd(c.id)}
                    disabled={adding === c.id}
                    style={{ ...buttonStyle(COLORS.blue), padding: "4px 10px", fontSize: 11 }}
                  >
                    {adding === c.id ? "Adding…" : "Add"}
                  </button>
                </div>
              ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <button onClick={onClose} style={buttonStyle("#f1f5f9", COLORS.heading)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main dashboard ───────────────────────────────────────────────────────────
const VaultDashboard = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalItem, setModalItem] = useState(null); // form data, or null when closed
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const canManageVault = isFullAccessUser();

  const loadItems = useCallback(
    async ({ silent = false } = {}) => {
      // `silent` skips the loading/error UI so the periodic background
      // refresh (below) doesn't flash "Loading…" while someone is reading
      // the list — it just quietly picks up new/removed shares.
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const params = {};
        if (favoritesOnly) params.favorite = "1";
        if (search.trim()) params.search = search.trim();
        const res = await getVaultItems(params);
        setItems(res.data.results || res.data);
      } catch (e) {
        console.error("Failed to load vault items:", e);
        if (!silent) setError("Could not load your vault. Please try again.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [favoritesOnly, search]
  );

  useEffect(() => {
    const t = setTimeout(loadItems, 250); // debounce search
    return () => clearTimeout(t);
  }, [loadItems]);

  // Any change to the underlying filter/search resets pagination — otherwise
  // you can land on a now-empty page 4 of a 2-item result set.
  useEffect(() => {
    setPage(1);
  }, [search, favoritesOnly]);

  useEffect(() => {
    // Another user (a full-access admin) can share/revoke a credential with
    // you at any time — there's no live push for that, so poll quietly in
    // the background rather than requiring a manual page reload to notice.
    const interval = setInterval(() => loadItems({ silent: true }), 15000);
    return () => clearInterval(interval);
  }, [loadItems]);

  const handleToggleFavorite = async (item) => {
    try {
      await updateVaultItem(item.id, { is_favorite: !item.is_favorite });
      loadItems();
    } catch (e) {
      console.error("Failed to update favorite:", e);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVaultItem(deleteTarget.id);
      setDeleteTarget(null);
      loadItems();
    } catch (e) {
      console.error("Failed to delete vault item:", e);
    }
  };

  const handleDownloadExtension = async () => {
    try {
      const res = await downloadVaultExtensionZip();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "TAD-Password-Vault-Extension.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to download the vault extension:", e);
      alert("Failed to download the extension. Please try again.");
    }
  };

  const favoriteCount = items.filter((i) => i.is_favorite).length;
  const sharedCount = items.filter((i) => !i.is_owner).length;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedItems = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = items.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, items.length);
  const stats = [
    { label: "Credentials", value: items.length, color: COLORS.blue, bg: "#eff6ff" },
    { label: "Favorites", value: favoriteCount, color: COLORS.amber, bg: "#fef3c7" },
    { label: "Shared with you", value: sharedCount, color: "#7c3aed", bg: "#f5f3ff" },
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
            🔐
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.heading }}>
              Password Vault
            </h1>
            <p style={{ margin: "4px 0 0", color: COLORS.muted, fontSize: 14 }}>
              Securely store and share access to your website credentials
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="vault-btn" onClick={handleDownloadExtension} style={buttonStyle("#f1f5f9", COLORS.heading)}>
            ⬇️ Download Extension
          </button>
          <button className="vault-btn" onClick={() => navigate("/vault/audit-log")} style={buttonStyle("#f1f5f9", COLORS.heading)}>
            📜 Audit Log
          </button>
          {canManageVault && (
            <button className="vault-btn" onClick={() => navigate("/vault/sharing")} style={buttonStyle("#f1f5f9", COLORS.heading)}>
              🔗 Sharing Overview
            </button>
          )}
          {canManageVault && (
            <button className="vault-btn" onClick={() => setModalItem({ ...emptyForm })} style={buttonStyle(COLORS.blue)}>
              + Add Credential
            </button>
          )}
        </div>
      </div>

      {!canManageVault && (
        <div style={{ background: "#eff6ff", color: COLORS.blue, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          You're viewing credentials shared with you. Only full-access users can add, edit or share vault items.
        </div>
      )}

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

      {/* ── Search / filter bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 16,
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: "12px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <input
            style={{ ...inputStyle, maxWidth: 340 }}
            placeholder="🔍 Search by title, URL or username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.heading, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(e) => setFavoritesOnly(e.target.checked)}
            />
            ⭐ Favorites only
          </label>
        </div>
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

      {error && (
        <div style={{ background: "#fee2e2", color: COLORS.red, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* ── Item list ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: `1px solid ${COLORS.border}`,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(15,23,42,.04)",
        }}
      >
        {loading ? (
          <div style={{ padding: "56px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: `3px solid ${COLORS.border}`,
                borderTop: `3px solid ${COLORS.blue}`,
                borderRadius: "50%",
                animation: "vault-spin .8s linear infinite",
              }}
            />
            <div style={{ fontSize: 13, color: COLORS.muted }}>Loading your vault…</div>
            <style>{`@keyframes vault-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: COLORS.muted }}>
            <div style={{ fontSize: 46, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.heading, marginBottom: 6 }}>
              No credentials yet
            </div>
            <div style={{ fontSize: 13 }}>
              {canManageVault
                ? 'Click "+ Add Credential" to store your first one.'
                : "Nothing has been shared with you yet."}
            </div>
          </div>
        ) : (
          <table className="vault-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: ".03em" }}></th>
                <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: ".03em" }}>Title</th>
                <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: ".03em" }}>Username</th>
                <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: ".03em" }}>Notes</th>
                <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: ".03em" }}>Password</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onEdit={(it) => setModalItem({ ...emptyForm, ...it, password: "" })}
                  onDelete={setDeleteTarget}
                  onToggleFavorite={handleToggleFavorite}
                  onShare={setShareTarget}
                />
              ))}
            </tbody>
          </table>
        )}

        {items.length > 0 && (
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
              Showing {rangeStart}–{rangeEnd} of {items.length}
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

      {modalItem && (
        <ItemModal
          initial={modalItem}
          onClose={() => setModalItem(null)}
          onSave={() => {
            setModalItem(null);
            loadItems();
          }}
        />
      )}

      {deleteTarget && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setDeleteTarget(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 24, width: 360, maxWidth: "90vw" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 16, color: COLORS.heading }}>Delete credential?</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: COLORS.muted }}>
              "{deleteTarget.title}" will be permanently deleted. This cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={buttonStyle("#f1f5f9", COLORS.heading)}>
                Cancel
              </button>
              <button onClick={handleDeleteItem} style={buttonStyle(COLORS.red)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {shareTarget && <ShareModal item={shareTarget} onClose={() => setShareTarget(null)} />}
    </div>
  );
};

export default VaultDashboard;
