// SupplierDetailsCSR.jsx - Complete Version with Path Cleaning
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { styles, SUPPLIER_DETAILS_CSS, colors } from "./supplierDetailsTheme";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowLeft,
  FiAward,
  FiBell,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiCopy,
  FiDownload,
  FiDroplet,
  FiEdit2,
  FiExternalLink,
  FiFileText,
  FiFolder,
  FiImage,
  FiInbox,
  FiLink,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiPaperclip,
  FiPhone,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiSettings,
  FiShield,
  FiSun,
  FiUsers,
  FiVolume2,
  FiX,
  FiZap,
} from "react-icons/fi";
import { FaBalanceScale, FaFireExtinguisher, FaHandshake, FaIndustry, FaLeaf, FaDoorOpen, FaFire, FaBuilding } from "react-icons/fa";
import { getSupplierById, exportSupplierToExcel } from "../../api/supplierApi";


// The page's data (tabs, cards, expiry items) still names icons with emoji;
// they are drawn as line icons here so the page matches the rest of TAD.
const EMOJI_ICONS = {
  "📊": FiActivity,
  "🏢": FaBuilding,
  "🔗": FiLink,
  "📜": FiAward,
  "📋": FiClipboard,
  "✅": FiCheckCircle,
  "🚨": FiBell,
  "🌱": FaLeaf,
  "🔍": FiSearch,
  "🛡️": FiShield,
  "🛡": FiShield,
  "📎": FiPaperclip,
  "📞": FiPhone,
  "🏭": FaIndustry,
  "👥": FiUsers,
  "⚙️": FiSettings,
  "⚙": FiSettings,
  "💬": FiMessageSquare,
  "⚖️": FaBalanceScale,
  "⚖": FaBalanceScale,
  "🤝": FaHandshake,
  "🔥": FaFire,
  "📄": FiFileText,
  "⚠️": FiAlertTriangle,
  "⚠": FiAlertTriangle,
  "🧯": FaFireExtinguisher,
  "💡": FiSun,
  "💧": FiDroplet,
  "📢": FiVolume2,
  "🚪": FaDoorOpen,
  "📝": FiEdit2,
  "📂": FiFolder,
  "📁": FiFolder,
  "🚒": FiZap,
  "🏗️": FaBuilding,
  "🏗": FaBuilding,
  "🖼️": FiImage,
  "🖼": FiImage,
  "📭": FiInbox,
  "📅": FiCalendar,
  "📍": FiMapPin,
  "✉️": FiMail,
  "✉": FiMail,
};

// Placeholder for the image preview when the file can't be loaded.
const getFallbackImageDataUrl = () =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">' +
      '<rect width="480" height="320" rx="16" fill="#f1f5f9"/>' +
      '<text x="240" y="168" font-family="Segoe UI, Arial" font-size="18" fill="#64748b" text-anchor="middle">Image not available</text>' +
      "</svg>",
  );

const EmojiIcon = ({ e }) => {
  const Icon = EMOJI_ICONS[e];
  return Icon ? <Icon aria-hidden="true" /> : e || null;
};

