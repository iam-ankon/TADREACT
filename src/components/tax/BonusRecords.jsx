// src/pages/finance/BonusRecords.jsx - UPDATED WITH GENERATE EXCEL AND EXPORT SHEET BUTTONS
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
  FaSync,
  FaFileExcel,
  FaGift,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaPercent,
  FaEdit,
  FaFileAlt,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { financeAPI } from "../../api/finance";

// Helper functions
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

const formatDecimal = (num) => {
  const safeNum = toNumber(num);
  return safeNum.toFixed(2);
};

const getEligibilityBadge = (status, percentage) => {
  if (status === "full" || percentage >= 100) {
    return {
      bg: "#d1fae5",
      color: "#10b981",
      text: `${percentage}%`,
      label: "100% Eligible",
      icon: "✅",
    };
  } else if (status === "seventy_five" || percentage >= 75) {
    return {
      bg: "#fef3c7",
      color: "#f59e0b",
      text: `${percentage}%`,
      label: "75% Eligible",
      icon: "👍",
    };
  } else if (status === "fifty" || percentage >= 50) {
    return {
      bg: "#ffedd5",
      color: "#f97316",
      text: `${percentage}%`,
      label: "50% Eligible",
      icon: "⚠️",
    };
  } else {
    return {
      bg: "#fee2e2",
      color: "#ef4444",
      text: `${percentage}%`,
      label: "Not Eligible",
      icon: "❌",
    };
  }
};

