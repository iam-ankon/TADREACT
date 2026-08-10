// pages/orders/DetailOrder.jsx - With Courier Tab

import React, { useState, useEffect } from "react";
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
} from "../../api/merchandiser";
import Sidebar from "../merchandiser/Sidebar";
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
  const [orderFiles, setOrderFiles] = useState({ attachments: [], images: [] });
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Rename states
  const [renamingFile, setRenamingFile] = useState(null);
  const [newFileName, setNewFileName] = useState("");

  // Courier states - ADD THIS
  const [courierBookings, setCourierBookings] = useState([]);
  const [courierLoading, setCourierLoading] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

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
      console.log("Order data:", orderData);
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
      console.log("🔍 Fetching files for order:", id);
      const response = await getOrderFiles(id);
      console.log("📁 Files response:", response.data);

      const attachments = response.data.attachments || [];
      const images = response.data.images || [];

      console.log(`📎 Attachments found: ${attachments.length}`);
      console.log(`🖼️ Images found: ${images.length}`);

      setOrderFiles({
        attachments: attachments,
        images: images,
      });
    } catch (error) {
      console.error("❌ Error fetching order files:", error);
      setOrderFiles({ attachments: [], images: [] });
    }
  };

  // ADD THIS - Fetch courier bookings for this order
  const fetchCourierBookings = async () => {
    setCourierLoading(true);
    try {
      const data = await getCourierBookingsByOrder(id);
      console.log("📦 Courier bookings:", data);
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
    console.log("Emailing order...");
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

  const InfoRow = ({ label, value, icon }) => (
    <div style={styles.infoRow}>
      <div style={styles.infoLabel}>
        {icon && <span style={styles.infoIcon}>{icon}</span>}
        <span>{label}</span>
      </div>
      <div style={styles.infoValue}>{value || "—"}</div>
    </div>
  );

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
                  Order #{order.po_no || order.id}
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
              <button
                style={styles.btnIcon}
                onClick={handleDownload}
                title="Download Excel"
                disabled={downloading}
              >
                {downloading ? "..." : <FaDownload />}
              </button>
              <button
                style={styles.btnPrimary}
                onClick={() => navigate(`/orders/edit/${id}`)}
              >
                <FaEdit style={{ marginRight: "8px" }} /> Edit
              </button>
              {deleteConfirm ? (
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
              )}
            </div>
          </div>

          {/* Progress Section */}
          <div style={styles.progressSection}>
            <div style={styles.progressHeader}>
              <div>
                <span style={styles.progressTitle}>Shipment Progress</span>
                <span style={styles.progressStats}>
                  {completionPercentage.toFixed(1)}% Complete
                </span>
              </div>
              <span style={styles.progressCount}>
                {formatNumber(order.shipped_qty)} /{" "}
                {formatNumber(order.total_qty)} pcs shipped
              </span>
            </div>
            <div style={styles.progressBarContainer}>
              <div
                style={{
                  ...styles.progressBar,
                  width: `${completionPercentage}%`,
                  backgroundColor:
                    completionPercentage >= 100 ? "#10b981" : "#3b82f6",
                }}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <MetricCard
              title="Total Value"
              value={formatCurrency(order.total_value)}
              icon={<FaDollarSign />}
              color="#3b82f6"
            />
            <MetricCard
              title="Quantity"
              value={formatNumber(order.total_qty)}
              icon={<FaBoxes />}
              color="#10b981"
            />
            <MetricCard
              title="Unit Price"
              value={formatCurrency(order.unit_price)}
              icon={<FaDollarSign />}
              color="#f59e0b"
            />
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
              id="commission"
              label="Commission"
              icon={<FaPercent />}
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
            <TabButton
              id="files"
              label="Files & Images"
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
                      label="PDM Number"
                      value={order.style}
                      icon={<FaBoxes />}
                    />
                    <InfoRow
                      label="Garment"
                      value={order.garment}
                      icon={<FaShoppingCart />}
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
                      label="Style"
                      value={order.pdm_no}
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
                    <InfoRow
                      label="Final Inspection"
                      value={formatDate(order.final_inspection_date)}
                      icon={<FaCalendarAlt />}
                    />
                    <InfoRow
                      label="Ex-Factory"
                      value={formatDate(order.ex_factory)}
                      icon={<FaIndustry />}
                    />
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
                    <InfoRow
                      label="Shipment Date"
                      value={formatDate(order.shipment_date)}
                      icon={<FaCalendarAlt />}
                    />
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
                    <InfoRow
                      label="Shipment Month"
                      value={order.shipment_month || "—"}
                      icon={<FaCalendarAlt />}
                    />

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
                    <InfoRow
                      label="Unit Price"
                      value={formatCurrency(order.unit_price)}
                      icon={<FaDollarSign />}
                    />
                    <InfoRow
                      label="Total Quantity"
                      value={formatNumber(order.total_qty)}
                      icon={<FaBoxes />}
                    />
                    <InfoRow
                      label="Total Value"
                      value={formatCurrency(order.total_value)}
                      icon={<FaDollarSign />}
                    />
                    <InfoRow
                      label="Factory Value"
                      value={formatCurrency(order.factory_value)}
                      icon={<FaIndustry />}
                    />
                    <InfoRow
                      label="Shipped Qty"
                      value={formatNumber(order.shipped_qty)}
                      icon={<FaTruck />}
                    />
                    <InfoRow
                      label="Shipped Value"
                      value={formatCurrency(order.shipped_value)}
                      icon={<FaDollarSign />}
                    />
                    <InfoRow
                      label="Grand Total (from colors)"
                      value={formatNumber(order.grand_total)}
                      icon={<FaBoxes />}
                    />
                    <InfoRow
                      label="Status"
                      value={order.status || "—"}
                      icon={<FaInfoCircle />}
                    />
                  </SectionCard>

                  <SectionCard
                    title="Additional Information"
                    icon={<FaUsers />}
                  >
                    <InfoRow
                      label="Remarks"
                      value={order.remarks || "—"}
                      icon={<FaComments />}
                    />
                    <InfoRow
                      label="Created At"
                      value={formatDate(order.created_at)}
                      icon={<FaCalendarAlt />}
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

                    {order.shipment_date && (
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

            {/* Commission Tab */}
            {activeTab === "commission" && (
              <div style={styles.tabPanel}>
                <div style={styles.twoColumnGrid}>
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
                      label="Commission Percent"
                      value={
                        order.commission_percent
                          ? `${order.commission_percent}%`
                          : "—"
                      }
                      icon={<FaPercent />}
                    />
                    <InfoRow
                      label="Commission Receipt Date"
                      value={formatDate(order.commission_rec_date)}
                      icon={<FaCalendarAlt />}
                    />
                  </SectionCard>

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
                <div style={styles.twoColumnGrid}>
                  <SectionCard title="Physical Test" icon={<FaFlask />}>
                    <div style={styles.testResult}>
                      {order.physical_test ||
                        "No physical test results recorded"}
                    </div>
                  </SectionCard>

                  <SectionCard title="Chemical Test" icon={<FaFlask />}>
                    <div style={styles.testResult}>
                      {order.chemical_test ||
                        "No chemical test results recorded"}
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="During Production Inspection"
                    icon={<FaClipboardCheck />}
                  >
                    <div style={styles.testResult}>
                      {order.during_production_inspection ||
                        "No production inspection records"}
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Final Random Inspection"
                    icon={<FaClipboardCheck />}
                  >
                    <div style={styles.testResult}>
                      {order.final_random_inspection ||
                        "No final inspection records"}
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* Files Tab */}
            {activeTab === "files" && (
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
          </div>

          {/* Remarks Section */}
          {order.remarks && activeTab !== "details" && (
            <SectionCard title="Remarks" icon={<FaComments />}>
              <div style={styles.remarksContent}>{order.remarks}</div>
            </SectionCard>
          )}

          {/* Footer Actions */}
          <div style={styles.footerActions}>
            <button
              style={styles.btnOutline}
              onClick={() => navigate("/orders")}
            >
              <FaArrowLeft style={{ marginRight: "8px" }} /> Back to List
            </button>
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

// Styles
const styles = {
  appContainer: {
    display: "flex",
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#0f172a",
    height: "100vh",
    overflow: "hidden",
  },
  mainContent: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    height: "100vh",
  },
  orderDetailContainer: {
    maxWidth: "1400px",
    margin: "0 auto",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: 600,
    color: "#0f172a",
    margin: 0,
    marginBottom: "4px",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  warningBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    backgroundColor: "#fef3c7",
    color: "#d97706",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 500,
  },
  btnIcon: {
    display: "flex",
    padding: "8px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#475569",
    background: "white",
    border: "1px solid #e2e8f0",
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    padding: "8px 20px",
    borderRadius: "8px",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "none",
    background: "#2563eb",
    color: "white",
  },
  btnDanger: {
    display: "flex",
    alignItems: "center",
    padding: "8px 20px",
    borderRadius: "8px",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "none",
    background: "#ef4444",
    color: "white",
  },
  btnDangerOutline: {
    display: "flex",
    alignItems: "center",
    padding: "8px 20px",
    borderRadius: "8px",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid #ef4444",
    background: "transparent",
    color: "#ef4444",
  },
  btnOutline: {
    display: "flex",
    alignItems: "center",
    padding: "8px 20px",
    borderRadius: "8px",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#475569",
  },
  btnCancel: {
    padding: "4px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
    fontSize: "12px",
  },
  btnConfirm: {
    padding: "4px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontSize: "12px",
  },
  deleteConfirm: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 12px",
    backgroundColor: "#fee2e2",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#dc2626",
  },
  progressSection: {
    background: "white",
    borderRadius: "16px",
    padding: "20px 24px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    flexWrap: "wrap",
    gap: "8px",
  },
  progressTitle: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#64748b",
    marginRight: "16px",
  },
  progressStats: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#2563eb",
  },
  progressCount: {
    fontSize: "13px",
    color: "#64748b",
  },
  progressBarContainer: {
    height: "8px",
    backgroundColor: "#e2e8f0",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "24px",
  },
  metricCard: {
    background: "white",
    borderRadius: "16px",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s",
  },
  metricIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },
  metricContent: {
    display: "flex",
    flexDirection: "column",
  },
  metricTitle: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "4px",
  },
  metricValue: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#0f172a",
  },
  tabsContainer: {
    display: "flex",
    gap: "8px",
    background: "white",
    borderRadius: "12px",
    padding: "8px",
    border: "1px solid #e2e8f0",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  tabButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
    border: "none",
    background: "transparent",
    color: "#64748b",
  },
  tabButtonActive: {
    background: "#eff6ff",
    color: "#2563eb",
  },
  tabContent: {
    marginBottom: "24px",
  },
  tabPanel: {
    animation: "fadeIn 0.3s ease",
  },
  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
  },
  sectionCard: {
    background: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    marginBottom: "24px",
  },
  sectionHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
    background: "#fafafa",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  sectionIcon: {
    fontSize: "18px",
    color: "#2563eb",
  },
  sectionHeading: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1e293b",
    margin: 0,
  },
  sectionContent: {
    padding: "20px",
  },
  sectionSubtitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  infoLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#64748b",
  },
  infoIcon: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  infoValue: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#0f172a",
  },
  timelineContainer: {
    position: "relative",
    paddingLeft: "24px",
  },
  timelineItem: {
    display: "flex",
    gap: "16px",
    paddingBottom: "24px",
    position: "relative",
  },
  timelineDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#cbd5e1",
    marginTop: "4px",
    flexShrink: 0,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: "4px",
  },
  timelineDate: {
    fontSize: "13px",
    color: "#64748b",
  },
  testResult: {
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#334155",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  },
  remarksContent: {
    padding: "16px",
    backgroundColor: "#fefce8",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#854d0e",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  },
  footerActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    paddingTop: "24px",
    borderTop: "1px solid #e2e8f0",
  },
  footerRightActions: {
    display: "flex",
    gap: "12px",
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "200px",
    textAlign: "center",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginBottom: "20px",
  },
  errorState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    textAlign: "center",
  },
  errorIcon: {
    width: "48px",
    height: "48px",
    background: "#fee2e2",
    color: "#ef4444",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "16px",
  },
  snackbar: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    padding: "12px 20px",
    borderRadius: "10px",
    color: "white",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    zIndex: 1000,
    animation: "slideIn 0.3s ease",
  },
  snackbarClose: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "20px",
    cursor: "pointer",
    padding: "0 4px",
  },
  colorTableWrapper: {
    overflowX: "auto",
  },
  colorTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  colorTableHeader: {
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderBottom: "2px solid #e2e8f0",
    textAlign: "center",
    fontWeight: 600,
    color: "#475569",
  },
  colorTableCell: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "center",
  },
  colorTableFooter: {
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderTop: "2px solid #e2e8f0",
    textAlign: "center",
    fontWeight: 500,
  },
  colorCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  colorDot: {
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    border: "1px solid #e2e8f0",
  },
  colorName: {
    fontWeight: 500,
    color: "#1e293b",
  },
  quantityBadge: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: "#f1f5f9",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#475569",
  },
  totalBadge: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 600,
  },
  grandTotalBadge: {
    display: "inline-block",
    padding: "6px 16px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: 700,
  },
  emptyColorState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
  },
  emptyColorIcon: {
    fontSize: "48px",
    color: "#cbd5e1",
    marginBottom: "16px",
  },
  filesSection: {
    padding: "8px 0",
  },
  imagesSection: {
    marginBottom: "32px",
  },
  attachmentsSection: {
    marginTop: "16px",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "16px",
  },
  imageCard: {
    position: "relative",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "#f8fafc",
    transition: "all 0.2s",
    cursor: "pointer",
  },
  imagePreview: {
    width: "100%",
    height: "160px",
    objectFit: "cover",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    opacity: 0,
    transition: "opacity 0.2s",
  },
  imageActionBtn: {
    background: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px",
    cursor: "pointer",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    fontSize: "14px",
  },
  imageName: {
    padding: "8px 12px",
    fontSize: "12px",
    color: "#64748b",
    textAlign: "center",
    borderTop: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  attachmentsList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  attachmentCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s",
  },
  attachmentIcon: {
    fontSize: "28px",
    color: "#64748b",
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#1e293b",
    marginBottom: "4px",
  },
  attachmentType: {
    fontSize: "11px",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  attachmentActions: {
    display: "flex",
    gap: "8px",
  },
  attachmentActionBtn: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "6px 10px",
    cursor: "pointer",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    transition: "all 0.2s",
  },
  emptyFilesState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
  },
  emptyFilesIcon: {
    fontSize: "48px",
    color: "#cbd5e1",
    marginBottom: "16px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "500px",
    overflow: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#0f172a",
    margin: 0,
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#64748b",
  },
  modalBody: {
    padding: "24px",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "16px 24px",
    borderTop: "1px solid #e2e8f0",
  },
  modalCancel: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    fontSize: "14px",
  },
  modalSubmit: {
    padding: "8px 20px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  renameSection: {
    marginBottom: "20px",
  },
  currentFileName: {
    padding: "10px",
    backgroundColor: "#f1f5f9",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#475569",
    marginTop: "4px",
  },
  renameInput: {
    width: "100%",
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    marginTop: "4px",
    outline: "none",
  },
  fileExtensionHint: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px",
  },
  uploadLabel: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#334155",
    marginBottom: "6px",
    display: "block",
  },
  imageViewerModal: {
    backgroundColor: "white",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "900px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  imageViewerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
  },
  imageViewerBody: {
    flex: 1,
    padding: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "auto",
  },
  fullImage: {
    maxWidth: "100%",
    maxHeight: "70vh",
    objectFit: "contain",
  },
  imageViewerFooter: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "16px 20px",
    borderTop: "1px solid #e2e8f0",
  },

  // =============================================================
  // COURIER TABLE STYLES - ADD THIS
  // =============================================================
  courierTableWrapper: {
    overflowX: "auto",
    marginTop: "8px",
  },
  courierTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  courierTableHeader: {
    padding: "12px 14px",
    backgroundColor: "#f8fafc",
    borderBottom: "2px solid #e2e8f0",
    textAlign: "left",
    fontWeight: 600,
    color: "#475569",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },
  courierTableRow: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.15s",
  },
  courierTableCell: {
    padding: "12px 14px",
    verticalAlign: "middle",
    fontSize: "13px",
    color: "#1e293b",
  },
  courierBookingRef: {
    fontWeight: 600,
    color: "#2563eb",
    fontSize: "13px",
  },
  courierName: {
    fontWeight: 500,
    color: "#0f172a",
  },
  courierTrackingNumber: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#475569",
    display: "block",
  },
  courierAwb: {
    fontSize: "11px",
    color: "#94a3b8",
    display: "block",
    marginTop: "2px",
  },
  courierType: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  courierOverdueBadge: {
    display: "inline-block",
    marginLeft: "6px",
    padding: "1px 8px",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    borderRadius: "10px",
    fontSize: "10px",
    fontWeight: 600,
  },
  courierActions: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },
  courierActionBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.2s",
    fontSize: "14px",
  },

  // Courier Stats Cards
  courierStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginTop: "16px",
  },
  courierStatCard: {
    background: "white",
    borderRadius: "12px",
    padding: "16px 20px",
    border: "1px solid #e2e8f0",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  courierStatValue: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#0f172a",
  },
  courierStatLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
  },
};

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