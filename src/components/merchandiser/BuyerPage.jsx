// BuyerPage.jsx - Buyers list (route /buyers): search, department and
// customer filters, sorting, pagination, CSV export, view / edit / delete.
// Search, department and page are remembered in localStorage as before.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiBriefcase,
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiDownload,
  FiEdit2,
  FiEye,
  FiLayers,
  FiMail,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import { merchandiserApi } from "../../api/merchandiser";
import { AGENT_CSS, customerName, initialsOf } from "./agentTheme";

const STORAGE_KEYS = {
  SEARCH_TERM: "buyer_search_term",
  SELECTED_DEPARTMENT: "buyer_selected_department",
  CURRENT_PAGE: "buyer_current_page",
};

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const readLS = (k, fallback) => {
  try {
    return localStorage.getItem(k) ?? fallback;
  } catch {
    return fallback;
  }
};
const writeLS = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* storage blocked */
  }
};

// Distinct values of one row field, falling back to the legacy *_display lists.
const rowValues = (buyer, rowKey, displayKey, displayField) => {
  const fromRows = (buyer.rows || []).map((r) => r[rowKey]).filter(Boolean);
  const values = fromRows.length ? fromRows : (buyer[displayKey] || []).map((d) => d[displayField]).filter(Boolean);
  return [...new Set(values)];
};
const departmentsOf = (b) => rowValues(b, "department", "departments_display", "name");
const wgrsOf = (b) => rowValues(b, "wgr_number", "wgr_numbers_display", "wgr_number");
const itemsOf = (b) => rowValues(b, "item", "items_display", "name");
const categoriesOf = (b) => rowValues(b, "product_category", "product_categories_display", "name");

const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const Chips = ({ values, tone, max = 2 }) =>
  values.length === 0 ? (
    <span style={{ color: "#94a3b8" }}>—</span>
  ) : (
    <div className="ag-chips">
      {values.slice(0, max).map((v) => (
        <span key={v} className={`ag-chip ${tone}`}>
          {v}
        </span>
      ))}
      {values.length > max && (
        <span className="ag-chip more" title={values.slice(max).join(", ")}>
          +{values.length - max}
        </span>
      )}
    </div>
  );

