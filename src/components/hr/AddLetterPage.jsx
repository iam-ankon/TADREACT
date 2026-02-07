import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  addLetterSend,
  updateInterviewOfferLetterStatus,
} from "../../api/employeeApi";
import Sidebars from "./sidebars";
import {
  FaPaperPlane,
  FaFileUpload,
  FaUser,
  FaEnvelope,
  FaFileAlt,
  FaArrowLeft,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";

const LETTER_CHOICES = [
  { value: "offer_letter", label: "Offer Letter", color: "#3b82f6" },
  { value: "appointment_letter", label: "Appointment Letter", color: "#10b981" },
  { value: "joining_report", label: "Joining Report", color: "#8b5cf6" },
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
  const [filePreview, setFilePreview] = useState(null);

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
      const file = e.target.files[0];
      setCvData((prevData) => ({
        ...prevData,
        letterFile: file,
      }));

      // Create file preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }

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
    } else {
      const validTypes = ['.pdf', '.doc', '.docx'];
      const fileExtension = cvData.letterFile.name.split('.').pop().toLowerCase();
      if (!validTypes.includes('.' + fileExtension)) {
        newErrors.letterFile = "Please select a PDF, DOC, or DOCX file";
      }
      if (cvData.letterFile.size > 10 * 1024 * 1024) { // 10MB limit
        newErrors.letterFile = "File size should be less than 10MB";
      }
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

      // Success animation before redirect
      setTimeout(() => {
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
      }, 1500);

    } catch (error) {
      console.error("Error sending letter:", error);
      alert("Failed to send letter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getLetterTypeColor = (type) => {
    const letterType = LETTER_CHOICES.find(choice => choice.value === type);
    return letterType ? letterType.color : "#3b82f6";
  };

  return (
    <div className="add-letter-container">
      <Sidebars />
      <div className="content-wrapper">
        <div className="add-letter-card">
          {/* Header Section */}
          <div className="letter-header">
            <div className="header-content">
              <h1>
                <FaPaperPlane className="header-icon" />
                Send Letter
              </h1>
              <p className="header-subtitle">
                Send offer, appointment, or joining letters to candidates
              </p>
            </div>
            <button
              onClick={() => navigate("/interviews")}
              className="btn-back"
            >
              <FaArrowLeft /> Back to Interviews
            </button>
          </div>

          {/* Candidate Info Banner */}
          {interviewData.name && (
            <div className="candidate-banner">
              <div className="banner-content">
                <div className="candidate-avatar">
                  <FaUser />
                </div>
                <div className="candidate-details">
                  <h3>{interviewData.name}</h3>
                  <div className="candidate-meta">
                    <span className="meta-item">
                      <strong>Position:</strong> {interviewData.position_for || "N/A"}
                    </span>
                    <span className="meta-item">
                      <strong>Department:</strong> {interviewData.department_name || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="banner-status">
                <span className="status-badge">Ready to Send</span>
              </div>
            </div>
          )}

          {/* Letter Form */}
          <form onSubmit={handleSubmit} className="letter-form">
            <div className="form-sections">
              {/* Basic Information Section */}
              <div className="form-section">
                <div className="section-header">
                  <FaUser className="section-icon" />
                  <h3>Candidate Information</h3>
                </div>
                <div className="form-grid">
                  <div className="input-group">
                    <label className={`input-label ${errors.name ? 'error' : ''}`}>
                      <FaUser className="input-icon" /> Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={cvData.name}
                      onChange={handleInputChange}
                      placeholder="Enter candidate's full name"
                      className={`form-input ${errors.name ? 'input-error' : ''}`}
                    />
                    {errors.name && (
                      <span className="error-message">{errors.name}</span>
                    )}
                  </div>

                  <div className="input-group">
                    <label className={`input-label ${errors.email ? 'error' : ''}`}>
                      <FaEnvelope className="input-icon" /> Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={cvData.email}
                      onChange={handleInputChange}
                      placeholder="Enter candidate's email address"
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                    />
                    {errors.email && (
                      <span className="error-message">{errors.email}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Letter Details Section */}
              <div className="form-section">
                <div className="section-header">
                  <FaFileAlt className="section-icon" />
                  <h3>Letter Details</h3>
                </div>
                
                <div className="input-group">
                  <label className={`input-label ${errors.letterType ? 'error' : ''}`}>
                    Letter Type *
                  </label>
                  <div className="letter-type-options">
                    {LETTER_CHOICES.map((choice) => (
                      <div
                        key={choice.value}
                        className={`letter-type-card ${
                          cvData.letterType === choice.value ? 'selected' : ''
                        }`}
                        onClick={() => {
                          setCvData(prev => ({ ...prev, letterType: choice.value }));
                          if (errors.letterType) {
                            setErrors(prev => ({ ...prev, letterType: "" }));
                          }
                        }}
                        style={{
                          borderColor: cvData.letterType === choice.value ? choice.color : '#e2e8f0',
                          backgroundColor: cvData.letterType === choice.value ? `${choice.color}10` : 'white',
                        }}
                      >
                        <div
                          className="type-icon"
                          style={{ backgroundColor: choice.color }}
                        >
                          <FaFileAlt />
                        </div>
                        <div className="type-info">
                          <span className="type-name">{choice.label}</span>
                          <span className="type-description">
                            {choice.value === 'offer_letter' ? 'Job offer and terms'
                              : choice.value === 'appointment_letter' ? 'Official appointment confirmation'
                              : 'Joining instructions and reporting details'}
                          </span>
                        </div>
                        {cvData.letterType === choice.value && (
                          <FaCheckCircle className="selection-check" style={{ color: choice.color }} />
                        )}
                      </div>
                    ))}
                  </div>
                  {errors.letterType && (
                    <span className="error-message">{errors.letterType}</span>
                  )}
                </div>

                <div className="input-group">
                  <label className={`input-label ${errors.letterFile ? 'error' : ''}`}>
                    <FaFileUpload className="input-icon" /> Letter File *
                  </label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      name="letterFile"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      id="letterFile"
                      className="file-input"
                    />
                    <label htmlFor="letterFile" className="file-upload-label">
                      {cvData.letterFile ? (
                        <div className="file-selected">
                          <div className="file-info">
                            <FaFileAlt className="file-icon" />
                            <div className="file-details">
                              <span className="file-name">{cvData.letterFile.name}</span>
                              <span className="file-size">
                                {(cvData.letterFile.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="change-file-btn"
                            onClick={() => {
                              setCvData(prev => ({ ...prev, letterFile: null }));
                              setFilePreview(null);
                            }}
                          >
                            Change File
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="upload-icon">
                            <FaFileUpload />
                          </div>
                          <div className="upload-text">
                            <span className="upload-title">Choose a file</span>
                            <span className="upload-subtitle">
                              PDF, DOC, DOCX up to 10MB
                            </span>
                          </div>
                        </>
                      )}
                    </label>
                    {filePreview && (
                      <div className="file-preview">
                        <img src={filePreview} alt="File preview" />
                      </div>
                    )}
                  </div>
                  {errors.letterFile && (
                    <span className="error-message">{errors.letterFile}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/interviews")}
              >
                <FaArrowLeft /> Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinner-icon" />
                    Sending Letter...
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    Send Letter
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .add-letter-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .content-wrapper {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .add-letter-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          padding: 2rem;
          min-height: 90vh;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Header Section */
        .letter-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #f1f5f9;
        }

        .header-content h1 {
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .header-icon {
          color: #8b5cf6;
          font-size: 1.8rem;
        }

        .header-subtitle {
          color: #64748b;
          margin-top: 0.5rem;
          font-size: 0.95rem;
        }

        .btn-back {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .btn-back:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          background: linear-gradient(135deg, #475569 0%, #334155 100%);
        }

        /* Candidate Banner */
        .candidate-banner {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid #7dd3fc;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .banner-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .candidate-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
        }

        .candidate-details h3 {
          margin: 0 0 0.5rem 0;
          color: #0c4a6e;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .candidate-meta {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .meta-item {
          color: #0c4a6e;
          font-size: 0.9rem;
          display: flex;
          gap: 0.25rem;
        }

        .meta-item strong {
          font-weight: 600;
        }

        .status-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        /* Form Sections */
        .letter-form {
          margin-top: 2rem;
        }

        .form-sections {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .form-section {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .section-icon {
          color: #8b5cf6;
          font-size: 1.2rem;
        }

        .section-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          color: #475569;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .input-label.error {
          color: #dc2626;
        }

        .input-icon {
          color: #8b5cf6;
          font-size: 0.9rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .form-input.input-error {
          border-color: #dc2626;
        }

        .form-input.input-error:focus {
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .error-message {
          color: #dc2626;
          font-size: 0.85rem;
          margin-top: 0.5rem;
          display: block;
        }

        /* Letter Type Options */
        .letter-type-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .letter-type-card {
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 1rem;
          position: relative;
        }

        .letter-type-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .letter-type-card.selected {
          border-width: 2px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .type-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
        }

        .type-info {
          flex: 1;
        }

        .type-name {
          display: block;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .type-description {
          display: block;
          font-size: 0.8rem;
          color: #64748b;
        }

        .selection-check {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 1rem;
        }

        /* File Upload */
        .file-upload-area {
          margin-top: 0.5rem;
        }

        .file-input {
          display: none;
        }

        .file-upload-label {
          display: block;
          border: 2px dashed #cbd5e1;
          border-radius: 10px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .file-upload-label:hover {
          border-color: #8b5cf6;
          background: #f8fafc;
        }

        .upload-icon {
          font-size: 2.5rem;
          color: #cbd5e1;
          margin-bottom: 1rem;
        }

        .upload-title {
          display: block;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .upload-subtitle {
          display: block;
          color: #64748b;
          font-size: 0.9rem;
        }

        .file-selected {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .file-icon {
          font-size: 2rem;
          color: #8b5cf6;
        }

        .file-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .file-name {
          font-weight: 600;
          color: #1e293b;
        }

        .file-size {
          font-size: 0.85rem;
          color: #64748b;
        }

        .change-file-btn {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .change-file-btn:hover {
          background: #e2e8f0;
        }

        .file-preview {
          margin-top: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          max-height: 200px;
        }

        .file-preview img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        /* Form Actions */
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 3rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }

        .btn-primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(123, 92, 246, 0.2);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(123, 92, 246, 0.3);
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .spinner-icon {
          animation: spin 1s linear infinite;
        }

        /* Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .content-wrapper {
            padding: 1rem;
          }

          .add-letter-card {
            padding: 1.5rem;
          }

          .letter-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .candidate-banner {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .banner-content {
            flex-direction: column;
            text-align: center;
          }

          .candidate-meta {
            flex-direction: column;
            gap: 0.5rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .letter-type-options {
            grid-template-columns: 1fr;
          }

          .file-selected {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn-secondary, .btn-primary {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .header-content h1 {
            font-size: 1.5rem;
          }

          .form-section {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AddLetterPage;