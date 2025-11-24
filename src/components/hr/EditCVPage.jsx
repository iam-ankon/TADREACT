import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLetterSendById, updateLetterSend } from "../../api/employeeApi";
import Sidebars from "./sidebars";

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
    letter_file: null,
    letter_type: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCV = async () => {
      try {
        setLoading(true);
        const response = await getLetterSendById(cvId);
        setCvData(response.data);
      } catch (error) {
        console.error("Error fetching CV:", error);
        alert("Failed to load CV data. Please try again.");
      } finally {
        setLoading(false);
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
        letter_file: e.target.files[0],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!cvData.letter_type) {
        alert("Please select a letter type.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", cvData.name);
      formData.append("email", cvData.email);
      if (cvData.letter_file) {
        formData.append("letter_file", cvData.letter_file);
      }
      formData.append("letter_type", cvData.letter_type);

      await updateLetterSend(cvId, formData);
      alert("Letter updated successfully!");
      navigate("/letter-send");
    } catch (error) {
      console.error("Error updating letter:", error);
      alert("Failed to update letter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !cvData.name) {
    return (
      <div style={styles.loadingContainer}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.mainContent}>
        <div style={styles.formContainer}>
          <h2 style={styles.formHeader}>Edit Letter</h2>
          <form onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Name *</label>
              <input
                type="text"
                name="name"
                value={cvData.name || ""}
                onChange={handleInputChange}
                required
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                name="email"
                value={cvData.email || ""}
                onChange={handleInputChange}
                required
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Letter File</label>
              <input
                type="file"
                name="letter_file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Letter Type *</label>
              <select
                name="letter_type"
                value={cvData.letter_type || ""}
                onChange={handleInputChange}
                required
                style={styles.select}
                disabled={loading}
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

            <button
              type="submit"
              style={styles.button}
              disabled={loading}
            >
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#DCEEF3",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "18px",
  },
  mainContent: {
    flex: 1,
    padding: "30px",
    backgroundColor: "#A7D5E1",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  formContainer: {
    backgroundColor: "#DCEEF3",
    padding: "30px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "600px",
  },
  formHeader: {
    textAlign: "center",
    marginBottom: "24px",
    color: "#2c3e50",
    fontSize: "24px",
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    backgroundColor: "#ffffff",
    fontSize: "14px",
  },
  select: {
    width: "100%",
    padding: "12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    backgroundColor: "#ffffff",
    fontSize: "14px",
  },
  button: {
    width: "100%",
    padding: "12px 20px",
    backgroundColor: "#0078d4",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    marginTop: "10px",
    transition: "background-color 0.3s",
  },
};

export default EditCVPage;