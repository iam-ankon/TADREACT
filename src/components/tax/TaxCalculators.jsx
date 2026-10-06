// TaxCalculators.jsx - one employee's tax inputs and full calculation.
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEdit,
  FaSave,
  FaTimes,
  FaCalculator,
  FaUser,
  FaMoneyBillWave,
  FaPercent,
} from "react-icons/fa";

import { financeAPI } from "../../api/finance";
import {
  FinanceShell,
  Card,
  Kpi,
  Badge,
  Alert,
  LoadingState,
  formatMoney,
} from "./finance/FinanceUI";

// Inputs stored on the employee's CalculatedTax row.
const INPUTS = ["source_other", "bonus", "actual_investment", "rpf_monthly", "source_tax_minimum"];

const TaxCalculators = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [result, setResult] = useState(null);
  const [gender, setGender] = useState("Male");
  const [sourceOther, setSourceOther] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [actualInvestment, setActualInvestment] = useState(0);
  const [rpfMonthly, setRpfMonthly] = useState(0);
  // null = not manually overridden -> backend uses the gender default.
  const [sourceTaxMinimum, setSourceTaxMinimum] = useState(null);
  // Which field is being edited, and its draft value.
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  // Inputs whose real stored value is known (loaded from the server, or
  // edited here). Unknown ones are never sent on save, so the stored value
  // is kept instead of being overwritten with a placeholder 0.
  const known = useRef(new Set());
  const hasRow = useRef(false);

  // Helper function to format gender from employee data
  const formatGender = (empGender) => {
    const g = String(empGender || "").toLowerCase();
    if (g === "f" || g === "female") return "Female";
    return "Male";
  };

  const n = (val) => (Number(val) || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 });

  const fetchCalculatedTaxData = async () => {
    try {
      const response = await financeAPI.tax.getCalculatedTaxes({
        employee_ids: [employeeId],
      });
      if (response.data.success && response.data.results[employeeId]) {
        return response.data.results[employeeId];
      }
      return null;
    } catch (err) {
      console.error("Error fetching CalculatedTax data:", err);
      return null;
    }
  };

  const currentInputs = () => ({
    source_other: sourceOther,
    bonus,
    actual_investment: actualInvestment,
    rpf_monthly: rpfMonthly,
    source_tax_minimum: sourceTaxMinimum,
  });

  const calculate = async (inputs = currentInputs(), genderValue = gender) => {
    try {
      const response = await financeAPI.tax.calculate({
        employee_id: employeeId,
        gender: genderValue,
        ...inputs,
      });
      setResult(response.data);
      setError("");
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Calculation failed");
      return null;
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const emp = await financeAPI.employee.getById(employeeId);
        if (!emp) throw new Error("Employee not found");
        setEmployee(emp);

        const taxData = await fetchCalculatedTaxData();
        hasRow.current = !!taxData;
        known.current = new Set();

        let inputs;
        let genderValue = formatGender(emp.gender);
        if (taxData) {
          inputs = {};
          INPUTS.forEach((key) => {
            if (taxData[key] !== undefined) {
              known.current.add(key);
              inputs[key] = taxData[key];
            }
          });
          inputs = {
            source_other: inputs.source_other || 0,
            bonus: inputs.bonus || 0,
            actual_investment: inputs.actual_investment || 0,
            rpf_monthly: inputs.rpf_monthly || 0,
            source_tax_minimum:
              inputs.source_tax_minimum === undefined ? null : inputs.source_tax_minimum,
          };
          if (taxData.gender) genderValue = formatGender(taxData.gender);
        } else {
          // No saved row yet: start from what this browser last used.
          const pick = (data) => data[employeeId];
          const stm = pick(financeAPI.storage.getSourceTaxMinimum());
          inputs = {
            source_other: pick(financeAPI.storage.getSourceTaxOther()) || 0,
            bonus: pick(financeAPI.storage.getBonusOverride()) || 0,
            actual_investment: pick(financeAPI.storage.getActualInvestment()) || 0,
            rpf_monthly: pick(financeAPI.storage.getRpfMonthly()) || 0,
            source_tax_minimum: stm === undefined ? null : stm,
          };
          INPUTS.forEach((key) => known.current.add(key));
        }

        setGender(genderValue);
        setSourceOther(inputs.source_other);
        setBonus(inputs.bonus);
        setActualInvestment(inputs.actual_investment);
        setRpfMonthly(inputs.rpf_monthly);
        setSourceTaxMinimum(inputs.source_tax_minimum);
        await calculate(inputs, genderValue);
      } catch (err) {
        setError(err.message || "Failed to load");
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  // Recalculate (preview only, nothing saved) when the gender is switched.
  const handleGenderChange = (value) => {
    setGender(value);
    calculate(currentInputs(), value);
  };

  const STORAGE = {
    source_other: ["getSourceTaxOther", "setSourceTaxOther"],
    bonus: ["getBonusOverride", "setBonusOverride"],
    actual_investment: ["getActualInvestment", "setActualInvestment"],
    rpf_monthly: ["getRpfMonthly", "setRpfMonthly"],
    source_tax_minimum: ["getSourceTaxMinimum", "setSourceTaxMinimum"],
  };

  const rememberLocally = (field, val) => {
    const [getter, setter] = STORAGE[field];
    const saved = financeAPI.storage[getter]();
    if (val === null) delete saved[employeeId];
    else saved[employeeId] = val;
    financeAPI.storage[setter](saved);
  };

  const SETTERS = {
    source_other: setSourceOther,
    bonus: setBonus,
    actual_investment: setActualInvestment,
    rpf_monthly: setRpfMonthly,
    source_tax_minimum: setSourceTaxMinimum,
  };

  const startEdit = (field) => {
    const value = currentInputs()[field];
    setEditing(field);
    setEditValue(value === null || value === undefined ? "" : String(value));
  };

  // Save one input: recalculate with all current inputs, then store the
  // result together with the inputs whose real value is known.
  const saveField = async (field) => {
    let val;
    if (field === "source_tax_minimum") {
      // Empty input means "no override -- use the gender default".
      const trimmed = editValue.trim();
      val = trimmed === "" ? null : parseFloat(trimmed);
      if (val !== null && Number.isNaN(val)) {
        setNotice({
          tone: "warning",
          text: "Please enter a valid number, or leave it blank to use the gender default.",
        });
        return;
      }
    } else {
      val = parseFloat(editValue) || 0;
    }

    // Without every stored input the recalculated tax would be wrong, so
    // refuse rather than save a result that ignores e.g. the RPF.
    if (hasRow.current && INPUTS.some((key) => key !== field && !known.current.has(key))) {
      setNotice({
        tone: "warning",
        text: "Saving is paused: the server did not send all of this employee's saved inputs (it needs the latest update). Nothing was changed.",
      });
      return;
    }

    const inputs = { ...currentInputs(), [field]: val };
    setSaving(true);
    try {
      const calcData = await calculate(inputs);
      if (!calcData) throw new Error("Calculation failed");

      known.current.add(field);
      const payload = {
        employee_id: employeeId,
        calculation_data: calcData,
        calculated_by: "user",
      };
      INPUTS.forEach((key) => {
        if (!hasRow.current || known.current.has(key)) payload[key] = inputs[key];
      });

      const saveResponse = await financeAPI.tax.saveCalculatedTax(payload);
      if (!saveResponse.data.success) throw new Error("Save failed");

      hasRow.current = true;
      SETTERS[field](val);
      rememberLocally(field, val);
      setEditing(null);
      setNotice({ tone: "success", text: "Saved and recalculated." });
    } catch (err) {
      console.error(`Save ${field} failed:`, err);
      // Keep the value for this session so the calculation can still be
      // reviewed, but say clearly that the server does not have it.
      SETTERS[field](val);
      rememberLocally(field, val);
      setEditing(null);
      setNotice({
        tone: "danger",
        text: "Could not save to the server. The value is kept in this browser only — please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBackToDashboard = () => navigate("/finance-provision");

  if (loading) {
    return (
      <FinanceShell>
        <LoadingState page title="Loading tax calculation…" />
      </FinanceShell>
    );
  }

  if (error && !employee) {
    return (
      <FinanceShell>
        <div className="fin-stack">
          <Alert tone="danger" title="Could not load this employee">
            {error}
          </Alert>
          <div>
            <button className="fin-btn" onClick={handleBackToDashboard}>
              <FaArrowLeft /> Back to Tax Provision
            </button>
          </div>
        </div>
      </FinanceShell>
    );
  }

  const b = result?.salary_breakdown;
  const r = result?.rebate || {};
  const t = result?.tax_calculation || {};
  const slabs = result?.tax_slabs || [];
  const ratio = b && b.total_income_ytd ? b.taxable_income_ytd / b.total_income_ytd : 0;

  const inputField = (field, label, help, format = (v) => formatMoney(v)) => {
    const value = currentInputs()[field];
    const isEditing = editing === field;
    const unknown = hasRow.current && !known.current.has(field);
    return (
      <div className="fin-field" key={field}>
        <span className="fin-label">{label}</span>
        {isEditing ? (
          <div className="fin-row" style={{ flexWrap: "nowrap" }}>
            <input
              type="number"
              className="fin-input"
              style={{ flex: 1 }}
              value={editValue}
              autoFocus
              placeholder={field === "source_tax_minimum" ? "Blank = gender default" : "0"}
              onChange={(e) => setEditValue(e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveField(field);
                if (e.key === "Escape") setEditing(null);
              }}
            />
            <button
              className="fin-btn fin-btn--primary"
              onClick={() => saveField(field)}
              disabled={saving}
              title="Save (Enter)"
            >
              <FaSave /> Save
            </button>
            <button className="fin-btn fin-btn--ghost" onClick={() => setEditing(null)} title="Cancel">
              <FaTimes />
            </button>
          </div>
        ) : (
          <div className="fin-row" style={{ flexWrap: "nowrap" }}>
            <input className="fin-input" style={{ flex: 1 }} readOnly value={unknown ? "Not loaded" : format(value)} />
            <button
              className="fin-btn"
              onClick={() => startEdit(field)}
              disabled={saving || editing !== null}
              title={`Edit ${label}`}
            >
              <FaEdit /> Edit
            </button>
          </div>
        )}
        {help && <span className="fin-help">{help}</span>}
      </div>
    );
  };

  return (
    <FinanceShell
      title={employee?.name || "Tax Calculator"}
      icon={<FaUser />}
      meta={<Badge tone="primary">{employeeId}</Badge>}
      subtitle={[employee?.designation, employee?.company_name].filter(Boolean).join(" · ")}
      actions={
        <button className="fin-btn" onClick={handleBackToDashboard}>
          <FaArrowLeft /> Back to Tax Provision
        </button>
      }
    >
      <div className="fin-stack">
        {notice && (
          <Alert
            tone={notice.tone}
            action={
              <button className="fin-btn fin-btn--ghost fin-btn--sm" onClick={() => setNotice(null)}>
                <FaTimes />
              </button>
            }
          >
            {notice.text}
          </Alert>
        )}
        {error && employee && <Alert tone="danger">{error}</Alert>}

        {result && (
          <div className="fin-kpis">
            <Kpi
              tone="primary"
              icon={<FaMoneyBillWave />}
              label="Monthly salary"
              value={formatMoney(result.monthly_salary)}
              hint={result.title}
            />
            <Kpi
              tone="info"
              icon={<FaCalculator />}
              label="Net tax payable (year)"
              value={formatMoney(t.net_tax_payable)}
              hint={`Taxable income ${formatMoney(b?.taxable_income_ytd)}`}
            />
            <Kpi
              tone="success"
              icon={<FaPercent />}
              label="Monthly TDS"
              value={formatMoney(t.monthly_tds)}
              hint={
                t.should_deduct_tax ? (
                  <Badge tone="success">Deducted from salary</Badge>
                ) : (
                  <Badge>Not deducted</Badge>
                )
              }
            />
            <Kpi
              label="Tax payable after source tax"
              value={formatMoney(t.tax_payable)}
              hint={t.deduction_reason}
            />
          </div>
        )}

        <Card
          title="Tax inputs"
          subtitle="Saving an input recalculates the tax and stores it for this employee. Other inputs are kept as they are."
        >
          <div className="fin-grid-form">
            <div className="fin-field">
              <span className="fin-label">Gender</span>
              <select
                className="fin-select"
                value={gender}
                onChange={(e) => handleGenderChange(e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <span className="fin-help">Sets the tax-free slab. Saved with the next input you save.</span>
            </div>
            {inputField("source_other", "Source Tax Other (Yearly, BDT)", "Tax already paid at source elsewhere.")}
            {inputField("bonus", "Bonus (Yearly, BDT)", "Yearly bonus used for taxable income.")}
            {inputField(
              "actual_investment",
              "Actual Investment / DPS (Yearly, BDT)",
              "Used for the 15%-of-investment rebate criterion.",
            )}
            {inputField("rpf_monthly", "RPF (Monthly, BDT)", "Employer-specific, added to yearly taxable income.")}
            {inputField(
              "source_tax_minimum",
              "Source Tax (Minimum, BDT)",
              "Leave blank to use the gender default.",
              (v) => (v === null || v === undefined ? "Default (by gender)" : formatMoney(v)),
            )}
          </div>
        </Card>

        {result && b && (
          <>
            <div className="fin-grid-2">
              <Card flush title="Salary breakdown" subtitle={result.title}>
                <div className="fin-table-wrap fin-table-wrap--auto">
                  <table className="fin-table">
                    <thead>
                      <tr>
                        <th>Particulars</th>
                        <th className="num">Monthly</th>
                        <th className="num">Total (YTD)</th>
                        <th className="num">Taxable (YTD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: "basic", label: "Basic" },
                        { key: "house_rent", label: "House Rent" },
                        { key: "medical", label: "Medical" },
                        { key: "conveyance", label: "Conveyance" },
                        { key: "rpf", label: "RPF" },
                      ].map((item) => {
                        const component = b[item.key] || { monthly: 0, ytd: 0 };
                        return (
                          <tr key={item.key}>
                            <td className="strong">{item.label}</td>
                            <td className="num">{n(component.monthly)}</td>
                            <td className="num">{n(component.ytd)}</td>
                            <td className="num">{n(component.ytd * ratio)}</td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td className="strong">Bonus</td>
                        <td className="num muted">—</td>
                        <td className="num">{n(b.bonus)}</td>
                        <td className="num">{n(b.bonus * ratio)}</td>
                      </tr>
                      <tr>
                        <td className="strong">Less: Exemption</td>
                        <td className="num muted" colSpan={2} style={{ whiteSpace: "normal" }}>
                          500,000 or 1/3 of income, whichever is lower
                        </td>
                        <td className="num">({n(b.exemption)})</td>
                      </tr>
                      <tr className="fin-total-row">
                        <td>Total</td>
                        <td className="num">{n(b.total_income_monthly ?? result.monthly_salary)}</td>
                        <td className="num">{n(b.total_income_ytd)}</td>
                        <td className="num">{n(b.taxable_income_ytd)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card flush title="Net tax payable" subtitle="ITA 2026 (Finance Act 2026)">
                <div className="fin-table-wrap fin-table-wrap--auto">
                  <table className="fin-table">
                    <tbody>
                      {[
                        { label: "Total tax payable (slabs)", value: t.total_tax_payable },
                        { label: "Less: Tax rebate (3% of taxable income)", value: t.tax_rebate, minus: true },
                        { label: "Net tax payable", value: t.net_tax_payable, bold: true },
                        { label: "Less: Source tax (minimum)", value: t.source_tax_minimum, minus: true },
                        { label: "Less: Source tax other", value: t.source_tax_other ?? sourceOther, minus: true },
                        { label: "Tax payable", value: t.tax_payable, bold: true },
                        { label: "Monthly TDS deduction", value: t.monthly_tds, bold: true },
                      ].map((item) => (
                        <tr key={item.label} className={item.bold ? "fin-row-expanded" : ""}>
                          <td className={item.bold ? "strong" : ""}>{item.label}</td>
                          <td className={`num ${item.bold ? "strong" : ""}`}>
                            {item.minus ? `(${n(item.value)})` : n(item.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className="fin-grid-2">
              <Card flush title="Tax slabs" subtitle="ITA 2026 (Finance Act 2026)">
                <div className="fin-table-wrap fin-table-wrap--auto">
                  <table className="fin-table">
                    <thead>
                      <tr>
                        <th>Slab</th>
                        <th className="num">Income in slab</th>
                        <th className="num">Rate</th>
                        <th className="num">Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slabs.map((slab, index) => (
                        <tr key={index}>
                          <td className="strong">{slab.limit ? `Next ${n(slab.limit)}` : "Remaining"}</td>
                          <td className="num">{n(slab.income)}</td>
                          <td className="num">{Math.round(parseFloat(slab.rate) * 100)}%</td>
                          <td className="num">{n(slab.tax)}</td>
                        </tr>
                      ))}
                      <tr className="fin-total-row">
                        <td>Taxable income {n(b.taxable_income_ytd)}</td>
                        <td className="num" />
                        <td className="num">Total</td>
                        <td className="num">{n(t.total_tax_payable)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card flush title="Rebate calculation" subtitle="Reported rebate; the net-tax step subtracts the 3% figure">
                <div className="fin-table-wrap fin-table-wrap--auto">
                  <table className="fin-table">
                    <thead>
                      <tr>
                        <th>Criteria</th>
                        <th className="num">Figure</th>
                        <th className="num">Rate</th>
                        <th className="num">Rebate</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="strong">A) 3% of taxable income</td>
                        <td className="num">{n(b.taxable_income_ytd)}</td>
                        <td className="num">3%</td>
                        <td className="num">{n(r.taxable_income_3percent)}</td>
                      </tr>
                      <tr>
                        <td className="strong">B) 15% of actual investment / DPS</td>
                        <td className="num">{n(result.actual_investment ?? actualInvestment)}</td>
                        <td className="num">15%</td>
                        <td className="num">{n(r.actual_investment_15percent)}</td>
                      </tr>
                      <tr>
                        <td className="strong">C) Maximum investment limit</td>
                        <td className="num">{n(r.max_investment_limit)}</td>
                        <td className="num muted">—</td>
                        <td className="num muted">—</td>
                      </tr>
                      <tr className="fin-total-row">
                        <td colSpan={3}>Tax rebate (lower of A and B)</td>
                        <td className="num">{n(r.tax_rebate)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </FinanceShell>
  );
};

export default TaxCalculators;
