import React, { useState, useEffect, useCallback } from "react";
import {
  FiDollarSign, FiDownload, FiRefreshCw, FiAlertCircle, FiPlus,
} from "react-icons/fi";
import {
  getCanadaPayroll, getMonthlyPayrollSummary, calculatePayroll, createPayrollRecord,
} from "../../api/canadaApi";

const fmtCAD = (v) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD",
    minimumFractionDigits: 2 }).format(v || 0);

const PROVINCES = [
  ["ON","Ontario"],["BC","British Columbia"],["AB","Alberta"],
  ["QC","Quebec"],["MB","Manitoba"],["SK","Saskatchewan"],
  ["NS","Nova Scotia"],["NB","New Brunswick"],["NL","Newfoundland"],
  ["PE","Prince Edward Island"],["NT","Northwest Territories"],
  ["NU","Nunavut"],["YT","Yukon"],
];

const STATUS_STYLE = {
  draft:     { bg: "#F1F5F9", color: "#475569" },
  processed: { bg: "#FFFBEB", color: "#92400E" },
  paid:      { bg: "#ECFDF5", color: "#065F46" },
};

export default function CanadaPayroll() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear]   = useState(today.getFullYear());

  const [payroll, setPayroll]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState("records"); // records | calculator

  // Calculator state
  const [calcGross, setCalcGross] = useState("");
  const [calcProv, setCalcProv]   = useState("ON");
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [payRes, sumRes] = await Promise.all([
        getCanadaPayroll({ month, year }),
        getMonthlyPayrollSummary(month, year),
      ]);
      const pdata = Array.isArray(payRes.data) ? payRes.data : (payRes.data?.results ?? []);
      setPayroll(pdata);
      setSummary(sumRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const handleCalculate = async () => {
    if (!calcGross) return;
    setCalcLoading(true);
    setCalcResult(null);
    try {
      const res = await calculatePayroll({ gross_monthly: parseFloat(calcGross), province: calcProv });
      setCalcResult(res.data);
    } catch (err) {
      alert("Calculation failed: " + (err.response?.data?.error || err.message));
    } finally {
      setCalcLoading(false);
    }
  };

  const monthName = new Date(year, month - 1).toLocaleString("en-CA", { month: "long" });

  const inputStyle = {
    padding: "7px 10px", border: "0.5px solid #CBD5E1",
    borderRadius: 8, fontSize: 12.5, color: "#0F172A",
    background: "#fff", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#0F172A", margin: 0 }}>Payroll (CAD)</h1>
          <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
            Canadian payroll with CPP, EI, and income tax deductions
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={inputStyle}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i).toLocaleString("en-CA", { month: "long" })}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={inputStyle}>
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={load} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 12px", border: "0.5px solid #CBD5E1",
            borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 12.5, color: "#475569",
          }}>
            <FiRefreshCw style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16,
        borderBottom: "0.5px solid #E2E8F0", paddingBottom: 0 }}>
        {[["records","Payroll records"],["calculator","Tax calculator"]].map(([key, lbl]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              padding: "8px 16px", border: "none", background: "none",
              cursor: "pointer", fontSize: 13,
              color: activeTab === key ? "#1B4FD8" : "#64748B",
              borderBottom: activeTab === key ? "2px solid #1B4FD8" : "2px solid transparent",
              fontFamily: "inherit", fontWeight: activeTab === key ? 500 : 400,
              marginBottom: -1,
            }}>
            {lbl}
          </button>
        ))}
      </div>

      {activeTab === "records" && (
        <>
          {error && (
            <div style={{
              background: "#FEF2F2", border: "0.5px solid #FECACA",
              borderRadius: 8, padding: "10px 14px", marginBottom: 12,
              color: "#991B1B", fontSize: 12.5, display: "flex", gap: 8,
            }}>
              <FiAlertCircle /> {error}
            </div>
          )}

          {/* Summary cards */}
          {summary && (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12, marginBottom: 16,
            }}>
              {[
                { label: "Gross salaries", value: fmtCAD(summary.total_gross), color: "#0F172A" },
                { label: "Total deductions", value: fmtCAD(
                  (summary.total_cpp || 0) + (summary.total_ei || 0) +
                  (summary.total_fed || 0) + (summary.total_prov || 0)
                ), color: "#EF4444" },
                { label: "Net payout", value: fmtCAD(summary.total_net), color: "#10B981" },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "#fff", border: "0.5px solid #E2E8F0",
                  borderRadius: 12, padding: "14px 16px",
                }}>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6, fontWeight: 500 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 500, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Breakdown row */}
          {summary && (
            <div style={{
              background: "#fff", border: "0.5px solid #E2E8F0",
              borderRadius: 12, padding: "14px 16px", marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: "#0F172A" }}>
                Deduction breakdown — {monthName} {year}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { label: "CPP contributions", value: summary.total_cpp },
                  { label: "EI premiums",        value: summary.total_ei },
                  { label: "Federal tax",         value: summary.total_fed },
                  { label: "Provincial tax",      value: summary.total_prov },
                ].map((d) => (
                  <div key={d.label}>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 3 }}>{d.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "#0F172A" }}>{fmtCAD(d.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payroll records table */}
          <div style={{
            background: "#fff", border: "0.5px solid #E2E8F0",
            borderRadius: 12, overflow: "hidden",
          }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading payroll…</div>
            ) : payroll.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
                <FiDollarSign style={{ fontSize: 36, marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
                <div style={{ fontWeight: 500, color: "#64748B", marginBottom: 4 }}>No payroll records</div>
                <div style={{ fontSize: 12 }}>No payroll processed for {monthName} {year}</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead style={{ background: "#F8FAFC" }}>
                  <tr>
                    {["Employee","Gross","CPP","EI","Fed tax","Prov tax","Net pay","Status"].map((h) => (
                      <th key={h} style={{
                        textAlign: "right", padding: "10px 12px",
                        color: "#94A3B8", fontWeight: 500, fontSize: 11,
                        borderBottom: "0.5px solid #E2E8F0",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        ...(h === "Employee" ? { textAlign: "left" } : {}),
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payroll.map((p) => {
                    const s = STATUS_STYLE[p.status] || STATUS_STYLE.draft;
                    return (
                      <tr key={p.id}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "9px 12px", fontWeight: 500, color: "#0F172A" }}>
                          {p.employee_name}
                          <div style={{ fontSize: 10.5, color: "#94A3B8", fontWeight: 400 }}>{p.employee_id_str}</div>
                        </td>
                        {[p.gross_salary, p.cpp_employee, p.ei_employee,
                          p.federal_tax, p.provincial_tax, p.net_pay].map((v, i) => (
                          <td key={i} style={{ padding: "9px 12px", textAlign: "right", color: "#475569" }}>
                            {fmtCAD(v)}
                          </td>
                        ))}
                        <td style={{ padding: "9px 12px", textAlign: "right" }}>
                          <span style={{
                            background: s.bg, color: s.color,
                            padding: "2px 8px", borderRadius: 10,
                            fontSize: 10.5, fontWeight: 500, textTransform: "capitalize",
                          }}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === "calculator" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Input */}
          <div style={{
            background: "#fff", border: "0.5px solid #E2E8F0",
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A", marginBottom: 16 }}>
              Payroll deduction calculator
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#475569", fontWeight: 500 }}>
                Gross monthly salary (CAD)
              </label>
              <input
                type="number" min="0" step="100"
                value={calcGross}
                onChange={(e) => setCalcGross(e.target.value)}
                placeholder="e.g. 7083.33"
                style={{ ...inputStyle, width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#475569", fontWeight: 500 }}>
                Province
              </label>
              <select value={calcProv} onChange={(e) => setCalcProv(e.target.value)}
                style={{ ...inputStyle, width: "100%" }}>
                {PROVINCES.map(([v, l]) => <option key={v} value={v}>{l} ({v})</option>)}
              </select>
            </div>
            <button
              onClick={handleCalculate}
              disabled={!calcGross || calcLoading}
              style={{
                width: "100%", padding: "10px",
                border: "none", borderRadius: 8,
                background: !calcGross ? "#E2E8F0" : "#1B4FD8",
                color: !calcGross ? "#94A3B8" : "#fff",
                cursor: !calcGross ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 500,
              }}
            >
              {calcLoading ? "Calculating…" : "Calculate deductions"}
            </button>
            <div style={{ marginTop: 14, fontSize: 11, color: "#94A3B8" }}>
              Based on 2026 CRA rates: CPP 5.95%, EI 1.66%, federal brackets 15–33%
            </div>
          </div>

          {/* Result */}
          <div style={{
            background: "#fff", border: "0.5px solid #E2E8F0",
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A", marginBottom: 16 }}>
              Monthly breakdown
            </div>
            {!calcResult ? (
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                height: 200, color: "#94A3B8",
              }}>
                <FiDollarSign style={{ fontSize: 36, marginBottom: 8 }} />
                <div style={{ fontSize: 12.5 }}>Enter a salary amount to see the breakdown</div>
              </div>
            ) : (
              <div>
                {[
                  { label: "Gross salary", value: calcResult.gross_salary, bold: false, sep: true },
                  { label: "CPP (employee)", value: -calcResult.cpp_employee, color: "#EF4444" },
                  { label: "EI premium", value: -calcResult.ei_employee, color: "#EF4444" },
                  { label: "Federal income tax", value: -calcResult.federal_tax, color: "#EF4444" },
                  { label: "Provincial tax", value: -calcResult.provincial_tax, color: "#EF4444", sep: true },
                  { label: "Net monthly pay", value: calcResult.net_pay, bold: true, color: "#10B981" },
                ].map((row, i) => (
                  <div key={i}>
                    {row.sep && <div style={{ borderTop: "0.5px solid #F1F5F9", margin: "8px 0" }} />}
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "6px 0",
                      fontWeight: row.bold ? 600 : 400,
                      fontSize: row.bold ? 14 : 12.5,
                      color: row.color || "#0F172A",
                    }}>
                      <span style={{ color: row.bold ? "#0F172A" : (row.color ? row.color : "#64748B") }}>
                        {row.label}
                      </span>
                      <span>
                        {row.value < 0
                          ? `-${fmtCAD(Math.abs(row.value))}`
                          : fmtCAD(row.value)}
                      </span>
                    </div>
                  </div>
                ))}
                <div style={{
                  marginTop: 16, padding: "10px 12px",
                  background: "#F0FDF4", borderRadius: 8, border: "0.5px solid #BBF7D0",
                }}>
                  <div style={{ fontSize: 11, color: "#065F46", fontWeight: 500, marginBottom: 2 }}>
                    Annual net take-home
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#065F46" }}>
                    {fmtCAD((calcResult.net_pay || 0) * 12)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
