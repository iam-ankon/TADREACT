import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSupplierById } from "../../api/supplierApi";

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

const getStatusColor = (status) => {
  if (!status) return { bg: "#f8f9fa", text: "#6c757d", border: "#e9ecef" };

  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "active":
    case "approved":
    case "valid":
    case "compliant":
      return { bg: "#d4edda", text: "#155724", border: "#c3e6cb" };
    case "pending":
    case "under_review":
      return { bg: "#fff3cd", text: "#856404", border: "#ffeaa7" };
    case "expired":
    case "cancelled":
    case "non_compliant":
      return { bg: "#f8d7da", text: "#721c24", border: "#f5c6cb" };
    case "conditional":
      return { bg: "#cfe2ff", text: "#084298", border: "#b6d4fe" };
    default:
      return { bg: "#f8f9fa", text: "#6c757d", border: "#e9ecef" };
  }
};

const getDaysRemainingColor = (days) => {
  if (!days && days !== 0) return { bg: "#6c757d", color: "white" };
  if (days <= 30) return { bg: "#dc3545", color: "white" };
  if (days <= 60) return { bg: "#ffc107", color: "black" };
  if (days <= 90) return { bg: "#28a745", color: "white" };
  return { bg: "#28a745", color: "white" };
};

const SupplierDetailsCSR = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [copiedField, setCopiedField] = useState(null);

  // Notification modal states
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [notificationResult, setNotificationResult] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState({
    bsci: false,
    oekoTex: false,
    gots: false,
    fireLicense: false,
  });

  useEffect(() => {
    fetchSupplierDetails();
  }, [id]);

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching supplier details for ID: ${id}`);

      const response = await getSupplierById(id);
      console.log("Supplier data received:", response.data);
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

    navigator.clipboard
      .writeText(text.toString())
      .then(() => {
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "Not specified";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getBooleanDisplay = (value) => {
    if (value === true) return "Yes";
    if (value === false) return "No";
    return "Not specified";
  };

  // Get eligible certifications for notification (90, 75, 60 days)
  const getEligibleNotifications = () => {
    if (!supplier) return [];

    const eligible = [];
    const targetDays = [90, 75, 60];

    // Check BSCI
    if (
      supplier.bsci_validity_days_remaining &&
      targetDays.includes(supplier.bsci_validity_days_remaining)
    ) {
      eligible.push({
        id: "bsci",
        name: "BSCI Certification",
        days: supplier.bsci_validity_days_remaining,
        expiry: supplier.bsci_validity,
        status: supplier.bsci_status
      });
    }

    // Check Oeko-Tex
    if (
      supplier.oeko_tex_validity_days_remaining &&
      targetDays.includes(supplier.oeko_tex_validity_days_remaining)
    ) {
      eligible.push({
        id: "oekoTex",
        name: "Oeko-Tex Certification",
        days: supplier.oeko_tex_validity_days_remaining,
        expiry: supplier.oeko_tex_validity,
        status: supplier.oeko_tex_status
      });
    }

    // Check GOTS
    if (
      supplier.gots_validity_days_remaining &&
      targetDays.includes(supplier.gots_validity_days_remaining)
    ) {
      eligible.push({
        id: "gots",
        name: "GOTS Certification",
        days: supplier.gots_validity_days_remaining,
        expiry: supplier.gots_validity,
        status: supplier.gots_status
      });
    }

    // Check Fire License
    if (
      supplier.fire_license_days_remaining &&
      targetDays.includes(supplier.fire_license_days_remaining)
    ) {
      eligible.push({
        id: "fireLicense",
        name: "Fire License",
        days: supplier.fire_license_days_remaining,
        expiry: supplier.fire_license_validity,
        status: supplier.fire_license_days_remaining > 0 ? "valid" : "expired"
      });
    }

    return eligible;
  };

  // Send expiry notifications
  const sendExpiryNotifications = async () => {
    const selected = Object.entries(selectedNotifications)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selected.length === 0) {
      alert("Please select at least one certification to notify");
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
      const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");

      const response = await fetch(
        `http://119.148.51.38:8000/api/merchandiser/api/supplier/${id}/send-expiry-notifications/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
          body: JSON.stringify({
            certifications: selected,
            from_email: "niloy@texweave.net",
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setNotificationResult({
          success: true,
          message: `✅ Notifications sent successfully to ${supplier.email}`,
          details: result,
        });

        // Reset selections
        setSelectedNotifications({
          bsci: false,
          oekoTex: false,
          gots: false,
          fireLicense: false,
        });
      } else {
        setNotificationResult({
          success: false,
          message: `❌ Failed to send notifications: ${result.error || "Unknown error"}`,
        });
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      setNotificationResult({
        success: false,
        message: `❌ Error: ${error.message}`,
      });
    } finally {
      setSendingNotifications(false);
    }
  };

  const tabs = [
    { id: "general", label: "General Info", icon: "🏢" },
    { id: "building", label: "Building & Manpower", icon: "🏭" },
    { id: "production", label: "Production", icon: "⚙️" },
    { id: "certifications", label: "Certifications", icon: "📜" },
    { id: "licenses", label: "Licenses", icon: "📋" },
    { id: "safety", label: "Safety", icon: "🚨" },
    { id: "compliance", label: "Compliance", icon: "✅" },
    { id: "pcSafety", label: "PC & Safety", icon: "👥" },
    { id: "environment", label: "Environment", icon: "🌱" },
    { id: "rsc", label: "RSC Audit", icon: "🔍" },
    { id: "csr", label: "CSR", icon: "🤝" },
    { id: "documents", label: "Documents", icon: "📎" },
  ];

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
            {error ||
              "The supplier you are looking for does not exist or has been removed."}
          </p>
          <div style={styles.errorActions}>
            <button onClick={() => navigate(-1)} style={styles.backButton}>
              ← Go Back
            </button>
            <button onClick={fetchSupplierDetails} style={styles.retryButton}>
              Retry
            </button>
            <Link to="/suppliersCSR" style={styles.browseButton}>
              Browse All Suppliers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header with Breadcrumb */}
      <div style={styles.header}>
        <div style={styles.breadcrumb}>
          <Link to="/csr-dashboard" style={styles.breadcrumbLink}>
            Dashboard
          </Link>
          <span style={styles.breadcrumbSeparator}>/</span>
          <Link to="/suppliersCSR" style={styles.breadcrumbLink}>
            Suppliers
          </Link>
          <span style={styles.breadcrumbSeparator}>/</span>
          <span style={styles.breadcrumbCurrent}>
            {supplier.supplier_name || "Supplier Details"}
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
            ✏️ Edit Supplier
          </button>
          <button
            onClick={() => setShowNotificationModal(true)}
            style={{
              ...styles.notifyButton,
              ...(getEligibleNotifications().length > 0 ? styles.notifyButtonActive : {})
            }}
            disabled={!supplier.email || supplier.email.trim() === ""}
            title={
              !supplier.email || supplier.email.trim() === ""
                ? "Supplier has no email address"
                : getEligibleNotifications().length > 0 
                  ? `${getEligibleNotifications().length} certification(s) at 90/75/60 days remaining`
                  : "No certifications at 90/75/60 days remaining"
            }
          >
            📧 Send Expiry Notifications
            {getEligibleNotifications().length > 0 && (
              <span style={styles.notifyBadge}>{getEligibleNotifications().length}</span>
            )}
          </button>
          <button onClick={fetchSupplierDetails} style={styles.refreshButton}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Supplier Header Card */}
      <div style={styles.supplierHeader}>
        <div style={styles.supplierBasicInfo}>
          <div style={styles.supplierLogo}>
            {supplier.supplier_name?.charAt(0) || "S"}
          </div>
          <div style={styles.supplierTitle}>
            <h1 style={styles.supplierName}>
              {supplier.supplier_name || "Unnamed Supplier"}
              <span style={styles.supplierId}>
                (ID: {supplier.supplier_id || "N/A"})
              </span>
            </h1>
            <div style={styles.supplierMeta}>
              <span style={styles.category}>
                Category:{" "}
                <strong>{supplier.supplier_category || "Not specified"}</strong>
              </span>
              <span style={styles.separator}>•</span>
              <span style={styles.established}>
                Est. {supplier.year_of_establishment || "N/A"}
              </span>
              <span style={styles.separator}>•</span>
              <span style={styles.location}>
                {supplier.location || "Location not specified"}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.statusSection}>
          <div style={styles.statusBadge}>
            <span
              style={{
                ...styles.statusDot,
                backgroundColor: getStatusColor(supplier.compliance_status).bg,
              }}
            ></span>
            <span style={styles.statusText}>
              {supplier.compliance_status?.toUpperCase() || "UNKNOWN"}
            </span>
          </div>
          <div style={styles.certificationStatus}>
            <span style={styles.certLabel}>Certification:</span>
            <span
              style={{
                ...styles.certValue,
                backgroundColor: supplier.is_certification_valid
                  ? "#d4edda"
                  : "#f8d7da",
                color: supplier.is_certification_valid ? "#155724" : "#721c24",
              }}
            >
              {supplier.is_certification_valid ? "Valid" : "Invalid/Expired"}
            </span>
          </div>
        </div>
      </div>

      {/* Days Remaining Summary Cards */}
      <div style={styles.daysSummary}>
        <h3 style={styles.daysSummaryTitle}>📅 Days Remaining Summary</h3>
        <div style={styles.daysGrid}>
          {/* BSCI Days */}
          <div style={styles.daysCard}>
            <div style={styles.daysCardHeader}>
              <span style={styles.daysCardIcon}>📜</span>
              <span style={styles.daysCardTitle}>BSCI</span>
            </div>
            <div style={styles.daysCardContent}>
              {supplier.bsci_validity_days_remaining ? (
                <>
                  <span style={{
                    ...styles.daysNumber,
                    backgroundColor: getDaysRemainingColor(supplier.bsci_validity_days_remaining).bg,
                    color: getDaysRemainingColor(supplier.bsci_validity_days_remaining).color,
                  }}>
                    {supplier.bsci_validity_days_remaining} days
                  </span>
                  <span style={styles.daysStatus}>
                    Status: {supplier.bsci_status || "N/A"}
                  </span>
                  <span style={styles.daysDate}>
                    Expires: {formatDate(supplier.bsci_validity)}
                  </span>
                  {[90, 75, 60].includes(supplier.bsci_validity_days_remaining) && (
                    <span style={styles.reminderBadge}>🔔 Reminder Due</span>
                  )}
                </>
              ) : (
                <span style={styles.daysNotAvailable}>Not Available</span>
              )}
            </div>
          </div>

          {/* Oeko-Tex Days */}
          <div style={styles.daysCard}>
            <div style={styles.daysCardHeader}>
              <span style={styles.daysCardIcon}>📜</span>
              <span style={styles.daysCardTitle}>Oeko-Tex</span>
            </div>
            <div style={styles.daysCardContent}>
              {supplier.oeko_tex_validity_days_remaining ? (
                <>
                  <span style={{
                    ...styles.daysNumber,
                    backgroundColor: getDaysRemainingColor(supplier.oeko_tex_validity_days_remaining).bg,
                    color: getDaysRemainingColor(supplier.oeko_tex_validity_days_remaining).color,
                  }}>
                    {supplier.oeko_tex_validity_days_remaining} days
                  </span>
                  <span style={styles.daysStatus}>
                    Status: {supplier.oeko_tex_status || "N/A"}
                  </span>
                  <span style={styles.daysDate}>
                    Expires: {formatDate(supplier.oeko_tex_validity)}
                  </span>
                  {[90, 75, 60].includes(supplier.oeko_tex_validity_days_remaining) && (
                    <span style={styles.reminderBadge}>🔔 Reminder Due</span>
                  )}
                </>
              ) : (
                <span style={styles.daysNotAvailable}>Not Available</span>
              )}
            </div>
          </div>

          {/* GOTS Days */}
          <div style={styles.daysCard}>
            <div style={styles.daysCardHeader}>
              <span style={styles.daysCardIcon}>📜</span>
              <span style={styles.daysCardTitle}>GOTS</span>
            </div>
            <div style={styles.daysCardContent}>
              {supplier.gots_validity_days_remaining ? (
                <>
                  <span style={{
                    ...styles.daysNumber,
                    backgroundColor: getDaysRemainingColor(supplier.gots_validity_days_remaining).bg,
                    color: getDaysRemainingColor(supplier.gots_validity_days_remaining).color,
                  }}>
                    {supplier.gots_validity_days_remaining} days
                  </span>
                  <span style={styles.daysStatus}>
                    Status: {supplier.gots_status || "N/A"}
                  </span>
                  <span style={styles.daysDate}>
                    Expires: {formatDate(supplier.gots_validity)}
                  </span>
                  {[90, 75, 60].includes(supplier.gots_validity_days_remaining) && (
                    <span style={styles.reminderBadge}>🔔 Reminder Due</span>
                  )}
                </>
              ) : (
                <span style={styles.daysNotAvailable}>Not Available</span>
              )}
            </div>
          </div>

          {/* Fire License Days */}
          <div style={styles.daysCard}>
            <div style={styles.daysCardHeader}>
              <span style={styles.daysCardIcon}>🚒</span>
              <span style={styles.daysCardTitle}>Fire License</span>
            </div>
            <div style={styles.daysCardContent}>
              {supplier.fire_license_days_remaining ? (
                <>
                  <span style={{
                    ...styles.daysNumber,
                    backgroundColor: getDaysRemainingColor(supplier.fire_license_days_remaining).bg,
                    color: getDaysRemainingColor(supplier.fire_license_days_remaining).color,
                  }}>
                    {supplier.fire_license_days_remaining} days
                  </span>
                  <span style={styles.daysStatus}>
                    Status: {supplier.fire_license_days_remaining > 0 ? "Valid" : "Expired"}
                  </span>
                  <span style={styles.daysDate}>
                    Expires: {formatDate(supplier.fire_license_validity)}
                  </span>
                  {[90, 75, 60].includes(supplier.fire_license_days_remaining) && (
                    <span style={styles.reminderBadge}>🔔 Reminder Due</span>
                  )}
                </>
              ) : (
                <span style={styles.daysNotAvailable}>Not Available</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tabButton,
                ...(activeTab === tab.id ? styles.tabButtonActive : {}),
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
        {activeTab === "general" && (
          <div style={styles.overviewGrid}>
            {/* Basic Information */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🏢</span> Basic Information
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow label="SL No" value={supplier.sl_no} />
                <InfoRow
                  label="Supplier ID"
                  value={supplier.supplier_id}
                  copyable
                  fieldName="supplier_id"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <InfoRow
                  label="Supplier Category"
                  value={supplier.supplier_category}
                />
                <InfoRow
                  label="Year of Establishment"
                  value={supplier.year_of_establishment}
                />
                <InfoRow label="Location" value={supplier.location} />
                <InfoRow
                  label="Building Type"
                  value={
                    <div style={styles.buildingType}>
                      {supplier.rented_building && (
                        <span style={styles.buildingTag}>Rented</span>
                      )}
                      {supplier.share_building && (
                        <span style={styles.buildingTag}>Shared</span>
                      )}
                      {supplier.own_property && (
                        <span style={styles.buildingTag}>Owned</span>
                      )}
                      {!supplier.rented_building &&
                        !supplier.share_building &&
                        !supplier.own_property && <span>Not specified</span>}
                    </div>
                  }
                />
              </div>
            </div>

            {/* Contact Information */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📞</span> Contact Information
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Factory Main Contact"
                  value={supplier.factory_main_contact}
                />
                <InfoRow
                  label="Factory Merchandiser Contact"
                  value={supplier.factory_merchandiser_contact}
                />
                <InfoRow
                  label="Factory HR/Compliance Contact"
                  value={supplier.factory_hr_compliance_contact}
                />
                <InfoRow
                  label="Email"
                  value={supplier.email}
                  copyable
                  fieldName="email"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <InfoRow
                  label="Phone"
                  value={supplier.phone}
                  copyable
                  fieldName="phone"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
              </div>
            </div>

            {/* Ownership Details */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>👑</span> Ownership Details
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Ownership Details"
                  value={supplier.ownership_details}
                />
                <InfoRow
                  label="Building Details"
                  value={supplier.building_details}
                />
                <InfoRow
                  label="Total Area"
                  value={
                    supplier.total_area
                      ? `${supplier.total_area} sq ft`
                      : "Not specified"
                  }
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "building" && (
          <div style={styles.overviewGrid}>
            {/* Manpower Details */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>👥</span> Manpower Details
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Workers - Male"
                  value={supplier.manpower_workers_male}
                />
                <InfoRow
                  label="Workers - Female"
                  value={supplier.manpower_workers_female}
                />
                <InfoRow
                  label="Staff - Male"
                  value={supplier.manpower_staff_male}
                />
                <InfoRow
                  label="Staff - Female"
                  value={supplier.manpower_staff_female}
                />
                <InfoRow
                  label="Total Manpower"
                  value={supplier.total_manpower}
                />
              </div>
            </div>

            {/* Building Information */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🏭</span> Building Information
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Building Type"
                  value={
                    <div style={styles.buildingType}>
                      {supplier.rented_building && (
                        <span style={styles.buildingTag}>Rented</span>
                      )}
                      {supplier.share_building && (
                        <span style={styles.buildingTag}>Shared</span>
                      )}
                      {supplier.own_property && (
                        <span style={styles.buildingTag}>Owned</span>
                      )}
                    </div>
                  }
                />
                <InfoRow
                  label="Building Details"
                  value={supplier.building_details}
                />
                <InfoRow
                  label="Total Area"
                  value={
                    supplier.total_area
                      ? `${supplier.total_area} sq ft`
                      : "Not specified"
                  }
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "production" && (
          <div style={styles.overviewGrid}>
            {/* Production Information */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>⚙️</span> Production Information
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Production Process"
                  value={supplier.production_process}
                />
                <InfoRow
                  label="Manufacturing Items"
                  value={supplier.manufacturing_item}
                />
                <InfoRow
                  label="Capacity per Month"
                  value={supplier.capacity_per_month}
                />
                <InfoRow
                  label="Business by Market"
                  value={supplier.business_by_market}
                />
                <InfoRow
                  label="Existing Customers"
                  value={supplier.existing_customer}
                />
                <InfoRow
                  label="Number of Sewing Lines"
                  value={supplier.number_of_sewing_line}
                />
                <InfoRow
                  label="Total Machineries"
                  value={supplier.total_number_of_machineries}
                />
                <InfoRow
                  label="Yearly Turnover (USD)"
                  value={formatCurrency(supplier.yearly_turnover_usd)}
                />
                <InfoRow
                  label="Weekly Holiday"
                  value={supplier.weekly_holiday}
                />
                <InfoRow label="BGMEA Number" value={supplier.bgmea_number} />
                <InfoRow label="RSC" value={supplier.rsc} />
                <InfoRow
                  label="TAD Group Order Status"
                  value={supplier.tad_group_order_status}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "certifications" && (
          <div style={styles.overviewGrid}>
            {/* BSCI Certification */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📜</span> BSCI Certification
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Last Audit Date"
                  value={formatDate(supplier.bsci_last_audit_date)}
                />
                <InfoRow label="Rating" value={supplier.bsci_rating} />
                <InfoRow
                  label="Validity"
                  value={formatDate(supplier.bsci_validity)}
                />
                <InfoRow
                  label="Days Remaining"
                  value={
                    <span
                      style={{
                        ...styles.daysRemaining,
                        backgroundColor: getDaysRemainingColor(supplier.bsci_validity_days_remaining).bg,
                        color: getDaysRemainingColor(supplier.bsci_validity_days_remaining).color,
                        padding: "0.5rem 1rem",
                        fontSize: "1rem",
                      }}
                    >
                      {supplier.bsci_validity_days_remaining} days
                      {[90, 75, 60].includes(supplier.bsci_validity_days_remaining) && (
                        <span style={styles.reminderIcon}> 🔔</span>
                      )}
                    </span>
                  }
                />
                <InfoRow
                  label="Status"
                  value={
                    <span
                      style={{
                        ...styles.statusBadgeInline,
                        backgroundColor: getStatusColor(supplier.bsci_status).bg,
                        color: getStatusColor(supplier.bsci_status).text,
                      }}
                    >
                      {supplier.bsci_status?.toUpperCase() || "N/A"}
                    </span>
                  }
                />
              </div>
            </div>

            {/* Oeko-Tex Certification */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📜</span> Oeko-Tex Certification
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Validity"
                  value={formatDate(supplier.oeko_tex_validity)}
                />
                <InfoRow
                  label="Days Remaining"
                  value={
                    <span
                      style={{
                        ...styles.daysRemaining,
                        backgroundColor: getDaysRemainingColor(supplier.oeko_tex_validity_days_remaining).bg,
                        color: getDaysRemainingColor(supplier.oeko_tex_validity_days_remaining).color,
                        padding: "0.5rem 1rem",
                        fontSize: "1rem",
                      }}
                    >
                      {supplier.oeko_tex_validity_days_remaining} days
                      {[90, 75, 60].includes(supplier.oeko_tex_validity_days_remaining) && (
                        <span style={styles.reminderIcon}> 🔔</span>
                      )}
                    </span>
                  }
                />
                <InfoRow
                  label="Status"
                  value={
                    <span
                      style={{
                        ...styles.statusBadgeInline,
                        backgroundColor: getStatusColor(supplier.oeko_tex_status).bg,
                        color: getStatusColor(supplier.oeko_tex_status).text,
                      }}
                    >
                      {supplier.oeko_tex_status?.toUpperCase() || "N/A"}
                    </span>
                  }
                />
              </div>
            </div>

            {/* GOTS Certification */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📜</span> GOTS Certification
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Validity"
                  value={formatDate(supplier.gots_validity)}
                />
                <InfoRow
                  label="Days Remaining"
                  value={
                    <span
                      style={{
                        ...styles.daysRemaining,
                        backgroundColor: getDaysRemainingColor(supplier.gots_validity_days_remaining).bg,
                        color: getDaysRemainingColor(supplier.gots_validity_days_remaining).color,
                        padding: "0.5rem 1rem",
                        fontSize: "1rem",
                      }}
                    >
                      {supplier.gots_validity_days_remaining} days
                      {[90, 75, 60].includes(supplier.gots_validity_days_remaining) && (
                        <span style={styles.reminderIcon}> 🔔</span>
                      )}
                    </span>
                  }
                />
                <InfoRow
                  label="Status"
                  value={
                    <span
                      style={{
                        ...styles.statusBadgeInline,
                        backgroundColor: getStatusColor(supplier.gots_status).bg,
                        color: getStatusColor(supplier.gots_status).text,
                      }}
                    >
                      {supplier.gots_status?.toUpperCase() || "N/A"}
                    </span>
                  }
                />
              </div>
            </div>

            {/* Fire License */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🚒</span> Fire License
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Validity"
                  value={formatDate(supplier.fire_license_validity)}
                />
                <InfoRow
                  label="Days Remaining"
                  value={
                    <span
                      style={{
                        ...styles.daysRemaining,
                        backgroundColor: getDaysRemainingColor(supplier.fire_license_days_remaining).bg,
                        color: getDaysRemainingColor(supplier.fire_license_days_remaining).color,
                        padding: "0.5rem 1rem",
                        fontSize: "1rem",
                      }}
                    >
                      {supplier.fire_license_days_remaining} days
                      {[90, 75, 60].includes(supplier.fire_license_days_remaining) && (
                        <span style={styles.reminderIcon}> 🔔</span>
                      )}
                    </span>
                  }
                />
              </div>
            </div>

            {/* Other Certifications */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📜</span> Other Certifications
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow label="WRAP" value={
                  <div>
                    <div>Validity: {formatDate(supplier.wrap_validity)}</div>
                    <div>Status: <span style={{
                      ...styles.statusBadgeInline,
                      backgroundColor: getStatusColor(supplier.wrap_status).bg,
                      color: getStatusColor(supplier.wrap_status).text,
                    }}>{supplier.wrap_status?.toUpperCase() || "N/A"}</span></div>
                  </div>
                } />
                <InfoRow label="Security Audit" value={
                  <div>
                    <div>Validity: {formatDate(supplier.security_audit_validity)}</div>
                    <div>Status: <span style={{
                      ...styles.statusBadgeInline,
                      backgroundColor: getStatusColor(supplier.security_audit_status).bg,
                      color: getStatusColor(supplier.security_audit_status).text,
                    }}>{supplier.security_audit_status?.toUpperCase() || "N/A"}</span></div>
                  </div>
                } />
                <InfoRow label="OCS" value={
                  <div>
                    <div>Validity: {formatDate(supplier.ocs_validity)}</div>
                    <div>Status: <span style={{
                      ...styles.statusBadgeInline,
                      backgroundColor: getStatusColor(supplier.ocs_status).bg,
                      color: getStatusColor(supplier.ocs_status).text,
                    }}>{supplier.ocs_status?.toUpperCase() || "N/A"}</span></div>
                  </div>
                } />
                <InfoRow label="GRS" value={
                  <div>
                    <div>Validity: {formatDate(supplier.grs_validity)}</div>
                    <div>Status: <span style={{
                      ...styles.statusBadgeInline,
                      backgroundColor: getStatusColor(supplier.grs_status).bg,
                      color: getStatusColor(supplier.grs_status).text,
                    }}>{supplier.grs_status?.toUpperCase() || "N/A"}</span></div>
                  </div>
                } />
                <InfoRow label="RCS" value={
                  <div>
                    <div>Validity: {formatDate(supplier.rcs_validity)}</div>
                    <div>Status: <span style={{
                      ...styles.statusBadgeInline,
                      backgroundColor: getStatusColor(supplier.rcs_status).bg,
                      color: getStatusColor(supplier.rcs_status).text,
                    }}>{supplier.rcs_status?.toUpperCase() || "N/A"}</span></div>
                  </div>
                } />
                <InfoRow label="ISO 9001" value={
                  <div>
                    <div>Validity: {formatDate(supplier.iso_9001_validity)}</div>
                    <div>Status: <span style={{
                      ...styles.statusBadgeInline,
                      backgroundColor: getStatusColor(supplier.iso_9001_status).bg,
                      color: getStatusColor(supplier.iso_9001_status).text,
                    }}>{supplier.iso_9001_status?.toUpperCase() || "N/A"}</span></div>
                  </div>
                } />
                <InfoRow label="ISO 14001" value={
                  <div>
                    <div>Validity: {formatDate(supplier.iso_14001_validity)}</div>
                    <div>Status: <span style={{
                      ...styles.statusBadgeInline,
                      backgroundColor: getStatusColor(supplier.iso_14001_status).bg,
                      color: getStatusColor(supplier.iso_14001_status).text,
                    }}>{supplier.iso_14001_status?.toUpperCase() || "N/A"}</span></div>
                  </div>
                } />
              </div>
            </div>

            {/* Certification Remarks */}
            {supplier.certification_remarks && (
              <div style={styles.infoCard}>
                <h3 style={styles.cardTitle}>
                  <span style={styles.cardIcon}>💬</span> Certification Remarks
                </h3>
                <p style={styles.remarksText}>
                  {supplier.certification_remarks}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "licenses" && (
          <div style={styles.overviewGrid}>
            {/* Trade License */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📋</span> Trade License
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Validity"
                  value={formatDate(supplier.trade_license_validity)}
                />
                <InfoRow
                  label="Days Remaining"
                  value={
                    <span style={{
                      ...styles.daysRemaining,
                      backgroundColor: getDaysRemainingColor(supplier.trade_license_days_remaining).bg,
                      color: getDaysRemainingColor(supplier.trade_license_days_remaining).color,
                    }}>
                      {supplier.trade_license_days_remaining} days
                    </span>
                  }
                />
              </div>
            </div>

            {/* Factory License */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🏭</span> Factory License
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Validity"
                  value={formatDate(supplier.factory_license_validity)}
                />
                <InfoRow
                  label="Days Remaining"
                  value={
                    <span style={{
                      ...styles.daysRemaining,
                      backgroundColor: getDaysRemainingColor(supplier.factory_license_days_remaining).bg,
                      color: getDaysRemainingColor(supplier.factory_license_days_remaining).color,
                    }}>
                      {supplier.factory_license_days_remaining} days
                    </span>
                  }
                />
              </div>
            </div>

            {/* Fire License */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🚒</span> Fire License
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Validity"
                  value={formatDate(supplier.fire_license_validity)}
                />
                <InfoRow
                  label="Days Remaining"
                  value={
                    <span style={{
                      ...styles.daysRemaining,
                      backgroundColor: getDaysRemainingColor(supplier.fire_license_days_remaining).bg,
                      color: getDaysRemainingColor(supplier.fire_license_days_remaining).color,
                    }}>
                      {supplier.fire_license_days_remaining} days
                    </span>
                  }
                />
              </div>
            </div>

            {/* Other Licenses */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📋</span> Other Licenses
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Membership"
                  value={
                    <div>
                      <div>Validity: {formatDate(supplier.membership_validity)}</div>
                      <div>Days: {supplier.membership_days_remaining || "N/A"}</div>
                    </div>
                  }
                />
                <InfoRow
                  label="Group Insurance"
                  value={
                    <div>
                      <div>Validity: {formatDate(supplier.group_insurance_validity)}</div>
                      <div>Days: {supplier.group_insurance_days_remaining || "N/A"}</div>
                    </div>
                  }
                />
                <InfoRow label="Boiler No" value={supplier.boiler_no} />
                <InfoRow
                  label="Boiler License"
                  value={
                    <div>
                      <div>Validity: {formatDate(supplier.boiler_license_validity)}</div>
                      <div>Days: {supplier.boiler_license_days_remaining || "N/A"}</div>
                    </div>
                  }
                />
                <InfoRow
                  label="BERC License"
                  value={
                    <div>
                      <div>Validity: {formatDate(supplier.berc_license_validity)}</div>
                      <div>Days: {supplier.berc_license_days_remaining || "N/A"}</div>
                    </div>
                  }
                />
              </div>
            </div>

            {/* License Remarks */}
            {supplier.license_remarks && (
              <div style={styles.infoCard}>
                <h3 style={styles.cardTitle}>
                  <span style={styles.cardIcon}>💬</span> License Remarks
                </h3>
                <p style={styles.remarksText}>{supplier.license_remarks}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "safety" && (
          <div style={styles.overviewGrid}>
            {/* Fire Safety */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🚨</span> Fire Safety
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Last Fire Training by FSCD"
                  value={formatDate(supplier.last_fire_training_by_fscd)}
                />
                <InfoRow
                  label="Next Fire Training Date"
                  value={formatDate(supplier.fscd_next_fire_training_date)}
                />
                <InfoRow
                  label="Last Fire Drill Record"
                  value={formatDate(supplier.last_fire_drill_record_by_fscd)}
                />
                <InfoRow
                  label="Next Drill Date"
                  value={formatDate(supplier.fscd_next_drill_date)}
                />
                <InfoRow
                  label="Total Fire Fighters/Rescuers"
                  value={supplier.total_fire_fighter_rescue_first_aider_fscd}
                />
              </div>
            </div>

            {/* Fire Safety Remarks */}
            {supplier.fire_safety_remarks && (
              <div style={styles.infoCard}>
                <h3 style={styles.cardTitle}>
                  <span style={styles.cardIcon}>💬</span> Fire Safety Remarks
                </h3>
                <p style={styles.remarksText}>{supplier.fire_safety_remarks}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "compliance" && (
          <div style={styles.overviewGrid}>
            {/* Compliance Status */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>✅</span> Compliance Status
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Compliance Status"
                  value={
                    <span
                      style={{
                        ...styles.statusBadgeInline,
                        backgroundColor: getStatusColor(supplier.compliance_status).bg,
                        color: getStatusColor(supplier.compliance_status).text,
                        padding: "0.25rem 0.75rem",
                      }}
                    >
                      {supplier.compliance_status?.replace("_", " ").toUpperCase() || "N/A"}
                    </span>
                  }
                />
                <InfoRow
                  label="Grievance Mechanism"
                  value={getBooleanDisplay(supplier.grievance_mechanism)}
                />
                <InfoRow
                  label="Last Grievance Resolution"
                  value={formatDate(supplier.last_grievance_resolution_date)}
                />
                <InfoRow
                  label="Grievance Resolution Rate"
                  value={
                    supplier.grievance_resolution_rate
                      ? `${supplier.grievance_resolution_rate}%`
                      : "N/A"
                  }
                />
              </div>
            </div>

            {/* Wages & Benefits */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>💰</span> Wages & Benefits
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Minimum Wages Paid"
                  value={getBooleanDisplay(supplier.minimum_wages_paid)}
                />
                <InfoRow
                  label="Earn Leave Status"
                  value={getBooleanDisplay(supplier.earn_leave_status)}
                />
                <InfoRow
                  label="Service Benefit"
                  value={getBooleanDisplay(supplier.service_benefit)}
                />
                <InfoRow
                  label="Maternity Benefit"
                  value={getBooleanDisplay(supplier.maternity_benefit)}
                />
                <InfoRow
                  label="Yearly Increment"
                  value={getBooleanDisplay(supplier.yearly_increment)}
                />
                <InfoRow
                  label="Festival Bonus"
                  value={getBooleanDisplay(supplier.festival_bonus)}
                />
                <InfoRow
                  label="Salary Due Status"
                  value={getBooleanDisplay(supplier.salary_due_status)}
                />
                <InfoRow
                  label="Due Salary Month"
                  value={supplier.due_salary_month}
                />
              </div>
            </div>

            {/* Remarks */}
            {(supplier.compliance_remarks || supplier.grievance_remarks) && (
              <div style={styles.infoCard}>
                <h3 style={styles.cardTitle}>
                  <span style={styles.cardIcon}>💬</span> Remarks
                </h3>
                {supplier.compliance_remarks && (
                  <div style={styles.remarksSection}>
                    <h4 style={styles.remarksTitle}>Compliance Remarks:</h4>
                    <p style={styles.remarksText}>
                      {supplier.compliance_remarks}
                    </p>
                  </div>
                )}
                {supplier.grievance_remarks && (
                  <div style={styles.remarksSection}>
                    <h4 style={styles.remarksTitle}>Grievance Remarks:</h4>
                    <p style={styles.remarksText}>
                      {supplier.grievance_remarks}
                    </p>
                  </div>
                )}
                {supplier.grievance_resolution_procedure && (
                  <div style={styles.remarksSection}>
                    <h4 style={styles.remarksTitle}>
                      Grievance Resolution Procedure:
                    </h4>
                    <p style={styles.remarksText}>
                      {supplier.grievance_resolution_procedure}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "pcSafety" && (
          <div style={styles.overviewGrid}>
            {/* Participation Committee */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>👥</span> Participation Committee
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Last PC Election Date"
                  value={formatDate(supplier.last_pc_election_date)}
                />
                <InfoRow
                  label="Last PC Meeting Date"
                  value={formatDate(supplier.last_pc_meeting_date)}
                />
              </div>
            </div>

            {/* Safety Committee */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🛡️</span> Safety Committee
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Last Safety Committee Formation"
                  value={formatDate(supplier.last_safety_committee_formation_date)}
                />
                <InfoRow
                  label="Last Safety Committee Meeting"
                  value={formatDate(supplier.last_safety_committee_meeting_date)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "environment" && (
          <div style={styles.overviewGrid}>
            {/* Environmental Information */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🌱</span> Environmental Information
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Water Test Report (DOE)"
                  value={formatDate(supplier.water_test_report_doe)}
                />
                <InfoRow
                  label="ZDHC Water Test Report"
                  value={formatDate(supplier.zdhc_water_test_report)}
                />
                <InfoRow
                  label="Higg FEM Self Assessment Score"
                  value={supplier.higg_fem_self_assessment_score}
                />
                <InfoRow
                  label="Higg FEM Verification Assessment Score"
                  value={supplier.higg_fem_verification_assessment_score}
                />
                <InfoRow
                  label="Behive Chemical Inventory"
                  value={getBooleanDisplay(supplier.behive_chemical_inventory)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "rsc" && (
          <div style={styles.overviewGrid}>
            {/* RSC Information */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🔍</span> RSC Information
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow label="RSC ID" value={supplier.rsc_id} />
                <InfoRow
                  label="Progress Rate"
                  value={
                    supplier.progress_rate
                      ? `${supplier.progress_rate}%`
                      : "N/A"
                  }
                />
              </div>
            </div>

            {/* Structural Safety */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🏗️</span> Structural Safety
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow label="Initial Audit Date" value={formatDate(supplier.structural_initial_audit_date)} />
                <InfoRow label="Initial Findings" value={supplier.structural_initial_findings} />
                <InfoRow label="Last Follow-up Audit" value={formatDate(supplier.structural_last_follow_up_audit_date)} />
                <InfoRow label="Total Findings" value={supplier.structural_total_findings} />
                <InfoRow label="Total Corrected" value={supplier.structural_total_corrected} />
                <InfoRow label="Total In Progress" value={supplier.structural_total_in_progress} />
                <InfoRow label="Total Pending Verification" value={supplier.structural_total_pending_verification} />
              </div>
            </div>

            {/* Fire Safety Audit */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🔥</span> Fire Safety Audit
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow label="Initial Audit Date" value={formatDate(supplier.fire_initial_audit_date)} />
                <InfoRow label="Initial Findings" value={supplier.fire_initial_findings} />
                <InfoRow label="Last Follow-up Audit" value={formatDate(supplier.fire_last_follow_up_audit_date)} />
                <InfoRow label="Total Findings" value={supplier.fire_total_findings} />
                <InfoRow label="Total Corrected" value={supplier.fire_total_corrected} />
                <InfoRow label="Total In Progress" value={supplier.fire_total_in_progress} />
                <InfoRow label="Total Pending Verification" value={supplier.fire_total_pending_verification} />
              </div>
            </div>

            {/* Electrical Safety */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>⚡</span> Electrical Safety
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow label="Initial Audit Date" value={formatDate(supplier.electrical_initial_audit_date)} />
                <InfoRow label="Initial Findings" value={supplier.electrical_initial_findings} />
                <InfoRow label="Last Follow-up Audit" value={formatDate(supplier.electrical_last_follow_up_audit_date)} />
                <InfoRow label="Total Findings" value={supplier.electrical_total_findings} />
                <InfoRow label="Total Corrected" value={supplier.electrical_total_corrected} />
                <InfoRow label="Total In Progress" value={supplier.electrical_total_in_progress} />
                <InfoRow label="Total Pending Verification" value={supplier.electrical_total_pending_verification} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "csr" && (
          <div style={styles.overviewGrid}>
            {/* CSR Information */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🤝</span> CSR Activities
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Donation to Local Community"
                  value={getBooleanDisplay(supplier.donation_local_community)}
                />
                <InfoRow
                  label="Tree Plantation in Local Community"
                  value={getBooleanDisplay(supplier.tree_plantation_local_community)}
                />
                <InfoRow
                  label="Sanitary Napkin Status"
                  value={getBooleanDisplay(supplier.sanitary_napkin_status)}
                />
                <InfoRow
                  label="Fair Shop"
                  value={getBooleanDisplay(supplier.fair_shop)}
                />
                <InfoRow
                  label="Any Gift Provided During Festival"
                  value={getBooleanDisplay(supplier.any_gift_provided_during_festival)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div style={styles.documentsGrid}>
            {/* Documents List */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📎</span> Certificates & Documents
              </h3>
              <div style={styles.documentsList}>
                {supplier.all_certificates && supplier.all_certificates.length > 0 ? (
                  supplier.all_certificates.map((cert, index) => (
                    cert.url && (
                      <div key={index} style={styles.documentItem}>
                        <span style={styles.documentIcon}>📄</span>
                        <div style={styles.documentInfo}>
                          <div style={styles.documentName}>{cert.name}</div>
                          <a
                            href={cert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.documentLink}
                          >
                            View Document
                          </a>
                        </div>
                      </div>
                    )
                  ))
                ) : (
                  <div style={styles.noDocuments}>
                    <span style={styles.noDocumentsIcon}>📂</span>
                    <p>No documents uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Send Expiry Notifications</h3>
              <button
                onClick={() => {
                  setShowNotificationModal(false);
                  setNotificationResult(null);
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
                  {notificationResult.details && (
                    <div style={styles.notificationDetails}>
                      <h4>Sent Notifications:</h4>
                      <ul>
                        {notificationResult.details.notifications?.map(
                          (notif, idx) => (
                            <li key={idx}>
                              {notif.cert_name} - {notif.days_remaining} days remaining
                            </li>
                          ),
                        )}
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
                      <strong>From:</strong> niloy@texweave.net
                    </p>
                    <p>
                      <strong>Reminder Days:</strong> 90, 75, 60 days before expiry
                    </p>
                  </div>

                  {!supplier.email ? (
                    <div style={styles.warningMessage}>
                      ⚠️ This supplier does not have an email address. Cannot
                      send notifications.
                    </div>
                  ) : (
                    <>
                      <h4 style={styles.modalSubtitle}>
                        Select certifications to notify (only those at 90/75/60 days shown):
                      </h4>

                      {getEligibleNotifications().map((item) => (
                        <label key={item.id} style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={selectedNotifications[item.id]}
                            onChange={(e) =>
                              setSelectedNotifications({
                                ...selectedNotifications,
                                [item.id]: e.target.checked,
                              })
                            }
                            style={styles.checkbox}
                          />
                          <div style={styles.checkboxContent}>
                            <span style={styles.certName}>{item.name}</span>
                            <span
                              style={{
                                ...styles.certDays,
                                backgroundColor: getDaysRemainingColor(item.days).bg,
                                color: getDaysRemainingColor(item.days).color,
                              }}
                            >
                              {item.days} days remaining
                            </span>
                            <span style={styles.certExpiry}>
                              Expires: {new Date(item.expiry).toLocaleDateString()}
                            </span>
                            <span style={styles.certStatus}>
                              Status: {item.status || "N/A"}
                            </span>
                          </div>
                        </label>
                      ))}

                      {getEligibleNotifications().length === 0 && (
                        <div style={styles.infoMessage}>
                          ℹ️ No certifications are at 90, 75, or 60 days
                          remaining. Check back later for reminders.
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
                  onClick={() => setShowNotificationModal(false)}
                  style={styles.modalSecondaryButton}
                >
                  Cancel
                </button>
                <button
                  onClick={sendExpiryNotifications}
                  disabled={sendingNotifications || getEligibleNotifications().length === 0}
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

      {/* Action Buttons at Bottom */}
      <div style={styles.actionButtons}>
        <button onClick={() => navigate(-1)} style={styles.secondaryButton}>
          ← Back to List
        </button>
        <button
          onClick={() => navigate(`/edit-supplierCSR/${id}`)}
          style={styles.primaryButton}
        >
          ✏️ Edit Supplier
        </button>
        <button onClick={fetchSupplierDetails} style={styles.secondaryButton}>
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

// Reusable InfoRow Component
const InfoRow = ({
  label,
  value,
  copyable = false,
  link = false,
  fieldName,
  copiedField,
  onCopy,
}) => {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}:</span>
      <div style={styles.infoValueContainer}>
        {link ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.infoLink}
          >
            {value}
          </a>
        ) : (
          <span style={styles.infoValue}>{value}</span>
        )}
        {copyable && (
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

const styles = {
  container: {
    padding: "3rem 5rem",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, sans-serif",
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
    color: "#64748b",
  },
  breadcrumbLink: {
    color: "#3b82f6",
    textDecoration: "none",
  },
  breadcrumbSeparator: {
    color: "#cbd5e1",
  },
  breadcrumbCurrent: {
    color: "#334155",
    fontWeight: "500",
  },
  headerActions: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  backButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  editButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  notifyButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.2s ease",
    position: "relative",
  },
  notifyButtonActive: {
    backgroundColor: "#fd7e14",
    animation: "pulse 2s infinite",
  },
  notifyBadge: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    backgroundColor: "#dc3545",
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
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  supplierHeader: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "2rem",
  },
  supplierBasicInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    flex: 1,
  },
  supplierLogo: {
    width: "80px",
    height: "80px",
    borderRadius: "12px",
    backgroundColor: "#3b82f6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    fontWeight: "bold",
  },
  supplierTitle: {
    flex: 1,
  },
  supplierName: {
    fontSize: "2rem",
    fontWeight: "800",
    color: "#1e293b",
    margin: "0 0 0.5rem 0",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  supplierId: {
    fontSize: "1rem",
    color: "#64748b",
    fontWeight: "normal",
  },
  supplierMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    color: "#64748b",
    fontSize: "0.875rem",
    flexWrap: "wrap",
  },
  category: {
    backgroundColor: "#f1f5f9",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
  },
  separator: {
    color: "#cbd5e1",
  },
  established: {
    color: "#6c757d",
  },
  location: {
    fontStyle: "italic",
  },
  statusSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "0.75rem",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    backgroundColor: "#f1f5f9",
    borderRadius: "20px",
  },
  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
  statusText: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#334155",
  },
  certificationStatus: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  certLabel: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  certValue: {
    fontSize: "0.875rem",
    fontWeight: "600",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
  },

  // Days Summary Styles
  daysSummary: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "2rem",
    border: "1px solid #e2e8f0",
  },
  daysSummaryTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 1.5rem 0",
  },
  daysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem",
  },
  daysCard: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "1rem",
    border: "1px solid #e2e8f0",
  },
  daysCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  daysCardIcon: {
    fontSize: "1.25rem",
  },
  daysCardTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#1e293b",
  },
  daysCardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  daysNumber: {
    fontSize: "1.5rem",
    fontWeight: "700",
    padding: "0.5rem",
    borderRadius: "6px",
    textAlign: "center",
  },
  daysStatus: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  daysDate: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  daysNotAvailable: {
    color: "#94a3b8",
    fontStyle: "italic",
  },
  reminderBadge: {
    backgroundColor: "#fd7e14",
    color: "white",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "600",
    textAlign: "center",
  },
  reminderIcon: {
    marginLeft: "0.5rem",
  },

  tabsContainer: {
    marginBottom: "2rem",
  },
  tabs: {
    display: "flex",
    gap: "0.5rem",
    overflowX: "auto",
    paddingBottom: "0.5rem",
  },
  tabButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
  },
  tabButtonActive: {
    backgroundColor: "#3b82f6",
    color: "white",
  },
  tabIcon: {
    fontSize: "1rem",
  },
  tabContent: {
    marginBottom: "2rem",
  },
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "1.5rem",
  },
  documentsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "1.5rem",
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0",
  },
  cardTitle: {
    fontSize: "1.125rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 1.5rem 0",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  cardIcon: {
    fontSize: "1.25rem",
  },
  infoGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
  },
  infoLabel: {
    fontSize: "0.875rem",
    color: "#64748b",
    fontWeight: "500",
    minWidth: "120px",
    flexShrink: 0,
  },
  infoValueContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  infoValue: {
    fontSize: "0.875rem",
    color: "#334155",
    fontWeight: "500",
    wordBreak: "break-word",
  },
  infoLink: {
    fontSize: "0.875rem",
    color: "#3b82f6",
    textDecoration: "none",
    wordBreak: "break-word",
  },
  copyButton: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    color: "#64748b",
    padding: "0.25rem",
    borderRadius: "4px",
    flexShrink: 0,
  },
  buildingType: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  buildingTag: {
    backgroundColor: "#e2e8f0",
    color: "#475569",
    padding: "0.25rem 0.75rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "500",
  },
  daysRemaining: {
    padding: "0.25rem 0.75rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "600",
    display: "inline-block",
  },
  statusBadgeInline: {
    padding: "0.125rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "600",
    display: "inline-block",
  },
  remarksText: {
    margin: 0,
    color: "#334155",
    fontSize: "0.875rem",
    lineHeight: 1.6,
  },
  remarksSection: {
    marginBottom: "1rem",
  },
  remarksTitle: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "0.5rem",
  },
  documentsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  documentItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  documentIcon: {
    fontSize: "1.5rem",
    color: "#3b82f6",
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontWeight: "500",
    marginBottom: "0.25rem",
  },
  documentLink: {
    fontSize: "0.875rem",
    color: "#3b82f6",
    textDecoration: "none",
  },
  noDocuments: {
    textAlign: "center",
    padding: "2rem",
    color: "#64748b",
  },
  noDocumentsIcon: {
    fontSize: "3rem",
    color: "#cbd5e1",
    marginBottom: "1rem",
    display: "block",
  },
  actionButtons: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    paddingTop: "2rem",
    borderTop: "1px solid #e2e8f0",
  },
  primaryButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  secondaryButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
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
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "1rem",
    color: "#64748b",
    fontSize: "0.875rem",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
  },
  errorContent: {
    textAlign: "center",
    maxWidth: "400px",
  },
  errorIcon: {
    fontSize: "3rem",
    color: "#dc2626",
    marginBottom: "1rem",
    display: "block",
  },
  errorTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 0.5rem 0",
  },
  errorMessage: {
    color: "#64748b",
    marginBottom: "2rem",
  },
  errorActions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
  },
  browseButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#3b82f6",
    color: "white",
    textDecoration: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: "500",
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
    maxWidth: "500px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    padding: "1.5rem",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: "1.25rem",
    cursor: "pointer",
    color: "#64748b",
    padding: "0.5rem",
  },
  modalBody: {
    padding: "1.5rem",
  },
  modalFooter: {
    padding: "1.5rem",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
  },
  modalInfo: {
    backgroundColor: "#f8fafc",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
  },
  modalSubtitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "1rem",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
    padding: "1rem",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    marginBottom: "0.75rem",
    cursor: "pointer",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s ease",
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
  certName: {
    display: "block",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "0.25rem",
  },
  certDays: {
    display: "inline-block",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "600",
    marginRight: "0.5rem",
    marginBottom: "0.25rem",
  },
  certExpiry: {
    fontSize: "0.75rem",
    color: "#64748b",
    marginRight: "0.5rem",
  },
  certStatus: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  successMessage: {
    backgroundColor: "#d4edda",
    color: "#155724",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #c3e6cb",
    textAlign: "center",
  },
  errorMessage: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #f5c6cb",
    textAlign: "center",
  },
  warningMessage: {
    backgroundColor: "#fff3cd",
    color: "#856404",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #ffeaa7",
    textAlign: "center",
  },
  infoMessage: {
    backgroundColor: "#d1ecf1",
    color: "#0c5460",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #bee5eb",
    textAlign: "center",
  },
  notificationDetails: {
    marginTop: "1rem",
    textAlign: "left",
    fontSize: "0.875rem",
  },
  modalButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#3b82f6",
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
    backgroundColor: "#fd7e14",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  modalSecondaryButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#6c757d",
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
  retryButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
};

// Add CSS animation for spinner and pulse
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

export default SupplierDetailsCSR;