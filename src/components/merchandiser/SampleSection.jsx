// components/merchandiser/SampleSection.jsx
//
// Sample Management section, embedded inside the Order detail page's
// "Samples" tab. Implements the Sample Management Module spec: Fit / PP /
// PS-Shipment / Counter / Photo / E-Commerce / Other samples, supplier
// inherited from the Order (never re-selected here), auto-calculated
// on-time/delay, and independent (non-hierarchical) sample records.

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheck,
  FaFlask,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBan,
  FaHourglassHalf,
  FaTruck,
  FaFileAlt,
  FaCloudUploadAlt,
  FaDownload,
  FaSpinner,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  getSamplesByOrder,
  createSample,
  updateSample,
  deleteSample,
  getTNAByOrder,
  getCourierBookingsByOrder,
} from "../../api/merchandiser";

// ---- Sample attachment endpoints ----
// Self-contained axios instance (same base URL / token-auth convention as
// TNAForm.jsx's local `api`), so this doesn't depend on api/merchandiser.js
// having matching upload/delete wrappers with a guessed response shape.
// If your api/merchandiser.js already exports API_BASE_URL / getAuthToken
// helpers, feel free to swap these three lines for those instead - just
// keep the base URL and Authorization header identical to your other
// working calls.
const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

const attachmentsApi = axios.create({
  baseURL: "http://119.148.51.38:8000/api/merchandiser/api/",
});

attachmentsApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Upload one or more files to a Sample in a single request.
// files: an array of File objects (from an <input type="file" multiple>).
// Returns the array of newly created attachment objects
// ({ id, file_url, original_filename, file_size, uploaded_at, ... }).
const uploadSampleAttachments = async (sampleId, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const res = await attachmentsApi.post(
    `samples/${sampleId}/upload-attachments/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data?.uploaded || [];
};

const deleteSampleAttachment = (sampleId, attachmentId) =>
  attachmentsApi.delete(`samples/${sampleId}/attachments/${attachmentId}/`);

// ---- Sample approval checkbox: check it -> Approved (cascades to the
// matching T&A milestone via Sample.sync_tna_approval on the backend);
// uncheck -> back to On Going (reverts the T&A milestone too, unless
// another Sample of the same type on this Order is still Approved).
// Same self-contained axios instance/convention as the attachment calls
// above, for the same reason (no guessing at api/merchandiser.js). ----
const approveSample = (sampleId) =>
  attachmentsApi.post(`samples/${sampleId}/approve/`);

const unapproveSample = (sampleId) =>
  attachmentsApi.post(`samples/${sampleId}/unapprove/`);

const SAMPLE_TYPE_OPTIONS = [
  { value: "lab_dip", label: "Lab Dip" },
  { value: "fabric", label: "Fabric" },
  { value: "fit", label: "Fit Sample" },
  { value: "pp", label: "PP Sample" },
  { value: "ps_shipment", label: "PS / Shipment Sample" },
  { value: "counter", label: "Counter Sample" },
  { value: "photo", label: "Photo Sample" },
  { value: "ecommerce", label: "E-Commerce Sample" },
  { value: "other", label: "Other" },
];

// Mirrors merchandiser.models.SAMPLE_TYPE_TNA_SOURCE_FIELD on the backend:
// which T&A date field feeds Sample TNA for the "standard" sample types.
// Photo / E-Commerce / Other / Counter have no T&A source and stay manual.
const SAMPLE_TYPE_TNA_SOURCE_FIELD = {
  lab_dip: "lab_dip_date",
  fabric: "fabric_approved_date",
  fit: "fit_sample_date",
  pp: "pps_date",
  ps_shipment: "ps_date",
};

// Mirrors merchandiser.models.SAMPLE_TYPE_TNA_STATUS_FIELD on the backend:
// which TNA progress-bar milestone gets approved when a Sample of this
// type is approved (see Sample.sync_tna_approval). PS / Counter / Photo
// / E-Commerce / Other have no matching milestone.
const SAMPLE_TYPE_TNA_STATUS_FIELD = {
  lab_dip: { field: "lab_dip_status", label: "Lab Dip" },
  fabric: { field: "fabric_status", label: "Fabric" },
  fit: { field: "fit_sample_status", label: "Fit Sample" },
  pp: { field: "pp_sample_status", label: "PP Sample" },
};

// Maps the free-text Sample Type label used in Courier Management's "Add
// Item" dropdown (see ShipmentDetailsPage.jsx SAMPLE_TYPE_OPTIONS, which
// uses these exact labels) to the Sample model's sample_type slug, so a
// Courier Management item can be matched against / used to prefill an
// actual Sample record.
const COURIER_SAMPLE_LABEL_TO_TYPE = {
  "Lab Dip": "lab_dip",
  "Fabric": "fabric",
  "Fit Sample": "fit",
  "PP Sample": "pp",
  "PS / Shipment Sample": "ps_shipment",
  "Counter Sample": "counter",
  "Photo Sample": "photo",
  "E-Commerce Sample": "ecommerce",
  "Other": "other",
};

// A Courier Management item is considered "linked" to a Sample record
// when the Sample's courier_booking_item FK points directly at that item -
// an exact database link (Sample.courier_booking_item), not a guess based
// on matching text like tracking number/sample type, which could miss or
// mismatch (e.g. two items in one shipment sharing a sample type).
const courierItemMatchesSample = (item, sample) =>
  sample.courier_booking_item != null && sample.courier_booking_item === item.id;

const SAMPLE_STATUS_OPTIONS = [
  { value: "on_going", label: "On Going" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_CONFIG = {
  on_going: { color: "#d97706", bg: "#fef3c7", icon: <FaHourglassHalf /> },
  approved: { color: "#059669", bg: "#d1fae5", icon: <FaCheckCircle /> },
  rejected: { color: "#dc2626", bg: "#fee2e2", icon: <FaBan /> },
};

const emptyForm = {
  sample_type: "fit",
  other_type_description: "",
  sample_name: "",
  tna: "",
  supplier_plan: "",
  supplier_plan_date: "",
  supplier_feedback: "",
  send_date: "",
  revised_send_date: "",
  buyer_feedback_date: "",
  sample_status: "on_going",
  delay_reason: "",
  remarks: "",
  courier_reference: "",
  courier_booking_item: null,
};

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.on_going;
  const label =
    SAMPLE_STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: cfg.color,
        backgroundColor: cfg.bg,
      }}
    >
      {cfg.icon} {label}
    </span>
  );
};

const DelayBadge = ({ isDelayed, delayDays }) => {
  if (isDelayed === null || isDelayed === undefined) {
    return <span style={{ color: "#94a3b8", fontSize: 13 }}>—</span>;
  }
  if (!isDelayed) {
    return (
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#059669",
          backgroundColor: "#d1fae5",
          padding: "3px 9px",
          borderRadius: 999,
        }}
      >
        On Time
      </span>
    );
  }
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "#dc2626",
        backgroundColor: "#fee2e2",
        padding: "3px 9px",
        borderRadius: 999,
      }}
    >
      Delayed {delayDays ? `+${delayDays}d` : ""}
    </span>
  );
};

const SampleSection = ({ orderId, supplierName, orderLabel, onApprovalChange }) => {
  const navigate = useNavigate();
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Items added under this Order in Courier Management ("+ Add Item" on a
  // shipment) that have a Sample Type set. These are a separate data
  // source from the Sample records above - shown here read-only so every
  // sample-carrying item logged against this order is visible in one
  // place, without duplicating Courier Management's own edit flow.
  const [courierSamples, setCourierSamples] = useState([]);
  const [courierSamplesLoading, setCourierSamplesLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Attachments (multi-file). Two flows, same as Order create/edit:
  //  - Editing an existing Sample: files upload immediately (there's
  //    already an id to attach them to) and `existingAttachments` holds
  //    the saved paths straight from the API.
  //  - Creating a new Sample: nothing to attach to yet, so files are
  //    staged locally in `pendingAttachments` and uploaded right after
  //    the Sample record is created in handleSubmit.
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // File preview: clicking a file (the "Files" badge on a row, or an
  // attachment in the Edit modal) opens this instead of downloading it
  // straight away. `previewGroup.attachments` is whichever attachment
  // list was clicked from (so the arrows can step through the rest of
  // that sample's files); `previewIndex` is which one is shown large.
  const [previewGroup, setPreviewGroup] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const openFilePreview = (attachments, title, startIndex = 0) => {
    if (!attachments || attachments.length === 0) return;
    setPreviewGroup({ title, attachments });
    setPreviewIndex(startIndex);
  };

  const closeFilePreview = () => {
    setPreviewGroup(null);
    setPreviewIndex(0);
  };

  const getFileKind = (attachment) => {
    const name = (
      attachment?.original_filename ||
      attachment?.file_url ||
      attachment?.file ||
      ""
    ).toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return "image";
    if (/\.pdf$/.test(name)) return "pdf";
    return "other";
  };

  // Quick-approve checkbox in the table (approves/un-approves a Sample
  // immediately, without opening the Edit modal). Tracks which row is
  // mid-request so its checkbox can show a spinner/disabled state, same
  // pattern as TNADetails.jsx's toggleStage.
  const [approvingId, setApprovingId] = useState(null);
  const [approvalError, setApprovalError] = useState("");

  // T&A -> Sample Management integration: the Order's T&A dates (Fit /
  // PP / PS), fetched once so the Sample form can show/re-sync the
  // correct TNA whenever Sample Type is set or changed (see handleChange,
  // which only re-syncs TNA if it still holds the auto-filled value for
  // the previous type - so it won't clobber a value someone typed in).
  const [orderTnaDates, setOrderTnaDates] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getTNAByOrder(orderId);
        if (!cancelled) {
          setOrderTnaDates({
            lab_dip_date: res.data?.lab_dip_date || null,
            fabric_approved_date: res.data?.fabric_approved_date || null,
            fit_sample_date: res.data?.fit_sample_date || null,
            pps_date: res.data?.pps_date || null,
            ps_date: res.data?.ps_date || null,
          });
        }
      } catch (err) {
        // No T&A record for this order yet - normal, just means
        // Lab Dip/Fabric/Fit/PP/PS TNA stays manual until T&A is
        // created for the order.
        if (!cancelled) setOrderTnaDates(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const tnaFromOrder = useCallback(
    (sampleType) => {
      const field = SAMPLE_TYPE_TNA_SOURCE_FIELD[sampleType];
      if (!field || !orderTnaDates) return "";
      return orderTnaDates[field] || "";
    },
    [orderTnaDates]
  );

  const fetchSamples = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getSamplesByOrder(orderId);
      setSamples(data?.results || []);
    } catch (err) {
      console.error("Error loading samples:", err);
      setError("Failed to load samples for this order.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  const fetchCourierSamples = useCallback(async () => {
    if (!orderId) return;
    setCourierSamplesLoading(true);
    try {
      const data = await getCourierBookingsByOrder(orderId);
      const items = (data?.results || []).filter((item) => !!item.sample_type);
      setCourierSamples(items);
    } catch (err) {
      console.error("Error loading courier samples:", err);
      setCourierSamples([]);
    } finally {
      setCourierSamplesLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchCourierSamples();
  }, [fetchCourierSamples]);

  // Opens the same Create Sample modal, prefilled from a Courier
  // Management item that doesn't have a matching Sample record yet -
  // this is the "+ Add Details" action on a courier-sourced row.
  //
  // TNA stays sourced from the Order's T&A record (Fit/PP/PS Sample date),
  // same as a manually-created Sample - it's a planned/target date, not
  // when the courier was booked. Only Send Date (when it was actually
  // sent) is auto-filled from the item's Courier Booking Date, since
  // that's already been entered once in Courier Management.
  const openAddModalFromCourierItem = (item) => {
    setEditingId(null);
    const sampleType = COURIER_SAMPLE_LABEL_TO_TYPE[item.sample_type] || "other";
    setForm({
      ...emptyForm,
      sample_type: sampleType,
      other_type_description: sampleType === "other" ? item.sample_type || "" : "",
      sample_name: item.item_description || "",
      courier_reference: item.booking_tracking_no || "",
      courier_booking_item: item.id,
      tna: tnaFromOrder(sampleType),
      send_date: item.booking_date || "",
    });
    setFormErrors({});
    setExistingAttachments([]);
    setPendingAttachments([]);
    setAttachmentError("");
    setShowModal(true);
  };

  const openEditModal = (sample) => {
    setEditingId(sample.id);
    setForm({
      sample_type: sample.sample_type || "fit",
      other_type_description: sample.other_type_description || "",
      sample_name: sample.sample_name || "",
      tna: sample.tna || "",
      supplier_plan: sample.supplier_plan || "",
      supplier_plan_date: sample.supplier_plan_date || "",
      supplier_feedback: sample.supplier_feedback || "",
      send_date: sample.send_date || "",
      revised_send_date: sample.revised_send_date || "",
      buyer_feedback_date: sample.buyer_feedback_date || "",
      sample_status: sample.sample_status || "on_going",
      delay_reason: sample.delay_reason || "",
      remarks: sample.remarks || "",
      courier_reference: sample.courier_reference || "",
      courier_booking_item: sample.courier_booking_item ?? null,
    });
    setFormErrors({});
    setExistingAttachments(sample.attachments || []);
    setPendingAttachments([]);
    setAttachmentError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving || uploadingAttachments) return;
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setExistingAttachments([]);
    setPendingAttachments([]);
    setAttachmentError("");
  };

  // ---- Attachment handlers ----

  const handleAttachmentSelect = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = null; // allow re-selecting the same file later
    if (files.length === 0) return;

    if (editingId) {
      // Existing Sample: upload right away.
      uploadAttachmentsNow(files);
    } else {
      // New Sample: stage locally, uploaded after create in handleSubmit.
      const staged = files.map((file, idx) => ({
        id: `${Date.now()}_${idx}_${Math.random()}`,
        file,
        name: file.name,
      }));
      setPendingAttachments((prev) => [...prev, ...staged]);
    }
  };

  const uploadAttachmentsNow = async (files) => {
    if (!editingId || files.length === 0) return;
    setAttachmentError("");
    setUploadingAttachments(true);
    try {
      const uploaded = await uploadSampleAttachments(editingId, files);
      setExistingAttachments((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error("Error uploading sample attachments:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Failed to upload one or more files. Please try again.";
      setAttachmentError(msg);
    } finally {
      setUploadingAttachments(false);
    }
  };

  const removePendingAttachment = (id) => {
    setPendingAttachments((prev) => prev.filter((f) => f.id !== id));
  };

  const removeExistingAttachment = async (attachment) => {
    if (!editingId) return;
    setAttachmentError("");
    try {
      await deleteSampleAttachment(editingId, attachment.id);
      setExistingAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    } catch (err) {
      console.error("Error deleting sample attachment:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Failed to delete file. Please try again.";
      setAttachmentError(msg);
    }
  };

  const handleChange = (field, value) => {
    if (field === "sample_type") {
      // Always follow the T&A app's date for whichever Sample Type is
      // currently selected - for a new Sample and an existing one being
      // edited alike. (If you type a custom TNA and then change Sample
      // Type again afterwards, that custom value gets replaced by the
      // new type's T&A date too - let me know if you'd rather manual
      // edits survive a later type change instead.)
      setForm((prev) => ({
        ...prev,
        sample_type: value,
        tna: tnaFromOrder(value),
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Client-side validation. The backend (SampleSerializer.validate) does
  // NOT require TNA before Send Date can be saved - that's correct,
  // because Counter / Photo / E-Commerce / Other sample types (and Fit /
  // PP / PS samples on an Order with no T&A record yet) never get an
  // auto-filled TNA at all. A courier-sourced item ("+ Add Details") for
  // one of those types auto-fills Send Date from the Courier Booking
  // Date while leaving TNA blank, which used to trip a stricter
  // frontend-only rule here and silently block the save (the modal
  // looked pre-filled, but submitting just kept failing with a
  // validation error). Mirror the backend instead: TNA is never
  // mandatory for Send Date to save.
  const validate = () => {
    const errs = {};
    if (!form.sample_type) errs.sample_type = "Sample Type is required.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setSaving(true);
    setFormErrors({});
    try {
      const payload = { ...form, order: orderId };
      // Send only non-empty date strings; blank optional fields stay null (VAL-004)
      Object.keys(payload).forEach((key) => {
        if (payload[key] === "") payload[key] = null;
      });

      if (editingId) {
        await updateSample(editingId, payload);
      } else {
        const created = await createSample(payload);
        const newId = created?.data?.id ?? created?.id;
        if (!newId && pendingAttachments.length > 0) {
          console.warn(
            "Could not determine the new Sample's id from createSample()'s response - attachments were not uploaded. Check what createSample() actually returns.",
            created
          );
          setError(
            "Sample was created, but its ID couldn't be read back, so attachments weren't uploaded. Check the console for details."
          );
        } else if (newId && pendingAttachments.length > 0) {
          try {
            await uploadSampleAttachments(
              newId,
              pendingAttachments.map((item) => item.file)
            );
          } catch (uploadErr) {
            console.error("Error uploading sample attachments:", uploadErr);
            // The Sample itself was created successfully; only the
            // attachment upload failed - surface it but don't block.
            setError(
              "Sample was created, but one or more attachments failed to upload."
            );
          }
        }
      }
      await fetchSamples();
      closeModal();
      // Sample Status (dropdown or the Approval checkbox) may have just
      // changed - refresh the TNA Progress bar on the Order details page
      // so an Approve/un-Approve here shows up there immediately.
      onApprovalChange?.();
    } catch (err) {
      console.error("Error saving sample:", err);
      const apiErrors = err?.response?.data;
      if (apiErrors && typeof apiErrors === "object") {
        const flat = {};
        Object.keys(apiErrors).forEach((k) => {
          flat[k] = Array.isArray(apiErrors[k])
            ? apiErrors[k].join(" ")
            : String(apiErrors[k]);
        });
        setFormErrors(flat);
      } else {
        setFormErrors({ __general: "Failed to save sample. Please try again." });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSample(deleteTarget.id);
      setSamples((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting sample:", err);
      setError("Failed to delete sample. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // Quick-approve checkbox (table row). Optimistically flips the badge,
  // calls /approve/ or /unapprove/, then reconciles with the server
  // response (which reflects any T&A cascade) - rolls back on failure.
  const handleToggleApproval = async (sample) => {
    const wasApproved = sample.sample_status === "approved";
    const previousStatus = sample.sample_status;
    setApprovalError("");
    setApprovingId(sample.id);
    setSamples((prev) =>
      prev.map((s) =>
        s.id === sample.id
          ? { ...s, sample_status: wasApproved ? "on_going" : "approved" }
          : s
      )
    );
    try {
      const res = wasApproved
        ? await unapproveSample(sample.id)
        : await approveSample(sample.id);
      // TEMP DEBUG - remove once the progress bar color issue is
      // confirmed fixed.
      console.log("[Sample Approve]", sample.id, sample.sample_type, "->", res?.data);
      const updated = res?.data?.sample;
      if (updated) {
        setSamples((prev) => prev.map((s) => (s.id === sample.id ? updated : s)));
      }
      // If editing this same sample right now, keep the modal's dropdown in sync.
      if (editingId === sample.id && updated) {
        setForm((prev) => ({ ...prev, sample_status: updated.sample_status }));
      }
      // Refresh the TNA Progress bar on the Order details page so the
      // matching milestone's color updates immediately.
      onApprovalChange?.();
    } catch (err) {
      console.error("Error toggling sample approval:", err);
      setApprovalError(
        err?.response?.data?.error ||
          "Failed to update approval. Please try again."
      );
      // Roll back the optimistic flip.
      setSamples((prev) =>
        prev.map((s) => (s.id === sample.id ? { ...s, sample_status: previousStatus } : s))
      );
    } finally {
      setApprovingId(null);
    }
  };

  // Courier Management items (for this order, with a Sample Type set)
  // that don't yet correspond to a Sample record - these render as
  // "Add Details" rows in the same table below.
  const unlinkedCourierItems = courierSamples.filter(
    (item) => !samples.some((s) => courierItemMatchesSample(item, s))
  );

  const stats = {
    total: samples.length + unlinkedCourierItems.length,
    on_going: samples.filter((s) => s.sample_status === "on_going").length,
    approved: samples.filter((s) => s.sample_status === "approved").length,
    rejected: samples.filter((s) => s.sample_status === "rejected").length,
    delayed: samples.filter((s) => s.is_delayed === true).length,
  };

  const isLoading = loading || courierSamplesLoading;
  const hasRows = samples.length > 0 || unlinkedCourierItems.length > 0;

  return (
    <div style={styles.wrapper}>
      <style>{`
        @media (max-width: 640px) {
          .sample-modal-overlay {
            padding: 0 !important;
            align-items: stretch !important;
          }
          .sample-modal {
            max-width: 100% !important;
            max-height: 100% !important;
            height: 100%;
            border-radius: 0 !important;
          }
          .sample-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @supports (height: 100dvh) {
          .sample-modal {
            max-height: 90dvh;
          }
          @media (max-width: 640px) {
            .sample-modal {
              max-height: 100dvh !important;
            }
          }
        }
      `}</style>

      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.title}>
            <FaFlask style={{ marginRight: 8, color: "#7c3aed" }} />
            Samples
          </h3>
          <p style={styles.subtitle}>
            Includes samples created here and items added for this order in Courier Management.
          </p>
        </div>
      </div>

      {hasRows && (
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{stats.total}</span>
            <span style={styles.statLabel}>Total Samples</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statValue, color: "#d97706" }}>
              {stats.on_going}
            </span>
            <span style={styles.statLabel}>On Going</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statValue, color: "#059669" }}>
              {stats.approved}
            </span>
            <span style={styles.statLabel}>Approved</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statValue, color: "#dc2626" }}>
              {stats.rejected}
            </span>
            <span style={styles.statLabel}>Rejected</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statValue, color: "#dc2626" }}>
              {stats.delayed}
            </span>
            <span style={styles.statLabel}>Delayed</span>
          </div>
        </div>
      )}

      {error && <div style={styles.errorBanner}>{error}</div>}
      {approvalError && <div style={styles.errorBanner}>{approvalError}</div>}

      {isLoading ? (
        <div style={styles.emptyState}>
          <div style={styles.spinner}></div>
          <p>Loading samples...</p>
        </div>
      ) : !hasRows ? (
        <div style={styles.emptyState}>
          <FaFlask style={{ fontSize: 40, color: "#cbd5e1" }} />
          <p>No samples created for this order yet.</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Sample Type</th>
                <th style={styles.th}>Name / Variant</th>
                <th style={styles.th}>TNA</th>
                <th style={styles.th}>Send Date</th>
                <th style={styles.th}>Buyer Feedback</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Approved</th>
                <th style={styles.th}>Delay</th>
                <th style={styles.th}>Courier Ref</th>
                <th style={styles.th}>Files</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((s) => (
                <tr key={s.id} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>
                      {s.sample_type === "other"
                        ? s.other_type_description || "Other"
                        : s.sample_type_display}
                    </strong>
                  </td>
                  <td style={styles.td}>{s.sample_name || "—"}</td>
                  <td style={styles.td}>{fmtDate(s.tna)}</td>
                  <td style={styles.td}>{fmtDate(s.send_date)}</td>
                  <td style={styles.td}>{fmtDate(s.buyer_feedback_date)}</td>
                  <td style={styles.td}>
                    <StatusBadge status={s.sample_status} />
                  </td>
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      checked={s.sample_status === "approved"}
                      disabled={approvingId === s.id}
                      onChange={() => handleToggleApproval(s)}
                      title={
                        SAMPLE_TYPE_TNA_STATUS_FIELD[s.sample_type]
                          ? `Also ${s.sample_status === "approved" ? "reverts" : "approves"} ${SAMPLE_TYPE_TNA_STATUS_FIELD[s.sample_type].label} on the TNA page`
                          : "This Sample Type has no matching TNA milestone"
                      }
                    />
                  </td>
                  <td style={styles.td}>
                    <DelayBadge isDelayed={s.is_delayed} delayDays={s.delay_days} />
                  </td>
                  <td style={styles.td}>
                    {s.courier_reference ? (
                      <span style={styles.courierRef}>
                        <FaTruck style={{ marginRight: 4, fontSize: 11 }} />
                        {s.courier_reference}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={styles.td}>
                    {s.attachments && s.attachments.length > 0 ? (
                      <button
                        type="button"
                        style={styles.attachmentCountBtn}
                        title="Preview files"
                        onClick={() =>
                          openFilePreview(
                            s.attachments,
                            s.sample_name || s.sample_type_display || "Sample"
                          )
                        }
                      >
                        <FaFileAlt style={{ fontSize: 11 }} /> {s.attachments.length}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={styles.iconBtn}
                        title="Edit Sample"
                        onClick={() => openEditModal(s)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        style={{ ...styles.iconBtn, color: "#dc2626" }}
                        title="Delete Sample"
                        onClick={() => setDeleteTarget(s)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {unlinkedCourierItems.map((item) => {
                const mappedType = COURIER_SAMPLE_LABEL_TO_TYPE[item.sample_type] || "other";
                const tnaPreview = tnaFromOrder(mappedType);
                return (
                  <tr key={`courier-${item.id}`} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{item.sample_type}</strong>
                    </td>
                    <td style={styles.td}>{item.item_description || "—"}</td>
                    <td style={styles.td}>
                      {tnaPreview ? (
                        <span style={styles.prefillHint}>{fmtDate(tnaPreview)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={styles.td}>
                      {item.booking_date ? (
                        <span style={styles.prefillHint}>{fmtDate(item.booking_date)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={styles.td}>—</td>
                    <td style={styles.td}>
                      <span style={styles.awaitingBadge}>
                        <FaTruck style={{ marginRight: 6, fontSize: 11 }} />
                        Awaiting Details
                      </span>
                    </td>
                    <td style={styles.td}>
                      <input type="checkbox" disabled title="Add Sample Details first" />
                    </td>
                    <td style={styles.td}>—</td>
                    <td style={styles.td}>
                      <span style={styles.courierRef}>
                        <FaTruck style={{ marginRight: 4, fontSize: 11 }} />
                        {item.booking_tracking_no || "—"}
                      </span>
                    </td>
                    <td style={styles.td}>—</td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          style={styles.addDetailsBtn}
                          title="Add Sample Details"
                          onClick={() => openAddModalFromCourierItem(item)}
                        >
                          <FaPlus /> Add Details
                        </button>
                        <button
                          style={styles.iconBtn}
                          title="View in Courier Management"
                          onClick={() => navigate(`/courier/${item.booking}/items`)}
                        >
                          <FaTruck />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={styles.modalOverlay} className="sample-modal-overlay" onClick={closeModal}>
          <div style={styles.modal} className="sample-modal" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingId ? "Edit Sample" : "Create Sample"}
                {orderLabel ? (
                  <span style={styles.modalSubtitleInline}> — {orderLabel}</span>
                ) : null}
              </h3>
              <button style={styles.modalClose} onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={styles.modalForm}
            >
              <div style={styles.modalBody}>
                {formErrors.__general && (
                  <div style={styles.errorBanner}>{formErrors.__general}</div>
                )}

                <div style={styles.formGrid} className="sample-form-grid">
                  <div style={styles.field}>
                    <label style={styles.label}>Sample Type *</label>
                    <select
                      style={styles.input}
                      value={form.sample_type}
                      onChange={(e) => handleChange("sample_type", e.target.value)}
                    >
                      {SAMPLE_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.sample_type && (
                      <span style={styles.fieldError}>{formErrors.sample_type}</span>
                    )}
                  </div>

                  {form.sample_type === "other" && (
                    <div style={styles.field}>
                      <label style={styles.label}>Other Type Description</label>
                      <input
                        style={styles.input}
                        type="text"
                        value={form.other_type_description}
                        onChange={(e) =>
                          handleChange("other_type_description", e.target.value)
                        }
                        placeholder="Describe the sample type"
                      />
                    </div>
                  )}

                  <div style={styles.field}>
                    <label style={styles.label}>Sample Name / Variant</label>
                    <input
                      style={styles.input}
                      type="text"
                      value={form.sample_name}
                      onChange={(e) => handleChange("sample_name", e.target.value)}
                      placeholder="e.g. Navy colorway"
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Supplier</label>
                    <input
                      style={{ ...styles.input, backgroundColor: "#f1f5f9" }}
                      type="text"
                      value={supplierName || "Inherited from Order"}
                      disabled
                      readOnly
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>TNA</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={form.tna || ""}
                      onChange={(e) => handleChange("tna", e.target.value)}
                    />
                    {["lab_dip", "fabric", "fit", "pp", "ps_shipment"].includes(form.sample_type) && (
                      <small style={{ color: "#64748b", fontSize: 11 }}>
                        Auto-filled from T&A on creation (Lab Dip/Fabric/Fit/PP/PS Sample date). Edits here don't change T&A.
                      </small>
                    )}
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Sample Status</label>
                    <select
                      style={styles.input}
                      value={form.sample_status}
                      onChange={(e) => handleChange("sample_status", e.target.value)}
                    >
                      {SAMPLE_STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Approval</label>
                    <label style={styles.approvalCheckboxRow}>
                      <input
                        type="checkbox"
                        checked={form.sample_status === "approved"}
                        onChange={(e) =>
                          handleChange(
                            "sample_status",
                            e.target.checked ? "approved" : "on_going"
                          )
                        }
                      />
                      <span>Approved</span>
                    </label>
                    {SAMPLE_TYPE_TNA_STATUS_FIELD[form.sample_type] ? (
                      <small style={{ color: "#64748b", fontSize: 11 }}>
                        Checking this also marks{" "}
                        <strong>{SAMPLE_TYPE_TNA_STATUS_FIELD[form.sample_type].label}</strong>{" "}
                        Approved on this order's TNA page (and reverts it if
                        unchecked, unless another {SAMPLE_TYPE_TNA_STATUS_FIELD[form.sample_type].label} sample here is still Approved). Saved with the rest of this form.
                      </small>
                    ) : (
                      <small style={{ color: "#94a3b8", fontSize: 11 }}>
                        This Sample Type has no matching TNA milestone.
                      </small>
                    )}
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Supplier Plan</label>
                    <input
                      style={styles.input}
                      type="text"
                      placeholder="Supplier's planned approach/commitment"
                      value={form.supplier_plan || ""}
                      onChange={(e) => handleChange("supplier_plan", e.target.value)}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Supplier Plan Date</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={form.supplier_plan_date || ""}
                      onChange={(e) =>
                        handleChange("supplier_plan_date", e.target.value)
                      }
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Send Date</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={form.send_date || ""}
                      onChange={(e) => handleChange("send_date", e.target.value)}
                    />
                    {formErrors.send_date && (
                      <span style={styles.fieldError}>{formErrors.send_date}</span>
                    )}
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Revised Send Date</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={form.revised_send_date || ""}
                      onChange={(e) =>
                        handleChange("revised_send_date", e.target.value)
                      }
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Buyer Feedback Date</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={form.buyer_feedback_date || ""}
                      onChange={(e) =>
                        handleChange("buyer_feedback_date", e.target.value)
                      }
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Courier Reference</label>
                    <input
                      style={styles.input}
                      type="text"
                      value={form.courier_reference}
                      onChange={(e) =>
                        handleChange("courier_reference", e.target.value)
                      }
                      placeholder="Tracking / AWB number"
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Delay Reason</label>
                    <input
                      style={styles.input}
                      type="text"
                      value={form.delay_reason}
                      onChange={(e) => handleChange("delay_reason", e.target.value)}
                      placeholder="Optional — if delayed"
                    />
                  </div>

                  <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                    <label style={styles.label}>Supplier Feedback</label>
                    <textarea
                      style={styles.textarea}
                      value={form.supplier_feedback}
                      onChange={(e) =>
                        handleChange("supplier_feedback", e.target.value)
                      }
                      rows={2}
                    />
                  </div>

                  <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                    <label style={styles.label}>Remarks</label>
                    <textarea
                      style={styles.textarea}
                      value={form.remarks}
                      onChange={(e) => handleChange("remarks", e.target.value)}
                      rows={2}
                      placeholder="Rejection reason, buyer comments, etc."
                    />
                  </div>

                  <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                    <label style={styles.label}>Attachments</label>
                    <div style={styles.attachmentDropZone}>
                      <FaCloudUploadAlt style={{ fontSize: 22, color: "#94a3b8" }} />
                      <p style={styles.attachmentHint}>
                        Drag & drop files here, or
                      </p>
                      <input
                        type="file"
                        multiple
                        onChange={handleAttachmentSelect}
                        style={{ display: "none" }}
                        id="sample-attachment-upload"
                      />
                      <label
                        htmlFor="sample-attachment-upload"
                        style={styles.browseBtn}
                      >
                        Browse Files
                      </label>
                    </div>

                    {attachmentError && (
                      <span style={styles.fieldError}>{attachmentError}</span>
                    )}

                    {uploadingAttachments && (
                      <div style={styles.uploadingRow}>
                        <FaSpinner style={{ animation: "spin 0.8s linear infinite" }} />
                        <span>Uploading...</span>
                      </div>
                    )}

                    {(existingAttachments.length > 0 || pendingAttachments.length > 0) && (
                      <div style={styles.attachmentList}>
                        {existingAttachments.map((att, idx) => (
                          <div key={`existing-${att.id}`} style={styles.attachmentItem}>
                            <FaFileAlt style={{ color: "#7c3aed", flexShrink: 0 }} />
                            <button
                              type="button"
                              style={styles.attachmentNameBtn}
                              title="Preview file"
                              onClick={() =>
                                openFilePreview(
                                  existingAttachments,
                                  form.sample_name || "Sample",
                                  idx
                                )
                              }
                            >
                              {att.original_filename || `Attachment #${att.id}`}
                            </button>
                            <a
                              href={att.file_url || att.file || "#"}
                              target="_blank"
                              rel="noreferrer"
                              download
                              style={styles.attachmentActionBtn}
                              title="Download"
                            >
                              <FaDownload />
                            </a>
                            <button
                              type="button"
                              style={{ ...styles.attachmentActionBtn, color: "#dc2626" }}
                              title="Remove"
                              onClick={() => removeExistingAttachment(att)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                        {pendingAttachments.map((item) => (
                          <div key={item.id} style={styles.attachmentItem}>
                            <FaFileAlt style={{ color: "#94a3b8", flexShrink: 0 }} />
                            <span style={styles.attachmentName}>{item.name}</span>
                            <span style={styles.pendingBadge}>Pending upload</span>
                            <button
                              type="button"
                              style={{ ...styles.attachmentActionBtn, color: "#dc2626" }}
                              title="Remove"
                              onClick={() => removePendingAttachment(item.id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn} disabled={saving}>
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <FaCheck /> {editingId ? "Save Changes" : "Create Sample"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div style={styles.modalOverlay} className="sample-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div
            style={{ ...styles.modal, maxWidth: 420 }}
            className="sample-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <FaExclamationTriangle style={{ color: "#dc2626", marginRight: 8 }} />
                Delete Sample
              </h3>
              <button
                style={styles.modalClose}
                onClick={() => !deleting && setDeleteTarget(null)}
              >
                <FaTimes />
              </button>
            </div>
            <div style={styles.modalBody}>
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
                Delete{" "}
                <strong>
                  {deleteTarget.sample_type_display || deleteTarget.sample_type}
                </strong>
                {deleteTarget.sample_name ? ` (${deleteTarget.sample_name})` : ""}?
                This cannot be undone. Per the module spec, samples that have
                already been sent to the buyer can still be deleted.
              </p>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={styles.cancelBtn}
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.submitBtn, backgroundColor: "#dc2626" }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : (
                  <>
                    <FaTrash /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview */}
      {previewGroup && (() => {
        const attachment = previewGroup.attachments[previewIndex];
        const url = attachment.file_url || attachment.file || "";
        const kind = getFileKind(attachment);
        const name = attachment.original_filename || `Attachment #${attachment.id}`;
        const hasMultiple = previewGroup.attachments.length > 1;
        return (
          <div style={styles.modalOverlay} className="sample-modal-overlay" onClick={closeFilePreview}>
            <div
              style={{ ...styles.modal, maxWidth: 800 }}
              className="sample-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  <FaFileAlt style={{ marginRight: 8, color: "#7c3aed" }} />
                  {previewGroup.title}
                  <span style={styles.modalSubtitleInline}> — {name}</span>
                </h3>
                <button style={styles.modalClose} onClick={closeFilePreview}>
                  <FaTimes />
                </button>
              </div>

              <div style={{ ...styles.modalBody, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={styles.previewStage}>
                  {hasMultiple && (
                    <button
                      type="button"
                      style={{ ...styles.previewNavBtn, left: 8 }}
                      onClick={() =>
                        setPreviewIndex(
                          (previewIndex - 1 + previewGroup.attachments.length) %
                            previewGroup.attachments.length
                        )
                      }
                      title="Previous file"
                    >
                      ‹
                    </button>
                  )}

                  {kind === "image" ? (
                    <img src={url} alt={name} style={styles.previewImage} />
                  ) : kind === "pdf" ? (
                    <iframe title={name} src={url} style={styles.previewFrame} />
                  ) : (
                    <div style={styles.previewFallback}>
                      <FaFileAlt style={{ fontSize: 40, color: "#94a3b8" }} />
                      <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 13 }}>
                        No inline preview available for this file type.
                      </p>
                    </div>
                  )}

                  {hasMultiple && (
                    <button
                      type="button"
                      style={{ ...styles.previewNavBtn, right: 8 }}
                      onClick={() =>
                        setPreviewIndex((previewIndex + 1) % previewGroup.attachments.length)
                      }
                      title="Next file"
                    >
                      ›
                    </button>
                  )}
                </div>

                {hasMultiple && (
                  <div style={styles.previewThumbStrip}>
                    {previewGroup.attachments.map((att, idx) => (
                      <button
                        key={att.id}
                        type="button"
                        title={att.original_filename || `Attachment #${att.id}`}
                        onClick={() => setPreviewIndex(idx)}
                        style={{
                          ...styles.previewThumb,
                          ...(idx === previewIndex ? styles.previewThumbActive : {}),
                        }}
                      >
                        <FaFileAlt />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.modalFooter}>
                <a
                  href={url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  download
                  style={{ ...styles.cancelBtn, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  <FaDownload /> Download
                </a>
                <button type="button" style={styles.submitBtn} onClick={closeFilePreview}>
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
  },
  title: {
    display: "flex",
    alignItems: "center",
    fontSize: 18,
    fontWeight: 600,
    color: "#0f172a",
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    margin: "4px 0 0",
    maxWidth: 560,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 12,
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 8px",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
  },
  statValue: { fontSize: 22, fontWeight: 700, color: "#0f172a" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
  errorBanner: {
    padding: "10px 14px",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 12,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 16px",
    color: "#64748b",
    backgroundColor: "#fff",
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
    gap: 8,
  },
  spinner: {
    width: 28,
    height: 28,
    border: "3px solid #e2e8f0",
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  tableWrapper: {
    overflowX: "auto",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontWeight: 600,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "12px 14px",
    color: "#334155",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  courierRef: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 12,
    color: "#475569",
  },
  awaitingBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    color: "#92400e",
    backgroundColor: "#fef3c7",
  },
  prefillHint: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#94a3b8",
  },
  addDetailsBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    border: "1px solid #7c3aed",
    borderRadius: 6,
    backgroundColor: "#fff",
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    gap: 6,
  },
  iconBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    backgroundColor: "#fff",
    color: "#475569",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 14,
    width: "100%",
    maxWidth: 760,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 22px",
    borderBottom: "1px solid #e2e8f0",
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#0f172a",
    margin: 0,
    display: "flex",
    alignItems: "center",
  },
  modalSubtitleInline: {
    fontWeight: 400,
    color: "#64748b",
    fontSize: 13,
  },
  modalClose: {
    border: "none",
    background: "none",
    fontSize: 16,
    color: "#64748b",
    cursor: "pointer",
  },
  modalForm: {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
    minHeight: 0,
    overflow: "hidden",
  },
  modalBody: {
    padding: "20px 22px",
    overflowY: "auto",
    flex: "1 1 auto",
    minHeight: 0,
    WebkitOverflowScrolling: "touch",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
  },
  approvalCheckboxRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 11px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 13,
    color: "#0f172a",
    cursor: "pointer",
    width: "fit-content",
  },
  input: {
    padding: "9px 11px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 13,
    color: "#0f172a",
    outline: "none",
  },
  textarea: {
    padding: "9px 11px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 13,
    color: "#0f172a",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  fieldError: {
    fontSize: 11,
    color: "#dc2626",
  },
  attachmentDropZone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "18px 14px",
    border: "1px dashed #cbd5e1",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
  },
  attachmentHint: {
    fontSize: 12,
    color: "#64748b",
    margin: 0,
  },
  browseBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 14px",
    borderRadius: 6,
    border: "1px solid #7c3aed",
    color: "#7c3aed",
    backgroundColor: "#fff",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  uploadingRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "#7c3aed",
  },
  attachmentList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 4,
  },
  attachmentItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  attachmentName: {
    flex: 1,
    fontSize: 12,
    color: "#334155",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  attachmentNameBtn: {
    flex: 1,
    fontSize: 12,
    color: "#334155",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textAlign: "left",
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    textDecoration: "underline",
    textDecorationColor: "transparent",
  },
  attachmentActionBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    border: "none",
    background: "none",
    color: "#64748b",
    cursor: "pointer",
  },
  pendingBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: "#d97706",
    backgroundColor: "#fef3c7",
    padding: "2px 8px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },
  attachmentCountBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 9px",
    borderRadius: 999,
    border: "1px solid #ddd6fe",
    backgroundColor: "#f5f3ff",
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  previewStage: {
    position: "relative",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  previewImage: {
    maxWidth: "100%",
    maxHeight: "65vh",
    objectFit: "contain",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
  },
  previewFrame: {
    width: "100%",
    height: "65vh",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
  },
  previewFallback: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 16px",
  },
  previewNavBtn: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "1px solid #e2e8f0",
    backgroundColor: "#fff",
    color: "#334155",
    fontSize: 20,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(15,23,42,0.15)",
  },
  previewThumbStrip: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  previewThumb: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    backgroundColor: "#fff",
    color: "#94a3b8",
    cursor: "pointer",
  },
  previewThumbActive: {
    borderColor: "#7c3aed",
    color: "#7c3aed",
    backgroundColor: "#f5f3ff",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: "16px 22px",
    borderTop: "1px solid #e2e8f0",
    flexShrink: 0,
  },
  cancelBtn: {
    padding: "10px 18px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    color: "#334155",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  submitBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#7c3aed",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default SampleSection;