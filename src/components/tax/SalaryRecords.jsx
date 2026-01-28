// src/pages/finance/SalaryRecords.jsx - WITH EDITABLE FIELDS
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSearch,
  FaFileExport,
  FaCalendarAlt,
  FaBuilding,
  FaUsers,
  FaExclamationTriangle,
  FaSave,
  FaColumns,
  FaSync,
  FaFileExcel,
  FaEdit,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Import API services
import { financeAPI } from "../../api/finance";

// Helper function to safely convert to number
const toNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === "")
    return defaultValue;
  if (typeof value === "string" && value.trim() === "") return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const formatNumber = (num) => {
  const safeNum = toNumber(num);
  const abs = Math.abs(safeNum);
  const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return safeNum < 0 ? `-৳${formatted}` : `৳${formatted}`;
};

const calculateOTPay = (monthlySalary, otMinutes, totalDaysInMonth, workDayHours = 10) => {
  if (!monthlySalary || !otMinutes || otMinutes <= 0) return 0;

  // Basic salary is 60% of gross salary
  const basicSalary = monthlySalary * 0.6;

  // Input is in minutes where 60 = 60 minutes (1 hour)
  // Convert minutes to hours for calculation
  const otHours = otMinutes / 60;

  // OT Pay = (Basic Salary ÷ daysInMonth ÷ workDayHours) × Monthly OT Hours
  const dailyBasicSalary = basicSalary / totalDaysInMonth;
  const hourlyRate = dailyBasicSalary / workDayHours; // Now configurable: 8 or 10 hours
  const otPay = hourlyRate * otHours;

  return Number(otPay.toFixed(2));
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;

  // Try common formats
  const parts = dateStr.split(/[/\-]/);
  if (parts.length === 3) {
    let day, month, year;

    // If first part is 4 digits, assume YYYY-MM-DD
    if (parts[0].length === 4) {
      year = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1;
      day = parseInt(parts[2]);
    } else {
      // Assume DD/MM/YYYY or similar
      day = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1;
      year = parseInt(parts[2]);

      // If year is 2 digits, add 2000
      if (year < 100) year += 2000;
    }

    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }

  console.warn(`Could not parse date: ${dateStr}`);
  return null;
};

