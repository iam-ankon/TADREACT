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
      await navigator.clipboard.writeText(pw);
      setCopyStatus("Copied!");
    } catch (e) {
      console.error("Failed to copy password:", e);
      setCopyStatus("Copy failed");
    } finally {
      setTimeout(() => setCopyStatus(null), 1500);
    }
  };

  return (
    <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
      <td style={{ padding: "10px 12px" }}>
        <button
          onClick={() => onToggleFavorite(item)}
          title={item.is_favorite ? "Unfavorite" : "Favorite"}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15 }}
        >
          {item.is_favorite ? "⭐" : "☆"}
        </button>
      </td>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ fontWeight: 600, color: COLORS.heading, fontSize: 13 }}>{item.title}</div>
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
      <td style={{ padding: "10px 12px", fontSize: 13, color: COLORS.muted }}>
        {item.username || "—"}
      </td>
      <td
        style={{
          padding: "10px 12px",
          fontSize: 12,
          color: COLORS.muted,
          maxWidth: 220,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={item.notes || ""}
      >
        {item.notes || "—"}
      </td>
      <td style={{ padding: "10px 12px" }}>
        {canManage ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 13,
                letterSpacing: revealed === null ? 2 : 0,
                minWidth: 110,
                display: "inline-block",
              }}
            >
              {revealing ? "…" : revealed !== null ? revealed : "••••••••••"}
            </span>
            <button
              onClick={handleToggleReveal}
              title={revealed !== null ? "Hide" : "Reveal"}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              {revealed !== null ? "🙈" : "👁"}
            </button>
            <button onClick={handleCopy} title="Copy password" style={{ background: "none", border: "none", cursor: "pointer" }}>
              📋
            </button>
            {copyStatus && (
              <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>{copyStatus}</span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: COLORS.muted, fontStyle: "italic" }}>
            Shared — use the browser extension to log in
          </span>
        )}
      </td>
      <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
        {canManage ? (
          <>
            <button onClick={() => onShare(item)} style={{ ...buttonStyle("#f1f5f9", COLORS.heading), padding: "6px 10px", marginRight: 6 }}>
              Share
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
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 6 }}>CURRENTLY SHARED WITH</div>
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

  return (
    <div style={{ padding: "30px 60px", background: COLORS.bg, minHeight: "100vh" }}>
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
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.heading }}>
            🔐 Password Vault
          </h1>
          <p style={{ margin: "4px 0 0", color: COLORS.muted, fontSize: 14 }}>
            Securely store and share access to your website credentials
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleDownloadExtension} style={buttonStyle("#f1f5f9", COLORS.heading)}>
            ⬇️ Download Extension
          </button>
          <button onClick={() => navigate("/vault/audit-log")} style={buttonStyle("#f1f5f9", COLORS.heading)}>
            📜 Audit Log
          </button>
          {canManageVault && (
            <button onClick={() => setModalItem({ ...emptyForm })} style={buttonStyle(COLORS.blue)}>
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

      <div>
        {/* ── Item list ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <input
              style={{ ...inputStyle, maxWidth: 340 }}
              placeholder="Search by title, URL or username…"
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

          {error && (
            <div style={{ background: "#fee2e2", color: COLORS.red, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>Loading…</div>
            ) : items.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>
                No credentials yet. Click "+ Add Credential" to store your first one.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase" }}></th>
                    <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase" }}>Title</th>
                    <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase" }}>Username</th>
                    <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase" }}>Notes</th>
                    <th style={{ padding: "10px 12px", fontSize: 11, color: COLORS.muted, textTransform: "uppercase" }}>Password</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
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
          </div>
        </div>
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
