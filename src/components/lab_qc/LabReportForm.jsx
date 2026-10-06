// src/components/lab_qc/LabReportForm.jsx
//
// "Create New Report" / edit-draft form. The universal test form is never
// hardcoded here - every section and field is rendered from whatever
// GET /section-schema/ returns at runtime.

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FiChevronDown, FiChevronUp, FiX, FiLock, FiPlus, FiTrash2 } from "react-icons/fi";
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
  computeTableRow,
  fillLabel,
  isEmptyValue,
  isFieldVisible,
  reportColorNames,
  sectionsMissingColorName,
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

const FieldInput = ({ field, value, onChange, disabled, ctx, listId }) => {
  const helperParts = [];
  if (field.unit) helperParts.push(`Unit: ${field.unit}`);
  if (field.min !== undefined && field.min !== null) helperParts.push(`Min: ${field.min}`);
  if (field.max !== undefined && field.max !== null) helperParts.push(`Max: ${field.max}`);
  if (field.note) helperParts.push(field.note);
  const helperText = helperParts.join(" · ");

  let control;
  switch (field.type) {
    case "static":
      control = (
        <div style={{ ...inputStyle, background: "#f8fafc", color: COLORS.text, fontWeight: 600 }}>
          {field.value}
        </div>
      );
      break;
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
          list={listId}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          placeholder={field.note || ""}
        />
      );
  }

  return (
    <div>
      <div style={labelStyle}>{fillLabel(field.label, ctx)}</div>
      {control}
      {helperText && (
        <div style={{ fontSize: "0.72rem", color: COLORS.textMuted, marginTop: 4 }}>{helperText}</div>
      )}
    </div>
  );
};

const tableHeadStyle = {
  textAlign: "left",
  padding: "8px 10px",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: COLORS.text,
  borderBottom: `1px solid ${COLORS.border}`,
};

const tableCellStyle = {
  padding: "6px 10px",
  borderBottom: `1px solid ${COLORS.border}`,
  verticalAlign: "middle",
};

const tableCellInputStyle = {
  ...inputStyle,
  padding: "6px 8px",
  fontSize: "0.82rem",
  minWidth: 90,
};

const smallButtonStyle = {
  ...secondaryButtonStyle,
  padding: "6px 12px",
  fontSize: "0.8rem",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

const iconButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#ef4444",
  cursor: "pointer",
  padding: 4,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

/** One editable cell of a table / rows field. */
const CellControl = ({ col, value, onChange, disabled }) => {
  if (col.compute) {
    return (
      <input readOnly value={value ?? ""} style={{ ...tableCellInputStyle, background: "#f8fafc", fontWeight: 600 }} />
    );
  }
  if (col.type === "select") {
    return (
      <select value={value ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} style={tableCellInputStyle}>
        <option value="">-</option>
        {(col.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      type={col.type === "number" ? "number" : "text"}
      step="any"
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      style={tableCellInputStyle}
    />
  );
};

const ColumnHeads = ({ columns, ctx }) =>
  columns.map((col) => (
    <th key={col.key} style={tableHeadStyle}>
      {fillLabel(col.label, ctx)}
      {col.compute && <span style={{ fontWeight: 400, color: COLORS.textMuted }}> (auto)</span>}
    </th>
  ));

/** Fixed-row grid; with allow_extra_rows the user can add named rows
 *  (stored under "_extra"). onChange receives the whole table value. */
const TableInput = ({ field, value, onChange, disabled, ctx }) => {
  const columns = field.columns || [];
  const table = value || {};
  const extra = table._extra || [];

  const setCell = (rowKey, colKey, v) => {
    const row = computeTableRow(columns, { ...(table[rowKey] || {}), [colKey]: v });
    onChange({ ...table, [rowKey]: row });
  };
  const setExtra = (idx, patch) => {
    const next = extra.map((r, i) => (i === idx ? computeTableRow(columns, { ...r, ...patch }) : r));
    onChange({ ...table, _extra: next });
  };

  return (
    <div>
      <div style={{ ...labelStyle, marginBottom: 6 }}>{fillLabel(field.label, ctx)}</div>
      <div style={{ overflowX: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={tableHeadStyle}>{field.row_header || ""}</th>
              <ColumnHeads columns={columns} ctx={ctx} />
              {field.allow_extra_rows && <th style={tableHeadStyle} />}
            </tr>
          </thead>
          <tbody>
            {(field.rows || []).map((row, idx) =>
              row.heading ? (
                <tr key={`h-${idx}`} style={{ background: "#f8fafc" }}>
                  <td colSpan={columns.length + 2} style={{ ...tableCellStyle, fontWeight: 600 }}>
                    {row.heading}
                  </td>
                </tr>
              ) : (
                <tr key={row.key}>
                  <td style={{ ...tableCellStyle, fontWeight: 500, whiteSpace: "nowrap" }}>{row.label}</td>
                  {columns.map((col) => (
                    <td key={col.key} style={tableCellStyle}>
                      <CellControl
                        col={col}
                        value={table[row.key]?.[col.key]}
                        disabled={disabled}
                        onChange={(v) => setCell(row.key, col.key, v)}
                      />
                    </td>
                  ))}
                  {field.allow_extra_rows && <td style={tableCellStyle} />}
                </tr>
              ),
            )}
            {extra.map((row, idx) => (
              <tr key={`x-${idx}`} style={{ background: "#fefce8" }}>
                <td style={tableCellStyle}>
                  <input
                    value={row.label ?? ""}
                    disabled={disabled}
                    placeholder="Seam name"
                    onChange={(e) => setExtra(idx, { label: e.target.value })}
                    style={{ ...tableCellInputStyle, fontWeight: 500 }}
                  />
                </td>
                {columns.map((col) => (
                  <td key={col.key} style={tableCellStyle}>
                    <CellControl
                      col={col}
                      value={row[col.key]}
                      disabled={disabled}
                      onChange={(v) => setExtra(idx, { [col.key]: v })}
                    />
                  </td>
                ))}
                <td style={tableCellStyle}>
                  {!disabled && (
                    <button
                      type="button"
                      title="Remove row"
                      style={iconButtonStyle}
                      onClick={() => onChange({ ...table, _extra: extra.filter((_, i) => i !== idx) })}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {field.allow_extra_rows && !disabled && (
        <button
          type="button"
          style={{ ...smallButtonStyle, marginTop: 8 }}
          onClick={() => onChange({ ...table, _extra: [...extra, { label: "" }] })}
        >
          <FiPlus size={12} /> Add seam
        </button>
      )}
    </div>
  );
};

/** Free list of rows (e.g. attachment components); always shows at least
 *  one row. A new row inherits the previous row's Sample. */
const RowsInput = ({ field, value, onChange, disabled, ctx }) => {
  const columns = field.columns || [];
  const rows = Array.isArray(value) && value.length > 0 ? value : [{}];
  const setCell = (idx, colKey, v) =>
    onChange(rows.map((r, i) => (i === idx ? computeTableRow(columns, { ...r, [colKey]: v }) : r)));
  const addRow = () => {
    const last = rows[rows.length - 1] || {};
    onChange([...rows, last.sample ? { sample: last.sample } : {}]);
  };

  return (
    <div>
      <div style={{ ...labelStyle, marginBottom: 6 }}>{fillLabel(field.label, ctx)}</div>
      <div style={{ overflowX: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={{ ...tableHeadStyle, width: 36 }}>#</th>
              <ColumnHeads columns={columns} ctx={ctx} />
              <th style={tableHeadStyle} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ ...tableCellStyle, color: COLORS.textMuted }}>{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col.key} style={tableCellStyle}>
                    <CellControl
                      col={col}
                      value={row[col.key]}
                      disabled={disabled}
                      onChange={(v) => setCell(idx, col.key, v)}
                    />
                  </td>
                ))}
                <td style={tableCellStyle}>
                  {!disabled && rows.length > 1 && (
                    <button
                      type="button"
                      title="Remove row"
                      style={iconButtonStyle}
                      onClick={() => onChange(rows.filter((_, i) => i !== idx))}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        {!disabled && (
          <button type="button" style={smallButtonStyle} onClick={addRow}>
            <FiPlus size={12} /> {field.add_label || "Add row"}
          </button>
        )}
        {field.note && <span style={{ fontSize: "0.72rem", color: COLORS.textMuted }}>{field.note}</span>}
      </div>
    </div>
  );
};

const fieldsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};

/** Renders a list of schema fields against one flat values object. */
const FieldGrid = ({ fields, values, ctx, onChange, disabled, colorListId }) => (
  <div style={fieldsGridStyle}>
    {(fields || [])
      .filter((field) => isFieldVisible(field, ctx))
      .map((field) => {
        if (field.type === "heading") {
          return (
            <div
              key={field.key}
              style={{
                gridColumn: "1 / -1",
                fontWeight: 700,
                fontSize: "0.9rem",
                color: COLORS.primaryDark,
                borderBottom: `1px solid ${COLORS.border}`,
                paddingBottom: 4,
                marginTop: 6,
              }}
            >
              {field.label}
            </div>
          );
        }
        if (field.type === "table" || field.type === "rows") {
          const Input = field.type === "table" ? TableInput : RowsInput;
          return (
            <div key={field.key} style={{ gridColumn: "1 / -1" }}>
              <Input
                field={field}
                value={values?.[field.key]}
                ctx={ctx}
                disabled={disabled}
                onChange={(val) => onChange(field.key, val)}
              />
            </div>
          );
        }
        return (
          <FieldInput
            key={field.key}
            field={field}
            value={values?.[field.key]}
            ctx={ctx}
            disabled={disabled}
            listId={field.key === "color_name" ? colorListId : undefined}
            onChange={(val) => onChange(field.key, val)}
          />
        );
      })}
  </div>
);

const countFilled = (fields, values, ctx) =>
  (fields || []).reduce((n, field) => {
    if (field.type === "static" || field.type === "heading") return n;
    if (!isFieldVisible(field, ctx)) return n;
    const v = values?.[field.key];
    if (field.type === "table") {
      const rows = Object.entries(v || {}).flatMap(([k, cells]) => (k === "_extra" ? cells : [cells]));
      return n + rows.reduce((m, cells) => m + Object.values(cells || {}).filter((c) => !isEmptyValue(c)).length, 0);
    }
    if (field.type === "rows") {
      return n + (v || []).reduce((m, r) => m + Object.values(r || {}).filter((c) => !isEmptyValue(c)).length, 0);
    }
    return n + (isEmptyValue(v) ? 0 : 1);
  }, 0);

const subCardStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  padding: "1rem 1.1rem 1.1rem",
  background: "#fcfdff",
};

const subTitleStyle = {
  fontSize: "0.78rem",
  fontWeight: 700,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  color: COLORS.textMuted,
  marginBottom: "0.75rem",
};

/** The color entries shown for a test section (always at least one card). */
const displayEntries = (values) => (values?.entries?.length ? values.entries : [{}]);

const TestSectionBody = ({
  section,
  values,
  generalInfo,
  onSetupChange,
  onEntryChange,
  onAddEntries,
  onRemoveEntry,
  disabled,
  knownColors,
  colorListId,
}) => {
  const setupCtx = { ...(generalInfo || {}), ...(values || {}) };
  const entries = displayEntries(values);
  const used = new Set(entries.map((e) => String(e.color_name || "").trim().toLowerCase()));
  const missingColors = knownColors.filter((c) => !used.has(c.toLowerCase()));
  const setupFields = section.setup_fields || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {section.uses_washing_conditions && (
        <div style={{ fontSize: "0.8rem", color: COLORS.textMuted }}>
          Standard, wash method, temperature, wash/dry type and number of washes are taken from{" "}
          <b>Washing Conditions</b> above.
        </div>
      )}
      {setupFields.length > 0 && (
        <div style={subCardStyle}>
          <div style={subTitleStyle}>Test setup · applies to all colors</div>
          <FieldGrid
            fields={setupFields}
            values={values}
            ctx={setupCtx}
            disabled={disabled}
            onChange={(key, val) => onSetupChange(section.key, key, val)}
          />
        </div>
      )}

      {entries.map((entry, idx) => (
        <div key={idx} style={{ ...subCardStyle, borderLeft: `4px solid ${COLORS.primary}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={subTitleStyle}>
              Color {idx + 1}
              {entry.color_name ? ` · ${entry.color_name}` : ""}
            </div>
            {!disabled && entries.length > 1 && (
              <button
                type="button"
                style={{ ...iconButtonStyle, fontSize: "0.8rem" }}
                onClick={() => onRemoveEntry(section.key, idx)}
              >
                <FiTrash2 size={13} /> Remove color
              </button>
            )}
          </div>
          <FieldGrid
            fields={section.fields}
            values={entry}
            ctx={{ ...setupCtx, ...entry }}
            disabled={disabled}
            colorListId={colorListId}
            onChange={(key, val) => onEntryChange(section.key, idx, key, val)}
          />
        </div>
      ))}

      {!disabled && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" style={smallButtonStyle} onClick={() => onAddEntries(section.key, [""])}>
            <FiPlus size={12} /> Add color
          </button>
          {missingColors.length > 0 && (
            <button type="button" style={smallButtonStyle} onClick={() => onAddEntries(section.key, missingColors)}>
              <FiPlus size={12} /> Add report colors ({missingColors.join(", ")})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const pillStyle = (color, background) => ({
  fontSize: "0.7rem",
  fontWeight: 600,
  color,
  background,
  borderRadius: 20,
  padding: "2px 8px",
});

const SectionPanel = ({ section, values, generalInfo, isOpen, onToggle, disabled, ...handlers }) => {
  const isTest = section.kind === "test";
  const filledCount = isTest
    ? countFilled(section.setup_fields, values, { ...generalInfo, ...values }) +
      displayEntries(values).reduce(
        (n, e) => n + countFilled(section.fields, e, { ...generalInfo, ...values, ...e }) - (isEmptyValue(e.color_name) ? 0 : 1),
        0,
      )
    : countFilled(section.fields, values, values);
  const colorCount = isTest ? (values?.entries || []).filter((e) => !isEmptyValue(e.color_name)).length : 0;

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
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, color: COLORS.text }}>{section.label}</span>
          {filledCount > 0 && <span style={pillStyle("#1d4ed8", "#dbeafe")}>{filledCount} filled</span>}
          {colorCount > 0 && (
            <span style={pillStyle("#047857", "#d1fae5")}>
              {colorCount} color{colorCount > 1 ? "s" : ""}
            </span>
          )}
          {section.note && <span style={{ fontSize: "0.72rem", color: COLORS.textMuted }}>{section.note}</span>}
        </div>
        {!section.always_visible && (isOpen ? <FiChevronUp /> : <FiChevronDown />)}
      </div>

      {isOpen && (
        <div style={{ padding: "1.25rem 1.5rem 1.5rem", borderTop: `1px solid ${COLORS.border}` }}>
          {isTest ? (
            <TestSectionBody
              section={section}
              values={values}
              generalInfo={generalInfo}
              disabled={disabled}
              {...handlers}
            />
          ) : (
            <FieldGrid
              fields={section.fields}
              values={values}
              ctx={values}
              disabled={disabled}
              onChange={(key, val) => handlers.onSetupChange(section.key, key, val)}
            />
          )}
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

  /** Flat field of an info section, or a setup field of a test section. */
  const handleSetupChange = useCallback((sectionKey, fieldKey, value) => {
    setSectionsState((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] || {}), [fieldKey]: value },
    }));
  }, []);

  const handleEntryChange = useCallback((sectionKey, idx, fieldKey, value) => {
    setSectionsState((prev) => {
      const section = prev[sectionKey] || {};
      const entries = [...(section.entries?.length ? section.entries : [{}])];
      entries[idx] = { ...(entries[idx] || {}), [fieldKey]: value };
      return { ...prev, [sectionKey]: { ...section, entries } };
    });
  }, []);

  /** Adds one color entry per name ("" = blank card). An untouched blank
   *  first card is replaced when named colors are added. */
  const handleAddEntries = useCallback((sectionKey, names) => {
    setSectionsState((prev) => {
      const section = prev[sectionKey] || {};
      let entries = section.entries?.length ? [...section.entries] : [{}];
      const named = names.filter(Boolean);
      if (named.length > 0 && entries.length === 1 && Object.values(entries[0]).every(isEmptyValue)) {
        entries = [];
      }
      names.forEach((name) => entries.push(name ? { color_name: name } : {}));
      return { ...prev, [sectionKey]: { ...section, entries } };
    });
  }, []);

  const handleRemoveEntry = useCallback((sectionKey, idx) => {
    setSectionsState((prev) => {
      const section = prev[sectionKey] || {};
      const entries = (section.entries || []).filter((_, i) => i !== idx);
      return { ...prev, [sectionKey]: { ...section, entries } };
    });
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

  const knownColors = useMemo(() => reportColorNames(schema, sectionsState), [schema, sectionsState]);

  const handleSave = async (target) => {
    if (!order) {
      toast.error("Please select an order first.");
      return;
    }
    if (target === "submit" && !overallResult) {
      toast.error("Overall Result is required to submit.");
      return;
    }

    const cleaned = buildCleanSections(schema, sectionsState);
    const unnamed = sectionsMissingColorName(schema, cleaned);
    if (unnamed.length > 0) {
      toast.error(`Enter a Color Name for every color in: ${unnamed.join(", ")}`);
      return;
    }

    setSaving(true);
    try {
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
        data?.sections?.[0] ||
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

            <datalist id="lab-color-names">
              {knownColors.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            {(schema?.sections || []).map((section) => (
              <SectionPanel
                key={section.key}
                section={section}
                values={sectionsState[section.key]}
                generalInfo={sectionsState.general_info}
                onSetupChange={handleSetupChange}
                onEntryChange={handleEntryChange}
                onAddEntries={handleAddEntries}
                onRemoveEntry={handleRemoveEntry}
                knownColors={knownColors}
                colorListId="lab-color-names"
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
