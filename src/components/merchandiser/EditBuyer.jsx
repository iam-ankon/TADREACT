import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Tag,
  Grid,
  ChevronLeft,
  Save,
  AlertCircle,
  RefreshCw
} from "lucide-react";

export default function EditBuyer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    wgr: "",
    product_categories: "",
    remarks: "",
  });

  const [customers, setCustomers] = useState([]); // list of all customers
  const [selectedCustomers, setSelectedCustomers] = useState([]); // buyer's current customers

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch all customers
  useEffect(() => {
    axios
      .get("http://119.148.12.1:8000/api/merchandiser/api/customer/")
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error("Error fetching customers:", err));
  }, []);

  // Fetch buyer details
  useEffect(() => {
    const fetchBuyer = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://119.148.12.1:8000/api/merchandiser/api/buyer/${id}/`
        );

        setForm({
          name: response.data.name || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          department: response.data.department || "",
          wgr: response.data.wgr || "",
          product_categories: response.data.product_categories || "",
          remarks: response.data.remarks || "",
        });

        // Get customer IDs from the buyer data
        // Try different possible field names
        const customerIds = response.data.Customer || 
                           response.data.customers || 
                           response.data.customer_ids || 
                           [];
        
        setSelectedCustomers(customerIds.map(id => id.toString()));
      } catch (err) {
        console.error("Error fetching buyer:", err);
        setError("Failed to load buyer data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBuyer();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Invalid email format";
    
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError("Please fix the validation errors");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      // Prepare payload with customer IDs as numbers
      const payload = {
        ...form,
        Customer: selectedCustomers.map((id) => Number(id)), // Use correct field name
      };

      // Convert empty strings to null
      Object.keys(payload).forEach((key) => {
        if (payload[key] === "") {
          payload[key] = null;
        }
      });

      console.log("Submitting payload:", payload);

      await axios.put(
        `http://119.148.12.1:8000/api/merchandiser/api/buyer/${id}/`,
        payload,
        { 
          headers: { "Content-Type": "application/json" },
          timeout: 10000
        }
      );

      navigate("/buyers");
    } catch (err) {
      console.error("Error updating buyer:", err);
      
      if (err.response?.status === 500) {
        setError("Server error. Please check if the email is unique and try again.");
      } else if (err.code === 'NETWORK_ERROR') {
        setError("Network error. Please check your connection and try again.");
      } else if (err.response?.data) {
        // Handle Django validation errors
        if (typeof err.response.data === 'object') {
          setFieldErrors(err.response.data);
          setError("Please fix the validation errors");
        } else {
          setError("Failed to update buyer. Please try again.");
        }
      } else {
        setError("Failed to update buyer. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "#A7D5E1",
        }}
      >
        <Sidebar />
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <RefreshCw size={32} className="spinner" />
          <div>Loading buyer data...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#A7D5E1",
      }}
    >
      <Sidebar />
      <div
        style={{
          flex: 1,
          padding: "32px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "#DCEEF3",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            padding: "32px",
            maxWidth: "640px",
            width: "100%",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Title + Back Button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "24px",
              gap: "12px",
            }}
          >
            <button
              onClick={() => navigate("/buyers")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                backgroundColor: "white",
                cursor: "pointer",
                color: "#374151",
              }}
              title="Go back"
            >
              <ChevronLeft size={20} />
            </button>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
                margin: 0,
              }}
            >
              Edit Buyer
            </h2>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                marginBottom: "24px",
                backgroundColor: "#fee2e2",
                borderLeft: "4px solid #dc2626",
                color: "#b91c1c",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={20} />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  color: "#b91c1c",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                &times;
              </button>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: "24px" }}
          >
            <div style={{ display: "grid", gap: "16px" }}>
              {[
                {
                  field: "name",
                  icon: <User size={18} />,
                  placeholder: "Full Name",
                  required: true
                },
                {
                  field: "email",
                  icon: <Mail size={18} />,
                  placeholder: "Email Address",
                  required: true
                },
                {
                  field: "phone",
                  icon: <Phone size={18} />,
                  placeholder: "Phone Number",
                  required: false
                },
                {
                  field: "department",
                  icon: <Briefcase size={18} />,
                  placeholder: "Department",
                  required: false
                },
                {
                  field: "wgr",
                  icon: <Tag size={18} />,
                  placeholder: "WGR Number",
                  required: false
                },
                {
                  field: "product_categories",
                  icon: <Grid size={18} />,
                  placeholder: "Product Categories",
                  required: false
                },
              ].map(({ field, icon, placeholder, required }) => (
                <div key={field}>
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9ca3af",
                      }}
                    >
                      {icon}
                    </div>
                    <input
                      type={field === "wgr" ? "number" : "text"}
                      name={field}
                      placeholder={placeholder + (required ? " *" : "")}
                      value={form[field] || ""}
                      onChange={handleChange}
                      style={{
                        padding: "12px 16px 12px 40px",
                        border: fieldErrors[field] ? "1px solid #dc2626" : "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        width: "100%",
                        backgroundColor: "white",
                        color: "#111827",
                      }}
                    />
                  </div>
                  {fieldErrors[field] && (
                    <p style={{ color: "#dc2626", fontSize: "12px", margin: "4px 0 0", paddingLeft: "4px" }}>
                      {Array.isArray(fieldErrors[field]) 
                        ? fieldErrors[field].join(", ") 
                        : fieldErrors[field]}
                    </p>
                  )}
                </div>
              ))}

              {/* Customer Multi-select */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: "500",
                  }}
                >
                  Select Customers
                </label>
                <select
                  multiple
                  value={selectedCustomers}
                  onChange={(e) => {
                    const values = Array.from(
                      e.target.selectedOptions,
                      (opt) => opt.value
                    );
                    setSelectedCustomers(values);
                  }}
                  style={{
                    padding: "12px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    width: "100%",
                    backgroundColor: "white",
                    color: "#111827",
                    minHeight: "120px",
                  }}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                  Hold CTRL/CMD to select multiple customers. Selected: {selectedCustomers.length}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "12px",
                      color: "#9ca3af",
                    }}
                  >
                    <Tag size={18} />
                  </div>
                  <textarea
                    name="remarks"
                    placeholder="Remarks"
                    value={form.remarks || ""}
                    onChange={handleChange}
                    rows={3}
                    style={{
                      padding: "12px 16px 12px 40px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      width: "100%",
                      backgroundColor: "white",
                      color: "#111827",
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "16px",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/buyers")}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "white",
                  color: "#4b5563",
                  fontSize: "14px",
                  fontWeight: "500",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#2563eb",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  borderRadius: "6px",
                  border: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}