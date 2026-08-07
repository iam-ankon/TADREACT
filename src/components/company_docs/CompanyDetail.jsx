/**
 * CompanyDetail.jsx  –  fixed
 *
 * Bugs fixed:
 *  1. file_url was being double-prefixed with backendURL (backend now returns
 *     absolute URLs, so we use file_url directly)
 *  2. files array was always empty because the documents/ endpoint wasn't
 *     prefetch_related – fixed in backend; frontend now reads doc.files correctly
 *  3. DocFormModal: addCategory was passing { category } as initialData which
 *     looked like an "edit" (because it had a category key); fixed by passing
 *     defaultCategory prop separately
 *  4. DocFormModal initialData null-check – when both editDoc AND addCategory
 *     could conflict, now cleanly separated
 *  5. Error messages from Django shown properly (field-level errors)
 *  6. Loading guard was set to false even on error, hiding the actual issue
 *  7. Status filter now done client-side on live-computed status (matches backend)
 */
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCompany,
  getCompanyDocuments,
  createDocumentType,
  updateDocumentType,
  deleteDocumentType,
  uploadDocumentFile,
  deleteDocumentFile,
  sendExpiryNotifications,
  CATEGORY_LABELS,
  STATUS_CONFIG,
} from "../../api/companyDocsApi";

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_available;
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ── Days chip ────────────────────────────────────────────────────────────────
const DaysChip = ({ days, status }) => {
  if (days == null)
    return <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>;
  const color =
    status === "expired"
      ? "#dc2626"
      : status === "expiring_soon"
        ? "#d97706"
        : "#16a34a";
  const label = days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`;
  return <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>;
};

// ── File list (expanded row) ──────────────────────────────────────────────────
const FileList = ({ files, onDeleteFile }) => {
  if (!files || files.length === 0) {
    return (
      <span style={{ fontSize: 12, color: "#94a3b8" }}>
        No files uploaded yet.
      </span>
    );
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {files.map((f) => {
        // file_url is already absolute (backend builds it with request.build_absolute_uri)
        const href = f.file_url || null;
        return (
          <div
            key={f.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "6px 12px",
            }}
          >
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: "#2563eb",
                  textDecoration: "none",
                }}
              >
                📄 {f.original_filename || "Document"}
              </a>
            ) : (
              <span style={{ fontSize: 12, color: "#64748b" }}>
                📄 {f.original_filename || "Document"}
              </span>
            )}
            {f.file_size_kb != null && (
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                {f.file_size_kb} KB
              </span>
            )}
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {f.uploaded_at
                ? new Date(f.uploaded_at).toLocaleDateString("en-GB")
                : ""}
            </span>
            <button
              onClick={() => onDeleteFile(f.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#ef4444",
                fontSize: 13,
                lineHeight: 1,
              }}
              title="Remove file"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ── Document row ──────────────────────────────────────────────────────────────
const DocRow = ({ doc, onEdit, onDelete, onUpload, onDeleteFile }) => {
  const [expanded, setExpanded] = useState(false);
  const fileCount = doc.files ? doc.files.length : 0;

  return (
    <>
      <tr
        style={{
          borderBottom: "1px solid #f1f5f9",
          background: expanded ? "#f8fafc" : "#fff",
        }}
      >
        <td style={{ padding: "11px 16px" }}>
          <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>
            {doc.document_name}
          </div>
          {doc.responsible_person && (
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              👤 {doc.responsible_person}
            </div>
          )}
          {doc.document_number && (
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
              🔢 {doc.document_number}
            </div>
          )}
        </td>
        <td style={{ padding: "11px 16px", color: "#64748b", fontSize: 13 }}>
          {doc.branch_location || "—"}
        </td>
        <td style={{ padding: "11px 16px", color: "#64748b", fontSize: 13 }}>
          {doc.expiry_date
            ? new Date(doc.expiry_date + "T00:00:00").toLocaleDateString(
                "en-GB",
                { day: "2-digit", month: "short", year: "numeric" },
              )
            : "—"}
        </td>
        <td style={{ padding: "11px 16px" }}>
          <DaysChip days={doc.days_remaining} status={doc.status} />
        </td>
        <td style={{ padding: "11px 16px" }}>
          <StatusBadge status={doc.status} />
        </td>
        <td style={{ padding: "11px 16px" }}>
          {doc.remarks && (
            <span
              style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}
            >
              {doc.remarks.length > 45
                ? doc.remarks.slice(0, 45) + "…"
                : doc.remarks}
            </span>
          )}
        </td>
        <td style={{ padding: "11px 16px" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* Upload — the primary, most-visible action for this row */}
            <button
              onClick={() => onUpload(doc)}
              title="Upload a file for this document"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 6,
                border: "none",
                background: fileCount === 0 ? "#7c3aed" : "#ede9fe",
                color: fileCount === 0 ? "#fff" : "#7c3aed",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              📎 {fileCount === 0 ? "Upload File" : `Upload (${fileCount})`}
            </button>
            <button
              onClick={() => setExpanded((p) => !p)}
              title={expanded ? "Hide attached files" : "View attached files"}
              disabled={fileCount === 0}
              style={{
                padding: "5px 9px",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                background: expanded ? "#eff6ff" : "#fff",
                fontSize: 12,
                cursor: fileCount === 0 ? "default" : "pointer",
                color: fileCount === 0 ? "#cbd5e1" : "#2563eb",
              }}
            >
              📂
            </button>
            <button
              onClick={() => onEdit(doc)}
              title="Edit"
              style={{
                padding: "5px 9px",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                background: "#fff",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(doc.id, doc.document_name)}
              title="Delete"
              style={{
                padding: "5px 9px",
                borderRadius: 6,
                border: "1px solid #fee2e2",
                background: "#fff",
                fontSize: 12,
                cursor: "pointer",
                color: "#ef4444",
              }}
            >
              🗑
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: "#f8fafc" }}>
          <td colSpan={7} style={{ padding: "8px 24px 16px" }}>
            <FileList files={doc.files} onDeleteFile={onDeleteFile} />
          </td>
        </tr>
      )}
      {!expanded && fileCount === 0 && (
        <tr style={{ background: "#fffbeb" }}>
          <td
            colSpan={7}
            style={{ padding: "6px 24px", fontSize: 11, color: "#b45309" }}
          >
            ⚠ No file attached yet — click <strong>"Upload File"</strong> above
            to attach the licence/document copy.
          </td>
        </tr>
      )}
    </>
  );
};

// ── Category accordion section ────────────────────────────────────────────────
const CategorySection = ({
  category,
  docs,
  onEdit,
  onDelete,
  onUpload,
  onDeleteFile,
  onAddInCategory,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const label = CATEGORY_LABELS[category] || category;
  const expiredCount = docs.filter((d) => d.status === "expired").length;
  const expiringSoonCount = docs.filter(
    (d) => d.status === "expiring_soon",
  ).length;

  return (
    <div
      style={{
        marginBottom: 20,
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setCollapsed((p) => !p)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 18px",
          background: "#f8fafc",
          cursor: "pointer",
          borderBottom: collapsed ? "none" : "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
            {label}
          </span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            ({docs.length})
          </span>
          {expiredCount > 0 && (
            <span
              style={{
                fontSize: 11,
                background: "#fee2e2",
                color: "#dc2626",
                padding: "1px 8px",
                borderRadius: 99,
                fontWeight: 600,
              }}
            >
              {expiredCount} expired
            </span>
          )}
          {expiringSoonCount > 0 && (
            <span
              style={{
                fontSize: 11,
                background: "#fef3c7",
                color: "#d97706",
                padding: "1px 8px",
                borderRadius: 99,
                fontWeight: 600,
              }}
            >
              {expiringSoonCount} expiring
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddInCategory(category);
            }}
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            + Add
          </button>
          <span style={{ color: "#94a3b8", fontSize: 12 }}>
            {collapsed ? "▼" : "▲"}
          </span>
        </div>
      </div>

      {/* Table */}
      {!collapsed && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}
          >
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {[
                  "Document",
                  "Branch",
                  "Expiry Date",
                  "Days Left",
                  "Status",
                  "Remarks",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "9px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: ".5px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUpload={onUpload}
                  onDeleteFile={onDeleteFile}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Document Form Modal ───────────────────────────────────────────────────────
const DocFormModal = ({
  companyId,
  editDoc,
  defaultCategory,
  onClose,
  onSaved,
}) => {
  const isEdit = !!editDoc;
  const [form, setForm] = useState({
    company: companyId,
    category: editDoc?.category || defaultCategory || "trade_license",
    branch_location: editDoc?.branch_location || "",
    document_name: editDoc?.document_name || "",
    document_number: editDoc?.document_number || "",
    issue_date: editDoc?.issue_date || "",
    expiry_date: editDoc?.expiry_date || "",
    remarks: editDoc?.remarks || "",
    responsible_person: editDoc?.responsible_person || "",
  });
  const [file, setFile] = useState(null); // optional file attached at creation time
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.document_name.trim()) {
      setErr("Document name is required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      let docId = editDoc?.id;
      if (isEdit) {
        await updateDocumentType(editDoc.id, form);
      } else {
        const created = await createDocumentType(form);
        docId = created.data.id;
      }

      // If a file was selected, upload it right after the document is saved
      if (file && docId) {
        const fd = new FormData();
        fd.append("document_type", docId);
        fd.append("file", file);
        try {
          await uploadDocumentFile(fd);
        } catch (uploadErr) {
          // Document itself saved fine — surface the upload issue separately
          // so the user doesn't think the whole save failed.
          setErr(
            "Document saved, but the file upload failed. " +
              "You can retry by clicking the 'Upload File' button on this document.",
          );
          setSaving(false);
          onSaved();
          return;
        }
      }

      onSaved();
      onClose();
    } catch (ex) {
      const data = ex.response?.data;
      const msg = data
        ? typeof data === "object"
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : String(data)
        : "Failed to save. Please try again.";
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
        zIndex: 1001,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          width: 560,
          maxWidth: "95vw",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17, color: "#0f172a" }}>
            {isEdit ? "Edit Document" : "Add Document"}
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
              marginBottom: 14,
            }}
          >
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Category */}
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
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              style={{ ...inputStyle, background: "#fff" }}
            >
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Document Name */}
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
              Document Name *
            </label>
            <input
              type="text"
              value={form.document_name}
              onChange={(e) => set("document_name", e.target.value)}
              placeholder="e.g. Trade License – Dhanmondi"
              required
              style={inputStyle}
            />
          </div>

          {/* Branch */}
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
              Branch / Location
            </label>
            <input
              type="text"
              value={form.branch_location}
              onChange={(e) => set("branch_location", e.target.value)}
              placeholder="e.g. Dhanmondi, Gulshan, HO"
              style={inputStyle}
            />
          </div>

          {/* Doc number */}
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
              Document / Licence No.
            </label>
            <input
              type="text"
              value={form.document_number}
              onChange={(e) => set("document_number", e.target.value)}
              placeholder="e.g. TRAD/DNCC/120756/2022"
              style={inputStyle}
            />
          </div>

          {/* Person */}
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
              Responsible Person
            </label>
            <input
              type="text"
              value={form.responsible_person}
              onChange={(e) => set("responsible_person", e.target.value)}
              placeholder="Name of licence holder / contact"
              style={inputStyle}
            />
          </div>

          {/* Dates */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 4,
                }}
              >
                Issue Date
              </label>
              <input
                type="date"
                value={form.issue_date}
                onChange={(e) => set("issue_date", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 4,
                }}
              >
                Expiry Date
              </label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => set("expiry_date", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Remarks */}
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 4,
              }}
            >
              Remarks
            </label>
            <textarea
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              rows={2}
              placeholder="Any notes or status comments"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* File upload — attach the licence/document copy right here */}
          <div
            style={{
              marginBottom: 20,
              padding: "14px 16px",
              borderRadius: 10,
              border: "1px dashed #c4b5fd",
              background: "#faf5ff",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "#6d28d9",
                marginBottom: 6,
              }}
            >
              📎{" "}
              {isEdit
                ? "Replace / Attach File (optional)"
                : "Attach File (optional)"}
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0] || null)}
              style={{ fontSize: 12, width: "100%" }}
            />
            {file && (
              <div style={{ fontSize: 11, color: "#6d28d9", marginTop: 6 }}>
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
            {isEdit && editDoc?.files?.length > 0 && (
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                This document already has {editDoc.files.length} file(s)
                attached. Uploading here adds another — it won't remove the
                existing ones.
              </div>
            )}
            {!isEdit && (
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                You can also skip this and upload the file later using the
                "Upload File" button on the document row.
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
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
              {saving
                ? "Saving…"
                : isEdit
                  ? "Update"
                  : file
                    ? "Add Document + Upload File"
                    : "Add Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── File Upload Modal ─────────────────────────────────────────────────────────
const FileUploadModal = ({ doc, onClose, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [desc, setDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setErr("Please select a file.");
      return;
    }
    setUploading(true);
    setErr(null);
    const fd = new FormData();
    fd.append("document_type", doc.id);
    fd.append("file", file);
    if (desc.trim()) fd.append("description", desc.trim());
    try {
      await uploadDocumentFile(fd);
      onUploaded();
      onClose();
    } catch (ex) {
      const msg = ex.response?.data
        ? typeof ex.response.data === "object"
          ? JSON.stringify(ex.response.data)
          : String(ex.response.data)
        : "Upload failed. Please try again.";
      setErr(msg);
      setUploading(false);
    }
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
        zIndex: 1001,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          width: 420,
          maxWidth: "95vw",
          boxShadow: "0 20px 60px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>
            Upload Document
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
        <p style={{ margin: "0 0 18px", fontSize: 13, color: "#64748b" }}>
          <strong>{doc.document_name}</strong>
          {doc.branch_location ? ` – ${doc.branch_location}` : ""}
        </p>

        {err && (
          <div
            style={{
              padding: "10px 12px",
              background: "#fee2e2",
              color: "#dc2626",
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 14,
            }}
          >
            {err}
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              File (PDF, JPG, PNG, DOCX)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ fontSize: 13, width: "100%" }}
            />
            {file && (
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 4,
              }}
            >
              Description (optional)
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Renewed copy – 2026"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
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
              disabled={uploading}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                background: "#7c3aed",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: uploading ? "not-allowed" : "pointer",
                opacity: uploading ? 0.7 : 1,
              }}
            >
              {uploading ? "Uploading…" : "Upload File"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modal state – cleanly separated
  const [editDoc, setEditDoc] = useState(null); // doc object when editing
  const [addCategory, setAddCategory] = useState(null); // category string when adding
  const [uploadDoc, setUploadDoc] = useState(null); // doc object for file upload

  const [notifStatus, setNotifStatus] = useState(null);
  const [sendingNotif, setSendingNotif] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [compRes, docsRes] = await Promise.all([
        getCompany(id),
        getCompanyDocuments(id),
      ]);
      setCompany(compRes.data);
      // backend returns array directly from the documents/ action
      const docsData = Array.isArray(docsRes.data)
        ? docsRes.data
        : docsRes.data?.results || [];
      setDocuments(docsData);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err.message);
      setError(
        err.response?.status === 404
          ? "Company not found."
          : err.response?.status === 401
            ? "Session expired – please log in again."
            : `Failed to load data: ${err.message}`,
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteDoc = async (docId, name) => {
    if (!window.confirm(`Delete document "${name}"?`)) return;
    try {
      await deleteDocumentType(docId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete document.");
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Remove this file?")) return;
    try {
      await deleteDocumentFile(fileId);
      fetchData();
    } catch {
      alert("Failed to remove file.");
    }
  };

  const handleSendNotifications = async () => {
    setSendingNotif(true);
    setNotifStatus(null);
    try {
      const res = await sendExpiryNotifications(90);
      setNotifStatus({ ok: true, msg: res.data.message });
    } catch (err) {
      setNotifStatus({
        ok: false,
        msg: err.response?.data?.message || "Failed to send.",
      });
    } finally {
      setSendingNotif(false);
    }
  };

  // ── Render states ──────────────────────────────────────────────────────────
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
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Loading documents…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  if (error)
    return (
      <div style={{ padding: 40 }}>
        <button
          onClick={() => navigate("/company-docs")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#2563eb",
            fontSize: 13,
            padding: 0,
            marginBottom: 16,
          }}
        >
          ← Back to Companies
        </button>
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
          onClick={fetchData}
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

  // ── Filter ─────────────────────────────────────────────────────────────────
  let filtered = documents;
  if (categoryFilter !== "all")
    filtered = filtered.filter((d) => d.category === categoryFilter);
  if (statusFilter !== "all")
    filtered = filtered.filter((d) => d.status === statusFilter);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        (d.document_name || "").toLowerCase().includes(q) ||
        (d.branch_location || "").toLowerCase().includes(q) ||
        (d.document_number || "").toLowerCase().includes(q) ||
        (d.responsible_person || "").toLowerCase().includes(q),
    );
  }

  // Group by category
  const grouped = {};
  filtered.forEach((d) => {
    if (!grouped[d.category]) grouped[d.category] = [];
    grouped[d.category].push(d);
  });

  // Stats from raw documents (live status from backend)
  const totalDocs = documents.length;
  const expiredCount = documents.filter((d) => d.status === "expired").length;
  const expiringSoonCount = documents.filter(
    (d) => d.status === "expiring_soon",
  ).length;
  const validCount = documents.filter((d) => d.status === "valid").length;

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
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 22,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <button
            onClick={() => navigate("/company-docs")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#2563eb",
              fontSize: 13,
              padding: 0,
              marginBottom: 6,
              display: "block",
            }}
          >
            ← Back to Companies
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            {company?.name || "Company"}
          </h1>
          {company?.short_name && (
            <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 13 }}>
              {company.short_name}
            </p>
          )}
          {company?.address && (
            <p style={{ margin: "2px 0 0", color: "#94a3b8", fontSize: 12 }}>
              📍 {company.address}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleSendNotifications}
            disabled={sendingNotif}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: sendingNotif ? "#94a3b8" : "#f59e0b",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {sendingNotif ? "Sending…" : "📧 Send Expiry Alert"}
          </button>
          <button
            onClick={() => setAddCategory("other")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add Document
          </button>
        </div>
      </div>

      {notifStatus && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 8,
            background: notifStatus.ok ? "#dcfce7" : "#fee2e2",
            color: notifStatus.ok ? "#16a34a" : "#dc2626",
            fontSize: 13,
          }}
        >
          {notifStatus.ok ? "✓" : "✗"} {notifStatus.msg}
        </div>
      )}

      {/* ── Stats ── */}
      <div
        style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}
      >
        {[
          {
            label: "Total Docs",
            value: totalDocs,
            color: "#2563eb",
            bg: "#eff6ff",
          },
          {
            label: "Expired",
            value: expiredCount,
            color: "#dc2626",
            bg: "#fee2e2",
          },
          {
            label: "Expiring Soon",
            value: expiringSoonCount,
            color: "#d97706",
            bg: "#fef3c7",
          },
          {
            label: "Valid",
            value: validCount,
            color: "#16a34a",
            bg: "#dcfce7",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              background: s.bg,
              minWidth: 90,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search documents…"
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 13,
            minWidth: 200,
            outline: "none",
          }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 13,
            background: "#fff",
          }}
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 13,
            background: "#fff",
          }}
        >
          <option value="all">All Statuses</option>
          <option value="expired">🔴 Expired</option>
          <option value="expiring_soon">🟡 Expiring Soon</option>
          <option value="valid">🟢 Valid</option>
          <option value="not_available">⚪ Not Available</option>
          <option value="need_apply">🟣 Need to Apply</option>
        </select>
        {(search || categoryFilter !== "all" || statusFilter !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
              setStatusFilter("all");
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "#fff",
              fontSize: 12,
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Document groups ── */}
      {Object.keys(grouped).length === 0 ? (
        <div
          style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}
        >
          <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
          <div style={{ fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
            {documents.length === 0
              ? "No documents added yet"
              : "No documents match your filters"}
          </div>
          <div style={{ fontSize: 13 }}>
            {documents.length === 0
              ? 'Use "+ Add Document" to start tracking regulatory documents.'
              : "Try clearing your search or filter."}
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, docs]) => (
          <CategorySection
            key={cat}
            category={cat}
            docs={docs}
            onEdit={setEditDoc}
            onDelete={handleDeleteDoc}
            onUpload={setUploadDoc}
            onDeleteFile={handleDeleteFile}
            onAddInCategory={(cat) => setAddCategory(cat)}
          />
        ))
      )}

      {/* ── Modals ── */}
      {editDoc && (
        <DocFormModal
          companyId={parseInt(id)}
          editDoc={editDoc}
          defaultCategory={null}
          onClose={() => setEditDoc(null)}
          onSaved={fetchData}
        />
      )}
      {addCategory && !editDoc && (
        <DocFormModal
          companyId={parseInt(id)}
          editDoc={null}
          defaultCategory={addCategory}
          onClose={() => setAddCategory(null)}
          onSaved={fetchData}
        />
      )}
      {uploadDoc && (
        <FileUploadModal
          doc={uploadDoc}
          onClose={() => setUploadDoc(null)}
          onUploaded={fetchData}
        />
      )}
    </div>
  );
};

export default CompanyDetail;
