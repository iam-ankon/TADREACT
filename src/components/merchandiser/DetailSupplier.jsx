// DetailSupplier.jsx - one supplier from the Merchandising side
// (route /suppliers/:id). Same record as the CSR module.
//
// Tabs: Overview, Production & commercial, Contacts, Compliance,
// Documents. Print, Excel export (the CSR export endpoint), Edit and Delete
// all work now (the old header buttons did nothing).
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowLeft,
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiEdit2,
  FiExternalLink,
  FiFileText,
  FiHome,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPrinter,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import Sidebar from "./Sidebar.jsx";
import SupplierDeleteModal from "./SupplierDeleteModal.jsx";
import { exportSupplierToExcel } from "../../api/supplierApi";
import { AGENT_CSS, initialsOf } from "./agentTheme";

const API = "http://119.148.51.38:8000/api/csr/api/supplier/";
const BACKEND = "http://119.148.51.38:8000";

const fmtDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const yesNo = (v) => (v === true ? "Yes" : v === false ? "No" : null);
const daysTone = (d) => (d === null || d === undefined || d === "" ? "" : d <= 0 ? "red" : d <= 30 ? "red" : d <= 90 ? "amber" : "green");
const daysText = (d) =>
  d === null || d === undefined || d === "" ? "—" : d < 0 ? `Expired ${Math.abs(d)}d ago` : d === 0 ? "Expires today" : `${d} days left`;
