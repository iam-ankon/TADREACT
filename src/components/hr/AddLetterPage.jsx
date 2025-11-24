import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  addLetterSend,
  updateInterviewOfferLetterStatus,
} from "../../api/employeeApi";
import Sidebars from "./sidebars";

const LETTER_CHOICES = [
  { value: "offer_letter", label: "Offer Letter" },
  { value: "appointment_letter", label: "Appointment Letter" },
  { value: "joining_report", label: "Joining Report" },
];

const AddLetterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewData = location.state || {};

  console.log("📨 AddLetterPage received state:", interviewData);

  const [cvData, setCvData] = useState({
    name: interviewData.name || "",
    email: interviewData.email || "",
    letterFile: null,
    letterType: "offer_letter",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCvData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setCvData((prevData) => ({
        ...prevData,
        letterFile: e.target.files[0],
      }));

      if (errors.letterFile) {
        setErrors((prev) => ({ ...prev, letterFile: "" }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!cvData.name?.trim()) {
      newErrors.name = "Name is required";
    }

    if (!cvData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(cvData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!cvData.letterFile) {
      newErrors.letterFile = "Please select a letter file";
    }

    if (!cvData.letterType) {
      newErrors.letterType = "Please select a letter type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", cvData.name.trim());
      formData.append("email", cvData.email.trim());
      formData.append("letter_type", cvData.letterType);

      if (cvData.letterFile) {
        formData.append("letter_file", cvData.letterFile);
      }

      // Send the letter
      await addLetterSend(formData);

      // CRITICAL: Update the interview record in database to persist offer_letter_sent
      if (interviewData.id) {
        try {
          await updateInterviewOfferLetterStatus(
            interviewData.id,
            cvData.email
          );
          console.log("✅ Interview offer_letter_sent updated in database");

          // Also store in localStorage for immediate access
          const sentLetters = JSON.parse(
            localStorage.getItem("sentOfferLetters") || "{}"
          );
          sentLetters[interviewData.id] = {
            sent: true,
            email: cvData.email,
            timestamp: Date.now(),
          };
          localStorage.setItem("sentOfferLetters", JSON.stringify(sentLetters));
        } catch (updateError) {
          console.warn("⚠️ Could not update interview status:", updateError);
          // Still store in localStorage as fallback
          const sentLetters = JSON.parse(
            localStorage.getItem("sentOfferLetters") || "{}"
          );
          sentLetters[interviewData.id] = {
            sent: true,
            email: cvData.email,
            timestamp: Date.now(),
          };
          localStorage.setItem("sentOfferLetters", JSON.stringify(sentLetters));
        }
      }

      alert("Letter sent successfully!");

      // Navigate back with comprehensive state
      const returnState = {
        ...interviewData,
        letterSent: true,
        offerLetterSent: true,
        sentEmail: cvData.email,
        interviewId: interviewData.id,
        refresh: true,
        timestamp: Date.now(),
      };

      console.log(
        "🔄 Navigating back to interviews with offer letter sent status"
      );

      navigate("/interviews", {
        state: returnState,
        replace: true,
      });
    } catch (error) {
      console.error("Error sending letter:", error);
      alert("Failed to send letter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    display: "flex",
    height: "100vh",
    backgroundColor: "#DCEEF3",
  };

  const mainContentStyle = {
    flex: 1,
    padding: "30px",
    backgroundColor: "#DCEEF3",
    overflow: "auto",
  };

  const formContainerStyle = {
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#A7D5E1",
  };

  const formHeaderStyle = {
    textAlign: "center",
    marginBottom: "20px",
    color: "#333",
  };

  const inputGroupStyle = {
    marginBottom: "20px",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    backgroundColor: "#DCEEF3",
  };

  const selectStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    backgroundColor: "#DCEEF3",
  };

  const errorStyle = {
    color: "#d32f2f",
    fontSize: "14px",
    marginTop: "5px",
    display: "block",
  };

  const buttonStyle = {
    padding: "10px 20px",
    backgroundColor: "#0078d4",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "10px",
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  };

  const buttonContainerStyle = {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
  };

  return (
    <div style={containerStyle}>
      <Sidebars />
      <div style={mainContentStyle}>
        <div style={formContainerStyle}>
          <h2 style={formHeaderStyle}>Send Letter</h2>
          {interviewData.name && (
            <div
              style={{
                backgroundColor: "#e8f4f8",
                padding: "10px",
                borderRadius: "4px",
                marginBottom: "20px",
                border: "1px solid #0078d4",
              }}
            >
              <strong>Candidate:</strong> {interviewData.name} |{" "}
              <strong>Position:</strong> {interviewData.position_for}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Name *</label>
              <input
                type="text"
                name="name"
                value={cvData.name}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
              {errors.name && <span style={errorStyle}>{errors.name}</span>}
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                name="email"
                value={cvData.email}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
              {errors.email && <span style={errorStyle}>{errors.email}</span>}
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Letter File *</label>
              <input
                type="file"
                name="letterFile"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                required
                style={inputStyle}
              />
              {errors.letterFile && (
                <span style={errorStyle}>{errors.letterFile}</span>
              )}
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Letter Type *</label>
              <select
                name="letterType"
                value={cvData.letterType}
                onChange={handleInputChange}
                required
                style={selectStyle}
              >
                <option value="" disabled>
                  Select Letter Type
                </option>
                {LETTER_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
              {errors.letterType && (
                <span style={errorStyle}>{errors.letterType}</span>
              )}
            </div>
            <div style={buttonContainerStyle}>
              <button
                type="submit"
                style={loading ? disabledButtonStyle : buttonStyle}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Letter"}
              </button>
              <button
                type="button"
                style={{ ...buttonStyle, backgroundColor: "#6c757d" }}
                onClick={() => navigate("/interviews")}
              >
                Back to Interviews
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddLetterPage;
