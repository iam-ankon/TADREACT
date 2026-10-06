// Agents list (route /agents): search, sort, paginate, CSV export, edit and
// delete. Uses the authenticated merchandiser API helpers (token sent).
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiCopy,
  FiDownload,
  FiEdit2,
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
import { deleteAgent, merchandiserApi } from "../../api/merchandiser";
import { AGENT_CSS, initialsOf } from "./agentTheme";

const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default function AgentPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [deletingId, setDeletingId] = useState(null);
  const [copied, setCopied] = useState(null);

  const fetchAgents = async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const res = await merchandiserApi.get("agent/");
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setAgents(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load agents. Please try again.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = agents.filter(
      (a) =>
        !q ||
        [a.name, a.email, a.phone, a.address].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    );
    return list.sort((a, b) => {
      const av = String(a[sort.key] ?? "").toLowerCase();
      const bv = String(b[sort.key] ?? "").toLowerCase();
      return av.localeCompare(bv) * (sort.dir === "asc" ? 1 : -1);
    });
  }, [agents, searchTerm, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  const first = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(first, first + perPage);

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const handleDelete = async (agent) => {
    if (!window.confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return;
    setDeletingId(agent.id);
    setNotice(null);
    try {
      await deleteAgent(agent.id);
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
      setNotice({ ok: true, msg: `Deleted ${agent.name}.` });
    } catch (err) {
      setNotice({ ok: false, msg: err.response?.data?.detail || "Failed to delete the agent." });
    } finally {
      setDeletingId(null);
    }
  };

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* clipboard blocked - ignore */
    }
  };

  const exportCSV = () => {
    const rows = [["Name", "Email", "Phone", "Address"], ...filtered.map((a) => [a.name, a.email, a.phone, a.address])];
    const blob = new Blob(["﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agents-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    let start = Math.max(1, Math.min(currentPage - 2, totalPages - count + 1));
    return Array.from({ length: count }, (_, i) => start + i);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div className="ag-app">
        <style>{AGENT_CSS}</style>

        <header className="ag-header">
          <div>
            <div className="ag-eyebrow">Partners</div>
            <h1 className="ag-title">
              Agents <span className="ag-count">{agents.length}</span>
            </h1>
            <p className="ag-subtitle">Buying agents and their contact details.</p>
          </div>
          <div className="ag-actions">
            <button type="button" className="ag-btn ghost" onClick={() => fetchAgents({ quiet: true })} disabled={refreshing}>
              <FiRefreshCw className={refreshing ? "ag-spin" : ""} /> Refresh
            </button>
            <button type="button" className="ag-btn ghost" onClick={exportCSV} disabled={filtered.length === 0}>
              <FiDownload /> Export CSV
            </button>
            <button type="button" className="ag-btn primary" onClick={() => navigate("/add-agent")}>
              <FiPlus /> Add Agent
            </button>
          </div>
        </header>

        <div className="ag-body">
          {notice && (
            <div className={`ag-alert ${notice.ok ? "ok" : "err"}`}>
              {notice.ok ? <FiCheck /> : <FiAlertTriangle />}
              <span>{notice.msg}</span>
              <button type="button" className="ag-icon-btn" onClick={() => setNotice(null)} title="Dismiss">
                <FiX />
              </button>
            </div>
          )}

          <section className="ag-card">
            <div className="ag-toolbar">
              <div className="ag-search">
                <FiSearch />
                <input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search name, email, phone or address"
                />
                {searchTerm && (
                  <button type="button" className="clear" onClick={() => setSearchTerm("")} title="Clear">
                    <FiX />
                  </button>
                )}
              </div>
              <span className="ag-spacer" />
              <span className="ag-note">
                {filtered.length} of {agents.length}
              </span>
            </div>

            {isLoading ? (
              <div className="ag-loading">
                <div className="ag-spinner" />
                Loading agents…
              </div>
            ) : error ? (
              <div className="ag-state">
                <div className="ag-state-icon">
                  <FiAlertTriangle />
                </div>
                <h3>Couldn't load agents</h3>
                <p>{error}</p>
                <button type="button" className="ag-btn ghost" onClick={() => fetchAgents()}>
                  <FiRefreshCw /> Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ag-state">
                <div className="ag-state-icon">
                  <FiUsers />
                </div>
                <h3>{agents.length === 0 ? "No agents yet" : "No agents match"}</h3>
                <p>{agents.length === 0 ? "Add your first buying agent." : "Try a different search."}</p>
                {agents.length === 0 ? (
                  <button type="button" className="ag-btn primary" onClick={() => navigate("/add-agent")}>
                    <FiPlus /> Add Agent
                  </button>
                ) : (
                  <button type="button" className="ag-btn ghost" onClick={() => setSearchTerm("")}>
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="ag-table-wrap">
                  <table className="ag-table">
                    <thead>
                      <tr>
                        <SortTh k="name">Agent</SortTh>
                        <SortTh k="email">Email</SortTh>
                        <SortTh k="phone">Phone</SortTh>
                        <th>Address</th>
                        <th className="right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((agent) => (
                        <tr key={agent.id} onClick={() => navigate(`/edit-agent/${agent.id}`)}>
                          <td>
                            <div className="ag-person">
                              <span className="ag-avatar">{initialsOf(agent.name)}</span>
                              <span>
                                <span className="ag-name">{agent.name}</span>
                                <span className="ag-sub">ID {agent.id}</span>
                              </span>
                            </div>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {agent.email ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <a className="ag-contact" href={`mailto:${agent.email}`}>
                                  <FiMail /> {agent.email}
                                </a>
                                <button
                                  type="button"
                                  className="ag-icon-btn"
                                  style={{ width: 24, height: 24, fontSize: 12 }}
                                  title="Copy email"
                                  onClick={() => copy(agent.email, `e${agent.id}`)}
                                >
                                  {copied === `e${agent.id}` ? <FiCheck /> : <FiCopy />}
                                </button>
                              </span>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>—</span>
                            )}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {agent.phone ? (
                              <a className="ag-contact" href={`tel:${agent.phone}`}>
                                <FiPhone /> {agent.phone}
                              </a>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>—</span>
                            )}
                          </td>
                          <td>
                            <span className="ag-address" title={agent.address}>
                              {agent.address || "—"}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="ag-row-actions">
                              <button
                                type="button"
                                className="ag-icon-btn"
                                title="Edit"
                                onClick={() => navigate(`/edit-agent/${agent.id}`)}
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                type="button"
                                className="ag-icon-btn danger"
                                title="Delete"
                                disabled={deletingId === agent.id}
                                onClick={() => handleDelete(agent)}
                              >
                                {deletingId === agent.id ? <span className="ag-spinner sm" /> : <FiTrash2 />}
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
                    Showing <strong>{first + 1}</strong>–<strong>{Math.min(first + perPage, filtered.length)}</strong> of{" "}
                    <strong>{filtered.length}</strong>
                    <select
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      aria-label="Rows per page"
                    >
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n} / page
                        </option>
                      ))}
                    </select>
                  </div>
                  {totalPages > 1 && (
                    <div className="ag-pages">
                      <button
                        type="button"
                        className="ag-page"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        title="Previous"
                      >
                        <FiChevronLeft />
                      </button>
                      {pageNumbers().map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`ag-page ${n === currentPage ? "active" : ""}`}
                          onClick={() => setCurrentPage(n)}
                        >
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
