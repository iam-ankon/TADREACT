import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";
import {
  FiArrowLeft,
  FiEdit2,
  FiPrinter,
  FiDownload,
  FiShare2,
  FiExternalLink,
  FiMapPin,
} from "react-icons/fi";
import {
  FaIndustry,
  FaFileContract,
  FaCertificate,
  FaMapMarkerAlt,
  FaBuilding,
  FaMoneyBillWave,
  FaRegStar,
  FaStar,
} from "react-icons/fa";
import { RiBankLine } from "react-icons/ri";
import { BsPersonLinesFill, BsThreeDotsVertical } from "react-icons/bs";
import { IoMdCheckmarkCircle } from "react-icons/io";

const DetailSupplier = () => {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await axios.get(
          `http://119.148.51.38:8000/api/merchandiser/api/supplier/${id}/`,
        );
        setSupplier(response.data);
      } catch (error) {
        console.error("Failed to fetch supplier details", error);
      }
    };

    fetchSupplier();
  }, [id]);

  if (!supplier) {
    return (
      <div className="supplier-loading-container">
        <Sidebar />
        <div className="supplier-loading-content">
          <div className="loading-pulse">
            <div className="spinner"></div>
            Loading supplier details...
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab supplier={supplier} />;
      case "financial":
        return <FinancialTab supplier={supplier} />;
      case "contacts":
        return <ContactsTab supplier={supplier} />;
      case "documents":
        return <DocumentsTab supplier={supplier} />;
      case "performance":
        return <PerformanceTab supplier={supplier} />;
      default:
        return <OverviewTab supplier={supplier} />;
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
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

  const getBooleanDisplay = (value) => {
    if (value === true) return "Yes";
    if (value === false) return "No";
    return "Not specified";
  };

  return (
    <div className="supplier-detail-container">
      <Sidebar />
      <div className="supplier-detail-content">
        {/* Header with back button and actions */}
        <div className="supplier-header-actions">
          <button onClick={() => navigate(-1)} className="back-button">
            <FiArrowLeft /> Back to Suppliers
          </button>
          <div className="action-buttons">
            <button className="action-button secondary">
              <FiEdit2 /> Edit
            </button>
            <button className="action-button secondary">
              <FiPrinter /> Print
            </button>
            <button className="action-button primary">
              <FiDownload /> Export
            </button>
          </div>
        </div>

        {/* Supplier header card */}
        <div className="supplier-header-card">
          <div className="supplier-header-content">
            <div className="supplier-avatar">
              {supplier?.supplier_name?.charAt(0) || "?"}
            </div>
            <div className="supplier-header-details">
              <div className="supplier-title-section">
                <div>
                  <h1 className="supplier-name">{supplier.supplier_name}</h1>
                  <p className="supplier-type">{supplier.supplier_category || "Category not specified"}</p>
                </div>
                <div className="supplier-actions">
                  <button onClick={toggleFavorite} className="favorite-button">
                    {isFavorite ? (
                      <FaStar className="favorite-icon active" />
                    ) : (
                      <FaRegStar className="favorite-icon" />
                    )}
                  </button>
                  <span
                    className={`supplier-rating rating-${supplier.compliance_status || "none"}`}
                  >
                    Status: {supplier.compliance_status || "Not rated"}
                  </span>
                </div>
              </div>
              <div className="supplier-meta-grid">
                <div className="supplier-meta-item">
                  <FaIndustry className="meta-icon" />
                  <span>
                    {supplier.production_process || "Production process not specified"}
                  </span>
                </div>
                <div className="supplier-meta-item">
                  <FaMapMarkerAlt className="meta-icon" />
                  <span>
                    {supplier.location || "Location not specified"}
                  </span>
                </div>
                <div className="supplier-meta-item">
                  <FaBuilding className="meta-icon" />
                  <span>
                    Est. {supplier.year_of_establishment || "Year not specified"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="supplier-tabs-container">
          <nav className="supplier-tabs">
            {[
              "overview",
              "financial",
              "contacts",
              "documents",
              "performance",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`supplier-tab ${activeTab === tab ? "active" : ""}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="tab-content-wrapper">{renderTabContent()}</div>
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .supplier-detail-container {
          display: flex;
          min-height: 100vh;
          background-color: #f8fafc;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
        }

        .supplier-detail-content {
          flex: 1;
          padding: 1rem;
          margin-left: 0;
          overflow-y: auto;
          max-height: 100vh;
        }

        /* Loading state */
        .supplier-loading-container {
          display: flex;
          min-height: 100vh;
        }

        .supplier-loading-content {
          flex: 1;
          padding: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-pulse {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #6b7280;
          font-size: 16px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          border-top-color: #3b82f6;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Header actions */
        .supplier-header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .back-button {
          display: flex;
          align-items: center;
          color: #3b82f6;
          font-weight: 500;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          transition: color 0.2s;
        }

        .back-button:hover {
          color: rgb(182, 195, 224);
        }

        .back-button svg {
          margin-right: 8px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .action-button {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #e2e8f0;
        }

        .action-button svg {
          margin-right: 8px;
        }

        .action-button.secondary {
          background-color: #ffffff;
          color: #374151;
        }

        .action-button.secondary:hover {
          background-color: #f9fafb;
        }

        .action-button.primary {
          background-color: #3b82f6;
          color: #ffffff;
          border-color: #3b82f6;
        }

        .action-button.primary:hover {
          background-color: #2563eb;
        }

        /* Supplier header card */
        .supplier-header-card {
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          padding: 24px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
        }

        .supplier-header-content {
          display: flex;
          align-items: flex-start;
        }

        .supplier-avatar {
          flex-shrink: 0;
          height: 72px;
          width: 72px;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          font-weight: bold;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
        }

        .supplier-header-details {
          margin-left: 20px;
          flex: 1;
        }

        .supplier-title-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .supplier-name {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .supplier-type {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }

        .supplier-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .favorite-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .favorite-icon {
          color: #d1d5db;
          font-size: 20px;
          transition: all 0.2s;
        }

        .favorite-icon.active {
          color: #f59e0b;
        }

        .supplier-rating {
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
        }

        .rating-A {
          background-color: #dcfce7;
          color: #166534;
        }

        .rating-B {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .rating-C {
          background-color: #fef9c3;
          color: #854d0e;
        }

        .rating-none {
          background-color: #f3f4f6;
          color: #374151;
        }

        .supplier-meta-grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .supplier-meta-item {
          display: flex;
          align-items: center;
          color: #4b5563;
          font-size: 14px;
        }

        .meta-icon {
          margin-right: 8px;
          color: #3b82f6;
          font-size: 16px;
        }

        /* Tabs */
        .supplier-tabs-container {
          margin-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .supplier-tabs {
          display: flex;
          gap: 8px;
        }

        .supplier-tab {
          white-space: nowrap;
          padding: 12px 16px;
          font-weight: 500;
          font-size: 14px;
          color: #6b7280;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 6px 6px 0 0;
        }

        .supplier-tab:hover {
          color: #374151;
          background-color: #f9fafb;
        }

        .supplier-tab.active {
          color: #3b82f6;
          border-color: #3b82f6;
          background-color: #f8fafc;
        }

        /* Tab content wrapper */
        .tab-content-wrapper {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Tab Components
const OverviewTab = ({ supplier }) => {
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

  const getBooleanDisplay = (value) => {
    if (value === true) return "Yes";
    if (value === false) return "No";
    return "Not specified";
  };

  return (
    <div className="tab-content">
      {/* Quick Stats */}
      <div className="stats-grid">
        <StatCard
          title="Total Manpower"
          value={supplier.total_manpower || "—"}
          icon={<FaFileContract />}
          color="#3b82f6"
        />
        <StatCard
          title="Yearly Turnover"
          value={supplier.yearly_turnover_usd ? `$${supplier.yearly_turnover_usd.toLocaleString()}` : "—"}
          icon={<FaMoneyBillWave />}
          color="#10b981"
        />
        <StatCard
          title="Capacity/Month"
          value={supplier.capacity_per_month || "—"}
          icon={<FaIndustry />}
          color="#8b5cf6"
        />
        <StatCard
          title="Sewing Lines"
          value={supplier.number_of_sewing_line || "—"}
          icon={<RiBankLine />}
          color="#f59e0b"
        />
      </div>

      {/* Company Information */}
      <SectionCard title="Company Information" icon={<FaBuilding />}>
        <div className="info-grid">
          <InfoField label="Supplier ID" value={supplier.supplier_id} />
          <InfoField label="SL No" value={supplier.sl_no} />
          <InfoField label="Supplier Category" value={supplier.supplier_category} />
          <InfoField label="Year of Establishment" value={supplier.year_of_establishment} />
          <InfoField label="Location" value={supplier.location} />
          <InfoField label="Production Process" value={supplier.production_process} />
          <InfoField label="Manufacturing Items" value={supplier.manufacturing_item} />
          <InfoField label="Existing Customers" value={supplier.existing_customer} fullWidth />
        </div>
      </SectionCard>

      {/* Building Information */}
      <SectionCard title="Building Information" icon={<FaBuilding />}>
        <div className="info-grid">
          <InfoField 
            label="Building Type" 
            value={
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {supplier.rented_building && <span className="building-tag">Rented</span>}
                {supplier.share_building && <span className="building-tag">Shared</span>}
                {supplier.own_property && <span className="building-tag">Owned</span>}
                {!supplier.rented_building && !supplier.share_building && !supplier.own_property && "Not specified"}
              </div>
            } 
          />
          <InfoField label="Building Details" value={supplier.building_details} />
          <InfoField label="Total Area" value={supplier.total_area ? `${supplier.total_area} sq ft` : "—"} />
          <InfoField label="Ownership Details" value={supplier.ownership_details} />
        </div>
      </SectionCard>

      {/* Contact Details */}
      <SectionCard title="Contact Details" icon={<BsPersonLinesFill />}>
        <div className="info-grid">
          <InfoField label="Factory Main Contact" value={supplier.factory_main_contact} />
          <InfoField label="Factory Merchandiser Contact" value={supplier.factory_merchandiser_contact} />
          <InfoField label="Factory HR/Compliance Contact" value={supplier.factory_hr_compliance_contact} />
          <InfoField label="Email" value={supplier.email} link />
          <InfoField label="Phone" value={supplier.phone} />
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard title="Address" icon={<FaMapMarkerAlt />}>
        <div className="info-grid">
          <InfoField label="Location" value={supplier.location} fullWidth />
        </div>
      </SectionCard>

      <style jsx>{`
        .tab-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .building-tag {
          background-color: #e2e8f0;
          color: #475569;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

const FinancialTab = ({ supplier }) => {
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "Not specified";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="tab-content">
      <SectionCard title="Financial Information" icon={<FaMoneyBillWave />}>
        <div className="info-grid">
          <InfoField
            label="Yearly Turnover (USD)"
            value={formatCurrency(supplier.yearly_turnover_usd)}
          />
          <InfoField label="Weekly Holiday" value={supplier.weekly_holiday} />
          <InfoField label="BGMEA Number" value={supplier.bgmea_number} />
          <InfoField label="RSC" value={supplier.rsc} />
          <InfoField label="TAD Group Order Status" value={supplier.tad_group_order_status} />
        </div>
      </SectionCard>

      <style jsx>{`
        .tab-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
      `}</style>
    </div>
  );
};

const ContactsTab = ({ supplier }) => {
  const getBooleanDisplay = (value) => {
    if (value === true) return "Yes";
    if (value === false) return "No";
    return "Not specified";
  };

  return (
    <div className="tab-content">
      <SectionCard title="Primary Contacts">
        <div className="info-grid">
          <InfoField label="Factory Main Contact" value={supplier.factory_main_contact} />
          <InfoField label="Factory Merchandiser Contact" value={supplier.factory_merchandiser_contact} />
          <InfoField label="Factory HR/Compliance Contact" value={supplier.factory_hr_compliance_contact} />
          <InfoField label="Email" value={supplier.email} link />
          <InfoField label="Phone" value={supplier.phone} />
        </div>
      </SectionCard>

      <style jsx>{`
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
      `}</style>
    </div>
  );
};

const DocumentsTab = ({ supplier }) => {
  return (
    <div className="tab-content">
      <SectionCard title="Certifications & Documents" icon={<FaCertificate />}>
        {supplier.all_certificates && supplier.all_certificates.length > 0 ? (
          <div className="documents-list">
            {supplier.all_certificates.map((cert, index) => (
              cert.url && (
                <div key={index} className="document-item">
                  <span className="document-icon">📄</span>
                  <div className="document-info">
                    <div className="document-name">{cert.name}</div>
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="document-link"
                    >
                      View Document
                    </a>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FaCertificate className="empty-icon" />
            <h3>No documents uploaded</h3>
            <p>Upload certificates and documents to track supplier compliance</p>
          </div>
        )}
      </SectionCard>

      <style jsx>{`
        .documents-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .document-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background-color: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .document-icon {
          font-size: 1.5rem;
          color: #3b82f6;
        }

        .document-info {
          flex: 1;
        }

        .document-name {
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .document-link {
          font-size: 0.875rem;
          color: #3b82f6;
          text-decoration: none;
        }

        .document-link:hover {
          text-decoration: underline;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 32px 0;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          color: #9ca3af;
          font-size: 24px;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #111827;
          font-size: 16px;
          font-weight: 600;
        }

        .empty-state p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          max-width: 300px;
        }
      `}</style>
    </div>
  );
};

const PerformanceTab = ({ supplier }) => {
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
    if (!status) return { bg: "#f8f9fa", text: "#6c757d" };
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "active":
      case "approved":
      case "valid":
      case "compliant":
        return { bg: "#d4edda", text: "#155724" };
      case "pending":
      case "under_review":
        return { bg: "#fff3cd", text: "#856404" };
      case "expired":
      case "cancelled":
      case "non_compliant":
        return { bg: "#f8d7da", text: "#721c24" };
      default:
        return { bg: "#f8f9fa", text: "#6c757d" };
    }
  };

  const getDaysRemainingColor = (days) => {
    if (!days && days !== 0) return { bg: "#6c757d", color: "white" };
    if (days <= 30) return { bg: "#dc3545", color: "white" };
    if (days <= 60) return { bg: "#ffc107", color: "black" };
    if (days <= 90) return { bg: "#28a745", color: "white" };
    return { bg: "#28a745", color: "white" };
  };

  return (
    <div className="tab-content">
      {/* Compliance Status */}
      <SectionCard title="Compliance Status" icon={<IoMdCheckmarkCircle />}>
        <div className="info-grid">
          <InfoField
            label="Compliance Status"
            value={
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(supplier.compliance_status).bg,
                  color: getStatusColor(supplier.compliance_status).text,
                }}
              >
                {supplier.compliance_status?.replace("_", " ").toUpperCase() || "N/A"}
              </span>
            }
          />
          <InfoField
            label="Grievance Mechanism"
            value={supplier.grievance_mechanism ? "Yes" : "No"}
          />
          <InfoField
            label="Last Grievance Resolution"
            value={formatDate(supplier.last_grievance_resolution_date)}
          />
          <InfoField
            label="Grievance Resolution Rate"
            value={supplier.grievance_resolution_rate ? `${supplier.grievance_resolution_rate}%` : "N/A"}
          />
        </div>
      </SectionCard>

      {/* Wages & Benefits */}
      <SectionCard title="Wages & Benefits" icon={<FaMoneyBillWave />}>
        <div className="info-grid">
          <InfoField label="Minimum Wages Paid" value={supplier.minimum_wages_paid ? "Yes" : "No"} />
          <InfoField label="Earn Leave Status" value={supplier.earn_leave_status ? "Yes" : "No"} />
          <InfoField label="Service Benefit" value={supplier.service_benefit ? "Yes" : "No"} />
          <InfoField label="Maternity Benefit" value={supplier.maternity_benefit ? "Yes" : "No"} />
          <InfoField label="Yearly Increment" value={supplier.yearly_increment ? "Yes" : "No"} />
          <InfoField label="Festival Bonus" value={supplier.festival_bonus ? "Yes" : "No"} />
          <InfoField label="Salary Due Status" value={supplier.salary_due_status ? "Yes" : "No"} />
          <InfoField label="Due Salary Month" value={supplier.due_salary_month} />
        </div>
      </SectionCard>

      {/* BSCI Certification */}
      <SectionCard title="BSCI Certification" icon={<FaCertificate />}>
        <div className="info-grid">
          <InfoField label="Last Audit Date" value={formatDate(supplier.bsci_last_audit_date)} />
          <InfoField label="Rating" value={supplier.bsci_rating} />
          <InfoField label="Validity" value={formatDate(supplier.bsci_validity)} />
          <InfoField
            label="Days Remaining"
            value={
              supplier.bsci_validity_days_remaining ? (
                <span
                  style={{
                    ...styles.daysRemaining,
                    backgroundColor: getDaysRemainingColor(supplier.bsci_validity_days_remaining).bg,
                    color: getDaysRemainingColor(supplier.bsci_validity_days_remaining).color,
                  }}
                >
                  {supplier.bsci_validity_days_remaining} days
                </span>
              ) : "—"
            }
          />
          <InfoField
            label="Status"
            value={
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(supplier.bsci_status).bg,
                  color: getStatusColor(supplier.bsci_status).text,
                }}
              >
                {supplier.bsci_status?.toUpperCase() || "N/A"}
              </span>
            }
          />
        </div>
      </SectionCard>

      {/* Oeko-Tex Certification */}
      <SectionCard title="Oeko-Tex Certification" icon={<FaCertificate />}>
        <div className="info-grid">
          <InfoField label="Validity" value={formatDate(supplier.oeko_tex_validity)} />
          <InfoField
            label="Days Remaining"
            value={
              supplier.oeko_tex_validity_days_remaining ? (
                <span
                  style={{
                    ...styles.daysRemaining,
                    backgroundColor: getDaysRemainingColor(supplier.oeko_tex_validity_days_remaining).bg,
                    color: getDaysRemainingColor(supplier.oeko_tex_validity_days_remaining).color,
                  }}
                >
                  {supplier.oeko_tex_validity_days_remaining} days
                </span>
              ) : "—"
            }
          />
          <InfoField
            label="Status"
            value={
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(supplier.oeko_tex_status).bg,
                  color: getStatusColor(supplier.oeko_tex_status).text,
                }}
              >
                {supplier.oeko_tex_status?.toUpperCase() || "N/A"}
              </span>
            }
          />
        </div>
      </SectionCard>

      {/* GOTS Certification */}
      <SectionCard title="GOTS Certification" icon={<FaCertificate />}>
        <div className="info-grid">
          <InfoField label="Validity" value={formatDate(supplier.gots_validity)} />
          <InfoField
            label="Days Remaining"
            value={
              supplier.gots_validity_days_remaining ? (
                <span
                  style={{
                    ...styles.daysRemaining,
                    backgroundColor: getDaysRemainingColor(supplier.gots_validity_days_remaining).bg,
                    color: getDaysRemainingColor(supplier.gots_validity_days_remaining).color,
                  }}
                >
                  {supplier.gots_validity_days_remaining} days
                </span>
              ) : "—"
            }
          />
          <InfoField
            label="Status"
            value={
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(supplier.gots_status).bg,
                  color: getStatusColor(supplier.gots_status).text,
                }}
              >
                {supplier.gots_status?.toUpperCase() || "N/A"}
              </span>
            }
          />
        </div>
      </SectionCard>

      {/* Fire License */}
      <SectionCard title="Fire License" icon={<FaCertificate />}>
        <div className="info-grid">
          <InfoField label="Validity" value={formatDate(supplier.fire_license_validity)} />
          <InfoField
            label="Days Remaining"
            value={
              supplier.fire_license_days_remaining ? (
                <span
                  style={{
                    ...styles.daysRemaining,
                    backgroundColor: getDaysRemainingColor(supplier.fire_license_days_remaining).bg,
                    color: getDaysRemainingColor(supplier.fire_license_days_remaining).color,
                  }}
                >
                  {supplier.fire_license_days_remaining} days
                </span>
              ) : "—"
            }
          />
        </div>
      </SectionCard>

      {/* Remarks */}
      {supplier.compliance_remarks && (
        <SectionCard title="Compliance Remarks" icon={<IoMdCheckmarkCircle />}>
          <p className="remarks-text">{supplier.compliance_remarks}</p>
        </SectionCard>
      )}

      {supplier.certification_remarks && (
        <SectionCard title="Certification Remarks" icon={<IoMdCheckmarkCircle />}>
          <p className="remarks-text">{supplier.certification_remarks}</p>
        </SectionCard>
      )}

      {supplier.license_remarks && (
        <SectionCard title="License Remarks" icon={<IoMdCheckmarkCircle />}>
          <p className="remarks-text">{supplier.license_remarks}</p>
        </SectionCard>
      )}

      <style jsx>{`
        .tab-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .remarks-text {
          margin: 0;
          color: #334155;
          font-size: 0.875rem;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

// UI Components
const StatCard = ({ title, value, icon, color = "#3b82f6" }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ backgroundColor: `${color}20`, color }}>
      {icon}
    </div>
    <div className="stat-content">
      <p className="stat-title">{title}</p>
      <p className="stat-value">{value}</p>
    </div>

    <style jsx>{`
      .stat-card {
        background-color: #ffffff;
        padding: 16px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
        border: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }

      .stat-icon {
        padding: 14px;
        border-radius: 10px;
        margin-right: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .stat-content {
        flex: 1;
      }

      .stat-title {
        font-size: 14px;
        font-weight: 500;
        color: #6b7280;
        margin: 0 0 4px 0;
      }

      .stat-value {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
        margin: 0;
      }
    `}</style>
  </div>
);

const SectionCard = ({ title, children, icon }) => (
  <div className="section-card">
    <div className="section-header">
      {icon && <div className="section-icon">{icon}</div>}
      <h2 className="section-title">{title}</h2>
    </div>
    <div className="section-content">{children}</div>

    <style jsx>{`
      .section-card {
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
        padding: 24px;
        border: 1px solid #e2e8f0;
      }

      .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #f3f4f6;
      }

      .section-icon {
        margin-right: 12px;
        color: #3b82f6;
        font-size: 18px;
      }

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
        margin: 0;
      }

      .section-content {
        animation: fadeIn 0.3s ease-out;
      }
    `}</style>
  </div>
);

const InfoField = ({ label, value, fullWidth = false, link = false }) => (
  <div className={`info-field ${fullWidth ? "full-width" : ""}`}>
    <p className="info-label">{label}</p>
    {link && value ? (
      <a
        href={value.startsWith("http") ? value : `https://${value}`}
        target="_blank"
        rel="noopener noreferrer"
        className="info-link"
      >
        {value} <FiExternalLink className="link-icon" />
      </a>
    ) : (
      <p className="info-value">{value || "—"}</p>
    )}

    <style jsx>{`
      .info-field {
        margin-bottom: 4px;
      }

      .info-field.full-width {
        grid-column: 1 / -1;
      }

      .info-label {
        font-size: 14px;
        font-weight: 500;
        color: #6b7280;
        margin-bottom: 6px;
      }

      .info-value {
        color: #111827;
        font-size: 15px;
        margin: 0;
        word-break: break-word;
        line-height: 1.5;
      }

      .info-link {
        color: #3b82f6;
        text-decoration: none;
        font-size: 15px;
        display: inline-flex;
        align-items: center;
        transition: color 0.2s;
      }

      .info-link:hover {
        color: #2563eb;
        text-decoration: underline;
      }

      .link-icon {
        margin-left: 4px;
        font-size: 14px;
      }
    `}</style>
  </div>
);

const styles = {
  statusBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "4px",
    fontSize: "0.875rem",
    fontWeight: "600",
    display: "inline-block",
  },
  daysRemaining: {
    padding: "0.25rem 0.75rem",
    borderRadius: "4px",
    fontSize: "0.875rem",
    fontWeight: "600",
    display: "inline-block",
  },
};

export default DetailSupplier;