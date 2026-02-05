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

const SupplierDetailsCSR = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [copiedField, setCopiedField] = useState(null);

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
            onClick={() => navigate(`/edit-supplierCSR/${id}`)}
            style={styles.editButton}
          >
            ✏️ Edit Supplier
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
                  value={supplier.bsci_validity_days_remaining}
                />
                <InfoRow
                  label="Status"
                  value={
                    <span
                      style={{
                        ...styles.statusBadgeInline,
                        backgroundColor: getStatusColor(supplier.bsci_status)
                          .bg,
                        color: getStatusColor(supplier.bsci_status).text,
                      }}
                    >
                      {supplier.bsci_status?.toUpperCase() || "N/A"}
                    </span>
                  }
                />
              </div>
            </div>

            {/* Sedex Certification */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📜</span> Sedex Certification
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow
                  label="Last Audit Date"
                  value={formatDate(supplier.sedex_last_audit_date)}
                />
                <InfoRow label="Rating" value={supplier.sedex_rating} />
                <InfoRow
                  label="Validity"
                  value={formatDate(supplier.sedex_validity)}
                />
                <InfoRow
                  label="Days Remaining"
                  value={supplier.sedex_validity_days_remaining}
                />
                <InfoRow
                  label="Status"
                  value={
                    <span
                      style={{
                        ...styles.statusBadgeInline,
                        backgroundColor: getStatusColor(supplier.sedex_status)
                          .bg,
                        color: getStatusColor(supplier.sedex_status).text,
                      }}
                    >
                      {supplier.sedex_status?.toUpperCase() || "N/A"}
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
                <CertificationRow
                  label="WRAP"
                  supplier={supplier}
                  prefix="wrap"
                />
                <CertificationRow
                  label="Security Audit"
                  supplier={supplier}
                  prefix="security_audit"
                />
                <CertificationRow
                  label="Oeko-Tex"
                  supplier={supplier}
                  prefix="oeko_tex"
                />
                <CertificationRow
                  label="GOTS"
                  supplier={supplier}
                  prefix="gots"
                />
                <CertificationRow
                  label="OCS"
                  supplier={supplier}
                  prefix="ocs"
                />
                <CertificationRow
                  label="GRS"
                  supplier={supplier}
                  prefix="grs"
                />
                <CertificationRow
                  label="RCS"
                  supplier={supplier}
                  prefix="rcs"
                />
                <CertificationRow
                  label="ISO 9001"
                  supplier={supplier}
                  prefix="iso_9001"
                />
                <CertificationRow
                  label="ISO 14001"
                  supplier={supplier}
                  prefix="iso_14001"
                />
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
                <LicenseRow
                  label="Validity"
                  supplier={supplier}
                  prefix="trade_license"
                />
                <LicenseRow
                  label="Days Remaining"
                  supplier={supplier}
                  prefix="trade_license"
                  daysField="days_remaining"
                />
              </div>
            </div>

            {/* Factory License */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🏭</span> Factory License
              </h3>
              <div style={styles.infoGrid}>
                <LicenseRow
                  label="Validity"
                  supplier={supplier}
                  prefix="factory_license"
                />
                <LicenseRow
                  label="Days Remaining"
                  supplier={supplier}
                  prefix="factory_license"
                  daysField="days_remaining"
                />
              </div>
            </div>

            {/* Fire License */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🚒</span> Fire License
              </h3>
              <div style={styles.infoGrid}>
                <LicenseRow
                  label="Validity"
                  supplier={supplier}
                  prefix="fire_license"
                />
                <LicenseRow
                  label="Days Remaining"
                  supplier={supplier}
                  prefix="fire_license"
                  daysField="days_remaining"
                />
              </div>
            </div>

            {/* Other Licenses */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📋</span> Other Licenses
              </h3>
              <div style={styles.infoGrid}>
                <LicenseRow
                  label="Membership"
                  supplier={supplier}
                  prefix="membership"
                />
                <LicenseRow
                  label="Group Insurance"
                  supplier={supplier}
                  prefix="group_insurance"
                />
                <InfoRow label="Boiler No" value={supplier.boiler_no} />
                <LicenseRow
                  label="Boiler License"
                  supplier={supplier}
                  prefix="boiler_license"
                />
                <LicenseRow
                  label="BERC License"
                  supplier={supplier}
                  prefix="berc_license"
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
                        backgroundColor: getStatusColor(
                          supplier.compliance_status,
                        ).bg,
                        color: getStatusColor(supplier.compliance_status).text,
                        padding: "0.25rem 0.75rem",
                      }}
                    >
                      {supplier.compliance_status
                        ?.replace("_", " ")
                        .toUpperCase() || "N/A"}
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
                  value={formatDate(
                    supplier.last_safety_committee_formation_date,
                  )}
                />
                <InfoRow
                  label="Last Safety Committee Meeting"
                  value={formatDate(
                    supplier.last_safety_committee_meeting_date,
                  )}
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
                <span style={styles.cardIcon}>🌱</span> Environmental
                Information
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
                <AuditRow
                  label="Initial Audit Date"
                  supplier={supplier}
                  prefix="structural"
                  field="initial_audit_date"
                />
                <AuditRow
                  label="Initial Findings"
                  supplier={supplier}
                  prefix="structural"
                  field="initial_findings"
                />
                <AuditRow
                  label="Last Follow-up Audit"
                  supplier={supplier}
                  prefix="structural"
                  field="last_follow_up_audit_date"
                />
                <AuditRow
                  label="Total Findings"
                  supplier={supplier}
                  prefix="structural"
                  field="total_findings"
                />
                <AuditRow
                  label="Total Corrected"
                  supplier={supplier}
                  prefix="structural"
                  field="total_corrected"
                />
                <AuditRow
                  label="Total In Progress"
                  supplier={supplier}
                  prefix="structural"
                  field="total_in_progress"
                />
                <AuditRow
                  label="Total Pending Verification"
                  supplier={supplier}
                  prefix="structural"
                  field="total_pending_verification"
                />
              </div>
            </div>

            {/* Fire Safety Audit */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🔥</span> Fire Safety Audit
              </h3>
              <div style={styles.infoGrid}>
                <AuditRow
                  label="Initial Audit Date"
                  supplier={supplier}
                  prefix="fire"
                  field="initial_audit_date"
                />
                <AuditRow
                  label="Initial Findings"
                  supplier={supplier}
                  prefix="fire"
                  field="initial_findings"
                />
                <AuditRow
                  label="Last Follow-up Audit"
                  supplier={supplier}
                  prefix="fire"
                  field="last_follow_up_audit_date"
                />
                <AuditRow
                  label="Total Findings"
                  supplier={supplier}
                  prefix="fire"
                  field="total_findings"
                />
                <AuditRow
                  label="Total Corrected"
                  supplier={supplier}
                  prefix="fire"
                  field="total_corrected"
                />
                <AuditRow
                  label="Total In Progress"
                  supplier={supplier}
                  prefix="fire"
                  field="total_in_progress"
                />
                <AuditRow
                  label="Total Pending Verification"
                  supplier={supplier}
                  prefix="fire"
                  field="total_pending_verification"
                />
              </div>
            </div>

            {/* Electrical Safety */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>⚡</span> Electrical Safety
              </h3>
              <div style={styles.infoGrid}>
                <AuditRow
                  label="Initial Audit Date"
                  supplier={supplier}
                  prefix="electrical"
                  field="initial_audit_date"
                />
                <AuditRow
                  label="Initial Findings"
                  supplier={supplier}
                  prefix="electrical"
                  field="initial_findings"
                />
                <AuditRow
                  label="Last Follow-up Audit"
                  supplier={supplier}
                  prefix="electrical"
                  field="last_follow_up_audit_date"
                />
                <AuditRow
                  label="Total Findings"
                  supplier={supplier}
                  prefix="electrical"
                  field="total_findings"
                />
                <AuditRow
                  label="Total Corrected"
                  supplier={supplier}
                  prefix="electrical"
                  field="total_corrected"
                />
                <AuditRow
                  label="Total In Progress"
                  supplier={supplier}
                  prefix="electrical"
                  field="total_in_progress"
                />
                <AuditRow
                  label="Total Pending Verification"
                  supplier={supplier}
                  prefix="electrical"
                  field="total_pending_verification"
                />
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
                  value={getBooleanDisplay(
                    supplier.tree_plantation_local_community,
                  )}
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
                  value={getBooleanDisplay(
                    supplier.any_gift_provided_during_festival,
                  )}
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
                {supplier.all_certificates &&
                supplier.all_certificates.length > 0 ? (
                  supplier.all_certificates.map(
                    (cert, index) =>
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
                      ),
                  )
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
  if (!value && value !== 0 && value !== false) return null;

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

// Reusable CertificationRow Component
const CertificationRow = ({ label, supplier, prefix }) => (
  <InfoRow
    label={label}
    value={
      <div>
        <div>Validity: {formatDate(supplier[`${prefix}_validity`])}</div>
        <div>
          Status:
          <span
            style={{
              ...styles.statusBadgeInline,
              backgroundColor: getStatusColor(supplier[`${prefix}_status`]).bg,
              color: getStatusColor(supplier[`${prefix}_status`]).text,
              marginLeft: "0.5rem",
            }}
          >
            {supplier[`${prefix}_status`]?.toUpperCase() || "N/A"}
          </span>
        </div>
      </div>
    }
  />
);

// Reusable LicenseRow Component
const LicenseRow = ({
  label,
  supplier,
  prefix,
  daysField = "days_remaining",
}) => (
  <InfoRow
    label={label}
    value={
      <div>
        <div>Validity: {formatDate(supplier[`${prefix}_validity`])}</div>
        <div>Days Remaining: {supplier[`${prefix}_${daysField}`] || "N/A"}</div>
      </div>
    }
  />
);

// Reusable AuditRow Component
const AuditRow = ({ label, supplier, prefix, field }) => (
  <InfoRow label={label} value={supplier[`${prefix}_${field}`] || "N/A"} />
);

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
    borderColor: "#3b82f6",
  },
  tabIcon: {
    fontSize: "1rem",
  },
  tabContent: {
    marginBottom: "2rem",
  },
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  documentsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
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
};

// Add CSS animation for spinner
const spinnerStyle = document.createElement("style");
spinnerStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinnerStyle);

export default SupplierDetailsCSR;
