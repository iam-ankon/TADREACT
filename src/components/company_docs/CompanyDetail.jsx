/**
 * CompanyDetail.jsx
 *
 * One company's regulatory documents, grouped by category: add/edit/delete
 * documents, upload/remove files, filters, and the expiry digest email.
 * Look shared with the dashboard via companyDocsTheme.js; sidebar comes from
 * CompanyDocsLayout (App.jsx).
 *
 * Data notes kept from the earlier version:
 *  - file_url is already absolute (backend builds it with build_absolute_uri)
 *  - status / days_remaining are computed live by the backend
 *  - blank dates are sent as null (DRF DateField rejects "")
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiFile,
  FiFileText,
  FiFolder,
  FiHash,
  FiInbox,
  FiMail,
  FiMapPin,
  FiMinusCircle,
  FiPaperclip,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiX,
} from "react-icons/fi";
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
import { COMPANY_DOCS_CSS, apiErrorMessage, notifyCompanyDocsChanged } from "./companyDocsTheme";

const STATUS_ICONS = {
  valid: <FiCheckCircle />,
  expiring_soon: <FiClock />,
  expired: <FiAlertTriangle />,
  not_available: <FiMinusCircle />,
  need_apply: <FiAlertTriangle />,
};

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.doc,.docx";

const formatDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

// ── Status pill ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const key = STATUS_CONFIG[status] ? status : "not_available";
  return (
    <span className={`cd-pill ${key}`}>
      {STATUS_ICONS[key]}
      {STATUS_CONFIG[key].label}
    </span>
  );
};

// ── Days left ─────────────────────────────────────────────────────────────────
const DaysChip = ({ days, status }) => {
  if (days == null) return <span className="cd-muted">—</span>;
  const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d left`;
  return <span className={`cd-days ${status}`}>{label}</span>;
};

// ── File picker (click or drag & drop) ────────────────────────────────────────
const FilePicker = ({ file, onChange, label = "Choose a file or drag it here" }) => {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  return (
    <>
      <label
        className={`cd-drop ${drag ? "drag" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onChange(f);
        }}
      >
        <FiUploadCloud size={22} />
        <strong>{label}</strong>
        <span>PDF, JPG, PNG, DOC, DOCX</span>
        <input ref={inputRef} type="file" accept={ACCEPT} onChange={(e) => onChange(e.target.files[0] || null)} />
      </label>
      {file && (
        <div className="cd-picked">
          <FiFile />
          <span className="grow" title={file.name}>
            {file.name}
          </span>
          <span className="meta">{(file.size / 1024).toFixed(1)} KB</span>
          <button
            type="button"
            className="cd-icon-btn"
            title="Remove"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            <FiX />
          </button>
        </div>
      )}
    </>
  );
};

// ── Attached files (expanded row) ─────────────────────────────────────────────
const FileList = ({ files, onDeleteFile }) => {
  if (!files || files.length === 0) return <span className="cd-muted">No files uploaded yet.</span>;
  return (
    <div className="cd-files">
      {files.map((f) => {
        const href = f.file_url || null;
        const name = f.original_filename || "Document";
        return (
          <div key={f.id} className="cd-file">
            <span className="cd-file-icon">
              <FiFileText />
            </span>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" title={name}>
                {name}
              </a>
            ) : (
              <span className="name" title={name}>
                {name}
              </span>
            )}
            <span className="meta">
              {f.file_size_kb != null && `${f.file_size_kb} KB · `}
              {f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString("en-GB") : ""}
            </span>
            <button type="button" className="cd-icon-btn danger" onClick={() => onDeleteFile(f.id)} title="Remove file">
              <FiTrash2 />
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
      <tr className={`cd-row ${expanded ? "open" : ""}`}>
        <td>
          <div className="cd-doc-name">{doc.document_name}</div>
          {(doc.responsible_person || doc.document_number) && (
            <div className="cd-doc-meta">
              {doc.document_number && (
                <span>
                  <FiHash /> {doc.document_number}
                </span>
              )}
              {doc.responsible_person && (
                <span>
                  <FiUser /> {doc.responsible_person}
                </span>
              )}
            </div>
          )}
        </td>
        <td>{doc.branch_location || <span className="cd-muted">—</span>}</td>
        <td style={{ whiteSpace: "nowrap" }}>{formatDate(doc.expiry_date) || <span className="cd-muted">—</span>}</td>
        <td>
          <DaysChip days={doc.days_remaining} status={doc.status} />
        </td>
        <td>
          <StatusBadge status={doc.status} />
        </td>
        <td>
          {doc.remarks ? (
            <div className="cd-remarks" title={doc.remarks}>
              {doc.remarks}
            </div>
          ) : (
            <span className="cd-muted">—</span>
          )}
        </td>
        <td>
          <div className="cd-actions">
            <button
              type="button"
              className={`cd-btn cd-btn-sm ${fileCount === 0 ? "cd-btn-violet" : "cd-btn-ghost"}`}
              onClick={() => onUpload(doc)}
              title="Upload a file for this document"
            >
              <FiUploadCloud /> {fileCount === 0 ? "Upload" : "Add file"}
            </button>
            <button
              type="button"
              className={`cd-icon-btn ${expanded ? "on" : ""}`}
              onClick={() => setExpanded((p) => !p)}
              disabled={fileCount === 0}
              title={fileCount === 0 ? "No files yet" : expanded ? "Hide files" : `Show ${fileCount} file(s)`}
              style={{ width: "auto", padding: "0 8px", gap: 4, display: "inline-flex", alignItems: "center" }}
            >
              <FiPaperclip />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{fileCount}</span>
            </button>
            <button type="button" className="cd-icon-btn" onClick={() => onEdit(doc)} title="Edit">
              <FiEdit2 />
            </button>
            <button
              type="button"
              className="cd-icon-btn danger"
              onClick={() => onDelete(doc.id, doc.document_name)}
              title="Delete"
            >
              <FiTrash2 />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="cd-subrow">
          <td colSpan={7}>
            <FileList files={doc.files} onDeleteFile={onDeleteFile} />
          </td>
        </tr>
      )}
      {!expanded && fileCount === 0 && (
        <tr className="cd-missing">
          <td colSpan={7}>
            <span>
              <FiAlertTriangle /> No copy attached yet. Use <strong>Upload</strong> to attach the licence or document.
            </span>
          </td>
        </tr>
      )}
    </>
  );
};

// ── Category section ──────────────────────────────────────────────────────────
const CategorySection = ({ category, docs, onEdit, onDelete, onUpload, onDeleteFile, onAddInCategory }) => {
  const [collapsed, setCollapsed] = useState(false);
  const label = CATEGORY_LABELS[category] || category;
  const expiredCount = docs.filter((d) => d.status === "expired").length;
  const expiringSoonCount = docs.filter((d) => d.status === "expiring_soon").length;
  const missingFiles = docs.filter((d) => !d.files || d.files.length === 0).length;

  return (
    <section className="cd-section">
      <div
        className="cd-section-head"
        onClick={() => setCollapsed((p) => !p)}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setCollapsed((p) => !p))}
      >
        <div className="cd-section-title">
          <span className="cd-section-icon">
            <FiFolder />
          </span>
          <h3>{label}</h3>
          <span className="cd-pill neutral">{docs.length}</span>
          {expiredCount > 0 && <span className="cd-pill expired">{expiredCount} expired</span>}
          {expiringSoonCount > 0 && <span className="cd-pill expiring_soon">{expiringSoonCount} expiring</span>}
          {missingFiles > 0 && <span className="cd-pill need_apply">{missingFiles} without file</span>}
        </div>
        <div className="cd-section-right">
          <button
            type="button"
            className="cd-btn cd-btn-sm cd-btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAddInCategory(category);
            }}
          >
            <FiPlus /> Add
          </button>
          {collapsed ? <FiChevronRight /> : <FiChevronDown />}
        </div>
      </div>

      {!collapsed && (
        <div className="cd-table-wrap">
          <table className="cd-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Branch</th>
                <th>Expiry Date</th>
                <th>Days Left</th>
                <th>Status</th>
                <th>Remarks</th>
                <th style={{ textAlign: "right" }}>Actions</th>
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
    </section>
  );
};

// ── Document Form Modal ───────────────────────────────────────────────────────
const DocFormModal = ({ companyId, editDoc, defaultCategory, onClose, onSaved }) => {
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
  const [file, setFile] = useState(null); // optional file attached at save time
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const dateOrderBad = form.issue_date && form.expiry_date && form.expiry_date < form.issue_date;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.document_name.trim()) {
      setErr("Document name is required.");
      return;
    }
    if (dateOrderBad) {
      setErr("Expiry date is before the issue date.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        ...form,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
      };

      let docId = editDoc?.id;
      if (isEdit) {
        await updateDocumentType(editDoc.id, payload);
      } else {
        const created = await createDocumentType(payload);
        docId = created.data.id;
      }

      if (file && docId) {
        const fd = new FormData();
        fd.append("document_type", docId);
        fd.append("file", file);
        try {
          await uploadDocumentFile(fd);
        } catch {
          // The document itself saved - say so, so the user doesn't redo it.
          setErr("Document saved, but the file upload failed. Use the Upload button on the document to retry.");
          setSaving(false);
          onSaved();
          return;
        }
      }

      onSaved();
      onClose();
    } catch (ex) {
      setErr(apiErrorMessage(ex, "Failed to save. Please try again."));
      setSaving(false);
    }
  };

  return (
    <div className="cd-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <form className="cd-modal" style={{ maxWidth: 600 }} onSubmit={handleSubmit}>
        <div className="cd-modal-head">
          <div>
            <h2>{isEdit ? "Edit Document" : "Add Document"}</h2>
            <p>{isEdit ? editDoc.document_name : "Track a licence, certificate or agreement and its expiry."}</p>
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

          <div className="cd-field-grid">
            <div className="cd-field">
              <label>Category</label>
              <select className="cd-input" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="cd-field">
              <label>Branch / Location</label>
              <input
                className="cd-input"
                value={form.branch_location}
                onChange={(e) => set("branch_location", e.target.value)}
                placeholder="e.g. Dhanmondi, Gulshan, HO"
              />
            </div>
          </div>

          <div className="cd-field">
            <label>
              Document Name <span className="req">*</span>
            </label>
            <input
              className="cd-input"
              value={form.document_name}
              onChange={(e) => set("document_name", e.target.value)}
              placeholder="e.g. Trade License – Dhanmondi"
              required
              autoFocus={!isEdit}
            />
          </div>

          <div className="cd-field-grid">
            <div className="cd-field">
              <label>Document / Licence No.</label>
              <input
                className="cd-input"
                value={form.document_number}
                onChange={(e) => set("document_number", e.target.value)}
                placeholder="e.g. TRAD/DNCC/120756/2022"
              />
            </div>
            <div className="cd-field">
              <label>Responsible Person</label>
              <input
                className="cd-input"
                value={form.responsible_person}
                onChange={(e) => set("responsible_person", e.target.value)}
                placeholder="Licence holder / contact"
              />
            </div>
          </div>

          <div className="cd-field-grid">
            <div className="cd-field">
              <label>Issue Date</label>
              <input
                className="cd-input"
                type="date"
                value={form.issue_date}
                onChange={(e) => set("issue_date", e.target.value)}
              />
            </div>
            <div className="cd-field">
              <label>Expiry Date</label>
              <input
                className="cd-input"
                type="date"
                value={form.expiry_date}
                onChange={(e) => set("expiry_date", e.target.value)}
                style={dateOrderBad ? { borderColor: "#ef4444" } : undefined}
              />
              {dateOrderBad && (
                <div className="cd-hint" style={{ color: "#b91c1c" }}>
                  Expiry is before the issue date.
                </div>
              )}
            </div>
          </div>

          <div className="cd-field">
            <label>Remarks</label>
            <textarea
              className="cd-input"
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              rows={2}
              placeholder="Any notes or status comments"
            />
          </div>

          <div className="cd-field" style={{ marginBottom: 0 }}>
            <label>{isEdit ? "Attach another file (optional)" : "Attach file (optional)"}</label>
            <FilePicker file={file} onChange={setFile} />
            <div className="cd-hint">
              {isEdit && editDoc?.files?.length > 0
                ? `This document already has ${editDoc.files.length} file(s). Uploading adds another; existing files are kept.`
                : !isEdit
                  ? "You can also skip this and upload later from the document row."
                  : null}
            </div>
          </div>
        </div>

        <div className="cd-modal-foot">
          <button type="button" className="cd-btn cd-btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="cd-btn cd-btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : file ? "Add Document + Upload" : "Add Document"}
          </button>
        </div>
      </form>
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
      setErr(apiErrorMessage(ex, "Upload failed. Please try again."));
      setUploading(false);
    }
  };

  return (
    <div className="cd-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !uploading && onClose()}>
      <form className="cd-modal" style={{ maxWidth: 460 }} onSubmit={handleUpload}>
        <div className="cd-modal-head">
          <div>
            <h2>Upload File</h2>
            <p>
              {doc.document_name}
              {doc.branch_location ? ` – ${doc.branch_location}` : ""}
            </p>
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
            <FilePicker file={file} onChange={setFile} />
          </div>
          <div className="cd-field" style={{ marginBottom: 0 }}>
            <label>Description (optional)</label>
            <input
              className="cd-input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Renewed copy – 2026"
            />
          </div>
        </div>
        <div className="cd-modal-foot">
          <button type="button" className="cd-btn cd-btn-ghost" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button type="submit" className="cd-btn cd-btn-violet" disabled={uploading || !file}>
            <FiUploadCloud /> {uploading ? "Uploading…" : "Upload File"}
          </button>
        </div>
      </form>
    </div>
  );
};

const STATUS_FILTERS = [
  { key: "all", label: "All statuses" },
  { key: "expired", label: "Expired" },
  { key: "expiring_soon", label: "Expiring soon" },
  { key: "valid", label: "Valid" },
  { key: "not_available", label: "Not available" },
  { key: "need_apply", label: "Need to apply" },
];

// ── Main Component ────────────────────────────────────────────────────────────
const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modal state – cleanly separated
  const [editDoc, setEditDoc] = useState(null); // doc object when editing
  const [addCategory, setAddCategory] = useState(null); // category string when adding
  const [uploadDoc, setUploadDoc] = useState(null); // doc object for file upload

  const [notifStatus, setNotifStatus] = useState(null);
  const [sendingNotif, setSendingNotif] = useState(false);

  const fetchData = useCallback(
    async ({ quiet = false } = {}) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [compRes, docsRes] = await Promise.all([getCompany(id), getCompanyDocuments(id)]);
        setCompany(compRes.data);
        const docsData = Array.isArray(docsRes.data) ? docsRes.data : docsRes.data?.results || [];
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
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    // Switching company from the sidebar: start from a clean slate.
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setNotifStatus(null);
    setActionError(null);
    fetchData();
  }, [fetchData]);

  // After a change: reload quietly (keeps scroll + filters) and update the sidebar badges.
  const afterChange = useCallback(() => {
    fetchData({ quiet: true });
    notifyCompanyDocsChanged();
  }, [fetchData]);

  const handleDeleteDoc = async (docId, name) => {
    if (!window.confirm(`Delete document "${name}"?\nIts uploaded files are deleted too.`)) return;
    setActionError(null);
    try {
      await deleteDocumentType(docId);
      afterChange();
    } catch (err) {
      setActionError(apiErrorMessage(err, "Failed to delete document."));
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Remove this file?")) return;
    setActionError(null);
    try {
      await deleteDocumentFile(fileId);
      afterChange();
    } catch (err) {
      setActionError(apiErrorMessage(err, "Failed to remove file."));
    }
  };

  const handleSendNotifications = async () => {
    if (
      !window.confirm(
        "Email the expiry digest now?\n\nIt covers ALL companies (not only this one): every document that is expired or expires within 90 days. It goes to the Company Documents team.",
      )
    )
      return;
    setSendingNotif(true);
    setNotifStatus(null);
    try {
      const res = await sendExpiryNotifications(90);
      setNotifStatus({ ok: true, msg: res.data.message });
    } catch (err) {
      setNotifStatus({ ok: false, msg: apiErrorMessage(err, "Failed to send.") });
    } finally {
      setSendingNotif(false);
    }
  };

  const filtered = useMemo(() => {
    let list = documents;
    if (categoryFilter !== "all") list = list.filter((d) => d.category === categoryFilter);
    if (statusFilter !== "all") list = list.filter((d) => d.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          (d.document_name || "").toLowerCase().includes(q) ||
          (d.branch_location || "").toLowerCase().includes(q) ||
          (d.document_number || "").toLowerCase().includes(q) ||
          (d.responsible_person || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [documents, categoryFilter, statusFilter, search]);

  // Group by category, in the CATEGORY_LABELS order (unknown categories last).
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((d) => {
      (groups[d.category] = groups[d.category] || []).push(d);
    });
    const order = Object.keys(CATEGORY_LABELS);
    return Object.entries(groups).sort(([a], [b]) => {
      const ia = order.indexOf(a) === -1 ? order.length : order.indexOf(a);
      const ib = order.indexOf(b) === -1 ? order.length : order.indexOf(b);
      return ia - ib;
    });
  }, [filtered]);

  // ── Render states ──────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="cd-app">
        <style>{COMPANY_DOCS_CSS}</style>
        <div className="cd-loading">
          <div className="cd-spinner" />
          Loading documents…
        </div>
      </div>
    );

  if (error)
    return (
      <div className="cd-app">
        <style>{COMPANY_DOCS_CSS}</style>
        <div className="cd-body">
          <div className="cd-crumbs" style={{ marginBottom: 12 }}>
            <Link to="/company-docs">Company Documents</Link>
          </div>
          <div className="cd-alert err">
            <FiAlertTriangle />
            <span>{error}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="cd-btn cd-btn-ghost" onClick={() => navigate("/company-docs")}>
              Back to Companies
            </button>
            <button type="button" className="cd-btn cd-btn-primary" onClick={() => fetchData()}>
              <FiRefreshCw /> Retry
            </button>
          </div>
        </div>
      </div>
    );

  const count = (s) => documents.filter((d) => d.status === s).length;
  const missingFiles = documents.filter((d) => !d.files || d.files.length === 0).length;
  const hasFilters = search || categoryFilter !== "all" || statusFilter !== "all";

  const kpis = [
    { key: "all", label: "Total Documents", value: documents.length, icon: <FiFileText />, tone: "blue" },
    { key: "expired", label: "Expired", value: count("expired"), icon: <FiAlertTriangle />, tone: "red" },
    { key: "expiring_soon", label: "Expiring Soon", value: count("expiring_soon"), icon: <FiClock />, tone: "amber" },
    { key: "valid", label: "Valid", value: count("valid"), icon: <FiCheckCircle />, tone: "green" },
  ];

  return (
    <div className="cd-app">
      <style>{COMPANY_DOCS_CSS}</style>

      <header className="cd-header">
        <div style={{ minWidth: 0 }}>
          <nav className="cd-crumbs" aria-label="Breadcrumb">
            <Link to="/company-docs">Company Documents</Link>
            <FiChevronRight />
            <span style={{ color: "#334155", fontWeight: 600 }}>{company?.short_name || company?.name}</span>
          </nav>
          <h1 className="cd-title">
            {company?.name || "Company"}
            {company?.short_name && <span className="cd-count">{company.short_name}</span>}
          </h1>
          {(company?.address || company?.email || company?.phone) && (
            <p className="cd-subtitle">
              {company?.address && (
                <span>
                  <FiMapPin /> {company.address}
                </span>
              )}
              {company?.email && (
                <span>
                  <FiMail /> {company.email}
                </span>
              )}
              {company?.phone && (
                <span>
                  <FiPhone /> {company.phone}
                </span>
              )}
            </p>
          )}
        </div>
        <div className="cd-header-actions">
          <button
            type="button"
            className="cd-btn cd-btn-ghost"
            onClick={() => fetchData({ quiet: true })}
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
            title="Email the expiry digest for ALL companies to the Company Documents team"
          >
            <FiMail /> {sendingNotif ? "Sending…" : "Send Expiry Digest"}
          </button>
          <button type="button" className="cd-btn cd-btn-primary" onClick={() => setAddCategory("other")}>
            <FiPlus /> Add Document
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
        {missingFiles > 0 && (
          <div className="cd-alert warn">
            <FiPaperclip />
            <span>
              {missingFiles} document{missingFiles !== 1 ? "s have" : " has"} no file attached yet.
            </span>
          </div>
        )}

        <div className="cd-kpis">
          {kpis.map((k) => (
            <button
              key={k.key}
              type="button"
              className={`cd-kpi tone-${k.tone} ${statusFilter === k.key && k.key !== "all" ? "active" : ""}`}
              onClick={() => setStatusFilter(k.key === "all" || statusFilter === k.key ? "all" : k.key)}
              title={k.key === "all" ? "Show all" : `Show ${k.label.toLowerCase()}`}
            >
              <span className="cd-kpi-icon">{k.icon}</span>
              <span>
                <span className="cd-kpi-value">{k.value}</span>
                <span className="cd-kpi-label">{k.label}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="cd-toolbar">
          <div className="cd-search">
            <FiSearch />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, branch, number or person"
            />
            {search && (
              <button type="button" className="cd-search-clear" onClick={() => setSearch("")} title="Clear">
                <FiX />
              </button>
            )}
          </div>
          <select className="cd-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select className="cd-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_FILTERS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              type="button"
              className="cd-link-btn"
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </button>
          )}
          <span className="cd-result-note">
            {filtered.length} of {documents.length} document{documents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {grouped.length === 0 ? (
          <div className="cd-state">
            <div className="cd-state-icon">{documents.length === 0 ? <FiFolder /> : <FiInbox />}</div>
            <h3>{documents.length === 0 ? "No documents added yet" : "No documents match your filters"}</h3>
            <p>
              {documents.length === 0
                ? "Start tracking this company's licences, certificates and agreements."
                : "Try clearing your search or filters."}
            </p>
            {documents.length === 0 ? (
              <button type="button" className="cd-btn cd-btn-primary" onClick={() => setAddCategory("trade_license")}>
                <FiPlus /> Add Document
              </button>
            ) : (
              <button
                type="button"
                className="cd-btn cd-btn-ghost"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          grouped.map(([cat, docs]) => (
            <CategorySection
              key={cat}
              category={cat}
              docs={docs}
              onEdit={setEditDoc}
              onDelete={handleDeleteDoc}
              onUpload={setUploadDoc}
              onDeleteFile={handleDeleteFile}
              onAddInCategory={(c) => setAddCategory(c)}
            />
          ))
        )}
      </div>

      {editDoc && (
        <DocFormModal
          companyId={parseInt(id, 10)}
          editDoc={editDoc}
          defaultCategory={null}
          onClose={() => setEditDoc(null)}
          onSaved={afterChange}
        />
      )}
      {addCategory && !editDoc && (
        <DocFormModal
          companyId={parseInt(id, 10)}
          editDoc={null}
          defaultCategory={addCategory}
          onClose={() => setAddCategory(null)}
          onSaved={afterChange}
        />
      )}
      {uploadDoc && <FileUploadModal doc={uploadDoc} onClose={() => setUploadDoc(null)} onUploaded={afterChange} />}
    </div>
  );
};

export default CompanyDetail;
