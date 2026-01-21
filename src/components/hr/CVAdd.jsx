import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebars from "./sidebars";
import { motion } from "framer-motion";
import {
  Upload,
  User,
  Briefcase,
  Calendar,
  Hash,
  Mail,
  Phone,
  FileText,
  ArrowLeft,
  Plus,
  AlertCircle,
  CheckCircle,
  X,
  UploadCloud,
} from "lucide-react";
import { addCV } from "../../api/employeeApi";

const CVAdd = () => {
  const [formData, setFormData] = useState({
    name: "",
    position_for: "",
    age: "",
    reference: "",
    email: "",
    phone: "",
    cv_file: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fileName, setFileName] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear messages when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, cv_file: file });
      setFileName(file.name);
      // Clear messages when file is selected
      if (error) setError("");
      if (success) setSuccess("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setError("");
    setSuccess("");

    // Validate required fields
    if (!formData.cv_file) {
      setError("Please select a CV file");
      return;
    }

    if (!formData.name.trim()) {
      setError("Please enter candidate name");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter email address");
      return;
    }

    if (!formData.phone.trim()) {
      setError("Please enter phone number");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data according to the API requirements
      const cvData = {
        name: formData.name.trim(),
        position_for: formData.position_for.trim(),
        age: formData.age,
        reference: formData.reference.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        cv_file: formData.cv_file,
        employee: localStorage.getItem("employee_id") || 1,
      };

      console.log("Submitting CV data:", {
        ...cvData,
        cv_file: cvData.cv_file ? cvData.cv_file.name : "No file",
      });

      await addCV(cvData);

      setSuccess("CV uploaded successfully!");

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          name: "",
          position_for: "",
          age: "",
          reference: "",
          email: "",
          phone: "",
          cv_file: null,
        });
        setFileName("");
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error uploading CV:", error);
      let errorMessage = "Failed to upload CV";

      if (error.response?.data) {
        console.error("API Error Response:", error.response.data);
        // Handle specific error messages from the API
        if (typeof error.response.data === "object") {
          // Extract all error messages
          const errors = [];
          for (const [key, value] of Object.entries(error.response.data)) {
            if (Array.isArray(value)) {
              errors.push(`${key}: ${value.join(", ")}`);
            } else {
              errors.push(`${key}: ${value}`);
            }
          }
          errorMessage = errors.join("\n");
        } else {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(`Error: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  const clearFile = () => {
    setFormData({ ...formData, cv_file: null });
    setFileName("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#F8FAFC",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebars />

      <div
        style={{
          flex: 1,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
       
           maxHeight: "calc(100vh - 20px)",
          
        }}
      >
        {/* Header Section */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <Link to="/cv-list" style={{ textDecoration: "none" }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: "10px",
                  background: "white",
                  border: "1px solid rgba(209, 213, 219, 0.8)",
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowLeft size={20} color="#374151" />
              </motion.button>
            </Link>

            <div
              style={{
                padding: "14px",
                background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(139, 92, 246, 0.3)",
              }}
            >
              <Plus style={{ color: "white" }} size={28} />
            </div>

            <div>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#111827",
                  margin: "0 0 4px 0",
                  letterSpacing: "-0.025em",
                }}
              >
                Add New CV
              </h2>
              <p
                style={{
                  color: "#6B7280",
                  fontSize: "14px",
                  margin: 0,
                }}
              >
                Fill in the candidate details to create a new CV record
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Form Card with Scrollbar */}
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              border: "1px solid rgba(229, 231, 235, 0.5)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              overflow: "hidden", // Added for proper border radius with scroll
              display: "flex",
              flexDirection: "column",
             
            }}
          >
            {/* Form Content with Scroll */}
            <div
              style={{
                padding: "32px",
                overflowY: "auto", // Enable vertical scroll
                flex: 1,
              }}
            >
              {/* Success/Error Messages */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    backgroundColor: "#FEF2F2",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid #FECACA",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <AlertCircle size={20} color="#EF4444" />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#EF4444",
                        marginBottom: "4px",
                      }}
                    >
                      Error
                    </div>
                    <div style={{ fontSize: "13px", color: "#991B1B" }}>
                      {error}
                    </div>
                  </div>
                  <button
                    onClick={() => setError("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#9CA3AF",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    backgroundColor: "#F0FDF4",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid #BBF7D0",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <CheckCircle size={20} color="#10B981" />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#10B981",
                        marginBottom: "4px",
                      }}
                    >
                      Success!
                    </div>
                    <div style={{ fontSize: "13px", color: "#065F46" }}>
                      {success}
                    </div>
                  </div>
                  <button
                    onClick={() => setSuccess("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#9CA3AF",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Form Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "24px",
                    marginBottom: "32px",
                  }}
                >
                  {/* Name Field */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <User size={14} />
                        Candidate Name *
                      </div>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "#F9FAFB",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                        transition: "all 0.2s ease",
                      }}
                      placeholder="Enter candidate name"
                      onFocus={(e) => {
                        e.target.style.borderColor = "#8B5CF6";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(139, 92, 246, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#D1D5DB";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Position Field */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Briefcase size={14} />
                        Position *
                      </div>
                    </label>
                    <input
                      type="text"
                      name="position_for"
                      value={formData.position_for}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "#F9FAFB",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                        transition: "all 0.2s ease",
                      }}
                      placeholder="Enter position"
                      onFocus={(e) => {
                        e.target.style.borderColor = "#8B5CF6";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(139, 92, 246, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#D1D5DB";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Date of Birth Field */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Calendar size={14} />
                        Date of Birth *
                      </div>
                    </label>
                    <input
                      type="date"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "#F9FAFB",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                        transition: "all 0.2s ease",
                        color: formData.age ? "#374151" : "#9CA3AF",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#8B5CF6";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(139, 92, 246, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#D1D5DB";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Reference Field */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Hash size={14} />
                        Reference
                      </div>
                    </label>
                    <input
                      type="text"
                      name="reference"
                      value={formData.reference}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "#F9FAFB",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                        transition: "all 0.2s ease",
                      }}
                      placeholder="Enter reference (optional)"
                      onFocus={(e) => {
                        e.target.style.borderColor = "#8B5CF6";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(139, 92, 246, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#D1D5DB";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Mail size={14} />
                        Email Address *
                      </div>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "#F9FAFB",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                        transition: "all 0.2s ease",
                      }}
                      placeholder="Enter email address"
                      onFocus={(e) => {
                        e.target.style.borderColor = "#8B5CF6";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(139, 92, 246, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#D1D5DB";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Phone size={14} />
                        Phone Number *
                      </div>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "#F9FAFB",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                        transition: "all 0.2s ease",
                      }}
                      placeholder="Enter phone number"
                      onFocus={(e) => {
                        e.target.style.borderColor = "#8B5CF6";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(139, 92, 246, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#D1D5DB";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* File Upload Field - Full Width */}
                  <div style={{ gridColumn: "span 2" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Upload size={14} />
                        CV File *
                      </div>
                    </label>

                    {!fileName ? (
                      <div
                        style={{
                          border: "2px dashed #D1D5DB",
                          borderRadius: "12px",
                          padding: "32px",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          backgroundColor: "#F9FAFB",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#8B5CF6";
                          e.currentTarget.style.backgroundColor = "#F5F3FF";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#D1D5DB";
                          e.currentTarget.style.backgroundColor = "#F9FAFB";
                        }}
                        onClick={() =>
                          document.getElementById("cv-file-input").click()
                        }
                      >
                        <UploadCloud
                          size={48}
                          color="#9CA3AF"
                          style={{ marginBottom: "12px" }}
                        />
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "4px",
                          }}
                        >
                          Upload CV File
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#6B7280",
                            marginBottom: "16px",
                          }}
                        >
                          Click to upload or drag and drop
                        </div>
                        <div style={{ fontSize: "12px", color: "#9CA3AF" }}>
                          PDF, DOC, DOCX up to 10MB
                        </div>
                        <input
                          id="cv-file-input"
                          type="file"
                          name="cv_file"
                          onChange={handleFileChange}
                          required
                          style={{ display: "none" }}
                          accept=".pdf,.doc,.docx"
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          border: "1px solid #D1FAE5",
                          borderRadius: "12px",
                          padding: "16px",
                          backgroundColor: "#F0FDF4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              padding: "10px",
                              background: "#10B981",
                              borderRadius: "8px",
                              color: "white",
                            }}
                          >
                            <FileText size={20} />
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#065F46",
                              }}
                            >
                              {fileName}
                            </div>
                            <div style={{ fontSize: "12px", color: "#059669" }}>
                              Ready to upload
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearFile}
                          style={{
                            padding: "8px",
                            background: "none",
                            border: "none",
                            color: "#EF4444",
                            cursor: "pointer",
                            borderRadius: "6px",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#FEE2E2")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "none")
                          }
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons - Fixed at bottom of card */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "16px",
                    paddingTop: "24px",
                    borderTop: "1px solid #F3F4F6",
                    position: "sticky",
                    bottom: "0",
                    background: "white",
                    marginTop: "16px",
                  }}
                >
                  <Link to="/cv-list" style={{ textDecoration: "none" }}>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        padding: "12px 24px",
                        background: "white",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#F9FAFB")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "white")
                      }
                    >
                      Cancel
                    </motion.button>
                  </Link>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    style={{
                      padding: "12px 32px",
                      background: isLoading
                        ? "#A78BFA"
                        : "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)";
                        e.currentTarget.style.boxShadow =
                          "0 6px 20px rgba(139, 92, 246, 0.6)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 14px rgba(139, 92, 246, 0.4)";
                      }
                    }}
                  >
                    {isLoading ? (
                      <>
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            border: "2px solid rgba(255,255,255,0.3)",
                            borderRadius: "50%",
                            borderTopColor: "white",
                            animation: "spin 1s linear infinite",
                          }}
                        ></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload CV
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </div>

          {/* Quick Tips Card with Scroll */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
              color: "white",
              borderRadius: "16px",
              padding: "24px",
              maxHeight: "200px",
              overflowY: "auto", // Add scroll for tips card
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
                position: "sticky",
                top: "0",
                background: "#1E293B",
                paddingBottom: "8px",
              }}
            >
              <div
                style={{
                  padding: "8px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                }}
              >
                <AlertCircle size={20} />
              </div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                Quick Tips
              </h3>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "16px",
                fontSize: "13px",
                color: "#CBD5E1",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <div style={{ color: "#8B5CF6", flexShrink: 0 }}>•</div>
                <div>Ensure all required fields marked with * are filled</div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <div style={{ color: "#8B5CF6", flexShrink: 0 }}>•</div>
                <div>Supported file types: PDF, DOC, DOCX</div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <div style={{ color: "#8B5CF6", flexShrink: 0 }}>•</div>
                <div>Maximum file size: 10MB</div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <div style={{ color: "#8B5CF6", flexShrink: 0 }}>•</div>
                <div>Use a valid email format (e.g., name@example.com)</div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <div style={{ color: "#8B5CF6", flexShrink: 0 }}>•</div>
                <div>Make sure phone number includes country code if international</div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <div style={{ color: "#8B5CF6", flexShrink: 0 }}>•</div>
                <div>Double-check email and phone for accuracy</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Add CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Custom scrollbar styles for the form card */
        .form-scroll-container::-webkit-scrollbar {
          width: 8px;
        }

        .form-scroll-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .form-scroll-container::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        .form-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        /* Tips card scrollbar */
        .tips-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .tips-scroll-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .tips-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .tips-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }

        /* Global scrollbar styles */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        * {
          scrollbar-width: thin;
          scrollbar-color: #c1c1c1 #f1f1f1;
        }
      `}</style>
    </div>
  );
};

export default CVAdd;