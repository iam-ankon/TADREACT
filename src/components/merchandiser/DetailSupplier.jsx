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
          `http://119.148.51.38:8000/api/merchandiser/api/supplier/${id}/`
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
            <div className="supplier-avatar">{supplier.name.charAt(0)}</div>
            <div className="supplier-header-details">
              <div className="supplier-title-section">
                <div>
                  <h1 className="supplier-name">{supplier.name}</h1>
                  <p className="supplier-type">{supplier.vendor_type}</p>
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
                    className={`supplier-rating rating-${
                      supplier.vendor_rating || "none"
                    }`}
                  >
                    Rating: {supplier.vendor_rating || "Not rated"}
                  </span>
                </div>
              </div>
              <div className="supplier-meta-grid">
                <div className="supplier-meta-item">
                  <FaIndustry className="meta-icon" />
                  <span>
                    {supplier.business_type || "Business type not specified"}
                  </span>
                </div>
                <div className="supplier-meta-item">
                  <FaMapMarkerAlt className="meta-icon" />
                  <span>
                    {supplier.town_city}, {supplier.country_region}
                  </span>
                </div>
                <div className="supplier-meta-item">
                  <FaBuilding className="meta-icon" />
                  <span>
                    Est. {supplier.year_established || "Year not specified"}
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
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
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
const OverviewTab = ({ supplier }) => (
  <div className="tab-content">
    {/* Quick Stats */}
    <div className="stats-grid">
      <StatCard
        title="Avg. Lead Time"
        value={`${supplier.avg_lead_time_days || "—"} days`}
        icon={<FaFileContract />}
        color="#3b82f6"
      />
      <StatCard
        title="Payment Terms"
        value={supplier.payment_term || "—"}
        icon={<FaMoneyBillWave />}
        color="#10b981"
      />
      <StatCard
        title="Incoterm"
        value={supplier.incoterm || "—"}
        icon={<FaIndustry />}
        color="#8b5cf6"
      />
      <StatCard
        title="Currency"
        value={supplier.currency || "—"}
        icon={<RiBankLine />}
        color="#f59e0b"
      />
    </div>

    {/* Company Information */}
    <SectionCard title="Company Information" icon={<FaBuilding />}>
      <div className="info-grid">
        <InfoField label="Vendor ID" value={supplier.vendor_id} />
        <InfoField label="Reference No." value={supplier.reference_no} />
        <InfoField label="Short Name" value={supplier.short_name} />
        <InfoField label="Holding Group" value={supplier.holding_group} />
        <InfoField
          label="Place of Incorporation"
          value={supplier.place_of_incorporation}
        />
        <InfoField label="Year Established" value={supplier.year_established} />
        <InfoField label="Business Type" value={supplier.business_type} />
        <InfoField label="About Us" value={supplier.about_us} fullWidth />
      </div>
    </SectionCard>

    {/* Contact Details */}
    <SectionCard title="Contact Details" icon={<BsPersonLinesFill />}>
      <div className="info-grid">
        <InfoField label="Phone" value={supplier.company_phone} />
        <InfoField label="Email" value={supplier.email} />
        <InfoField label="Website" value={supplier.website} link />
        <InfoField
          label="Preferred Language"
          value={supplier.preferred_language}
        />
        <InfoField label="Contact Person" value={supplier.contact_name} />
        <InfoField label="Contact Email" value={supplier.contact_email} />
      </div>
    </SectionCard>

    {/* Address */}
    <SectionCard title="Address" icon={<FaMapMarkerAlt />}>
      <div className="info-grid">
        <InfoField label="Address" value={supplier.address} fullWidth />
        <InfoField label="Town/City" value={supplier.town_city} />
        <InfoField label="Postal Code" value={supplier.postal_code} />
        <InfoField label="Country/Region" value={supplier.country_region} />
        <InfoField
          label="GPS Coordinates"
          value={
            supplier.gps_lat && supplier.gps_lng
              ? `${supplier.gps_lat}, ${supplier.gps_lng}`
              : "—"
          }
        />
        <InfoField
          label="EU Country"
          value={supplier.eu_country ? "Yes" : "No"}
        />
      </div>
      {supplier.gps_lat && supplier.gps_lng && (
        <div className="map-placeholder">
          <div className="map-overlay">
            <FiMapPin className="map-icon" />
            <span>View on Map</span>
          </div>
        </div>
      )}
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

      .map-placeholder {
        margin-top: 20px;
        height: 200px;
        background-color: #f1f5f9;
        border-radius: 8px;
        position: relative;
        overflow: hidden;
        background-image: linear-gradient(
            45deg,
            #e5e7eb 25%,
            transparent 25%,
            transparent 75%,
            #e5e7eb 75%,
            #e5e7eb
          ),
          linear-gradient(
            45deg,
            #e5e7eb 25%,
            transparent 25%,
            transparent 75%,
            #e5e7eb 75%,
            #e5e7eb
          );
        background-size: 20px 20px;
        background-position: 0 0, 10px 10px;
      }

      .map-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.8);
        color: #4b5563;
        font-weight: 500;
        gap: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .map-overlay:hover {
        background-color: rgba(255, 255, 255, 0.9);
        color: #3b82f6;
      }

      .map-icon {
        font-size: 24px;
      }
    `}</style>
  </div>
);

const FinancialTab = ({ supplier }) => (
  <div className="tab-content">
    <SectionCard title="Bank Information" icon={<RiBankLine />}>
      <div className="info-grid">
        <InfoField label="Account Name" value={supplier.account_name} />
        <InfoField label="Account No." value={supplier.account_no} />
        <InfoField label="Bank Name" value={supplier.bank_name} />
        <InfoField label="Country of Bank" value={supplier.country_of_bank} />
        <InfoField label="Swift Code" value={supplier.swift_code} />
      </div>
    </SectionCard>

    <SectionCard title="Financial Details" icon={<FaMoneyBillWave />}>
      <div className="info-grid">
        <InfoField
          label="Annual Turnover"
          value={
            supplier.total_annual_turnover
              ? `$${supplier.total_annual_turnover.toLocaleString()}`
              : "—"
          }
        />
        <InfoField
          label="Export Turnover"
          value={
            supplier.export_annual_turnover
              ? `$${supplier.export_annual_turnover.toLocaleString()}`
              : "—"
          }
        />
        <InfoField
          label="Credit Limit"
          value={
            supplier.credit_limit
              ? `$${supplier.credit_limit.toLocaleString()}`
              : "—"
          }
        />
        <InfoField
          label="Credit Report"
          value={
            supplier.credit_report
              ? `$${supplier.credit_report.toLocaleString()}`
              : "—"
          }
        />
      </div>
    </SectionCard>

    <SectionCard title="Payment Terms" icon={<FaFileContract />}>
      <div className="info-grid">
        <InfoField label="Payment Method" value={supplier.payment_method} />
        <InfoField label="Payment Term" value={supplier.payment_term} />
        <InfoField label="Currency" value={supplier.currency} />
        <InfoField label="Cash Discount" value={supplier.cash_discount} />
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

      .map-placeholder {
        margin-top: 20px;
        height: 200px;
        background-color: #f1f5f9;
        border-radius: 8px;
        position: relative;
        overflow: hidden;
        background-image: linear-gradient(
            45deg,
            #e5e7eb 25%,
            transparent 25%,
            transparent 75%,
            #e5e7eb 75%,
            #e5e7eb
          ),
          linear-gradient(
            45deg,
            #e5e7eb 25%,
            transparent 25%,
            transparent 75%,
            #e5e7eb 75%,
            #e5e7eb
          );
        background-size: 20px 20px;
        background-position: 0 0, 10px 10px;
      }

      .map-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.8);
        color: #4b5563;
        font-weight: 500;
        gap: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .map-overlay:hover {
        background-color: rgba(255, 255, 255, 0.9);
        color: #3b82f6;
      }

      .map-icon {
        font-size: 24px;
      }
    `}</style>
  </div>
);

