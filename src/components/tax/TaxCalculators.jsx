import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, Table, Alert, Card } from "react-bootstrap";
import { FaArrowLeft, FaEdit, FaSave } from "react-icons/fa";

// Import API services
import { financeAPI } from "../../api/finance";

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
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("0");
  const [editingBonus, setEditingBonus] = useState(false);
  const [editBonusValue, setEditBonusValue] = useState("0");
  const [editingInvestment, setEditingInvestment] = useState(false);
  const [editInvestmentValue, setEditInvestmentValue] = useState("0");
  const [editingRpf, setEditingRpf] = useState(false);
  const [editRpfValue, setEditRpfValue] = useState("0");
  // null = not manually overridden -> backend uses the gender default
  // (25,000 Male / 50,000 Female).
  const [sourceTaxMinimum, setSourceTaxMinimum] = useState(null);
  const [editingSourceTaxMinimum, setEditingSourceTaxMinimum] = useState(false);
  const [editSourceTaxMinimumValue, setEditSourceTaxMinimumValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Helper function to format gender from employee data
  const formatGender = (empGender) => {
    if (!empGender) return "Male";
    
    const genderLower = String(empGender).toLowerCase();
    
    if (genderLower === 'f' || genderLower === 'female') {
      return "Female";
    }
    if (genderLower === 'm' || genderLower === 'male') {
      return "Male";
    }
    
    // Default to Male
    return "Male";
  };

  const n = (val) =>
    (val ?? 0).toLocaleString("en-BD", { maximumFractionDigits: 0 });

  // Function to fetch CalculatedTax data
  const fetchCalculatedTaxData = async () => {
    try {
      // Fetch saved calculations from CalculatedTax model
      const response = await financeAPI.tax.getCalculatedTaxes({
        employee_ids: [employeeId],
      });
      
      if (response.data.success && response.data.results[employeeId]) {
        const taxData = response.data.results[employeeId];
        
        // Extract source_other and bonus from the taxData object
        const backendSourceOther = taxData.source_other || 0;
        const backendBonus = taxData.bonus || 0;
        const backendInvestment = taxData.actual_investment || 0;
        const backendRpf = taxData.rpf_monthly || 0;
        // null/undefined here means "no override" -- keep it null, not 0.
        const backendSourceTaxMinimum =
          taxData.source_tax_minimum === undefined || taxData.source_tax_minimum === null
            ? null
            : taxData.source_tax_minimum;
        
        console.log(`Loaded from CalculatedTax: Source Other: ${backendSourceOther}, Bonus: ${backendBonus}, Investment: ${backendInvestment}, RPF: ${backendRpf}, Source Tax Minimum: ${backendSourceTaxMinimum}`);
        
        return {
          source_other: backendSourceOther,
          bonus: backendBonus,
          actual_investment: backendInvestment,
          rpf_monthly: backendRpf,
          source_tax_minimum: backendSourceTaxMinimum,
          calculation_data: taxData.calculation_data
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching CalculatedTax data:", error);
      return null;
    }
  };

  // Function to save CalculatedTax data
  const saveCalculatedTaxData = async (
    sourceOtherVal,
    bonusVal,
    investmentVal = actualInvestment,
    rpfVal = rpfMonthly,
    sourceTaxMinimumVal = sourceTaxMinimum,
  ) => {
    try {
      // First, calculate the tax with current inputs
      const response = await financeAPI.tax.calculate({
        employee_id: employeeId,
        gender,
        source_other: sourceOtherVal,
        bonus: bonusVal,
        actual_investment: investmentVal,
        rpf_monthly: rpfVal,
        source_tax_minimum: sourceTaxMinimumVal,
      });
      
      if (response.data) {
        // Save the calculation to CalculatedTax model
        const saveResponse = await financeAPI.tax.saveCalculatedTax({
          employee_id: employeeId,
          calculation_data: response.data,
          calculated_by: "user",
          source_other: sourceOtherVal,
          bonus: bonusVal,
          actual_investment: investmentVal,
          rpf_monthly: rpfVal,
          source_tax_minimum: sourceTaxMinimumVal,
        });
        
        if (saveResponse.data.success) {
          console.log("Successfully saved to CalculatedTax model");
          return true;
        }
      }
    } catch (error) {
      console.error("Error saving to CalculatedTax:", error);
    }
    return false;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Fetch employee data
        const emp = await financeAPI.employee.getById(employeeId);
        if (!emp) throw new Error("Employee not found");

        setEmployee(emp);
        
        // FIX: Properly format gender from employee data
        const formattedGender = formatGender(emp.gender);
        console.log(`Employee gender from API: "${emp.gender}" -> Formatted: "${formattedGender}"`);
        setGender(formattedGender);

        // Try to load from CalculatedTax model first
        const taxData = await fetchCalculatedTaxData();
        
        if (taxData) {
          // Use values from CalculatedTax model
          setSourceOther(taxData.source_other);
          setEditValue(taxData.source_other.toString());
          setBonus(taxData.bonus);
          setEditBonusValue(taxData.bonus.toString());
          setActualInvestment(taxData.actual_investment);
          setEditInvestmentValue(taxData.actual_investment.toString());
          setRpfMonthly(taxData.rpf_monthly);
          setEditRpfValue(taxData.rpf_monthly.toString());
          setSourceTaxMinimum(taxData.source_tax_minimum);
          setEditSourceTaxMinimumValue(
            taxData.source_tax_minimum === null || taxData.source_tax_minimum === undefined
              ? ""
              : taxData.source_tax_minimum.toString()
          );
          
          // Calculate with the fetched values
          await calculate(
            taxData.source_other,
            taxData.bonus,
            taxData.actual_investment,
            taxData.rpf_monthly,
            taxData.source_tax_minimum,
          );
        } else {
          // If no CalculatedTax data exists, try localStorage as fallback
          console.log("No CalculatedTax data found, trying localStorage fallback");
          
          const savedSource = await financeAPI.storage.getSourceTaxOther();
          const savedVal = savedSource[employeeId] || 0;
          
          const savedBonus = await financeAPI.storage.getBonusOverride();
          const savedBonusVal = savedBonus[employeeId] || 0;

          const savedInvestment = await financeAPI.storage.getActualInvestment();
          const savedInvestmentVal = savedInvestment[employeeId] || 0;

          const savedRpf = await financeAPI.storage.getRpfMonthly();
          const savedRpfVal = savedRpf[employeeId] || 0;

          const savedSourceTaxMinimum = await financeAPI.storage.getSourceTaxMinimum();
          const savedSourceTaxMinimumVal =
            savedSourceTaxMinimum[employeeId] === undefined ? null : savedSourceTaxMinimum[employeeId];

          console.log(`Loaded from localStorage: Source Other: ${savedVal}, Bonus: ${savedBonusVal}, Investment: ${savedInvestmentVal}, RPF: ${savedRpfVal}, Source Tax Minimum: ${savedSourceTaxMinimumVal}`);

          setSourceOther(savedVal);
          setEditValue(savedVal.toString());
          setBonus(savedBonusVal);
          setEditBonusValue(savedBonusVal.toString());
          setActualInvestment(savedInvestmentVal);
          setEditInvestmentValue(savedInvestmentVal.toString());
          setRpfMonthly(savedRpfVal);
          setEditRpfValue(savedRpfVal.toString());
          setSourceTaxMinimum(savedSourceTaxMinimumVal);
          setEditSourceTaxMinimumValue(
            savedSourceTaxMinimumVal === null ? "" : savedSourceTaxMinimumVal.toString()
          );

          await calculate(savedVal, savedBonusVal, savedInvestmentVal, savedRpfVal, savedSourceTaxMinimumVal);
        }
      } catch (err) {
        setError(err.message || "Failed to load");
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) load();
  }, [employeeId]);

  const calculate = async (
    sourceVal,
    bonusVal,
    investmentVal = actualInvestment,
    rpfVal = rpfMonthly,
    sourceTaxMinimumVal = sourceTaxMinimum,
  ) => {
    try {
      const response = await financeAPI.tax.calculate({
        employee_id: employeeId,
        gender,
        source_other: sourceVal,
        bonus: bonusVal,
        actual_investment: investmentVal,
        rpf_monthly: rpfVal,
        source_tax_minimum: sourceTaxMinimumVal,
      });
      
      const newResult = response.data;
      setResult(newResult);
      
    } catch (err) {
      setError(err.response?.data?.error || "Calculation failed");
    }
  };

  // Auto recalculate on input change
  useEffect(() => {
    if (!employee) return;
    const timer = setTimeout(() => {
      calculate(sourceOther, bonus, actualInvestment, rpfMonthly, sourceTaxMinimum);
    }, 500);
    return () => clearTimeout(timer);
  }, [gender, sourceOther, bonus, actualInvestment, rpfMonthly, sourceTaxMinimum, employee]);

  const handleSave = async () => {
    const val = parseFloat(editValue) || 0;

    try {
      // Save to CalculatedTax model
      const saved = await saveCalculatedTaxData(val, bonus);
      
      if (saved) {
        // Update state
        setSourceOther(val);
        setEditing(false);
        
        // Update localStorage as backup
        const savedLocal = await financeAPI.storage.getSourceTaxOther();
        savedLocal[employeeId] = val;
        financeAPI.storage.setSourceTaxOther(savedLocal);
        
        // Trigger calculation
        await calculate(val, bonus);
        
        console.log("Successfully saved source tax other to CalculatedTax model");
      } else {
        throw new Error("Failed to save to CalculatedTax model");
      }
    } catch (err) {
      console.error("Save source failed:", err);
      alert("Failed to save to server. Using local storage only.");
      
      // Fallback to localStorage only
      setSourceOther(val);
      setEditing(false);
      const saved = await financeAPI.storage.getSourceTaxOther();
      saved[employeeId] = val;
      financeAPI.storage.setSourceTaxOther(saved);
      
      // Trigger calculation with local data
      await calculate(val, bonus);
    }
  };

  const handleSaveBonus = async () => {
    const val = parseFloat(editBonusValue) || 0;

    try {
      // Save to CalculatedTax model
      const saved = await saveCalculatedTaxData(sourceOther, val, actualInvestment, rpfMonthly);
      
      if (saved) {
        // Update state
        setBonus(val);
        setEditingBonus(false);
        
        // Update localStorage as backup
        const savedLocal = await financeAPI.storage.getBonusOverride();
        savedLocal[employeeId] = val;
        financeAPI.storage.setBonusOverride(savedLocal);
        
        // Trigger calculation
        await calculate(sourceOther, val, actualInvestment, rpfMonthly);
        
        console.log("Successfully saved bonus to CalculatedTax model");
      } else {
        throw new Error("Failed to save to CalculatedTax model");
      }
    } catch (err) {
      console.error("Save bonus failed:", err);
      alert("Failed to save to server. Using local storage only.");
      
      // Fallback to localStorage only
      setBonus(val);
      setEditingBonus(false);
      const saved = await financeAPI.storage.getBonusOverride();
      saved[employeeId] = val;
      financeAPI.storage.setBonusOverride(saved);
      
      await calculate(sourceOther, val, actualInvestment, rpfMonthly);
    }
  };

  const handleSaveInvestment = async () => {
    const val = parseFloat(editInvestmentValue) || 0;

    try {
      const saved = await saveCalculatedTaxData(sourceOther, bonus, val, rpfMonthly);

      if (saved) {
        setActualInvestment(val);
        setEditingInvestment(false);

        const savedLocal = await financeAPI.storage.getActualInvestment();
        savedLocal[employeeId] = val;
        financeAPI.storage.setActualInvestment(savedLocal);

        await calculate(sourceOther, bonus, val, rpfMonthly);

        console.log("Successfully saved actual investment to CalculatedTax model");
      } else {
        throw new Error("Failed to save to CalculatedTax model");
      }
    } catch (err) {
      console.error("Save investment failed:", err);
      alert("Failed to save to server. Using local storage only.");

      setActualInvestment(val);
      setEditingInvestment(false);
      const saved = await financeAPI.storage.getActualInvestment();
      saved[employeeId] = val;
      financeAPI.storage.setActualInvestment(saved);

      await calculate(sourceOther, bonus, val, rpfMonthly);
    }
  };

  const handleSaveRpf = async () => {
    const val = parseFloat(editRpfValue) || 0;

    try {
      const saved = await saveCalculatedTaxData(sourceOther, bonus, actualInvestment, val);

      if (saved) {
        setRpfMonthly(val);
        setEditingRpf(false);

        const savedLocal = await financeAPI.storage.getRpfMonthly();
        savedLocal[employeeId] = val;
        financeAPI.storage.setRpfMonthly(savedLocal);

        await calculate(sourceOther, bonus, actualInvestment, val);

        console.log("Successfully saved RPF (monthly) to CalculatedTax model");
      } else {
        throw new Error("Failed to save to CalculatedTax model");
      }
    } catch (err) {
      console.error("Save RPF failed:", err);
      alert("Failed to save to server. Using local storage only.");

      setRpfMonthly(val);
      setEditingRpf(false);
      const saved = await financeAPI.storage.getRpfMonthly();
      saved[employeeId] = val;
      financeAPI.storage.setRpfMonthly(saved);

      await calculate(sourceOther, bonus, actualInvestment, val);
    }
  };

  const handleSaveSourceTaxMinimum = async () => {
    // Empty input means "no override -- use the gender default".
    const trimmed = editSourceTaxMinimumValue.trim();
    const val = trimmed === "" ? null : parseFloat(trimmed);
    if (val !== null && Number.isNaN(val)) {
      alert("Please enter a valid number, or leave blank to use the gender default.");
      return;
    }

    try {
      const saved = await saveCalculatedTaxData(sourceOther, bonus, actualInvestment, rpfMonthly, val);

      if (saved) {
        setSourceTaxMinimum(val);
        setEditingSourceTaxMinimum(false);

        const savedLocal = await financeAPI.storage.getSourceTaxMinimum();
        if (val === null) {
          delete savedLocal[employeeId];
        } else {
          savedLocal[employeeId] = val;
        }
        financeAPI.storage.setSourceTaxMinimum(savedLocal);

        await calculate(sourceOther, bonus, actualInvestment, rpfMonthly, val);

        console.log("Successfully saved source tax minimum to CalculatedTax model");
      } else {
        throw new Error("Failed to save to CalculatedTax model");
      }
    } catch (err) {
      console.error("Save source tax minimum failed:", err);
      alert("Failed to save to server. Using local storage only.");

      setSourceTaxMinimum(val);
      setEditingSourceTaxMinimum(false);
      const saved = await financeAPI.storage.getSourceTaxMinimum();
      if (val === null) {
        delete saved[employeeId];
      } else {
        saved[employeeId] = val;
      }
      financeAPI.storage.setSourceTaxMinimum(saved);

      await calculate(sourceOther, bonus, actualInvestment, rpfMonthly, val);
    }
  };

  // Function to navigate back
  const handleBackToDashboard = () => {
    navigate('/finance-provision');
  };

  // Styles
  const containerStyle = {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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

  if (error || !employee)
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
          onClick={handleBackToDashboard}
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
          <FaArrowLeft /> Back to Dashboard
        </button>
      </div>
    );

  if (!result) return null;

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
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={handleBackToDashboard}
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
          <FaArrowLeft /> Back to Dashboard
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
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "25px",
              }}
            >
              {/* Gender Selection - FIXED */}
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
                <Form.Text style={{ color: "#666", fontSize: "0.8rem" }}>
                  Current gender: {gender}
                </Form.Text>
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

              {/* Actual Investment Input */}
              <Form.Group>
                <Form.Label
                  style={{
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: "8px",
                  }}
                >
                  Actual Investment / DPS (Yearly, BDT)
                </Form.Label>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-end",
                  }}
                >
                  {editingInvestment ? (
                    <>
                      <Form.Control
                        type="number"
                        value={editInvestmentValue}
                        onChange={(e) => setEditInvestmentValue(e.target.value)}
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
                        onClick={handleSaveInvestment}
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
                        value={n(actualInvestment)}
                        readOnly
                        style={inputStyle}
                      />
                      <FaEdit
                        onClick={() => setEditingInvestment(true)}
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
                <Form.Text style={{ color: "#666", fontSize: "0.8rem" }}>
                  Used for the 15%-of-investment rebate criterion.
                </Form.Text>
              </Form.Group>

              {/* RPF (Monthly) Input */}
              <Form.Group>
                <Form.Label
                  style={{
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: "8px",
                  }}
                >
                  RPF (Monthly, BDT)
                </Form.Label>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-end",
                  }}
                >
                  {editingRpf ? (
                    <>
                      <Form.Control
                        type="number"
                        value={editRpfValue}
                        onChange={(e) => setEditRpfValue(e.target.value)}
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
                        onClick={handleSaveRpf}
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
                        value={n(rpfMonthly)}
                        readOnly
                        style={inputStyle}
                      />
                      <FaEdit
                        onClick={() => setEditingRpf(true)}
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
                <Form.Text style={{ color: "#666", fontSize: "0.8rem" }}>
                  Employer-specific, added to yearly taxable income.
                </Form.Text>
              </Form.Group>

              {/* Source Tax (Minimum) Input */}
              <Form.Group>
                <Form.Label
                  style={{
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: "8px",
                  }}
                >
                  Source Tax (Minimum, BDT)
                </Form.Label>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-end",
                  }}
                >
                  {editingSourceTaxMinimum ? (
                    <>
                      <Form.Control
                        type="number"
                        value={editSourceTaxMinimumValue}
                        placeholder={gender === "Male" ? "0 (default)" : "0 (default)"}
                        onChange={(e) => setEditSourceTaxMinimumValue(e.target.value)}
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
                        onClick={handleSaveSourceTaxMinimum}
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
                        value={
                          sourceTaxMinimum === null || sourceTaxMinimum === undefined
                            ? `${n(gender === "Male" ? 0 : 0)} (default)`
                            : n(sourceTaxMinimum)
                        }
                        readOnly
                        style={inputStyle}
                      />
                      <FaEdit
                        onClick={() => setEditingSourceTaxMinimum(true)}
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
                <Form.Text style={{ color: "#666", fontSize: "0.8rem" }}>
                  Leave blank to use the gender default (0 Male / 0 Female).
                </Form.Text>
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
              <div style={{ overflowX: "auto" }}>
                <Table bordered style={{ borderRadius: "10px", overflow: "hidden", minWidth: "600px" }}>
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
              </div>
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
                Rebate Calculation as Per ITA 2026 (Finance Act 2026)
              </h4>
              <div style={{ overflowX: "auto" }}>
                <Table bordered style={{ borderRadius: "10px", overflow: "hidden", minWidth: "500px" }}>
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
              </div>
              <div style={{ marginTop: "15px", fontSize: "0.9rem", color: "#666" }}>
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
                Tax Calculation as Per ITA 2026 (Finance Act 2026)
              </h4>
              <div style={{ overflowX: "auto" }}>
                <Table bordered style={{ borderRadius: "10px", overflow: "hidden", minWidth: "500px" }}>
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
              </div>
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
                Net Tax Payable Calculation as Per ITA 2026 (Finance Act 2026)
              </h4>
              <div style={{ overflowX: "auto" }}>
                <Table bordered style={{ borderRadius: "10px", overflow: "hidden", minWidth: "400px" }}>
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
                      { label: "Source Tax (Minimum)", value: t.source_tax_minimum },
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
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TaxCalculators;