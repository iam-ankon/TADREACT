// src/components/stationery/StationeryItems.jsx
//
// Inventory: the stationery catalogue with stock levels. Add / edit / delete
// items, search, filter by stock status, sort, list or grid view, CSV export.
// Shared look: stationeryTheme.js; sidebar: StationeryLayout (App.jsx).
import React, { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiEdit2,
  FiGrid,
  FiList,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import stationeryAPI, { getStockStatus } from "../../api/stationery";
import { downloadCSV, formatBDT, todayStamp } from "./stationeryShared";
import { STATIONERY_CSS, STOCK_COLOR, STOCK_TONE, apiError, stockRatio } from "./stationeryTheme";

const UNITS = [
  { value: "pcs", label: "Pieces" },
  { value: "box", label: "Box" },
  { value: "packet", label: "Packet" },
  { value: "ream", label: "Ream" },
  { value: "bottle", label: "Bottle" },
  { value: "pack", label: "Pack" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  unit: "pcs",
  current_stock: 0,
  reorder_level: 10,
  price_per_unit: "",
};

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "In Stock", label: "In stock" },
  { key: "Low Stock", label: "Low" },
  { key: "Out of Stock", label: "Out" },
];

const hasPrice = (item) => item.price_per_unit !== null && item.price_per_unit !== undefined && item.price_per_unit !== "";

