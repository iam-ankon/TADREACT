import React, { useState } from "react";
import { Form, Button, Table, Alert, Card } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

/* -------------------------------------------------------------
   TAX CALCULATION – pure JavaScript (identical to Python)
   ------------------------------------------------------------- */
const calculate_ait = (salary, gender, source_other = 0) => {
  if (salary <= 0) return { error: "Invalid salary amount" };
  if (source_other < 0) return { error: "Invalid source tax amount" };
  if (!["Male", "Female"].includes(gender))
    return { error: "Invalid gender! Must be Male or Female" };

  const first_slab = gender === "Male" ? 375000 : 400000;
  const title_gender = gender;
  const title_name = gender === "Male" ? "Mr. X" : "Ms. X";

  const bonus = salary;
  const basic = salary * 0.6;
  const house_rent = salary * 0.3;
  const medical = salary * 0.05;
  const conveyance = salary * 0.05;

  const total_income_ytd =
    (basic + house_rent + medical + conveyance) * 12 + bonus;
  const exemption = Math.min(500000, total_income_ytd / 3);
  const taxable_income_ytd = total_income_ytd - exemption;

  const tax_rebate_criteria = taxable_income_ytd * 0.03;
  const actual_investment = taxable_income_ytd * 0.15;
  const max_investment_limit = 1000000;
  const tax_rebate = Math.min(
    tax_rebate_criteria,
    actual_investment,
    max_investment_limit
  );

  const slabs = [
    { limit: first_slab, rate: 0 },
    { limit: 300000, rate: 0.1 },
    { limit: 400000, rate: 0.15 },
    { limit: 500000, rate: 0.2 },
    { limit: 2000000, rate: 0.25 },
    { limit: null, rate: 0.3 },
  ];

  let remaining = taxable_income_ytd;
  const tax_slabs = slabs.map((s) => {
    if (remaining <= 0) return { ...s, income: 0, tax: 0 };
    const income = s.limit === null ? remaining : Math.min(s.limit, remaining);
    const tax = income * s.rate;
    remaining -= income;
    return { limit: s.limit, rate: s.rate, income, tax };
  });

  const total_tax_payable = tax_slabs.reduce((a, b) => a + b.tax, 0);
  const net_tax_payable = Math.max(total_tax_payable - tax_rebate, 5000);
  const tax_payable = Math.max(net_tax_payable - source_other, 0);
  const monthly_tds = Math.round(tax_payable / 12);

  return {
    title: `${title_name} (Income Year 2025-2026)`,
    gender: title_gender,
    monthly_salary: salary,
    bonus,
    source_other,
    salary_breakdown: {
      basic: { monthly: basic, ytd: basic * 12 },
      house_rent: { monthly: house_rent, ytd: house_rent * 12 },
      medical: { monthly: medical, ytd: medical * 12 },
      conveyance: { monthly: conveyance, ytd: conveyance * 12 },
      bonus,
      total_income_ytd,
      exemption,
      taxable_income_ytd,
    },
    rebate: {
      taxable_income_3percent: tax_rebate_criteria,
      actual_investment_15percent: actual_investment,
      max_investment_limit,
      tax_rebate,
    },
    tax_slabs,
    tax_calculation: {
      total_tax_payable,
      tax_rebate,
      net_tax_payable,
      source_tax_other: source_other,
      tax_payable,
      monthly_tds,
    },
    employee_name: "Custom Employee",
  };
};

/* -------------------------------------------------------------
   MAIN COMPONENT – Updated to match TaxCalculators.jsx design
   ------------------------------------------------------------- */
