// src/components/lab_qc/LabReportForm.jsx
//
// "Create New Report" / edit-draft form. The universal test form is never
// hardcoded here - every section and field is rendered from whatever
// GET /section-schema/ returns at runtime.

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FiChevronDown, FiChevronUp, FiX, FiLock } from "react-icons/fi";
import {
  getSectionSchema,
  getReportById,
  createReport,
  patchReport,
  submitReport,
  isLabAdmin,
} from "../../api/labQc";
import LabOrderPicker from "./LabOrderPicker";
import {
  LabPageLayout,
  LoadingState,
  PageHeader,
  buildCleanSections,
  cardStyle,
  inputStyle,
  labelStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  disabledButtonStyle,
  formatDate,
  COLORS,
} from "./common";

const ORDER_FIELD_ROWS = [
  ["PO No", "order_no"],
  ["Buyer", "buyer"],
  ["Order NO", "style"],
  ["Item", "item"],
  ["Garment", "garment"],
  ["Factory", "factory_name"],
];

const ORDER_DATE_ROWS = [
  ["Order Date", "order_date"],
  ["Production Start Date", "production_start_date"],
  ["Shipment Date", "shipment_date"],
  ["Status", "status"],
];

const OrderSummary = ({ order, onChange }) => (
  <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
      <h3 style={{ margin: 0, fontSize: "1rem", color: COLORS.text }}>Order Details (read-only)</h3>
      {onChange && (
        <button type="button" onClick={onChange} style={{ ...secondaryButtonStyle, padding: "6px 12px", fontSize: "0.8rem" }}>
          <FiX size={12} style={{ marginRight: 4 }} />
          Change Order
        </button>
      )}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.9rem" }}>
      {ORDER_FIELD_ROWS.map(([label, key]) => (
        <div key={key}>
          <div style={labelStyle}>{label}</div>
          <div style={{ color: COLORS.text, fontWeight: 500 }}>{order[key] || "-"}</div>
        </div>
      ))}
      {ORDER_DATE_ROWS.map(([label, key]) => (
        <div key={key}>
          <div style={labelStyle}>{label}</div>
          <div style={{ color: COLORS.text, fontWeight: 500 }}>
            {key.includes("date")
              ? order[key]
                ? formatDate(order[key])
                : key === "production_start_date"
                  ? "Not set"
                  : "-"
              : order[key] || "-"}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FieldInput = ({ field, value, onChange, disabled }) => {
  const helperParts = [];
  if (field.unit) helperParts.push(`Unit: ${field.unit}`);
  if (field.min !== undefined && field.min !== null) helperParts.push(`Min: ${field.min}`);
  if (field.max !== undefined && field.max !== null) helperParts.push(`Max: ${field.max}`);
  if (field.note) helperParts.push(field.note);
  const helperText = helperParts.join(" · ");

  let control;
  switch (field.type) {
    case "textarea":
      control = (
        <textarea
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
          placeholder={field.note || ""}
        />
      );
      break;
    case "number":
      control = (
        <input
          type="number"
          value={value ?? ""}
          disabled={disabled}
          min={field.min}
          max={field.max}
          step={field.step ?? "any"}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      );
      break;
    case "select":
      control = (
        <select
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        >
          <option value="">Select...</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
      break;
    case "date":
      control = (
        <input
          type="date"
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      );
      break;
    default:
      control = (
        <input
          type="text"
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          placeholder={field.note || ""}
        />
      );
  }

  return (
    <div>
      <div style={labelStyle}>{field.label}</div>
      {control}
      {helperText && (
        <div style={{ fontSize: "0.72rem", color: COLORS.textMuted, marginTop: 4 }}>{helperText}</div>
      )}
    </div>
  );
};

const SectionPanel = ({ section, values, onFieldChange, isOpen, onToggle, disabled }) => {
  const filledCount = Object.values(values || {}).filter(
    (v) => v !== null && v !== undefined && String(v).trim() !== "",
  ).length;

  return (
    <div style={{ ...cardStyle, marginBottom: "1rem", padding: 0, overflow: "hidden" }}>
      <div
        onClick={section.always_visible ? undefined : onToggle}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.5rem",
          cursor: section.always_visible ? "default" : "pointer",
          background: isOpen ? "#f8fafc" : "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 600, color: COLORS.text }}>{section.label}</span>
          {filledCount > 0 && (
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "#1d4ed8",
                background: "#dbeafe",
                borderRadius: 20,
                padding: "2px 8px",
              }}
            >
              {filledCount} filled
            </span>
          )}
          {section.always_visible && (
            <span style={{ fontSize: "0.7rem", color: COLORS.textMuted }}>(always shown)</span>
          )}
        </div>
        {!section.always_visible && (isOpen ? <FiChevronUp /> : <FiChevronDown />)}
      </div>

      {isOpen && (
        <div
          style={{
            padding: "1.25rem 1.5rem 1.5rem",
            borderTop: `1px solid ${COLORS.border}`,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          {(section.fields || []).map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values?.[field.key]}
              disabled={disabled}
              onChange={(val) => onFieldChange(section.key, field.key, val)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const LabReportForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const admin = isLabAdmin();

  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [order, setOrder] = useState(null);
  const [report, setReport] = useState(null);
  const [sectionsState, setSectionsState] = useState({});
  const [openSections, setOpenSections] = useState(new Set());
  const [dueDate, setDueDate] = useState("");
  const [overallResult, setOverallResult] = useState("");

  const locked = isEdit && report?.status === "submitted" && !admin;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const loaders = [getSectionSchema()];
    if (isEdit) loaders.push(getReportById(id));

    Promise.all(loaders)
      .then(([schemaRes, reportRes]) => {
        if (cancelled) return;
        const schemaData = schemaRes.data;
        setSchema(schemaData);

        let initialOpen = new Set(
          (schemaData.sections || []).filter((s) => s.always_visible).map((s) => s.key),
        );

        if (reportRes) {
          const r = reportRes.data;
          setReport(r);
          setOrder(r.order_detail || null);
          setSectionsState(r.sections || {});
          setDueDate(r.due_date || "");
          setOverallResult(r.overall_result || "");
          Object.keys(r.sections || {}).forEach((key) => {
            if (Object.keys(r.sections[key] || {}).length > 0) initialOpen.add(key);
          });
        }
        setOpenSections(initialOpen);
      })
      .catch(() => {
        toast.error("Failed to load the report form. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleFieldChange = useCallback((sectionKey, fieldKey, value) => {
    setSectionsState((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] || {}), [fieldKey]: value },
    }));
  }, []);

  const toggleSection = useCallback((sectionKey) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) next.delete(sectionKey);
      else next.add(sectionKey);
      return next;
    });
  }, []);

  const cleanedPreviewCount = useMemo(() => {
    if (!schema) return 0;
    return Object.keys(buildCleanSections(schema, sectionsState)).length;
  }, [schema, sectionsState]);

  const handleSave = async (target) => {
    if (!order) {
      toast.error("Please select an order first.");
      return;
    }
    if (target === "submit" && !overallResult) {
      toast.error("Overall Result is required to submit.");
      return;
    }

    setSaving(true);
    try {
      const cleaned = buildCleanSections(schema, sectionsState);
      let reportId = id;

      if (!reportId) {
        const payload = { order_id: order.id, sections: cleaned };
        if (dueDate) payload.due_date = dueDate;
        if (overallResult) payload.overall_result = overallResult;
        const res = await createReport(payload);
        reportId = res.data.id;
      } else {
        await patchReport(reportId, {
          sections: cleaned,
          due_date: dueDate || null,
          overall_result: overallResult || "",
        });
      }

      if (target === "submit") {
        await submitReport(reportId, overallResult);
        toast.success("Report submitted.");
      } else {
        toast.success("Draft saved.");
      }
      navigate(`/lab-qc/reports/${reportId}`);
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.detail ||
        data?.overall_result?.[0] ||
        data?.non_field_errors?.[0] ||
        "Failed to save the report. Please try again.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LabPageLayout>
        <LoadingState label="Loading report form..." />
      </LabPageLayout>
    );
  }

  return (
    <LabPageLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <PageHeader
          title={isEdit ? `Edit Report ${report?.report_no || ""}` : "Create New Report"}
          subtitle="Only sections you fill in will be saved and exported."
        />

        {locked && (
          <div
            style={{
              ...cardStyle,
              marginBottom: "1.5rem",
              background: "#fffbeb",
              borderColor: "#fde68a",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <FiLock color="#b45309" />
            <span style={{ color: "#92400e", fontSize: "0.9rem" }}>
              This report has been submitted and can only be amended by a Lab admin.
            </span>
          </div>
        )}

        {!order ? (
          <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
            <h3 style={{ marginTop: 0, fontSize: "1rem" }}>1. Select an Order</h3>
            <LabOrderPicker onSelect={(o) => setOrder(o)} />
          </div>
        ) : (
          <OrderSummary order={order} onChange={!isEdit ? () => setOrder(null) : null} />
        )}

        {order && (
          <>
            <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                <div>
                  <div style={labelStyle}>Overall Result</div>
                  <select
                    value={overallResult}
                    disabled={locked}
                    onChange={(e) => setOverallResult(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select result...</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="conditional">Conditional</option>
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Due Date (optional)</div>
                  <input
                    type="date"
                    value={dueDate || ""}
                    disabled={locked}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: "1rem", color: COLORS.text, marginBottom: "0.75rem" }}>
              2. Test Sections ({cleanedPreviewCount} with data)
            </h3>

            {(schema?.sections || []).map((section) => (
              <SectionPanel
                key={section.key}
                section={section}
                values={sectionsState[section.key]}
                onFieldChange={handleFieldChange}
                isOpen={section.always_visible || openSections.has(section.key)}
                onToggle={() => toggleSection(section.key)}
                disabled={locked}
              />
            ))}

            {!locked && (
              <div style={{ display: "flex", gap: 12, marginTop: "1.5rem", marginBottom: "3rem" }}>
                <button
                  type="button"
                  onClick={() => handleSave("draft")}
                  disabled={saving}
                  style={saving ? disabledButtonStyle : secondaryButtonStyle}
                >
                  {saving ? "Saving..." : "Save Draft"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave("submit")}
                  disabled={saving || !overallResult}
                  style={saving || !overallResult ? disabledButtonStyle : primaryButtonStyle}
                >
                  {saving ? "Submitting..." : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/lab-qc/reports")}
                  disabled={saving}
                  style={{ ...secondaryButtonStyle, background: "transparent", border: "none" }}
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </LabPageLayout>
  );
};

export default LabReportForm;
