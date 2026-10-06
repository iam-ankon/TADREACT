// src/components/merchandiser/OrderLabReports.jsx
//
// Lab/QC results for one order, shown on the order details page (Test
// Results tab). Read-only: data comes from orders/<id>/lab-reports/, which
// uses the order's own visibility rules. Pass/Fail always shows an icon +
// label, never colour alone.

import React, { useEffect, useState } from "react";
import { FaFlask, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaDownload, FaUserCheck } from "react-icons/fa";
import { getOrderLabReports, downloadOrderLabReportPdf } from "../../api/merchandiser";

const RESULT = {
  pass: { label: "Pass", cls: "pass", Icon: FaCheckCircle },
  fail: { label: "Fail", cls: "fail", Icon: FaTimesCircle },
  conditional: { label: "Conditional", cls: "cond", Icon: FaExclamationTriangle },
};

const resultFor = (text) => {
  const t = String(text || "").toLowerCase();
  if (t.includes("fail")) return RESULT.fail;
  if (t.includes("pass")) return RESULT.pass;
  return null;
};

const fmtDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return isNaN(date) ? null : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const CSS = `
.olr { font-family: "Inter", "Segoe UI", system-ui, sans-serif; color: #0f172a; margin-bottom: 20px; }
.olr-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.olr-head h3 { margin: 0; font-size: 16px; font-weight: 650; }
.olr-head .count { font-size: 12px; font-weight: 600; color: #1d4ed8; background: #eef4ff; border: 1px solid #dbe6fe; border-radius: 999px; padding: 1px 9px; }
.olr-head .drafts { font-size: 12.5px; color: #64748b; margin-left: auto; }
.olr-card { background: #fff; border: 1px solid #e6eaf0; border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden; margin-bottom: 14px; }
.olr-card-head { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 14px 18px; border-bottom: 1px solid #e6eaf0; }
.olr-no { font-size: 15px; font-weight: 700; }
.olr-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12.5px; color: #64748b; }
.olr-meta b { color: #334155; font-weight: 600; }
.olr-spacer { flex: 1; }
.olr-btn { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 13px; border-radius: 9px; border: 1px solid #d5dbe4; background: #fff; color: #334155; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.olr-btn:hover:not(:disabled) { background: #f8fafc; }
.olr-btn:disabled { opacity: .6; cursor: wait; }
.olr-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 650; padding: 4px 11px; border-radius: 999px; border: 1px solid; white-space: nowrap; }
.olr-pill.pass { color: #15803d; background: #f0fdf4; border-color: #bbf7d0; }
.olr-pill.fail { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
.olr-pill.cond { color: #a16207; background: #fefce8; border-color: #fde68a; }
.olr-pill.none { color: #64748b; background: #f8fafc; border-color: #e6eaf0; }
.olr-cell { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; font-size: 12.5px; }
.olr-cell.pass { color: #15803d; }
.olr-cell.fail { color: #b91c1c; }
.olr-table-wrap { overflow-x: auto; }
.olr-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
.olr-table th { padding: 9px 14px; text-align: left; background: #f8fafc; border-bottom: 1px solid #e6eaf0; font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: #64748b; white-space: nowrap; }
.olr-table th.c { text-align: center; text-transform: none; letter-spacing: 0; font-size: 12px; color: #334155; }
.olr-table td { padding: 10px 14px; border-bottom: 1px solid #eef1f5; color: #334155; vertical-align: top; }
.olr-table tr:last-child td { border-bottom: none; }
.olr-table td.c { text-align: center; }
.olr-test { font-weight: 600; color: #0f172a; }
.olr-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.olr-faint { color: #cbd5e1; }
.olr-empty { display: flex; align-items: center; gap: 12px; padding: 16px 18px; background: #fff; border: 1px dashed #d5dbe4; border-radius: 14px; color: #64748b; font-size: 13.5px; }
.olr-empty svg { color: #94a3b8; font-size: 18px; flex-shrink: 0; }
.olr-error { padding: 12px 16px; border-radius: 12px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-size: 13px; }
`;