const BonusRecords = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedBonusType, setSelectedBonusType] = useState("All");
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [openCompanies, setOpenCompanies] = useState({});
  const [error, setError] = useState(null);
  const [generatingExcel, setGeneratingExcel] = useState({});
  const [generatingBonusSheet, setGeneratingBonusSheet] = useState({});
  const [editableData, setEditableData] = useState({});

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
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  const bonusTypes = [
    "All",
    "Eid Bonus",
    "Performance Bonus",
    "Festival Bonus",
    "Annual Bonus",
    "Special Bonus",
    "Incentive",
  ];

  // Group records by company
  const grouped = useMemo(() => {
    return filteredRecords.reduce((acc, record) => {
      const company = record.company_name || "Unknown Company";
      if (!acc[company]) acc[company] = [];
      acc[company].push(record);
      return acc;
    }, {});
  }, [filteredRecords]);

  // Get unique companies for filter
  const companies = useMemo(() => {
    const comps = [
      "All",
      ...new Set(records.map((r) => r.company_name).filter(Boolean)),
    ];
    return comps;
  }, [records]);

  // Fetch bonus records
  const fetchBonusRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        year: selectedYear,
        month: selectedMonth,
      };

      if (selectedBonusType !== "All") {
        params.bonus_type = selectedBonusType;
      }

      if (selectedCompany !== "All") {
        params.company_name = selectedCompany;
      }

      console.log(
        `🔄 Fetching bonus records for ${selectedMonth}/${selectedYear}...`,
        params,
      );

      const response = await financeAPI.bonus.getAll(params);

      console.log("📊 API Response:", response);

      let records = [];

      if (response.data) {
        if (response.data.success) {
          records = response.data.data || [];
        } else if (Array.isArray(response.data)) {
          records = response.data;
        } else {
          records = response.data.records || response.data.results || [];
        }
      }

      console.log(`✅ Loaded ${records.length} bonus records from database`);

      // Initialize editable data with actual values from backend
      const initialEditableData = {};
      records.forEach((record) => {
        if (record.employee_id) {
          initialEditableData[record.employee_id] = {
            cash_payment: record.cash_payment || "",
            manual_adjustment: record.manual_adjustment || "",
            adjustment_reason: record.adjustment_reason || "",
            remarks: record.remarks || "",
          };
        }
      });

      setEditableData(initialEditableData);
      setRecords(records);
      setFilteredRecords(records);
    } catch (error) {
      console.error("❌ Failed to fetch bonus records:", error);

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

      setRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBonusRecords();
  }, [selectedYear, selectedMonth, selectedBonusType, selectedCompany]);

  // Filter by search
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredRecords(records);
    } else {
      const filtered = records.filter(
        (record) =>
          record.name?.toLowerCase().includes(term) ||
          record.employee_id?.toLowerCase().includes(term) ||
          record.designation?.toLowerCase().includes(term) ||
          record.company_name?.toLowerCase().includes(term),
      );
      setFilteredRecords(filtered);
    }
  }, [searchTerm, records]);

  // Update editable field
  const updateEditableField = (employeeId, field, value) => {
    setEditableData((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value,
      },
    }));
  };

  // Get editable value
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

  // Calculate derived values
  const calculateDerivedValues = (record) => {
    const employeeId = record.employee_id;
    const editable = editableData[employeeId] || {};

    const cashPayment = toNumber(editable.cash_payment || record.cash_payment);
    const manualAdjustment = toNumber(
      editable.manual_adjustment || record.manual_adjustment,
    );
    const bonusPayable = toNumber(record.bonus_payable);
    const cashSalary = toNumber(record.cash_salary);

    const totalPayable =
      bonusPayable + cashPayment + cashSalary + manualAdjustment;

    return {
      cashPayment,
      manualAdjustment,
      totalPayable,
      bonusPayable,
      cashSalary,
      grossSalary: toNumber(record.gross_salary),
      monthsOfService: record.months_of_service || 0,
      eligibilityPercentage: record.eligibility_percentage || 0,
    };
  };

  // Save updated data
  const saveData = async () => {
    const payload = filteredRecords
      .map((record, idx) => {
        const empId = record.employee_id?.trim();
        if (!empId) return null;

        const calculated = calculateDerivedValues(record);
        const editable = editableData[empId] || {};

        return {
          sl: idx + 1,
          name: record.name?.trim() || "Unknown",
          employee_id: empId,
          designation: record.designation?.trim() || "",
          doj: record.doj,
          bank_account: record.bank_account || "",
          branch_name: record.branch_name || "",
          company_name: record.company_name || "Unknown Company",

          basic: toNumber(record.basic),
          house_rent: toNumber(record.house_rent),
          medical: toNumber(record.medical),
          conveyance: toNumber(record.conveyance),
          gross_salary: toNumber(record.gross_salary),

          months_of_service: record.months_of_service || 0,
          years_of_service: record.years_of_service || 0,
          eligibility_status: record.eligibility_status || "none",
          eligibility_percentage: record.eligibility_percentage || 0,

          bonus_percentage: record.bonus_percentage || 100,
          bonus_amount: toNumber(record.bonus_amount),
          bonus_payable: toNumber(record.bonus_payable),

          cash_payment: calculated.cashPayment,
          cash_salary: toNumber(record.cash_salary),
          manual_adjustment: calculated.manualAdjustment,
          adjustment_reason:
            editable.adjustment_reason || record.adjustment_reason || "",

          total_payable: calculated.totalPayable,
          remarks: editable.remarks || record.remarks || "",

          month: record.month || selectedMonth,
          year: record.year || selectedYear,
          bonus_type: record.bonus_type || selectedBonusType,
        };
      })
      .filter(Boolean);

    console.log("Saving bonus records to backend:", payload.length, "rows");

    try {
      const res = await financeAPI.bonus.saveBonus(payload);
      const saved = res.data.saved || 0;
      const errors = res.data.errors || [];

      if (errors.length > 0) {
        console.warn("Save errors:", errors);
        alert(
          `Warning: Saved ${saved}, but ${errors.length} failed. Check console.`,
        );
      } else {
        alert(`Success: All ${saved} bonus records saved!`);
        fetchBonusRecords();
      }
    } catch (e) {
      console.error("Save failed:", e.response?.data || e);
      alert("Save failed – check console");
    }
  };

  // Toggle company sections
  const toggleCompany = (comp) => {
    setOpenCompanies((prev) => ({ ...prev, [comp]: !prev[comp] }));
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

  const generateBonusSheetForCompany = async (companyName) => {
    try {
      setGeneratingBonusSheet((prev) => ({ ...prev, [companyName]: true }));
      console.log(`📊 Generating Bonus Sheet for ${companyName}...`);

      // Get current bonus type from filter or records
      const companyRecords = grouped[companyName] || [];
      const bonusType =
        companyRecords.length > 0
          ? companyRecords[0].bonus_type || selectedBonusType
          : selectedBonusType;

      // Call backend API to generate the bonus sheet
      const response = await financeAPI.bonus.generateBonusSheetExcel({
        company_name: companyName,
        month: selectedMonth,
        year: selectedYear,
        bonus_type: bonusType !== "All" ? bonusType : "Eid Bonus",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${companyName.replace(/\s+/g, "_")}_Bonus_Sheet_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(
        `✅ Bonus Sheet generated and downloaded for ${companyName}!`,
      );
      alert(`Bonus Sheet generated successfully for ${companyName}!`);
    } catch (error) {
      console.error("❌ Error generating Bonus Sheet:", error);

      let errorMessage = "Failed to generate Bonus Sheet.";
      if (error.response) {
        if (error.response.data) {
          try {
            const errorText = await error.response.data.text();
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorMessage;
            } catch {
              errorMessage = errorText;
            }
          } catch (e) {
            errorMessage = error.response.statusText || errorMessage;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`❌ Failed to generate Bonus Sheet. Error: ${errorMessage}`);

      // Fallback to frontend generation if backend fails
      const useFallback = window.confirm(
        "Backend generation failed. Would you like to use frontend generation as fallback?",
      );

      if (useFallback) {
        await generateBonusSheetFallback(companyName);
      }
    } finally {
      setGeneratingBonusSheet((prev) => ({ ...prev, [companyName]: false }));
    }
  };

  const generateAllCompaniesBonusExcel = async () => {
    if (Object.keys(grouped).length === 0) {
      alert("No company data to export");
      return;
    }

    try {
      setGeneratingExcel((prev) => ({ ...prev, all_companies: true }));
      console.log(`📊 Generating ALL COMPANIES Bonus Excel via backend...`);

      const response = await financeAPI.bonus.generateAllCompaniesBonusExcel({
        month: selectedMonth,
        year: selectedYear,
        bonus_type: selectedBonusType !== "All" ? selectedBonusType : "All",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Get filename from Content-Disposition header or create one
      const contentDisposition = response.headers["content-disposition"];
      let filename = `ALL_COMPANIES_BONUS_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ All Companies Bonus Excel generated and downloaded!`);
      alert(`All Companies Bonus Excel generated successfully!`);
    } catch (error) {
      console.error("❌ Error generating All Companies Bonus Excel:", error);

      let errorMessage = "Failed to generate All Companies Bonus Excel.";
      if (error.response) {
        if (error.response.data) {
          try {
            const errorText = await error.response.data.text();
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorMessage;
            } catch {
              errorMessage = errorText;
            }
          } catch (e) {
            errorMessage = error.response.statusText || errorMessage;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(
        `❌ Failed to generate All Companies Bonus Excel. Error: ${errorMessage}`,
      );

      // Fallback to frontend export
      const useFallback = window.confirm(
        "Backend generation failed. Would you like to use frontend export as fallback?",
      );

      if (useFallback) {
        await exportToExcel(); // Your existing frontend export function
      }
    } finally {
      setGeneratingExcel((prev) => ({ ...prev, all_companies: false }));
    }
  };

  // Generate All Companies Bonus Sheet (single file with multiple sheets)
  const generateAllCompaniesBonusSheet = async () => {
    if (Object.keys(grouped).length === 0) {
      alert("No company data to export");
      return;
    }

    try {
      setGeneratingBonusSheet((prev) => ({ ...prev, all_companies: true }));
      console.log(`📊 Generating ALL COMPANIES Bonus Sheet...`);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add each company as a separate sheet
      Object.keys(grouped).forEach((companyName, companyIdx) => {
        const companyRecords = grouped[companyName];

        // Add title rows
        const titleData = [
          [`${companyName.toUpperCase()} - BONUS SHEET`],
          [`Month: ${monthNames[selectedMonth - 1]} ${selectedYear}`],
          [`Total Employees: ${companyRecords.length}`],
          [""],
        ];

        // Prepare data
        const data = companyRecords.map((record, idx) => {
          const badge = getEligibilityBadge(
            record.eligibility_status,
            record.eligibility_percentage,
          );
          const calculated = calculateDerivedValues(record);

          return {
            SL: idx + 1,
            Name: record.name,
            ID: record.employee_id,
            Designation: record.designation,
            DOJ: record.doj,
            "Service (Months)": record.months_of_service,
            "Eligibility %": `${record.eligibility_percentage}%`,
            "Bonus Type": record.bonus_type,
            "Gross Salary": formatDecimal(record.gross_salary),
            "Bonus Payable": formatDecimal(record.bonus_payable),
            "Cash Payment": formatDecimal(calculated.cashPayment),
            "Manual Adj": formatDecimal(calculated.manualAdjustment),
            "Total Payable": formatDecimal(calculated.totalPayable),
            Remarks: record.remarks || "",
          };
        });

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet([]);

        // Add title rows
        XLSX.utils.sheet_add_aoa(ws, titleData, { origin: "A1" });

        // Add data
        XLSX.utils.sheet_add_json(ws, data, {
          origin: "A5",
          skipHeader: false,
        });

        // Set column widths
        const colWidths = [
          { wch: 5 }, // SL
          { wch: 25 }, // Name
          { wch: 15 }, // ID
          { wch: 25 }, // Designation
          { wch: 12 }, // DOJ
          { wch: 12 }, // Service
          { wch: 10 }, // Eligibility
          { wch: 15 }, // Bonus Type
          { wch: 12 }, // Gross
          { wch: 12 }, // Bonus Payable
          { wch: 12 }, // Cash Payment
          { wch: 12 }, // Manual Adj
          { wch: 14 }, // Total Payable
          { wch: 25 }, // Remarks
        ];
        ws["!cols"] = colWidths;

        // Add worksheet to workbook
        let sheetName = companyName.substring(0, 31);
        if (wb.SheetNames.includes(sheetName)) {
          sheetName = `${companyName.substring(0, 28)}_${companyIdx + 1}`;
        }

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      // Add SUMMARY sheet
      const summaryHeaders = [
        "SL",
        "Company",
        "Employees",
        "Bonus Payable",
        "Cash Payment",
        "Manual Adj",
        "Total Payable",
      ];
      const summaryRows = Object.keys(grouped).map((companyName, idx) => {
        const records = grouped[companyName];
        const totals = records.reduce(
          (acc, record) => {
            const calculated = calculateDerivedValues(record);
            return {
              bonusPayable: acc.bonusPayable + toNumber(record.bonus_payable),
              cashPayment: acc.cashPayment + calculated.cashPayment,
              manualAdj: acc.manualAdj + calculated.manualAdjustment,
              totalPayable: acc.totalPayable + calculated.totalPayable,
            };
          },
          { bonusPayable: 0, cashPayment: 0, manualAdj: 0, totalPayable: 0 },
        );

        return [
          idx + 1,
          companyName,
          records.length,
          formatDecimal(totals.bonusPayable),
          formatDecimal(totals.cashPayment),
          formatDecimal(totals.manualAdj),
          formatDecimal(totals.totalPayable),
        ];
      });

      const summaryWs = XLSX.utils.aoa_to_sheet([
        ["ALL COMPANIES - BONUS SUMMARY"],
        [`Month: ${monthNames[selectedMonth - 1]} ${selectedYear}`],
        [""],
        summaryHeaders,
        ...summaryRows,
      ]);

      const summaryColWidths = [
        { wch: 5 }, // SL
        { wch: 30 }, // Company
        { wch: 10 }, // Employees
        { wch: 15 }, // Bonus Payable
        { wch: 15 }, // Cash Payment
        { wch: 15 }, // Manual Adj
        { wch: 15 }, // Total Payable
      ];
      summaryWs["!cols"] = summaryColWidths;

      XLSX.utils.book_append_sheet(wb, summaryWs, "SUMMARY");

      // Generate filename
      const fileName = `ALL_COMPANIES_BONUS_SHEET_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`;

      // Save file
      XLSX.writeFile(wb, fileName);

      console.log(`✅ All Companies Bonus Sheet generated and downloaded!`);
      alert(`All Companies Bonus Sheet generated successfully!`);
    } catch (error) {
      console.error("❌ Error generating All Companies Bonus Sheet:", error);
      alert(
        `❌ Failed to generate All Companies Bonus Sheet. Error: ${error.message}`,
      );
    } finally {
      setGeneratingBonusSheet((prev) => ({ ...prev, all_companies: false }));
    }
  };

  // Generate Bonus Bank Transfer Excel (similar to salary bank transfer)
  const generateBonusBankTransferExcel = async (companyName) => {
    try {
      setGeneratingExcel((prev) => ({
        ...prev,
        [`bank_${companyName}`]: true,
      }));
      console.log(
        `🏦 Generating Bonus Bank Transfer Excel for ${companyName}...`,
      );

      // Get current bonus type from filter or records
      const companyRecords = grouped[companyName] || [];
      const bonusType =
        companyRecords.length > 0
          ? companyRecords[0].bonus_type || selectedBonusType
          : selectedBonusType;

      const response = await financeAPI.bonus.generateBonusBankTransferExcel({
        company_name: companyName,
        month: selectedMonth,
        year: selectedYear,
        bonus_type: bonusType !== "All" ? bonusType : "Eid Bonus",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${companyName.replace(/\s+/g, "_")}_Bonus_Bank_Transfer_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(
        `✅ Bonus Bank Transfer Excel generated and downloaded for ${companyName}!`,
      );
      alert(
        `Bonus Bank Transfer Excel generated successfully for ${companyName}!`,
      );
    } catch (error) {
      console.error("❌ Error generating Bonus Bank Transfer Excel:", error);

      let errorMessage = "Failed to generate Bonus Bank Transfer Excel.";
      if (error.response) {
        if (error.response.data) {
          try {
            const errorText = await error.response.data.text();
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorMessage;
            } catch {
              errorMessage = errorText;
            }
          } catch (e) {
            errorMessage = error.response.statusText || errorMessage;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(
        `❌ Failed to generate Bonus Bank Transfer Excel. Error: ${errorMessage}`,
      );
    } finally {
      setGeneratingExcel((prev) => ({
        ...prev,
        [`bank_${companyName}`]: false,
      }));
    }
  };

  if (loading) {
    return (
      <div className="center-screen">
        <div className="fullscreen-loader">
          <div className="spinner" />
          <p>Loading Bonus Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bonus-records-container">
      <div className="dashboard">
        <div className="card">
          {/* HEADER SECTION */}
          <div className="header-section">
            <div className="header-main">
              <div className="title-section">
                <h1 className="main-title">
                  <FaGift className="title-icon" />
                  Bonus Records History
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
                    placeholder="Search employees by name, ID, or company..."
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

                  <div className="filter-group">
                    <select
                      value={selectedBonusType}
                      onChange={(e) => setSelectedBonusType(e.target.value)}
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
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="filter-select"
                    >
                      {companies.map((comp) => (
                        <option key={comp} value={comp}>
                          {comp}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    onClick={() => navigate("/bonus-format")}
                    className="btn btn-back"
                  >
                    <FaArrowLeft /> Back to Bonus Format
                  </button>

                  <button
                    className="btn btn-save"
                    onClick={saveData}
                    disabled={filteredRecords.length === 0}
                  >
                    <FaSave /> Save Updates
                  </button>

                  <button
                    onClick={fetchBonusRecords}
                    className="btn btn-refresh"
                  >
                    <FaSync /> Refresh
                  </button>

                  <button
                    onClick={generateAllCompaniesBonusExcel}
                    className="btn btn-export-all"
                    disabled={
                      generatingExcel.all_companies ||
                      Object.keys(grouped).length === 0
                    }
                  >
                    <FaFileExcel />
                    {generatingExcel.all_companies
                      ? "Generating..."
                      : "Export All Companies"}
                  </button>

                  {/* <button
                    onClick={generateAllCompaniesBonusSheet}
                    className="btn btn-all-sheets"
                    disabled={
                      Object.keys(grouped).length === 0 ||
                      generatingBonusSheet.all_companies
                    }
                  >
                    <FaFileAlt />
                    {generatingBonusSheet.all_companies
                      ? "Generating..."
                      : "All Bonus Sheets"}
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

          {/* SUMMARY STATS */}
          <div className="summary-stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{records.length}</div>
                <div className="stat-label">Total Records</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">
                  {formatNumber(
                    records.reduce(
                      (sum, r) => sum + toNumber(r.bonus_payable),
                      0,
                    ),
                  )}
                </div>
                <div className="stat-label">Total Bonus</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <div className="stat-value">
                  {formatNumber(
                    records.reduce(
                      (sum, r) => sum + toNumber(r.total_payable),
                      0,
                    ),
                  )}
                </div>
                <div className="stat-label">Total Payable</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">
                  {records.filter((r) => r.is_approved).length}
                </div>
                <div className="stat-label">Approved</div>
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
              <button onClick={fetchBonusRecords} className="btn">
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

                    {/* <div className="company-action-buttons">
                      <button
                        onClick={() => generateExcelForCompany(comp)}
                        className="btn-export-company"
                        disabled={generatingExcel[comp]}
                        title={`Generate Excel for ${comp}`}
                      >
                        <FaFileExcel />
                      </button>

                      <button
                        onClick={() => generateBonusSheetForCompany(comp)}
                        className="btn-export-sheet"
                        disabled={generatingBonusSheet[comp]}
                        title={`Generate Bonus Sheet for ${comp}`}
                      >
                        <FaFileAlt />
                      </button>
                    </div> */}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMPANY SECTIONS */}
          {Object.keys(grouped).map((comp) => {
            const companyRecords = grouped[comp];
            if (!openCompanies[comp]) return null;

            // Company totals
            const companyTotals = companyRecords.reduce(
              (acc, record) => {
                const calculated = calculateDerivedValues(record);
                return {
                  bonusPayable:
                    acc.bonusPayable + toNumber(record.bonus_payable),
                  cashPayment: acc.cashPayment + calculated.cashPayment,
                  manualAdjustment:
                    acc.manualAdjustment + calculated.manualAdjustment,
                  totalPayable: acc.totalPayable + calculated.totalPayable,
                };
              },
              {
                bonusPayable: 0,
                cashPayment: 0,
                manualAdjustment: 0,
                totalPayable: 0,
              },
            );

            return (
              <div key={comp} className="company-section">
                <div className="company-header">
                  <div className="company-title">
                    <h2>{comp}</h2>
                    <h3>
                      Bonus Records for {monthNames[selectedMonth - 1]}{" "}
                      {selectedYear}
                      <span className="record-count">
                        {" "}
                        ({companyRecords.length} employees)
                      </span>
                    </h3>
                  </div>

                  <div className="company-action-buttons-header">
                    <button
                      onClick={() => generateBonusBankTransferExcel(comp)}
                      className="btn btn-generate-excel"
                      disabled={generatingExcel[comp]}
                    >
                      <FaFileExcel />
                      {generatingExcel[comp]
                        ? "Generating..."
                        : "Generate Excel"}
                    </button>

                    <button
                      onClick={() => generateBonusSheetForCompany(comp)}
                      className="btn btn-export-sheet-header"
                      disabled={generatingBonusSheet[comp]}
                    >
                      <FaFileAlt />
                      {generatingBonusSheet[comp]
                        ? "Generating..."
                        : `Export ${comp} Sheet`}
                    </button>
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
                          <th>Bonus Type</th>
                          <th>Gross</th>
                          <th>Bonus Payable</th>
                          <th>Cash Salary</th>
                          <th>Cash Payment</th>
                          <th>Adjustment</th>
                          <th>Total</th>
                          <th>Bank A/C</th>
                          <th>Remarks</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyRecords.map((record, idx) => {
                          const badge = getEligibilityBadge(
                            record.eligibility_status,
                            record.eligibility_percentage,
                          );
                          const calculated = calculateDerivedValues(record);

                          return (
                            <tr key={record.id || idx} className="data-row">
                              <td className="sl-number">{idx + 1}</td>
                              <td className="emp-name">{record.name}</td>
                              <td className="emp-id">{record.employee_id}</td>
                              <td className="emp-designation">
                                {record.designation}
                              </td>
                              <td className="emp-doj">{record.doj}</td>

                              <td className="service-duration">
                                <div className="service-badge">
                                  <FaClock />
                                  <span>{record.months_of_service} mo</span>
                                </div>
                                <small className="service-years">
                                  ({formatDecimal(record.years_of_service)} yrs)
                                </small>
                              </td>

                              <td className="eligibility-cell">
                                <div
                                  className="eligibility-badge"
                                  style={{
                                    backgroundColor: badge.bg,
                                    color: badge.color,
                                  }}
                                >
                                  <span className="eligibility-icon">
                                    {badge.icon}
                                  </span>
                                  <span className="eligibility-text">
                                    {badge.text}
                                  </span>
                                </div>
                              </td>

                              <td className="bonus-type">
                                <span className="bonus-type-badge">
                                  {record.bonus_type}
                                </span>
                              </td>

                              <td className="gross-salary">
                                {formatNumber(record.gross_salary)}
                              </td>
                              <td className="bonus-payable">
                                {formatNumber(record.bonus_payable)}
                              </td>
                              <td className="cash-salary">
                                {formatNumber(record.cash_salary)}
                              </td>

                              {/* EDITABLE: Cash Payment */}
                              <td className="cash-payment">
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
                                  step="100"
                                />
                              </td>

                              {/* EDITABLE: Manual Adjustment */}
                              <td className="adjustment-cell">
                                <div className="adjustment-group">
                                  <input
                                    type="number"
                                    value={getEditableValue(
                                      record,
                                      "manual_adjustment",
                                    )}
                                    placeholder="Adjust"
                                    onChange={(e) =>
                                      updateEditableField(
                                        record.employee_id,
                                        "manual_adjustment",
                                        e.target.value,
                                      )
                                    }
                                    className="editable-input adjustment-input"
                                    min="-100000"
                                    step="100"
                                  />
                                  <input
                                    type="text"
                                    value={getEditableValue(
                                      record,
                                      "adjustment_reason",
                                    )}
                                    placeholder="Reason"
                                    onChange={(e) =>
                                      updateEditableField(
                                        record.employee_id,
                                        "adjustment_reason",
                                        e.target.value,
                                      )
                                    }
                                    className="editable-input reason-input"
                                    maxLength="50"
                                  />
                                </div>
                              </td>

                              <td className="total-payable">
                                {formatNumber(calculated.totalPayable)}
                              </td>

                              <td className="bank-account">
                                {record.bank_account || "N/A"}
                              </td>

                              {/* EDITABLE: Remarks */}
                              <td className="remarks-cell">
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

                              <td className="status-cell">
                                {record.is_approved ? (
                                  <span className="status-badge approved">
                                    <FaCheckCircle /> Approved
                                  </span>
                                ) : (
                                  <span className="status-badge pending">
                                    <FaTimesCircle /> Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Company Summary */}
                <div className="bonus-summary-note">
                  <h4>📊 Company Summary - {comp}</h4>
                  <div className="summary-stats">
                    <div className="summary-stat">
                      <span className="stat-label">Total Employees:</span>
                      <span className="stat-value">
                        {companyRecords.length}
                      </span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Total Bonus Payable:</span>
                      <span className="stat-value">
                        {formatNumber(companyTotals.bonusPayable)}
                      </span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Total Cash Payment:</span>
                      <span className="stat-value">
                        {formatNumber(companyTotals.cashPayment)}
                      </span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Total Adjustments:</span>
                      <span className="stat-value">
                        {formatNumber(companyTotals.manualAdjustment)}
                      </span>
                    </div>
                    <div className="summary-stat highlight">
                      <span className="stat-label">Grand Total Payable:</span>
                      <span className="stat-value grand-total">
                        {formatNumber(companyTotals.totalPayable)}
                      </span>
                    </div>
                  </div>
                </div>
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
                      <div className="card-value">{filteredRecords.length}</div>
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
                          filteredRecords.reduce(
                            (sum, r) => sum + toNumber(r.bonus_payable),
                            0,
                          ),
                        )}
                      </div>
                      <div className="card-label">Total Bonus Payable</div>
                    </div>
                  </div>

                  <div className="summary-card highlight">
                    <div className="card-icon">
                      <FaGift />
                    </div>
                    <div className="card-content">
                      <div className="card-value grand-total">
                        {formatNumber(
                          filteredRecords.reduce(
                            (sum, r) => sum + toNumber(r.total_payable),
                            0,
                          ),
                        )}
                      </div>
                      <div className="card-label">Grand Total Payable</div>
                    </div>
                  </div>
                </div>

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
                          <th>Cash Pay</th>
                          <th>Adjustments</th>
                          <th>Total Payable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(grouped).map((comp, idx) => {
                          const records = grouped[comp];

                          const eligible100 = records.filter(
                            (r) => r.eligibility_percentage >= 100,
                          ).length;
                          const eligible75 = records.filter(
                            (r) =>
                              r.eligibility_percentage >= 75 &&
                              r.eligibility_percentage < 100,
                          ).length;
                          const eligible50 = records.filter(
                            (r) =>
                              r.eligibility_percentage >= 50 &&
                              r.eligibility_percentage < 75,
                          ).length;
                          const notEligible = records.filter(
                            (r) => r.eligibility_percentage < 50,
                          ).length;

                          const bonusPayable = records.reduce(
                            (sum, r) => sum + toNumber(r.bonus_payable),
                            0,
                          );
                          const cashPay = records.reduce(
                            (sum, r) => sum + toNumber(r.cash_payment),
                            0,
                          );
                          const adjustments = records.reduce(
                            (sum, r) => sum + toNumber(r.manual_adjustment),
                            0,
                          );
                          const totalPayable = records.reduce(
                            (sum, r) => sum + toNumber(r.total_payable),
                            0,
                          );

                          return (
                            <tr key={idx} className="summary-row">
                              <td className="sl-number">{idx + 1}</td>
                              <td className="company-name">{comp}</td>
                              <td className="employee-count">
                                {records.length}
                              </td>
                              <td className="eligible-100">{eligible100}</td>
                              <td className="eligible-75">{eligible75}</td>
                              <td className="eligible-50">{eligible50}</td>
                              <td className="not-eligible">{notEligible}</td>
                              <td className="bonus-payable">
                                {formatNumber(bonusPayable)}
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
                            {filteredRecords.length}
                          </td>
                          <td className="grand-total-value">
                            {
                              filteredRecords.filter(
                                (r) => r.eligibility_percentage >= 100,
                              ).length
                            }
                          </td>
                          <td className="grand-total-value">
                            {
                              filteredRecords.filter(
                                (r) =>
                                  r.eligibility_percentage >= 75 &&
                                  r.eligibility_percentage < 100,
                              ).length
                            }
                          </td>
                          <td className="grand-total-value">
                            {
                              filteredRecords.filter(
                                (r) =>
                                  r.eligibility_percentage >= 50 &&
                                  r.eligibility_percentage < 75,
                              ).length
                            }
                          </td>
                          <td className="grand-total-value">
                            {
                              filteredRecords.filter(
                                (r) => r.eligibility_percentage < 50,
                              ).length
                            }
                          </td>
                          <td className="grand-total-value">
                            {formatNumber(
                              filteredRecords.reduce(
                                (sum, r) => sum + toNumber(r.bonus_payable),
                                0,
                              ),
                            )}
                          </td>
                          <td className="grand-total-value">
                            {formatNumber(
                              filteredRecords.reduce(
                                (sum, r) => sum + toNumber(r.cash_payment),
                                0,
                              ),
                            )}
                          </td>
                          <td className="grand-total-value">
                            {formatNumber(
                              filteredRecords.reduce(
                                (sum, r) => sum + toNumber(r.manual_adjustment),
                                0,
                              ),
                            )}
                          </td>
                          <td className="grand-total-value grand-total-final">
                            {formatNumber(
                              filteredRecords.reduce(
                                (sum, r) => sum + toNumber(r.total_payable),
                                0,
                              ),
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
                <FaGift className="no-data-icon" />
                <h3>No Bonus Records Found</h3>
                <p>
                  No bonus records found for {monthNames[selectedMonth - 1]}{" "}
                  {selectedYear}.
                  {selectedMonth === new Date().getMonth() + 1 &&
                  selectedYear === new Date().getFullYear() ? (
                    <span>
                      {" "}
                      You can create bonus records in the{" "}
                      <strong>Bonus Format</strong> page.
                    </span>
                  ) : (
                    <span> Try selecting a different month or year.</span>
                  )}
                </p>
                <button
                  onClick={() => navigate("/bonus-format")}
                  className="btn-primary"
                >
                  <FaGift /> Go to Bonus Format
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .bonus-records-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem;
          font-family: 'Inter', sans-serif;
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
        }
        
        /* HEADER SECTION */
        .header-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          color: white;
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
        }
        
        .title-icon { font-size: 2.2rem; }
        
        .date-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.75rem 1.5rem;
          border-radius: 15px;
          font-size: 1rem;
          font-weight: 600;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          align-self: flex-start;
        }
        
        .controls-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-width: 400px;
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
        }
        
        .search-icon {
          position: absolute;
          left: 1.2rem;
          top: 50%;
          transform: translateY(-50%);
          color: #8b5cf6;
        }
        
        .filter-controls {
          display: flex;
          gap: 0.8rem;
          flex-wrap: wrap;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
        }
        
        .filter-select {
          padding: 0.6rem;
          border: none;
          border-radius: 8px;
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
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn:hover { transform: translateY(-2px); }
        
        .btn-back { background: rgba(255, 255, 255, 0.15); color: white; border: 2px solid rgba(255, 255, 255, 0.3); }
        .btn-save { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
        .btn-refresh { background: rgba(255, 255, 255, 0.15); color: white; border: 2px solid rgba(255, 255, 255, 0.3); }
        .btn-export-all { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }
        .btn-all-sheets { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; }
        .btn-show-all, .btn-hide-all { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; }
        
        /* SUMMARY STATS GRID */
        .summary-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          padding: 1.5rem 2rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }
        
        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
        }
        
        .stat-icon { font-size: 2rem; }
        .stat-content { flex: 1; }
        .stat-value { font-size: 1.5rem; font-weight: 700; color: #1f2937; }
        .stat-label { font-size: 0.8rem; color: #6b7280; font-weight: 600; }
        
        /* COMPANY QUICK ACCESS */
        .company-quick-access {
          padding: 2rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
        }
        
        .section-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.3rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 1.5rem;
        }
        
        .section-icon { color: #8b5cf6; }
        
        .company-buttons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1rem;
        }
        
        .company-card {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .company-toggle-btn {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: rgba(139, 92, 246, 0.3);
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .company-toggle-btn:hover { border-color: #8b5cf6; }
        .company-toggle-btn.active { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; }
        
        .company-action-buttons {
          display: flex;
          gap: 0.3rem;
        }
        
        .btn-export-company, .btn-export-sheet {
          padding: 0.8rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-export-company {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .btn-export-sheet {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }
        
        .btn-export-company:hover, .btn-export-sheet:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        /* COMPANY SECTION */
        .company-section {
          padding: 2rem;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
        }
        
        .company-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }
        
        .company-title h2 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 1.5rem;
        }
        
        .company-title h3 {
          margin: 0;
          color: #6b7280;
          font-size: 1rem;
          font-weight: 500;
        }
        
        .record-count { color: #8b5cf6; font-weight: 600; }
        
        .company-action-buttons-header {
          display: flex;
          gap: 0.8rem;
        }
        
        .btn-generate-excel, .btn-export-sheet-header {
          padding: 0.8rem 1.2rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }
        
        .btn-generate-excel {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .btn-export-sheet-header {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }
        
        .btn-generate-excel:hover, .btn-export-sheet-header:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        /* TABLE STYLES */
        .table-scroll-container {
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          margin-bottom: 1.5rem;
          max-height: 70vh;
        }
        
        .table-wrapper {
          min-width: 1800px;
        }
        
        .bonus-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
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
          padding: 0.8rem 0.5rem;
          text-align: center;
          font-weight: 600;
        }
        
        .data-row td {
          padding: 0.8rem 0.5rem;
          border-bottom: 1px solid #f3f4f6;
          text-align: center;
        }
        
        .data-row:hover { background: #f9fafb; }
        
        /* SERVICE DURATION */
        .service-duration { text-align: center; }
        .service-badge { display: flex; align-items: center; justify-content: center; gap: 0.3rem; color: #4b5563; }
        .service-badge svg { color: #8b5cf6; }
        .service-years { font-size: 0.7rem; color: #9ca3af; display: block; }
        
        /* ELIGIBILITY */
        .eligibility-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.8rem;
        }
        
        /* BONUS TYPE */
        .bonus-type-badge {
          padding: 0.2rem 0.5rem;
          background: #f3f4f6;
          border-radius: 4px;
          font-size: 0.8rem;
          color: #4b5563;
        }
        
        /* STATUS */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.6rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        .status-badge.approved { background: #d1fae5; color: #10b981; }
        .status-badge.pending { background: #fee2e2; color: #ef4444; }
        
        /* EDITABLE INPUTS */
        .editable-input {
          width: 85px;
          padding: 0.5rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.8rem;
          text-align: center;
          transition: all 0.2s ease;
          background: white;
        }
        
        .editable-input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
        
        .cash-input { border-color: #3b82f6; background: #eff6ff; }
        .adjustment-input { border-color: #f59e0b; background: #fffbeb; width: 70px; }
        .reason-input { border-color: #10b981; background: #ecfdf5; width: 100px; }
        .remarks-input { border-color: #8b5cf6; background: #faf5ff; width: 120px; }
        
        .adjustment-group {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          align-items: center;
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
        
        .bank-account {
          color: #7c3aed;
          background: #f3e8ff;
          padding: 0.5rem;
          border-radius: 8px;
        }
        
        .cash-pay { color: #3b82f6; font-weight: 600; }
        .adjustments { color: #f97316; font-weight: 600; }
        .eligible-100 { color: #10b981; font-weight: 600; }
        .eligible-75 { color: #f59e0b; font-weight: 600; }
        .eligible-50 { color: #f97316; font-weight: 600; }
        .not-eligible { color: #ef4444; font-weight: 600; }
        
        /* BONUS SUMMARY */
        .bonus-summary-note {
          margin-top: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .bonus-summary-note h4 {
          margin: 0 0 1rem 0;
          color: #1e293b;
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
        
        .summary-stat.highlight {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-color: #f59e0b;
        }
        
        .grand-total { color: #8b5cf6; font-weight: 800; }
        
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
        }
        
        .summary-header h2 {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin: 0;
          color: #1f2937;
          font-size: 2rem;
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
        }
        
        .summary-card.highlight {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-color: #f59e0b;
        }
        
        .card-icon { font-size: 2.5rem; color: #8b5cf6; }
        .card-content { flex: 1; }
        .card-value { font-size: 1.8rem; font-weight: 800; color: #1f2937; }
        .card-label { font-size: 0.9rem; color: #6b7280; font-weight: 600; }
        
        .grand-total-row {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
          color: white;
          font-weight: 700;
        }
        
        .grand-total-row td { color: white !important; border-bottom: none; }
        .grand-total-label { font-size: 1.1rem; font-weight: 800; text-align: left; padding-left: 1.5rem !important; }
        .grand-total-value { font-weight: 700; text-align: center; }
        .grand-total-final { font-size: 1.2rem; font-weight: 800; }
        
        /* NO DATA */
        .no-data-section {
          padding: 4rem 2.5rem;
          text-align: center;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }
        
        .no-data-content { max-width: 500px; margin: 0 auto; }
        .no-data-icon { font-size: 4rem; color: #d1d5db; margin-bottom: 1.5rem; }
        .no-data-content h3 { color: #374151; margin-bottom: 1rem; }
        .no-data-content p { color: #6b7280; margin-bottom: 2rem; }
        
        .btn-primary {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        
        /* LOADER */
        .center-screen {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          justify-content: center;
          align-items: center;
        }
        
        .spinner {
          width: 60px;
          height: 60px;
          border: 5px solid rgba(255, 255, 255, 0.3);
          border-top: 5px solid #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* RESPONSIVE */
        @media (max-width: 768px) {
          .header-main { flex-direction: column; }
          .controls-section { width: 100%; }
          .filter-controls { flex-direction: column; }
          .action-buttons { flex-wrap: wrap; }
          .btn { flex: 1; min-width: 100px; }
          .company-buttons-grid { grid-template-columns: 1fr; }
          .company-header { flex-direction: column; }
          .company-action-buttons-header { width: 100%; }
          .table-wrapper { min-width: 1400px; }
          .summary-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .summary-cards-grid { grid-template-columns: 1fr; }
          .summary-stats { flex-direction: column; }
          .summary-stat { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default BonusRecords;