const TONE_STYLE = {
  red: { background: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" },
  amber: { background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" },
  green: { background: "#f0fdf4", color: "#15803d", borderColor: "#bbf7d0" },
  "": {},
};

// Certificates and licences: [label, validity field, days field, status field, extra fields]
const CERTS = [
  ["BSCI", "bsci_validity", "bsci_validity_days_remaining", "bsci_status", [["Rating", "bsci_rating"], ["Last audit", "bsci_last_audit_date", "date"]]],
  ["SEDEX", "sedex_validity", "sedex_validity_days_remaining", "sedex_status", [["Rating", "sedex_rating"], ["Last audit", "sedex_last_audit_date", "date"]]],
  ["WRAP", "wrap_validity", "wrap_validity_days_remaining", "wrap_status", [["Rating", "wrap_rating"], ["Last audit", "wrap_last_audit_date", "date"]]],
  ["CTPAT security audit", "security_audit_validity", "security_audit_validity_days_remaining", "security_audit_status", [["Rating", "security_audit_rating"], ["Last audit", "security_audit_last_date", "date"]]],
  ["Oeko-Tex", "oeko_tex_validity", "oeko_tex_validity_days_remaining", "oeko_tex_status", []],
  ["GOTS", "gots_validity", "gots_validity_days_remaining", "gots_status", []],
  ["OCS", "ocs_validity", "ocs_validity_days_remaining", "ocs_status", []],
  ["GRS", "grs_validity", "grs_validity_days_remaining", "grs_status", []],
  ["RCS", "rcs_validity", "rcs_validity_days_remaining", "rcs_status", []],
  ["ISO 9001", "iso_9001_validity", "iso_9001_validity_days_remaining", "iso_9001_status", []],
  ["ISO 14001", "iso_14001_validity", "iso_14001_validity_days_remaining", "iso_14001_status", []],
  ["ISO 45001", "iso_45001_validity", "iso_45001_validity_days_remaining", "iso_45001_status", []],
];
const LICENSES = [
  ["Trade licence", "trade_license_validity", "trade_license_days_remaining"],
  ["Factory licence", "factory_license_validity", "factory_license_days_remaining"],
  ["Fire licence", "fire_license_validity", "fire_license_days_remaining"],
  ["Membership", "membership_validity", "membership_days_remaining"],
  ["Group insurance", "group_insurance_validity", "group_insurance_days_remaining"],
  ["Boiler licence", "boiler_license_validity", "boiler_license_days_remaining"],
  ["BERC licence", "berc_license_validity", "berc_days_remaining"],
  ["Drinking water licence", "drinking_water_license_validity", "drinking_water_license_days_remaining"],
];

// Info grid that hides empty values; type: "date" | "bool" | "url"
const Info = ({ s, items }) => {
  const rows = items
    .map(([label, key, type]) => {
      let v = typeof key === "function" ? key(s) : s[key];
      if (type === "date") v = fmtDate(v);
      if (type === "bool") v = yesNo(v);
      return [label, v, type];
    })
    .filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (!rows.length) return <div className="ag-empty-line">Nothing recorded.</div>;
  return (
    <div className="ag-info-grid">
      {rows.map(([label, v]) => (
        <div key={label}>
          <div className="k">{label}</div>
          <div className="v" style={{ whiteSpace: "pre-wrap" }}>
            {v}
          </div>
        </div>
      ))}
    </div>
  );
};

const Section = ({ icon, title, children, right }) => (
  <section className="ag-card ag-section">
    <div className="ag-section-head">
      <h2>
        {icon} {title}
      </h2>
      {right}
    </div>
    <div className="ag-section-body">{children}</div>
  </section>
);

export default function DetailSupplier() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // "Supplier updated successfully" etc., passed by the edit page.
  const location = useLocation();
  const [flash, setFlash] = useState(location.state?.flash || null);
  useEffect(() => {
    if (!location.state?.flash) return undefined;
    navigate(location.pathname, { replace: true, state: null }); // don't re-show on refresh
    const t = setTimeout(() => setFlash(null), 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    axios
      .get(`${API}${id}/`, { headers: { Authorization: `Token ${localStorage.getItem("token")}` } })
      .then((res) => alive && setSupplier(res.data))
      .catch((err) => alive && setError(err.response?.status === 404 ? "Supplier not found." : "Failed to load the supplier."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const certRows = useMemo(
    () => (supplier ? CERTS.filter(([, v, d, st]) => supplier[v] || supplier[d] != null || supplier[st]) : []),
    [supplier],
  );
  const licenseRows = useMemo(() => (supplier ? LICENSES.filter(([, v, d]) => supplier[v] || supplier[d] != null) : []), [supplier]);
  const expiring = useMemo(
    () => [...certRows.map((c) => supplier[c[2]]), ...licenseRows.map((l) => supplier[l[2]])].filter((d) => d !== null && d !== undefined && d !== ""),
    [certRows, licenseRows, supplier],
  );
  const expiredCount = expiring.filter((d) => d <= 0).length;
  const soonCount = expiring.filter((d) => d > 0 && d <= 30).length;
  const documents = (supplier?.all_certificates || []).filter((c) => c.url);

  const handleExport = async () => {
    setExporting(true);
    setActionError(null);
    try {
      const res = await exportSupplierToExcel(supplier.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const match = /filename="?([^"]+)"?/.exec(res.headers?.["content-disposition"] || "");
      const a = document.createElement("a");
      a.href = url;
      a.download = match ? match[1] : `Supplier_${supplier.supplier_id || supplier.id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setActionError("Excel export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const shell = (content) => (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div className="ag-app">
        <style>{AGENT_CSS + PRINT_CSS}</style>
        {content}
      </div>
    </div>
  );

  if (loading)
    return shell(
      <div className="ag-loading">
        <div className="ag-spinner" />
        Loading supplier…
      </div>,
    );
  if (error || !supplier)
    return shell(
      <div className="ag-body">
        <div className="ag-state ag-card">
          <div className="ag-state-icon">
            <FiAlertTriangle />
          </div>
          <h3>{error || "Supplier not found."}</h3>
          <button type="button" className="ag-btn ghost" onClick={() => navigate("/suppliers")}>
            <FiArrowLeft /> Back to Suppliers
          </button>
        </div>
      </div>,
    );

  const s = supplier;
  const buildingType = [s.rented_building && "Rented", s.share_building && "Shared", s.own_property && "Owned"].filter(Boolean).join(", ");
  const tabs = [
    { key: "overview", label: "Overview", icon: <FiHome /> },
    { key: "production", label: "Production & commercial", icon: <FiActivity /> },
    { key: "contacts", label: "Contacts", icon: <FiUsers /> },
    { key: "compliance", label: "Compliance", icon: <FiAward />, badge: expiredCount + soonCount },
    { key: "documents", label: "Documents", icon: <FiFileText />, badge: documents.length },
  ];

  return shell(
    <>
      <header className="ag-header">
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <span className="ag-avatar lg">{initialsOf(s.supplier_name)}</span>
          <div style={{ minWidth: 0 }}>
            <nav className="ag-crumbs no-print" aria-label="Breadcrumb">
              <Link to="/suppliers">Suppliers</Link>
              <FiChevronRight />
              <span>{s.supplier_name}</span>
            </nav>
            <h1 className="ag-title">
              {s.supplier_name}
              {s.supplier_category && <span className="ag-count">{s.supplier_category}</span>}
            </h1>
            <p className="ag-subtitle" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {s.supplier_id && <span>ID {s.supplier_id}</span>}
              {s.year_of_establishment && <span>Est. {s.year_of_establishment}</span>}
              {s.location && (
                <span title={s.location} style={{ maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <FiMapPin size={12} style={{ verticalAlign: -1 }} /> {s.location}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="ag-actions no-print">
          <button type="button" className="ag-btn ghost" onClick={() => navigate("/suppliers")}>
            <FiArrowLeft /> Back
          </button>
          <button type="button" className="ag-btn ghost" onClick={() => window.print()}>
            <FiPrinter /> Print
          </button>
          <button type="button" className="ag-btn ghost" onClick={handleExport} disabled={exporting}>
            {exporting ? <span className="ag-spinner sm" /> : <FiDownload />} Excel
          </button>
          <button type="button" className="ag-btn danger-ghost" onClick={() => setDeleting(true)}>
            <FiTrash2 /> Delete
          </button>
          <button type="button" className="ag-btn primary" onClick={() => navigate(`/edit/suppliers/${s.id}`)}>
            <FiEdit2 /> Edit
          </button>
        </div>
      </header>

      <div className="ag-body" style={{ maxWidth: 1400 }}>
        {flash && (
          <div className="ag-alert ok" role="status">
            <FiCheckCircle />
            <span>{flash}</span>
          </div>
        )}
        {actionError && (
          <div className="ag-alert err">
            <FiAlertTriangle />
            <span>{actionError}</span>
          </div>
        )}

        <div className="ag-kpis">
          <div className="ag-kpi">
            <span className="ag-kpi-icon t-blue">
              <FiActivity />
            </span>
            <span>
              <span className="ag-kpi-value" style={{ fontSize: 18 }}>
                {s.capacity_per_month || "—"}
              </span>
              <span className="ag-kpi-label">Capacity / month</span>
            </span>
          </div>
          <div className="ag-kpi">
            <span className="ag-kpi-icon t-violet">
              <FiBriefcase />
            </span>
            <span>
              <span className="ag-kpi-value">{s.number_of_sewing_line ?? "—"}</span>
              <span className="ag-kpi-label">Sewing lines</span>
            </span>
          </div>
          <div className="ag-kpi">
            <span className="ag-kpi-icon t-green">
              <FiUsers />
            </span>
            <span>
              <span className="ag-kpi-value">{s.total_manpower ? Number(s.total_manpower).toLocaleString() : "—"}</span>
              <span className="ag-kpi-label">Manpower</span>
            </span>
          </div>
          <div className="ag-kpi">
            <span className={`ag-kpi-icon ${expiredCount ? "t-red" : soonCount ? "t-amber" : "t-green"}`}>
              {expiredCount ? <FiAlertTriangle /> : soonCount ? <FiClock /> : <FiCheckCircle />}
            </span>
            <span>
              <span className="ag-kpi-value" style={{ fontSize: 18 }}>
                {expiredCount ? `${expiredCount} expired` : soonCount ? `${soonCount} expiring` : "Up to date"}
              </span>
              <span className="ag-kpi-label">Certificates &amp; licences</span>
            </span>
          </div>
        </div>

        <div className="ag-card no-print" style={{ marginBottom: 16 }}>
          <div className="ag-toolbar" style={{ gap: 4, borderBottom: "none" }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`ag-btn sm ${tab === t.key ? "primary" : "ghost"}`}
                style={tab === t.key ? {} : { borderColor: "transparent" }}
                onClick={() => setTab(t.key)}
              >
                {t.icon} {t.label}
                {t.badge ? <span style={{ opacity: 0.8 }}>{t.badge}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {(tab === "overview" || PRINT_ALL) && (
          <>
            <Section icon={<FiHome />} title="Basic information">
              <Info
                s={s}
                items={[
                  ["Supplier ID", "supplier_id"],
                  ["SL No", "sl_no"],
                  ["Category", "supplier_category"],
                  ["Year of establishment", "year_of_establishment"],
                  ["Location", "location"],
                  ["Ownership details", "ownership_details"],
                  ["Compliance status (CSR)", "compliance_status"],
                ]}
              />
            </Section>
            <Section icon={<FiBriefcase />} title="Building & manpower">
              <Info
                s={s}
                items={[
                  ["Building type", () => buildingType || null],
                  ["Total area", (x) => (x.total_area ? `${x.total_area}` : null)],
                  ["Building details", "building_details"],
                  ["Workers (male)", "manpower_workers_male"],
                  ["Workers (female)", "manpower_workers_female"],
                  ["Staff (male)", "manpower_staff_male"],
                  ["Staff (female)", "manpower_staff_female"],
                  ["Total manpower", "total_manpower"],
                ]}
              />
            </Section>
          </>
        )}

        {(tab === "production" || PRINT_ALL) && (
          <Section icon={<FiActivity />} title="Production & commercial">
            <Info
              s={s}
              items={[
                ["Production process", "production_process"],
                ["Manufacturing items", "manufacturing_item"],
                ["Capacity / month", "capacity_per_month"],
                ["Sewing lines", "number_of_sewing_line"],
                ["Total machinery", "total_number_of_machineries"],
                ["Business by market", "business_by_market"],
                ["Existing customers", "existing_customer"],
                [
                  "Yearly turnover (USD)",
                  (x) =>
                    x.yearly_turnover_usd || x.yearly_turnover_usd === 0
                      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(x.yearly_turnover_usd)
                      : null,
                ],
                ["Weekly holiday", "weekly_holiday"],
                ["BGMEA number", "bgmea_number"],
                ["RSC", "rsc"],
                ["TAD Group order status", "tad_group_order_status"],
              ]}
            />
          </Section>
        )}

        {(tab === "contacts" || PRINT_ALL) && (
          <Section icon={<FiUsers />} title="Contacts">
            <Info
              s={s}
              items={[
                ["Factory main contact", "factory_main_contact"],
                ["Merchandiser contact", "factory_merchandiser_contact"],
                ["HR / compliance contact", "factory_hr_compliance_contact"],
                [
                  "Email",
                  (x) =>
                    x.email ? (
                      <a className="ag-contact" href={`mailto:${x.email}`}>
                        <FiMail /> {x.email}
                      </a>
                    ) : null,
                ],
                [
                  "Phone",
                  (x) =>
                    x.phone ? (
                      <span className="ag-contact">
                        <FiPhone /> {x.phone}
                      </span>
                    ) : null,
                ],
                ["Address", "location"],
              ]}
            />
          </Section>
        )}

        {(tab === "compliance" || PRINT_ALL) && (
          <>
            <section className="ag-card ag-section">
              <div className="ag-section-head">
                <h2>
                  <FiAward /> Certifications
                </h2>
              </div>
              {certRows.length === 0 ? (
                <div className="ag-empty-line">No certifications recorded.</div>
              ) : (
                <div className="ag-table-wrap">
                  <table className="ag-table">
                    <thead>
                      <tr>
                        <th>Certificate</th>
                        <th>Valid until</th>
                        <th>Remaining</th>
                        <th>Status</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certRows.map(([label, v, d, st, extra]) => (
                        <tr key={label} style={{ cursor: "default" }}>
                          <td className="ag-name">{label}</td>
                          <td>{fmtDate(s[v]) || "—"}</td>
                          <td>
                            <span className="ag-chip" style={TONE_STYLE[daysTone(s[d])]}>
                              {daysText(s[d])}
                            </span>
                          </td>
                          <td style={{ textTransform: "capitalize" }}>{s[st] ? String(s[st]).replace(/_/g, " ") : "—"}</td>
                          <td style={{ color: "#64748b", fontSize: 12.5 }}>
                            {extra
                              .map(([l, k, t]) => (s[k] ? `${l}: ${t === "date" ? fmtDate(s[k]) : s[k]}` : null))
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {s.certification_remarks && (
                <div className="ag-section-body" style={{ borderTop: "1px solid #e6eaf0", color: "#334155", whiteSpace: "pre-wrap" }}>
                  {s.certification_remarks}
                </div>
              )}
            </section>

            <section className="ag-card ag-section">
              <div className="ag-section-head">
                <h2>
                  <FiFileText /> Licences
                </h2>
              </div>
              {licenseRows.length === 0 ? (
                <div className="ag-empty-line">No licences recorded.</div>
              ) : (
                <div className="ag-table-wrap">
                  <table className="ag-table">
                    <thead>
                      <tr>
                        <th>Licence</th>
                        <th>Valid until</th>
                        <th>Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {licenseRows.map(([label, v, d]) => (
                        <tr key={label} style={{ cursor: "default" }}>
                          <td className="ag-name">{label}</td>
                          <td>{fmtDate(s[v]) || "—"}</td>
                          <td>
                            <span className="ag-chip" style={TONE_STYLE[daysTone(s[d])]}>
                              {daysText(s[d])}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <Section icon={<FiUsers />} title="Wages, benefits & grievances">
              <Info
                s={s}
                items={[
                  ["Minimum wages paid", "minimum_wages_paid", "bool"],
                  ["Earn leave", "earn_leave_status", "bool"],
                  ["Service benefit", "service_benefit", "bool"],
                  ["Maternity benefit", "maternity_benefit", "bool"],
                  ["Yearly increment", "yearly_increment", "bool"],
                  ["Festival bonus", "festival_bonus", "bool"],
                  ["Salary due", "salary_due_status", "bool"],
                  ["Due salary month", "due_salary_month"],
                  ["Grievance mechanism", "grievance_mechanism", "bool"],
                  ["Last grievance resolution", "last_grievance_resolution_date", "date"],
                  ["Grievance resolution rate", (x) => (x.grievance_resolution_rate ? `${x.grievance_resolution_rate}%` : null)],
                  ["Compliance remarks", "compliance_remarks"],
                ]}
              />
            </Section>
            <p className="no-print" style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 16px" }}>
              Full audit, fire-safety and environment details are in the{" "}
              <Link to={`/suppliersCSR/${s.id}`}>
                CSR supplier page <FiExternalLink size={11} />
              </Link>
              .
            </p>
          </>
        )}

        {(tab === "documents" || PRINT_ALL) && (
          <section className="ag-card ag-section">
            <div className="ag-section-head">
              <h2>
                <FiFileText /> Certificates &amp; documents <span className="ag-count">{documents.length}</span>
              </h2>
            </div>
            {documents.length === 0 ? (
              <div className="ag-empty-line">No documents uploaded.</div>
            ) : (
              <div className="ag-section-body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                {documents.map((doc, i) => (
                  <a
                    key={`${doc.field_name || doc.name}-${i}`}
                    href={doc.url.startsWith("http") ? doc.url : `${BACKEND}${doc.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ag-card"
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", textDecoration: "none", color: "inherit" }}
                  >
                    <span className="ag-kpi-icon t-blue" style={{ width: 36, height: 36, fontSize: 16 }}>
                      <FiFileText />
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span className="ag-name" style={{ display: "block" }}>
                        {doc.name}
                      </span>
                      <span className="ag-sub" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {decodeURIComponent(doc.url.split("/").pop() || "")}
                      </span>
                    </span>
                    <FiExternalLink style={{ color: "#94a3b8", flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {deleting && <SupplierDeleteModal supplier={s} onClose={() => setDeleting(false)} onDeleted={() => navigate("/suppliers")} />}
    </>,
  );
}

// Only the current tab is rendered; print what is on screen.
const PRINT_ALL = false;
const PRINT_CSS = `
.t-red { color: #b91c1c; background: #fef2f2; }
@media print {
  .tad-sb-wrap, .tad-menu-btn, .no-print { display: none !important; }
  .ag-app { background: #fff; }
  .ag-header { position: static; border: none; }
  .ag-card, .ag-kpi { box-shadow: none; break-inside: avoid; }
}
`;
