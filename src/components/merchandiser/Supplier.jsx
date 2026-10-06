// Supplier.jsx - Merchandising suppliers list (route /suppliers).
// Same Supplier records as the CSR module (api/csr/api/supplier/), shown
// with the production-side columns merchandisers need. Compliance uses the
// same rule as the CSR supplier list (expired document = non-compliant,
// anything expiring within 30 days = under review).
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiClock,
  FiDownload,
  FiEdit2,
  FiEye,
  FiMail,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiTruck,
  FiX,
} from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import SupplierDeleteModal from "./SupplierDeleteModal.jsx";
import { AGENT_CSS, initialsOf } from "./agentTheme";

const API = "http://119.148.51.38:8000/api/csr/api/supplier/";
const authHeaders = () => ({ Authorization: `Token ${localStorage.getItem("token")}` });
const asList = (data) => (Array.isArray(data) ? data : data?.results || data?.data || []);

const DAYS_FIELDS = [
  "bsci_validity_days_remaining",
  "sedex_validity_days_remaining",
  "wrap_validity_days_remaining",
  "trade_license_days_remaining",
  "factory_license_days_remaining",
  "fire_license_days_remaining",
  "oeko_tex_validity_days_remaining",
  "gots_validity_days_remaining",
  "iso_9001_validity_days_remaining",
  "iso_14001_validity_days_remaining",
  "iso_45001_validity_days_remaining",
];
// Same rule as csr/SupplierListCSR.jsx getComplianceStatus.
const complianceOf = (s) => {
  const days = DAYS_FIELDS.map((f) => s[f]).filter((d) => d !== null && d !== undefined && d !== "");
  if (days.some((d) => d <= 0)) return "non_compliant";
  if (days.some((d) => d > 0 && d <= 30)) return "under_review";
  if (days.length > 0) return "compliant";
  return "under_review";
};
const COMPLIANCE = {
  compliant: { label: "Compliant", tone: "green", icon: <FiCheckCircle /> },
  under_review: { label: "Under review", tone: "amber", icon: <FiClock /> },
  non_compliant: { label: "Non-compliant", tone: "", icon: <FiAlertTriangle />, style: { background: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" } },
};

const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const num = (v) => {
  const n = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : -1;
};

export default function Supplier() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [compliance, setCompliance] = useState("all");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [deleting, setDeleting] = useState(null);

  const fetchSuppliers = async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API, { headers: authHeaders() });
      setSuppliers(asList(res.data));
    } catch (err) {
      console.error("API Error:", err);
      setError(err.response?.status === 401 ? "Your session has expired - please log in again." : "Failed to load suppliers.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const categories = useMemo(
    () => [...new Set(suppliers.map((s) => s.supplier_category).filter(Boolean))].sort(),
    [suppliers],
  );

  const counts = useMemo(() => {
    const c = { compliant: 0, under_review: 0, non_compliant: 0 };
    suppliers.forEach((s) => (c[complianceOf(s)] += 1));
    return c;
  }, [suppliers]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = suppliers.filter((s) => {
      if (category !== "all" && s.supplier_category !== category) return false;
      if (compliance !== "all" && complianceOf(s) !== compliance) return false;
      if (!q) return true;
      return [s.supplier_name, s.supplier_id, s.email, s.location, s.manufacturing_item, s.production_process, s.factory_main_contact]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
    const value = (s) => {
      if (sort.key === "capacity") return num(s.capacity_per_month);
      if (sort.key === "lines") return Number(s.number_of_sewing_line || -1);
      if (sort.key === "manpower") return Number(s.total_manpower || -1);
      if (sort.key === "id") return String(s.supplier_id || "").toLowerCase();
      return String(s.supplier_name || "").toLowerCase();
    };
    return list.sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (sort.dir === "asc" ? 1 : -1);
    });
  }, [suppliers, searchTerm, category, compliance, sort]);

  useEffect(() => setCurrentPage(1), [searchTerm, category, compliance, perPage]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  const first = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(first, first + perPage);

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" || key === "id" ? "asc" : "desc" }));

  const exportCSV = () => {
    const header = ["Supplier", "Supplier ID", "Category", "Location", "Capacity / month", "Sewing lines", "Manpower", "Items", "Compliance", "Email", "Phone"];
    const rows = filtered.map((s) => [
      s.supplier_name,
      s.supplier_id,
      s.supplier_category,
      s.location,
      s.capacity_per_month,
      s.number_of_sewing_line,
      s.total_manpower,
      s.manufacturing_item,
      COMPLIANCE[complianceOf(s)].label,
      s.email,
      s.phone,
    ]);
    const blob = new Blob(["﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suppliers-${new Date().toISOString().slice(0, 10)}.csv`;
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

  const kpis = [
    { key: "all", label: "Suppliers", value: suppliers.length, icon: <FiTruck />, tone: "t-blue" },
    { key: "compliant", label: "Compliant", value: counts.compliant, icon: <FiCheckCircle />, tone: "t-green" },
    { key: "under_review", label: "Under review", value: counts.under_review, icon: <FiClock />, tone: "t-amber" },
    { key: "non_compliant", label: "Non-compliant", value: counts.non_compliant, icon: <FiAlertTriangle />, tone: "t-red" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div className="ag-app">
        <style>{AGENT_CSS + `.t-red { color: #b91c1c; background: #fef2f2; } .ag-kpi.btn { cursor: pointer; font: inherit; text-align: left; color: inherit; } .ag-kpi.btn:hover { border-color: #d5dbe4; } .ag-kpi.on { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }`}</style>

        <header className="ag-header">
          <div>
            <div className="ag-eyebrow">Partners</div>
            <h1 className="ag-title">
              Suppliers <span className="ag-count">{suppliers.length}</span>
            </h1>
            <p className="ag-subtitle">Factories, their capacity and compliance. Shared with the CSR module.</p>
          </div>
          <div className="ag-actions">
            <button type="button" className="ag-btn ghost" onClick={() => fetchSuppliers({ quiet: true })} disabled={refreshing}>
              <FiRefreshCw className={refreshing ? "ag-spin" : ""} /> Refresh
            </button>
            <button type="button" className="ag-btn ghost" onClick={exportCSV} disabled={filtered.length === 0}>
              <FiDownload /> Export CSV
            </button>
            <button type="button" className="ag-btn primary" onClick={() => navigate("/add-supplier")}>
              <FiPlus /> New Supplier
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
            {kpis.map((k) => (
              <button
                key={k.key}
                type="button"
                className={`ag-kpi btn ${compliance === k.key && k.key !== "all" ? "on" : ""}`}
                onClick={() => setCompliance(k.key === "all" || compliance === k.key ? "all" : k.key)}
              >
                <span className={`ag-kpi-icon ${k.tone}`}>{k.icon}</span>
                <span>
                  <span className="ag-kpi-value">{loading ? "–" : k.value}</span>
                  <span className="ag-kpi-label">{k.label}</span>
                </span>
              </button>
            ))}
          </div>

          <section className="ag-card">
            <div className="ag-toolbar">
              <div className="ag-search">
                <FiSearch />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, ID, location, items, contact…"
                />
                {searchTerm && (
                  <button type="button" className="clear" onClick={() => setSearchTerm("")} title="Clear">
                    <FiX />
                  </button>
                )}
              </div>
              <select className="ag-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select className="ag-select" value={compliance} onChange={(e) => setCompliance(e.target.value)} aria-label="Compliance">
                <option value="all">Any compliance</option>
                <option value="compliant">Compliant</option>
                <option value="under_review">Under review</option>
                <option value="non_compliant">Non-compliant</option>
              </select>
              <span className="ag-spacer" />
              <span className="ag-note">
                {filtered.length} of {suppliers.length}
              </span>
            </div>

            {loading ? (
              <div className="ag-loading">
                <div className="ag-spinner" />
                Loading suppliers…
              </div>
            ) : error ? (
              <div className="ag-state">
                <div className="ag-state-icon">
                  <FiAlertTriangle />
                </div>
                <h3>Couldn't load suppliers</h3>
                <p>{error}</p>
                <button type="button" className="ag-btn ghost" onClick={() => fetchSuppliers()}>
                  <FiRefreshCw /> Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ag-state">
                <div className="ag-state-icon">
                  <FiTruck />
                </div>
                <h3>{suppliers.length === 0 ? "No suppliers yet" : "No suppliers match"}</h3>
                <p>{suppliers.length === 0 ? "Add your first supplier." : "Try a different search or filter."}</p>
              </div>
            ) : (
              <>
                <div className="ag-table-wrap">
                  <table className="ag-table">
                    <thead>
                      <tr>
                        <SortTh k="name">Supplier</SortTh>
                        <th>Category</th>
                        <th>Location</th>
                        <SortTh k="capacity" right>
                          Capacity / month
                        </SortTh>
                        <SortTh k="lines" right>
                          Lines
                        </SortTh>
                        <SortTh k="manpower" right>
                          Manpower
                        </SortTh>
                        <th>Compliance</th>
                        <th className="right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((s) => {
                        const c = COMPLIANCE[complianceOf(s)];
                        return (
                          <tr key={s.id} onClick={() => navigate(`/suppliers/${s.id}`)}>
                            <td>
                              <div className="ag-person">
                                <span className="ag-avatar">{initialsOf(s.supplier_name)}</span>
                                <span style={{ minWidth: 0 }}>
                                  <span className="ag-name">{s.supplier_name || "Unnamed supplier"}</span>
                                  <span className="ag-sub">
                                    {s.supplier_id ? `ID ${s.supplier_id}` : `#${s.id}`}
                                    {s.email && (
                                      <>
                                        {" · "}
                                        <FiMail size={10} style={{ verticalAlign: -1 }} /> {s.email}
                                      </>
                                    )}
                                  </span>
                                </span>
                              </div>
                            </td>
                            <td>{s.supplier_category ? <span className="ag-chip blue">{s.supplier_category}</span> : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                            <td>
                              {s.location ? (
                                <span className="ag-address" title={s.location} style={{ maxWidth: 260, display: "-webkit-box" }}>
                                  <FiMapPin size={12} style={{ verticalAlign: -1, color: "#94a3b8", marginRight: 4 }} />
                                  {s.location}
                                </span>
                              ) : (
                                <span style={{ color: "#94a3b8" }}>—</span>
                              )}
                            </td>
                            <td className="right" style={{ whiteSpace: "nowrap" }}>
                              {s.capacity_per_month || <span style={{ color: "#94a3b8" }}>—</span>}
                            </td>
                            <td className="right">{s.number_of_sewing_line ?? <span style={{ color: "#94a3b8" }}>—</span>}</td>
                            <td className="right">
                              {s.total_manpower ? Number(s.total_manpower).toLocaleString() : <span style={{ color: "#94a3b8" }}>—</span>}
                            </td>
                            <td>
                              <span className={`ag-chip ${c.tone}`} style={c.style}>
                                {c.icon} {c.label}
                              </span>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="ag-row-actions">
                                <button type="button" className="ag-icon-btn" title="View" onClick={() => navigate(`/suppliers/${s.id}`)}>
                                  <FiEye />
                                </button>
                                <button type="button" className="ag-icon-btn" title="Edit" onClick={() => navigate(`/edit/suppliers/${s.id}`)}>
                                  <FiEdit2 />
                                </button>
                                <button type="button" className="ag-icon-btn danger" title="Delete" onClick={() => setDeleting(s)}>
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
        <SupplierDeleteModal
          supplier={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={(sup) => {
            setDeleting(null);
            setSuppliers((prev) => prev.filter((x) => x.id !== sup.id));
            setNotice({ ok: true, msg: `Deleted ${sup.supplier_name}.` });
          }}
        />
      )}
    </div>
  );
}
