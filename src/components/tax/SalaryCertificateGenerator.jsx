// SalaryCertificateGenerator.jsx - Excel salary certificates (ZIP) for
// selected employees and purposes.
import React, { useState, useEffect, useMemo } from "react";
import { FaFileExcel, FaCheck, FaCertificate, FaUsers, FaListUl } from "react-icons/fa";
import { financeAPI } from "../../api/finance";
import {
  FinanceShell,
  Card,
  Kpi,
  Badge,
  Alert,
  LoadingState,
  EmptyState,
  SearchInput,
  Field,
  downloadBlob,
  MONTH_NAMES,
} from "./finance/FinanceUI";

// Certificate types
const CERTIFICATE_TYPES = [
  { id: 1, name: "Banking & Loans", icon: "🏦", description: "For loan applications" },
  { id: 2, name: "Visa & Immigration", icon: "🛂", description: "With Passport & NID" },
  { id: 3, name: "Government & Regulatory", icon: "🏛️", description: "With NID verification" },
  { id: 4, name: "Housing & Rentals", icon: "🏠", description: "For rental agreements" },
  { id: 5, name: "Insurance & Medical", icon: "🏥", description: "For insurance coverage" },
  { id: 6, name: "Internal HR Verification", icon: "📋", description: "For HR purposes" },
  { id: 7, name: "Employee Personal Needs", icon: "👤", description: "For personal use" },
  { id: 8, name: "Income Tax Submission", icon: "💰", description: "For tax filing" },
];

