// Company Documents sidebar + page layout. Same shared sidebar as HR /
// Merchandising / Finance / Canada / CSR (common/DeptSidebar), plus a
// "Companies" section so you can jump straight between companies.
import React, { useEffect, useState } from "react";
import { FiGrid, FiHome, FiFileText, FiBriefcase } from "react-icons/fi";
import DeptSidebar from "../common/DeptSidebar";
import { getCompanyDocsDashboard } from "../../api/companyDocsApi";
import { COMPANY_DOCS_CHANGED } from "./companyDocsTheme";

const readJSON = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch {
    return {};
  }
};

// Same destination as the main sidebar's home button.
const homePath = () => (readJSON("permissions").full_access === true ? "/hr-work" : "/dashboard");

export const CompanyDocsSidebar = () => {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      getCompanyDocsDashboard()
        .then((res) => alive && setCompanies(res.data?.companies || []))
        .catch(() => {}); // the page itself shows load errors
    load();
    window.addEventListener(COMPANY_DOCS_CHANGED, load);
    return () => {
      alive = false;
      window.removeEventListener(COMPANY_DOCS_CHANGED, load);
    };
  }, []);

  const sections = [
    {
      label: "Overview",
      items: [{ to: "/company-docs", label: "All Companies", icon: <FiGrid />, exact: true }],
    },
    {
      label: "Companies",
      items: companies.map((c) => {
        const issues = (c.expired || 0) + (c.expiring_soon || 0);
        return {
          to: `/company-docs/${c.id}`,
          label: c.short_name || c.name,
          icon: <FiBriefcase />,
          badge: issues > 0 ? issues : null,
        };
      }),
    },
    {
      label: "Navigate",
      items: [{ to: homePath(), label: "Main Dashboard", icon: <FiHome />, exact: true }],
    },
  ];

  return (
    <DeptSidebar
      title="Company Docs"
      subtitle="Licences · Renewals"
      icon={<FiFileText />}
      sections={sections}
    />
  );
};

/** Sidebar on the left, the page scrolling on the right. */
export const CompanyDocsLayout = ({ children }) => (
  <div className="company-docs-layout" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
    <CompanyDocsSidebar />
    <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>{children}</div>
  </div>
);

export default CompanyDocsSidebar;
