// SalaryComparison.jsx - compare saved salary records of two months.
import React, { useState, useEffect, useMemo } from "react";
import {
  FaChartLine,
  FaFileExport,
  FaExclamationTriangle,
  FaUsers,
  FaMoneyBillWave,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaEye,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronDown,
  FaChevronUp,
  FaCalculator,
  FaTimes,
  FaExchangeAlt,
} from "react-icons/fa";
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

const money = (v) => `৳${(Number(v) || 0).toLocaleString()}`;

const COLUMN_GROUPS = [
  {
    title: "Employee",
    items: [
      ["employee_id", "Employee ID"],
      ["employee_name", "Name"],
      ["designation", "Designation"],
      ["status", "Status"],
    ],
  },
  { title: "month1", items: [["gross_month1", "Gross"], ["net_pay_month1", "Net Pay"], ["cash_salary_month1", "Cash Salary"]] },
  { title: "month2", items: [["gross_month2", "Gross"], ["net_pay_month2", "Net Pay"], ["cash_salary_month2", "Cash Salary"]] },
  {
    title: "Difference",
    items: [
      ["gross_diff", "Gross difference"],
      ["net_pay_diff", "Net pay difference"],
      ["cash_salary_diff", "Cash salary difference"],
    ],
  },
  {
    title: "Detail panel",
    items: [
      ["ait_diff", "AIT difference"],
      ["days_diff", "Days worked difference"],
      ["ot_diff", "OT difference"],
    ],
  },
];

