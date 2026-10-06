// SalaryRecords.jsx - saved salary sheets per month, with corrections,
// Excel / pay-slip downloads and the monthly approval workflow.
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSave,
  FaFileExport,
  FaBuilding,
  FaUsers,
  FaExclamationTriangle,
  FaSync,
  FaFileExcel,
  FaFileAlt,
  FaChartLine,
  FaHistory,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaCalculator,
  FaUniversity,
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaUndo,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  CompanyChips,
  Stat,
  Field,
  formatMoney,
  downloadBlob,
  MONTH_NAMES,
} from "./finance/FinanceUI";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Helper function to safely convert to number
const toNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === "") return defaultValue;
  if (typeof value === "string" && value.trim() === "") return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const formatNumber = (num) => formatMoney(toNumber(num));
const round2 = (n) => Number((Number(n) || 0).toFixed(2));

// Same rule as the salary sheet: OT pay = basic (60% of gross) ÷ days in
// month ÷ work-day hours × OT hours. OT is entered in minutes.
const calculateOTPay = (monthlySalary, otMinutes, totalDaysInMonth, workDayHours = 10) => {
  if (!monthlySalary || !otMinutes || otMinutes <= 0 || !totalDaysInMonth) return 0;
  const basicSalary = monthlySalary * 0.6;
  const otHours = otMinutes / 60;
  const hourlyRate = basicSalary / totalDaysInMonth / workDayHours;
  return Number((hourlyRate * otHours).toFixed(2));
};

const EDITABLE_FIELDS = ["days_worked", "advance", "ot_hours", "addition", "cash_payment", "remarks"];

// Who may press each approval step (usernames, lower case).
const APPROVAL_STEPS = [
  {
    key: "hr_prepared",
    title: "Prepared by HR",
    users: ["lisa"],
    who: "Lisa",
  },
  {
    key: "finance_checked",
    title: "Checked by Finance & Accounts",
    users: ["zohaer"],
    who: "Zohaer",
    after: "hr_prepared",
  },
  {
    key: "director_checked",
    title: "Checked by Director",
    users: ["samad"],
    who: "Samad",
    after: "finance_checked",
  },
  {
    key: "proprietor_approved",
    title: "Approved by Proprietor / MD",
    users: ["ashikur1", "proprietor", "md"],
    who: "the Proprietor / MD",
    after: "director_checked",
  },
];

