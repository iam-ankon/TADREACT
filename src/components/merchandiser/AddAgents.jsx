import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../merchandiser/Sidebar.jsx";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiSave,
  FiArrowLeft,
} from "react-icons/fi";

export default function AddAgents() {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        "http://119.148.51.38:8000/api/merchandiser/api/agent/",
        formData
      );
      setSuccess("Agent added successfully!");
      setFormData({ name: "", address: "", email: "", phone: "" });

      setTimeout(() => {
        navigate("/agents");
      }, 1500);
    } catch (err) {
      if (err.response?.data?.email) {
        setError("Email must be unique. This one is already used.");
      } else {
        setError("Failed to add agent. Please check all fields.");
      }
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
      {/* Sidebar */}

      <Sidebar />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          padding: "2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            backgroundColor: "#DCEEF3",
            borderRadius: "12px",
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
            padding: "2rem",
            position: "relative",
          }}
        >
          <button
            onClick={() => navigate("/agents")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "transparent",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              marginBottom: "1.5rem",
              padding: "0.5rem 0",
              fontSize: "0.9rem",
              ":hover": {
                color: "#334155",
              },
            }}
          >
            <FiArrowLeft /> Back to Agents
          </button>

          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#0f172a",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <FiUser size={24} /> Add New Agent
          </h2>

          {error && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                backgroundColor: "#dcfce7",
                color: "#166534",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#334155",
                  marginBottom: "0.5rem",
                }}
              >
                Full Name
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#334155",
                  marginBottom: "0.5rem",
                }}
              >
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <FiMail
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  style={{ ...inputStyle, paddingLeft: "40px" }}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#334155",
                  marginBottom: "0.5rem",
                }}
              >
                Phone Number
              </label>
              <div style={{ position: "relative" }}>
                <FiPhone
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ ...inputStyle, paddingLeft: "40px" }}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#334155",
                  marginBottom: "0.5rem",
                }}
              >
                Address
              </label>
              <div style={{ position: "relative" }}>
                <FiMapPin
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "16px",
                    color: "#94a3b8",
                  }}
                />
                <textarea
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    height: "100px",
                    paddingLeft: "40px",
                    resize: "vertical",
                  }}
                  placeholder="123 Main St, City, Country"
                />
              </div>
            </div>

            <button type="submit" style={buttonStyle} disabled={isSubmitting}>
              {isSubmitting ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                  Processing...
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <FiSave /> Save Agent
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  backgroundColor: "#fff",
  fontSize: "0.9rem",
  transition: "all 0.2s",
  outline: "none",
  ":focus": {
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
  },
};

const buttonStyle = {
  width: "100%",
  padding: "0.75rem 1rem",
  backgroundColor: "#3b82f6",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "0.9rem",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "0.5rem",
  transition: "all 0.2s",
  ":hover": {
    backgroundColor: "#2563eb",
  },
  ":disabled": {
    backgroundColor: "#bfdbfe",
    cursor: "not-allowed",
  },
};
