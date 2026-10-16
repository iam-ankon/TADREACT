// pages/orders/DetailOrder.jsx - With Courier Tab

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import {
  getOrderById,
  deleteOrder,
  exportOrderToExcel,
  getOrderFiles,
  deleteOrderFile,
  renameOrderFile,
  getBackendURL,
  getCourierBookingsByOrder,  // ADD THIS
  getTNAByOrder,
  patchOrder,
} from "../../api/merchandiser";
import Sidebar from "../merchandiser/Sidebar";
import SampleSection from "../merchandiser/SampleSection";
import OrderLabReports from "./OrderLabReports";
import { withDetailOrderTheme, baseStyles } from "./detailOrderTheme";
import { canViewOrderPricing, canViewOrderAttachments, canManageOrders, isMerchandiserProduction } from "../../utils/accessControl";
import OrderTNATab from "./OrderTNATab.jsx";
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaPrint,
  FaEnvelope,
  FaDownload,
  FaCheckCircle,
  FaTruck,
  FaHourglassHalf,
  FaBan,
  FaFileAlt,
  FaInfoCircle,
  FaClipboardList,
  FaCalendarAlt,
  FaDollarSign,
  FaBoxes,
  FaBuilding,
  FaUser,
  FaIndustry,
  FaShoppingCart,
  FaRuler,
  FaChartLine,
  FaFlask,
  FaClipboardCheck,
  FaComments,
  FaUsers,
  FaRegClock,
  FaCalendarCheck,
  FaExclamationTriangle,
  FaPalette,
  FaPaperclip,
  FaEdit as FaEditIcon,
  FaTimes,
  FaCheck,
  FaEye,
  FaPercent,
  FaCalendarWeek,
  FaShip,           // ADD FOR COURIER TAB
  FaBoxOpen,        // ADD FOR COURIER TAB
  FaMapMarkerAlt,   // ADD FOR COURIER TAB
  FaClock,          // ADD FOR COURIER TAB
  FaSearch,         // ADD FOR COURIER TAB
  FaExternalLinkAlt, // ADD FOR COURIER TAB
  FaImages,        // ADD FOR COURIER TAB
  FaFilePdf,       // ADD FOR COURIER TAB    
  FaImage,  
} from "react-icons/fa";

const statusConfig = {
  Running: {
    color: "#10b981",
    bg: "#d1fae5",
    icon: <FaCheckCircle />,
    label: "Running",
    border: "1px solid #10b981",
  },
  Shipped: {
    color: "#3b82f6",
    bg: "#dbeafe",
    icon: <FaTruck />,
    label: "Shipped",
    border: "1px solid #3b82f6",
  },
  Pending: {
    color: "#f59e0b",
    bg: "#fed7aa",
    icon: <FaHourglassHalf />,
    label: "Pending",
    border: "1px solid #f59e0b",
  },
  Cancelled: {
    color: "#ef4444",
    bg: "#fee2e2",
    icon: <FaBan />,
    label: "Cancelled",
    border: "1px solid #ef4444",
  },
  Draft: {
    color: "#6b7280",
    bg: "#f3f4f6",
    icon: <FaFileAlt />,
    label: "Draft",
    border: "1px solid #6b7280",
  },
};

const orderStatusOptions = [
  { value: "Running", label: "Running" },
  { value: "Active", label: "Active" },
  { value: "Shipped", label: "Shipped" },
  { value: "Pending", label: "Pending" },
  { value: "Cancelled", label: "Cancelled" },
];

// Mirrors Order.SEASON_CHOICES on the backend.
const SEASON_LABELS = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
  autumn_opening: "Autumn Opening",
  boost_aw: "Boost AW",
  boost_ss: "Boost SS",
  main_spring: "Main Spring",
  spring_opening: "Spring Opening",
};

// TNA progress stages - mirrors TNADetails.jsx's PROGRESS_STAGES /
// TNA.PROGRESS_WEIGHTS on the backend (must sum to 100).
const PROGRESS_STAGES = [
  { field: "lab_dip_status", label: "Lab Dip", weight: 10, color: "#8b5cf6" },
  { field: "fabric_status", label: "Fabric", weight: 40, color: "#3b82f6" },
  { field: "fit_sample_status", label: "Fit Sample", weight: 20, color: "#f59e0b" },
  { field: "pp_sample_status", label: "PP Sample", weight: 30, color: "#10b981" },
];

// Courier status config
const courierStatusConfig = {
  booked: { color: "#6b7280", bg: "#f3f4f6", label: "Booked", icon: <FaClock /> },
  in_transit: { color: "#3b82f6", bg: "#dbeafe", label: "In Transit", icon: <FaShip /> },
  delivered: { color: "#10b981", bg: "#d1fae5", label: "Delivered", icon: <FaCheckCircle /> },
  cancelled: { color: "#ef4444", bg: "#fee2e2", label: "Cancelled", icon: <FaBan /> },
};

// Helper function to get supplier display name from order data
const getSupplierDisplayName = (order) => {
  if (order.supplier_name && order.supplier_name !== "—") {
    return order.supplier_name;
  }
  if (order.supplier_display && order.supplier_display !== "—") {
    return order.supplier_display;
  }
  if (order.supplier) {
    if (typeof order.supplier === "object") {
      if (order.supplier.supplier_name) return order.supplier.supplier_name;
      if (order.supplier.name) return order.supplier.name;
      if (order.supplier.display_name) return order.supplier.display_name;
    } else if (typeof order.supplier === "string") {
      return order.supplier;
    }
  }
  return "—";
};

// Helper function to render delay badge with proper color coding
const renderDelayBadge = (delayDays, label) => {
  if (delayDays === null || delayDays === undefined || delayDays === "") {
    return "—";
  }

  const numDelay = Number(delayDays);
  let bgColor, textColor, suffix = "";

  if (numDelay > 0) {
    bgColor = "#fee2e2";
    textColor = "#10b981";
  } else {
    bgColor = "#d1fae5";
    textColor = "#ef4444";
  }

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "12px",
        fontWeight: 600,
        fontSize: "13px",
        background: bgColor,
        color: textColor,
      }}
    >
      {numDelay} days{suffix}
    </span>
  );
};

// Declared at module level so their identity is stable across renders -
// otherwise every state change remounts their children (e.g. the inline
// date editors lose focus while typing).
const InfoRow = ({ label, value, icon }) => (
  <div style={styles.infoRow}>
    <div style={styles.infoLabel}>
      {icon && <span style={styles.infoIcon}>{icon}</span>}
      <span>{label}</span>
    </div>
    <div style={styles.infoValue}>{value || "—"}</div>
  </div>
);

const SectionCard = ({ title, icon, children }) => (
  <div style={styles.sectionCard}>
    <div style={styles.sectionHeader}>
      <div style={styles.sectionTitle}>
        {icon && <span style={styles.sectionIcon}>{icon}</span>}
        <h3 style={styles.sectionHeading}>{title}</h3>
      </div>
    </div>
    <div style={styles.sectionContent}>{children}</div>
  </div>
);

const DetailOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("sidebarsOpenState");
    return stored !== null ? JSON.parse(stored) : true;
  });

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });

  // File states
  const [orderFiles, setOrderFiles] = useState({ attachments: [], images: [], sampleFiles: [] });
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Rename states
  const [renamingFile, setRenamingFile] = useState(null);
  const [newFileName, setNewFileName] = useState("");

  // Courier states - ADD THIS
  const [courierBookings, setCourierBookings] = useState([]);
  const [courierLoading, setCourierLoading] = useState(false);

  // TNA progress (replaces the old shipped-qty "Shipment Progress" bar)
  const [tna, setTna] = useState(null);
  const [tnaLoading, setTnaLoading] = useState(true);

  // Inline field editing (Final Inspection / Ex-Factory / Status) - the
  // only fields Merchandiser - Production may edit despite being
  // view-only everywhere else on this page. Full-access users can edit
  // these too, using the same widget instead of the full Edit Order page.
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [savingField, setSavingField] = useState(false);

  const editableFields = ["final_inspection_date", "ex_factory", "status"];
  const canEditField = (field) =>
    canManageOrders() ||
    (isMerchandiserProduction() && editableFields.includes(field));

  const startEditField = (field, currentValue) => {
    setEditingField(field);
    setEditingValue(currentValue || "");
  };

  const cancelEditField = () => {
    setEditingField(null);
    setEditingValue("");
  };

  const saveEditField = async (field) => {
    try {
      setSavingField(true);
      const response = await patchOrder(id, { [field]: editingValue || null });
      // Merge the saved order so server-recomputed fields (e.g. the
      // Ex-Factory delay) refresh too, not just the edited field.
      setOrder((prev) => ({
        ...prev,
        [field]: editingValue || null,
        ...(response?.data || {}),
      }));
      setEditingField(null);
      setEditingValue("");
      setSnackbar({
        open: true,
        message: "Updated successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating field:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || "Error updating field",
        type: "error",
      });
    } finally {
      setSavingField(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchTna = useCallback(async () => {
    setTnaLoading(true);
    try {
      const response = await getTNAByOrder(id);
      // TEMP DEBUG - remove once the progress bar color issue is
      // confirmed fixed. Open the browser console after checking an
      // Approved box to see exactly what this page received.
      setTna(response.data || null);
    } catch (err) {
      // No TNA record for this order yet - normal, just show the empty state.
      setTna(null);
    } finally {
      setTnaLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTna();
  }, [fetchTna]);

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem("sidebarsOpenState");
      setIsSidebarOpen(stored !== null ? JSON.parse(stored) : true);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await getOrderById(id);
      const orderData = response.data;
      setOrder(orderData);
      setError(null);
      await Promise.all([
        fetchOrderFiles(),
        fetchCourierBookings(), // ADD THIS
      ]);
    } catch (error) {
      console.error("Error fetching order:", error);
      setError(error.response?.data?.message || "Error loading order details");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderFiles = async () => {
    try {
      const response = await getOrderFiles(id);

      const attachments = response.data.attachments || [];
      const images = response.data.images || [];
      const sampleFiles = response.data.sample_files || [];


      setOrderFiles({
        attachments: attachments,
        images: images,
        sampleFiles: sampleFiles,
      });
    } catch (error) {
      console.error("❌ Error fetching order files:", error);
      setOrderFiles({ attachments: [], images: [], sampleFiles: [] });
    }
  };

  // ADD THIS - Fetch courier bookings for this order
  const fetchCourierBookings = async () => {
    setCourierLoading(true);
    try {
      const data = await getCourierBookingsByOrder(id);
      setCourierBookings(data.results || []);
    } catch (error) {
      console.error("❌ Error fetching courier bookings:", error);
      setCourierBookings([]);
    } finally {
      setCourierLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrder(id);
      navigate("/orders");
    } catch (error) {
      console.error("Error deleting order:", error);
      setError(error.response?.data?.message || "Error deleting order");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const result = await exportOrderToExcel(id);
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Order exported successfully as "${result.filename}"`,
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error exporting order:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Error exporting order",
        type: "error",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteFile = async (filePath, fileType) => {
    if (window.confirm(`Are you sure you want to delete this ${fileType}?`)) {
      try {
        await deleteOrderFile(id, filePath, fileType);
        await fetchOrderFiles();
        setSnackbar({
          open: true,
          message: "File deleted successfully!",
          type: "success",
        });
      } catch (error) {
        console.error("Error deleting file:", error);
        setSnackbar({
          open: true,
          message: "Error deleting file",
          type: "error",
        });
      }
    }
  };

  const handleRenameFile = async () => {
    if (!newFileName.trim()) {
      setSnackbar({
        open: true,
        message: "Please enter a valid file name",
        type: "warning",
      });
      return;
    }

    try {
      await renameOrderFile(
        id,
        renamingFile.filePath,
        renamingFile.fileType,
        newFileName,
      );
      await fetchOrderFiles();
      setRenamingFile(null);
      setNewFileName("");
      setSnackbar({
        open: true,
        message: "File renamed successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error renaming file:", error);
      setSnackbar({
        open: true,
        message: "Error renaming file",
        type: "error",
      });
    }
  };

  const openRenameModal = (filePath, fileType, currentName) => {
    const nameWithoutExt =
      currentName.substring(0, currentName.lastIndexOf(".")) || currentName;
    setRenamingFile({ filePath, fileType, currentName });
    setNewFileName(nameWithoutExt);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "dd MMM yyyy hh:mm a");
    } catch {
      return "Invalid date";
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return "—";
    return new Intl.NumberFormat("en-US").format(value);
  };

  const calculateCompletion = () => {
    if (!order || !order.total_qty) return 0;
    return ((order.shipped_qty || 0) / order.total_qty) * 100;
  };

  const calculateDaysToShipment = () => {
    if (!order || !order.shipment_date) return null;
    const today = new Date();
    const shipmentDate = new Date(order.shipment_date);
    const days = differenceInDays(shipmentDate, today);
    return days;
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.Draft;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "30px",
          fontSize: "13px",
          fontWeight: 600,
          backgroundColor: config.bg,
          color: config.color,
          border: config.border,
        }}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  // ADD THIS - Get courier status badge
  const getCourierStatusBadge = (status) => {
    const config = courierStatusConfig[status] || courierStatusConfig.booked;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: 600,
          backgroundColor: config.bg,
          color: config.color,
        }}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getAllSizes = () => {
    if (!order?.color_size_groups || order.color_size_groups.length === 0)
      return [];
    const sizesSet = new Set();
    order.color_size_groups.forEach((group) => {
      if (group.size_quantities) {
        group.size_quantities.forEach((sq) => {
          sizesSet.add(sq.size);
        });
      }
    });
    const sizes = Array.from(sizesSet);
    const numericSizes = sizes
      .filter((s) => !isNaN(parseInt(s)))
      .sort((a, b) => parseInt(a) - parseInt(b));
    const alphaSizes = sizes.filter((s) => isNaN(parseInt(s))).sort();
    return [...numericSizes, ...alphaSizes];
  };

  const getQuantity = (colorGroup, size) => {
    const sizeQty = colorGroup.size_quantities?.find((sq) => sq.size === size);
    return sizeQty?.quantity || 0;
  };

  // Final Inspection / Ex-Factory / Status: the only fields a
  // Merchandiser - Production user may edit on this otherwise view-only
  // page. Renders a plain InfoRow when the current user can't edit this
  // field, otherwise an editable row with a pencil icon.
  // Called as a function, not used as <Component>: a component declared
  // inside DetailOrder gets a new identity every render, which remounted
  // the date input on each keystroke and broke typing a date.
  const renderEditableInfoRow = ({
    label,
    field,
    displayValue,
    icon,
    type = "date",
    options = [],
  }) => {
    if (!canEditField(field)) {
      return <InfoRow label={label} value={displayValue} icon={icon} />;
    }

    if (editingField === field) {
      return (
        <div style={styles.infoRow}>
          <div style={styles.infoLabel}>
            {icon && <span style={styles.infoIcon}>{icon}</span>}
            <span>{label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {type === "select" ? (
              <select
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                style={styles.inlineEditInput}
                autoFocus
              >
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="date"
                value={editingValue || ""}
                onChange={(e) => setEditingValue(e.target.value)}
                style={styles.inlineEditInput}
                autoFocus
              />
            )}
            <button
              onClick={() => saveEditField(field)}
              disabled={savingField}
              style={styles.inlineEditSaveBtn}
              title="Save"
            >
              <FaCheck size={12} />
            </button>
            <button
              onClick={cancelEditField}
              disabled={savingField}
              style={styles.inlineEditCancelBtn}
              title="Cancel"
            >
              <FaTimes size={12} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.infoRow}>
        <div style={styles.infoLabel}>
          {icon && <span style={styles.infoIcon}>{icon}</span>}
          <span>{label}</span>
        </div>
        <div
          style={{
            ...styles.infoValue,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {displayValue || "—"}
          <button
            onClick={() => startEditField(field, order[field])}
            style={styles.inlineEditBtn}
            title={`Edit ${label}`}
          >
            <FaEdit size={11} />
          </button>
        </div>
      </div>
    );
  };

  const MetricCard = ({ title, value, icon, color }) => (
    <div style={styles.metricCard}>
      <div
        style={{
          ...styles.metricIcon,
          backgroundColor: color + "15",
          color: color,
        }}
      >
        {icon}
      </div>
      <div style={styles.metricContent}>
        <span style={styles.metricTitle}>{title}</span>
        <span style={styles.metricValue}>{value}</span>
      </div>
    </div>
  );

  const TabButton = ({ id, label, icon, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      style={{
        ...styles.tabButton,
        ...(active === id ? styles.tabButtonActive : {}),
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  // ADD THIS - Courier Section Card with title
  const CourierSectionCard = ({ title, icon, children }) => (
    <div style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitle}>
          {icon && <span style={styles.sectionIcon}>{icon}</span>}
          <h3 style={styles.sectionHeading}>{title}</h3>
        </div>
      </div>
      <div style={styles.sectionContent}>{children}</div>
    </div>
  );

  if (loading) {
    return (
      <div style={styles.appContainer}>
        <Sidebar />
        <div style={styles.mainContent}>
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p style={{ color: "#64748b" }}>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={styles.appContainer}>
        <Sidebar />
        <div style={styles.mainContent}>
          <div style={styles.errorState}>
            <div style={styles.errorIcon}>!</div>
            <h3
              style={{
                fontSize: "18px",
                color: "#0f172a",
                marginBottom: "8px",
              }}
            >
              {error || "Order not found"}
            </h3>
            <p style={{ color: "#64748b", marginBottom: "20px" }}>
              The order you're looking for doesn't exist or has been deleted.
            </p>
            <button
              style={styles.btnPrimary}
              onClick={() => navigate("/orders")}
            >
              <FaArrowLeft style={{ marginRight: "8px" }} /> Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const completionPercentage = calculateCompletion();
  const daysToShipment = calculateDaysToShipment();
  const statusConfigData = statusConfig[order.status] || statusConfig.Draft;
  const allSizes = getAllSizes();
  const hasColorGroups =
    order.color_size_groups && order.color_size_groups.length > 0;

  return (
    <div style={styles.appContainer}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={styles.orderDetailContainer}>
          {/* Header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerLeft}>
              <div>
                <h1 style={styles.pageTitle}>
                  Order {order.style}
                </h1>
                <p style={styles.pageSubtitle}>
                  {order.style} • {order.item || "No item"} • Created{" "}
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
            <div style={styles.headerActions}>
              {daysToShipment !== null &&
                daysToShipment <= 7 &&
                daysToShipment > 0 && (
                  <div style={styles.warningBadge}>
                    <FaExclamationTriangle />
                    <span>{daysToShipment} days to shipment</span>
                  </div>
                )}
              {getStatusBadge(order.status)}
              <button
                style={styles.btnIcon}
                onClick={handlePrint}
                title="Print"
              >
                <FaPrint />
              </button>
              <button
                style={styles.btnIcon}
                onClick={handleEmail}
                title="Email"
              >
                <FaEnvelope />
              </button>
              {canViewOrderPricing() && (
                <button
                  style={styles.btnIcon}
                  onClick={handleDownload}
                  title="Download Excel"
                  disabled={downloading}
                >
                  {downloading ? "..." : <FaDownload />}
                </button>
              )}
              {order.last_edited_by && (
                <span style={styles.lastEditedBadge}>
                  Last edited by {order.last_edited_by}
                </span>
              )}
              {canManageOrders() && (
                <button
                  style={styles.btnPrimary}
                  onClick={() => navigate(`/orders/edit/${id}`)}
                >
                  <FaEdit style={{ marginRight: "8px" }} /> Edit
                </button>
              )}
              {canManageOrders() &&
                (deleteConfirm ? (
                  <div style={styles.deleteConfirm}>
                    <span>Confirm delete?</span>
                    <button style={styles.btnConfirm} onClick={handleDelete}>
                      Yes
                    </button>
                    <button
                      style={styles.btnCancel}
                      onClick={() => setDeleteConfirm(false)}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    style={styles.btnDanger}
                    onClick={() => setDeleteConfirm(true)}
                  >
                    <FaTrash style={{ marginRight: "8px" }} /> Delete
                  </button>
                ))}
            </div>
          </div>

          {/* TNA Progress Section (replaces the old shipped-qty Shipment Progress bar) */}
          <div style={styles.progressSection}>
            {tnaLoading ? (
              <div style={styles.progressHeader}>
                <span style={styles.progressTitle}>Loading TNA progress…</span>
              </div>
            ) : !tna ? (
              <div style={styles.progressHeader}>
                <div>
                  <span style={styles.progressTitle}>TNA Progress</span>
                  <span style={styles.progressStats}>No TNA record for this order yet</span>
                </div>
              </div>
            ) : (
              <>
                <div style={styles.progressHeader}>
                  <div>
                    <span style={styles.progressTitle}>TNA Progress</span>
                    <span style={styles.progressStats}>
                      Lab Dip 10% · Fabric 40% · Fit Sample 20% · PP Sample 30%
                    </span>
                  </div>
                  <span
                    style={{ ...styles.progressCount, cursor: "pointer" }}
                    onClick={() => navigate(`/tna-details/${tna.id}`)}
                    title="View full TNA details"
                  >
                    {tna.progress_percentage ?? 0}% Complete →
                  </span>
                </div>
                <div style={{ ...styles.progressBarContainer, display: "flex" }}>
                  {PROGRESS_STAGES.map((stage) => {
                    const approved = tna[stage.field] === "approved";
                    return (
                      <div
                        key={stage.field}
                        title={`${stage.label} - ${stage.weight}%${approved ? " (Approved)" : " (Pending)"}`}
                        style={{
                          height: "100%",
                          width: `${stage.weight}%`,
                          flexShrink: 0,
                          backgroundColor: approved ? stage.color : "#e2e8f0",
                        }}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            {canViewOrderPricing() && (
              <MetricCard
                title="Total Value"
                value={formatCurrency(order.total_value)}
                icon={<FaDollarSign />}
                color="#3b82f6"
              />
            )}
            <MetricCard
              title="Quantity"
              value={formatNumber(order.total_qty)}
              icon={<FaBoxes />}
              color="#10b981"
            />
            {canViewOrderPricing() && (
              <MetricCard
                title="Unit Price"
                value={formatCurrency(order.unit_price)}
                icon={<FaDollarSign />}
                color="#f59e0b"
              />
            )}
            <MetricCard
              title="Shipped"
              value={`${formatNumber(order.shipped_qty)} pcs`}
              icon={<FaTruck />}
              color="#8b5cf6"
            />
          </div>

          {/* Tabs - ADD "Courier" tab */}
          <div style={styles.tabsContainer}>
            <TabButton
              id="overview"
              label="Overview"
              icon={<FaInfoCircle />}
              active={activeTab}
              onClick={setActiveTab}
            />
            <TabButton
              id="details"
              label="Details"
              icon={<FaClipboardList />}
              active={activeTab}
              onClick={setActiveTab}
            />
            <TabButton
              id="color-sizing"
              label="Color & Sizing"
              icon={<FaPalette />}
              active={activeTab}
              onClick={setActiveTab}
            />
            <TabButton
              id="timeline"
              label="Timeline"
              icon={<FaRegClock />}
              active={activeTab}
              onClick={setActiveTab}
            />
            <TabButton
              id="tna"
              label="T&A"
              icon={<FaCalendarCheck />}
              active={activeTab}
              onClick={setActiveTab}
            />
            <TabButton
              id="commission"
              label={canViewOrderPricing() ? "Commission" : "Shipment Tracking"}
              icon={canViewOrderPricing() ? <FaPercent /> : <FaTruck />}
              active={activeTab}
              onClick={setActiveTab}
            />
            <TabButton
              id="tests"
              label="Test Results"
              icon={<FaFlask />}
              active={activeTab}
              onClick={setActiveTab}
            />
            {canViewOrderAttachments() && (
              <TabButton
                id="files"
                label="Files & Images"
                icon={<FaPaperclip />}
                active={activeTab}
                onClick={setActiveTab}
              />
            )}
            {/* Sample Files - unlike Files & Images, Merchandiser -
                Production CAN see this tab, just view-only (no
                upload/rename/delete). */}
            <TabButton
              id="sample-files"
              label="Sample Files"
              icon={<FaPaperclip />}
              active={activeTab}
              onClick={setActiveTab}
            />
            {/* ADD THIS - Courier Tab */}
            <TabButton
              id="courier"
              label="Courier"
              icon={<FaTruck />}
              active={activeTab}
              onClick={setActiveTab}
            />
            {/* Samples Tab */}
            <TabButton
              id="samples"
              label="Samples"
              icon={<FaClipboardCheck />}
              active={activeTab}
              onClick={setActiveTab}
            />
          </div>

          {/* Tab Content */}
          <div style={styles.tabContent}>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div style={styles.tabPanel}>
                <div style={styles.twoColumnGrid}>
                  <SectionCard title="Order Information" icon={<FaBuilding />}>
                    <InfoRow
                      label="Customer"
                      value={
                        order.customer_name || order.customer_display || "—"
                      }
                      icon={<FaUser />}
                    />
                    <InfoRow
                      label="Supplier"
                      value={getSupplierDisplayName(order)}
                      icon={<FaIndustry />}
                    />
                    <InfoRow
                      label="Style"
                      value={order.pdm_no}
                      icon={<FaBoxes />}
                    />
                    <InfoRow
                      label="Garment"
                      value={order.garment}
                      icon={<FaShoppingCart />}
                    />
                    <InfoRow
                      label="Season"
                      value={SEASON_LABELS[order.season] || order.season}
                      icon={<FaCalendarAlt />}
                    />
                    <InfoRow
                      label="Item"
                      value={order.item}
                      icon={<FaClipboardList />}
                    />
                    <InfoRow
                      label="Fabrication"
                      value={order.fabrication}
                      icon={<FaIndustry />}
                    />
                    <InfoRow
                      label="PO Number"
                      value={order.po_no}
                      icon={<FaClipboardList />}
                    />
                    <InfoRow
                      label="Order NO"
                      value={order.style}
                      icon={<FaClipboardList />}
                    />
                    <InfoRow
                      label="Ref No"
                      value={order.ref_no}
                      icon={<FaFileAlt />}
                    />
                    <InfoRow
                      label="Order Type"
                      value={order.order_type || "—"}
                      icon={<FaShoppingCart />}
                    />
                  </SectionCard>

                  <SectionCard title="Important Dates" icon={<FaCalendarAlt />}>
                    {renderEditableInfoRow({
                      label: "Final Inspection",
                      field: "final_inspection_date",
                      displayValue: formatDate(order.final_inspection_date),
                      icon: <FaCalendarAlt />,
                      type: "date",
                    })}
                    {renderEditableInfoRow({
                      label: "Ex-Factory",
                      field: "ex_factory",
                      displayValue: formatDate(order.ex_factory),
                      icon: <FaIndustry />,
                      type: "date",
                    })}
                    <InfoRow
                      label="ETD"
                      value={formatDate(order.etd)}
                      icon={<FaTruck />}
                    />
                    <InfoRow
                      label="ETA"
                      value={formatDate(order.eta)}
                      icon={<FaTruck />}
                    />
                    {(!isMerchandiserProduction() || !order.factory_ship_date) && (
                      <InfoRow
                        label="Shipment Date"
                        value={formatDate(order.shipment_date)}
                        icon={<FaCalendarAlt />}
                      />
                    )}
                    <InfoRow
                      label="IC Issue Date"
                      value={formatDate(order.ic_issue_date)}
                      icon={<FaCalendarWeek />}
                    />
                    <InfoRow
                      label="Factory Ship Date"
                      value={formatDate(order.factory_ship_date)}
                      icon={<FaCalendarWeek />}
                    />
                    <InfoRow
                      label="Cargo Handover Date"
                      value={formatDate(order.cargo_handover_date)}
                      icon={<FaCalendarWeek />}
                    />
                    {!isMerchandiserProduction() && (
                      <InfoRow
                        label="Shipment Month"
                        value={order.shipment_month || "—"}
                        icon={<FaCalendarAlt />}
                      />
                    )}

                    <InfoRow
                      label="Delay from Ex-Factory (Days)"
                      value={
                        order.delay_from_ex_factory !== null &&
                        order.delay_from_ex_factory !== undefined &&
                        order.delay_from_ex_factory !== "" ? (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 10px",
                              borderRadius: "12px",
                              fontWeight: 600,
                              fontSize: "13px",
                              background:
                                Number(order.delay_from_ex_factory) > 0
                                  ? "#d1fae5"
                                  : "#fee2e2",
                              color:
                                Number(order.delay_from_ex_factory) > 0
                                  ? "#10b981"
                                  : "#ef4444",
                            }}
                          >
                            {order.delay_from_ex_factory} days{" "}
                            {Number(order.delay_from_ex_factory) > 0
                              ? "Early"
                              : "Late"}
                          </span>
                        ) : (
                          "—"
                        )
                      }
                      icon={<FaExclamationTriangle />}
                    />
                    <InfoRow
                      label="Delay from ETD (Days)"
                      value={
                        order.delay_from_etd !== null &&
                        order.delay_from_etd !== undefined &&
                        order.delay_from_etd !== "" ? (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 10px",
                              borderRadius: "12px",
                              fontWeight: 600,
                              fontSize: "13px",
                              background:
                                Number(order.delay_from_etd) > 0
                                  ? "#fee2e2"
                                  : "#d1fae5",
                              color:
                                Number(order.delay_from_etd) > 0
                                  ? "#10b981"
                                  : "#ef4444",
                            }}
                          >
                            {order.delay_from_etd} days{" "}
                            {Number(order.delay_from_etd) > 0
                              ? "Early"
                              : "Late"}
                          </span>
                        ) : (
                          "—"
                        )
                      }
                      icon={<FaExclamationTriangle />}
                    />
                  </SectionCard>
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === "details" && (
              <div style={styles.tabPanel}>
                <div style={styles.twoColumnGrid}>
                  <SectionCard title="Basic Details" icon={<FaInfoCircle />}>
                    <InfoRow
                      label="PO Number"
                      value={order.po_no}
                      icon={<FaClipboardList />}
                    />
                    <InfoRow
                      label="Style"
                      value={order.pdm_no}
                      icon={<FaClipboardList />}
                    />
                    <InfoRow
                      label="Order NO"
                      value={order.style}
                      icon={<FaClipboardList />}
                    />
                    <InfoRow
                      label="Department"
                      value={
                        order.department_name || order.department?.name || "—"
                      }
                      icon={<FaBuilding />}
                    />
                    <InfoRow
                      label="Ref No"
                      value={order.ref_no}
                      icon={<FaFileAlt />}
                    />
                    <InfoRow
                      label="Gender"
                      value={order.gender || "—"}
                      icon={<FaUser />}
                    />
                    <InfoRow
                      label="Size Range"
                      value={order.size_range || "—"}
                      icon={<FaRuler />}
                    />
                    <InfoRow
                      label="WGR"
                      value={order.wgr || "—"}
                      icon={<FaChartLine />}
                    />
                    <InfoRow
                      label="Size Type"
                      value={
                        order.size_type === "numeric"
                          ? "Numeric Sizes"
                          : order.size_type === "alpha"
                            ? "Alpha Sizes"
                            : "—"
                      }
                      icon={<FaRuler />}
                    />
                    <InfoRow
                      label="Group Name"
                      value={order.group_name || "—"}
                      icon={<FaUsers />}
                    />
                    <InfoRow
                      label="Previous Ref #"
                      value={order.prev_ref || "—"}
                      icon={<FaFileAlt />}
                    />
                    <InfoRow
                      label="Invoice No"
                      value={order.invoice_no || "—"}
                      icon={<FaFileAlt />}
                    />
                    <InfoRow
                      label="Repeat Of"
                      value={order.repeat_of || "—"}
                      icon={<FaClipboardList />}
                    />
                  </SectionCard>

                  <SectionCard title="Pricing Details" icon={<FaDollarSign />}>
                    {canViewOrderPricing() && (
                      <InfoRow
                        label="Unit Price"
                        value={formatCurrency(order.unit_price)}
                        icon={<FaDollarSign />}
                      />
                    )}
                    <InfoRow
                      label="Total Quantity"
                      value={formatNumber(order.total_qty)}
                      icon={<FaBoxes />}
                    />
                    {canViewOrderPricing() && (
                      <InfoRow
                        label="Total Value"
                        value={formatCurrency(order.total_value)}
                        icon={<FaDollarSign />}
                      />
                    )}
                    {canViewOrderPricing() && (
                      <InfoRow
                        label="Factory Value"
                        value={formatCurrency(order.factory_value)}
                        icon={<FaIndustry />}
                      />
                    )}
                    <InfoRow
                      label="Shipped Qty"
                      value={formatNumber(order.shipped_qty)}
                      icon={<FaTruck />}
                    />
                    {canViewOrderPricing() && (
                      <InfoRow
                        label="Shipped Value"
                        value={formatCurrency(order.shipped_value)}
                        icon={<FaDollarSign />}
                      />
                    )}
                    <InfoRow
                      label="Grand Total (from colors)"
                      value={formatNumber(order.grand_total)}
                      icon={<FaBoxes />}
                    />
                    {renderEditableInfoRow({
                      label: "Status",
                      field: "status",
                      displayValue: order.status,
                      icon: <FaInfoCircle />,
                      type: "select",
                      options: orderStatusOptions,
                    })}
                  </SectionCard>

                  <SectionCard
                    title="Additional Information"
                    icon={<FaUsers />}
                  >
                    {isMerchandiserProduction() ? (
                      <InfoRow
                        label="Remarks"
                        value={order.production_remarks || "—"}
                        icon={<FaComments />}
                      />
                    ) : (
                      <>
                        <InfoRow
                          label="Remarks"
                          value={order.remarks || "—"}
                          icon={<FaComments />}
                        />
                        {order.production_remarks && (
                          <InfoRow
                            label="Production Remarks"
                            value={order.production_remarks}
                            icon={<FaComments />}
                          />
                        )}
                      </>
                    )}
                    <InfoRow
                      label="Created At"
                      value={formatDate(order.created_at)}
                      icon={<FaCalendarAlt />}
                    />
                    <InfoRow
                      label="Created By"
                      value={order.created_by || "—"}
                      icon={<FaUsers />}
                    />
                    <InfoRow
                      label="Last Updated"
                      value={formatDate(order.updated_at)}
                      icon={<FaCalendarAlt />}
                    />
                  </SectionCard>
                </div>
              </div>
            )}

            {/* Color & Sizing Tab */}
            {activeTab === "color-sizing" && (
              <div style={styles.tabPanel}>
                <SectionCard
                  title="Color & Sizing Breakdown"
                  icon={<FaPalette />}
                >
                  {hasColorGroups && allSizes.length > 0 ? (
                    <div style={styles.colorTableWrapper}>
                      <table style={styles.colorTable}>
                        <thead>
                          <tr>
                            <th style={styles.colorTableHeader}>Color</th>
                            {allSizes.map((size) => (
                              <th key={size} style={styles.colorTableHeader}>
                                Size {size}
                              </th>
                            ))}
                            <th style={styles.colorTableHeader}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.color_size_groups.map((group, idx) => {
                            const groupTotal =
                              group.size_quantities?.reduce(
                                (sum, sq) => sum + (sq.quantity || 0),
                                0,
                              ) || 0;
                            return (
                              <tr key={idx}>
                                <td style={styles.colorTableCell}>
                                  <div style={styles.colorCell}>
                                    <span
                                      style={{
                                        ...styles.colorDot,
                                        backgroundColor:
                                          group.color?.toLowerCase() ||
                                          "#cbd5e1",
                                      }}
                                    />
                                    <span style={styles.colorName}>
                                      {group.color || "—"}
                                    </span>
                                  </div>
                                </td>
                                {allSizes.map((size) => (
                                  <td key={size} style={styles.colorTableCell}>
                                    <span style={styles.quantityBadge}>
                                      {formatNumber(getQuantity(group, size))}
                                    </span>
                                  </td>
                                ))}
                                <td style={styles.colorTableCell}>
                                  <span style={styles.totalBadge}>
                                    {formatNumber(groupTotal)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td style={styles.colorTableFooter}>
                              <strong>Grand Total</strong>
                            </td>
                            {allSizes.map((size) => {
                              const sizeTotal = order.color_size_groups.reduce(
                                (sum, group) => sum + getQuantity(group, size),
                                0,
                              );
                              return (
                                <td key={size} style={styles.colorTableFooter}>
                                  <strong>{formatNumber(sizeTotal)}</strong>
                                </td>
                              );
                            })}
                            <td style={styles.colorTableFooter}>
                              <span style={styles.grandTotalBadge}>
                                {formatNumber(
                                  order.grand_total || order.total_qty,
                                )}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div style={styles.emptyColorState}>
                      <FaPalette style={styles.emptyColorIcon} />
                      <p>
                        No color and sizing information available for this
                        order.
                      </p>
                    </div>
                  )}
                </SectionCard>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <div style={styles.tabPanel}>
                <SectionCard title="Order Timeline" icon={<FaRegClock />}>
                  <div style={styles.timelineContainer}>
                    {order.final_inspection_date && (
                      <div style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineTitle}>
                            Final Inspection
                          </div>
                          <div style={styles.timelineDate}>
                            {formatDate(order.final_inspection_date)}
                          </div>
                        </div>
                      </div>
                    )}

                    {order.ic_issue_date && (
                      <div style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineTitle}>IC Issue Date</div>
                          <div style={styles.timelineDate}>
                            {formatDate(order.ic_issue_date)}
                          </div>
                        </div>
                      </div>
                    )}

                    {order.ex_factory && (
                      <div style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineTitle}>Ex-Factory</div>
                          <div style={styles.timelineDate}>
                            {formatDate(order.ex_factory)}
                          </div>
                        </div>
                      </div>
                    )}

                    {order.factory_ship_date && (
                      <div style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineTitle}>
                            Factory Ship Date
                          </div>
                          <div style={styles.timelineDate}>
                            {formatDate(order.factory_ship_date)}
                          </div>
                        </div>
                      </div>
                    )}

                    {order.etd && (
                      <div style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineTitle}>ETD</div>
                          <div style={styles.timelineDate}>
                            {formatDate(order.etd)}
                          </div>
                        </div>
                      </div>
                    )}

                    {order.eta && (
                      <div style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineTitle}>ETA</div>
                          <div style={styles.timelineDate}>
                            {formatDate(order.eta)}
                          </div>
                        </div>
                      </div>
                    )}

                    {order.cargo_handover_date && (
                      <div style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineTitle}>Cargo Handover</div>
                          <div style={styles.timelineDate}>
                            {formatDate(order.cargo_handover_date)}
                          </div>
                        </div>
                      </div>
                    )}

                    {order.shipment_date &&
                      (!isMerchandiserProduction() || !order.factory_ship_date) && (
                      <div style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineTitle}>Shipment Date</div>
                          <div style={styles.timelineDate}>
                            {formatDate(order.shipment_date)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={styles.timelineItem}>
                      <div
                        style={{
                          ...styles.timelineDot,
                          backgroundColor: statusConfigData.color,
                        }}
                      />
                      <div style={styles.timelineContent}>
                        <div style={styles.timelineTitle}>Current Status</div>
                        <div style={styles.timelineDate}>
                          {order.status} • {completionPercentage.toFixed(1)}%
                          completed
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* Commission / Shipment Tracking Tab */}
            {activeTab === "tna" && (
              <OrderTNATab tna={tna} loading={tnaLoading} canEdit={canManageOrders()} onUpdated={setTna} />
            )}

            {activeTab === "commission" && (
              <div style={styles.tabPanel}>
                <div style={styles.twoColumnGrid}>
                  {canViewOrderPricing() && (
                    <SectionCard title="Commission Details" icon={<FaPercent />}>
                      <InfoRow
                        label="Estimated Commission"
                        value={formatCurrency(order.estimated_commission)}
                        icon={<FaDollarSign />}
                      />
                      <InfoRow
                        label="Actual Commission"
                        value={formatCurrency(order.actual_commission)}
                        icon={<FaDollarSign />}
                      />
                      <InfoRow
                        label="Commission Calculation Method"
                        value={
                          order.commission_calc_method ===
                          "unit_price_minus_factory"
                            ? "Unit Price − Factory Price"
                            : "Manual Commission Percentage"
                        }
                        icon={<FaPercent />}
                      />
                      {order.commission_calc_method ===
                      "unit_price_minus_factory" ? (
                        <>
                          <InfoRow
                            label="Factory Price"
                            value={formatCurrency(order.factory_price)}
                            icon={<FaDollarSign />}
                          />
                          <InfoRow
                            label="Commission Rate"
                            value={formatCurrency(order.commission_rate)}
                            icon={<FaDollarSign />}
                          />
                        </>
                      ) : (
                        <InfoRow
                          label="Commission Percent"
                          value={
                            order.commission_percent
                              ? `${order.commission_percent}%`
                              : "—"
                          }
                          icon={<FaPercent />}
                        />
                      )}
                      <InfoRow
                        label="Commission Receipt Date"
                        value={formatDate(order.commission_rec_date)}
                        icon={<FaCalendarAlt />}
                      />
                    </SectionCard>
                  )}

                  <SectionCard title="Shipment Tracking" icon={<FaTruck />}>
                    <InfoRow
                      label="Delay from Ex-Factory (Days)"
                      value={renderDelayBadge(
                        order.delay_from_ex_factory,
                        "Ex-Factory",
                      )}
                      icon={<FaExclamationTriangle />}
                    />
                    <InfoRow
                      label="Delay from ETD (Days)"
                      value={renderDelayBadge(order.delay_from_etd, "ETD")}
                      icon={<FaExclamationTriangle />}
                    />
                    <InfoRow
                      label="Shipment Delay"
                      value={
                        order.shipment_delay
                          ? `${order.shipment_delay} days`
                          : "—"
                      }
                      icon={<FaExclamationTriangle />}
                    />
                    <InfoRow
                      label="Actual Shipment Deviation"
                      value={
                        order.actual_shipment_deviation
                          ? `${order.actual_shipment_deviation} days`
                          : "—"
                      }
                      icon={<FaChartLine />}
                    />
                  </SectionCard>
                </div>
              </div>
            )}

            {/* Test Results Tab */}
            {activeTab === "tests" && (
              <div style={styles.tabPanel}>
                <OrderLabReports orderId={id} />
              </div>
            )}

            {/* Files Tab */}
            {activeTab === "files" && canViewOrderAttachments() && (
              <div style={styles.tabPanel}>
                <SectionCard
                  title="Order Files & Attachments"
                  icon={<FaPaperclip />}
                >
                  <div style={styles.filesSection}>
                    {orderFiles.images && orderFiles.images.length > 0 && (
                      <div style={styles.imagesSection}>
                        <h4 style={styles.sectionSubtitle}>
                          <FaImage /> Images ({orderFiles.images.length})
                        </h4>
                        <div style={styles.imageGrid}>
                          {orderFiles.images.map((imagePath, idx) => {
                            let fullUrl = imagePath;

                            if (!imagePath.startsWith("http")) {
                              if (imagePath.startsWith("/media/")) {
                                fullUrl = `${getBackendURL()}${imagePath}`;
                              } else {
                                fullUrl = `${getBackendURL()}/media/${imagePath.replace(/^\/+/, "")}`;
                              }
                            }

                            const fileName = imagePath.split("/").pop();

                            return (
                              <div key={idx} style={styles.imageCard}>
                                <img
                                  src={fullUrl}
                                  alt={`Order image ${idx + 1}`}
                                  style={styles.imagePreview}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.parentElement.style.backgroundColor =
                                      "#f1f5f9";
                                  }}
                                  onClick={() => {
                                    setSelectedImage(fullUrl);
                                    setShowImageViewer(true);
                                  }}
                                />
                                <div style={styles.imageOverlay}>
                                  <button
                                    onClick={() => {
                                      setSelectedImage(fullUrl);
                                      setShowImageViewer(true);
                                    }}
                                    style={styles.imageActionBtn}
                                    title="View Image"
                                  >
                                    <FaEye />
                                  </button>
                                  <a
                                    href={fullUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.imageActionBtn}
                                    title="Download"
                                  >
                                    <FaDownload />
                                  </a>
                                  <button
                                    onClick={() =>
                                      openRenameModal(
                                        imagePath,
                                        "image",
                                        fileName,
                                      )
                                    }
                                    style={styles.imageActionBtn}
                                    title="Rename"
                                  >
                                    <FaEditIcon />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteFile(imagePath, "image")
                                    }
                                    style={{
                                      ...styles.imageActionBtn,
                                      color: "#ef4444",
                                    }}
                                    title="Delete"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                                <div style={styles.imageName}>{fileName}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {orderFiles.attachments &&
                      orderFiles.attachments.length > 0 && (
                        <div style={styles.attachmentsSection}>
                          <h4 style={styles.sectionSubtitle}>
                            <FaFileAlt /> Attachments (
                            {orderFiles.attachments.length})
                          </h4>
                          <div style={styles.attachmentsList}>
                            {orderFiles.attachments.map(
                              (attachmentPath, idx) => {
                                let fullUrl = attachmentPath;
                                if (
                                  !attachmentPath.startsWith("http") &&
                                  !attachmentPath.startsWith("data:")
                                ) {
                                  fullUrl = `${getBackendURL()}${attachmentPath}`;
                                }
                                const fileName = attachmentPath
                                  .split("/")
                                  .pop();
                                const fileExtension = fileName
                                  .split(".")
                                  .pop()
                                  .toLowerCase();

                                return (
                                  <div key={idx} style={styles.attachmentCard}>
                                    <div style={styles.attachmentIcon}>
                                      <FaFileAlt />
                                    </div>
                                    <div style={styles.attachmentInfo}>
                                      <div style={styles.attachmentName}>
                                        {fileName}
                                      </div>
                                      <div style={styles.attachmentType}>
                                        {fileExtension.toUpperCase()}
                                      </div>
                                    </div>
                                    <div style={styles.attachmentActions}>
                                      <a
                                        href={fullUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={styles.attachmentActionBtn}
                                      >
                                        <FaDownload /> Download
                                      </a>
                                      <button
                                        onClick={() =>
                                          openRenameModal(
                                            attachmentPath,
                                            "attachment",
                                            fileName,
                                          )
                                        }
                                        style={styles.attachmentActionBtn}
                                      >
                                        <FaEditIcon /> Rename
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteFile(
                                            attachmentPath,
                                            "attachment",
                                          )
                                        }
                                        style={{
                                          ...styles.attachmentActionBtn,
                                          color: "#ef4444",
                                        }}
                                      >
                                        <FaTrash /> Delete
                                      </button>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}
                    {(!orderFiles.images || orderFiles.images.length === 0) &&
                      (!orderFiles.attachments ||
                        orderFiles.attachments.length === 0) && (
                        <div style={styles.emptyFilesState}>
                          <FaPaperclip style={styles.emptyFilesIcon} />
                          <p>No files or images uploaded for this order.</p>
                        </div>
                      )}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* Sample Files Tab - visible to everyone, including
                Merchandiser - Production, but only they get the read-only
                treatment (no Rename/Delete) via canManageOrders(). */}
            {activeTab === "sample-files" && (
              <div style={styles.tabPanel}>
                <SectionCard title="Sample Files" icon={<FaPaperclip />}>
                  <div style={styles.filesSection}>
                    {orderFiles.sampleFiles &&
                      orderFiles.sampleFiles.length > 0 && (
                        <div style={styles.attachmentsSection}>
                          <h4 style={styles.sectionSubtitle}>
                            <FaFileAlt /> Sample Files (
                            {orderFiles.sampleFiles.length})
                          </h4>
                          <div style={styles.attachmentsList}>
                            {orderFiles.sampleFiles.map((filePath, idx) => {
                              let fullUrl = filePath;
                              if (
                                !filePath.startsWith("http") &&
                                !filePath.startsWith("data:")
                              ) {
                                fullUrl = `${getBackendURL()}${filePath}`;
                              }
                              const fileName = filePath.split("/").pop();
                              const fileExtension = fileName
                                .split(".")
                                .pop()
                                .toLowerCase();

                              return (
                                <div key={idx} style={styles.attachmentCard}>
                                  <div style={styles.attachmentIcon}>
                                    <FaFileAlt />
                                  </div>
                                  <div style={styles.attachmentInfo}>
                                    <div style={styles.attachmentName}>
                                      {fileName}
                                    </div>
                                    <div style={styles.attachmentType}>
                                      {fileExtension.toUpperCase()}
                                    </div>
                                  </div>
                                  <div style={styles.attachmentActions}>
                                    <a
                                      href={fullUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={styles.attachmentActionBtn}
                                    >
                                      <FaDownload /> Download
                                    </a>
                                    {canManageOrders() && (
                                      <>
                                        <button
                                          onClick={() =>
                                            openRenameModal(
                                              filePath,
                                              "sample_file",
                                              fileName,
                                            )
                                          }
                                          style={styles.attachmentActionBtn}
                                        >
                                          <FaEditIcon /> Rename
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteFile(
                                              filePath,
                                              "sample_file",
                                            )
                                          }
                                          style={{
                                            ...styles.attachmentActionBtn,
                                            color: "#ef4444",
                                          }}
                                        >
                                          <FaTrash /> Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    {(!orderFiles.sampleFiles ||
                      orderFiles.sampleFiles.length === 0) && (
                      <div style={styles.emptyFilesState}>
                        <FaPaperclip style={styles.emptyFilesIcon} />
                        <p>No sample files uploaded for this order.</p>
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ========================================================== */}
            {/* COURIER TAB - ADD THIS ENTIRE SECTION */}
            {/* ========================================================== */}
            {activeTab === "courier" && (
              <div style={styles.tabPanel}>
                <CourierSectionCard title="Courier Shipments" icon={<FaTruck />}>
                  {courierLoading ? (
                    <div style={styles.loadingState}>
                      <div style={styles.spinner}></div>
                      <p style={{ color: "#64748b" }}>Loading courier shipments...</p>
                    </div>
                  ) : courierBookings.length === 0 ? (
                    <div style={styles.emptyFilesState}>
                      <FaTruck style={styles.emptyFilesIcon} />
                      <p>No courier shipments found for this order.</p>
                    </div>
                  ) : (
                    <div style={styles.courierTableWrapper}>
                      <table style={styles.courierTable}>
                        <thead>
                          <tr>
                            <th style={styles.courierTableHeader}>Tracking #</th>
                            <th style={styles.courierTableHeader}>Courier</th>
                            <th style={styles.courierTableHeader}>Status</th>
                            <th style={styles.courierTableHeader}>Type</th>
                            <th style={styles.courierTableHeader}>Item</th>
                            <th style={styles.courierTableHeader}>Qty</th>
                            <th style={styles.courierTableHeader}>Booking Date</th>
                            <th style={styles.courierTableHeader}>Delivered Date</th>
                            <th style={styles.courierTableHeader}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courierBookings.map((item) => (
                            <tr key={item.id} style={styles.courierTableRow}>
                              <td style={styles.courierTableCell}>
                                <span style={styles.courierTrackingNumber}>
                                  {item.booking_tracking_no}
                                </span>
                              </td>
                              <td style={styles.courierTableCell}>
                                <span style={styles.courierName}>
                                  {item.booking_courier_name}
                                </span>
                              </td>
                              <td style={styles.courierTableCell}>
                                {getCourierStatusBadge(item.booking_status)}
                              </td>
                              <td style={styles.courierTableCell}>
                                <span style={{
                                  ...styles.courierType,
                                  backgroundColor: item.booking_type === 'export' ? '#dbeafe' : '#fef3c7',
                                  color: item.booking_type === 'export' ? '#1d4ed8' : '#d97706',
                                }}>
                                  {item.booking_type_display || item.booking_type}
                                </span>
                              </td>
                              <td style={styles.courierTableCell}>
                                {item.item_description || '—'}
                                {item.sample_type && (
                                  <span style={styles.courierAwb}>{item.sample_type}</span>
                                )}
                              </td>
                              <td style={styles.courierTableCell}>
                                {item.qty ?? '—'}
                              </td>
                              <td style={styles.courierTableCell}>
                                {formatDate(item.booking_date)}
                              </td>
                              <td style={styles.courierTableCell}>
                                {formatDate(item.booking_delivered_date)}
                              </td>
                              <td style={styles.courierTableCell}>
                                <div style={styles.courierActions}>
                                  <button
                                    style={styles.courierActionBtn}
                                    title="View Shipment Details"
                                    onClick={() => navigate(`/courier/${item.booking}/items`)}
                                  >
                                    <FaEye />
                                  </button>
                                  <a
                                    href={`#`}
                                    style={styles.courierActionBtn}
                                    title="Track Shipment"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const trackingUrl = item.booking_tracking_no
                                        ? `https://www.google.com/search?q=${item.booking_courier_name}+${item.booking_tracking_no}`
                                        : "#";
                                      window.open(trackingUrl, "_blank");
                                    }}
                                  >
                                    <FaSearch />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CourierSectionCard>

                {/* Courier Summary Stats */}
                {courierBookings.length > 0 && (
                  <div style={styles.courierStatsGrid}>
                    <div style={styles.courierStatCard}>
                      <span style={styles.courierStatValue}>
                        {new Set(courierBookings.map(b => b.booking)).size}
                      </span>
                      <span style={styles.courierStatLabel}>Total Shipments</span>
                    </div>
                    <div style={styles.courierStatCard}>
                      <span style={styles.courierStatValue}>
                        {courierBookings.filter(b => b.booking_status === 'delivered').length}
                      </span>
                      <span style={styles.courierStatLabel}>Delivered</span>
                    </div>
                    <div style={styles.courierStatCard}>
                      <span style={styles.courierStatValue}>
                        {courierBookings.filter(b => b.booking_status === 'in_transit').length}
                      </span>
                      <span style={styles.courierStatLabel}>In Transit</span>
                    </div>
                    <div style={styles.courierStatCard}>
                      <span style={styles.courierStatValue}>
                        {courierBookings.filter(b => b.booking_status === 'cancelled').length}
                      </span>
                      <span style={styles.courierStatLabel}>Cancelled</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Samples Tab */}
            {activeTab === "samples" && (
              <div style={styles.tabPanel}>
                <SampleSection
                  orderId={id}
                  supplierName={getSupplierDisplayName(order)}
                  orderLabel={order?.style}
                  onApprovalChange={fetchTna}
                />
              </div>
            )}
          </div>

          {/* Remarks Section */}
          {isMerchandiserProduction() ? (
            order.production_remarks && activeTab !== "details" && (
              <SectionCard title="Remarks" icon={<FaComments />}>
                <div style={styles.remarksContent}>
                  {order.production_remarks}
                </div>
              </SectionCard>
            )
          ) : (
            <>
              {order.remarks && activeTab !== "details" && (
                <SectionCard title="Remarks" icon={<FaComments />}>
                  <div style={styles.remarksContent}>{order.remarks}</div>
                </SectionCard>
              )}
              {order.production_remarks && activeTab !== "details" && (
                <SectionCard title="Production Remarks" icon={<FaComments />}>
                  <div style={styles.remarksContent}>
                    {order.production_remarks}
                  </div>
                </SectionCard>
              )}
            </>
          )}

          {/* Footer Actions */}
          <div style={styles.footerActions}>
            <button
              style={styles.btnOutline}
              onClick={() => navigate("/orders")}
            >
              <FaArrowLeft style={{ marginRight: "8px" }} /> Back to List
            </button>
            {canManageOrders() && (
              <div style={styles.footerRightActions}>
                <button
                  style={styles.btnPrimary}
                  onClick={() => navigate(`/orders/edit/${id}`)}
                >
                  <FaEdit style={{ marginRight: "8px" }} /> Edit Order
                </button>
                <button
                  style={styles.btnDangerOutline}
                  onClick={() => setDeleteConfirm(true)}
                >
                  <FaTrash style={{ marginRight: "8px" }} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {showImageViewer && selectedImage && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowImageViewer(false)}
        >
          <div
            style={styles.imageViewerModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.imageViewerHeader}>
              <h3 style={styles.modalTitle}>Image Viewer</h3>
              <button
                style={styles.modalClose}
                onClick={() => setShowImageViewer(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div style={styles.imageViewerBody}>
              <img
                src={selectedImage}
                alt="Full size"
                style={styles.fullImage}
              />
            </div>
            <div style={styles.imageViewerFooter}>
              <a href={selectedImage} download style={styles.modalSubmit}>
                <FaDownload /> Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renamingFile && (
        <div style={styles.modalOverlay} onClick={() => setRenamingFile(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Rename File</h3>
              <button
                style={styles.modalClose}
                onClick={() => setRenamingFile(null)}
              >
                <FaTimes />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.renameSection}>
                <label style={styles.uploadLabel}>Current Name:</label>
                <div style={styles.currentFileName}>
                  {renamingFile.currentName}
                </div>
              </div>
              <div style={styles.renameSection}>
                <label style={styles.uploadLabel}>
                  New Name (without extension):
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Enter new file name"
                  style={styles.renameInput}
                  autoFocus
                />
                <div style={styles.fileExtensionHint}>
                  Extension will remain: .
                  {renamingFile.currentName.split(".").pop()}
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={styles.modalCancel}
                onClick={() => setRenamingFile(null)}
              >
                Cancel
              </button>
              <button style={styles.modalSubmit} onClick={handleRenameFile}>
                <FaCheck /> Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div
          style={{
            ...styles.snackbar,
            backgroundColor:
              snackbar.type === "success"
                ? "#10b981"
                : snackbar.type === "error"
                  ? "#ef4444"
                  : "#f59e0b",
          }}
        >
          <span>{snackbar.message}</span>
          <button
            onClick={() => setSnackbar({ ...snackbar, open: false })}
            style={styles.snackbarClose}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

const styles = withDetailOrderTheme(baseStyles);

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  button:hover {
    transform: translateY(-1px);
  }

  .image-card:hover .image-overlay {
    opacity: 1;
  }
  
  input:focus, select:focus, textarea:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;
document.head.appendChild(styleSheet);

export default DetailOrder;