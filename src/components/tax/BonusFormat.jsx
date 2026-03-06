// src/pages/finance/BonusFormat.jsx - COMPLETE WORKING VERSION
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSearch,
  FaSave,
  FaFileExport,
  FaBuilding,
  FaUsers,
  FaCalendarAlt,
  FaFileExcel,
  FaCalculator,
  FaSync,
  FaGift,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPercent,
  FaClock,
  FaEdit,
  FaMoneyBillWave,
} from "react-icons/fa";
import { financeAPI } from "../../api/finance";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Helper functions
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
};

const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "৳0";
  const abs = Math.abs(num);
  const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return num < 0 ? `-৳${formatted}` : `৳${formatted}`;
};

const formatDecimal = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "0.00";
  return Number(num).toFixed(2);
};

const calculateServiceDuration = (joiningDate, referenceDate) => {
  if (!joiningDate || !referenceDate) return { months: 0, years: 0 };

  const join = new Date(joiningDate);
  const ref = new Date(referenceDate);

  let years = ref.getFullYear() - join.getFullYear();
  let months = ref.getMonth() - join.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  const totalMonths = years * 12 + months;

  return {
    months: totalMonths,
    years: years + months / 12,
  };
};

const getEligibilityInfo = (monthsOfService) => {
  if (monthsOfService >= 12) {
    return {
      status: "full",
      percentage: 100,
      label: "100% Eligible (12+ months)",
      shortLabel: "100%",
      color: "#10b981",
      bgColor: "#d1fae5",
      borderColor: "#34d399",
      icon: "✅",
    };
  } else if (monthsOfService >= 10) {
    return {
      status: "seventy_five",
      percentage: 75,
      label: "75% Eligible (10-11 months)",
      shortLabel: "75%",
      color: "#f59e0b",
      bgColor: "#fef3c7",
      borderColor: "#fbbf24",
      icon: "👍",
    };
  } else if (monthsOfService >= 6) {
    return {
      status: "fifty",
      percentage: 50,
      label: "50% Eligible (6-8 months)",
      shortLabel: "50%",
      color: "#f97316",
      bgColor: "#ffedd5",
      borderColor: "#fdba74",
      icon: "⚠️",
    };
  } else {
    return {
      status: "none",
      percentage: 0,
      label: "Not Eligible (< 6 months)",
      shortLabel: "0%",
      color: "#ef4444",
      bgColor: "#fee2e2",
      borderColor: "#fca5a5",
      icon: "❌",
    };
  }
};

