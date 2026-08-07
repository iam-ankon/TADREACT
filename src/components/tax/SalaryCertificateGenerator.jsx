// components/SalaryCertificateGenerator.jsx

import React, { useState, useEffect } from 'react';
import { financeAPI } from '../../api/finance';
import {
  FaFileExcel,
  FaDownload,
  FaSpinner,
  FaCheckCircle,
  FaUser,
  FaBuilding,
} from 'react-icons/fa';

const SalaryCertificateGenerator = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [progress, setProgress] = useState(0);
  
  // Certificate types
  const certificateTypes = [
    { id: 1, name: 'Banking & Loans', icon: '🏦', description: 'For loan applications' },
    { id: 2, name: 'Visa & Immigration', icon: '🛂', description: 'With Passport & NID' },
    { id: 3, name: 'Government & Regulatory', icon: '🏛️', description: 'With NID verification' },
    { id: 4, name: 'Housing & Rentals', icon: '🏠', description: 'For rental agreements' },
    { id: 5, name: 'Insurance & Medical', icon: '🏥', description: 'For insurance coverage' },
    { id: 6, name: 'Internal HR Verification', icon: '📋', description: 'For HR purposes' },
    { id: 7, name: 'Employee Personal Needs', icon: '👤', description: 'For personal use' },
    { id: 8, name: 'Income Tax Submission', icon: '💰', description: 'For tax filing' },
  ];
  
  // Load employees
  useEffect(() => {
    loadEmployees();
  }, [month, year]);
  
  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await financeAPI.employee.getAll(month, year);
      let employeeData = response.data;
      
      if (employeeData && employeeData.data) {
        employeeData = employeeData.data;
      }
      
      if (!Array.isArray(employeeData)) {
        employeeData = [];
      }
      
      setEmployees(employeeData);
      setSelectedEmployees(employeeData.map(emp => emp.employee_id));
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.employee_id));
    }
  };
  
  const handleToggleEmployee = (employeeId) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };
  
  const handleToggleType = (typeId) => {
    if (selectedTypes.includes(typeId)) {
      setSelectedTypes(selectedTypes.filter(id => id !== typeId));
    } else {
      setSelectedTypes([...selectedTypes, typeId]);
    }
  };
  
  const handleSelectAllTypes = () => {
    if (selectedTypes.length === certificateTypes.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(certificateTypes.map(t => t.id));
    }
  };
  
  const handleGenerate = async () => {
    if (selectedEmployees.length === 0) {
      alert('Please select at least one employee.');
      return;
    }
    
    if (selectedTypes.length === 0) {
      alert('Please select at least one certificate type.');
      return;
    }
    
    setGenerating(true);
    setProgress(0);
    
    try {
      const response = await fetch('/api/tax-calculator/generate-salary-certificates-excel/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          employee_ids: selectedEmployees,
          certificate_types: selectedTypes,
          month: month,
          year: year,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate certificates');
      }
      
      // Download the zip file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Salary_Certificates_${month}_${year}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setProgress(100);
      
      setTimeout(() => {
        alert(`✅ ${selectedEmployees.length * selectedTypes.length} salary certificates generated successfully!`);
      }, 500);
      
    } catch (err) {
      console.error('❌ Error generating certificates:', err);
      alert(`Error generating certificates: ${err.message}`);
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };
  
  // Filter employees by search
  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_id?.toString().includes(searchQuery) ||
    emp.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalCertificates = selectedEmployees.length * selectedTypes.length;
  
  return (
    <div className="certificate-generator">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="header-icon">📄</div>
          <div className="header-text">
            <h1>Salary Certificate Generator</h1>
            <p>Generate Excel certificates matching the official TAD Group format</p>
          </div>
        </div>
        
        {/* Controls */}
        <div className="controls">
          <div className="control-group">
            <label>📅 Month</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(2024, m - 1, 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          
          <div className="control-group">
            <label>📅 Year</label>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          <div className="control-group summary-info">
            <label>📊 Summary</label>
            <div className="summary-badge">
              {selectedEmployees.length} employees × {selectedTypes.length} types
              <span className="total">{totalCertificates} certificates</span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        {generating && (
          <div className="progress-section">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="progress-text">
              {progress > 0 ? `Generating: ${progress}%` : 'Preparing certificates...'}
            </div>
          </div>
        )}
        
        {/* Certificate Types */}
        <div className="types-section">
          <div className="section-header">
            <h3>📋 Certificate Types</h3>
            <button className="btn-small" onClick={handleSelectAllTypes}>
              {selectedTypes.length === certificateTypes.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="types-grid">
            {certificateTypes.map(type => (
              <div
                key={type.id}
                className={`type-card ${selectedTypes.includes(type.id) ? 'selected' : ''}`}
                onClick={() => handleToggleType(type.id)}
              >
                <span className="type-icon">{type.icon}</span>
                <div className="type-info">
                  <span className="type-name">{type.name}</span>
                  <span className="type-desc">{type.description}</span>
                </div>
                {selectedTypes.includes(type.id) && <FaCheckCircle className="check" />}
              </div>
            ))}
          </div>
        </div>
        
        {/* Employee Selection */}
        <div className="employee-section">
          <div className="section-header">
            <h3>👥 Select Employees</h3>
            <div className="employee-actions">
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button className="btn-small" onClick={handleSelectAll}>
                {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="count">{selectedEmployees.length} selected</span>
            </div>
          </div>
          
          {loading ? (
            <div className="loading">
              <FaSpinner className="spinning" />
              Loading employees...
            </div>
          ) : (
            <div className="employee-grid">
              {filteredEmployees.map(emp => (
                <div
                  key={emp.employee_id}
                  className={`employee-card ${selectedEmployees.includes(emp.employee_id) ? 'selected' : ''}`}
                  onClick={() => handleToggleEmployee(emp.employee_id)}
                >
                  <div className="employee-info">
                    <div className="employee-name">
                      <FaUser className="icon" />
                      {emp.name || 'Unknown'}
                    </div>
                    <div className="employee-details">
                      <span className="emp-id">ID: {emp.employee_id}</span>
                      <span className="emp-designation">
                        <FaBuilding className="icon-small" />
                        {emp.designation || 'N/A'}
                      </span>
                    </div>
                  </div>
                  {selectedEmployees.includes(emp.employee_id) && (
                    <FaCheckCircle className="check" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Generate Button */}
        <button
          className="btn generate large"
          onClick={handleGenerate}
          disabled={generating || selectedEmployees.length === 0 || selectedTypes.length === 0}
        >
          {generating ? (
            <>
              <FaSpinner className="spinning" />
              Generating {totalCertificates} certificates...
            </>
          ) : (
            <>
              <FaFileExcel />
              Generate Excel Certificates
              <span className="badge">{totalCertificates}</span>
            </>
          )}
        </button>
        
        {/* Footer Info */}
        <div className="footer-info">
          <div className="info-item">
            <span className="label">📄 Format:</span>
            <span className="value">Official TAD Group Certificate Format (Excel)</span>
          </div>
          <div className="info-item">
            <span className="label">📦 Output:</span>
            <span className="value">ZIP file with individual Excel certificates</span>
          </div>
          <div className="info-item">
            <span className="label">📋 Template:</span>
            <span className="value">Matches the provided Salary Certificate Format</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .certificate-generator {
          padding: 20px;
          background: #f0f4f8;
          min-height: 100vh;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        
        .header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .header-icon {
          font-size: 48px;
        }
        
        .header-text h1 {
          font-size: 28px;
          color: #1F4E79;
          margin-bottom: 4px;
        }
        
        .header-text p {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }
        
        .controls {
          display: flex;
          gap: 20px;
          align-items: flex-end;
          flex-wrap: wrap;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .control-group label {
          font-size: 13px;
          font-weight: 600;
          color: #4b5563;
        }
        
        .control-group select {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          min-width: 150px;
        }
        
        .summary-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: #1F4E79;
          color: white;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .summary-badge .total {
          background: rgba(255,255,255,0.2);
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 12px;
        }
        
        .progress-section {
          margin: 12px 0 20px;
        }
        
        .progress-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #1F4E79, #3b82f6);
          transition: width 0.3s ease;
          border-radius: 4px;
        }
        
        .progress-text {
          font-size: 12px;
          color: #6b7280;
          text-align: center;
          margin-top: 4px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .section-header h3 {
          font-size: 16px;
          color: #1f2937;
          margin: 0;
        }
        
        .btn-small {
          padding: 6px 14px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        
        .btn-small:hover {
          background: #f3f4f6;
        }
        
        .types-section {
          margin: 20px 0;
        }
        
        .types-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 10px;
        }
        
        .type-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        
        .type-card:hover {
          border-color: #9ca3af;
          transform: translateY(-1px);
        }
        
        .type-card.selected {
          border-color: #1F4E79;
          background: #f0f4f8;
        }
        
        .type-icon {
          font-size: 24px;
        }
        
        .type-info {
          flex: 1;
          min-width: 0;
        }
        
        .type-name {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .type-desc {
          display: block;
          font-size: 11px;
          color: #6b7280;
        }
        
        .type-card .check {
          color: #1F4E79;
          font-size: 18px;
          flex-shrink: 0;
        }
        
        .employee-section {
          margin: 20px 0;
        }
        
        .employee-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .search-input {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          min-width: 200px;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #1F4E79;
          box-shadow: 0 0 0 3px rgba(31, 78, 121, 0.1);
        }
        
        .count {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }
        
        .employee-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 10px;
          max-height: 350px;
          overflow-y: auto;
          padding: 4px;
        }
        
        .employee-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }
        
        .employee-card:hover {
          border-color: #9ca3af;
        }
        
        .employee-card.selected {
          border-color: #1F4E79;
          background: #f0f4f8;
        }
        
        .employee-info {
          flex: 1;
          min-width: 0;
        }
        
        .employee-name {
          font-weight: 600;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .employee-name .icon {
          font-size: 14px;
          color: #6b7280;
        }
        
        .employee-details {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
          flex-wrap: wrap;
        }
        
        .emp-id {
          background: #f3f4f6;
          padding: 1px 8px;
          border-radius: 4px;
        }
        
        .emp-designation {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .icon-small {
          font-size: 10px;
        }
        
        .employee-card .check {
          color: #1F4E79;
          font-size: 18px;
          flex-shrink: 0;
        }
        
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px;
          color: #6b7280;
        }
        
        .btn {
          padding: 10px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .btn.generate {
          background: #1F4E79;
          color: white;
        }
        
        .btn.generate:hover:not(:disabled) {
          background: #163a5c;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(31, 78, 121, 0.3);
        }
        
        .btn.generate.large {
          width: 100%;
          justify-content: center;
          padding: 16px;
          font-size: 18px;
          margin-top: 20px;
        }
        
        .badge {
          background: rgba(255,255,255,0.2);
          padding: 2px 12px;
          border-radius: 20px;
          font-size: 14px;
        }
        
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .footer-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          padding: 16px 20px;
          background: #f8fafc;
          border-radius: 12px;
          margin-top: 20px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .info-item .label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .info-item .value {
          font-size: 13px;
          color: #1f2937;
        }
        
        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            text-align: center;
          }
          
          .controls {
            flex-direction: column;
            align-items: stretch;
          }
          
          .types-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .employee-grid {
            grid-template-columns: 1fr;
          }
          
          .employee-actions {
            flex-direction: column;
            align-items: stretch;
          }
          
          .search-input {
            min-width: auto;
            width: 100%;
          }
          
          .footer-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SalaryCertificateGenerator;