const ContactsTab = ({ supplier }) => (
  <div className="tab-content">
    <SectionCard title="Address (Default)">
      <div className="info-grid">
        <Info label="Address Type" value={supplier.address_type} />
        <Info label="Country/Region" value={supplier.address_country_region} />
        <Info label="Street" value={supplier.address_street} />
        <Info label="Town/City" value={supplier.address_town_city} />
        <Info label="GPS Longitude" value={supplier.address_gps_lng} />
        <Info label="GPS Latitude" value={supplier.address_gps_lat} />
        <Info label="Postal Code" value={supplier.address_postal_code} />
        <Info
          label="Port of Loading/Discharge"
          value={supplier.address_port_of_loading_discharge}
        />
        <Info label="Language" value={supplier.address_language} />
        <Info label="GPS Description" value={supplier.address_gps_text} />
        <Info
          label="Inactive Address"
          value={supplier.address_inactive ? "Yes" : "No"}
        />
        <Info
          label="EU Country"
          value={supplier.address_eu_country ? "Yes" : "No"}
        />
      </div>
    </SectionCard>

    <SectionCard title="Primary Contact (Default)">
      <div className="info-grid">
        <Info label="Contact Type" value={supplier.contact1_type} />
        <Info
          label="Texweave Access"
          value={supplier.contact1_texweave_access ? "Yes" : "No"}
        />
        <Info label="Title" value={supplier.contact1_title} />
        <Info label="First Name" value={supplier.contact1_first_name} />
        <Info label="Last Name" value={supplier.contact1_last_name} />
        <Info label="Position" value={supplier.contact1_position} />
        <Info label="Telephone" value={supplier.contact1_tel} />
        <Info label="Mobile" value={supplier.contact1_mobile} />
        <Info label="Email" value={supplier.contact1_email} />
        <Info label="Department" value={supplier.contact1_department} />
      </div>
    </SectionCard>

    <SectionCard title="Additional Contacts">
      <div className="empty-state">
        <div className="empty-state-icon">
          <BsPersonLinesFill />
        </div>
        <h3>No additional contacts</h3>
        <p>Add additional contacts to have more points of communication</p>
        <button className="add-button">
          <FiEdit2 /> Add Contact
        </button>
      </div>
    </SectionCard>

    <style jsx>{`
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 32px 0;
      }

      .empty-state-icon {
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
        margin: 0 0 16px 0;
        color: #6b7280;
        font-size: 14px;
        max-width: 300px;
      }

      .add-button {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        background-color: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .add-button:hover {
        background-color: #2563eb;
      }

      .add-button svg {
        margin-right: 8px;
      }
    `}</style>
  </div>
);