const SalaryComparison = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [sortField, setSortField] = useState("employee_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [visibleColumns, setVisibleColumns] = useState({
    employee_id: true,
    employee_name: true,
    designation: true,
    status: true,
    gross_month1: true,
    net_pay_month1: true,
    cash_salary_month1: true,
    gross_month2: true,
    net_pay_month2: true,
    cash_salary_month2: true,
    gross_diff: true,
    net_pay_diff: true,
    cash_salary_diff: true,
    ait_diff: true,
    days_diff: true,
    ot_diff: true,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  // First period = this month, second = previous month
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [month1, setMonth1] = useState(now.getMonth() + 1);
  const [year1, setYear1] = useState(now.getFullYear());
  const [month2, setMonth2] = useState(prev.getMonth() + 1);
  const [year2, setYear2] = useState(prev.getFullYear());
  const [selectedCompany, setSelectedCompany] = useState("All Companies");
  const [companies, setCompanies] = useState([]);

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  // Companies for the filter
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await financeAPI.salaryRecords.getAllRecords({});
        if (response.data && response.data.data) {
          setCompanies(
            [...new Set(response.data.data.map((r) => r.company_name).filter(Boolean))].sort(),
          );
        }
      } catch (err) {
        console.error("Failed to load companies:", err);
      }
    };
    loadCompanies();
  }, []);

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await financeAPI.salaryRecords.compareTwoMonths({
        month1,
        year1,
        month2,
        year2,
        company_name: selectedCompany !== "All Companies" ? selectedCompany : "",
      });

      if (response.data.success) {
        setComparisonData(response.data.comparison);
        setExpandedRows({});
      } else {
        setError(response.data.error || "Failed to load comparison data");
      }
    } catch (err) {
      console.error("Comparison error:", err);
      setError(err.response?.data?.error || err.message || "Failed to load comparison data");
    } finally {
      setLoading(false);
    }
  };

  const swapPeriods = () => {
    setMonth1(month2);
    setYear1(year2);
    setMonth2(month1);
    setYear2(year1);
  };

  const exportToExcel = async () => {
    if (!comparisonData) return;
    setExporting(true);
    try {
      const response = await financeAPI.salaryRecords.exportComparisonExcel({
        month1,
        year1,
        month2,
        year2,
        company_name: selectedCompany !== "All Companies" ? selectedCompany : null,
        comparison_data: comparisonData.employees,
        summary: comparisonData.summary,
      });

      let filename = `Salary_Comparison_${MONTH_NAMES[month1 - 1]}_${year1}_vs_${MONTH_NAMES[month2 - 1]}_${year2}.xlsx`;
      if (selectedCompany !== "All Companies") {
        filename = `${selectedCompany.replace(/\s+/g, "_")}_Comparison_${MONTH_NAMES[month1 - 1]}_${year1}_vs_${MONTH_NAMES[month2 - 1]}_${year2}.xlsx`;
      }
      downloadBlob(response.data, filename);
    } catch (err) {
      console.error("Export error:", err);
      setError("Failed to export comparison data");
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "joined") return <Badge tone="success">New joinee</Badge>;
    if (status === "left") return <Badge tone="danger">Left</Badge>;
    return <Badge tone="primary">Active</Badge>;
  };

  const getChangeIndicator = (value) => {
    const v = Number(value) || 0;
    if (v > 0)
      return (
        <span className="text-pos" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <FaArrowUp size={10} /> +{v.toLocaleString()}
        </span>
      );
    if (v < 0)
      return (
        <span className="text-neg" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <FaArrowDown size={10} /> {v.toLocaleString()}
        </span>
      );
    return (
      <span className="text-muted" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <FaMinus size={10} /> 0
      </span>
    );
  };

  const getPercentChange = (value) => {
    const v = Number(value) || 0;
    if (!v) return null;
    return (
      <span className={`fin-cell-note ${v > 0 ? "fin-cell-note--success" : "fin-cell-note--danger"}`}>
        {v > 0 ? `+${v}` : v}%
      </span>
    );
  };

  const toggleRow = (employeeId) =>
    setExpandedRows((prevRows) => ({ ...prevRows, [employeeId]: !prevRows[employeeId] }));

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort style={{ opacity: 0.35 }} size={11} />;
    return sortDirection === "asc" ? <FaSortUp size={11} /> : <FaSortDown size={11} />;
  };

  const toggleColumn = (column) => setVisibleColumns((p) => ({ ...p, [column]: !p[column] }));

  const employees = useMemo(() => {
    if (!comparisonData?.employees) return [];
    const q = searchTerm.toLowerCase();
    const filtered = comparisonData.employees.filter(
      (emp) =>
        emp.employee_name?.toLowerCase().includes(q) ||
        emp.employee_id?.toLowerCase().includes(q) ||
        emp.designation?.toLowerCase().includes(q),
    );

    const statusOrder = { joined: 0, active: 1, left: 2 };
    const value = (emp) => {
      switch (sortField) {
        case "employee_id":
          return emp.employee_id || "";
        case "designation":
          return emp.designation || "";
        case "status":
          return statusOrder[emp.status] ?? 1;
        case "gross_month1":
          return emp.month1_data?.gross_salary || 0;
        case "net_pay_month1":
          return emp.month1_data?.net_pay_bank || 0;
        case "cash_salary_month1":
          return emp.month1_data?.cash_salary || 0;
        case "gross_month2":
          return emp.month2_data?.gross_salary || 0;
        case "net_pay_month2":
          return emp.month2_data?.net_pay_bank || 0;
        case "cash_salary_month2":
          return emp.month2_data?.cash_salary || 0;
        case "gross_diff":
          return emp.differences?.gross_salary?.amount || 0;
        case "net_pay_diff":
          return emp.differences?.net_pay_bank?.amount || 0;
        case "cash_salary_diff":
          return emp.differences?.cash_salary?.amount || 0;
        default:
          return emp.employee_name || "";
      }
    };

    return [...filtered].sort((a, b) => {
      const aVal = value(a);
      const bVal = value(b);
      if (typeof aVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [comparisonData, searchTerm, sortField, sortDirection]);

  const summary = comparisonData?.summary || {};
  const m1Label = comparisonData ? `${comparisonData.month1.month_name} ${comparisonData.month1.year}` : "";
  const m2Label = comparisonData ? `${comparisonData.month2.month_name} ${comparisonData.month2.year}` : "";

  const vc = visibleColumns;
  const m1Cols = ["gross_month1", "net_pay_month1", "cash_salary_month1"].filter((c) => vc[c]);
  const m2Cols = ["gross_month2", "net_pay_month2", "cash_salary_month2"].filter((c) => vc[c]);
  const diffCols = ["gross_diff", "net_pay_diff", "cash_salary_diff"].filter((c) => vc[c]);
  const infoCount = ["employee_id", "employee_name", "designation", "status"].filter((c) => vc[c]).length;

  const sortTh = (field, label, extra = "") => (
    <th key={field} className={`sortable ${extra}`} onClick={() => handleSort(field)}>
      <span className="fin-row" style={{ gap: 5, flexWrap: "nowrap", justifyContent: extra.includes("num") ? "flex-end" : "flex-start" }}>
        {label} {getSortIcon(field)}
      </span>
    </th>
  );

  const diffCell = (diff) => (
    <td className="num">
      <div className="fin-cell-stack" style={{ alignItems: "flex-end" }}>
        {getChangeIndicator(diff?.amount || 0)}
        {getPercentChange(diff?.percent || 0)}
      </div>
    </td>
  );

  const detail = (label, v1, v2, diff, isMoney = true) => (
    <div className="fin-dl-item" key={label}>
      <div className="fin-dl-label">{label}</div>
      <div className="fin-dl-values">
        <span>
          {m1Label}: <strong>{isMoney ? money(v1) : v1 || 0}</strong>
        </span>
        <span>
          {m2Label}: <strong>{isMoney ? money(v2) : v2 || 0}</strong>
        </span>
        <span>
          Difference:{" "}
          {isMoney ? (
            getChangeIndicator(diff || 0)
          ) : (
            <strong className={diff > 0 ? "text-pos" : diff < 0 ? "text-neg" : ""}>
              {diff > 0 ? `+${diff}` : diff || 0}
            </strong>
          )}
        </span>
      </div>
    </div>
  );

  return (
    <FinanceShell
      title="Salary Comparison"
      icon={<FaChartLine />}
      subtitle="Compare saved salary records between two months — who joined, who left, and what changed."
      actions={
        comparisonData && (
          <button onClick={exportToExcel} className="fin-btn" disabled={exporting}>
            <FaFileExport /> {exporting ? "Exporting…" : "Export to Excel"}
          </button>
        )
      }
    >
      <div className="fin-stack">
        <Card>
          <div className="fin-toolbar">
            <Field label="First period">
              <div className="fin-row" style={{ flexWrap: "nowrap" }}>
                <select className="fin-select" value={month1} onChange={(e) => setMonth1(Number(e.target.value))}>
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select className="fin-select" value={year1} onChange={(e) => setYear1(Number(e.target.value))}>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
            <button
              type="button"
              className="fin-btn fin-btn--ghost fin-btn--icon"
              onClick={swapPeriods}
              title="Swap periods"
              style={{ marginBottom: 3 }}
            >
              <FaExchangeAlt />
            </button>
            <Field label="Second period">
              <div className="fin-row" style={{ flexWrap: "nowrap" }}>
                <select className="fin-select" value={month2} onChange={(e) => setMonth2(Number(e.target.value))}>
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select className="fin-select" value={year2} onChange={(e) => setYear2(Number(e.target.value))}>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
            <Field label="Company">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="fin-select"
                style={{ minWidth: 220 }}
              >
                <option value="All Companies">All Companies</option>
                {companies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </Field>
            <button onClick={fetchComparison} className="fin-btn fin-btn--primary" disabled={loading}>
              <FaChartLine /> {loading ? "Comparing…" : "Compare"}
            </button>
          </div>
        </Card>

        {error && (
          <Alert
            tone="danger"
            action={
              <button onClick={fetchComparison} className="fin-btn fin-btn--sm">
                Retry
              </button>
            }
          >
            {error}
          </Alert>
        )}

        {loading && (
          <Card>
            <LoadingState title="Comparing months…" />
          </Card>
        )}

        {!loading && !comparisonData && !error && (
          <Card>
            <EmptyState icon={<FaChartLine />} title="Choose two months and press Compare">
              The comparison uses the saved salary records of each month.
            </EmptyState>
          </Card>
        )}

        {!loading && comparisonData && (
          <>
            <div className="fin-kpis">
              <Kpi
                tone="primary"
                icon={<FaUsers />}
                label="Employees"
                value={`${summary.total_employees_month1 ?? 0} → ${summary.total_employees_month2 ?? 0}`}
                hint={
                  <span className="fin-row" style={{ gap: 6 }}>
                    <Badge tone="success">+{summary.employees_joined || 0} joined</Badge>
                    <Badge tone="danger">−{summary.employees_left || 0} left</Badge>
                    <Badge>{summary.employees_active || 0} active</Badge>
                  </span>
                }
              />
              <Kpi
                icon={<FaMoneyBillWave />}
                label="Total gross salary"
                value={getChangeIndicator(summary.total_gross_change || 0)}
                hint={`${m1Label}: ${money(summary.total_gross_month1)} · ${m2Label}: ${money(summary.total_gross_month2)}${
                  summary.total_gross_percent ? ` · ${summary.total_gross_percent}%` : ""
                }`}
              />
              <Kpi
                tone="success"
                icon={<FaMoneyBillWave />}
                label="Total net pay"
                value={getChangeIndicator(summary.total_net_pay_change || 0)}
                hint={`${m1Label}: ${money(summary.total_net_pay_month1)} · ${m2Label}: ${money(summary.total_net_pay_month2)}`}
              />
              <Kpi
                tone="warning"
                icon={<FaCalculator />}
                label="Tax (AIT)"
                value={getChangeIndicator(summary.total_ait_change || 0)}
                hint={`${m1Label}: ${money(summary.total_ait_month1)} · ${m2Label}: ${money(summary.total_ait_month2)}`}
              />
            </div>

            <Card
              flush
              title={`${m1Label} vs ${m2Label}`}
              subtitle="Click a row for AIT, days worked, OT, advance, addition and cash details."
              actions={
                <>
                  <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Name, ID or designation…" />
                  <div className="fin-popover-anchor">
                    <button className="fin-btn fin-btn--sm" onClick={() => setShowColumnMenu(!showColumnMenu)}>
                      <FaEye /> Columns
                    </button>
                    {showColumnMenu && (
                      <div className="fin-popover">
                        <div className="fin-popover-title">
                          Toggle columns
                          <button className="fin-btn fin-btn--ghost fin-btn--icon" onClick={() => setShowColumnMenu(false)}>
                            <FaTimes />
                          </button>
                        </div>
                        {COLUMN_GROUPS.map((group) => (
                          <div key={group.title}>
                            <div className="fin-popover-group">
                              {group.title === "month1" ? m1Label : group.title === "month2" ? m2Label : group.title}
                            </div>
                            {group.items.map(([key, label]) => (
                              <label className="fin-check" key={key}>
                                <input type="checkbox" checked={!!vc[key]} onChange={() => toggleColumn(key)} />
                                {label}
                              </label>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              }
              footer={
                employees.length > 0 && (
                  <div className="fin-row">
                    <span className="text-muted">
                      Showing {employees.length} of {comparisonData.employees.length} employees
                    </span>
                    <span className="fin-spacer" />
                    <button
                      className="fin-btn fin-btn--sm"
                      onClick={() => {
                        const all = {};
                        employees.forEach((emp) => {
                          all[emp.employee_id] = true;
                        });
                        setExpandedRows(all);
                      }}
                    >
                      <FaChevronDown /> Expand all
                    </button>
                    <button className="fin-btn fin-btn--sm" onClick={() => setExpandedRows({})}>
                      <FaChevronUp /> Collapse all
                    </button>
                  </div>
                )
              }
            >
              {employees.length === 0 ? (
                <EmptyState icon={<FaExclamationTriangle />} title="No employees found">
                  No matching employees for your search.
                </EmptyState>
              ) : (
                <div className="fin-table-wrap">
                  <table className="fin-table">
                    <thead>
                      <tr>
                        <th rowSpan={2} style={{ width: 50 }}>
                          SL
                        </th>
                        {infoCount > 0 && (
                          <th colSpan={infoCount} className="fin-th-group" style={{ borderLeft: 0 }}>
                            Employee
                          </th>
                        )}
                        <th rowSpan={2} style={{ width: 30 }} />
                        {m1Cols.length > 0 && (
                          <th colSpan={m1Cols.length} className="fin-th-group">
                            {m1Label}
                          </th>
                        )}
                        {m2Cols.length > 0 && (
                          <th colSpan={m2Cols.length} className="fin-th-group">
                            {m2Label}
                          </th>
                        )}
                        {diffCols.length > 0 && (
                          <th colSpan={diffCols.length} className="fin-th-group">
                            Difference
                          </th>
                        )}
                      </tr>
                      <tr>
                        {vc.employee_id && sortTh("employee_id", "ID")}
                        {vc.employee_name && sortTh("employee_name", "Name")}
                        {vc.designation && sortTh("designation", "Designation")}
                        {vc.status && sortTh("status", "Status")}
                        {vc.gross_month1 && sortTh("gross_month1", "Gross", "num")}
                        {vc.net_pay_month1 && sortTh("net_pay_month1", "Net Pay", "num")}
                        {vc.cash_salary_month1 && sortTh("cash_salary_month1", "Cash Salary", "num")}
                        {vc.gross_month2 && sortTh("gross_month2", "Gross", "num")}
                        {vc.net_pay_month2 && sortTh("net_pay_month2", "Net Pay", "num")}
                        {vc.cash_salary_month2 && sortTh("cash_salary_month2", "Cash Salary", "num")}
                        {vc.gross_diff && sortTh("gross_diff", "Gross", "num")}
                        {vc.net_pay_diff && sortTh("net_pay_diff", "Net Pay", "num")}
                        {vc.cash_salary_diff && sortTh("cash_salary_diff", "Cash Salary", "num")}
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp, idx) => {
                        const open = !!expandedRows[emp.employee_id];
                        const m1 = emp.month1_data || {};
                        const m2 = emp.month2_data || {};
                        const d = emp.differences || {};
                        return (
                          <React.Fragment key={emp.employee_id}>
                            <tr
                              className={`fin-row-clickable ${open ? "fin-row-expanded" : ""}`}
                              onClick={() => toggleRow(emp.employee_id)}
                            >
                              <td className="muted">{idx + 1}</td>
                              {vc.employee_id && <td className="fin-col-id">{emp.employee_id}</td>}
                              {vc.employee_name && <td className="fin-col-name">{emp.employee_name}</td>}
                              {vc.designation && <td className="muted">{emp.designation}</td>}
                              {vc.status && <td>{getStatusBadge(emp.status)}</td>}
                              <td className="muted">{open ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}</td>
                              {vc.gross_month1 && <td className="num">{money(m1.gross_salary)}</td>}
                              {vc.net_pay_month1 && <td className="num">{money(m1.net_pay_bank)}</td>}
                              {vc.cash_salary_month1 && <td className="num">{money(m1.cash_salary)}</td>}
                              {vc.gross_month2 && <td className="num">{money(m2.gross_salary)}</td>}
                              {vc.net_pay_month2 && <td className="num">{money(m2.net_pay_bank)}</td>}
                              {vc.cash_salary_month2 && <td className="num">{money(m2.cash_salary)}</td>}
                              {vc.gross_diff && diffCell(d.gross_salary)}
                              {vc.net_pay_diff && diffCell(d.net_pay_bank)}
                              {vc.cash_salary_diff && diffCell(d.cash_salary)}
                            </tr>
                            {open && (
                              <tr className="fin-row-detail">
                                <td colSpan={100} style={{ whiteSpace: "normal", padding: 14 }}>
                                  <div className="fin-dl">
                                    {vc.ait_diff && detail("AIT (Tax)", m1.ait, m2.ait, d.ait)}
                                    {vc.days_diff && detail("Days worked", m1.days_worked, m2.days_worked, d.days_worked, false)}
                                    {vc.ot_diff && detail("OT minutes", m1.ot_hours, m2.ot_hours, d.ot_hours, false)}
                                    {detail("Advance", m1.advance, m2.advance, d.advance)}
                                    {detail("Addition", m1.addition, m2.addition, d.addition)}
                                    {detail("Cash payment", m1.cash_payment, m2.cash_payment, d.cash_payment)}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </FinanceShell>
  );
};

export default SalaryComparison;
