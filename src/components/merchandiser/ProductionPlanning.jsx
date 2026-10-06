/**
 * ProductionPlanning.jsx — back-calculated sewing schedule + line occupancy.
 *
 * Backed by merchandiser/production_planning.py:
 *   production-plans/            list (?stage=&supplier=&period=upcoming|all&search=) / PATCH / DELETE
 *   production-plans/bulk-create  add orders to a stage
 *   production-plans/copy-stage   copy a stage's plans into another stage
 *   production-lines/            line master per supplier (+ /availability/)
 *
 * All dates are computed on the server from the order's qty + shipment date:
 *   start = shipment − planning days − 5, finish = start + planning days,
 *   handover = finish + 1, fabric in-house = start − 7.
 * Manufacturer plans run forward from a manual start date instead
 * (handover = start + planning days + 1, DELAY when handover > shipment).
 * The Compare tab (production-plans/compare/) shows Manufacturer − Buying House.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import {
  FiLayers, FiRefreshCw, FiDownload, FiPlus, FiTrash2, FiSearch, FiSettings, FiX, FiCopy,
  FiAlertTriangle, FiCheckCircle, FiGrid, FiBarChart2, FiImage, FiChevronDown, FiChevronRight,
} from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import {
  getProductionPlans, updateProductionPlan, deleteProductionPlan, bulkCreateProductionPlans,
  copyProductionPlanStage, getProductionPlanOrderOptions, getProductionPlanSuppliers, getProductionPlanCompare,
  getProductionLines, getProductionLineAvailability, createProductionLine, updateProductionLine,
  deleteProductionLine,
} from "../../api/merchandiser";

/* ─────────────────────────────── design tokens ─────────────────────────── */

const C = {
  page: "#eef2f6",
  surface: "#ffffff",
  border: "#e3e8ef",
  ink: "#0f2433",
  ink2: "#4a5b6b",
  muted: "#7b8a99",
  hero: "#0d2b3e",
  primary: "#2a78d6",
  calc: "#f6f8fb",
};
const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const STAGES = [
  { value: "buying_house", label: "Buying House" },
  { value: "manufacturer", label: "Manufacturer" },
];

const STATUS_STYLE = {
  OK: ["#e6f6ee", "#0b7a4b"],
  CLASH: ["#fde7e7", "#b42318"],
  "CHECK LINE COUNT": ["#fff4e0", "#8a5a00"],
  "ASSIGN LINE": ["#eef2f6", "#4a5b6b"],
  INCOMPLETE: ["#f1f1ef", "#52514e"],
  AVAILABLE: ["#e6f6ee", "#0b7a4b"],
  BOOKED: ["#e8f1fc", "#1c5cab"],
  SLACK: ["#e6f6ee", "#0b7a4b"],
  DELAY: ["#fde7e7", "#b42318"],
  "SET START": ["#fff4e0", "#8a5a00"],
  "SCHEDULE APPROVED": ["#e6f6ee", "#0b7a4b"],
  "CRITICAL: RE-ASSIGN MORE LINES": ["#fde7e7", "#b42318"],
  "AWAITING MANUFACTURER PLAN": ["#eef2f6", "#4a5b6b"],
};
const FORWARD_STAGES = ["manufacturer"];

const STORAGE_KEY = "productionPlanning.v1";
const loadSaved = () => {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
};
const saveState = (patch) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadSaved(), ...patch }));
  } catch {
    /* storage unavailable */
  }
};

/* ─────────────────────────────── helpers ───────────────────────────────── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const parseDate = (s) => (s ? new Date(`${s}T00:00:00`) : null);
const fmtDate = (s) => {
  const d = parseDate(s);
  return d ? `${String(d.getDate()).padStart(2, "0")}-${MONTHS[d.getMonth()]}-${String(d.getFullYear()).slice(2)}` : "—";
};
const fmtInt = (n) => (n === null || n === undefined || n === "" ? "—" : Math.round(n).toLocaleString("en-US"));
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);
const imgUrl = (p) => (p ? (p.startsWith("/media/") ? p : `/media/${p}`) : null);
const errText = (e) => {
  const d = e?.response?.data;
  if (!d) return e?.message || "Request failed";
  if (typeof d === "string") return d.slice(0, 200);
  if (d.detail) return d.detail;
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`).join("; ");
};

const StatusChip = ({ status, title }) => {
  const [bg, fg] = STATUS_STYLE[status] || STATUS_STYLE.INCOMPLETE;
  return (
    <span title={title} style={{
      display: "inline-block", padding: "3px 9px", borderRadius: 999, background: bg, color: fg,
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", letterSpacing: ".02em",
    }}>{status}</span>
  );
};

/** Date shown as 27-Oct-26 like the other dates; click opens the browser's calendar and saves the pick. */
const DateCell = ({ value, onSave }) => (
  <label className="pp-date-cell" onClick={(e) => e.currentTarget.querySelector("input").showPicker?.()}>
    {value ? fmtDate(value) : <span style={{ color: C.muted }}>Set date</span>}
    <input type="date" value={value || ""} tabIndex={-1}
      onChange={(e) => e.target.value !== (value || "") && onSave(e.target.value || null)} />
  </label>
);

/** Number/date/text input that saves on blur or Enter (only when changed). */
const CellInput = ({ value, onSave, type = "number", width = 64, placeholder, min = 0, disabled }) => {
  const [v, setV] = useState(value ?? "");
  useEffect(() => setV(value ?? ""), [value]);
  const commit = () => {
    if (String(v) === String(value ?? "")) return;
    onSave(v === "" ? null : type === "number" ? Number(v) : v);
  };
  return (
    <input
      className="pp-cell-input" type={type} value={v} min={type === "number" ? min : undefined}
      placeholder={placeholder} disabled={disabled} style={{ width }}
      onChange={(e) => setV(e.target.value)} onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") { setV(value ?? ""); }
      }}
    />
  );
};

/* ───────────────────────── line picker (per row) ───────────────────────── */