// Helper component for displaying label + value
const Info = ({ label, value }) => (
  <div>
    <div style={{ fontWeight: "600", color: "#374151" }}>{label}</div>
    <div style={{ color: "#6b7280" }}>{value || "Not specified"}</div>
  </div>
);

const DocumentsTab = ({ supplier }) => (
  <div className="tab-content">
    <SectionCard title="Certifications" icon={<FaCertificate />}>
      {supplier.certification_name ? (
        <div className="info-grid">
          <InfoField
            label="Certification Type"
            value={supplier.certification_type}
          />
          <InfoField
            label="Certification Name"
            value={supplier.certification_name}
          />
          <InfoField
            label="Certification Number"
            value={supplier.certification_number}
          />
          <InfoField label="Issue Date" value={supplier.issue_date} />
          <InfoField label="Expiry Date" value={supplier.expiry_date} />
          <InfoField label="Status" value={supplier.status} />
          <InfoField
            label="Institute Country"
            value={supplier.institute_country}
          />
          <InfoField label="Notes" value={supplier.notes} fullWidth />
        </div>
      ) : (
        <div className="documents-empty-state">
          <FaCertificate className="empty-icon" />
          <h3>No certifications added</h3>
          <p>Add certifications to showcase supplier qualifications</p>
        </div>
      )}
    </SectionCard>

    <SectionCard title="Agreements" icon={<FaFileContract />}>
      {supplier.agreement_name ? (
        <div className="info-grid">
          <InfoField label="Agreement Code" value={supplier.agreement_code} />
          <InfoField label="Agreement Name" value={supplier.agreement_name} />
          <InfoField label="Agreement Type" value={supplier.agreement_type} />
          <InfoField
            label="Agreement Status"
            value={supplier.agreement_status}
          />
          <InfoField
            label="Signature Due Date"
            value={supplier.agreement_signature_due_date}
          />
          <InfoField
            label="Expiry Date"
            value={supplier.agreement_expiry_date}
          />
          <InfoField
            label="Accepted On"
            value={supplier.agreement_accepted_on}
          />
          <InfoField
            label="Document Status"
            value={supplier.agreement_doc_status}
          />
          <InfoField
            label="Vendor Action Required"
            value={supplier.agreement_vendor_action_required ? "Yes" : "No"}
          />
          <InfoField
            label="Instructions to Vendor"
            value={supplier.agreement_instruction_to_vendor}
            fullWidth
          />
        </div>
      ) : (
        <div className="documents-empty-state">
          <FaFileContract className="empty-icon" />
          <h3>No agreements available</h3>
          <p>Add agreements to track contractual obligations</p>
        </div>
      )}
    </SectionCard>

    <style jsx>{`
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 32px 0;
      }

      .empty-state-icon {
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
        margin: 0 0 16px 0;
        color: #6b7280;
        font-size: 14px;
        max-width: 300px;
      }

      .add-button {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        background-color: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .add-button:hover {
        background-color: #2563eb;
      }

      .add-button svg {
        margin-right: 8px;
      }
    `}</style>
  </div>
);

