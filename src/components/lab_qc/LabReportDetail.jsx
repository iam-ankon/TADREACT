// src/components/lab_qc/LabReportDetail.jsx
//
// Read-only render of one report: order info block + only the filled
// sections/fields (same "skip empty" rule the PDF export applies), export
// and edit actions.

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiDownload, FiEdit2, FiArrowLeft, FiLock } from "react-icons/fi";
import { getReportById, getSectionSchema, exportReportPdf, isLabAdmin } from "../../api/labQc";
import {
  LabPageLayout,
  LoadingState,
  PageHeader,
  cardStyle,
  labelStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  StatusBadge,
  ResultBadge,
  formatDate,
  formatDateTime,
  fillLabel,
  isEmptyValue,
  COLORS,
} from "./common";

const ORDER_FIELD_ROWS = [
  ["PO No", "order_no"],
  ["Buyer", "buyer"],
  ["Order NO", "style"],
  ["Item", "item"],
  ["Garment", "garment"],
  ["Factory", "factory_name"],
  ["Order Date", "order_date", true],
  ["Production Start Date", "production_start_date", true],
  ["Shipment Date", "shipment_date", true],
  ["Status", "status"],
];

const tableHead = {
  textAlign: "left",
  padding: "7px 10px",
  fontSize: "0.75rem",
  fontWeight: 600,
  background: "#f1f5f9",
  borderBottom: `1px solid ${COLORS.border}`,
};
const tableCell = { padding: "7px 10px", borderBottom: `1px solid ${COLORS.border}`, fontSize: "0.85rem" };

const hasCells = (cells, columns) => columns.some((c) => !isEmptyValue(cells?.[c.key]));

const GridShell = ({ title, head, children }) => (
  <div style={{ gridColumn: "1 / -1" }}>
    <div style={labelStyle}>{title}</div>
    <div style={{ overflowX: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  </div>
);

/** Read-only grid: only rows with data (and a heading row only if a row
 *  under it has data), plus user-added rows - same rule as the PDF. */
const ReadOnlyTable = ({ field, value, ctx }) => {
  const columns = field.columns || [];
  const body = [];
  let pendingHeading = null;
  const cellsRow = (key, label, cells) => (
    <tr key={key}>
      <td style={{ ...tableCell, fontWeight: 500 }}>{label}</td>
      {columns.map((c) => (
        <td key={c.key} style={tableCell}>
          {isEmptyValue(cells[c.key]) ? "-" : String(cells[c.key])}
        </td>
      ))}
    </tr>
  );
  (field.rows || []).forEach((row, idx) => {
    if (row.heading) {
      pendingHeading = { key: `h-${idx}`, label: row.heading };
      return;
    }
    const cells = value?.[row.key] || {};
    if (!hasCells(cells, columns)) return;
    if (pendingHeading) {
      body.push(
        <tr key={pendingHeading.key} style={{ background: "#f8fafc" }}>
          <td colSpan={columns.length + 1} style={{ ...tableCell, fontWeight: 600 }}>
            {pendingHeading.label}
          </td>
        </tr>,
      );
      pendingHeading = null;
    }
    body.push(cellsRow(row.key, row.label, cells));
  });
  (value?._extra || []).forEach((row, idx) => {
    if (hasCells(row, columns)) body.push(cellsRow(`x-${idx}`, row.label || "-", row));
  });
  if (body.length === 0) return null;
  return (
    <GridShell
      title={fillLabel(field.label, ctx)}
      head={
        <>
          <th style={tableHead}>{field.row_header || ""}</th>
          {columns.map((c) => (
            <th key={c.key} style={tableHead}>
              {fillLabel(c.label, ctx)}
            </th>
          ))}
        </>
      }
    >
      {body}
    </GridShell>
  );
};

const ReadOnlyRows = ({ field, value, ctx }) => {
  const columns = field.columns || [];
  const rows = (value || []).filter((r) => hasCells(r, columns));
  if (rows.length === 0) return null;
  return (
    <GridShell
      title={fillLabel(field.label, ctx)}
      head={columns.map((c) => (
        <th key={c.key} style={tableHead}>
          {fillLabel(c.label, ctx)}
        </th>
      ))}
    >
      {rows.map((r, idx) => (
        <tr key={idx}>
          {columns.map((c) => (
            <td key={c.key} style={tableCell}>
              {isEmptyValue(r[c.key]) ? "-" : String(r[c.key])}
            </td>
          ))}
        </tr>
      ))}
    </GridShell>
  );
};

const hasFieldData = (field, data) => {
  if (field.type === "heading") return false;
  const v = data?.[field.key];
  if (field.type === "table") {
    return Object.entries(v || {}).some(([k, cells]) =>
      (k === "_extra" ? cells : [cells]).some((c) => Object.values(c || {}).some((x) => !isEmptyValue(x))),
    );
  }
  if (field.type === "rows") return (v || []).some((r) => Object.values(r || {}).some((x) => !isEmptyValue(x)));
  return !isEmptyValue(v);
};

/** Fields with data; a sub-heading is kept only if a field after it
 *  (before the next heading) has data. */
const filledFields = (fields, data, skip = []) => {
  const all = (fields || []).filter((f) => !skip.includes(f.key));
  return all.filter((f, i) => {
    if (f.type !== "heading") return hasFieldData(f, data);
    for (let j = i + 1; j < all.length && all[j].type !== "heading"; j++) {
      if (hasFieldData(all[j], data)) return true;
    }
    return false;
  });
};

const ReadOnlyFields = ({ fields, data, ctx }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
    {fields.map((field) => {
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
            }}
          >
            {field.label}
          </div>
        );
      }
      if (field.type === "table") return <ReadOnlyTable key={field.key} field={field} value={data[field.key]} ctx={ctx} />;
      if (field.type === "rows") return <ReadOnlyRows key={field.key} field={field} value={data[field.key]} ctx={ctx} />;
      return (
        <div key={field.key}>
          <div style={labelStyle}>{fillLabel(field.label, ctx)}</div>
          <div style={{ color: COLORS.text, fontWeight: 500, wordBreak: "break-word" }}>
            {field.type === "date" ? formatDate(data[field.key]) : String(data[field.key])}
            {field.unit ? ` ${field.unit}` : ""}
          </div>
        </div>
      );
    })}
  </div>
);

