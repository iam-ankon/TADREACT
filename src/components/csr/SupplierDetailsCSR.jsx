// SupplierDetailsCSR.jsx - Complete Version with All Supplier Model Fields
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSupplierById } from "../../api/supplierApi";

// Professional color palette
const colors = {
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  primaryLight: "#3b82f6",
  success: "#059669",
  successLight: "#d1fae5",
  warning: "#d97706",
  warningLight: "#fef3c7",
  danger: "#dc2626",
  dangerLight: "#fee2e2",
  info: "#0891b2",
  infoLight: "#cffafe",
  purple: "#7c3aed",
  purpleLight: "#ede9fe",
  gray: "#6b7280",
  grayLight: "#f3f4f6",
  grayDark: "#374151",
  border: "#e5e7eb",
  background: "#ffffff",
  cardBg: "#f9fafb",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3b3",
};

const formatDate = (dateString) => {
  if (!dateString) return "Not specified";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "Not specified";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
};

const getStatusColor = (status) => {
  if (!status)
    return { bg: colors.grayLight, text: colors.gray, border: colors.border };

  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "active":
    case "approved":
    case "valid":
    case "compliant":
      return {
        bg: colors.successLight,
        text: colors.success,
        border: "#c3e6cb",
      };
    case "pending":
    case "under_review":
    case "in progress":
      return {
        bg: colors.warningLight,
        text: colors.warning,
        border: "#ffeaa7",
      };
    case "expired":
    case "cancelled":
    case "non_compliant":
    case "invalid":
      return { bg: colors.dangerLight, text: colors.danger, border: "#f5c6cb" };
    case "conditional":
      return { bg: colors.infoLight, text: colors.info, border: "#b6d4fe" };
    default:
      return { bg: colors.grayLight, text: colors.gray, border: colors.border };
  }
};

const getDaysRemainingColor = (days) => {
  if (!days && days !== 0) return { bg: colors.gray, color: "white" };
  if (days <= 0) return { bg: colors.danger, color: "white" }; // Expired
  if (days <= 30) return { bg: colors.danger, color: "white" }; // Critical
  if (days <= 60) return { bg: colors.warning, color: "white" }; // Warning
  if (days <= 90) return { bg: colors.warning, color: "white" }; // Approaching
  return { bg: colors.success, color: "white" }; // Good
};

const getBooleanDisplay = (value) => {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not specified";
};

// Helper function for building type
const getBuildingType = (supplier) => {
  const types = [];
  if (supplier?.rented_building) types.push("Rented");
  if (supplier?.share_building) types.push("Shared");
  if (supplier?.own_property) types.push("Owned");
  return types.length > 0 ? types.join(", ") : null;
};

// Helper function to get correct file URL (point to Django server)
const getCorrectFileUrl = (url) => {
  if (!url) return null;

  const backendUrl = "http://119.148.51.38:8000";

  if (url.startsWith("/media/")) {
    return `${backendUrl}${url}`;
  }

  if (!url.startsWith("http")) {
    return `${backendUrl}${url.startsWith("/") ? url : "/" + url}`;
  }

  if (url.includes(":3000")) {
    return url.replace(":3000", ":8000");
  }

  return url;
};

const InfoCard = ({ title, icon, children, colSpan = 1 }) => (
  <div
    style={{
      ...styles.infoCard,
      gridColumn: colSpan > 1 ? `span ${colSpan}` : "auto",
    }}
  >
    <div style={styles.cardHeader}>
      <span style={styles.cardIcon}>{icon}</span>
      <h3 style={styles.cardTitle}>{title}</h3>
    </div>
    <div style={styles.cardBody}>{children}</div>
  </div>
);

const InfoRow = ({
  label,
  value,
  copyable = false,
  fieldName,
  copiedField,
  onCopy,
}) => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "Not specified"
  )
    return null;

  const displayValue =
    typeof value === "boolean" ? (value ? "Yes" : "No") : value;

  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}:</span>
      <div style={styles.infoValueContainer}>
        <span style={styles.infoValue}>{displayValue}</span>
        {copyable && onCopy && (
          <button
            onClick={() => onCopy(value, fieldName)}
            style={styles.copyButton}
            title="Copy to clipboard"
          >
            {copiedField === fieldName ? "✅" : "📋"}
          </button>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status, size = "medium" }) => {
  const { bg, text } = getStatusColor(status);
  return (
    <span
      style={{
        ...styles.statusBadge,
        backgroundColor: bg,
        color: text,
        fontSize: size === "small" ? "0.75rem" : "0.875rem",
        padding: size === "small" ? "0.25rem 0.5rem" : "0.5rem 1rem",
      }}
    >
      {status?.replace(/_/g, " ").toUpperCase() || "UNKNOWN"}
    </span>
  );
};

const DaysRemainingBadge = ({ days }) => {
  const { bg, color } = getDaysRemainingColor(days);
  return (
    <span
      style={{
        ...styles.daysBadge,
        backgroundColor: bg,
        color,
      }}
    >
      {days} days {days <= 30 && "⚠️"}
    </span>
  );
};

