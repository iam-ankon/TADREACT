// src/components/lab_qc/LabReportList.jsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiSearch,
  FiDownload,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import {
  getReports,
  deleteReport,
  exportReportPdf,
  getFactories,
  getQcUsers,
  isLabAdmin,
} from "../../api/labQc";
import {
  LabPageLayout,
  LoadingState,
  PageHeader,
  cardStyle,
  inputStyle,
  labelStyle,
  primaryButtonStyle,
  dangerButtonStyle,
  StatusBadge,
  ResultBadge,
  formatDate,
  formatDateTime,
  COLORS,
} from "./common";

const PAGE_SIZE = 20;

const LabReportList = () => {
  const navigate = useNavigate();
  const admin = isLabAdmin();

  const [reports, setReports] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [overallResult, setOverallResult] = useState("");
  const [factory, setFactory] = useState("");
  const [month, setMonth] = useState("");
  const [qcUser, setQcUser] = useState("");

  const [factoryOptions, setFactoryOptions] = useState([]);
  const [qcUserOptions, setQcUserOptions] = useState([]);

  const searchDebounce = useRef(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(searchDebounce.current);
  }, [searchInput]);

  useEffect(() => {
    // Every Lab/QC user (not just admins) needs the full factory list for
    // the "Factory" filter - it's just id+name, nothing sensitive.
    getFactories()
      .then((res) => setFactoryOptions(res.data || []))
      .catch(() => {});
    if (admin) {
      getQcUsers()
        .then((res) => setQcUserOptions(res.data || []))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReports = useCallback(() => {
    setLoading(true);
    const params = { page };
    if (search) params.search = search;
    if (status) params.status = status;
    if (overallResult) params.overall_result = overallResult;
    if (factory) params.factory = factory;
    if (month) params.month = month;
    if (admin && qcUser) params.qc_user = qcUser;

    getReports(params)
      .then((res) => {
        setReports(res.data?.results || []);
        setCount(res.data?.count || 0);
      })
      .catch(() => toast.error("Failed to load reports."))
      .finally(() => setLoading(false));
  }, [page, search, status, overallResult, factory, month, qcUser, admin]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const derivedFactoryOptions = useMemo(
    () => factoryOptions.map((f) => ({ id: f.id, name: f.supplier_name })),
    [factoryOptions],
  );

  const handleDelete = async (report) => {
    if (!window.confirm(`Delete report ${report.report_no}? This cannot be undone.`)) return;
    try {
      await deleteReport(report.id);
      toast.success("Report deleted.");
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete report.");
    }
  };

  const handleExport = async (report) => {
    try {
      await exportReportPdf(report.id, `${report.report_no}.pdf`);
    } catch {
      toast.error("Failed to export PDF.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <LabPageLayout>
      <PageHeader
        title="Lab Test Reports"
        subtitle={`${count} report(s)`}
        actions={
          <button style={primaryButtonStyle} onClick={() => navigate("/lab-qc/reports/new")}>
            <FiPlus style={{ marginRight: 6, verticalAlign: "middle" }} />
            Create New Report
          </button>
        }
      />

      <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1rem",
          }}
        >
          <div>
            <div style={labelStyle}>Search</div>
            <div style={{ position: "relative" }}>
              <FiSearch style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: COLORS.textMuted }} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Report no, order, buyer..."
                style={{ ...inputStyle, paddingLeft: 32 }}
              />
            </div>
          </div>
          <div>
            <div style={labelStyle}>Status</div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              style={inputStyle}
            >
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>
          <div>
            <div style={labelStyle}>Overall Result</div>
            <select
              value={overallResult}
              onChange={(e) => {
                setOverallResult(e.target.value);
                setPage(1);
              }}
              style={inputStyle}
            >
              <option value="">All</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="conditional">Conditional</option>
            </select>
          </div>
          <div>
            <div style={labelStyle}>Factory</div>
            <select
              value={factory}
              onChange={(e) => {
                setFactory(e.target.value);
                setPage(1);
              }}
              style={inputStyle}
            >
              <option value="">All</option>
              {derivedFactoryOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div style={labelStyle}>Month</div>
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setPage(1);
              }}
              style={inputStyle}
            />
          </div>
          {admin && (
            <div>
              <div style={labelStyle}>QC Officer</div>
              <select
                value={qcUser}
                onChange={(e) => {
                  setQcUser(e.target.value);
                  setPage(1);
                }}
                style={inputStyle}
              >
                <option value="">All</option>
                {qcUserOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name || u.username}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <LoadingState label="Loading reports..." />
        ) : reports.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: COLORS.textMuted }}>
            No reports found for the current filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                  {["Report No", "Order No", "Buyer", "Factory", "QC Officer", "Status", "Result", "Due Date", "Submitted", "Actions"].map(
                    (h) => (
                      <th key={h} style={{ padding: "12px 16px", color: COLORS.textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const canEdit = admin || r.status !== "submitted";
                  const canDelete = admin || r.status !== "submitted";
                  return (
                    <tr
                      key={r.id}
                      style={{ borderTop: `1px solid ${COLORS.border}`, cursor: "pointer" }}
                      onClick={() => navigate(`/lab-qc/reports/${r.id}`)}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{r.report_no}</td>
                      <td style={{ padding: "12px 16px" }}>{r.order_no}</td>
                      <td style={{ padding: "12px 16px" }}>{r.buyer || "-"}</td>
                      <td style={{ padding: "12px 16px" }}>{r.factory_name}</td>
                      <td style={{ padding: "12px 16px" }}>{r.qc_user_name}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <StatusBadge status={r.status} />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <ResultBadge result={r.overall_result} />
                      </td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>{formatDate(r.due_date)}</td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>{formatDateTime(r.submitted_at)}</td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          title="View"
                          onClick={() => navigate(`/lab-qc/reports/${r.id}`)}
                          style={iconBtnStyle}
                        >
                          <FiEye />
                        </button>
                        <button title="Export PDF" onClick={() => handleExport(r)} style={iconBtnStyle}>
                          <FiDownload />
                        </button>
                        <button
                          title={canEdit ? "Edit" : "Locked (submitted)"}
                          disabled={!canEdit}
                          onClick={() => canEdit && navigate(`/lab-qc/reports/${r.id}/edit`)}
                          style={{ ...iconBtnStyle, opacity: canEdit ? 1 : 0.35, cursor: canEdit ? "pointer" : "not-allowed" }}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          title={canDelete ? "Delete" : "Locked (submitted)"}
                          disabled={!canDelete}
                          onClick={() => canDelete && handleDelete(r)}
                          style={{ ...iconBtnStyle, color: "#ef4444", opacity: canDelete ? 1 : 0.35, cursor: canDelete ? "pointer" : "not-allowed" }}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            <span style={{ fontSize: "0.8rem", color: COLORS.textMuted }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{ ...iconBtnStyle, opacity: page <= 1 ? 0.4 : 1 }}
              >
                <FiChevronLeft />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{ ...iconBtnStyle, opacity: page >= totalPages ? 0.4 : 1 }}
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </LabPageLayout>
  );
};

const iconBtnStyle = {
  border: `1px solid ${COLORS.border}`,
  background: "white",
  borderRadius: 6,
  padding: "6px 8px",
  marginRight: 6,
  cursor: "pointer",
  color: COLORS.text,
};

export default LabReportList;