const SalaryRecords = () => {
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [openCompanies, setOpenCompanies] = useState({});
  // Only the fields the user changed, per employee.
  const [editableData, setEditableData] = useState({});
  const [error, setError] = useState(null);
  const [generatingExcel, setGeneratingExcel] = useState({});
  const [workDayHours, setWorkDayHours] = useState({});
  const [generatingPaySlip, setGeneratingPaySlip] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const navigate = useNavigate();

  const [companyApprovalStatus, setCompanyApprovalStatus] = useState({});
  const [currentUser, setCurrentUser] = useState("");
  const [approving, setApproving] = useState({});

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return salaryRecords;
    return salaryRecords.filter(
      (record) =>
        record.name?.toLowerCase().includes(term) ||
        record.employee_id?.toLowerCase().includes(term) ||
        record.company_name?.toLowerCase().includes(term) ||
        record.designation?.toLowerCase().includes(term),
    );
  }, [searchTerm, salaryRecords]);

  const grouped = useMemo(
    () =>
      filteredRecords.reduce((acc, record) => {
        const companyName = record.company_name || "Unknown Company";
        if (!acc[companyName]) acc[companyName] = [];
        acc[companyName].push(record);
        return acc;
      }, {}),
    [filteredRecords],
  );

  const companyNamesAll = useMemo(
    () => [...new Set(salaryRecords.map((r) => r.company_name || "Unknown Company"))],
    [salaryRecords],
  );

  useEffect(() => {
    const username = localStorage.getItem("username");
    setCurrentUser(username ? username.toLowerCase().trim() : "");
  }, []);

  const fetchSalaryRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await financeAPI.salaryRecords.getAllRecords({
        year: selectedYear,
        month: selectedMonth,
      });

      let records = [];
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            records = response.data.data || [];
          } else {
            setError(response.data.error || "Failed to load salary records");
          }
        } else if (Array.isArray(response.data)) {
          records = response.data;
        } else {
          records =
            response.data.records || response.data.salary_records || response.data.results || [];
        }
      }

      const initialWorkDayHours = {};
      records.forEach((record) => {
        const companyName = record.company_name || "Unknown Company";
        if (!initialWorkDayHours[companyName]) initialWorkDayHours[companyName] = 10;
      });

      setEditableData({});
      setWorkDayHours(initialWorkDayHours);
      setSalaryRecords(records);
    } catch (err) {
      console.error("Failed to fetch salary records:", err);
      if (err.response) {
        setError(`Server error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        setError("No response from server. Please check your internet connection.");
      } else {
        setError("Request error: " + err.message);
      }
      setSalaryRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const recordKey = (record) => record.id ?? `${record.employee_id}|${record.company_name}`;

  const isEdited = (record) => {
    const edits = editableData[recordKey(record)];
    return !!edits && Object.keys(edits).length > 0;
  };

  const editedCount = useMemo(
    () => Object.values(editableData).filter((e) => e && Object.keys(e).length > 0).length,
    [editableData],
  );

  // The value shown in an input: the user's edit, else the saved value.
  const getEditableValue = (record, field) => {
    const edits = editableData[recordKey(record)];
    if (edits && edits[field] !== undefined) return edits[field];
    const saved = record[field];
    if (field === "remarks") return saved || "";
    return toNumber(saved) ? toNumber(saved) : "";
  };

  const updateEditableField = (record, field, value) => {
    const key = recordKey(record);
    setEditableData((prev) => {
      const next = { ...(prev[key] || {}), [field]: value };

      // OT minutes changed: swap the old OT pay inside Addition for the new one.
      if (field === "ot_hours") {
        const companyName = record.company_name || "Unknown Company";
        const hours = workDayHours[companyName] || 10;
        const gross = toNumber(record.gross_salary);
        const totalDays = toNumber(record.total_days) || 31;
        const oldOtPay =
          prev[key]?.ot_pay !== undefined ? toNumber(prev[key].ot_pay) : toNumber(record.ot_pay);
        const baseAddition =
          prev[key]?.addition !== undefined ? toNumber(prev[key].addition) : toNumber(record.addition);
        const otPay = calculateOTPay(gross, toNumber(value), totalDays, hours);
        next.ot_pay = otPay;
        next.addition = round2(baseAddition - oldOtPay + otPay);
      }

      return { ...prev, [key]: next };
    });
  };

  const discardRow = (record) => {
    setEditableData((prev) => {
      const next = { ...prev };
      delete next[recordKey(record)];
      return next;
    });
  };

  // Figures for one record. Unchanged rows show exactly what was saved.
  // Edited rows are recalculated with the salary sheet's formula, keeping
  // the unpaid-leave days that were part of the saved absent days.
  const calculateDerivedValues = (record) => {
    const edits = editableData[recordKey(record)] || {};
    const saved = {
      daysWorked: toNumber(record.days_worked),
      absentDays: toNumber(record.absent_days),
      absentDeduction: toNumber(record.absent_ded),
      advance: toNumber(record.advance),
      ait: toNumber(record.ait),
      totalDeduction: toNumber(record.total_ded),
      otHours: toNumber(record.ot_hours),
      otPay: toNumber(record.ot_pay),
      addition: toNumber(record.addition),
      cashPayment: toNumber(record.cash_payment),
      netPayBank: toNumber(record.net_pay_bank),
      totalPayable: toNumber(record.total_payable),
    };
    const base = {
      grossSalary: toNumber(record.gross_salary),
      basic: toNumber(record.basic),
      houseRent: toNumber(record.house_rent),
      medical: toNumber(record.medical),
      conveyance: toNumber(record.conveyance),
      cashSalary: toNumber(record.cash_salary),
      totalDays: toNumber(record.total_days) || 31,
    };

    const changed = ["days_worked", "advance", "ot_hours", "addition", "cash_payment"].some(
      (f) => edits[f] !== undefined,
    );
    if (!changed) return { ...base, ...saved, edited: Object.keys(edits).length > 0 };

    const pick = (field, fallback) => (edits[field] !== undefined ? toNumber(edits[field]) : fallback);
    const daysWorked = pick("days_worked", saved.daysWorked) || base.totalDays;
    const advance = pick("advance", saved.advance);
    const otHours = pick("ot_hours", saved.otHours);
    const addition = pick("addition", saved.addition);
    const cashPayment = pick("cash_payment", saved.cashPayment);
    const otPay = edits.ot_pay !== undefined ? toNumber(edits.ot_pay) : saved.otPay;

    const unpaidLeaveDays = Math.max(
      0,
      saved.absentDays - Math.max(0, base.totalDays - saved.daysWorked),
    );
    const absentDays = Math.max(0, base.totalDays - daysWorked) + unpaidLeaveDays;
    const dailyBasic = round2(base.basic / 30);
    const absentDeduction = round2(dailyBasic * absentDays);
    const totalDeduction = round2(saved.ait + advance + absentDeduction);
    const netPayBank = round2(
      (base.grossSalary / base.totalDays) * daysWorked - cashPayment - totalDeduction + addition,
    );
    const totalPayable = round2(netPayBank + cashPayment + saved.ait + base.cashSalary);

    return {
      ...base,
      daysWorked,
      absentDays,
      absentDeduction,
      advance,
      ait: saved.ait,
      totalDeduction,
      otHours,
      otPay,
      addition,
      cashPayment,
      netPayBank,
      totalPayable,
      edited: true,
    };
  };

  const loadApprovalStatus = async (companyName = "All Companies") => {
    try {
      const response = await financeAPI.approval.getApprovalStatus({
        company_name: companyName,
        month: selectedMonth,
        year: selectedYear,
      });
      setCompanyApprovalStatus((prev) => ({
        ...prev,
        [companyName]: {
          hr_prepared: response.data.hr_prepared || false,
          finance_checked: response.data.finance_checked || false,
          director_checked: response.data.director_checked || false,
          proprietor_approved: response.data.proprietor_approved || false,
          month: selectedMonth,
          year: selectedYear,
          loaded: true,
        },
      }));
    } catch (err) {
      console.error(`Failed to load approval status for ${companyName}:`, err);
      setCompanyApprovalStatus((prev) => ({
        ...prev,
        [companyName]: {
          hr_prepared: false,
          finance_checked: false,
          director_checked: false,
          proprietor_approved: false,
          month: selectedMonth,
          year: selectedYear,
          loaded: true,
        },
      }));
    }
  };

  useEffect(() => {
    fetchSalaryRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth]);

  // Approval status per company, once per loaded month (not per keystroke).
  useEffect(() => {
    setCompanyApprovalStatus({});
    companyNamesAll.forEach((companyName) => loadApprovalStatus(companyName));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyNamesAll]);

  const stepState = (step, companyName) => {
    const status = companyApprovalStatus[companyName] || {};
    if (status[step.key]) return "done";
    const allowedUser = step.users.includes(currentUser);
    const previousDone = !step.after || status[step.after];
    return allowedUser && previousDone ? "ready" : "locked";
  };

  const stepHint = (step, companyName) => {
    const status = companyApprovalStatus[companyName] || {};
    if (status[step.key]) return "Completed";
    if (step.after && !status[step.after]) {
      const prev = APPROVAL_STEPS.find((s) => s.key === step.after);
      return `Waiting for ${prev.who}`;
    }
    return step.users.includes(currentUser) ? "Click to confirm" : `Only ${step.who}`;
  };

  const isButtonEnabled = (buttonStep, companyName) => {
    const step = APPROVAL_STEPS.find((s) => s.key === buttonStep);
    return !!step && stepState(step, companyName) === "ready";
  };

  const handleApprovalStep = async (step, companyName) => {
    if (!isButtonEnabled(step, companyName)) return;
    const stepInfo = APPROVAL_STEPS.find((s) => s.key === step);
    if (
      !window.confirm(
        `Confirm "${stepInfo.title}" for ${companyName} — ${monthLabel}?\n\nAn approval email will be sent.`,
      )
    ) {
      return;
    }

    setApproving((prev) => ({ ...prev, [`${companyName}|${step}`]: true }));
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
        setNotice({ tone: "success", text: `Email sent. ${response.data.message || ""}` });
        await loadApprovalStatus(companyName);
      } else {
        setNotice({ tone: "danger", text: `Failed: ${response.data.message}` });
      }
    } catch (err) {
      console.error("Approval step failed:", err);
      setNotice({ tone: "danger", text: "Connection error. Please try again." });
    } finally {
      setApproving((prev) => ({ ...prev, [`${companyName}|${step}`]: false }));
    }
  };

  const toggleCompany = (comp) => setOpenCompanies((prev) => ({ ...prev, [comp]: !prev[comp] }));

  const showAllCompanies = () => {
    const allOpen = {};
    Object.keys(grouped).forEach((comp) => {
      allOpen[comp] = true;
    });
    setOpenCompanies(allOpen);
  };

  const hideAllCompanies = () => setOpenCompanies({});

  // Save the rows that were changed (all companies, whatever the search).
  const saveData = async () => {
    const changedRecords = salaryRecords.filter(isEdited);
    if (changedRecords.length === 0) {
      setNotice({ tone: "info", text: "Nothing to save — no rows were changed." });
      return;
    }
    if (
      !window.confirm(
        `Save changes to ${changedRecords.length} salary record${changedRecords.length === 1 ? "" : "s"} for ${monthLabel}?`,
      )
    ) {
      return;
    }

    const payload = changedRecords.map((record) => {
      const empId = record.employee_id?.trim();
      const calculated = calculateDerivedValues(record);
      const edits = editableData[recordKey(record)] || {};
      const companyName = record.company_name || "Unknown Company";

      return {
        sl: record.sl || 0,
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
        remarks: edits.remarks !== undefined ? edits.remarks : record.remarks || "",
        month: selectedMonth,
        year: selectedYear,
        company_name: companyName,
        work_day_hours: workDayHours[companyName] || 10,
      };
    });

    setSaving(true);
    try {
      const res = await financeAPI.salary.saveSalary(payload);
      const saved = res.data.saved || 0;
      const errors = res.data.errors || [];

      if (errors.length > 0) {
        console.warn("Save errors:", errors);
        setNotice({
          tone: "warning",
          text: `Saved ${saved}, but ${errors.length} failed. Check the browser console for details.`,
        });
      } else {
        setNotice({ tone: "success", text: `Saved ${saved} updated record${saved === 1 ? "" : "s"}.` });
        fetchSalaryRecords();
      }
    } catch (e) {
      console.error("Save failed:", e.response?.data || e);
      setNotice({ tone: "danger", text: "Save failed. Nothing was saved — please try again." });
    } finally {
      setSaving(false);
    }
  };

  const errorText = async (err, fallback) => {
    const data = err.response?.data;
    if (!data) return err.message || fallback;
    try {
      if (data instanceof Blob) {
        const text = await data.text();
        try {
          const json = JSON.parse(text);
          return json.error || json.message || fallback;
        } catch {
          return text || fallback;
        }
      }
      if (typeof data === "string") return data;
      return data.error || data.message || fallback;
    } catch {
      return fallback;
    }
  };

  const generateSalarySheetForCompany = async (companyName) => {
    const key = `sheet_${companyName}`;
    try {
      setGeneratingExcel((prev) => ({ ...prev, [key]: true }));
      const response = await financeAPI.salaryRecords.generateSalarySheetExcel({
        company_name: companyName,
        month: selectedMonth,
        year: selectedYear,
      });
      downloadBlob(
        response.data,
        `${companyName.replace(/\s+/g, "_")}_Salary_Sheet_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`,
      );
      setNotice({ tone: "success", text: `Salary sheet downloaded for ${companyName}.` });
    } catch (err) {
      console.error("Error generating Salary Sheet Excel file:", err);
      setNotice({
        tone: "danger",
        text: `Failed to generate the salary sheet for ${companyName}: ${await errorText(err, "unknown error")}`,
      });
    } finally {
      setGeneratingExcel((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Bank transfer / salary records Excel from the backend
  const generateExcelForCompany = async (companyName) => {
    const key = `excel_${companyName}`;
    try {
      setGeneratingExcel((prev) => ({ ...prev, [key]: true }));
      const response = await financeAPI.salaryRecords.generateExcelNow({
        company_name: companyName,
        month: selectedMonth,
        year: selectedYear,
      });
      downloadBlob(
        response.data,
        `${companyName.replace(/\s+/g, "_")}_Salary_Records_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`,
      );
      setNotice({ tone: "success", text: `Excel file downloaded for ${companyName}.` });
    } catch (err) {
      console.error("Error generating Excel file:", err);
      setNotice({
        tone: "danger",
        text: `Failed to generate the Excel file for ${companyName}: ${await errorText(err, "unknown error")}`,
      });
    } finally {
      setGeneratingExcel((prev) => ({ ...prev, [key]: false }));
    }
  };

  const generatePaySlipForCompany = async (companyName) => {
    try {
      setGeneratingPaySlip((prev) => ({ ...prev, [companyName]: true }));
      const response = await financeAPI.salaryRecords.generatePaySlipForCompany({
        company_name: String(companyName).trim(),
        month: Number(selectedMonth),
        year: Number(selectedYear),
      });
      if (!response || !response.data) throw new Error("No data received from server");

      const safeCompanyName = companyName.replace(/[^a-z0-9]/gi, "_");
      downloadBlob(
        response.data,
        `${safeCompanyName}_Pay_Slips_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`,
        XLSX_TYPE,
      );
      setNotice({ tone: "success", text: `Pay slips downloaded for ${companyName}.` });
    } catch (err) {
      console.error("Error generating Pay Slip:", err);
      setNotice({
        tone: "danger",
        text: `Failed to generate pay slips for ${companyName}: ${await errorText(err, "unknown error")}`,
      });
    } finally {
      setGeneratingPaySlip((prev) => ({ ...prev, [companyName]: false }));
    }
  };

  const generateAllPaySlips = async () => {
    if (Object.keys(grouped).length === 0) {
      setNotice({ tone: "warning", text: "No company data to generate pay slips." });
      return;
    }

    try {
      setGeneratingPaySlip((prev) => ({ ...prev, all_companies: true }));
      const response = await financeAPI.salaryRecords.generateAllPaySlipsExcel({
        month: Number(selectedMonth),
        year: Number(selectedYear),
      });
      if (!response || !response.data) throw new Error("No data received from server");

      downloadBlob(
        response.data,
        `ALL_COMPANIES_PAY_SLIPS_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`,
        XLSX_TYPE,
      );
      setNotice({ tone: "success", text: "Pay slips for all companies downloaded." });
    } catch (err) {
      console.error("Error generating All Companies Pay Slips:", err);
      const message = await errorText(err, "Failed to generate all companies pay slips.");
      const useFallback = window.confirm(
        `Consolidated generation failed: ${message}\n\nGenerate a separate file for each company instead?`,
      );
      if (useFallback) {
        Object.keys(grouped).forEach((name, i) => {
          setTimeout(() => generatePaySlipForCompany(name), i * 1000);
        });
      }
    } finally {
      setGeneratingPaySlip((prev) => ({ ...prev, all_companies: false }));
    }
  };

  const exportAllCompaniesSingleFile = async () => {
    if (Object.keys(grouped).length === 0) {
      setNotice({ tone: "warning", text: "No company data to export." });
      return;
    }

    try {
      setGeneratingExcel((prev) => ({ ...prev, all_companies: true }));
      const response = await financeAPI.salaryRecords.generateAllCompaniesExcel({
        month: selectedMonth,
        year: selectedYear,
      });
      downloadBlob(
        response.data,
        `ALL_COMPANIES_SALARY_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`,
        XLSX_TYPE,
      );
      setNotice({
        tone: "success",
        text: `Exported ${Object.keys(grouped).length} companies to a single Excel file.`,
      });
    } catch (err) {
      console.error("Export all companies error:", err);
      const message = await errorText(err, "Failed to export Excel file.");
      const useFallback = window.confirm(
        `Server export failed: ${message}\n\nCreate the file in the browser instead? (simpler formatting)`,
      );
      if (useFallback) await exportAllCompaniesFrontendFallback();
    } finally {
      setGeneratingExcel((prev) => ({ ...prev, all_companies: false }));
    }
  };

  // Browser-side export, used when the server export fails
  const exportAllCompaniesFrontendFallback = async () => {
    try {
      const wb = XLSX.utils.book_new();
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
        "OT Minutes",
        "OT Pay",
        "Addition",
        "Cash Payment",
        "Cash Salary",
        "Net Pay (Bank)",
        "Total Payable",
        "Bank Account",
        "Branch Name",
        "Remarks",
        "Work Day Hours",
      ];

      Object.keys(grouped).forEach((companyName, companyIndex) => {
        const records = grouped[companyName];
        const rows = records.map((record, idx) => {
          const c = calculateDerivedValues(record);
          return [
            idx + 1,
            record.name || "",
            record.employee_id || "",
            record.designation || "",
            record.doj || "",
            c.basic,
            c.houseRent,
            c.medical,
            c.conveyance,
            c.grossSalary,
            record.total_days || 0,
            c.daysWorked,
            c.absentDays,
            c.absentDeduction,
            c.advance,
            c.ait,
            c.totalDeduction,
            c.otHours,
            c.otPay,
            c.addition,
            c.cashPayment,
            c.cashSalary,
            c.netPayBank,
            c.totalPayable,
            record.bank_account || "",
            record.branch_name || "",
            getEditableValue(record, "remarks") || "",
            workDayHours[companyName] || 10,
          ];
        });

        const ws = XLSX.utils.aoa_to_sheet([
          [`${companyName} - SALARY SHEET`],
          [`Month: ${monthLabel}`],
          [`Total Employees: ${records.length}`],
          [""],
          headers,
          ...rows,
        ]);
        ws["!cols"] = headers.map((_, i) => ({
          wch: Math.min(
            Math.max(
              ...rows.map((row) => (row[i] != null ? String(row[i]).length : 0)),
              String(headers[i]).length,
            ) + 2,
            35,
          ),
        }));

        let sheetName = companyName.substring(0, 31);
        if (wb.SheetNames.includes(sheetName)) {
          sheetName = `${companyName.substring(0, 28)}_${companyIndex + 1}`;
        }
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      const summaryRows = Object.keys(grouped).map((companyName, idx) => {
        const totals = sumUp(grouped[companyName]);
        return [
          idx + 1,
          companyName,
          grouped[companyName].length,
          totals.gross,
          totals.ait,
          totals.netBank,
          totals.totalPay,
        ];
      });
      const all = sumUp(filteredRecords);
      const summaryWs = XLSX.utils.aoa_to_sheet([
        ["MONTHLY SALARY SUMMARY"],
        [`Month: ${monthLabel}`],
        [`Generated: ${new Date().toLocaleString()}`],
        [""],
        ["SL", "Company", "Employees", "Gross Salary", "AIT", "Net Pay (Bank)", "Total Payable"],
        ...summaryRows,
        [""],
        ["GRAND TOTAL", "", filteredRecords.length, all.gross, all.ait, all.netBank, all.totalPay],
      ]);
      summaryWs["!cols"] = [5, 35, 12, 15, 12, 15, 15].map((wch) => ({ wch }));
      XLSX.utils.book_append_sheet(wb, summaryWs, "SUMMARY");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([excelBuffer], { type: "application/octet-stream" }),
        `ALL_COMPANIES_SALARY_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}_BROWSER.xlsx`,
      );
      setNotice({
        tone: "success",
        text: `Exported ${Object.keys(grouped).length} companies to a single Excel file.`,
      });
    } catch (err) {
      console.error("Frontend export error:", err);
      setNotice({ tone: "danger", text: `Export failed: ${err.message}` });
    }
  };

  const sumUp = (records) =>
    records.reduce(
      (acc, record) => {
        const c = calculateDerivedValues(record);
        acc.gross += c.grossSalary;
        acc.ait += c.ait;
        acc.netBank += c.netPayBank;
        acc.totalPay += c.totalPayable;
        acc.absentDed += c.absentDeduction;
        acc.advance += c.advance;
        acc.totalDed += c.totalDeduction;
        acc.addition += c.addition;
        acc.cash += c.cashPayment;
        acc.cashSalary += c.cashSalary;
        return acc;
      },
      {
        gross: 0,
        ait: 0,
        netBank: 0,
        totalPay: 0,
        absentDed: 0,
        advance: 0,
        totalDed: 0,
        addition: 0,
        cash: 0,
        cashSalary: 0,
      },
    );

  const renderApprovalFooter = (companyName) => (
    <div className="fin-steps">
      {APPROVAL_STEPS.map((step, i) => {
        const state = stepState(step, companyName);
        const busy = approving[`${companyName}|${step.key}`];
        return (
          <button
            key={step.key}
            type="button"
            className={`fin-step fin-step--${state}`}
            onClick={() => handleApprovalStep(step.key, companyName)}
            disabled={state !== "ready" || busy}
            title={stepHint(step, companyName)}
          >
            <span className="fin-step-num">
              {state === "done" ? <FaCheck /> : busy ? <span className="fin-spinner fin-spinner--sm" /> : i + 1}
            </span>
            <span className="fin-step-text">
              <span className="fin-step-title">{step.title}</span>
              <span className="fin-step-sub">{stepHint(step, companyName)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  const grand = sumUp(filteredRecords);
  const companyNames = Object.keys(grouped);
  const isCurrentMonth =
    selectedMonth === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear();

  return (
    <FinanceShell
      title="Salary Records"
      icon={<FaHistory />}
      meta={
        <Badge tone="primary" className="fin-badge--lg">
          {monthLabel}
        </Badge>
      }
      subtitle="Saved salary sheets. Correct a value, download Excel files and pay slips, and approve the month."
      actions={
        <>
          <button onClick={() => navigate("/salary-comparison")} className="fin-btn" title="Compare salaries between two months">
            <FaChartLine /> Compare Months
          </button>
          <button
            onClick={generateAllPaySlips}
            className="fin-btn"
            disabled={companyNames.length === 0 || generatingPaySlip.all_companies}
            title="Pay slips for all companies in one Excel file"
          >
            <FaFileAlt /> {generatingPaySlip.all_companies ? "Generating…" : "All Pay Slips"}
          </button>
          <button
            onClick={exportAllCompaniesSingleFile}
            className="fin-btn"
            disabled={companyNames.length === 0 || generatingExcel.all_companies}
          >
            <FaFileExport /> {generatingExcel.all_companies ? "Exporting…" : "Download All Companies"}
          </button>
          <button
            className="fin-btn fin-btn--primary"
            onClick={saveData}
            disabled={editedCount === 0 || saving}
            title={editedCount ? `Save ${editedCount} changed row(s)` : "Change a value to enable saving"}
          >
            <FaSave /> {saving ? "Saving…" : `Save Updates${editedCount ? ` (${editedCount})` : ""}`}
          </button>
        </>
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

        <Card>
          <div className="fin-toolbar">
            <Field label="Month">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="fin-select"
                disabled={editedCount > 0}
                title={editedCount > 0 ? "Save or discard your changes first" : undefined}
              >
                {MONTH_NAMES.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Year">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="fin-select"
                disabled={editedCount > 0}
                title={editedCount > 0 ? "Save or discard your changes first" : undefined}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Search">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Name, ID, company or designation…"
              />
            </Field>
            <span className="fin-spacer" />
            {editedCount > 0 && (
              <button className="fin-btn fin-btn--danger" onClick={() => setEditableData({})}>
                <FaUndo /> Discard changes
              </button>
            )}
            <button className="fin-btn" onClick={fetchSalaryRecords} disabled={loading}>
              <FaSync className={loading ? "fin-spin" : ""} /> Refresh
            </button>
          </div>
        </Card>

        {error && (
          <Alert
            tone="danger"
            title="Error loading data"
            action={
              <button onClick={fetchSalaryRecords} className="fin-btn fin-btn--sm">
                <FaSync /> Retry
              </button>
            }
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Card>
            <LoadingState title={`Loading ${monthLabel}…`} />
          </Card>
        ) : (
          <>
            {salaryRecords.length > 0 && (
              <div className="fin-kpis">
                <Kpi
                  tone="primary"
                  icon={<FaUsers />}
                  label="Employees"
                  value={filteredRecords.length}
                  hint={`${companyNames.length} companies`}
                />
                <Kpi icon={<FaMoneyBillWave />} label="Gross salary" value={formatNumber(grand.gross)} />
                <Kpi tone="warning" icon={<FaCalculator />} label="AIT deducted" value={formatNumber(grand.ait)} />
                <Kpi
                  tone="success"
                  icon={<FaUniversity />}
                  label="Net pay (bank)"
                  value={formatNumber(grand.netBank)}
                  hint={`Total payable ${formatNumber(grand.totalPay)}`}
                />
              </div>
            )}

            {companyNames.length > 0 && (
              <Card
                title={
                  <>
                    <FaBuilding /> Companies
                  </>
                }
                subtitle="Open a company to see its records, downloads and approvals."
                actions={
                  <>
                    <button onClick={showAllCompanies} className="fin-btn fin-btn--sm">
                      <FaEye /> Show all
                    </button>
                    <button onClick={hideAllCompanies} className="fin-btn fin-btn--sm">
                      <FaEyeSlash /> Hide all
                    </button>
                  </>
                }
              >
                <CompanyChips
                  companies={companyNames.map((name) => ({ name, count: grouped[name].length }))}
                  open={openCompanies}
                  onToggle={toggleCompany}
                  tag={(name) => {
                    const s = companyApprovalStatus[name];
                    return s?.proprietor_approved ? "Approved" : null;
                  }}
                />
              </Card>
            )}

            {companyNames.map((comp) => {
              const records = grouped[comp];
              if (!openCompanies[comp]) return null;
              const totals = sumUp(records);

              return (
                <Card
                  key={comp}
                  flush
                  title={comp}
                  subtitle={`Salary records for ${monthLabel} · ${records.length} employees`}
                  actions={
                    <>
                      <label className="fin-row" style={{ gap: 6 }}>
                        <span className="fin-label">OT work day</span>
                        <select
                          value={workDayHours[comp] || 10}
                          onChange={(e) =>
                            setWorkDayHours((prev) => ({ ...prev, [comp]: Number(e.target.value) }))
                          }
                          className="fin-select"
                          style={{ height: 30 }}
                        >
                          <option value={10}>10 hours/day</option>
                          <option value={8}>8 hours/day</option>
                        </select>
                      </label>
                      <button
                        onClick={() => generateExcelForCompany(comp)}
                        className="fin-btn fin-btn--sm"
                        disabled={generatingExcel[`excel_${comp}`]}
                      >
                        <FaFileExcel /> {generatingExcel[`excel_${comp}`] ? "Generating…" : "Generate Excel"}
                      </button>
                      <button
                        onClick={() => generateSalarySheetForCompany(comp)}
                        className="fin-btn fin-btn--sm"
                        disabled={generatingExcel[`sheet_${comp}`]}
                      >
                        <FaFileExport /> {generatingExcel[`sheet_${comp}`] ? "Generating…" : "Salary Sheet"}
                      </button>
                      <button
                        onClick={() => generatePaySlipForCompany(comp)}
                        className="fin-btn fin-btn--sm"
                        disabled={generatingPaySlip[comp]}
                      >
                        <FaFileAlt /> {generatingPaySlip[comp] ? "Generating…" : "Pay Slips"}
                      </button>
                    </>
                  }
                  footer={
                    <div className="fin-stack" style={{ gap: 12 }}>
                      <div className="fin-stats">
                        <Stat label="Employees" value={records.length} />
                        <Stat label="Gross salary" value={formatNumber(totals.gross)} />
                        <Stat label="AIT" value={formatNumber(totals.ait)} />
                        <Stat label="Net pay (bank)" value={formatNumber(totals.netBank)} highlight />
                        <Stat label="Total payable" value={formatNumber(totals.totalPay)} highlight />
                      </div>
                      {renderApprovalFooter(comp)}
                    </div>
                  }
                >
                  <div className="fin-table-wrap">
                    <table className="fin-table">
                      <thead>
                        <tr>
                          <th className="fin-sticky" style={{ left: 0, minWidth: 48 }}>SL</th>
                          <th className="fin-sticky fin-sticky-edge" style={{ left: 48 }}>Name</th>
                          <th>ID</th>
                          <th>Designation</th>
                          <th>DOJ</th>
                          <th className="num">Basic</th>
                          <th className="num">House Rent</th>
                          <th className="num">Medical</th>
                          <th className="num">Conveyance</th>
                          <th className="num">Gross Salary</th>
                          <th className="num">Total Days</th>
                          <th className="num">Days Worked</th>
                          <th className="num">Absent Days</th>
                          <th className="num">Absent Ded.</th>
                          <th className="num">Advance</th>
                          <th className="num">AIT</th>
                          <th className="num">Total Ded.</th>
                          <th className="num">OT Min</th>
                          <th className="num">OT Pay</th>
                          <th className="num">Addition</th>
                          <th className="num">Cash Payment</th>
                          <th className="num">Cash Salary</th>
                          <th className="num">Net Pay (Bank)</th>
                          <th className="num">Total Payable</th>
                          <th>Bank Account</th>
                          <th>Branch Name</th>
                          <th>Remarks</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record, idx) => {
                          const c = calculateDerivedValues(record);
                          const edited = isEdited(record);

                          return (
                            <tr key={recordKey(record)} className={edited ? "fin-row-expanded" : ""}>
                              <td className="fin-sticky muted" style={{ left: 0, minWidth: 48 }}>
                                {idx + 1}
                              </td>
                              <td className="fin-sticky fin-sticky-edge fin-col-name" style={{ left: 48 }}>
                                {record.name}
                                {edited && <div className="fin-cell-note fin-cell-note--warning">Unsaved changes</div>}
                              </td>
                              <td className="fin-col-id">{record.employee_id}</td>
                              <td className="muted">{record.designation}</td>
                              <td className="muted">{record.doj}</td>
                              <td className="num">{formatNumber(c.basic)}</td>
                              <td className="num">{formatNumber(c.houseRent)}</td>
                              <td className="num">{formatNumber(c.medical)}</td>
                              <td className="num">{formatNumber(c.conveyance)}</td>
                              <td className="num strong">{formatNumber(c.grossSalary)}</td>
                              <td className="num muted">{record.total_days || 0}</td>
                              <td className="num">
                                <input
                                  type="number"
                                  value={getEditableValue(record, "days_worked")}
                                  placeholder={record.days_worked || record.total_days || 0}
                                  onChange={(e) => updateEditableField(record, "days_worked", e.target.value)}
                                  className="fin-cell-input fin-cell-input--sm"
                                  min="0"
                                  max={record.total_days || 31}
                                  aria-label={`Days worked, ${record.name}`}
                                />
                              </td>
                              <td className="num">{c.absentDays}</td>
                              <td className={`num ${c.absentDeduction ? "text-neg" : "muted"}`}>
                                {formatNumber(c.absentDeduction)}
                              </td>
                              <td className="num">
                                <input
                                  type="number"
                                  value={getEditableValue(record, "advance")}
                                  placeholder="0"
                                  onChange={(e) => updateEditableField(record, "advance", e.target.value)}
                                  className="fin-cell-input"
                                  min="0"
                                  aria-label={`Advance, ${record.name}`}
                                />
                              </td>
                              <td className="num">{formatNumber(c.ait)}</td>
                              <td className="num text-neg">{formatNumber(c.totalDeduction)}</td>
                              <td className="num">
                                <input
                                  type="number"
                                  value={getEditableValue(record, "ot_hours")}
                                  placeholder="Min"
                                  onChange={(e) => updateEditableField(record, "ot_hours", e.target.value)}
                                  className="fin-cell-input fin-cell-input--sm"
                                  min="0"
                                  step="1"
                                  title="Enter OT in minutes (60 = 1 hour, 120 = 2 hours)"
                                  aria-label={`OT minutes, ${record.name}`}
                                />
                              </td>
                              <td className="num">{formatNumber(c.otPay)}</td>
                              <td className="num">
                                <input
                                  type="number"
                                  value={getEditableValue(record, "addition")}
                                  placeholder="0"
                                  onChange={(e) => updateEditableField(record, "addition", e.target.value)}
                                  className="fin-cell-input"
                                  title="Includes OT pay"
                                  aria-label={`Addition, ${record.name}`}
                                />
                              </td>
                              <td className="num">
                                <input
                                  type="number"
                                  value={getEditableValue(record, "cash_payment")}
                                  placeholder="0"
                                  onChange={(e) => updateEditableField(record, "cash_payment", e.target.value)}
                                  className="fin-cell-input"
                                  min="0"
                                  aria-label={`Cash payment, ${record.name}`}
                                />
                              </td>
                              <td className="num">{formatNumber(c.cashSalary)}</td>
                              <td className={`num strong ${c.netPayBank < 0 ? "text-neg" : "text-pos"}`}>
                                {formatNumber(c.netPayBank)}
                              </td>
                              <td className="num strong">{formatNumber(c.totalPayable)}</td>
                              <td className="fin-col-id">{record.bank_account || "N/A"}</td>
                              <td className="muted">{record.branch_name || "N/A"}</td>
                              <td>
                                <input
                                  type="text"
                                  value={getEditableValue(record, "remarks")}
                                  placeholder="Remarks"
                                  onChange={(e) => updateEditableField(record, "remarks", e.target.value)}
                                  className="fin-cell-input fin-cell-input--text"
                                  aria-label={`Remarks, ${record.name}`}
                                />
                              </td>
                              <td>
                                {edited && (
                                  <button
                                    type="button"
                                    className="fin-edit-btn"
                                    title="Discard this row's changes"
                                    onClick={() => discardRow(record)}
                                  >
                                    <FaUndo />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className="fin-sticky" style={{ left: 0, minWidth: 48 }} />
                          <td className="fin-sticky fin-sticky-edge" style={{ left: 48 }}>
                            Total ({records.length})
                          </td>
                          <td colSpan={7} />
                          <td className="num">{formatNumber(totals.gross)}</td>
                          <td colSpan={3} />
                          <td className="num">{formatNumber(totals.absentDed)}</td>
                          <td className="num">{formatNumber(totals.advance)}</td>
                          <td className="num">{formatNumber(totals.ait)}</td>
                          <td className="num">{formatNumber(totals.totalDed)}</td>
                          <td colSpan={2} />
                          <td className="num">{formatNumber(totals.addition)}</td>
                          <td className="num">{formatNumber(totals.cash)}</td>
                          <td className="num">{formatNumber(totals.cashSalary)}</td>
                          <td className="num">{formatNumber(totals.netBank)}</td>
                          <td className="num">{formatNumber(totals.totalPay)}</td>
                          <td colSpan={4} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Card>
              );
            })}

            {Object.keys(openCompanies).every((comp) => !openCompanies[comp]) &&
              filteredRecords.length > 0 && (
                <Card
                  flush
                  title={
                    <>
                      <FaUsers /> Summary by company
                    </>
                  }
                  subtitle={monthLabel}
                >
                  <div className="fin-table-wrap fin-table-wrap--auto">
                    <table className="fin-table">
                      <thead>
                        <tr>
                          <th>SL</th>
                          <th>Company</th>
                          <th className="num">Employees</th>
                          <th className="num">Gross Salary</th>
                          <th className="num">AIT</th>
                          <th className="num">Net Pay (Bank)</th>
                          <th className="num">Total Payable</th>
                          <th className="center">Approval</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyNames.map((comp, i) => {
                          const summary = sumUp(grouped[comp]);
                          const status = companyApprovalStatus[comp] || {};
                          const doneSteps = APPROVAL_STEPS.filter((s) => status[s.key]).length;
                          return (
                            <tr
                              key={comp}
                              className="fin-row-clickable"
                              onClick={() => toggleCompany(comp)}
                              title="Open this company"
                            >
                              <td className="muted">{i + 1}</td>
                              <td className="fin-col-name">{comp}</td>
                              <td className="num">{grouped[comp].length}</td>
                              <td className="num">{formatNumber(summary.gross)}</td>
                              <td className="num">{formatNumber(summary.ait)}</td>
                              <td className={`num strong ${summary.netBank < 0 ? "text-neg" : ""}`}>
                                {formatNumber(summary.netBank)}
                              </td>
                              <td className="num strong">{formatNumber(summary.totalPay)}</td>
                              <td className="center">
                                <Badge tone={doneSteps === 4 ? "success" : doneSteps ? "warning" : undefined}>
                                  {doneSteps === 4 ? "Approved" : `${doneSteps} / 4 steps`}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2}>Grand Total</td>
                          <td className="num">{filteredRecords.length}</td>
                          <td className="num">{formatNumber(grand.gross)}</td>
                          <td className="num">{formatNumber(grand.ait)}</td>
                          <td className={`num ${grand.netBank < 0 ? "text-neg" : ""}`}>
                            {formatNumber(grand.netBank)}
                          </td>
                          <td className="num">{formatNumber(grand.totalPay)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Card>
              )}

            {filteredRecords.length === 0 && !error && (
              <Card>
                <EmptyState
                  icon={<FaExclamationTriangle />}
                  title={salaryRecords.length ? "No records match your search" : "No salary records found"}
                  action={
                    !salaryRecords.length && (
                      <button onClick={() => navigate("/salary-format")} className="fin-btn fin-btn--primary">
                        <FaFileInvoiceDollar /> Go to Salary Sheet
                      </button>
                    )
                  }
                >
                  {salaryRecords.length
                    ? "Try a different name, ID or company."
                    : isCurrentMonth
                      ? `Nothing saved for ${monthLabel} yet. Create it on the Salary Sheet page.`
                      : `Nothing saved for ${monthLabel}. Try a different month or year.`}
                </EmptyState>
              </Card>
            )}
          </>
        )}
      </div>
    </FinanceShell>
  );
};

export default SalaryRecords;
