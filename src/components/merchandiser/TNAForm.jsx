// src/components/merchandiser/TNAForm.jsx
//
// Create / edit a TNA. Fixes over the old form:
//  - creating always failed (server set a non-existent created_by field);
//  - editing read the order as data.order.id (the API sends a plain id),
//    then sent a full PUT without it, which would have unlinked the TNA
//    from its order - edits now PATCH and never touch the order link;
//  - the order picker loaded 1000 random orders incl. shipped ones and ones
//    that already had a TNA (one TNA per order) - now it searches open
//    orders without a TNA;
//  - "Sync from order" called an endpoint that didn't exist;
//  - alert() for every message replaced by inline messages.
// The plan preview uses the same rules as the server (tnaShared.calculatePlan).

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiAlertTriangle, FiArrowLeft, FiSave, FiSearch, FiX } from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import QuickDateInput from "./QuickDateInput";
import { GROUP_LABEL, MILESTONES, TNA_CSS, apiError, calculatePlan, fmtDate, relDays, daysFromToday, tnaApi } from "./tnaShared";

const EMPTY = {
  order: null,
  order_number: "",
  supplier: "",
  gender: "",
  item: "",
  wgr: "",
  fabrication: "",
  size_range: "",
  total_qty: "",
  fabric_type: "imported",
  fabric_supplier: "",
  order_booking_date: "",
  shipment_date: "",
  remarks: "",
};

const toDate = (s) => (s ? new Date(`${String(s).slice(0, 10)}T00:00:00Z`) : null);
const fromDate = (d) => (d ? d.toISOString().slice(0, 10) : "");

