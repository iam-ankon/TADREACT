import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";
import { User, Mail, Phone, MapPin, FileText, Building2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customer_name: "",
    email: "",
    phone: "",
    address: "",
    remarks: "",
    customer_code: "",
  });
  
  const [originalData, setOriginalData] = useState(null);
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const CUSTOMER_API = `http://119.148.51.38:8000/api/merchandiser/api/customer/${id}/`;
  const CUSTOMER_LIST_API = "http://119.148.51.38:8000/api/merchandiser/api/customer/";

  // Fetch customer data and existing customers
  useEffect(() => {
    const fetchData = async () => {
      setFetchLoading(true);
      try {
        const [customerRes, customersRes] = await Promise.all([
          axios.get(CUSTOMER_API),
          axios.get(CUSTOMER_LIST_API)
        ]);
        
        const customerData = customerRes.data;
        
        // Extract customer name from either direct field or linked HRMS customer
        const customerName = customerData.customer_name || 
                            customerData.hrms_customer_name || 
                            (customerData.name?.customer_name) || 
                            "";
        
        setForm({
          customer_name: customerName,
          email: customerData.email || "",
          phone: customerData.phone || "",
          address: customerData.address || "",
          remarks: customerData.remarks || "",
          customer_code: customerData.customer_code || "",
        });
        
        setOriginalData({
          customer_name: customerName,
          email: customerData.email || "",
          phone: customerData.phone || "",
          address: customerData.address || "",
          remarks: customerData.remarks || "",
          customer_code: customerData.customer_code || "",
        });
        
        // Process existing customers for suggestions (exclude current customer)
        let customersList = [];
        if (Array.isArray(customersRes.data)) {
          customersList = customersRes.data;
        } else if (customersRes.data && Array.isArray(customersRes.data.results)) {
          customersList = customersRes.data.results;
        } else if (customersRes.data && Array.isArray(customersRes.data.data)) {
          customersList = customersRes.data.data;
        }
        
        setExistingCustomers(customersList.filter(c => c.id !== parseInt(id)));
        
      } catch (err) {
        console.error("Failed to load customer", err);
        setMessage({ type: "error", text: "Failed to load customer data." });
      } finally {
        setFetchLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Track changes
  useEffect(() => {
    if (originalData) {
      const changed = Object.keys(form).some(key => form[key] !== originalData[key]);
      setHasChanges(changed);
    }
  }, [form, originalData]);

  const handleCustomerNameChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, customer_name: value });
    
    if (errors.customer_name) {
      setErrors((prev) => ({ ...prev, customer_name: null }));
    }
    
    // Show suggestions based on input
    if (value.length > 1) {
      const filtered = existingCustomers.filter(cust => 
        (cust.customer_name || cust.hrms_customer_name || "") 
          .toLowerCase() 
          .includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (customer) => {
    setForm({
      customer_name: customer.customer_name || customer.hrms_customer_name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      remarks: customer.remarks || "",
      customer_code: customer.customer_code || "",
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.customer_name?.trim()) newErrors.customer_name = "Customer name is required";
    if (!form.phone?.trim()) newErrors.phone = "Phone number is required";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await axios.put(CUSTOMER_API, {
        customer_name: form.customer_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        remarks: form.remarks,
        customer_code: form.customer_code,
      });
      
      setMessage({ 
        type: "success", 
        text: `Customer "${form.customer_name}" updated successfully! Changes synced with HRMS.` 
      });
      
      // Update original data to match new data
      setOriginalData({ ...form });
      setHasChanges(false);
      
      // Redirect after 2 seconds
      setTimeout(() => navigate("/customers"), 2000);
      
    } catch (err) {
      console.error(err);
      let errorText = "Update failed. Please try again.";
      
      if (err.response?.data) {
        const apiErrors = err.response.data;
        if (typeof apiErrors === 'object') {
          setErrors(apiErrors);
          errorText = Object.values(apiErrors).flat().join(" ");
        } else if (typeof apiErrors === 'string') {
          errorText = apiErrors;
        }
      }
      
      setMessage({ type: "error", text: errorText });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges && window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
      navigate("/customers");
    } else if (!hasChanges) {
      navigate("/customers");
    }
  };

  if (fetchLoading) {
    return (
      <div className="page-container">
        <Sidebar />
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading customer details...</p>
        </div>
        <style jsx>{`
          .loading-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 1rem;
          }
          .spinner-large {
            width: 40px;
            height: 40px;
            border: 3px solid #e5e7eb;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Sidebar />

      <div className="content-container">
        <div className="form-header">
          <div>
            <button onClick={handleCancel} className="back-button">
              <ArrowLeft size={18} />
              Back to Customers
            </button>
            <h2 className="page-title">Edit Customer</h2>
            <p className="page-subtitle">Update customer information - Changes will sync with HRMS</p>
          </div>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.type === "success" ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="alert-close">
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="required">Customer Name</label>
              <div className="autocomplete-wrapper">
                <input
                  type="text"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleCustomerNameChange}
                  onFocus={() => form.customer_name?.length > 1 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Enter customer name"
                  className={errors.customer_name ? "input-error" : ""}
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {suggestions.map((customer) => (
                      <div
                        key={customer.id}
                        className="suggestion-item"
                        onMouseDown={() => selectSuggestion(customer)}
                      >
                        <Building2 size={14} />
                        <div>
                          <strong>{customer.customer_name || customer.hrms_customer_name}</strong>
                          {customer.email && <small>{customer.email}</small>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.customer_name && (
                <span className="error-message">{errors.customer_name}</span>
              )}
              <div className="field-hint">
                <small>Changing name will link to different HRMS customer if exists</small>
              </div>
            </div>

            <div className="form-group">
              <label>Customer Code</label>
              <input
                type="text"
                name="customer_code"
                value={form.customer_code}
                onChange={handleChange}
                placeholder="Optional reference code"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={errors.email ? "input-error" : ""}
                placeholder="customer@example.com"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="required">Phone</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={errors.phone ? "input-error" : ""}
                placeholder="Phone number"
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group full-width">
              <label>Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows="3"
                placeholder="Full address"
              />
            </div>

            <div className="form-group full-width">
              <label>Remarks</label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                rows="2"
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !hasChanges}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Updating...
                </>
              ) : (
                hasChanges ? "Update Customer & Sync to HRMS" : "No Changes"
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        /* Base Styles */
        .page-container {
          display: flex;
          min-height: 100vh;
          background-color: #f3f4f6;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .content-container {
          flex: 1;
          padding: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }

        /* Header Styles */
        .form-header {
          margin-bottom: 1.5rem;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          transition: color 0.2s;
        }

        .back-button:hover {
          color: #3b82f6;
        }

        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .page-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        /* Form Styles */
        .customer-form {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .full-width {
          grid-column: span 2;
        }

        .form-group {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .form-group label.required:after {
          content: " *";
          color: #ef4444;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          transition: all 0.2s;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input.input-error,
        .form-group textarea.input-error,
        .form-group select.input-error {
          border-color: #ef4444;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        /* Autocomplete Styles */
        .autocomplete-wrapper {
          position: relative;
          width: 100%;
        }

        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 0.25rem;
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid #f3f4f6;
        }

        .suggestion-item:hover {
          background-color: #f9fafb;
        }

        .suggestion-item div {
          display: flex;
          flex-direction: column;
        }

        .suggestion-item small {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .field-hint {
          margin-top: 0.375rem;
          color: #6b7280;
        }

        /* Error Messages */
        .error-message {
          display: block;
          margin-top: 0.375rem;
          color: #ef4444;
          font-size: 0.75rem;
        }

        /* Alert Messages */
        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
        }

        .alert-error {
          background-color: #fef2f2;
          color: #b91c1c;
          border-left: 4px solid #dc2626;
        }

        .alert-success {
          background-color: #f0fdf4;
          color: #166534;
          border-left: 4px solid #16a34a;
        }

        .alert-close {
          margin-left: auto;
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 1.25rem;
          padding: 0 0.5rem;
        }

        /* Button Styles */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .btn-secondary {
          background-color: white;
          color: #4b5563;
          border: 1px solid #e5e7eb;
        }

        .btn-secondary:hover {
          background-color: #f9fafb;
          border-color: #d1d5db;
        }

        /* Form Actions */
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        /* Loading Spinner */
        .spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .full-width {
            grid-column: span 1;
          }
          
          .content-container {
            padding: 1rem;
          }
          
          .customer-form {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}