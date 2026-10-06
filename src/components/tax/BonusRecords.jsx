// BonusRecords.jsx - saved bonus sheets, corrections and Excel downloads.
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileExport,
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
  FaFileAlt,
  FaArchive,
  FaMoneyBillWave,
  FaEye,
  FaEyeSlash,
  FaUndo,
  FaUniversity,
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
  downloadBlob,
  MONTH_NAMES,
} from "./finance/FinanceUI";

const toNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === "") return defaultValue;
  if (typeof value === "string" && value.trim() === "") return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const formatNumber = (num) => formatMoney(toNumber(num));
const formatDecimal = (num) => toNumber(num).toFixed(2);

const eligibilityTone = (status, percentage) => {
  if (status === "full" || percentage >= 100) return "success";
  if (status === "seventy_five" || percentage >= 75) return "warning";
  if (status === "fifty" || percentage >= 50) return "orange";
  return "danger";
};

const BONUS_TYPES = [
  "All",
  "Eid Bonus",
  "Performance Bonus",
  "Festival Bonus",
  "Annual Bonus",
  "Special Bonus",
  "Incentive",
];

const BonusRecords = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedBonusType, setSelectedBonusType] = useState("All");
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [allCompanies, setAllCompanies] = useState([]);
  const [openCompanies, setOpenCompanies] = useState({});
  const [error, setError] = useState(null);
  const [generatingExcel, setGeneratingExcel] = useState({});
  const [generatingBonusSheet, setGeneratingBonusSheet] = useState({});
  // Only the fields the user changed, per record.
  const [editableData, setEditableData] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return records;
    return records.filter(
      (record) =>
        record.name?.toLowerCase().includes(term) ||
        record.employee_id?.toLowerCase().includes(term) ||
        record.designation?.toLowerCase().includes(term) ||
        record.company_name?.toLowerCase().includes(term),
    );
  }, [searchTerm, records]);

  const grouped = useMemo(
    () =>
      filteredRecords.reduce((acc, record) => {
        const company = record.company_name || "Unknown Company";
        if (!acc[company]) acc[company] = [];
        acc[company].push(record);
        return acc;
      }, {}),
    [filteredRecords],
  );

  // The company filter keeps every company of the period, even while one
  // company is selected.
  const companies = useMemo(() => {
    const set = new Set(allCompanies);
    records.forEach((r) => r.company_name && set.add(r.company_name));
    return ["All", ...[...set].sort()];
  }, [allCompanies, records]);

  const recordKey = (record) =>
    record.id ?? `${record.employee_id}|${record.bonus_type}|${record.company_name}`;

  const fetchBonusRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { year: selectedYear, month: selectedMonth };
      if (selectedBonusType !== "All") params.bonus_type = selectedBonusType;
      if (selectedCompany !== "All") params.company_name = selectedCompany;

      const response = await financeAPI.bonus.getAll(params);

      let list = [];
      if (response.data) {
        if (response.data.success) list = response.data.data || [];
        else if (Array.isArray(response.data)) list = response.data;
        else list = response.data.records || response.data.results || [];
      }

      if (selectedCompany === "All") {
        setAllCompanies([...new Set(list.map((r) => r.company_name).filter(Boolean))]);
      }
      setEditableData({});
      setRecords(list);
    } catch (err) {
      console.error("Failed to fetch bonus records:", err);
      if (err.response) {
        setError(`Server error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        setError("No response from server. Please check your internet connection.");
      } else {
        setError("Request error: " + err.message);
      }
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBonusRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth, selectedBonusType, selectedCompany]);

  const updateEditableField = (record, field, value) => {
    const key = recordKey(record);
    setEditableData((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
  };

  const getEditableValue = (record, field) => {
    const edits = editableData[recordKey(record)];
    if (edits && edits[field] !== undefined) return edits[field];
    const saved = record[field];
    if (field === "adjustment_reason" || field === "remarks") return saved || "";
    return toNumber(saved) ? toNumber(saved) : "";
  };

  const isEdited = (record) => {
    const edits = editableData[recordKey(record)];
    return !!edits && Object.keys(edits).length > 0;
  };

  const editedCount = useMemo(
    () => Object.values(editableData).filter((e) => e && Object.keys(e).length > 0).length,
    [editableData],
  );

  const discardRow = (record) =>
    setEditableData((prev) => {
      const next = { ...prev };
      delete next[recordKey(record)];
      return next;
    });

  const calculateDerivedValues = (record) => {
    const edits = editableData[recordKey(record)] || {};
    const pick = (field) => (edits[field] !== undefined ? toNumber(edits[field]) : toNumber(record[field]));

    const cashPayment = pick("cash_payment");
    const manualAdjustment = pick("manual_adjustment");
    const bonusPayable = toNumber(record.bonus_payable);
    const cashSalary = toNumber(record.cash_salary);
    const changed = edits.cash_payment !== undefined || edits.manual_adjustment !== undefined;
    const totalPayable = changed
      ? bonusPayable + cashPayment + cashSalary + manualAdjustment
      : toNumber(record.total_payable);

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

  // Save the changed rows (whatever the search).
  const saveData = async () => {
    const changed = records.filter(isEdited);
    if (changed.length === 0) {
      setNotice({ tone: "info", text: "Nothing to save — no rows were changed." });
      return;
    }
    if (!window.confirm(`Save changes to ${changed.length} bonus record${changed.length === 1 ? "" : "s"}?`)) {
      return;
    }

    const payload = changed.map((record) => {
      const calculated = calculateDerivedValues(record);
      const edits = editableData[recordKey(record)] || {};
      return {
        sl: record.sl || 0,
        name: record.name?.trim() || "Unknown",
        employee_id: record.employee_id?.trim(),
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
          edits.adjustment_reason !== undefined ? edits.adjustment_reason : record.adjustment_reason || "",
        total_payable: calculated.totalPayable,
        remarks: edits.remarks !== undefined ? edits.remarks : record.remarks || "",
        month: record.month || selectedMonth,
        year: record.year || selectedYear,
        bonus_type: record.bonus_type || selectedBonusType,
      };
    });

    setSaving(true);
    try {
      const res = await financeAPI.bonus.saveBonus(payload);
      const saved = res.data.saved || payload.length;
      const errors = res.data.errors || [];
      if (errors.length > 0) {
        console.warn("Save errors:", errors);
        setNotice({ tone: "warning", text: `Saved ${saved}, but ${errors.length} failed. Check the browser console.` });
      } else {
        setNotice({ tone: "success", text: `Saved ${saved} updated bonus record${saved === 1 ? "" : "s"}.` });
        fetchBonusRecords();
      }
    } catch (e) {
      console.error("Save failed:", e.response?.data || e);
      setNotice({ tone: "danger", text: "Save failed. Nothing was saved — please try again." });
    } finally {
      setSaving(false);
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
      return typeof data === "string" ? data : data.error || data.message || fallback;
    } catch {
      return err.response.statusText || fallback;
    }
  };

  const bonusTypeFor = (companyName) => {
    const companyRecords = grouped[companyName] || [];
    const type = companyRecords.length > 0 ? companyRecords[0].bonus_type || selectedBonusType : selectedBonusType;
    return type !== "All" ? type : "Eid Bonus";
  };

  // One sheet of rows for a browser-built workbook
  const buildSheet = (companyName, companyRecords) => {
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [`${companyName.toUpperCase()} - BONUS SHEET`],
        [`Month: ${monthLabel}`],
        [`Total Employees: ${companyRecords.length}`],
        [""],
      ],
      { origin: "A1" },
    );
    XLSX.utils.sheet_add_json(
      ws,
      companyRecords.map((record, idx) => {
        const c = calculateDerivedValues(record);
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
          "Cash Salary": formatDecimal(record.cash_salary),
          "Cash Payment": formatDecimal(c.cashPayment),
          "Manual Adj": formatDecimal(c.manualAdjustment),
          "Total Payable": formatDecimal(c.totalPayable),
          "Bank Account": record.bank_account || "",
          Remarks: getEditableValue(record, "remarks") || "",
        };
      }),
      { origin: "A5" },
    );
    ws["!cols"] = [5, 25, 15, 25, 12, 12, 10, 15, 12, 12, 12, 12, 12, 14, 20, 25].map((wch) => ({ wch }));
    return ws;
  };

  // Browser-side Excel for one company (used when the server sheet fails)
  const generateBonusSheetFallback = async (companyName) => {
    try {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, buildSheet(companyName, grouped[companyName] || []), companyName.substring(0, 31));
      XLSX.writeFile(wb, `${companyName.replace(/\s+/g, "_")}_Bonus_Sheet_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`);
    } catch (err) {
      console.error("Fallback bonus sheet failed:", err);
      setNotice({ tone: "danger", text: `Could not create the bonus sheet: ${err.message}` });
    }
  };

  const generateBonusSheetForCompany = async (companyName) => {
    try {
      setGeneratingBonusSheet((prev) => ({ ...prev, [companyName]: true }));
      const response = await financeAPI.bonus.generateBonusSheetExcel({
        company_name: companyName,
        month: selectedMonth,
        year: selectedYear,
        bonus_type: bonusTypeFor(companyName),
      });
      downloadBlob(
        response.data,
        `${companyName.replace(/\s+/g, "_")}_Bonus_Sheet_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`,
      );
      setNotice({ tone: "success", text: `Bonus sheet downloaded for ${companyName}.` });
    } catch (err) {
      console.error("Error generating Bonus Sheet:", err);
      const message = await errorText(err, "Failed to generate Bonus Sheet.");
      if (window.confirm(`Server generation failed: ${message}\n\nCreate the sheet in the browser instead?`)) {
        await generateBonusSheetFallback(companyName);
      }
    } finally {
      setGeneratingBonusSheet((prev) => ({ ...prev, [companyName]: false }));
    }
  };

  // Browser-side workbook with one sheet per company plus a summary
  const generateAllCompaniesBonusSheet = async () => {
    if (Object.keys(grouped).length === 0) {
      setNotice({ tone: "warning", text: "No company data to export." });
      return;
    }
    try {
      setGeneratingBonusSheet((prev) => ({ ...prev, all_companies: true }));
      const wb = XLSX.utils.book_new();
      Object.keys(grouped).forEach((companyName, companyIdx) => {
        let sheetName = companyName.substring(0, 31);
        if (wb.SheetNames.includes(sheetName)) sheetName = `${companyName.substring(0, 28)}_${companyIdx + 1}`;
        XLSX.utils.book_append_sheet(wb, buildSheet(companyName, grouped[companyName]), sheetName);
      });

      const summaryRows = Object.keys(grouped).map((companyName, idx) => {
        const t = sumUp(grouped[companyName]);
        return [
          idx + 1,
          companyName,
          grouped[companyName].length,
          formatDecimal(t.bonusPayable),
          formatDecimal(t.cashPay),
          formatDecimal(t.adjustments),
          formatDecimal(t.totalPayable),
        ];
      });
      const summaryWs = XLSX.utils.aoa_to_sheet([
        ["ALL COMPANIES - BONUS SUMMARY"],
        [`Month: ${monthLabel}`],
        [""],
        ["SL", "Company", "Employees", "Bonus Payable", "Cash Payment", "Manual Adj", "Total Payable"],
        ...summaryRows,
      ]);
      summaryWs["!cols"] = [5, 30, 10, 15, 15, 15, 15].map((wch) => ({ wch }));
      XLSX.utils.book_append_sheet(wb, summaryWs, "SUMMARY");
      XLSX.writeFile(wb, `ALL_COMPANIES_BONUS_SHEET_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`);
    } catch (err) {
      console.error("Error generating All Companies Bonus Sheet:", err);
      setNotice({ tone: "danger", text: `Failed to generate the bonus sheets: ${err.message}` });
    } finally {
      setGeneratingBonusSheet((prev) => ({ ...prev, all_companies: false }));
    }
  };

  // Browser-side export (fallback for the server "all companies" file)
  const exportToExcel = generateAllCompaniesBonusSheet;

  const generateAllCompaniesBonusExcel = async () => {
    if (Object.keys(grouped).length === 0) {
      setNotice({ tone: "warning", text: "No company data to export." });
      return;
    }
    try {
      setGeneratingExcel((prev) => ({ ...prev, all_companies: true }));
      const response = await financeAPI.bonus.generateAllCompaniesBonusExcel({
        month: selectedMonth,
        year: selectedYear,
        bonus_type: selectedBonusType !== "All" ? selectedBonusType : "All",
      });

      let filename = `ALL_COMPANIES_BONUS_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`;
      const contentDisposition = response.headers?.["content-disposition"];
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) filename = match[1].replace(/['"]/g, "");
      }
      downloadBlob(response.data, filename);
      setNotice({ tone: "success", text: "All companies bonus Excel downloaded." });
    } catch (err) {
      console.error("Error generating All Companies Bonus Excel:", err);
      const message = await errorText(err, "Failed to generate All Companies Bonus Excel.");
      if (window.confirm(`Server export failed: ${message}\n\nCreate the file in the browser instead?`)) {
        await exportToExcel();
      }
    } finally {
      setGeneratingExcel((prev) => ({ ...prev, all_companies: false }));
    }
  };

  const generateBonusBankTransferExcel = async (companyName) => {
    const key = `bank_${companyName}`;
    try {
      setGeneratingExcel((prev) => ({ ...prev, [key]: true }));
      const response = await financeAPI.bonus.generateBonusBankTransferExcel({
        company_name: companyName,
        month: selectedMonth,
        year: selectedYear,
        bonus_type: bonusTypeFor(companyName),
      });
      downloadBlob(
        response.data,
        `${companyName.replace(/\s+/g, "_")}_Bonus_Bank_Transfer_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`,
      );
      setNotice({ tone: "success", text: `Bank transfer Excel downloaded for ${companyName}.` });
    } catch (err) {
      console.error("Error generating Bonus Bank Transfer Excel:", err);
      setNotice({
        tone: "danger",
        text: `Failed to generate the bank transfer Excel: ${await errorText(err, "unknown error")}`,
      });
    } finally {
      setGeneratingExcel((prev) => ({ ...prev, [key]: false }));
    }
  };

  const sumUp = (list) =>
    list.reduce(
      (acc, r) => {
        const c = calculateDerivedValues(r);
        const pct = r.eligibility_percentage || 0;
        if (pct >= 100) acc.full += 1;
        else if (pct >= 75) acc.seventy_five += 1;
        else if (pct >= 50) acc.fifty += 1;
        else acc.none += 1;
        acc.bonusPayable += c.bonusPayable;
        acc.cashSalary += c.cashSalary;
        acc.cashPay += c.cashPayment;
        acc.adjustments += c.manualAdjustment;
        acc.totalPayable += c.totalPayable;
        if (r.is_approved) acc.approved += 1;
        return acc;
      },
      { full: 0, seventy_five: 0, fifty: 0, none: 0, bonusPayable: 0, cashSalary: 0, cashPay: 0, adjustments: 0, totalPayable: 0, approved: 0 },
    );

  const grand = sumUp(filteredRecords);
  const companyNames = Object.keys(grouped);
  const isCurrentMonth =
    selectedMonth === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear();

  return (
    <FinanceShell
      title="Bonus Records"
      icon={<FaArchive />}
      meta={
        <Badge tone="primary" className="fin-badge--lg">
          {monthLabel}
          {selectedBonusType !== "All" ? ` · ${selectedBonusType}` : ""}
        </Badge>
      }
      subtitle="Saved bonus sheets. Correct cash payments or adjustments and download bank transfer and bonus sheets."
      actions={
        <>
          <button
            onClick={generateAllCompaniesBonusSheet}
            className="fin-btn"
            disabled={companyNames.length === 0 || generatingBonusSheet.all_companies}
            title="One workbook with a sheet per company, made in the browser"
          >
            <FaFileAlt /> {generatingBonusSheet.all_companies ? "Generating…" : "All Bonus Sheets"}
          </button>
          <button
            onClick={generateAllCompaniesBonusExcel}
            className="fin-btn"
            disabled={generatingExcel.all_companies || companyNames.length === 0}
          >
            <FaFileExcel /> {generatingExcel.all_companies ? "Generating…" : "Export All Companies"}
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
              >
                {MONTH_NAMES.map((month, index) => (
                  <option key={month} value={index + 1}>
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
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bonus type">
              <select
                value={selectedBonusType}
                onChange={(e) => setSelectedBonusType(e.target.value)}
                className="fin-select"
                disabled={editedCount > 0}
              >
                {BONUS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === "All" ? "All types" : type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Company">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="fin-select"
                disabled={editedCount > 0}
              >
                {companies.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp === "All" ? "All companies" : comp}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Search">
              <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Name, ID or company…" />
            </Field>
            <span className="fin-spacer" />
            {editedCount > 0 && (
              <button className="fin-btn fin-btn--danger" onClick={() => setEditableData({})}>
                <FaUndo /> Discard changes
              </button>
            )}
            <button onClick={fetchBonusRecords} className="fin-btn" disabled={loading}>
              <FaSync className={loading ? "fin-spin" : ""} /> Refresh
            </button>
          </div>
        </Card>

        {error && (
          <Alert
            tone="danger"
            title="Error loading data"
            action={
              <button onClick={fetchBonusRecords} className="fin-btn fin-btn--sm">
                <FaSync /> Retry
              </button>
            }
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Card>
            <LoadingState title="Loading bonus records…" />
          </Card>
        ) : (
          <>
            {records.length > 0 && (
              <div className="fin-kpis">
                <Kpi tone="primary" icon={<FaUsers />} label="Records" value={filteredRecords.length} hint={`${companyNames.length} companies`} />
                <Kpi tone="info" icon={<FaGift />} label="Total bonus" value={formatNumber(grand.bonusPayable)} />
                <Kpi tone="warning" icon={<FaMoneyBillWave />} label="Total payable" value={formatNumber(grand.totalPayable)} />
                <Kpi
                  tone="success"
                  icon={<FaCheckCircle />}
                  label="Approved"
                  value={`${grand.approved} / ${filteredRecords.length}`}
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
                subtitle="Open a company to see its bonus records and downloads."
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
                />
              </Card>
            )}

            {companyNames.map((comp) => {
              const companyRecords = grouped[comp];
              if (!openCompanies[comp]) return null;
              const totals = sumUp(companyRecords);

              return (
                <Card
                  key={comp}
                  flush
                  title={comp}
                  subtitle={`Bonus records for ${monthLabel} · ${companyRecords.length} employees`}
                  actions={
                    <>
                      <button
                        onClick={() => generateBonusBankTransferExcel(comp)}
                        className="fin-btn fin-btn--sm"
                        disabled={generatingExcel[`bank_${comp}`]}
                        title="Bank transfer Excel"
                      >
                        <FaUniversity /> {generatingExcel[`bank_${comp}`] ? "Generating…" : "Bank Transfer Excel"}
                      </button>
                      <button
                        onClick={() => generateBonusSheetForCompany(comp)}
                        className="fin-btn fin-btn--sm"
                        disabled={generatingBonusSheet[comp]}
                      >
                        <FaFileExport /> {generatingBonusSheet[comp] ? "Generating…" : "Bonus Sheet"}
                      </button>
                    </>
                  }
                  footer={
                    <div className="fin-stats">
                      <Stat label="Employees" value={companyRecords.length} />
                      <Stat label="Bonus payable" value={formatNumber(totals.bonusPayable)} />
                      <Stat label="Cash payment" value={formatNumber(totals.cashPay)} />
                      <Stat label="Adjustments" value={formatNumber(totals.adjustments)} />
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
                          <th>Bonus Type</th>
                          <th className="num">Gross</th>
                          <th className="num">Bonus Payable</th>
                          <th className="num">Cash Salary</th>
                          <th className="num">Cash Payment</th>
                          <th>Adjustment</th>
                          <th className="num">Total</th>
                          <th>Bank A/C</th>
                          <th>Remarks</th>
                          <th className="center">Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {companyRecords.map((record, idx) => {
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
                              <td className="num">
                                <div className="fin-cell-stack" style={{ alignItems: "flex-end" }}>
                                  <span>
                                    <FaClock style={{ opacity: 0.5, marginRight: 4 }} />
                                    {record.months_of_service} mo
                                  </span>
                                  <span className="fin-cell-note">{formatDecimal(record.years_of_service)} yrs</span>
                                </div>
                              </td>
                              <td className="center">
                                <Badge tone={eligibilityTone(record.eligibility_status, record.eligibility_percentage)}>
                                  {record.eligibility_percentage}%
                                </Badge>
                              </td>
                              <td>
                                <Badge tone="primary">{record.bonus_type}</Badge>
                              </td>
                              <td className="num">{formatNumber(record.gross_salary)}</td>
                              <td className="num strong">{formatNumber(record.bonus_payable)}</td>
                              <td className="num">{formatNumber(record.cash_salary)}</td>
                              <td className="num">
                                <input
                                  type="number"
                                  value={getEditableValue(record, "cash_payment")}
                                  placeholder="0"
                                  onChange={(e) => updateEditableField(record, "cash_payment", e.target.value)}
                                  className="fin-cell-input"
                                  min="0"
                                  step="100"
                                  aria-label={`Cash payment, ${record.name}`}
                                />
                              </td>
                              <td>
                                <div className="fin-row" style={{ flexWrap: "nowrap", gap: 6 }}>
                                  <input
                                    type="number"
                                    value={getEditableValue(record, "manual_adjustment")}
                                    placeholder="±0"
                                    onChange={(e) => updateEditableField(record, "manual_adjustment", e.target.value)}
                                    className="fin-cell-input"
                                    min="-100000"
                                    step="100"
                                    aria-label={`Adjustment, ${record.name}`}
                                  />
                                  <input
                                    type="text"
                                    value={getEditableValue(record, "adjustment_reason")}
                                    placeholder="Reason"
                                    onChange={(e) => updateEditableField(record, "adjustment_reason", e.target.value)}
                                    className="fin-cell-input fin-cell-input--text"
                                    style={{ width: 130 }}
                                    maxLength="50"
                                    aria-label={`Adjustment reason, ${record.name}`}
                                  />
                                </div>
                              </td>
                              <td className="num strong text-pos">{formatNumber(c.totalPayable)}</td>
                              <td className="fin-col-id">{record.bank_account || "N/A"}</td>
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
                              <td className="center">
                                {record.is_approved ? (
                                  <Badge tone="success">
                                    <FaCheckCircle /> Approved
                                  </Badge>
                                ) : (
                                  <Badge tone="warning">
                                    <FaTimesCircle /> Pending
                                  </Badge>
                                )}
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
                            Total ({companyRecords.length})
                          </td>
                          <td colSpan={7} />
                          <td className="num">{formatNumber(totals.bonusPayable)}</td>
                          <td className="num">{formatNumber(totals.cashSalary)}</td>
                          <td className="num">{formatNumber(totals.cashPay)}</td>
                          <td className="num">{formatNumber(totals.adjustments)}</td>
                          <td className="num">{formatNumber(totals.totalPayable)}</td>
                          <td colSpan={4} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Card>
              );
            })}

            {Object.keys(openCompanies).every((comp) => !openCompanies[comp]) && filteredRecords.length > 0 && (
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
                        <th className="num">100%</th>
                        <th className="num">75%</th>
                        <th className="num">50%</th>
                        <th className="num">Not Eligible</th>
                        <th className="num">Bonus Payable</th>
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
                        <td className="num">{filteredRecords.length}</td>
                        <td className="num">{grand.full}</td>
                        <td className="num">{grand.seventy_five}</td>
                        <td className="num">{grand.fifty}</td>
                        <td className="num">{grand.none}</td>
                        <td className="num">{formatNumber(grand.bonusPayable)}</td>
                        <td className="num">{formatNumber(grand.cashPay)}</td>
                        <td className="num">{formatNumber(grand.adjustments)}</td>
                        <td className="num">{formatNumber(grand.totalPayable)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            )}

            {filteredRecords.length === 0 && !error && (
              <Card>
                <EmptyState
                  icon={records.length ? <FaExclamationTriangle /> : <FaGift />}
                  title={records.length ? "No records match your search" : "No bonus records found"}
                  action={
                    !records.length && (
                      <button onClick={() => navigate("/bonus-format")} className="fin-btn fin-btn--primary">
                        <FaGift /> Go to Bonus Sheet
                      </button>
                    )
                  }
                >
                  {records.length
                    ? "Try a different name, ID or company."
                    : isCurrentMonth
                      ? `Nothing saved for ${monthLabel} yet. Create it on the Bonus Sheet page.`
                      : `Nothing saved for ${monthLabel}. Try a different month, year or bonus type.`}
                </EmptyState>
              </Card>
            )}
          </>
        )}
      </div>
    </FinanceShell>
  );
};

export default BonusRecords;