const LinePicker = ({ row, lines, availability, onSave, onManage }) => {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(row.lines);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  useEffect(() => setSel(row.lines), [row.lines]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    // Popup is position:fixed (the grid scrolls and would clip it), so close it when the page scrolls.
    const onScroll = (e) => { if (!e.target.closest?.(".pp-pop")) setOpen(false); };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);
  const openPicker = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const below = window.innerHeight - r.bottom > 300;
    setPos({ left: Math.min(r.left, window.innerWidth - 350), ...(below ? { top: r.bottom + 4 } : { bottom: window.innerHeight - r.top + 4 }) });
    setOpen((o) => !o);
  };

  const options = lines.filter((l) => l.supplier === row.supplier && (l.is_active || row.lines.includes(l.id)));
  const avail = Object.fromEntries(availability.map((a) => [a.line_id, a]));
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const changed = [...sel].sort().join() !== [...row.lines].sort().join();
  const bookingsOf = (id) => (row.line_bookings || {})[id] || [];
  // A selection may not contain any line another order holds in this window.
  const clashingSelected = options.filter((l) => sel.includes(l.id) && bookingsOf(l.id).length);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="pp-lines-btn" onClick={openPicker} title="Assign lines">
        {row.line_names.length ? row.line_names.join(", ") : <span style={{ color: C.muted }}>Assign…</span>}
      </button>
      {open && (
        <div className="pp-pop" style={pos}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
            Lines — {row.supplier_name || "no supplier"}
          </div>
          {options.length === 0 && (
            <div style={{ fontSize: 12.5, color: C.ink2, padding: "6px 0" }}>
              No lines set up for this supplier.
            </div>
          )}
          {!row.production_start_date && options.length > 0 && (
            <div style={{ fontSize: 11.5, color: "#8a5a00", marginBottom: 4 }}>
              No production window yet (fill qty / output / dates) — bookings can't be checked.
            </div>
          )}
          {options.map((l) => {
            // Other orders using this line during THIS order's start..handover window.
            const bookings = bookingsOf(l.id);
            const assigned = row.lines.includes(l.id);
            // BOOKED / CLASH lines can't be ticked; an already-assigned clashing line can only be unticked.
            const locked = bookings.length > 0 && !sel.includes(l.id);
            const bookedText = bookings.map((b) => `${b.order_no} ${fmtDate(b.start).slice(0, 6)}→${fmtDate(b.handover).slice(0, 6)}`).join(", ");
            return (
              <label key={l.id} className={`pp-pop-row${locked ? " locked" : ""}`}
                title={bookings.length ? `Can't select: booked during this order's window by ${bookedText}` : undefined}>
                <input type="checkbox" checked={sel.includes(l.id)} disabled={locked} onChange={() => toggle(l.id)} />
                <span style={{ fontWeight: 700, minWidth: 54 }}>{l.name}</span>
                <span style={{ color: C.muted, fontSize: 11.5, flex: 1 }}>
                  {l.product_type === "knit" ? "Knit" : "Woven"}{l.daily_output ? ` · ${fmtInt(l.daily_output)}/day` : ""}
                </span>
                {bookings.length ? (
                  <span style={{ textAlign: "right", lineHeight: 1.25 }}>
                    <StatusChip status={assigned ? "CLASH" : "BOOKED"} />
                    <span style={{ display: "block", fontSize: 10.5, color: assigned ? "#b42318" : "#1c5cab", marginTop: 2 }}>{bookedText}</span>
                  </span>
                ) : (
                  <StatusChip status="AVAILABLE" />
                )}
              </label>
            );
          })}
          {clashingSelected.length > 0 && (
            <div style={{ fontSize: 11.5, color: "#b42318", marginTop: 6 }}>
              Untick {clashingSelected.map((l) => l.name).join(", ")} — it clashes with another order — to save.
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginTop: 8 }}>
            <button className="pp-btn sm" onClick={() => { setOpen(false); onManage(row.supplier); }}>
              <FiSettings size={12} /> Lines
            </button>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="pp-btn sm" onClick={() => { setSel(row.lines); setOpen(false); }}>Cancel</button>
              <button className="pp-btn sm primary" disabled={!changed || clashingSelected.length > 0}
                onClick={() => { onSave(sel); setOpen(false); }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────── modals ────────────────────────────────── */

const Modal = ({ title, onClose, children, width = 760 }) => (
  <div className="pp-modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="pp-modal" style={{ width }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.ink }}>{title}</h3>
        <button className="pp-icon-btn" onClick={onClose} aria-label="Close"><FiX size={15} /></button>
      </div>
      {children}
    </div>
  </div>
);

/** Searchable supplier dropdown (type to filter). Clearing it = all suppliers / none. */
const SupplierSelect = ({ suppliers, value, onChange, allowAll, style, onlyWithLines }) => {
  const options = onlyWithLines ? suppliers.filter((s) => s.has_lines) : suppliers;
  return (
    <Autocomplete
      size="small"
      options={options}
      value={options.find((s) => s.id === value) || null}
      getOptionLabel={(o) => o.supplier_name || ""}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      onChange={(_, v) => onChange(v ? v.id : null)}
      noOptionsText="No supplier found"
      renderOption={(props, o) => {
        const { key, ...rest } = props;
        return (
          <li key={key} {...rest} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
            <span>{o.supplier_name}</span>
            {!o.has_lines && <span style={{ fontSize: 11, color: C.muted }}>no lines</span>}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField {...params} placeholder={allowAll ? "All suppliers · type to search" : "Search supplier…"} />
      )}
      style={style}
      sx={{
        minWidth: 220,
        "& .MuiOutlinedInput-root": { borderRadius: "8px", background: "#fff", fontSize: 13, minHeight: 38 },
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cfd8e2" },
      }}
    />
  );
};

const EMPTY_LINE = { name: "", product_type: "woven", machines: "", daily_output: "", notes: "" };

const ManageLinesModal = ({ suppliers, initialSupplier, onClose, onChanged }) => {
  const [supplier, setSupplier] = useState(initialSupplier || null);
  const [lines, setLines] = useState([]);
  const [draft, setDraft] = useState(EMPTY_LINE);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supplier) { setLines([]); return; }
    const r = await getProductionLines({ supplier });
    setLines(r.data);
  }, [supplier]);
  useEffect(() => { load().catch((e) => setErr(errText(e))); }, [load]);

  const run = async (fn) => {
    setBusy(true); setErr("");
    try {
      await fn();
      await load();
      onChanged();
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };
  const clean = (o) => ({
    ...o,
    machines: o.machines === "" ? null : o.machines,
    daily_output: o.daily_output === "" ? null : o.daily_output,
  });

  return (
    <Modal title="Production lines" onClose={onClose} width={860}>
      <div style={{ fontSize: 12.5, color: C.ink2, marginBottom: 12 }}>
        Each line is a sewing setup in the supplier's factory. Woven lines usually run 45–52 machines, knit lines 22–25.
        Output/day pre-fills "Per line output" when orders are added.
      </div>
      <div style={{ marginBottom: 12, maxWidth: 360 }}>
        <SupplierSelect suppliers={suppliers} value={supplier} onChange={setSupplier} />
      </div>
      {err && <div className="pp-err">{err}</div>}
      {supplier && (
        <table className="pp-table" style={{ minWidth: 0 }}>
          <thead>
            <tr><th>Line</th><th>Type</th><th>Machines</th><th>Output / day</th><th>Notes</th><th>Active</th><th /></tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td><CellInput type="text" width={80} value={l.name} onSave={(v) => run(() => updateProductionLine(l.id, { name: v || "" }))} /></td>
                <td>
                  <select className="pp-cell-input" value={l.product_type} style={{ width: 84 }}
                    onChange={(e) => run(() => updateProductionLine(l.id, { product_type: e.target.value }))}>
                    <option value="woven">Woven</option><option value="knit">Knit</option>
                  </select>
                </td>
                <td>
                  <CellInput value={l.machines} width={70} onSave={(v) => run(() => updateProductionLine(l.id, { machines: v }))} />
                  {l.machine_warning && <div title={l.machine_warning} style={{ color: "#8a5a00", fontSize: 11 }}><FiAlertTriangle size={11} /> range</div>}
                </td>
                <td><CellInput value={l.daily_output} width={80} onSave={(v) => run(() => updateProductionLine(l.id, { daily_output: v }))} /></td>
                <td><CellInput type="text" width={180} value={l.notes} onSave={(v) => run(() => updateProductionLine(l.id, { notes: v || "" }))} /></td>
                <td><input type="checkbox" checked={l.is_active} onChange={(e) => run(() => updateProductionLine(l.id, { is_active: e.target.checked }))} /></td>
                <td>
                  <button className="pp-icon-btn danger" title="Delete line" disabled={busy}
                    onClick={() => run(() => deleteProductionLine(l.id))}><FiTrash2 size={13} /></button>
                </td>
              </tr>
            ))}
            <tr style={{ background: C.calc }}>
              <td><input className="pp-cell-input" style={{ width: 80 }} placeholder="e.g. A" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></td>
              <td>
                <select className="pp-cell-input" style={{ width: 84 }} value={draft.product_type} onChange={(e) => setDraft({ ...draft, product_type: e.target.value })}>
                  <option value="woven">Woven</option><option value="knit">Knit</option>
                </select>
              </td>
              <td><input className="pp-cell-input" type="number" min={0} style={{ width: 70 }} placeholder={draft.product_type === "knit" ? "22-25" : "45-52"} value={draft.machines} onChange={(e) => setDraft({ ...draft, machines: e.target.value })} /></td>
              <td><input className="pp-cell-input" type="number" min={0} style={{ width: 80 }} value={draft.daily_output} onChange={(e) => setDraft({ ...draft, daily_output: e.target.value })} /></td>
              <td><input className="pp-cell-input" style={{ width: 180 }} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></td>
              <td colSpan={2}>
                <button className="pp-btn sm primary" disabled={busy || !draft.name.trim()}
                  onClick={() => run(async () => { await createProductionLine(clean({ ...draft, supplier })); setDraft(EMPTY_LINE); })}>
                  <FiPlus size={12} /> Add
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </Modal>
  );
};

const AddOrdersModal = ({ stage, suppliers, lines, initialSupplier, onClose, onAdded }) => {
  const [supplier, setSupplier] = useState(initialSupplier || null);
  const [search, setSearch] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [options, setOptions] = useState([]);
  const [picked, setPicked] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [defaults, setDefaults] = useState({ per_line_output: "", weekend_days: 4, allowance_days: 5 });

  useEffect(() => {
    if (!supplier && !search.trim()) { setOptions([]); return undefined; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await getProductionPlanOrderOptions({ stage, supplier: supplier || undefined, search: search.trim() || undefined, all: showPast ? 1 : undefined });
        setOptions(r.data);
      } catch (e) {
        setErr(errText(e));
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [stage, supplier, search, showPast]);

  // Pre-fill per-line output from the supplier's line setup (average output/day).
  useEffect(() => {
    const outs = lines.filter((l) => l.supplier === supplier && l.is_active && l.daily_output).map((l) => l.daily_output);
    if (outs.length) setDefaults((d) => ({ ...d, per_line_output: Math.round(outs.reduce((a, b) => a + b, 0) / outs.length) }));
  }, [supplier, lines]);

  const allPicked = options.length > 0 && options.every((o) => picked.includes(o.id));
  const submit = async () => {
    setErr("");
    try {
      await bulkCreateProductionPlans({ stage, order_ids: picked, ...defaults });
      onAdded();
      onClose();
    } catch (e) {
      setErr(errText(e));
    }
  };

  return (
    <Modal title={`Add orders — ${STAGES.find((s) => s.value === stage)?.label} plan`} onClose={onClose} width={920}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginBottom: 12, alignItems: "center" }}>
        <SupplierSelect suppliers={suppliers} value={supplier} onChange={(v) => { setSupplier(v); setPicked([]); }} allowAll />
        <div style={{ position: "relative" }}>
          <FiSearch size={14} style={{ position: "absolute", left: 10, top: 13, color: C.muted }} />
          <input className="pp-input" style={{ paddingLeft: 30, width: "100%" }} placeholder="Order no / PO / item"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label style={{ fontSize: 12.5, color: C.ink2, display: "flex", gap: 6, alignItems: "center", whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> Include past ship dates
        </label>
      </div>
      {err && <div className="pp-err">{err}</div>}
      <div style={{ maxHeight: 340, overflow: "auto", border: `1px solid ${C.border}`, borderRadius: 10 }}>
        <table className="pp-table" style={{ minWidth: 0 }}>
          <thead>
            <tr>
              <th style={{ width: 30 }}>
                <input type="checkbox" checked={allPicked} disabled={!options.length}
                  onChange={() => setPicked(allPicked ? [] : options.map((o) => o.id))} />
              </th>
              <th>Order No</th><th>Customer</th><th>Supplier</th><th>Description</th><th className="r">Qty</th><th>Shipment</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {!supplier && !search.trim() && <tr><td colSpan={8} className="pp-empty">Pick a supplier or search for an order.</td></tr>}
            {(supplier || search.trim()) && !loading && options.length === 0 && (
              <tr><td colSpan={8} className="pp-empty">No unplanned running orders found.</td></tr>
            )}
            {loading && <tr><td colSpan={8} className="pp-empty">Loading…</td></tr>}
            {!loading && options.map((o) => (
              <tr key={o.id} onClick={() => setPicked((p) => (p.includes(o.id) ? p.filter((x) => x !== o.id) : [...p, o.id]))} style={{ cursor: "pointer" }}>
                <td><input type="checkbox" readOnly checked={picked.includes(o.id)} /></td>
                <td style={{ fontWeight: 700 }}>{o.order_no || "—"}</td>
                <td>{o.customer_name || "—"}</td>
                <td>{o.supplier_name || "—"}</td>
                <td className="pp-clip" title={o.item}>{o.item || "—"}</td>
                <td className="r">{fmtInt(o.total_qty)}</td>
                <td>{fmtDate(o.shipment_date)}</td>
                <td>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
        {[
          ["per_line_output", "Per line output / day"],
          ["weekend_days", "Weekend days"], ["allowance_days", "Allowance days"],
        ].map(([k, label]) => (
          <div key={k}>
            <label className="pp-label">{label}</label>
            <input className="pp-input" type="number" min={0} style={{ width: "100%" }}
              value={defaults[k]} onChange={(e) => setDefaults({ ...defaults, [k]: e.target.value })} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
        <span style={{ fontSize: 12.5, color: C.muted }}>Lines are assigned afterwards in the grid. Values can be changed per row.</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="pp-btn" onClick={onClose}>Cancel</button>
          <button className="pp-btn primary" disabled={!picked.length} onClick={submit}>
            <FiPlus size={14} /> Add {picked.length || ""} order{picked.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ───────────────────────────── line board (Gantt) ───────────────────────── */

const LineBoard = ({ rows, lines, supplierFilter }) => {
  const today = todayStr();
  const scheduled = rows.filter((r) => r.production_start_date && r.handover_date && r.lines.length);
  if (!scheduled.length) {
    return <div className="pp-empty" style={{ padding: 40 }}>No scheduled orders with lines assigned yet.</div>;
  }
  let from = scheduled.reduce((m, r) => (r.production_start_date < m ? r.production_start_date : m), scheduled[0].production_start_date);
  let to = scheduled.reduce((m, r) => (r.handover_date > m ? r.handover_date : m), scheduled[0].handover_date);
  if (today < from) from = today;
  const span = Math.max(daysBetween(from, to) + 2, 14);
  const pct = (d) => (daysBetween(from, d) / span) * 100;

  const boardLines = lines.filter((l) => (!supplierFilter || l.supplier === supplierFilter) && scheduled.some((r) => r.lines.includes(l.id)));

  // Axis: a tick every week for short ranges, every month otherwise.
  const ticks = [];
  const start = parseDate(from);
  if (span <= 120) {
    for (let d = new Date(start); d <= parseDate(to); d.setDate(d.getDate() + 7)) {
      const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      ticks.push({ label: fmtDate(s).slice(0, 6), left: pct(s) });
    }
  } else {
    for (let d = new Date(start.getFullYear(), start.getMonth() + 1, 1); d <= parseDate(to); d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      ticks.push({ label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, left: pct(s) });
    }
  }

  // Orders overlapping on one line (clashes) go into separate lanes so none is hidden.
  const lanesFor = (lineId) => {
    const lanes = [];
    const placed = [];
    scheduled.filter((r) => r.lines.includes(lineId))
      .sort((x, y) => (x.production_start_date < y.production_start_date ? -1 : 1))
      .forEach((r) => {
        let i = lanes.findIndex((end) => end < r.production_start_date);
        if (i === -1) { i = lanes.length; lanes.push(r.handover_date); } else lanes[i] = r.handover_date;
        placed.push({ r, lane: i });
      });
    return { placed, count: Math.max(lanes.length, 1) };
  };
  const LANE = 30;

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 900 }}>
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, height: 26 }}>
          <div style={{ width: 170, flexShrink: 0 }} />
          <div style={{ position: "relative", flex: 1 }}>
            {ticks.map((t) => (
              <div key={t.label + t.left} style={{ position: "absolute", left: `${t.left}%`, top: 4, fontSize: 11, fontWeight: 700, color: C.muted, borderLeft: `1px solid ${C.border}`, paddingLeft: 4, height: 22, whiteSpace: "nowrap" }}>{t.label}</div>
            ))}
          </div>
        </div>
        {boardLines.map((l) => {
          const { placed, count } = lanesFor(l.id);
          const h = count * LANE + 8;
          return (
            <div key={l.id} style={{ display: "flex", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
              <div style={{ width: 170, flexShrink: 0, padding: "4px 8px" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Line {l.name}</div>
                <div style={{ fontSize: 11, color: C.muted }} className="pp-clip">{l.supplier_name}</div>
              </div>
              <div style={{ position: "relative", flex: 1, height: h }}>
                {ticks.map((t) => (
                  <div key={t.label + t.left} style={{ position: "absolute", left: `${t.left}%`, top: 0, bottom: 0, borderLeft: "1px solid #f0f3f6" }} />
                ))}
                {today >= from && <div style={{ position: "absolute", left: `${pct(today)}%`, top: 0, bottom: 0, borderLeft: "2px dashed #e34948", opacity: 0.6, zIndex: 1 }} title="Today" />}
                {placed.map(({ r, lane }) => {
                  const clash = r.line_status === "CLASH";
                  return (
                    <div key={r.id}
                      title={`${r.order_no} · ${fmtInt(r.effective_qty)} pcs
Start ${fmtDate(r.production_start_date)} → handover ${fmtDate(r.handover_date)}
Shipment ${fmtDate(r.effective_shipment_date)}${clash ? `
CLASH with ${r.clashes.map((c) => c.order_no).join(", ")}` : ""}`}
                      style={{
                        position: "absolute", top: 4 + lane * LANE, height: 24, borderRadius: 6, overflow: "hidden",
                        left: `${pct(r.production_start_date)}%`,
                        width: `${Math.max(((daysBetween(r.production_start_date, r.handover_date) + 1) / span) * 100, 1.5)}%`,
                        background: clash ? "#fde7e7" : "#e8f1fc",
                        border: `1px solid ${clash ? "#e34948" : "#86b6ef"}`,
                        color: clash ? "#b42318" : "#1c5cab", fontSize: 11, fontWeight: 700,
                        padding: "4px 6px", whiteSpace: "nowrap", boxSizing: "border-box", zIndex: 2,
                      }}>
                      {r.order_no} · {fmtDate(r.production_start_date).slice(0, 6)} → {fmtDate(r.handover_date).slice(0, 6)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ───────────────────────────── compare table ───────────────────────────── */

/** "BH → MF" with the variance under it; `bad` = sign of a variance that is worse. */
const Cmp = ({ bh, mf, delta, fmt = (v) => v ?? "—", unit = "", bad = 1 }) => {
  const color = delta === null || delta === undefined || delta === 0 ? C.muted : Math.sign(delta) === bad ? "#b42318" : "#0b7a4b";
  return (
    <div className="pp-cmp">
      <div className="v">{fmt(bh)} → <b>{fmt(mf)}</b></div>
      <div className="d" style={{ color }}>
        {delta === null || delta === undefined ? "—" : `${delta > 0 ? "+" : ""}${typeof delta === "number" && !Number.isInteger(delta) ? delta.toFixed(2) : fmtInt(delta)}${unit}`}
      </div>
    </div>
  );
};

const CompareTable = ({ rows, loading }) => (
  <div style={{ overflow: "auto", maxHeight: "calc(100vh - 230px)" }}>
    <table className="pp-table" style={{ minWidth: 1500 }}>
      <thead>
        <tr>
          <th>Order No</th><th>Customer</th><th>Supplier</th><th className="r">Qty</th><th>Shipment</th>
          <th title="Manufacturer − Buying House">Lines</th>
          <th>Per Line Output</th><th>Total Output</th><th>Lead Time</th>
          <th>Start</th><th>Handover</th><th className="r">Slack</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
        {loading && !rows.length && <tr><td colSpan={13} className="pp-empty">Loading…</td></tr>}
        {!loading && !rows.length && (
          <tr><td colSpan={13} className="pp-empty">No orders planned in Buying House or Manufacturer yet.</td></tr>
        )}
        {rows.map((r) => {
          const bh = r.buying_house || {};
          const mf = r.manufacturer || {};
          const v = r.variance;
          return (
            <tr key={r.order}>
              <td style={{ fontWeight: 700 }}>
                <Link to={`/orders/${r.order}`} style={{ color: C.primary, textDecoration: "none" }}>{r.order_no || "—"}</Link>
              </td>
              <td className="pp-clip" style={{ maxWidth: 130 }} title={r.customer_name}>{r.customer_name || "—"}</td>
              <td className="pp-clip" style={{ maxWidth: 140 }} title={r.supplier_name}>{r.supplier_name || "—"}</td>
              <td className="r">{fmtInt(r.qty)}</td>
              <td>{fmtDate(r.shipment_date)}</td>
              <td title={`BH: ${(bh.line_names || []).join(", ") || "—"}\nMF: ${(mf.line_names || []).join(", ") || "—"}`}>
                <Cmp bh={bh.no_of_lines} mf={mf.no_of_lines} delta={v.lines} bad={-1} />
              </td>
              <td><Cmp bh={bh.per_line_output} mf={mf.per_line_output} delta={v.per_line_output} fmt={fmtInt} bad={-1} /></td>
              <td><Cmp bh={bh.total_output} mf={mf.total_output} delta={v.total_output} fmt={fmtInt} bad={-1} /></td>
              <td><Cmp bh={bh.lead_time} mf={mf.lead_time} delta={v.lead_time} unit=" d" bad={1} /></td>
              <td>
                <Cmp bh={bh.start} mf={mf.start} delta={v.start_days} fmt={(d) => (d ? fmtDate(d).slice(0, 6) : "—")} unit=" d" bad={1} />
                {r.manufacturer && !mf.start_entered && <div style={{ fontSize: 10.5, color: "#8a5a00" }}>MF start not entered</div>}
              </td>
              <td><Cmp bh={bh.handover} mf={mf.handover} delta={v.handover_days} fmt={(d) => (d ? fmtDate(d).slice(0, 6) : "—")} unit=" d" bad={1} /></td>
              <td className="r" style={{ fontWeight: 700, color: r.slack_days < 0 ? "#b42318" : C.ink }}>{r.slack_days ?? "—"}</td>
              <td><StatusChip status={r.action} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

/* ─────────────────────────────── page ──────────────────────────────────── */

const ProductionPlanning = () => {
  const saved = useMemo(loadSaved, []);
  // "final" was removed; an old saved tab falls back to Buying House.
  const [stage, setStage] = useState(
    [...STAGES.map((s) => s.value), "compare"].includes(saved.stage) ? saved.stage : "buying_house",
  );
  const [supplier, setSupplier] = useState(saved.supplier || null);
  const [period, setPeriod] = useState(saved.period || "upcoming");
  const [view, setView] = useState(saved.view || "grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [rows, setRows] = useState([]);
  const [compareRows, setCompareRows] = useState([]);
  const [lines, setLines] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null); // {type:'lines'|'add', supplier}

  useEffect(() => saveState({ stage, supplier, period, view }), [stage, supplier, period, view]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (stage === "compare") {
        const r = await getProductionPlanCompare({ supplier: supplier || undefined, period });
        setCompareRows(r.data);
        return;
      }
      const [p, l, a] = await Promise.all([
        getProductionPlans({ stage, supplier: supplier || undefined, period }),
        getProductionLines(),
        getProductionLineAvailability({ stage }),
      ]);
      setRows(p.data);
      setLines(l.data);
      setAvailability(a.data);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, [stage, supplier, period]);

  const fetchSuppliers = useCallback(() => {
    getProductionPlanSuppliers().then((r) => setSuppliers(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const savePlan = async (id, patch) => {
    try {
      await updateProductionPlan(id, patch);
      // Other rows' CLASH status and line availability can change too.
      await fetchAll();
    } catch (e) {
      flash(errText(e));
    }
  };

  const removePlan = async (row) => {
    if (!window.confirm(`Remove ${row.order_no} from the ${STAGES.find((s) => s.value === stage)?.label} plan?`)) return;
    try {
      await deleteProductionPlan(row.id);
      await fetchAll();
    } catch (e) {
      flash(errText(e));
    }
  };

  const copyToNext = async () => {
    const idx = STAGES.findIndex((s) => s.value === stage);
    const next = STAGES[idx + 1];
    if (!next) return;
    try {
      const r = await copyProductionPlanStage({ from_stage: stage, to_stage: next.value, supplier: supplier || undefined });
      flash(`${r.data.copied} plan(s) copied to ${next.label}.`);
    } catch (e) {
      flash(errText(e));
    }
  };

  const isCompare = stage === "compare";
  const forward = FORWARD_STAGES.includes(stage);

  const visibleCompare = useMemo(() => {
    const q = search.trim().toLowerCase();
    return compareRows.filter((r) => (!statusFilter || r.action === statusFilter)
      && (!q || [r.order_no, r.customer_name, r.supplier_name, r.item].some((v) => String(v || "").toLowerCase().includes(q))));
  }, [compareRows, search, statusFilter]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter && r.line_status !== statusFilter && r.schedule_status !== statusFilter) return false;
      if (!q) return true;
      return [r.order_no, r.po_no, r.customer_name, r.supplier_name, r.item, r.fabrication, ...r.line_names]
        .some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [rows, search, statusFilter]);

  const kpi = useMemo(() => {
    const t = todayStr();
    const count = (s) => rows.filter((r) => r.line_status === s).length;
    return {
      total: rows.length,
      qty: rows.reduce((a, r) => a + (r.effective_qty || 0), 0),
      ok: count("OK"),
      clash: count("CLASH"),
      lineCount: count("CHECK LINE COUNT"),
      assign: count("ASSIGN LINE"),
      fabricDue: rows.filter((r) => r.fabric_inhouse_date && r.fabric_inhouse_date >= t && daysBetween(t, r.fabric_inhouse_date) <= 7).length,
      startPassed: rows.filter((r) => r.production_start_date && r.production_start_date < t && r.handover_date >= t).length,
      delay: rows.filter((r) => r.schedule_status === "DELAY").length,
      noStart: rows.filter((r) => r.forward && !r.start_date).length,
    };
  }, [rows]);

  const compareKpi = useMemo(() => {
    const count = (a) => compareRows.filter((r) => r.action === a).length;
    return {
      total: compareRows.length,
      approved: count("SCHEDULE APPROVED"),
      critical: count("CRITICAL: RE-ASSIGN MORE LINES"),
      awaiting: count("AWAITING MANUFACTURER PLAN"),
    };
  }, [compareRows]);

  const [availSupplier, setAvailSupplier] = useState(supplier);
  const [openSuppliers, setOpenSuppliers] = useState(() => new Set(supplier ? [supplier] : []));
  // The page's supplier filter also picks the supplier shown in Line availability.
  useEffect(() => {
    setAvailSupplier(supplier);
    if (supplier) setOpenSuppliers((s) => new Set(s).add(supplier));
  }, [supplier]);
  const shownAvailability = availability.filter((a) => !availSupplier || a.supplier === availSupplier);
  const availGroups = useMemo(() => {
    const m = new Map();
    shownAvailability.forEach((a) => {
      if (!m.has(a.supplier)) m.set(a.supplier, { id: a.supplier, name: a.supplier_name, lines: [] });
      m.get(a.supplier).lines.push(a);
    });
    return [...m.values()].sort((x, y) => x.name.localeCompare(y.name));
  }, [shownAvailability]);
  const toggleSupplier = (id) => setOpenSuppliers((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    if (isCompare) {
      const cmp = visibleCompare.map((r) => {
        const bh = r.buying_house || {};
        const mf = r.manufacturer || {};
        return {
          "Order No": r.order_no, Customer: r.customer_name, Supplier: r.supplier_name, Qty: r.qty,
          "Shipment Date": fmtDate(r.shipment_date),
          "BH Lines": bh.no_of_lines, "MF Lines": mf.no_of_lines, "Line Count Variance": r.variance.lines,
          "BH Per Line Output": bh.per_line_output, "MF Per Line Output": mf.per_line_output, "Per Line Output Variance": r.variance.per_line_output,
          "BH Total Output": bh.total_output, "MF Total Output": mf.total_output, "Total Output Variance": r.variance.total_output,
          "BH Lead Time": bh.lead_time, "MF Lead Time": mf.lead_time, "Lead Time Variance": r.variance.lead_time,
          "BH Ideal Start": fmtDate(bh.start), "MF Start": fmtDate(mf.start), "Start Variance (days)": r.variance.start_days,
          "BH Ideal Handover": fmtDate(bh.handover), "MF Handover": fmtDate(mf.handover), "Handover Variance (days)": r.variance.handover_days,
          "Slack / Delay (days)": r.slack_days, Action: r.action,
        };
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cmp), "Compare");
      XLSX.writeFile(wb, `Production_Planning_Compare_${todayStr()}.xlsx`);
      return;
    }
    const data = visible.map((r) => ({
      "Line Name": r.line_names.join(", "),
      "Order No": r.order_no,
      "Customer Name": r.customer_name,
      "Vendor / Supplier": r.supplier_name,
      "Fabric details": r.fabrication,
      "Style description": r.item,
      "Ord Qty": r.effective_qty,
      "No. of Line": r.no_of_lines,
      "Per line output": r.per_line_output,
      "Total Output": r.total_output,
      "Production lead time": r.lead_time,
      Weekend: r.weekend_days,
      Allowance: r.allowance_days,
      "Total Planning Days": r.total_planning_days,
      "Fabric In-house": fmtDate(r.fabric_inhouse_date),
      "Production Start": fmtDate(r.production_start_date),
      "Production Finished": fmtDate(r.production_finish_date),
      "Handover Date": fmtDate(r.handover_date),
      "Shipment Date": fmtDate(r.effective_shipment_date),
      "Slack (days)": r.slack_days,
      ...(forward ? { "Start Entered": r.start_date ? "Yes" : "No (ideal)", Schedule: r.schedule_status || "SET START" } : {}),
      "Line Status": r.line_status,
      Remarks: r.remarks,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Planning");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shownAvailability.map((a) => ({
      Line: a.name, Supplier: a.supplier_name, Type: a.product_type, Machines: a.machines,
      "Output/day": a.daily_output, "Last Handover": fmtDate(a.last_handover),
      "Available From": fmtDate(a.available_from), "Last Order": a.last_order, Status: a.status,
    }))), "Line Availability");
    XLSX.writeFile(wb, `Production_Planning_${STAGES.find((s) => s.value === stage).label.replace(/\W+/g, "_")}_${todayStr()}.xlsx`);
  };

  const stageIdx = STAGES.findIndex((s) => s.value === stage);
  const stageLabel = isCompare ? "Compare" : STAGES[stageIdx].label;

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: C.page }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: "auto" }}>
        <div id="pp-root" style={{ fontFamily: FONT, padding: "24px 28px 60px", minHeight: "100vh" }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            #pp-root, #pp-root * { font-family: ${FONT}; box-sizing: border-box; }
            #pp-root .pp-card { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 14px; }
            #pp-root .pp-btn {
              display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: 9px;
              border: 1px solid ${C.border}; background: #fff; color: ${C.ink}; font-size: 13px; font-weight: 600; cursor: pointer;
            }
            #pp-root .pp-btn:hover:not(:disabled) { border-color: ${C.primary}; color: ${C.primary}; }
            #pp-root .pp-btn:disabled { opacity: .5; cursor: not-allowed; }
            #pp-root .pp-btn.primary { background: ${C.hero}; border-color: ${C.hero}; color: #fff; }
            #pp-root .pp-btn.primary:hover:not(:disabled) { background: #16405a; color: #fff; }
            #pp-root .pp-btn.sm { height: 28px; padding: 0 10px; font-size: 12px; }
            #pp-root .pp-icon-btn {
              display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px;
              border-radius: 7px; border: 1px solid ${C.border}; background: #fff; color: ${C.ink2}; cursor: pointer; padding: 0;
            }
            #pp-root .pp-icon-btn:hover { border-color: ${C.primary}; color: ${C.primary}; }
            #pp-root .pp-icon-btn.danger:hover { border-color: #e34948; color: #e34948; background: #fdf1f1; }
            #pp-root .pp-input {
              height: 38px; padding: 0 10px; border: 1px solid #cfd8e2; border-radius: 8px; font-size: 13px; color: ${C.ink};
              background: #fff; outline: none;
            }
            #pp-root .pp-input:focus, #pp-root .pp-cell-input:focus { border-color: ${C.primary}; box-shadow: 0 0 0 3px rgba(42,120,214,.15); }
            #pp-root .pp-label { display: block; font-size: 11px; font-weight: 700; color: ${C.ink2}; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .04em; }
            #pp-root .pp-cell-input {
              height: 28px; padding: 0 6px; border: 1px solid #d5dde6; border-radius: 6px; font-size: 12.5px;
              color: ${C.ink}; background: #fffdf2; outline: none;
            }
            #pp-root .pp-date-cell {
              position: relative; display: inline-flex; align-items: center; height: 28px; min-width: 96px; padding: 0 8px;
              border: 1px solid #d5dde6; border-radius: 6px; background: #fffdf2; font-size: 12.5px; cursor: pointer;
            }
            #pp-root .pp-date-cell:hover { border-color: ${C.primary}; }
            #pp-root .pp-date-cell input { position: absolute; left: 0; bottom: 0; width: 100%; height: 100%; opacity: 0; pointer-events: none; }
            #pp-root .pp-tab { padding: 9px 16px; border: none; background: none; font-size: 13.5px; font-weight: 700; color: ${C.muted}; cursor: pointer; border-bottom: 2px solid transparent; }
            #pp-root .pp-tab.active { color: ${C.ink}; border-bottom-color: ${C.hero}; }
            #pp-root .pp-seg { display: inline-flex; border: 1px solid ${C.border}; border-radius: 9px; overflow: hidden; }
            #pp-root .pp-seg button { border: none; background: #fff; padding: 0 12px; height: 34px; font-size: 12.5px; font-weight: 600; color: ${C.ink2}; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
            #pp-root .pp-seg button.active { background: ${C.hero}; color: #fff; }
            #pp-root .pp-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12.5px; min-width: 2100px; }
            #pp-root .pp-table th {
              position: sticky; top: 0; z-index: 2; background: #f3f6f9; color: ${C.ink2}; font-size: 11px; font-weight: 700;
              text-transform: uppercase; letter-spacing: .03em; text-align: left; padding: 9px 8px; border-bottom: 1px solid ${C.border}; white-space: nowrap;
            }
            #pp-root .pp-table th.calc { background: #e9eef4; }
            #pp-root .pp-table td { padding: 7px 8px; border-bottom: 1px solid #edf1f5; color: ${C.ink}; vertical-align: middle; white-space: nowrap; }
            #pp-root .pp-table td.calc { background: ${C.calc}; }
            #pp-root .pp-table tr:hover td { background: #f7fafc; }
            #pp-root .pp-table .r { text-align: right; }
            #pp-root .pp-clip { max-width: 190px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            #pp-root .pp-empty { text-align: center; color: ${C.muted}; padding: 22px; font-size: 13px; }
            #pp-root .pp-lines-btn {
              min-width: 74px; max-width: 130px; height: 28px; padding: 0 8px; border: 1px dashed #b9c6d3; border-radius: 6px;
              background: #fff; font-size: 12.5px; font-weight: 700; color: ${C.ink}; cursor: pointer; text-align: left;
              overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            #pp-root .pp-lines-btn:hover { border-color: ${C.primary}; }
            #pp-root .pp-pop {
              position: fixed; z-index: 35; width: 340px; background: #fff; border: 1px solid ${C.border};
              border-radius: 10px; box-shadow: 0 14px 34px rgba(15,36,51,.16); padding: 10px 12px; white-space: normal;
            }
            #pp-root .pp-pop-row { display: flex; align-items: center; gap: 8px; padding: 5px 2px; font-size: 12.5px; cursor: pointer; border-radius: 6px; }
            #pp-root .pp-pop-row:hover { background: #f3f6f9; }
            #pp-root .pp-pop-row.locked { cursor: not-allowed; opacity: .75; }
            #pp-root .pp-pop-row.locked:hover { background: none; }
            #pp-root .pp-sup-row td { background: #f7f9fb; cursor: pointer; font-size: 13px; }
            #pp-root .pp-sup-row:hover td { background: #eef4fb; }
            body > .MuiAutocomplete-popper, body > .MuiAutocomplete-popper * { font-family: ${FONT}; }
            body > .MuiAutocomplete-popper { z-index: 1400 !important; }
            #pp-root .pp-cmp { line-height: 1.3; }
            #pp-root .pp-cmp .v { font-size: 12px; color: ${C.ink}; }
            #pp-root .pp-cmp .v b { font-weight: 700; }
            #pp-root .pp-cmp .d { font-size: 11px; font-weight: 700; }
            #pp-root .pp-modal-bg { position: fixed; inset: 0; background: rgba(13,43,62,.38); z-index: 1200; display: flex; align-items: flex-start; justify-content: center; padding: 60px 16px; overflow: auto; }
            #pp-root .pp-modal { background: #fff; border-radius: 14px; padding: 20px 22px; max-width: 100%; box-shadow: 0 24px 60px rgba(13,43,62,.25); }
            #pp-root .pp-err { background: #fdf1f1; color: #b42318; border: 1px solid #f5c2c0; border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-bottom: 10px; }
            #pp-root .pp-kpi { padding: 14px 16px; cursor: default; }
            #pp-root .pp-kpi.click { cursor: pointer; }
            #pp-root .pp-kpi.click:hover { border-color: ${C.primary}; }
            #pp-root .pp-kpi.on { border-color: ${C.hero}; box-shadow: inset 0 0 0 1px ${C.hero}; }
            @keyframes pp-spin { to { transform: rotate(360deg); } }
          `}</style>

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap", paddingLeft: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: C.hero, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FiLayers size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: C.ink }}>Production Planning</h1>
                <div style={{ fontSize: 13, color: C.muted }}>
                  {isCompare ? "Manufacturer plan vs Buying House plan · variance & action"
                    : forward ? "Forward from the factory's start date · delay / slack & line clash check"
                      : "Back-calculated from shipment date · line occupancy & clash check"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="pp-btn" onClick={fetchAll} disabled={loading}>
                <FiRefreshCw size={14} style={loading ? { animation: "pp-spin 1s linear infinite" } : undefined} /> Refresh
              </button>
              <button className="pp-btn" onClick={() => setModal({ type: "lines", supplier })}><FiSettings size={14} /> Lines</button>
              <button className="pp-btn" onClick={exportExcel} disabled={isCompare ? !visibleCompare.length : !visible.length}><FiDownload size={14} /> Excel</button>
              {!isCompare && <button className="pp-btn primary" onClick={() => setModal({ type: "add", supplier })}><FiPlus size={14} /> Add orders</button>}
            </div>
          </div>

          {/* ── Stage tabs + filters ── */}
          <div className="pp-card" style={{ padding: "4px 16px 14px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div>
                {STAGES.map((s) => (
                  <button key={s.value} className={`pp-tab${stage === s.value ? " active" : ""}`} onClick={() => { setStage(s.value); setStatusFilter(""); }}>
                    {s.label}
                  </button>
                ))}
                <span style={{ display: "inline-block", width: 1, height: 18, background: C.border, margin: "0 6px", verticalAlign: "middle" }} />
                <button className={`pp-tab${isCompare ? " active" : ""}`} onClick={() => { setStage("compare"); setStatusFilter(""); }}>
                  Compare
                </button>
              </div>
              {!isCompare && STAGES[stageIdx + 1] && (
                <button className="pp-btn sm" onClick={copyToNext} disabled={!rows.length}
                  title={`Copy ${supplier ? "this supplier's" : "all"} plans not yet in ${STAGES[stageIdx + 1].label}`}>
                  <FiCopy size={12} /> Copy to {STAGES[stageIdx + 1].label}
                </button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 320px) minmax(200px, 1fr) auto auto", gap: 10, alignItems: "end" }}>
              <div>
                <label className="pp-label">Supplier</label>
                <SupplierSelect suppliers={suppliers} value={supplier} onChange={setSupplier} allowAll style={{ width: "100%" }} />
              </div>
              <div>
                <label className="pp-label">Search</label>
                <div style={{ position: "relative" }}>
                  <FiSearch size={14} style={{ position: "absolute", left: 10, top: 12, color: C.muted }} />
                  <input className="pp-input" style={{ paddingLeft: 30, width: "100%" }} placeholder="Order no, customer, item, line…"
                    value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="pp-label">Shipments</label>
                <div className="pp-seg">
                  <button className={period === "upcoming" ? "active" : ""} onClick={() => setPeriod("upcoming")}>Upcoming</button>
                  <button className={period === "all" ? "active" : ""} onClick={() => setPeriod("all")}>All</button>
                </div>
              </div>
              {!isCompare && <div>
                <label className="pp-label">View</label>
                <div className="pp-seg">
                  <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}><FiGrid size={13} /> Plan</button>
                  <button className={view === "board" ? "active" : ""} onClick={() => setView("board")}><FiBarChart2 size={13} /> Line board</button>
                </div>
              </div>}
            </div>
          </div>

          {/* ── KPIs ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
            {(isCompare ? [
              { label: "Orders compared", value: compareKpi.total, color: C.ink },
              { label: "Schedule approved", value: compareKpi.approved, color: "#0b7a4b", filter: "SCHEDULE APPROVED" },
              { label: "Critical: re-assign lines", value: compareKpi.critical, color: "#b42318", filter: "CRITICAL: RE-ASSIGN MORE LINES" },
              { label: "Awaiting manufacturer", value: compareKpi.awaiting, color: C.ink2, filter: "AWAITING MANUFACTURER PLAN" },
            ] : [
              { label: "Orders planned", value: kpi.total, sub: `${fmtInt(kpi.qty)} pcs`, color: C.ink },
              { label: "OK", value: kpi.ok, color: "#0b7a4b", filter: "OK" },
              { label: "Clashes", value: kpi.clash, color: "#b42318", filter: "CLASH" },
              { label: "Check line count", value: kpi.lineCount, color: "#8a5a00", filter: "CHECK LINE COUNT" },
              { label: "Need lines", value: kpi.assign, color: C.ink2, filter: "ASSIGN LINE" },
              { label: "Fabric due ≤ 7 days", value: kpi.fabricDue, color: C.primary },
              { label: "In production", value: kpi.startPassed, color: C.hero },
              ...(forward ? [{ label: "Delayed", value: kpi.delay, sub: kpi.noStart ? `${kpi.noStart} without start date` : undefined, color: "#b42318", filter: "DELAY" }] : []),
            ]).map((k) => (
              <div key={k.label}
                className={`pp-card pp-kpi${k.filter ? " click" : ""}${k.filter && statusFilter === k.filter ? " on" : ""}`}
                onClick={() => k.filter && setStatusFilter((f) => (f === k.filter ? "" : k.filter))}
                title={k.filter ? "Click to filter the grid" : undefined}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em" }}>{k.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: k.color, marginTop: 4 }}>{fmtInt(k.value)}</div>
                {k.sub && <div style={{ fontSize: 12, color: C.muted }}>{k.sub}</div>}
              </div>
            ))}
          </div>

          {error && <div className="pp-err">{error}</div>}
          {statusFilter && (
            <div style={{ fontSize: 12.5, color: C.ink2, marginBottom: 8 }}>
              Showing <b>{statusFilter}</b> only · <button className="pp-btn sm" onClick={() => setStatusFilter("")}>Clear</button>
            </div>
          )}

          {/* ── Main: grid or board ── */}
          <div className="pp-card" style={{ overflow: "hidden", marginBottom: 18 }}>
            {isCompare ? (
              <CompareTable rows={visibleCompare} loading={loading} />
            ) : view === "board" ? (
              <div style={{ padding: 14 }}>
                <LineBoard rows={visible} lines={lines} supplierFilter={supplier} />
              </div>
            ) : (
              <div style={{ overflow: "auto", maxHeight: "calc(100vh - 230px)" }}>
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th>Line</th><th>Pic</th><th>Order No</th><th>Customer</th><th>Supplier</th><th>Fabric</th><th>Description</th>
                      <th className="r">Ord Qty</th><th>No. of Line</th><th>Per Line Output</th>
                      <th className="calc r">Total Output</th><th className="calc r">Lead Time</th>
                      <th>Weekend</th><th>Allowance</th><th className="calc r">Planning Days</th>
                      <th className="calc">Fabric In-house</th>
                      {forward ? <th title="Manual start date on the factory floor">Prod. Start (manual)</th> : <th className="calc">Prod. Start</th>}
                      <th className="calc">Prod. Finished</th>
                      <th className="calc">Handover</th><th>Shipment</th><th className="calc r">Slack</th>{forward && <th>Schedule</th>}<th>Status</th><th>Remarks</th><th />
                    </tr>
                  </thead>
                  <tbody>
                    {loading && !rows.length && <tr><td colSpan={25} className="pp-empty">Loading…</td></tr>}
                    {!loading && !visible.length && (
                      <tr><td colSpan={25} className="pp-empty">
                        {rows.length ? "No plans match the filters." : <>No orders in this plan yet. Use <b>Add orders</b> to start planning.</>}
                      </td></tr>
                    )}
                    {visible.map((r) => {
                      const t = todayStr();
                      const fabricLate = r.fabric_inhouse_date && r.fabric_inhouse_date < t && r.production_start_date >= t;
                      const clashTitle = r.clashes.length
                        ? `Clashes with:\n${r.clashes.map((c) => `${c.order_no} (lines ${c.lines.map((id) => lines.find((l) => l.id === id)?.name || id).join(", ")}) ${fmtDate(c.start)} → ${fmtDate(c.handover)}`).join("\n")}`
                        : r.line_status === "CHECK LINE COUNT"
                          ? `${r.lines.length} line(s) assigned but No. of Line is ${r.no_of_lines}`
                          : undefined;
                      return (
                        <tr key={r.id}>
                          <td>
                            <LinePicker row={r} lines={lines} availability={availability}
                              onSave={(ids) => savePlan(r.id, { lines: ids, no_of_lines: Math.max(ids.length, 1) })}
                              onManage={(s) => setModal({ type: "lines", supplier: s })} />
                          </td>
                          <td>
                            {r.image
                              ? <a href={imgUrl(r.image)} target="_blank" rel="noreferrer"><img src={imgUrl(r.image)} alt="" style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.border}` }} /></a>
                              : <FiImage size={16} color="#c3ccd6" />}
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            <Link to={`/orders/${r.order}`} style={{ color: C.primary, textDecoration: "none" }}>{r.order_no || "—"}</Link>
                          </td>
                          <td className="pp-clip" style={{ maxWidth: 120 }} title={r.customer_name}>{r.customer_name || "—"}</td>
                          <td className="pp-clip" style={{ maxWidth: 130 }} title={r.supplier_name}>{r.supplier_name || "—"}</td>
                          <td className="pp-clip" style={{ maxWidth: 160 }} title={r.fabrication}>{r.fabrication || "—"}</td>
                          <td className="pp-clip" style={{ maxWidth: 180 }} title={r.item}>{r.item || "—"}</td>
                          <td className="r">
                            <CellInput value={r.order_qty ?? r.order_total_qty} width={78}
                              onSave={(v) => savePlan(r.id, { order_qty: v === r.order_total_qty ? null : v })} />
                            {r.order_qty !== null && r.order_qty !== r.order_total_qty && (
                              <div style={{ fontSize: 10.5, color: C.muted }} title="Order quantity">order {fmtInt(r.order_total_qty)}</div>
                            )}
                          </td>
                          <td className="calc r" title="Set by the lines ticked in Line">{r.no_of_lines}</td>
                          <td><CellInput value={r.per_line_output} width={70} onSave={(v) => savePlan(r.id, { per_line_output: v })} /></td>
                          <td className="calc r">{fmtInt(r.total_output)}</td>
                          <td className="calc r">{r.lead_time ?? "—"}</td>
                          <td><CellInput value={r.weekend_days} width={52} onSave={(v) => savePlan(r.id, { weekend_days: v || 0 })} /></td>
                          <td><CellInput value={r.allowance_days} width={52} onSave={(v) => savePlan(r.id, { allowance_days: v || 0 })} /></td>
                          <td className="calc r" style={{ fontWeight: 700 }}>{r.total_planning_days ?? "—"}</td>
                          <td className="calc" style={fabricLate ? { color: "#b42318", fontWeight: 700 } : undefined}
                            title={fabricLate ? "Fabric in-house date has passed" : undefined}>{fmtDate(r.fabric_inhouse_date)}</td>
                          {forward ? (
                            <td>
                              <DateCell value={r.start_date}
                                onSave={(v) => savePlan(r.id, { start_date: v })} />
                              <div style={{ fontSize: 10.5, color: r.start_date ? C.muted : "#8a5a00" }}>
                                {r.start_date ? `ideal ${fmtDate(r.ideal_start_date)}` : `not set · ideal ${fmtDate(r.ideal_start_date)}`}
                              </div>
                            </td>
                          ) : (
                            <td className="calc" style={{ fontWeight: 700 }}>{fmtDate(r.production_start_date)}</td>
                          )}
                          <td className="calc">{fmtDate(r.production_finish_date)}</td>
                          <td className="calc">{fmtDate(r.handover_date)}</td>
                          <td>
                            <DateCell value={r.effective_shipment_date}
                              onSave={(v) => savePlan(r.id, { shipment_date: v === r.order_shipment_date ? null : v })} />
                            {r.shipment_date && r.shipment_date !== r.order_shipment_date && (
                              <div style={{ fontSize: 10.5, color: C.muted }}>order {fmtDate(r.order_shipment_date)}</div>
                            )}
                          </td>
                          <td className="calc r" style={r.slack_days < 0 ? { color: "#b42318", fontWeight: 700 } : undefined}>{r.slack_days ?? "—"}</td>
                          {forward && (
                            <td>
                              <StatusChip status={r.schedule_status || "SET START"}
                                title={r.schedule_status === "DELAY" ? `Handover ${fmtDate(r.handover_date)} is ${-r.slack_days} day(s) after shipment ${fmtDate(r.effective_shipment_date)}` : undefined} />
                            </td>
                          )}
                          <td>
                            <StatusChip status={r.line_status} title={clashTitle} />
                            {r.line_status === "CLASH" && (
                              <div style={{ fontSize: 10.5, color: "#b42318", marginTop: 2 }} className="pp-clip">
                                vs {r.clashes.map((c) => c.order_no).join(", ")}
                              </div>
                            )}
                          </td>
                          <td><CellInput type="text" width={160} value={r.remarks} onSave={(v) => savePlan(r.id, { remarks: v || "" })} /></td>
                          <td>
                            <button className="pp-icon-btn danger" title="Remove from plan" onClick={() => removePlan(r)}><FiTrash2 size={13} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Line availability ── */}
          {!isCompare && <div className="pp-card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>Line availability</div>
                <div style={{ fontSize: 12, color: C.muted }}>Click a supplier to see its lines · available from = last handover + 1 ({stageLabel} plan, all customers)</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <SupplierSelect suppliers={suppliers} value={availSupplier} allowAll onlyWithLines style={{ width: 300 }}
                  onChange={(v) => { setAvailSupplier(v); if (v) setOpenSuppliers((s) => new Set(s).add(v)); }} />
                <button className="pp-btn sm" onClick={() => setModal({ type: "lines", supplier: availSupplier })}><FiSettings size={12} /> Manage lines</button>
              </div>
            </div>
            <div style={{ overflow: "auto" }}>
              <table className="pp-table" style={{ minWidth: 0 }}>
                <thead>
                  <tr><th>Line</th><th>Type</th><th className="r">Machines</th><th className="r">Output / day</th><th>Last Handover</th><th>Available From</th><th>Last Order</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {!shownAvailability.length && (
                    <tr><td colSpan={8} className="pp-empty">No lines set up{availSupplier ? " for this supplier" : ""} yet. Use <b>Manage lines</b>.</td></tr>
                  )}
                  {availGroups.map((g) => {
                    const isOpen = openSuppliers.has(g.id);
                    const booked = g.lines.filter((a) => a.status === "BOOKED").length;
                    return (
                      <React.Fragment key={g.id}>
                        <tr className="pp-sup-row" onClick={() => toggleSupplier(g.id)}>
                          <td colSpan={8}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                              {isOpen ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                              <b>{g.name}</b>
                              <span style={{ color: C.muted, fontSize: 12 }}>
                                {g.lines.length} line{g.lines.length === 1 ? "" : "s"} · {g.lines.length - booked} available · {booked} booked
                              </span>
                            </span>
                          </td>
                        </tr>
                        {isOpen && g.lines.map((a) => (
                    <tr key={a.line_id}>
                      <td style={{ fontWeight: 700, paddingLeft: 30 }}>{a.name}</td>
                      <td>{a.product_type === "knit" ? "Knit" : "Woven"}</td>
                      <td className="r">{fmtInt(a.machines)}</td>
                      <td className="r">{fmtInt(a.daily_output)}</td>
                      <td>{fmtDate(a.last_handover)}</td>
                      <td>{fmtDate(a.available_from)}</td>
                      <td>{a.last_order || "—"}</td>
                      <td><StatusChip status={a.status} /></td>
                    </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>}

          {toast && (
            <div style={{ position: "fixed", bottom: 22, right: 22, zIndex: 1300, background: C.hero, color: "#fff", padding: "10px 16px", borderRadius: 10, fontSize: 13, boxShadow: "0 10px 30px rgba(0,0,0,.2)", display: "flex", alignItems: "center", gap: 8 }}>
              {/copied/.test(toast) ? <FiCheckCircle /> : <FiAlertTriangle />} {toast}
            </div>
          )}

          {modal?.type === "lines" && (
            <ManageLinesModal suppliers={suppliers} initialSupplier={modal.supplier}
              onClose={() => setModal(null)} onChanged={() => { fetchAll(); fetchSuppliers(); }} />
          )}
          {modal?.type === "add" && (
            <AddOrdersModal stage={stage} suppliers={suppliers} lines={lines} initialSupplier={modal.supplier}
              onClose={() => setModal(null)} onAdded={fetchAll} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionPlanning;
