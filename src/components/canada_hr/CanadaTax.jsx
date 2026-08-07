import React, { useState } from "react";
import { FiPercent } from "react-icons/fi";
import { calculateTax } from "../../api/canadaApi";

const PROVINCES = [
  ["ON","Ontario"],["BC","British Columbia"],["AB","Alberta"],["QC","Quebec"],
  ["MB","Manitoba"],["SK","Saskatchewan"],["NS","Nova Scotia"],
  ["NB","New Brunswick"],["NL","Newfoundland"],["PE","PEI"],
  ["NT","Northwest Territories"],["NU","Nunavut"],["YT","Yukon"],
];

const BRACKETS = [
  { income: "Up to $57,375",            rate: "15%" },
  { income: "$57,375 – $114,750",       rate: "20.5%" },
  { income: "$114,750 – $158,519",      rate: "26%" },
  { income: "$158,519 – $220,000",      rate: "29%" },
  { income: "Over $220,000",            rate: "33%" },
];

const fmtCAD = (v) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(v || 0);
const fmt2 = (v) => (v != null ? Number(v).toFixed(2) : "—");

export default function CanadaTax() {
  const [annual, setAnnual] = useState("");
  const [province, setProvince] = useState("ON");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    padding: "8px 12px", border: "0.5px solid #CBD5E1",
    borderRadius: 8, fontSize: 13, color: "#0F172A", background: "#fff",
    outline: "none", boxSizing: "border-box",
  };

  const handleCalc = async () => {
    if (!annual) return;
    setLoading(true); setResult(null);
    try {
      const res = await calculateTax(parseFloat(annual), province);
      setResult(res.data);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "#0F172A", margin: 0 }}>Canadian tax calculator</h1>
        <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
          2026 CRA rates: CPP, EI, federal and provincial income tax
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Input */}
        <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A", marginBottom: 16 }}>Employee details</div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#475569", fontWeight: 500 }}>Annual salary (CAD) *</label>
            <input type="number" min="0" step="1000" value={annual}
              onChange={(e) => setAnnual(e.target.value)}
              placeholder="e.g. 85000" style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#475569", fontWeight: 500 }}>Province of employment</label>
            <select value={province} onChange={(e) => setProvince(e.target.value)}
              style={{ ...inputStyle, width: "100%" }}>
              {PROVINCES.map(([v, l]) => <option key={v} value={v}>{l} ({v})</option>)}
            </select>
          </div>
          <button onClick={handleCalc} disabled={!annual || loading}
            style={{
              width: "100%", padding: 10, border: "none", borderRadius: 8,
              background: !annual ? "#E2E8F0" : "#1B4FD8",
              color: !annual ? "#94A3B8" : "#fff",
              cursor: !annual ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 500,
            }}>
            {loading ? "Calculating…" : "Calculate taxes"}
          </button>

          {/* Federal brackets */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#0F172A", marginBottom: 8 }}>
              Federal tax brackets (2026)
            </div>
            {BRACKETS.map((b) => (
              <div key={b.income} style={{
                display: "flex", justifyContent: "space-between",
                padding: "5px 0", borderBottom: "0.5px solid #F1F5F9",
                fontSize: 12,
              }}>
                <span style={{ color: "#64748B" }}>{b.income}</span>
                <span style={{ fontWeight: 500, color: "#1B4FD8" }}>{b.rate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Result */}
        <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A", marginBottom: 16 }}>Tax breakdown</div>
          {!result ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 260, color: "#94A3B8" }}>
              <FiPercent style={{ fontSize: 40, marginBottom: 10 }} />
              <div style={{ fontSize: 13 }}>Enter salary to compute taxes</div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>Gross annual</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{fmtCAD(result.annual_salary)}</div>
                </div>
                <div style={{ background: "#F0FDF4", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "#065F46", marginBottom: 4 }}>Net annual</div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: "#10B981" }}>{fmtCAD(result.net_annual)}</div>
                </div>
              </div>

              {[
                { label: "CPP contribution", value: result.cpp_contribution, color: "#EF4444" },
                { label: "EI premium", value: result.ei_premium, color: "#EF4444" },
                { label: "Federal income tax", value: result.federal_income_tax, color: "#EF4444" },
                { label: "Provincial tax", value: result.provincial_tax, color: "#EF4444" },
                { label: "Total deductions", value: result.total_deductions, color: "#EF4444", bold: true },
              ].map((r) => (
                <div key={r.label} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "6px 0", borderBottom: "0.5px solid #F1F5F9",
                  fontWeight: r.bold ? 600 : 400, fontSize: 12.5,
                }}>
                  <span style={{ color: "#64748B" }}>{r.label}</span>
                  <span style={{ color: r.color }}>{fmtCAD(r.value)}</span>
                </div>
              ))}

              <div style={{
                marginTop: 14, padding: "12px 14px", background: "#EEF2FF",
                borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "#1E40AF", marginBottom: 3 }}>Effective tax rate</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "#1B4FD8" }}>{fmt2(result.effective_rate_pct)}%</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#1E40AF", marginBottom: 3 }}>Monthly net</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#1B4FD8" }}>{fmtCAD(result.monthly_net)}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