const BonusFormat = () => {
  const navigate = useNavigate();

  // State variables
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [bonusRecords, setBonusRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openCompanies, setOpenCompanies] = useState({});
  const [showSummary, setShowSummary] = useState(true);
  const [manualData, setManualData] = useState({});
  const [generatingExcel, setGeneratingExcel] = useState({});
  const [calculating, setCalculating] = useState(false);
  const [isDataSavedForMonth, setIsDataSavedForMonth] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Date selection
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [bonusType, setBonusType] = useState("Eid Bonus");
  const [bonusPercentage, setBonusPercentage] = useState(100);

  // Approval status
  const [approvalStatus, setApprovalStatus] = useState({});
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

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i);

  const bonusTypes = [
    "Eid Bonus",
    "Performance Bonus",
    "Festival Bonus",
    "Annual Bonus",
    "Special Bonus",
    "Incentive",
  ];

  // Group employees by company
  const grouped = useMemo(() => {
    return filteredEmployees.reduce((acc, emp) => {
      const comp = emp.company_name ?? emp.company?.company_name ?? "Unknown";
      if (!acc[comp]) acc[comp] = [];
      acc[comp].push(emp);
      return acc;
    }, {});
  }, [filteredEmployees]);

  // USER DETECTION
  useEffect(() => {
    const detectUser = () => {
      try {
        let detectedUser = "";
        const username = localStorage.getItem("username");
        if (username) {
          detectedUser = username.toLowerCase().trim();
        } else {
          const userData = localStorage.getItem("userData");
          if (userData) {
            try {
              const parsedData = JSON.parse(userData);
              detectedUser = (parsedData.username || parsedData.user_name || "")
                .toLowerCase()
                .trim();
            } catch (e) {
              console.error("Error parsing userData:", e);
            }
          }
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

  // Load employees
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        console.log("📊 Loading employees for bonus calculation...");

        const res = await financeAPI.employee.getAll();
        const filtered = res.data.filter((e) => e.salary && e.employee_id);

        // Sort by company and name
        filtered.sort((a, b) => {
          const compA = a.company_name ?? a.company?.company_name ?? "Unknown";
          const compB = b.company_name ?? b.company?.company_name ?? "Unknown";
          if (compA !== compB) return compA.localeCompare(compB);
          return (a.name || "").localeCompare(b.name || "");
        });

        setEmployees(filtered);
        setFilteredEmployees(filtered);

        // Load existing bonus records if any
        await loadExistingBonusRecords(filtered.map((e) => e.employee_id));

        console.log(`✅ Loaded ${filtered.length} employees`);
      } catch (error) {
        console.error("Failed to load employees:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, [selectedMonth, selectedYear, bonusType]);

  // Load existing bonus records
  const loadExistingBonusRecords = async (employeeIds) => {
    try {
      // Check if bonus API exists
      if (!financeAPI.bonus || !financeAPI.bonus.getAll) {
        console.log("ℹ️ Bonus API not available - checking localStorage");
        // Load from localStorage as fallback
        const savedKey = `bonus_records_${selectedYear}_${selectedMonth}_${bonusType.replace(/\s+/g, "_")}`;
        const savedBonusData = localStorage.getItem(savedKey);
        if (savedBonusData) {
          try {
            const records = JSON.parse(savedBonusData);
            const recordsMap = {};
            records.forEach((record) => {
              recordsMap[record.employee_id] = record;
            });
            setBonusRecords(recordsMap);
            setIsDataSavedForMonth(Object.keys(recordsMap).length > 0);
            console.log(
              `📁 Loaded ${Object.keys(recordsMap).length} bonus records from localStorage`,
            );
          } catch (e) {
            console.error("Failed to parse saved bonus data:", e);
          }
        }
        return;
      }

      const response = await financeAPI.bonus.getAll({
        month: selectedMonth,
        year: selectedYear,
        bonus_type: bonusType,
      });

      if (response.data.success && response.data.data) {
        const records = {};
        response.data.data.forEach((record) => {
          records[record.employee_id] = record;
        });
        setBonusRecords(records);
        setIsDataSavedForMonth(Object.keys(records).length > 0);
        console.log(
          `📁 Loaded ${Object.keys(records).length} existing bonus records from backend`,
        );

        // Also save to localStorage as backup
        const savedKey = `bonus_records_${selectedYear}_${selectedMonth}_${bonusType.replace(/\s+/g, "_")}`;
        localStorage.setItem(savedKey, JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error("Failed to load existing bonus records:", error);

      // Fallback to localStorage
      try {
        const savedKey = `bonus_records_${selectedYear}_${selectedMonth}_${bonusType.replace(/\s+/g, "_")}`;
        const savedBonusData = localStorage.getItem(savedKey);
        if (savedBonusData) {
          const records = JSON.parse(savedBonusData);
          const recordsMap = {};
          records.forEach((record) => {
            recordsMap[record.employee_id] = record;
          });
          setBonusRecords(recordsMap);
          setIsDataSavedForMonth(Object.keys(recordsMap).length > 0);
          console.log(
            `📁 Loaded ${Object.keys(recordsMap).length} bonus records from localStorage (fallback)`,
          );
        }
      } catch (e) {
        console.error("Fallback localStorage load failed:", e);
      }
    }
  };

  // Filter employees based on search
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(term) ||
          emp.employee_id?.toLowerCase().includes(term) ||
          emp.designation?.toLowerCase().includes(term),
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  // Calculate bonus for an employee
  const calculateBonus = useCallback(
    (employee) => {
      const empId = employee.employee_id;

      // Check if we have existing record
      const existingRecord = bonusRecords[empId];

      // Get salary components
      const grossSalary = Number(employee.salary) || 0;
      const basic = grossSalary * 0.6;
      const houseRent = grossSalary * 0.3;
      const medical = grossSalary * 0.05;
      const conveyance = grossSalary * 0.05;
      const cashSalary = Number(employee.salary_cash) || 0;

      // Calculate service duration
      const referenceDate = new Date(selectedYear, selectedMonth - 1, 1);
      const { months, years } = calculateServiceDuration(
        employee.joining_date,
        referenceDate,
      );

      // Get eligibility
      const eligibility = getEligibilityInfo(months);

      // Calculate bonus
      const bonusAmount = (grossSalary * bonusPercentage) / 100;
      const bonusPayable = (bonusAmount * eligibility.percentage) / 100;

      // Get manual adjustments
      const manualAdjustment =
        Number(getManual(empId, "manualAdjustment")) || 0;
      const cashPayment = Number(getManual(empId, "cashPayment")) || 0;
      const remarks = getManual(empId, "remarks", "");

      // Calculate totals
      const totalPayable =
        bonusPayable + cashPayment + cashSalary + manualAdjustment;

      return {
        // Basic info
        employee_id: empId,
        name: employee.name,
        designation: employee.designation,
        doj: employee.joining_date,
        company_name:
          employee.company_name ?? employee.company?.company_name ?? "Unknown",
        bank_account: employee.bank_account,
        branch_name: employee.branch_name,

        // Salary components
        basic,
        house_rent: houseRent,
        medical,
        conveyance,
        gross_salary: grossSalary,
        cash_salary: cashSalary,

        // Service duration
        months_of_service: months,
        years_of_service: years,

        // Eligibility
        eligibility_status: eligibility.status,
        eligibility_percentage: eligibility.percentage,
        eligibility_label: eligibility.label,
        eligibility_short: eligibility.shortLabel,
        eligibility_color: eligibility.color,
        eligibility_bg: eligibility.bgColor,

        // Bonus calculation
        bonus_percentage: bonusPercentage,
        bonus_amount: bonusAmount,
        bonus_payable: bonusPayable,

        // Manual fields
        cash_payment: cashPayment,
        manual_adjustment: manualAdjustment,
        adjustment_reason: getManual(empId, "adjustmentReason", ""),

        // Totals
        total_payable: totalPayable,

        // Remarks
        remarks,

        // Existing data
        existing_id: existingRecord?.id,
        is_approved: existingRecord?.is_approved || false,
      };
    },
    [selectedMonth, selectedYear, bonusPercentage, bonusRecords, manualData],
  );

  // Manual data handlers
  const updateManual = (empId, field, value) => {
    const parsed =
      field === "remarks" || field === "adjustmentReason"
        ? value
        : parseFloat(value) || 0;

    const newData = {
      ...manualData,
      [empId]: {
        ...manualData[empId],
        [field]: parsed,
      },
    };

    setManualData(newData);
    localStorage.setItem("bonusManualData", JSON.stringify(newData));
  };

  const getManual = (empId, field, defaultVal = 0) => {
    // Check if we have an existing record with this field
    if (!manualData[empId] && bonusRecords[empId]) {
      // Initialize from existing record
      if (field === "manualAdjustment")
        return bonusRecords[empId].manual_adjustment || 0;
      if (field === "cashPayment") return bonusRecords[empId].cash_payment || 0;
      if (field === "adjustmentReason")
        return bonusRecords[empId].adjustment_reason || "";
      if (field === "remarks") return bonusRecords[empId].remarks || "";
    }

    return manualData[empId]?.[field] ?? defaultVal;
  };

  // Load saved manual data
  useEffect(() => {
    const saved = localStorage.getItem("bonusManualData");
    if (saved) {
      try {
        setManualData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved manual data:", e);
      }
    }
  }, []);

  // Calculate all bonuses
  const calculateAllBonuses = async () => {
    setCalculating(true);

    // Show loading state for all employees
    setTimeout(() => {
      setCalculating(false);
      alert(`✅ Bonus calculated for ${filteredEmployees.length} employees`);
    }, 800);
  };

  // Check if backend data exists
  const checkBackendDataExists = async () => {
    try {
      if (!financeAPI.bonus || !financeAPI.bonus.checkBonusExists) {
        // Check localStorage
        const savedKey = `bonus_records_${selectedYear}_${selectedMonth}_${bonusType.replace(/\s+/g, "_")}`;
        const saved = localStorage.getItem(savedKey);
        setIsDataSavedForMonth(!!saved);
        return;
      }

      const response = await financeAPI.bonus.checkBonusExists(
        selectedMonth,
        selectedYear,
        bonusType,
      );

      if (response.data && response.data.exists) {
        setIsDataSavedForMonth(true);
      } else {
        setIsDataSavedForMonth(false);
      }
    } catch (error) {
      console.error("Error checking backend for bonus records:", error);
      setIsDataSavedForMonth(false);
    }
  };

  // Check data exists on load
  useEffect(() => {
    if (!loading && filteredEmployees.length > 0) {
      checkBackendDataExists();
    }
  }, [
    loading,
    selectedMonth,
    selectedYear,
    bonusType,
    filteredEmployees.length,
  ]);

  // Save bonus data
  const saveData = async () => {
    if (isDataSavedForMonth) {
      const confirmResave = window.confirm(
        `Bonus data for ${bonusType} - ${monthNames[selectedMonth - 1]} ${selectedYear} has already been saved. Do you want to save again?`,
      );
      if (!confirmResave) {
        return;
      }
    }

    const payload = filteredEmployees
      .map((emp, idx) => {
        const empId = emp.employee_id?.trim();
        if (!empId) return null;

        const bonus = calculateBonus(emp);

        return {
          sl: idx + 1,
          name: bonus.name,
          employee_id: bonus.employee_id,
          designation: bonus.designation,
          doj: bonus.doj,
          bank_account: bonus.bank_account,
          branch_name: bonus.branch_name,
          company_name: bonus.company_name,

          basic: bonus.basic,
          house_rent: bonus.house_rent,
          medical: bonus.medical,
          conveyance: bonus.conveyance,
          gross_salary: bonus.gross_salary,

          months_of_service: bonus.months_of_service,
          years_of_service: bonus.years_of_service,
          eligibility_status: bonus.eligibility_status,
          eligibility_percentage: bonus.eligibility_percentage,

          bonus_percentage: bonus.bonus_percentage,
          bonus_amount: bonus.bonus_amount,
          bonus_payable: bonus.bonus_payable,

          cash_payment: bonus.cash_payment,
          cash_salary: bonus.cash_salary,
          manual_adjustment: bonus.manual_adjustment,
          adjustment_reason: bonus.adjustment_reason,

          total_payable: bonus.total_payable,
          remarks: bonus.remarks,

          month: selectedMonth,
          year: selectedYear,
          bonus_type: bonusType,
        };
      })
      .filter(Boolean);

    console.log("Saving bonus data:", payload);

    // Always save to localStorage as backup
    const savedKey = `bonus_records_${selectedYear}_${selectedMonth}_${bonusType.replace(/\s+/g, "_")}`;
    localStorage.setItem(savedKey, JSON.stringify(payload));

    try {
      // Try to save to backend if API exists
      if (financeAPI.bonus && financeAPI.bonus.saveBonus) {
        const res = await financeAPI.bonus.saveBonus(payload);

        if (res.data.success) {
          setIsDataSavedForMonth(true);
          alert(
            `✅ Successfully saved ${payload.length} bonus records for ${bonusType} - ${monthNames[selectedMonth - 1]} ${selectedYear}`,
          );
          await loadExistingBonusRecords(employees.map((e) => e.employee_id));
        } else {
          alert(
            `⚠️ Warning: ${res.data.message || "Save completed with warnings"}`,
          );
        }
      } else {
        // Backend not available, just show localStorage success
        setIsDataSavedForMonth(true);
        alert(
          `✅ Saved ${payload.length} bonus records to localStorage (backend not available)`,
        );

        // Update local state
        const recordsMap = {};
        payload.forEach((record) => {
          recordsMap[record.employee_id] = record;
        });
        setBonusRecords(recordsMap);
      }
    } catch (error) {
      console.error("Save failed:", error);
      // Still saved to localStorage, so show partial success
      setIsDataSavedForMonth(true);
      alert(
        `⚠️ Saved to localStorage but backend save failed. Data is backed up locally.`,
      );
    }
  };

  // Reset save status
  const resetMonthSave = () => {
    checkBackendDataExists();
    alert(
      `✅ Re-checked backend for ${bonusType} - ${monthNames[selectedMonth - 1]} ${selectedYear}`,
    );
  };

  // Export to Excel
  const exportToExcel = async (companyName = null) => {
    try {
      setGeneratingExcel((prev) => ({ ...prev, [companyName || "all"]: true }));

      const employeesToExport = companyName
        ? filteredEmployees.filter(
            (e) =>
              (e.company_name ?? e.company?.company_name ?? "Unknown") ===
              companyName,
          )
        : filteredEmployees;

      const data = employeesToExport.map((emp, idx) => {
        const bonus = calculateBonus(emp);
        return {
          SL: idx + 1,
          Name: bonus.name,
          "Employee ID": bonus.employee_id,
          Designation: bonus.designation,
          DOJ: bonus.doj,
          Company: bonus.company_name,
          Basic: formatDecimal(bonus.basic),
          "House Rent": formatDecimal(bonus.house_rent),
          Medical: formatDecimal(bonus.medical),
          Conveyance: formatDecimal(bonus.conveyance),
          "Gross Salary": formatDecimal(bonus.gross_salary),
          "Months of Service": bonus.months_of_service,
          "Years of Service": formatDecimal(bonus.years_of_service),
          Eligibility: bonus.eligibility_label,
          "Eligibility %": `${bonus.eligibility_percentage}%`,
          "Bonus %": `${bonus.bonus_percentage}%`,
          "Bonus Amount": formatDecimal(bonus.bonus_amount),
          "Bonus Payable": formatDecimal(bonus.bonus_payable),
          "Cash Salary (Fixed)": formatDecimal(bonus.cash_salary),
          "Cash Payment (Additional)": formatDecimal(bonus.cash_payment),
          "Manual Adjustment": formatDecimal(bonus.manual_adjustment),
          "Adjustment Reason": bonus.adjustment_reason || "",
          "Total Payable": formatDecimal(bonus.total_payable),
          "Bank Account": bonus.bank_account || "N/A",
          "Branch Name": bonus.branch_name || "N/A",
          Remarks: bonus.remarks || "",
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bonus");

      // Set column widths
      const colWidths = [
        { wch: 5 },
        { wch: 25 },
        { wch: 15 },
        { wch: 25 },
        { wch: 12 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
        { wch: 10 },
        { wch: 20 },
        { wch: 10 },
        { wch: 8 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 20 },
        { wch: 14 },
        { wch: 20 },
        { wch: 15 },
        { wch: 25 },
      ];
      ws["!cols"] = colWidths;

      const fileName = companyName
        ? `${companyName.replace(/\s+/g, "_")}_Bonus_${bonusType.replace(/\s+/g, "_")}_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`
        : `All_Companies_Bonus_${bonusType.replace(/\s+/g, "_")}_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`;

      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Export failed:", error);
      alert("❌ Export failed");
    } finally {
      setGeneratingExcel((prev) => ({
        ...prev,
        [companyName || "all"]: false,
      }));
    }
  };

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

  if (loading || loadingStatus) {
    return (
      <div className="center-screen">
        <div className="fullscreen-loader">
          <div className="spinner" />
          <p>Loading Bonus Format...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bonus-format-container">
      <div className="dashboard">
        <div className="card">
          {/* HEADER SECTION */}
          <div className="header-section">
            <div className="header-main">
              <div className="title-section">
                <h1 className="main-title">
                  <FaGift className="title-icon" />
                  Bonus Format
                </h1>
                <div className="date-badge">
                  {bonusType} - {monthNames[selectedMonth - 1]} {selectedYear}
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

                <div className="filter-row">
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
                    <label>Bonus Type:</label>
                    <select
                      value={bonusType}
                      onChange={(e) => setBonusType(e.target.value)}
                      className="filter-select"
                    >
                      {bonusTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Bonus %:</label>
                    <input
                      type="number"
                      value={bonusPercentage}
                      onChange={(e) =>
                        setBonusPercentage(Number(e.target.value))
                      }
                      className="filter-input"
                      min="0"
                      max="500"
                      step="10"
                    />
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    onClick={() => navigate("/salary-format")}
                    className="btn btn-back"
                  >
                    <FaArrowLeft /> Back
                  </button>

                  <button
                    onClick={calculateAllBonuses}
                    className="btn btn-calculate"
                    disabled={calculating}
                  >
                    <FaCalculator />
                    {calculating ? "Calculating..." : "Calculate"}
                  </button>

                  <button
                    className="btn btn-save"
                    onClick={saveData}
                    style={{
                      opacity: isDataSavedForMonth ? 0.6 : 1,
                      cursor: isDataSavedForMonth ? "not-allowed" : "pointer",
                      position: "relative",
                    }}
                    title={
                      isDataSavedForMonth
                        ? `Data already saved for ${bonusType} - ${monthNames[selectedMonth - 1]} ${selectedYear}`
                        : "Save bonus data"
                    }
                  >
                    <FaSave />
                    {isDataSavedForMonth ? "✓ Saved" : "Save Data"}
                  </button>

                  <button
                    onClick={() => navigate("/bonus-records")}
                    className="btn btn-records"
                  >
                    <FaCalendarAlt /> Records
                  </button>

                  <button
                    onClick={showAllCompanies}
                    className="btn btn-show-all"
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

          {/* BONUS STATUS SUMMARY */}
          <div className="bonus-status-summary">
            <div className="status-item">
              <span className="status-label">Total Employees:</span>
              <span className="status-value">{filteredEmployees.length}</span>
            </div>
            <div className="status-item" style={{ borderColor: "#10b981" }}>
              <span className="status-label">100% Eligible:</span>
              <span className="status-value" style={{ color: "#10b981" }}>
                {
                  filteredEmployees.filter((e) => {
                    const { months } = calculateServiceDuration(
                      e.joining_date,
                      new Date(selectedYear, selectedMonth - 1, 1),
                    );
                    return months >= 12;
                  }).length
                }
              </span>
            </div>
            <div className="status-item" style={{ borderColor: "#f59e0b" }}>
              <span className="status-label">75% Eligible:</span>
              <span className="status-value" style={{ color: "#f59e0b" }}>
                {
                  filteredEmployees.filter((e) => {
                    const { months } = calculateServiceDuration(
                      e.joining_date,
                      new Date(selectedYear, selectedMonth - 1, 1),
                    );
                    return months >= 10 && months <= 11;
                  }).length
                }
              </span>
            </div>
            <div className="status-item" style={{ borderColor: "#f97316" }}>
              <span className="status-label">50% Eligible:</span>
              <span className="status-value" style={{ color: "#f97316" }}>
                {
                  filteredEmployees.filter((e) => {
                    const { months } = calculateServiceDuration(
                      e.joining_date,
                      new Date(selectedYear, selectedMonth - 1, 1),
                    );
                    return months >= 6 && months <= 8;
                  }).length
                }
              </span>
            </div>
            <div className="status-item" style={{ borderColor: "#ef4444" }}>
              <span className="status-label">Not Eligible:</span>
              <span className="status-value" style={{ color: "#ef4444" }}>
                {
                  filteredEmployees.filter((e) => {
                    const { months } = calculateServiceDuration(
                      e.joining_date,
                      new Date(selectedYear, selectedMonth - 1, 1),
                    );
                    return months < 6;
                  }).length
                }
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Total Bonus:</span>
              <span className="status-value">
                {formatNumber(
                  filteredEmployees.reduce((sum, e) => {
                    const bonus = calculateBonus(e);
                    return sum + bonus.total_payable;
                  }, 0),
                )}
              </span>
            </div>
          </div>

          {/* CALCULATION STATUS */}
          {calculating && (
            <div className="calculation-status">
              <div className="spinner-small"></div>
              <span>Calculating bonuses... Please wait</span>
            </div>
          )}

          {/* COMPANY QUICK ACCESS */}
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

          {/* COMPANY SECTIONS */}
          {Object.keys(grouped).map((comp) => {
            const emps = grouped[comp];
            if (!openCompanies[comp]) return null;

            return (
              <div key={comp} className="company-section">
                <div className="company-header">
                  <div className="company-title">
                    <h2>{comp}</h2>
                    <h3>
                      {bonusType} Calculation - {monthNames[selectedMonth - 1]}{" "}
                      {selectedYear}
                    </h3>
                  </div>
                </div>

                <div className="table-scroll-container">
                  <div className="table-wrapper">
                    <table className="bonus-table">
                      <thead>
                        <tr>
                          <th>SL</th>
                          <th>Name</th>
                          <th>ID</th>
                          <th>Designation</th>
                          <th>DOJ</th>
                          <th>Service</th>
                          <th>Eligibility</th>
                          <th>Gross</th>
                          <th>Bonus Calc</th>
                          <th>Bonus Payable</th>
                          <th>Cash Salary</th>
                          <th>Cash Pay</th>
                          <th>Adjust</th>
                          <th>Total</th>
                          <th>Bank A/C</th>
                          <th>Branch</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emps.map((emp, idx) => {
                          const bonus = calculateBonus(emp);
                          const eligibility = getEligibilityInfo(
                            bonus.months_of_service,
                          );

                          return (
                            <tr key={emp.employee_id} className="data-row">
                              <td className="sl-number">{idx + 1}</td>
                              <td className="emp-name">{emp.name}</td>
                              <td className="emp-id">{emp.employee_id}</td>
                              <td className="emp-designation">
                                {emp.designation}
                              </td>
                              <td className="emp-doj">{emp.joining_date}</td>

                              <td className="service-duration">
                                <div className="service-badge">
                                  <FaClock />
                                  <span>{bonus.months_of_service} mo</span>
                                </div>
                                <small className="service-years">
                                  ({bonus.years_of_service.toFixed(1)} yrs)
                                </small>
                              </td>

                              <td className="eligibility-cell">
                                <div
                                  className="eligibility-badge"
                                  style={{
                                    backgroundColor: eligibility.bgColor,
                                    color: eligibility.color,
                                    borderColor: eligibility.borderColor,
                                  }}
                                >
                                  <span className="eligibility-icon">
                                    {eligibility.icon}
                                  </span>
                                  <span className="eligibility-text">
                                    {eligibility.percentage}%
                                  </span>
                                </div>
                                <small className="eligibility-label">
                                  {eligibility.shortLabel}
                                </small>
                              </td>

                              <td className="gross-salary">
                                {formatNumber(bonus.gross_salary)}
                              </td>

                              <td className="bonus-calc">
                                <div className="bonus-amount">
                                  {formatNumber(bonus.bonus_amount)}
                                </div>
                                <small className="bonus-percentage">
                                  ({bonus.bonus_percentage}%)
                                </small>
                              </td>

                              <td className="bonus-payable">
                                {formatNumber(bonus.bonus_payable)}
                              </td>

                              <td className="cash-salary">
                                {formatNumber(bonus.cash_salary)}
                              </td>

                              <td className="cash-payment">
                                <input
                                  type="number"
                                  value={
                                    getManual(emp.employee_id, "cashPayment") ||
                                    ""
                                  }
                                  placeholder="Cash Pay"
                                  onChange={(e) =>
                                    updateManual(
                                      emp.employee_id,
                                      "cashPayment",
                                      e.target.value,
                                    )
                                  }
                                  className="editable-input cash-input"
                                  min="0"
                                  step="100"
                                />
                              </td>

                              <td className="adjustment-cell">
                                <div className="adjustment-group">
                                  <input
                                    type="number"
                                    value={
                                      getManual(
                                        emp.employee_id,
                                        "manualAdjustment",
                                      ) || ""
                                    }
                                    placeholder="Adjust"
                                    onChange={(e) =>
                                      updateManual(
                                        emp.employee_id,
                                        "manualAdjustment",
                                        e.target.value,
                                      )
                                    }
                                    className="editable-input adjustment-input"
                                    min="-100000"
                                    step="100"
                                  />
                                  <input
                                    type="text"
                                    value={getManual(
                                      emp.employee_id,
                                      "adjustmentReason",
                                      "",
                                    )}
                                    placeholder="Reason"
                                    onChange={(e) =>
                                      updateManual(
                                        emp.employee_id,
                                        "adjustmentReason",
                                        e.target.value,
                                      )
                                    }
                                    className="editable-input reason-input"
                                    maxLength="50"
                                  />
                                </div>
                              </td>

                              <td className="total-payable">
                                {formatNumber(bonus.total_payable)}
                              </td>

                              <td className="bank-account">
                                {emp.bank_account || "N/A"}
                              </td>

                              <td className="branch-name">
                                {emp.branch_name || "N/A"}
                              </td>

                              <td className="remarks-cell">
                                <input
                                  type="text"
                                  value={getManual(
                                    emp.employee_id,
                                    "remarks",
                                    "",
                                  )}
                                  placeholder="Remarks"
                                  onChange={(e) =>
                                    updateManual(
                                      emp.employee_id,
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

                {/* Company Summary */}
                <div className="company-summary">
                  <h4>
                    <FaMoneyBillWave className="summary-icon" />
                    Company Summary - {comp}
                  </h4>
                  <div className="summary-stats-grid">
                    <div className="summary-stat-card">
                      <span className="stat-label">Total Employees:</span>
                      <span className="stat-value">{emps.length}</span>
                    </div>
                    <div className="summary-stat-card">
                      <span className="stat-label">100% Eligible:</span>
                      <span className="stat-value" style={{ color: "#10b981" }}>
                        {
                          emps.filter((e) => {
                            const { months } = calculateServiceDuration(
                              e.joining_date,
                              new Date(selectedYear, selectedMonth - 1, 1),
                            );
                            return months >= 12;
                          }).length
                        }
                      </span>
                    </div>
                    <div className="summary-stat-card">
                      <span className="stat-label">75% Eligible:</span>
                      <span className="stat-value" style={{ color: "#f59e0b" }}>
                        {
                          emps.filter((e) => {
                            const { months } = calculateServiceDuration(
                              e.joining_date,
                              new Date(selectedYear, selectedMonth - 1, 1),
                            );
                            return months >= 10 && months <= 11;
                          }).length
                        }
                      </span>
                    </div>
                    <div className="summary-stat-card">
                      <span className="stat-label">50% Eligible:</span>
                      <span className="stat-value" style={{ color: "#f97316" }}>
                        {
                          emps.filter((e) => {
                            const { months } = calculateServiceDuration(
                              e.joining_date,
                              new Date(selectedYear, selectedMonth - 1, 1),
                            );
                            return months >= 6 && months <= 8;
                          }).length
                        }
                      </span>
                    </div>
                    <div className="summary-stat-card">
                      <span className="stat-label">Total Bonus Payable:</span>
                      <span className="stat-value">
                        {formatNumber(
                          emps.reduce((sum, e) => {
                            const bonus = calculateBonus(e);
                            return sum + bonus.bonus_payable;
                          }, 0),
                        )}
                      </span>
                    </div>
                    <div className="summary-stat-card">
                      <span className="stat-label">Total Cash Salary:</span>
                      <span className="stat-value">
                        {formatNumber(
                          emps.reduce((sum, e) => {
                            return sum + (Number(e.salary_cash) || 0);
                          }, 0),
                        )}
                      </span>
                    </div>
                    <div className="summary-stat-card">
                      <span className="stat-label">Total Cash Payment:</span>
                      <span className="stat-value">
                        {formatNumber(
                          emps.reduce((sum, e) => {
                            return (
                              sum +
                              Number(
                                getManual(e.employee_id, "cashPayment") || 0,
                              )
                            );
                          }, 0),
                        )}
                      </span>
                    </div>
                    <div className="summary-stat-card highlight">
                      <span className="stat-label">Grand Total Payable:</span>
                      <span className="stat-value grand-total">
                        {formatNumber(
                          emps.reduce((sum, e) => {
                            const bonus = calculateBonus(e);
                            return sum + bonus.total_payable;
                          }, 0),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* SUMMARY SECTION - Only show when no companies are open */}
          {showSummary && filteredEmployees.length > 0 && (
            <div className="summary-section">
              <div className="summary-header">
                <h2>
                  <FaUsers className="section-icon" />
                  Summary Overview
                </h2>
              </div>

              <div className="summary-cards-grid">
                <div className="summary-card">
                  <div className="card-icon">
                    <FaBuilding />
                  </div>
                  <div className="card-content">
                    <div className="card-value">
                      {Object.keys(grouped).length}
                    </div>
                    <div className="card-label">Companies</div>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-icon">
                    <FaUsers />
                  </div>
                  <div className="card-content">
                    <div className="card-value">{filteredEmployees.length}</div>
                    <div className="card-label">Total Employees</div>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-icon">
                    <FaGift />
                  </div>
                  <div className="card-content">
                    <div className="card-value">
                      {formatNumber(
                        filteredEmployees.reduce((sum, e) => {
                          const bonus = calculateBonus(e);
                          return sum + bonus.bonus_payable;
                        }, 0),
                      )}
                    </div>
                    <div className="card-label">Total Bonus Payable</div>
                  </div>
                </div>

                <div className="summary-card highlight">
                  <div className="card-icon">
                    <FaMoneyBillWave />
                  </div>
                  <div className="card-content">
                    <div className="card-value grand-total">
                      {formatNumber(
                        filteredEmployees.reduce((sum, e) => {
                          const bonus = calculateBonus(e);
                          return sum + bonus.total_payable;
                        }, 0),
                      )}
                    </div>
                    <div className="card-label">Grand Total Payable</div>
                  </div>
                </div>
              </div>

              {/* Company Summary Table */}
              <div className="table-scroll-container summary-table-container">
                <div className="table-wrapper">
                  <table className="bonus-table summary-table">
                    <thead>
                      <tr>
                        <th>SL</th>
                        <th>Company</th>
                        <th>Employees</th>
                        <th>100%</th>
                        <th>75%</th>
                        <th>50%</th>
                        <th>Not Eligible</th>
                        <th>Bonus Payable</th>
                        <th>Cash Salary</th>
                        <th>Cash Pay</th>
                        <th>Adjustments</th>
                        <th>Total Payable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(grouped).map((comp, idx) => {
                        const emps = grouped[comp];

                        const eligible100 = emps.filter((e) => {
                          const { months } = calculateServiceDuration(
                            e.joining_date,
                            new Date(selectedYear, selectedMonth - 1, 1),
                          );
                          return months >= 12;
                        }).length;

                        const eligible75 = emps.filter((e) => {
                          const { months } = calculateServiceDuration(
                            e.joining_date,
                            new Date(selectedYear, selectedMonth - 1, 1),
                          );
                          return months >= 10 && months <= 11;
                        }).length;

                        const eligible50 = emps.filter((e) => {
                          const { months } = calculateServiceDuration(
                            e.joining_date,
                            new Date(selectedYear, selectedMonth - 1, 1),
                          );
                          return months >= 6 && months <= 8;
                        }).length;

                        const notEligible = emps.filter((e) => {
                          const { months } = calculateServiceDuration(
                            e.joining_date,
                            new Date(selectedYear, selectedMonth - 1, 1),
                          );
                          return months < 6;
                        }).length;

                        const bonusPayable = emps.reduce((sum, e) => {
                          const bonus = calculateBonus(e);
                          return sum + bonus.bonus_payable;
                        }, 0);

                        const cashSalary = emps.reduce((sum, e) => {
                          return sum + (Number(e.salary_cash) || 0);
                        }, 0);

                        const cashPay = emps.reduce((sum, e) => {
                          return (
                            sum +
                            Number(getManual(e.employee_id, "cashPayment") || 0)
                          );
                        }, 0);

                        const adjustments = emps.reduce((sum, e) => {
                          return (
                            sum +
                            Number(
                              getManual(e.employee_id, "manualAdjustment") || 0,
                            )
                          );
                        }, 0);

                        const totalPayable = emps.reduce((sum, e) => {
                          const bonus = calculateBonus(e);
                          return sum + bonus.total_payable;
                        }, 0);

                        return (
                          <tr key={idx} className="summary-row">
                            <td className="sl-number">{idx + 1}</td>
                            <td className="company-name">{comp}</td>
                            <td className="employee-count">{emps.length}</td>
                            <td className="eligible-100">{eligible100}</td>
                            <td className="eligible-75">{eligible75}</td>
                            <td className="eligible-50">{eligible50}</td>
                            <td className="not-eligible">{notEligible}</td>
                            <td className="bonus-payable">
                              {formatNumber(bonusPayable)}
                            </td>
                            <td className="cash-salary">
                              {formatNumber(cashSalary)}
                            </td>
                            <td className="cash-pay">
                              {formatNumber(cashPay)}
                            </td>
                            <td className="adjustments">
                              {formatNumber(adjustments)}
                            </td>
                            <td className="total-payable">
                              {formatNumber(totalPayable)}
                            </td>
                          </tr>
                        );
                      })}

                      {/* GRAND TOTAL ROW */}
                      <tr className="grand-total-row">
                        <td colSpan="2" className="grand-total-label">
                          GRAND TOTAL
                        </td>
                        <td className="grand-total-value">
                          {filteredEmployees.length}
                        </td>
                        <td className="grand-total-value">
                          {
                            filteredEmployees.filter((e) => {
                              const { months } = calculateServiceDuration(
                                e.joining_date,
                                new Date(selectedYear, selectedMonth - 1, 1),
                              );
                              return months >= 12;
                            }).length
                          }
                        </td>
                        <td className="grand-total-value">
                          {
                            filteredEmployees.filter((e) => {
                              const { months } = calculateServiceDuration(
                                e.joining_date,
                                new Date(selectedYear, selectedMonth - 1, 1),
                              );
                              return months >= 10 && months <= 11;
                            }).length
                          }
                        </td>
                        <td className="grand-total-value">
                          {
                            filteredEmployees.filter((e) => {
                              const { months } = calculateServiceDuration(
                                e.joining_date,
                                new Date(selectedYear, selectedMonth - 1, 1),
                              );
                              return months >= 6 && months <= 8;
                            }).length
                          }
                        </td>
                        <td className="grand-total-value">
                          {
                            filteredEmployees.filter((e) => {
                              const { months } = calculateServiceDuration(
                                e.joining_date,
                                new Date(selectedYear, selectedMonth - 1, 1),
                              );
                              return months < 6;
                            }).length
                          }
                        </td>
                        <td className="grand-total-value">
                          {formatNumber(
                            filteredEmployees.reduce((sum, e) => {
                              const bonus = calculateBonus(e);
                              return sum + bonus.bonus_payable;
                            }, 0),
                          )}
                        </td>
                        <td className="grand-total-value">
                          {formatNumber(
                            filteredEmployees.reduce((sum, e) => {
                              return sum + (Number(e.salary_cash) || 0);
                            }, 0),
                          )}
                        </td>
                        <td className="grand-total-value">
                          {formatNumber(
                            filteredEmployees.reduce((sum, e) => {
                              return (
                                sum +
                                Number(
                                  getManual(e.employee_id, "cashPayment") || 0,
                                )
                              );
                            }, 0),
                          )}
                        </td>
                        <td className="grand-total-value">
                          {formatNumber(
                            filteredEmployees.reduce((sum, e) => {
                              return (
                                sum +
                                Number(
                                  getManual(
                                    e.employee_id,
                                    "manualAdjustment",
                                  ) || 0,
                                )
                              );
                            }, 0),
                          )}
                        </td>
                        <td className="grand-total-value grand-total-final">
                          {formatNumber(
                            filteredEmployees.reduce((sum, e) => {
                              const bonus = calculateBonus(e);
                              return sum + bonus.total_payable;
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
        </div>
      </div>

      <style>{`
        .bonus-format-container {
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

        .filter-row {
          display: flex;
          gap: 0.8rem;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          min-width: 120px;
        }

        .filter-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
        }

        .filter-select, .filter-input {
          padding: 0.8rem;
          border: none;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.95);
          font-size: 0.9rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

        .btn-calculate {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .btn-calculate:hover {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
        }

        .btn-save {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .btn-save:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }

        .btn-reset {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          color: white;
        }

        .btn-reset:hover {
          background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
        }

        .btn-export-all {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }

        .btn-export-all:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }

        .btn-records {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .btn-records:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }

        .btn-show-all, .btn-hide-all {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .btn-show-all:hover, .btn-hide-all:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }

        /* BONUS STATUS SUMMARY */
        .bonus-status-summary {
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

        /* CALCULATION STATUS */
        .calculation-status {
          padding: 1rem 2.5rem;
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border-bottom: 1px solid #fde68a;
          display: flex;
          align-items: center;
          gap: 1rem;
          color: #92400e;
          font-weight: 600;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid #f59e0b;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
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
          background:rgba(139, 92, 246, 0.3);
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
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .btn-export-company:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(29, 78, 216, 0.3);
        }

        .btn-export-company:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* COMPANY SECTION */
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

        /* TABLE STYLES */
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
          min-width: 1800px;
          position: relative;
        }

        .bonus-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
          position: relative;
        }

        .bonus-table thead {
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .bonus-table thead tr {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .bonus-table th {
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

        /* SERVICE DURATION */
        .service-duration {
          text-align: center;
        }

        .service-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          color: #4b5563;
          font-weight: 600;
        }

        .service-badge svg { 
          color: #8b5cf6; 
        }

        .service-years {
          font-size: 0.7rem;
          color: #9ca3af;
          display: block;
        }

        /* ELIGIBILITY */
        .eligibility-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
          border: 2px solid;
          margin-bottom: 0.2rem;
        }

        .eligibility-label {
          font-size: 0.7rem;
          color: #6b7280;
          display: block;
        }

        /* EDITABLE INPUTS */
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

        .cash-input {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .adjustment-input {
          border-color: #f59e0b;
          background: #fffbeb;
          width: 70px;
        }

        .reason-input {
          border-color: #10b981;
          background: #ecfdf5;
          width: 100px;
        }

        .remarks-input {
          border-color: #8b5cf6;
          background: #faf5ff;
          width: 120px;
        }

        .adjustment-group {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          align-items: center;
        }

        /* COMPANY SUMMARY */
        .company-summary {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .company-summary h4 {
          margin: 0 0 1.5rem 0;
          color: #1e293b;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .summary-icon {
          color: #8b5cf6;
        }

        .summary-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .summary-stat-card {
          background: white;
          padding: 1rem;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }

        .summary-stat-card .stat-label {
          font-size: 0.8rem;
          color: #6b7280;
          display: block;
          margin-bottom: 0.3rem;
        }

        .summary-stat-card .stat-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .summary-stat-card.highlight {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-color: #f59e0b;
        }

        .summary-stat-card.highlight .stat-value {
          color: #92400e;
        }

        .grand-total {
          font-size: 1.3rem !important;
          color: #8b5cf6 !important;
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

        .summary-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: white;
          padding: 1.5rem;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .summary-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.15);
          border-color: #8b5cf6;
        }

        .summary-card.highlight {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-color: #f59e0b;
        }

        .card-icon {
          font-size: 2.5rem;
          color: #8b5cf6;
        }

        .card-content {
          flex: 1;
        }

        .card-value {
          font-size: 1.8rem;
          font-weight: 800;
          color: #1f2937;
          line-height: 1.2;
        }

        .card-label {
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 600;
        }

        .summary-table-container {
          margin-top: 2rem;
        }

        .summary-table {
          min-width: 1400px;
        }

        .summary-row {
          background: white;
        }

        .summary-row:hover {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        }

        .grand-total-row {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
          color: white;
          font-weight: 700;
        }

        .grand-total-row td {
          color: white !important;
          border-bottom: none;
          padding: 1rem 0.8rem;
        }

        .grand-total-label {
          font-size: 1.1rem;
          font-weight: 800;
          text-align: left;
          padding-left: 1.5rem !important;
        }

        .grand-total-value {
          font-weight: 700;
          text-align: center;
        }

        .grand-total-final {
          font-size: 1.2rem;
          font-weight: 800;
        }

        /* BEAUTIFUL COLOR CODING */
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
        
        .gross-salary {
          color: #1e3a8a;
          font-weight: 800;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          padding: 0.8rem 0.5rem;
          border-radius: 12px;
          border: 2px solid #93c5fd;
        }
        
        .bonus-payable {
          color: #059669;
          font-weight: 700;
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          padding: 0.5rem;
          border-radius: 8px;
          border: 2px solid #34d399;
        }
        
        .cash-salary {
          color: #8b5cf6;
          font-weight: 700;
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          padding: 0.5rem;
          border-radius: 8px;
          border: 2px solid #c084fc;
        }
        
        .total-payable {
          color: #1e3a8a;
          font-weight: 800;
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          padding: 0.8rem 0.5rem;
          border-radius: 12px;
          border: 2px solid #a5b4fc;
        }
        
        .bank-account, .branch-name {
          color: #6b7280;
          font-size: 0.8rem;
        }

        .eligible-100 { color: #10b981; font-weight: 600; }
        .eligible-75 { color: #f59e0b; font-weight: 600; }
        .eligible-50 { color: #f97316; font-weight: 600; }
        .not-eligible { color: #ef4444; font-weight: 600; }
        .cash-pay { color: #3b82f6; font-weight: 600; }
        .adjustments { color: #f97316; font-weight: 600; }

        /* LOADER */
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
          .bonus-format-container {
            padding: 0.5rem;
          }

          .header-main {
            flex-direction: column;
          }

          .controls-section {
            width: 100%;
          }

          .filter-row {
            flex-direction: column;
          }

          .filter-group {
            width: 100%;
          }

          .action-buttons {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .btn {
            flex: 1;
            justify-content: center;
            min-width: 100px;
            padding: 0.8rem 1rem;
            font-size: 0.8rem;
          }

          .company-buttons-grid {
            grid-template-columns: 1fr;
          }

          .company-section {
            padding: 1.5rem;
          }

          .company-title h2 {
            font-size: 1.5rem;
          }

          .company-title h3 {
            font-size: 1rem;
          }

          .bonus-status-summary {
            flex-direction: column;
            padding: 1rem;
          }

          .status-item {
            width: 100%;
          }

          .summary-stats-grid {
            grid-template-columns: 1fr;
          }

          .summary-cards-grid {
            grid-template-columns: 1fr;
          }

          .table-wrapper {
            min-width: 1400px;
          }
        }

        @media (max-width: 480px) {
          .header-section {
            padding: 1.5rem;
          }

          .main-title {
            font-size: 2rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }

          .company-toggle-btn {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BonusFormat;
