// Generic list + add/edit modal, config-driven. Front Desk has five flat,
// uniformly-shaped logs (courier, sample routing, vendor receipts,
// visitors, meeting rooms) - one table component beats five near-identical
// page files.
import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import { styles, STATUS_COLORS } from "./frontDeskTheme";

/**
 * columns: [{ key, label, render?(row) }]
 * fields: [{ name, label, type: 'text'|'date'|'number'|'select'|'textarea'|'checkbox'|custom,
 *            options?, span?: 'full', Component?: custom field renderer ({value,onChange}) }]
 * api: { list, create, update, remove }
 */
const CrudTable = ({ title, subtitle, columns, fields, api, emptyLabel = "No records yet", canManage = true }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...row} = edit
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api
      .list()
      .then((res) => setRows(res.data?.results || res.data || []))
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    const blank = {};
    fields.forEach((f) => (blank[f.name] = f.type === "checkbox" ? false : ""));
    setForm(blank);
    setEditing({});
  };

  const openEdit = (row) => {
    setForm({ ...row });
    setEditing(row);
  };

  const closeModal = () => {
    setEditing(null);
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      fields.forEach((f) => {
        if (payload[f.name] === "") payload[f.name] = null;
      });
      if (editing && editing.id) {
        await api.update(editing.id, payload);
      } else {
        await api.create(payload);
      }
      closeModal();
      load();
    } catch (e) {
      setError(e.response?.data ? JSON.stringify(e.response.data) : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Delete this record?")) return;
    await api.remove(row.id);
    load();
  };

  const filtered = search
    ? rows.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
      )
    : rows;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{title}</h1>
          {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            style={styles.searchBar}
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {canManage && (
            <button style={styles.btnPrimary} onClick={openAdd}>
              <FiPlus /> Add
            </button>
          )}
        </div>
      </div>

      <div style={styles.card}>
        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>{emptyLabel}</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th style={styles.th} key={c.key}>{c.label}</th>
                  ))}
                  {canManage && <th style={styles.th}></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    {columns.map((c) => (
                      <td style={styles.td} key={c.key}>
                        {c.render ? c.render(row) : row[c.key] ?? "—"}
                      </td>
                    ))}
                    {canManage && (
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button style={styles.btnOutline} onClick={() => openEdit(row)} title="Edit">
                            <FiEdit2 size={13} />
                          </button>
                          <button style={styles.btnDanger} onClick={() => handleDelete(row)} title="Delete">
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing !== null && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editing.id ? "Edit Record" : `Add ${title}`}</h2>
            {error && <div style={{ color: "#dc2626", fontSize: "12.5px", marginBottom: "10px" }}>{error}</div>}
            <div style={styles.formGrid}>
              {fields.map((f) => (
                <div key={f.name} style={f.span === "full" ? styles.fieldFull : styles.field}>
                  <label style={styles.label}>{f.label}</label>
                  {f.Component ? (
                    <f.Component
                      value={form[f.name]}
                      onChange={(v) => setForm((prev) => ({ ...prev, [f.name]: v }))}
                    />
                  ) : f.type === "select" ? (
                    <select
                      style={styles.input}
                      value={form[f.name] ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      {f.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      style={{ ...styles.input, minHeight: "70px" }}
                      value={form[f.name] ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                    />
                  ) : f.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={!!form[f.name]}
                      onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.checked }))}
                    />
                  ) : (
                    <input
                      style={styles.input}
                      type={f.type || "text"}
                      value={form[f.name] ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnOutline} onClick={closeModal}>
                <FiX /> Cancel
              </button>
              <button style={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const statusBadge = (value) => {
  const [bg, color] = STATUS_COLORS[value] || ["#f1f5f9", "#475569"];
  return <span style={styles.badge(bg, color)}>{value}</span>;
};

export default CrudTable;
