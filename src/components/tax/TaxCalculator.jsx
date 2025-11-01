import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Table, Alert, Card } from "react-bootstrap";

const TaxCalculator = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [gender, setGender] = useState("Male");
  const [sourceOther, setSourceOther] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    axios
      .get("http://119.148.51.38:8000/api/tax-calculator/employees/")
      .then((response) => {
        setEmployees(response.data);
        setFilteredEmployees(response.data);
      })
      .catch((error) => setError("Failed to fetch employees"));
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term === "") {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(emp => 
        emp.name.toLowerCase().includes(term) || 
        emp.employee_id.toString().includes(term)
      );
      setFilteredEmployees(filtered);
    }
  };

  const handleCalculate = () => {
    if (!selectedEmployee) {
      setError("Please select an employee");
      return;
    }
    setError("");
    axios
      .post("http://119.148.51.38:8000/api/tax-calculator/calculate/", {
        employee_id: selectedEmployee,
        gender,
        source_other: sourceOther,
      })
      .then((response) => setResult(response.data))
      .catch((error) =>
        setError(error.response?.data?.error || "Calculation failed")
      );
  };

  const containerStyle = {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const headerStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "30px 20px",
    borderRadius: "10px",
    marginBottom: "30px",
    textAlign: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
  };

  const cardStyle = {
    border: "none",
    borderRadius: "15px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
    marginBottom: "25px",
    overflow: "hidden"
  };

  const inputStyle = {
    borderRadius: "10px",
    border: "2px solid #e9ecef",
    padding: "12px 15px",
    fontSize: "16px",
    transition: "all 0.3s ease"
  };

  const buttonStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "10px",
    padding: "12px 30px",
    fontSize: "16px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
  };

  const tableHeaderStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    fontWeight: "600"
  };

  const resultCardStyle = {
    background: "linear-gradient(135deg, #c8e6ff 0%, #e1f0ff 100%)",
    border: "none",
    borderRadius: "15px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
    marginBottom: "25px"
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
            fontWeight: "500"
          }}
        >
          {error}
        </Alert>
      )}

      {/* Input Card */}
      <Card style={cardStyle}>
        <Card.Body style={{ padding: "30px" }}>
          <h3 style={{ 
            color: "#333", 
            marginBottom: "25px",
            fontWeight: "600",
            borderBottom: "3px solid #667eea",
            paddingBottom: "10px",
            display: "inline-block"
          }}>
            Employee Details
          </h3>
          
          <Form>
            {/* Search Input */}
            <Form.Group className="mb-4">
              <Form.Label style={{ fontWeight: "600", color: "#555", marginBottom: "8px" }}>
                Search Employee
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={handleSearch}
                style={{
                  ...inputStyle,
                  background: searchTerm ? "#fff9e6" : "white"
                }}
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

            {/* Employee Selection */}
            <Form.Group className="mb-4">
              <Form.Label style={{ fontWeight: "600", color: "#555", marginBottom: "8px" }}>
                Select Employee
              </Form.Label>
              <Form.Select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
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
                <option value="">Select Employee</option>
                {filteredEmployees.map((emp) => (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {emp.name} (ID: {emp.employee_id})
                  </option>
                ))}
              </Form.Select>
              {filteredEmployees.length === 0 && searchTerm && (
                <div style={{ color: "#6c757d", fontSize: "14px", marginTop: "5px" }}>
                  No employees found matching "{searchTerm}"
                </div>
              )}
            </Form.Group>

            {/* Gender Selection */}
            <Form.Group className="mb-4">
              <Form.Label style={{ fontWeight: "600", color: "#555", marginBottom: "8px" }}>
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

            {/* Other Income */}
            <Form.Group className="mb-4">
              <Form.Label style={{ fontWeight: "600", color: "#555", marginBottom: "8px" }}>
                Source Tax Other (BDT)
              </Form.Label>
              <Form.Control
                type="number"
                value={sourceOther}
                onChange={(e) => setSourceOther(e.target.value)}
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
          </Form>
        </Card.Body>
      </Card>

      {/* Results Section */}
      {result && (
        <div style={{ marginTop: "30px" }}>
          {/* Result Header */}
          <Card style={resultCardStyle}>
            <Card.Body style={{ padding: "30px", textAlign: "center" }}>
              <h3 style={{ 
                color: "#2c3e50", 
                marginBottom: "15px",
                fontWeight: "700"
              }}>
                {result.title}
              </h3>
              <h5 style={{ 
                color: "#34495e",
                marginBottom: "15px",
                fontWeight: "600"
              }}>
                Simple Only Individual Tax Calculation for {result.gender} (Private Job)
              </h5>
              <p style={{ 
                fontSize: "18px", 
                color: "#2c3e50",
                fontWeight: "500",
                margin: 0
              }}>
                Employee: <strong>{result.employee_name}</strong>
              </p>
            </Card.Body>
          </Card>

          {/* Salary Breakdown */}
          <Card style={cardStyle}>
            <Card.Body style={{ padding: "25px" }}>
              <h4 style={{ 
                color: "#2c3e50",
                marginBottom: "20px",
                fontWeight: "600",
                borderBottom: "2px solid #667eea",
                paddingBottom: "8px"
              }}>
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
                    { key: 'basic', label: 'Basic' },
                    { key: 'house_rent', label: 'House Rent' },
                    { key: 'medical', label: 'Medical' },
                    { key: 'conveyance', label: 'Conveyance' }
                  ].map((item, index) => (
                    <tr key={item.key} style={{ background: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                      <td style={{ padding: "12px 15px", fontWeight: "500" }}>{item.label}</td>
                      <td style={{ padding: "12px 15px" }}>
                        {result.salary_breakdown[item.key].monthly.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 15px" }}>
                        {result.salary_breakdown[item.key].ytd.toLocaleString()}
                      </td>
                      {index === 0 && (
                        <td rowSpan="5" style={{ padding: "12px 15px", verticalAlign: "middle" }}>
                          Exemption would be 500,000 or 1/3 of income from salary, whichever is lower
                        </td>
                      )}
                      <td style={{ padding: "12px 15px" }}></td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f8f9fa' }}>
                    <td style={{ padding: "12px 15px", fontWeight: "500" }}>Bonus</td>
                    <td style={{ padding: "12px 15px" }}>-</td>
                    <td style={{ padding: "12px 15px" }}>
                      {result.salary_breakdown.bonus.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 15px" }}></td>
                  </tr>
                  <tr style={{ background: '#e3f2fd', fontWeight: "600" }}>
                    <td style={{ padding: "12px 15px" }}>Total</td>
                    <td style={{ padding: "12px 15px" }}>
                      {result.monthly_salary.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 15px" }}>
                      {result.salary_breakdown.total_income_ytd.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 15px" }}>
                      {result.salary_breakdown.exemption.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 15px" }}>
                      {result.salary_breakdown.taxable_income_ytd.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Rebate Calculation */}
          <Card style={cardStyle}>
            <Card.Body style={{ padding: "25px" }}>
              <h4 style={{ 
                color: "#2c3e50",
                marginBottom: "20px",
                fontWeight: "600",
                borderBottom: "2px solid #667eea",
                paddingBottom: "8px"
              }}>
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
                      label: 'A) Taxable Income 3%', 
                      figure: result.rebate.taxable_income_3percent,
                      rate: '0.03'
                    },
                    { 
                      label: 'B) Actual Investment 15% DPS', 
                      figure: result.rebate.actual_investment_15percent,
                      rate: '0.15'
                    },
                    { 
                      label: 'C) Maximum Investment Limit', 
                      figure: result.rebate.max_investment_limit,
                      rate: '0'
                    }
                  ].map((item, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                      <td style={{ padding: "12px 15px", fontWeight: "500" }}>{item.label}</td>
                      <td style={{ padding: "12px 15px" }}>{item.figure.toLocaleString()}</td>
                      <td style={{ padding: "12px 15px" }}>{item.rate}</td>
                      <td style={{ padding: "12px 15px" }}>
                        {item.rate !== '0' ? item.figure.toLocaleString() : '0'}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#e3f2fd', fontWeight: "600" }}>
                    <td style={{ padding: "12px 15px" }}>Tax Rebate Tk.</td>
                    <td style={{ padding: "12px 15px" }}></td>
                    <td style={{ padding: "12px 15px" }}></td>
                    <td style={{ padding: "12px 15px" }}>
                      {result.rebate.tax_rebate.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Tax Slabs */}
          <Card style={cardStyle}>
            <Card.Body style={{ padding: "25px" }}>
              <h4 style={{ 
                color: "#2c3e50",
                marginBottom: "20px",
                fontWeight: "600",
                borderBottom: "2px solid #667eea",
                paddingBottom: "8px"
              }}>
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
                  {result.tax_slabs.map((slab, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                      <td style={{ padding: "12px 15px", fontWeight: "500" }}>
                        {slab.limit ? slab.limit.toLocaleString() : "Remaining"}
                      </td>
                      <td style={{ padding: "12px 15px" }}>{slab.income.toLocaleString()}</td>
                      <td style={{ padding: "12px 15px" }}>{slab.rate}</td>
                      <td style={{ padding: "12px 15px" }}>{slab.tax.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#e3f2fd', fontWeight: "600" }}>
                    <td style={{ padding: "12px 15px" }}>Taxable Income</td>
                    <td style={{ padding: "12px 15px" }}>
                      {result.salary_breakdown.taxable_income_ytd.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 15px" }}>Tax Payable</td>
                    <td style={{ padding: "12px 15px" }}>
                      {result.tax_calculation.total_tax_payable.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Net Tax Calculation */}
          <Card style={cardStyle}>
            <Card.Body style={{ padding: "25px" }}>
              <h4 style={{ 
                color: "#2c3e50",
                marginBottom: "20px",
                fontWeight: "600",
                borderBottom: "2px solid #667eea",
                paddingBottom: "8px"
              }}>
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
                    { label: 'Total Tax Payable', value: result.tax_calculation.total_tax_payable },
                    { label: 'Less: Tax Rebate', value: result.tax_calculation.tax_rebate },
                    { label: 'Net Tax Payable', value: result.tax_calculation.net_tax_payable, isBold: true },
                    { label: 'Source Tax Other', value: result.tax_calculation.source_tax_other },
                    { label: 'Tax Payable', value: result.tax_calculation.tax_payable, isBold: true },
                    { label: 'Monthly TDS Deduct', value: result.tax_calculation.monthly_tds, isBold: true }
                  ].map((item, index) => (
                    <tr key={index} style={{ 
                      background: item.isBold ? '#e3f2fd' : (index % 2 === 0 ? '#f8f9fa' : 'white')
                    }}>
                      <td style={{ 
                        padding: "12px 15px", 
                        fontWeight: item.isBold ? "600" : "500" 
                      }}>
                        {item.label}
                      </td>
                      <td style={{ 
                        padding: "12px 15px",
                        fontWeight: item.isBold ? "600" : "500"
                      }}>
                        {item.value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TaxCalculator;