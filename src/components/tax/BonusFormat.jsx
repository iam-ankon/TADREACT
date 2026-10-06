// BonusFormat.jsx - festival / performance bonus sheet for all companies.
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSave,
  FaBuilding,
  FaUsers,
  FaCalculator,
  FaGift,
  FaCheckCircle,
  FaClock,
  FaMoneyBillWave,
  FaArchive,
  FaFileExcel,
  FaEye,
  FaEyeSlash,
  FaPercent,
} from "react-icons/fa";
import * as XLSX from "xlsx";

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
  MONTH_NAMES,
} from "./finance/FinanceUI";

// Keep in step with tax_calculator/bonus.py COMPANY_BONUS_PERCENTAGES.
const COMPANY_BONUS_PERCENTAGES = {
  "TAD LOGISTIC LTD": 60,
  "TAD LOGISTIC": 60,
  KOITHE: 50,
  KLOTHEN: 50,
  "KLOTHEN LTD": 50,
  "KLOTHEN LIMITED": 50,
  LEVEDOUGH: 50,
};

// Shown in the rates legend (one entry per company family).
const RATE_LEGEND = [
  ["TAD LOGISTIC", 60],
  ["KOITHE", 50],
  ["KLOTHEN", 50],
  ["LEVEDOUGH", 50],
];

const getCompanyBonusPercentage = (companyName, defaultPercentage = 100) => {
  if (!companyName) return defaultPercentage;
  const companyUpper = companyName.toUpperCase();

  if (COMPANY_BONUS_PERCENTAGES[companyName]) {
    return COMPANY_BONUS_PERCENTAGES[companyName];
  }
  for (const [key, value] of Object.entries(COMPANY_BONUS_PERCENTAGES)) {
    if (companyUpper.includes(key) || key.includes(companyUpper)) {
      return value;
    }
  }
  return defaultPercentage;
};

const formatNumber = formatMoney;

const formatDecimal = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "0.00";
  return Number(num).toFixed(2);
};

const calculateServiceDuration = (joiningDate, referenceDate) => {
  if (!joiningDate || !referenceDate) return { months: 0, years: 0 };

  const join = new Date(joiningDate);
  const ref = new Date(referenceDate);
  if (Number.isNaN(join.getTime())) return { months: 0, years: 0 };

  let years = ref.getFullYear() - join.getFullYear();
  let months = ref.getMonth() - join.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }

  const totalMonths = Math.max(0, years * 12 + months);
  return { months: totalMonths, years: Math.max(0, years + months / 12) };
};

const ELIGIBILITY = {
  full: { status: "full", percentage: 100, label: "100% Eligible (12+ months)", shortLabel: "100%", tone: "success" },
  seventy_five: { status: "seventy_five", percentage: 75, label: "75% Eligible (10-11 months)", shortLabel: "75%", tone: "warning" },
  fifty: { status: "fifty", percentage: 50, label: "50% Eligible (6-9 months)", shortLabel: "50%", tone: "orange" },
  none: { status: "none", percentage: 0, label: "Not Eligible (< 6 months)", shortLabel: "0%", tone: "danger" },
};

const getEligibilityInfo = (monthsOfService) => {
  if (monthsOfService >= 12) return ELIGIBILITY.full;
  if (monthsOfService >= 10) return ELIGIBILITY.seventy_five;
  if (monthsOfService >= 6) return ELIGIBILITY.fifty;
  return ELIGIBILITY.none;
};

const BONUS_TYPES = [
  "Eid Bonus",
  "Performance Bonus",
  "Festival Bonus",
  "Annual Bonus",
  "Special Bonus",
  "Incentive",
];

// Manual entries (cash payment, adjustment, remarks) are kept per bonus
// period, so an adjustment typed for one Eid bonus never carries over into
// the next one. "bonusManualData" is the old single shared key.
const LEGACY_MANUAL_KEY = "bonusManualData";
const manualKey = (year, month, type) => `bonusManual_${year}_${month}_${type.replace(/\s+/g, "_")}`;
const recordsKey = (year, month, type) =>
  `bonus_records_${year}_${month}_${type.replace(/\s+/g, "_")}`;

