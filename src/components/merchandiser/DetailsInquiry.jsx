import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../merchandiser/Sidebar.jsx";

const DetailsInquiry = () => {
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [fromEmail, setFromEmail] = useState("");

  const statusColors = {
    pending: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
    quoted: { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
    confirmed: { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
    running: { bg: "#e0e7ff", text: "#3730a3", border: "#c7d2fe" },
    default: { bg: "#f3f4f6", text: "#374151", border: "#e5e7eb" },
  };

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
          `http://119.148.51.38:8000/api/merchandiser/api/inquiry/${id}/`,
        );
        console.log("Inquiry API Response:", response.data);
        console.log(
          "Multiple Attachments:",
          response.data.multiple_attachments,
        );
        console.log("Multiple Images:", response.data.multiple_images);
        console.log("Suppliers:", response.data.suppliers);
        console.log("Customer:", response.data.customer);
        console.log("Buyer:", response.data.buyer);
        // ========== NEW: Log department ==========
        console.log("Department:", response.data.department);
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
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const getCustomerName = () => {
    if (!inquiry?.customer) return "-";
    const customer = inquiry.customer;
    // Try different possible name fields
    return (
      customer.customer_name ||
      customer.name?.customer_name ||
      customer.name?.name ||
      customer.hrms_customer_name ||
      customer.display_name ||
      `Customer ${customer.id}`
    );
  };

  const getBuyerName = () => {
    if (!inquiry?.buyer) return "-";
    const buyer = inquiry.buyer;
    return buyer.name || `Buyer ${buyer.id}`;
  };

  // ========== NEW: Get department name ==========
  const getDepartmentName = () => {
    if (!inquiry?.department) return "-";
    const dept = inquiry.department;
    // Try different possible name fields
    if (typeof dept === "object") {
      return dept.name || dept.department || dept.department_display || `Department ${dept.id}`;
    }
    return dept;
  };

  const getSupplierNames = () => {
    if (!inquiry?.suppliers || inquiry.suppliers.length === 0) {
      return "No supplier assigned";
    }
    return inquiry.suppliers
      .map((supplier) => supplier.name || supplier.supplier_name)
      .join(", ");
  };

  const getSupplierList = () => {
    if (!inquiry?.suppliers || inquiry.suppliers.length === 0) {
      return [];
    }
    return inquiry.suppliers;
  };

  const formatPrice = (price) => {
    if (!price || price === "-" || price === "Not quoted") return "-";
    try {
      const numPrice = typeof price === "string" ? parseFloat(price) : price;
      if (isNaN(numPrice)) return "-";
      return `$${numPrice.toFixed(2)}`;
    } catch {
      return "-";
    }
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    if (typeof filePath === "string") {
      if (filePath.startsWith("http")) {
        return filePath;
      }
      let cleanPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
      return `http://119.148.51.38:8000${cleanPath}`;
    }
    return null;
  };

  const getTotalValue = () => {
    if (!inquiry) return "-";
    const value = inquiry.value;
    if (!value && value !== 0) return "-";
    try {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(numValue)) return "-";
      return `$${numValue.toFixed(2)}`;
    } catch {
      return "-";
    }
  };

  const defaultMessage = `Dear ${getSupplierNames()},

We are pleased to invite you to review the following inquiry. Please find the details below and provide your quotation at your earliest convenience.

We look forward to receiving your competitive pricing and availability.

Best regards,
Procurement Team`;

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleOpenEmailModal = () => {
    if (!inquiry?.suppliers || inquiry.suppliers.length === 0) {
      setEmailStatus("error");
      setEmailMessage("No supplier assigned to this inquiry");
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
  };

  const handleSendEmail = async () => {
    if (!inquiry) {
      setEmailStatus("error");
      setEmailMessage("Inquiry data not loaded");
      return;
    }

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
        },
      );

      if (response.data.success) {
        setEmailStatus("success");
        setEmailMessage(
          `Email sent successfully to ${supplierEmails.join(", ")}`,
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
          "Authentication error. Please refresh the page and try again.",
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

  // Render multiple attachments
  const renderMultipleAttachments = () => {
    const attachments = inquiry?.multiple_attachments || [];
    if (attachments.length === 0) return null;

    return (
      <div style={styles.documentsCard}>
        <div style={styles.documentsCardHeader}>
          <span style={styles.documentsCardIcon}>📎</span>
          <h3 style={styles.documentsCardTitle}>
            Attachments ({attachments.length})
          </h3>
        </div>
        <div style={styles.attachmentList}>
          {attachments.map((filePath, index) => {
            const fileName = filePath.split("/").pop();
            const fileUrl = getFileUrl(filePath);
            return (
              <div key={index} style={styles.attachmentItem}>
                <div style={styles.attachmentIcon}>📄</div>
                <div style={styles.attachmentInfo}>
                  <div style={styles.attachmentName}>{fileName}</div>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.attachmentLink}
                  >
                    Download →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render multiple images gallery
  const renderMultipleImages = () => {
    const images = inquiry?.multiple_images || [];
    if (images.length === 0) return null;

    return (
      <div style={styles.documentsCard}>
        <div style={styles.documentsCardHeader}>
          <span style={styles.documentsCardIcon}>🖼️</span>
          <h3 style={styles.documentsCardTitle}>Images ({images.length})</h3>
        </div>
        <div style={styles.imageGalleryGrid}>
          {images.map((filePath, index) => {
            const fileName = filePath.split("/").pop();
            const imageUrl = getFileUrl(filePath);
            return (
              <div key={index} style={styles.galleryImageItem}>
                <img
                  src={imageUrl}
                  alt={fileName}
                  style={styles.galleryImage}
                  onError={(e) => {
                    e.target.src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                    e.target.style.objectFit = "contain";
                  }}
                />
                <div style={styles.galleryImageOverlay}>
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.galleryImageLink}
                  >
                    🔍
                  </a>
                </div>
                <div style={styles.galleryImageName}>
                  {fileName.length > 20
                    ? fileName.substring(0, 20) + "..."
                    : fileName}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "inquiry", label: "Inquiry Details" },
    { id: "suppliers", label: "Suppliers & Quotes" },
    { id: "color-size", label: "Color & Size" },
    { id: "development-sample", label: "Development" },
    { id: "documents", label: "Documents" },
  ];

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <div style={styles.loadingText}>Loading inquiry details...</div>
        </div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.notFoundContainer}>
          <div style={styles.notFoundIcon}>🔍</div>
          <div style={styles.notFoundText}>Inquiry not found</div>
          <Link to="/inquiries" style={styles.backButton}>
            ← Back to Inquiries
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = inquiry.current_status || "pending";
  const statusStyle = statusColors[currentStatus] || statusColors.default;

  return (
    <div style={styles.container}>
      <Sidebar />

      <div style={styles.mainContent}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div style={styles.headerLeft}>
              <Link to="/inquiries" style={styles.backLink}>
                ← Back to Inquiries
              </Link>
              <div style={styles.titleSection}>
                <h1 style={styles.title}>
                  Inquiry #{inquiry.inquiry_no || inquiry.id}
                </h1>
                <div
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.text,
                    borderColor: statusStyle.border,
                  }}
                >
                  {currentStatus.toUpperCase()}
                </div>
              </div>
            </div>
            <div style={styles.headerActions}>
              <button
                onClick={handleOpenEmailModal}
                disabled={!inquiry?.suppliers || inquiry.suppliers.length === 0}
                style={{
                  ...styles.actionButton,
                  ...styles.emailButton,
                  opacity:
                    !inquiry?.suppliers || inquiry.suppliers.length === 0
                      ? 0.5
                      : 1,
                  cursor:
                    !inquiry?.suppliers || inquiry.suppliers.length === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                📧 Send to Supplier
              </button>
              <Link to={`/inquiries/${id}/edit`} style={styles.actionButton}>
                ✏️ Edit Inquiry
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tabButton,
                ...(activeTab === tab.id ? styles.tabButtonActive : {}),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div style={styles.overviewTab}>
              {/* Stats Cards */}
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}>💰</div>
                  <div style={styles.statInfo}>
                    <div style={styles.statValue}>
                      {formatPrice(inquiry.target_price)}
                    </div>
                    <div style={styles.statLabel}>Target Price</div>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}>🏷️</div>
                  <div style={styles.statInfo}>
                    <div style={styles.statValue}>
                      {formatPrice(inquiry.offer_price) || "-"}
                    </div>
                    <div style={styles.statLabel}>Offer Price</div>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}>✅</div>
                  <div style={styles.statInfo}>
                    <div style={styles.statValue}>
                      {formatPrice(inquiry.confirmed_price) || "-"}
                    </div>
                    <div style={styles.statLabel}>Confirmed Price</div>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}>📦</div>
                  <div style={styles.statInfo}>
                    <div style={styles.statValue}>
                      {inquiry.order_quantity?.toLocaleString() || "-"}
                    </div>
                    <div style={styles.statLabel}>Order Quantity</div>
                  </div>
                </div>
              </div>

              {/* Key Information Grid */}
              <div style={styles.overviewGrid}>
                <div style={styles.overviewSection}>
                  <h3 style={styles.sectionTitle}>Basic Information</h3>
                  <div style={styles.infoList}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Inquiry No:</span>
                      <span style={styles.infoValue}>
                        {inquiry.inquiry_no || "-"}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Customer:</span>
                      <span style={styles.infoValue}>{getCustomerName()}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Buyer:</span>
                      <span style={styles.infoValue}>{getBuyerName()}</span>
                    </div>
                    {/* ========== NEW: Department field in Overview ========== */}
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Department:</span>
                      <span style={styles.infoValue}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          backgroundColor: "#dbeafe",
                          color: "#1e40af",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}>
                          {getDepartmentName()}
                        </span>
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Garment Type:</span>
                      <span style={styles.infoValue}>
                        {inquiry.garment || "-"}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Style:</span>
                      <span style={styles.infoValue}>
                        {inquiry.same_style || "-"}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Item:</span>
                      <span style={styles.infoValue}>
                        {inquiry.item || "-"}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Fabrication:</span>
                      <span style={styles.infoValue}>
                        {inquiry.fabrication || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={styles.overviewSection}>
                  <h3 style={styles.sectionTitle}>Schedule Information</h3>
                  <div style={styles.infoList}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Received Date:</span>
                      <span style={styles.infoValue}>
                        {formatDate(inquiry.received_date)}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Shipment Date:</span>
                      <span style={styles.infoValue}>
                        {formatDate(inquiry.shipment_date)}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Proposed Shipment:</span>
                      <span style={styles.infoValue}>
                        {formatDate(inquiry.proposed_shipment_date)}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Season:</span>
                      <span style={styles.infoValue}>
                        {inquiry.season || "-"}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Year:</span>
                      <span style={styles.infoValue}>
                        {inquiry.year || "-"}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Program:</span>
                      <span style={styles.infoValue}>
                        {inquiry.program || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={styles.overviewSection}>
                  <h3 style={styles.sectionTitle}>Pricing Information</h3>
                  <div style={styles.infoList}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Target Price:</span>
                      <span style={styles.infoValue}>
                        {formatPrice(inquiry.target_price)}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Offer Price:</span>
                      <span style={styles.infoValue}>
                        {formatPrice(inquiry.offer_price) || "-"}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Confirmed Price:</span>
                      <span style={styles.infoValue}>
                        {formatPrice(inquiry.confirmed_price) || "-"}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Texweave Price:</span>
                      <span style={styles.infoValue}>
                        {formatPrice(inquiry.texweave_price) || "-"}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Total Value:</span>
                      <span style={styles.infoValue}>{getTotalValue()}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Confirmed Date:</span>
                      <span style={styles.infoValue}>
                        {formatDate(inquiry.confirmed_price_date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={styles.overviewSection}>
                  <h3 style={styles.sectionTitle}>Suppliers</h3>
                  <div style={styles.supplierOverviewList}>
                    {getSupplierList().length > 0 ? (
                      getSupplierList().map((supplier, idx) => {
                        const supplierPrice = inquiry.supplier_prices?.find(
                          (sp) =>
                            sp.supplier === supplier.id ||
                            sp.supplier_id === supplier.id,
                        );
                        const price = supplierPrice?.price;
                        const numericPrice = price ? parseFloat(price) : null;
                        return (
                          <div key={idx} style={styles.supplierOverviewItem}>
                            <div style={styles.supplierOverviewInfo}>
                              <span style={styles.supplierOverviewName}>
                                {supplier.name || supplier.supplier_name}
                              </span>
                              {supplier.email && (
                                <span style={styles.supplierOverviewEmail}>
                                  {supplier.email}
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                ...styles.supplierOverviewPrice,
                                color:
                                  numericPrice && !isNaN(numericPrice)
                                    ? "#10b981"
                                    : "#f59e0b",
                              }}
                            >
                              {numericPrice && !isNaN(numericPrice)
                                ? `$${numericPrice.toFixed(2)}`
                                : "Pending"}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div style={styles.infoValue}>No suppliers assigned</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Remarks Section */}
              {(inquiry.remarks || inquiry.remarks1) && (
                <div style={styles.overviewSection}>
                  <h3 style={styles.sectionTitle}>Remarks</h3>
                  <div style={styles.remarksContent}>
                    {inquiry.remarks && (
                      <div style={styles.remarksBlock}>
                        <div style={styles.remarksLabel}>General Remarks:</div>
                        <div style={styles.remarksText}>{inquiry.remarks}</div>
                      </div>
                    )}
                    {inquiry.remarks1 && (
                      <div style={styles.remarksBlock}>
                        <div style={styles.remarksLabel}>
                          Additional Remarks:
                        </div>
                        <div style={styles.remarksText}>{inquiry.remarks1}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inquiry Details Tab */}
          {activeTab === "inquiry" && (
            <div style={styles.detailsTab}>
              <div style={styles.detailsGrid}>
                <div style={styles.detailsCard}>
                  <h3 style={styles.cardTitle}>Order Information</h3>
                  <table style={styles.detailsTable}>
                    <tbody>
                      <tr>
                        <td style={styles.detailsLabel}>Order Type</td>
                        <td style={styles.detailsValue}>
                          {inquiry.order_type || "-"}
                        </td>
                      </tr>
                      {/* ========== NEW: Department in Details tab ========== */}
                      <tr>
                        <td style={styles.detailsLabel}>Department</td>
                        <td style={styles.detailsValue}>
                          {getDepartmentName()}
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.detailsLabel}>Order Quantity</td>
                        <td style={styles.detailsValue}>
                          {inquiry.order_quantity?.toLocaleString() || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.detailsLabel}>Item</td>
                        <td style={styles.detailsValue}>
                          {inquiry.item || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.detailsLabel}>Gender</td>
                        <td style={styles.detailsValue}>
                          {inquiry.gender || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.detailsLabel}>With Hanger</td>
                        <td style={styles.detailsValue}>
                          {inquiry.with_hanger || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.detailsLabel}>WGR</td>
                        <td style={styles.detailsValue}>
                          {inquiry.wgr || "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={styles.detailsCard}>
                  <h3 style={styles.cardTitle}>Additional Information</h3>
                  <table style={styles.detailsTable}>
                    <tbody>
                      <tr>
                        <td style={styles.detailsLabel}>PDM Key</td>
                        <td style={styles.detailsValue}>
                          {inquiry.pdm_key || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.detailsLabel}>SAP Article No</td>
                        <td style={styles.detailsValue}>
                          {inquiry.sap_articale_no || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.detailsLabel}>Short Description</td>
                        <td style={styles.detailsValue}>
                          {inquiry.short_description || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.detailsLabel}>Repeat Of</td>
                        <td style={styles.detailsValue}>
                          {inquiry.repeat_of || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.detailsLabel}>Style Name</td>
                        <td style={styles.detailsValue}>
                          {inquiry.same_style || "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={styles.detailsCard}>
                  <h3 style={styles.cardTitle}>Dates</h3>
                  <table style={styles.detailsTable}>
                    <tbody>
                      <tr>
                        <td style={styles.detailsLabel}>Received Date</td>
                        <td style={styles.detailsValue}>
                          {formatDate(inquiry.received_date)}
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.detailsLabel}>Shipment Date</td>
                        <td style={styles.detailsValue}>
                          {formatDate(inquiry.shipment_date)}
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.detailsLabel}>Proposed Shipment</td>
                        <td style={styles.detailsValue}>
                          {formatDate(inquiry.proposed_shipment_date)}
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.detailsLabel}>Tech Ref Date</td>
                        <td style={styles.detailsValue}>
                          {formatDate(inquiry.techrefdate)}
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.detailsLabel}>
                          Confirmed Price Date
                        </td>
                        <td style={styles.detailsValue}>
                          {formatDate(inquiry.confirmed_price_date)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Suppliers & Quotes Tab */}
          {activeTab === "suppliers" && (
            <div style={styles.suppliersTab}>
              <div style={styles.suppliersGrid}>
                {getSupplierList().length > 0 ? (
                  getSupplierList().map((supplier, index) => {
                    const supplierPrice = inquiry.supplier_prices?.find(
                      (sp) =>
                        sp.supplier === supplier.id ||
                        sp.supplier_id === supplier.id,
                    );
                    const price = supplierPrice?.price;
                    const numericPrice = price ? parseFloat(price) : null;
                    const hasPrice = numericPrice && !isNaN(numericPrice);

                    return (
                      <div key={index} style={styles.supplierCard}>
                        <div style={styles.supplierCardHeader}>
                          <div>
                            <div style={styles.supplierCardName}>
                              {supplier.name || supplier.supplier_name}
                            </div>
                            {supplier.email && (
                              <div style={styles.supplierCardEmail}>
                                {supplier.email}
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              ...styles.quoteStatus,
                              backgroundColor: hasPrice ? "#d1fae5" : "#fef3c7",
                              color: hasPrice ? "#065f46" : "#92400e",
                            }}
                          >
                            {hasPrice ? "QUOTED" : "PENDING"}
                          </div>
                        </div>

                        <div style={styles.supplierCardBody}>
                          <div style={styles.quotePrice}>
                            <span style={styles.quoteLabel}>Quoted Price:</span>
                            <span
                              style={{
                                ...styles.quoteValue,
                                color: hasPrice ? "#10b981" : "#f59e0b",
                              }}
                            >
                              {hasPrice
                                ? `$${numericPrice.toFixed(2)}`
                                : "Not Quoted"}
                            </span>
                          </div>

                          {supplier.contact_person && (
                            <div style={styles.supplierDetail}>
                              <span style={styles.detailLabel}>Contact:</span>
                              <span>{supplier.contact_person}</span>
                            </div>
                          )}
                          {supplier.phone && (
                            <div style={styles.supplierDetail}>
                              <span style={styles.detailLabel}>Phone:</span>
                              <span>{supplier.phone}</span>
                            </div>
                          )}
                          {supplier.address && (
                            <div style={styles.supplierDetail}>
                              <span style={styles.detailLabel}>Address:</span>
                              <span>{supplier.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>🏭</div>
                    <div>No suppliers assigned to this inquiry</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Color & Size Tab */}
          {activeTab === "color-size" && (
            <div style={styles.colorSizeTab}>
              {inquiry.color_size_groups &&
              inquiry.color_size_groups.length > 0 ? (
                <div style={styles.tableContainer}>
                  <table style={styles.colorSizeTable}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Color</th>
                        {inquiry.color_size_groups[0]?.size_quantities?.map(
                          (size, idx) => (
                            <th key={idx} style={styles.tableHeader}>
                              {size.size}
                            </th>
                          ),
                        )}
                        <th style={styles.tableHeader}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiry.color_size_groups.map((group, groupIndex) => (
                        <tr key={groupIndex}>
                          <td style={styles.tableCell}>
                            <div style={styles.colorCell}>
                              <span>{group.color || "-"}</span>
                            </div>
                          </td>
                          {group.size_quantities.map((size, sizeIndex) => (
                            <td key={sizeIndex} style={styles.tableCell}>
                              {size.quantity}
                            </td>
                          ))}
                          <td
                            style={{ ...styles.tableCell, fontWeight: "600" }}
                          >
                            {group.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style={styles.tableFooter}>Grand Total</td>
                        {inquiry.color_size_groups[0]?.size_quantities?.map(
                          (_, idx) => (
                            <td key={idx} style={styles.tableFooter}></td>
                          ),
                        )}
                        <td style={styles.tableFooter}>
                          {inquiry.grand_total || 0}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🎨</div>
                  <div>No color/size information available</div>
                </div>
              )}
            </div>
          )}

          {/* DEVELOPMENT SAMPLE INFORMATION */}
          {activeTab === "development-sample" && (
            <div style={styles.developmentSampleTab}>
              <div style={styles.developmentSampleContainer}>
                {/* Development Sample Status */}
                <div style={styles.developmentCard}>
                  <div style={styles.developmentCardHeader}>
                    <span style={styles.developmentCardIcon}>🧪</span>
                    <h3 style={styles.developmentCardTitle}>
                      Development Sample Information
                    </h3>
                  </div>
                  <div style={styles.developmentCardBody}>
                    <div style={styles.developmentInfoRow}>
                      <span style={styles.developmentLabel}>Status:</span>
                      <span style={styles.developmentValue}>
                        {inquiry.development_sample_status || "—"}
                      </span>
                    </div>

                    {/* Development Sample Date */}
                    <div style={styles.developmentInfoRow}>
                      <span style={styles.developmentLabel}>Sample Date:</span>
                      <span style={styles.developmentValue}>
                        {inquiry.development_sample_date
                          ? new Date(
                              inquiry.development_sample_date,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>

                    {/* Development Sample Courier Reference */}
                    <div style={styles.developmentInfoRow}>
                      <span style={styles.developmentLabel}>
                        Courier Reference:
                      </span>
                      <span style={styles.developmentValue}>
                        {inquiry.development_sample_courrier_reference || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div style={styles.documentsTab}>
              <div style={styles.documentsContainer}>
                {renderMultipleImages()}
                {renderMultipleAttachments()}
                {(!inquiry.multiple_images ||
                  inquiry.multiple_images.length === 0) &&
                  (!inquiry.multiple_attachments ||
                    inquiry.multiple_attachments.length === 0) && (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>📁</div>
                      <div>No documents attached</div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div style={styles.modalOverlay} onClick={handleCloseEmailModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Send Email to Supplier</h3>
              <button onClick={handleCloseEmailModal} style={styles.modalClose}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>From Email *</label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  style={styles.formInput}
                />
                {fromEmail && !isValidEmail(fromEmail) && (
                  <div style={styles.errorText}>Please enter a valid email</div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>To</label>
                <div style={styles.toEmails}>{getSupplierNames()}</div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Message (Optional)</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={defaultMessage}
                  rows={8}
                  style={styles.formTextarea}
                />
                <div style={styles.helperText}>
                  {customMessage
                    ? "Custom message will be sent"
                    : "Default message will be used"}
                </div>
              </div>

              {emailStatus === "success" && (
                <div style={styles.successMessage}>{emailMessage}</div>
              )}
              {emailStatus === "error" && (
                <div style={styles.errorMessage}>{emailMessage}</div>
              )}
              {emailStatus === "Sending email..." && (
                <div style={styles.infoMessage}>{emailStatus}</div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={handleCloseEmailModal}
                style={styles.cancelButton}
                disabled={sendingEmail}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={
                  sendingEmail || !fromEmail || !isValidEmail(fromEmail)
                }
                style={{
                  ...styles.sendButton,
                  opacity:
                    sendingEmail || !fromEmail || !isValidEmail(fromEmail)
                      ? 0.6
                      : 1,
                }}
              >
                {sendingEmail ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  mainContent: {
    flex: 1,
    padding: "24px 32px",
    overflow: "auto",
    maxHeight: "100vh",
  },
  loadingContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    fontSize: "14px",
    color: "#64748b",
  },
  notFoundContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundIcon: {
    fontSize: "64px",
    marginBottom: "16px",
  },
  notFoundText: {
    fontSize: "18px",
    color: "#475569",
    marginBottom: "20px",
  },
  backButton: {
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    fontSize: "14px",
  },
  header: {
    marginBottom: "24px",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: {
    flex: 1,
  },
  backLink: {
    display: "inline-block",
    marginBottom: "12px",
    color: "#3b82f6",
    textDecoration: "none",
    fontSize: "14px",
  },
  titleSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  statusBadge: {
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid",
    textTransform: "uppercase",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  actionButton: {
    padding: "10px 20px",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
    cursor: "pointer",
    border: "none",
    backgroundColor: "#f1f5f9",
    color: "#334155",
  },
  emailButton: {
    backgroundColor: "#3b82f6",
    color: "white",
  },
  tabsContainer: {
    display: "flex",
    gap: "4px",
    backgroundColor: "white",
    padding: "6px",
    borderRadius: "14px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    overflowX: "auto",
  },
  tabButton: {
    padding: "12px 20px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "transparent",
    fontSize: "14px",
    fontWeight: "500",
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  tabButtonActive: {
    backgroundColor: "#3b82f6",
    color: "white",
    boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
  },
  tabContent: {
    animation: "fadeIn 0.3s ease",
  },
  overviewTab: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  statIcon: {
    fontSize: "32px",
    width: "56px",
    height: "56px",
    backgroundColor: "#f1f5f9",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px",
  },
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
  },
  overviewSection: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 16px 0",
    paddingBottom: "12px",
    borderBottom: "2px solid #e2e8f0",
  },
  infoList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
  },
  infoLabel: {
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    color: "#0f172a",
    fontWeight: "500",
  },
  supplierOverviewList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  supplierOverviewItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  supplierOverviewInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  supplierOverviewName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#0f172a",
  },
  supplierOverviewEmail: {
    fontSize: "11px",
    color: "#64748b",
  },
  supplierOverviewPrice: {
    fontSize: "14px",
    fontWeight: "600",
  },
  remarksContent: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  remarksBlock: {
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
  },
  remarksLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    marginBottom: "8px",
  },
  remarksText: {
    fontSize: "14px",
    color: "#334155",
    lineHeight: "1.5",
  },
  detailsTab: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
  },
  detailsCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
    padding: "14px 16px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  detailsTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  detailsLabel: {
    padding: "12px 16px",
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
    borderBottom: "1px solid #f1f5f9",
    width: "40%",
  },
  detailsValue: {
    padding: "12px 16px",
    fontSize: "13px",
    color: "#0f172a",
    fontWeight: "500",
    borderBottom: "1px solid #f1f5f9",
  },
  suppliersTab: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  suppliersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
  },
  supplierCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
  },
  supplierCardHeader: {
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  supplierCardName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
  },
  supplierCardEmail: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px",
  },
  quoteStatus: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
  },
  supplierCardBody: {
    padding: "16px",
  },
  quotePrice: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    marginBottom: "12px",
  },
  quoteLabel: {
    fontSize: "13px",
    color: "#64748b",
  },
  quoteValue: {
    fontSize: "18px",
    fontWeight: "700",
  },
  supplierDetail: {
    fontSize: "13px",
    padding: "6px 0",
    display: "flex",
    gap: "8px",
  },
  detailLabel: {
    color: "#64748b",
    minWidth: "70px",
  },
  colorSizeTab: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    overflowX: "auto",
  },
  tableContainer: {
    overflowX: "auto",
  },
  colorSizeTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  tableHeader: {
    padding: "12px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
    borderBottom: "2px solid #e2e8f0",
    fontWeight: "600",
    color: "#475569",
  },
  tableCell: {
    padding: "10px 12px",
    textAlign: "center",
    borderBottom: "1px solid #f1f5f9",
  },
  tableFooter: {
    padding: "12px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
    fontWeight: "600",
    borderTop: "2px solid #e2e8f0",
  },
  colorCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  documentsTab: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  documentsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  documentsCard: {
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #e2e8f0",
  },
  documentsCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  documentsCardIcon: {
    fontSize: "24px",
  },
  documentsCardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  attachmentList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  attachmentItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  attachmentIcon: {
    fontSize: "24px",
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#0f172a",
    marginBottom: "4px",
    wordBreak: "break-all",
  },
  attachmentLink: {
    color: "#3b82f6",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "500",
  },
  imageGalleryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "16px",
  },
  galleryImageItem: {
    position: "relative",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    backgroundColor: "white",
  },
  galleryImage: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
  },
  galleryImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    transition: "opacity 0.2s",
  },
  galleryImageLink: {
    backgroundColor: "white",
    padding: "8px 12px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "16px",
  },
  galleryImageName: {
    padding: "8px",
    fontSize: "11px",
    textAlign: "center",
    color: "#64748b",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "white",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px",
    color: "#94a3b8",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "20px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#94a3b8",
  },
  modalBody: {
    padding: "24px",
    overflow: "auto",
    flex: 1,
  },
  modalFooter: {
    padding: "16px 24px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  formLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
  },
  formInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    outline: "none",
  },
  formTextarea: {
    width: "100%",
    padding: "12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    resize: "vertical",
    outline: "none",
  },
  toEmails: {
    padding: "10px 12px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#334155",
    border: "1.5px solid #e2e8f0",
  },
  helperText: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "6px",
  },
  errorText: {
    fontSize: "12px",
    color: "#dc2626",
    marginTop: "6px",
  },
  successMessage: {
    padding: "12px",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    borderRadius: "10px",
    fontSize: "13px",
  },
  errorMessage: {
    padding: "12px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: "10px",
    fontSize: "13px",
  },
  infoMessage: {
    padding: "12px",
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    borderRadius: "10px",
    fontSize: "13px",
  },
  cancelButton: {
    padding: "10px 20px",
    backgroundColor: "#f1f5f9",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    color: "#475569",
  },
  sendButton: {
    padding: "10px 24px",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    color: "white",
  },
  developmentSampleTab: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  developmentSampleContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  developmentCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
  },
  developmentCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  developmentCardIcon: {
    fontSize: "20px",
  },
  developmentCardTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  developmentCardBody: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  developmentInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  developmentLabel: {
    fontSize: "13px",
    color: "#64748b",
  },
  developmentValue: {
    fontSize: "13px",
    color: "#0f172a",
    fontWeight: "500",
  },
  developmentStatusBadge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
  },
};

// Add CSS animations
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .gallery-image-item:hover .gallery-image-overlay {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
}

export default DetailsInquiry;