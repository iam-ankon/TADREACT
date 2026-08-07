// src/pages/finance/SalaryComparison.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaBuilding,
  FaChartLine,
  FaFileExport,
  FaExclamationTriangle,
  FaSearch,
  FaUsers,
  FaMoneyBillWave,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaDownload,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { financeAPI } from "../../api/finance";

const SalaryComparison = () => {
  const navigate = useNavigate();
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
  const [stickyHeader, setStickyHeader] = useState(true);

  // Refs for sticky header
  const tableHeaderRef = useRef(null);
  const tableContainerRef = useRef(null);

  // Month selection
  const [month1, setMonth1] = useState(new Date().getMonth() + 1);
  const [year1, setYear1] = useState(new Date().getFullYear());
  const [month2, setMonth2] = useState(new Date().getMonth());
  const [year2, setYear2] = useState(new Date().getFullYear());
  const [selectedCompany, setSelectedCompany] = useState("All Companies");
  const [companies, setCompanies] = useState([]);

  const monthNames = [
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

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i,
  );

  // Get current month for month2 default (previous month)
  useEffect(() => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = currentYear - 1;
    }
    setMonth2(prevMonth);
    setYear2(prevYear);
  }, []);

  // Load companies for filter
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await financeAPI.salaryRecords.getAllRecords({});
        if (response.data && response.data.data) {
          const uniqueCompanies = [
            ...new Set(
              response.data.data.map((r) => r.company_name).filter(Boolean),
            ),
          ];
          setCompanies(uniqueCompanies);
        }
      } catch (error) {
        console.error("Failed to load companies:", error);
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
        company_name:
          selectedCompany !== "All Companies" ? selectedCompany : "",
      });

      if (response.data.success) {
        setComparisonData(response.data.comparison);
      } else {
        setError(response.data.error || "Failed to load comparison data");
      }
    } catch (error) {
      console.error("Comparison error:", error);
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to load comparison data",
      );
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!comparisonData) return;

    try {
      const response = await financeAPI.salaryRecords.exportComparisonExcel({
        month1,
        year1,
        month2,
        year2,
        company_name:
          selectedCompany !== "All Companies" ? selectedCompany : null,
        comparison_data: comparisonData.employees,
        summary: comparisonData.summary,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      let filename = `Salary_Comparison_${monthNames[month1 - 1]}_${year1}_vs_${monthNames[month2 - 1]}_${year2}.xlsx`;
      if (selectedCompany !== "All Companies") {
        filename = `${selectedCompany.replace(/\s+/g, "_")}_Comparison.xlsx`;
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export comparison data");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "joined":
        return "#10b981";
      case "left":
        return "#ef4444";
      default:
        return "#3b82f6";
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      joined: { text: "New Joinee", color: "#10b981", icon: "➕" },
      left: { text: "Left", color: "#ef4444", icon: "➖" },
      active: { text: "Active", color: "#3b82f6", icon: "✅" },
    };
    const cfg = config[status] || config.active;
    return (
      <span
        style={{
          background: cfg.color,
          color: "white",
          padding: "4px 10px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: "600",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          whiteSpace: "nowrap",
        }}
      >
        {cfg.icon} {cfg.text}
      </span>
    );
  };

  const getChangeIndicator = (value) => {
    if (value > 0)
      return (
        <span
          style={{
            color: "#10b981",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <FaArrowUp size={10} /> +{value.toLocaleString()}
        </span>
      );
    if (value < 0)
      return (
        <span
          style={{
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <FaArrowDown size={10} /> {value.toLocaleString()}
        </span>
      );
    return (
      <span
        style={{
          color: "#6b7280",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <FaMinus size={10} /> 0
      </span>
    );
  };

  const getPercentChange = (value) => {
    if (value > 0)
      return (
        <span style={{ color: "#10b981", fontSize: "11px" }}>(+{value}%)</span>
      );
    if (value < 0)
      return (
        <span style={{ color: "#ef4444", fontSize: "11px" }}>({value}%)</span>
      );
    return <span style={{ color: "#6b7280", fontSize: "11px" }}>(0%)</span>;
  };

  const toggleRow = (employeeId) => {
    setExpandedRows((prev) => ({ ...prev, [employeeId]: !prev[employeeId] }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field)
      return <FaSort style={{ opacity: 0.3 }} size={12} />;
    return sortDirection === "asc" ? (
      <FaSortUp size={12} />
    ) : (
      <FaSortDown size={12} />
    );
  };

  const toggleColumn = (column) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const filteredAndSortedEmployees = () => {
    if (!comparisonData?.employees) return [];

    let filtered = comparisonData.employees.filter(
      (emp) =>
        emp.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case "employee_id":
          aVal = a.employee_id || "";
          bVal = b.employee_id || "";
          break;
        case "employee_name":
          aVal = a.employee_name || "";
          bVal = b.employee_name || "";
          break;
        case "designation":
          aVal = a.designation || "";
          bVal = b.designation || "";
          break;
        case "status":
          const statusOrder = { joined: 0, active: 1, left: 2 };
          aVal = statusOrder[a.status] || 1;
          bVal = statusOrder[b.status] || 1;
          break;
        case "gross_month1":
          aVal = a.month1_data.gross_salary;
          bVal = b.month1_data.gross_salary;
          break;
        case "net_pay_month1":
          aVal = a.month1_data.net_pay_bank;
          bVal = b.month1_data.net_pay_bank;
          break;
        case "cash_salary_month1":
          aVal = a.month1_data.cash_salary;
          bVal = b.month1_data.cash_salary;
          break;
        case "gross_month2":
          aVal = a.month2_data.gross_salary;
          bVal = b.month2_data.gross_salary;
          break;
        case "net_pay_month2":
          aVal = a.month2_data.net_pay_bank;
          bVal = b.month2_data.net_pay_bank;
          break;
        case "cash_salary_month2":
          aVal = a.month2_data.cash_salary;
          bVal = b.month2_data.cash_salary;
          break;
        case "gross_diff":
          aVal = a.differences.gross_salary.amount;
          bVal = b.differences.gross_salary.amount;
          break;
        case "net_pay_diff":
          aVal = a.differences.net_pay_bank.amount;
          bVal = b.differences.net_pay_bank.amount;
          break;
        case "cash_salary_diff":
          aVal = a.differences.cash_salary?.amount || 0;
          bVal = b.differences.cash_salary?.amount || 0;
          break;
        default:
          aVal = a.employee_name || "";
          bVal = b.employee_name || "";
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  };

  const summary = comparisonData?.summary || {};

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <FaSpinner
            className="spinning"
            style={{ fontSize: "3rem", color: "#7c3aed" }}
          />
          <h2>Loading Finance Dashboard...</h2>
          <p>Fetching employee data and tax calculations</p>
        </div>
        <style jsx>{`
          .loading-screen {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .loading-content {
            text-align: center;
            color: white;
          }
          .spinning {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="salary-comparison-container">
      <div className="dashboard">
        <div className="card">
          {/* Header */}
          <div className="header-section">
            <div className="header-main">
              <div className="title-section">
                <h1 className="main-title">
                  <FaChartLine className="title-icon" />
                  Salary Comparison
                </h1>
                <p className="subtitle">
                  Compare salary records between two different months
                </p>
              </div>

              <div className="controls-section">
                <button
                  onClick={() => navigate("/salary-records")}
                  className="btn btn-back"
                >
                  <FaArrowLeft /> Back to Records
                </button>
              </div>
            </div>
          </div>

          {/* Comparison Controls */}
          <div className="comparison-controls">
            <div className="control-group">
              <label>First Period</label>
              <div className="date-selectors">
                <select
                  value={month1}
                  onChange={(e) => setMonth1(Number(e.target.value))}
                >
                  {monthNames.map((month, idx) => (
                    <option key={idx} value={idx + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={year1}
                  onChange={(e) => setYear1(Number(e.target.value))}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="vs-divider">
              <span>VS</span>
            </div>

            <div className="control-group">
              <label>Second Period</label>
              <div className="date-selectors">
                <select
                  value={month2}
                  onChange={(e) => setMonth2(Number(e.target.value))}
                >
                  {monthNames.map((month, idx) => (
                    <option key={idx} value={idx + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={year2}
                  onChange={(e) => setYear2(Number(e.target.value))}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="control-group">
              <label>Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="company-filter"
              >
                <option value="All Companies">All Companies</option>
                {companies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchComparison}
              className="btn btn-compare"
              disabled={loading}
            >
              <FaChartLine /> Compare
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-section">
              <FaExclamationTriangle />
              <p>{error}</p>
              <button onClick={fetchComparison} className="btn btn-retry">
                Retry
              </button>
            </div>
          )}

          {/* Comparison Results */}
          {comparisonData && !error && (
            <>
              {/* Summary Cards */}
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-icon">
                    <FaUsers />
                  </div>
                  <div className="card-content">
                    <h4>Employees</h4>
                    <div className="employee-stats">
                      <span className="month1">
                        {comparisonData.month1.month_name}{" "}
                        {comparisonData.month1.year}:{" "}
                        {summary.total_employees_month1}
                      </span>
                      <span className="month2">
                        {comparisonData.month2.month_name}{" "}
                        {comparisonData.month2.year}:{" "}
                        {summary.total_employees_month2}
                      </span>
                    </div>
                    <div className="changes">
                      <span className="joined">
                        Joined:{" "}
                        <strong>+{summary.employees_joined || 0}</strong>
                      </span>
                      <span className="left">
                        Left: <strong>-{summary.employees_left || 0}</strong>
                      </span>
                      <span className="active">
                        Active: <strong>{summary.employees_active || 0}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-icon">
                    <FaMoneyBillWave />
                  </div>
                  <div className="card-content">
                    <h4>Total Gross Salary</h4>
                    <div className="amount-stats">
                      <span className="month1">
                        Month 1: ৳
                        {(summary.total_gross_month1 || 0).toLocaleString()}
                      </span>
                      <span className="month2">
                        Month 2: ৳
                        {(summary.total_gross_month2 || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="change-indicator">
                      {getChangeIndicator(summary.total_gross_change || 0)}
                      {getPercentChange(summary.total_gross_percent || 0)}
                    </div>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-icon">
                    <FaMoneyBillWave />
                  </div>
                  <div className="card-content">
                    <h4>Total Net Pay</h4>
                    <div className="amount-stats">
                      <span className="month1">
                        Month 1: ৳
                        {(summary.total_net_pay_month1 || 0).toLocaleString()}
                      </span>
                      <span className="month2">
                        Month 2: ৳
                        {(summary.total_net_pay_month2 || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="change-indicator">
                      {getChangeIndicator(summary.total_net_pay_change || 0)}
                    </div>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-icon">
                    <FaBuilding />
                  </div>
                  <div className="card-content">
                    <h4>Tax (AIT)</h4>
                    <div className="amount-stats">
                      <span className="month1">
                        Month 1: ৳
                        {(summary.total_ait_month1 || 0).toLocaleString()}
                      </span>
                      <span className="month2">
                        Month 2: ৳
                        {(summary.total_ait_month2 || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="change-indicator">
                      {getChangeIndicator(summary.total_ait_change || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="toolbar-section">
                <div className="search-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, ID or designation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="toolbar-actions">
                  <div className="column-menu-container">
                    <button
                      className="btn btn-columns"
                      onClick={() => setShowColumnMenu(!showColumnMenu)}
                    >
                      <FaEye /> Columns
                    </button>
                    {showColumnMenu && (
                      <div className="column-menu">
                        <div className="column-menu-header">
                          <h4>Toggle Columns</h4>
                          <button onClick={() => setShowColumnMenu(false)}>
                            ×
                          </button>
                        </div>
                        <div className="column-menu-items">
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.employee_id}
                              onChange={() => toggleColumn("employee_id")}
                            />
                            Employee ID
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.employee_name}
                              onChange={() => toggleColumn("employee_name")}
                            />
                            Name
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.designation}
                              onChange={() => toggleColumn("designation")}
                            />
                            Designation
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.status}
                              onChange={() => toggleColumn("status")}
                            />
                            Status
                          </label>
                          <hr />
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.gross_month1}
                              onChange={() => toggleColumn("gross_month1")}
                            />
                            {comparisonData.month1.month_name} Gross
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.net_pay_month1}
                              onChange={() => toggleColumn("net_pay_month1")}
                            />
                            {comparisonData.month1.month_name} Net Pay
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.cash_salary_month1}
                              onChange={() =>
                                toggleColumn("cash_salary_month1")
                              }
                            />
                            {comparisonData.month1.month_name} Cash Salary
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.gross_month2}
                              onChange={() => toggleColumn("gross_month2")}
                            />
                            {comparisonData.month2.month_name} Gross
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.net_pay_month2}
                              onChange={() => toggleColumn("net_pay_month2")}
                            />
                            {comparisonData.month2.month_name} Net Pay
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.cash_salary_month2}
                              onChange={() =>
                                toggleColumn("cash_salary_month2")
                              }
                            />
                            {comparisonData.month2.month_name} Cash Salary
                          </label>
                          <hr />
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.gross_diff}
                              onChange={() => toggleColumn("gross_diff")}
                            />
                            Gross Difference
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.net_pay_diff}
                              onChange={() => toggleColumn("net_pay_diff")}
                            />
                            Net Pay Difference
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.cash_salary_diff}
                              onChange={() => toggleColumn("cash_salary_diff")}
                            />
                            Cash Salary Difference
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.ait_diff}
                              onChange={() => toggleColumn("ait_diff")}
                            />
                            AIT Difference
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.days_diff}
                              onChange={() => toggleColumn("days_diff")}
                            />
                            Days Worked Difference
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={visibleColumns.ot_diff}
                              onChange={() => toggleColumn("ot_diff")}
                            />
                            OT Hours Difference
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={exportToExcel} className="btn btn-export">
                    <FaFileExport /> Export to Excel
                  </button>
                </div>
              </div>

              {/* Comparison Table with Fixed Header */}
              <div
                className="table-scroll-container"
                ref={tableContainerRef}
                style={{ maxHeight: "calc(100vh - 450px)", overflow: "auto" }}
              >
                <div className="table-wrapper">
                  <table className="comparison-table">
                    <thead className="sticky-header">
                      <tr className="main-header">
                        <th style={{ width: "50px" }}>SL</th>
                        {visibleColumns.employee_id && (
                          <th
                            style={{ width: "120px" }}
                            onClick={() => handleSort("employee_id")}
                            className="sortable"
                          >
                            ID {getSortIcon("employee_id")}
                          </th>
                        )}
                        {visibleColumns.employee_name && (
                          <th
                            style={{ width: "200px" }}
                            onClick={() => handleSort("employee_name")}
                            className="sortable"
                          >
                            Name {getSortIcon("employee_name")}
                          </th>
                        )}
                        {visibleColumns.designation && (
                          <th
                            style={{ width: "180px" }}
                            onClick={() => handleSort("designation")}
                            className="sortable"
                          >
                            Designation {getSortIcon("designation")}
                          </th>
                        )}
                        {visibleColumns.status && (
                          <th
                            style={{ width: "110px" }}
                            onClick={() => handleSort("status")}
                            className="sortable"
                          >
                            Status {getSortIcon("status")}
                          </th>
                        )}
                        <th style={{ width: "30px" }}></th>
                        {visibleColumns.gross_month1 && (
                          <th colSpan="3" className="month-group">
                            {comparisonData.month1.month_name}{" "}
                            {comparisonData.month1.year}
                          </th>
                        )}
                        {visibleColumns.gross_month2 && (
                          <th colSpan="3" className="month-group">
                            {comparisonData.month2.month_name}{" "}
                            {comparisonData.month2.year}
                          </th>
                        )}
                        {visibleColumns.gross_diff && (
                          <th colSpan="3" className="diff-group">
                            Difference
                          </th>
                        )}
                      </tr>
                      <tr className="sub-header">
                        <th></th>
                        {visibleColumns.employee_id && <th></th>}
                        {visibleColumns.employee_name && <th></th>}
                        {visibleColumns.designation && <th></th>}
                        {visibleColumns.status && <th></th>}
                        <th></th>
                        {visibleColumns.gross_month1 && (
                          <th
                            onClick={() => handleSort("gross_month1")}
                            className="sortable sub"
                          >
                            Gross {getSortIcon("gross_month1")}
                          </th>
                        )}
                        {visibleColumns.net_pay_month1 && (
                          <th
                            onClick={() => handleSort("net_pay_month1")}
                            className="sortable sub"
                          >
                            Net Pay {getSortIcon("net_pay_month1")}
                          </th>
                        )}
                        {visibleColumns.cash_salary_month1 && (
                          <th
                            onClick={() => handleSort("cash_salary_month1")}
                            className="sortable sub"
                          >
                            Cash Salary {getSortIcon("cash_salary_month1")}
                          </th>
                        )}
                        {visibleColumns.gross_month2 && (
                          <th
                            onClick={() => handleSort("gross_month2")}
                            className="sortable sub"
                          >
                            Gross {getSortIcon("gross_month2")}
                          </th>
                        )}
                        {visibleColumns.net_pay_month2 && (
                          <th
                            onClick={() => handleSort("net_pay_month2")}
                            className="sortable sub"
                          >
                            Net Pay {getSortIcon("net_pay_month2")}
                          </th>
                        )}
                        {visibleColumns.cash_salary_month2 && (
                          <th
                            onClick={() => handleSort("cash_salary_month2")}
                            className="sortable sub"
                          >
                            Cash Salary {getSortIcon("cash_salary_month2")}
                          </th>
                        )}
                        {visibleColumns.gross_diff && (
                          <th
                            onClick={() => handleSort("gross_diff")}
                            className="sortable sub"
                          >
                            Gross {getSortIcon("gross_diff")}
                          </th>
                        )}
                        {visibleColumns.net_pay_diff && (
                          <th
                            onClick={() => handleSort("net_pay_diff")}
                            className="sortable sub"
                          >
                            Net Pay {getSortIcon("net_pay_diff")}
                          </th>
                        )}
                        {visibleColumns.cash_salary_diff && (
                          <th
                            onClick={() => handleSort("cash_salary_diff")}
                            className="sortable sub"
                          >
                            Cash Salary {getSortIcon("cash_salary_diff")}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedEmployees().map((emp, idx) => (
                        <React.Fragment key={emp.employee_id}>
                          <tr
                            className={`data-row ${expandedRows[emp.employee_id] ? "expanded" : ""}`}
                            onClick={() => toggleRow(emp.employee_id)}
                            style={{ cursor: "pointer" }}
                          >
                            <td className="sl-number">{idx + 1}</td>
                            {visibleColumns.employee_id && (
                              <td className="emp-id">{emp.employee_id}</td>
                            )}
                            {visibleColumns.employee_name && (
                              <td className="emp-name">{emp.employee_name}</td>
                            )}
                            {visibleColumns.designation && (
                              <td className="emp-designation">
                                {emp.designation}
                              </td>
                            )}
                            {visibleColumns.status && (
                              <td>{getStatusBadge(emp.status)}</td>
                            )}
                            <td className="expand-icon">
                              {expandedRows[emp.employee_id] ? (
                                <FaChevronUp size={12} />
                              ) : (
                                <FaChevronDown size={12} />
                              )}
                            </td>
                            {visibleColumns.gross_month1 && (
                              <td className="gross-salary">
                                ৳
                                {emp.month1_data.gross_salary?.toLocaleString() ||
                                  0}
                              </td>
                            )}
                            {visibleColumns.net_pay_month1 && (
                              <td className="net-pay">
                                ৳
                                {emp.month1_data.net_pay_bank?.toLocaleString() ||
                                  0}
                              </td>
                            )}
                            {visibleColumns.cash_salary_month1 && (
                              <td className="cash-salary">
                                ৳
                                {emp.month1_data.cash_salary?.toLocaleString() ||
                                  0}
                              </td>
                            )}
                            {visibleColumns.gross_month2 && (
                              <td className="gross-salary">
                                ৳
                                {emp.month2_data.gross_salary?.toLocaleString() ||
                                  0}
                              </td>
                            )}
                            {visibleColumns.net_pay_month2 && (
                              <td className="net-pay">
                                ৳
                                {emp.month2_data.net_pay_bank?.toLocaleString() ||
                                  0}
                              </td>
                            )}
                            {visibleColumns.cash_salary_month2 && (
                              <td className="cash-salary">
                                ৳
                                {emp.month2_data.cash_salary?.toLocaleString() ||
                                  0}
                              </td>
                            )}
                            {visibleColumns.gross_diff && (
                              <td
                                className={
                                  emp.differences.gross_salary?.amount > 0
                                    ? "positive"
                                    : emp.differences.gross_salary?.amount < 0
                                      ? "negative"
                                      : "neutral"
                                }
                              >
                                {getChangeIndicator(
                                  emp.differences.gross_salary?.amount || 0,
                                )}
                                {getPercentChange(
                                  emp.differences.gross_salary?.percent || 0,
                                )}
                              </td>
                            )}
                            {visibleColumns.net_pay_diff && (
                              <td
                                className={
                                  emp.differences.net_pay_bank?.amount > 0
                                    ? "positive"
                                    : emp.differences.net_pay_bank?.amount < 0
                                      ? "negative"
                                      : "neutral"
                                }
                              >
                                {getChangeIndicator(
                                  emp.differences.net_pay_bank?.amount || 0,
                                )}
                                {getPercentChange(
                                  emp.differences.net_pay_bank?.percent || 0,
                                )}
                              </td>
                            )}
                            {visibleColumns.cash_salary_diff && (
                              <td
                                className={
                                  emp.differences.cash_salary?.amount > 0
                                    ? "positive"
                                    : emp.differences.cash_salary?.amount < 0
                                      ? "negative"
                                      : "neutral"
                                }
                              >
                                {getChangeIndicator(
                                  emp.differences.cash_salary?.amount || 0,
                                )}
                                {getPercentChange(
                                  emp.differences.cash_salary?.percent || 0,
                                )}
                              </td>
                            )}
                          </tr>

                          {/* Expanded Row */}
                          {expandedRows[emp.employee_id] && (
                            <tr className="expanded-row">
                              <td colSpan="100">
                                <div className="expanded-details">
                                  <div className="detail-section">
                                    <h5>Detailed Breakdown</h5>
                                    <div className="detail-grid">
                                      {visibleColumns.ait_diff && (
                                        <div className="detail-item">
                                          <span className="label">
                                            AIT (Tax)
                                          </span>
                                          <div className="detail-values">
                                            <span>
                                              Month 1: ৳
                                              {emp.month1_data.ait?.toLocaleString() ||
                                                0}
                                            </span>
                                            <span>
                                              Month 2: ৳
                                              {emp.month2_data.ait?.toLocaleString() ||
                                                0}
                                            </span>
                                            <span
                                              className={
                                                emp.differences.ait > 0
                                                  ? "positive"
                                                  : emp.differences.ait < 0
                                                    ? "negative"
                                                    : ""
                                              }
                                            >
                                              Diff:{" "}
                                              {getChangeIndicator(
                                                emp.differences.ait || 0,
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                      <div className="detail-item">
                                        <span className="label">
                                          Days Worked
                                        </span>
                                        <div className="detail-values">
                                          <span>
                                            Month 1:{" "}
                                            {emp.month1_data.days_worked || 0}
                                          </span>
                                          <span>
                                            Month 2:{" "}
                                            {emp.month2_data.days_worked || 0}
                                          </span>
                                          <span
                                            className={
                                              emp.differences.days_worked > 0
                                                ? "positive"
                                                : emp.differences.days_worked <
                                                    0
                                                  ? "negative"
                                                  : ""
                                            }
                                          >
                                            Diff:{" "}
                                            {emp.differences.days_worked > 0
                                              ? `+${emp.differences.days_worked}`
                                              : emp.differences.days_worked}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="detail-item">
                                        <span className="label">OT Hours</span>
                                        <div className="detail-values">
                                          <span>
                                            Month 1:{" "}
                                            {emp.month1_data.ot_hours || 0}
                                          </span>
                                          <span>
                                            Month 2:{" "}
                                            {emp.month2_data.ot_hours || 0}
                                          </span>
                                          <span
                                            className={
                                              emp.differences.ot_hours > 0
                                                ? "positive"
                                                : emp.differences.ot_hours < 0
                                                  ? "negative"
                                                  : ""
                                            }
                                          >
                                            Diff:{" "}
                                            {emp.differences.ot_hours > 0
                                              ? `+${emp.differences.ot_hours}`
                                              : emp.differences.ot_hours}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="detail-item">
                                        <span className="label">Advance</span>
                                        <div className="detail-values">
                                          <span>
                                            Month 1: ৳
                                            {emp.month1_data.advance?.toLocaleString() ||
                                              0}
                                          </span>
                                          <span>
                                            Month 2: ৳
                                            {emp.month2_data.advance?.toLocaleString() ||
                                              0}
                                          </span>
                                          <span
                                            className={
                                              emp.differences.advance > 0
                                                ? "positive"
                                                : emp.differences.advance < 0
                                                  ? "negative"
                                                  : ""
                                            }
                                          >
                                            Diff:{" "}
                                            {getChangeIndicator(
                                              emp.differences.advance || 0,
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="detail-item">
                                        <span className="label">Addition</span>
                                        <div className="detail-values">
                                          <span>
                                            Month 1: ৳
                                            {emp.month1_data.addition?.toLocaleString() ||
                                              0}
                                          </span>
                                          <span>
                                            Month 2: ৳
                                            {emp.month2_data.addition?.toLocaleString() ||
                                              0}
                                          </span>
                                          <span
                                            className={
                                              emp.differences.addition > 0
                                                ? "positive"
                                                : emp.differences.addition < 0
                                                  ? "negative"
                                                  : ""
                                            }
                                          >
                                            Diff:{" "}
                                            {getChangeIndicator(
                                              emp.differences.addition || 0,
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="detail-item">
                                        <span className="label">
                                          Cash Payment
                                        </span>
                                        <div className="detail-values">
                                          <span>
                                            Month 1: ৳
                                            {emp.month1_data.cash_payment?.toLocaleString() ||
                                              0}
                                          </span>
                                          <span>
                                            Month 2: ৳
                                            {emp.month2_data.cash_payment?.toLocaleString() ||
                                              0}
                                          </span>
                                          <span
                                            className={
                                              emp.differences.cash_payment > 0
                                                ? "positive"
                                                : emp.differences.cash_payment <
                                                    0
                                                  ? "negative"
                                                  : ""
                                            }
                                          >
                                            Diff:{" "}
                                            {getChangeIndicator(
                                              emp.differences.cash_payment || 0,
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table Footer with Summary */}
              {filteredAndSortedEmployees().length > 0 && (
                <div className="table-footer">
                  <div className="footer-stats">
                    <span>
                      Showing {filteredAndSortedEmployees().length} of{" "}
                      {comparisonData.employees.length} employees
                    </span>
                    <button
                      className="btn-expand-all"
                      onClick={() => {
                        const allExpanded = {};
                        filteredAndSortedEmployees().forEach((emp) => {
                          allExpanded[emp.employee_id] = true;
                        });
                        setExpandedRows(allExpanded);
                      }}
                    >
                      Expand All
                    </button>
                    <button
                      className="btn-collapse-all"
                      onClick={() => setExpandedRows({})}
                    >
                      Collapse All
                    </button>
                  </div>
                </div>
              )}

              {/* No Data Message */}
              {filteredAndSortedEmployees().length === 0 && (
                <div className="no-data-section">
                  <FaExclamationTriangle className="no-data-icon" />
                  <h3>No Employees Found</h3>
                  <p>No matching employees found for your search criteria.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .salary-comparison-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .dashboard {
          max-width: 100%;
          margin: 0 auto;
        }
        
        .card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }
        
        .header-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1.5rem 2rem;
          color: white;
        }
        
        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .main-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 1.75rem;
          margin: 0;
        }
        
        .title-icon {
          font-size: 1.75rem;
        }
        
        .subtitle {
          margin: 0.5rem 0 0 0;
          opacity: 0.8;
          font-size: 0.9rem;
        }
        
        .comparison-controls {
          padding: 1.5rem 2rem;
          background: #f8fafc;
          display: flex;
          align-items: flex-end;
          gap: 2rem;
          flex-wrap: wrap;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .control-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #4b5563;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .date-selectors {
          display: flex;
          gap: 0.5rem;
        }
        
        .date-selectors select,
        .company-filter {
          padding: 0.6rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.9rem;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .date-selectors select:hover,
        .company-filter:hover {
          border-color: #8b5cf6;
        }
        
        .vs-divider {
          padding-bottom: 0.5rem;
        }
        
        .vs-divider span {
          background: #8b5cf6;
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.8rem;
        }
        
        .btn-compare {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
          padding: 0.6rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        
        .btn-compare:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }
        
        .btn-back {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        
        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        /* Summary Cards */
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1rem;
          padding: 1.5rem 2rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .summary-card {
          background: white;
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          gap: 0.75rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }
        
        .summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .card-icon {
          font-size: 1.5rem;
          color: #8b5cf6;
        }
        
        .card-content {
          flex: 1;
        }
        
        .card-content h4 {
          margin: 0 0 0.5rem 0;
          color: #374151;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .employee-stats,
        .amount-stats {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          margin-bottom: 0.5rem;
          font-size: 0.8rem;
        }
        
        .month1 {
          color: #6b7280;
        }
        
        .month2 {
          color: #1f2937;
          font-weight: 600;
        }
        
        .changes {
          display: flex;
          gap: 0.75rem;
          font-size: 0.7rem;
        }
        
        .changes .joined { color: #10b981; }
        .changes .left { color: #ef4444; }
        .changes .active { color: #3b82f6; }
        
        .change-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        /* Toolbar */
        .toolbar-section {
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          background: white;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .search-wrapper {
          position: relative;
          min-width: 280px;
        }
        
        .search-input {
          width: 100%;
          padding: 0.6rem 1rem 0.6rem 2.5rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #8b5cf6;
        }
        
        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 0.85rem;
        }
        
        .toolbar-actions {
          display: flex;
          gap: 0.75rem;
        }
        
        .btn-columns {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 0.6rem 1rem;
          border-radius: 10px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
        }
        
        .btn-columns:hover {
          background: #e2e8f0;
        }
        
        .btn-export {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
        }
        
        .btn-export:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        /* Column Menu */
        .column-menu-container {
          position: relative;
        }
        
        .column-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          min-width: 240px;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .column-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        
        .column-menu-header h4 {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .column-menu-header button {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: #6b7280;
        }
        
        .column-menu-items {
          padding: 0.5rem;
        }
        
        .column-menu-items label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          font-size: 0.8rem;
          cursor: pointer;
          border-radius: 6px;
        }
        
        .column-menu-items label:hover {
          background: #f1f5f9;
        }
        
        .column-menu-items hr {
          margin: 0.5rem 0;
          border: none;
          border-top: 1px solid #e2e8f0;
        }
        
        /* Table Styles with Fixed Header */
        .table-scroll-container {
          margin: 0;
          overflow: auto;
          position: relative;
        }
        
        .table-wrapper {
          min-width: 900px;
        }
        
        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
        }
        
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: white;
        }
        
        .comparison-table th {
          padding: 0.75rem 0.5rem;
          text-align: center;
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }
        
        .main-header th {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          font-size: 0.8rem;
        }
        
        .sub-header th {
          background: #e0e7ff;
          color: #4b5563;
          font-size: 0.7rem;
          padding: 0.5rem;
          font-weight: 500;
        }
        
        .month-group {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          text-align: center;
        }
        
        .diff-group {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }
        
        .sortable {
          cursor: pointer;
          user-select: none;
          transition: opacity 0.2s;
        }
        
        .sortable:hover {
          opacity: 0.8;
        }
        
        .sortable.sub {
          background: #c7d2fe;
        }
        
        .data-row td {
          padding: 0.6rem 0.5rem;
          border-bottom: 1px solid #f3f4f6;
          text-align: center;
          transition: background 0.2s;
        }
        
        .data-row:hover td {
          background: #f0f9ff;
        }
        
        .data-row.expanded td {
          background: #f8fafc;
        }
        
        .sl-number {
          color: #7c3aed;
          font-weight: 600;
          background: #f3e8ff;
        }
        
        .emp-id {
          font-weight: 600;
          color: #dc2626;
        }
        
        .emp-name {
          font-weight: 600;
          color: #1e40af;
          text-align: left;
        }
        
        .emp-designation {
          color: #059669;
          text-align: left;
        }
        
        .expand-icon {
          cursor: pointer;
          color: #8b5cf6;
        }
        
        .gross-salary {
          font-weight: 600;
          color: #1e3a8a;
        }
        
        .net-pay {
          font-weight: 600;
          color: #059669;
        }
        
        .cash-salary {
          font-weight: 600;
          color: #d97706;
        }
        
        td.positive {
          color: #10b981;
          font-weight: 600;
        }
        
        td.negative {
          color: #ef4444;
          font-weight: 600;
        }
        
        td.neutral {
          color: #6b7280;
        }
        
        /* Expanded Row */
        .expanded-row {
          background: #f8fafc;
        }
        
        .expanded-row td {
          padding: 1rem;
          background: #f8fafc;
        }
        
        .expanded-details {
          background: white;
          border-radius: 10px;
          padding: 1rem;
          border: 1px solid #e2e8f0;
        }
        
        .detail-section h5 {
          margin: 0 0 0.75rem 0;
          color: #374151;
          font-size: 0.85rem;
        }
        
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.75rem;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .detail-item .label {
          font-weight: 600;
          color: #6b7280;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .detail-values {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          font-size: 0.75rem;
        }
        
        .detail-values .positive {
          color: #10b981;
          font-weight: 600;
        }
        
        .detail-values .negative {
          color: #ef4444;
          font-weight: 600;
        }
        
        /* Table Footer */
        .table-footer {
          padding: 1rem 2rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
        }
        
        .footer-stats {
          display: flex;
          gap: 1rem;
          align-items: center;
          font-size: 0.8rem;
          color: #6b7280;
        }
        
        .btn-expand-all,
        .btn-collapse-all {
          background: none;
          border: 1px solid #e2e8f0;
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-expand-all:hover,
        .btn-collapse-all:hover {
          background: #e2e8f0;
        }
        
        /* Error and No Data */
        .error-section {
          padding: 2rem;
          text-align: center;
          color: #dc2626;
        }
        
        .btn-retry {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        
        .no-data-section {
          padding: 3rem;
          text-align: center;
        }
        
        .no-data-icon {
          font-size: 3rem;
          color: #d1d5db;
          margin-bottom: 1rem;
        }
        
        /* Loader */
        .center-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .fullscreen-loader {
          text-align: center;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .comparison-controls {
            flex-direction: column;
            align-items: stretch;
          }
          
          .summary-cards {
            grid-template-columns: 1fr;
          }
          
          .toolbar-section {
            flex-direction: column;
            align-items: stretch;
          }
          
          .toolbar-actions {
            justify-content: flex-start;
          }
          
          .search-wrapper {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default SalaryComparison;
