// pages/orders/DetailOrder.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { getOrderById, deleteOrder } from "../../api/merchandiser";
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
      setOrder(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching order:", error);
      setError(error.response?.data?.message || "Error loading order details");
    } finally {
      setLoading(false);
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

  const handleDownload = () => {
    console.log("Downloading order...");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "dd MMM yyyy");
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
      <div style={{ ...styles.metricIcon, backgroundColor: color + "15", color: color }}>
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
            <h3 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "8px" }}>
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
              {daysToShipment !== null && daysToShipment <= 7 && daysToShipment > 0 && (
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
                title="Download"
              >
                <FaDownload />
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
                  <button
                    style={styles.btnConfirm}
                    onClick={handleDelete}
                  >
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
                {formatNumber(order.shipped_qty)} / {formatNumber(order.total_qty)} pcs shipped
              </span>
            </div>
            <div style={styles.progressBarContainer}>
              <div
                style={{
                  ...styles.progressBar,
                  width: `${completionPercentage}%`,
                  backgroundColor: completionPercentage >= 100 ? "#10b981" : "#3b82f6",
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

          {/* Tabs */}
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
              id="timeline"
              label="Timeline"
              icon={<FaRegClock />}
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
                      value={order.customer}
                      icon={<FaUser />}
                    />
                    <InfoRow
                      label="Supplier"
                      value={order.supplier}
                      icon={<FaIndustry />}
                    />
                    <InfoRow
                      label="Style"
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
                      label="Shipment Month"
                      value={order.shipment_month}
                      icon={<FaCalendarAlt />}
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
                      label="Department"
                      value={order.department}
                      icon={<FaBuilding />}
                    />
                    <InfoRow
                      label="Ref No"
                      value={order.ref_no}
                      icon={<FaFileAlt />}
                    />
                    <InfoRow
                      label="Gender"
                      value={order.gender}
                      icon={<FaUser />}
                    />
                    <InfoRow
                      label="Size Range"
                      value={order.size_range}
                      icon={<FaRuler />}
                    />
                    <InfoRow
                      label="WGR"
                      value={order.wgr}
                      icon={<FaChartLine />}
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
                  </SectionCard>

                  <SectionCard title="Additional Information" icon={<FaUsers />}>
                    <InfoRow
                      label="Group Name"
                      value={order.group_name}
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

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <div style={styles.tabPanel}>
                <SectionCard title="Order Timeline" icon={<FaRegClock />}>
                  <div style={styles.timelineContainer}>
                    {order.final_inspection_date && (
                      <div style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineTitle}>Final Inspection</div>
                          <div style={styles.timelineDate}>
                            {formatDate(order.final_inspection_date)}
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
                      <div style={{ ...styles.timelineDot, backgroundColor: statusConfigData.color }} />
                      <div style={styles.timelineContent}>
                        <div style={styles.timelineTitle}>Current Status</div>
                        <div style={styles.timelineDate}>
                          {order.status} • {completionPercentage.toFixed(1)}% completed
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* Test Results Tab */}
            {activeTab === "tests" && (
              <div style={styles.tabPanel}>
                <div style={styles.twoColumnGrid}>
                  <SectionCard title="Physical Test" icon={<FaFlask />}>
                    <div style={styles.testResult}>
                      {order.physical_test || "No physical test results recorded"}
                    </div>
                  </SectionCard>

                  <SectionCard title="Chemical Test" icon={<FaFlask />}>
                    <div style={styles.testResult}>
                      {order.chemical_test || "No chemical test results recorded"}
                    </div>
                  </SectionCard>

                  <SectionCard title="During Production Inspection" icon={<FaClipboardCheck />}>
                    <div style={styles.testResult}>
                      {order.during_production_inspection || "No production inspection records"}
                    </div>
                  </SectionCard>

                  <SectionCard title="Final Random Inspection" icon={<FaClipboardCheck />}>
                    <div style={styles.testResult}>
                      {order.final_random_inspection || "No final inspection records"}
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}
          </div>

          {/* Remarks Section */}
          {order.remarks && (
            <SectionCard title="Remarks" icon={<FaComments />}>
              <div style={styles.remarksContent}>
                {order.remarks}
              </div>
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
    </div>
  );
};

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
  backButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "#475569",
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
    cursor: "pointer",
    color: "#f59e0b",
    borderColor: "#f59e0b",
    background: "#fff3cd",
    border: "1px solid #e2e8f0",
    marginTop: "4px",
    marginBottom: "5px",
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
  btnConfirm: {
    padding: "4px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontSize: "12px",
  },
  btnCancel: {
    padding: "4px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
    fontSize: "12px",
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
    minHeight: "400px",
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
};

// Add keyframe animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  button:hover {
    transform: translateY(-1px);
  }
  
  .btn-primary:hover {
    background: #1d4ed8;
  }
  
  .btn-danger:hover {
    background: #dc2626;
  }
  
  .btn-icon:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
  
  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  .section-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
`;
document.head.appendChild(styleSheet);

export default DetailOrder;