export default function BuyerPage() {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState(() => readLS(STORAGE_KEYS.SEARCH_TERM, ""));
  const [selectedDepartment, setSelectedDepartment] = useState(() => readLS(STORAGE_KEYS.SELECTED_DEPARTMENT, "all"));
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [currentPage, setCurrentPage] = useState(() => parseInt(readLS(STORAGE_KEYS.CURRENT_PAGE, "1"), 10) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => writeLS(STORAGE_KEYS.SEARCH_TERM, searchTerm), [searchTerm]);
  useEffect(() => writeLS(STORAGE_KEYS.SELECTED_DEPARTMENT, selectedDepartment), [selectedDepartment]);
  useEffect(() => writeLS(STORAGE_KEYS.CURRENT_PAGE, String(currentPage)), [currentPage]);

  // Back to page 1 when filters change - but not on first render, so the
  // remembered page survives coming back from a buyer.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedCustomer, itemsPerPage]);

  const fetchData = async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [buyersRes, customersRes] = await Promise.all([merchandiserApi.get("buyer/"), merchandiserApi.get("customer/")]);
      setBuyers(asList(buyersRes.data));
      setCustomers(asList(customersRes.data));
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load buyers. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const customerById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const buyerCustomers = (b) => (b.customers || []).map((id) => customerById.get(id)).filter(Boolean);

  const departmentsList = useMemo(() => {
    const all = new Set();
    buyers.forEach((b) => departmentsOf(b).forEach((d) => all.add(d)));
    return [...all].sort();
  }, [buyers]);

  const linkedCustomers = useMemo(() => {
    const ids = new Set();
    buyers.forEach((b) => (b.customers || []).forEach((id) => ids.add(id)));
    return customers.filter((c) => ids.has(c.id)).sort((a, b) => customerName(a).localeCompare(customerName(b)));
  }, [buyers, customers]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = buyers.filter((b) => {
      if (selectedDepartment !== "all" && !departmentsOf(b).includes(selectedDepartment)) return false;
      if (selectedCustomer !== "all" && !(b.customers || []).includes(Number(selectedCustomer))) return false;
      if (!q) return true;
      return [b.name, b.email, b.phone, b.remarks, ...departmentsOf(b), ...wgrsOf(b), ...itemsOf(b), ...categoriesOf(b)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
    const value = (b) => {
      if (sort.key === "customers") return (b.customers || []).length;
      if (sort.key === "rows") return (b.rows || []).length;
      return String(b[sort.key] || "").toLowerCase();
    };
    return list.sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (sort.dir === "asc" ? 1 : -1);
    });
  }, [buyers, searchTerm, selectedDepartment, selectedCustomer, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  useEffect(() => {
    if (!loading && currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages, loading]);
  const first = (currentPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(first, first + itemsPerPage);

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" }));

  const hasFilters = searchTerm || selectedDepartment !== "all" || selectedCustomer !== "all";
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("all");
    setSelectedCustomer("all");
  };

  const handleDelete = async (buyer) => {
    if (!window.confirm(`Delete buyer "${buyer.name || "this buyer"}"? Its rows and customer links are removed too.`)) return;
    setDeletingId(buyer.id);
    setNotice(null);
    try {
      await merchandiserApi.delete(`buyer/${buyer.id}/`);
      setBuyers((prev) => prev.filter((b) => b.id !== buyer.id));
      setNotice({ ok: true, msg: `Deleted ${buyer.name || "buyer"}.` });
    } catch (err) {
      setNotice({ ok: false, msg: err.response?.data?.detail || "Failed to delete the buyer." });
    } finally {
      setDeletingId(null);
    }
  };

  const exportCSV = () => {
    const header = ["Name", "Email", "Phone", "Customers", "Departments", "WGR numbers", "Items", "Product categories", "Remarks"];
    const rows = filtered.map((b) => [
      b.name,
      b.email,
      b.phone,
      buyerCustomers(b).map(customerName).join("; "),
      departmentsOf(b).join("; "),
      wgrsOf(b).join("; "),
      itemsOf(b).join("; "),
      categoriesOf(b).join("; "),
      b.remarks,
    ]);
    const blob = new Blob(["﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buyers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const SortTh = ({ k, children }) => (
    <th className={`sortable ${sort.key === k ? "sorted" : ""}`} onClick={() => toggleSort(k)}>
      <span className="th">
        {children}
        {sort.key === k ? sort.dir === "asc" ? <FiChevronUp /> : <FiChevronDown /> : null}
      </span>
    </th>
  );

  const pageNumbers = () => {
    const count = Math.min(5, totalPages);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - count + 1));
    return Array.from({ length: count }, (_, i) => start + i);
  };

  const stats = [
    { label: "Buyers", value: buyers.length, icon: <FiUsers />, tone: "t-blue" },
    { label: "Departments", value: departmentsList.length, icon: <FiLayers />, tone: "t-amber" },
    { label: "Linked customers", value: linkedCustomers.length, icon: <FiBriefcase />, tone: "t-violet" },
    { label: "With email", value: buyers.filter((b) => b.email).length, icon: <FiMail />, tone: "t-green" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div className="ag-app">
        <style>{AGENT_CSS}</style>

        <header className="ag-header">
          <div>
            <div className="ag-eyebrow">Partners</div>
            <h1 className="ag-title">
              Buyers <span className="ag-count">{buyers.length}</span>
            </h1>
            <p className="ag-subtitle">Buyers, the customers they work with, and their departments, WGR numbers and items.</p>
          </div>
          <div className="ag-actions">
            <button type="button" className="ag-btn ghost" onClick={() => fetchData({ quiet: true })} disabled={refreshing}>
              <FiRefreshCw className={refreshing ? "ag-spin" : ""} /> Refresh
            </button>
            <button type="button" className="ag-btn ghost" onClick={exportCSV} disabled={filtered.length === 0}>
              <FiDownload /> Export CSV
            </button>
            <button type="button" className="ag-btn primary" onClick={() => navigate("/add-buyer")}>
              <FiPlus /> New Buyer
            </button>
          </div>
        </header>

        <div className="ag-body" style={{ maxWidth: 1600 }}>
          {notice && (
            <div className={`ag-alert ${notice.ok ? "ok" : "err"}`}>
              {notice.ok ? <FiCheck /> : <FiAlertTriangle />}
              <span>{notice.msg}</span>
              <button type="button" className="ag-icon-btn" onClick={() => setNotice(null)} title="Dismiss">
                <FiX />
              </button>
            </div>
          )}

          <div className="ag-kpis">
            {stats.map((s) => (
              <div key={s.label} className="ag-kpi">
                <span className={`ag-kpi-icon ${s.tone}`}>{s.icon}</span>
                <span>
                  <span className="ag-kpi-value">{loading ? "–" : s.value}</span>
                  <span className="ag-kpi-label">{s.label}</span>
                </span>
              </div>
            ))}
          </div>

          <section className="ag-card">
            <div className="ag-toolbar">
              <div className="ag-search">
                <FiSearch />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, contact, department, WGR, item…"
                />
                {searchTerm && (
                  <button type="button" className="clear" onClick={() => setSearchTerm("")} title="Clear">
                    <FiX />
                  </button>
                )}
              </div>
              <select
                className="ag-select"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                aria-label="Department"
              >
                <option value="all">All departments</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                className="ag-select"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                aria-label="Customer"
              >
                <option value="all">All customers</option>
                {linkedCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {customerName(c)}
                  </option>
                ))}
              </select>
              {hasFilters && (
                <button type="button" className="ag-btn ghost sm" onClick={clearAllFilters}>
                  <FiX /> Clear
                </button>
              )}
              <span className="ag-spacer" />
              <span className="ag-note">
                {filtered.length} of {buyers.length}
              </span>
            </div>

            {loading ? (
              <div className="ag-loading">
                <div className="ag-spinner" />
                Loading buyers…
              </div>
            ) : error ? (
              <div className="ag-state">
                <div className="ag-state-icon">
                  <FiAlertTriangle />
                </div>
                <h3>Couldn't load buyers</h3>
                <p>{error}</p>
                <button type="button" className="ag-btn ghost" onClick={() => fetchData()}>
                  <FiRefreshCw /> Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ag-state">
                <div className="ag-state-icon">
                  <FiUsers />
                </div>
                <h3>{buyers.length === 0 ? "No buyers yet" : "No buyers match"}</h3>
                <p>{buyers.length === 0 ? "Add your first buyer." : "Try a different search or filter."}</p>
                {buyers.length === 0 ? (
                  <button type="button" className="ag-btn primary" onClick={() => navigate("/add-buyer")}>
                    <FiPlus /> New Buyer
                  </button>
                ) : (
                  <button type="button" className="ag-btn ghost" onClick={clearAllFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="ag-table-wrap">
                  <table className="ag-table">
                    <thead>
                      <tr>
                        <SortTh k="name">Buyer</SortTh>
                        <SortTh k="email">Contact</SortTh>
                        <SortTh k="customers">Customers</SortTh>
                        <th>Departments</th>
                        <th>WGR</th>
                        <th>Items</th>
                        <th>Categories</th>
                        <th className="right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((b) => (
                        <tr key={b.id} onClick={() => navigate(`/buyer-details/${b.id}`)}>
                          <td>
                            <div className="ag-person">
                              <span className="ag-avatar">{initialsOf(b.name)}</span>
                              <span style={{ minWidth: 0 }}>
                                <span className="ag-name">{b.name || "Unnamed buyer"}</span>
                                {b.remarks && (
                                  <span className="ag-sub" title={b.remarks} style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {b.remarks}
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {b.email && (
                              <a className="ag-contact" href={`mailto:${b.email}`}>
                                <FiMail /> {b.email}
                              </a>
                            )}
                            {b.phone && (
                              <a className="ag-contact" href={`tel:${b.phone}`} style={{ display: "flex", marginTop: b.email ? 3 : 0 }}>
                                <FiPhone /> {b.phone}
                              </a>
                            )}
                            {!b.email && !b.phone && <span style={{ color: "#94a3b8" }}>—</span>}
                          </td>
                          <td>
                            <Chips values={buyerCustomers(b).map(customerName)} tone="blue" />
                          </td>
                          <td>
                            <Chips values={departmentsOf(b)} tone="amber" />
                          </td>
                          <td>
                            <Chips values={wgrsOf(b)} tone="" max={3} />
                          </td>
                          <td>
                            <Chips values={itemsOf(b)} tone="violet" />
                          </td>
                          <td>
                            <Chips values={categoriesOf(b)} tone="green" />
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="ag-row-actions">
                              <button type="button" className="ag-icon-btn" title="View" onClick={() => navigate(`/buyer-details/${b.id}`)}>
                                <FiEye />
                              </button>
                              <button type="button" className="ag-icon-btn" title="Edit" onClick={() => navigate(`/edit-buyer/${b.id}`)}>
                                <FiEdit2 />
                              </button>
                              <button
                                type="button"
                                className="ag-icon-btn danger"
                                title="Delete"
                                disabled={deletingId === b.id}
                                onClick={() => handleDelete(b)}
                              >
                                {deletingId === b.id ? <span className="ag-spinner sm" /> : <FiTrash2 />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="ag-pagination">
                  <div className="ag-page-info">
                    Showing <strong>{first + 1}</strong>–<strong>{Math.min(first + itemsPerPage, filtered.length)}</strong> of{" "}
                    <strong>{filtered.length}</strong>
                    <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} aria-label="Rows per page">
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n} / page
                        </option>
                      ))}
                    </select>
                  </div>
                  {totalPages > 1 && (
                    <div className="ag-pages">
                      <button type="button" className="ag-page" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} title="Previous">
                        <FiChevronLeft />
                      </button>
                      {pageNumbers().map((n) => (
                        <button key={n} type="button" className={`ag-page ${n === currentPage ? "active" : ""}`} onClick={() => setCurrentPage(n)}>
                          {n}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="ag-page"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        title="Next"
                      >
                        <FiChevronRight />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
