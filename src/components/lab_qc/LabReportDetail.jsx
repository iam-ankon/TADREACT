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

  const filledSections = (schema?.sections || [])
    .map((section) => {
      const data = report.sections?.[section.key] || {};
      const fields = (section.fields || []).filter((f) => !isEmptyValue(data[f.key]));
      return { section, fields, data };
    })
    .filter((entry) => entry.fields.length > 0);

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
          filledSections.map(({ section, fields, data }) => (
            <div key={section.key} style={{ ...cardStyle, marginBottom: "1rem" }}>
              <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1rem" }}>{section.label}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                {fields.map((field) => (
                  <div key={field.key}>
                    <div style={labelStyle}>{field.label}</div>
                    <div style={{ color: COLORS.text, fontWeight: 500, wordBreak: "break-word" }}>
                      {field.type === "date" ? formatDate(data[field.key]) : String(data[field.key])}
                      {field.unit ? ` ${field.unit}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </LabPageLayout>
  );
};

export default LabReportDetail;