// ── Add / Edit modal ─────────────────────────────────────────────────────────
const ItemFormModal = ({ item, onClose, onSaved }) => {
  const isEdit = !!item;
  const [form, setForm] = useState(
    isEdit
      ? {
          name: item.name || "",
          description: item.description || "",
          unit: item.unit || "pcs",
          current_stock: item.current_stock ?? 0,
          reorder_level: item.reorder_level ?? 10,
          price_per_unit: hasPrice(item) ? item.price_per_unit : "",
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const units = UNITS.some((u) => u.value === form.unit)
    ? UNITS
    : [...UNITS, { value: form.unit, label: form.unit }];

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErr("Item name is required.");
      return;
    }
    setSaving(true);
    setErr(null);
    const payload = {
      name: form.name.trim(),
      description: form.description,
      unit: form.unit,
      current_stock: parseInt(form.current_stock, 10) || 0,
      reorder_level: parseInt(form.reorder_level, 10) || 0,
      price_per_unit: form.price_per_unit === "" ? null : form.price_per_unit,
    };
    try {
      if (isEdit) await stationeryAPI.updateItem(item.id, payload);
      else await stationeryAPI.addItem(payload);
      onSaved();
      onClose();
    } catch (ex) {
      setErr(apiError(ex, "Could not save the item. Please try again."));
      setSaving(false);
    }
  };

  return (
    <div className="sp-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <form className="sp-modal" style={{ maxWidth: 580 }} onSubmit={submit}>
        <div className="sp-modal-head">
          <div>
            <h2>{isEdit ? "Edit Item" : "Add New Item"}</h2>
            <p>{isEdit ? item.name : "Add a stationery item to the catalogue."}</p>
          </div>
          <button type="button" className="sp-icon-btn" onClick={onClose} title="Close">
            <FiX />
          </button>
        </div>
        <div className="sp-modal-body">
          {err && (
            <div className="sp-alert err">
              <FiAlertTriangle />
              <span>{err}</span>
            </div>
          )}
          <div className="sp-field-grid">
            <div className="sp-field">
              <label>
                Item Name <span className="req">*</span>
              </label>
              <input
                className="sp-input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. A4 Paper"
                required
                autoFocus
              />
            </div>
            <div className="sp-field">
              <label>Unit</label>
              <select className="sp-input" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
                {units.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="sp-field-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div className="sp-field">
              <label>Current Stock</label>
              <input
                className="sp-input"
                type="number"
                min="0"
                value={form.current_stock}
                onChange={(e) => set("current_stock", e.target.value)}
              />
            </div>
            <div className="sp-field">
              <label>Reorder Level</label>
              <input
                className="sp-input"
                type="number"
                min="0"
                value={form.reorder_level}
                onChange={(e) => set("reorder_level", e.target.value)}
              />
            </div>
            <div className="sp-field">
              <label>Price / Unit (৳)</label>
              <input
                className="sp-input"
                type="number"
                min="0"
                step="0.01"
                value={form.price_per_unit}
                onChange={(e) => set("price_per_unit", e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="sp-hint" style={{ marginTop: -8, marginBottom: 14 }}>
            The item shows as <b>Low Stock</b> once stock drops to the reorder level. The price is used for stock value.
          </div>
          <div className="sp-field" style={{ marginBottom: 0 }}>
            <label>Description</label>
            <textarea
              className="sp-input"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <div className="sp-modal-foot">
          <button type="button" className="sp-btn ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="sp-btn primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Item"}
          </button>
        </div>
      </form>
    </div>
  );
};

const StockMeter = ({ item, status }) => (
  <div className="sp-meter" title={`Reorder level: ${item.reorder_level ?? "—"}`}>
    <div className="track">
      <span style={{ width: `${stockRatio(item) * 100}%`, background: STOCK_COLOR[status] || "#94a3b8" }} />
    </div>
  </div>
);

// ── Page ─────────────────────────────────────────────────────────────────────
const StationeryItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [formItem, setFormItem] = useState(undefined); // undefined = closed, null = new, object = edit
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [expandedItem, setExpandedItem] = useState(null);
  const [viewMode, setViewMode] = useState("list");

  const fetchItems = async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    try {
      const data = await stationeryAPI.fetchItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching items:", error);
      setLoadError(apiError(error, "Could not load the inventory."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = items.filter((item) => {
      if (q && !`${item.name || ""} ${item.description || ""}`.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && getStockStatus(item).label !== statusFilter) return false;
      return true;
    });
    const value = (i) => {
      if (sortBy === "stock") return Number(i.current_stock || 0);
      if (sortBy === "value") return hasPrice(i) ? Number(i.current_stock || 0) * Number(i.price_per_unit) : -1;
      if (sortBy === "reorder") return Number(i.reorder_level || 0);
      return (i.name || "").toLowerCase();
    };
    return list.sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (sortOrder === "asc" ? 1 : -1);
    });
  }, [items, searchTerm, statusFilter, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const count = (label) => items.filter((i) => getStockStatus(i).label === label).length;
    const priced = items.filter(hasPrice);
    return {
      total: items.length,
      inStock: count("In Stock"),
      low: count("Low Stock"),
      out: count("Out of Stock"),
      value: priced.reduce((s, i) => s + Number(i.current_stock || 0) * Number(i.price_per_unit || 0), 0),
      unpriced: items.length - priced.length,
    };
  }, [items]);

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?\nIts request and stock history is deleted with it.`)) return;
    setDeletingId(item.id);
    setActionError(null);
    try {
      await stationeryAPI.deleteItem(item.id);
      fetchItems({ quiet: true });
    } catch (error) {
      setActionError(apiError(error, "Could not delete the item."));
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSort = (key) => {
    if (sortBy === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortOrder(key === "name" ? "asc" : "desc");
    }
  };

  const exportItemsCSV = () =>
    downloadCSV(`stationery-inventory-${todayStamp()}.csv`, filteredItems, [
      { label: "Item", get: (i) => i.name },
      { label: "Description", get: (i) => i.description },
      { label: "Unit", get: (i) => i.unit },
      { label: "Current stock", get: (i) => i.current_stock },
      { label: "Reorder level", get: (i) => i.reorder_level },
      { label: "Price per unit (BDT)", get: (i) => i.price_per_unit },
      { label: "Status", get: (i) => getStockStatus(i).label },
    ]);

  if (loading) {
    return (
      <div className="sp-app">
        <style>{STATIONERY_CSS}</style>
        <div className="sp-loading">
          <div className="sp-spinner" />
          Loading inventory…
        </div>
      </div>
    );
  }

  const SortTh = ({ k, children, className = "" }) => (
    <th className={`sortable ${sortBy === k ? "sorted" : ""} ${className}`} onClick={() => toggleSort(k)}>
      <span className="th">
        {children}
        {sortBy === k ? sortOrder === "asc" ? <FiChevronUp /> : <FiChevronDown /> : null}
      </span>
    </th>
  );

  const kpis = [
    { key: "all", label: "Items", value: stats.total, icon: <FiPackage />, tone: "blue" },
    { key: "In Stock", label: "In stock", value: stats.inStock, icon: <FiCheckCircle />, tone: "green" },
    { key: "Low Stock", label: "Low stock", value: stats.low, icon: <FiAlertTriangle />, tone: "amber" },
    { key: "Out of Stock", label: "Out of stock", value: stats.out, icon: <FiXCircle />, tone: "red" },
  ];

  return (
    <div className="sp-app">
      <style>{STATIONERY_CSS}</style>

      <header className="sp-header">
        <div>
          <div className="sp-eyebrow">Stationery</div>
          <h1 className="sp-title">
            Inventory <span className="sp-count">{items.length}</span>
          </h1>
          <p className="sp-subtitle">
            Stock value {formatBDT(stats.value)}
            {stats.unpriced > 0 && ` · ${stats.unpriced} item(s) without a price`}
          </p>
        </div>
        <div className="sp-actions">
          <button type="button" className="sp-btn ghost" onClick={() => fetchItems({ quiet: true })} disabled={refreshing}>
            <FiRefreshCw className={refreshing ? "sp-spin" : ""} /> Refresh
          </button>
          <button type="button" className="sp-btn ghost" onClick={exportItemsCSV} disabled={filteredItems.length === 0}>
            <FiDownload /> Export CSV
          </button>
          <button type="button" className="sp-btn primary" onClick={() => setFormItem(null)}>
            <FiPlus /> Add Item
          </button>
        </div>
      </header>

      <div className="sp-body">
        {loadError && (
          <div className="sp-alert err">
            <FiAlertTriangle />
            <span>{loadError}</span>
            <button type="button" className="sp-btn ghost sm" onClick={() => fetchItems()}>
              Retry
            </button>
          </div>
        )}
        {actionError && (
          <div className="sp-alert err">
            <FiAlertTriangle />
            <span>{actionError}</span>
            <button type="button" className="sp-icon-btn" onClick={() => setActionError(null)} title="Dismiss">
              <FiX />
            </button>
          </div>
        )}

        <div className="sp-kpis">
          {kpis.map((k) => (
            <button
              key={k.key}
              type="button"
              className={`sp-kpi k-${k.tone} ${statusFilter === k.key && k.key !== "all" ? "active" : ""}`}
              onClick={() => setStatusFilter(k.key === "all" || statusFilter === k.key ? "all" : k.key)}
            >
              <span className="sp-kpi-icon">{k.icon}</span>
              <span>
                <span className="sp-kpi-value">{k.value}</span>
                <span className="sp-kpi-label">{k.label}</span>
              </span>
            </button>
          ))}
        </div>

        <section className="sp-card">
          <div className="sp-toolbar">
            <div className="sp-search">
              <FiSearch />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or description"
              />
              {searchTerm && (
                <button type="button" className="clear" onClick={() => setSearchTerm("")} title="Clear">
                  <FiX />
                </button>
              )}
            </div>
            <div className="sp-seg" aria-label="Stock status">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={statusFilter === f.key ? "on" : ""}
                  onClick={() => setStatusFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <select
              className="sp-select"
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [k, o] = e.target.value.split(":");
                setSortBy(k);
                setSortOrder(o);
              }}
              aria-label="Sort"
            >
              <option value="name:asc">Name A–Z</option>
              <option value="name:desc">Name Z–A</option>
              <option value="stock:asc">Lowest stock first</option>
              <option value="stock:desc">Highest stock first</option>
              <option value="value:desc">Highest value first</option>
            </select>
            <span className="sp-spacer" />
            <span className="sp-note">
              {filteredItems.length} of {items.length}
            </span>
            <div className="sp-seg" aria-label="View">
              <button type="button" className={viewMode === "list" ? "on" : ""} onClick={() => setViewMode("list")} title="List">
                <FiList />
              </button>
              <button type="button" className={viewMode === "grid" ? "on" : ""} onClick={() => setViewMode("grid")} title="Grid">
                <FiGrid />
              </button>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="sp-state">
              <div className="sp-state-icon">
                <FiPackage />
              </div>
              <h3>{items.length === 0 ? "No items yet" : "No items match"}</h3>
              <p>{items.length === 0 ? "Add your first stationery item." : "Try a different search or filter."}</p>
              {items.length === 0 ? (
                <button type="button" className="sp-btn primary" onClick={() => setFormItem(null)}>
                  <FiPlus /> Add Item
                </button>
              ) : (
                <button
                  type="button"
                  className="sp-btn ghost"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="sp-grid">
              {filteredItems.map((item) => {
                const status = getStockStatus(item).label;
                return (
                  <div key={item.id} className="sp-tile" style={{ "--accent": STOCK_COLOR[status] }}>
                    <div className="sp-tile-top">
                      <span className="sp-tile-icon">
                        <FiPackage />
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3>{item.name}</h3>
                        {item.description && <span className="sp-cell-sub sp-clamp">{item.description}</span>}
                      </div>
                      <span className={`sp-pill ${STOCK_TONE[status] || "gray"}`}>{status}</span>
                    </div>
                    <div className="sp-tile-stats">
                      <div>
                        <div className="k">In stock</div>
                        <div className="v">
                          {item.current_stock ?? 0} <span className="muted small">{item.unit}</span>
                        </div>
                      </div>
                      <div>
                        <div className="k">Reorder</div>
                        <div className="v">{item.reorder_level ?? "—"}</div>
                      </div>
                      <div>
                        <div className="k">Value</div>
                        <div className="v small">
                          {hasPrice(item) ? formatBDT(Number(item.current_stock || 0) * Number(item.price_per_unit)) : "—"}
                        </div>
                      </div>
                    </div>
                    <StockMeter item={item} status={status} />
                    <div className="sp-tile-foot">
                      <span className="muted small">
                        {hasPrice(item) ? `${formatBDT(item.price_per_unit)} / ${item.unit}` : "No price set"}
                      </span>
                      <span className="sp-actions-cell">
                        <button type="button" className="sp-icon-btn" title="Edit" onClick={() => setFormItem(item)}>
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          className="sp-icon-btn danger"
                          title="Delete"
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item)}
                        >
                          {deletingId === item.id ? <span className="sp-spinner sm" /> : <FiTrash2 />}
                        </button>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <SortTh k="name">Item</SortTh>
                    <th>Unit</th>
                    <SortTh k="stock" className="num">
                      In stock
                    </SortTh>
                    <th>Level</th>
                    <SortTh k="reorder" className="num">
                      Reorder at
                    </SortTh>
                    <th className="num">Price</th>
                    <SortTh k="value" className="num">
                      Value
                    </SortTh>
                    <th>Status</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const status = getStockStatus(item).label;
                    const open = expandedItem === item.id;
                    return (
                      <React.Fragment key={item.id}>
                        <tr className={`row ${open ? "open" : ""}`} onClick={() => setExpandedItem(open ? null : item.id)}>
                          <td>
                            <span className="strong">{item.name}</span>
                            {item.description && <span className="sp-cell-sub sp-clamp">{item.description}</span>}
                          </td>
                          <td className="muted">{item.unit || "—"}</td>
                          <td className="num strong">{item.current_stock ?? 0}</td>
                          <td>
                            <StockMeter item={item} status={status} />
                          </td>
                          <td className="num">{item.reorder_level ?? "—"}</td>
                          <td className="num">{hasPrice(item) ? formatBDT(item.price_per_unit) : <span className="faint">—</span>}</td>
                          <td className="num">
                            {hasPrice(item) ? (
                              formatBDT(Number(item.current_stock || 0) * Number(item.price_per_unit))
                            ) : (
                              <span className="faint">—</span>
                            )}
                          </td>
                          <td>
                            <span className={`sp-pill ${STOCK_TONE[status] || "gray"}`}>{status}</span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="sp-actions-cell">
                              <button type="button" className="sp-icon-btn" title="Edit" onClick={() => setFormItem(item)}>
                                <FiEdit2 />
                              </button>
                              <button
                                type="button"
                                className="sp-icon-btn danger"
                                title="Delete"
                                disabled={deletingId === item.id}
                                onClick={() => handleDelete(item)}
                              >
                                {deletingId === item.id ? <span className="sp-spinner sm" /> : <FiTrash2 />}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {open && (
                          <tr className="sp-detail">
                            <td colSpan={9}>
                              <div className="sp-detail-grid">
                                <div>
                                  <div className="k">Description</div>
                                  <div className="v">{item.description || "—"}</div>
                                </div>
                                <div>
                                  <div className="k">Stock vs reorder level</div>
                                  <div className="v">
                                    {item.current_stock ?? 0} {item.unit} in stock · reorder at {item.reorder_level ?? "—"}
                                  </div>
                                </div>
                                <div>
                                  <div className="k">Suggested reorder</div>
                                  <div className="v">
                                    {status === "In Stock"
                                      ? "Not needed"
                                      : `${Math.max(0, Number(item.reorder_level || 0) * 3 - Number(item.current_stock || 0))} ${item.unit} (to 3× reorder level)`}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {formItem !== undefined && (
        <ItemFormModal item={formItem} onClose={() => setFormItem(undefined)} onSaved={() => fetchItems({ quiet: true })} />
      )}
    </div>
  );
};

export default StationeryItems;
