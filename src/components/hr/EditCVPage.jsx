import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebars from './sidebars';

const LETTER_CHOICES = [
  { value: "offer_letter", label: "Offer Letter" },
  { value: "appointment_letter", label: "Appointment Letter" },
  { value: "joining_report", label: "Joining Report" },
];

const EditCVPage = () => {
  const { cvId } = useParams();
  const navigate = useNavigate();

  const [cvData, setCvData] = useState({
    name: "",
    email: "",
    letterFile: null,
    letterType: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCV = async () => {
      try {
        const response = await axios.get(
          `http://119.148.12.1:8000/api/hrms/api/letter_send/${cvId}/`
        );
        setCvData(response.data);
      } catch (error) {
        console.error("Error fetching CV:", error);
      }
    };
    fetchCV();
  }, [cvId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCvData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setCvData((prevData) => ({
        ...prevData,
        letterFile: e.target.files[0],
      }));
    }
  };

  const updateCVManagement = async (formData) => {
    try {
      const response = await axios.put(
        `http://119.148.12.1:8000/api/hrms/api/letter_send/${cvId}/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!cvData.letterType) {
        alert("Please select a letter type.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", cvData.name);
      formData.append("email", cvData.email);
      if (cvData.letterFile) {
        formData.append("letter_file", cvData.letterFile);
      }
      formData.append("letter_type", cvData.letterType);

      await updateCVManagement(formData);
      alert("CV updated successfully!");
      navigate("/letter-send");
    } catch (error) {
      console.error("Error updating CV:", error);
      alert("Failed to update CV. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    display: "flex",
    height: "100vh",
    fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#DCEEF3",
  };

  const mainContentStyle = {
    flex: 1,
    padding: "30px",
    backgroundColor: "#A7D5E1",
    
  };

  const formContainerStyle = {
    backgroundColor: "#DCEEF3",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    maxWidth: "600px",
    margin: "0 auto",
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
    backgroundColor: "#A7D5E1",
  };

  const selectStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    backgroundColor: "#A7D5E1",
  };

  const buttonStyle = {
    padding: "10px 20px",
    backgroundColor: "#0078d4",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "20px", // Added marginTop
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex' }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Your page content here */}
        </div>
      </div>
      <div style={mainContentStyle}>
        <div style={formContainerStyle}>
          <h2 style={formHeaderStyle}>Edit Letter</h2>
          <form>
            {/* Removed onSubmit from form */}
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
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Letter File</label>
              <input
                type="file"
                name="letterFile"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={inputStyle}
              />
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
            </div>
          </form>
          <button type="button" style={buttonStyle} onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCVPage;