import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebars from './sidebars';

const InviteMail = () => {
  const [description, setDescription] = useState("");
  const [interviewDetails, setInterviewDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      setInterviewDetails(location.state);
    } else {
      navigate("/interviews");
    }
  }, [location.state, navigate]);

  const handleSendMail = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://119.148.12.1:8000/api/hrms/api/invitemail/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken(),
        },
        credentials: "include",
        body: JSON.stringify({
          description,
          interview_details: interviewDetails,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Message sent successfully and saved!");
        navigate(`/interviews?interview_id=${interviewDetails.id}`, { replace: true });
      } else {
        alert(`Error sending message: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      alert("Error sending message");
    } finally {
      setLoading(false);
    }
  };

  const getCSRFToken = () => {
    const name = "csrftoken";
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  };

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.mainContent}>
        <div style={styles.card}>
          <h2 style={styles.heading}>Send Interview Invitation</h2>

          <div style={styles.detailsContainer}>
            <h3 style={styles.detailsHeading}>Candidate Details</h3>
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Name:</span>
                <span style={styles.detailValue}>{interviewDetails.name}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Reference:</span>
                <span style={styles.detailValue}>{interviewDetails.reference}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Email:</span>
                <span style={styles.detailValue}>{interviewDetails.email}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Phone:</span>
                <span style={styles.detailValue}>{interviewDetails.phone}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Interview Date:</span>
                <span style={styles.detailValue}>
                  {interviewDetails.interview_date ? new Date(interviewDetails.interview_date).toLocaleString() : ''}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.inputContainer}>
            <label htmlFor="description" style={styles.label}>Invitation Message</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.textarea}
              placeholder="Dear [Candidate Name],\n\nWe are pleased to invite you for an interview on [Date] at [Time]..."
            />
          </div>

          <button
            onClick={handleSendMail}
            style={{
              ...styles.button,
              backgroundColor: loading ? "#94c9e0" : "#0078D4",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={styles.spinner}></span>
                Sending...
              </>
            ) : (
              "Send Invitation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#DCEEF3",
    
  },
  mainContent: {
    flex: 1,
    padding: "2rem",
    marginLeft: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  card: {
    backgroundColor: '#A7D5E1',
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    width: "100%",
    maxWidth: "800px",
  },
  heading: {
    fontSize: "1.8rem",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "1.5rem",
    textAlign: "center",
    borderBottom: "2px solid #e0e6ed",
    paddingBottom: "1rem",
  },
  detailsContainer: {
    backgroundColor: "#DCEEF3",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    border: "1px solid #e0e6ed",
  },
  detailsHeading: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "1rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid #e0e6ed",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1rem",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  detailLabel: {
    fontSize: "0.9rem",
    color: "#7f8c8d",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: "1rem",
    color: "#2c3e50",
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: "1.5rem",
    
  },
  label: {
    display: "block",
    fontSize: "1rem",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "0.75rem",
  },
  textarea: {
    width: "100%",
    padding: "1rem",
    border: "1px solid #e0e6ed",
    borderRadius: "8px",
    fontSize: "1rem",
    outline: "none",
    minHeight: "150px",
    resize: "vertical",
    transition: "all 0.3s ease",
    backgroundColor: "#DCEEF3",
    lineHeight: "1.5",
  },
  textareaFocus: {
    borderColor: "#0078D4",
    boxShadow: "0 0 0 2px rgba(0, 120, 212, 0.2)",
  },
  button: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#0078D4",
    color: "white",
    fontSize: "1rem",
    fontWeight: "600",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.5rem",
  },
  buttonHover: {
    backgroundColor: "#005a9e",
    transform: "translateY(-1px)",
  },
  spinner: {
    display: "inline-block",
    width: "1rem",
    height: "1rem",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "50%",
    borderTopColor: "white",
    animation: "spin 1s ease-in-out infinite",
  },
  "@keyframes spin": {
    to: { transform: "rotate(360deg)" },
  },
};

export default InviteMail;