const TaxCalculator = () => {
  const navigate = useNavigate();
  const [customSalary, setCustomSalary] = useState("");
  const [gender, setGender] = useState("Male");
  const [sourceOther, setSourceOther] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCalculate = () => {
    setError("");
    setResult(null);

    const salaryNum = parseFloat(customSalary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      setError("Please enter a valid salary greater than 0");
      return;
    }

    const data = calculate_ait(salaryNum, gender, sourceOther);
    if (data.error) {
      setError(data.error);
      return;
    }
    setResult(data);
  };

  const n = (v) =>
    (v ?? 0).toLocaleString("en-BD", { maximumFractionDigits: 0 });

  /* ----------------- EXACT STYLES FROM TaxCalculators.jsx ----------------- */
  const containerStyle = {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  };

  const headerStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "30px 20px",
    borderRadius: "10px",
    marginBottom: "30px",
    textAlign: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  };

  const cardStyle = {
    border: "none",
    borderRadius: "15px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
    marginBottom: "25px",
    overflow: "hidden",
  };

  const inputStyle = {
    borderRadius: "10px",
    border: "2px solid #e9ecef",
    padding: "12px 15px",
    fontSize: "16px",
    transition: "all 0.3s ease",
  };

  const buttonStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "10px",
    padding: "12px 30px",
    fontSize: "16px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
  };

  const tableHeaderStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    fontWeight: "600",
  };

  const resultCardStyle = {
    background: "linear-gradient(135deg, #c8e6ff 0%, #e1f0ff 100%)",
    border: "none",
    borderRadius: "15px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
    marginBottom: "25px",
  };

  const backButtonStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "10px",
    padding: "10px 20px",
    fontSize: "16px",
    fontWeight: "600",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
    marginBottom: "20px",
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: "700" }}>
          Tax Calculator
        </h1>
        <p style={{ margin: "10px 0 0 0", fontSize: "1.1rem", opacity: "0.9" }}>
          Calculate income tax for employees with detailed breakdown
        </p>
      </div>

      {error && (
        <Alert
          variant="danger"
          style={{
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
            color: "white",
            fontWeight: "500",
          }}
        >
          {error}
        </Alert>
      )}

      {/* Back Button and Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginBottom: "25px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={backButtonStyle}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.3)";
          }}
        >
          <FaArrowLeft /> Back
        </button>
        <h2 style={{ margin: 0, color: "#2c3e50" }}>
          Custom Tax Calculation
        </h2>
      </div>

      {/* Input Card */}
      <Card style={cardStyle}>
        <Card.Body style={{ padding: "30px" }}>
          <h3
            style={{
              color: "#333",
              marginBottom: "25px",
              fontWeight: "600",
              borderBottom: "3px solid #667eea",
              paddingBottom: "10px",
              display: "inline-block",
            }}
          >
            Update Inputs
          </h3>

          <Form>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "25px",
              }}
            >
              {/* Salary Input */}
              <Form.Group>
                <Form.Label
                  style={{
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: "8px",
                  }}
                >
                  Monthly Salary (BDT)
                </Form.Label>
                <Form.Control
                  type="number"
                  placeholder="e.g. 120000"
                  value={customSalary}
                  onChange={(e) => setCustomSalary(e.target.value)}
                  min="1"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#667eea";
                    e.target.style.boxShadow = "0 0 0 0.2rem rgba(102, 126, 234, 0.25)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e9ecef";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </Form.Group>

              {/* Gender Selection */}
              <Form.Group>
                <Form.Label
                  style={{
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: "8px",
                  }}
                >
                  Gender
                </Form.Label>
                <Form.Select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#667eea";
                    e.target.style.boxShadow = "0 0 0 0.2rem rgba(102, 126, 234, 0.25)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e9ecef";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </Form.Select>
              </Form.Group>

              {/* Source Other */}
              <Form.Group>
                <Form.Label
                  style={{
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: "8px",
                  }}
                >
                  Source Tax Other (BDT)
                </Form.Label>
                <Form.Control
                  type="number"
                  value={sourceOther}
                  onChange={(e) => setSourceOther(parseInt(e.target.value))}
                  min="0"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#667eea";
                    e.target.style.boxShadow = "0 0 0 0.2rem rgba(102, 126, 234, 0.25)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e9ecef";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </Form.Group>

              {/* Calculate Button */}
              <Form.Group style={{ display: "flex", alignItems: "flex-end" }}>
                <Button
                  variant="primary"
                  onClick={handleCalculate}
                  style={buttonStyle}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.3)";
                  }}
                >
                  Calculate Tax
                </Button>
              </Form.Group>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Results */}
      {result && (
        <div style={{ marginTop: "30px" }}>
          {(() => {
            const b = result.salary_breakdown;
            const r = result.rebate;
            const t = result.tax_calculation;
            const slabs = result.tax_slabs;

            // Calculate taxable ratio for proportional distribution (same as TaxCalculators.jsx)
            const taxableRatio = b.taxable_income_ytd / b.total_income_ytd;

            return (
              <>
                {/* Title Card */}
                <Card style={resultCardStyle}>
                  <Card.Body style={{ padding: "30px", textAlign: "center" }}>
                    <h3 style={{ color: "#2c3e50", marginBottom: "15px", fontWeight: "700" }}>
                      {result.title}
                    </h3>
                    <h5 style={{ color: "#34495e", marginBottom: "15px", fontWeight: "600" }}>
                      Simple Only Individual Tax Calculation for {result.gender} (Private Job)
                    </h5>
                    <p style={{ fontSize: "18px", color: "#2c3e50", fontWeight: "500", margin: 0 }}>
                      Employee: <strong>{result.employee_name}</strong>
                    </p>
                  </Card.Body>
                </Card>

                {/* Salary Breakdown */}
                <Card style={cardStyle}>
                  <Card.Body style={{ padding: "25px" }}>
                    <h4
                      style={{
                        color: "#2c3e50",
                        marginBottom: "20px",
                        fontWeight: "600",
                        borderBottom: "2px solid #667eea",
                        paddingBottom: "8px",
                      }}
                    >
                      Salary Breakdown
                    </h4>
                    <Table bordered style={{ borderRadius: "10px", overflow: "hidden" }}>
                      <thead>
                        <tr style={tableHeaderStyle}>
                          <th style={{ padding: "15px" }}>Particulars</th>
                          <th style={{ padding: "15px" }}>Income (Monthly)</th>
                          <th style={{ padding: "15px" }}>Total Income (YTD)</th>
                          <th style={{ padding: "15px" }}>Exemption ITA 2023</th>
                          <th style={{ padding: "15px" }}>Taxable Income (YTD)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: "basic", label: "Basic" },
                          { key: "house_rent", label: "House Rent" },
                          { key: "medical", label: "Medical" },
                          { key: "conveyance", label: "Conveyance" },
                        ].map((item, index) => {
                          const component = b[item.key];
                          const taxableYtd = component.ytd * taxableRatio;

                          return (
                            <tr
                              key={item.key}
                              style={{
                                background: index % 2 === 0 ? "#f8f9fa" : "white",
                              }}
                            >
                              <td style={{ padding: "12px 15px", fontWeight: "500" }}>
                                {item.label}
                              </td>
                              <td style={{ padding: "12px 15px" }}>
                                {n(component.monthly)}
                              </td>
                              <td style={{ padding: "12px 15px" }}>
                                {n(component.ytd)}
                              </td>
                              {index === 0 && (
                                <td
                                  rowSpan="5"
                                  style={{
                                    padding: "12px 15px",
                                    verticalAlign: "middle",
                                    textAlign: "center",
                                    background: "#f0f8ff",
                                  }}
                                >
                                  Exemption would be 500,000 or 1/3 of income from
                                  salary, whichever is lower
                                </td>
                              )}
                              <td style={{ padding: "12px 15px" }}>
                                {n(taxableYtd)}
                              </td>
                            </tr>
                          );
                        })}
                        <tr style={{ background: "#f8f9fa" }}>
                          <td style={{ padding: "12px 15px", fontWeight: "500" }}>
                            Bonus
                          </td>
                          <td style={{ padding: "12px 15px" }}>-</td>
                          <td style={{ padding: "12px 15px" }}>{n(b.bonus)}</td>
                          <td style={{ padding: "12px 15px" }}>
                            {n(b.bonus * taxableRatio)}
                          </td>
                        </tr>
                        <tr style={{ background: "#e3f2fd", fontWeight: "600" }}>
                          <td style={{ padding: "12px 15px" }}>Total</td>
                          <td style={{ padding: "12px 15px" }}>
                            {n(result.monthly_salary)}
                          </td>
                          <td style={{ padding: "12px 15px" }}>
                            {n(b.total_income_ytd)}
                          </td>
                          <td style={{ padding: "12px 15px" }}>{n(b.exemption)}</td>
                          <td style={{ padding: "12px 15px" }}>
                            {n(b.taxable_income_ytd)}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>

                {/* Rebate Calculation */}
                <Card style={cardStyle}>
                  <Card.Body style={{ padding: "25px" }}>
                    <h4
                      style={{
                        color: "#2c3e50",
                        marginBottom: "20px",
                        fontWeight: "600",
                        borderBottom: "2px solid #667eea",
                        paddingBottom: "8px",
                      }}
                    >
                      Rebate Calculation as Per ITA 2023
                    </h4>
                    <Table bordered style={{ borderRadius: "10px", overflow: "hidden" }}>
                      <thead>
                        <tr style={tableHeaderStyle}>
                          <th style={{ padding: "15px" }}>Criteria</th>
                          <th style={{ padding: "15px" }}>Figure</th>
                          <th style={{ padding: "15px" }}>Eligible Rate</th>
                          <th style={{ padding: "15px" }}>Eligible Rebate Tk.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            label: "A) Taxable Income 3%",
                            description: "3% of Total Taxable Income",
                            figure: b.taxable_income_ytd,
                            rate: "0.03",
                            calculatedRebate: b.taxable_income_ytd * 0.03,
                          },
                          {
                            label: "B) Actual Investment 15% DPS",
                            description: "15% of Total Taxable Income",
                            figure: b.taxable_income_ytd,
                            rate: "0.15",
                            calculatedRebate: b.taxable_income_ytd * 0.15,
                          },
                          {
                            label: "C) Maximum Investment Limit",
                            description: "Maximum allowed investment limit",
                            figure: r.max_investment_limit,
                            rate: "0",
                            calculatedRebate: 0,
                          },
                        ].map((item, index) => (
                          <tr
                            key={index}
                            style={{
                              background: index % 2 === 0 ? "#f8f9fa" : "white",
                            }}
                          >
                            <td style={{ padding: "12px 15px", fontWeight: "500" }}>
                              {item.label}
                              <br />
                              <small style={{ color: "#666", fontSize: "0.8rem" }}>
                                {item.description}
                              </small>
                            </td>
                            <td style={{ padding: "12px 15px" }}>{n(item.figure)}</td>
                            <td style={{ padding: "12px 15px" }}>
                              {item.rate === "0"
                                ? "-"
                                : parseFloat(item.rate) * 100 + "%"}
                            </td>
                            <td style={{ padding: "12px 15px" }}>
                              {item.rate !== "0" ? n(item.calculatedRebate) : "0"}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ background: "#e3f2fd", fontWeight: "600" }}>
                          <td style={{ padding: "12px 15px" }} colSpan="3">
                            Tax Rebate Tk.
                          </td>
                          <td style={{ padding: "12px 15px" }}>{n(r.tax_rebate)}</td>
                        </tr>
                      </tbody>
                    </Table>
                    <div
                      style={{ marginTop: "15px", fontSize: "0.9rem", color: "#666" }}
                    >
                      <strong>Note:</strong> The "Figure" values show the{" "}
                      <strong>Total Taxable Income (YTD)</strong> of{" "}
                      {n(b.taxable_income_ytd)} which is used to calculate the rebate
                      amounts
                    </div>
                  </Card.Body>
                </Card>

                {/* Tax Slabs */}
                <Card style={cardStyle}>
                  <Card.Body style={{ padding: "25px" }}>
                    <h4
                      style={{
                        color: "#2c3e50",
                        marginBottom: "20px",
                        fontWeight: "600",
                        borderBottom: "2px solid #667eea",
                        paddingBottom: "8px",
                      }}
                    >
                      Tax Calculation as Per ITA 2023 AY 2026-2027
                    </h4>
                    <Table bordered style={{ borderRadius: "10px", overflow: "hidden" }}>
                      <thead>
                        <tr style={tableHeaderStyle}>
                          <th style={{ padding: "15px" }}>Tax Slab</th>
                          <th style={{ padding: "15px" }}>Income→Slab</th>
                          <th style={{ padding: "15px" }}>Tax Rate</th>
                          <th style={{ padding: "15px" }}>Tax Payable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slabs.map((slab, index) => (
                          <tr
                            key={index}
                            style={{
                              background: index % 2 === 0 ? "#f8f9fa" : "white",
                            }}
                          >
                            <td style={{ padding: "12px 15px", fontWeight: "500" }}>
                              {slab.limit ? `${n(slab.limit)}+` : "Remaining"}
                            </td>
                            <td style={{ padding: "12px 15px" }}>{n(slab.income)}</td>
                            <td style={{ padding: "12px 15px" }}>
                              {parseFloat(slab.rate) * 100}%
                            </td>
                            <td style={{ padding: "12px 15px" }}>{n(slab.tax)}</td>
                          </tr>
                        ))}
                        <tr style={{ background: "#e3f2fd", fontWeight: "600" }}>
                          <td style={{ padding: "12px 15px" }}>Taxable Income</td>
                          <td style={{ padding: "12px 15px" }}>
                            {n(b.taxable_income_ytd)}
                          </td>
                          <td style={{ padding: "12px 15px" }}>Tax Payable</td>
                          <td style={{ padding: "12px 15px" }}>
                            {n(t.total_tax_payable)}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>

                {/* Net Tax Calculation */}
                <Card style={cardStyle}>
                  <Card.Body style={{ padding: "25px" }}>
                    <h4
                      style={{
                        color: "#2c3e50",
                        marginBottom: "20px",
                        fontWeight: "600",
                        borderBottom: "2px solid #667eea",
                        paddingBottom: "8px",
                      }}
                    >
                      Tax Calculation as Per ITA 2023
                    </h4>
                    <Table bordered style={{ borderRadius: "10px", overflow: "hidden" }}>
                      <thead>
                        <tr style={tableHeaderStyle}>
                          <th style={{ padding: "15px" }}>Particulars</th>
                          <th style={{ padding: "15px" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "Total Tax Payable", value: t.total_tax_payable },
                          { label: "Less: Tax Rebate", value: t.tax_rebate },
                          {
                            label: "Net Tax Payable",
                            value: t.net_tax_payable,
                            isBold: true,
                          },
                          { label: "Source Tax Other", value: sourceOther },
                          {
                            label: "Tax Payable",
                            value: t.tax_payable,
                            isBold: true,
                          },
                          {
                            label: "Monthly TDS Deduct",
                            value: t.monthly_tds,
                            isBold: true,
                          },
                        ].map((item, index) => (
                          <tr
                            key={index}
                            style={{
                              background: item.isBold
                                ? "#e3f2fd"
                                : index % 2 === 0
                                ? "#f8f9fa"
                                : "white",
                            }}
                          >
                            <td
                              style={{
                                padding: "12px 15px",
                                fontWeight: item.isBold ? "600" : "500",
                              }}
                            >
                              {item.label}
                            </td>
                            <td
                              style={{
                                padding: "12px 15px",
                                fontWeight: item.isBold ? "600" : "500",
                              }}
                            >
                              {n(item.value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default TaxCalculator;