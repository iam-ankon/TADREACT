import { useNavigate } from "react-router-dom";
import logo from "../../assets/texweave_Logo_1.png";
import React, { useEffect, useState } from "react";
import { loginUser, debugAuth } from "../../api/employeeApi";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    employee_id: "",
    designation: "",
    department: "",
    username: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  // Department options
  const departmentOptions = [
    "Admin",
    "QA",
    "R & D",
    "Production",
    "Sample Section - R & D",
    "Human Resource",
    "Corporate Health",
    "Architecture",
    "Business Development",
    "CSR",
    "Merchandising",
    "Digital Marketing Department & E-Commerce",
    "Finance & Accounts",
    "KLOTHEN Bangladesh",
    "IT Department",
    "LOGISTICS DEPARTMENT",
    "KOITHE Bangladesh",
    "Management",
    "Software Development",
  ];

  // Form steps configuration
  const formSteps = [
    { 
      id: "employee_id", 
      label: "Employee ID", 
      type: "text", 
      required: true, 
      placeholder: "Your employee ID" 
    },
    { 
      id: "designation", 
      label: "Designation", 
      type: "text", 
      required: false, 
      placeholder: "Your job title " 
    },
    { 
      id: "department", 
      label: "Department", 
      type: "dropdown", 
      required: false, 
      placeholder: "Search your department" 
    },
    { 
      id: "username", 
      label: "Username", 
      type: "text", 
      required: true, 
      placeholder: "Your username" 
    },
    { 
      id: "email", 
      label: "Email Address", 
      type: "email", 
      required: false, 
      placeholder: "your.email@company.com " 
    },
    { 
      id: "password", 
      label: "Password", 
      type: "password", 
      required: true, 
      placeholder: "Your password" 
    }
  ];

  // Filter departments based on search
  const filteredDepartments = departmentOptions.filter((dept) =>
    dept.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("token");
    if (token) {
      const permissions = JSON.parse(
        localStorage.getItem("permissions") || "{}"
      );
      if (permissions.full_access) {
        navigate("/hr-work");
      } else {
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".department-dropdown-container")) {
        setShowDepartmentDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    const currentField = formSteps[currentStep];
    
    // Validate required fields
    if (currentField.required && !formData[currentField.id].trim()) {
      setError(`${currentField.label} is required`);
      return;
    }
    
    setError("");
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setError("");
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Final validation before submission
    const requiredFields = formSteps.filter(step => step.required);
    for (let field of requiredFields) {
      if (!formData[field.id].trim()) {
        setError(`${field.label} is required`);
        setLoading(false);
        return;
      }
    }

    const payload = {
      username: formData.username.trim(),
      password: formData.password.trim(),
      employee_id: formData.employee_id.trim(),
      designation: formData.designation.trim(),
      department: formData.department.trim(),
      email: formData.email.trim(),
    };

    try {
      console.log("🔄 Starting login process...");
      console.log("📤 Login payload:", payload);

      const data = await loginUser(payload);

      console.log("✅ Login response data:", data);

      // Verify storage
      debugAuth();

      // Verify all required data is stored
      const storedEmployeeId = localStorage.getItem("employee_id");
      const storedEmployeeName = localStorage.getItem("employee_name");
      const storedDesignation = localStorage.getItem("designation");
      const storedDepartment = localStorage.getItem("department");
      const storedUsername = localStorage.getItem("username");
      const storedEmail = formData.email || storedUsername;

      console.log("📋 Stored user data:", {
        employee_id: storedEmployeeId,
        employee_name: storedEmployeeName,
        designation: storedDesignation,
        department: storedDepartment,
        username: storedUsername,
        email: storedEmail,
      });

      if (!storedEmployeeId || !storedEmployeeName) {
        throw new Error("User data not properly stored after login");
      }

      setError("✅ Login successful! Redirecting...");

      setTimeout(() => {
        if (data.permissions?.full_access) {
          navigate("/hr-work");
        } else {
          navigate("/dashboard");
        }
      }, 1000);
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSelect = (selectedDept) => {
    handleInputChange('department', selectedDept);
    setDepartmentSearch(selectedDept);
    setShowDepartmentDropdown(false);
  };

  const handleDepartmentSearchChange = (e) => {
    setDepartmentSearch(e.target.value);
    setShowDepartmentDropdown(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextStep();
    }
  };

  const renderCurrentField = () => {
    const currentField = formSteps[currentStep];
    
    if (currentField.type === 'dropdown') {
      return (
        <div className="input-group department-dropdown-container">
          <label htmlFor={currentField.id} className={currentField.required ? "required" : ""}>
            {currentField.label}
          </label>
          <div className="input-with-icon">
            <input
              type="text"
              id={currentField.id}
              value={departmentSearch}
              onChange={handleDepartmentSearchChange}
              onFocus={() => setShowDepartmentDropdown(true)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              placeholder={currentField.placeholder}
              className="form-input"
              autoFocus
            />
            <svg
              className="search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </div>

          {showDepartmentDropdown && (
            <div className="department-dropdown">
              {filteredDepartments.length > 0 ? (
                filteredDepartments.map((dept) => (
                  <div
                    key={dept}
                    className="department-option"
                    onClick={() => handleDepartmentSelect(dept)}
                  >
                    {dept}
                  </div>
                ))
              ) : (
                <div
                  className="department-option no-results"
                >
                  No departments found
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="input-group">
        <label htmlFor={currentField.id} className={currentField.required ? "required" : ""}>
          {currentField.label}
        </label>
        <input
          type={currentField.type}
          id={currentField.id}
          value={formData[currentField.id]}
          onChange={(e) => handleInputChange(currentField.id, e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          required={currentField.required}
          placeholder={currentField.placeholder}
          autoFocus
        />
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          @import url(//fonts.googleapis.com/css?family=Lato:300:400);
          body {
            margin: 0;
          }
          .header {
            position: relative;
            text-align: center;
            background: linear-gradient(60deg, rgba(84,58,183,1) 0%, rgba(0,172,193,1) 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
            overflow: hidden;
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }
          .waves {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 10vh;
            min-height: 100px;
            max-height: 150px;
          }
          .parallax > use {
            animation: move-forever 25s cubic-bezier(.55,.5,.45,.5) infinite;
          }
          .parallax > use:nth-child(1) { animation-delay: -2s; animation-duration: 7s; }
          .parallax > use:nth-child(2) { animation-delay: -3s; animation-duration: 10s; }
          .parallax > use:nth-child(3) { animation-delay: -4s; animation-duration: 13s; }
          .parallax > use:nth-child(4) { animation-delay: -5s; animation-duration: 20s; }
          @keyframes move-forever {
            0% { transform: translate3d(-90px,0,0); }
            100% { transform: translate3d(85px,0,0); }
          }
          .login-container {
            background: rgba(255, 255, 255, 0.98);
            padding: 30px 25px;
            border-radius: 20px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            width: 100%;
            max-width: 440px;
            z-index: 2;
            text-align: center;
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.4s ease;
            margin: 20px;
          }
          .login-container:hover {
            transform: translateY(-8px);
            box-shadow: 0 30px 60px rgba(0,0,0,0.25);
          }
          .login-container h2 {
            margin-bottom: 25px;
            color: #2c3e50;
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .step-indicator {
            display: flex;
            justify-content: center;
            margin-bottom: 25px;
            gap: 8px;
          }
          .step-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #e5e7eb;
            transition: all 0.3s ease;
          }
          .step-dot.active {
            background: #667eea;
            transform: scale(1.2);
          }
          .step-dot.completed {
            background: #10b981;
          }
          .input-group {
            margin-bottom: 25px;
            text-align: left;
          }
          .input-group label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            color: #4b5563;
            font-weight: 600;
            transition: color 0.3s ease;
          }
          .input-group input, .input-group select {
            width: 100%;
            padding: 14px 16px;
            border-radius: 12px;
            border: 2px solid #e5e7eb;
            font-size: 15px;
            box-sizing: border-box;
            transition: all 0.3s ease;
            background: #f8fafc;
            font-family: inherit;
          }
          .input-group input:focus, .input-group select:focus {
            outline: none;
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
            transform: translateY(-2px);
          }
          .department-dropdown-container {
            position: relative;
          }
          
          .department-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
            margin-top: 4px;
            animation: slideDown 0.2s ease-out;
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .department-option {
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid #f8fafc;
            transition: all 0.2s ease;
            font-size: 14px;
            color: #374151;
            background: white;
            font-weight: 500;
          }
          
          .department-option:hover {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            transform: translateX(5px);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          }
          
          .department-option:last-child {
            border-bottom: none;
          }

          .department-option.no-results {
            color: #9ca3af;
            cursor: default;
            background: white;
            transform: none;
          }

          .department-option.no-results:hover {
            background: white;
            color: #9ca3af;
            transform: none;
            box-shadow: none;
          }
          
          .navigation-buttons {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
          }
          .nav-btn {
            flex: 1;
            padding: 14px;
            border: none;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .nav-btn.prev {
            background: #f8fafc;
            color: #6b7280;
            border: 2px solid #e5e7eb;
          }
          .nav-btn.prev:hover:not(:disabled) {
            background: #f1f5f9;
            border-color: #667eea;
            color: #667eea;
            transform: translateX(-2px);
          }
          .nav-btn.next {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
          .nav-btn.next:hover:not(:disabled) {
            transform: translateX(2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          }
          .nav-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
          }
          .nav-btn.submit {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          }
          .nav-btn.submit:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
          }
          .login-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            margin-top: 10px;
          }
          .login-btn:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.5);
          }
          .login-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
          .error {
            color: #dc2626;
            font-size: 14px;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            padding: 14px;
            border-radius: 10px;
            border: 1px solid #fecaca;
            text-align: left;
            animation: shake 0.5s ease-in-out;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .success {
            color: #059669;
            font-size: 14px;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            padding: 14px;
            border-radius: 10px;
            border: 1px solid #bbf7d0;
            text-align: left;
            animation: slideIn 0.5s ease-out;
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .content {
            position: relative;
            height: 10vh;
            text-align: center;
            background-color: white;
            font-size: 0.7rem;
          }
          .flex {
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
          }
          .required::after {
            content: " *";
            color: #dc2626;
          }
          .form-info {
            font-size: 13px;
            color: #6b7280;
            margin-top: 20px;
            text-align: center;
            padding: 18px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
            border-left: 4px solid #667eea;
            border-right: 4px solid #764ba2;
          }
          .form-info p {
            margin: 6px 0;
            line-height: 1.4;
          }
          .search-icon {
            position: absolute;
            right: 12px;
            top: 38px;
            color: #6b7280;
            pointer-events: none;
            transition: color 0.3s ease;
          }
          .input-with-icon {
            position: relative;
          }
          .input-with-icon:focus-within .search-icon {
            color: #667eea;
          }
          .logo-container {
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 3;
          }
          .logo-container img {
            width: 150px;
            filter: drop-shadow(0 2px 8px rgba(0,0,0,0.15));
            transition: transform 0.3s ease;
          }
          .logo-container img:hover {
            transform: scale(1.05);
          }
          .field-transition {
            animation: slideIn 0.3s ease-out;
          }
          @media (max-width: 480px) {
            .login-container {
              padding: 25px 20px;
              margin: 15px;
              border-radius: 16px;
            }
            .login-container h2 {
              font-size: 24px;
              margin-bottom: 20px;
            }
            .input-group input, .input-group select {
              padding: 12px 14px;
              font-size: 14px;
            }
            .nav-btn {
              padding: 12px;
              font-size: 14px;
            }
          }
        `}
      </style>

      <div className="header">
        <div className="logo-container">
          <img src={logo} alt="TexWeave Logo" />
        </div>
        
        <div className="login-container">
          <h2>Login</h2>
          {error && (
            <div className={error.includes("✅") ? "success" : "error"}>
              {error}
            </div>
          )}
          
          {/* Step Indicator */}
          <div className="step-indicator">
            {formSteps.map((_, index) => (
              <div
                key={index}
                className={`step-dot ${index === currentStep ? 'active' : ''} ${
                  index < currentStep ? 'completed' : ''
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleLogin}>
            <div className="field-transition">
              {renderCurrentField()}
            </div>

            {/* Navigation Buttons */}
            <div className="navigation-buttons">
              <button
                type="button"
                className="nav-btn prev"
                onClick={prevStep}
                disabled={currentStep === 0 || loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Previous
              </button>

              {currentStep < formSteps.length - 1 ? (
                <button
                  type="button"
                  className="nav-btn next"
                  onClick={nextStep}
                  disabled={loading}
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  className="nav-btn submit"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              )}
            </div>

            <div className="form-info">
              <p>
                <strong>Step {currentStep + 1} of {formSteps.length}:</strong> {formSteps[currentStep].label}
              </p>
              <p>
                <strong>Required fields:</strong> Employee ID, Username, Password
              </p>
            </div>
          </form>
        </div>

        <svg
          className="waves"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 24 150 28"
          preserveAspectRatio="none"
          shapeRendering="auto"
        >
          <defs>
            <path
              id="gentle-wave"
              d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
            />
          </defs>
          <g className="parallax">
            <use
              xlinkHref="#gentle-wave"
              x="48"
              y="0"
              fill="rgba(209, 62, 62, 0.35)"
            />
            <use
              xlinkHref="#gentle-wave"
              x="48"
              y="3"
              fill="rgba(8, 213, 249, 0.55)"
            />
            <use
              xlinkHref="#gentle-wave"
              x="48"
              y="5"
              fill="rgba(156, 216, 121, 0.69)"
            />
            <use xlinkHref="#gentle-wave" x="48" y="7" fill="#fff" />
          </g>
        </svg>
      </div>

      <div className="content flex">
        <p>
          Attention: Please note that transactions over the internet may be
          subject to interruption, delayed transmission due to internet traffic,
          or incorrect data transmission due to the nature of the internet.
          TEXWEAVE cannot assume responsibility for malfunctions in
          communications facilities not under our control or problems caused by
          your computing environment that may affect your usage of this
          application. ©2025 Copyright by TEXWEAVE. All rights reserved.
        </p>
      </div>
    </>
  );
};

export default LoginPage;