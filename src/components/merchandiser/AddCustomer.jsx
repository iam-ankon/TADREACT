import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../merchandiser/Sidebar.jsx";

export default function AddCustomer() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    remarks: "",
    buyer: [],
  });
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const CUSTOMER_API =
    "http://119.148.51.38:8000/api/merchandiser/api/customer/";
  const BUYER_API = "http://119.148.51.38:8000/api/merchandiser/api/buyer/";

  useEffect(() => {
    axios
      .get(BUYER_API)
      .then((res) => setBuyers(res.data))
      .catch((err) => {
        console.error("Failed to fetch buyers", err);
        setMessage({ type: "error", text: "Failed to load buyers." });
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "buyer") {
      const selected = Array.from(e.target.selectedOptions).map((opt) =>
        parseInt(opt.value)
      );
      setForm({ ...form, buyer: selected });
    } else {
      setForm({ ...form, [name]: value });
    }
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) return;

    setLoading(true);

    axios
      .post(CUSTOMER_API, form)
      .then(() => {
        setMessage({ type: "success", text: "Customer added successfully!" });
        setTimeout(() => navigate("/customers"), 1500);
      })
      .catch((err) => {
        console.error(err);
        let errorText = "Something went wrong. Please try again.";
        if (err.response?.data) {
          // Handle field-specific errors from API
          const apiErrors = err.response.data;
          setErrors(apiErrors);
          errorText = Object.values(apiErrors).flat().join(" ");
        }
        setMessage({ type: "error", text: errorText });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="page-container">
      <Sidebar />

      <div className="content-container">
        <div className="form-header">
          <h2 className="page-title">Add New Customer</h2>
          <button
            onClick={() => navigate("/customers")}
            className="btn btn-outline"
          >
            Back to Customers
          </button>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="alert-close">
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-grid">
            <div className="form-group">
              <label className="required">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={errors.name ? "input-error" : ""}
              />
              {errors.name && (
                <span className="error-message">{errors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label className="required">Phone</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={errors.phone ? "input-error" : ""}
              />
              {errors.phone && (
                <span className="error-message">{errors.phone}</span>
              )}
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                rows="3"
              />
            </div>

            {/* <div className="form-group">
              <label>Associated Buyers</label>
              <select
                name="buyer"
                multiple
                value={form.buyer}
                onChange={handleChange}
                className="multi-select"
              >
                {buyers.map(buyer => (
                  <option key={buyer.id} value={buyer.id}>{buyer.name}</option>
                ))}
              </select>
              <div className="select-hint">
                <span className="hint-text">Hold CTRL/CMD to select multiple</span>
                {form.buyer.length > 0 && (
                  <span className="selected-count">{form.buyer.length} selected</span>
                )}
              </div>
            </div> */}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                "Add Customer"
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        /* Base Styles */
        .page-container {
          display: flex;
          min-height: 100vh;
          background-color: #a7d5e1;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .content-container {
          flex: 1;
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        /* Header Styles */
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .page-title {
          font-size: 1.75rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        /* Form Styles */
        .customer-form {
          background: #dceef3;
          border-radius: 0.75rem;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #334155;
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
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          transition: border-color 0.2s;
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
          min-height: 100px;
          resize: vertical;
        }

        .multi-select {
          min-height: 120px;
        }

        .select-hint {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-size: 0.75rem;
        }

        .hint-text {
          color: #64748b;
        }

        .selected-count {
          color: #3b82f6;
          font-weight: 500;
        }

        /* Error Messages */
        .error-message {
          display: block;
          margin-top: 0.25rem;
          color: #ef4444;
          font-size: 0.75rem;
        }

        /* Alert Messages */
        .alert {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          position: relative;
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
          padding: 0.75rem 1.5rem;
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

        .btn-primary:hover {
          background-color: #2563eb;
        }

        .btn-primary:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }

        .btn-outline {
          background-color: white;
          color: #3b82f6;
          border: 1px solid #3b82f6;
        }

        .btn-outline:hover {
          background-color: #f0f7ff;
        }

        /* Form Actions */
        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
          padding-top: 1.5rem;
        }

        /* Loading Spinner */
        .spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
