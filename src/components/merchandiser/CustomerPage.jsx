// CustomerPage.jsx - Customers list (route /customers): search, quick
// filters, sorting, pagination, CSV export, view / edit / delete.
// Uses the authenticated merchandiser API (the list is scoped per user).
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiBriefcase,
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiClipboard,
  FiDownload,
  FiEdit2,
  FiEye,
  FiMail,
  FiPackage,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import CustomerDeleteModal from "./CustomerDeleteModal.jsx";
import { merchandiserApi } from "../../api/merchandiser";
import { AGENT_CSS, customerName, initialsOf } from "./agentTheme";

const asList = (data) => (Array.isArray(data) ? data : data?.results || data?.data || []);
const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "withOrders", label: "With orders" },
  { key: "withBuyers", label: "With buyers" },
  { key: "noEmail", label: "No email" },
];

export default function CustomerPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState({ key: "orders", dir: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [deleting, setDeleting] = useState(null);

  const fetchData = async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [custRes, buyerRes] = await Promise.all([
        merchandiserApi.get("customer/"),
        merchandiserApi.get("buyer/").catch(() => ({ data: [] })),
      ]);
      setCustomers(asList(custRes.data));
      setBuyers(asList(buyerRes.data));
    } catch (err) {
      console.error(err);
      setError("Failed to load customers. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // customer id -> buyers linked to it (customers carry no buyer list themselves)
  const buyersByCustomer = useMemo(() => {
    const map = new Map();
    buyers.forEach((b) =>
      (b.customers || []).forEach((cid) => {
        if (!map.has(cid)) map.set(cid, []);
        map.get(cid).push(b);
      }),
    );
    return map;
  }, [buyers]);
  const buyersOf = (c) => buyersByCustomer.get(c.id) || [];

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = customers.filter((c) => {
      if (filter === "withOrders" && !(c.order_count > 0)) return false;
      if (filter === "withBuyers" && buyersOf(c).length === 0) return false;
      if (filter === "noEmail" && c.email) return false;
      if (!q) return true;
      return [customerName(c), c.customer_code, c.email, c.phone, c.address]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
    const value = (c) => {
      if (sort.key === "orders") return c.order_count || 0;
      if (sort.key === "inquiries") return c.inquiry_count || 0;
      if (sort.key === "buyers") return buyersOf(c).length;
      if (sort.key === "code") return (c.customer_code || "").toLowerCase();
      return customerName(c).toLowerCase();
    };
    return list.sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av === bv) return customerName(a).localeCompare(customerName(b));
      return (av > bv ? 1 : -1) * (sort.dir === "asc" ? 1 : -1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, searchTerm, filter, sort, buyersByCustomer]);

  useEffect(() => setCurrentPage(1), [searchTerm, filter, perPage]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  const first = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(first, first + perPage);

  const toggleSort = (key) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" || key === "code" ? "asc" : "desc" },
    );

  const totals = useMemo(
    () => ({
      orders: customers.reduce((s, c) => s + (c.order_count || 0), 0),
      inquiries: customers.reduce((s, c) => s + (c.inquiry_count || 0), 0),
      withBuyers: customers.filter((c) => buyersOf(c).length > 0).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customers, buyersByCustomer],
  );

  const exportCSV = () => {
    const header = ["Customer", "Code", "Email", "Phone", "Address", "Orders", "Inquiries", "Buyers", "Remarks"];
    const rows = filtered.map((c) => [
      customerName(c),
      c.customer_code,
      c.email,
      c.phone,
      c.address,
      c.order_count,
      c.inquiry_count,
      buyersOf(c)
        .map((b) => b.name)
        .join("; "),
      c.remarks,
    ]);
    const blob = new Blob(["﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const SortTh = ({ k, children, right }) => (
    <th className={`sortable ${sort.key === k ? "sorted" : ""} ${right ? "right" : ""}`} onClick={() => toggleSort(k)}>
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
    { label: "Customers", value: customers.length, icon: <FiBriefcase />, tone: "t-blue" },
    { label: "Orders", value: totals.orders.toLocaleString(), icon: <FiPackage />, tone: "t-green" },
    { label: "Inquiries", value: totals.inquiries.toLocaleString(), icon: <FiClipboard />, tone: "t-amber" },
    { label: "With buyers", value: totals.withBuyers, icon: <FiUsers />, tone: "t-violet" },
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
              Customers <span className="ag-count">{customers.length}</span>
            </h1>
            <p className="ag-subtitle">Customers, their contacts, buyers and order activity.</p>
          </div>
          <div className="ag-actions">
            <button type="button" className="ag-btn ghost" onClick={() => fetchData({ quiet: true })} disabled={refreshing}>
              <FiRefreshCw className={refreshing ? "ag-spin" : ""} /> Refresh
            </button>
            <button type="button" className="ag-btn ghost" onClick={exportCSV} disabled={filtered.length === 0}>
              <FiDownload /> Export CSV
            </button>
            <button type="button" className="ag-btn primary" onClick={() => navigate("/add-customer")}>
              <FiPlus /> New Customer
            </button>
          </div>
        </header>

        <div className="ag-body" style={{ maxWidth: 1500 }}>
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
                  placeholder="Search name, code, email, phone or address"
                />
                {searchTerm && (
                  <button type="button" className="clear" onClick={() => setSearchTerm("")} title="Clear">
                    <FiX />
                  </button>
                )}
              </div>
              <select className="ag-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter">
                {FILTERS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
              <span className="ag-spacer" />
              <span className="ag-note">
                {filtered.length} of {customers.length}
              </span>
            </div>

            {loading ? (
              <div className="ag-loading">
                <div className="ag-spinner" />
                Loading customers…
              </div>
            ) : error ? (
              <div className="ag-state">
                <div className="ag-state-icon">
                  <FiAlertTriangle />
                </div>
                <h3>Couldn't load customers</h3>
                <p>{error}</p>
                <button type="button" className="ag-btn ghost" onClick={() => fetchData()}>
                  <FiRefreshCw /> Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ag-state">
                <div className="ag-state-icon">
                  <FiBriefcase />
                </div>
                <h3>{customers.length === 0 ? "No customers yet" : "No customers match"}</h3>
                <p>{customers.length === 0 ? "Add your first customer." : "Try a different search or filter."}</p>
                {customers.length === 0 ? (
                  <button type="button" className="ag-btn primary" onClick={() => navigate("/add-customer")}>
                    <FiPlus /> New Customer
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ag-btn ghost"
                    onClick={() => {
                      setSearchTerm("");
                      setFilter("all");
                    }}
                  >
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
                        <SortTh k="name">Customer</SortTh>
                        <th>Contact</th>
                        <SortTh k="orders" right>
                          Orders
                        </SortTh>
                        <SortTh k="inquiries" right>
                          Inquiries
                        </SortTh>
                        <SortTh k="buyers">Buyers</SortTh>
                        <th className="right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((c) => {
                        const bs = buyersOf(c);
                        return (
                          <tr key={c.id} onClick={() => navigate(`/customer-details/${c.id}`)}>
                            <td>
                              <div className="ag-person">
                                <span className="ag-avatar">{initialsOf(customerName(c))}</span>
                                <span>
                                  <span className="ag-name">{customerName(c)}</span>
                                  <span className="ag-sub">{c.customer_code ? `Code ${c.customer_code}` : `ID ${c.id}`}</span>
                                </span>
                              </div>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              {c.email && (
                                <a className="ag-contact" href={`mailto:${c.email}`}>
                                  <FiMail /> {c.email}
                                </a>
                              )}
                              {c.phone && (
                                <a className="ag-contact" href={`tel:${c.phone}`} style={{ display: "flex", marginTop: c.email ? 3 : 0 }}>
                                  <FiPhone /> {c.phone}
                                </a>
                              )}
                              {!c.email && !c.phone && <span style={{ color: "#94a3b8" }}>—</span>}
                            </td>
                            <td className="right" style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                              {(c.order_count || 0).toLocaleString()}
                            </td>
                            <td className="right" style={{ fontVariantNumeric: "tabular-nums" }}>
                              {(c.inquiry_count || 0).toLocaleString()}
                            </td>
                            <td>
                              {bs.length === 0 ? (
                                <span style={{ color: "#94a3b8" }}>—</span>
                              ) : (
                                <div className="ag-chips">
                                  {bs.slice(0, 2).map((b) => (
                                    <span key={b.id} className="ag-chip violet">
                                      {b.name || `Buyer ${b.id}`}
                                    </span>
                                  ))}
                                  {bs.length > 2 && (
                                    <span className="ag-chip more" title={bs.slice(2).map((b) => b.name).join(", ")}>
                                      +{bs.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="ag-row-actions">
                                <button type="button" className="ag-icon-btn" title="View" onClick={() => navigate(`/customer-details/${c.id}`)}>
                                  <FiEye />
                                </button>
                                <button type="button" className="ag-icon-btn" title="Edit" onClick={() => navigate(`/edit-customer/${c.id}`)}>
                                  <FiEdit2 />
                                </button>
                                <button type="button" className="ag-icon-btn danger" title="Delete" onClick={() => setDeleting(c)}>
                                  <FiTrash2 />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="ag-pagination">
                  <div className="ag-page-info">
                    Showing <strong>{first + 1}</strong>–<strong>{Math.min(first + perPage, filtered.length)}</strong> of{" "}
                    <strong>{filtered.length}</strong>
                    <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} aria-label="Rows per page">
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

      {deleting && (
        <CustomerDeleteModal
          customer={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={(c) => {
            setDeleting(null);
            setCustomers((prev) => prev.filter((x) => x.id !== c.id));
            setNotice({ ok: true, msg: `Deleted ${customerName(c)}.` });
          }}
        />
      )}
    </div>
  );
}