const SalaryCertificateGenerator = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState(CERTIFICATE_TYPES.map((t) => t.id));
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      try {
        const response = await financeAPI.employee.getAll(month, year);
        let employeeData = response.data;
        if (employeeData && employeeData.data) employeeData = employeeData.data;
        if (!Array.isArray(employeeData)) employeeData = [];
        setEmployees(employeeData);
        setSelectedEmployees(employeeData.map((emp) => emp.employee_id));
      } catch (err) {
        console.error("Failed to load employees:", err);
        setNotice({ tone: "danger", text: "Failed to load employees." });
      } finally {
        setLoading(false);
      }
    };
    loadEmployees();
  }, [month, year]);

  const companies = useMemo(
    () => [...new Set(employees.map((e) => e.company_name).filter(Boolean))].sort(),
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return employees.filter(
      (emp) =>
        (companyFilter === "All" || emp.company_name === companyFilter) &&
        (emp.name?.toLowerCase().includes(q) ||
          emp.employee_id?.toString().toLowerCase().includes(q) ||
          emp.designation?.toLowerCase().includes(q)),
    );
  }, [employees, searchQuery, companyFilter]);

  const selectedSet = useMemo(() => new Set(selectedEmployees), [selectedEmployees]);
  const visibleIds = filteredEmployees.map((e) => e.employee_id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));

  // Select / deselect the employees currently shown (all of them when no
  // search or company filter is active).
  const handleSelectAll = () => {
    if (allVisibleSelected) {
      const hide = new Set(visibleIds);
      setSelectedEmployees(selectedEmployees.filter((id) => !hide.has(id)));
    } else {
      setSelectedEmployees([...new Set([...selectedEmployees, ...visibleIds])]);
    }
  };

  const handleToggleEmployee = (employeeId) => {
    setSelectedEmployees(
      selectedSet.has(employeeId)
        ? selectedEmployees.filter((id) => id !== employeeId)
        : [...selectedEmployees, employeeId],
    );
  };

  const handleToggleType = (typeId) => {
    setSelectedTypes(
      selectedTypes.includes(typeId) ? selectedTypes.filter((id) => id !== typeId) : [...selectedTypes, typeId],
    );
  };

  const handleSelectAllTypes = () => {
    setSelectedTypes(
      selectedTypes.length === CERTIFICATE_TYPES.length ? [] : CERTIFICATE_TYPES.map((t) => t.id),
    );
  };

  const totalCertificates = selectedEmployees.length * selectedTypes.length;

  const handleGenerate = async () => {
    if (selectedEmployees.length === 0) {
      setNotice({ tone: "warning", text: "Please select at least one employee." });
      return;
    }
    if (selectedTypes.length === 0) {
      setNotice({ tone: "warning", text: "Please select at least one certificate type." });
      return;
    }

    setGenerating(true);
    setNotice(null);
    try {
      const response = await financeAPI.salaryRecords.generateSalaryCertificates({
        employee_ids: selectedEmployees,
        certificate_types: selectedTypes,
        month,
        year,
      });
      downloadBlob(response.data, `Salary_Certificates_${month}_${year}.zip`);
      setNotice({
        tone: "success",
        text: `${totalCertificates} salary certificates generated and downloaded.`,
      });
    } catch (err) {
      console.error("Error generating certificates:", err);
      let message = err.message;
      const data = err.response?.data;
      if (data instanceof Blob) {
        try {
          const json = JSON.parse(await data.text());
          message = json.error || message;
        } catch {
          // not JSON
        }
      }
      setNotice({ tone: "danger", text: `Error generating certificates: ${message}` });
    } finally {
      setGenerating(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <FinanceShell
      title="Salary Certificates"
      icon={<FaCertificate />}
      subtitle="Excel certificates in the official TAD Group format — one ZIP file with a certificate per employee and purpose."
      actions={
        <button
          className="fin-btn fin-btn--primary"
          onClick={handleGenerate}
          disabled={generating || selectedEmployees.length === 0 || selectedTypes.length === 0}
        >
          {generating ? <span className="fin-spinner fin-spinner--sm" /> : <FaFileExcel />}
          {generating ? `Generating ${totalCertificates}…` : `Generate ${totalCertificates} certificates`}
        </button>
      }
    >
      <div className="fin-stack">
        {notice && (
          <Alert
            tone={notice.tone}
            action={
              <button className="fin-btn fin-btn--ghost fin-btn--sm" onClick={() => setNotice(null)}>
                ×
              </button>
            }
          >
            {notice.text}
          </Alert>
        )}

        {generating && (
          <Card>
            <div className="fin-row" style={{ marginBottom: 8 }}>
              <strong>Preparing certificates…</strong>
              <span className="text-muted">This can take a minute for many employees.</span>
            </div>
            <div className="fin-progress fin-progress--indeterminate">
              <div className="fin-progress-fill" />
            </div>
          </Card>
        )}

        <div className="fin-kpis">
          <Kpi tone="primary" icon={<FaUsers />} label="Employees selected" value={`${selectedEmployees.length} / ${employees.length}`} />
          <Kpi tone="info" icon={<FaListUl />} label="Certificate types" value={`${selectedTypes.length} / ${CERTIFICATE_TYPES.length}`} />
          <Kpi tone="success" icon={<FaCertificate />} label="Certificates" value={totalCertificates} hint="Output: ZIP of Excel files" />
        </div>

        <Card title="Period" subtitle="Salary figures on the certificates come from this month.">
          <div className="fin-toolbar">
            <Field label="Month">
              <select className="fin-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Year">
              <select className="fin-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card
          title="Certificate types"
          actions={
            <button className="fin-btn fin-btn--sm" onClick={handleSelectAllTypes}>
              {selectedTypes.length === CERTIFICATE_TYPES.length ? "Deselect all" : "Select all"}
            </button>
          }
        >
          <div className="fin-tiles">
            {CERTIFICATE_TYPES.map((type) => {
              const selected = selectedTypes.includes(type.id);
              return (
                <button
                  key={type.id}
                  type="button"
                  className={`fin-tile ${selected ? "selected" : ""}`}
                  onClick={() => handleToggleType(type.id)}
                  aria-pressed={selected}
                >
                  <span className="fin-tile-box">{selected && <FaCheck />}</span>
                  <span style={{ fontSize: 20 }} aria-hidden>
                    {type.icon}
                  </span>
                  <span className="fin-tile-text">
                    <span className="fin-tile-title">{type.name}</span>
                    <span className="fin-tile-sub">{type.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card
          title="Employees"
          subtitle="Click an employee to include or exclude them."
          actions={
            <>
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Name, ID or designation…" />
              <select
                className="fin-select"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                aria-label="Company"
              >
                <option value="All">All companies</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button className="fin-btn fin-btn--sm" onClick={handleSelectAll} disabled={!visibleIds.length}>
                {allVisibleSelected ? "Deselect shown" : "Select shown"}
              </button>
              <Badge tone="primary">{selectedEmployees.length} selected</Badge>
            </>
          }
        >
          {loading ? (
            <LoadingState title="Loading employees…" />
          ) : filteredEmployees.length === 0 ? (
            <EmptyState title="No employees found">Try a different search or company.</EmptyState>
          ) : (
            <div className="fin-tiles">
              {filteredEmployees.map((emp) => {
                const selected = selectedSet.has(emp.employee_id);
                return (
                  <button
                    key={emp.employee_id}
                    type="button"
                    className={`fin-tile ${selected ? "selected" : ""}`}
                    onClick={() => handleToggleEmployee(emp.employee_id)}
                    aria-pressed={selected}
                    title={`${emp.name || "Unknown"} — ${emp.company_name || ""}`}
                  >
                    <span className="fin-tile-box">{selected && <FaCheck />}</span>
                    <span className="fin-tile-text">
                      <span className="fin-tile-title">{emp.name || "Unknown"}</span>
                      <span className="fin-tile-sub">
                        {emp.employee_id} · {emp.designation || "N/A"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </FinanceShell>
  );
};

export default SalaryCertificateGenerator;
