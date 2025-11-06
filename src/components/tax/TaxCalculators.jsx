// src/pages/finance/TaxCalculators.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, Table, Alert, Card } from "react-bootstrap";
import { FaArrowLeft, FaEdit, FaSave } from "react-icons/fa";

const API_BASE = "http://119.148.51.38:8000/api/tax-calculator";

const TaxCalculators = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [result, setResult] = useState(null);
  const [gender, setGender] = useState("Male");
  const [sourceOther, setSourceOther] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("0");
  const [editingBonus, setEditingBonus] = useState(false);
  const [editBonusValue, setEditBonusValue] = useState("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const n = (val) =>
    (val ?? 0).toLocaleString("en-BD", { maximumFractionDigits: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const empRes = await axios.get(`${API_BASE}/employees/`);
        const emp = empRes.data.find((e) => e.employee_id === employeeId);
        if (!emp) throw new Error("Employee not found");

        setEmployee(emp);
        setGender(emp.gender === "M" ? "Male" : "Female");

        // Load Source Tax Other
        const saved = localStorage.getItem("sourceTaxOther");
        const savedVal = saved ? JSON.parse(saved)[employeeId] || 0 : 0;
        setSourceOther(savedVal);
        setEditValue(savedVal.toString());

        // Load Bonus Override
        const savedBonus = localStorage.getItem("bonusOverride");
        const savedBonusVal = savedBonus
          ? JSON.parse(savedBonus)[employeeId] || 0
          : 0;
        setBonus(savedBonusVal);
        setEditBonusValue(savedBonusVal.toString());

        await calculate(savedVal, savedBonusVal);
      } catch (err) {
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    const calculate = async (other = sourceOther, bonusVal = bonus) => {
      const res = await axios.post(`${API_BASE}/calculate/`, {
        employee_id: employeeId,
        gender,
        source_other: parseFloat(other) || 0,
        bonus: parseFloat(bonusVal) || 0,
      });
      setResult(res.data);
    };

    if (employeeId) load();
  }, [employeeId]);

  // Auto recalculate on input change
  useEffect(() => {
    if (!employee) return;
    const timer = setTimeout(() => {
      axios
        .post(`${API_BASE}/calculate/`, {
          employee_id: employeeId,
          gender,
          source_other: sourceOther,
          bonus: bonus,
        })
        .then((r) => setResult(r.data));
    }, 500);
    return () => clearTimeout(timer);
  }, [gender, sourceOther, bonus]);

  const handleSave = async () => {
    const val = parseFloat(editValue) || 0;
    setSourceOther(val);
    setEditing(false);
    try {
      await axios.post(`${API_BASE}/save-tax-extra/`, {
        employee_id: employeeId,
        source_other: val,
        bonus: bonus, // Keep current bonus
      });
    } catch (err) {
      console.error("Save source failed:", err);
    }
    // Fallback localStorage
    const saved = JSON.parse(localStorage.getItem("sourceTaxOther") || "{}");
    saved[employeeId] = val;
    localStorage.setItem("sourceTaxOther", JSON.stringify(saved));
  };

  const handleSaveBonus = async () => {
    const val = parseFloat(editBonusValue) || 0;
    setBonus(val);
    setEditingBonus(false);
    try {
      await axios.post(`${API_BASE}/save-tax-extra/`, {
        employee_id: employeeId,
        source_other: sourceOther, // Keep current source
        bonus: val,
      });
    } catch (err) {
      console.error("Save bonus failed:", err);
    }
    // Fallback localStorage
    const saved = JSON.parse(localStorage.getItem("bonusOverride") || "{}");
    saved[employeeId] = val;
    localStorage.setItem("bonusOverride", JSON.stringify(saved));
  };

  // Styles (unchanged)
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

  if (loading)
    return (
      <div style={containerStyle}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
            color: "#667eea",
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "5px solid #f3f3f3",
              borderTop: "5px solid #667eea",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "20px",
            }}
          ></div>
          <p>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );

  if (error || !result)
    return (
      <div style={containerStyle}>
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
      </div>
    );

  const b = result.salary_breakdown;
  const r = result.rebate;
  const t = result.tax_calculation;
  const slabs = result.tax_slabs;

  const taxableRatio = b.taxable_income_ytd / b.total_income_ytd;

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

      {/* Back Button and Employee Info */}
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
          {employee.name} (ID: {employeeId})
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
                    e.target.style.boxShadow =
                      "0 0 0 0.2rem rgba(102, 126, 234, 0.25)";
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

              {/* Source Tax Other */}
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
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-end",
                  }}
                >
                  {editing ? (
                    <>
                      <Form.Control
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={inputStyle}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#667eea";
                          e.target.style.boxShadow =
                            "0 0 0 0.2rem rgba(102, 126, 234, 0.25)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e9ecef";
                          e.target.style.boxShadow = "none";
                        }}
                        autoFocus
                      />
                      <FaSave
                        onClick={handleSave}
                        style={{
                          fontSize: "24px",
                          cursor: "pointer",
                          color: "#10b981",
                          marginBottom: "12px",
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <Form.Control
                        value={n(sourceOther)}
                        readOnly
                        style={inputStyle}
                      />
                      <FaEdit
                        onClick={() => setEditing(true)}
                        style={{
                          fontSize: "24px",
                          cursor: "pointer",
                          color: "#667eea",
                          marginBottom: "12px",
                        }}
                      />
                    </>
                  )}
                </div>
              </Form.Group>

              {/* Bonus Input */}
              <Form.Group>
                <Form.Label
                  style={{
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: "8px",
                  }}
                >
                  Bonus (BDT)
                </Form.Label>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-end",
                  }}
                >
                  {editingBonus ? (
                    <>
                      <Form.Control
                        type="number"
                        value={editBonusValue}
                        onChange={(e) => setEditBonusValue(e.target.value)}
                        style={inputStyle}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#667eea";
                          e.target.style.boxShadow =
                            "0 0 0 0.2rem rgba(102, 126, 234, 0.25)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e9ecef";
                          e.target.style.boxShadow = "none";
                        }}
                        autoFocus
                      />
                      <FaSave
                        onClick={handleSaveBonus}
                        style={{
                          fontSize: "24px",
                          cursor: "pointer",
                          color: "#10b981",
                          marginBottom: "12px",
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <Form.Control
                        value={n(bonus)}
                        readOnly
                        style={inputStyle}
                      />
                      <FaEdit
                        onClick={() => setEditingBonus(true)}
                        style={{
                          fontSize: "24px",
                          cursor: "pointer",
                          color: "#667eea",
                          marginBottom: "12px",
                        }}
                      />
                    </>
                  )}
                </div>
              </Form.Group>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Results Section */}
      {result && (
        <div style={{ marginTop: "30px" }}>
          {/* Result Header */}
          <Card style={resultCardStyle}>
            <Card.Body style={{ padding: "30px", textAlign: "center" }}>
              <h3
                style={{
                  color: "#2c3e50",
                  marginBottom: "15px",
                  fontWeight: "700",
                }}
              >
                {result.title}
              </h3>
              <h5
                style={{
                  color: "#34495e",
                  marginBottom: "15px",
                  fontWeight: "600",
                }}
              >
                Simple Only Individual Tax Calculation for {result.gender}{" "}
                (Private Job)
              </h5>
              <p
                style={{
                  fontSize: "18px",
                  color: "#2c3e50",
                  fontWeight: "500",
                  margin: 0,
                }}
              >
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
              <Table
                bordered
                style={{ borderRadius: "10px", overflow: "hidden" }}
              >
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
              <Table
                bordered
                style={{ borderRadius: "10px", overflow: "hidden" }}
              >
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
              <Table
                bordered
                style={{ borderRadius: "10px", overflow: "hidden" }}
              >
                <thead>
                  <tr style={tableHeaderStyle}>
                    <th style={{ padding: "15px" }}>Tax Slab</th>
                    <th style={{ padding: "15px" }}>Income to Slab</th>
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
              <Table
                bordered
                style={{ borderRadius: "10px", overflow: "hidden" }}
              >
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

          {/* PDF Button */}
          {result.payroll_pdf && (
            <div style={{ textAlign: "center", margin: "40px 0" }}>
              <a
                href={result.payroll_pdf}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  padding: "16px 50px",
                  borderRadius: "16px",
                  textDecoration: "none",
                  fontWeight: "700",
                  fontSize: "1.2rem",
                  boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)",
                  display: "inline-block",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 12px 30px rgba(16, 185, 129, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 8px 25px rgba(16, 185, 129, 0.3)";
                }}
              >
                View Payroll PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaxCalculators;
