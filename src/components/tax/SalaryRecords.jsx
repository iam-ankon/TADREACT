// src/pages/finance/SalaryRecords.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSearch,
  FaFileExport,
  FaCalendarAlt,
  FaBuilding,
  FaUsers,
  FaMoneyBillWave,
  FaEye,
  FaDownload,
  FaExclamationTriangle,
  FaChartBar,
  FaSave,
  FaCheckCircle,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Import API services
import {
  salaryRecordsAPI,
  salaryAPI,
  storageAPI,
  employeeAPI,
} from "../../api/finance";

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
};

const formatNumber = (num) => {
  if (num === null || num === undefined) return "৳0";
  const abs = Math.abs(num);
  const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return num < 0 ? `-৳${formatted}` : `৳${formatted}`;
};

const SalaryRecords = () => {
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [openCompanies, setOpenCompanies] = useState({});
  const [manualData, setManualData] = useState({});
  const [showSummary, setShowSummary] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
    (_, i) => new Date().getFullYear() - i
  );

  // Calculate days in selected month
  const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const BASE_MONTH = 30;

  // Fetch employees to get company information
  const fetchEmployees = async () => {
    try {
      const res = await employeeAPI.getAll();
      const filtered = res.data.filter((e) => e.salary && e.employee_id);
      setEmployees(filtered);
      console.log("✅ Loaded employees:", filtered.length);

      // Log company information from employees
      const employeeCompanies = [
        ...new Set(filtered.map((e) => e.company_name)),
      ];
      console.log("🏢 Companies from employees:", employeeCompanies);

      return filtered;
    } catch (e) {
      console.error("Failed to fetch employees:", e);
      return [];
    }
  };

  // Enhanced grouping with company mapping
  const grouped = useMemo(() => {
    console.log("📊 Grouping records by company...");
    console.log("📊 Total records to group:", filteredRecords.length);
    console.log("📊 Total employees available:", employees.length);

    // Create a mapping of employee_id to company_name from employees data
    const employeeCompanyMap = {};
    employees.forEach((emp) => {
      if (emp.employee_id && emp.company_name) {
        employeeCompanyMap[emp.employee_id] = emp.company_name;
      }
    });

    console.log("📊 Employee-Company mapping:", employeeCompanyMap);

    const groups = filteredRecords.reduce((acc, record) => {
      // Try multiple ways to get company name
      let companyName = "Unknown Company";

      // 1. First try from the record itself
      if (record.company_name && record.company_name !== "Unknown Company") {
        companyName = record.company_name;
      }
      // 2. Then try from employee mapping
      else if (employeeCompanyMap[record.employee_id]) {
        companyName = employeeCompanyMap[record.employee_id];
      }
      // 3. Finally, use whatever is in the record
      else if (record.company_name) {
        companyName = record.company_name;
      }

      // Clean up company name
      companyName = companyName.trim() || "Unknown Company";

      if (!acc[companyName]) acc[companyName] = [];
      acc[companyName].push({
        ...record,
        company_name: companyName, // Ensure consistent company name
      });
      return acc;
    }, {});

    console.log("📊 Final grouped companies:", Object.keys(groups));
    Object.keys(groups).forEach((comp) => {
      console.log(`📊 ${comp}: ${groups[comp].length} employees`);
    });

    return groups;
  }, [filteredRecords, employees]);

  // Load saved manual data
  useEffect(() => {
    const saved = storageAPI.getSalaryManualData();
    if (saved) setManualData(saved);
  }, []);

  // Fetch salary records for selected month/year
  const fetchSalaryRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        `🔄 Fetching salary records for ${selectedMonth}/${selectedYear}...`
      );

      // Fetch employees first to get company data
      const employeesData = await fetchEmployees();

      const response = await salaryRecordsAPI.getAllRecords({
        year: selectedYear,
        month: selectedMonth,
      });

      console.log("📊 Full API Response:", response);

      let records = [];

      if (response.data && response.data.success) {
        records = response.data.data || [];
      } else {
        // Handle case where API returns data directly
        records = response.data || [];
      }

      console.log(
        `✅ Loaded ${records.length} records for ${selectedMonth}/${selectedYear}`
      );

      // Enhance records with company information from employees
      const enhancedRecords = records.map((record) => {
        const employee = employeesData.find(
          (emp) => emp.employee_id === record.employee_id
        );
        return {
          ...record,
          company_name:
            employee?.company_name || record.company_name || "Unknown Company",
        };
      });

      // Log company information
      const companies = [
        ...new Set(enhancedRecords.map((r) => r.company_name)),
      ];
      console.log("🏢 Final companies in records:", companies);

      setSalaryRecords(enhancedRecords);
      setFilteredRecords(enhancedRecords);
    } catch (error) {
      console.error("❌ Failed to fetch salary records:", error);
      setError("Connection error: " + error.message);
      setSalaryRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch debug information
  const fetchDebugInfo = async () => {
    try {
      const response = await fetch(
        "http://119.148.51.38:8000/api/tax-calculator/salary-records-debug/"
      );
      const data = await response.json();
      setDebugInfo(data.debug_info);
      console.log("🐛 Debug info:", data.debug_info);
    } catch (error) {
      console.error("Failed to fetch debug info:", error);
    }
  };

  useEffect(() => {
    fetchSalaryRecords();
    fetchDebugInfo();
  }, [selectedYear, selectedMonth]);

  // Filter records based on search
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredRecords(salaryRecords);
    } else {
      const filtered = salaryRecords.filter(
        (record) =>
          record.name?.toLowerCase().includes(term) ||
          record.employee_id?.toLowerCase().includes(term) ||
          record.company_name?.toLowerCase().includes(term) ||
          record.designation?.toLowerCase().includes(term)
      );
      setFilteredRecords(filtered);
    }
  }, [searchTerm, salaryRecords]);

  // Toggle company sections
  const toggleCompany = (comp) => {
    setOpenCompanies((prev) => {
      const newState = { ...prev, [comp]: !prev[comp] };
      const isAnyCompanyOpen = Object.values(newState).some((v) => v);
      setShowSummary(!isAnyCompanyOpen);
      return newState;
    });
  };

  const showAllCompanies = () => {
    const allOpen = {};
    Object.keys(grouped).forEach((comp) => {
      allOpen[comp] = true;
    });
    setOpenCompanies(allOpen);
    setShowSummary(false);
  };

  const hideAllCompanies = () => {
    setOpenCompanies({});
    setShowSummary(true);
  };

  // Update manual data
  const updateManual = (empId, field, value) => {
    const parsed = field === "remarks" ? value : parseFloat(value) || 0;
    const newData = {
      ...manualData,
      [empId]: {
        ...manualData[empId],
        [field]: parsed,
      },
    };
    setManualData(newData);
    storageAPI.setSalaryManualData(newData);
  };

  const getManual = (empId, field, defaultVal = 0) => {
    return manualData[empId]?.[field] ?? defaultVal;
  };

  // Save updated data
  const saveData = async () => {
    const payload = filteredRecords
      .map((record, idx) => {
        const empId = record.employee_id?.trim();
        if (!empId) return null;

        // Get updated values from manual inputs
        const daysWorkedManual = Number(getManual(empId, "daysWorked")) || 0;
        const cashPayment = Number(getManual(empId, "cashPayment")) || 0;
        const addition = Number(getManual(empId, "addition")) || 0;
        const advance = Number(getManual(empId, "advance")) || 0;
        const remarks = getManual(empId, "remarks", "") || "";

        // Use manual values if provided, otherwise use original values
        const daysWorked =
          daysWorkedManual > 0
            ? daysWorkedManual
            : record.days_worked || totalDaysInMonth;
        const absentDays = Math.max(0, totalDaysInMonth - daysWorked);

        const dailyBasic = Number(
          ((record.basic || 0) / BASE_MONTH).toFixed(2)
        );
        const absentDeduction = Number((dailyBasic * absentDays).toFixed(2));
        const totalDeduction = Number(
          ((record.ait || 0) + advance + absentDeduction).toFixed(2)
        );

        const netPayBank = Number(
          (
            (record.gross_salary || 0) -
            cashPayment -
            totalDeduction +
            addition
          ).toFixed(2)
        );
        const totalPayable = Number(
          (netPayBank + cashPayment + (record.ait || 0)).toFixed(2)
        );

        return {
          sl: idx + 1,
          name: record.name?.trim() || "Unknown",
          employee_id: empId,
          designation: record.designation?.trim() || "",
          doj: record.doj,
          basic: record.basic || 0,
          house_rent: record.house_rent || 0,
          medical: record.medical || 0,
          conveyance: record.conveyance || 0,
          gross_salary: record.gross_salary || 0,
          total_days: totalDaysInMonth,
          days_worked: daysWorked,
          absent_days: absentDays,
          absent_ded: absentDeduction,
          advance: advance,
          ait: record.ait || 0,
          total_ded: totalDeduction,
          ot_hours: record.ot_hours || 0,
          addition: addition,
          cash_payment: cashPayment,
          net_pay_bank: netPayBank,
          total_payable: totalPayable,
          remarks: remarks,
          month: selectedMonth,
          year: selectedYear,
          company_name: record.company_name, // Include proper company name
        };
      })
      .filter(Boolean);

    console.log("Saving updated records:", payload.length, "rows");

    try {
      const res = await salaryAPI.saveSalary(payload);
      const saved = res.data.saved || 0;
      const errors = res.data.errors || [];

      if (errors.length > 0) {
        console.warn("Save errors:", errors);
        alert(
          `Warning: Saved ${saved}, but ${errors.length} failed. Check console.`
        );
      } else {
        alert(
          `Success: All ${saved} rows updated! (${res.data.created} new, ${res.data.updated} updated)`
        );
        // Refresh data after save
        fetchSalaryRecords();
      }
    } catch (e) {
      console.error("Save failed:", e.response?.data || e);
      alert("Save failed – check console");
    }
  };

  // Export company data
  const exportCompanyData = (companyName) => {
    const records = grouped[companyName];
    if (!records || records.length === 0) {
      alert(`No records found for ${companyName}`);
      return;
    }

    const headers = [
      "SL",
      "Name",
      "ID",
      "Company",
      "Designation",
      "DOJ",
      "Basic",
      "House Rent",
      "Medical",
      "Conveyance",
      "Gross Salary",
      "Total Days",
      "Days Worked",
      "Absent Days",
      "Absent Deduction",
      "Advance",
      "AIT",
      "Total Deduction",
      "OT Hours",
      "Addition",
      "Cash Payment",
      "Net Pay (Bank)",
      "Total Payable",
      "Remarks",
    ];

    const rows = records.map((record, idx) => {
      const empId = record.employee_id;
      const daysWorkedManual = getManual(empId, "daysWorked");
      const daysWorked =
        daysWorkedManual > 0
          ? daysWorkedManual
          : record.days_worked || totalDaysInMonth;
      const absentDays = Math.max(0, totalDaysInMonth - daysWorked);
      const absentDeduction = ((record.basic || 0) / BASE_MONTH) * absentDays;

      return [
        idx + 1,
        record.name,
        record.employee_id,
        record.company_name,
        record.designation,
        record.doj,
        record.basic || 0,
        record.house_rent || 0,
        record.medical || 0,
        record.conveyance || 0,
        record.gross_salary || 0,
        totalDaysInMonth,
        daysWorked,
        absentDays,
        absentDeduction,
        getManual(empId, "advance") || record.advance || 0,
        record.ait || 0,
        (record.ait || 0) +
          (getManual(empId, "advance") || 0) +
          absentDeduction,
        record.ot_hours || 0,
        getManual(empId, "addition") || record.addition || 0,
        getManual(empId, "cashPayment") || record.cash_payment || 0,
        getManual(empId, "netPayBank") || record.net_pay_bank || 0,
        getManual(empId, "totalPayable") || record.total_payable || 0,
        getManual(empId, "remarks") || record.remarks || "",
      ];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    const colWidths = headers.map((_, i) => {
      const max = Math.max(
        ...rows.map((row) => (row[i] != null ? String(row[i]).length : 0)),
        String(headers[i]).length
      );
      return { wch: Math.min(max + 2, 50) };
    });
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Salary Records");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(
      blob,
      `${companyName}_Salary_Records_${
        monthNames[selectedMonth - 1]
      }_${selectedYear}.xlsx`
    );
  };

  const exportAllCompanies = () => {
    if (Object.keys(grouped).length === 0) {
      alert("No company data to export");
      return;
    }

    Object.keys(grouped).forEach((companyName, i) => {
      setTimeout(() => exportCompanyData(companyName), i * 200);
    });
  };

  // View detailed report in SalaryFormat
  const viewDetailedReport = (month, year) => {
    navigate(`/salary-format?month=${month}&year=${year}`);
  };

  if (loading) {
    return (
      <div className="center-screen">
        <div className="fullscreen-loader">
          <div className="spinner" />
          <p>Loading Salary Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="salary-records-container">
      <div className="dashboard">
        <div className="card">
          {/* DEBUG INFO */}
          {debugInfo && (
            <div className="debug-section">
              <h4>
                <FaExclamationTriangle /> Debug Information
              </h4>
              <p>
                <strong>Total records in database:</strong>{" "}
                {debugInfo.total_records}
              </p>
              <p>
                <strong>Available years:</strong>{" "}
                {debugInfo.available_years?.join(", ") || "None"}
              </p>
              <p>
                <strong>Available months:</strong>{" "}
                {debugInfo.available_months?.join(", ") || "None"}
              </p>
              <p>
                <strong>Current selection:</strong> {selectedMonth}/
                {selectedYear} - {filteredRecords.length} records
              </p>
              <p>
                <strong>Companies found:</strong>{" "}
                {Object.keys(grouped).join(", ") || "None"}
              </p>
              <p>
                <strong>Total employees data:</strong> {employees.length}{" "}
                employees loaded
              </p>
            </div>
          )}
          {/* HEADER SECTION */}
          <div className="header-section">
            <div className="header-main">
              <div className="title-section">
                <h1 className="main-title">
                  <FaCalendarAlt className="title-icon" />
                  Salary Records History
                </h1>
                <div className="date-badge">
                  {monthNames[selectedMonth - 1]} {selectedYear}
                  <br />
                  Total Records: {salaryRecords.length}
                  {filteredRecords.length !== salaryRecords.length &&
                    ` (Filtered: ${filteredRecords.length})`}
                  <br />
                  Companies: {Object.keys(grouped).length}
                </div>
              </div>

              <div className="controls-section">
                <div className="search-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search employees by name, ID, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="filter-controls">
                  <div className="filter-group">
                    <label>Year:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="filter-select"
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Month:</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="filter-select"
                    >
                      {monthNames.map((month, index) => (
                        <option key={index + 1} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    onClick={exportAllCompanies}
                    className="btn btn-export-all"
                    disabled={Object.keys(grouped).length === 0}
                  >
                    <FaFileExport /> Export All
                  </button>

                  <button
                    onClick={() => navigate("/salary-format")}
                    className="btn btn-back"
                  >
                    <FaArrowLeft /> Back to Current Month
                  </button>

                  {/* <button
                    className="btn btn-save"
                    onClick={saveData}
                    disabled={filteredRecords.length === 0}
                  >
                    <FaSave /> Save Updates
                  </button> */}

                  <button
                    onClick={showAllCompanies}
                    className="btn btn-show-all"
                    disabled={Object.keys(grouped).length === 0}
                  >
                    <FaBuilding /> Show All
                  </button>

                  <button
                    onClick={hideAllCompanies}
                    className="btn btn-hide-all"
                  >
                    <FaBuilding /> Hide All
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* ERROR MESSAGE */}
          {error && (
            <div className="error-section">
              <h4>
                <FaExclamationTriangle /> Error Loading Data
              </h4>
              <p>{error}</p>
              <button onClick={fetchSalaryRecords} className="btn">
                Retry
              </button>
            </div>
          )}
          {/* COMPANY QUICK ACCESS */}
          {Object.keys(grouped).length > 0 && (
            <div className="company-quick-access">
              <div className="section-label">
                <FaBuilding className="section-icon" />
                Companies ({Object.keys(grouped).length})
              </div>
              <div className="company-buttons-grid">
                {Object.keys(grouped).map((comp) => (
                  <div key={comp} className="company-card">
                    <button
                      className={`company-toggle-btn ${
                        openCompanies[comp] ? "active" : ""
                      }`}
                      onClick={() => toggleCompany(comp)}
                    >
                      <span className="company-name">{comp}</span>
                      <span className="employee-count">
                        {grouped[comp].length} employees
                      </span>
                      <span className="toggle-indicator">
                        {openCompanies[comp] ? "▲" : "▼"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* COMPANY SECTIONS - INDIVIDUAL COMPANY VIEWS */}
          {Object.keys(grouped).map((comp) => {
            const records = grouped[comp];
            if (!openCompanies[comp]) return null;

            return (
              <div key={comp} className="company-section">
                <div className="company-header">
                  <div className="company-title">
                    <h2>{comp}</h2>
                    <h3>
                      Salary Records for {monthNames[selectedMonth - 1]}{" "}
                      {selectedYear}
                    </h3>
                  </div>
                  <button
                    onClick={() => exportCompanyData(comp)}
                    className="btn btn-export-section"
                  >
                    <FaFileExport /> Export {comp} Data
                  </button>
                </div>

                <div className="table-scroll-container">
                  <div className="table-wrapper">
                    <table className="salary-table">
                      <thead>
                        <tr>
                          <th>SL</th>
                          <th>Name</th>
                          <th>ID</th>
                          <th>Designation</th>
                          <th>DOJ</th>
                          <th>Basic</th>
                          <th>House Rent</th>
                          <th>Medical</th>
                          <th>Conveyance</th>
                          <th>Gross Salary</th>
                          <th>Total Days</th>
                          <th>Days Worked</th>
                          <th>Absent Days</th>
                          <th>Absent Ded.</th>
                          <th>Advance</th>
                          <th>AIT</th>
                          <th>Total Ded.</th>
                          <th>OT Hours</th>
                          <th>Addition</th>
                          <th>Cash Payment</th>
                          <th>Net Pay (Bank)</th>
                          <th>Total Payable</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record, idx) => {
                          const empId = record.employee_id;

                          // Get manual overrides or use original values
                          const daysWorkedManual = getManual(
                            empId,
                            "daysWorked"
                          );
                          const cashPayment =
                            getManual(empId, "cashPayment") || 0;
                          const addition = getManual(empId, "addition") || 0;
                          const advance = getManual(empId, "advance") || 0;
                          const remarks = getManual(empId, "remarks", "") || "";

                          const daysWorked =
                            daysWorkedManual > 0
                              ? daysWorkedManual
                              : record.days_worked || totalDaysInMonth;
                          const absentDays = Math.max(
                            0,
                            totalDaysInMonth - daysWorked
                          );

                          const dailyBasic = (record.basic || 0) / BASE_MONTH;
                          const absentDeduction = dailyBasic * absentDays;
                          const totalDeduction =
                            (record.ait || 0) + advance + absentDeduction;

                          const netPayBank =
                            (record.gross_salary || 0) -
                            cashPayment -
                            totalDeduction +
                            addition;
                          const totalPayable =
                            netPayBank + cashPayment + (record.ait || 0);

                          return (
                            <tr key={`${empId}-${idx}`} className="data-row">
                              <td className="sl-number">{idx + 1}</td>
                              <td className="emp-name">{record.name}</td>
                              <td className="emp-id">{empId}</td>
                              <td className="emp-designation">
                                {record.designation}
                              </td>
                              <td className="emp-doj">{record.doj}</td>
                              <td className="salary-amount">
                                {formatNumber(record.basic || 0)}
                              </td>
                              <td className="salary-amount">
                                {formatNumber(record.house_rent || 0)}
                              </td>
                              <td className="salary-amount">
                                {formatNumber(record.medical || 0)}
                              </td>
                              <td className="salary-amount">
                                {formatNumber(record.conveyance || 0)}
                              </td>
                              <td className="gross-salary">
                                {formatNumber(record.gross_salary || 0)}
                              </td>
                              <td className="days-count">{totalDaysInMonth}</td>

                              <td>
                                <input
                                  type="number"
                                  value={
                                    daysWorkedManual > 0
                                      ? daysWorkedManual
                                      : record.days_worked || ""
                                  }
                                  placeholder={
                                    record.days_worked || totalDaysInMonth
                                  }
                                  onChange={(e) =>
                                    updateManual(
                                      empId,
                                      "daysWorked",
                                      e.target.value
                                    )
                                  }
                                  className="editable-input days-input"
                                  min="0"
                                  max={totalDaysInMonth}
                                />
                              </td>

                              <td className="absent-days">{absentDays}</td>
                              <td className="deduction-amount">
                                {formatNumber(absentDeduction)}
                              </td>

                              <td>
                                <input
                                  type="number"
                                  value={
                                    advance !== 0
                                      ? advance
                                      : record.advance || ""
                                  }
                                  placeholder={record.advance || "0"}
                                  onChange={(e) =>
                                    updateManual(
                                      empId,
                                      "advance",
                                      e.target.value
                                    )
                                  }
                                  className="editable-input advance-input"
                                />
                              </td>

                              <td className="tax-amount">
                                {formatNumber(record.ait || 0)}
                              </td>
                              <td className="deduction-amount total-deduction">
                                {formatNumber(totalDeduction)}
                              </td>

                              <td className="ot-hours">
                                {record.ot_hours || 0}
                              </td>

                              <td>
                                <input
                                  type="number"
                                  value={
                                    addition !== 0
                                      ? addition
                                      : record.addition || ""
                                  }
                                  placeholder={record.addition || "0"}
                                  onChange={(e) =>
                                    updateManual(
                                      empId,
                                      "addition",
                                      e.target.value
                                    )
                                  }
                                  className="editable-input addition-input"
                                />
                              </td>

                              <td>
                                <input
                                  type="number"
                                  value={
                                    cashPayment !== 0
                                      ? cashPayment
                                      : record.cash_payment || ""
                                  }
                                  placeholder={record.cash_payment || "0"}
                                  onChange={(e) =>
                                    updateManual(
                                      empId,
                                      "cashPayment",
                                      e.target.value
                                    )
                                  }
                                  className="editable-input cash-input"
                                />
                              </td>

                              <td
                                className={`net-pay ${
                                  netPayBank < 0 ? "negative" : "positive"
                                }`}
                              >
                                {formatNumber(netPayBank)}
                              </td>
                              <td className="total-payable">
                                {formatNumber(totalPayable)}
                              </td>

                              <td>
                                <input
                                  type="text"
                                  value={remarks || record.remarks || ""}
                                  placeholder="Remarks"
                                  onChange={(e) =>
                                    updateManual(
                                      empId,
                                      "remarks",
                                      e.target.value
                                    )
                                  }
                                  className="editable-input remarks-input"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
          {showSummary && filteredRecords.length > 0 && (
            <div className="summary-section">
              <div className="summary-header">
                <h2>
                  <FaUsers className="section-icon" />
                  Summary Overview - {monthNames[selectedMonth - 1]}{" "}
                  {selectedYear}
                </h2>
                <div className="summary-actions">
                  <button
                    onClick={exportAllCompanies}
                    className="btn btn-export-all"
                  >
                    <FaFileExport /> Export All
                  </button>
                </div>
              </div>

              <div className="summary-stats">
                <div className="stat-card">
                  <div className="stat-number">
                    {Object.keys(grouped).length}
                  </div>
                  <div className="stat-label">Companies</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{filteredRecords.length}</div>
                  <div className="stat-label">Total Employees</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {formatNumber(
                      filteredRecords.reduce(
                        (sum, record) =>
                          sum + (Number(record.gross_salary) || 0),
                        0
                      )
                    )}
                  </div>
                  <div className="stat-label">Total Gross Salary</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {formatNumber(
                      filteredRecords.reduce(
                        (sum, record) => sum + (Number(record.ait) || 0),
                        0
                      )
                    )}
                  </div>
                  <div className="stat-label">Total AIT</div>
                </div>
              </div>

              {/* Fixed Summary table */}
              <div className="table-scroll-container">
                <div className="table-wrapper">
                  <table className="salary-table summary-table">
                    <thead>
                      <tr>
                        <th>SL</th>
                        <th>Company</th>
                        <th>Employees</th>
                        <th>Gross Salary</th>
                        <th>AIT</th>
                        <th>Absent Ded.</th>
                        <th>Advance</th>
                        <th>Cash</th>
                        <th>Addition</th>
                        <th>Net Pay (Bank)</th>
                        <th>Total Payable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(grouped).map((companyName, index) => {
                        const records = grouped[companyName];

                        // Debug log to see what data we're working with
                        console.log(`Summary for ${companyName}:`, records);

                        // Calculate summary for this company
                        const summary = records.reduce(
                          (acc, record) => {
                            const empId = record.employee_id;

                            // Get values with proper fallbacks
                            const grossSalary =
                              Number(record.gross_salary) || 0;
                            const ait = Number(record.ait) || 0;
                            const advance = Number(
                              getManual(empId, "advance") || record.advance || 0
                            );
                            const cashPayment = Number(
                              getManual(empId, "cashPayment") ||
                                record.cash_payment ||
                                0
                            );
                            const addition = Number(
                              getManual(empId, "addition") ||
                                record.addition ||
                                0
                            );
                            const netPayBank = Number(record.net_pay_bank) || 0;
                            const totalPayable =
                              Number(record.total_payable) || 0;

                            // Calculate absent deduction
                            const daysWorkedManual = getManual(
                              empId,
                              "daysWorked"
                            );
                            const daysWorked =
                              daysWorkedManual > 0
                                ? daysWorkedManual
                                : record.days_worked || totalDaysInMonth;
                            const absentDays = Math.max(
                              0,
                              totalDaysInMonth - daysWorked
                            );
                            const dailyBasic =
                              (Number(record.basic) || 0) / BASE_MONTH;
                            const absentDeduction = dailyBasic * absentDays;

                            return {
                              gross: acc.gross + grossSalary,
                              ait: acc.ait + ait,
                              absentDed: acc.absentDed + absentDeduction,
                              advance: acc.advance + advance,
                              cash: acc.cash + cashPayment,
                              addition: acc.addition + addition,
                              netBank: acc.netBank + netPayBank,
                              totalPay: acc.totalPay + totalPayable,
                            };
                          },
                          {
                            gross: 0,
                            ait: 0,
                            absentDed: 0,
                            advance: 0,
                            cash: 0,
                            addition: 0,
                            netBank: 0,
                            totalPay: 0,
                          }
                        );

                        // Debug the calculated summary
                        console.log(
                          `Calculated summary for ${companyName}:`,
                          summary
                        );

                        return (
                          <tr
                            key={companyName}
                            className="data-row summary-row"
                          >
                            <td className="sl-number">{index + 1}</td>
                            <td className="company-name">{companyName}</td>
                            <td className="employee-count">{records.length}</td>
                            <td className="gross-salary">
                              {formatNumber(summary.gross)}
                            </td>
                            <td className="tax-amount">
                              {formatNumber(summary.ait)}
                            </td>
                            <td className="deduction-amount">
                              {formatNumber(summary.absentDed)}
                            </td>
                            <td className="deduction-amount">
                              {formatNumber(summary.advance)}
                            </td>
                            <td className="cash-amount">
                              {formatNumber(summary.cash)}
                            </td>
                            <td
                              className={`addition-amount ${
                                summary.addition < 0 ? "negative" : "positive"
                              }`}
                            >
                              {formatNumber(summary.addition)}
                            </td>
                            <td
                              className={`net-pay ${
                                summary.netBank < 0 ? "negative" : "positive"
                              }`}
                            >
                              {formatNumber(summary.netBank)}
                            </td>
                            <td className="total-payable">
                              {formatNumber(summary.totalPay)}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Add a total row */}
                      {Object.keys(grouped).length > 0 && (
                        <tr
                          className="data-row total-row"
                          style={{
                            backgroundColor: "#f8fafc",
                            fontWeight: "bold",
                          }}
                        >
                          <td colSpan="2" style={{ textAlign: "center" }}>
                            TOTAL
                          </td>
                          <td className="employee-count">
                            {filteredRecords.length}
                          </td>
                          <td className="gross-salary">
                            {formatNumber(
                              filteredRecords.reduce(
                                (sum, record) =>
                                  sum + (Number(record.gross_salary) || 0),
                                0
                              )
                            )}
                          </td>
                          <td className="tax-amount">
                            {formatNumber(
                              filteredRecords.reduce(
                                (sum, record) =>
                                  sum + (Number(record.ait) || 0),
                                0
                              )
                            )}
                          </td>
                          <td className="deduction-amount">
                            {formatNumber(
                              Object.keys(grouped).reduce(
                                (total, companyName) => {
                                  const records = grouped[companyName];
                                  const companyAbsentDed = records.reduce(
                                    (sum, record) => {
                                      const empId = record.employee_id;
                                      const daysWorkedManual = getManual(
                                        empId,
                                        "daysWorked"
                                      );
                                      const daysWorked =
                                        daysWorkedManual > 0
                                          ? daysWorkedManual
                                          : record.days_worked ||
                                            totalDaysInMonth;
                                      const absentDays = Math.max(
                                        0,
                                        totalDaysInMonth - daysWorked
                                      );
                                      const dailyBasic =
                                        (Number(record.basic) || 0) /
                                        BASE_MONTH;
                                      return sum + dailyBasic * absentDays;
                                    },
                                    0
                                  );
                                  return total + companyAbsentDed;
                                },
                                0
                              )
                            )}
                          </td>
                          <td className="deduction-amount">
                            {formatNumber(
                              filteredRecords.reduce((sum, record) => {
                                const empId = record.employee_id;
                                return (
                                  sum +
                                  Number(
                                    getManual(empId, "advance") ||
                                      record.advance ||
                                      0
                                  )
                                );
                              }, 0)
                            )}
                          </td>
                          <td className="cash-amount">
                            {formatNumber(
                              filteredRecords.reduce((sum, record) => {
                                const empId = record.employee_id;
                                return (
                                  sum +
                                  Number(
                                    getManual(empId, "cashPayment") ||
                                      record.cash_payment ||
                                      0
                                  )
                                );
                              }, 0)
                            )}
                          </td>
                          <td className="addition-amount">
                            {formatNumber(
                              filteredRecords.reduce((sum, record) => {
                                const empId = record.employee_id;
                                return (
                                  sum +
                                  Number(
                                    getManual(empId, "addition") ||
                                      record.addition ||
                                      0
                                  )
                                );
                              }, 0)
                            )}
                          </td>
                          <td className="net-pay">
                            {formatNumber(
                              filteredRecords.reduce(
                                (sum, record) =>
                                  sum + (Number(record.net_pay_bank) || 0),
                                0
                              )
                            )}
                          </td>
                          <td className="total-payable">
                            {formatNumber(
                              filteredRecords.reduce(
                                (sum, record) =>
                                  sum + (Number(record.total_payable) || 0),
                                0
                              )
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {/* NO DATA MESSAGE */}
          {filteredRecords.length === 0 && !loading && (
            <div className="no-data-section">
              <div className="no-data-content">
                <FaExclamationTriangle className="no-data-icon" />
                <h3>No Salary Records Found</h3>
                <p>
                  No salary records found for {monthNames[selectedMonth - 1]}{" "}
                  {selectedYear}.
                  {selectedMonth === new Date().getMonth() + 1 &&
                  selectedYear === new Date().getFullYear() ? (
                    <span>
                      {" "}
                      You can create salary records in the{" "}
                      <strong>Salary Format</strong> page.
                    </span>
                  ) : (
                    <span> Try selecting a different month or year.</span>
                  )}
                </p>
                <button
                  onClick={() => navigate("/salary-format")}
                  className="btn btn-primary"
                >
                  <FaCalendarAlt /> Go to Current Month
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .salary-records-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem;
          font-family: "Inter", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .dashboard {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
        }

        .card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        /* IMPROVED HEADER SECTION */
        .header-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2.5rem;
          color: white;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .title-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .main-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .title-icon {
          font-size: 2.2rem;
          opacity: 0.9;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        .date-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.75rem 1.5rem;
          border-radius: 15px;
          font-size: 1.1rem;
          font-weight: 600;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          align-self: flex-start;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .controls-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-width: 320px;
        }

        .search-wrapper {
          position: relative;
          width: 100%;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3.5rem;
          border: none;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.95);
          font-size: 1rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          border: 2px solid transparent;
        }

        .search-input:focus {
          outline: none;
          background: white;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .search-icon {
          position: absolute;
          left: 1.2rem;
          top: 50%;
          transform: translateY(-50%);
          color: #8b5cf6;
          font-size: 1.2rem;
        }

        .filter-controls {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: white;
        }

        .filter-select {
          padding: 0.75rem;
          border: none;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.95);
          font-size: 0.9rem;
          min-width: 120px;
        }

        .action-buttons {
          display: flex;
          gap: 0.8rem;
          flex-wrap: wrap;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 1rem 1.8rem;
          border: none;
          border-radius: 15px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          white-space: nowrap;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          border: 2px solid transparent;
        }

        .btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-back {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .btn-save {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .btn-save:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }

        .btn-export-all,
        .btn-export-section {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .btn-export-all:hover,
        .btn-export-section:hover {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
        }

        .btn-show-all,
        .btn-hide-all {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .btn-show-all:hover,
        .btn-hide-all:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }

        /* COMPANY QUICK ACCESS */
        .company-quick-access {
          padding: 2.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 2rem;
        }

        .section-icon {
          color: #8b5cf6;
          font-size: 1.4rem;
        }

        .company-buttons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.2rem;
        }

        .company-card {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .company-toggle-btn {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.2rem 1.8rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        .company-toggle-btn:hover {
          border-color: #8b5cf6;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.15);
        }

        .company-toggle-btn.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border-color: #8b5cf6;
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
        }

        .company-name {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .employee-count {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .toggle-indicator {
          font-weight: bold;
          margin-left: 0.5rem;
          font-size: 1.1rem;
        }

        .btn-export-company {
          padding: 1rem;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .btn-export-company:hover {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(217, 119, 6, 0.3);
        }

        /* COMPANY SECTIONS */
        .company-section {
          padding: 2.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
        }

        .company-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2.5rem;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .company-title {
          flex: 1;
        }

        .company-title h2 {
          margin: 0 0 0.8rem 0;
          color: #1f2937;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .company-title h3 {
          margin: 0;
          color: #6b7280;
          font-size: 1.2rem;
          font-weight: 500;
        }

        /* TABLE STYLING */
        .table-scroll-container {
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          margin-bottom: 2.5rem;
          max-height: 70vh;
          position: relative;
          background: white;
        }

        .table-wrapper {
          min-width: 2400px;
          position: relative;
        }

        .salary-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
          position: relative;
        }

        .salary-table thead {
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .salary-table thead tr {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .salary-table th {
          padding: 1.2rem 0.8rem;
          text-align: center;
          font-weight: 600;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
          white-space: nowrap;
          position: sticky;
          top: 0;
          background: inherit;
          font-size: 0.85rem;
        }

        .data-row td {
          padding: 1rem 0.8rem;
          border-bottom: 1px solid #f3f4f6;
          text-align: center;
          transition: all 0.2s ease;
        }

        .data-row:hover {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          transform: scale(1.01);
        }

        .data-row:nth-child(even) {
          background: #fafafa;
        }

        .data-row:nth-child(even):hover {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        }

        .editable-input {
          width: 85px;
          padding: 0.6rem;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.85rem;
          text-align: center;
          transition: all 0.2s ease;
          background: white;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }

        .editable-input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
          transform: scale(1.05);
        }

        .days-input {
          border-color: #f59e0b;
          background: #fffbeb;
        }
        .advance-input {
          border-color: #ef4444;
          background: #fef2f2;
        }
        .addition-input {
          border-color: #10b981;
          background: #ecfdf5;
        }
        .cash-input {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        .remarks-input {
          border-color: #8b5cf6;
          background: #faf5ff;
          width: 130px;
        }

        /* CELL STYLING */
        .sl-number {
          color: #7c3aed;
          font-weight: 700;
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          padding: 0.5rem;
          border-radius: 10px;
          border: 2px solid #ddd6fe;
        }
        .emp-name {
          color: #1e40af;
          font-weight: 700;
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
          padding: 0.5rem 0.8rem;
          border-radius: 10px;
        }
        .emp-id {
          color: #dc2626;
          font-weight: 700;
          background: linear-gradient(135deg, #fecaca 0%, #fee2e2 100%);
          padding: 0.5rem 0.8rem;
          border-radius: 10px;
          border: 2px solid #fca5a5;
        }
        .emp-designation {
          color: #059669;
          font-weight: 600;
          background: linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%);
          padding: 0.5rem 0.8rem;
          border-radius: 10px;
        }
        .emp-doj {
          color: #7c2d12;
          background: #fef3c7;
          padding: 0.5rem;
          border-radius: 8px;
          font-weight: 500;
        }
        .salary-amount {
          color: #1e3a8a;
          font-weight: 600;
          background: #f0f9ff;
          padding: 0.5rem;
          border-radius: 8px;
        }
        .gross-salary {
          color: #1e3a8a;
          font-weight: 800;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          padding: 0.8rem 0.5rem;
          border-radius: 12px;
          border: 2px solid #93c5fd;
        }
        .days-count {
          color: #7c2d12;
          font-weight: 600;
          background: #fed7aa;
          padding: 0.5rem;
          border-radius: 8px;
        }
        .absent-days {
          color: #dc2626;
          font-weight: 600;
          background: #fecaca;
          padding: 0.5rem;
          border-radius: 8px;
        }
        .deduction-amount {
          color: #dc2626;
          font-weight: 600;
          background: #fee2e2;
          padding: 0.5rem;
          border-radius: 8px;
        }
        .total-deduction {
          color: #b91c1c;
          font-weight: 700;
          background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
          padding: 0.8rem 0.5rem;
          border-radius: 12px;
          border: 2px solid #f87171;
        }
        .tax-amount {
          color: #c2410c;
          font-weight: 600;
          background: #ffedd5;
          padding: 0.5rem;
          border-radius: 8px;
          border: 2px solid #fdba74;
        }
        .net-pay.positive {
          color: #059669;
          font-weight: 800;
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          padding: 0.8rem 0.5rem;
          border-radius: 12px;
          border: 2px solid #34d399;
        }
        .net-pay.negative {
          color: #dc2626;
          font-weight: 800;
          background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
          padding: 0.8rem 0.5rem;
          border-radius: 12px;
          border: 2px solid #f87171;
        }
        .total-payable {
          color: #1e3a8a;
          font-weight: 800;
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          padding: 0.8rem 0.5rem;
          border-radius: 12px;
          border: 2px solid #a5b4fc;
        }
        .ot-hours {
          color: #64748b;
          background: #f1f5f9;
          padding: 0.5rem;
          border-radius: 8px;
        }

        /* SUMMARY SECTION */
        .summary-section {
          padding: 2.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .summary-header h2 {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin: 0;
          color: #1f2937;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .summary-actions {
          display: flex;
          gap: 1rem;
        }

        /* SUMMARY STATS CARDS */
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          padding: 2rem;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(139, 92, 246, 0.15);
          border-color: #8b5cf6;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: #8b5cf6;
          margin-bottom: 0.8rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .stat-label {
          font-size: 1rem;
          color: #6b7280;
          font-weight: 600;
        }

        /* SUMMARY TABLE */
        .summary-table {
          min-width: 1200px;
        }

        .summary-row {
          background: linear-gradient(
            135deg,
            #f8fafc 0%,
            #f1f5f9 100%
          ) !important;
        }

        .summary-row:hover {
          background: linear-gradient(
            135deg,
            #e0e7ff 0%,
            #c7d2fe 100%
          ) !important;
          transform: scale(1.01);
        }

        .company-name {
          font-weight: 700;
          color: #1e40af;
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
          padding: 0.8rem;
          border-radius: 10px;
        }

        .employee-count {
          font-weight: 700;
          color: #7c3aed;
          text-align: center;
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          padding: 0.8rem;
          border-radius: 10px;
        }

        /* DEBUG AND ERROR SECTIONS */
        .debug-section {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 10px;
          padding: 15px;
          margin: 15px;
          font-size: 14px;
        }

        .debug-section h4 {
          margin: 0 0 10px 0;
          color: #856404;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .error-section {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 10px;
          padding: 15px;
          margin: 15px;
          color: #721c24;
        }

        .error-section h4 {
          margin: 0 0 10px 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* NO DATA SECTION */
        .no-data-section {
          padding: 4rem 2.5rem;
          text-align: center;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .no-data-content {
          max-width: 500px;
          margin: 0 auto;
        }

        .no-data-icon {
          font-size: 4rem;
          color: #d1d5db;
          margin-bottom: 1.5rem;
        }

        .no-data-content h3 {
          color: #374151;
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }

        .no-data-content p {
          color: #6b7280;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        /* LOADER STYLES */
        .center-screen {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          justify-content: center;
          align-items: center;
          padding: 1rem;
        }

        .fullscreen-loader {
          text-align: center;
        }

        .spinner {
          width: 80px;
          height: 80px;
          border: 8px solid rgba(255, 255, 255, 0.3);
          border-top: 8px solid #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* RESPONSIVE DESIGN */
        @media (max-width: 768px) {
          .salary-records-container {
            padding: 0.5rem;
          }

          .header-main {
            flex-direction: column;
          }

          .controls-section {
            width: 100%;
          }

          .filter-controls {
            flex-direction: column;
          }

          .action-buttons {
            justify-content: space-between;
          }

          .btn {
            flex: 1;
            justify-content: center;
            min-width: 120px;
          }

          .company-buttons-grid {
            grid-template-columns: 1fr;
          }

          .company-header {
            flex-direction: column;
          }

          .table-scroll-container {
            border-radius: 12px;
          }

          .salary-table th {
            padding: 1rem 0.5rem;
            font-size: 0.75rem;
          }

          .data-row td {
            padding: 0.8rem 0.5rem;
            font-size: 0.75rem;
          }

          .editable-input {
            width: 65px;
            padding: 0.5rem;
          }

          .summary-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .stat-card {
            padding: 1.5rem;
          }

          .stat-number {
            font-size: 2rem;
          }
        }

        @media (max-width: 480px) {
          .header-section {
            padding: 1.5rem 1rem;
          }

          .main-title {
            font-size: 2rem;
          }

          .company-section {
            padding: 1.5rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }

          .summary-stats {
            grid-template-columns: 1fr;
          }
        }
        /* TOTAL ROW STYLING */
        .total-row {
          background: linear-gradient(
            135deg,
            #1f2937 0%,
            #374151 100%
          ) !important;
          color: white !important;
          font-weight: 800 !important;
          border: 3px solid #8b5cf6 !important;
        }

        .total-row:hover {
          background: linear-gradient(
            135deg,
            #374151 0%,
            #4b5563 100%
          ) !important;
          transform: scale(1.02) !important;
        }

        .total-cell {
          background: rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          font-weight: 800 !important;
          border: 2px solid rgba(255, 255, 255, 0.2) !important;
          padding: 1rem 0.5rem !important;
          border-radius: 12px !important;
        }

        /* Specific styling for total row cells */
        .total-row .employee-count {
          background: linear-gradient(
            135deg,
            #8b5cf6 0%,
            #7c3aed 100%
          ) !important;
          color: white !important;
        }

        .total-row .gross-salary {
          background: linear-gradient(
            135deg,
            #1e40af 0%,
            #1e3a8a 100%
          ) !important;
          color: white !important;
        }

        .total-row .tax-amount {
          background: linear-gradient(
            135deg,
            #c2410c 0%,
            #9a3412 100%
          ) !important;
          color: white !important;
        }

        .total-row .deduction-amount {
          background: linear-gradient(
            135deg,
            #dc2626 0%,
            #b91c1c 100%
          ) !important;
          color: white !important;
        }

        .total-row .cash-amount {
          background: linear-gradient(
            135deg,
            #3b82f6 0%,
            #1d4ed8 100%
          ) !important;
          color: white !important;
        }

        .total-row .addition-amount {
          background: linear-gradient(
            135deg,
            #10b981 0%,
            #059669 100%
          ) !important;
          color: white !important;
        }

        .total-row .net-pay {
          background: linear-gradient(
            135deg,
            #059669 0%,
            #047857 100%
          ) !important;
          color: white !important;
        }

        .total-row .total-payable {
          background: linear-gradient(
            135deg,
            #7c3aed 0%,
            #6d28d9 100%
          ) !important;
          color: white !important;
          border: 3px solid #a78bfa !important;
        }
      `}</style>
    </div>
  );
};

export default SalaryRecords;
