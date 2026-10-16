/**
 * ShipmentHistory.jsx — "Month wise Shipment History" (MD's sheet):
 * qty / value per supplier → department → shipment month, with supplier and
 * grand totals. Backed by GET reports/shipment-history/?start=YYYY-MM&end=YYYY-MM
 * → { rows, capacity: {supplier_id: {"YYYY-MM": qty}} }.
 *
 * Capacity = the supplier's monthly Qty from Supplier Capacity → "Manage capacity";
 * Balance = capacity − shipment qty of that month (negative = over capacity).
 */
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiTruck, FiDownload, FiRefreshCw, FiSearch, FiBarChart2 } from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import { MultiSelectDropdown, MS_CSS } from "./SupplierCapacityReport.jsx";
import { getShipmentHistory } from "../../api/merchandiser";

const C = { page: "#eef2f6", border: "#e3e8ef", ink: "#0f2433", muted: "#7b8a99", hero: "#0d2b3e", total: "#f3f6f9", cap: "#f2f8f5", bad: "#b42318", good: "#0b7a4b" };
const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STORAGE_KEY = "shipmentHistory.filters.v1";

const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (m) => `${MONTHS[Number(m.slice(5)) - 1]}'${m.slice(2, 4)}`;
const monthsBetween = (start, end) => {
  const out = [];
  for (let d = new Date(`${start}-01T00:00:00`); ym(d) <= end; d.setMonth(d.getMonth() + 1)) out.push(ym(d));
  return out;
};
const qty = (n) => (n ? Math.round(n).toLocaleString("en-US") : "—");
const usd = (n) => (n ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—");
const millions = (n, money) => `${money ? "$" : ""}${(n / 1e6).toFixed(1)} M`;
const loadSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
};