const SalaryRecords = () => {
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [openCompanies, setOpenCompanies] = useState({});
  const [editableData, setEditableData] = useState({}); // Store edited values
  const [error, setError] = useState(null);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState({});
  const [workDayHours, setWorkDayHours] = useState({}); // Store work day hours per company
  const navigate = useNavigate();

  // Approval status states
  const [companyApprovalStatus, setCompanyApprovalStatus] = useState({});
  const [currentUser, setCurrentUser] = useState("");

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

  // Enhanced grouping with company mapping
  const grouped = useMemo(() => {
    const groups = filteredRecords.reduce((acc, record) => {
      const companyName = record.company_name || "Unknown Company";
      if (!acc[companyName]) acc[companyName] = [];
      acc[companyName].push(record);
      return acc;
    }, {});

    return groups;
  }, [filteredRecords]);

  // USER DETECTION
  useEffect(() => {
    const detectUser = () => {
      try {
        let detectedUser = "";
        const username = localStorage.getItem("username");
        if (username) {
          detectedUser = username.toLowerCase().trim();
        }
        setCurrentUser(detectedUser);
        console.log("🎯 CURRENT USER:", detectedUser);
      } catch (error) {
        console.error("❌ ERROR detecting user:", error);
        setCurrentUser("");
      }
    };

    detectUser();
  }, []);

  // Fetch salary records for selected month/year
  const fetchSalaryRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        `🔄 Fetching salary records for ${selectedMonth}/${selectedYear}...`,
      );

      // Call the API
      const response = await financeAPI.salaryRecords.getAllRecords({
        year: selectedYear,
        month: selectedMonth,
      });

      console.log("📊 API Response:", response);

      let records = [];

      // Handle response structure
      if (response.data) {
        // New API structure
        if (response.data.success !== undefined) {
          if (response.data.success) {
            records = response.data.data || [];
          } else {
            setError(response.data.error || "Failed to load salary records");
          }
        }
        // Direct array response
        else if (Array.isArray(response.data)) {
          records = response.data;
        }
        // Other possible structures
        else {
          records =
            response.data.records ||
            response.data.salary_records ||
            response.data.results ||
            [];
        }
      }

      console.log(`✅ Loaded ${records.length} records from database`);

      // Initialize editable data with actual values from backend
      const initialEditableData = {};
      records.forEach((record) => {
        if (record.employee_id) {
          initialEditableData[record.employee_id] = {
            days_worked: record.days_worked || "",
            advance: record.advance || "",
            ot_hours: record.ot_hours || "",
            addition: record.addition || "",
            cash_payment: record.cash_payment || "",
            remarks: record.remarks || "",
          };
        }
      });

      // Initialize work day hours for each company (default to 10)
      const initialWorkDayHours = {};
      records.forEach((record) => {
        const companyName = record.company_name || "Unknown Company";
        if (!initialWorkDayHours[companyName]) {
          initialWorkDayHours[companyName] = 10; // Default to 10 hours
        }
      });

      setEditableData(initialEditableData);
      setWorkDayHours(initialWorkDayHours);
      setSalaryRecords(records);
      setFilteredRecords(records);
    } catch (error) {
      console.error("❌ Failed to fetch salary records:", error);

      // Show detailed error
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        setError(
          `Server error ${error.response.status}: ${JSON.stringify(error.response.data)}`,
        );
      } else if (error.request) {
        setError(
          "No response from server. Please check your internet connection.",
        );
      } else {
        setError("Request error: " + error.message);
      }

      setSalaryRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Update editable field with OT auto-calculation
  const updateEditableField = (employeeId, field, value) => {
    setEditableData((prev) => {
      const newData = {
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          [field]: value,
        },
      };

      // If OT Hours is updated, automatically calculate and update addition
      if (field === "ot_hours" && salaryRecords.length > 0) {
        const record = salaryRecords.find((r) => r.employee_id === employeeId);
        if (record) {
          const grossSalary = toNumber(record.gross_salary);
          const totalDays = toNumber(record.total_days) || 31;
          
          // Get work day hours for this company
          const companyName = record.company_name || "Unknown Company";
          const workDayHoursValue = workDayHours[companyName] || 10;
          
          const otPay = calculateOTPay(grossSalary, toNumber(value), totalDays, workDayHoursValue);

          // Get existing addition value (if any)
          const existingAddition =  0;

          // Update addition with OT pay
          newData[employeeId] = {
            ...newData[employeeId],
            addition: (toNumber(existingAddition) + otPay).toFixed(2),
          };
        }
      }

      return newData;
    });
  };

  // Get editable value (returns the edited value or original from record)
  const getEditableValue = (record, field) => {
    const employeeId = record.employee_id;
    if (
      editableData[employeeId] &&
      editableData[employeeId][field] !== undefined
    ) {
      return editableData[employeeId][field];
    }
    return record[field] || "";
  };

  // Calculate derived values based on edited data
  const calculateDerivedValues = (record) => {
    const employeeId = record.employee_id;
    const editable = editableData[employeeId] || {};

    // Use edited values or fall back to record values
    const daysWorked = toNumber(editable.days_worked || record.days_worked);
    const advance = toNumber(editable.advance || record.advance);
    const otHours = toNumber(editable.ot_hours || record.ot_hours);
    const addition = toNumber(editable.addition || record.addition);
    const cashPayment = toNumber(editable.cash_payment || record.cash_payment);

    // Use actual values from record for calculations
    const grossSalary = toNumber(record.gross_salary);
    const totalDays = toNumber(record.total_days) || 31;
    const ait = toNumber(record.ait);
    const basic = toNumber(record.basic);
    const houseRent = toNumber(record.house_rent);
    const medical = toNumber(record.medical);
    const conveyance = toNumber(record.conveyance);
    const cashSalary = toNumber(record.cash_salary);

    // Get work day hours for this company
    const companyName = record.company_name || "Unknown Company";
    const workDayHoursValue = workDayHours[companyName] || 10;
    
    // Calculate OT Pay with work day hours
    const otPay = calculateOTPay(grossSalary, otHours, totalDays, workDayHoursValue);
    const totalAddition = addition;

    // Calculate absent days
    const absentDays = Math.max(0, totalDays - daysWorked);

    // Calculate absent deduction if we have daily basic
    const dailyBasic = totalDays > 0 ? basic / totalDays : 0;
    const absentDeduction = dailyBasic * absentDays;

    // Calculate total deduction
    const totalDeduction = ait + advance + absentDeduction;

    // Calculate net pay (bank)
    const netPayBank = grossSalary - cashPayment - totalDeduction + totalAddition;

    // Calculate total payable
    const totalPayable = netPayBank + cashPayment + ait + cashSalary;

    return {
      daysWorked,
      absentDays,
      absentDeduction,
      advance,
      ait,
      totalDeduction,
      otHours,
      otPay,
      addition: totalAddition,
      cashPayment,
      netPayBank,
      totalPayable,
      grossSalary,
      basic,
      houseRent,
      medical,
      conveyance,
      cashSalary,
    };
  };

  // Load approval status for companies
  const loadApprovalStatus = async (companyName = "All Companies") => {
    try {
      const response = await financeAPI.approval.getApprovalStatus(companyName);
      console.log(
        `✅ Approval status loaded for ${companyName}:`,
        response.data,
      );

      setCompanyApprovalStatus((prev) => ({
        ...prev,
        [companyName]: {
          hr_prepared: response.data.hr_prepared || false,
          finance_checked: response.data.finance_checked || false,
          director_checked: response.data.director_checked || false,
          proprietor_approved: response.data.proprietor_approved || false,
        },
      }));
    } catch (error) {
      console.error(
        `❌ Failed to load approval status for ${companyName}:`,
        error,
      );
    }
  };

  useEffect(() => {
    fetchSalaryRecords();
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
          record.designation?.toLowerCase().includes(term),
      );
      setFilteredRecords(filtered);
    }
  }, [searchTerm, salaryRecords]);

  // Load approval status for companies when data loads
  useEffect(() => {
    if (filteredRecords.length > 0) {
      const uniqueCompanies = [
        ...new Set(
          filteredRecords.map((record) => record.company_name || "Unknown"),
        ),
      ];
      uniqueCompanies.forEach((companyName) => {
        loadApprovalStatus(companyName);
      });
    }
  }, [filteredRecords]);

  // Button enabling logic
  const isButtonEnabled = (buttonStep, companyName) => {
    const companyStatus = companyApprovalStatus[companyName] || {};
    const user = currentUser ? currentUser.toLowerCase().trim() : "";

    switch (buttonStep) {
      case "hr_prepared":
        return user === "lisa" && !companyStatus.hr_prepared;
      case "finance_checked":
        return (
          user === "morshed" &&
          companyStatus.hr_prepared &&
          !companyStatus.finance_checked
        );
      case "director_checked":
        return (
          user === "ankon" &&
          companyStatus.finance_checked &&
          !companyStatus.director_checked
        );
      case "proprietor_approved":
        return (
          (user === "tuhin" || user === "proprietor" || user === "md") &&
          companyStatus.director_checked &&
          !companyStatus.proprietor_approved
        );
      default:
        return false;
    }
  };

  // Approval handler
  const handleApprovalStep = async (step, companyName) => {
    console.log(`📧 Processing ${step} for ${companyName} by ${currentUser}`);

    try {
      const response = await financeAPI.approval.sendApproval({
        step: step,
        company_name: companyName,
        user_name: currentUser,
        username: currentUser,
        month: selectedMonth,
        year: selectedYear,
      });

      if (response.data.success) {
        alert(`✅ Email sent successfully! ${response.data.message}`);
        // Reload approval status
        loadApprovalStatus(companyName);
      } else {
        alert(`❌ Failed: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Approval step failed:", error);
      alert("❌ Connection error. Please try again.");
    }
  };

  // Toggle company sections
  const toggleCompany = (comp) => {
    setOpenCompanies((prev) => ({
      ...prev,
      [comp]: !prev[comp],
    }));
  };

  const showAllCompanies = () => {
    const allOpen = {};
    Object.keys(grouped).forEach((comp) => {
      allOpen[comp] = true;
    });
    setOpenCompanies(allOpen);
  };

  const hideAllCompanies = () => {
    setOpenCompanies({});
  };

  // Save updated data
  const saveData = async () => {
    const payload = filteredRecords
      .map((record, idx) => {
        const empId = record.employee_id?.trim();
        if (!empId) return null;

        // Get calculated values
        const calculated = calculateDerivedValues(record);
        const editable = editableData[empId] || {};

        // Get work day hours for this company
        const companyName = record.company_name || "Unknown Company";
        const workDayHoursValue = workDayHours[companyName] || 10;

        // Create updated record with both original and edited values
        const savedRecord = {
          sl: idx + 1,
          name: record.name?.trim() || "Unknown",
          employee_id: empId,
          designation: record.designation?.trim() || "",
          doj: record.doj,
          bank_account: record.bank_account || "",
          branch_name: record.branch_name || "",
          basic: calculated.basic,
          house_rent: calculated.houseRent,
          medical: calculated.medical,
          conveyance: calculated.conveyance,
          gross_salary: calculated.grossSalary,
          total_days: record.total_days || 0,
          days_worked: calculated.daysWorked,
          absent_days: calculated.absentDays,
          absent_ded: calculated.absentDeduction,
          advance: calculated.advance,
          ait: calculated.ait,
          total_ded: calculated.totalDeduction,
          ot_hours: calculated.otHours,
          ot_pay: calculated.otPay,
          addition: calculated.addition,
          cash_payment: calculated.cashPayment,
          cash_salary: calculated.cashSalary,
          net_pay_bank: calculated.netPayBank,
          total_payable: calculated.totalPayable,
          remarks: editable.remarks || record.remarks || "",
          month: selectedMonth,
          year: selectedYear,
          company_name: record.company_name || "Unknown Company",
          work_day_hours: workDayHoursValue, // Save work day hours
        };

        return savedRecord;
      })
      .filter(Boolean);

    console.log("Saving records to backend:", payload.length, "rows");
    console.log("Sample record to save:", payload[0]);

    try {
      const res = await financeAPI.salary.saveSalary(payload);
      const saved = res.data.saved || 0;
      const errors = res.data.errors || [];

      if (errors.length > 0) {
        console.warn("Save errors:", errors);
        alert(
          `Warning: Saved ${saved}, but ${errors.length} failed. Check console.`,
        );
      } else {
        alert(`Success: All ${saved} rows saved!`);
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

    const workDayHoursValue = workDayHours[companyName] || 10;

    const headers = [
      "SL",
      "Name",
      "ID",
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
      "Absent Ded.",
      "Advance",
      "AIT",
      "Total Ded.",
      "OT Hours",
      "OT Pay",
      "Addition",
      "Cash Payment",
      "Cash Salary",
      "Net Pay (Bank)",
      "Total Payable",
      "Bank Account",
      "Branch Name",
      "Remarks",
      "Company",
      "Work Day Hours",
    ];

    const rows = records.map((record, idx) => {
      const calculated = calculateDerivedValues(record);

      return [
        idx + 1,
        record.name || "",
        record.employee_id || "",
        record.designation || "",
        record.doj || "",
        calculated.basic,
        calculated.houseRent,
        calculated.medical,
        calculated.conveyance,
        calculated.grossSalary,
        record.total_days || 0,
        calculated.daysWorked,
        calculated.absentDays,
        calculated.absentDeduction,
        calculated.advance,
        calculated.ait,
        calculated.totalDeduction,
        calculated.otHours,
        calculated.otPay,
        calculated.addition,
        calculated.cashPayment,
        calculated.cashSalary,
        calculated.netPayBank,
        calculated.totalPayable,
        record.bank_account || "",
        record.branch_name || "",
        getEditableValue(record, "remarks") || "",
        record.company_name || "",
        workDayHoursValue,
      ];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    const colWidths = headers.map((_, i) => {
      const max = Math.max(
        ...rows.map((row) => (row[i] != null ? String(row[i]).length : 0)),
        String(headers[i]).length,
      );
      return { wch: Math.min(max + 2, 50) };
    });
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Salary Records");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(
      blob,
      `${companyName}_Salary_Records_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`,
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

  // Generate Excel from backend
  const generateExcelForCompany = async (companyName) => {
    try {
      setGeneratingExcel((prev) => ({ ...prev, [companyName]: true }));
      console.log(`📊 Generating Excel file for ${companyName}...`);

      const response = await financeAPI.salaryRecords.generateExcelNow({
        company_name: companyName,
        month: selectedMonth,
        year: selectedYear,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${companyName.replace(/\s+/g, "_")}_Salary_Records_${
          monthNames[selectedMonth - 1]
        }_${selectedYear}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Excel file generated and downloaded!`);
      alert(`Excel file generated successfully for ${companyName}!`);
    } catch (error) {
      console.error("❌ Error generating Excel file:", error);
      alert(
        `❌ Failed to generate Excel file for ${companyName}. Error: ${error.message}`,
      );
    } finally {
      setGeneratingExcel((prev) => ({ ...prev, [companyName]: false }));
    }
  };

  // Render approval footer
  const renderApprovalFooter = (companyName) => {
    const companyStatus = companyApprovalStatus[companyName] || {};

    return (
      <div className="footer">
        <button
          onClick={() => handleApprovalStep("hr_prepared", companyName)}
          disabled={!isButtonEnabled("hr_prepared", companyName)}
          className={`approval-btn ${
            isButtonEnabled("hr_prepared", companyName) ? "enabled" : "disabled"
          }`}
        >
          <span>Prepared by: HR</span>
          {companyStatus.hr_prepared && <span className="status-badge">✓</span>}
        </button>

        <button
          onClick={() => handleApprovalStep("finance_checked", companyName)}
          disabled={!isButtonEnabled("finance_checked", companyName)}
          className={`approval-btn ${
            isButtonEnabled("finance_checked", companyName)
              ? "enabled"
              : "disabled"
          }`}
        >
          <span>Checked by: Finance & Accounts</span>
          {companyStatus.finance_checked && (
            <span className="status-badge">✓</span>
          )}
        </button>

        <button
          onClick={() => handleApprovalStep("director_checked", companyName)}
          disabled={!isButtonEnabled("director_checked", companyName)}
          className={`approval-btn ${
            isButtonEnabled("director_checked", companyName)
              ? "enabled"
              : "disabled"
          }`}
        >
          <span>Checked by: Director</span>
          {companyStatus.director_checked && (
            <span className="status-badge">✓</span>
          )}
        </button>

        <button
          onClick={() => handleApprovalStep("proprietor_approved", companyName)}
          disabled={!isButtonEnabled("proprietor_approved", companyName)}
          className={`approval-btn ${
            isButtonEnabled("proprietor_approved", companyName)
              ? "enabled"
              : "disabled"
          }`}
        >
          <span>Approved by: Proprietor / MD</span>
          {companyStatus.proprietor_approved && (
            <span className="status-badge">✓</span>
          )}
        </button>
      </div>
    );
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
                </div>
              </div>

              <div className="controls-section">
                <div className="search-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search employees by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="filter-controls">
                  <div className="filter-group">
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
                    onClick={() => navigate("/salary-format")}
                    className="btn btn-back"
                  >
                    <FaArrowLeft /> Back to Current Month
                  </button>

                  <button
                    className="btn btn-save"
                    onClick={saveData}
                    disabled={filteredRecords.length === 0}
                  >
                    <FaSave /> Save Updates
                  </button>

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

          {/* TAX STATUS SUMMARY */}
          <div className="tax-status-summary">
            <div className="status-item">
              <span className="status-label">Total Employees:</span>
              <span className="status-value">{filteredRecords.length}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Companies:</span>
              <span className="status-value">
                {Object.keys(grouped).length}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Total Gross Salary:</span>
              <span className="status-value">
                {formatNumber(
                  filteredRecords.reduce(
                    (sum, record) => sum + toNumber(record.gross_salary),
                    0,
                  ),
                )}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Total AIT:</span>
              <span className="status-value">
                {formatNumber(
                  filteredRecords.reduce(
                    (sum, record) => sum + toNumber(record.ait),
                    0,
                  ),
                )}
              </span>
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
                <FaSync /> Retry
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
                      className={`company-toggle-btn ${openCompanies[comp] ? "active" : ""}`}
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

          {/* COMPANY SECTIONS - WITH EDITABLE FIELDS */}
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
                      <span className="record-count">
                        {" "}
                        ({records.length} employees)
                      </span>
                    </h3>
                    
                    {/* WORK DAY HOURS SELECTOR */}
                    <div className="work-day-selector">
                      <label>Work Day Hours for OT Calculation:</label>
                      <select 
                        value={workDayHours[comp] || 10}
                        onChange={(e) => setWorkDayHours(prev => ({
                          ...prev, 
                          [comp]: Number(e.target.value)
                        }))}
                        className="work-day-select"
                      >
                        <option value={10}>10 Hours/Day</option>
                        <option value={8}>8 Hours/Day</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="company-action-buttons">
                    <button
                      onClick={() => generateExcelForCompany(comp)}
                      className="btn btn-generate-excel"
                      disabled={generatingExcel[comp]}
                    >
                      <FaFileExcel />
                      {generatingExcel[comp]
                        ? "Generating..."
                        : "Generate Excel"}
                    </button>
                    <button
                      onClick={() => exportCompanyData(comp)}
                      className="btn btn-export-section"
                    >
                      <FaFileExport /> Export {comp} Data
                    </button>
                  </div>
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
                          <th>OT Min</th>
                          <th>OT Pay</th>
                          <th>Addition</th>
                          <th>Cash Payment</th>
                          <th>Cash Salary</th>
                          <th>Net Pay (Bank)</th>
                          <th>Total Payable</th>
                          <th>Bank Account</th>
                          <th>Branch Name</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record, idx) => {
                          const calculated = calculateDerivedValues(record);

                          return (
                            <tr
                              key={`${record.employee_id}-${idx}`}
                              className="data-row"
                            >
                              <td className="sl-number">{idx + 1}</td>
                              <td className="emp-name">{record.name}</td>
                              <td className="emp-id">{record.employee_id}</td>
                              <td className="emp-designation">
                                {record.designation}
                              </td>
                              <td className="emp-doj">{record.doj}</td>
                              <td className="salary-amount">
                                {formatNumber(calculated.basic)}
                              </td>
                              <td className="salary-amount">
                                {formatNumber(calculated.houseRent)}
                              </td>
                              <td className="salary-amount">
                                {formatNumber(calculated.medical)}
                              </td>
                              <td className="salary-amount">
                                {formatNumber(calculated.conveyance)}
                              </td>
                              <td className="gross-salary">
                                {formatNumber(calculated.grossSalary)}
                              </td>
                              <td className="days-count">
                                {record.total_days || 0}
                              </td>

                              {/* EDITABLE: Days Worked */}
                              <td>
                                <input
                                  type="number"
                                  value={getEditableValue(
                                    record,
                                    "days_worked",
                                  )}
                                  placeholder={
                                    record.days_worked || record.total_days || 0
                                  }
                                  onChange={(e) =>
                                    updateEditableField(
                                      record.employee_id,
                                      "days_worked",
                                      e.target.value,
                                    )
                                  }
                                  className="editable-input days-input"
                                  min="0"
                                  max={record.total_days || 31}
                                />
                              </td>

                              <td className="absent-days">
                                {calculated.absentDays}
                              </td>
                              <td className="deduction-amount">
                                {formatNumber(calculated.absentDeduction)}
                              </td>

                              {/* EDITABLE: Advance */}
                              <td>
                                <input
                                  type="number"
                                  value={getEditableValue(record, "advance")}
                                  placeholder="0"
                                  onChange={(e) =>
                                    updateEditableField(
                                      record.employee_id,
                                      "advance",
                                      e.target.value,
                                    )
                                  }
                                  className="editable-input advance-input"
                                  min="0"
                                />
                              </td>

                              <td className="tax-amount">
                                {formatNumber(calculated.ait)}
                              </td>
                              <td className="deduction-amount total-deduction">
                                {formatNumber(calculated.totalDeduction)}
                              </td>

                              {/* EDITABLE: OT Hours */}
                              <td className="ot-hours">
                                <input
                                  type="number"
                                  value={getEditableValue(record, "ot_hours") || ""}
                                  placeholder="Minutes"
                                  onChange={(e) =>
                                    updateEditableField(
                                      record.employee_id,
                                      "ot_hours",
                                      e.target.value,
                                    )
                                  }
                                  className="editable-input ot-input"
                                  min="0"
                                  step="1"
                                  title="Enter OT in minutes (60 = 1 hour, 120 = 2 hours)"
                                />
                              </td>
                              <td className="ot-pay-amount">
                                {formatNumber(calculated.otPay)}
                              </td>

                              {/* EDITABLE: Addition */}
                              <td>
                                <input
                                  type="number"
                                  value={getEditableValue(record, "addition")}
                                  placeholder="0"
                                  onChange={(e) =>
                                    updateEditableField(
                                      record.employee_id,
                                      "addition",
                                      e.target.value,
                                    )
                                  }
                                  className="editable-input addition-input"
                                  min="0"
                                />
                              </td>

                              {/* EDITABLE: Cash Payment */}
                              <td>
                                <input
                                  type="number"
                                  value={getEditableValue(
                                    record,
                                    "cash_payment",
                                  )}
                                  placeholder="0"
                                  onChange={(e) =>
                                    updateEditableField(
                                      record.employee_id,
                                      "cash_payment",
                                      e.target.value,
                                    )
                                  }
                                  className="editable-input cash-input"
                                  min="0"
                                />
                              </td>

                              <td className="salary-amount">
                                {formatNumber(calculated.cashSalary)}
                              </td>
                              <td
                                className={`net-pay ${calculated.netPayBank < 0 ? "negative" : "positive"}`}
                              >
                                {formatNumber(calculated.netPayBank)}
                              </td>
                              <td className="total-payable">
                                {formatNumber(calculated.totalPayable)}
                              </td>
                              <td className="bank-account">
                                {record.bank_account || "N/A"}
                              </td>
                              <td className="branch-code">
                                {record.branch_name || "N/A"}
                              </td>

                              {/* EDITABLE: Remarks */}
                              <td>
                                <input
                                  type="text"
                                  value={getEditableValue(record, "remarks")}
                                  placeholder="Remarks"
                                  onChange={(e) =>
                                    updateEditableField(
                                      record.employee_id,
                                      "remarks",
                                      e.target.value,
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

                {/* SUMMARY SECTION */}
                <div className="tax-summary-note">
                  <h4>📊 Records Summary for {comp}</h4>
                  <div className="summary-stats">
                    <div className="summary-stat">
                      <span className="stat-label">Total Employees:</span>
                      <span className="stat-value">{records.length}</span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Total Gross Salary:</span>
                      <span className="stat-value">
                        {formatNumber(
                          records.reduce(
                            (sum, record) =>
                              sum + toNumber(record.gross_salary),
                            0,
                          ),
                        )}
                      </span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Total AIT:</span>
                      <span className="stat-value">
                        {formatNumber(
                          records.reduce(
                            (sum, record) => sum + toNumber(record.ait),
                            0,
                          ),
                        )}
                      </span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Total Net Pay:</span>
                      <span className="stat-value">
                        {formatNumber(
                          records.reduce((sum, record) => {
                            const calculated = calculateDerivedValues(record);
                            return sum + calculated.netPayBank;
                          }, 0),
                        )}
                      </span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Total Payable:</span>
                      <span className="stat-value">
                        {formatNumber(
                          records.reduce((sum, record) => {
                            const calculated = calculateDerivedValues(record);
                            return sum + calculated.totalPayable;
                          }, 0),
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* APPROVAL FOOTER */}
                {renderApprovalFooter(comp)}
              </div>
            );
          })}

          {/* SUMMARY SECTION - Only show when no companies are open */}
          {Object.keys(openCompanies).every((comp) => !openCompanies[comp]) &&
            filteredRecords.length > 0 && (
              <div className="summary-section">
                <div className="summary-header">
                  <h2>
                    <FaUsers className="section-icon" />
                    Summary Overview
                  </h2>
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
                          (s, record) => s + toNumber(record.gross_salary),
                          0,
                        ),
                      )}
                    </div>
                    <div className="stat-label">Total Gross Salary</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">
                      {formatNumber(
                        filteredRecords.reduce(
                          (s, record) => s + toNumber(record.ait),
                          0,
                        ),
                      )}
                    </div>
                    <div className="stat-label">Total Deducted AIT</div>
                  </div>
                </div>

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
                          <th>Net Pay (Bank)</th>
                          <th>Total Payable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(grouped).map((comp, i) => {
                          const records = grouped[comp];
                          const summary = records.reduce(
                            (acc, record) => {
                              const calculated = calculateDerivedValues(record);
                              return {
                                gross: acc.gross + calculated.grossSalary,
                                ait: acc.ait + calculated.ait,
                                netBank: acc.netBank + calculated.netPayBank,
                                totalPay:
                                  acc.totalPay + calculated.totalPayable,
                              };
                            },
                            { gross: 0, ait: 0, netBank: 0, totalPay: 0 },
                          );

                          return (
                            <tr key={i} className="data-row summary-row">
                              <td className="sl-number">{i + 1}</td>
                              <td className="company-name">{comp}</td>
                              <td className="employee-count">
                                {records.length}
                              </td>
                              <td className="gross-salary">
                                {formatNumber(summary.gross)}
                              </td>
                              <td className="tax-amount">
                                {formatNumber(summary.ait)}
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

                        {/* GRAND TOTAL ROW */}
                        <tr className="grand-total">
                          <td colSpan="2" className="grand-total-label">
                            Grand Total
                          </td>
                          <td className="grand-total-count">
                            {filteredRecords.length}
                          </td>
                          <td className="grand-total-gross">
                            {formatNumber(
                              filteredRecords.reduce((s, record) => {
                                const calculated =
                                  calculateDerivedValues(record);
                                return s + calculated.grossSalary;
                              }, 0),
                            )}
                          </td>
                          <td className="grand-total-tax">
                            {formatNumber(
                              filteredRecords.reduce((s, record) => {
                                const calculated =
                                  calculateDerivedValues(record);
                                return s + calculated.ait;
                              }, 0),
                            )}
                          </td>
                          <td
                            className={`grand-total-net ${
                              filteredRecords.reduce((s, record) => {
                                const calculated =
                                  calculateDerivedValues(record);
                                return s + calculated.netPayBank;
                              }, 0) < 0
                                ? "negative"
                                : "positive"
                            }`}
                          >
                            {formatNumber(
                              filteredRecords.reduce((s, record) => {
                                const calculated =
                                  calculateDerivedValues(record);
                                return s + calculated.netPayBank;
                              }, 0),
                            )}
                          </td>
                          <td className="grand-total-payable">
                            {formatNumber(
                              filteredRecords.reduce((s, record) => {
                                const calculated =
                                  calculateDerivedValues(record);
                                return s + calculated.totalPayable;
                              }, 0),
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          {/* NO DATA MESSAGE */}
          {filteredRecords.length === 0 && !loading && !error && (
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
        /* REUSE ALL CSS FROM SALARY FORMAT */
        .salary-records-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .dashboard {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 1rem;
        }

        .card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        /* HEADER SECTION */
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

        .btn-active {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: 2px solid #8b5cf6;
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

        /* TAX STATUS SUMMARY */
        .tax-status-summary {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          padding: 1rem 2.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          flex-wrap: wrap;
        }

        .status-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem 1rem;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          min-width: 120px;
        }

        .status-label {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .status-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1f2937;
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

        .record-count {
          color: #8b5cf6;
          font-weight: 600;
        }

        .company-action-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .btn-generate-excel {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 1rem 1.8rem;
          border: none;
          border-radius: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .btn-generate-excel:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .btn-generate-excel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
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

        /* BEAUTIFUL COLOR CODING - Matching SalaryFormat */
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
        .bank-account {
          color: #7c3aed;
          background: #f3e8ff;
          padding: 0.5rem;
          border-radius: 8px;
        }
        .branch-code {
          color: #1e40af;
          background: #dbeafe;
          padding: 0.5rem;
          border-radius: 8px;
        }

        /* APPROVAL BUTTONS STYLES */
        .approval-btn {
          padding: 1rem 1.5rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          min-width: 200px;
          justify-content: center;
        }

        .approval-btn.enabled {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-color: #059669;
          cursor: pointer;
        }

        .approval-btn.enabled:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
        }

        .approval-btn.disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .status-badge {
          background: white;
          color: #10b981;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          padding: 2rem 0;
          color: #64748b;
          font-size: 0.95rem;
          border-top: 2px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 1rem;
        }

        /* TAX SUMMARY SECTION */
        .tax-summary-note {
          margin-top: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .tax-summary-note h4 {
          margin-top: 0;
          color: #1e293b;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }

        .summary-stats {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .summary-stat {
          display: flex;
          flex-direction: column;
          padding: 0.5rem 1rem;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          min-width: 150px;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 600;
        }

        .stat-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1f2937;
        }

        /* ERROR SECTION */
        .error-section {
          padding: 1rem 2.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          margin: 1rem 2.5rem;
          color: #dc2626;
        }

        .error-section h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 0.5rem 0;
        }

        .error-section p {
          margin: 0 0 1rem 0;
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
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
        }

        .summary-row:hover {
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%) !important;
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

        /* GRAND TOTAL STYLES */
        .grand-total {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
          color: white !important;
          font-weight: 800;
        }

        .grand-total td {
          color: white !important;
          border-bottom: none !important;
          font-size: 1.1rem;
          text-align: center;
          padding: 1.2rem 0.8rem;
        }

        .grand-total-label {
          font-size: 1.3rem !important;
          text-align: left !important;
          padding-left: 1.5rem !important;
          background: transparent !important;
        }

        .grand-total-count,
        .grand-total-gross,
        .grand-total-tax,
        .grand-total-net,
        .grand-total-payable {
          text-align: center !important;
          font-weight: 800;
          background: transparent !important;
          border: none !important;
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

          .company-action-buttons {
            width: 100%;
            justify-content: center;
          }

          .btn-generate-excel,
          .btn-export-section {
            flex: 1;
            justify-content: center;
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

          .tax-status-summary {
            padding: 1rem;
          }

          .status-item {
            min-width: 90px;
            padding: 0.5rem;
          }

          .footer {
            flex-direction: column;
            text-align: center;
          }

          .approval-btn {
            min-width: 100%;
          }
        }

        .work-day-selector {
          margin-top: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .work-day-selector label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #7c3aed;
        }

        .work-day-select {
          padding: 0.4rem 0.8rem;
          border: 2px solid #8b5cf6;
          border-radius: 6px;
          background: white;
          color: #1f2937;
          font-weight: 500;
          cursor: pointer;
        }

        .work-day-select:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
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

          .company-action-buttons {
            flex-direction: column;
          }

          .btn-generate-excel,
          .btn-export-section {
            width: 100%;
          }

          .summary-stats {
            grid-template-columns: 1fr;
          }

          .tax-status-summary {
            flex-direction: column;
          }

          .status-item {
            width: 100%;
          }

          .footer {
            flex-direction: column;
          }

          .approval-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default SalaryRecords;
