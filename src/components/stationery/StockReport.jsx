// src/components/stationery/StockReport.jsx
//
// Stock Report: stock health, what to reorder (suggested quantity and cost)
// and the full stock list with priority. Search / filter / sort, CSV export
// and print. Shared look: stationeryTheme.js.
//
// Values use the item's real price_per_unit in BDT; items without a price add
// nothing (the old version read a non-existent unit_price and assumed $10).
import React, { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiDollarSign,
  FiDownload,
  FiPrinter,
  FiRefreshCw,
  FiSearch,
  FiShoppingCart,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import stationeryAPI, { getStockStatus } from "../../api/stationery";
import { downloadCSV, formatBDT, todayStamp } from "./stationeryShared";
import { STATIONERY_CSS, STOCK_COLOR, STOCK_TONE, apiError, stockRatio } from "./stationeryTheme";

// 3 = at/below reorder level, 2 = below 2x reorder level, 1 = healthy
const getPriorityLevel = (item) => {
  const stock = Number(item.current_stock || 0);
  const reorder = Number(item.reorder_level || 0);
  if (stock <= reorder) return 3;
  if (stock <= reorder * 2) return 2;
  return 1;
};
const PRIORITY = {
  3: { label: "High", tone: "red" },
  2: { label: "Medium", tone: "amber" },
  1: { label: "Low", tone: "green" },
};

const hasPrice = (item) => item.price_per_unit !== null && item.price_per_unit !== undefined && item.price_per_unit !== "";
const valueOf = (item) => (hasPrice(item) ? Number(item.current_stock || 0) * Number(item.price_per_unit) : 0);
// Order enough to get back to 3x the reorder level (same rule as before).
const suggestedQty = (item) => Math.max(0, Number(item.reorder_level || 0) * 3 - Number(item.current_stock || 0));

const StockReport = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [sortOrder, setSortOrder] = useState("desc");
  const [expandedItem, setExpandedItem] = useState(null);

  const fetchItems = async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    try {
      const data = await stationeryAPI.fetchItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching items:", error);
      setLoadError(apiError(error, "Could not load stock data."));
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
      if (q && !`${item.name || ""} ${item.description || ""} ${item.category || ""}`.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && getStockStatus(item).label !== statusFilter) return false;
      return true;
    });
    const key = (i) => {
      if (sortBy === "priority") return getPriorityLevel(i) * 1e9 - Number(i.current_stock || 0); // ties: lowest stock first
      if (sortBy === "stock") return Number(i.current_stock || 0);
      if (sortBy === "value") return valueOf(i);
      return (i.name || "").toLowerCase();
    };
    return list.sort((a, b) => {
      const av = key(a);
      const bv = key(b);
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (sortOrder === "asc" ? 1 : -1);
    });
  }, [items, searchTerm, statusFilter, sortBy, sortOrder]);

  const stats = useMemo(() => {
    let inStock = 0;
    let low = 0;
    let out = 0;
    let critical = 0;
    items.forEach((item) => {
      const label = getStockStatus(item).label;
      if (label === "In Stock") inStock++;
      else if (label === "Low Stock") {
        low++;
        if (Number(item.current_stock || 0) <= Number(item.reorder_level || 0) * 0.5) critical++;
      } else if (label === "Out of Stock") {
        out++;
        critical++;
      }
    });
    const reorderList = items
      .filter((i) => getPriorityLevel(i) === 3)
      .sort((a, b) => Number(a.current_stock || 0) - Number(b.current_stock || 0));
    const reorderCost = reorderList.reduce((s, i) => s + (hasPrice(i) ? suggestedQty(i) * Number(i.price_per_unit) : 0), 0);
    return {
      total: items.length,
      inStock,
      low,
      out,
      critical,
      value: items.reduce((s, i) => s + valueOf(i), 0),
      unpriced: items.filter((i) => !hasPrice(i)).length,
      reorderList,
      reorderCost,
      reorderUnpriced: reorderList.filter((i) => !hasPrice(i)).length,
      healthScore:
        items.length === 0 ? 100 : Math.max(0, Math.min(100, Math.round(((inStock - critical * 0.5) / items.length) * 100))),
    };
  }, [items]);

  const toggleSort = (k) => {
    if (sortBy === k) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(k);
      setSortOrder(k === "name" ? "asc" : "desc");
    }
  };

  const exportReportCSV = () =>
    downloadCSV(`stationery-stock-report-${todayStamp()}.csv`, filteredItems, [
      { label: "Item", get: (i) => i.name },
      { label: "Unit", get: (i) => i.unit },
      { label: "Current stock", get: (i) => i.current_stock },
      { label: "Reorder level", get: (i) => i.reorder_level },
      { label: "Status", get: (i) => getStockStatus(i).label },
      { label: "Priority", get: (i) => PRIORITY[getPriorityLevel(i)].label },
      { label: "Suggested order qty", get: (i) => (getPriorityLevel(i) === 3 ? suggestedQty(i) : 0) },
      { label: "Price per unit (BDT)", get: (i) => i.price_per_unit },
      { label: "Stock value (BDT)", get: (i) => (hasPrice(i) ? valueOf(i) : "") },
    ]);

  if (loading) {
    return (
      <div className="sp-app">
        <style>{STATIONERY_CSS}</style>
        <div className="sp-loading">
          <div className="sp-spinner" />
          Loading stock report…
        </div>
      </div>
    );
  }

  const healthTone = stats.healthScore >= 75 ? "green" : stats.healthScore >= 50 ? "amber" : "red";
  const SortTh = ({ k, children, className = "" }) => (
    <th className={`sortable ${sortBy === k ? "sorted" : ""} ${className}`} onClick={() => toggleSort(k)}>
      <span className="th">
        {children}
        {sortBy === k ? sortOrder === "asc" ? <FiChevronUp /> : <FiChevronDown /> : null}
      </span>
    </th>
  );

  return (
    <div className="sp-app">
      <style>{STATIONERY_CSS}</style>

      <header className="sp-header">
        <div>
          <div className="sp-eyebrow">Stationery</div>
          <h1 className="sp-title">Stock Report</h1>
          <p className="sp-subtitle">
            {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} · {stats.total} items
          </p>
        </div>
        <div className="sp-actions">
          <button type="button" className="sp-btn ghost" onClick={() => fetchItems({ quiet: true })} disabled={refreshing}>
            <FiRefreshCw className={refreshing ? "sp-spin" : ""} /> Refresh
          </button>
          <button type="button" className="sp-btn ghost" onClick={() => window.print()}>
            <FiPrinter /> Print
          </button>
          <button type="button" className="sp-btn primary" onClick={exportReportCSV} disabled={filteredItems.length === 0}>
            <FiDownload /> Export CSV
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

        <div className="sp-kpis">
          <div className={`sp-kpi k-${healthTone}`}>
            <span className="sp-kpi-icon">
              <FiActivity />
            </span>
            <span>
              <span className="sp-kpi-value">{stats.healthScore}%</span>
              <span className="sp-kpi-label">Stock health</span>
              <span className="sp-kpi-hint">{stats.critical} critical item(s)</span>
            </span>
          </div>
          <div className="sp-kpi k-blue">
            <span className="sp-kpi-icon">
              <FiDollarSign />
            </span>
            <span>
              <span className="sp-kpi-value">{formatBDT(stats.value)}</span>
              <span className="sp-kpi-label">Stock value</span>
              <span className="sp-kpi-hint">
                {stats.unpriced > 0 ? `${stats.unpriced} item(s) without a price` : "All items priced"}
              </span>
            </span>
          </div>
          <button
            type="button"
            className={`sp-kpi k-amber ${statusFilter === "Low Stock" ? "active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "Low Stock" ? "all" : "Low Stock")}
          >
            <span className="sp-kpi-icon">
              <FiAlertTriangle />
            </span>
            <span>
              <span className="sp-kpi-value">{stats.low}</span>
              <span className="sp-kpi-label">Low stock</span>
            </span>
          </button>
          <button
            type="button"
            className={`sp-kpi k-red ${statusFilter === "Out of Stock" ? "active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "Out of Stock" ? "all" : "Out of Stock")}
          >
            <span className="sp-kpi-icon">
              <FiXCircle />
            </span>
            <span>
              <span className="sp-kpi-value">{stats.out}</span>
              <span className="sp-kpi-label">Out of stock</span>
            </span>
          </button>
        </div>

        {/* Reorder list */}
        <section className="sp-card" style={{ marginBottom: 16 }}>
          <div className="sp-card-head">
            <h2>
              <FiShoppingCart /> Reorder list <span className="sp-count">{stats.reorderList.length}</span>
            </h2>
            <span className="muted small">
              Estimated cost <b className="strong">{formatBDT(stats.reorderCost)}</b>
              {stats.reorderUnpriced > 0 && ` · ${stats.reorderUnpriced} without a price`}
            </span>
          </div>
          {stats.reorderList.length === 0 ? (
            <div className="sp-state" style={{ padding: "28px 16px" }}>
              <p style={{ margin: 0 }}>Nothing to reorder — every item is above its reorder level.</p>
            </div>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num">In stock</th>
                    <th className="num">Reorder at</th>
                    <th className="num">Suggested order</th>
                    <th className="num">Price</th>
                    <th className="num">Est. cost</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.reorderList.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <span className="strong">{i.name}</span>{" "}
                        <span className={`sp-pill ${STOCK_TONE[getStockStatus(i).label]}`} style={{ marginLeft: 6 }}>
                          {getStockStatus(i).label}
                        </span>
                      </td>
                      <td className="num">
                        {i.current_stock ?? 0} <span className="muted small">{i.unit}</span>
                      </td>
                      <td className="num">{i.reorder_level ?? "—"}</td>
                      <td className="num strong">
                        {suggestedQty(i)} <span className="muted small">{i.unit}</span>
                      </td>
                      <td className="num">{hasPrice(i) ? formatBDT(i.price_per_unit) : <span className="faint">—</span>}</td>
                      <td className="num">
                        {hasPrice(i) ? formatBDT(suggestedQty(i) * Number(i.price_per_unit)) : <span className="faint">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Full stock list */}
        <section className="sp-card">
          <div className="sp-card-head">
            <h2>All items</h2>
          </div>
          <div className="sp-toolbar">
            <div className="sp-search">
              <FiSearch />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search items" />
              {searchTerm && (
                <button type="button" className="clear" onClick={() => setSearchTerm("")} title="Clear">
                  <FiX />
                </button>
              )}
            </div>
            <select className="sp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status">
              <option value="all">All statuses</option>
              <option value="In Stock">In stock</option>
              <option value="Low Stock">Low stock</option>
              <option value="Out of Stock">Out of stock</option>
            </select>
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
              <option value="priority:desc">Priority (urgent first)</option>
              <option value="stock:asc">Lowest stock first</option>
              <option value="value:desc">Highest value first</option>
              <option value="name:asc">Name A–Z</option>
            </select>
            <span className="sp-spacer" />
            <span className="sp-note">
              {filteredItems.length} of {items.length}
            </span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="sp-state">
              <h3>No items match</h3>
              <p>Try a different search or status.</p>
            </div>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <SortTh k="name">Item</SortTh>
                    <SortTh k="stock" className="num">
                      In stock
                    </SortTh>
                    <th>Level</th>
                    <th className="num">Reorder at</th>
                    <SortTh k="value" className="num">
                      Value
                    </SortTh>
                    <th>Status</th>
                    <SortTh k="priority">Priority</SortTh>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const status = getStockStatus(item).label;
                    const priority = PRIORITY[getPriorityLevel(item)];
                    const open = expandedItem === item.id;
                    return (
                      <React.Fragment key={item.id}>
                        <tr className={`row ${open ? "open" : ""}`} onClick={() => setExpandedItem(open ? null : item.id)}>
                          <td>
                            <span className="strong">{item.name}</span>
                            {item.description && <span className="sp-cell-sub sp-clamp">{item.description}</span>}
                          </td>
                          <td className="num nowrap">
                            <span className="strong">{item.current_stock ?? 0}</span>{" "}
                            <span className="muted small">{item.unit}</span>
                          </td>
                          <td>
                            <div className="sp-meter">
                              <div className="track">
                                <span style={{ width: `${stockRatio(item) * 100}%`, background: STOCK_COLOR[status] }} />
                              </div>
                            </div>
                          </td>
                          <td className="num">{item.reorder_level ?? "—"}</td>
                          <td className="num">{hasPrice(item) ? formatBDT(valueOf(item)) : <span className="faint">No price</span>}</td>
                          <td>
                            <span className={`sp-pill ${STOCK_TONE[status] || "gray"}`}>{status}</span>
                          </td>
                          <td>
                            <span className={`sp-pill ${priority.tone}`}>{priority.label}</span>
                          </td>
                        </tr>
                        {open && (
                          <tr className="sp-detail">
                            <td colSpan={7}>
                              <div className="sp-detail-grid">
                                <div>
                                  <div className="k">Description</div>
                                  <div className="v">{item.description || "—"}</div>
                                </div>
                                <div>
                                  <div className="k">Suggested order</div>
                                  <div className="v">
                                    {getPriorityLevel(item) === 3
                                      ? `${suggestedQty(item)} ${item.unit} (to 3× reorder level)`
                                      : "Not needed yet"}
                                  </div>
                                </div>
                                <div>
                                  <div className="k">Price per unit</div>
                                  <div className="v">{hasPrice(item) ? formatBDT(item.price_per_unit) : "No price set"}</div>
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
    </div>
  );
};

export default StockReport;
