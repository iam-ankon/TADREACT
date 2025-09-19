import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

export default function AddBuyer() {
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

  const [customers, setCustomers] = useState([]); // All customers from API
  const [selectedCustomers, setSelectedCustomers] = useState([]); // Selected customer IDs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all customers on component load
  useEffect(() => {
    axios
      .get("http://119.148.12.1:8000/api/merchandiser/api/customer/")
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error("Error fetching customers:", err));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare payload with customer IDs as numbers
      const payload = {
        ...form,
        Customer: selectedCustomers.map((id) => Number(id)), // Changed from 'customers' to 'Customer'
      };

      // Convert empty strings to null
      Object.keys(payload).forEach((key) => {
        if (payload[key] === "") {
          payload[key] = null;
        }
      });

      console.log("Submitting payload:", payload); // Debug

      await axios.post(
        "http://119.148.12.1:8000/api/merchandiser/api/buyer/",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      navigate("/buyers");
    } catch (err) {
      console.error("Error adding buyer:", err);
      setError("Failed to add buyer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Add New Buyer
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
              <svg
                style={{ width: "20px", height: "20px", flexShrink: 0 }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
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
                },
                {
                  field: "email",
                  icon: <Mail size={18} />,
                  placeholder: "Email Address",
                },
                {
                  field: "phone",
                  icon: <Phone size={18} />,
                  placeholder: "Phone Number",
                },
                {
                  field: "department",
                  icon: <Briefcase size={18} />,
                  placeholder: "Department",
                },
                {
                  field: "wgr",
                  icon: <Tag size={18} />,
                  placeholder: "WGR Number",
                },
                {
                  field: "product_categories",
                  icon: <Grid size={18} />,
                  placeholder: "Product Categories",
                },
              ].map(({ field, icon, placeholder }) => (
                <div key={field} style={{ position: "relative" }}>
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
                    type="text"
                    name={field}
                    placeholder={placeholder}
                    value={form[field]}
                    onChange={handleChange}
                    style={{
                      padding: "12px 16px 12px 40px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      width: "100%",
                      backgroundColor:
                        field === "wgr" || field === "product_categories"
                          ? "#f9fafb"
                          : "white",
                      color: "#111827",
                    }}
                  />
                </div>
              ))}

              {/* Customer Multi-select */}
              <div style={{ position: "relative" }}>
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
                    const values = Array.from(e.target.selectedOptions, (opt) =>
                      Number(opt.value)
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
                  }}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remarks */}
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
                  value={form.remarks}
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
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  "Saving..."
                ) : (
                  <>
                    <Save size={16} /> Save Buyer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
