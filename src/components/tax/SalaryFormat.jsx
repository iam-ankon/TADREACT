import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSearch,
  FaSave,
  FaFileExport,
  FaBuilding,
  FaUsers,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const API_BASE = "http://119.148.51.38:8000/api/tax-calculator";

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
};

const formatNumber = (num) => {
  const abs = Math.abs(num);
  const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return num < 0 ? `-৳${formatted}` : `৳${formatted}`;
};

const SalaryFormat = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [taxResults, setTaxResults] = useState({});
  const [sourceOther, setSourceOther] = useState({});
  const [loading, setLoading] = useState(true);
  const [openCompanies, setOpenCompanies] = useState({});
  const [manualData, setManualData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showSummary, setShowSummary] = useState(true);
  const [loadingAit, setLoadingAit] = useState({});
  const navigate = useNavigate();

  const today = new Date();
  const selectedMonth = today.getMonth() + 1;
  const selectedYear = today.getFullYear();
  const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const BASE_MONTH = 30;

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

  // Load saved manual data
  useEffect(() => {
    const saved = localStorage.getItem("salaryManualData");
    if (saved) setManualData(JSON.parse(saved));
  }, []);

  // Load source other and employees
  useEffect(() => {
    const saved = localStorage.getItem("sourceTaxOther");
    if (saved) setSourceOther(JSON.parse(saved));

    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/employees/`);
        const filtered = res.data.filter((e) => e.salary && e.employee_id);
        setEmployees(filtered);
        setFilteredEmployees(filtered);
      } catch (e) {
        console.error("Failed to fetch employees:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Load AIT values from FinanceProvision cache
  useEffect(() => {
    const loadCachedTaxResults = () => {
      try {
        const cachedResults = localStorage.getItem("cachedTaxResults");
        if (cachedResults) {
          const parsedResults = JSON.parse(cachedResults);
          setTaxResults(parsedResults);

          // Set loading states for AIT values
          const loadingStates = {};
          Object.keys(parsedResults).forEach((empId) => {
            loadingStates[empId] = false;
          });
          setLoadingAit(loadingStates);
        }
      } catch (error) {
        console.error("Error loading cached tax results:", error);
      }
    };

    loadCachedTaxResults();
  }, []);

  // Calculate missing AIT values
  useEffect(() => {
    const calculateMissingTaxes = async () => {
      const employeesWithoutAit = employees.filter(
        (emp) => !taxResults[emp.employee_id] && emp.salary && emp.employee_id
      );

      if (employeesWithoutAit.length === 0) return;

      try {
        // Set loading states for employees without AIT
        const newLoadingStates = { ...loadingAit };
        employeesWithoutAit.forEach((emp) => {
          newLoadingStates[emp.employee_id] = true;
        });
        setLoadingAit(newLoadingStates);

        const results = { ...taxResults };

        for (const emp of employeesWithoutAit) {
          try {
            const gender = emp.gender === "M" ? "Male" : "Female";
            const other = sourceOther[emp.employee_id] ?? 0;

            const response = await axios.post(`${API_BASE}/calculate/`, {
              employee_id: emp.employee_id,
              gender,
              source_other: parseFloat(String(other)) || 0,
            });

            results[emp.employee_id] = response.data;

            // Update loading state
            setLoadingAit((prev) => ({
              ...prev,
              [emp.employee_id]: false,
            }));
          } catch (error) {
            console.error(
              `Failed to calculate tax for ${emp.employee_id}:`,
              error
            );
            results[emp.employee_id] = { error: "Failed to calculate" };

            setLoadingAit((prev) => ({
              ...prev,
              [emp.employee_id]: false,
            }));
          }

          // Small delay to prevent overwhelming the server
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        setTaxResults(results);

        // Update cache
        localStorage.setItem("cachedTaxResults", JSON.stringify(results));
      } catch (error) {
        console.error("Error in tax calculation:", error);
      }
    };

    if (employees.length > 0 && Object.keys(taxResults).length === 0) {
      calculateMissingTaxes();
    }
  }, [employees, taxResults, sourceOther]);

  // Filter employees based on search
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredEmployees(employees);
      return;
    }
    const filtered = employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(term) ||
        emp.employee_id.toLowerCase().includes(term)
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  const saveData = async () => {
    const payload = filteredEmployees
      .map((emp, idx) => {
        const empId = emp.employee_id?.trim();
        if (!empId) return null;

        const monthlySalary = Number(emp.salary) || 0;

        const basicFull = Number((monthlySalary * 0.6).toFixed(2));
        const houseRentFull = Number((monthlySalary * 0.3).toFixed(2));
        const medicalFull = Number((monthlySalary * 0.05).toFixed(2));
        const conveyanceFull = Number((monthlySalary * 0.05).toFixed(2));
        const grossFull = Number(monthlySalary.toFixed(2));

        const ait =
          Number(taxResults[empId]?.tax_calculation?.monthly_tds) || 0;

        const daysWorkedManual = Number(getManual(empId, "daysWorked")) || 0;
        const cashPayment = Number(getManual(empId, "cashPayment")) || 0;
        const addition = Number(getManual(empId, "addition")) || 0;
        const advance = Number(getManual(empId, "advance")) || 0;
        const remarks = getManual(empId, "remarks", "") || "";

        const doj = parseDate(emp.joining_date);
        const isNewJoiner =
          doj &&
          doj.getMonth() + 1 === selectedMonth &&
          doj.getFullYear() === selectedYear;
        const defaultDays = isNewJoiner
          ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
          : totalDaysInMonth;
        const daysWorked =
          daysWorkedManual > 0 ? daysWorkedManual : defaultDays;
        const absentDays = Math.max(0, totalDaysInMonth - daysWorked);

        const dailyBasic = Number((basicFull / 30).toFixed(2));
        const absentDeduction = Number((dailyBasic * absentDays).toFixed(2));
        const totalDeduction = Number(
          (ait + advance + absentDeduction).toFixed(2)
        );

        const netPayBank = Number(
          (
            (monthlySalary / totalDaysInMonth) * daysWorked -
            cashPayment -
            totalDeduction +
            addition
          ).toFixed(2)
        );
        const totalPayable = Number(
          (netPayBank + cashPayment + ait).toFixed(2)
        );

        let dojStr = "";
        if (emp.joining_date) {
          const d = parseDate(emp.joining_date);
          if (d) {
            dojStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
              2,
              "0"
            )}-${String(d.getDate()).padStart(2, "0")}`;
          }
        }

        return {
          sl: idx + 1,
          name: emp.name?.trim() || "Unknown",
          employee_id: empId,
          designation: emp.designation?.trim() || "",
          doj: dojStr || null,

          basic: basicFull,
          house_rent: houseRentFull,
          medical: medicalFull,
          conveyance: conveyanceFull,
          gross_salary: grossFull,

          total_days: totalDaysInMonth,
          days_worked: daysWorked,
          absent_days: absentDays,

          absent_ded: absentDeduction,
          advance: advance,
          ait: ait,
          total_ded: totalDeduction,

          ot_hours: 0,
          addition: addition,

          cash_payment: cashPayment,
          net_pay_bank: netPayBank,
          total_payable: totalPayable,

          remarks: remarks,
        };
      })
      .filter(Boolean);

    console.log("Sending payload:", payload.length, "rows");

    try {
      const res = await axios.post(`${API_BASE}/save-salary/`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const saved = res.data.saved || 0;
      const errors = res.data.errors || [];

      if (errors.length > 0) {
        console.warn("Save errors:", errors);
        alert(
          `Warning: Saved ${saved}, but ${errors.length} failed. Check console.`
        );
      } else {
        alert(
          `Success: All ${saved} rows saved! (${res.data.created} new, ${res.data.updated} updated)`
        );
      }
    } catch (e) {
      console.error("Save failed:", e.response?.data || e);
      alert("Save failed – check console");
    }
  };

  const grouped = filteredEmployees.reduce((acc, emp) => {
    const comp = emp.company_name ?? "Unknown";
    if (!acc[comp]) acc[comp] = [];
    acc[comp].push(emp);
    return acc;
  }, {});

  // Fixed toggleCompany function
  const toggleCompany = (comp) => {
    setOpenCompanies((prev) => {
      const newState = { ...prev, [comp]: !prev[comp] };

      // Check if any company is still open
      const isAnyCompanyOpen = Object.values(newState).some((v) => v);

      // Show summary only when no companies are open
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
    localStorage.setItem("salaryManualData", JSON.stringify(newData));
  };

  const getManual = (empId, field, defaultVal = 0) => {
    return manualData[empId]?.[field] ?? defaultVal;
  };

  const getAitValue = (empId) => {
    if (loadingAit[empId]) {
      return "Loading...";
    }
    const result = taxResults[empId];
    if (!result) return 0;
    if (result.error) return "Error";
    return result.tax_calculation?.monthly_tds || 0;
  };

  const exportCompanyData = (companyName) => {
    const emps = grouped[companyName];
    if (!emps || emps.length === 0) return;

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

    const rows = [];

    emps.forEach((emp, idx) => {
      const monthlySalary = Number(emp.salary) || 0;
      const empId = emp.employee_id;

      const basicFull = monthlySalary * 0.6;
      const houseRentFull = monthlySalary * 0.3;
      const medicalFull = monthlySalary * 0.05;
      const conveyanceFull = monthlySalary * 0.05;
      const grossFull = monthlySalary;

      const ait = getAitValue(empId);
      const numericAit = typeof ait === "number" ? ait : 0;

      const daysWorkedManual = getManual(empId, "daysWorked");
      const cashPayment = getManual(empId, "cashPayment");
      const addition = getManual(empId, "addition");
      const advance = getManual(empId, "advance");
      const remarks = getManual(empId, "remarks", "");

      const doj = parseDate(emp.joining_date);
      const isNewJoiner =
        doj &&
        doj.getMonth() + 1 === selectedMonth &&
        doj.getFullYear() === selectedYear;
      const defaultDays = isNewJoiner
        ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
        : totalDaysInMonth;
      const daysWorked = daysWorkedManual > 0 ? daysWorkedManual : defaultDays;
      const absentDays = totalDaysInMonth - daysWorked;

      const dailyRate = monthlySalary / totalDaysInMonth;
      const dailyBasic = basicFull / BASE_MONTH;
      const absentDeduction = dailyBasic * absentDays;
      const totalDeduction = numericAit + advance + absentDeduction;

      const netPayBank =
        dailyRate * daysWorked - cashPayment - totalDeduction + addition;
      const totalPayable = netPayBank + cashPayment + numericAit;

      rows.push([
        idx + 1,
        emp.name,
        empId,
        emp.designation,
        emp.joining_date,
        basicFull,
        houseRentFull,
        medicalFull,
        conveyanceFull,
        grossFull,
        totalDaysInMonth,
        daysWorked,
        absentDays,
        absentDeduction,
        advance,
        numericAit,
        totalDeduction,
        0,
        addition,
        cashPayment,
        netPayBank,
        totalPayable,
        remarks,
      ]);
    });

    const summary = emps.reduce(
      (acc, e) => {
        const empId = e.employee_id;
        const salary = Number(e.salary) || 0;
        const doj = parseDate(e.joining_date);
        const isNewJoiner =
          doj &&
          doj.getMonth() + 1 === selectedMonth &&
          doj.getFullYear() === selectedYear;
        const defaultDays = isNewJoiner
          ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
          : totalDaysInMonth;
        const daysWorked = getManual(empId, "daysWorked") || defaultDays;
        const ait = getAitValue(empId);
        const numericAit = typeof ait === "number" ? ait : 0;
        const absentDed =
          ((salary * 0.6) / BASE_MONTH) * (totalDaysInMonth - daysWorked);
        const advance = getManual(empId, "advance");
        const cash = getManual(empId, "cashPayment");
        const addition = getManual(empId, "addition");
        const totalDed = numericAit + advance + absentDed;
        const netBank =
          (salary / totalDaysInMonth) * daysWorked - cash - totalDed + addition;
        const totalPay = netBank + cash + numericAit;

        return {
          gross: acc.gross + salary,
          ait: acc.ait + numericAit,
          absentDed: acc.absentDed + absentDed,
          advance: acc.advance + advance,
          cash: acc.cash + cash,
          addition: acc.addition + addition,
          netBank: acc.netBank + netBank,
          totalPay: acc.totalPay + totalPay,
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

    rows.push([]);
    rows.push([
      "SUMMARY",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    rows.push([
      "Total Employees",
      emps.length,
      "Gross Salary",
      summary.gross,
      "AIT",
      summary.ait,
      "Absent Ded.",
      summary.absentDed,
      "Advance",
      summary.advance,
      "Cash",
      summary.cash,
      "Addition",
      summary.addition,
      "Net Pay",
      summary.netBank,
      "Total Payable",
      summary.totalPay,
    ]);

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

    XLSX.utils.book_append_sheet(wb, ws, "Salary Sheet");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(
      blob,
      `${companyName}_Salary_${
        monthNames[selectedMonth - 1]
      }_${selectedYear}.xlsx`
    );
  };

  const exportAllCompanies = () => {
    Object.keys(grouped).forEach((companyName, i) => {
      setTimeout(() => exportCompanyData(companyName), i * 200);
    });
  };

  const loadTaxDataFromBackend = async () => {
    try {
      const results = {};

      for (const emp of employees) {
        if (emp.salary && emp.employee_id) {
          try {
            // Try to get tax extra data from backend
            const taxExtraRes = await axios.get(
              `${API_BASE}/tax-extra/${emp.employee_id}/`
            );
            const sourceOtherValue = taxExtraRes.data.source_other || 0;

            // Update sourceOther state
            setSourceOther((prev) => ({
              ...prev,
              [emp.employee_id]: sourceOtherValue,
            }));

            // Calculate tax with backend data
            const gender = emp.gender === "M" ? "Male" : "Female";
            const calc = await axios.post(`${API_BASE}/calculate/`, {
              employee_id: emp.employee_id,
              gender,
              source_other: sourceOtherValue,
            });

            results[emp.employee_id] = calc.data;
          } catch (error) {
            console.error(
              `Failed to load backend data for ${emp.employee_id}:`,
              error
            );
            // Fallback to existing logic
          }
        }
      }

      setTaxResults(results);
      localStorage.setItem("cachedTaxResults", JSON.stringify(results));
    } catch (error) {
      console.error("Error loading tax data from backend:", error);
    }
  };

  // Use this in your useEffect instead of loadCachedTaxResults
  useEffect(() => {
    if (employees.length > 0) {
      loadTaxDataFromBackend();
    }
  }, [employees.length]);

  if (loading) {
    return (
      <div className="center-screen">
        <div className="fullscreen-loader">
          <div className="spinner" />
          <p>Loading Salary Format...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="salary-format-container">
      <div className="dashboard">
        <div className="card">
          {/* HEADER SECTION */}
          <div className="header-section">
            <div className="header-main">
              <div className="title-section">
                <h1 className="main-title">
                  <FaUsers className="title-icon" />
                  Salary Format
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

                <div className="action-buttons">
                  <button
                    onClick={exportAllCompanies}
                    className="btn btn-export-all"
                  >
                    <FaFileExport /> Export All
                  </button>

                  <button
                    onClick={() => navigate("/finance-provision")}
                    className="btn btn-back"
                  >
                    <FaArrowLeft /> Back
                  </button>

                  <button className="btn btn-save" onClick={saveData}>
                    <FaSave /> Save Data
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
                  <button
                    onClick={() => exportCompanyData(comp)}
                    className="btn-export-company"
                    title={`Export ${comp} data`}
                  >
                    <FaFileExport />
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
                      Salary Sheet for {monthNames[selectedMonth - 1]}{" "}
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
                        {emps.map((emp, idx) => {
                          const monthlySalary = Number(emp.salary) || 0;
                          const empId = emp.employee_id;

                          const basicFull = monthlySalary * 0.6;
                          const houseRentFull = monthlySalary * 0.3;
                          const medicalFull = monthlySalary * 0.05;
                          const conveyanceFull = monthlySalary * 0.05;
                          const grossFull = monthlySalary;

                          const ait = getAitValue(empId);
                          const numericAit = typeof ait === "number" ? ait : 0;

                          const daysWorkedManual = getManual(
                            empId,
                            "daysWorked"
                          );
                          const cashPayment = getManual(empId, "cashPayment");
                          const addition = getManual(empId, "addition");
                          const advance = getManual(empId, "advance");
                          const remarks = getManual(empId, "remarks", "");

                          const doj = parseDate(emp.joining_date);
                          const isNewJoiner =
                            doj &&
                            doj.getMonth() + 1 === selectedMonth &&
                            doj.getFullYear() === selectedYear;
                          const defaultDays = isNewJoiner
                            ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
                            : totalDaysInMonth;
                          const daysWorked =
                            daysWorkedManual > 0
                              ? daysWorkedManual
                              : defaultDays;
                          const absentDays = totalDaysInMonth - daysWorked;

                          const dailyRate = monthlySalary / totalDaysInMonth;
                          const dailyBasic = basicFull / BASE_MONTH;
                          const absentDeduction = dailyBasic * absentDays;
                          const totalDeduction =
                            numericAit + advance + absentDeduction;

                          const netPayBank =
                            dailyRate * daysWorked -
                            cashPayment -
                            totalDeduction +
                            addition;
                          const totalPayable =
                            netPayBank + cashPayment + numericAit;

                          return (
                            <tr key={empId} className="data-row">
                              <td className="sl-number">{idx + 1}</td>
                              <td className="emp-name">{emp.name}</td>
                              <td className="emp-id">{empId}</td>
                              <td className="emp-designation">
                                {emp.designation}
                              </td>
                              <td className="emp-doj">{emp.joining_date}</td>
                              <td className="salary-amount">
                                {formatNumber(basicFull)}
                              </td>
                              <td className="salary-amount">
                                {formatNumber(houseRentFull)}
                              </td>
                              <td className="salary-amount">
                                {formatNumber(medicalFull)}
                              </td>
                              <td className="salary-amount">
                                {formatNumber(conveyanceFull)}
                              </td>
                              <td className="gross-salary">
                                {formatNumber(grossFull)}
                              </td>
                              <td className="days-count">{totalDaysInMonth}</td>

                              <td>
                                <input
                                  type="number"
                                  value={
                                    daysWorkedManual > 0 ? daysWorkedManual : ""
                                  }
                                  placeholder={defaultDays}
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
                                  value={advance !== 0 ? advance : ""}
                                  placeholder="0"
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

                              <td
                                className={`tax-amount ${
                                  loadingAit[empId] ? "loading" : ""
                                }`}
                              >
                                {loadingAit[empId] ? (
                                  <span className="loading-dots">...</span>
                                ) : (
                                  formatNumber(numericAit)
                                )}
                              </td>
                              <td className="deduction-amount total-deduction">
                                {formatNumber(totalDeduction)}
                              </td>

                              <td className="ot-hours">0</td>

                              <td>
                                <input
                                  type="number"
                                  value={addition !== 0 ? addition : ""}
                                  placeholder="0"
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
                                  value={cashPayment !== 0 ? cashPayment : ""}
                                  placeholder="0"
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
                                  value={remarks}
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

                <div className="footer">
                  <span>Prepared by: HR</span>
                  <span>Checked by: Finance & Accounts</span>
                  <span>Checked by: Director</span>
                  <span>Approved by: Proprietor / MD</span>
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
                  <div className="stat-number">{filteredEmployees.length}</div>
                  <div className="stat-label">Total Employees</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {formatNumber(
                      filteredEmployees.reduce(
                        (s, e) => s + (Number(e.salary) || 0),
                        0
                      )
                    )}
                  </div>
                  <div className="stat-label">Total Gross Salary</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {formatNumber(
                      filteredEmployees.reduce((s, e) => {
                        const ait = getAitValue(e.employee_id);
                        return s + (typeof ait === "number" ? ait : 0);
                      }, 0)
                    )}
                  </div>
                  <div className="stat-label">Total AIT</div>
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
                        <th>Absent Ded.</th>
                        <th>Advance</th>
                        <th>Cash</th>
                        <th>Addition</th>
                        <th>Net Pay (Bank)</th>
                        <th>Total Payable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(grouped).map((comp, i) => {
                        const emps = grouped[comp];
                        const summary = emps.reduce(
                          (acc, e) => {
                            const empId = e.employee_id;
                            const salary = Number(e.salary) || 0;
                            const doj = parseDate(e.joining_date);
                            const isNewJoiner =
                              doj &&
                              doj.getMonth() + 1 === selectedMonth &&
                              doj.getFullYear() === selectedYear;
                            const defaultDays = isNewJoiner
                              ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
                              : totalDaysInMonth;
                            const daysWorked =
                              getManual(empId, "daysWorked") || defaultDays;
                            const ait = getAitValue(empId);
                            const numericAit =
                              typeof ait === "number" ? ait : 0;
                            const absentDed =
                              ((salary * 0.6) / BASE_MONTH) *
                              (totalDaysInMonth - daysWorked);
                            const advance = getManual(empId, "advance");
                            const cash = getManual(empId, "cashPayment");
                            const addition = getManual(empId, "addition");
                            const totalDed = numericAit + advance + absentDed;
                            const netBank =
                              (salary / totalDaysInMonth) * daysWorked -
                              cash -
                              totalDed +
                              addition;
                            const totalPay = netBank + cash + numericAit;

                            return {
                              gross: acc.gross + salary,
                              ait: acc.ait + numericAit,
                              absentDed: acc.absentDed + absentDed,
                              advance: acc.advance + advance,
                              cash: acc.cash + cash,
                              addition: acc.addition + addition,
                              netBank: acc.netBank + netBank,
                              totalPay: acc.totalPay + totalPay,
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

                        return (
                          <tr key={i} className="data-row summary-row">
                            <td className="sl-number">{i + 1}</td>
                            <td className="company-name">{comp}</td>
                            <td className="employee-count">{emps.length}</td>
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

                      {/* GRAND TOTAL ROW - PROPERLY ALIGNED */}
                      <tr className="grand-total">
                        <td colSpan="2" className="grand-total-label">
                          Grand Total
                        </td>
                        <td className="grand-total-count">
                          {filteredEmployees.length}
                        </td>
                        <td className="grand-total-gross">
                          {formatNumber(
                            filteredEmployees.reduce(
                              (s, e) => s + (Number(e.salary) || 0),
                              0
                            )
                          )}
                        </td>
                        <td className="grand-total-tax">
                          {formatNumber(
                            filteredEmployees.reduce((s, e) => {
                              const ait = getAitValue(e.employee_id);
                              return s + (typeof ait === "number" ? ait : 0);
                            }, 0)
                          )}
                        </td>
                        <td className="grand-total-deduction">
                          {formatNumber(
                            filteredEmployees.reduce((s, e) => {
                              const empId = e.employee_id;
                              const salary = Number(e.salary) || 0;
                              const doj = parseDate(e.joining_date);
                              const isNewJoiner =
                                doj &&
                                doj.getMonth() + 1 === selectedMonth &&
                                doj.getFullYear() === selectedYear;
                              const defaultDays = isNewJoiner
                                ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
                                : totalDaysInMonth;
                              const daysWorked =
                                getManual(empId, "daysWorked") || defaultDays;
                              return (
                                s +
                                ((salary * 0.6) / BASE_MONTH) *
                                  (totalDaysInMonth - daysWorked)
                              );
                            }, 0)
                          )}
                        </td>
                        <td className="grand-total-advance">
                          {formatNumber(
                            filteredEmployees.reduce(
                              (s, e) => s + getManual(e.employee_id, "advance"),
                              0
                            )
                          )}
                        </td>
                        <td className="grand-total-cash">
                          {formatNumber(
                            filteredEmployees.reduce(
                              (s, e) =>
                                s + getManual(e.employee_id, "cashPayment"),
                              0
                            )
                          )}
                        </td>
                        <td
                          className={`grand-total-addition ${
                            filteredEmployees.reduce(
                              (s, e) =>
                                s + getManual(e.employee_id, "addition"),
                              0
                            ) < 0
                              ? "negative"
                              : "positive"
                          }`}
                        >
                          {formatNumber(
                            filteredEmployees.reduce(
                              (s, e) =>
                                s + getManual(e.employee_id, "addition"),
                              0
                            )
                          )}
                        </td>
                        <td
                          className={`grand-total-net ${
                            filteredEmployees.reduce((s, e) => {
                              const empId = e.employee_id;
                              const salary = Number(e.salary) || 0;
                              const doj = parseDate(e.joining_date);
                              const isNewJoiner =
                                doj &&
                                doj.getMonth() + 1 === selectedMonth &&
                                doj.getFullYear() === selectedYear;
                              const defaultDays = isNewJoiner
                                ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
                                : totalDaysInMonth;
                              const daysWorked =
                                getManual(empId, "daysWorked") || defaultDays;
                              const ait = getAitValue(empId);
                              const numericAit =
                                typeof ait === "number" ? ait : 0;
                              const absentDed =
                                ((salary * 0.6) / BASE_MONTH) *
                                (totalDaysInMonth - daysWorked);
                              const advance = getManual(empId, "advance");
                              const cash = getManual(empId, "cashPayment");
                              const addition = getManual(empId, "addition");
                              const totalDed = numericAit + advance + absentDed;
                              const netBank =
                                (salary / totalDaysInMonth) * daysWorked -
                                cash -
                                totalDed +
                                addition;
                              return s + netBank;
                            }, 0) < 0
                              ? "negative"
                              : "positive"
                          }`}
                        >
                          {formatNumber(
                            filteredEmployees.reduce((s, e) => {
                              const empId = e.employee_id;
                              const salary = Number(e.salary) || 0;
                              const doj = parseDate(e.joining_date);
                              const isNewJoiner =
                                doj &&
                                doj.getMonth() + 1 === selectedMonth &&
                                doj.getFullYear() === selectedYear;
                              const defaultDays = isNewJoiner
                                ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
                                : totalDaysInMonth;
                              const daysWorked =
                                getManual(empId, "daysWorked") || defaultDays;
                              const ait = getAitValue(empId);
                              const numericAit =
                                typeof ait === "number" ? ait : 0;
                              const absentDed =
                                ((salary * 0.6) / BASE_MONTH) *
                                (totalDaysInMonth - daysWorked);
                              const advance = getManual(empId, "advance");
                              const cash = getManual(empId, "cashPayment");
                              const addition = getManual(empId, "addition");
                              const totalDed = numericAit + advance + absentDed;
                              const netBank =
                                (salary / totalDaysInMonth) * daysWorked -
                                cash -
                                totalDed +
                                addition;
                              return s + netBank;
                            }, 0)
                          )}
                        </td>
                        <td className="grand-total-payable">
                          {formatNumber(
                            filteredEmployees.reduce((s, e) => {
                              const empId = e.employee_id;
                              const salary = Number(e.salary) || 0;
                              const doj = parseDate(e.joining_date);
                              const isNewJoiner =
                                doj &&
                                doj.getMonth() + 1 === selectedMonth &&
                                doj.getFullYear() === selectedYear;
                              const defaultDays = isNewJoiner
                                ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
                                : totalDaysInMonth;
                              const daysWorked =
                                getManual(empId, "daysWorked") || defaultDays;
                              const ait = getAitValue(empId);
                              const numericAit =
                                typeof ait === "number" ? ait : 0;
                              const absentDed =
                                ((salary * 0.6) / BASE_MONTH) *
                                (totalDaysInMonth - daysWorked);
                              const advance = getManual(empId, "advance");
                              const cash = getManual(empId, "cashPayment");
                              const addition = getManual(empId, "addition");
                              const totalDed = numericAit + advance + absentDed;
                              const netBank =
                                (salary / totalDaysInMonth) * daysWorked -
                                cash -
                                totalDed +
                                addition;
                              const totalPay = netBank + cash + numericAit;
                              return s + totalPay;
                            }, 0)
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

      <style jsx>{`
        .salary-format-container {
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

        /* FIXED TABLE STYLING */
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

        /* AIT LOADING STYLES */
        .tax-amount.loading {
          color: #6b7280;
          font-style: italic;
          background: #f3f4f6;
          padding: 0.5rem;
          border-radius: 8px;
        }

        .loading-dots {
          animation: loadingDots 1.5s infinite;
          color: #8b5cf6;
        }

        @keyframes loadingDots {
          0%,
          20% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
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

        /* FOOTER */
        .footer {
          display: flex;
          justify-content: space-between;
          padding: 2rem 0;
          color: #64748b;
          font-size: 0.95rem;
          border-top: 2px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .footer span {
          padding: 0.8rem 1.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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

        /* GRAND TOTAL STYLES - PROPERLY ALIGNED */
        .grand-total {
          background: linear-gradient(
            135deg,
            #8b5cf6 0%,
            #7c3aed 100%
          ) !important;
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
        .grand-total-deduction,
        .grand-total-advance,
        .grand-total-cash,
        .grand-total-addition,
        .grand-total-net,
        .grand-total-payable {
          text-align: center !important;
          font-weight: 800;
          background: transparent !important;
          border: none !important;
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
          .salary-format-container {
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

          .footer {
            flex-direction: column;
            text-align: center;
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
      `}</style>
    </div>
  );
};

export default SalaryFormat;
