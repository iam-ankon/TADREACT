// SalaryEmailModal.jsx
import React, { useState } from 'react';
import { FaEnvelope, FaTimes, FaPaperPlane, FaExclamationTriangle } from 'react-icons/fa';
import { sendSalaryChangeEmail } from '../../api/employeeApi';

const SalaryEmailModal = ({ isOpen, onClose, employee, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState({
    old_salary: employee?.salary || '',
    new_salary: employee?.salary || '',
    old_designation: employee?.designation || '',
    new_designation: employee?.designation || '',
    change_type: 'increment',
    effective_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};
    
    if (!emailData.new_salary || parseFloat(emailData.new_salary) <= 0) {
      newErrors.new_salary = 'Please enter a valid salary amount';
    }
    
    if (emailData.change_type === 'increment' && 
        parseFloat(emailData.new_salary) <= parseFloat(emailData.old_salary)) {
      newErrors.new_salary = 'Increment amount must be greater than current salary';
    }
    
    if (emailData.change_type === 'decrement' && 
        parseFloat(emailData.new_salary) >= parseFloat(emailData.old_salary)) {
      newErrors.new_salary = 'Decrement amount must be less than current salary';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const response = await sendSalaryChangeEmail(employee.id, emailData);
      
      if (response.success) {
        alert(`✅ ${response.message}`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(`❌ ${response.message || 'Failed to send email'}`);
      }
    } catch (error) {
      console.error('Error sending salary email:', error);
      alert(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '৳0';
    return `৳${parseFloat(amount).toLocaleString('en-BD')}`;
  };

  const calculateDifference = () => {
    const oldVal = parseFloat(emailData.old_salary) || 0;
    const newVal = parseFloat(emailData.new_salary) || 0;
    const diff = newVal - oldVal;
    const percentage = oldVal > 0 ? (diff / oldVal * 100) : 0;
    
    return {
      amount: Math.abs(diff),
      percentage: Math.abs(percentage),
      isIncrement: diff > 0
    };
  };

  const diff = calculateDifference();

  return (
    <div className="salary-email-modal-overlay" onClick={onClose}>
      <div className="salary-email-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FaEnvelope className="modal-icon" />
            <h3>Send Salary Change Notification</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="employee-summary">
              <div className="employee-avatar">
                {employee?.image1 ? (
                  <img src={employee.image1} alt={employee.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {employee?.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div className="employee-info">
                <h4>{employee?.name}</h4>
                <p className="employee-designation">{employee?.designation}</p>
                <p className="employee-id">ID: {employee?.employee_id}</p>
              </div>
            </div>
            
            <div className="form-group">
              <label>Change Type *</label>
              <div className="change-type-buttons">
                <button
                  type="button"
                  className={`change-type-btn ${emailData.change_type === 'increment' ? 'active increment' : ''}`}
                  onClick={() => setEmailData({...emailData, change_type: 'increment'})}
                >
                  📈 Salary Increment
                </button>
                <button
                  type="button"
                  className={`change-type-btn ${emailData.change_type === 'decrement' ? 'active decrement' : ''}`}
                  onClick={() => setEmailData({...emailData, change_type: 'decrement'})}
                >
                  📉 Salary Decrement
                </button>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Current Salary</label>
                <div className="salary-input-wrapper">
                  <span className="currency-symbol">৳</span>
                  <input
                    type="number"
                    className="form-input"
                    value={emailData.old_salary}
                    readOnly
                    disabled
                  />
                </div>
                <small className="help-text">Current salary (read-only)</small>
              </div>
              
              <div className="form-group">
                <label>New Salary *</label>
                <div className="salary-input-wrapper">
                  <span className="currency-symbol">৳</span>
                  <input
                    type="number"
                    className={`form-input ${errors.new_salary ? 'error' : ''}`}
                    value={emailData.new_salary}
                    onChange={(e) => setEmailData({...emailData, new_salary: e.target.value})}
                    step="1000"
                    min="0"
                    required
                  />
                </div>
                {errors.new_salary && (
                  <small className="error-text">{errors.new_salary}</small>
                )}
              </div>
            </div>
            
            {emailData.new_salary && emailData.old_salary && 
             parseFloat(emailData.new_salary) !== parseFloat(emailData.old_salary) && (
              <div className={`difference-preview ${diff.isIncrement ? 'increment' : 'decrement'}`}>
                <div className="difference-label">
                  {diff.isIncrement ? '📈 Increase' : '📉 Decrease'}
                </div>
                <div className="difference-amount">
                  {formatCurrency(diff.amount)} ({diff.percentage.toFixed(1)}%)
                </div>
                <div className="salary-comparison">
                  <span className="old">{formatCurrency(emailData.old_salary)}</span>
                  <span className="arrow">→</span>
                  <span className="new">{formatCurrency(emailData.new_salary)}</span>
                </div>
              </div>
            )}
            
            <div className="form-row">
              <div className="form-group">
                <label>Current Designation</label>
                <input
                  type="text"
                  className="form-input"
                  value={emailData.old_designation}
                  onChange={(e) => setEmailData({...emailData, old_designation: e.target.value})}
                  placeholder="Current designation"
                />
              </div>
              
              <div className="form-group">
                <label>New Designation (if changed)</label>
                <input
                  type="text"
                  className="form-input"
                  value={emailData.new_designation}
                  onChange={(e) => setEmailData({...emailData, new_designation: e.target.value})}
                  placeholder="New designation"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Effective Date *</label>
              <input
                type="date"
                className="form-input"
                value={emailData.effective_date}
                onChange={(e) => setEmailData({...emailData, effective_date: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Reason for Change</label>
              <textarea
                className="form-textarea"
                value={emailData.reason}
                onChange={(e) => setEmailData({...emailData, reason: e.target.value})}
                rows="3"
                placeholder="e.g., Performance review, Promotion, Annual increment, etc."
              />
            </div>
            
            <div className="info-box">
              <FaExclamationTriangle className="info-icon" />
              <div className="info-content">
                <strong>Note:</strong> This email will be sent to the employee's registered email address: 
                <span className="employee-email">{employee?.email}</span>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-send" disabled={loading}>
              <FaPaperPlane />
              {loading ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </form>
        
        <style>{`
          .salary-email-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
            animation: fadeIn 0.3s ease-out;
          }
          
          .salary-email-modal {
            background: white;
            border-radius: 16px;
            width: 90%;
            max-width: 650px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            animation: slideUp 0.3s ease-out;
          }
          
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e2e8f0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 16px 16px 0 0;
          }
          
          .modal-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          
          .modal-icon {
            font-size: 1.5rem;
          }
          
          .modal-title h3 {
            margin: 0;
            font-size: 1.25rem;
          }
          
          .modal-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 1.25rem;
            padding: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: background 0.2s;
          }
          
          .modal-close:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          
          .modal-body {
            padding: 1.5rem;
          }
          
          .employee-summary {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 12px;
            margin-bottom: 1.5rem;
          }
          
          .employee-avatar img,
          .avatar-placeholder {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            object-fit: cover;
          }
          
          .avatar-placeholder {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
          }
          
          .employee-info h4 {
            margin: 0 0 0.25rem 0;
            font-size: 1.1rem;
            color: #1e293b;
          }
          
          .employee-designation {
            margin: 0;
            font-size: 0.9rem;
            color: #64748b;
          }
          
          .employee-id {
            margin: 0.25rem 0 0 0;
            font-size: 0.85rem;
            color: #94a3b8;
          }
          
          .form-group {
            margin-bottom: 1.25rem;
          }
          
          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #334155;
            font-size: 0.9rem;
          }
          
          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          
          .salary-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }
          
          .currency-symbol {
            position: absolute;
            left: 12px;
            color: #64748b;
            font-weight: 600;
          }
          
          .salary-input-wrapper input {
            padding-left: 35px;
          }
          
          .form-input,
          .form-textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-size: 0.95rem;
            transition: all 0.2s;
          }
          
          .form-input:focus,
          .form-textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
          
          .form-input.error {
            border-color: #ef4444;
          }
          
          .error-text {
            color: #ef4444;
            font-size: 0.8rem;
            margin-top: 0.25rem;
            display: block;
          }
          
          .help-text {
            color: #94a3b8;
            font-size: 0.75rem;
            margin-top: 0.25rem;
            display: block;
          }
          
          .change-type-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          
          .change-type-btn {
            padding: 0.75rem;
            border: 2px solid #e2e8f0;
            background: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
          }
          
          .change-type-btn.active.increment {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border-color: #10b981;
            color: #065f46;
          }
          
          .change-type-btn.active.decrement {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            border-color: #ef4444;
            color: #7f1d1d;
          }
          
          .difference-preview {
            background: #f8fafc;
            border-radius: 12px;
            padding: 1rem;
            margin: 1rem 0;
            text-align: center;
          }
          
          .difference-preview.increment {
            border-left: 4px solid #10b981;
          }
          
          .difference-preview.decrement {
            border-left: 4px solid #ef4444;
          }
          
          .difference-label {
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
          
          .difference-amount {
            font-size: 1.25rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
          }
          
          .difference-preview.increment .difference-amount {
            color: #10b981;
          }
          
          .difference-preview.decrement .difference-amount {
            color: #ef4444;
          }
          
          .salary-comparison {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            font-size: 0.9rem;
          }
          
          .salary-comparison .old {
            text-decoration: line-through;
            color: #94a3b8;
          }
          
          .salary-comparison .arrow {
            color: #64748b;
          }
          
          .salary-comparison .new {
            font-weight: bold;
            color: #1e293b;
          }
          
          .info-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 1rem;
            border-radius: 8px;
            display: flex;
            gap: 0.75rem;
            margin-top: 1rem;
          }
          
          .info-icon {
            color: #f59e0b;
            font-size: 1.25rem;
            flex-shrink: 0;
          }
          
          .info-content {
            font-size: 0.85rem;
            color: #92400e;
          }
          
          .employee-email {
            display: block;
            font-weight: 600;
            margin-top: 0.25rem;
            color: #78350f;
          }
          
          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            padding: 1.5rem;
            border-top: 1px solid #e2e8f0;
            background: #f8fafc;
          }
          
          .btn-cancel,
          .btn-send {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
          }
          
          .btn-cancel {
            background: #f1f5f9;
            color: #475569;
          }
          
          .btn-cancel:hover {
            background: #e2e8f0;
          }
          
          .btn-send {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          
          .btn-send:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }
          
          .btn-send:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @media (max-width: 640px) {
            .form-row {
              grid-template-columns: 1fr;
            }
            
            .change-type-buttons {
              flex-direction: column;
            }
            
            .modal-footer {
              flex-direction: column;
            }
            
            .btn-cancel,
            .btn-send {
              width: 100%;
              justify-content: center;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default SalaryEmailModal;