// ==================== FIXED: extractCleanPath Helper ====================
const extractCleanPath = (url) => {
  if (!url) return '';
  
  let cleanPath = url;
  
  // If it's a full URL with the backend, extract just the path
  if (cleanPath.includes('119.148.51.38:8000') || cleanPath.startsWith('http')) {
    try {
      const urlObj = new URL(cleanPath);
      cleanPath = urlObj.pathname;
    } catch (e) {
      const mediaIndex = cleanPath.indexOf('/media/');
      if (mediaIndex !== -1) {
        cleanPath = cleanPath.substring(mediaIndex + 1);
      } else {
        const docIndex = cleanPath.search(/supplier_documents|building_images|fire_safety_images/);
        if (docIndex !== -1) {
          cleanPath = cleanPath.substring(docIndex);
        }
      }
    }
  }
  
  // Remove duplicate /media/ prefixes
  cleanPath = cleanPath.replace(/^\/media\/+/, '');
  cleanPath = cleanPath.replace(/\/media\/media\//g, '/media/');
  cleanPath = cleanPath.replace(/media\/media\//g, 'media/');
  cleanPath = cleanPath.replace(/^\/+/g, '');
  
  // Remove any http:// leftovers
  cleanPath = cleanPath.replace(/^https?:\/\/[^/]+\//, '');
  
  // If it still contains http, try to extract the actual path
  if (cleanPath.includes('http')) {
    const match = cleanPath.match(/(?:supplier_documents|building_images|fire_safety_images)\/.*/);
    if (match) {
      cleanPath = match[0];
    } else {
      // Try to find anything that looks like a file path
      const parts = cleanPath.split('/');
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].includes('.') || parts[i] === 'supplier_documents' || parts[i] === 'building_images' || parts[i] === 'fire_safety_images') {
          cleanPath = parts.slice(i).join('/');
          break;
        }
      }
    }
  }
  
  // Remove any trailing slashes
  cleanPath = cleanPath.replace(/\/+$/, '');
  
  // Remove any remaining media/ prefix
  cleanPath = cleanPath.replace(/^media\//, '');
  
  // If it's empty or just a slash, return empty
  if (!cleanPath || cleanPath === '/') return '';
  
  return cleanPath;
};

// ==================== FIXED: getCorrectFileUrl ====================
const getCorrectFileUrl = (url) => {
  if (!url) return null;

  const backendUrl = "http://119.148.51.38:8000";

  // First, clean the path to remove any corruption
  const cleanPath = extractCleanPath(url);
  if (!cleanPath) return null;

  // Build the full URL
  return `${backendUrl}/media/${cleanPath}`;
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
  if (!days && days !== 0) return { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
  if (days <= 30) return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
  if (days <= 90) return { bg: "#fffbeb", color: "#b45309", border: "#fde68a" };
  return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
};

const daysLabel = (days) => {
  if (days === null || days === undefined) return "No date";
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `${days} days left`;
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

const InfoCard = ({ title, icon, children, colSpan = 1 }) => (
  <div
    style={{
      ...styles.infoCard,
      gridColumn: colSpan > 1 ? `span ${colSpan}` : "auto",
    }}
  >
    <div style={styles.cardHeader}>
      <span style={styles.cardIcon}>
        <EmojiIcon e={icon} />
      </span>
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
            {copiedField === fieldName ? <FiCheck /> : <FiCopy />}
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
  const { bg, color, border } = getDaysRemainingColor(days);
  return (
    <span
      style={{
        ...styles.daysBadge,
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      {days !== null && days !== undefined && days <= 30 && <FiAlertTriangle aria-hidden="true" />}
      {daysLabel(days)}
    </span>
  );
};

// DocumentGrid Component
const DocumentGrid = ({ documents }) => {
  if (!documents || documents.length === 0) {
    return (
      <div style={styles.noDocuments}>
        <span style={styles.noDocsIcon}><EmojiIcon e="📂" /></span>
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
          <span style={styles.docIcon}>
            <FiFileText />
          </span>
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
                View document <FiExternalLink aria-hidden="true" />
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
  const [failedImages, setFailedImages] = useState({});
  if (!images || images.length === 0) return null;

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

// ==================== FIXED: MultiFileSection Component ====================
const MultiFileSection = ({ title, icon, files, emptyMessage = "No files uploaded" }) => {
  if (!files || files.length === 0) return null;

  const handleViewFile = (e, url) => {
    e.preventDefault();
    e.stopPropagation();
    const correctUrl = getCorrectFileUrl(url);
    window.open(correctUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={styles.multiFileSection}>
      <div style={styles.multiFileHeader}>
        <span style={styles.multiFileIcon}>
          <EmojiIcon e={icon} />
        </span>
        <h4 style={styles.multiFileTitle}>{title}</h4>
        <span style={styles.multiFileCount}>({files.length} files)</span>
      </div>
      <div style={styles.multiFileList}>
        {files.map((file, index) => {
          // Clean the path and extract filename
          const cleanPath = extractCleanPath(file);
          const fileName = cleanPath ? cleanPath.split('/').pop() : `File ${index + 1}`;
          const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
          const fileUrl = getCorrectFileUrl(file);
          
          return (
            <div key={index} style={styles.multiFileItem}>
              <span style={styles.multiFileItemIcon}>
                {isImage ? <FiImage /> : <FiFileText />}
              </span>
              <span style={styles.multiFileItemName}>{fileName}</span>
              <a
                href="#"
                onClick={(e) => handleViewFile(e, fileUrl)}
                style={styles.multiFileItemLink}
              >
                View
              </a>
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

  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

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

  const handleExportToExcel = async () => {
    try {
      const loadingToast = document.createElement("div");
      loadingToast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${colors.primary};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-family: 'Inter', sans-serif;
        font-size: 14px;
      `;
      loadingToast.innerHTML = "📊 Generating Excel file...";
      document.body.appendChild(loadingToast);

      const response = await exportSupplierToExcel(id);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `Supplier_${supplier?.supplier_id || id}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      loadingToast.remove();

      const successToast = document.createElement("div");
      successToast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${colors.success};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-family: 'Inter', sans-serif;
        font-size: 14px;
      `;
      successToast.innerHTML = "✅ Excel file downloaded successfully!";
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);
    } catch (error) {
      console.error("Error exporting to Excel:", error);

      const existingToast = document.querySelector('[data-toast="loading"]');
      if (existingToast) existingToast.remove();

      const errorToast = document.createElement("div");
      errorToast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${colors.danger};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-family: 'Inter', sans-serif;
        font-size: 14px;
      `;
      errorToast.innerHTML =
        "❌ Failed to export Excel file. Please try again.";
      document.body.appendChild(errorToast);
      setTimeout(() => errorToast.remove(), 3000);
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
    const notificationItems = allItems.filter(
      (item) =>
        item.days_remaining <= 90 ||
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


      const response = await fetch(
        `http://119.148.51.38:8000/api/csr/api/supplier/${id}/send-expiry-notifications/`,
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

  // Build grouped data for display
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
      { label: "Head Office Address", value: supplier.location },
      { label: "Factory Location", value: supplier.location_factory },
      { label: "Bank Account", value: supplier.bank_account },
      { label: "Bank Branch", value: supplier.bank_branch },
      { label: "Bank BIN", value: supplier.bank_bin },
      { label: "Bank Branch Address", value: supplier.bank_branch_address },
      { label: "Bank Swift Code", value: supplier.bank_swift_code },
      { label: "Weekly Holiday", value: supplier.weekly_holiday },
      { label: "BGMEA Number", value: supplier.bgmea_number },
      { label: "BKMEA Number", value: supplier.bkmea_number },
      { label: "RSC", value: supplier.rsc },
      { label: "Order Status", value: supplier.tad_group_order_status },
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
    supplyChain: [
      { label: "Tier 2 Factories", value: supplier.tier2_suppliers },
      { label: "Tier 3 Factories", value: supplier.tier3_suppliers },
    ],
    certifications: [
      {
        name: "BSCI",
        days: supplier.bsci_validity_days_remaining,
        validity: supplier.bsci_validity,
        status: supplier.bsci_status,
        rating: supplier.bsci_rating,
        lastAudit: supplier.bsci_last_audit_date,
      },
      {
        name: "SEDEX",
        days: supplier.sedex_validity_days_remaining,
        validity: supplier.sedex_validity,
        status: supplier.sedex_status,
        rating: supplier.sedex_rating,
        lastAudit: supplier.sedex_last_audit_date,
      },
      {
        name: "WRAP",
        days: supplier.wrap_validity_days_remaining,
        validity: supplier.wrap_validity,
        status: supplier.wrap_status,
        rating: supplier.wrap_rating,
        lastAudit: supplier.wrap_last_audit_date,
      },
      {
        name: "CTPAT",
        days: supplier.security_audit_validity_days_remaining,
        validity: supplier.security_audit_validity,
        status: supplier.security_audit_status,
        lastAudit: supplier.security_audit_last_date,
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
        label: "Fire Door Count",
        value: supplier.fire_door,
      },
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
        label: "OHS Committee Formed",
        value: getBooleanDisplay(supplier.osh_committee_safety),
      },
      {
        label: "OHS Safety Policy",
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
        label: "Grievance Policy Developed",
        value: getBooleanDisplay(supplier.grievance_policy_developed),
      },
      {
        label: "Workers Aware of Procedure",
        value: getBooleanDisplay(supplier.grievance_workers_aware),
      },
      {
        label: "Grievance Committee Established",
        value: getBooleanDisplay(supplier.grievance_committee_established),
      },
      {
        label: "Complain Box Installed",
        value: getBooleanDisplay(supplier.grievance_complain_box_installed),
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
        label: "ZDHC Enrollment Status",
        value: getBooleanDisplay(supplier.zdhc_enrollment_status),
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
      { label: "CO2 Report", value: formatDate(supplier.co2_report) },
      { label: "Solar Energy", value: formatDate(supplier.solar_energy) },
      { label: "Green Energy", value: formatDate(supplier.green_energy) },
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
        findings: supplier.zero_tolerance_walkthrough_findings,
      },
      {
        label: "No Underage Workers",
        value: getBooleanDisplay(supplier.zero_tolerance_no_underage_workers),
        findings: supplier.zero_tolerance_no_underage_findings,
      },
      {
        label: "No Suspected Young Workers",
        value: getBooleanDisplay(
          supplier.zero_tolerance_no_suspected_young_workers,
        ),
        findings: supplier.zero_tolerance_no_suspected_young_findings,
      },
      {
        label: "Minimum Wage Guaranteed",
        value: getBooleanDisplay(
          supplier.zero_tolerance_minimum_wage_guaranteed,
        ),
        findings: supplier.zero_tolerance_minimum_wage_findings,
      },
      {
        label: "Authentic Records",
        value: getBooleanDisplay(supplier.zero_tolerance_authentic_records),
        findings: supplier.zero_tolerance_authentic_records_findings,
      },
      {
        label: "No Forced Labor",
        value: getBooleanDisplay(supplier.zero_tolerance_no_forced_labor),
        findings: supplier.zero_tolerance_no_forced_labor_findings,
      },
    ],
    fireEquipment: [
      {
        label: "Sufficient Fire Fighting Equipment",
        value: getBooleanDisplay(supplier.fire_fighting_equipment_sufficient),
        findings: supplier.fire_fighting_equipment_sufficient_findings,
      },
      {
        label: "Trained Fire Fighters",
        value: getBooleanDisplay(supplier.fire_fighting_trained_personnel),
        findings: supplier.fire_fighting_trained_personnel_findings,
      },
      {
        label: "Fire Hose System",
        value: getBooleanDisplay(supplier.fire_fighting_hose_system),
        findings: supplier.fire_fighting_hose_system_findings,
      },
    ],
    fireAlarm: [
      {
        label: "Fire Alarm System Present",
        value: getBooleanDisplay(supplier.fire_alarm_system_present),
        findings: supplier.fire_alarm_system_present_findings,
      },
      {
        label: "Fire Alarm Audible All Areas",
        value: getBooleanDisplay(supplier.fire_alarm_audible_all_areas),
        findings: supplier.fire_alarm_audible_all_areas_findings,
      },
      {
        label: "Visual Fire Alarm",
        value: getBooleanDisplay(supplier.fire_alarm_visual_noisy_areas),
        findings: supplier.fire_alarm_visual_noisy_areas_findings,
      },
      {
        label: "Fire Alarm IPS Backup",
        value: getBooleanDisplay(supplier.fire_alarm_ips_backup),
        findings: supplier.fire_alarm_ips_backup_findings,
      },
      {
        label: "Smoke Detectors",
        value: getBooleanDisplay(supplier.fire_alarm_smoke_detectors),
        findings: supplier.fire_alarm_smoke_detectors_findings,
      },
      {
        label: "Marked Fire Alarm Switches",
        value: getBooleanDisplay(supplier.fire_alarm_switches_marked),
        findings: supplier.fire_alarm_switches_marked_findings,
      },
    ],
    emergencyLights: [
      {
        label: "Emergency Lights Installed",
        value: getBooleanDisplay(supplier.emergency_lights_installed),
        findings: supplier.emergency_lights_installed_findings,
      },
      {
        label: "Emergency Lights IPS Backup",
        value: getBooleanDisplay(supplier.emergency_lights_ips_backup),
        findings: supplier.emergency_lights_ips_backup_findings,
      },
    ],
    drinkingWater: [
      {
        label: "Sufficient Drinking Water",
        value: getBooleanDisplay(supplier.drinking_water_sufficient),
        findings: supplier.drinking_water_sufficient_findings,
      },
      {
        label: "Valid Water Test Report",
        value: getBooleanDisplay(supplier.drinking_water_test_report_valid),
        findings: supplier.drinking_water_test_report_valid_findings,
      },
      {
        label: "Parameters Acceptable",
        value: getBooleanDisplay(supplier.drinking_water_parameters_acceptable),
        findings: supplier.drinking_water_parameters_acceptable_findings,
      },
      {
        label: "Arsenic Within Limits",
        value: getBooleanDisplay(supplier.drinking_water_arsenic_limit),
        findings: supplier.drinking_water_arsenic_limit_findings,
      },
    ],
    paSystem: [
      {
        label: "PA System Present",
        value: getBooleanDisplay(supplier.pa_system_present),
        findings: supplier.pa_system_present_findings,
      },
      {
        label: "PA System Audible All Areas",
        value: getBooleanDisplay(supplier.pa_system_audible_all_areas),
        findings: supplier.pa_system_audible_all_areas_findings,
      },
    ],
    emergencyExits: [
      {
        label: "Two Exits per Floor",
        value: getBooleanDisplay(supplier.emergency_exits_two_per_floor),
        findings: supplier.emergency_exits_two_per_floor_findings,
      },
      {
        label: "Workers Trained on Evacuation",
        value: getBooleanDisplay(supplier.emergency_exits_trained_workers),
        findings: supplier.emergency_exits_trained_workers_findings,
      },
    ],
    wetProcess: [
      {
        label: "Wet Process Unit Exists",
        value: getBooleanDisplay(supplier.wet_process_unit_exists),
        findings: supplier.wet_process_unit_exists_findings,
      },
      {
        label: "Environmental Licenses",
        value: getBooleanDisplay(supplier.wet_process_environmental_licenses),
        findings: supplier.wet_process_environmental_licenses_findings,
      },
      {
        label: "Wastewater Treatment Plant",
        value: getBooleanDisplay(
          supplier.wet_process_wastewater_treatment_plant,
        ),
        findings: supplier.wet_process_wastewater_treatment_plant_findings,
      },
      {
        label: "WTP Functional",
        value: getBooleanDisplay(supplier.wet_process_wtp_functional),
        findings: supplier.wet_process_wtp_functional_findings,
      },
      {
        label: "Valid Test Report",
        value: getBooleanDisplay(supplier.wet_process_valid_test_report),
        findings: supplier.wet_process_valid_test_report_findings,
      },
      {
        label: "Parameters Within Limits",
        value: getBooleanDisplay(supplier.wet_process_parameters_within_limits),
        findings: supplier.wet_process_parameters_within_limits_findings,
      },
      {
        label: "pH Within Limits",
        value: getBooleanDisplay(supplier.wet_process_ph_within_limits),
        findings: supplier.wet_process_ph_within_limits_findings,
      },
    ],
    harassment: [
      {
        label: "No Physical Harassment",
        value: getBooleanDisplay(supplier.no_physical_harassment),
        findings: supplier.no_physical_harassment_findings,
      },
      {
        label: "No Sexual Harassment",
        value: getBooleanDisplay(supplier.no_sexual_harassment),
        findings: supplier.no_sexual_harassment_findings,
      },
      {
        label: "No Psychological Harassment",
        value: getBooleanDisplay(supplier.no_psychological_harassment),
        findings: supplier.no_psychological_harassment_findings,
      },
      {
        label: "No Verbal Harassment",
        value: getBooleanDisplay(supplier.no_verbal_harassment),
        findings: supplier.no_verbal_harassment_findings,
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
    // Additional documents with multiple files - using the URL fields
    additionalDocuments: {
      doc1: supplier.additional_document_1_urls || supplier.additional_document_1 || [],
      doc2: supplier.additional_document_2_urls || supplier.additional_document_2 || [],
      doc3: supplier.additional_document_3_urls || supplier.additional_document_3 || [],
      doc4: supplier.additional_document_4_urls || supplier.additional_document_4 || [],
    },
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
          <span style={styles.errorIcon}><EmojiIcon e="⚠️" /></span>
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
  // Same rule as the Send Notifications modal: expired or at a reminder day.
  const attentionItems = expiringItems.filter(
    (item) => item.days_remaining <= 0 || NOTIFICATION_DAYS.includes(item.days_remaining),
  );
  const notificationItems = expiringItems.filter((item) =>
    NOTIFICATION_DAYS.includes(item.days_remaining),
  );
  const notificationCount = notificationItems.length;

  const renderChainSupplyList = (suppliers, title, icon) => {
    let suppliersList = [];

    if (suppliers && Array.isArray(suppliers)) {
      suppliersList = suppliers;
    } else if (suppliers && typeof suppliers === "object") {
      suppliersList = suppliers.results || suppliers.data || [];
    }

    if (!suppliersList || suppliersList.length === 0) {
      return (
        <div style={styles.emptySupplyState}>
          <span style={styles.emptySupplyIcon}><EmojiIcon e="📭" /></span>
          <p>No {title.toLowerCase()} associated</p>
        </div>
      );
    }

    return (
      <div style={styles.chainSupplyList}>
        {suppliersList.map((item, index) => (
          <div key={item.id || index} style={styles.chainSupplyCard}>
            <div style={styles.chainSupplyHeader}>
              <span style={styles.chainSupplyIcon}>
                <EmojiIcon e={icon} />
              </span>
              <div style={styles.chainSupplyName}>
                {item.name || `Supplier ${index + 1}`}
              </div>
            </div>
            <div style={styles.chainSupplyBody}>
              {item.contract_number && (
                <div style={styles.chainSupplyDetail}>
                  <span style={styles.detailLabel}>Contact No:</span>
                  <span style={styles.detailValue}>{item.contract_number}</span>
                </div>
              )}
              {item.address && (
                <div style={styles.chainSupplyDetail}>
                  <span style={styles.detailLabel}>Address:</span>
                  <span style={styles.detailValue}>{item.address}</span>
                </div>
              )}
              {!item.contract_number && !item.address && (
                <div style={styles.chainSupplyDetail}>
                  <span style={styles.detailLabel}>Details:</span>
                  <span style={styles.detailValue}>
                    No additional information available
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.container} className="csr-sd">
      <style>{SUPPLIER_DETAILS_CSS}</style>
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
          <button onClick={() => navigate(-1)} style={styles.backButton} className="sd-btn">
            <FiArrowLeft /> Back
          </button>
          <button onClick={fetchSupplierDetails} style={styles.refreshButton} className="sd-btn" title="Reload">
            <FiRefreshCw /> Refresh
          </button>
          <button
            onClick={handleExportToExcel}
            style={styles.excelButton}
            className="sd-btn"
            title="Export to Excel"
          >
            <FiDownload /> Export Excel
          </button>
          <button
            onClick={() => setShowNotificationModal(true)}
            className="sd-btn"
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
            <FiMail /> Send Notifications
            {notificationCount > 0 && (
              <span style={styles.notifyBadge}>{notificationCount}</span>
            )}
          </button>
          <button
            onClick={() => navigate(`/edit-supplier/${id}`)}
            style={styles.editButton}
            className="sd-btn sd-btn-primary"
          >
            <FiEdit2 /> Edit
          </button>
        </div>
      </div>

      {/* Supplier Profile Card */}
      <div style={styles.profileCard}>
        <div style={styles.profileLeft}>
          <div style={styles.avatar}>
            {supplier.image ? (
              <img
                src={getCorrectFileUrl(supplier.image)}
                alt={supplier.supplier_name || "Supplier"}
                style={styles.avatarImage}
                onClick={() => {
                  setPreviewImageUrl(getCorrectFileUrl(supplier.image));
                  setShowImagePreview(true);
                }}
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
              {supplier.supplier_id && (
                <span style={styles.supplierId}>ID {supplier.supplier_id}</span>
              )}
            </h1>
            <div style={styles.profileMeta}>
              <span style={styles.metaItem}>
                <span style={styles.metaIcon}><EmojiIcon e="📁" /></span>
                {supplier.supplier_category || "Category N/A"}
              </span>
              <span style={styles.metaDot}>•</span>
              <span style={styles.metaItem}>
                <span style={styles.metaIcon}><EmojiIcon e="📅" /></span>
                Est. {supplier.year_of_establishment || "N/A"}
              </span>
              <span style={styles.metaDot}>•</span>
              <span style={styles.metaItem}>
                <span style={styles.metaIcon}><EmojiIcon e="📍" /></span>
                {supplier.location || "Location N/A"}
              </span>
            </div>
            <div style={styles.contactInfo}>
              {supplier.email && (
                <span
                  style={styles.contactItem}
                  onClick={() => copyToClipboard(supplier.email, "email")}
                >
                  <span style={styles.contactIcon}><EmojiIcon e="✉️" /></span>
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
                  <span style={styles.contactIcon}><EmojiIcon e="📞" /></span>
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

      {/* Expiry Summary Cards - same items the notification modal offers */}
      {attentionItems.length > 0 && (
        <div style={styles.expirySection}>
          <div style={styles.sectionTitle}>
            <span style={styles.titleIcon}>
              <FiAlertTriangle />
            </span>
            <h2 style={styles.sectionTitleText}>
              Items Requiring Attention
              <span className="sd-count">{attentionItems.length}</span>
            </h2>
            <span style={styles.sectionHint}>
              Expired, or at a reminder milestone ({NOTIFICATION_DAYS.join(", ")} days)
            </span>
          </div>
          <div style={styles.expiryGrid}>
            {attentionItems.slice(0, 6).map((item) => {
              const tone = getDaysRemainingColor(item.days_remaining);
              return (
                <div
                  key={item.id}
                  style={{ ...styles.expiryCard, borderLeft: `3px solid ${tone.color}` }}
                >
                  <div style={styles.expiryHeader}>
                    <span style={{ ...styles.expiryIcon, color: tone.color, background: tone.bg }}>
                      <EmojiIcon e={item.icon || (item.category === "certification" ? "📜" : "📋")} />
                    </span>
                    <span style={styles.expiryName}>{item.name}</span>
                  </div>
                  <div style={styles.expiryBody}>
                    <DaysRemainingBadge days={item.days_remaining} />
                    {item.expiry_date && (
                      <span style={styles.expiryDate}>
                        <FiCalendar aria-hidden="true" /> {formatDate(item.expiry_date)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {attentionItems.length > 6 && (
              <div
                style={styles.moreCard}
                title={attentionItems
                  .slice(6)
                  .map((i) => `${i.name} (${daysLabel(i.days_remaining)})`)
                  .join("\n")}
              >
                +{attentionItems.length - 6} more items
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
            { id: "supplyChain", label: "Supply Chain", icon: "🔗" },
            { id: "certifications", label: "Certifications", icon: "📜" },
            { id: "licenses", label: "Licenses", icon: "📋" },
            { id: "compliance", label: "Compliance", icon: "✅" },
            { id: "safety", label: "Safety", icon: "🚨" },
            { id: "environment", label: "Environment", icon: "🌱" },
            { id: "rsc", label: "RSC Audit", icon: "🔍" },
            { id: "osh", label: "OHS Committee", icon: "🛡️" },
            { id: "checklist", label: "Factory Evaluation", icon: "📋" },
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
              <span style={styles.tabIcon}>
                <EmojiIcon e={tab.icon} />
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div style={styles.overview} className="sd-grid">
            <InfoCard title="Basic Information" icon="🏢" colSpan={2}>
              <div style={styles.twoColumn} className="sd-two">
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
                  <span style={styles.groupIcon}><EmojiIcon e="🏗️" /></span>
                  <h4 style={styles.groupHeaderText}>Building Details</h4>
                </div>
                <div style={styles.twoColumn} className="sd-two">
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
                  <span style={styles.groupIcon}><EmojiIcon e="👥" /></span>
                  <h4 style={styles.groupHeaderText}>Manpower Details</h4>
                </div>
                <div style={styles.twoColumn} className="sd-two">
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

        {/* Details Tab */}
        {activeTab === "details" && (
          <div style={styles.details} className="sd-grid">
            <InfoCard title="General Information" icon="🏢">
              <div style={styles.twoColumn} className="sd-two">
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
              <div style={styles.twoColumn} className="sd-two">
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
              <div style={styles.twoColumn} className="sd-two">
                {groupedData.building
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            <InfoCard title="Manpower Details" icon="👥">
              <div style={styles.twoColumn} className="sd-two">
                {groupedData.manpower
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            <InfoCard title="Production Details" icon="⚙️" colSpan={2}>
              <div style={styles.twoColumn} className="sd-two">
                {groupedData.production
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>
          </div>
        )}

        {/* Supply Chain Tab */}
        {activeTab === "supplyChain" && (
          <div style={styles.supplyChainGrid} className="sd-grid">
            <InfoCard title="Tier 2 Factories" icon="🏭">
              <div style={styles.verticalList}>
                <div style={styles.supplyChainDescription}>
                  Washing, printing, embroidery, accessories factories
                </div>
                {renderChainSupplyList(
                  supplier.tier2_suppliers_detail ||
                    supplier.tier2_suppliers ||
                    [],
                  "Tier 2 Factories",
                  "🏭",
                )}
              </div>
            </InfoCard>

            <InfoCard title="Tier 3 Factories" icon="🔗">
              <div style={styles.verticalList}>
                <div style={styles.supplyChainDescription}>
                  Fabric / Yarn suppliers (local & international)
                </div>
                {renderChainSupplyList(
                  supplier.tier3_suppliers_detail ||
                    supplier.tier3_suppliers ||
                    [],
                  "Tier 3 Suppliers",
                  "🔗",
                )}
              </div>
            </InfoCard>
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === "certifications" && (
          <div style={styles.certificationsGrid}>
            {groupedData.certifications.map(
              (cert, idx) =>
                cert.validity && (
                  <div key={idx} style={styles.certCard}>
                    <div style={styles.certHeader}>
                      <span style={styles.certIcon}><EmojiIcon e="📜" /></span>
                      <h3 style={styles.certName}>{cert.name}</h3>
                      {cert.status && (
                        <StatusBadge status={cert.status} size="small" />
                      )}
                    </div>
                    <div style={styles.certBody}>
                      {cert.lastAudit && (
                        <div style={styles.certRow}>
                          <span style={styles.certLabel}>Last Audit:</span>
                          <span style={styles.certValue}>
                            {formatDate(cert.lastAudit)}
                          </span>
                        </div>
                      )}
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

        {/* Licenses Tab */}
        {activeTab === "licenses" && (
          <div style={styles.licensesGrid}>
            {groupedData.licenses.map(
              (license, idx) =>
                license.validity && (
                  <div key={idx} style={styles.licenseCard}>
                    <div style={styles.licenseHeader}>
                      <span style={styles.licenseIcon}><EmojiIcon e="📋" /></span>
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

        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <div style={styles.complianceGrid} className="sd-grid">
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
              <div style={styles.twoColumn} className="sd-two">
                {groupedData.csr
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>
          </div>
        )}

        {/* Safety Tab */}
        {activeTab === "safety" && (
          <div style={styles.safetyGrid} className="sd-grid">
            <InfoCard title="Fire Safety" icon="🔥" colSpan={2}>
              <div style={styles.twoColumn} className="sd-two">
                {groupedData.fireSafety
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>
          </div>
        )}

        {/* Environment Tab */}
        {activeTab === "environment" && (
          <div style={styles.environmentGrid} className="sd-grid">
            <InfoCard title="Environmental Data" icon="🌱" colSpan={2}>
              <div style={styles.twoColumn} className="sd-two">
                {groupedData.environmental
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>
          </div>
        )}

        {/* RSC Audit Tab */}
        {activeTab === "rsc" && (
          <div style={styles.environmentGrid} className="sd-grid">
            <InfoCard title="RSC Audit" icon="🔍" colSpan={2}>
              <div style={styles.twoColumn} className="sd-two">
                {groupedData.rsc
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>
          </div>
        )}

        {/* OSH Committee Tab */}
        {activeTab === "osh" && (
          <div style={styles.oshGrid} className="sd-grid">
            <InfoCard title="OHS Committee Information" icon="🛡️" colSpan={2}>
              <div style={styles.twoColumn} className="sd-two">
                {groupedData.osh
                  .filter((item) => item.value)
                  .map((item, idx) => (
                    <InfoRow key={idx} label={item.label} value={item.value} />
                  ))}
              </div>
            </InfoCard>

            {supplier.osh_file && (
              <InfoCard title="OHS Document" icon="📄">
                <DocumentGrid
                  documents={[
                    {
                      name: "OHS Committee Document",
                      url: supplier.osh_file,
                    },
                  ]}
                />
              </InfoCard>
            )}
          </div>
        )}

        {/* Checklist Tab */}
        {activeTab === "checklist" && (
          <div style={styles.checklistGrid} className="sd-grid">
            {/* Zero Tolerance Section */}
            <InfoCard title="Zero Tolerance Policy" icon="⚠️" colSpan={2}>
              {groupedData.zeroTolerance
                .filter((item) => item.value !== "Not specified")
                .map((item, idx) => (
                  <div key={idx}>
                    <InfoRow label={item.label} value={item.value} />
                    {item.findings && (
                      <div style={styles.findingsRow}>
                        <span style={styles.findingsLabel}>Findings:</span>
                        <span style={styles.findingsValue}>
                          {item.findings}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </InfoCard>

            {/* Fire Fighting Equipment */}
            <InfoCard title="Fire Fighting Equipment" icon="🧯">
              {groupedData.fireEquipment
                .filter((item) => item.value !== "Not specified")
                .map((item, idx) => (
                  <div key={idx}>
                    <InfoRow label={item.label} value={item.value} />
                    {item.findings && (
                      <div style={styles.findingsRow}>
                        <span style={styles.findingsLabel}>Findings:</span>
                        <span style={styles.findingsValue}>
                          {item.findings}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </InfoCard>

            {/* Fire Alarm System */}
            <InfoCard title="Fire Alarm System" icon="🚨">
              {groupedData.fireAlarm
                .filter((item) => item.value !== "Not specified")
                .map((item, idx) => (
                  <div key={idx}>
                    <InfoRow label={item.label} value={item.value} />
                    {item.findings && (
                      <div style={styles.findingsRow}>
                        <span style={styles.findingsLabel}>Findings:</span>
                        <span style={styles.findingsValue}>
                          {item.findings}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </InfoCard>

            {/* Emergency Lights */}
            <InfoCard title="Emergency Lights" icon="💡">
              {groupedData.emergencyLights
                .filter((item) => item.value !== "Not specified")
                .map((item, idx) => (
                  <div key={idx}>
                    <InfoRow label={item.label} value={item.value} />
                    {item.findings && (
                      <div style={styles.findingsRow}>
                        <span style={styles.findingsLabel}>Findings:</span>
                        <span style={styles.findingsValue}>
                          {item.findings}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </InfoCard>

            {/* Drinking Water */}
            <InfoCard title="Drinking Water" icon="💧" colSpan={2}>
              {groupedData.drinkingWater
                .filter((item) => item.value !== "Not specified")
                .map((item, idx) => (
                  <div key={idx}>
                    <InfoRow label={item.label} value={item.value} />
                    {item.findings && (
                      <div style={styles.findingsRow}>
                        <span style={styles.findingsLabel}>Findings:</span>
                        <span style={styles.findingsValue}>
                          {item.findings}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </InfoCard>

            {/* Public Announce System */}
            <InfoCard title="Public Announce System" icon="📢">
              {groupedData.paSystem
                .filter((item) => item.value !== "Not specified")
                .map((item, idx) => (
                  <div key={idx}>
                    <InfoRow label={item.label} value={item.value} />
                    {item.findings && (
                      <div style={styles.findingsRow}>
                        <span style={styles.findingsLabel}>Findings:</span>
                        <span style={styles.findingsValue}>
                          {item.findings}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </InfoCard>

            {/* Emergency Exits */}
            <InfoCard title="Emergency Exits" icon="🚪">
              {groupedData.emergencyExits
                .filter((item) => item.value !== "Not specified")
                .map((item, idx) => (
                  <div key={idx}>
                    <InfoRow label={item.label} value={item.value} />
                    {item.findings && (
                      <div style={styles.findingsRow}>
                        <span style={styles.findingsLabel}>Findings:</span>
                        <span style={styles.findingsValue}>
                          {item.findings}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </InfoCard>

            {/* Wet Process Unit */}
            <InfoCard title="Wet Process Unit" icon="💧" colSpan={2}>
              {groupedData.wetProcess
                .filter((item) => item.value !== "Not specified")
                .map((item, idx) => (
                  <div key={idx}>
                    <InfoRow label={item.label} value={item.value} />
                    {item.findings && (
                      <div style={styles.findingsRow}>
                        <span style={styles.findingsLabel}>Findings:</span>
                        <span style={styles.findingsValue}>
                          {item.findings}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </InfoCard>

            {/* Harassment Prevention */}
            <InfoCard title="Harassment Prevention" icon="🛡️">
              {groupedData.harassment
                .filter((item) => item.value !== "Not specified")
                .map((item, idx) => (
                  <div key={idx}>
                    <InfoRow label={item.label} value={item.value} />
                    {item.findings && (
                      <div style={styles.findingsRow}>
                        <span style={styles.findingsLabel}>Findings:</span>
                        <span style={styles.findingsValue}>
                          {item.findings}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </InfoCard>

            {/* First Visit Checklist */}
            <InfoCard title="First Visit Checklist" icon="📝" colSpan={2}>
              {groupedData.firstVisit
                .filter((item) => item.value !== "Not specified")
                .map((item, idx) => (
                  <InfoRow key={idx} label={item.label} value={item.value} />
                ))}
            </InfoCard>
          </div>
        )}

        {/* Documents Tab - Updated with MultiFileSection */}
        {activeTab === "documents" && (
          <div style={styles.documentsTab}>
            <InfoCard title="All Documents" icon="📎">
              <DocumentGrid documents={supplier.all_certificates || []} />
            </InfoCard>

            {/* Additional Documents with Multiple Files */}
            <InfoCard title="General Documents" icon="📂">
              {(() => {
                const docs = groupedData.additionalDocuments;
                const hasAnyDocs = docs.doc1.length > 0 || docs.doc2.length > 0 || docs.doc3.length > 0 || docs.doc4.length > 0;
                
                if (!hasAnyDocs) {
                  return (
                    <div style={styles.noDocuments}>
                      <span style={styles.noDocsIcon}><EmojiIcon e="📂" /></span>
                      <p>No additional documents uploaded</p>
                    </div>
                  );
                }

                return (
                  <div>
                    {docs.doc1.length > 0 && (
                      <MultiFileSection
                        title="Additional Document 1"
                        icon="📄"
                        files={docs.doc1}
                      />
                    )}
                    {docs.doc2.length > 0 && (
                      <MultiFileSection
                        title="Additional Document 2"
                        icon="📄"
                        files={docs.doc2}
                      />
                    )}
                    {docs.doc3.length > 0 && (
                      <MultiFileSection
                        title="Additional Document 3"
                        icon="📄"
                        files={docs.doc3}
                      />
                    )}
                    {docs.doc4.length > 0 && (
                      <MultiFileSection
                        title="Additional Document 4"
                        icon="📄"
                        files={docs.doc4}
                      />
                    )}
                  </div>
                );
              })()}
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
                <FiX />
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
                            (item.days_remaining <= 0 ||
                              NOTIFICATION_DAYS.includes(item.days_remaining)),
                        );
                        if (categoryItems.length === 0) return null;

                        const categoryNames = {
                          certification: "Certifications",
                          license: "Licenses",
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
                                      <EmojiIcon e={item.icon} />
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
          <FiArrowLeft /> Back to List
        </button>
        <button
          onClick={() => navigate(`/edit-supplier/${id}`)}
          style={styles.footerButtonPrimary}
        >
          <FiEdit2 /> Edit Supplier
        </button>
        <button onClick={fetchSupplierDetails} style={styles.footerButton}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && previewImageUrl && (
        <div
          style={styles.previewModalOverlay}
          onClick={() => setShowImagePreview(false)}
        >
          <div
            style={styles.previewModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={styles.previewModalClose}
              onClick={() => setShowImagePreview(false)}
            >
              <FiX />
            </button>
            <div style={styles.previewImageContainer}>
              <img
                src={previewImageUrl}
                alt="Building Preview"
                style={styles.previewImage}
                onError={(e) => {
                  e.target.src = getFallbackImageDataUrl();
                }}
              />
            </div>
            <div style={styles.previewActions}>
              <a href={previewImageUrl} download style={styles.downloadButton}>
                <FiSave /> Download
              </a>
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.openNewTabButton}
              >
                <FiExternalLink /> Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default SupplierDetailsCSR;