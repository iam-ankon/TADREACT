/**
 * SupplierCapacityReport.jsx
 *
 * Supplier Capacity vs Capacity Used Report:
 *   - Multi-select filters: Years, Customers, Suppliers
 *   - 3 rows per supplier: Qty (manual, supplier row), Capacity (auto
 *     from Orders, light green), Balance (light yellow)
 *   - Balance = Qty - Capacity; negative shown in red brackets
 *   - Summary/Total row at the bottom: sums every supplier per period
 *   - Grand Total column on the right
 *   - Preview / Excel Export / PDF Export / Print / Sync Snapshot
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getSupplierCapacityReport,
  getSupplierCapacityAvailableYears,
  downloadSupplierCapacityReportExcel,
  syncCapacitySnapshot,
  getSuppliers,
  getCustomers,
} from "../../api/merchandiser";
import CapacityMasterModal from "./CapacityMasterModal";
import Sidebar from "./Sidebar.jsx";

const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" }, { value: 4, label: "April" },
  { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" },
  { value: 9, label: "September" }, { value: 10, label: "October" },
  { value: 11, label: "November" }, { value: 12, label: "December" },
];

const fmt = (n) => {
  if (n === null || n === undefined) return "";
  return Math.round(n).toLocaleString("en-US");
};

/** Renders a numeric cell — negative shows red bracketed value. */
const NumCell = ({ value, bold }) => {
  if (value === null || value === undefined) {
    return <td style={{ padding: "6px 10px", textAlign: "right", color: "#cbd5e1" }}>—</td>;
  }
  const isNeg = value < 0;
  return (
    <td style={{
      padding: "6px 10px", textAlign: "right",
      color: isNeg ? "#dc2626" : "#1e293b",
      fontWeight: bold ? 700 : 400,
      fontVariantNumeric: "tabular-nums",
    }}>
      {isNeg ? `(${fmt(Math.abs(value))})` : fmt(value)}
    </td>
  );
};

