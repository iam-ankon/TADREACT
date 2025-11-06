import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch, FaSave, FaFileExport } from "react-icons/fa";
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
  const navigate = useNavigate();

  const saveData = async () => {
    const payload = filteredEmployees
      .map((emp, idx) => {
        const empId = emp.employee_id?.trim();
        if (!empId) return null; // skip invalid

        const monthlySalary = Number(emp.salary) || 0;

        // === Salary Breakdown ===
        const basicFull = Number((monthlySalary * 0.6).toFixed(2));
        const houseRentFull = Number((monthlySalary * 0.3).toFixed(2));
        const medicalFull = Number((monthlySalary * 0.05).toFixed(2));
        const conveyanceFull = Number((monthlySalary * 0.05).toFixed(2));
        const grossFull = Number(monthlySalary.toFixed(2));

        // === AIT ===
        const ait =
          Number(taxResults[empId]?.tax_calculation?.monthly_tds) || 0;

        // === Manual Inputs ===
        const daysWorkedManual = Number(getManual(empId, "daysWorked")) || 0;
        const cashPayment = Number(getManual(empId, "cashPayment")) || 0;
        const addition = Number(getManual(empId, "addition")) || 0;
        const advance = Number(getManual(empId, "advance")) || 0;
        const remarks = getManual(empId, "remarks", "") || "";

        // === Days Logic ===
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

        // === Deductions ===
        const dailyBasic = Number((basicFull / 30).toFixed(2));
        const absentDeduction = Number((dailyBasic * absentDays).toFixed(2));
        const totalDeduction = Number(
          (ait + advance + absentDeduction).toFixed(2)
        );

        // === Net Pay ===
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

        // === DOJ String Format: YYYY-MM-DD ===
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
          doj: dojStr || null, // ← null if invalid

          // === Money Fields (always number, 2 decimals) ===
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
      .filter(Boolean); // Remove nulls

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
  // AUTO CURRENT MONTH & YEAR
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

  useEffect(() => {
    const saved = localStorage.getItem("salaryManualData");
    if (saved) setManualData(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("sourceTaxOther");
    if (saved) setSourceOther(JSON.parse(saved));

    const fetch = async () => {
      try {
        const res = await axios.get(`${API_BASE}/employees/`);
        const filtered = res.data.filter((e) => e.salary && e.employee_id);
        setEmployees(filtered);
        setFilteredEmployees(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!employees.length) return;

    const calc = async () => {
      const results = {};
      for (const emp of employees) {
        const gender = emp.gender === "M" ? "Male" : "Female";
        const other = sourceOther[emp.employee_id] ?? 0;
        try {
          const r = await axios.post(`${API_BASE}/calculate/`, {
            employee_id: emp.employee_id,
            gender,
            source_other: parseFloat(String(other)) || 0,
          });
          results[emp.employee_id] = r.data;
        } catch {
          results[emp.employee_id] = { error: "Failed" };
        }
      }
      setTaxResults(results);
    };
    calc();
  }, [employees, sourceOther]);

  // SEARCH FILTER
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

  const grouped = filteredEmployees.reduce((acc, emp) => {
    const comp = emp.company_name ?? "Unknown";
    if (!acc[comp]) acc[comp] = [];
    acc[comp].push(emp);
    return acc;
  }, {});

  const toggleCompany = (comp) => {
    setOpenCompanies((prev) => ({ ...prev, [comp]: !prev[comp] }));
  };

  const isAnyCompanyOpen = Object.values(openCompanies).some((v) => v);

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

  // ─────────────────────────────────────────────────────────────
  // EXPORT TO XLSX (Single Company)
  // ─────────────────────────────────────────────────────────────
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

      const t = taxResults[empId] ?? {};
      const ait = t.tax_calculation?.monthly_tds ?? 0;

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
      const totalDeduction = ait + advance + absentDeduction;

      const netPayBank =
        dailyRate * daysWorked - cashPayment - totalDeduction + addition;
      const totalPayable = netPayBank + cashPayment + ait;

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
        ait,
        totalDeduction,
        0,
        addition,
        cashPayment,
        netPayBank,
        totalPayable,
        remarks,
      ]);
    });

    // Summary calculation
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
        const ait = taxResults[empId]?.tax_calculation?.monthly_tds || 0;
        const absentDed =
          ((salary * 0.6) / BASE_MONTH) * (totalDaysInMonth - daysWorked);
        const advance = getManual(empId, "advance");
        const cash = getManual(empId, "cashPayment");
        const addition = getManual(empId, "addition");
        const totalDed = ait + advance + absentDed;
        const netBank =
          (salary / totalDaysInMonth) * daysWorked - cash - totalDed + addition;
        const totalPay = netBank + cash + ait;

        return {
          gross: acc.gross + salary,
          ait: acc.ait + ait,
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

  if (loading) {
    return (
      <div className="center-screen">
        <div className="fullscreen-loader">
          <div className="spinner" />
          <p>Loading Salary Format...</p>
        </div>
        <style>{`
          .center-screen{display:flex;min-height:100vh;background:linear-gradient(135deg,#667eea,#764ba2);justify-content:center;align-items:center;padding:1rem;}
          .fullscreen-loader{text-align:center;}
          .spinner{width:80px;height:80px;border:8px solid #f0f0f0;border-top:8px solid #7c3aed;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 1.5rem;}
          @keyframes spin{to{transform:rotate(360deg);}}
          p{font-size:1.5rem;font-weight:600;color:white;}
        `}</style>
      </div>
    );
  }

  return (
    <div className="center-screen">
      <div className="dashboard">
        <div className="card">
          <div className="header">
            <h1>Salary Format</h1>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div className="search-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by Name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="auto-date">
                {monthNames[selectedMonth - 1]} - {selectedYear}
              </div>

              <button onClick={exportAllCompanies} className="btn export-all">
                <FaFileExport /> Export All
              </button>

              <button onClick={() => navigate(-1)} className="btn back">
                <FaArrowLeft /> Back
              </button>
              <button
                className="btn save"
                title="Auto-saved"
                onClick={saveData}
              >
                <FaSave /> Saved
              </button>
            </div>
          </div>

          <div className="company-buttons">
            {Object.keys(grouped).map((comp) => (
              <div key={comp} className="company-btn-container">
                <button
                  className={`company-btn ${
                    openCompanies[comp] ? "active" : ""
                  }`}
                  onClick={() => toggleCompany(comp)}
                >
                  {comp} ({grouped[comp].length} employees)
                  {openCompanies[comp] ? "Up" : "Down"}
                </button>
                <button
                  onClick={() => exportCompanyData(comp)}
                  className="btn export-company"
                  title={`Export ${comp} data`}
                >
                  <FaFileExport />
                </button>
              </div>
            ))}
          </div>

          {/* COMPANY SECTIONS */}
          {Object.keys(grouped).map((comp) => {
            const emps = grouped[comp];
            if (!openCompanies[comp]) return null;

            return (
              <div key={comp} className="company-section">
                <div className="company-header">
                  <div>
                    <h2>{comp}</h2>
                    <h3>
                      Salary Sheet for the month of{" "}
                      {monthNames[selectedMonth - 1]} - {selectedYear}
                    </h3>
                  </div>
                  <button
                    onClick={() => exportCompanyData(comp)}
                    className="btn export-section"
                  >
                    <FaFileExport /> Export {comp} Data
                  </button>
                </div>

                <div className="table-container">
                  <table className="table">
                    <thead className="sticky-header">
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

                        const t = taxResults[empId] ?? {};
                        const ait = t.tax_calculation?.monthly_tds ?? 0;

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
                        const daysWorked =
                          daysWorkedManual > 0 ? daysWorkedManual : defaultDays;
                        const absentDays = totalDaysInMonth - daysWorked;

                        const dailyRate = monthlySalary / totalDaysInMonth;
                        const dailyBasic = basicFull / BASE_MONTH;
                        const absentDeduction = dailyBasic * absentDays;
                        const totalDeduction = ait + advance + absentDeduction;

                        const netPayBank =
                          dailyRate * daysWorked -
                          cashPayment -
                          totalDeduction +
                          addition;
                        const totalPayable = netPayBank + cashPayment + ait;

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
                                  updateManual(empId, "advance", e.target.value)
                                }
                                className="editable-input advance-input"
                              />
                            </td>

                            <td className="tax-amount">{formatNumber(ait)}</td>
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
                                  updateManual(empId, "remarks", e.target.value)
                                }
                                className="editable-input remarks-input"
                                style={{ width: "120px" }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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

          {/* SUMMARY */}
          {!isAnyCompanyOpen && (
            <div className="summary-section">
              <div className="summary-header">
                <h2>Summary</h2>
                <button onClick={exportAllCompanies} className="btn export-all">
                  <FaFileExport /> 
                </button>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead className="sticky-header">
                    <tr>
                      <th>SL</th>
                      <th>Company</th>
                      <th>NOE</th>
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
                          const ait =
                            taxResults[empId]?.tax_calculation?.monthly_tds ||
                            0;
                          const absentDed =
                            ((salary * 0.6) / BASE_MONTH) *
                            (totalDaysInMonth - daysWorked);
                          const advance = getManual(empId, "advance");
                          const cash = getManual(empId, "cashPayment");
                          const addition = getManual(empId, "addition");
                          const totalDed = ait + advance + absentDed;
                          const netBank =
                            (salary / totalDaysInMonth) * daysWorked -
                            cash -
                            totalDed +
                            addition;
                          const totalPay = netBank + cash + ait;

                          return {
                            gross: acc.gross + salary,
                            ait: acc.ait + ait,
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

                    <tr className="grand-total">
                      <td colSpan={2} className="grand-total-label">
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
                          filteredEmployees.reduce(
                            (s, e) =>
                              s +
                              (taxResults[e.employee_id]?.tax_calculation
                                ?.monthly_tds || 0),
                            0
                          )
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
                            (s, e) => s + getManual(e.employee_id, "addition"),
                            0
                          ) < 0
                            ? "negative"
                            : "positive"
                        }`}
                      >
                        {formatNumber(
                          filteredEmployees.reduce(
                            (s, e) => s + getManual(e.employee_id, "addition"),
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
                            const ait =
                              taxResults[empId]?.tax_calculation?.monthly_tds ||
                              0;
                            const absentDed =
                              ((salary * 0.6) / BASE_MONTH) *
                              (totalDaysInMonth - daysWorked);
                            const advance = getManual(empId, "advance");
                            const cash = getManual(empId, "cashPayment");
                            const addition = getManual(empId, "addition");
                            const totalDed = ait + advance + absentDed;
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
                            const ait =
                              taxResults[empId]?.tax_calculation?.monthly_tds ||
                              0;
                            const absentDed =
                              ((salary * 0.6) / BASE_MONTH) *
                              (totalDaysInMonth - daysWorked);
                            const advance = getManual(empId, "advance");
                            const cash = getManual(empId, "cashPayment");
                            const addition = getManual(empId, "addition");
                            const totalDed = ait + advance + absentDed;
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
                            const ait =
                              taxResults[empId]?.tax_calculation?.monthly_tds ||
                              0;
                            const absentDed =
                              ((salary * 0.6) / BASE_MONTH) *
                              (totalDaysInMonth - daysWorked);
                            const advance = getManual(empId, "advance");
                            const cash = getManual(empId, "cashPayment");
                            const addition = getManual(empId, "addition");
                            const totalDed = ait + advance + absentDed;
                            const netBank =
                              (salary / totalDaysInMonth) * daysWorked -
                              cash -
                              totalDed +
                              addition;
                            return s + netBank + cash + ait;
                          }, 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SAME STYLES */}
      <style>{`
        /* ... (all your original styles unchanged) ... */
        .center-screen{display:flex;min-height:100vh;background:linear-gradient(135deg,#667eea,#764ba2);justify-content:center;align-items:center;padding:1rem;}
        .dashboard{width:100%;max-width:1500px;background:#fff;border-radius:20px;box-shadow:0 20px 50px rgba(0,0,0,.2);overflow:hidden;}
        .card{padding:2rem;}
        .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;}
        .header h1{font-size:2.2rem;color:#1e3a8a;font-weight:700;}
        .search-container{position:relative;display:flex;align-items:center;width:280px;}
        .search-icon{position:absolute;left:12px;color:#6b7280;font-size:1.1rem;}
        .search-input{width:100%;padding:0.7rem 1rem 0.7rem 2.5rem;border:1px solid #ddd;border-radius:12px;font-size:1rem;outline:none;transition:border .2s;}
        .search-input:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.1);}
        .auto-date{background:#e0e7ff;color:#4f46e5;padding:.5rem 1rem;border-radius:8px;font-weight:600;font-size:1rem;}
        .btn.back,.btn.save,.btn.export-all,.btn.export-company,.btn.export-section{padding:.8rem 1.5rem;border:none;border-radius:12px;color:#fff;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:.5rem;transition:.3s;}
        .btn.back{background:#7c3aed;}
        .btn.save{background:#10b981;}
        .btn.export-all{background:#f59e0b;}
        .btn.export-company{background:#f59e0b;padding:.5rem .8rem;}
        .btn.export-section{background:#f59e0b;}
        .btn.back:hover,.btn.save:hover,.btn.export-all:hover,.btn.export-company:hover,.btn.export-section:hover{transform:translateY(-2px);box-shadow:0 5px 15px rgba(0,0,0,.2);}
        .company-buttons{display:flex;flex-wrap:wrap;gap:.8rem;margin-bottom:2rem;}
        .company-btn-container{display:flex;align-items:center;gap:.3rem;}
        .company-btn{padding:.9rem 1.4rem;border:none;border-radius:12px;background:#e0e7ff;color:#4f46e5;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:.5rem;transition:.3s;}
        .company-btn.active,.company-btn:hover{background:#c4b5fd;color:#1e1b4b;}
        .company-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:1rem;}
        .summary-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:1rem;}
        .company-section{margin-bottom:3rem;}
        .company-section h2{font-size:1.8rem;color:#1e3a8a;margin-bottom:.3rem;}
        .company-section h3{font-size:1.2rem;color:#4b5563;margin-bottom:1rem;}
        .table-container{max-height:60vh;overflow-y:auto;border-radius:12px;box-shadow:0 4px 10px rgba(0,0,0,.1);margin-bottom:1rem;}
        .table{width:100%;border-collapse:collapse;min-width:2600px;}
        .sticky-header{position:sticky;top:0;background:#5b7fdb;color:white;z-index:10;}
        .sticky-header th{padding:0.8rem;text-align:center;font-weight:600;border-bottom:2px solid #4a6bc7;}
        .table td{padding:0.4rem 0.6rem;text-align:center;border-bottom:1px solid #eee;}
        .sl-number{color:#7c3aed;font-weight:600;}
        .emp-name{color:#1e40af;font-weight:600;}
        .emp-id{color:#dc2626;font-weight:600;}
        .emp-designation{color:#059669;}
        .emp-doj{color:#7c2d12;}
        .salary-amount{color:#1e3a8a;font-weight:500;}
        .gross-salary{color:#1e3a8a;font-weight:700;}
        .days-count{color:#7c2d12;font-weight:500;}
        .absent-days{color:#dc2626;font-weight:500;}
        .deduction-amount{color:#dc2626;font-weight:500;}
        .total-deduction{color:#b91c1c;font-weight:600;}
        .tax-amount{color:#c2410c;font-weight:500;}
        .net-pay.positive{color:#059669;font-weight:700;}
        .net-pay.negative{color:#dc2626;font-weight:700;}
        .total-payable{color:#1e3a8a;font-weight:700;}
        .ot-hours{color:#6b7280;}
        .company-name{color:#1e40af;font-weight:600;}
        .employee-count{color:#7c3aed;font-weight:600;}
        .cash-amount{color:#059669;font-weight:500;}
        .addition-amount.positive{color:#059669;font-weight:500;}
        .addition-amount.negative{color:#dc2626;font-weight:500;}
        .grand-total-label{color:#1e3a8a;font-weight:700;}
        .grand-total-count{color:#7c3aed;font-weight:700;}
        .grand-total-gross{color:#1e3a8a;font-weight:700;}
        .grand-total-tax{color:#c2410c;font-weight:700;}
        .grand-total-deduction{color:#dc2626;font-weight:700;}
        .grand-total-advance{color:#b91c1c;font-weight:700;}
        .grand-total-cash{color:#059669;font-weight:700;}
        .grand-total-addition.positive{color:#059669;font-weight:700;}
        .grand-total-addition.negative{color:#dc2626;font-weight:700;}
        .grand-total-net.positive{color:#059669;font-weight:700;}
        .grand-total-net.negative{color:#dc2626;font-weight:700;}
        .grand-total-payable{color:#1e3a8a;font-weight:700;}
        .data-row:nth-child(even){background-color:#f8fafc;}
        .data-row:nth-child(odd){background-color:#ffffff;}
        .data-row:hover{background-color:#f1f5f9;}
        .summary-row{background-color:#f0f9ff !important;}
        .grand-total{background-color:#1e3a8a !important;color:white !important;}
        .grand-total td{color:white !important;font-weight:700;}
        .editable-input{width:70px;padding:4px 6px;border:1px solid #ddd;border-radius:6px;font-size:0.9rem;text-align:center;color:#1f2937;background:#fff;}
        .editable-input:focus{outline:none;border-color:#7c3aed;box-shadow:0 0 0 2px rgba(124,58,237,.2);}
        .days-input{border-color:#7c2d12;}
        .advance-input{border-color:#dc2626;}
        .addition-input{border-color:#059669;}
        .cash-input{border-color:#1e40af;}
        .remarks-input{border-color:#6b7280;}
        .footer{display:flex;justify-content:space-around;margin-top:1rem;font-size:.9rem;color:#4b5563;flex-wrap:wrap;gap:1rem;}
        .summary-section{margin-top:3rem;}
        .summary-section h2{font-size:1.8rem;color:#1e3a8a;margin-bottom:1rem;}
        @media(max-width:768px){
          .search-container{width:100%;}
          .search-input{padding-left:2.8rem;}
          .auto-date{font-size:0.9rem;padding:.4rem .8rem;}
          .table th,.table td{padding:.4rem .3rem;font-size:.8rem;}
          .editable-input{width:60px;font-size:0.8rem;}
          .company-header,.summary-header{flex-direction:column;align-items:flex-start;}
          .btn.export-section{margin-top:.5rem;}
        }
      `}</style>
    </div>
  );
};

export default SalaryFormat;