const ShipmentHistory = () => {
  const now = new Date();
  const saved = useMemo(loadSaved, []);
  const [start, setStart] = useState(saved.start || ym(now));
  const [end, setEnd] = useState(saved.end || ym(new Date(now.getFullYear(), now.getMonth() + 6, 1)));
  const [supplierSel, setSupplierSel] = useState(saved.suppliers || []);
  const [deptSel, setDeptSel] = useState(saved.departments || []);
  const [capacityOnly, setCapacityOnly] = useState(!!saved.capacityOnly);
  const [search, setSearch] = useState("");
  const [data, setData] = useState({ rows: [], capacity: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ start, end, suppliers: supplierSel, departments: deptSel, capacityOnly }));
    } catch {
      /* storage unavailable */
    }
  }, [start, end, supplierSel, deptSel, capacityOnly]);

  const load = () => {
    setLoading(true);
    setError("");
    getShipmentHistory({ start, end })
      // Older API returned a plain list (no capacity).
      .then((r) => setData(Array.isArray(r.data) ? { rows: r.data, capacity: {} } : r.data))
      .catch((e) => setError(e?.response?.data?.detail || e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [start, end]);

  const months = useMemo(() => (start <= end ? monthsBetween(start, end) : []), [start, end]);
  const { rows, capacity } = data;

  const supplierOptions = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => m.set(r.supplier, r.supplier));
    return [...m.keys()].sort().map((n) => ({ value: n, label: n }));
  }, [rows]);
  const deptOptions = useMemo(
    () => [...new Set(rows.map((r) => r.department))].sort().map((n) => ({ value: n, label: n })),
    [rows],
  );

  // supplier → department → month → {qty, value}
  const suppliers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map();
    rows.forEach((r) => {
      if (supplierSel.length && !supplierSel.includes(r.supplier)) return;
      if (deptSel.length && !deptSel.includes(r.department)) return;
      if (capacityOnly && !capacity[r.supplier_id]) return;
      if (q && !`${r.supplier} ${r.department}`.toLowerCase().includes(q)) return;
      if (!map.has(r.supplier)) map.set(r.supplier, { id: r.supplier_id, depts: new Map() });
      const depts = map.get(r.supplier).depts;
      if (!depts.has(r.department)) depts.set(r.department, {});
      depts.get(r.department)[r.month] = { qty: r.qty, value: r.value };
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
      .map(([name, s]) => ({ name, id: s.id, cap: capacity[s.id] || null, depts: [...s.depts.entries()].sort(([a], [b]) => a.localeCompare(b)) }));
  }, [rows, capacity, search, supplierSel, deptSel, capacityOnly]);

  const sum = (cellsList, m) => cellsList.reduce((t, cells) => ({
    qty: t.qty + (cells[m]?.qty || 0), value: t.value + (cells[m]?.value || 0),
  }), { qty: 0, value: 0 });
  const rowTotal = (cells) => months.reduce((t, m) => ({ qty: t.qty + (cells[m]?.qty || 0), value: t.value + (cells[m]?.value || 0) }), { qty: 0, value: 0 });
  const supplierTotals = (s) => Object.fromEntries(months.map((m) => [m, sum(s.depts.map(([, c]) => c), m)]));
  const capTotal = (cap) => months.reduce((t, m) => t + (cap?.[m] || 0), 0);

  const allCells = suppliers.flatMap((s) => s.depts.map(([, cells]) => cells));
  const grand = Object.fromEntries(months.map((m) => [m, sum(allCells, m)]));
  const grandTotal = rowTotal(grand);
  // Capacity / balance only over suppliers that have capacity set.
  const withCap = suppliers.filter((s) => s.cap);
  const grandCap = Object.fromEntries(months.map((m) => [m, withCap.reduce((t, s) => t + (s.cap[m] || 0), 0)]));
  const grandBooked = Object.fromEntries(months.map((m) => [m, withCap.reduce((t, s) => t + sum(s.depts.map(([, c]) => c), m).qty, 0)]));
  const grandCapTotal = capTotal(grandCap);
  const grandBookedTotal = months.reduce((t, m) => t + grandBooked[m], 0);
  const used = grandCapTotal ? Math.round((grandBookedTotal / grandCapTotal) * 100) : null;
  const filtered = supplierSel.length || deptSel.length || capacityOnly || search.trim();

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const line = (a, b, cells) => [a, b, ...months.flatMap((m) => [cells[m]?.qty || 0, cells[m]?.value || 0]),
      rowTotal(cells).qty, rowTotal(cells).value];
    const qtyLine = (b, byMonth) => ["", b, ...months.flatMap((m) => [byMonth[m] ?? "", ""]), months.reduce((t, m) => t + (byMonth[m] || 0), 0), ""];
    const aoa = [
      ["Month wise Shipment History"],
      [`Date : ${now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`],
      ["Supplier", "Department", ...months.flatMap((m) => [monthLabel(m), ""]), "Total", ""],
      ["", "", ...months.flatMap(() => ["Qty", "Value"]), "Qty", "Value"],
    ];
    suppliers.forEach((s) => {
      s.depts.forEach(([d, cells], i) => aoa.push(line(i ? "" : s.name, d, cells)));
      const st = supplierTotals(s);
      aoa.push(line("", "Total=", st));
      if (s.cap) {
        aoa.push(qtyLine("Capacity", Object.fromEntries(months.map((m) => [m, s.cap[m] || 0]))));
        aoa.push(qtyLine("Balance", Object.fromEntries(months.map((m) => [m, (s.cap[m] || 0) - st[m].qty]))));
      }
    });
    aoa.push(line("", "Grand Total", grand));
    if (withCap.length) {
      aoa.push(qtyLine("Total capacity", grandCap));
      aoa.push(qtyLine("Total balance", Object.fromEntries(months.map((m) => [m, grandCap[m] - grandBooked[m]]))));
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!merges"] = months.map((_, i) => ({ s: { r: 2, c: 2 + i * 2 }, e: { r: 2, c: 3 + i * 2 } }))
      .concat([{ s: { r: 2, c: 2 + months.length * 2 }, e: { r: 2, c: 3 + months.length * 2 } }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shipment History");
    XLSX.writeFile(wb, `Shipment_History_${start}_to_${end}.xlsx`);
  };

  // m = first (Qty) cell of a month group → draws the month divider.
  const cell = (v, style, m) => <td className={m ? "r mcol" : "r"} style={style}>{v}</td>;
  const valueCells = (cells, bold) => [
    ...months.flatMap((m) => [
      <React.Fragment key={`${m}q`}>{cell(qty(cells[m]?.qty), bold ? { fontWeight: 700 } : undefined, true)}</React.Fragment>,
      <React.Fragment key={`${m}v`}>{cell(usd(cells[m]?.value), bold ? { fontWeight: 700 } : undefined)}</React.Fragment>,
    ]),
    <React.Fragment key="tq">{cell(qty(rowTotal(cells).qty), { fontWeight: 700 }, true)}</React.Fragment>,
    <React.Fragment key="tv">{cell(usd(rowTotal(cells).value), { fontWeight: 700 })}</React.Fragment>,
  ];
  // Qty-only row (capacity / balance): value columns left empty.
  const qtyCells = (byMonth, signed) => {
    const total = months.reduce((t, m) => t + (byMonth[m] || 0), 0);
    const fmt = (n) => (signed ? (n < 0 ? `−${qty(-n)}` : n ? qty(n) : "0") : qty(n));
    const color = (n) => (signed ? { color: n < 0 ? C.bad : C.good, fontWeight: 600 } : undefined);
    return [
      ...months.flatMap((m) => [
        <React.Fragment key={`${m}q`}>{cell(fmt(byMonth[m] || 0), color(byMonth[m] || 0), true)}</React.Fragment>,
        <td key={`${m}v`} />,
      ]),
      <React.Fragment key="tq">{cell(fmt(total), { ...color(total), fontWeight: 700 }, true)}</React.Fragment>,
      <td key="tv" />,
    ];
  };
  const colSpan = months.length * 2 + 4;

  return (
    <div style={{ display: "flex", height: "100vh", background: C.page }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: "auto" }}>
        <div id="sh-root" style={{ fontFamily: FONT, padding: "24px 28px 60px" }}>
          <style>{`
            ${MS_CSS}
            #sh-root .sh-btn { display:inline-flex; align-items:center; gap:6px; height:36px; padding:0 14px; border-radius:9px;
              border:1px solid ${C.border}; background:#fff; color:${C.ink}; font-size:13px; font-weight:600; cursor:pointer; text-decoration:none; }
            #sh-root .sh-btn:disabled { opacity:.5; cursor:not-allowed; }
            #sh-root .sh-input { height:38px; padding:0 10px; border:1px solid #d5dbe4; border-radius:10px; font-size:13px; background:#fff; box-sizing:border-box; }
            #sh-root .sh-label { display:block; font-size:11px; font-weight:700; color:#4a5b6b; margin-bottom:5px; text-transform:uppercase; letter-spacing:.04em; }
            #sh-root table { border-collapse:separate; border-spacing:0; font-size:12.5px; width:100%; }
            #sh-root th { position:sticky; top:0; background:#e9eef4; color:#4a5b6b; font-size:11px; text-transform:uppercase;
              padding:8px; border-bottom:1px solid ${C.border}; white-space:nowrap; z-index:2; }
            #sh-root thead tr:nth-child(2) th { top:33px; }
            #sh-root td { padding:6px 8px; border-bottom:1px solid #edf1f5; white-space:nowrap; color:${C.ink}; }
            #sh-root .r { text-align:right; }
            #sh-root .sub td { background:${C.total}; }
            #sh-root .cap td { background:${C.cap}; font-size:12px; }
            #sh-root .grand td { background:${C.hero}; color:#fff; font-weight:700; }
            #sh-root .grand-cap td { background:#16405a; color:#fff; }
            #sh-root .mcol { border-left:2px solid #b8c4d1; }
            #sh-root .grand .mcol, #sh-root .grand-cap .mcol { border-left-color:rgba(255,255,255,.3); }
            #sh-root .kpi { background:#fff; border:1px solid ${C.border}; border-radius:12px; padding:12px 14px; flex:1; min-width:160px; }
            #sh-root .kpi b { display:block; font-size:20px; color:${C.ink}; margin-top:2px; }
            #sh-root .kpi span { font-size:11px; font-weight:700; color:${C.muted}; text-transform:uppercase; letter-spacing:.04em; }
            #sh-root .chip { display:inline-block; margin-top:4px; padding:2px 8px; border-radius:999px; font-size:10.5px; font-weight:700; }
          `}</style>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap", paddingLeft: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: C.hero, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FiTruck size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: C.ink }}>Month wise Shipment History</h1>
                <div style={{ fontSize: 13, color: C.muted }}>Order qty & value per shipment month, with each supplier's capacity and balance</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link className="sh-btn" to="/merchandiser/supplier-capacity-report"><FiBarChart2 size={14} /> Supplier capacity</Link>
              <button className="sh-btn" onClick={load} disabled={loading}><FiRefreshCw size={14} /> Refresh</button>
              <button className="sh-btn" onClick={exportExcel} disabled={!suppliers.length}><FiDownload size={14} /> Excel</button>
            </div>
          </div>

          {/* Filters (remembered on this browser) */}
          <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14, display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
            <div><span className="sh-label">From</span><input type="month" className="sh-input" value={start} max={end} onChange={(e) => e.target.value && setStart(e.target.value)} /></div>
            <div><span className="sh-label">To</span><input type="month" className="sh-input" value={end} min={start} onChange={(e) => e.target.value && setEnd(e.target.value)} /></div>
            <div style={{ width: 240 }}>
              <span className="sh-label">Suppliers</span>
              <MultiSelectDropdown label="suppliers" options={supplierOptions} selected={supplierSel} onChange={setSupplierSel} />
            </div>
            <div style={{ width: 200 }}>
              <span className="sh-label">Departments</span>
              <MultiSelectDropdown label="departments" options={deptOptions} selected={deptSel} onChange={setDeptSel} />
            </div>
            <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
              <span className="sh-label">Search</span>
              <FiSearch size={14} style={{ position: "absolute", left: 10, top: 33, color: C.muted }} />
              <input className="sh-input" style={{ width: "100%", paddingLeft: 30 }} placeholder="Supplier or department"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.ink, paddingBottom: 10, cursor: "pointer", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={capacityOnly} onChange={(e) => setCapacityOnly(e.target.checked)} /> Only suppliers with capacity
            </label>
            {filtered && (
              <button className="sh-btn" style={{ height: 38 }}
                onClick={() => { setSupplierSel([]); setDeptSel([]); setCapacityOnly(false); setSearch(""); }}>
                Clear
              </button>
            )}
          </div>

          {/* Summary */}
          <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <div className="kpi"><span>Shipment qty</span><b>{millions(grandTotal.qty)} pcs</b></div>
            <div className="kpi"><span>Shipment value</span><b>{millions(grandTotal.value, true)}</b></div>
            <div className="kpi"><span>Capacity</span><b>{grandCapTotal ? `${millions(grandCapTotal)} pcs` : "—"}</b>
              <div style={{ fontSize: 11.5, color: C.muted }}>{withCap.length} of {suppliers.length} suppliers have capacity set</div></div>
            <div className="kpi"><span>Balance</span>
              <b style={{ color: grandCapTotal - grandBookedTotal < 0 ? C.bad : C.good }}>{grandCapTotal ? `${millions(grandCapTotal - grandBookedTotal)} pcs` : "—"}</b>
              {used !== null && <div style={{ fontSize: 11.5, color: C.muted }}>{used}% of capacity used</div>}</div>
          </div>

          {error && <div style={{ color: C.bad, marginBottom: 10 }}>{error}</div>}
          <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, overflow: "auto", maxHeight: "calc(100vh - 230px)" }}>
            <table>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ textAlign: "left" }}>Supplier</th>
                  <th rowSpan={2} style={{ textAlign: "left" }}>Department</th>
                  {months.map((m) => <th key={m} colSpan={2} className="mcol">{monthLabel(m)}</th>)}
                  <th colSpan={2} className="mcol">Total</th>
                </tr>
                <tr>
                  {[...months, "t"].flatMap((m) => [<th key={`${m}q`} className="r mcol">Qty</th>, <th key={`${m}v`} className="r">Value</th>])}
                </tr>
              </thead>
              <tbody>
                {loading && !rows.length && <tr><td colSpan={colSpan} style={{ textAlign: "center", color: C.muted, padding: 24 }}>Loading…</td></tr>}
                {!loading && !suppliers.length && <tr><td colSpan={colSpan} style={{ textAlign: "center", color: C.muted, padding: 24 }}>No shipments for this selection.</td></tr>}
                {suppliers.map((s) => {
                  const st = supplierTotals(s);
                  const capRows = s.cap ? 2 : 0;
                  const cap = s.cap ? Object.fromEntries(months.map((m) => [m, s.cap[m] || 0])) : null;
                  const bal = cap ? Object.fromEntries(months.map((m) => [m, cap[m] - st[m].qty])) : null;
                  const capSum = cap ? capTotal(cap) : 0;
                  const pct = capSum ? Math.round((rowTotal(st).qty / capSum) * 100) : null;
                  const over = bal && months.some((m) => bal[m] < 0);
                  return (
                    <React.Fragment key={s.name}>
                      {s.depts.map(([d, cells], i) => (
                        <tr key={d}>
                          {i === 0 && (
                            <td rowSpan={s.depts.length + 1 + capRows} style={{ fontWeight: 700, verticalAlign: "top" }}>
                              {s.name}
                              <div>
                                {pct === null ? (
                                  <span className="chip" style={{ background: "#eef2f6", color: C.muted }}>No capacity set</span>
                                ) : (
                                  <span className="chip" style={{ background: over ? "#fde7e7" : "#e6f6ee", color: over ? C.bad : C.good }}>
                                    {pct}% used{over ? " · over in some months" : ""}
                                  </span>
                                )}
                              </div>
                            </td>
                          )}
                          <td>{d}</td>
                          {valueCells(cells)}
                        </tr>
                      ))}
                      <tr className="sub"><td style={{ fontWeight: 700 }}>Total</td>{valueCells(st, true)}</tr>
                      {cap && <tr className="cap"><td style={{ fontWeight: 600 }}>Capacity</td>{qtyCells(cap)}</tr>}
                      {bal && <tr className="cap"><td style={{ fontWeight: 600 }}>Balance</td>{qtyCells(bal, true)}</tr>}
                    </React.Fragment>
                  );
                })}
                {suppliers.length > 0 && (
                  <tr className="grand"><td colSpan={2}>Grand Total</td>{valueCells(grand, true)}</tr>
                )}
                {withCap.length > 0 && (
                  <>
                    <tr className="grand-cap"><td colSpan={2}>Total capacity ({withCap.length} suppliers)</td>{qtyCells(grandCap)}</tr>
                    <tr className="grand-cap"><td colSpan={2}>Total balance</td>
                      {qtyCells(Object.fromEntries(months.map((m) => [m, grandCap[m] - grandBooked[m]])), true)}</tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentHistory;
