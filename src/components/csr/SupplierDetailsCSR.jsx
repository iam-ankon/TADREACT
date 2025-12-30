import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getSupplierById } from '../../api/supplierApi'

const SupplierDetailsCSR = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [supplier, setSupplier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [copiedField, setCopiedField] = useState(null)

  useEffect(() => {
    fetchSupplierDetails()
  }, [id])

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log(`Fetching supplier details for ID: ${id}`)
      
      const response = await getSupplierById(id)
      console.log('Supplier data received:', response.data)
      setSupplier(response.data)
      
    } catch (error) {
      console.error('Error fetching supplier details:', error)
      setError(`Failed to load supplier details: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text, fieldName) => {
    if (!text) return
    
    navigator.clipboard.writeText(text.toString())
      .then(() => {
        setCopiedField(fieldName)
        setTimeout(() => setCopiedField(null), 2000)
      })
      .catch(err => {
        console.error('Failed to copy:', err)
      })
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getStatusColor = (status) => {
    if (!status) return { bg: '#f8f9fa', text: '#6c757d', border: '#e9ecef' }
    
    const statusLower = status.toLowerCase()
    switch(statusLower) {
      case 'active': 
      case 'approved': 
        return { bg: '#d4edda', text: '#155724', border: '#c3e6cb' }
      case 'pending': 
        return { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' }
      case 'expired': 
      case 'cancelled': 
        return { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' }
      case 'rejected': 
        return { bg: '#f5c6cb', text: '#721c24', border: '#f1b0b7' }
      case 'draft': 
        return { bg: '#e2e3e5', text: '#383d41', border: '#d6d8db' }
      default: 
        return { bg: '#f8f9fa', text: '#6c757d', border: '#e9ecef' }
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'contact', label: 'Contact Info', icon: '📞' },
    { id: 'financial', label: 'Financial Details', icon: '💰' },
    { id: 'agreements', label: 'Agreements', icon: '📝' },
    { id: 'factory', label: 'Factory Details', icon: '🏭' },
    { id: 'audit', label: 'Audit & QA', icon: '🔍' },
    { id: 'documents', label: 'Documents', icon: '📎' },
  ]

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading supplier details...</p>
      </div>
    )
  }

  if (error || !supplier) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorContent}>
          <span style={styles.errorIcon}>⚠️</span>
          <h2 style={styles.errorTitle}>Supplier Not Found</h2>
          <p style={styles.errorMessage}>
            {error || 'The supplier you are looking for does not exist or has been removed.'}
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
    )
  }

  return (
    <div style={styles.container}>
      {/* Header with Breadcrumb */}
      <div style={styles.header}>
        <div style={styles.breadcrumb}>
          <Link to="/csr-dashboard" style={styles.breadcrumbLink}>Dashboard</Link>
          <span style={styles.breadcrumbSeparator}>/</span>
          <Link to="/suppliersCSR" style={styles.breadcrumbLink}>Suppliers</Link>
          <span style={styles.breadcrumbSeparator}>/</span>
          <span style={styles.breadcrumbCurrent}>{supplier.name || 'Supplier Details'}</span>
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
          <button onClick={fetchSupplierDetails} style={styles.refreshButton}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Supplier Header Card */}
      <div style={styles.supplierHeader}>
        <div style={styles.supplierBasicInfo}>
          <div style={styles.supplierLogo}>
            {supplier.name?.charAt(0) || 'S'}
          </div>
          <div style={styles.supplierTitle}>
            <h1 style={styles.supplierName}>
              {supplier.name || 'Unnamed Supplier'}
              {supplier.short_name && (
                <span style={styles.supplierShortName}>({supplier.short_name})</span>
              )}
            </h1>
            <div style={styles.supplierMeta}>
              <span style={styles.vendorId}>
                Vendor ID: <strong>{supplier.vendor_id || 'N/A'}</strong>
              </span>
              <span style={styles.separator}>•</span>
              <span style={styles.businessType}>
                {supplier.business_type || 'Business type not specified'}
              </span>
              <span style={styles.separator}>•</span>
              <span style={styles.established}>
                Est. {supplier.year_established || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.statusSection}>
          <div style={styles.statusBadge}>
            <span style={{
              ...styles.statusDot,
              backgroundColor: getStatusColor(supplier.agreement_status).bg
            }}></span>
            <span style={styles.statusText}>
              {supplier.agreement_status?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
          <div style={styles.rating}>
            <span style={styles.ratingLabel}>Rating:</span>
            <span style={styles.ratingValue}>{supplier.vendor_rating || 'Not rated'}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tabButton,
                ...(activeTab === tab.id ? styles.tabButtonActive : {})
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
        {activeTab === 'overview' && (
          <div style={styles.overviewGrid}>
            {/* Basic Information */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🏢</span> Basic Information
              </h3>
              <div style={styles.infoGrid}>
                <InfoRow 
                  label="Local Name" 
                  value={supplier.local_name} 
                  copyable 
                  fieldName="local_name"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <InfoRow 
                  label="Reference No" 
                  value={supplier.reference_no} 
                  copyable 
                  fieldName="reference_no"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <InfoRow 
                  label="Vendor Type" 
                  value={supplier.vendor_type} 
                />
                <InfoRow 
                  label="Holding Group" 
                  value={supplier.holding_group} 
                />
                <InfoRow 
                  label="Place of Incorporation" 
                  value={supplier.place_of_incorporation} 
                />
                <InfoRow 
                  label="Preferred Language" 
                  value={supplier.preferred_language} 
                />
                <InfoRow 
                  label="Capability" 
                  value={supplier.capability} 
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
                  label="Company Phone" 
                  value={supplier.company_phone} 
                  copyable 
                  fieldName="company_phone"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
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
                  label="Website" 
                  value={supplier.website} 
                  link 
                  copyable 
                  fieldName="website"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <InfoRow 
                  label="Contact Person" 
                  value={supplier.contact_name} 
                />
                <InfoRow 
                  label="Contact Email" 
                  value={supplier.contact_email} 
                  copyable 
                  fieldName="contact_email"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <InfoRow 
                  label="Contact Phone" 
                  value={supplier.contact_phone} 
                  copyable 
                  fieldName="contact_phone"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
              </div>
            </div>

            {/* Address Information */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📍</span> Address
              </h3>
              <div style={styles.addressCard}>
                <p style={styles.addressText}>
                  {supplier.address || 'Address not specified'}
                </p>
                <div style={styles.addressDetails}>
                  {supplier.town_city && (
                    <span style={styles.addressDetail}>{supplier.town_city}</span>
                  )}
                  {supplier.postal_code && (
                    <span style={styles.addressDetail}>{supplier.postal_code}</span>
                  )}
                  {supplier.country_region && (
                    <span style={styles.addressDetail}>{supplier.country_region}</span>
                  )}
                </div>
                {(supplier.gps_lat || supplier.gps_lng) && (
                  <div style={styles.gpsInfo}>
                    <span style={styles.gpsLabel}>GPS Coordinates:</span>
                    <span style={styles.gpsValue}>
                      {supplier.gps_lat}, {supplier.gps_lng}
                    </span>
                  </div>
                )}
                {supplier.eu_country && (
                  <span style={styles.euBadge}>🇪🇺 EU Country</span>
                )}
              </div>
            </div>

            {/* About Us */}
            {supplier.about_us && (
              <div style={styles.infoCard}>
                <h3 style={styles.cardTitle}>
                  <span style={styles.cardIcon}>📄</span> About Us
                </h3>
                <p style={styles.aboutText}>{supplier.about_us}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contact' && (
          <div style={styles.contactGrid}>
            {/* Default Contact Person */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>👤</span> Default Contact Person
              </h3>
              <div style={styles.contactDetails}>
                <InfoRow 
                  label="Name" 
                  value={supplier.contact_name} 
                />
                <InfoRow 
                  label="Position" 
                  value={supplier.contact1_position} 
                />
                <InfoRow 
                  label="Email" 
                  value={supplier.contact1_email || supplier.contact_email} 
                  copyable 
                  fieldName="contact_email"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <InfoRow 
                  label="Phone" 
                  value={supplier.contact1_tel || supplier.contact_phone} 
                  copyable 
                  fieldName="contact_phone"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <InfoRow 
                  label="Mobile" 
                  value={supplier.contact1_mobile || supplier.contact_mobile} 
                  copyable 
                  fieldName="contact_mobile"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <InfoRow 
                  label="Department" 
                  value={supplier.contact1_department} 
                />
              </div>
            </div>

            {/* Additional Contact Information */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📱</span> Additional Contact Info
              </h3>
              <div style={styles.contactDetails}>
                <InfoRow 
                  label="Company Phone" 
                  value={supplier.company_phone} 
                  copyable 
                  fieldName="company_phone"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
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
                  label="Website" 
                  value={supplier.website} 
                  link 
                  copyable 
                  fieldName="website"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div style={styles.financialGrid}>
            {/* Bank Details */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🏦</span> Bank Details
              </h3>
              <div style={styles.financialDetails}>
                <InfoRow 
                  label="Bank Name" 
                  value={supplier.bank_name} 
                />
                <InfoRow 
                  label="Account Name" 
                  value={supplier.account_name} 
                />
                <InfoRow 
                  label="Account Number" 
                  value={supplier.account_no} 
                  copyable 
                  fieldName="account_no"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <InfoRow 
                  label="SWIFT Code" 
                  value={supplier.swift_code || supplier.bank_code_swift_code} 
                  copyable 
                  fieldName="swift_code"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <InfoRow 
                  label="Bank Country" 
                  value={supplier.country_of_bank} 
                />
                {supplier.bank_details && (
                  <div style={styles.bankDetailsText}>
                    <label style={styles.detailLabel}>Additional Bank Details:</label>
                    <p style={styles.detailValue}>{supplier.bank_details}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Metrics */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📈</span> Financial Metrics
              </h3>
              <div style={styles.financialDetails}>
                <InfoRow 
                  label="Total Annual Turnover" 
                  value={formatCurrency(supplier.total_annual_turnover)} 
                />
                <InfoRow 
                  label="Export Annual Turnover" 
                  value={formatCurrency(supplier.export_annual_turnover)} 
                />
                <InfoRow 
                  label="Credit Limit" 
                  value={formatCurrency(supplier.credit_limit)} 
                />
                <InfoRow 
                  label="Credit Report" 
                  value={formatCurrency(supplier.credit_report)} 
                />
                <InfoRow 
                  label="Discount Rate" 
                  value={supplier.discount_rate} 
                />
                <InfoRow 
                  label="Agent Payment" 
                  value={formatCurrency(supplier.agent_payment)} 
                />
                <InfoRow 
                  label="Super Bonus" 
                  value={formatCurrency(supplier.super_bonus)} 
                />
              </div>
            </div>

            {/* Payment Terms */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>💳</span> Payment Terms
              </h3>
              <div style={styles.financialDetails}>
                <InfoRow 
                  label="Payment Method" 
                  value={supplier.payment_method} 
                />
                <InfoRow 
                  label="Payment Term" 
                  value={supplier.payment_term} 
                />
                <InfoRow 
                  label="Currency" 
                  value={supplier.currency} 
                />
                <InfoRow 
                  label="Cash Discount" 
                  value={supplier.cash_discount} 
                />
                <InfoRow 
                  label="Incoterm" 
                  value={supplier.incoterm} 
                />
                <InfoRow 
                  label="Average Lead Time" 
                  value={supplier.avg_lead_time_days ? `${supplier.avg_lead_time_days} days` : 'Not specified'} 
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agreements' && (
          <div style={styles.agreementsGrid}>
            {/* Agreement Details */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📋</span> Agreement Details
              </h3>
              <div style={styles.agreementDetails}>
                <InfoRow 
                  label="Agreement Code" 
                  value={supplier.agreement_code} 
                />
                <InfoRow 
                  label="Agreement Name" 
                  value={supplier.agreement_name} 
                />
                <InfoRow 
                  label="Agreement Type" 
                  value={supplier.agreement_type} 
                />
                <InfoRow 
                  label="Agreement Status" 
                  value={
                    <span style={{
                      ...styles.statusBadgeInline,
                      backgroundColor: getStatusColor(supplier.agreement_status).bg,
                      color: getStatusColor(supplier.agreement_status).text
                    }}>
                      {supplier.agreement_status?.toUpperCase() || 'N/A'}
                    </span>
                  } 
                />
                <InfoRow 
                  label="Document Status" 
                  value={
                    <span style={{
                      ...styles.statusBadgeInline,
                      backgroundColor: getStatusColor(supplier.agreement_doc_status).bg,
                      color: getStatusColor(supplier.agreement_doc_status).text
                    }}>
                      {supplier.agreement_doc_status?.toUpperCase() || 'N/A'}
                    </span>
                  } 
                />
                <InfoRow 
                  label="Signature Due Date" 
                  value={formatDate(supplier.agreement_signature_due_date)} 
                />
                <InfoRow 
                  label="Expiry Date" 
                  value={formatDate(supplier.agreement_expiry_date)} 
                />
                <InfoRow 
                  label="Accepted On" 
                  value={formatDate(supplier.agreement_accepted_on)} 
                />
                {supplier.agreement_vendor_action_required && (
                  <div style={styles.actionRequired}>
                    <span style={styles.actionRequiredIcon}>⚠️</span>
                    <span style={styles.actionRequiredText}>Vendor Action Required</span>
                  </div>
                )}
                {supplier.agreement_description && (
                  <div style={styles.agreementDescription}>
                    <label style={styles.detailLabel}>Description:</label>
                    <p style={styles.detailValue}>{supplier.agreement_description}</p>
                  </div>
                )}
                {supplier.agreement_instruction_to_vendor && (
                  <div style={styles.vendorInstructions}>
                    <label style={styles.detailLabel}>Instructions to Vendor:</label>
                    <p style={styles.detailValue}>{supplier.agreement_instruction_to_vendor}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'factory' && supplier.factory_name && (
          <div style={styles.factoryGrid}>
            {/* Factory Details */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🏭</span> Factory Details
              </h3>
              <div style={styles.factoryDetails}>
                <InfoRow 
                  label="Factory Name" 
                  value={supplier.factory_name} 
                />
                <InfoRow 
                  label="Factory ID" 
                  value={supplier.factory_id} 
                />
                <InfoRow 
                  label="Factory Type" 
                  value={supplier.factory_type} 
                />
                <InfoRow 
                  label="Capacity" 
                  value={supplier.factory_capacity} 
                />
                <InfoRow 
                  label="Status" 
                  value={supplier.factory_status} 
                />
                <InfoRow 
                  label="Related Since" 
                  value={formatDate(supplier.factory_related_since)} 
                />
                {supplier.factory_note && (
                  <div style={styles.factoryNotes}>
                    <label style={styles.detailLabel}>Notes:</label>
                    <p style={styles.detailValue}>{supplier.factory_note}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Audit Status */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🔍</span> Audit Status
              </h3>
              <div style={styles.auditStatus}>
                <AuditCheck label="Social Audit" checked={supplier.audit_social} />
                <AuditCheck label="1st Enlistment Audit" checked={supplier.audit_1st_enlistment} />
                <AuditCheck label="2nd Enlistment Audit" checked={supplier.audit_2nd_enlistment} />
                <AuditCheck label="Qualification Visit" checked={supplier.audit_qualification_visit} />
                <AuditCheck label="KIK CSR Audit" checked={supplier.audit_kik_csr} />
                <AuditCheck label="Environmental Audit" checked={supplier.audit_environmental} />
                <AuditCheck label="QC Visit" checked={supplier.audit_qc_visit} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div style={styles.auditGrid}>
            {/* QA Assessment */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📊</span> QA Assessment
              </h3>
              <div style={styles.qaDetails}>
                <InfoRow 
                  label="QA Rank" 
                  value={supplier.qa_rank} 
                />
                <InfoRow 
                  label="Assessment Level" 
                  value={supplier.qa_assessment_level} 
                />
                <InfoRow 
                  label="Risk Level" 
                  value={supplier.qa_risk_level} 
                />
                <InfoRow 
                  label="Performance Level" 
                  value={supplier.qa_performance_level} 
                />
                <InfoRow 
                  label="QA Score" 
                  value={supplier.qa_score} 
                />
                <InfoRow 
                  label="Accredited" 
                  value={supplier.qa_accredited ? 'Yes' : 'No'} 
                />
                {supplier.qa_summary && (
                  <div style={styles.qaSummary}>
                    <label style={styles.detailLabel}>Summary:</label>
                    <p style={styles.detailValue}>{supplier.qa_summary}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Latest Audit Report */}
            {supplier.latest_audit_report_no && (
              <div style={styles.infoCard}>
                <h3 style={styles.cardTitle}>
                  <span style={styles.cardIcon}>📋</span> Latest Audit Report
                </h3>
                <div style={styles.auditDetails}>
                  <InfoRow 
                    label="Report No" 
                    value={supplier.latest_audit_report_no} 
                  />
                  <InfoRow 
                    label="Audit Date" 
                    value={formatDate(supplier.latest_audit_date)} 
                  />
                  <InfoRow 
                    label="Auditor" 
                    value={supplier.latest_auditor} 
                  />
                  <InfoRow 
                    label="Audit Result" 
                    value={supplier.latest_audit_result} 
                  />
                  <InfoRow 
                    label="Expiry Date" 
                    value={formatDate(supplier.latest_audit_expiry_date)} 
                  />
                  <InfoRow 
                    label="Status" 
                    value={supplier.latest_audit_status} 
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div style={styles.documentsGrid}>
            {/* Documents Placeholder */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📎</span> Documents & Attachments
              </h3>
              <div style={styles.documentsPlaceholder}>
                <span style={styles.documentsIcon}>📂</span>
                <p style={styles.documentsText}>
                  Documents and attachments will appear here when uploaded.
                </p>
                <button 
                  onClick={() => navigate(`/edit-supplierCSR/${id}`)}
                  style={styles.uploadButton}
                >
                  Upload Documents
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons at Bottom */}
      <div style={styles.actionButtons}>
        <button 
          onClick={() => navigate(-1)} 
          style={styles.secondaryButton}
        >
          ← Back to List
        </button>
        <button 
          onClick={() => navigate(`/edit-supplier/${id}`)}
          style={styles.primaryButton}
        >
          ✏️ Edit Supplier
        </button>
        <button 
          onClick={fetchSupplierDetails}
          style={styles.secondaryButton}
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  )
}

// Reusable InfoRow Component
const InfoRow = ({ label, value, copyable = false, link = false, fieldName, copiedField, onCopy }) => {
  if (!value && value !== 0) return null

  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}:</span>
      <div style={styles.infoValueContainer}>
        {link ? (
          <a 
            href={value.startsWith('http') ? value : `https://${value}`} 
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
            {copiedField === fieldName ? '✅' : '📋'}
          </button>
        )}
      </div>
    </div>
  )
}