const OrderLabReports = ({ orderId }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    getOrderLabReports(orderId)
      .then((res) => alive && setData(res.data))
      .catch((err) => alive && setError(err.response?.status === 404 ? null : "Couldn't load lab results for this order."));
    return () => {
      alive = false;
    };
  }, [orderId]);

  const download = async (report) => {
    setDownloading(report.id);
    try {
      await downloadOrderLabReportPdf(orderId, report.id, `${report.report_no}.pdf`);
    } catch {
      setError("Couldn't download the PDF. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const reports = data?.reports || [];

  return (
    <div className="olr">
      <style>{CSS}</style>
      <div className="olr-head">
        <FaFlask style={{ color: "#2563eb" }} />
        <h3>Lab / QC test reports</h3>
        {reports.length > 0 && <span className="count">{reports.length}</span>}
        {data?.drafts > 0 && (
          <span className="drafts">
            {data.drafts} report{data.drafts > 1 ? "s" : ""} still in progress at the lab
          </span>
        )}
      </div>

      {error && <div className="olr-error">{error}</div>}

      {!error && !data && <div className="olr-empty">Loading lab results…</div>}

      {data && reports.length === 0 && (
        <div className="olr-empty">
          <FaFlask />
          <span>
            No submitted lab report for this order yet
            {data.drafts > 0 ? " - the lab is still working on it." : "."}
          </span>
        </div>
      )}

      {reports.map((r) => {
        const overall = RESULT[r.overall_result] || null;
        const letters = r.colors.map((c) => c.letter);
        return (
          <div key={r.id} className="olr-card">
            <div className="olr-card-head">
              <span className="olr-no">{r.report_no}</span>
              {overall ? (
                <span className={`olr-pill ${overall.cls}`}>
                  <overall.Icon /> {overall.label}
                </span>
              ) : (
                <span className="olr-pill none">No overall result</span>
              )}
              <div className="olr-meta">
                {fmtDate(r.submitted_at) && (
                  <span>
                    Submitted <b>{fmtDate(r.submitted_at)}</b>
                  </span>
                )}
                {fmtDate(r.report_delivery_date) && (
                  <span>
                    Delivered <b>{fmtDate(r.report_delivery_date)}</b>
                  </span>
                )}
                {r.sample_type && (
                  <span>
                    Sample <b>{r.sample_type}</b>
                  </span>
                )}
                <span>
                  <FaUserCheck style={{ verticalAlign: "-2px", marginRight: 4 }} />
                  <b>{r.qc_user_name}</b>
                </span>
              </div>
              <span className="olr-spacer" />
              <button type="button" className="olr-btn" onClick={() => download(r)} disabled={downloading === r.id}>
                <FaDownload /> {downloading === r.id ? "Preparing…" : "PDF"}
              </button>
            </div>

            {r.tests.length === 0 ? (
              <div style={{ padding: "14px 18px", color: "#64748b", fontSize: 13 }}>No test results filled in.</div>
            ) : (
              <div className="olr-table-wrap">
                <table className="olr-table">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Requirement</th>
                      {r.colors.map((c) => (
                        <th key={c.letter} className="c">
                          {c.letter}) {c.name}
                        </th>
                      ))}
                      <th>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.tests.map((t) => (
                      <tr key={t.key}>
                        <td>
                          <div className="olr-test">{t.label}</div>
                          {t.standard && <div className="olr-sub">{t.standard}</div>}
                        </td>
                        <td>{t.requirement || <span className="olr-faint">—</span>}</td>
                        {letters.map((l) => {
                          const value = t.results[l];
                          const res = resultFor(value);
                          return (
                            <td key={l} className="c">
                              {!value ? (
                                <span className="olr-faint">—</span>
                              ) : res ? (
                                <span className={`olr-cell ${res.cls}`}>
                                  <res.Icon /> {value}
                                </span>
                              ) : (
                                value
                              )}
                            </td>
                          );
                        })}
                        <td>{t.remarks.length ? t.remarks.join("; ") : <span className="olr-faint">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrderLabReports;
