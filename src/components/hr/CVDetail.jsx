import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { motion } from "framer-motion";
import Sidebars from "./sidebars";
import { getCVById, hrmsApi } from "../../api/employeeApi";
import {
  User,
  FileText,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Users,
  Download,
  Printer,
  ArrowLeft,
  ExternalLink,
  QrCode,
  CheckCircle,
  Clock,
  Hash,
  Info,
  Eye,
  FileDown,
} from "lucide-react";

const CVDetail = () => {
  const { id } = useParams();
  const [cvDetails, setCvDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const qrCodeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCVDetails = async () => {
      try {
        setLoading(true);
        const response = await getCVById(id);
        setCvDetails(response.data);
      } catch (error) {
        console.error("Error fetching CV details:", error);
        alert("Failed to load CV details");
      } finally {
        setLoading(false);
      }
    };

    fetchCVDetails();
  }, [id]);

  const getQRCodeData = () => {
    if (!cvDetails) return "";

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

      const qrCanvas = qrCodeRef.current;
      const qrCodeImage = qrCanvas.toDataURL("image/png");

      const formData = new FormData();
      formData.append("qr_code", qrCodeImage);

      const response = await hrmsApi.post(
        `cvs/${id}/update-cv-with-qr/`,
        formData,
        {
          responseType: "blob",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        },
      );

      if (!response.headers["content-type"].includes("pdf")) {
        const errorText = await response.data.text();
        throw new Error(errorText || "Server returned non-PDF response");
      }

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

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

  if (loading) {
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
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          
          maxHeight: "calc(100vh - 20px)",
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
                background: "linear-gradient(135deg, #0078D4 0%, #006DAA 100%)",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0, 120, 212, 0.3)",
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
                Candidate Details
              </h2>
              <p
                style={{
                  color: "#6B7280",
                  fontSize: "14px",
                  margin: 0,
                }}
              >
                View and manage candidate information and documents
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
                background: "#E0F2FE",
                border: "1px solid #BAE6FD",
                borderRadius: "10px",
                fontSize: "14px",
              }}
            >
              <div style={{ color: "#0284C7" }}>
                <Hash size={14} />
              </div>
              <div>
                <span style={{ fontWeight: "500", color: "#374151" }}>
                  {cvDetails?.id || "N/A"}
                </span>
                <span style={{ color: "#6B7280", marginLeft: "4px" }}>
                  Candidate ID
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: "10px",
                fontSize: "14px",
              }}
            >
              <div style={{ color: "#10B981" }}>
                <Briefcase size={14} />
              </div>
              <div>
                <span style={{ fontWeight: "500", color: "#374151" }}>
                  Applied
                </span>
                <span style={{ color: "#6B7280", marginLeft: "4px" }}>
                  for Position
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: "10px",
                fontSize: "14px",
              }}
            >
              <div style={{ color: "#F59E0B" }}>
                <Clock size={14} />
              </div>
              <div>
                <span style={{ fontWeight: "500", color: "#374151" }}>
                  Status
                </span>
                <span style={{ color: "#6B7280", marginLeft: "4px" }}>
                  Under Review
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          {/* Left Column: Candidate Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid rgba(229, 231, 235, 0.5)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
                paddingBottom: "16px",
                borderBottom: "1px solid #F3F4F6",
              }}
            >
              <div
                style={{
                  padding: "14px",
                  background:
                    "linear-gradient(135deg, #0078D4 0%, #006DAA 100%)",
                  borderRadius: "12px",
                }}
              >
                <User style={{ color: "white" }} size={24} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#111827",
                    margin: "0 0 4px 0",
                  }}
                >
                  {cvDetails?.name || "N/A"}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6B7280",
                    margin: 0,
                  }}
                >
                  Candidate Information
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "16px",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  background: "#F9FAFB",
                  borderRadius: "12px",
                  border: "1px solid #F3F4F6",
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
                  <Briefcase size={16} color="#6B7280" />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#6B7280",
                      fontWeight: "500",
                    }}
                  >
                    Position
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  {cvDetails?.position_for || "N/A"}
                </p>
              </div>

              <div
                style={{
                  padding: "16px",
                  background: "#F9FAFB",
                  borderRadius: "12px",
                  border: "1px solid #F3F4F6",
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
                  <Calendar size={16} color="#6B7280" />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#6B7280",
                      fontWeight: "500",
                    }}
                  >
                    Date of Birth
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  {cvDetails?.age || "N/A"}
                </p>
              </div>

              <div
                style={{
                  padding: "16px",
                  background: "#F9FAFB",
                  borderRadius: "12px",
                  border: "1px solid #F3F4F6",
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
                  <Mail size={16} color="#6B7280" />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#6B7280",
                      fontWeight: "500",
                    }}
                  >
                    Email
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  {cvDetails?.email || "N/A"}
                </p>
              </div>

              <div
                style={{
                  padding: "16px",
                  background: "#F9FAFB",
                  borderRadius: "12px",
                  border: "1px solid #F3F4F6",
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
                  <Phone size={16} color="#6B7280" />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#6B7280",
                      fontWeight: "500",
                    }}
                  >
                    Phone
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  {cvDetails?.phone || "N/A"}
                </p>
              </div>
            </div>

            {/* Reference Section */}
            <div style={{ marginTop: "24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <Users size={16} color="#4B5563" />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Reference
                </span>
              </div>
              <div
                style={{
                  padding: "16px",
                  background: "#F9FAFB",
                  borderRadius: "12px",
                  border: "1px solid #F3F4F6",
                  fontSize: "14px",
                  color: "#6B7280",
                }}
              >
                {cvDetails?.reference || "No reference provided"}
              </div>
            </div>

            {/* CV File Link */}
            <div style={{ marginTop: "24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <FileText size={16} color="#4B5563" />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  CV Document
                </span>
              </div>
              <a
                href={cvDetails?.cv_file}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  background:
                    "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(59, 130, 246, 0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 14px rgba(59, 130, 246, 0.4)";
                }}
              >
                <Eye size={16} />
                View CV Document
                <ExternalLink size={14} />
              </a>
            </div>
          </motion.div>

          {/* Right Column: QR Code and Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid rgba(229, 231, 235, 0.5)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "24px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid #F3F4F6",
                }}
              >
                <div
                  style={{
                    padding: "14px",
                    background:
                      "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    borderRadius: "12px",
                  }}
                >
                  <QrCode style={{ color: "white" }} size={24} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#111827",
                      margin: "0 0 4px 0",
                    }}
                  >
                    QR Code Access
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6B7280",
                      margin: 0,
                    }}
                  >
                    Quick access for interview scheduling
                  </p>
                </div>
              </div>

              {/* QR Code Display */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "32px",
                  background: "#F9FAFB",
                  borderRadius: "16px",
                  border: "1px solid #F3F4F6",
                  marginBottom: "24px",
                }}
              >
                <QRCodeCanvas
                  ref={qrCodeRef}
                  value={getQRCodeData()}
                  size={180}
                  level={"H"}
                  includeMargin={true}
                  style={{ borderRadius: "8px" }}
                />
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6B7280",
                    marginTop: "20px",
                    textAlign: "center",
                    maxWidth: "300px",
                    lineHeight: "1.5",
                  }}
                >
                  Scan this QR code to instantly transfer candidate details to
                  the interview scheduling page
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateQRCode}
                disabled={isLoading}
                style={{
                  padding: "16px",
                  background:
                    "linear-gradient(135deg, #0078D4 0%, #006DAA 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.2s ease",
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: "0 4px 14px rgba(0, 120, 212, 0.4)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, #006DAA 0%, #005ea6 100%)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(0, 120, 212, 0.6)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, #0078D4 0%, #006DAA 100%)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 14px rgba(0, 120, 212, 0.4)";
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileDown size={18} />
                    Attach QR Code to CV
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSelectForInterview}
                style={{
                  padding: "16px",
                  background: "white",
                  border: "1px solid #10B981",
                  color: "#10B981",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#10B981";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#10B981";
                }}
              >
                <CheckCircle size={18} />
                Select for Interview
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: "24px",
            background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
            color: "white",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  marginBottom: "4px",
                }}
              >
                Candidate Management
              </div>
              <div
                style={{
                  fontSize: "14px",
                  opacity: 0.8,
                }}
              >
                Use QR code for quick interview scheduling • Download documents
                for records
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                style={{
                  padding: "10px 20px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "10px",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.1)")
                }
              >
                Download Report
              </button>
              <button
                style={{
                  padding: "10px 20px",
                  background: "white",
                  color: "#1E293B",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#F1F5F9")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "white")
                }
              >
                <Printer size={16} />
                Print Summary
              </button>
            </div>
          </div>
          <div
            style={{
              fontSize: "12px",
              opacity: 0.6,
              textAlign: "center",
              paddingTop: "16px",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            Last updated: {new Date().toLocaleTimeString()} • ID:{" "}
            {cvDetails?.id || "N/A"}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CVDetail;