// Reusable AuditCheck Component
const AuditCheck = ({ label, checked }) => (
  <div style={styles.auditCheck}>
    <span style={checked ? styles.checkIconChecked : styles.checkIconUnchecked}>
      {checked ? '✅' : '❌'}
    </span>
    <span style={styles.auditLabel}>{label}</span>
  </div>
)

const styles = {
  container: {
    padding: '2rem',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  breadcrumbLink: {
    color: '#3b82f6',
    textDecoration: 'none',
  },
  breadcrumbSeparator: {
    color: '#cbd5e1',
  },
  breadcrumbCurrent: {
    color: '#334155',
    fontWeight: '500',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  backButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  editButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  refreshButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  supplierHeader: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '2rem',
  },
  supplierBasicInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    flex: 1,
  },
  supplierLogo: {
    width: '80px',
    height: '80px',
    borderRadius: '12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 'bold',
  },
  supplierTitle: {
    flex: 1,
  },
  supplierName: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: '0 0 0.5rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  supplierShortName: {
    fontSize: '1rem',
    color: '#64748b',
    fontWeight: 'normal',
  },
  supplierMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#64748b',
    fontSize: '0.875rem',
    flexWrap: 'wrap',
  },
  vendorId: {
    backgroundColor: '#f1f5f9',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
  },
  separator: {
    color: '#cbd5e1',
  },
  businessType: {
    fontStyle: 'italic',
  },
  established: {
    color: '#6c757d',
  },
  statusSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.75rem',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#f1f5f9',
    borderRadius: '20px',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#334155',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  ratingLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
  ratingValue: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
  },
  tabsContainer: {
    marginBottom: '2rem',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto',
    paddingBottom: '0.5rem',
  },
  tabButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  },
  tabButtonActive: {
    backgroundColor: '#3b82f6',
    color: 'white',
    borderColor: '#3b82f6',
  },
  tabIcon: {
    fontSize: '1rem',
  },
  tabContent: {
    marginBottom: '2rem',
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  contactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  financialGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  agreementsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  factoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  auditGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  documentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  cardTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 1.5rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  cardIcon: {
    fontSize: '1.25rem',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  infoLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500',
    minWidth: '120px',
    flexShrink: 0,
  },
  infoValueContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  infoValue: {
    fontSize: '0.875rem',
    color: '#334155',
    fontWeight: '500',
    wordBreak: 'break-word',
  },
  infoLink: {
    fontSize: '0.875rem',
    color: '#3b82f6',
    textDecoration: 'none',
    wordBreak: 'break-word',
  },
  copyButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#64748b',
    padding: '0.25rem',
    borderRadius: '4px',
    flexShrink: 0,
  },
  addressCard: {
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  addressText: {
    margin: '0 0 1rem 0',
    color: '#334155',
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },
  addressDetails: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  addressDetail: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  gpsInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: '#64748b',
  },
  gpsLabel: {
    fontWeight: '500',
  },
  gpsValue: {
    fontFamily: 'monospace',
  },
  euBadge: {
    display: 'inline-block',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '500',
    marginTop: '0.5rem',
  },
  aboutText: {
    margin: 0,
    color: '#334155',
    fontSize: '0.875rem',
    lineHeight: 1.6,
  },
  contactDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  financialDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  bankDetailsText: {
    marginTop: '1rem',
  },
  agreementDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  statusBadgeInline: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
    display: 'inline-block',
  },
  actionRequired: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#fef3c7',
    padding: '0.75rem',
    borderRadius: '6px',
    marginTop: '1rem',
  },
  actionRequiredIcon: {
    fontSize: '1rem',
  },
  actionRequiredText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#92400e',
  },
  agreementDescription: {
    marginTop: '1rem',
  },
  vendorInstructions: {
    marginTop: '1rem',
    backgroundColor: '#f0f9ff',
    padding: '1rem',
    borderRadius: '6px',
  },
  factoryDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  factoryNotes: {
    marginTop: '1rem',
  },
  auditStatus: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  auditCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  checkIconChecked: {
    color: '#10b981',
  },
  checkIconUnchecked: {
    color: '#dc2626',
  },
  auditLabel: {
    fontSize: '0.875rem',
    color: '#334155',
  },
  qaDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  qaSummary: {
    marginTop: '1rem',
  },
  auditDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  detailLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500',
    marginBottom: '0.5rem',
  },
  detailValue: {
    fontSize: '0.875rem',
    color: '#334155',
    margin: 0,
    lineHeight: 1.5,
  },
  documentsPlaceholder: {
    textAlign: 'center',
    padding: '3rem 2rem',
  },
  documentsIcon: {
    fontSize: '3rem',
    color: '#cbd5e1',
    marginBottom: '1rem',
    display: 'block',
  },
  documentsText: {
    color: '#64748b',
    marginBottom: '1.5rem',
  },
  uploadButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  actionButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    paddingTop: '2rem',
    borderTop: '1px solid #e2e8f0',
  },
  primaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  secondaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '1rem',
    color: '#64748b',
    fontSize: '0.875rem',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },
  errorContent: {
    textAlign: 'center',
    maxWidth: '400px',
  },
  errorIcon: {
    fontSize: '3rem',
    color: '#dc2626',
    marginBottom: '1rem',
    display: 'block',
  },
  errorTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 0.5rem 0',
  },
  errorMessage: {
    color: '#64748b',
    marginBottom: '2rem',
  },
  errorActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  browseButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
}

// Add CSS animation for spinner
const spinnerStyle = document.createElement('style')
spinnerStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`
document.head.appendChild(spinnerStyle)

export default SupplierDetailsCSR