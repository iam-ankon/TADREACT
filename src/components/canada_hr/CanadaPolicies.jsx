import React from "react";
import { FiFileText, FiDownload, FiExternalLink } from "react-icons/fi";

const POLICIES = [
  {
    title: "Employment Standards Act (ESA) — Ontario",
    category: "Employment Standards",
    description: "Minimum employment standards including pay, leaves, termination notice, public holidays, and overtime.",
    link: "https://www.ontario.ca/laws/statute/00e41",
  },
  {
    title: "Canada Labour Code",
    category: "Federal",
    description: "Governs industrial relations, occupational health & safety, and employment standards for federally regulated workplaces.",
    link: "https://laws-lois.justice.gc.ca/eng/acts/L-2/",
  },
  {
    title: "CPP — Canada Pension Plan",
    category: "Statutory Deductions",
    description: "Mandatory pension contributions. 2026 rate: 5.95% employee, max pensionable earnings $73,200, basic exemption $3,500.",
    link: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp.html",
  },
  {
    title: "Employment Insurance (EI)",
    category: "Statutory Deductions",
    description: "2026 rate: 1.66% employee, 2.32% employer, max insurable earnings $63,200.",
    link: "https://www.canada.ca/en/employment-social-development/programs/ei/ei-list/ei-employers/premium.html",
  },
  {
    title: "Human Rights Code",
    category: "Anti-Discrimination",
    description: "Prohibits discrimination in employment based on protected grounds including race, gender, disability, age, religion, and more.",
    link: "https://www.ontario.ca/laws/statute/90h19",
  },
  {
    title: "Occupational Health & Safety Act (OHSA)",
    category: "Workplace Safety",
    description: "Employer obligations to maintain safe workplaces, worker rights to refuse unsafe work, and WSIB requirements.",
    link: "https://www.ontario.ca/laws/statute/90o01",
  },
  {
    title: "Personal Information Protection and Electronic Documents Act (PIPEDA)",
    category: "Privacy",
    description: "Governs how private-sector organizations collect, use, and disclose personal information.",
    link: "https://laws-lois.justice.gc.ca/eng/acts/P-8.6/",
  },
];

const CATEGORY_COLORS = {
  "Employment Standards": { bg: "#EEF2FF", color: "#1E40AF" },
  "Federal":              { bg: "#F0FDF4", color: "#166534" },
  "Statutory Deductions": { bg: "#FFFBEB", color: "#92400E" },
  "Anti-Discrimination":  { bg: "#FDF4FF", color: "#6B21A8" },
  "Workplace Safety":     { bg: "#FFF7ED", color: "#9A3412" },
  "Privacy":              { bg: "#F0F9FF", color: "#0369A1" },
};

export default function CanadaPolicies() {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "#0F172A", margin: 0 }}>HR policies</h1>
        <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
          Canadian labour laws & compliance references
        </p>
      </div>

      <div style={{
        background: "linear-gradient(135deg,#EEF2FF,#fff)",
        border: "0.5px solid #C7D2FE", borderRadius: 12,
        padding: "14px 16px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <FiFileText style={{ color: "#4338CA", fontSize: 20 }} />
        <div>
          <div style={{ fontWeight: 500, color: "#1E40AF", fontSize: 13 }}>
            Compliance reminder
          </div>
          <div style={{ fontSize: 12, color: "#312E81" }}>
            All Canada Office employees are subject to applicable provincial and federal employment laws.
            Consult your legal team before making changes to compensation, termination, or leave policies.
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
        {POLICIES.map((p) => {
          const cat = CATEGORY_COLORS[p.category] || { bg: "#F1F5F9", color: "#475569" };
          return (
            <div key={p.title} style={{
              background: "#fff", border: "0.5px solid #E2E8F0",
              borderRadius: 12, padding: 16,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{
                  padding: "2px 8px", borderRadius: 10, fontSize: 10.5,
                  fontWeight: 500, background: cat.bg, color: cat.color,
                }}>
                  {p.category}
                </span>
                <a href={p.link} target="_blank" rel="noopener noreferrer"
                  style={{ color: "#94A3B8", fontSize: 14, display: "flex" }}>
                  <FiExternalLink />
                </a>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", marginBottom: 6 }}>
                {p.title}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>
                {p.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
