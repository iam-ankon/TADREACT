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
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronDown,
  FiDownload,
  FiEdit3,
  FiFileText,
  FiInbox,
  FiPrinter,
  FiRefreshCw,
  FiSave,
} from "react-icons/fi";
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
const MultiSelectDropdown = ({ label, options, selected, onChange, width }) => {
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
    <div ref={ref} style={{ position: "relative", width: width || "100%" }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`sc-ms-btn ${selected.length ? "" : "empty"}`}
        aria-expanded={open}
      >
        <span>{summaryText()}</span>
        <FiChevronDown style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div className="sc-ms-menu">
          {selected.length > 0 && (
            <button type="button" className="sc-ms-clear" onClick={() => onChange([])}>
              Clear selection
            </button>
          )}
          {options.length === 0 && <div className="sc-ms-none">No options</div>}
          {options.map((opt) => (
            <label key={opt.value}>
              <input type="checkbox" checked={selected.includes(opt.value)} onChange={() => toggle(opt.value)} />
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
        body.push([`${row.supplier_name} - Capacity`, ...row.qty.map(fmt), fmt(row.grand_total)]);
        rowStyles.push("qty");

        const capGT = row.capacity_grand_total ?? row.capacity.reduce((s, v) => s + (v || 0), 0);
        body.push(["Booked (orders)", ...row.capacity.map((v) => (v === null ? "" : fmt(v))), fmt(capGT)]);
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

        body.push(["TOTAL capacity (all suppliers)", ...report.summary.qty.map(fmt), fmt(report.summary.grand_total)]);
        rowStyles.push("total");

        const capTotalGT = report.summary.capacity_grand_total
          ?? report.summary.capacity.reduce((s, v) => s + (v || 0), 0);
        body.push(["Booked total", ...report.summary.capacity.map(fmt), fmt(capTotalGT)]);
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

  // Per-supplier utilisation = booked (orders) / planned capacity, over the
  // selected months. null when no capacity has been entered.
  const rows = report?.rows || [];
  const sumArr = (a) => (a || []).reduce((s, v) => s + (v || 0), 0);
  const rowStats = rows.map((row) => {
    const cap = row.grand_total || 0;
    const booked = row.capacity_grand_total ?? sumArr(row.capacity);
    const balance = row.balance_grand_total ?? sumArr(row.balance);
    const overMonths = (row.balance || []).filter((b) => b !== null && b < 0).length;
    return { cap, booked, balance, overMonths, util: cap > 0 ? (booked / cap) * 100 : null };
  });
  const withCap = rowStats.filter((r) => r.cap > 0);
  const kpi = {
    capacity: sumArr(withCap.map((r) => r.cap)),
    bookedWithCap: sumArr(withCap.map((r) => r.booked)),
    bookedAll: report?.summary ? (report.summary.capacity_grand_total ?? sumArr(report.summary.capacity)) : 0,
    balance: sumArr(withCap.map((r) => r.balance)),
    over: rowStats.filter((r) => r.overMonths > 0).length,
    noCap: rowStats.filter((r) => r.cap === 0).length,
  };
  kpi.util = kpi.capacity > 0 ? (kpi.bookedWithCap / kpi.capacity) * 100 : null;

  const utilStatus = (s) => {
    if (s.util === null) return { cls: "none", label: "No capacity set" };
    const pct = `${s.util.toFixed(0)}% used`;
    if (s.util > 100) return { cls: "over", label: `${pct} · Over capacity` };
    if (s.overMonths > 0) return { cls: "over", label: `${pct} · Over in ${s.overMonths} month${s.overMonths > 1 ? "s" : ""}` };
    if (s.util >= 85) return { cls: "near", label: `${pct} · Near full` };
    return { cls: "ok", label: `${pct} · On track` };
  };

  const signed = (v) => (v === null || v === undefined ? "" : v < 0 ? `(${fmt(Math.abs(v))})` : fmt(v));
  const periodLabel = monthLabels.length ? `${monthLabels[0]} – ${monthLabels[monthLabels.length - 1]} ${year}` : `${year}`;

  return (
    <div className="sc-shell">
      <style>{CAPACITY_CSS}</style>
      <div className="no-print">
        <Sidebar />
      </div>
      <div className="sc-app">
        <header className="sc-header no-print">
          <div>
            <div className="sc-eyebrow">Merchandising · Reports</div>
            <h1 className="sc-title">Supplier capacity utilization</h1>
            <p className="sc-subtitle">Planned monthly capacity vs. quantity booked through orders, per supplier.</p>
          </div>
          <div className="sc-actions">
            <button type="button" className="sc-btn ghost" onClick={() => setShowCapacityModal(true)}>
              <FiEdit3 /> Manage capacity
            </button>
            {report && rows.length > 0 && (
              <>
                <button type="button" className="sc-btn ghost" onClick={handleExcelExport} disabled={exporting}>
                  <FiDownload /> Excel
                </button>
                <button type="button" className="sc-btn ghost" onClick={handlePdfExport} disabled={exporting}>
                  <FiFileText /> PDF
                </button>
                <button type="button" className="sc-btn ghost icon" onClick={handlePrint} title="Print">
                  <FiPrinter />
                </button>
              </>
            )}
          </div>
        </header>

        <div className="sc-body">
          {/* ── Filters ── */}
          <section className="sc-card sc-filters no-print">
            {yearsLoadError && (
              <div className="sc-alert warn">
                <FiAlertTriangle />
                <span>
                  The list of years couldn't load, so only {currentYear} is offered. Details: <code>{yearsLoadError}</code>
                </span>
              </div>
            )}
            <div className="sc-filter-row">
              <div className="sc-field" style={{ flexBasis: 110 }}>
                <label htmlFor="sc-year">Year</label>
                <select
                  id="sc-year"
                  value={year}
                  onChange={(e) => {
                    const newYear = parseInt(e.target.value);
                    setYear(newYear);
                    fetchReport({ year: newYear });
                  }}
                >
                  {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="sc-field">
                <label htmlFor="sc-from">From</label>
                <select id="sc-from" value={fromMonth} onChange={(e) => setFromMonth(parseInt(e.target.value))}>
                  {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="sc-field">
                <label htmlFor="sc-to">To</label>
                <select id="sc-to" value={toMonth} onChange={(e) => setToMonth(parseInt(e.target.value))}>
                  {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="sc-field wide">
                <label>Customers</label>
                <MultiSelectDropdown label="customers" options={customerOptions} selected={customerIds} onChange={setCustomerIds} />
              </div>
              <div className="sc-field wide">
                <label>Suppliers</label>
                <MultiSelectDropdown label="suppliers" options={supplierOptions} selected={supplierIds} onChange={setSupplierIds} />
              </div>
              <button type="button" className="sc-btn primary" onClick={() => fetchReport()} disabled={loading}>
                <FiRefreshCw className={loading ? "spin" : ""} /> {loading ? "Loading…" : "Apply"}
              </button>
            </div>
          </section>

          {error && (
            <div className="sc-alert err no-print">
              <FiAlertTriangle />
              <span>{error}</span>
            </div>
          )}

          {/* ── KPIs ── */}
          {report && rows.length > 0 && (
            <div className="sc-kpis no-print">
              <div className="sc-card sc-kpi">
                <span className="sc-kpi-label">Planned capacity</span>
                <span className="sc-kpi-value">{fmt(kpi.capacity)}</span>
                <span className="sc-kpi-foot">{withCap.length} of {rows.length} suppliers have capacity set</span>
              </div>
              <div className="sc-card sc-kpi">
                <span className="sc-kpi-label">Booked (orders)</span>
                <span className="sc-kpi-value">{fmt(kpi.bookedAll)}</span>
                <span className="sc-kpi-foot">{fmt(kpi.bookedWithCap)} at suppliers with capacity</span>
              </div>
              <div className="sc-card sc-kpi">
                <span className="sc-kpi-label">Balance</span>
                <span className={`sc-kpi-value ${kpi.balance < 0 ? "neg" : ""}`}>{signed(kpi.balance)}</span>
                <span className="sc-kpi-foot">Capacity still free</span>
              </div>
              <div className="sc-card sc-kpi">
                <span className="sc-kpi-label">Utilization</span>
                <span className="sc-kpi-value">{kpi.util === null ? "—" : `${kpi.util.toFixed(1)}%`}</span>
                <div className="sc-meter">
                  <span className={kpi.util > 100 ? "over" : kpi.util >= 85 ? "near" : ""} style={{ width: `${Math.min(100, kpi.util || 0)}%` }} />
                </div>
              </div>
              <div className="sc-card sc-kpi">
                <span className="sc-kpi-label">Over capacity</span>
                <span className={`sc-kpi-value ${kpi.over ? "neg" : ""}`}>{kpi.over}</span>
                <span className="sc-kpi-foot">
                  supplier{kpi.over === 1 ? "" : "s"} with a negative month · {kpi.noCap} without capacity
                </span>
              </div>
            </div>
          )}

          {/* ── Report ── */}
          {loading && !report ? (
            <div className="sc-card sc-empty">Loading report…</div>
          ) : !report || rows.length === 0 ? (
            <div className="sc-card sc-empty">
              <FiInbox />
              <b>No data for these filters</b>
              <span>Try a different period, or set supplier capacity with “Manage capacity”.</span>
            </div>
          ) : (
            <section id="capacity-report-printable" ref={printRef} className={`sc-card sc-report ${loading ? "is-loading" : ""}`}>
              <div className="sc-report-head">
                <div>
                  <h2 className="sc-report-title">Supplier Capacity Utilization Report</h2>
                  <p className="sc-report-sub">
                    {periodLabel} · {rows.length} suppliers · Generated {new Date(report.meta.generated_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div className="sc-legend no-print">
                  <span><i className="sw cap" /> Capacity</span>
                  <span><i className="sw booked" /> Booked (orders)</span>
                  <span><i className="sw bal" /> Balance</span>
                  <span className="sc-neg">(123) = over capacity</span>
                </div>
              </div>

              <div className="sc-table-wrap">
                <table className="sc-table">
                  <thead>
                    <tr>
                      <th className="sticky">Supplier</th>
                      {monthLabels.map((m) => <th key={m} className="num">{m}</th>)}
                      <th className="num total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const st = rowStats[idx];
                      const status = utilStatus(st);
                      const noCap = st.cap === 0;
                      return (
                        <React.Fragment key={row.supplier_id}>
                          <tr className="r-cap">
                            <td className="sticky">
                              <div className="sc-sup-name">{row.supplier_name}</div>
                              <div className="sc-sup">
                                <span className="sc-rowlabel">Capacity</span>
                                <span className={`sc-tag ${status.cls}`}>{status.label}</span>
                              </div>
                            </td>
                            {row.qty.map((q, i) => (
                              <td key={i} className="num">{q === null || q === undefined ? <span className="faint">—</span> : fmt(q)}</td>
                            ))}
                            <td className="num total">{noCap ? <span className="faint">—</span> : fmt(st.cap)}</td>
                          </tr>
                          <tr className="r-booked">
                            <td className="sticky"><div className="sc-rowlabel">Booked (orders)</div></td>
                            {row.capacity.map((c, i) => (
                              <td key={i} className="num">{c === null ? "" : c === 0 ? <span className="faint">0</span> : fmt(c)}</td>
                            ))}
                            <td className="num total">{fmt(st.booked)}</td>
                          </tr>
                          <tr className="r-bal">
                            <td className="sticky"><div className="sc-rowlabel">Balance</div></td>
                            {row.balance.map((b, i) => (
                              <td key={i} className={`num ${b !== null && b < 0 ? "sc-neg" : ""}`}>
                                {b === null ? <span className="faint">—</span> : signed(b)}
                              </td>
                            ))}
                            <td className={`num total ${st.balance < 0 ? "sc-neg" : ""}`}>{noCap ? <span className="faint">—</span> : signed(st.balance)}</td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  {report.summary && (
                    <tfoot>
                      <tr className="t-cap">
                        <td className="sticky">
                          <div className="sc-sup-name">All suppliers</div>
                          <div className="sc-rowlabel">Capacity</div>
                        </td>
                        {report.summary.qty.map((q, i) => <td key={i} className="num">{fmt(q)}</td>)}
                        <td className="num total">{fmt(report.summary.grand_total)}</td>
                      </tr>
                      <tr>
                        <td className="sticky"><div className="sc-rowlabel">Booked (orders)</div></td>
                        {report.summary.capacity.map((c, i) => <td key={i} className="num">{fmt(c)}</td>)}
                        <td className="num total">{fmt(kpi.bookedAll)}</td>
                      </tr>
                      <tr>
                        <td className="sticky"><div className="sc-rowlabel">Balance</div></td>
                        {report.summary.balance.map((b, i) => (
                          <td key={i} className={`num ${b < 0 ? "sc-neg" : ""}`}>{signed(b)}</td>
                        ))}
                        {(() => {
                          const gt = report.summary.balance_grand_total ?? sumArr(report.summary.balance);
                          return <td className={`num total ${gt < 0 ? "sc-neg" : ""}`}>{signed(gt)}</td>;
                        })()}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <div className="sc-report-foot no-print">
                <span>
                  Utilization = booked ÷ capacity over the selected months. Suppliers without capacity show bookings only.
                </span>
                <button
                  type="button"
                  className="sc-link"
                  onClick={handleSyncSnapshot}
                  disabled={syncing}
                  title="Save a snapshot of the calculated booked quantities for historical record. The report itself is always live."
                >
                  <FiSave /> {syncing ? "Saving snapshot…" : "Save snapshot"}
                </button>
                {syncStatus && (
                  <span className={syncStatus.ok ? "sc-ok" : "sc-neg"}>
                    {syncStatus.ok ? <FiCheckCircle /> : <FiAlertTriangle />} {syncStatus.msg}
                  </span>
                )}
              </div>
            </section>
          )}
        </div>

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
  );
};

const CAPACITY_CSS = `
.sc-shell { display: flex; height: 100vh; background: #f3f5f9; }
.sc-app {
  --c-border: #e6eaf0; --c-border-strong: #d5dbe4; --c-text: #0f172a; --c-text-2: #334155; --c-muted: #64748b; --c-faint: #94a3b8;
  flex: 1; min-width: 0; overflow: auto; background: #f3f5f9; color: var(--c-text);
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; font-size: 14px;
}
.sc-app *, .sc-app *::before, .sc-app *::after { box-sizing: border-box; }
.sc-app button:focus-visible, .sc-app select:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.sc-header {
  position: sticky; top: 0; left: 0; z-index: 30; display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  padding: 18px 28px 16px; background: rgba(255,255,255,.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--c-border);
}
.sc-eyebrow { font-size: 11.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #2563eb; margin-bottom: 4px; }
.sc-title { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
.sc-subtitle { margin: 4px 0 0; color: var(--c-muted); font-size: 13.5px; }
.sc-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.sc-body { padding: 22px 28px 36px; display: flex; flex-direction: column; gap: 18px; min-width: 0; }

.sc-btn { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 14px; border-radius: 10px; font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap; border: 1px solid transparent; transition: background .15s, border-color .15s; }
.sc-btn:disabled { opacity: .55; cursor: not-allowed; }
.sc-btn.primary { background: #2563eb; color: #fff; box-shadow: 0 1px 2px rgba(37,99,235,.25); align-self: flex-end; }
.sc-btn.primary:hover:not(:disabled) { background: #1d4ed8; }
.sc-btn.ghost { background: #fff; color: var(--c-text-2); border-color: var(--c-border-strong); }
.sc-btn.ghost:hover:not(:disabled) { background: #f8fafc; }
.sc-btn.icon { width: 38px; padding: 0; justify-content: center; }
.sc-link { display: inline-flex; align-items: center; gap: 6px; border: none; background: none; padding: 0; font: inherit; font-size: 12.5px; font-weight: 600; color: #2563eb; cursor: pointer; }
.sc-link:disabled { opacity: .6; cursor: wait; }
.spin { animation: sc-spin .8s linear infinite; }
@keyframes sc-spin { to { transform: rotate(360deg); } }

.sc-card { background: #fff; border: 1px solid var(--c-border); border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); min-width: 0; }
.sc-filters { padding: 14px 18px; }
.sc-filter-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
.sc-field { display: flex; flex-direction: column; gap: 5px; flex: 0 1 150px; min-width: 110px; }
.sc-field.wide { flex: 1 1 200px; max-width: 280px; }
.sc-field label { font-size: 11px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: var(--c-muted); }
.sc-field select { height: 38px; padding: 0 10px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: #fff; font: inherit; font-size: 13.5px; color: var(--c-text); outline: none; }
.sc-field select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.sc-ms-btn { width: 100%; height: 38px; padding: 0 10px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: #fff; font: inherit; font-size: 13.5px; display: flex; align-items: center; justify-content: space-between; gap: 6px; cursor: pointer; color: var(--c-text); }
.sc-ms-btn.empty { color: var(--c-muted); }
.sc-ms-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sc-ms-menu { position: absolute; top: calc(100% + 6px); left: 0; z-index: 50; min-width: 100%; width: max-content; max-width: 360px; max-height: 300px; overflow-y: auto; background: #fff; border: 1px solid var(--c-border); border-radius: 12px; box-shadow: 0 16px 32px -12px rgba(15,23,42,.3); padding: 6px; }
.sc-ms-menu label { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; font-size: 13px; color: var(--c-text-2); cursor: pointer; text-transform: none; letter-spacing: 0; font-weight: 450; }
.sc-ms-menu label:hover { background: #f8fafc; }
.sc-ms-clear { display: block; width: 100%; text-align: left; padding: 6px 8px; border: none; background: none; font: inherit; font-size: 12px; font-weight: 600; color: #2563eb; cursor: pointer; }
.sc-ms-none { padding: 8px; font-size: 12.5px; color: var(--c-faint); }

.sc-alert { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 10px; font-size: 13px; border: 1px solid; margin-bottom: 12px; }
.sc-alert svg { flex-shrink: 0; margin-top: 2px; }
.sc-alert code { background: rgba(255,255,255,.6); padding: 1px 5px; border-radius: 4px; font-size: 12px; }
.sc-alert.warn { background: #fefce8; border-color: #fde68a; color: #854d0e; }
.sc-alert.err { background: #fef2f2; border-color: #fecaca; color: #b91c1c; margin-bottom: 0; }

.sc-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
.sc-kpi { padding: 16px 18px; display: flex; flex-direction: column; gap: 8px; }
.sc-kpi-label { font-size: 12.5px; font-weight: 600; color: var(--c-muted); }
.sc-kpi-value { font-size: 26px; font-weight: 700; letter-spacing: -.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }
.sc-kpi-value.neg { color: #b91c1c; }
.sc-kpi-foot { font-size: 12.5px; color: var(--c-muted); }
.sc-meter { height: 6px; border-radius: 999px; background: #eef1f5; overflow: hidden; }
.sc-meter.sm { height: 5px; width: 64px; }
.sc-meter > span { display: block; height: 100%; border-radius: 999px; background: #0ca30c; }
.sc-meter > span.near { background: #fab219; }
.sc-meter > span.over { background: #d03b3b; }

.sc-report { overflow: hidden; }
.sc-report.is-loading { opacity: .6; }
.sc-report-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; padding: 14px 18px; border-bottom: 1px solid var(--c-border); }
.sc-report-title { margin: 0; font-size: 14.5px; font-weight: 650; }
.sc-report-sub { margin: 2px 0 0; font-size: 12.5px; color: var(--c-muted); }
.sc-legend { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; color: var(--c-text-2); align-items: center; }
.sc-legend span { display: inline-flex; align-items: center; gap: 6px; }
.sc-legend .sw { width: 10px; height: 10px; border-radius: 3px; display: inline-block; border: 1px solid var(--c-border-strong); }
.sc-legend .sw.cap { background: #fff; }
.sc-legend .sw.booked { background: #f1f5ff; }
.sc-legend .sw.bal { background: #f8fafc; }

.sc-table-wrap { overflow: auto; max-height: calc(100vh - 220px); }
.sc-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
.sc-table th { position: sticky; top: 0; z-index: 2; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid var(--c-border); font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--c-muted); white-space: nowrap; text-align: left; }
.sc-table th.sticky { left: 0; z-index: 3; }
.sc-table td { padding: 5px 12px; white-space: nowrap; color: var(--c-text-2); font-variant-numeric: tabular-nums; background: #fff; }
.sc-table td.sticky { position: sticky; left: 0; z-index: 1; min-width: 230px; max-width: 280px; border-right: 1px solid var(--c-border); white-space: normal; }
.sc-table .num { text-align: right; }
.sc-table .total { font-weight: 650; color: var(--c-text); background: #f8fafc; border-left: 1px solid var(--c-border); }
.sc-table th.total { color: var(--c-text-2); }
.sc-table td.util { vertical-align: middle; border-left: 1px solid var(--c-border); background: #fff; border-bottom: 1px solid var(--c-border-strong); }
.sc-table tr.r-cap td { padding-top: 10px; color: var(--c-text); font-weight: 600; }
.sc-table tr.r-booked td { background: #f6f8ff; }
.sc-table tr.r-booked td.total { background: #eef2fd; }
.sc-table tr.r-bal td { border-bottom: 1px solid var(--c-border-strong); padding-bottom: 8px; }
.sc-table tr.r-bal td.total { background: #f8fafc; }
.sc-table tbody tr:hover td:not(.util) { background-color: #fbfcff; }
.sc-sup { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 2px; }
.sc-sup-name { font-weight: 650; color: var(--c-text); font-size: 13.5px; }
.sc-rowlabel { font-size: 12px; font-weight: 500; color: var(--c-muted); }
.sc-tag { font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 999px; border: 1px solid; white-space: nowrap; }
.sc-tag.ok { color: #15803d; background: #f0fdf4; border-color: #bbf7d0; }
.sc-tag.near { color: #a16207; background: #fefce8; border-color: #fde68a; }
.sc-tag.over { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
.sc-tag.none { color: var(--c-muted); background: #f8fafc; border-color: var(--c-border); }
.sc-util { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
.sc-util b { font-size: 14px; color: var(--c-text); }
.sc-table tfoot td { background: #f1f5f9; font-weight: 650; color: var(--c-text); border-top: 0; }
.sc-table tfoot tr.t-cap td { border-top: 2px solid var(--c-border-strong); padding-top: 10px; }
.sc-table tfoot tr:last-child td { padding-bottom: 10px; }
.sc-table tfoot td.total, .sc-table tfoot td.util { background: #e9eef5; }
.faint { color: #cbd5e1; font-weight: 400; }
.sc-neg { color: #b91c1c !important; font-weight: 650; }
.sc-ok { color: #15803d; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
.sc-report-foot { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 12px 18px; border-top: 1px solid var(--c-border); font-size: 12.5px; color: var(--c-muted); }
.sc-report-foot > span:first-child { flex: 1; min-width: 260px; }
.sc-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px 20px; color: var(--c-muted); text-align: center; }
.sc-empty svg { font-size: 28px; color: var(--c-faint); }
.sc-empty b { color: var(--c-text-2); }

@media print {
  body * { visibility: hidden; }
  #capacity-report-printable, #capacity-report-printable * { visibility: visible; }
  #capacity-report-printable { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; }
  .no-print { display: none !important; }
  .sc-table-wrap { max-height: none; overflow: visible; }
  .sc-table th, .sc-table td.sticky { position: static; }
}
`;

export default SupplierCapacityReport;
