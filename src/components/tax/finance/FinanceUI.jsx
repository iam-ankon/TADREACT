// Shared layout and building blocks for the Finance department pages.
import React from "react";
import DeptSidebar from "../../common/DeptSidebar";
import {
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaInbox,
  FaSearch,
} from "react-icons/fa";
import {
  FiPercent,
  FiFileText,
  FiClock,
  FiBarChart2,
  FiGift,
  FiArchive,
  FiAward,
  FiHome,
  FiDollarSign,
} from "react-icons/fi";
import "./finance.css";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// "৳1,234" / "-৳1,234"; anything that is not a number shows as ৳0.
export const formatMoney = (value) => {
  const num = Number(value);
  if (value === null || value === undefined || value === "" || Number.isNaN(num)) return "৳0";
  const formatted = Math.abs(num).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return num < 0 ? `-৳${formatted}` : `৳${formatted}`;
};

// Dates arrive from the API as "YYYY-MM-DD"; older data used "DD/MM/YYYY".
export const parseFlexibleDate = (value) => {
  if (!value) return null;
  const parts = String(value).trim().split(/[/\-]/);
  if (parts.length !== 3) return null;
  let year;
  let month;
  let day;
  if (parts[0].length === 4) {
    [year, month, day] = parts.map(Number);
  } else {
    [day, month, year] = parts.map(Number);
    if (year < 100) year += 2000;
  }
  if ([year, month, day].some(Number.isNaN)) return null;
  return new Date(year, month - 1, day);
};

// Save a blob response from axios as a file.
export const downloadBlob = (data, filename, type) => {
  const blob = data instanceof Blob ? data : new Blob([data], type ? { type } : undefined);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const readJSON = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch {
    return {};
  }
};

// Same destination as the main sidebar's home button.
const homePath = () => {
  const permissions = readJSON("permissions");
  return permissions.full_access === true ? "/hr-work" : "/dashboard";
};

const NAV_ITEMS = [
  { to: "/finance-provision", label: "Tax Provision", icon: <FiPercent />, match: ["/tax-calculator"] },
  { to: "/salary-format", label: "Salary Sheet", icon: <FiFileText /> },
  { to: "/salary-records", label: "Salary Records", icon: <FiClock /> },
  { to: "/salary-comparison", label: "Salary Comparison", icon: <FiBarChart2 /> },
  { to: "/bonus-format", label: "Bonus Sheet", icon: <FiGift /> },
  { to: "/bonus-records", label: "Bonus Records", icon: <FiArchive /> },
  { to: "/salary-certificate-generator", label: "Certificates", icon: <FiAward /> },
];

const financeSections = () => [
  { label: "Payroll & Tax", items: NAV_ITEMS },
  {
    label: "Navigate",
    items: [{ to: homePath(), label: "Main Dashboard", icon: <FiHome />, exact: true }],
  },
];

export const FinanceShell = ({ title, subtitle, icon, meta, actions, children }) => (
  <div className="fin-app">
    <DeptSidebar
      title="Finance"
      subtitle="Payroll · Tax · Bonus"
      icon={<FiDollarSign />}
      sections={financeSections()}
    />

    <main className="fin-main">
      {(title || actions) && (
        <div className="fin-page-header">
          <div className="fin-title-block">
            {icon && <div className="fin-title-icon">{icon}</div>}
            <div>
              <h1 className="fin-title">
                {title}
                {meta}
              </h1>
              {subtitle && <p className="fin-subtitle">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="fin-header-actions">{actions}</div>}
        </div>
      )}
      {children}
    </main>
  </div>
);

export const Card = ({ title, subtitle, actions, children, footer, flush, className = "" }) => (
  <section className={`fin-card ${className}`}>
    {(title || actions) && (
      <div className="fin-card-header">
        <div>
          {title && <h2 className="fin-card-title">{title}</h2>}
          {subtitle && <p className="fin-card-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="fin-row">{actions}</div>}
      </div>
    )}
    <div className={flush ? "fin-card-body--flush" : "fin-card-body"}>{children}</div>
    {footer && <div className="fin-card-footer">{footer}</div>}
  </section>
);

export const Kpi = ({ label, value, hint, tone, icon, onClick, title }) => (
  <div
    className={`fin-kpi ${tone ? `fin-kpi--${tone}` : ""} ${onClick ? "fin-kpi--clickable" : ""}`}
    onClick={onClick}
    title={title}
    role={onClick ? "button" : undefined}
  >
    <div className="fin-kpi-label">
      {icon}
      {label}
    </div>
    <div className="fin-kpi-value">{value}</div>
    {hint && <div className="fin-kpi-hint">{hint}</div>}
  </div>
);

export const Badge = ({ tone, children, title, className = "" }) => (
  <span className={`fin-badge ${tone ? `fin-badge--${tone}` : ""} ${className}`} title={title}>
    {children}
  </span>
);

const ALERT_ICONS = {
  danger: <FaExclamationTriangle />,
  warning: <FaExclamationTriangle />,
  info: <FaInfoCircle />,
  success: <FaCheckCircle />,
};

export const Alert = ({ tone = "info", title, children, action }) => (
  <div className={`fin-alert fin-alert--${tone}`} role={tone === "danger" ? "alert" : "status"}>
    {ALERT_ICONS[tone]}
    <div className="fin-alert-body">
      {title && <div className="fin-alert-title">{title}</div>}
      {children}
    </div>
    {action}
  </div>
);

export const LoadingState = ({ title = "Loading…", text, page }) => (
  <div className={`fin-state ${page ? "fin-state--page" : ""}`}>
    <div className="fin-spinner" />
    <div className="fin-state-title">{title}</div>
    {text && <div>{text}</div>}
  </div>
);

export const EmptyState = ({ icon = <FaInbox />, title, children, action }) => (
  <div className="fin-state">
    <div className="fin-state-icon">{icon}</div>
    {title && <div className="fin-state-title">{title}</div>}
    {children && <div>{children}</div>}
    {action}
  </div>
);

export const SearchInput = ({ value, onChange, placeholder = "Search…" }) => (
  <div className="fin-search">
    <FaSearch />
    <input
      type="text"
      className="fin-input"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
    {value && (
      <button
        type="button"
        className="fin-search-clear"
        onClick={() => onChange("")}
        aria-label="Clear search"
      >
        ×
      </button>
    )}
  </div>
);

export const Field = ({ label, children, help }) => (
  <label className="fin-field">
    {label && <span className="fin-label">{label}</span>}
    {children}
    {help && <span className="fin-help">{help}</span>}
  </label>
);

// Company selector: one chip per company, click to open/close its sheet.
export const CompanyChips = ({ companies, open, onToggle, tag }) => (
  <div className="fin-chips">
    {companies.map(({ name, count }) => {
      const extra = tag ? tag(name) : null;
      return (
        <button
          key={name}
          type="button"
          className={`fin-chip ${open[name] ? "active" : ""}`}
          onClick={() => onToggle(name)}
          title={name}
        >
          <span className="fin-chip-name">{name}</span>
          {extra && <span className="fin-chip-tag">{extra}</span>}
          <span className="fin-chip-count">{count}</span>
        </button>
      );
    })}
  </div>
);

export const Stat = ({ label, value, highlight }) => (
  <div className={`fin-stat ${highlight ? "fin-stat--highlight" : ""}`}>
    <span className="fin-stat-label">{label}</span>
    <span className="fin-stat-value">{value}</span>
  </div>
);
