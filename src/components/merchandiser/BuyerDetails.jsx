// BuyerDetails.jsx - one buyer (route /buyer-details/:id): contact, linked
// customers, department / WGR / item / category rows, remarks; edit / delete.
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBriefcase,
  FiChevronRight,
  FiEdit2,
  FiLayers,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import { merchandiserApi } from "../../api/merchandiser";
import { AGENT_CSS, customerName, initialsOf } from "./agentTheme";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

export default function BuyerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [buyer, setBuyer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([merchandiserApi.get(`buyer/${id}/`), merchandiserApi.get("customer/").catch(() => ({ data: [] }))])
      .then(([buyerRes, customersRes]) => {
        if (!alive) return;
        setBuyer(buyerRes.data);
        setCustomers(asList(customersRes.data));
      })
      .catch((err) => alive && setError(err.response?.status === 404 ? "Buyer not found." : "Failed to load buyer details."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const buyerCustomers = useMemo(() => {
    if (!buyer) return [];
    if (Array.isArray(buyer.customers_display) && buyer.customers_display.length) return buyer.customers_display;
    const ids = new Set(buyer.customers || []);
    return customers.filter((c) => ids.has(c.id));
  }, [buyer, customers]);

  const rows = buyer?.rows || [];
  const distinct = (key) => [...new Set(rows.map((r) => r[key]).filter(Boolean))];

  const handleDelete = async () => {
    if (!window.confirm(`Delete buyer "${buyer.name || "this buyer"}"? Its rows and customer links are removed too.`)) return;
    setDeleting(true);
    setActionError(null);
    try {
      await merchandiserApi.delete(`buyer/${id}/`);
      navigate("/buyers");
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to delete the buyer.");
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div className="ag-app">
        <style>{AGENT_CSS}</style>

        {loading ? (
          <div className="ag-loading">
            <div className="ag-spinner" />
            Loading buyer…
          </div>
        ) : error || !buyer ? (
          <div className="ag-body">
            <div className="ag-state ag-card">
              <div className="ag-state-icon">
                <FiAlertTriangle />
              </div>
              <h3>{error || "Buyer not found."}</h3>
              <p>It may have been deleted.</p>
              <button type="button" className="ag-btn ghost" onClick={() => navigate("/buyers")}>
                <FiArrowLeft /> Back to Buyers
              </button>
            </div>
          </div>
        ) : (
          <>
            <header className="ag-header">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="ag-avatar lg">{initialsOf(buyer.name)}</span>
                <div>
                  <nav className="ag-crumbs" aria-label="Breadcrumb">
                    <Link to="/buyers">Buyers</Link>
                    <FiChevronRight />
                    <span>{buyer.name || "Buyer"}</span>
                  </nav>
                  <h1 className="ag-title">{buyer.name || "Unnamed buyer"}</h1>
                  <p className="ag-subtitle">
                    {buyerCustomers.length} customer(s) · {rows.length} row(s) · {distinct("department").length} department(s)
                  </p>
                </div>
              </div>
              <div className="ag-actions">
                <button type="button" className="ag-btn ghost" onClick={() => navigate("/buyers")}>
                  <FiArrowLeft /> Back
                </button>
                <button type="button" className="ag-btn danger-ghost" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <span className="ag-spinner sm" /> : <FiTrash2 />} Delete
                </button>
                <button type="button" className="ag-btn primary" onClick={() => navigate(`/edit-buyer/${buyer.id}`)}>
                  <FiEdit2 /> Edit Buyer
                </button>
              </div>
            </header>

            <div className="ag-body">
              {actionError && (
                <div className="ag-alert err">
                  <FiAlertTriangle />
                  <span>{actionError}</span>
                </div>
              )}

              <section className="ag-card ag-section">
                <div className="ag-section-head">
                  <h2>
                    <FiUser /> Contact
                  </h2>
                </div>
                <div className="ag-section-body">
                  <div className="ag-info-grid">
                    <div>
                      <div className="k">Name</div>
                      <div className="v">{buyer.name || "—"}</div>
                    </div>
                    <div>
                      <div className="k">Email</div>
                      <div className="v">
                        {buyer.email ? (
                          <a className="ag-contact" href={`mailto:${buyer.email}`}>
                            <FiMail /> {buyer.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="k">Phone</div>
                      <div className="v">
                        {buyer.phone ? (
                          <a className="ag-contact" href={`tel:${buyer.phone}`}>
                            <FiPhone /> {buyer.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="ag-card ag-section">
                <div className="ag-section-head">
                  <h2>
                    <FiBriefcase /> Customers <span className="ag-count">{buyerCustomers.length}</span>
                  </h2>
                </div>
                {buyerCustomers.length === 0 ? (
                  <div className="ag-empty-line">No customers linked to this buyer.</div>
                ) : (
                  <div className="ag-section-body">
                    <div className="ag-chips" style={{ maxWidth: "none", gap: 6 }}>
                      {buyerCustomers.map((c) => (
                        <Link
                          key={c.id}
                          to={`/customer-details/${c.id}`}
                          className="ag-chip blue"
                          style={{ textDecoration: "none", fontSize: 13, padding: "4px 10px" }}
                        >
                          {customerName(c)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="ag-card ag-section">
                <div className="ag-section-head">
                  <h2>
                    <FiLayers /> Departments, WGR, items &amp; categories <span className="ag-count">{rows.length}</span>
                  </h2>
                </div>
                {rows.length === 0 ? (
                  <div className="ag-empty-line">No rows yet — add them from Edit Buyer.</div>
                ) : (
                  <div className="ag-table-wrap">
                    <table className="ag-table">
                      <thead>
                        <tr>
                          <th style={{ width: 48 }}>#</th>
                          <th>Department</th>
                          <th>WGR number</th>
                          <th>Item</th>
                          <th>Product category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={r.id || i} style={{ cursor: "default" }}>
                            <td style={{ color: "#94a3b8", fontWeight: 600 }}>{i + 1}</td>
                            <td>{r.department || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                            <td>{r.wgr_number || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                            <td>{r.item || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                            <td>{r.product_category || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {buyer.remarks && (
                <section className="ag-card ag-section">
                  <div className="ag-section-head">
                    <h2>
                      <FiMessageSquare /> Remarks
                    </h2>
                  </div>
                  <div className="ag-section-body" style={{ whiteSpace: "pre-wrap", color: "#334155", lineHeight: 1.6 }}>
                    {buyer.remarks}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
