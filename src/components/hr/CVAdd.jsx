import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebars from "./sidebars";
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

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, cv_file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cv_file) {
      alert("Please select a CV file");
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      alert("Please enter candidate name");
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
        cv_file: cvData.cv_file ? cvData.cv_file.name : "No file"
      });

      await addCV(cvData);

      alert("CV uploaded successfully");
      // Reset form
      setFormData({
        name: "",
        position_for: "",
        age: "",
        reference: "",
        email: "",
        phone: "",
        cv_file: null,
      });
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      
    } catch (error) {
      console.error("Error uploading CV:", error);
      let errorMessage = "Failed to upload CV";
      
      if (error.response?.data) {
        console.error("API Error Response:", error.response.data);
        // Handle specific error messages from the API
        if (typeof error.response.data === 'object') {
          // Extract all error messages
          const errors = [];
          for (const [key, value] of Object.entries(error.response.data)) {
            if (Array.isArray(value)) {
              errors.push(`${key}: ${value.join(', ')}`);
            } else {
              errors.push(`${key}: ${value}`);
            }
          }
          errorMessage = errors.join('\n');
        } else {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    appContainer: {
      display: "flex",
      height: "100vh",
      backgroundColor: "#DCEEF3",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    formContainer: {
      padding: "100px",
      borderRadius: "10px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      width: "800px",
      margin: "40px auto",
      backgroundColor: "#A7D5E1",
    },
    heading: {
      fontSize: "1.4rem",
      marginBottom: "20px",
      fontWeight: "300",
      textAlign: "center",
      color: "#333",
    },
    formRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: "20px",
      marginBottom: "15px",
    },
    formGroup: {
      flex: 1,
    },
    label: {
      display: "block",
      fontSize: "0.95rem",
      marginBottom: "6px",
      color: "#333",
    },
    inputField: {
      width: "100%",
      padding: "8px 10px",
      fontSize: "0.95rem",
      border: "1px solid #ccc",
      borderRadius: "6px",
      backgroundColor: "#DCEEF3",
    },
    submitBtn: {
      width: "150px",
      padding: "10px",
      backgroundColor: "#006DAA",
      color: "#fff",
      fontSize: "1rem",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    submitBtnDisabled: {
      width: "150px",
      padding: "10px",
      backgroundColor: "#0078d499",
      color: "#fff",
      fontSize: "1rem",
      border: "none",
      borderRadius: "6px",
      cursor: "not-allowed",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    viewBtn: {
      width: "150px",
      padding: "10px",
      backgroundColor: "#006DAA",
      color: "#fff",
      fontSize: "1rem",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
    },
    buttonContainer: {
      display: "flex",
      gap: "100px",
      marginTop: "20px",
      justifyContent: "center",
    },
    spinner: {
      width: "20px",
      height: "20px",
      border: "3px solid rgba(255,255,255,0.3)",
      borderRadius: "50%",
      borderTopColor: "#fff",
      animation: "spin 1s ease-in-out infinite",
      marginRight: "8px",
    },
  };

  // Add CSS for the spinner animation
  const spinnerStyles = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={styles.appContainer}>
      <style>{spinnerStyles}</style>
      <div style={{ display: "flex" }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Your page content here */}
        </div>
      </div>
      <div style={styles.formContainer}>
        <h2 style={styles.heading}>Add CV</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={styles.inputField}
                placeholder="Enter candidate name"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Position for:</label>
              <input
                type="text"
                name="position_for"
                value={formData.position_for}
                onChange={handleChange}
                required
                style={styles.inputField}
                placeholder="Enter position"
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date of Birth:</label>
              <input
                type="date"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                style={styles.inputField}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Reference:</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                required
                style={styles.inputField}
                placeholder="Enter reference"
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={styles.inputField}
                placeholder="Enter email address"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone:</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                style={styles.inputField}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label style={styles.label}>CV File:</label>
            <input
              type="file"
              name="cv_file"
              onChange={handleFileChange}
              required
              style={styles.inputField}
              accept=".pdf,.doc,.docx"
            />
          </div>
        </form>
        <div style={styles.buttonContainer}>
          <button
            type="submit"
            onClick={handleSubmit}
            style={isLoading ? styles.submitBtnDisabled : styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div style={styles.spinner}></div>
                Processing...
              </>
            ) : (
              "Submit"
            )}
          </button>
          <button onClick={() => navigate("/cv-list")} style={styles.viewBtn}>
            View All CVs
          </button>
        </div>
      </div>
    </div>
  );
};

export default CVAdd;