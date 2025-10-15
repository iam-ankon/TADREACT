import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import Sidebars from "./sidebars";

const CVDetail = () => {
  const { id } = useParams();
  const [cvDetails, setCvDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const qrCodeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCVDetails = async () => {
      try {
        const response = await axios.get(
          `http://119.148.51.38:8000/api/hrms/api/CVAdd/${id}/`
        );
        setCvDetails(response.data);
      } catch (error) {
        console.error("Error fetching CV details:", error);
      }
    };

    fetchCVDetails();
  }, [id]);

  // Create QR code URL with data parameters
  const getQRCodeData = () => {
    if (!cvDetails) return "";

    // Create URL with query parameters containing CV details
    const baseUrl = "http://119.148.51.38:3000/interviews";

    const params = new URLSearchParams({
      id: cvDetails.id || id,
      name: cvDetails.name || "",
      position_for: cvDetails.position_for || "",
      age: cvDetails.age || "",
      email: cvDetails.email || "",
      phone: cvDetails.phone || "",
      reference: cvDetails.reference || "",
    });

    return `${baseUrl}?${params.toString()}`;
  };

  const generateQRCode = async () => {
    if (!qrCodeRef.current || !cvDetails) {
      alert("QR code or CV details not available");
      return;
    }

    try {
      setIsLoading(true);

      // 1. Get QR code as base64
      const qrCanvas = qrCodeRef.current;
      const qrCodeImage = qrCanvas.toDataURL("image/png");

      // 2. Create FormData
      const formData = new FormData();
      formData.append("qr_code", qrCodeImage);

      // 3. Make API request
      const response = await axios.post(
        `http://119.148.51.38:8000/api/hrms/api/CVAdd/${id}/update-cv-with-qr/`,
        formData,
        {
          responseType: "blob",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        }
      );

      // 4. Verify response type
      if (!response.headers["content-type"].includes("pdf")) {
        const errorText = await response.data.text();
        throw new Error(errorText || "Server returned non-PDF response");
      }

      // 5. Handle successful response
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // 6. Open PDF in new window
      const newWindow = window.open(url, "_blank");
      if (newWindow) {
        newWindow.onload = () => {
          try {
            newWindow.print();
          } catch (e) {
            console.error("Print error:", e);
            alert("Failed to auto-print. Please print manually.");
          }
        };
      } else {
        alert("Please allow popups for this site to view the PDF");
      }
    } catch (error) {
      console.error("Error updating CV with QR code:", error);
      let errorMessage = "An error occurred while processing your request";

      if (error.response) {
        try {
          const errorText = await error.response.data.text();
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.details || errorText;
          } catch {
            errorMessage = errorText;
          }
        } catch (e) {
          errorMessage = `Server error (${error.response.status})`;
        }
      } else if (error.code === "ERR_NETWORK") {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectForInterview = () => {
    if (cvDetails) {
      navigate("/interviews", {
        state: { ...cvDetails },
      });
    } else {
      console.error("No CV details available to send.");
    }
  };

  const styles = {
    container: {
      display: "flex",
      height: "100vh",

      backgroundColor: "#DCEEF3",
    },
    contentContainer: {
      flex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    card: {
      width: "100%",
      maxWidth: "600px",
      backgroundColor: "#A7D5E1",
      padding: "30px",
      borderRadius: "12px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
    },
    header: {
      fontSize: "28px",
      color: "#0078D4",
      marginBottom: "25px",
      fontWeight: "bold",
    },
    details: {
      fontSize: "16px",
      marginBottom: "15px",
      textAlign: "left",
    },
    detailItem: {
      marginBottom: "8px",
    },
    link: {
      color: "#0078D4",
      textDecoration: "none",
      fontWeight: "bold",
    },
    qrContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginTop: "30px",
    },
    qrDescription: {
      fontSize: "14px",
      color: "#666",
      marginTop: "10px",
      maxWidth: "300px",
      textAlign: "center",
    },
    buttonContainer: {
      marginTop: "30px",
      display: "flex",
      justifyContent: "center",
      gap: "20px",
    },
    button: {
      padding: "12px 25px",
      backgroundColor: "#006DAA",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "600",
      transition: "background-color 0.3s ease, transform 0.2s ease",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    },
    buttonHover: {
      backgroundColor: "#005ea6",
      transform: "scale(1.05)",
    },
    buttonDisabled: {
      backgroundColor: "#cccccc",
      cursor: "not-allowed",
    },
  };

  return (
    <div style={styles.container}>
      <div style={{ display: "flex" }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Your page content here */}
        </div>
      </div>
      <div style={styles.contentContainer}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          {cvDetails ? (
            <div style={styles.card}>
              <h2 style={styles.header}>CV Details</h2>
              <div style={styles.details}>
                <p style={styles.detailItem}>
                  <strong>Name:</strong> {cvDetails.name}
                </p>
                <p style={styles.detailItem}>
                  <strong>Position:</strong> {cvDetails.position_for}
                </p>
                <p style={styles.detailItem}>
                  <strong>Date of Birth:</strong> {cvDetails.age}
                </p>
                <p style={styles.detailItem}>
                  <strong>Email:</strong> {cvDetails.email}
                </p>
                <p style={styles.detailItem}>
                  <strong>Phone:</strong> {cvDetails.phone}
                </p>
                <p style={styles.detailItem}>
                  <strong>Reference:</strong> {cvDetails.reference}
                </p>
                <p style={styles.detailItem}>
                  <a
                    href={cvDetails.cv_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    View CV
                  </a>
                </p>
              </div>

              <div style={styles.qrContainer}>
                <QRCodeCanvas
                  ref={qrCodeRef}
                  value={getQRCodeData()}
                  size={200}
                  level={"H"}
                  includeMargin={true}
                />
                <p style={styles.qrDescription}>
                  Scan this QR code with your mobile device to instantly
                  transfer candidate details to the interview scheduling page
                </p>
              </div>

              <div style={styles.buttonContainer}>
                <button
                  style={{
                    ...styles.button,
                    ...(isLoading ? styles.buttonDisabled : {}),
                  }}
                  onMouseEnter={(e) =>
                    !isLoading &&
                    (e.target.style.backgroundColor =
                      styles.buttonHover.backgroundColor)
                  }
                  onMouseLeave={(e) =>
                    !isLoading &&
                    (e.target.style.backgroundColor =
                      styles.button.backgroundColor)
                  }
                  onClick={generateQRCode}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Attach to CV"}
                </button>

                <button
                  style={{
                    ...styles.button,
                    ...(isLoading ? styles.buttonDisabled : {}),
                  }}
                  onMouseEnter={(e) =>
                    !isLoading &&
                    (e.target.style.backgroundColor =
                      styles.buttonHover.backgroundColor)
                  }
                  onMouseLeave={(e) =>
                    !isLoading &&
                    (e.target.style.backgroundColor =
                      styles.button.backgroundColor)
                  }
                  onClick={handleSelectForInterview}
                  disabled={isLoading}
                >
                  Selected for Interview
                </button>
              </div>
            </div>
          ) : (
            <p>Loading CV details...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVDetail;