const ENTRY_META_FIELDS = ["color_name", "remark", "conclusion"];

const TestSectionView = ({ section, data, general }) => {
  const setupCtx = { ...general, ...data };
  const setup = filledFields(section.setup_fields, data);
  const entries = (data.entries || []).filter((e) => filledFields(section.fields, e, ["color_name"]).length > 0);
  if (entries.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {setup.length > 0 && <ReadOnlyFields fields={setup} data={data} ctx={setupCtx} />}
      {entries.map((entry, idx) => {
        const ctx = { ...setupCtx, ...entry };
        const fields = filledFields(section.fields, entry, ENTRY_META_FIELDS);
        return (
          <div
            key={idx}
            style={{
              border: `1px solid ${COLORS.border}`,
              borderLeft: `4px solid ${COLORS.primary}`,
              borderRadius: 12,
              padding: "0.9rem 1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: fields.length ? 12 : 0, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, color: COLORS.text }}>Color: {entry.color_name || "-"}</span>
              {entry.remark && <ResultBadge result={String(entry.remark).toLowerCase()} />}
              {entry.conclusion && <span style={{ fontSize: "0.85rem", color: COLORS.textMuted }}>{entry.conclusion}</span>}
            </div>
            {fields.length > 0 && <ReadOnlyFields fields={fields} data={entry} ctx={ctx} />}
          </div>
        );
      })}
    </div>
  );
};

const LabReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const admin = isLabAdmin();

  const [report, setReport] = useState(null);
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getReportById(id), getSectionSchema()])
      .then(([reportRes, schemaRes]) => {
        if (cancelled) return;
        setReport(reportRes.data);
        setSchema(schemaRes.data);
      })
      .catch(() => toast.error("Failed to load report."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportReportPdf(report.id, `${report.report_no}.pdf`);
    } catch {
      toast.error("Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <LabPageLayout>
        <LoadingState label="Loading report..." />
      </LabPageLayout>
    );
  }

  if (!report) {
    return (
      <LabPageLayout>
        <div style={{ padding: "2rem", color: COLORS.textMuted }}>Report not found.</div>
      </LabPageLayout>
    );
  }

  const order = report.order_detail || {};
  const canEdit = admin || report.status !== "submitted";

  const general = report.sections?.general_info || {};
  const filledSections = (schema?.sections || [])
    .map((section) => ({ section, data: report.sections?.[section.key] || {} }))
    .filter(({ section, data }) =>
      section.kind === "test"
        ? (data.entries || []).some((e) => filledFields(section.fields, e, ["color_name"]).length > 0)
        : filledFields(section.fields, data).length > 0,
    );

  return (
    <LabPageLayout>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Link to="/lab-qc/reports" style={{ color: COLORS.primary, fontSize: "0.85rem", textDecoration: "none" }}>
          <FiArrowLeft style={{ verticalAlign: "middle", marginRight: 4 }} />
          Back to Reports
        </Link>

        <PageHeader
          title={report.report_no}
          subtitle={
            <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <StatusBadge status={report.status} />
              <ResultBadge result={report.overall_result} />
              <span style={{ fontSize: "0.8rem", color: COLORS.textMuted }}>
                Due: {formatDate(report.due_date)} &nbsp;|&nbsp; Submitted: {formatDateTime(report.submitted_at)}
              </span>
            </span>
          }
          actions={
            <>
              <button style={secondaryButtonStyle} onClick={handleExport} disabled={exporting}>
                <FiDownload style={{ marginRight: 6, verticalAlign: "middle" }} />
                {exporting ? "Exporting..." : "Export PDF"}
              </button>
              {canEdit ? (
                <button style={primaryButtonStyle} onClick={() => navigate(`/lab-qc/reports/${report.id}/edit`)}>
                  <FiEdit2 style={{ marginRight: 6, verticalAlign: "middle" }} />
                  Edit
                </button>
              ) : (
                <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.8rem",
                  color: "#92400e",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 10,
                  padding: "8px 14px",
                }}
              >
                  <FiLock />
                  Locked - only a Lab admin can amend a submitted report.
                </div>
              )}
            </>
          }
        />

        <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
          <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Order Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.9rem" }}>
            {ORDER_FIELD_ROWS.map(([label, key, isDate]) => (
              <div key={key}>
                <div style={labelStyle}>{label}</div>
                <div style={{ color: COLORS.text, fontWeight: 500 }}>
                  {isDate
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

        {filledSections.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", color: COLORS.textMuted }}>
            No test sections were filled in for this report.
          </div>
        ) : (
          filledSections.map(({ section, data }) => (
            <div key={section.key} style={{ ...cardStyle, marginBottom: "1rem" }}>
              <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1rem" }}>{section.label}</h3>
              {section.kind === "test" ? (
                <TestSectionView section={section} data={data} general={general} />
              ) : (
                <ReadOnlyFields fields={filledFields(section.fields, data)} data={data} ctx={data} />
              )}
            </div>
          ))
        )}
      </div>
    </LabPageLayout>
  );
};

export default LabReportDetail;
