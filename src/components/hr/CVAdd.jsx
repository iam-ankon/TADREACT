import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebars from './sidebars';

const CVAdd = () => {
  const [formData, setFormData] = useState({
    name: "",
    position_for: "",
    age: "",
    reference: "",
    email: "",
    phone: "",
    cvFile: null,
  });
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, cvFile: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cvFile) {
      alert("Please select a CV file");
      return;
    }

    setIsLoading(true); // Set loading to true when submitting

    const uploadData = new FormData();
    for (const key in formData) {
      uploadData.append(key === "cvFile" ? "cv_file" : key, formData[key]);
    }

    try {
      await axios.post("http://119.148.12.1:8000/api/hrms/api/CVAdd/", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("CV uploaded successfully");
      setFormData({
        name: "",
        position_for: "",
        age: "",
        reference: "",
        email: "",
        phone: "",
        cvFile: null,
      });
    } catch (error) {
      console.error("Error uploading CV:", error);
      alert("Failed to upload CV");
    } finally {
      setIsLoading(false); // Set loading to false when done
    }
  };

  const styles = {
    appContainer: {
      display: "flex",
      height: "100vh",
      
      backgroundColor: "#DCEEF3",
    },
    formContainer: {
     
      padding: "100px",
      borderRadius: "10px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      width: "800px",
      margin: "40px auto",
      backgroundColor: '#A7D5E1',
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
      backgroundColor: "#0078d499", // Semi-transparent version
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
      <style>{spinnerStyles}</style> {/* Add the spinner animation */}
      <div style={{ display: 'flex' }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Your page content here */}
        </div>
      </div>

      <div style={styles.formContainer}>
        <h2 style={styles.heading}>Add CV</h2>
        <form onSubmit={handleSubmit}>
          {/* Form fields here */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name:</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required style={styles.inputField} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Position for:</label>
              <input type="text" name="position_for" value={formData.position_for} onChange={handleChange} required style={styles.inputField} />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date of Birth:</label>
              <input type="date" name="age" value={formData.age} onChange={handleChange} required style={styles.inputField} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Reference:</label>
              <input type="text" name="reference" value={formData.reference} onChange={handleChange} required style={styles.inputField} />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email:</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required style={styles.inputField} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone:</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} required style={styles.inputField} />
            </div>
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label style={styles.label}>CV File:</label>
            <input type="file" onChange={handleFileChange} required style={styles.inputField} />
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
            ) : "Submit"}
          </button>
          <button onClick={() => navigate("/cv-list")} style={styles.viewBtn}>View All CVs</button>
        </div>
      </div>
    </div>
  );
};

export default CVAdd;