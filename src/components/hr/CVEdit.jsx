import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Sidebars from './sidebars';

const CVEdit = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        const response = await axios.get(`http://119.148.12.1:8000/api/hrms/api/CVAdd/${id}/`);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchCV();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, cv_file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      await axios.put(
        `http://119.148.12.1:8000/api/hrms/api/CVAdd/${id}/`,
        formDataToSubmit,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      alert("CV updated successfully!");
      navigate("/cv-list");
    } catch (error) {
      console.error("Error updating CV:", error);
      alert("Failed to update CV");
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      
      backgroundColor: "#DCEEF3",
    },
    content: {
      flex: 1,
      padding: "24px",
      overflow: "auto",
      display: "flex",
      flexDirection: "column",
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flex: 1,
    },
    loadingText: {
      fontSize: "18px",
      color: "#4a5568",
    },
    card: {
      backgroundColor: '#A7D5E1',
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
      padding: "24px",
      maxWidth: "800px",
      width: "100%",
      margin: "0 auto",
    },
    heading: {
      fontSize: "24px",
      fontWeight: "600",
      color: "#2c3e50",
      marginBottom: "24px",
      paddingBottom: "12px",
      borderBottom: "1px solid #eaeaea",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "20px",
      marginBottom: "20px",
    },
    formGroup: {
      marginBottom: "16px",
    },
    label: {
      display: "block",
      fontWeight: "500",
      marginBottom: "8px",
      fontSize: "14px",
      color: "#4a5568",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      fontSize: "14px",
      border: "1px solid #e2e8f0",
      borderRadius: "4px",
      backgroundColor: "#DCEEF3",
    },
    fileInputContainer: {
      marginTop: "8px",
    },
    currentFile: {
      fontSize: "13px",
      color: "#4a5568",
      marginBottom: "8px",
    },
    buttonContainer: {
      display: "flex",
      justifyContent: "flex-start",
      gap: "12px",
      marginTop: "24px",
    },
    button: {
      padding: "10px 20px",
      fontSize: "14px",
      fontWeight: "500",
      borderRadius: "4px",
      cursor: "pointer",
      border: "none",
    },
    submitButton: {
      backgroundColor: "#3182ce",
      color: "white",
      ":hover": {
        backgroundColor: "#2b6cb0",
      },
      ":disabled": {
        backgroundColor: "#a0aec0",
        cursor: "not-allowed",
      },
    },
    cancelButton: {
      backgroundColor: "#e2e8f0",
      color: "#4a5568",
      ":hover": {
        backgroundColor: "#cbd5e0",
      },
    },
  };

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.content}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>Loading CV details...</p>
          </div>
        ) : (
          <div style={styles.card}>
            <h2 style={styles.heading}>Edit CV</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Position for</label>
                  <input
                    type="text"
                    name="position_for"
                    value={formData.position_for}
                    onChange={handleChange}
                    
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date of Birth</label>
                  <input
                    type="date"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Reference</label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                   
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>CV File</label>
                  {formData.existing_cv && (
                    <p style={styles.currentFile}>
                      Current file: <strong>{formData.existing_cv.split('/').pop()}</strong>
                    </p>
                  )}
                  <div style={styles.fileInputContainer}>
                    <input
                      type="file"
                      name="cv_file"
                      onChange={handleFileChange}
                      style={styles.input}
                      accept=".pdf,.doc,.docx"
                    />
                  </div>
                  <small style={{ color: '#718096', fontSize: '13px' }}>
                    Leave empty to keep the existing file
                  </small>
                </div>
              </div>

              <div style={styles.buttonContainer}>
                <button
                  type="submit"
                  style={{ ...styles.button, ...styles.submitButton }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  style={{ ...styles.button, ...styles.cancelButton }}
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default CVEdit;