/** Lightweight multi-select dropdown — checkbox list, no external deps. */
const MultiSelectDropdown = ({ label, options, selected, onChange, width = 200 }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const summaryText = () => {
    if (selected.length === 0) return `All ${label}`;
    if (selected.length === 1) {
      const opt = options.find((o) => String(o.value) === String(selected[0]));
      return opt ? opt.label : `1 selected`;
    }
    return `${selected.length} ${label} selected`;
  };

  return (
    <div ref={ref} style={{ position: "relative", width }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{
          width: "100%", padding: "7px 10px", borderRadius: 7,
          border: "1px solid #d1d5db", background: "#fff", fontSize: 13,
          textAlign: "left", cursor: "pointer", display: "flex",
          justifyContent: "space-between", alignItems: "center",
          color: selected.length ? "#1e293b" : "#94a3b8",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {summaryText()}
        </span>
        <span style={{ fontSize: 10, marginLeft: 6 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,.12)", minWidth: width,
          maxHeight: 260, overflowY: "auto", padding: 6,
        }}>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              style={{
                width: "100%", textAlign: "left", padding: "6px 8px",
                fontSize: 11, color: "#2563eb", background: "none",
                border: "none", cursor: "pointer", fontWeight: 600,
              }}
            >
              ✕ Clear selection
            </button>
          )}
          {options.length === 0 && (
            <div style={{ padding: "8px", fontSize: 12, color: "#94a3b8" }}>No options</div>
          )}
          {options.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 8px", fontSize: 13, cursor: "pointer",
                borderRadius: 6,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const SupplierCapacityReport = () => {
  const currentYear = new Date().getFullYear();

  // Filters — all multi-select now
  const [year, setYear] = useState(currentYear);
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(12);
  const [customerIds, setCustomerIds] = useState([]);
  const [supplierIds, setSupplierIds] = useState([]);

  // Dropdown data
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Report data
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [yearsLoadError, setYearsLoadError] = useState(null);

  const printRef = useRef(null);

  // Load dropdown options once — years come from real shipment data,
  // not a hardcoded "current year ± 1" window. Also fires the initial
  // report fetch once we know which year actually has data.
  //
  // Each request is isolated (not Promise.all) so a failure in one
  // (e.g. the years endpoint 404ing because it isn't deployed yet)
  // doesn't silently swallow the others or hide what actually failed.
  useEffect(() => {
    (async () => {
      try {
        const customersRes = await getCustomers(1, 200, true);
        setCustomers(customersRes.data || []);
      } catch (err) {
        console.error("Failed to load customers:", err);
      }

      try {
        const suppliersRes = await getSuppliers(1, 500, true);
        setSuppliers(suppliersRes.data || []);
      } catch (err) {
        console.error("Failed to load suppliers:", err);
      }

      let initialYear = currentYear;
      try {
        const yearsRes = await getSupplierCapacityAvailableYears();
        if (yearsRes.data?.error) {
          // Backend caught an internal error and reports it explicitly
          // (see supplier_capacity_available_years) instead of silently
          // degrading — surface it so it's obvious this isn't just "no
          // other years exist".
          setYearsLoadError(yearsRes.data.error);
        }
        const fetchedYears = yearsRes.data?.years || [];
        setAvailableYears(fetchedYears);

        // If the default-selected year (today's year) has no data at all,
        // switch to the most recent year that actually does, so the user
        // doesn't land on an empty report by default.
        if (fetchedYears.length > 0 && !fetchedYears.includes(currentYear)) {
          initialYear = Math.max(...fetchedYears);
          setYear(initialYear);
        }
      } catch (err) {
        console.error("Failed to load available years:", err);
        setYearsLoadError(
          err.response
            ? `HTTP ${err.response.status} from /reports/supplier-capacity/years/ — ${err.response.data?.detail || err.message}`
            : `Network error reaching /reports/supplier-capacity/years/ — ${err.message}`
        );
      }

      fetchReport({ year: initialYear });
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const buildFilters = useCallback((overrides = {}) => ({
    years: String(overrides.year ?? year),
    from_month: overrides.from_month ?? fromMonth,
    to_month: overrides.to_month ?? toMonth,
    customers: customerIds.join(","),
    suppliers: supplierIds.join(","),
  }), [year, fromMonth, toMonth, customerIds, supplierIds]);

  const fetchReport = useCallback(async (overrides = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSupplierCapacityReport(buildFilters(overrides));
      setReport(res.data);
    } catch (err) {
      console.error("Report fetch error:", err);
      setError(
        err.response?.data?.detail ||
        "Failed to generate report. Please check your filters and try again."
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [buildFilters]);

  const handleExcelExport = async () => {
    setExporting(true);
    try {
      await downloadSupplierCapacityReportExcel(buildFilters());
    } catch (err) {
      alert("Excel export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handlePdfExport = async () => {
    if (!report || report.rows.length === 0) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const monthLabels = report.meta.month_labels;

      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Supplier Capacity Utilization Report", 40, 40);
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.text(
        `Year: ${report.meta.years.join(", ")}  |  ${monthLabels[0]} - ${monthLabels[monthLabels.length - 1]}  |  Generated: ${new Date().toLocaleDateString("en-GB")}`,
        40, 58
      );

      const head = [["Supplier", ...monthLabels, "Grand Total"]];
      const body = [];
      const rowStyles = []; // track which body rows need special fill

      report.rows.forEach((row) => {
        body.push([row.supplier_name, ...row.qty.map(fmt), fmt(row.grand_total)]);
        rowStyles.push("qty");

        const capGT = row.capacity_grand_total ?? row.capacity.reduce((s, v) => s + (v || 0), 0);
        body.push(["Capacity", ...row.capacity.map((v) => (v === null ? "" : fmt(v))), fmt(capGT)]);
        rowStyles.push("capacity");

        const balGT = row.balance_grand_total ?? row.balance.reduce((s, v) => s + (v || 0), 0);
        body.push([
          "Balance",
          ...row.balance.map((v) => (v === null ? "" : v < 0 ? `(${fmt(Math.abs(v))})` : fmt(v))),
          balGT < 0 ? `(${fmt(Math.abs(balGT))})` : fmt(balGT),
        ]);
        rowStyles.push("balance");
      });

      // Summary / Total rows
      if (report.summary) {
        body.push(["", ...monthLabels.map(() => ""), ""]);
        rowStyles.push("spacer");

        body.push(["TOTAL (All Suppliers)", ...report.summary.qty.map(fmt), fmt(report.summary.grand_total)]);
        rowStyles.push("total");

        const capTotalGT = report.summary.capacity_grand_total
          ?? report.summary.capacity.reduce((s, v) => s + (v || 0), 0);
        body.push(["Capacity Total", ...report.summary.capacity.map(fmt), fmt(capTotalGT)]);
        rowStyles.push("total");

        const balTotalGT = report.summary.balance_grand_total
          ?? report.summary.balance.reduce((s, v) => s + (v || 0), 0);
        body.push([
          "Balance Total",
          ...report.summary.balance.map((v) => (v < 0 ? `(${fmt(Math.abs(v))})` : fmt(v))),
          balTotalGT < 0 ? `(${fmt(Math.abs(balTotalGT))})` : fmt(balTotalGT),
        ]);
        rowStyles.push("total");
      }

      autoTable(doc, {
        head,
        body,
        startY: 72,
        styles: { fontSize: 8, cellPadding: 4, halign: "right" },
        headStyles: { fillColor: [30, 58, 95], textColor: 255, halign: "center", fontStyle: "bold" },
        columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
        didParseCell: (data) => {
          if (data.section !== "body") return;
          const kind = rowStyles[data.row.index];
          if (kind === "capacity") {
            data.cell.styles.fillColor = [217, 242, 217]; // light green
          } else if (kind === "balance") {
            data.cell.styles.fillColor = [255, 246, 213]; // light yellow
            const raw = data.cell.raw;
            if (typeof raw === "string" && raw.startsWith("(")) {
              data.cell.styles.textColor = [204, 0, 0];
            }
          } else if (kind === "total") {
            data.cell.styles.fillColor = [214, 228, 240]; // light blue
            data.cell.styles.fontStyle = "bold";
            const raw = data.cell.raw;
            if (typeof raw === "string" && raw.startsWith("(")) {
              data.cell.styles.textColor = [204, 0, 0];
            }
          }
        },
      });

      doc.save(`Supplier_Capacity_Report_${report.meta.years.join("-")}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSyncSnapshot = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncCapacitySnapshot({
        year: year || currentYear,
        from_month: fromMonth,
        to_month: toMonth,
        supplier: supplierIds[0] || undefined,
      });
      setSyncStatus({ ok: true, msg: res.data.message });
    } catch (err) {
      setSyncStatus({
        ok: false,
        msg: err.response?.data?.detail || "Failed to save snapshot.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const monthLabels = report?.meta?.month_labels || [];
  const yearOptions = (() => {
    // Base on real years from the backend (shipment_date + manual Qty
    // entries). Always keep the currently-selected year visible too, even
    // if it somehow isn't in the fetched list yet, and fall back to the
    // current year alone if nothing has loaded.
    const base = new Set(availableYears.length ? availableYears : [currentYear]);
    base.add(year);
    return Array.from(base).sort((a, b) => b - a);
  })();
  const customerOptions = customers.map((c) => ({
    value: c.id,
    // CustomerSerializer's `customer_name` field is write_only (never
    // present on GET), so the actual display name comes back as
    // `hrms_customer_name`; `name` on the payload is just the raw HRMS
    // customer FK id, not a display string.
    label: c.hrms_customer_name || c.customer_name || `Customer ${c.id}`,
  }));
  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.supplier_name || s.name }));

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f0f2f5" }}>
      <div className="no-print">
        <Sidebar />
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
    <div style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #capacity-report-printable, #capacity-report-printable * { visibility: visible; }
          #capacity-report-printable {
            position: absolute; left: 0; top: 0; width: 100%;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="no-print" style={{ marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
          📊 Supplier Capacity Utilization Report
        </h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
          Compare each supplier's Qty against Capacity auto-calculated from Orders
        </p>
      </div>

      {/* Filters */}
      <div className="no-print" style={{
        background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
        padding: "18px 20px", marginBottom: 22,
      }}>
        {yearsLoadError && (
          <div style={{
            marginBottom: 14, padding: "10px 14px", borderRadius: 8,
            background: "#fef3c7", color: "#92400e", fontSize: 12, lineHeight: 1.5,
          }}>
            ⚠ Only {currentYear} is showing in the Year dropdown because the list of
            available years failed to load: <code style={{ background: "#fef9e7", padding: "1px 5px", borderRadius: 4 }}>{yearsLoadError}</code>
            <br />
            This is a backend/network issue, not a missing-data issue — please share this
            message so it can be fixed.
          </div>
        )}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={labelStyle}>Year</label>
            <select
              value={year}
              onChange={e => {
                const newYear = parseInt(e.target.value);
                setYear(newYear);
                fetchReport({ year: newYear });
              }}
              style={{ ...inputStyle, width: 100 }}
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>From Month</label>
            <select value={fromMonth} onChange={e => setFromMonth(parseInt(e.target.value))} style={inputStyle}>
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>To Month</label>
            <select value={toMonth} onChange={e => setToMonth(parseInt(e.target.value))} style={inputStyle}>
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Customer(s)</label>
            <MultiSelectDropdown
              label="customers"
              options={customerOptions}
              selected={customerIds}
              onChange={setCustomerIds}
              width={190}
            />
          </div>
          <div>
            <label style={labelStyle}>Supplier(s)</label>
            <MultiSelectDropdown
              label="suppliers"
              options={supplierOptions}
              selected={supplierIds}
              onChange={setSupplierIds}
              width={220}
            />
          </div>
          <button
            onClick={() => fetchReport()}
            disabled={loading}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none",
              background: "#2563eb", color: "#fff", fontWeight: 600, fontSize: 13,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Loading…" : "🔍 Preview"}
          </button>
          <button
            onClick={() => setShowCapacityModal(true)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db",
              background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}
          >
            📝 Manage Qty
          </button>
        </div>

        {/* Export actions */}
        {report && report.rows.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9", flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={handleExcelExport} disabled={exporting} style={exportBtnStyle("#16a34a")}>
              📗 Excel Export
            </button>
            <button onClick={handlePdfExport} disabled={exporting} style={exportBtnStyle("#dc2626")}>
              📕 PDF Export
            </button>
            <button onClick={handlePrint} style={exportBtnStyle("#475569")}>
              🖨️ Print
            </button>
            <button
              onClick={handleSyncSnapshot}
              disabled={syncing}
              style={exportBtnStyle("#7c3aed")}
              title="Save a snapshot of the calculated Capacity values into the database for admin visibility / historical record. The report already shows live, accurate numbers without this."
            >
              {syncing ? "Saving…" : "💾 Sync Capacity Snapshot"}
            </button>
            {syncStatus && (
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: syncStatus.ok ? "#16a34a" : "#dc2626",
              }}>
                {syncStatus.ok ? "✓" : "✗"} {syncStatus.msg}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="no-print" style={{ padding: "12px 16px", background: "#fee2e2", color: "#dc2626", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Report Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Loading report…</div>
      ) : !report || report.rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div>No data found for the selected filters.</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>
            Try a different date range, or add Qty via "📝 Manage Qty".
          </div>
        </div>
      ) : (
        <div id="capacity-report-printable" ref={printRef} style={{
          background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}>
          {/* Print-only title */}
          <div style={{ padding: "16px 20px 0" }}>
            <h2 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>
              Supplier Capacity Utilization Report
            </h2>
            <p style={{ margin: "2px 0 12px", fontSize: 12, color: "#64748b" }}>
              Year: {report.meta.years.join(", ")} &nbsp;|&nbsp; {monthLabels[0]} – {monthLabels[monthLabels.length - 1]}
              &nbsp;|&nbsp; Generated: {new Date(report.meta.generated_at).toLocaleDateString("en-GB")}
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ background: "#1e3a5f" }}>
                  <th style={thStyle}>Supplier</th>
                  {monthLabels.map(m => (
                    <th key={m} style={{ ...thStyle, textAlign: "right" }}>{m}<br />
                      <span style={{ fontWeight: 400, fontSize: 10, opacity: 0.8 }}>Qty</span>
                    </th>
                  ))}
                  <th style={{ ...thStyle, textAlign: "right", background: "#0f2744" }}>Grand Total<br />
                    <span style={{ fontWeight: 400, fontSize: 10, opacity: 0.8 }}>Qty</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <React.Fragment key={row.supplier_id}>
                    {/* Supplier / Qty row */}
                    <tr style={{ borderTop: "2px solid #e2e8f0" }}>
                      <td style={{ padding: "7px 12px", fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
                        {row.supplier_name} (Cpacity)
                      </td>
                      {row.qty.map((q, i) => <NumCell key={i} value={q} />)}
                      <NumCell value={row.grand_total} bold />
                    </tr>
                    {/* Capacity row — light green */}
                    <tr style={{ background: "#d9f2d9" }}>
                      <td style={{ padding: "5px 12px", fontWeight: 600, color: "#166534", fontSize: 12 }}>
                        Quantity (From Orders)
                      </td>
                      {row.capacity.map((c, i) => (
                        <td key={i} style={{ padding: "5px 10px", textAlign: "right", color: "#166534", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                          {c === null ? "" : fmt(c)}
                        </td>
                      ))}
                      <td style={{
                        background: "#d9f2d9", padding: "5px 10px", textAlign: "right",
                        color: "#166534", fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                      }}>
                        {fmt(row.capacity_grand_total ?? row.capacity.reduce((s, v) => s + (v || 0), 0))}
                      </td>
                    </tr>
                    {/* Balance row — light yellow */}
                    <tr style={{ background: "#fff6d5" }}>
                      <td style={{ padding: "5px 12px", fontWeight: 600, color: "#92700c", fontSize: 12 }}>
                        Balance
                      </td>
                      {row.balance.map((b, i) => (
                        <td
                          key={i}
                          style={{
                            padding: "5px 10px", textAlign: "right", fontSize: 12,
                            fontVariantNumeric: "tabular-nums",
                            color: b === null ? "#cbd5e1" : b < 0 ? "#dc2626" : "#92700c",
                            fontWeight: b !== null && b < 0 ? 700 : 500,
                          }}
                        >
                          {b === null ? "" : b < 0 ? `(${fmt(Math.abs(b))})` : fmt(b)}
                        </td>
                      ))}
                      {(() => {
                        const balGT = row.balance_grand_total ?? row.balance.reduce((s, v) => s + (v || 0), 0);
                        return (
                          <td style={{
                            background: "#fff6d5", padding: "5px 10px", textAlign: "right", fontSize: 12,
                            fontVariantNumeric: "tabular-nums", fontWeight: 700,
                            color: balGT < 0 ? "#dc2626" : "#92700c",
                          }}>
                            {balGT < 0 ? `(${fmt(Math.abs(balGT))})` : fmt(balGT)}
                          </td>
                        );
                      })()}
                    </tr>
                  </React.Fragment>
                ))}

                {/* Summary / Total row — sums every supplier per period */}
                {report.summary && (
                  <>
                    <tr><td colSpan={monthLabels.length + 2} style={{ padding: "6px 0" }} /></tr>
                    <tr style={{ background: "#d6e4f0", borderTop: "3px double #94a3b8" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 800, color: "#1e3a5f", fontSize: 13 }}>
                        TOTAL (All Suppliers)
                      </td>
                      {report.summary.qty.map((q, i) => (
                        <td key={i} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 800, color: "#1e3a5f", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                          {fmt(q)}
                        </td>
                      ))}
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 800, color: "#1e3a5f", fontSize: 13 }}>
                        {fmt(report.summary.grand_total)}
                      </td>
                    </tr>
                    <tr style={{ background: "#e3ecf5" }}>
                      <td style={{ padding: "6px 12px", fontWeight: 700, color: "#166534", fontSize: 12 }}>
                        Capacity Total
                      </td>
                      {report.summary.capacity.map((c, i) => (
                        <td key={i} style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#166534", fontSize: 12 }}>
                          {fmt(c)}
                        </td>
                      ))}
                      <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#166534", fontSize: 12 }}>
                        {fmt(report.summary.capacity_grand_total ?? report.summary.capacity.reduce((s, v) => s + (v || 0), 0))}
                      </td>
                    </tr>
                    <tr style={{ background: "#e3ecf5" }}>
                      <td style={{ padding: "6px 12px 10px", fontWeight: 700, color: "#92700c", fontSize: 12 }}>
                        Balance Total
                      </td>
                      {report.summary.balance.map((b, i) => (
                        <td key={i} style={{
                          padding: "6px 10px 10px", textAlign: "right", fontWeight: 700, fontSize: 12,
                          color: b < 0 ? "#dc2626" : "#92700c",
                        }}>
                          {b < 0 ? `(${fmt(Math.abs(b))})` : fmt(b)}
                        </td>
                      ))}
                      {(() => {
                        const balTotalGT = report.summary.balance_grand_total
                          ?? report.summary.balance.reduce((s, v) => s + (v || 0), 0);
                        return (
                          <td style={{
                            padding: "6px 10px 10px", textAlign: "right", fontWeight: 700, fontSize: 12,
                            color: balTotalGT < 0 ? "#dc2626" : "#92700c",
                          }}>
                            {balTotalGT < 0 ? `(${fmt(Math.abs(balTotalGT))})` : fmt(balTotalGT)}
                          </td>
                        );
                      })()}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Capacity Master modal */}
      {showCapacityModal && (
        <CapacityMasterModal
          suppliers={suppliers}
          defaultYear={year || currentYear}
          onClose={() => setShowCapacityModal(false)}
          onSaved={fetchReport}
        />
      )}
    </div>
      </div>
    </div>
  );
};

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 600, color: "#64748b",
  marginBottom: 4, textTransform: "uppercase", letterSpacing: ".3px",
};

const inputStyle = {
  padding: "7px 10px", borderRadius: 7, border: "1px solid #d1d5db",
  fontSize: 13, background: "#fff", outline: "none",
};

const thStyle = {
  padding: "9px 12px", color: "#fff", fontSize: 12, fontWeight: 700,
  textAlign: "left", whiteSpace: "nowrap",
};

const exportBtnStyle = (color) => ({
  padding: "7px 14px", borderRadius: 7, border: `1px solid ${color}33`,
  background: `${color}11`, color, fontWeight: 600, fontSize: 12, cursor: "pointer",
});

export default SupplierCapacityReport;
