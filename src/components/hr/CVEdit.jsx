import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebars from "./sidebars";
import { getCVById, updateCV } from "../../api/employeeApi";
import {
  ArrowLeft,
  Save,
  X,
  User,
  Briefcase,
  Calendar,
  Users,
  Mail,
  Phone,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

const CVEdit = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    position_for: "",
    age: "",
    reference: "",
    email: "",
    phone: "",
    cv_file: null,
    existing_cv: null,
  });

  useEffect(() => {
    const fetchCV = async () => {
      setIsLoading(true);
      try {
        const response = await getCVById(id);
        setFormData({
          name: response.data.name,
          position_for: response.data.position_for || "",
          age: response.data.age || "",
          reference: response.data.reference || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          cv_file: null,
          existing_cv: response.data.cv_file,
        });
      } catch (error) {
        console.error("Error fetching CV:", error);
        alert("Failed to load CV details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCV();
  }, [id]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    }

    if (!formData.position_for.trim()) {
      newErrors.position_for = "Position is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a PDF or Word document");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert("File size must be less than 5MB");
        return;
      }
      setFormData({ ...formData, cv_file: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("name", formData.name);
    formDataToSubmit.append("position_for", formData.position_for);
    formDataToSubmit.append("age", formData.age);
    formDataToSubmit.append("reference", formData.reference);
    formDataToSubmit.append("email", formData.email);
    formDataToSubmit.append("phone", formData.phone);

    if (formData.cv_file instanceof File) {
      formDataToSubmit.append("cv_file", formData.cv_file);
    }

    try {
      await updateCV(id, formDataToSubmit);
      alert("CV updated successfully!");
      navigate("/cv-list");
    } catch (error) {
      console.error("Error updating CV:", error);
      alert("Failed to update CV");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          padding: "48px",
          textAlign: "center",
          backgroundColor: "#DCEEF3",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            display: "inline-block",
            animation: "spin 1s linear infinite",
            width: "48px",
            height: "48px",
            border: "3px solid rgba(0, 120, 212, 0.2)",
            borderTopColor: "#0078D4",
            borderRadius: "50%",
          }}
        ></div>
        <p style={{ marginTop: "16px", color: "#4B5563" }}>
          Loading CV details...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#DCEEF3",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebars />

      <div
        style={{
          flex: 1,
          padding: "24px",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100vh - 0px)",
        }}
      >
        {/* Modern Header */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              style={{
                padding: "12px",
                background: "white",
                border: "1px solid rgba(209, 213, 219, 0.8)",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#D1D5DB")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(209, 213, 219, 0.8)")
              }
            >
              <ArrowLeft size={20} color="#374151" />
            </motion.button>

            <div
              style={{
                padding: "14px",
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(245, 158, 11, 0.3)",
              }}
            >
              <User style={{ color: "white" }} size={28} />
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
                Edit Candidate
              </h2>
              <p
                style={{
                  color: "#6B7280",
                  fontSize: "14px",
                  margin: 0,
                }}
              >
                Update candidate information and documents
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                background: "#FEF3C7",
                border: "1px solid #FDE68A",
                borderRadius: "10px",
                fontSize: "14px",
              }}
            >
              <div style={{ color: "#D97706" }}>
                <AlertCircle size={14} />
              </div>
              <div>
                <span style={{ fontWeight: "500", color: "#374151" }}>
                  Editing Mode
                </span>
                <span style={{ color: "#6B7280", marginLeft: "4px" }}>
                  Candidate ID: {id}
                </span>
              </div>
            </div>

            {formData.existing_cv && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  background: "#D1FAE5",
                  border: "1px solid #A7F3D0",
                  borderRadius: "10px",
                  fontSize: "14px",
                }}
              >
                <div style={{ color: "#059669" }}>
                  <FileText size={14} />
                </div>
                <div>
                  <span style={{ fontWeight: "500", color: "#374151" }}>
                    CV Attached
                  </span>
                  <span style={{ color: "#6B7280", marginLeft: "4px" }}>
                    Ready for update
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Form Card with Scroll */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "white",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid rgba(229, 231, 235, 0.5)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            marginBottom: "24px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
             // Limit height for scrolling
          }}
        >
          {/* Form Header */}
          <div
            style={{
              padding: "24px",
              borderBottom: "1px solid #F3F4F6",
              background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
               // Prevent header from shrinking
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 4px 0",
                }}
              >
                Edit Candidate Information
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6B7280",
                  margin: 0,
                }}
              >
                Update the details below and save changes
              </p>
            </div>
            <div
              style={{
                padding: "8px 16px",
                background: "#FEF3C7",
                border: "1px solid #FDE68A",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#92400E",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <AlertCircle size={12} />
              All fields are required
            </div>
          </div>

          {/* Form Content with Scroll */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "20px",
                  marginBottom: "20px",
                }}
              >
                {/* Name Field */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <User size={14} />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: errors.name ? "#FEF2F2" : "#F9FAFB",
                      border: errors.name
                        ? "1px solid #FCA5A5"
                        : "1px solid #D1D5DB",
                      borderRadius: "10px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.2s ease",
                    }}
                    placeholder="Enter candidate name"
                    onFocus={(e) => {
                      e.target.style.borderColor = errors.name
                        ? "#EF4444"
                        : "#3B82F6";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.name
                        ? "#FCA5A5"
                        : "#D1D5DB";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  {errors.name && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#EF4444",
                        marginTop: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <AlertCircle size={12} />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Position Field */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <Briefcase size={14} />
                    Position *
                  </label>
                  <input
                    type="text"
                    name="position_for"
                    value={formData.position_for}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: errors.position_for ? "#FEF2F2" : "#F9FAFB",
                      border: errors.position_for
                        ? "1px solid #FCA5A5"
                        : "1px solid #D1D5DB",
                      borderRadius: "10px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.2s ease",
                    }}
                    placeholder="Enter position applied for"
                  />
                  {errors.position_for && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#EF4444",
                        marginTop: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <AlertCircle size={12} />
                      {errors.position_for}
                    </p>
                  )}
                </div>

                {/* Date of Birth Field */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <Calendar size={14} />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="age"
                    value={formData.age}
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
                  />
                </div>

                {/* Reference Field */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <Users size={14} />
                    Reference
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
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <Mail size={14} />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: errors.email ? "#FEF2F2" : "#F9FAFB",
                      border: errors.email
                        ? "1px solid #FCA5A5"
                        : "1px solid #D1D5DB",
                      borderRadius: "10px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.2s ease",
                    }}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#EF4444",
                        marginTop: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <AlertCircle size={12} />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <Phone size={14} />
                    Phone *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: errors.phone ? "#FEF2F2" : "#F9FAFB",
                      border: errors.phone
                        ? "1px solid #FCA5A5"
                        : "1px solid #D1D5DB",
                      borderRadius: "10px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.2s ease",
                    }}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#EF4444",
                        marginTop: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <AlertCircle size={12} />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* CV File Upload Section */}
              <div
                style={{
                  marginTop: "24px",
                  padding: "20px",
                  background: "#F9FAFB",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      padding: "10px",
                      background:
                        "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                      borderRadius: "10px",
                    }}
                  >
                    <FileText size={18} color="white" />
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#111827",
                        margin: "0 0 4px 0",
                      }}
                    >
                      CV Document
                    </h4>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#6B7280",
                        margin: 0,
                      }}
                    >
                      Update the candidate's CV document (PDF or Word)
                    </p>
                  </div>
                </div>

                {formData.existing_cv && (
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "12px",
                      background: "#E0F2FE",
                      border: "1px solid #BAE6FD",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <FileText size={14} color="#0284C7" />
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#0369A1",
                        }}
                      >
                        Current File:
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#4B5563",
                        margin: "0 0 8px 0",
                        paddingLeft: "24px",
                      }}
                    >
                      {formData.existing_cv.split("/").pop()}
                    </p>
                    <a
                      href={formData.existing_cv}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "13px",
                        color: "#3B82F6",
                        textDecoration: "none",
                        paddingLeft: "24px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      View current CV
                    </a>
                  </div>
                )}

                <div style={{ position: "relative" }}>
                  <input
                    type="file"
                    name="cv_file"
                    onChange={handleFileChange}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                      zIndex: 2,
                    }}
                    accept=".pdf,.doc,.docx"
                  />
                  <div
                    style={{
                      padding: "20px",
                      border: "2px dashed #D1D5DB",
                      borderRadius: "10px",
                      textAlign: "center",
                      background: "white",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "#3B82F6")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "#D1D5DB")
                    }
                  >
                    <div style={{ marginBottom: "12px" }}>
                      <Upload size={24} color="#6B7280" />
                    </div>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        margin: "0 0 4px 0",
                      }}
                    >
                      {formData.cv_file
                        ? formData.cv_file.name
                        : "Click to upload new CV"}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6B7280",
                        margin: 0,
                      }}
                    >
                      {formData.cv_file
                        ? "Ready to upload"
                        : "Upload new PDF or Word document (Max 5MB)"}
                    </p>
                    {formData.cv_file && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "4px 8px",
                          background: "#D1FAE5",
                          color: "#059669",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "500",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <CheckCircle size={10} />
                        New file selected
                      </div>
                    )}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6B7280",
                    marginTop: "8px",
                    textAlign: "center",
                  }}
                >
                  Leave empty to keep the existing file
                </p>
              </div>

              {/* Form Actions - Fixed at bottom */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "16px",
                  marginTop: "32px",
                  paddingTop: "24px",
                  borderTop: "1px solid #F3F4F6",
                  position: "sticky",
                  bottom: "0",
                  background: "white",
                  marginBottom: "16px",
                }}
              >
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(-1)}
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
                  <X size={16} />
                  Cancel
                </motion.button>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                  style={{
                    padding: "12px 32px",
                    background: isSubmitting
                      ? "#9CA3AF"
                      : "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: isSubmitting
                      ? "none"
                      : "0 4px 14px rgba(16, 185, 129, 0.4)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #0DA271 0%, #047857 100%)";
                      e.currentTarget.style.boxShadow =
                        "0 6px 20px rgba(16, 185, 129, 0.6)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #10B981 0%, #059669 100%)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 14px rgba(16, 185, 129, 0.4)";
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw
                        size={16}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Information Footer */}
        {/* <div
          style={{
            padding: "20px",
            background: "#F9FAFB",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            fontSize: "13px",
            color: "#6B7280",
            maxHeight: "150px",
            overflowY: "auto", // Add scroll to footer
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <AlertCircle size={16} color="#6B7280" />
            <div>
              <p style={{ margin: "0 0 8px 0", fontWeight: "500" }}>
                Editing Guidelines
              </p>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                <li>Fields marked with * are required</li>
                <li>CV files should be PDF or Word documents (max 5MB)</li>
                <li>Leaving the CV field empty will keep the existing file</li>
                <li>All changes are saved immediately upon submission</li>
                <li>Double-check email and phone number accuracy</li>
                <li>Make sure the position title is clear and specific</li>
                <li>Consider adding reference details if available</li>
              </ul>
            </div>
          </div>
        </div> */}
      </div>

      {/* Add custom CSS for scrollbars */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Custom scrollbar for form content */
        .form-content-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .form-content-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
          margin: 4px;
        }

        .form-content-scroll::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        .form-content-scroll::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        /* Custom scrollbar for footer */
        .footer-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .footer-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .footer-scroll::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .footer-scroll::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
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

export default CVEdit;