const PerformanceTab = ({ supplier }) => (
  <div className="tab-content">
    <SectionCard title="Quality Assessment">
      <div className="info-grid">
        <InfoField label="QA Rank" value={supplier.qa_rank} />
        <InfoField
          label="Assessment Level"
          value={supplier.qa_assessment_level}
        />
        <InfoField label="Risk Level" value={supplier.qa_risk_level} />
        <InfoField
          label="Performance Level"
          value={supplier.qa_performance_level}
        />
        <InfoField label="QA Score" value={supplier.qa_score} />
        <InfoField
          label="Accredited"
          value={supplier.qa_accredited ? "Yes" : "No"}
        />
        <InfoField label="QA Summary" value={supplier.qa_summary} fullWidth />
      </div>
    </SectionCard>

    <SectionCard title="Latest Audit Report">
      {supplier.latest_audit_report_no ? (
        <div className="info-grid">
          <InfoField
            label="Audit Report No."
            value={supplier.latest_audit_report_no}
          />
          <InfoField
            label="Audit Version"
            value={supplier.latest_audit_version}
          />
          <InfoField
            label="Report Type"
            value={supplier.latest_audit_report_type}
          />
          <InfoField label="Customer" value={supplier.latest_audit_customer} />
          <InfoField label="Audit Date" value={supplier.latest_audit_date} />
          <InfoField label="Auditor" value={supplier.latest_auditor} />
          <InfoField label="Audit Party" value={supplier.latest_audit_party} />
          <InfoField
            label="Audit Result"
            value={supplier.latest_audit_result}
          />
          <InfoField
            label="Expiry Date"
            value={supplier.latest_audit_expiry_date}
          />
          <InfoField
            label="Report Date"
            value={supplier.latest_audit_report_date}
          />
          <InfoField label="Status" value={supplier.latest_audit_status} />
          <InfoField
            label="Editing Status"
            value={supplier.latest_audit_editing_status}
          />
        </div>
      ) : (
        <div className="performance-empty-state">
          <div className="empty-icon">
            <IoMdCheckmarkCircle />
          </div>
          <h3>No audit reports available</h3>
          <p>Upload audit reports to track supplier compliance</p>
        </div>
      )}
    </SectionCard>

    <SectionCard title="Audit History">
      <div className="audit-history">
        <AuditItem
          title="Social Audit"
          completed={supplier.audit_social}
          date={supplier.latest_audit_date}
          result={supplier.latest_audit_result}
        />
        <AuditItem
          title="1st Enlistment Audit"
          completed={supplier.audit_1st_enlistment}
          date={null}
          result={null}
        />
        <AuditItem
          title="2nd Enlistment Audit"
          completed={supplier.audit_2nd_enlistment}
          date={null}
          result={null}
        />
        <AuditItem
          title="Qualification Visit"
          completed={supplier.audit_qualification_visit}
          date={null}
          result={null}
        />
        <AuditItem
          title="KIK CSR Audit"
          completed={supplier.audit_kik_csr}
          date={null}
          result={null}
        />
        <AuditItem
          title="Environmental Audit"
          completed={supplier.audit_environmental}
          date={null}
          result={null}
        />
        <AuditItem
          title="QC Visit"
          completed={supplier.audit_qc_visit}
          date={null}
          result={null}
        />
      </div>
    </SectionCard>

    <style jsx>{`
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
      }

      .audit-history {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 32px 0;
      }

      .empty-state-icon {
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
        margin: 0 0 16px 0;
        color: #6b7280;
        font-size: 14px;
        max-width: 300px;
      }

      .add-button {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        background-color: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .add-button:hover {
        background-color: #2563eb;
      }

      .add-button svg {
        margin-right: 8px;
      }
    `}</style>
  </div>
);

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
        transition: transform 0.2s, box-shadow 0.2s;
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

const AuditItem = ({ title, completed, date, result }) => (
  <div className="audit-item">
    <div
      className="audit-status"
      style={{ backgroundColor: completed ? "#10b981" : "#e5e7eb" }}
    >
      {completed && <IoMdCheckmarkCircle className="status-icon" />}
    </div>
    <div className="audit-details">
      <h3 className="audit-title">{title}</h3>
      {completed ? (
        <div className="audit-info">
          {date && <p className="audit-date">Date: {date}</p>}
          {result && (
            <p className="audit-result">
              Result: <span className="result-value">{result}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="audit-pending">Not completed</p>
      )}
    </div>

    <style jsx>{`
      .audit-item {
        display: flex;
        align-items: flex-start;
      }

      .audit-status {
        flex-shrink: 0;
        height: 24px;
        width: 24px;
        border-radius: 50%;
        margin-top: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .status-icon {
        font-size: 14px;
      }

      .audit-details {
        margin-left: 12px;
      }

      .audit-title {
        font-size: 14px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 4px 0;
      }

      .audit-info {
        font-size: 13px;
        color: #6b7280;
        line-height: 1.5;
      }

      .audit-date,
      .audit-result {
        margin: 0;
      }

      .result-value {
        font-weight: 500;
        color: #111827;
      }

      .audit-pending {
        margin: 4px 0 0 0;
        font-size: 13px;
        color: #6b7280;
      }
    `}</style>
  </div>
);

export default DetailSupplier;