export default function TNAForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [orderInfo, setOrderInfo] = useState(null); // {order_no, po_no, customer, supplier}
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // order picker (create only)
  const [q, setQ] = useState("");
  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    if (!isEdit) return;
    tnaApi
      .get(`tna/${id}/`)
      .then(({ data }) => {
        setForm({
          order: data.order,
          order_number: data.order_number || "",
          supplier: data.supplier_name || data.supplier || "",
          gender: data.gender || "",
          item: data.item || "",
          wgr: data.wgr || "",
          fabrication: data.fabrication || "",
          size_range: data.size_range || "",
          total_qty: data.total_qty ?? "",
          fabric_type: data.fabric_type || "imported",
          fabric_supplier: data.fabric_supplier || "",
          order_booking_date: data.order_booking_date || "",
          shipment_date: data.shipment_date || "",
          remarks: data.remarks || "",
        });
        setOrderInfo({
          order_no: data.order_no || data.order_number,
          po_no: data.po_no,
          customer: data.customer_name,
          supplier: data.supplier_name || (data.supplier || "").replace(" (None)", ""),
        });
      })
      .catch((err) => setError(err.response?.status === 404 ? "This TNA doesn't exist or you don't have access to it." : apiError(err, "Couldn't load this TNA.")))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    if (isEdit || form.order) return undefined;
    const t = setTimeout(async () => {
      const rid = ++reqId.current;
      setSearching(true);
      try {
        const res = await tnaApi.get("tna/available-orders/", { params: q.trim() ? { search: q.trim() } : {} });
        if (rid === reqId.current) setOptions(res.data || []);
      } catch (err) {
        if (rid === reqId.current) setError(apiError(err, "Couldn't load orders."));
      } finally {
        if (rid === reqId.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, isEdit, form.order]);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((e) => ({ ...e, [field]: undefined }));
  };

  const pickOrder = (o) => {
    setForm((f) => ({
      ...f,
      order: o.id,
      order_number: o.order_no || o.po_no || "",
      supplier: o.supplier || "",
      gender: o.gender || "",
      item: o.item || "",
      fabrication: o.fabrication || "",
      size_range: o.size_range || "",
      total_qty: o.total_qty ?? "",
      shipment_date: o.shipment_date || f.shipment_date,
    }));
    setOrderInfo({ order_no: o.order_no, po_no: o.po_no, customer: o.customer, supplier: o.supplier });
    setFieldErrors({});
  };

  const plan = useMemo(() => calculatePlan(form), [form]);
  const planList = MILESTONES.filter((m) => plan[m.key]).map((m) => ({ ...m, date: plan[m.key], days: daysFromToday(plan[m.key]) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const validate = () => {
    const e = {};
    if (!isEdit && !form.order) e.order = "Choose the order this TNA is for.";
    if (!form.order_booking_date) e.order_booking_date = "Required";
    if (!form.shipment_date) e.shipment_date = "Required";
    if (!form.fabric_type) e.fabric_type = "Required";
    if (form.order_booking_date && form.shipment_date && form.shipment_date < form.order_booking_date)
      e.shipment_date = "Shipment can't be before order booking";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setError(null);
    if (!validate()) return;
    setSaving(true);
    const payload = {
      order_number: form.order_number,
      supplier: form.supplier,
      gender: form.gender,
      item: form.item,
      wgr: form.wgr,
      fabrication: form.fabrication,
      size_range: form.size_range,
      total_qty: form.total_qty === "" ? null : Number(form.total_qty),
      fabric_type: form.fabric_type,
      fabric_supplier: form.fabric_supplier,
      order_booking_date: form.order_booking_date,
      shipment_date: form.shipment_date,
      remarks: form.remarks,
    };
    try {
      let res;
      if (isEdit) {
        res = await tnaApi.patch(`tna/${id}/`, payload); // PATCH: the order link is never sent, so never lost
      } else {
        res = await tnaApi.post("tna/", { ...payload, order: form.order });
      }
      navigate(`/tna-details/${res.data.id}`, { state: { flash: isEdit ? "TNA updated — plan recalculated." : "TNA created." } });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object" && !data.detail) {
        const fe = {};
        Object.entries(data).forEach(([k, v]) => (fe[k] = Array.isArray(v) ? v[0] : String(v)));
        setFieldErrors(fe);
      }
      setError(apiError(err, "Couldn't save the TNA."));
      setSaving(false);
    }
  };

  const err = (f) => fieldErrors[f] && <span className="hint" style={{ color: "#b91c1c" }}>{fieldErrors[f]}</span>;

  return (
    <div className="tna-shell">
      <style>{TNA_CSS}</style>
      <Sidebar />
      <div className="tna-app">
        <header className="tna-header">
          <div>
            <div className="tna-crumbs">
              <Link to="/orders/tna">Time & Action</Link> <span>/</span>
              {isEdit && orderInfo ? <><Link to={`/tna-details/${id}`}>{orderInfo.order_no}</Link><span>/</span><span>Edit</span></> : <span>New</span>}
            </div>
            <h1 className="tna-title">{isEdit ? `Edit TNA${orderInfo?.order_no ? ` · ${orderInfo.order_no}` : ""}` : "New TNA"}</h1>
            <p className="tna-subtitle">Set order booking, shipment and fabric type — every other date is calculated from these.</p>
          </div>
          <div className="tna-actions">
            <button type="button" className="tna-btn ghost" onClick={() => navigate(isEdit ? `/tna-details/${id}` : "/orders/tna")}>
              <FiArrowLeft /> Cancel
            </button>
          </div>
        </header>

        {loading ? (
          <div className="tna-body"><span className="tna-skel" style={{ height: 300 }} /></div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="tna-body">
              {error && (
                <div className="tna-alert err">
                  <FiAlertTriangle /><span>{error}</span>
                  <button type="button" className="x" onClick={() => setError(null)} aria-label="Dismiss"><FiX /></button>
                </div>
              )}

              <div className="tna-grid-3">
                <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
                  <section className="tna-card">
                    <div className="tna-card-head">
                      <div>
                        <h2 className="tna-card-title">1 · Order</h2>
                        <p className="tna-card-sub">{isEdit ? "This TNA belongs to the order below." : "Only open orders that don't have a TNA yet are listed."}</p>
                      </div>
                      {!isEdit && form.order && (
                        <button type="button" className="tna-link" onClick={() => { setForm(EMPTY); setOrderInfo(null); }}>Change order</button>
                      )}
                    </div>
                    <div className="tna-card-body">
                      {form.order || isEdit ? (
                        <dl className="tna-dl">
                          <div><dt>Order NO</dt><dd>{orderInfo?.order_no || form.order_number || "—"}</dd></div>
                          <div><dt>PO</dt><dd>{orderInfo?.po_no || "—"}</dd></div>
                          <div><dt>Customer</dt><dd>{orderInfo?.customer || "—"}</dd></div>
                          <div><dt>Supplier</dt><dd>{orderInfo?.supplier || form.supplier || "—"}</dd></div>
                        </dl>
                      ) : (
                        <>
                          <div className="tna-search" style={{ maxWidth: "none" }}>
                            <FiSearch />
                            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order no, PO, item or supplier…" autoFocus />
                          </div>
                          {err("order")}
                          <div className="tna-picker-list">
                            {searching && options.length === 0 && <div className="tna-empty" style={{ padding: 18 }}>Searching…</div>}
                            {!searching && options.length === 0 && <div className="tna-empty" style={{ padding: 18 }}>No open orders without a TNA match.</div>}
                            {options.map((o) => (
                              <div key={o.id} className="tna-picker-item" role="button" tabIndex={0} onClick={() => pickOrder(o)} onKeyDown={(e) => e.key === "Enter" && pickOrder(o)}>
                                <div style={{ minWidth: 0 }}>
                                  <b>{o.order_no || o.po_no}</b>
                                  <div><span>{[o.customer, o.supplier, o.item].filter(Boolean).join(" · ")}</span></div>
                                </div>
                                <span style={{ whiteSpace: "nowrap" }}>Ships {fmtDate(o.shipment_date)}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </section>

                  <section className="tna-card">
                    <div className="tna-card-head">
                      <div>
                        <h2 className="tna-card-title">2 · Planning inputs</h2>
                        <p className="tna-card-sub">Dates: type day/month (e.g. 15/10) — the year fills in.</p>
                      </div>
                    </div>
                    <div className="tna-card-body">
                      <div className="tna-form-grid">
                        <div className="tna-field">
                          <label>Fabric type <span className="req">*</span></label>
                          <div className="tna-seg" role="group" aria-label="Fabric type">
                            {["imported", "local"].map((v) => (
                              <button key={v} type="button" className={form.fabric_type === v ? "on" : ""} onClick={() => set("fabric_type", v)}>
                                {v === "imported" ? "Imported" : "Local"}
                              </button>
                            ))}
                          </div>
                          {err("fabric_type")}
                        </div>
                        <div className="tna-field">
                          <label>Order booking date <span className="req">*</span></label>
                          <QuickDateInput value={toDate(form.order_booking_date)} onChange={(d) => set("order_booking_date", fromDate(d))} style={{}} />
                          {err("order_booking_date")}
                        </div>
                        <div className="tna-field">
                          <label>Shipment date <span className="req">*</span></label>
                          <QuickDateInput value={toDate(form.shipment_date)} onChange={(d) => set("shipment_date", fromDate(d))} style={{}} />
                          {err("shipment_date") || <span className="hint">From the order; change it here if needed.</span>}
                        </div>
                        <div className="tna-field">
                          <label>Fabric supplier</label>
                          <input value={form.fabric_supplier} onChange={(e) => set("fabric_supplier", e.target.value)} />
                        </div>
                        <div className="tna-field full">
                          <label>Remarks</label>
                          <textarea value={form.remarks} onChange={(e) => set("remarks", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="tna-card">
                    <div className="tna-card-head">
                      <div>
                        <h2 className="tna-card-title">3 · Order details</h2>
                        <p className="tna-card-sub">Copied from the order. Edit only if this TNA needs different values.</p>
                      </div>
                    </div>
                    <div className="tna-card-body">
                      <div className="tna-form-grid">
                        <div className="tna-field"><label>Item</label><input value={form.item} onChange={(e) => set("item", e.target.value)} /></div>
                        <div className="tna-field"><label>Gender</label><input value={form.gender} onChange={(e) => set("gender", e.target.value)} /></div>
                        <div className="tna-field"><label>WGR</label><input value={form.wgr} onChange={(e) => set("wgr", e.target.value)} /></div>
                        <div className="tna-field"><label>Size range</label><input value={form.size_range} onChange={(e) => set("size_range", e.target.value)} /></div>
                        <div className="tna-field"><label>Total qty</label><input type="number" min="0" value={form.total_qty} onChange={(e) => set("total_qty", e.target.value)} /></div>
                        <div className="tna-field full"><label>Fabrication</label><input value={form.fabrication} onChange={(e) => set("fabrication", e.target.value)} /></div>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="tna-card" style={{ alignSelf: "start", position: "sticky", top: 96 }}>
                  <div className="tna-card-head">
                    <div>
                      <h2 className="tna-card-title">Plan preview</h2>
                      <p className="tna-card-sub">Calculated on save with these same rules.</p>
                    </div>
                  </div>
                  <div className="tna-card-body">
                    {planList.length === 0 ? (
                      <div className="tna-empty" style={{ padding: 18 }}>Enter fabric type, order booking and shipment dates to see the plan.</div>
                    ) : (
                      <ul className="tna-timeline">
                        {planList.map((m) => (
                          <li key={m.key} className={m.days < 0 ? "passed" : ""}>
                            <span className="tna-dot" />
                            <div>
                              <div className="tna-tl-label">{m.label}</div>
                              <div className="tna-tl-rule">{GROUP_LABEL[m.group]}{m.rule ? ` · ${m.rule}` : ""}</div>
                            </div>
                            <div className="tna-tl-date"><b>{fmtDate(m.date)}</b><span>{relDays(m.days)}</span></div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              </div>
            </div>
            <div className="tna-sticky-foot">
              <button type="button" className="tna-btn ghost" onClick={() => navigate(isEdit ? `/tna-details/${id}` : "/orders/tna")} disabled={saving}>Cancel</button>
              <button type="submit" className="tna-btn primary" disabled={saving}>
                {saving ? "Saving…" : <><FiSave /> {isEdit ? "Save changes" : "Create TNA"}</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