const readJSON = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const BonusFormat = () => {
  const navigate = useNavigate();
  const today = new Date();

  const [employees, setEmployees] = useState([]);
  const [bonusRecords, setBonusRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openCompanies, setOpenCompanies] = useState({});
  const [showSummary, setShowSummary] = useState(true);
  const [manualData, setManualData] = useState({});
  const [generatingExcel, setGeneratingExcel] = useState({});
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDataSavedForMonth, setIsDataSavedForMonth] = useState(false);
  const [notice, setNotice] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [bonusType, setBonusType] = useState("Eid Bonus");
  const [bonusPercentage, setBonusPercentage] = useState(100);

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i);
  const periodLabel = `${bonusType} · ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
  const referenceDate = useMemo(
    () => new Date(selectedYear, selectedMonth - 1, 1),
    [selectedYear, selectedMonth],
  );

  const companyOf = (emp) => emp.company_name ?? emp.company?.company_name ?? "Unknown";

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return employees;
    return employees.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(term) ||
        emp.employee_id?.toLowerCase().includes(term) ||
        emp.designation?.toLowerCase().includes(term),
    );
  }, [searchTerm, employees]);

  const grouped = useMemo(
    () =>
      filteredEmployees.reduce((acc, emp) => {
        const comp = companyOf(emp);
        if (!acc[comp]) acc[comp] = [];
        acc[comp].push(emp);
        return acc;
      }, {}),
    [filteredEmployees],
  );

  // Manual entries of the selected period
  useEffect(() => {
    const key = manualKey(selectedYear, selectedMonth, bonusType);
    let saved = readJSON(key);
    if (!saved) {
      const legacy = readJSON(LEGACY_MANUAL_KEY);
      if (legacy && Object.keys(legacy).length) {
        // One-time move of the old shared entries to the period open now.
        saved = legacy;
        try {
          localStorage.setItem(key, JSON.stringify(legacy));
          localStorage.removeItem(LEGACY_MANUAL_KEY);
        } catch (e) {
          console.warn("Could not move old bonus entries:", e);
        }
      }
    }
    setManualData(saved || {});
  }, [selectedYear, selectedMonth, bonusType]);

  const loadExistingBonusRecords = async () => {
    const key = recordsKey(selectedYear, selectedMonth, bonusType);
    const loadFromBrowser = () => {
      const records = readJSON(key);
      if (!records) {
        setBonusRecords({});
        return;
      }
      const recordsMap = {};
      records.forEach((record) => {
        recordsMap[record.employee_id] = record;
      });
      setBonusRecords(recordsMap);
    };

    try {
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
        localStorage.setItem(key, JSON.stringify(response.data.data));
      } else {
        setBonusRecords({});
      }
    } catch (error) {
      console.error("Failed to load existing bonus records:", error);
      loadFromBrowser();
    }
  };

  const checkBackendDataExists = async () => {
    try {
      const response = await financeAPI.bonus.checkBonusExists(
        selectedMonth,
        selectedYear,
        "",
        bonusType,
      );
      setIsDataSavedForMonth(!!(response.data && response.data.exists));
    } catch (error) {
      console.error("Error checking backend for bonus records:", error);
      setIsDataSavedForMonth(!!readJSON(recordsKey(selectedYear, selectedMonth, bonusType)));
    }
  };

  // Employees + existing records of the period
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const res = await financeAPI.employee.getAll();
        const filtered = res.data.filter((e) => e.salary && e.employee_id);
        filtered.sort((a, b) => {
          const compA = companyOf(a);
          const compB = companyOf(b);
          if (compA !== compB) return compA.localeCompare(compB);
          return (a.name || "").localeCompare(b.name || "");
        });
        setEmployees(filtered);
        await Promise.all([loadExistingBonusRecords(), checkBackendDataExists()]);
      } catch (error) {
        console.error("Failed to load employees:", error);
        setNotice({ tone: "danger", text: "Failed to load employees. Please refresh the page." });
      } finally {
        setLoading(false);
      }
    };
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, bonusType]);

  const getManual = (empId, field, defaultVal = 0) => {
    // Nothing typed yet: start from the saved record of this period
    if (!manualData[empId] && bonusRecords[empId]) {
      if (field === "manualAdjustment") return bonusRecords[empId].manual_adjustment || 0;
      if (field === "cashPayment") return bonusRecords[empId].cash_payment || 0;
      if (field === "adjustmentReason") return bonusRecords[empId].adjustment_reason || "";
      if (field === "remarks") return bonusRecords[empId].remarks || "";
    }
    return manualData[empId]?.[field] ?? defaultVal;
  };

  const updateManual = (empId, field, value) => {
    const parsed =
      field === "remarks" || field === "adjustmentReason" ? value : parseFloat(value) || 0;

    // First edit of a row that has a saved record: keep its other values.
    const base = manualData[empId] || {
      manualAdjustment: Number(getManual(empId, "manualAdjustment")) || 0,
      cashPayment: Number(getManual(empId, "cashPayment")) || 0,
      adjustmentReason: getManual(empId, "adjustmentReason", ""),
      remarks: getManual(empId, "remarks", ""),
    };
    const newData = { ...manualData, [empId]: { ...base, [field]: parsed } };

    setManualData(newData);
    try {
      localStorage.setItem(manualKey(selectedYear, selectedMonth, bonusType), JSON.stringify(newData));
    } catch (e) {
      console.warn("Could not store bonus entries:", e);
    }
  };

  const calculateBonus = useCallback(
    (employee) => {
      const empId = employee.employee_id;
      const companyName = companyOf(employee);
      const companyBonusPercentage = getCompanyBonusPercentage(companyName, bonusPercentage);
      const existingRecord = bonusRecords[empId];

      const grossSalary = Number(employee.salary) || 0;
      const basic = grossSalary * 0.6;
      const houseRent = grossSalary * 0.3;
      const medical = grossSalary * 0.05;
      const conveyance = grossSalary * 0.05;
      const cashSalary = Number(employee.salary_cash) || 0;

      const { months, years: serviceYears } = calculateServiceDuration(
        employee.joining_date,
        referenceDate,
      );
      const eligibility = getEligibilityInfo(months);

      const bonusAmount = (grossSalary * companyBonusPercentage) / 100;
      const bonusPayable = (bonusAmount * eligibility.percentage) / 100;

      const manualAdjustment = Number(getManual(empId, "manualAdjustment")) || 0;
      const cashPayment = Number(getManual(empId, "cashPayment")) || 0;
      const remarks = getManual(empId, "remarks", "");
      const totalPayable = bonusPayable + cashPayment + cashSalary + manualAdjustment;

      return {
        employee_id: empId,
        name: employee.name,
        designation: employee.designation,
        doj: employee.joining_date,
        company_name: companyName,
        bank_account: employee.bank_account,
        branch_name: employee.branch_name,
        basic,
        house_rent: houseRent,
        medical,
        conveyance,
        gross_salary: grossSalary,
        cash_salary: cashSalary,
        months_of_service: months,
        years_of_service: serviceYears,
        eligibility_status: eligibility.status,
        eligibility_percentage: eligibility.percentage,
        eligibility_label: eligibility.label,
        eligibility_short: eligibility.shortLabel,
        eligibility_tone: eligibility.tone,
        bonus_percentage: companyBonusPercentage,
        base_bonus_percentage: bonusPercentage,
        is_company_specific: companyBonusPercentage !== bonusPercentage,
        bonus_amount: bonusAmount,
        bonus_payable: bonusPayable,
        cash_payment: cashPayment,
        manual_adjustment: manualAdjustment,
        adjustment_reason: getManual(empId, "adjustmentReason", ""),
        total_payable: totalPayable,
        remarks,
        existing_id: existingRecord?.id,
        is_approved: existingRecord?.is_approved || false,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [referenceDate, bonusPercentage, bonusRecords, manualData],
  );

  // Refresh the saved records of the period and recount.
  const calculateAllBonuses = async () => {
    setCalculating(true);
    try {
      await Promise.all([loadExistingBonusRecords(), checkBackendDataExists()]);
      setNotice({ tone: "success", text: `Bonus calculated for ${employees.length} employees.` });
    } finally {
      setCalculating(false);
    }
  };

  // Save the bonus of ALL employees for the period (a search filter only
  // changes what is shown).
  const saveData = async () => {
    if (isDataSavedForMonth) {
      const confirmResave = window.confirm(
        `Bonus data for ${periodLabel} has already been saved. Do you want to save again?`,
      );
      if (!confirmResave) return;
    }

    const payload = employees
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

    // Always keep a copy in this browser as a backup
    localStorage.setItem(recordsKey(selectedYear, selectedMonth, bonusType), JSON.stringify(payload));

    setSaving(true);
    try {
      const res = await financeAPI.bonus.saveBonus(payload);
      if (res.data.success) {
        setIsDataSavedForMonth(true);
        setNotice({ tone: "success", text: `Saved ${payload.length} bonus records for ${periodLabel}.` });
        await loadExistingBonusRecords();
      } else {
        setNotice({ tone: "warning", text: res.data.message || "Save completed with warnings." });
      }
    } catch (error) {
      console.error("Save failed:", error);
      setNotice({
        tone: "danger",
        text: "The server save failed. A backup copy is kept in this browser — please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportToExcel = async (companyName = null) => {
    const key = companyName || "all";
    try {
      setGeneratingExcel((prev) => ({ ...prev, [key]: true }));
      const employeesToExport = companyName
        ? filteredEmployees.filter((e) => companyOf(e) === companyName)
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
      ws["!cols"] = [5, 25, 15, 25, 12, 20, 12, 12, 10, 12, 14, 12, 10, 20, 10, 8, 12, 12, 14, 14, 14, 20, 14, 20, 15, 25].map(
        (wch) => ({ wch }),
      );

      const typePart = bonusType.replace(/\s+/g, "_");
      const periodPart = `${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}`;
      const fileName = companyName
        ? `${companyName.replace(/\s+/g, "_")}_Bonus_${typePart}_${periodPart}.xlsx`
        : `All_Companies_Bonus_${typePart}_${periodPart}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Export failed:", error);
      setNotice({ tone: "danger", text: "Export failed." });
    } finally {
      setGeneratingExcel((prev) => ({ ...prev, [key]: false }));
    }
  };

  const toggleCompany = (comp) => {
    setOpenCompanies((prev) => {
      const newState = { ...prev, [comp]: !prev[comp] };
      setShowSummary(!Object.values(newState).some((v) => v));
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

  // Totals + eligibility counts over a list of employees
  const sumUp = (list) =>
    list.reduce(
      (acc, e) => {
        const b = calculateBonus(e);
        acc[b.eligibility_status] += 1;
        acc.bonusPayable += b.bonus_payable;
        acc.cashSalary += b.cash_salary;
        acc.cashPay += b.cash_payment;
        acc.adjustments += b.manual_adjustment;
        acc.totalPayable += b.total_payable;
        return acc;
      },
      { full: 0, seventy_five: 0, fifty: 0, none: 0, bonusPayable: 0, cashSalary: 0, cashPay: 0, adjustments: 0, totalPayable: 0 },
    );

  const filters = (
    <Card>
      <div className="fin-toolbar">
        <Field label="Month">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="fin-select">
            {MONTH_NAMES.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Year">
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="fin-select">
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bonus type">
          <select value={bonusType} onChange={(e) => setBonusType(e.target.value)} className="fin-select">
            {BONUS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bonus % of gross">
          <input
            type="number"
            value={bonusPercentage}
            onChange={(e) => setBonusPercentage(Number(e.target.value))}
            className="fin-input"
            style={{ width: 110 }}
            min="0"
            max="500"
            step="10"
            title="Default rate; companies with their own rate keep it"
          />
        </Field>
        <Field label="Search">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Name, ID or designation…" />
        </Field>
      </div>
      <div className="fin-row" style={{ marginTop: 12, gap: 6 }}>
        <span className="fin-label">Company bonus rates:</span>
        {RATE_LEGEND.map(([name, pct]) => (
          <Badge key={name} tone="orange">
            {name} {pct}%
          </Badge>
        ))}
        <Badge>Other companies {bonusPercentage}%</Badge>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <FinanceShell title="Bonus Sheet" icon={<FaGift />}>
        <div className="fin-stack">
          {filters}
          <Card>
            <LoadingState title={`Loading ${periodLabel}…`} />
          </Card>
        </div>
      </FinanceShell>
    );
  }

  const grand = sumUp(filteredEmployees);
  const companyNames = Object.keys(grouped);

  const eligibilityBadge = (bonus) => (
    <Badge tone={bonus.eligibility_tone} title={bonus.eligibility_label}>
      {bonus.eligibility_percentage}%
    </Badge>
  );

  return (
    <FinanceShell
      title="Bonus Sheet"
      icon={<FaGift />}
      meta={
        <>
          <Badge tone="primary" className="fin-badge--lg">
            {periodLabel}
          </Badge>
          {isDataSavedForMonth && (
            <Badge tone="success" className="fin-badge--lg">
              <FaCheckCircle /> Saved
            </Badge>
          )}
        </>
      }
      subtitle="Bonus by company rate and length of service. Add cash payments or adjustments, then save."
      actions={
        <>
          <button onClick={calculateAllBonuses} className="fin-btn" disabled={calculating}>
            <FaCalculator className={calculating ? "fin-spin" : ""} /> {calculating ? "Calculating…" : "Calculate"}
          </button>
          <button onClick={() => exportToExcel()} className="fin-btn" disabled={generatingExcel.all || !filteredEmployees.length}>
            <FaFileExcel /> {generatingExcel.all ? "Exporting…" : "Export Excel"}
          </button>
          <button onClick={() => navigate("/bonus-records")} className="fin-btn">
            <FaArchive /> Records
          </button>
          <button
            className="fin-btn fin-btn--primary"
            onClick={saveData}
            disabled={saving || !employees.length}
            title={isDataSavedForMonth ? `Already saved for ${periodLabel} — saving again updates it` : "Save bonus data"}
          >
            <FaSave /> {saving ? "Saving…" : isDataSavedForMonth ? "Save Again" : "Save Data"}
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

        {filters}

        <div className="fin-kpis">
          <Kpi tone="primary" icon={<FaUsers />} label="Employees" value={filteredEmployees.length} hint={`${companyNames.length} companies`} />
          <Kpi
            tone="success"
            icon={<FaCheckCircle />}
            label="Eligibility"
            value={`${grand.full} full`}
            hint={`${grand.seventy_five} at 75% · ${grand.fifty} at 50% · ${grand.none} not eligible`}
          />
          <Kpi tone="info" icon={<FaGift />} label="Bonus payable" value={formatNumber(grand.bonusPayable)} />
          <Kpi
            tone="warning"
            icon={<FaMoneyBillWave />}
            label="Total payable"
            value={formatNumber(grand.totalPayable)}
            hint="Bonus + cash salary + cash pay + adjustments"
          />
        </div>

        <Card
          title={
            <>
              <FaBuilding /> Companies
            </>
          }
          subtitle="Open a company to review and adjust its bonus sheet."
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
          {companyNames.length ? (
            <CompanyChips
              companies={companyNames.map((name) => ({ name, count: grouped[name].length }))}
              open={openCompanies}
              onToggle={toggleCompany}
              tag={(name) => {
                const pct = getCompanyBonusPercentage(name);
                return pct !== 100 ? `${pct}%` : null;
              }}
            />
          ) : (
            <EmptyState title="No employees match your search" />
          )}
        </Card>

        {companyNames.map((comp) => {
          const emps = grouped[comp];
          if (!openCompanies[comp]) return null;
          const companyPercentage = getCompanyBonusPercentage(comp);
          const isSpecial = companyPercentage !== 100;
          const totals = sumUp(emps);

          return (
            <Card
              key={comp}
              flush
              title={
                <>
                  {comp}
                  {isSpecial && (
                    <Badge tone="orange">
                      <FaPercent /> {companyPercentage}% bonus rate
                    </Badge>
                  )}
                </>
              }
              subtitle={`${bonusType} calculation — ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} · ${emps.length} employees`}
              actions={
                <>
                  <button
                    className="fin-btn fin-btn--sm"
                    onClick={() => exportToExcel(comp)}
                    disabled={generatingExcel[comp]}
                  >
                    <FaFileExcel /> {generatingExcel[comp] ? "Exporting…" : "Export"}
                  </button>
                  <button className="fin-btn fin-btn--sm fin-btn--ghost" onClick={() => toggleCompany(comp)}>
                    Close
                  </button>
                </>
              }
              footer={
                <div className="fin-stats">
                  <Stat label="Employees" value={emps.length} />
                  <Stat label="100% eligible" value={totals.full} />
                  <Stat label="75% eligible" value={totals.seventy_five} />
                  <Stat label="50% eligible" value={totals.fifty} />
                  <Stat label="Not eligible" value={totals.none} />
                  <Stat label="Bonus payable" value={formatNumber(totals.bonusPayable)} />
                  <Stat label="Cash salary" value={formatNumber(totals.cashSalary)} />
                  <Stat label="Cash payment" value={formatNumber(totals.cashPay)} />
                  <Stat label="Grand total payable" value={formatNumber(totals.totalPayable)} highlight />
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
                      <th className="num">Service</th>
                      <th className="center">Eligibility</th>
                      <th className="num">Gross</th>
                      <th className="num">Bonus Calc</th>
                      <th className="num">Bonus Payable</th>
                      <th className="num">Cash Salary</th>
                      <th className="num">Cash Pay</th>
                      <th>Adjustment</th>
                      <th className="num">Total</th>
                      <th>Bank A/C</th>
                      <th>Branch</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emps.map((emp, idx) => {
                      const bonus = calculateBonus(emp);
                      return (
                        <tr key={emp.employee_id}>
                          <td className="fin-sticky muted" style={{ left: 0, minWidth: 48 }}>
                            {idx + 1}
                          </td>
                          <td className="fin-sticky fin-sticky-edge fin-col-name" style={{ left: 48 }}>
                            {emp.name}
                          </td>
                          <td className="fin-col-id">{emp.employee_id}</td>
                          <td className="muted">{emp.designation}</td>
                          <td className="muted">{emp.joining_date}</td>
                          <td className="num">
                            <div className="fin-cell-stack" style={{ alignItems: "flex-end" }}>
                              <span>
                                <FaClock style={{ opacity: 0.5, marginRight: 4 }} />
                                {bonus.months_of_service} mo
                              </span>
                              <span className="fin-cell-note">{bonus.years_of_service.toFixed(1)} yrs</span>
                            </div>
                          </td>
                          <td className="center">{eligibilityBadge(bonus)}</td>
                          <td className="num">{formatNumber(bonus.gross_salary)}</td>
                          <td className="num">
                            <div className="fin-cell-stack" style={{ alignItems: "flex-end" }}>
                              <span>{formatNumber(bonus.bonus_amount)}</span>
                              <span className={`fin-cell-note ${bonus.is_company_specific ? "fin-cell-note--warning" : ""}`}>
                                {bonus.bonus_percentage}%{bonus.is_company_specific ? " company rate" : ""}
                              </span>
                            </div>
                          </td>
                          <td className="num strong">{formatNumber(bonus.bonus_payable)}</td>
                          <td className="num">{formatNumber(bonus.cash_salary)}</td>
                          <td className="num">
                            <input
                              type="number"
                              value={getManual(emp.employee_id, "cashPayment") || ""}
                              placeholder="0"
                              onChange={(e) => updateManual(emp.employee_id, "cashPayment", e.target.value)}
                              className="fin-cell-input"
                              min="0"
                              step="100"
                              aria-label={`Cash payment, ${emp.name}`}
                            />
                          </td>
                          <td>
                            <div className="fin-row" style={{ flexWrap: "nowrap", gap: 6 }}>
                              <input
                                type="number"
                                value={getManual(emp.employee_id, "manualAdjustment") || ""}
                                placeholder="±0"
                                onChange={(e) => updateManual(emp.employee_id, "manualAdjustment", e.target.value)}
                                className="fin-cell-input"
                                min="-100000"
                                step="100"
                                aria-label={`Adjustment, ${emp.name}`}
                              />
                              <input
                                type="text"
                                value={getManual(emp.employee_id, "adjustmentReason", "")}
                                placeholder="Reason"
                                onChange={(e) => updateManual(emp.employee_id, "adjustmentReason", e.target.value)}
                                className="fin-cell-input fin-cell-input--text"
                                style={{ width: 130 }}
                                maxLength="50"
                                aria-label={`Adjustment reason, ${emp.name}`}
                              />
                            </div>
                          </td>
                          <td className="num strong text-pos">{formatNumber(bonus.total_payable)}</td>
                          <td className="fin-col-id">{emp.bank_account || "N/A"}</td>
                          <td className="muted">{emp.branch_name || "N/A"}</td>
                          <td>
                            <input
                              type="text"
                              value={getManual(emp.employee_id, "remarks", "")}
                              placeholder="Remarks"
                              onChange={(e) => updateManual(emp.employee_id, "remarks", e.target.value)}
                              className="fin-cell-input fin-cell-input--text"
                              aria-label={`Remarks, ${emp.name}`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="fin-sticky" style={{ left: 0, minWidth: 48 }} />
                      <td className="fin-sticky fin-sticky-edge" style={{ left: 48 }}>
                        Total ({emps.length})
                      </td>
                      <td colSpan={7} />
                      <td className="num">{formatNumber(totals.bonusPayable)}</td>
                      <td className="num">{formatNumber(totals.cashSalary)}</td>
                      <td className="num">{formatNumber(totals.cashPay)}</td>
                      <td className="num">{formatNumber(totals.adjustments)}</td>
                      <td className="num">{formatNumber(totals.totalPayable)}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          );
        })}

        {showSummary && filteredEmployees.length > 0 && (
          <Card
            flush
            title={
              <>
                <FaUsers /> Summary by company
              </>
            }
            subtitle={periodLabel}
          >
            <div className="fin-table-wrap fin-table-wrap--auto">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>SL</th>
                    <th>Company</th>
                    <th className="num">Employees</th>
                    <th className="num">100%</th>
                    <th className="num">75%</th>
                    <th className="num">50%</th>
                    <th className="num">Not Eligible</th>
                    <th className="num">Bonus Payable</th>
                    <th className="num">Cash Salary</th>
                    <th className="num">Cash Pay</th>
                    <th className="num">Adjustments</th>
                    <th className="num">Total Payable</th>
                  </tr>
                </thead>
                <tbody>
                  {companyNames.map((comp, idx) => {
                    const t = sumUp(grouped[comp]);
                    return (
                      <tr key={comp} className="fin-row-clickable" onClick={() => toggleCompany(comp)} title="Open this company">
                        <td className="muted">{idx + 1}</td>
                        <td className="fin-col-name">{comp}</td>
                        <td className="num">{grouped[comp].length}</td>
                        <td className="num">{t.full}</td>
                        <td className="num">{t.seventy_five}</td>
                        <td className="num">{t.fifty}</td>
                        <td className="num">{t.none}</td>
                        <td className="num">{formatNumber(t.bonusPayable)}</td>
                        <td className="num">{formatNumber(t.cashSalary)}</td>
                        <td className="num">{formatNumber(t.cashPay)}</td>
                        <td className="num">{formatNumber(t.adjustments)}</td>
                        <td className="num strong">{formatNumber(t.totalPayable)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Grand Total</td>
                    <td className="num">{filteredEmployees.length}</td>
                    <td className="num">{grand.full}</td>
                    <td className="num">{grand.seventy_five}</td>
                    <td className="num">{grand.fifty}</td>
                    <td className="num">{grand.none}</td>
                    <td className="num">{formatNumber(grand.bonusPayable)}</td>
                    <td className="num">{formatNumber(grand.cashSalary)}</td>
                    <td className="num">{formatNumber(grand.cashPay)}</td>
                    <td className="num">{formatNumber(grand.adjustments)}</td>
                    <td className="num">{formatNumber(grand.totalPayable)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}
      </div>
    </FinanceShell>
  );
};

export default BonusFormat;
