// Department sidebar used by HR, Merchandising, Finance and Canada.
// Each department passes its own (already permission-filtered) menu; this
// component only draws it, so the look is the same everywhere.
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiLogOut } from "react-icons/fi";
import "../../styles/sidebar.css";

const readOpen = (storageKey) => {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored !== null ? JSON.parse(stored) : true;
  } catch {
    return true;
  }
};

const initialsOf = (name) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2) || "U";

/**
 * sections: [{ label, items: [{ to, icon, label, badge, match, exact }] }]
 *   match: extra path prefixes that also mark the item active
 *   exact: active only on the exact path (default: also on sub-paths)
 * storageKey: localStorage key for the open/closed state
 * onLogout: when given, the user card shows a logout button
 */
const DeptSidebar = ({
  title,
  subtitle,
  icon,
  sections,
  storageKey = "sidebarsOpenState",
  userRole,
  onLogout,
}) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(() => readOpen(storageKey));

  const toggle = () =>
    setIsOpen((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });

  const path = location.pathname;
  const allItems = sections.flatMap((s) => s.items);
  // The most specific matching entry wins (e.g. /orders/tna over /orders).
  const activeTo = allItems
    .filter(
      (item) =>
        path === item.to ||
        (!item.exact && path.startsWith(`${item.to}/`)) ||
        (item.match || []).some((prefix) => path.startsWith(prefix)),
    )
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;

  const name = localStorage.getItem("employee_name") || localStorage.getItem("username") || "";
  const role = userRole || localStorage.getItem("designation") || "";

  return (
    <div className="tad-sb-wrap">
      <aside className={`tad-sb ${isOpen ? "" : "collapsed"}`} aria-label={`${title} menu`}>
        <div className="tad-sb-header">
          {icon && <span className="tad-sb-mark">{icon}</span>}
          {isOpen && (
            <div className="tad-sb-brand">
              <span className="tad-sb-title">{title}</span>
              {subtitle && <span className="tad-sb-subtitle">{subtitle}</span>}
            </div>
          )}
        </div>

        <nav className="tad-sb-nav">
          {sections
            .filter((section) => section.items.length > 0)
            .map((section) => (
              <div className="tad-sb-section" key={section.label || "main"}>
                {section.label && <div className="tad-sb-section-label">{section.label}</div>}
                <ul className="tad-sb-list">
                  {section.items.map((item) => (
                    <li key={item.to + item.label}>
                      <Link
                        to={item.to}
                        onClick={item.onClick}
                        className={`tad-sb-link ${activeTo === item.to ? "active" : ""} ${
                          item.highlight ? "highlight" : ""
                        }`}
                        title={isOpen ? undefined : item.label}
                        aria-current={activeTo === item.to ? "page" : undefined}
                      >
                        <span className="tad-sb-icon">{item.icon}</span>
                        {isOpen && <span className="tad-sb-label">{item.label}</span>}
                        {item.badge ? <span className="tad-sb-badge">{item.badge}</span> : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </nav>

        {name && (
          <div className="tad-sb-footer">
            <div className="tad-sb-user" title={isOpen ? undefined : `${name}${role ? ` — ${role}` : ""}`}>
              <span className="tad-sb-avatar">{initialsOf(name)}</span>
              {isOpen && (
                <div className="tad-sb-user-text">
                  <div className="tad-sb-user-name">{name}</div>
                  {role && <div className="tad-sb-user-role">{role}</div>}
                </div>
              )}
              {isOpen && onLogout && (
                <button type="button" className="tad-sb-icon-btn" onClick={onLogout} title="Logout">
                  <FiLogOut />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      <button
        type="button"
        className="tad-sb-toggle"
        onClick={toggle}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        title={isOpen ? "Collapse" : "Expand"}
      >
        {isOpen ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
      </button>
    </div>
  );
};

export default DeptSidebar;
