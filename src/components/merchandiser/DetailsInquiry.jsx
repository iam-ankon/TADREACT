import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../merchandiser/Sidebar.jsx";

const DetailsInquiry = () => {
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [fromEmail, setFromEmail] = useState("");

  // Text editor state
  const [editorState, setEditorState] = useState({
    bold: false,
    italic: false,
    underline: false,
    fontSize: "14px",
    fontFamily: "Arial",
    align: "left",
    color: "#000000",
    backgroundColor: "#ffffff",
  });

  // CSRF helper function
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  useEffect(() => {
    const fetchInquiry = async () => {
      try {
        console.log(`Fetching inquiry for ID: ${id}`);
        const response = await axios.get(
          `http://119.148.51.38:8000/api/merchandiser/api/inquiry/${id}/`
        );
        console.log("Inquiry API Response:", response.data);
        setInquiry(response.data);
        setLoading(false);
        setFromEmail("");
      } catch (error) {
        console.error("Error fetching inquiry:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        setLoading(false);
      }
    };

    fetchInquiry();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to format supplier names
  const getSupplierNames = () => {
    if (
      !inquiry?.suppliers ||
      !Array.isArray(inquiry.suppliers) ||
      inquiry.suppliers.length === 0
    ) {
      return "No supplier assigned";
    }
    return inquiry.suppliers.map((supplier) => supplier.name).join(", ");
  };

  // Helper function to format prices
  const formatPrice = (price) => {
    if (!price || price === "-" || price === "Not quoted") return "-";
    try {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice)) return "-";
      return `$${numPrice.toFixed(2)}`;
    } catch {
      return "-";
    }
  };

  const defaultMessage = `Dear ${getSupplierNames()},

We are pleased to invite you to review the following inquiry. Please find the details below and provide your quotation at your earliest convenience.

We look forward to receiving your competitive pricing and availability.

Best regards,
Procurement Team`;

  const toggleFormat = (format) => {
    setEditorState((prev) => ({
      ...prev,
      [format]: !prev[format],
    }));
  };

  const handleFontSizeChange = (size) => {
    setEditorState((prev) => ({
      ...prev,
      fontSize: size,
    }));
  };

  const handleFontFamilyChange = (font) => {
    setEditorState((prev) => ({
      ...prev,
      fontFamily: font,
    }));
  };

  const handleAlignment = (align) => {
    setEditorState((prev) => ({
      ...prev,
      align,
    }));
  };

  const handleColorChange = (color) => {
    setEditorState((prev) => ({
      ...prev,
      color,
    }));
  };

  const handleBackgroundColorChange = (color) => {
    setEditorState((prev) => ({
      ...prev,
      backgroundColor: color,
    }));
  };

  const applyFormatting = (text) => {
    let formattedText = text;
    if (editorState.bold) {
      formattedText = `<strong>${formattedText}</strong>`;
    }
    if (editorState.italic) {
      formattedText = `<em>${formattedText}</em>`;
    }
    if (editorState.underline) {
      formattedText = `<u>${formattedText}</u>`;
    }
    return `<span style="font-family: ${editorState.fontFamily}; font-size: ${editorState.fontSize}; color: ${editorState.color}; background-color: ${editorState.backgroundColor}; text-align: ${editorState.align};">${formattedText}</span>`;
  };

  const handleOpenEmailModal = () => {
    if (!inquiry?.suppliers || inquiry.suppliers.length === 0) {
      setEmailStatus("No supplier assigned to this inquiry");
      return;
    }
    setCustomMessage("");
    setEmailStatus("");
    setShowEmailModal(true);
  };

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setCustomMessage("");
    setEmailStatus("");
    setSendingEmail(false);
    setEditorState({
      bold: false,
      italic: false,
      underline: false,
      fontSize: "14px",
      fontFamily: "Arial",
      align: "left",
      color: "#000000",
      backgroundColor: "#ffffff",
    });
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendEmail = async () => {
    if (!inquiry) {
      setEmailStatus("error");
      setEmailMessage("Inquiry data not loaded");
      return;
    }

    // Get supplier emails from the suppliers array
    const supplierEmails =
      inquiry.suppliers && Array.isArray(inquiry.suppliers)
        ? inquiry.suppliers
            .map((supplier) => supplier.email)
            .filter((email) => email)
        : [];

    if (!supplierEmails.length) {
      setEmailStatus("error");
      setEmailMessage("No valid supplier email found for this inquiry");
      return;
    }

    if (!fromEmail) {
      setEmailStatus("error");
      setEmailMessage('Please enter a "From" email address');
      return;
    }

    if (!isValidEmail(fromEmail)) {
      setEmailStatus("error");
      setEmailMessage('Please enter a valid "From" email address');
      return;
    }

    setSendingEmail(true);
    setEmailStatus("Sending email...");

    try {
      const messageToSend = customMessage.trim() || defaultMessage;

      const payload = {
        from_email: fromEmail,
        custom_message: messageToSend,
      };

      const response = await axios.post(
        `http://119.148.51.38:8000/api/merchandiser/api/inquiries/${id}/send-email/`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setEmailStatus("success");
        setEmailMessage(
          `Email sent successfully to ${supplierEmails.join(", ")}`
        );
        setTimeout(() => {
          setShowEmailModal(false);
          setCustomMessage("");
          setEmailStatus("");
        }, 3000);
      } else {
        setEmailStatus("error");
        setEmailMessage(response.data.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailStatus("error");

      if (error.response?.status === 403) {
        setEmailMessage(
          "Authentication error. Please refresh the page and try again."
        );
      } else if (error.response?.data?.message) {
        setEmailMessage(error.response.data.message);
      } else {
        setEmailMessage("Error sending email. Please try again.");
      }
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          fontSize: "18px",
          color: "#555",
        }}
      >
        Loading inquiry details...
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          fontSize: "18px",
          color: "#888",
        }}
      >
        Inquiry not found.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebar />

      {showEmailModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "30px",
              width: "90%",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: "1px solid #e0e0e0",
                paddingBottom: "15px",
              }}
            >
              <h2 style={{ margin: 0, color: "#2c3e50", fontSize: "20px" }}>
                Send Inquiry to Supplier
              </h2>
              <button
                onClick={handleCloseEmailModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                  padding: "5px",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                From Email:
              </label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="Enter your email address"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: `1px solid ${
                    fromEmail && !isValidEmail(fromEmail) ? "#dc3545" : "#ddd"
                  }`,
                  borderRadius: "4px",
                  fontSize: "14px",
                  backgroundColor: "white",
                }}
              />
              {fromEmail && !isValidEmail(fromEmail) && (
                <div
                  style={{
                    color: "#dc3545",
                    fontSize: "12px",
                    marginTop: "5px",
                  }}
                >
                  Please enter a valid email address
                </div>
              )}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ margin: "0 0 10px 0", color: "#555" }}>
                <strong>To:</strong> {getSupplierNames()}
              </p>
              <p style={{ margin: "0 0 15px 0", color: "#555" }}>
                <strong>Inquiry:</strong> #{inquiry.inquiry_no} -{" "}
                {inquiry.item?.item}
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#f5f5f5",
                border: "1px solid #ddd",
                borderBottom: "none",
                padding: "10px",
                borderRadius: "4px 4px 0 0",
                display: "flex",
                flexWrap: "wrap",
                gap: "5px",
                alignItems: "center",
              }}
            >
              <select
                value={editorState.fontFamily}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                style={{
                  padding: "5px",
                  border: "1px solid #ccc",
                  borderRadius: "3px",
                  fontSize: "12px",
                }}
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>

              <select
                value={editorState.fontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                style={{
                  padding: "5px",
                  border: "1px solid #ccc",
                  borderRadius: "3px",
                  fontSize: "12px",
                }}
              >
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
              </select>

              <button
                onClick={() => toggleFormat("bold")}
                style={{
                  padding: "5px 10px",
                  border: "1px solid #ccc",
                  borderRadius: "3px",
                  backgroundColor: editorState.bold ? "#007bff" : "white",
                  color: editorState.bold ? "white" : "black",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
                title="Bold"
              >
                B
              </button>

              <button
                onClick={() => toggleFormat("italic")}
                style={{
                  padding: "5px 10px",
                  border: "1px solid #ccc",
                  borderRadius: "3px",
                  backgroundColor: editorState.italic ? "#007bff" : "white",
                  color: editorState.italic ? "white" : "black",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontStyle: "italic",
                }}
                title="Italic"
              >
                I
              </button>

              <button
                onClick={() => toggleFormat("underline")}
                style={{
                  padding: "5px 10px",
                  border: "1px solid #ccc",
                  borderRadius: "3px",
                  backgroundColor: editorState.underline ? "#007bff" : "white",
                  color: editorState.underline ? "white" : "black",
                  cursor: "pointer",
                  fontSize: "14px",
                  textDecoration: "underline",
                }}
                title="Underline"
              >
                U
              </button>

              <button
                onClick={() => handleAlignment("left")}
                style={{
                  padding: "5px 10px",
                  border: "1px solid #ccc",
                  borderRadius: "3px",
                  backgroundColor:
                    editorState.align === "left" ? "#007bff" : "white",
                  color: editorState.align === "left" ? "white" : "black",
                  cursor: "pointer",
                }}
                title="Align Left"
              >
                ⬅
              </button>

              <button
                onClick={() => handleAlignment("center")}
                style={{
                  padding: "5px 10px",
                  border: "1px solid #ccc",
                  borderRadius: "3px",
                  backgroundColor:
                    editorState.align === "center" ? "#007bff" : "white",
                  color: editorState.align === "center" ? "white" : "black",
                  cursor: "pointer",
                }}
                title="Align Center"
              >
                ⬤
              </button>

              <button
                onClick={() => handleAlignment("right")}
                style={{
                  padding: "5px 10px",
                  border: "1px solid #ccc",
                  borderRadius: "3px",
                  backgroundColor:
                    editorState.align === "right" ? "#007bff" : "white",
                  color: editorState.align === "right" ? "white" : "black",
                  cursor: "pointer",
                }}
                title="Align Right"
              >
                ➡
              </button>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                Text:
                <input
                  type="color"
                  value={editorState.color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  style={{
                    width: "30px",
                    height: "25px",
                    border: "1px solid #ccc",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                }}
              >
                BG:
                <input
                  type="color"
                  value={editorState.backgroundColor}
                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                  style={{
                    width: "30px",
                    height: "25px",
                    border: "1px solid #ccc",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                Your Message to Supplier:
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={defaultMessage}
                style={{
                  width: "100%",
                  height: "250px",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "0 0 4px 4px",
                  fontSize: editorState.fontSize,
                  fontFamily: editorState.fontFamily,
                  lineHeight: "1.5",
                  resize: "vertical",
                  backgroundColor: customMessage
                    ? editorState.backgroundColor
                    : "#f9f9f9",
                  color: editorState.color,
                  textAlign: editorState.align,
                  fontWeight: editorState.bold ? "bold" : "normal",
                  fontStyle: editorState.italic ? "italic" : "normal",
                  textDecoration: editorState.underline ? "underline" : "none",
                }}
              />
              <div
                style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}
              >
                {customMessage
                  ? "Custom message will be sent to supplier."
                  : "Default message will be sent if left empty. All inquiry details and attachments will be included."}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "15px",
                borderRadius: "4px",
                marginBottom: "20px",
                border: "1px solid #e9ecef",
              }}
            >
              <h4
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "14px",
                  color: "#495057",
                }}
              >
                What will be included in the email:
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "20px",
                  fontSize: "12px",
                  color: "#6c757d",
                  lineHeight: "1.4",
                }}
              >
                <li>Your message above</li>
                <li>All attached images and documents</li>
                <li>Technical specifications and requirements</li>
                <li>Sent from: {fromEmail || "Your email address"}</li>
              </ul>
            </div>

            {emailStatus === "success" && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#d4edda",
                  color: "#155724",
                  borderRadius: "4px",
                  marginBottom: "15px",
                  border: "1px solid #c3e6cb",
                }}
              >
                ✓ {emailMessage}
              </div>
            )}

            {emailStatus === "error" && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#f8d7da",
                  color: "#721c24",
                  borderRadius: "4px",
                  marginBottom: "15px",
                  border: "1px solid #f5c6cb",
                }}
              >
                ✗ {emailMessage}
              </div>
            )}

            {emailStatus === "Sending email..." && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#cce7ff",
                  color: "#004085",
                  borderRadius: "4px",
                  marginBottom: "15px",
                  border: "1px solid #b3d7ff",
                }}
              >
                ⏳ {emailStatus}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={handleCloseEmailModal}
                disabled={sendingEmail}
                style={{
                  padding: "10px 20px",
                  border: "1px solid #6c757d",
                  backgroundColor: "white",
                  color: "#6c757d",
                  borderRadius: "4px",
                  cursor: sendingEmail ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  opacity: sendingEmail ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={
                  sendingEmail || !fromEmail || !isValidEmail(fromEmail)
                }
                style={{
                  padding: "10px 20px",
                  border: "none",
                  backgroundColor:
                    sendingEmail || !fromEmail || !isValidEmail(fromEmail)
                      ? "#6c757d"
                      : "#007bff",
                  color: "white",
                  borderRadius: "4px",
                  cursor:
                    sendingEmail || !fromEmail || !isValidEmail(fromEmail)
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "14px",
                  opacity:
                    sendingEmail || !fromEmail || !isValidEmail(fromEmail)
                      ? 0.6
                      : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {sendingEmail ? (
                  <>
                    <span>⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <span>📧</span>
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          flex: 1,
          padding: "2rem",
          marginLeft: "0",
          overflowY: "auto",
          maxHeight: "100vh",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1
              style={{
                color: "#2c3e50",
                fontSize: "28px",
                fontWeight: "600",
                margin: "0 0 10px 0",
              }}
            >
              Inquiry #{inquiry.inquiry_no}
            </h1>
            <div
              style={{
                display: "inline-block",
                padding: "5px 15px",
                borderRadius: "15px",
                backgroundColor:
                  inquiry.current_status === "pending"
                    ? "#ffc107"
                    : inquiry.current_status === "quoted"
                    ? "#17a2b8"
                    : inquiry.current_status === "running"
                    ? "#28a745"
                    : "#6c757d",
                color:
                  inquiry.current_status === "pending" ? "#343a40" : "white",
                fontSize: "0.9em",
                fontWeight: "bold",
                textTransform: "capitalize",
              }}
            >
              {inquiry.current_status}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleOpenEmailModal}
                disabled={!inquiry?.suppliers || inquiry.suppliers.length === 0}
                style={{
                  backgroundColor:
                    inquiry?.suppliers && inquiry.suppliers.length > 0
                      ? "#007bff"
                      : "#6c757d",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "none",
                  cursor:
                    inquiry?.suppliers && inquiry.suppliers.length > 0
                      ? "pointer"
                      : "not-allowed",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  if (inquiry?.suppliers && inquiry.suppliers.length > 0) {
                    e.target.style.backgroundColor = "#0056b3";
                    e.target.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseOut={(e) => {
                  if (inquiry?.suppliers && inquiry.suppliers.length > 0) {
                    e.target.style.backgroundColor = "#007bff";
                    e.target.style.transform = "translateY(0)";
                  }
                }}
              >
                <span>📧</span>
                Send to Supplier
              </button>

              <Link
                to={`/inquiries/${id}/edit`}
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#218838";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#28a745";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                <span>✏️</span>
                Edit Inquiry
              </Link>
              <Link
                to="/inquiries"
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#545b62";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#6c757d";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                <span>←</span>
                Back to List
              </Link>
            </div>

            {emailMessage && !showEmailModal && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  backgroundColor: emailMessage.includes("successfully")
                    ? "#d4edda"
                    : "#f8d7da",
                  color: emailMessage.includes("successfully")
                    ? "#155724"
                    : "#721c24",
                  fontSize: "12px",
                  marginTop: "5px",
                }}
              >
                {emailMessage}
              </div>
            )}

            {!inquiry?.suppliers ||
              (inquiry.suppliers.length === 0 && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    backgroundColor: "#fff3cd",
                    color: "#856404",
                    fontSize: "12px",
                    marginTop: "5px",
                  }}
                >
                  No supplier assigned. Please assign a supplier to send email.
                </div>
              ))}
          </div>
        </div>

        {inquiry?.suppliers && inquiry.suppliers.length > 0 && (
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              padding: "15px",
              marginBottom: "20px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                paddingBottom: "8px",
                borderBottom: "1px solid #eee",
                fontSize: "16px",
                color: "#333",
                fontWeight: "600",
              }}
            >
              Supplier Quotations
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "15px",
                maxHeight: "200px", // Fixed height for scrolling
                overflowY: "auto", // Enable vertical scrolling
                paddingRight: "5px", // Add some padding for scrollbar
              }}
            >
              {inquiry.suppliers.map((supplier, index) => {
                // Find the price for this supplier from supplier_prices array
                const supplierPrice = inquiry.supplier_prices?.find(
                  (sp) =>
                    sp.supplier === supplier.id ||
                    sp.supplier_id === supplier.id
                );

                const price =
                  supplierPrice?.price || supplierPrice?.supplier_price;
                const hasPrice =
                  price &&
                  price !== null &&
                  price !== undefined &&
                  price !== "";

                return (
                  <div
                    key={index}
                    style={{
                      padding: "15px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "10px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: "600",
                            fontSize: "14px",
                            color: "#2c3e50",
                          }}
                        >
                          {supplier.name}
                        </div>
                        {supplier.email && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginTop: "2px",
                            }}
                          >
                            {supplier.email}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          padding: "4px 8px",
                          backgroundColor: hasPrice ? "#d4edda" : "#fff3cd",
                          color: hasPrice ? "#155724" : "#856404",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        {hasPrice ? "QUOTED" : "PENDING"}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px",
                        backgroundColor: "white",
                        borderRadius: "4px",
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#555",
                        }}
                      >
                        Quoted Price:
                      </span>
                      <span
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: hasPrice ? "#28a745" : "#dc3545",
                        }}
                      >
                        {formatPrice(price) || "Not Quoted"}
                      </span>
                    </div>

                    {/* Additional supplier information */}
                    {supplier.contact_person && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: "8px",
                        }}
                      >
                        <strong>Contact:</strong> {supplier.contact_person}
                      </div>
                    )}
                    {supplier.phone && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: "2px",
                        }}
                      >
                        <strong>Phone:</strong> {supplier.phone}
                      </div>
                    )}

                    {/* Debug information - remove in production */}
                    {process.env.NODE_ENV === "development" && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#999",
                          marginTop: "8px",
                          padding: "4px",
                          backgroundColor: "#f0f0f0",
                          borderRadius: "2px",
                        }}
                      >
                        Supplier ID: {supplier.id}
                        <br />
                        Found in supplier_prices: {supplierPrice ? "Yes" : "No"}
                        <br />
                        Price value: {price}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div
            style={{
              flex: 1,
              backgroundColor: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              padding: "15px",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                paddingBottom: "8px",
                borderBottom: "1px solid #eee",
                fontSize: "16px",
                color: "#333",
                fontWeight: "600",
              }}
            >
              Inquiry Information
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      width: "20%",
                      fontWeight: "600",
                    }}
                  >
                    Buyer
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      width: "30%",
                    }}
                  >
                    {typeof inquiry.buyer === "object"
                      ? inquiry.buyer?.name
                      : inquiry.buyer?.toString() || "-"}
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      width: "20%",
                      fontWeight: "600",
                    }}
                  >
                    Customer
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      width: "30%",
                    }}
                  >
                    {typeof inquiry.customer === "object"
                      ? inquiry.customer?.name
                      : inquiry.customer?.toString() || "-"}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Supplier
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                    colSpan="3"
                  >
                    {getSupplierNames()}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Year
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {inquiry.year || "-"}
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Order Type
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {inquiry.order_type || "-"}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Garment Type
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {inquiry.garment || "-"}
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Gender
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {inquiry.gender || "-"}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Season
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {inquiry.season || "-"}
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Program
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {inquiry.program || "-"}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    WGR
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {inquiry.wgr || "-"}
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Target Price
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {formatPrice(inquiry.target_price)}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Confirmed Price
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {formatPrice(inquiry.confirmed_price)}
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Offer Price
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {formatPrice(inquiry.offer_price)}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Style Name
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {inquiry.same_style?.styles || "-"}
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Item
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {inquiry.item?.item || "-"}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Order Request
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {inquiry.order_no || "-"}
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Order Quantity
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {inquiry.order_quantity || "-"}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Received Date
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {formatDate(inquiry.received_date)}
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Shipment Date
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {formatDate(inquiry.shipment_date)}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Repeat Of
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {inquiry.repeat_of?.repeat_of || "-"}
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontWeight: "600",
                    }}
                  >
                    Confirmed Price Date
                  </td>
                  <td
                    style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {formatDate(inquiry.confirmed_price_date)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            style={{
              width: "250px",
              backgroundColor: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              padding: "15px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                paddingBottom: "8px",
                borderBottom: "1px solid #eee",
                fontSize: "16px",
                color: "#333",
                fontWeight: "600",
              }}
            >
              Documents
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              {inquiry.image && (
                <a
                  href={inquiry.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        marginBottom: "5px",
                        color: "#555",
                      }}
                    >
                      Image
                    </div>
                    <img
                      src={inquiry.image}
                      alt="Inquiry"
                      style={{
                        width: "100%",
                        height: "100px",
                        objectFit: "contain",
                        border: "1px solid #eee",
                        backgroundColor: "#f9f9f9",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                </a>
              )}
              {inquiry.image1 && (
                <a
                  href={inquiry.image1}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        marginBottom: "5px",
                        color: "#555",
                      }}
                    >
                      Image 1
                    </div>
                    <img
                      src={inquiry.image1}
                      alt="Inquiry"
                      style={{
                        width: "100%",
                        height: "100px",
                        objectFit: "contain",
                        border: "1px solid #eee",
                        backgroundColor: "#f9f9f9",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                </a>
              )}
              {inquiry.techpack && (
                <a
                  href={inquiry.techpack}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        marginBottom: "5px",
                        color: "#555",
                      }}
                    >
                      Tech Pack
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "100px",
                        backgroundColor: "#f8f9fa",
                        border: "1px solid #dee2e6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "#6c757d" }}>
                        📋 Tech Pack Document
                      </span>
                    </div>
                  </div>
                </a>
              )}
              {inquiry.sheet && (
                <a
                  href={inquiry.sheet}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        marginBottom: "5px",
                        color: "#555",
                      }}
                    >
                      Sheet
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "100px",
                        backgroundColor: "#f8f9fa",
                        border: "1px solid #dee2e6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "#6c757d" }}>
                        📊 Sheet Document
                      </span>
                    </div>
                  </div>
                </a>
              )}
              {inquiry.attachment && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      marginBottom: "5px",
                      color: "#555",
                    }}
                  >
                    Attachment
                  </div>
                  <a
                    href={inquiry.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      padding: "8px",
                      backgroundColor: "#f0f0f0",
                      borderRadius: "4px",
                      textAlign: "center",
                      color: "#007bff",
                      textDecoration: "none",
                      fontSize: "12px",
                    }}
                  >
                    Download Attachment
                  </a>
                </div>
              )}
              {!inquiry.image &&
                !inquiry.image1 &&
                !inquiry.techpack &&
                !inquiry.sheet &&
                !inquiry.attachment && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#6c757d",
                      fontSize: "14px",
                      padding: "20px",
                    }}
                  >
                    No documents attached
                  </div>
                )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div
            style={{
              flex: 1,
              backgroundColor: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              padding: "15px",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                paddingBottom: "8px",
                borderBottom: "1px solid #eee",
                fontSize: "16px",
                color: "#333",
                fontWeight: "600",
              }}
            >
              Fabric Information
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <p style={{ margin: "8px 0", fontSize: "14px" }}>
                <strong>Fabrication:</strong>{" "}
                {inquiry.fabrication?.fabrication || "-"}
              </p>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              backgroundColor: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              padding: "15px",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                paddingBottom: "8px",
                borderBottom: "1px solid #eee",
                fontSize: "16px",
                color: "#333",
                fontWeight: "600",
              }}
            >
              Color & Sizing
            </h3>
            {inquiry.color_size_groups &&
            inquiry.color_size_groups.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <th
                        style={{
                          padding: "8px",
                          textAlign: "left",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        Color
                      </th>
                      {inquiry.color_size_groups[0]?.size_quantities?.map(
                        (size, index) => (
                          <th
                            key={index}
                            style={{
                              padding: "8px",
                              textAlign: "center",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {size.size}
                          </th>
                        )
                      )}
                      <th
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiry.color_size_groups.map((group, groupIndex) => (
                      <tr key={groupIndex}>
                        <td
                          style={{
                            padding: "8px",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          {group.color || "-"}
                        </td>
                        {group.size_quantities.map((size, sizeIndex) => (
                          <td
                            key={sizeIndex}
                            style={{
                              padding: "8px",
                              textAlign: "center",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {size.quantity}
                          </td>
                        ))}
                        <td
                          style={{
                            padding: "8px",
                            textAlign: "center",
                            borderBottom: "1px solid #eee",
                            fontWeight: "600",
                          }}
                        >
                          {group.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p
                style={{ textAlign: "center", color: "#888", fontSize: "14px" }}
              >
                No color/size information available
              </p>
            )}
            <div
              style={{
                textAlign: "right",
                marginTop: "10px",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Grand Total: {inquiry.grand_total || 0}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e0e0e0",
            borderRadius: "6px",
            padding: "15px",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              margin: "0 0 15px 0",
              paddingBottom: "8px",
              borderBottom: "1px solid #eee",
              fontSize: "16px",
              color: "#333",
              fontWeight: "600",
            }}
          >
            Remarks
          </h3>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: "15px" }}
          >
            <div>
              <h4
                style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#555" }}
              >
                General Remarks
              </h4>
              <div
                style={{
                  backgroundColor: "#f9f9f9",
                  padding: "10px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                {inquiry.remarks || "No general remarks provided."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsInquiry;
