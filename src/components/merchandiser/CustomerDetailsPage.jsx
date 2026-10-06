// CustomerDetailsPage.jsx - one customer (route /customer-details/:id):
// contact, HRMS link, buyers, recent orders and inquiries; edit / delete.
//
// Orders and inquiries are fetched filtered by customer on the server
// (?customer=<id>, newest first, 10 rows) instead of downloading every
// order and filtering in the browser; the old page also sent "Bearer"
// tokens, which the API rejects, so its Orders tab never loaded.
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBriefcase,
  FiChevronRight,
  FiClipboard,
  FiEdit2,
  FiExternalLink,
  FiLink,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiPackage,
  FiPhone,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import CustomerDeleteModal from "./CustomerDeleteModal.jsx";
import { merchandiserApi } from "../../api/merchandiser";
import { canViewOrderPricing } from "../../utils/accessControl";
import { AGENT_CSS, customerName, initialsOf } from "./agentTheme";

const asList = (data) => (Array.isArray(data) ? data : data?.results || data?.data || []);
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtUSD = (n) =>
  n === null || n === undefined || n === ""
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(n));

const STATUS_TONE = {
  shipped: "green",
  running: "blue",
  active: "blue",
  confirmed: "green",
  pending: "amber",
  quoted: "violet",
  cancelled: "",
};
const StatusChip = ({ value }) =>
  value ? <span className={`ag-chip ${STATUS_TONE[String(value).toLowerCase()] ?? ""}`}>{value}</span> : <span style={{ color: "#94a3b8" }}>—</span>;

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showPricing = canViewOrderPricing();
  const [customer, setCustomer] = useState(null);
  const [buyers, setBuyers] = useState([]);
  const [orders, setOrders] = useState({ rows: [], count: 0, error: null, loading: true });
  const [inquiries, setInquiries] = useState({ rows: [], count: 0, error: null, loading: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("orders");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    merchandiserApi
      .get(`customer/${id}/`)
      .then((res) => alive && setCustomer(res.data))
      .catch((err) => alive && setError(err.response?.status === 404 ? "Customer not found." : "Failed to load the customer."))
      .finally(() => alive && setLoading(false));

    merchandiserApi
      .get("buyer/", { params: { customer: id } })
      .then((res) => alive && setBuyers(asList(res.data).filter((b) => (b.customers || []).includes(Number(id)))))
      .catch(() => alive && setBuyers([]));

    setOrders((o) => ({ ...o, loading: true }));
    merchandiserApi
      .get("orders/", { params: { customer: id, page_size: 10, ordering: "-created_at" } })
      .then((res) => alive && setOrders({ rows: asList(res.data), count: res.data?.count ?? asList(res.data).length, error: null, loading: false }))
      .catch(() => alive && setOrders({ rows: [], count: 0, error: "Could not load orders.", loading: false }));

    setInquiries((o) => ({ ...o, loading: true }));
    merchandiserApi
      .get("inquiry/", { params: { customer: id, page_size: 10, ordering: "-id" } })
      .then(
        (res) => alive && setInquiries({ rows: asList(res.data), count: res.data?.count ?? asList(res.data).length, error: null, loading: false }),
      )
      .catch(() => alive && setInquiries({ rows: [], count: 0, error: "Could not load inquiries.", loading: false }));

    return () => {
      alive = false;
    };
  }, [id]);

  const name = customer ? customerName(customer) : "";
  const orderCount = customer?.order_count ?? orders.count;
  const inquiryCount = customer?.inquiry_count ?? inquiries.count;

  const tabs = useMemo(
    () => [
      { key: "orders", label: "Recent orders", count: orderCount, icon: <FiPackage /> },
      { key: "inquiries", label: "Recent inquiries", count: inquiryCount, icon: <FiClipboard /> },
      { key: "buyers", label: "Buyers", count: buyers.length, icon: <FiUsers /> },
    ],
    [orderCount, inquiryCount, buyers.length],
  );

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <div className="ag-app">
          <style>{AGENT_CSS}</style>
          <div className="ag-loading">
            <div className="ag-spinner" />
            Loading customer…
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <div className="ag-app">
          <style>{AGENT_CSS}</style>
          <div className="ag-body">
            <div className="ag-state ag-card">
              <div className="ag-state-icon">
                <FiAlertTriangle />
              </div>
              <h3>{error || "Customer not found."}</h3>
              <p>It may have been deleted, or it isn't one of your customers.</p>
              <button type="button" className="ag-btn ghost" onClick={() => navigate("/customers")}>
                <FiArrowLeft /> Back to Customers
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const listState = (state, emptyText) =>
    state.loading ? (
      <div className="ag-loading" style={{ minHeight: 160 }}>
        <div className="ag-spinner" />
      </div>
    ) : state.error ? (
      <div className="ag-empty-line" style={{ color: "#b91c1c" }}>
        {state.error}
      </div>
    ) : state.rows.length === 0 ? (
      <div className="ag-empty-line">{emptyText}</div>
    ) : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div className="ag-app">
        <style>{AGENT_CSS}</style>

        <header className="ag-header">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="ag-avatar lg">{initialsOf(name)}</span>
            <div>
              <nav className="ag-crumbs" aria-label="Breadcrumb">
                <Link to="/customers">Customers</Link>
                <FiChevronRight />
                <span>{name}</span>
              </nav>
              <h1 className="ag-title">
                {name}
                {customer.customer_code && <span className="ag-count">{customer.customer_code}</span>}
              </h1>
              <p className="ag-subtitle">
                {orderCount.toLocaleString()} order(s) · {inquiryCount.toLocaleString()} inquiry(ies) · {buyers.length} buyer(s)
              </p>
            </div>
          </div>
          <div className="ag-actions">
            <button type="button" className="ag-btn ghost" onClick={() => navigate("/customers")}>
              <FiArrowLeft /> Back
            </button>
            <button type="button" className="ag-btn danger-ghost" onClick={() => setDeleting(true)}>
              <FiTrash2 /> Delete
            </button>
            <button type="button" className="ag-btn primary" onClick={() => navigate(`/edit-customer/${customer.id}`)}>
              <FiEdit2 /> Edit Customer
            </button>
          </div>
        </header>

        <div className="ag-body">
          <div className="ag-kpis">
            <div className="ag-kpi">
              <span className="ag-kpi-icon t-green">
                <FiPackage />
              </span>
              <span>
                <span className="ag-kpi-value">{orderCount.toLocaleString()}</span>
                <span className="ag-kpi-label">Orders</span>
              </span>
            </div>
            <div className="ag-kpi">
              <span className="ag-kpi-icon t-amber">
                <FiClipboard />
              </span>
              <span>
                <span className="ag-kpi-value">{inquiryCount.toLocaleString()}</span>
                <span className="ag-kpi-label">Inquiries</span>
              </span>
            </div>
            <div className="ag-kpi">
              <span className="ag-kpi-icon t-violet">
                <FiUsers />
              </span>
              <span>
                <span className="ag-kpi-value">{buyers.length}</span>
                <span className="ag-kpi-label">Buyers</span>
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 16, alignItems: "start" }} className="cd-two">
            {/* Activity */}
            <section className="ag-card">
              <div className="ag-toolbar" style={{ gap: 4 }}>
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`ag-btn sm ${tab === t.key ? "primary" : "ghost"}`}
                    style={tab === t.key ? {} : { borderColor: "transparent" }}
                    onClick={() => setTab(t.key)}
                  >
                    {t.icon} {t.label} <span style={{ opacity: 0.75 }}>{t.count.toLocaleString()}</span>
                  </button>
                ))}
                <span className="ag-spacer" />
                {tab === "orders" && (
                  <Link to="/orders" className="ag-btn ghost sm">
                    All orders <FiExternalLink />
                  </Link>
                )}
                {tab === "inquiries" && (
                  <Link to="/inquiries" className="ag-btn ghost sm">
                    All inquiries <FiExternalLink />
                  </Link>
                )}
              </div>

              {tab === "orders" &&
                (listState(orders, "No orders for this customer yet.") || (
                  <div className="ag-table-wrap">
                    <table className="ag-table">
                      <thead>
                        <tr>
                          <th>Order NO</th>
                          <th>PO</th>
                          <th>Style</th>
                          <th className="right">Qty</th>
                          {showPricing && <th className="right">Value</th>}
                          <th>Status</th>
                          <th>Shipment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.rows.map((o) => (
                          <tr key={o.id} onClick={() => navigate(`/orders/${o.id}`)}>
                            <td className="ag-name">{o.style || "—"}</td>
                            <td>{o.po_no || "—"}</td>
                            <td style={{ color: "#64748b" }}>{o.pdm_no || "—"}</td>
                            <td className="right" style={{ fontVariantNumeric: "tabular-nums" }}>
                              {o.total_qty != null ? Number(o.total_qty).toLocaleString() : "—"}
                            </td>
                            {showPricing && (
                              <td className="right" style={{ fontVariantNumeric: "tabular-nums" }}>
                                {fmtUSD(o.total_value)}
                              </td>
                            )}
                            <td>
                              <StatusChip value={o.status} />
                            </td>
                            <td style={{ whiteSpace: "nowrap", color: "#64748b" }}>{fmtDate(o.shipment_date || o.etd)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {orders.count > orders.rows.length && (
                      <div className="ag-empty-line" style={{ padding: 12, borderTop: "1px solid #e6eaf0" }}>
                        Showing the latest {orders.rows.length} of {orders.count.toLocaleString()} orders.
                      </div>
                    )}
                  </div>
                ))}

              {tab === "inquiries" &&
                (listState(inquiries, "No inquiries for this customer yet.") || (
                  <div className="ag-table-wrap">
                    <table className="ag-table">
                      <thead>
                        <tr>
                          <th>Inquiry</th>
                          <th>Item</th>
                          <th>Buyer</th>
                          <th className="right">Qty</th>
                          <th>Status</th>
                          <th>Received</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inquiries.rows.map((q) => (
                          <tr key={q.id} onClick={() => navigate(`/inquiries/${q.id}`)}>
                            <td className="ag-name">{q.inquiry_no || `#${q.id}`}</td>
                            <td>{q.item || q.garment || "—"}</td>
                            <td style={{ color: "#64748b" }}>{q.buyer_name || "—"}</td>
                            <td className="right" style={{ fontVariantNumeric: "tabular-nums" }}>
                              {q.order_quantity || q.total_quantity ? Number(q.order_quantity || q.total_quantity).toLocaleString() : "—"}
                            </td>
                            <td>
                              <StatusChip value={q.current_status} />
                            </td>
                            <td style={{ whiteSpace: "nowrap", color: "#64748b" }}>{fmtDate(q.received_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {inquiries.count > inquiries.rows.length && (
                      <div className="ag-empty-line" style={{ padding: 12, borderTop: "1px solid #e6eaf0" }}>
                        Showing the latest {inquiries.rows.length} of {inquiries.count.toLocaleString()} inquiries.
                      </div>
                    )}
                  </div>
                ))}

              {tab === "buyers" &&
                (buyers.length === 0 ? (
                  <div className="ag-empty-line">No buyers linked to this customer.</div>
                ) : (
                  <div className="ag-table-wrap">
                    <table className="ag-table">
                      <thead>
                        <tr>
                          <th>Buyer</th>
                          <th>Contact</th>
                          <th>Departments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {buyers.map((b) => {
                          const depts = [...new Set((b.rows || []).map((r) => r.department).filter(Boolean))];
                          return (
                            <tr key={b.id} onClick={() => navigate(`/buyer-details/${b.id}`)}>
                              <td>
                                <div className="ag-person">
                                  <span className="ag-avatar">{initialsOf(b.name)}</span>
                                  <span className="ag-name">{b.name || "Unnamed buyer"}</span>
                                </div>
                              </td>
                              <td style={{ color: "#64748b" }}>{b.email || b.phone || "—"}</td>
                              <td>
                                {depts.length ? (
                                  <div className="ag-chips">
                                    {depts.slice(0, 3).map((d) => (
                                      <span key={d} className="ag-chip amber">
                                        {d}
                                      </span>
                                    ))}
                                    {depts.length > 3 && <span className="ag-chip more">+{depts.length - 3}</span>}
                                  </div>
                                ) : (
                                  <span style={{ color: "#94a3b8" }}>—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
            </section>

            {/* Profile */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <section className="ag-card">
                <div className="ag-section-head">
                  <h2>
                    <FiBriefcase /> Contact
                  </h2>
                </div>
                <div className="ag-section-body">
                  <div className="ag-info-grid" style={{ gridTemplateColumns: "1fr" }}>
                    <div>
                      <div className="k">Email</div>
                      <div className="v">
                        {customer.email ? (
                          <a className="ag-contact" href={`mailto:${customer.email}`}>
                            <FiMail /> {customer.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="k">Phone</div>
                      <div className="v">
                        {customer.phone ? (
                          <a className="ag-contact" href={`tel:${customer.phone}`}>
                            <FiPhone /> {customer.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="k">Address</div>
                      <div className="v" style={{ display: "flex", gap: 6 }}>
                        {customer.address ? (
                          <>
                            <FiMapPin style={{ color: "#94a3b8", flexShrink: 0, marginTop: 3 }} />
                            <span style={{ whiteSpace: "pre-wrap" }}>{customer.address}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="k">HRMS link</div>
                      <div className="v" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <FiLink style={{ color: customer.hrms_customer_id ? "#15803d" : "#94a3b8" }} />
                        {customer.hrms_customer_id ? `Linked to “${customer.hrms_customer_name}”` : "Not linked"}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {customer.remarks && (
                <section className="ag-card">
                  <div className="ag-section-head">
                    <h2>
                      <FiMessageSquare /> Remarks
                    </h2>
                  </div>
                  <div className="ag-section-body" style={{ whiteSpace: "pre-wrap", color: "#334155", lineHeight: 1.6 }}>
                    {customer.remarks}
                  </div>
                </section>
              )}
            </div>
          </div>
          <style>{`@media (max-width: 1100px) { .cd-two { grid-template-columns: minmax(0, 1fr) !important; } }`}</style>
        </div>
      </div>

      {deleting && (
        <CustomerDeleteModal customer={customer} onClose={() => setDeleting(false)} onDeleted={() => navigate("/customers")} />
      )}
    </div>
  );
}