const DocumentGrid = ({ documents }) => {
  if (!documents || documents.length === 0) {
    return (
      <div style={styles.noDocuments}>
        <span style={styles.noDocsIcon}>📂</span>
        <p>No documents uploaded</p>
      </div>
    );
  }

  const handleViewDocument = (e, url) => {
    e.preventDefault();
    e.stopPropagation();

    const correctUrl = getCorrectFileUrl(url);
    window.open(correctUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={styles.documentGrid}>
      {documents.map((doc, index) => (
        <div key={index} style={styles.documentCard}>
          <span style={styles.docIcon}>📄</span>
          <div style={styles.docInfo}>
            <div style={styles.docName}>
              {doc.name || `Document ${index + 1}`}
            </div>
            {doc.url && (
              <a
                href="#"
                onClick={(e) => handleViewDocument(e, doc.url)}
                style={styles.docLink}
              >
                View Document →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Image Gallery Component
const ImageGallery = ({ images, title }) => {
  if (!images || images.length === 0) return null;

  const [failedImages, setFailedImages] = useState({});

  const handleImageError = (index) => {
    setFailedImages((prev) => ({ ...prev, [index]: true }));
  };

  const handleImageClick = (url) => {
    const correctUrl = getCorrectFileUrl(url);
    window.open(correctUrl, "_blank");
  };

  const FallbackImage = () => (
    <svg
      width="100%"
      height="150"
      viewBox="0 0 200 150"
      preserveAspectRatio="none"
      style={styles.fallbackSvg}
    >
      <rect width="200" height="150" fill={colors.grayLight} />
      <rect
        x="1"
        y="1"
        width="198"
        height="148"
        fill="none"
        stroke={colors.border}
        strokeWidth="2"
        strokeDasharray="5,5"
      />
      <text
        x="100"
        y="75"
        fontFamily="Arial"
        fontSize="40"
        textAnchor="middle"
        fill={colors.textMuted}
        dy=".3em"
      >
        🖼️
      </text>
      <text
        x="100"
        y="110"
        fontFamily="Arial"
        fontSize="12"
        textAnchor="middle"
        fill={colors.textSecondary}
      >
        Image not available
      </text>
    </svg>
  );

  return (
    <div style={styles.imageGallery}>
      <h4 style={styles.galleryTitle}>
        {title} ({images.length})
      </h4>
      <div style={styles.imageGrid}>
        {images.map((imageUrl, index) => {
          const correctUrl = getCorrectFileUrl(imageUrl);
          const hasFailed = failedImages[index];

          return (
            <div
              key={index}
              className="gallery-image-container"
              style={styles.galleryImageContainer}
              onClick={() => !hasFailed && handleImageClick(imageUrl)}
              title={
                hasFailed
                  ? "Image failed to load - Click to try opening directly"
                  : "Click to view full size"
              }
            >
              {!hasFailed ? (
                <img
                  src={correctUrl}
                  alt={`${title} ${index + 1}`}
                  style={styles.galleryImage}
                  onError={() => handleImageError(index)}
                  loading="lazy"
                />
              ) : (
                <div style={styles.fallbackContainer}>
                  <FallbackImage />
                </div>
              )}
              <div style={styles.imageOverlay}>
                <span style={styles.imageOverlayText}>Click to enlarge</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SupplierDetailsCSR = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedField, setCopiedField] = useState(null);

  // Notification states
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [notificationResult, setNotificationResult] = useState(null);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedItems, setSelectedItems] = useState({});

  // Notification days constant
  const NOTIFICATION_DAYS = [90, 75, 60, 45, 30, 15];

  useEffect(() => {
    fetchSupplierDetails();
  }, [id]);

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSupplierById(id);
      setSupplier(response.data);
    } catch (error) {
      console.error("Error fetching supplier details:", error);
      setError(`Failed to load supplier details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text.toString()).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // Get ALL expiring items
  const getExpiringItems = () => {
    if (!supplier) return [];

    const items = [];

    const certItems = [
      // Certifications
      {
        id: "bsci",
        name: "BSCI Certification",
        days: supplier.bsci_validity_days_remaining,
        expiry: supplier.bsci_validity,
        status: supplier.bsci_status,
        icon: "📜",
        category: "certification",
      },
      {
        id: "sedex",
        name: "SEDEX Certification",
        days: supplier.sedex_validity_days_remaining,
        expiry: supplier.sedex_validity,
        status: supplier.sedex_status,
        icon: "📜",
        category: "certification",
      },
      {
        id: "wrap",
        name: "WRAP Certification",
        days: supplier.wrap_validity_days_remaining,
        expiry: supplier.wrap_validity,
        status: supplier.wrap_status,
        icon: "📜",
        category: "certification",
      },
      {
        id: "security_audit",
        name: "CTPAT Security Audit",
        days: supplier.security_audit_validity_days_remaining,
        expiry: supplier.security_audit_validity,
        status: supplier.security_audit_status,
        icon: "🛡️",
        category: "certification",
      },
      {
        id: "oeko_tex",
        name: "Oeko-Tex Certification",
        days: supplier.oeko_tex_validity_days_remaining,
        expiry: supplier.oeko_tex_validity,
        status: supplier.oeko_tex_status,
        icon: "📜",
        category: "certification",
      },
      {
        id: "gots",
        name: "GOTS Certification",
        days: supplier.gots_validity_days_remaining,
        expiry: supplier.gots_validity,
        status: supplier.gots_status,
        icon: "📜",
        category: "certification",
      },
      {
        id: "ocs",
        name: "OCS Certification",
        days: supplier.ocs_validity_days_remaining,
        expiry: supplier.ocs_validity,
        status: supplier.ocs_status,
        icon: "📜",
        category: "certification",
      },
      {
        id: "grs",
        name: "GRS Certification",
        days: supplier.grs_validity_days_remaining,
        expiry: supplier.grs_validity,
        status: supplier.grs_status,
        icon: "📜",
        category: "certification",
      },
      {
        id: "rcs",
        name: "RCS Certification",
        days: supplier.rcs_validity_days_remaining,
        expiry: supplier.rcs_validity,
        status: supplier.rcs_status,
        icon: "📜",
        category: "certification",
      },
      {
        id: "iso_9001",
        name: "ISO 9001 Certification",
        days: supplier.iso_9001_validity_days_remaining,
        expiry: supplier.iso_9001_validity,
        status: supplier.iso_9001_status,
        icon: "📜",
        category: "certification",
      },
      {
        id: "iso_14001",
        name: "ISO 14001 Certification",
        days: supplier.iso_14001_validity_days_remaining,
        expiry: supplier.iso_14001_validity,
        status: supplier.iso_14001_status,
        icon: "📜",
        category: "certification",
      },
      {
        id: "iso_45001",
        name: "ISO 45001 Certification",
        days: supplier.iso_45001_validity_days_remaining,
        expiry: supplier.iso_45001_validity,
        status: "OSH Certification",
        icon: "🛡️",
        category: "certification",
      },

      // Licenses
      {
        id: "trade_license",
        name: "Trade License",
        days: supplier.trade_license_days_remaining,
        expiry: supplier.trade_license_validity,
        status: "License",
        icon: "📋",
        category: "license",
      },
      {
        id: "factory_license",
        name: "Factory License",
        days: supplier.factory_license_days_remaining,
        expiry: supplier.factory_license_validity,
        status: "License",
        icon: "🏭",
        category: "license",
      },
      {
        id: "fire_license",
        name: "Fire License",
        days: supplier.fire_license_days_remaining,
        expiry: supplier.fire_license_validity,
        status: "License",
        icon: "🚒",
        category: "license",
      },
      {
        id: "membership",
        name: "Membership Certificate",
        days: supplier.membership_days_remaining,
        expiry: supplier.membership_validity,
        status: "License",
        icon: "📋",
        category: "license",
      },
      {
        id: "group_insurance",
        name: "Group Insurance",
        days: supplier.group_insurance_days_remaining,
        expiry: supplier.group_insurance_validity,
        status: "License",
        icon: "🛡️",
        category: "license",
      },
      {
        id: "boiler_license",
        name: "Boiler License",
        days: supplier.boiler_license_days_remaining,
        expiry: supplier.boiler_license_validity,
        status: "License",
        icon: "⚙️",
        category: "license",
      },
      {
        id: "berc_license",
        name: "BERC License",
        days: supplier.berc_days_remaining,
        expiry: supplier.berc_license_validity,
        status: "License",
        icon: "📋",
        category: "license",
      },
      {
        id: "drinking_water_license",
        name: "Drinking Water License",
        days: supplier.drinking_water_license_days_remaining,
        expiry: supplier.drinking_water_license_validity,
        status: "License",
        icon: "💧",
        category: "license",
      },
    ];

    certItems.forEach((item) => {
      if (item.days !== null && item.days !== undefined) {
        items.push({
          ...item,
          days_remaining: item.days,
          expiry_date: item.expiry,
          eligible: true,
        });
      }
    });

    return items.sort((a, b) => a.days_remaining - b.days_remaining);
  };

  const getNotificationCount = () => {
    if (!supplier) return 0;
    const allItems = getExpiringItems();
    const notificationItems = allItems.filter((item) =>
      NOTIFICATION_DAYS.includes(item.days_remaining),
    );
    return notificationItems.length;
  };

  const sendExpiryNotifications = async () => {
    const selected = Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selected.length === 0) {
      alert("Please select at least one item to notify");
      return;
    }

    if (!supplier.email) {
      alert("Supplier does not have an email address");
      return;
    }

    setSendingNotifications(true);
    setNotificationResult(null);

    try {
      const token = localStorage.getItem("token");

      let csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");

      if (!csrfToken) {
        const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
        csrfToken = cookieMatch ? cookieMatch[1] : null;
      }

      const requestData = {
        items: selected,
        from_email: "compliance@texweave.net",
        custom_message: customMessage,
      };

      console.log("Sending notification request:", requestData);

      const response = await fetch(
        `http://119.148.51.38:8000/api/merchandiser/api/supplier/${id}/send-expiry-notifications/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
            ...(csrfToken && { "X-CSRFToken": csrfToken }),
          },
          credentials: "include",
          body: JSON.stringify(requestData),
        },
      );

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = {
          error: "Invalid JSON response",
          rawResponse: responseText,
          notifications: [],
        };
      }

      if (response.ok && result.success) {
        setNotificationResult({
          success: true,
          message: `✅ Notifications sent successfully to ${supplier.email}`,
          details: result.notifications || [],
        });
        setSelectedItems({});
        setCustomMessage("");
        setTimeout(() => {
          setShowNotificationModal(false);
          setNotificationResult(null);
        }, 3000);
      } else {
        let errorMessage = result.error || result.message || "Unknown error";
        if (result.available_items) {
          errorMessage += `\nAvailable items: ${result.available_items.join(", ")}`;
        }
        if (result.notification_days) {
          errorMessage += `\nNotification days: ${result.notification_days.join(", ")}`;
        }
        setNotificationResult({
          success: false,
          message: `❌ Failed to send notifications: ${errorMessage}`,
          details: result.notifications || [],
          rawError: result,
        });
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      setNotificationResult({
        success: false,
        message: `❌ Error: ${error.message}`,
        details: [],
      });
    } finally {
      setSendingNotifications(false);
    }
  };

  const groupedData = supplier && {
    basic: [
      { label: "SL No", value: supplier.sl_no },
      {
        label: "Supplier ID",
        value: supplier.supplier_id,
        copyable: true,
        field: "supplier_id",
      },
      { label: "Category", value: supplier.supplier_category },
      { label: "Year Established", value: supplier.year_of_establishment },
      { label: "Sister Concern", value: supplier.sister_concern },
      { label: "Location", value: supplier.location },
      { label: "Factory Location", value: supplier.location_factory },
      { label: "Bank Account", value: supplier.bank_account },
      { label: "Bank Branch", value: supplier.bank_branch },
      { label: "Bank BIN", value: supplier.bank_bin },
      { label: "Bank Branch Address", value: supplier.bank_branch_address },
      { label: "Weekly Holiday", value: supplier.weekly_holiday },
      { label: "BGMEA Number", value: supplier.bgmea_number },
      { label: "BKMEA Number", value: supplier.bkmea_number },
      { label: "RSC", value: supplier.rsc },
      {
        label: "Order Status",
        value: supplier.tad_group_order_status,
      },
    ],
    contacts: [
      { label: "Email", value: supplier.email, copyable: true, field: "email" },
      { label: "Phone", value: supplier.phone, copyable: true, field: "phone" },
      { label: "Main Contact", value: supplier.factory_main_contact },
      {
        label: "Merchandiser Contact",
        value: supplier.factory_merchandiser_contact,
      },
      {
        label: "HR/Compliance Contact",
        value: supplier.factory_hr_compliance_contact,
      },
    ],
    building: [
      { label: "Building Type", value: getBuildingType(supplier) },
      { label: "Building Details", value: supplier.building_details },
      {
        label: "Total Area",
        value: supplier.total_area ? `${supplier.total_area} sq ft` : null,
      },
      { label: "Ownership Details", value: supplier.ownership_details },
    ],
    manpower: [
      { label: "Workers - Male", value: supplier.manpower_workers_male },
      { label: "Workers - Female", value: supplier.manpower_workers_female },
      { label: "Workers - Other Gender", value: supplier.other_gender_workers },
      { label: "Workers - Disabled", value: supplier.disabled_workers },
      { label: "Staff - Male", value: supplier.manpower_staff_male },
      { label: "Staff - Female", value: supplier.manpower_staff_female },
      { label: "Total Manpower", value: supplier.total_manpower },
    ],
    production: [
      { label: "Production Process", value: supplier.production_process },
      { label: "Manufacturing Items", value: supplier.manufacturing_item },
      { label: "Capacity per Month", value: supplier.capacity_per_month },
      { label: "Business by Market", value: supplier.business_by_market },
      { label: "Existing Customers", value: supplier.existing_customer },
      { label: "Sewing Lines", value: supplier.number_of_sewing_line },
      {
        label: "Total Machineries",
        value: supplier.total_number_of_machineries,
      },
      {
        label: "Yearly Turnover",
        value: formatCurrency(supplier.yearly_turnover_usd),
      },
    ],
    certifications: [
      {
        name: "BSCI",
        days: supplier.bsci_validity_days_remaining,
        validity: supplier.bsci_validity,
        status: supplier.bsci_status,
        rating: supplier.bsci_rating,
      },
      {
        name: "SEDEX",
        days: supplier.sedex_validity_days_remaining,
        validity: supplier.sedex_validity,
        status: supplier.sedex_status,
        rating: supplier.sedex_rating,
      },
      {
        name: "WRAP",
        days: supplier.wrap_validity_days_remaining,
        validity: supplier.wrap_validity,
        status: supplier.wrap_status,
        rating: supplier.wrap_rating,
      },
      {
        name: "CTPAT",
        days: supplier.security_audit_validity_days_remaining,
        validity: supplier.security_audit_validity,
        status: supplier.security_audit_status,
      },
      {
        name: "Oeko-Tex",
        days: supplier.oeko_tex_validity_days_remaining,
        validity: supplier.oeko_tex_validity,
        status: supplier.oeko_tex_status,
      },
      {
        name: "GOTS",
        days: supplier.gots_validity_days_remaining,
        validity: supplier.gots_validity,
        status: supplier.gots_status,
      },
      {
        name: "OCS",
        days: supplier.ocs_validity_days_remaining,
        validity: supplier.ocs_validity,
        status: supplier.ocs_status,
      },
      {
        name: "GRS",
        days: supplier.grs_validity_days_remaining,
        validity: supplier.grs_validity,
        status: supplier.grs_status,
      },
      {
        name: "RCS",
        days: supplier.rcs_validity_days_remaining,
        validity: supplier.rcs_validity,
        status: supplier.rcs_status,
      },
      {
        name: "ISO 9001",
        days: supplier.iso_9001_validity_days_remaining,
        validity: supplier.iso_9001_validity,
        status: supplier.iso_9001_status,
      },
      {
        name: "ISO 14001",
        days: supplier.iso_14001_validity_days_remaining,
        validity: supplier.iso_14001_validity,
        status: supplier.iso_14001_status,
      },
      {
        name: "ISO 45001",
        days: supplier.iso_45001_validity_days_remaining,
        validity: supplier.iso_45001_validity,
        status: "OSH Certification",
      },
    ],
    licenses: [
      {
        name: "Trade License",
        days: supplier.trade_license_days_remaining,
        validity: supplier.trade_license_validity,
      },
      {
        name: "Factory License",
        days: supplier.factory_license_days_remaining,
        validity: supplier.factory_license_validity,
      },
      {
        name: "Fire License",
        days: supplier.fire_license_days_remaining,
        validity: supplier.fire_license_validity,
      },
      {
        name: "Membership",
        days: supplier.membership_days_remaining,
        validity: supplier.membership_validity,
      },
      {
        name: "Group Insurance",
        days: supplier.group_insurance_days_remaining,
        validity: supplier.group_insurance_validity,
      },
      {
        name: "Boiler License",
        days: supplier.boiler_license_days_remaining,
        validity: supplier.boiler_license_validity,
        boilerNo: supplier.boiler_no,
      },
      {
        name: "BERC License",
        days: supplier.berc_days_remaining,
        validity: supplier.berc_license_validity,
      },
      {
        name: "Drinking Water License",
        days: supplier.drinking_water_license_days_remaining,
        validity: supplier.drinking_water_license_validity,
      },
    ],
    fireSafety: [
      {
        label: "Last Fire Training",
        value: formatDate(supplier.last_fire_training_by_fscd),
      },
      {
        label: "Next Fire Training",
        value: formatDate(supplier.fscd_next_fire_training_date),
      },
      {
        label: "Last Fire Drill",
        value: formatDate(supplier.last_fire_drill_record_by_fscd),
      },
      {
        label: "Next Fire Drill",
        value: formatDate(supplier.fscd_next_drill_date),
      },
      {
        label: "Fire Fighters/Rescuers",
        value: supplier.total_fire_fighter_rescue_first_aider_fscd,
      },
      { label: "Fire Safety Detection", value: supplier.fire_safety_detection },
      {
        label: "Fire Safety Protection",
        value: supplier.fire_safety_protection,
      },
      { label: "Remarks", value: supplier.fire_safety_remarks },
    ],
    osh: [
      {
        label: "OSH Committee Formed",
        value: getBooleanDisplay(supplier.osh_committee_safety),
      },
      {
        label: "OSH Safety Policy",
        value: getBooleanDisplay(supplier.osh_safety_policy),
      },
      {
        label: "ISO 45001 Validity",
        value: formatDate(supplier.iso_45001_validity),
      },
      {
        label: "ISO 45001 Days Remaining",
        value: supplier.iso_45001_validity_days_remaining,
      },
    ],
    compliance: [
      {
        label: "Compliance Status",
        value: supplier.compliance_status,
        badge: true,
      },
      {
        label: "Minimum Wages Paid",
        value: getBooleanDisplay(supplier.minimum_wages_paid),
      },
      {
        label: "Earn Leave Status",
        value: getBooleanDisplay(supplier.earn_leave_status),
      },
      {
        label: "Service Benefit",
        value: getBooleanDisplay(supplier.service_benefit),
      },
      {
        label: "Maternity Benefit",
        value: getBooleanDisplay(supplier.maternity_benefit),
      },
      {
        label: "Yearly Increment",
        value: getBooleanDisplay(supplier.yearly_increment),
      },
      {
        label: "Festival Bonus",
        value: getBooleanDisplay(supplier.festival_bonus),
      },
      {
        label: "Salary Due Status",
        value: getBooleanDisplay(supplier.salary_due_status),
      },
      { label: "Due Salary Month", value: supplier.due_salary_month },
      { label: "Remarks", value: supplier.compliance_remarks },
    ],
    grievance: [
      {
        label: "Grievance Mechanism",
        value: getBooleanDisplay(supplier.grievance_mechanism),
      },
      {
        label: "Resolution Procedure",
        value: supplier.grievance_resolution_procedure,
      },
      {
        label: "Last Resolution Date",
        value: formatDate(supplier.last_grievance_resolution_date),
      },
      {
        label: "Resolution Rate",
        value: supplier.grievance_resolution_rate
          ? `${supplier.grievance_resolution_rate}%`
          : null,
      },
      { label: "Remarks", value: supplier.grievance_remarks },
    ],
    committee: [
      {
        label: "Last PC Election",
        value: formatDate(supplier.last_pc_election_date),
      },
      {
        label: "Last PC Meeting",
        value: formatDate(supplier.last_pc_meeting_date),
      },
      {
        label: "Last Safety Committee Formation",
        value: formatDate(supplier.last_safety_committee_formation_date),
      },
      {
        label: "Last Safety Committee Meeting",
        value: formatDate(supplier.last_safety_committee_meeting_date),
      },
    ],
    environmental: [
      {
        label: "Water Test Report (DOE)",
        value: formatDate(supplier.water_test_report_doe),
      },
      {
        label: "ZDHC Water Test",
        value: formatDate(supplier.zdhc_water_test_report),
      },
      {
        label: "Higg FEM Self Assessment",
        value: supplier.higg_fem_self_assessment_score,
      },
      {
        label: "Higg FEM Verification",
        value: supplier.higg_fem_verification_assessment_score,
      },
      {
        label: "Behive Chemical Inventory",
        value: getBooleanDisplay(supplier.behive_chemical_inventory),
      },
      { label: "CO2 Report", value: supplier.co2_report },
      { label: "Solar Energy", value: supplier.solar_energy },
      { label: "Green Energy", value: supplier.green_energy },
    ],
    rsc: [
      { label: "RSC ID", value: supplier.rsc_id },
      {
        label: "Progress Rate",
        value: supplier.progress_rate ? `${supplier.progress_rate}%` : null,
      },
      {
        label: "Escalation Status",
        value: getBooleanDisplay(supplier.escalation_status),
      },
      {
        label: "No Color Certificate",
        value: getBooleanDisplay(supplier.no_color_certificate),
      },
      {
        label: "Recognition Letter",
        value: getBooleanDisplay(supplier.recognitoion_letter),
      },
      {
        label: "Structural - Initial Audit",
        value: formatDate(supplier.structural_initial_audit_date),
      },
      {
        label: "Structural - Last Follow-up",
        value: formatDate(supplier.structural_last_follow_up_audit_date),
      },
      {
        label: "Fire - Initial Audit",
        value: formatDate(supplier.fire_initial_audit_date),
      },
      {
        label: "Fire - Last Follow-up",
        value: formatDate(supplier.fire_last_follow_up_audit_date),
      },
      {
        label: "Electrical - Initial Audit",
        value: formatDate(supplier.electrical_initial_audit_date),
      },
      {
        label: "Electrical - Last Follow-up",
        value: formatDate(supplier.electrical_last_follow_up_audit_date),
      },
    ],
    csr: [
      {
        label: "Donation to Local Community",
        value: getBooleanDisplay(supplier.donation_local_community),
      },
      {
        label: "Tree Plantation",
        value: getBooleanDisplay(supplier.tree_plantation_local_community),
      },
      {
        label: "Sanitary Napkin Status",
        value: getBooleanDisplay(supplier.sanitary_napkin_status),
      },
      { label: "Fair Shop", value: getBooleanDisplay(supplier.fair_shop) },
      {
        label: "Gift During Festival",
        value: getBooleanDisplay(supplier.any_gift_provided_during_festival),
      },
    ],
    zeroTolerance: [
      {
        label: "Full Facility Walkthrough Allowed",
        value: getBooleanDisplay(supplier.zero_tolerance_walkthrough_allowed),
      },
      {
        label: "No Underage Workers",
        value: getBooleanDisplay(supplier.zero_tolerance_no_underage_workers),
      },
      {
        label: "No Suspected Young Workers",
        value: getBooleanDisplay(
          supplier.zero_tolerance_no_suspected_young_workers,
        ),
      },
      {
        label: "Minimum Wage Guaranteed",
        value: getBooleanDisplay(
          supplier.zero_tolerance_minimum_wage_guaranteed,
        ),
      },
      {
        label: "Authentic Records",
        value: getBooleanDisplay(supplier.zero_tolerance_authentic_records),
      },
      {
        label: "No Forced Labor",
        value: getBooleanDisplay(supplier.zero_tolerance_no_forced_labor),
      },
    ],
    fireEquipment: [
      {
        label: "Sufficient Fire Fighting Equipment",
        value: getBooleanDisplay(supplier.fire_fighting_equipment_sufficient),
      },
      {
        label: "Trained Fire Fighters",
        value: getBooleanDisplay(supplier.fire_fighting_trained_personnel),
      },
      {
        label: "Fire Hose System",
        value: getBooleanDisplay(supplier.fire_fighting_hose_system),
      },
    ],
    fireAlarm: [
      {
        label: "Fire Alarm System Present",
        value: getBooleanDisplay(supplier.fire_alarm_system_present),
      },
      {
        label: "Fire Alarm Audible All Areas",
        value: getBooleanDisplay(supplier.fire_alarm_audible_all_areas),
      },
      {
        label: "Visual Fire Alarm",
        value: getBooleanDisplay(supplier.fire_alarm_visual_noisy_areas),
      },
      {
        label: "Fire Alarm IPS Backup",
        value: getBooleanDisplay(supplier.fire_alarm_ips_backup),
      },
      {
        label: "Smoke Detectors",
        value: getBooleanDisplay(supplier.fire_alarm_smoke_detectors),
      },
      {
        label: "Marked Fire Alarm Switches",
        value: getBooleanDisplay(supplier.fire_alarm_switches_marked),
      },
    ],
    emergencyLights: [
      {
        label: "Emergency Lights Installed",
        value: getBooleanDisplay(supplier.emergency_lights_installed),
      },
      {
        label: "Emergency Lights IPS Backup",
        value: getBooleanDisplay(supplier.emergency_lights_ips_backup),
      },
    ],
    drinkingWater: [
      {
        label: "Sufficient Drinking Water",
        value: getBooleanDisplay(supplier.drinking_water_sufficient),
      },
      {
        label: "Valid Water Test Report",
        value: getBooleanDisplay(supplier.drinking_water_test_report_valid),
      },
      {
        label: "Parameters Acceptable",
        value: getBooleanDisplay(supplier.drinking_water_parameters_acceptable),
      },
      {
        label: "Arsenic Within Limits",
        value: getBooleanDisplay(supplier.drinking_water_arsenic_limit),
      },
      {
        label: "Fecal Coliform Within Limits",
        value: getBooleanDisplay(supplier.drinking_water_fecal_coliform_limit),
      },
      {
        label: "Total Coliform Within Limits",
        value: getBooleanDisplay(supplier.drinking_water_total_coliform_limit),
      },
      {
        label: "pH Within Limits",
        value: getBooleanDisplay(supplier.drinking_water_ph_limit),
      },
      {
        label: "TDS Within Limits",
        value: getBooleanDisplay(supplier.drinking_water_tds_limit),
      },
      {
        label: "Iron Within Limits",
        value: getBooleanDisplay(supplier.drinking_water_iron_limit),
      },
    ],
    paSystem: [
      {
        label: "PA System Present",
        value: getBooleanDisplay(supplier.pa_system_present),
      },
      {
        label: "PA System Audible All Areas",
        value: getBooleanDisplay(supplier.pa_system_audible_all_areas),
      },
    ],
    emergencyExits: [
      {
        label: "Two Exits per Floor",
        value: getBooleanDisplay(supplier.emergency_exits_two_per_floor),
      },
      {
        label: "Workers Trained on Evacuation",
        value: getBooleanDisplay(supplier.emergency_exits_trained_workers),
      },
    ],
    grievanceAdditional: [
      {
        label: "Grievance Committee Established",
        value: getBooleanDisplay(supplier.grievance_committee_established),
      },
      {
        label: "Complain Box Installed",
        value: getBooleanDisplay(supplier.grievance_complain_box_installed),
      },
    ],
    wetProcess: [
      {
        label: "Wet Process Unit Exists",
        value: getBooleanDisplay(supplier.wet_process_unit_exists),
      },
      {
        label: "Environmental Licenses",
        value: getBooleanDisplay(supplier.wet_process_environmental_licenses),
      },
      {
        label: "Wastewater Treatment Plant",
        value: getBooleanDisplay(
          supplier.wet_process_wastewater_treatment_plant,
        ),
      },
      {
        label: "WTP Functional",
        value: getBooleanDisplay(supplier.wet_process_wtp_functional),
      },
      {
        label: "Valid Test Report",
        value: getBooleanDisplay(supplier.wet_process_valid_test_report),
      },
      {
        label: "Parameters Within Limits",
        value: getBooleanDisplay(supplier.wet_process_parameters_within_limits),
      },
      {
        label: "pH Within Limits",
        value: getBooleanDisplay(supplier.wet_process_ph_within_limits),
      },
      {
        label: "TDS Within Limits",
        value: getBooleanDisplay(supplier.wet_process_tds_within_limits),
      },
      {
        label: "BOD Within Limits",
        value: getBooleanDisplay(supplier.wet_process_bod_within_limits),
      },
      {
        label: "COD Within Limits",
        value: getBooleanDisplay(supplier.wet_process_cod_within_limits),
      },
      {
        label: "DO Within Limits",
        value: getBooleanDisplay(supplier.wet_process_do_within_limits),
      },
      {
        label: "TSS Within Limits",
        value: getBooleanDisplay(supplier.wet_process_tss_within_limits),
      },
    ],
    harassment: [
      {
        label: "No Physical Harassment",
        value: getBooleanDisplay(supplier.no_physical_harassment),
      },
      {
        label: "No Sexual Harassment",
        value: getBooleanDisplay(supplier.no_sexual_harassment),
      },
      {
        label: "No Psychological Harassment",
        value: getBooleanDisplay(supplier.no_psychological_harassment),
      },
      {
        label: "No Verbal Harassment",
        value: getBooleanDisplay(supplier.no_verbal_harassment),
      },
    ],
    firstVisit: [
      {
        label: "First Visit Date",
        value: formatDate(supplier.first_visit_date),
      },
      {
        label: "First Visit Status",
        value: supplier.first_visit_status,
      },
      {
        label: "First Visit Findings",
        value: supplier.first_visit_findings,
      },
      {
        label: "First Visit Completed",
        value: getBooleanDisplay(supplier.first_visit_completed),
      },
    ],
    safetyDocuments: [
      {
        label: "Safety Training Frequency",
        value: supplier.safety_training_frequency,
      },
      {
        label: "Last Safety Audit Date",
        value: formatDate(supplier.last_safety_audit_date),
      },
      {
        label: "Safety Measures Remarks",
        value: supplier.safety_measures_remarks,
      },
    ],
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading supplier details...</p>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorContent}>
          <span style={styles.errorIcon}>⚠️</span>
          <h2 style={styles.errorTitle}>Supplier Not Found</h2>
          <p style={styles.errorMessage}>
            {error || "The supplier does not exist."}
          </p>
          <div style={styles.errorActions}>
            <button onClick={() => navigate(-1)} style={styles.backButton}>
              ← Go Back
            </button>
            <button onClick={fetchSupplierDetails} style={styles.retryButton}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const expiringItems = getExpiringItems();
  const notificationItems = expiringItems.filter((item) =>
    NOTIFICATION_DAYS.includes(item.days_remaining),
  );
  const notificationCount = notificationItems.length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.breadcrumb}>
          <Link to="/csr-dashboard" style={styles.breadcrumbLink}>
            Dashboard
          </Link>
          <span style={styles.separator}>/</span>
          <Link to="/suppliersCSR" style={styles.breadcrumbLink}>
            Suppliers
          </Link>
          <span style={styles.separator}>/</span>
          <span style={styles.breadcrumbCurrent}>
            {supplier.supplier_name || "Details"}
          </span>
        </div>

        <div style={styles.headerActions}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            ← Back
          </button>
          <button
            onClick={() => navigate(`/edit-supplier/${id}`)}
            style={styles.editButton}
          >
            ✏️ Edit
          </button>

          <button
            onClick={() => setShowNotificationModal(true)}
            style={{
              ...styles.notifyButton,
              ...(notificationCount > 0 ? styles.notifyButtonActive : {}),
            }}
            disabled={!supplier.email || supplier.email.trim() === ""}
            title={
              !supplier.email || supplier.email.trim() === ""
                ? "Supplier has no email address"
                : notificationCount > 0
                  ? `${notificationCount} item(s) at notification days (${NOTIFICATION_DAYS.join(", ")})`
                  : "No items at notification days"
            }
          >
            📧 Send Notifications
            {notificationCount > 0 && (
              <span style={styles.notifyBadge}>{notificationCount}</span>
            )}
          </button>

          <button onClick={fetchSupplierDetails} style={styles.refreshButton}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Supplier Profile Card */}
      {/* Supplier Profile Card */}
      <div style={styles.profileCard}>
        <div style={styles.profileLeft}>
          <div style={styles.avatar}>
            {supplier.image ? (
              <img
                src={getCorrectFileUrl(supplier.image)}
                alt={supplier.supplier_name || "Supplier"}
                style={styles.avatarImage}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML =
                    supplier.supplier_name?.charAt(0) || "S";
                }}
              />
            ) : (
              supplier.supplier_name?.charAt(0) || "S"
            )}
          </div>
          <div style={styles.profileInfo}>
            <h1 style={styles.supplierName}>
              {supplier.supplier_name || "Unnamed Supplier"}
              <span style={styles.supplierId}>
                ID: {supplier.supplier_id || "N/A"}
              </span>
            </h1>
            <div style={styles.profileMeta}>
              <span style={styles.metaItem}>
                <span style={styles.metaIcon}>📁</span>
                {supplier.supplier_category || "Category N/A"}
              </span>
              <span style={styles.metaDot}>•</span>
              <span style={styles.metaItem}>
                <span style={styles.metaIcon}>📅</span>
                Est. {supplier.year_of_establishment || "N/A"}
              </span>
              <span style={styles.metaDot}>•</span>
              <span style={styles.metaItem}>
                <span style={styles.metaIcon}>📍</span>
                {supplier.location || "Location N/A"}
              </span>
            </div>
            <div style={styles.contactInfo}>
              {supplier.email && (
                <span
                  style={styles.contactItem}
                  onClick={() => copyToClipboard(supplier.email, "email")}
                >
                  <span style={styles.contactIcon}>✉️</span>
                  {supplier.email}
                  {copiedField === "email" && (
                    <span style={styles.copiedTip}>Copied!</span>
                  )}
                </span>
              )}
              {supplier.phone && (
                <span
                  style={styles.contactItem}
                  onClick={() => copyToClipboard(supplier.phone, "phone")}
                >
                  <span style={styles.contactIcon}>📞</span>
                  {supplier.phone}
                  {copiedField === "phone" && (
                    <span style={styles.copiedTip}>Copied!</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={styles.profileRight}>
          <StatusBadge status={supplier.compliance_status} size="large" />
          <div style={styles.certStatus}>
            <span style={styles.certLabel}>Certification:</span>
            <span
              style={{
                ...styles.certValue,
                backgroundColor: supplier.is_certification_valid
                  ? colors.successLight
                  : colors.dangerLight,
                color: supplier.is_certification_valid
                  ? colors.success
                  : colors.danger,
              }}
            >
              {supplier.is_certification_valid ? "Valid" : "Invalid/Expired"}
            </span>
          </div>
        </div>
      </div>

      {/* Expiry Summary Cards */}
      {expiringItems.filter((item) =>
        NOTIFICATION_DAYS.includes(item.days_remaining),
      ).length > 0 && (
        <div style={styles.expirySection}>
          <div style={styles.sectionTitle}>
            <span style={styles.titleIcon}>⚠️</span>
            <h2 style={styles.sectionTitleText}>
              Items Requiring Attention (
              {
                expiringItems.filter((item) =>
                  NOTIFICATION_DAYS.includes(item.days_remaining),
                ).length
              }
              )
            </h2>
          </div>
          <div style={styles.expiryGrid}>
            {expiringItems
              .filter((item) => NOTIFICATION_DAYS.includes(item.days_remaining))
              .slice(0, 5)
              .map((item, idx) => (
                <div key={idx} style={styles.expiryCard}>
                  <div style={styles.expiryHeader}>
                    <span style={styles.expiryIcon}>
                      {item.icon || (item.type === "cert" ? "📜" : "📋")}
                    </span>
                    <span style={styles.expiryName}>{item.name}</span>
                  </div>
                  <div style={styles.expiryBody}>
                    <DaysRemainingBadge days={item.days_remaining} />
                    {item.expiry_date && (
                      <span style={styles.expiryDate}>
                        {formatDate(item.expiry_date)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            {expiringItems.filter((item) =>
              NOTIFICATION_DAYS.includes(item.days_remaining),
            ).length > 5 && (
              <div style={styles.moreCard}>
                +
                {expiringItems.filter((item) =>
                  NOTIFICATION_DAYS.includes(item.days_remaining),
                ).length - 5}{" "}
                more items
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabs}>
          {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "details", label: "Details", icon: "🏢" },
            { id: "certifications", label: "Certifications", icon: "📜" },
            { id: "licenses", label: "Licenses", icon: "📋" },
            { id: "compliance", label: "Compliance", icon: "✅" },
            { id: "safety", label: "Safety", icon: "🚨" },
            { id: "environment", label: "Environment", icon: "🌱" },
            { id: "rsc audit", label: "RSC Audit", icon: "🔍" },
            { id: "osh", label: "OSH Committee", icon: "🛡️" },
            { id: "checklist", label: "Checklist", icon: "📋" },
            { id: "documents", label: "Documents", icon: "📎" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.activeTab : {}),
              }}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {/* Overview Tab - Same as before, keep existing */}
        {activeTab === "overview" && (
          <div style={styles.overview}>
            <InfoCard title="Basic Information" icon="🏢" colSpan={2}>
              <div style={styles.twoColumn}>
                {groupedData.basic
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow
                      key={idx}
                      label={item.label}
                      value={item.value}
                      copyable={item.copyable}
                      fieldName={item.field}
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                  ))}
              </div>
            </InfoCard>

            <InfoCard title="Contact Information" icon="📞">
              <div style={styles.verticalList}>
                {groupedData.contacts
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow
                      key={idx}
                      label={item.label}
                      value={item.value}
                      copyable={item.copyable}
                      fieldName={item.field}
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                  ))}
              </div>
            </InfoCard>

            <InfoCard title="Building & Manpower" icon="🏭" colSpan={2}>
              <div style={styles.sectionGroup}>
                <div style={styles.groupHeader}>
                  <span style={styles.groupIcon}>🏗️</span>
                  <h4 style={styles.groupHeaderText}>Building Details</h4>
                </div>
                <div style={styles.twoColumn}>
                  {groupedData.building
                    .filter((item) => item.value)
                    .map((item, idx) => (
                      <InfoRow
                        key={idx}
                        label={item.label}
                        value={item.value}
                      />
                    ))}
                </div>
              </div>
              <div style={styles.sectionGroup}>
                <div style={styles.groupHeader}>
                  <span style={styles.groupIcon}>👥</span>
                  <h4 style={styles.groupHeaderText}>Manpower Details</h4>
                </div>
                <div style={styles.twoColumn}>
                  {groupedData.manpower
                    .filter((item) => item.value)
                    .map((item, idx) => (
                      <InfoRow
                        key={idx}
                        label={item.label}
                        value={item.value}
                      />
                    ))}
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Production Overview" icon="⚙️">
              <div style={styles.verticalList}>
                {groupedData.production
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>
          </div>
        )}

        {/* Details Tab - Keep existing */}
        {activeTab === "details" && (
          <div style={styles.details}>
            <InfoCard title="General Information" icon="🏢">
              <div style={styles.twoColumn}>
                {groupedData.basic
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow
                      key={idx}
                      label={item.label}
                      value={item.value}
                      copyable={item.copyable}
                      fieldName={item.field}
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                  ))}
              </div>
            </InfoCard>

            <InfoCard title="Contact Details" icon="📞">
              <div style={styles.twoColumn}>
                {groupedData.contacts
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow
                      key={idx}
                      label={item.label}
                      value={item.value}
                      copyable={item.copyable}
                      fieldName={item.field}
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                  ))}
              </div>
            </InfoCard>

            <InfoCard title="Building Details" icon="🏭">
              <div style={styles.twoColumn}>
                {groupedData.building
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            <InfoCard title="Manpower Details" icon="👥">
              <div style={styles.twoColumn}>
                {groupedData.manpower
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            <InfoCard title="Production Details" icon="⚙️" colSpan={2}>
              <div style={styles.twoColumn}>
                {groupedData.production
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>
          </div>
        )}

        {/* Certifications Tab - Keep existing */}
        {activeTab === "certifications" && (
          <div style={styles.certificationsGrid}>
            {groupedData.certifications.map(
              (cert, idx) =>
                cert.validity && (
                  <div key={idx} style={styles.certCard}>
                    <div style={styles.certHeader}>
                      <span style={styles.certIcon}>📜</span>
                      <h3 style={styles.certName}>{cert.name}</h3>
                      {cert.status && (
                        <StatusBadge status={cert.status} size="small" />
                      )}
                    </div>
                    <div style={styles.certBody}>
                      {cert.rating && (
                        <div style={styles.certRow}>
                          <span style={styles.certLabel}>Rating:</span>
                          <span style={styles.certValue}>{cert.rating}</span>
                        </div>
                      )}
                      {cert.validity && (
                        <div style={styles.certRow}>
                          <span style={styles.certLabel}>Valid Until:</span>
                          <span style={styles.certValue}>
                            {formatDate(cert.validity)}
                          </span>
                        </div>
                      )}
                      {cert.days && (
                        <div style={styles.certRow}>
                          <span style={styles.certLabel}>Days Left:</span>
                          <DaysRemainingBadge days={cert.days} />
                        </div>
                      )}
                    </div>
                  </div>
                ),
            )}
            {supplier.certification_remarks && (
              <InfoCard title="Remarks" icon="💬" colSpan={2}>
                <p style={styles.remarks}>{supplier.certification_remarks}</p>
              </InfoCard>
            )}
          </div>
        )}

        {/* Licenses Tab - Keep existing */}
        {activeTab === "licenses" && (
          <div style={styles.licensesGrid}>
            {groupedData.licenses.map(
              (license, idx) =>
                license.validity && (
                  <div key={idx} style={styles.licenseCard}>
                    <div style={styles.licenseHeader}>
                      <span style={styles.licenseIcon}>📋</span>
                      <h3 style={styles.licenseName}>{license.name}</h3>
                    </div>
                    <div style={styles.licenseBody}>
                      {license.boilerNo && (
                        <div style={styles.licenseRow}>
                          <span style={styles.licenseLabel}>Boiler No:</span>
                          <span style={styles.licenseValue}>
                            {license.boilerNo}
                          </span>
                        </div>
                      )}
                      <div style={styles.licenseRow}>
                        <span style={styles.licenseLabel}>Valid Until:</span>
                        <span style={styles.licenseValue}>
                          {formatDate(license.validity)}
                        </span>
                      </div>
                      {license.days && (
                        <div style={styles.licenseRow}>
                          <span style={styles.licenseLabel}>Days Left:</span>
                          <DaysRemainingBadge days={license.days} />
                        </div>
                      )}
                    </div>
                  </div>
                ),
            )}
            {supplier.license_remarks && (
              <InfoCard title="Remarks" icon="💬" colSpan={2}>
                <p style={styles.remarks}>{supplier.license_remarks}</p>
              </InfoCard>
            )}
          </div>
        )}

        {/* Compliance Tab - Keep existing */}
        {activeTab === "compliance" && (
          <div style={styles.complianceGrid}>
            <InfoCard title="Compliance Status" icon="✅">
              <div style={styles.verticalList}>
                {groupedData.compliance.map((item, idx) =>
                  item.value ? (
                    item.badge ? (
                      <div key={idx} style={styles.infoRow}>
                        <span style={styles.infoLabel}>{item.label}:</span>
                        <StatusBadge status={item.value} size="small" />
                      </div>
                    ) : (
                      <InfoRow
                        key={idx}
                        label={item.label}
                        value={item.value}
                      />
                    )
                  ) : null,
                )}
              </div>
            </InfoCard>

            <InfoCard title="Grievance Management" icon="⚖️">
              <div style={styles.verticalList}>
                {groupedData.grievance
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            <InfoCard title="Committee Meetings" icon="👥">
              <div style={styles.verticalList}>
                {groupedData.committee
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            <InfoCard title="CSR Activities" icon="🤝">
              <div style={styles.twoColumn}>
                {groupedData.csr
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>
          </div>
        )}

        {/* Safety Tab - Keep existing */}
        {activeTab === "safety" && (
          <div style={styles.safetyGrid}>
            <InfoCard title="Fire Safety" icon="🔥" colSpan={2}>
              <div style={styles.twoColumn}>
                {groupedData.fireSafety
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>
          </div>
        )}

        {/* Environment Tab - Keep existing */}
        {activeTab === "environment" && (
          <div style={styles.environmentGrid}>
            <InfoCard title="Environmental Data" icon="🌱" colSpan={2}>
              <div style={styles.twoColumn}>
                {groupedData.environmental
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>
          </div>
        )}
        {/* {RSC AUDIT} */}
        {activeTab === "rsc audit" && (
          <div style={styles.environmentGrid}>
            <InfoCard title="RSC Audit" icon="🔍" colSpan={2}>
              <div style={styles.twoColumn}>
                {groupedData.rsc
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>
          </div>
        )}

        {/* OSH Committee Tab - Keep existing */}
        {activeTab === "osh" && (
          <div style={styles.oshGrid}>
            <InfoCard title="OSH Committee Information" icon="🛡️" colSpan={2}>
              <div style={styles.twoColumn}>
                <InfoRow
                  label="OSH Committee Formed"
                  value={getBooleanDisplay(supplier.osh_committee_safety)}
                />
                <InfoRow
                  label="OSH Safety Policy"
                  value={getBooleanDisplay(supplier.osh_safety_policy)}
                />
                <InfoRow
                  label="ISO 45001 Validity"
                  value={formatDate(supplier.iso_45001_validity)}
                />
                {supplier.iso_45001_validity_days_remaining && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>
                      ISO 45001 Days Remaining:
                    </span>
                    <DaysRemainingBadge
                      days={supplier.iso_45001_validity_days_remaining}
                    />
                  </div>
                )}
              </div>
            </InfoCard>

            {supplier.osh_file && (
              <InfoCard title="OSH Document" icon="📄">
                <DocumentGrid
                  documents={[
                    {
                      name: "OSH Committee Document",
                      url: supplier.osh_file,
                    },
                  ]}
                />
              </InfoCard>
            )}
          </div>
        )}

        {/* Checklist Tab - NEW with all compliance checklist fields */}
        {activeTab === "checklist" && (
          <div style={styles.checklistGrid}>
            {/* Zero Tolerance Section */}
            <InfoCard title="Zero Tolerance Policy" icon="⚠️" colSpan={2}>
              <div style={styles.twoColumn}>
                {groupedData.zeroTolerance
                  .filter((item) => item.value !== "Not specified")
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            {/* Fire Fighting Equipment */}
            <InfoCard title="Fire Fighting Equipment" icon="🧯">
              <div style={styles.verticalList}>
                {groupedData.fireEquipment
                  .filter((item) => item.value !== "Not specified")
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            {/* Fire Alarm System */}
            <InfoCard title="Fire Alarm System" icon="🚨">
              <div style={styles.verticalList}>
                {groupedData.fireAlarm
                  .filter((item) => item.value !== "Not specified")
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            {/* Emergency Lights */}
            <InfoCard title="Emergency Lights" icon="💡">
              <div style={styles.verticalList}>
                {groupedData.emergencyLights
                  .filter((item) => item.value !== "Not specified")
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            {/* Drinking Water */}
            <InfoCard title="Drinking Water" icon="💧" colSpan={2}>
              <div style={styles.twoColumn}>
                {groupedData.drinkingWater
                  .filter((item) => item.value !== "Not specified")
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            {/* Public Announce System */}
            <InfoCard title="Public Announce System" icon="📢">
              <div style={styles.verticalList}>
                {groupedData.paSystem
                  .filter((item) => item.value !== "Not specified")
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            {/* Emergency Exits */}
            <InfoCard title="Emergency Exits" icon="🚪">
              <div style={styles.verticalList}>
                {groupedData.emergencyExits
                  .filter((item) => item.value !== "Not specified")
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            {/* Grievance Mechanism Additional */}
            <InfoCard title="Grievance Mechanism" icon="⚖️">
              <div style={styles.verticalList}>
                {groupedData.grievanceAdditional
                  .filter((item) => item.value !== "Not specified")
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            {/* Wet Process Unit */}
            <InfoCard title="Wet Process Unit" icon="💧" colSpan={2}>
              <div style={styles.twoColumn}>
                {groupedData.wetProcess
                  .filter((item) => item.value !== "Not specified")
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            {/* Harassment Prevention */}
            <InfoCard title="Harassment Prevention" icon="🛡️">
              <div style={styles.verticalList}>
                {groupedData.harassment
                  .filter((item) => item.value !== "Not specified")
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            {/* First Visit Checklist */}
            <InfoCard title="First Visit Checklist" icon="📝" colSpan={2}>
              <div style={styles.twoColumn}>
                {groupedData.firstVisit
                  .filter((item) => item.value !== "Not specified")
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>
          </div>
        )}

        {/* Documents Tab - Keep existing */}
        {activeTab === "documents" && (
          <div style={styles.documentsTab}>
            <InfoCard title="All Documents" icon="📎">
              <DocumentGrid documents={supplier.all_certificates || []} />
            </InfoCard>

            {supplier.building_images &&
              supplier.building_images.length > 0 && (
                <InfoCard title="Building Images" icon="🏭">
                  <ImageGallery
                    images={supplier.building_images}
                    title="Building Images"
                  />
                </InfoCard>
              )}

            {supplier.fire_images && supplier.fire_images.length > 0 && (
              <InfoCard title="Fire Safety Images" icon="🔥">
                <ImageGallery
                  images={supplier.fire_images}
                  title="Fire Safety Images"
                />
              </InfoCard>
            )}
          </div>
        )}
      </div>

      {/* Notification Modal - Keep existing */}
      {showNotificationModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "600px" }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Send Expiry Notifications</h3>
              <button
                onClick={() => {
                  setShowNotificationModal(false);
                  setNotificationResult(null);
                  setSelectedItems({});
                  setCustomMessage("");
                }}
                style={styles.modalClose}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {notificationResult ? (
                <div
                  style={
                    notificationResult.success
                      ? styles.successMessage
                      : styles.errorMessage
                  }
                >
                  <p>{notificationResult.message}</p>
                  {notificationResult.details &&
                    notificationResult.details.length > 0 && (
                      <div style={styles.notificationDetails}>
                        <h4>Sent Notifications:</h4>
                        <ul>
                          {notificationResult.details.map((item, idx) => (
                            <li key={idx}>
                              <strong>{item.name}</strong> -{" "}
                              {item.days_remaining} days remaining
                              {item.expiry_date &&
                                ` (Expires: ${item.expiry_date})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  <button
                    onClick={() => {
                      setShowNotificationModal(false);
                      setNotificationResult(null);
                    }}
                    style={styles.modalButton}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div style={styles.modalInfo}>
                    <p>
                      <strong>Supplier:</strong> {supplier.supplier_name}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {supplier.email || "No email provided"}
                    </p>
                    <p>
                      <strong>From:</strong> compliance@texweave.net
                    </p>
                    <p>
                      <strong>Notification Days:</strong>{" "}
                      {NOTIFICATION_DAYS.join(", ")} days before expiry
                    </p>
                  </div>

                  {!supplier.email ? (
                    <div style={styles.warningMessage}>
                      ⚠️ This supplier does not have an email address. Cannot
                      send notifications.
                    </div>
                  ) : (
                    <>
                      <div style={styles.messageInput}>
                        <label style={styles.messageLabel}>
                          Custom Message (Optional):
                        </label>
                        <textarea
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          style={styles.messageTextarea}
                          placeholder="Add a custom message to include in the email..."
                          rows="3"
                        />
                      </div>

                      <h4 style={styles.modalSubtitle}>
                        Select items to notify (only items at{" "}
                        {NOTIFICATION_DAYS.join(", ")} days shown):
                      </h4>

                      {["certification", "license"].map((category) => {
                        const categoryItems = getExpiringItems().filter(
                          (item) =>
                            item.category === category &&
                            NOTIFICATION_DAYS.includes(item.days_remaining),
                        );
                        if (categoryItems.length === 0) return null;

                        const categoryNames = {
                          certification: "📜 Certifications",
                          license: "📋 Licenses",
                        };

                        return (
                          <div key={category} style={styles.categorySection}>
                            <h5 style={styles.categorySectionTitle}>
                              {categoryNames[category]}
                            </h5>
                            {categoryItems.map((item) => (
                              <label key={item.id} style={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={selectedItems[item.id] || false}
                                  onChange={(e) =>
                                    setSelectedItems({
                                      ...selectedItems,
                                      [item.id]: e.target.checked,
                                    })
                                  }
                                  style={styles.checkbox}
                                />
                                <div style={styles.checkboxContent}>
                                  <div style={styles.itemHeader}>
                                    <span style={styles.itemIcon}>
                                      {item.icon}
                                    </span>
                                    <span style={styles.certName}>
                                      {item.name}
                                    </span>
                                    <span
                                      style={{
                                        ...styles.daysBadge,
                                        backgroundColor: getDaysRemainingColor(
                                          item.days_remaining,
                                        ).bg,
                                        color: getDaysRemainingColor(
                                          item.days_remaining,
                                        ).color,
                                      }}
                                    >
                                      {item.days_remaining} days
                                    </span>
                                  </div>
                                  <div style={styles.itemDetails}>
                                    {item.expiry_date && (
                                      <span style={styles.itemExpiry}>
                                        Expires:{" "}
                                        {new Date(
                                          item.expiry_date,
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                    {item.status && (
                                      <span style={styles.itemStatus}>
                                        Status: {item.status}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        );
                      })}

                      {notificationItems.length === 0 && (
                        <div style={styles.infoMessage}>
                          ℹ️ No items are at notification days (
                          {NOTIFICATION_DAYS.join(", ")} days remaining). Check
                          back later for reminders.
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {!notificationResult && supplier.email && (
              <div style={styles.modalFooter}>
                <button
                  onClick={() => {
                    setShowNotificationModal(false);
                    setSelectedItems({});
                    setCustomMessage("");
                  }}
                  style={styles.modalSecondaryButton}
                >
                  Cancel
                </button>
                <button
                  onClick={sendExpiryNotifications}
                  disabled={
                    sendingNotifications ||
                    Object.values(selectedItems).filter((v) => v).length === 0
                  }
                  style={{
                    ...styles.modalPrimaryButton,
                    ...(sendingNotifications ? styles.modalButtonDisabled : {}),
                  }}
                >
                  {sendingNotifications ? "Sending..." : "Send Notifications"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={styles.footer}>
        <button onClick={() => navigate(-1)} style={styles.footerButton}>
          ← Back to List
        </button>
        <button
          onClick={() => navigate(`/edit-supplier/${id}`)}
          style={styles.footerButtonPrimary}
        >
          ✏️ Edit Supplier
        </button>
        <button onClick={fetchSupplierDetails} style={styles.footerButton}>
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    padding: "2rem 3rem",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.875rem",
    color: colors.textSecondary,
  },
  breadcrumbLink: {
    color: colors.primary,
    textDecoration: "none",
    cursor: "pointer",
  },
  separator: { color: colors.border },
  breadcrumbCurrent: { color: colors.textPrimary, fontWeight: "500" },
  headerActions: { display: "flex", gap: "0.75rem", flexWrap: "wrap" },
  backButton: {
    padding: "0.5rem 1rem",
    backgroundColor: colors.gray,
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.2s",
  },
  editButton: {
    padding: "0.5rem 1rem",
    backgroundColor: colors.primary,
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.2s",
  },
  notifyButton: {
    padding: "0.5rem 1rem",
    backgroundColor: colors.gray,
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.2s",
    position: "relative",
  },
  notifyButtonActive: {
    backgroundColor: colors.warning,
  },
  notifyBadge: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    backgroundColor: colors.danger,
    color: "white",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
  refreshButton: {
    padding: "0.5rem 1rem",
    backgroundColor: colors.success,
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.2s",
  },
  profileCard: {
    backgroundColor: colors.background,
    borderRadius: "16px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    border: `1px solid ${colors.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "2rem",
  },
  profileLeft: { display: "flex", alignItems: "center", gap: "2rem", flex: 1 },
  avatar: {
    width: "100px",
    height: "100px",
    borderRadius: "12px",
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.purple} 100%)`,
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2.5rem",
    fontWeight: "600",
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "12px",
  },
  profileInfo: { flex: 1 },
  supplierName: {
    fontSize: "2rem",
    fontWeight: "700",
    color: colors.textPrimary,
    margin: "0 0 0.75rem 0",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
  },
  supplierId: {
    fontSize: "1rem",
    color: colors.textSecondary,
    fontWeight: "normal",
  },
  profileMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
    marginBottom: "1rem",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    fontSize: "0.875rem",
    color: colors.textSecondary,
  },
  metaIcon: { fontSize: "1rem" },
  metaDot: { color: colors.border },
  contactInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.875rem",
    color: colors.textPrimary,
    cursor: "pointer",
    padding: "0.375rem 0.75rem",
    backgroundColor: colors.cardBg,
    borderRadius: "20px",
    border: `1px solid ${colors.border}`,
    transition: "all 0.2s",
    position: "relative",
  },
  contactIcon: { fontSize: "1rem" },
  copiedTip: {
    position: "absolute",
    top: "-25px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: colors.success,
    color: "white",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    whiteSpace: "nowrap",
  },
  profileRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "1rem",
  },
  certStatus: { display: "flex", alignItems: "center", gap: "0.5rem" },
  certLabel: { fontSize: "0.875rem", color: colors.textSecondary },
  certValue: {
    fontSize: "0.875rem",
    fontWeight: "600",
    padding: "0.375rem 1rem",
    borderRadius: "20px",
  },
  expirySection: {
    backgroundColor: colors.background,
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "2rem",
    border: `1px solid ${colors.border}`,
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.5rem",
  },
  sectionTitleText: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: colors.textPrimary,
    margin: 0,
  },
  titleIcon: { fontSize: "1.25rem" },
  expiryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },
  expiryCard: {
    backgroundColor: colors.cardBg,
    borderRadius: "10px",
    padding: "1rem",
    border: `1px solid ${colors.border}`,
  },
  expiryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.75rem",
  },
  expiryIcon: { fontSize: "1.125rem" },
  expiryName: {
    fontWeight: "500",
    fontSize: "0.875rem",
    color: colors.textPrimary,
  },
  expiryBody: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  expiryDate: { fontSize: "0.75rem", color: colors.textSecondary },
  moreCard: {
    backgroundColor: colors.grayLight,
    borderRadius: "10px",
    padding: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.875rem",
    color: colors.textSecondary,
    border: `1px dashed ${colors.border}`,
  },
  tabsContainer: {
    backgroundColor: colors.background,
    borderRadius: "12px 12px 0 0",
    borderBottom: `1px solid ${colors.border}`,
    overflowX: "auto",
  },
  tabs: {
    display: "flex",
    padding: "0 1rem",
    gap: "0.25rem",
  },
  tab: {
    padding: "1rem 1.5rem",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: colors.textSecondary,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
    position: "relative",
  },
  activeTab: {
    color: colors.primary,
    fontWeight: "600",
    borderBottom: `2px solid ${colors.primary}`,
  },
  tabIcon: { fontSize: "1rem" },
  tabContent: {
    backgroundColor: colors.background,
    borderRadius: "0 0 12px 12px",
    padding: "2rem",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  },
  overview: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1.5rem",
  },
  details: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
  },
  infoCard: {
    backgroundColor: colors.cardBg,
    borderRadius: "12px",
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
  },
  cardHeader: {
    padding: "1rem 1.5rem",
    backgroundColor: colors.background,
    borderBottom: `1px solid ${colors.border}`,
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  cardIcon: { fontSize: "1.25rem" },
  cardTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: colors.textPrimary,
    margin: 0,
  },
  cardBody: { padding: "1.5rem" },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    padding: "0.375rem 0",
    borderBottom: `1px dashed ${colors.border}`,
  },
  infoLabel: {
    fontSize: "0.875rem",
    color: colors.textSecondary,
    fontWeight: "500",
    minWidth: "120px",
  },
  infoValueContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    justifyContent: "flex-end",
  },
  infoValue: {
    fontSize: "0.875rem",
    color: colors.textPrimary,
    fontWeight: "500",
    wordBreak: "break-word",
  },
  copyButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    color: colors.textSecondary,
    padding: "0.25rem",
    borderRadius: "4px",
    transition: "all 0.2s",
  },
  statusBadge: {
    display: "inline-block",
    borderRadius: "20px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.025em",
  },
  daysBadge: {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "600",
  },
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "0.75rem 1.5rem",
  },
  verticalList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  sectionGroup: {
    marginBottom: "1.5rem",
  },
  groupHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  groupHeaderText: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: colors.textPrimary,
    margin: 0,
  },
  groupIcon: { fontSize: "1rem", color: colors.textSecondary },
  certificationsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  certCard: {
    backgroundColor: colors.cardBg,
    borderRadius: "10px",
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
  },
  certHeader: {
    padding: "1rem",
    backgroundColor: colors.background,
    borderBottom: `1px solid ${colors.border}`,
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  certIcon: { fontSize: "1.125rem" },
  certName: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: colors.textPrimary,
    margin: 0,
    flex: 1,
  },
  certBody: { padding: "1rem" },
  certRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.375rem 0",
    borderBottom: `1px dashed ${colors.border}`,
  },
  licenseCard: {
    backgroundColor: colors.cardBg,
    borderRadius: "10px",
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
  },
  licenseHeader: {
    padding: "1rem",
    backgroundColor: colors.background,
    borderBottom: `1px solid ${colors.border}`,
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  licenseIcon: { fontSize: "1.125rem" },
  licenseName: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: colors.textPrimary,
    margin: 0,
  },
  licenseBody: { padding: "1rem" },
  licenseRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.375rem 0",
    borderBottom: `1px dashed ${colors.border}`,
  },
  licenseLabel: { fontSize: "0.75rem", color: colors.textSecondary },
  licenseValue: {
    fontSize: "0.75rem",
    fontWeight: "500",
    color: colors.textPrimary,
  },
  complianceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
  },
  safetyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
  },
  environmentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
  },
  oshGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
  },
  documentsTab: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1.5rem",
  },
  documentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "1rem",
  },
  documentCard: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem",
    backgroundColor: colors.cardBg,
    borderRadius: "8px",
    border: `1px solid ${colors.border}`,
    transition: "all 0.2s",
  },
  docIcon: { fontSize: "1.5rem", color: colors.primary },
  docInfo: { flex: 1, minWidth: 0 },
  docName: {
    fontSize: "0.875rem",
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: "0.25rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  docLink: {
    fontSize: "0.75rem",
    color: colors.primary,
    textDecoration: "none",
    cursor: "pointer",
  },
  noDocuments: {
    textAlign: "center",
    padding: "3rem",
    color: colors.textSecondary,
  },
  noDocsIcon: {
    fontSize: "3rem",
    color: colors.border,
    marginBottom: "1rem",
    display: "block",
  },
  remarks: {
    fontSize: "0.875rem",
    color: colors.textPrimary,
    lineHeight: 1.6,
    margin: 0,
  },

  // Image Gallery Styles
  imageGallery: {
    marginTop: "0.5rem",
  },
  galleryTitle: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: "1rem",
  },
  galleryImageContainer: {
    position: "relative",
    cursor: "pointer",
    borderRadius: "8px",
    overflow: "hidden",
    border: `1px solid ${colors.border}`,
    transition: "transform 0.2s, boxShadow 0.2s",
    aspectRatio: "4/3",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "1rem",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    color: "white",
    padding: "4px",
    fontSize: "0.7rem",
    textAlign: "center",
    opacity: 0,
    transition: "opacity 0.2s",
    pointerEvents: "none",
  },
  imageOverlayText: {
    display: "block",
  },
  fallbackContainer: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.grayLight,
  },
  fallbackSvg: {
    width: "100%",
    height: "100%",
    display: "block",
  },

  footer: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    marginTop: "2rem",
    paddingTop: "2rem",
    borderTop: `1px solid ${colors.border}`,
  },
  footerButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "transparent",
    color: colors.textSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  footerButtonPrimary: {
    padding: "0.75rem 1.5rem",
    backgroundColor: colors.primary,
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s",
  },

  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    padding: "1.5rem",
    borderBottom: `1px solid ${colors.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: colors.textPrimary,
    margin: 0,
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: "1.25rem",
    cursor: "pointer",
    color: colors.textSecondary,
    padding: "0.5rem",
  },
  modalBody: {
    padding: "1.5rem",
  },
  modalFooter: {
    padding: "1.5rem",
    borderTop: `1px solid ${colors.border}`,
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
  },
  modalInfo: {
    backgroundColor: colors.cardBg,
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
  },
  modalSubtitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: "1rem",
  },
  messageInput: {
    marginBottom: "1.5rem",
  },
  messageLabel: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: colors.textSecondary,
    marginBottom: "0.5rem",
  },
  messageTextarea: {
    width: "100%",
    padding: "0.75rem",
    border: `1px solid ${colors.border}`,
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontFamily: "inherit",
    resize: "vertical",
  },
  categorySection: {
    marginBottom: "1.5rem",
  },
  categorySectionTitle: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: "0.75rem",
    paddingBottom: "0.25rem",
    borderBottom: `1px solid ${colors.border}`,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
    padding: "1rem",
    backgroundColor: colors.cardBg,
    borderRadius: "8px",
    marginBottom: "0.75rem",
    cursor: "pointer",
    border: `1px solid ${colors.border}`,
    transition: "all 0.2s",
  },
  checkbox: {
    marginTop: "0.25rem",
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  checkboxContent: {
    flex: 1,
  },
  itemHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.5rem",
    flexWrap: "wrap",
  },
  itemIcon: {
    fontSize: "1.25rem",
  },
  itemDetails: {
    display: "flex",
    gap: "1rem",
    fontSize: "0.75rem",
    color: colors.textSecondary,
    flexWrap: "wrap",
  },
  itemExpiry: {
    backgroundColor: colors.grayLight,
    padding: "0.125rem 0.5rem",
    borderRadius: "4px",
  },
  itemStatus: {
    backgroundColor: colors.grayLight,
    padding: "0.125rem 0.5rem",
    borderRadius: "4px",
  },
  successMessage: {
    backgroundColor: colors.successLight,
    color: colors.success,
    padding: "1rem",
    borderRadius: "8px",
    border: `1px solid ${colors.success}`,
    textAlign: "center",
  },
  errorMessage: {
    backgroundColor: colors.dangerLight,
    color: colors.danger,
    padding: "1rem",
    borderRadius: "8px",
    border: `1px solid ${colors.danger}`,
    textAlign: "center",
  },
  warningMessage: {
    backgroundColor: colors.warningLight,
    color: colors.warning,
    padding: "1rem",
    borderRadius: "8px",
    border: `1px solid ${colors.warning}`,
    textAlign: "center",
  },
  infoMessage: {
    backgroundColor: colors.infoLight,
    color: colors.info,
    padding: "1rem",
    borderRadius: "8px",
    border: `1px solid ${colors.info}`,
    textAlign: "center",
  },
  notificationDetails: {
    marginTop: "1rem",
    textAlign: "left",
    fontSize: "0.875rem",
  },
  modalButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: colors.primary,
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    marginTop: "1rem",
  },
  modalPrimaryButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: colors.warning,
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  modalSecondaryButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: colors.gray,
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  modalButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
  },
  loadingSpinner: {
    width: "50px",
    height: "50px",
    border: `4px solid ${colors.grayLight}`,
    borderTopColor: colors.primary,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "1rem",
    color: colors.textSecondary,
    fontSize: "0.875rem",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
  },
  errorContent: { textAlign: "center", maxWidth: "400px" },
  errorIcon: {
    fontSize: "3rem",
    color: colors.danger,
    marginBottom: "1rem",
    display: "block",
  },
  errorTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: colors.textPrimary,
    margin: "0 0 0.5rem 0",
  },
  errorActions: { display: "flex", gap: "1rem", justifyContent: "center" },
  retryButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: colors.gray,
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
  },

  checklistGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .gallery-image-container:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  .gallery-image-container:hover .image-overlay {
    opacity: 1 !important;
  }
`;
document.head.appendChild(styleSheet);

export default SupplierDetailsCSR;
