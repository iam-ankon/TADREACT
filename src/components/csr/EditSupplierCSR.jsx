import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSupplierById, updateSupplier } from "../../api/supplierApi";

const EditSupplierCSR = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [touchedFields, setTouchedFields] = useState({});

  // Initialize form data structure
  const initialFormData = {
    // Basic Information
    name: '',
    short_name: '',
    local_name: '',
    email: '',
    website: '',
    name_1: '',
    name_2: '',
    name_3: '',
    about_us: '',
    company_phone: '',
    preferred_language: '',
    deactivation_date: '',
    planned_inactivation_date: '',
    vendor_rating: '',
    capability: '',
    
    // Vendor Information
    vendor_id: '',
    reference_no: '',
    vendor_type: '',
    business_type: '',
    holding_group: '',
    place_of_incorporation: '',
    vendor_access_creation: false,
    purchasing_group: '',
    contract_sign_date: '',
    deactivation_reason: '',
    year_established: '',
    
    // Address
    address_type: '',
    address_country_region: '',
    address_street: '',
    address_town_city: '',
    address_gps_lng: '',
    address_gps_lat: '',
    address_postal_code: '',
    address_port_of_loading_discharge: '',
    address_language: '',
    address_gps_text: '',
    address_inactive: false,
    address_eu_country: false,
    
    // Contact
    contact1_type: '',
    contact1_texweave_access: false,
    contact1_title: '',
    contact1_first_name: '',
    contact1_last_name: '',
    contact1_position: '',
    contact1_tel: '',
    contact1_mobile: '',
    contact1_email: '',
    contact1_department: '',
    
    // Shipment Terms
    incoterm: '',
    avg_lead_time_days: '',
    payment_method: '',
    payment_term: '',
    currency: '',
    cash_discount: '',
    liability_insurance: '',
    export_license_no: '',
    
    // Agreements
    agreement_code: '',
    agreement_name: '',
    agreement_type: '',
    agreement_description: '',
    agreement_status: 'pending',
    agreement_doc_status: 'draft',
    agreement_signature_due_date: '',
    agreement_expiry_date: '',
    agreement_accepted_on: '',
    agreement_instruction_to_vendor: '',
    agreement_vendor_action_required: false,
    agreement_contract_file: null,
    agreement_vendor_signing_copy: null,
    
    // Classification
    classification_code: '',
    classification_name: '',
    
    // Financial Details
    account_name: '',
    account_no: '',
    account_no_2: '',
    bank_key: '',
    bank_name: '',
    country_of_bank: '',
    bank_code_swift_code: '',
    discount_rate: '',
    total_annual_turnover: '',
    export_annual_turnover: '',
    credit_report: '',
    credit_limit: '',
    agent_payment: '',
    super_bonus: '',
    
    // Certifications
    certification_type: '',
    certification_name: '',
    certification_number: '',
    certification_issue_date: '',
    certification_expiry_date: '',
    certification_status: '',
    certification_institute_country: '',
    certification_notes: '',
    certification_attachment: null,
    
    // Factories
    factory_name: '',
    factory_id: '',
    factory_type: '',
    factory_status: '',
    factory_doc_status: '',
    factory_vendor_ref: '',
    factory_vendor_reverse_ref: '',
    factory_contact: '',
    factory_phone: '',
    factory_address: '',
    factory_capacity: '',
    factory_related: '',
    factory_related_since: '',
    factory_note: '',
    factory_default: false,
    factory_sync: false,
    audit_social: false,
    audit_1st_enlistment: false,
    audit_2nd_enlistment: false,
    audit_qualification_visit: false,
    audit_kik_csr: false,
    audit_environmental: false,
    audit_qc_visit: false,
    
    // QA Assessment
    qa_rank: '',
    qa_assessment_level: '',
    qa_risk_level: '',
    qa_performance_level: '',
    qa_score: '',
    qa_disposal_licensing: '',
    qa_accredited: false,
    qa_summary: '',
    
    // Latest Audit Report
    latest_audit_report_no: '',
    latest_audit_version: '',
    latest_audit_report_type: '',
    latest_audit_customer: '',
    latest_audit_date: '',
    latest_auditor: '',
    latest_audit_party: '',
    latest_audit_result: '',
    latest_audit_expiry_date: '',
    latest_audit_report_date: '',
    latest_audit_status: '',
    latest_audit_editing_status: '',
    
    // Images & Attachments
    image_type: '',
    image_description: '',
    image_file: null,
    image_last_modified_by: '',
    image_last_modified_on: '',
    attachment_type: '',
    attachment_description: '',
    attachment_file: null,
    attachment_last_modified_by: '',
    attachment_last_modified_on: '',
    shared_file_name: '',
    shared_file_type: '',
    shared_file_description: '',
    shared_file: null,
    shared_file_details: '',
    shared_file_status: '',
    shared_file_effective_from: '',
    shared_file_effective_to: '',
    shared_file_notes: ''
  };

  useEffect(() => {
    fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    try {
      const response = await getSupplierById(id);
      // Merge response data with initial form data
      const mergedData = { ...initialFormData, ...response.data };
      
      // Convert date strings to proper format for date inputs
      Object.keys(mergedData).forEach(key => {
        if (mergedData[key] && (key.includes('date') || key.includes('Date'))) {
          const date = new Date(mergedData[key]);
          if (!isNaN(date.getTime())) {
            mergedData[key] = date.toISOString().split('T')[0];
          }
        }
      });
      
      setFormData(mergedData);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      setError("Failed to load supplier data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : 
              type === "file" ? files[0] : 
              value,
    }));
    
    // Mark field as touched
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);

    try {
      console.log("Updating supplier with data:", formData);

      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== null && value !== undefined) {
          if (value instanceof File) {
            formDataToSend.append(key, value);
          } else if (typeof value === 'boolean') {
            formDataToSend.append(key, value.toString());
          } else {
            formDataToSend.append(key, value);
          }
        }
      });

      const response = await updateSupplier(id, formDataToSend);

      console.log("Supplier updated successfully:", response.data);
      alert("Supplier updated successfully!");
      navigate("/suppliersCSR");
    } catch (error) {
      console.error("Error updating supplier:", error);

      let errorMessage = "Error updating supplier. Please try again.";
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          errorMessage = Object.entries(error.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`)
            .join("\n");
        } else {
          errorMessage = error.response.data;
        }
      }

      setError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '🏢' },
    { id: 'vendor', label: 'Vendor', icon: '👤' },
    { id: 'address', label: 'Address', icon: '📍' },
    { id: 'shipment', label: 'Shipment', icon: '🚚' },
    { id: 'agreement', label: 'Agreements', icon: '📝' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'classification', label: 'Classification', icon: '🏷️' },
    { id: 'certifications', label: 'Certifications', icon: '📜' },
    { id: 'factories', label: 'Factories', icon: '🏭' },
    { id: 'qa', label: 'QA Assessment', icon: '📊' },
    { id: 'audit', label: 'Audit', icon: '📋' },
    { id: 'images', label: 'Attachments', icon: '📎' },
  ];

  // Helper function to render input fields with validation
  const renderInput = (label, name, type = 'text', required = false, placeholder = '') => {
    const isTouched = touchedFields[name];
    const isEmpty = required && !formData[name];
    const showError = isTouched && isEmpty;
    
    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>
          {label}
          {required && <span style={styles.requiredStar}> *</span>}
        </label>
        <input
          type={type}
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            ...styles.input,
            ...(showError ? styles.inputError : {}),
            ...(updating ? styles.inputDisabled : {})
          }}
          required={required}
          disabled={updating || loading}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        />
        {showError && (
          <div style={styles.fieldError}>This field is required</div>
        )}
      </div>
    );
  };

  const renderSelect = (label, name, options, required = false) => {
    const isTouched = touchedFields[name];
    const isEmpty = required && !formData[name];
    const showError = isTouched && isEmpty;
    
    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>
          {label}
          {required && <span style={styles.requiredStar}> *</span>}
        </label>
        <select
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            ...styles.select,
            ...(showError ? styles.inputError : {}),
            ...(updating ? styles.inputDisabled : {})
          }}
          required={required}
          disabled={updating || loading}
        >
          <option value="">Select {label}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {showError && (
          <div style={styles.fieldError}>This field is required</div>
        )}
      </div>
    );
  };

  const renderCheckbox = (label, name, description = '') => (
    <div style={styles.formGroup}>
      <label style={styles.checkboxLabel}>
        <input
          type="checkbox"
          name={name}
          checked={formData[name] || false}
          onChange={handleChange}
          style={styles.checkbox}
          disabled={updating || loading}
        />
        <div>
          <div style={styles.checkboxText}>{label}</div>
          {description && (
            <div style={styles.checkboxDescription}>{description}</div>
          )}
        </div>
      </label>
    </div>
  );

  const renderTextarea = (label, name, rows = 3, required = false) => {
    const isTouched = touchedFields[name];
    const isEmpty = required && !formData[name];
    const showError = isTouched && isEmpty;
    
    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>
          {label}
          {required && <span style={styles.requiredStar}> *</span>}
        </label>
        <textarea
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            ...styles.textarea,
            ...(showError ? styles.inputError : {}),
            ...(updating ? styles.inputDisabled : {})
          }}
          rows={rows}
          required={required}
          disabled={updating || loading}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        {showError && (
          <div style={styles.fieldError}>This field is required</div>
        )}
      </div>
    );
  };

  const renderFileInput = (label, name, accept = '*/*') => {
    const file = formData[name];
    
    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>{label}</label>
        <div style={styles.fileInputWrapper}>
          <label style={styles.fileInputLabel}>
            <input
              type="file"
              name={name}
              onChange={handleChange}
              style={styles.fileInput}
              accept={accept}
              disabled={updating || loading}
            />
            <span style={styles.fileInputButton}>
              📁 Choose File
            </span>
            <span style={styles.fileName}>
              {file && file.name ? file.name : formData[name + '_name'] || 'No file chosen'}
            </span>
          </label>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <div style={styles.loadingText}>Loading supplier data...</div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.errorAlert}>
          <div style={styles.errorIcon}>⚠️</div>
          <div>
            <strong>Error Loading Data</strong>
            <div style={styles.errorMessage}>Failed to load supplier data. Please try again.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <button 
            onClick={() => navigate('/suppliersCSR')} 
            style={styles.backButton}
            disabled={updating}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.backButtonHover.backgroundColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ←
          </button>
          <h1 style={styles.title}>Edit Supplier</h1>
          <p style={styles.subtitle}>Update supplier information below</p>
        </div>
        <div style={styles.progress}>
          <span style={styles.progressText}>
            {tabs.findIndex(tab => tab.id === activeTab) + 1} of {tabs.length}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorAlert}>
          <div style={styles.errorIcon}>⚠️</div>
          <div>
            <strong>Error Updating Supplier</strong>
            <div style={styles.errorMessage}>{error}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Tab Navigation */}
        <div style={styles.tabsContainer}>
          <div style={styles.tabs}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === tab.id ? styles.activeTab : {})
                }}
                disabled={updating || loading}
                onMouseEnter={(e) => {
                  if (!updating && !loading && activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!updating && !loading && activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={styles.tabIcon}>{tab.icon}</span>
                <span style={styles.tabLabel}>{tab.label}</span>
              </button>
            ))}
          </div>
          <div style={styles.tabIndicator}>
            <div 
              style={{
                ...styles.tabIndicatorBar,
                width: `${((tabs.findIndex(tab => tab.id === activeTab) + 1) / tabs.length) * 100}%`
              }} 
            />
          </div>
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {activeTab === 'basic' && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Basic Information</h3>
                <div style={styles.sectionHint}>Company details and contact information</div>
              </div>
              <div style={styles.formGrid}>
                {renderInput('Company Name *', 'name', 'text', true)}
                {renderInput('Short Name', 'short_name')}
                {renderInput('Local Name', 'local_name')}
                {renderInput('Email *', 'email', 'email', true)}
                {renderInput('Website', 'website', 'url')}
                {renderInput('Name 1', 'name_1')}
                {renderInput('Name 2', 'name_2')}
                {renderInput('Name 3', 'name_3')}
                {renderInput('Company Phone', 'company_phone', 'tel')}
                {renderTextarea('About Us', 'about_us')}
                {renderSelect('Preferred Language', 'preferred_language', [
                  { value: 'English', label: 'English' },
                  { value: 'Turkish', label: 'Turkish' },
                  { value: 'Chinese', label: 'Chinese' },
                  { value: 'Spanish', label: 'Spanish' },
                  { value: 'German', label: 'German' }
                ])}
                {renderInput('Deactivation Date', 'deactivation_date', 'date')}
                {renderInput('Planned Inactivation Date', 'planned_inactivation_date', 'date')}
                {renderSelect('Vendor Rating', 'vendor_rating', [
                  { value: 'A', label: 'A - Excellent' },
                  { value: 'B', label: 'B - Good' },
                  { value: 'C', label: 'C - Average' },
                  { value: 'D', label: 'D - Poor' }
                ])}
                {renderInput('Capability', 'capability')}
              </div>
            </div>
          )}

          {activeTab === 'vendor' && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Vendor Details</h3>
                <div style={styles.sectionHint}>Vendor identification and business information</div>
              </div>
              <div style={styles.formGrid}>
                {renderInput('Vendor ID', 'vendor_id')}
                {renderInput('Reference No', 'reference_no')}
                {renderInput('Vendor Type', 'vendor_type')}
                {renderInput('Business Type', 'business_type')}
                {renderInput('Holding Group', 'holding_group')}
                {renderInput('Place of Incorporation', 'place_of_incorporation')}
                {renderInput('Year Established', 'year_established', 'number')}
                {renderInput('Purchasing Group', 'purchasing_group')}
                {renderInput('Contract Sign Date', 'contract_sign_date', 'date')}
                {renderInput('Deactivation Reason', 'deactivation_reason')}
                {renderCheckbox('Enable Vendor Access', 'vendor_access_creation', 'Allow vendor to access the portal')}
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Address & Contact</h3>
                <div style={styles.sectionHint}>Physical location and primary contact details</div>
              </div>
              <div style={styles.formGrid}>
                {renderInput('Address Type', 'address_type')}
                {renderInput('Country/Region', 'address_country_region')}
                {renderTextarea('Street Address', 'address_street', 2)}
                {renderInput('Town/City', 'address_town_city')}
                {renderInput('Postal Code', 'address_postal_code')}
                {renderInput('GPS Longitude', 'address_gps_lng')}
                {renderInput('GPS Latitude', 'address_gps_lat')}
                {renderInput('Port of Loading/Discharge', 'address_port_of_loading_discharge')}
                {renderInput('Language', 'address_language')}
                {renderTextarea('GPS Description', 'address_gps_text')}
                {renderCheckbox('Inactive Address', 'address_inactive')}
                {renderCheckbox('EU Country', 'address_eu_country')}
              </div>

              <div style={styles.subSection}>
                <div style={styles.sectionHeader}>
                  <h4 style={styles.subSectionTitle}>Primary Contact</h4>
                  <div style={styles.sectionHint}>Main contact person details</div>
                </div>
                <div style={styles.formGrid}>
                  {renderInput('Contact Type', 'contact1_type')}
                  {renderInput('Title', 'contact1_title')}
                  {renderInput('First Name', 'contact1_first_name')}
                  {renderInput('Last Name', 'contact1_last_name')}
                  {renderInput('Position', 'contact1_position')}
                  {renderInput('Telephone', 'contact1_tel', 'tel')}
                  {renderInput('Mobile', 'contact1_mobile', 'tel')}
                  {renderInput('Email', 'contact1_email', 'email')}
                  {renderInput('Department', 'contact1_department')}
                  {renderCheckbox('Texweave Access', 'contact1_texweave_access', 'Grant access to Texweave platform')}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shipment' && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Shipment Terms</h3>
                <div style={styles.sectionHint}>Logistics and payment terms</div>
              </div>
              <div style={styles.formGrid}>
                {renderSelect('Incoterm', 'incoterm', [
                  { value: 'EXW', label: 'EXW - Ex Works' },
                  { value: 'FOB', label: 'FOB - Free on Board' },
                  { value: 'CIF', label: 'CIF - Cost, Insurance & Freight' },
                  { value: 'DDP', label: 'DDP - Delivered Duty Paid' }
                ])}
                {renderInput('Average Lead Time (days)', 'avg_lead_time_days', 'number')}
                {renderSelect('Payment Method', 'payment_method', [
                  { value: 'TT', label: 'Telegraphic Transfer' },
                  { value: 'LC', label: 'Letter of Credit' },
                  { value: 'DP', label: 'Documents against Payment' },
                  { value: 'DA', label: 'Documents against Acceptance' }
                ])}
                {renderInput('Payment Term', 'payment_term')}
                {renderSelect('Currency', 'currency', [
                  { value: 'USD', label: 'USD - US Dollar' },
                  { value: 'EUR', label: 'EUR - Euro' },
                  { value: 'GBP', label: 'GBP - British Pound' },
                  { value: 'CNY', label: 'CNY - Chinese Yuan' }
                ])}
                {renderInput('Cash Discount (%)', 'cash_discount', 'number')}
                {renderInput('Liability Insurance', 'liability_insurance')}
                {renderInput('Export License No', 'export_license_no')}
              </div>
            </div>
          )}

          {activeTab === 'agreement' && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Agreements</h3>
                <div style={styles.sectionHint}>Contract and agreement details</div>
              </div>
              <div style={styles.formGrid}>
                {renderInput('Agreement Code', 'agreement_code')}
                {renderInput('Agreement Name', 'agreement_name')}
                {renderInput('Agreement Type', 'agreement_type')}
                {renderTextarea('Agreement Description', 'agreement_description')}
                {renderSelect('Agreement Status', 'agreement_status', [
                  { value: 'pending', label: 'Pending' },
                  { value: 'active', label: 'Active' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'cancelled', label: 'Cancelled' }
                ])}
                {renderSelect('Document Status', 'agreement_doc_status', [
                  { value: 'draft', label: 'Draft' },
                  { value: 'submitted', label: 'Submitted' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' }
                ])}
                {renderInput('Signature Due Date', 'agreement_signature_due_date', 'date')}
                {renderInput('Expiry Date', 'agreement_expiry_date', 'date')}
                {renderInput('Accepted On', 'agreement_accepted_on', 'date')}
                {renderTextarea('Instruction to Vendor', 'agreement_instruction_to_vendor')}
                {renderCheckbox('Vendor Action Required', 'agreement_vendor_action_required', 'Vendor needs to take action')}
                {renderFileInput('Contract File', 'agreement_contract_file')}
                {renderFileInput('Vendor Signing Copy', 'agreement_vendor_signing_copy')}
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Financial Details</h3>
                <div style={styles.sectionHint}>Banking and financial information</div>
              </div>
              <div style={styles.formGrid}>
                {renderInput('Account Name', 'account_name')}
                {renderInput('Account No.', 'account_no')}
                {renderInput('Account No. 2', 'account_no_2')}
                {renderInput('Bank Key', 'bank_key')}
                {renderInput('Bank Name', 'bank_name')}
                {renderInput('Country of Bank', 'country_of_bank')}
                {renderInput('Bank Code / Swift Code', 'bank_code_swift_code')}
                {renderInput('Discount Rate', 'discount_rate')}
                {renderInput('Total Annual Turnover', 'total_annual_turnover')}
                {renderInput('Export Annual Turnover', 'export_annual_turnover')}
                {renderInput('Credit Report', 'credit_report')}
                {renderInput('Credit Limit', 'credit_limit', 'number')}
                {renderInput('Agent Payment', 'agent_payment', 'number')}
                {renderInput('Super Bonus', 'super_bonus')}
              </div>
            </div>
          )}

          {activeTab === 'classification' && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Classification</h3>
                <div style={styles.sectionHint}>Supplier categorization</div>
              </div>
              <div style={styles.formGrid}>
                {renderInput('Classification Code', 'classification_code')}
                {renderInput('Classification Name', 'classification_name')}
              </div>
            </div>
          )}

          {activeTab === 'certifications' && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Certifications</h3>
                <div style={styles.sectionHint}>Industry certifications and standards</div>
              </div>
              <div style={styles.formGrid}>
                {renderInput('Certification Type', 'certification_type')}
                {renderInput('Certification Name', 'certification_name')}
                {renderInput('Certification Number', 'certification_number')}
                {renderInput('Issue Date', 'certification_issue_date', 'date')}
                {renderInput('Expiry Date', 'certification_expiry_date', 'date')}
                {renderSelect('Status', 'certification_status', [
                  { value: 'active', label: 'Active' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'pending_renewal', label: 'Pending Renewal' },
                  { value: 'suspended', label: 'Suspended' }
                ])}
                {renderInput('Institute Country', 'certification_institute_country')}
                {renderTextarea('Notes', 'certification_notes')}
                {renderFileInput('Attachment', 'certification_attachment')}
              </div>
            </div>
          )}

          {activeTab === 'factories' && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Factory Details</h3>
                <div style={styles.sectionHint}>Manufacturing facilities information</div>
              </div>
              <div style={styles.formGrid}>
                {renderInput('Factory Name', 'factory_name')}
                {renderInput('Factory ID', 'factory_id')}
                {renderInput('Factory Type', 'factory_type')}
                {renderSelect('Factory Status', 'factory_status', [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'under_construction', label: 'Under Construction' },
                  { value: 'closed', label: 'Closed' }
                ])}
                {renderInput('Document Status', 'factory_doc_status')}
                {renderInput('Vendor Ref', 'factory_vendor_ref')}
                {renderInput('Vendor Reverse Ref', 'factory_vendor_reverse_ref')}
                {renderInput('Factory Contact', 'factory_contact')}
                {renderInput('Factory Phone', 'factory_phone')}
                {renderTextarea('Factory Address', 'factory_address')}
                {renderInput('Capacity', 'factory_capacity')}
                {renderInput('Related Factory', 'factory_related')}
                {renderInput('Related Since', 'factory_related_since', 'date')}
                {renderTextarea('Factory Note', 'factory_note')}
                {renderCheckbox('Default Factory', 'factory_default', 'Set as primary factory')}
                {renderCheckbox('Sync', 'factory_sync', 'Synchronize with main system')}
                
                <div style={styles.checkboxGroup}>
                  <div style={styles.checkboxGroupTitle}>Audit Types</div>
                  {renderCheckbox('Social Audit', 'audit_social')}
                  {renderCheckbox('1st Enlistment Audit', 'audit_1st_enlistment')}
                  {renderCheckbox('2nd Enlistment Audit', 'audit_2nd_enlistment')}
                  {renderCheckbox('Qualification Visit', 'audit_qualification_visit')}
                  {renderCheckbox('KIK CSR Audit', 'audit_kik_csr')}
                  {renderCheckbox('Environmental Audit', 'audit_environmental')}
                  {renderCheckbox('QC Visit', 'audit_qc_visit')}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>QA Assessment</h3>
                <div style={styles.sectionHint}>Quality assurance evaluation</div>
              </div>
              <div style={styles.formGrid}>
                {renderSelect('QA Rank', 'qa_rank', [
                  { value: 'A', label: 'A - Excellent' },
                  { value: 'B', label: 'B - Good' },
                  { value: 'C', label: 'C - Average' },
                  { value: 'D', label: 'D - Poor' }
                ])}
                {renderSelect('Assessment Level', 'qa_assessment_level', [
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' }
                ])}
                {renderSelect('Risk Level', 'qa_risk_level', [
                  { value: 'high', label: 'High Risk' },
                  { value: 'medium', label: 'Medium Risk' },
                  { value: 'low', label: 'Low Risk' }
                ])}
                {renderSelect('Performance Level', 'qa_performance_level', [
                  { value: 'excellent', label: 'Excellent' },
                  { value: 'good', label: 'Good' },
                  { value: 'fair', label: 'Fair' },
                  { value: 'poor', label: 'Poor' }
                ])}
                {renderInput('QA Score', 'qa_score', 'number')}
                {renderInput('Disposal Licensing', 'qa_disposal_licensing')}
                {renderCheckbox('QA Accredited', 'qa_accredited', 'Officially accredited by QA body')}
                {renderTextarea('QA Summary', 'qa_summary')}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Latest Audit Report</h3>
                <div style={styles.sectionHint}>Most recent audit information</div>
              </div>
              <div style={styles.formGrid}>
                {renderInput('Audit Report No', 'latest_audit_report_no')}
                {renderInput('Audit Version', 'latest_audit_version')}
                {renderSelect('Audit Type', 'latest_audit_report_type', [
                  { value: 'social', label: 'Social Compliance' },
                  { value: 'quality', label: 'Quality Control' },
                  { value: 'environmental', label: 'Environmental' },
                  { value: 'safety', label: 'Health & Safety' }
                ])}
                {renderInput('Audit Customer', 'latest_audit_customer')}
                {renderInput('Audit Date', 'latest_audit_date', 'date')}
                {renderInput('Auditor', 'latest_auditor')}
                {renderInput('Audit Party', 'latest_audit_party')}
                {renderSelect('Audit Result', 'latest_audit_result', [
                  { value: 'passed', label: 'Passed' },
                  { value: 'failed', label: 'Failed' },
                  { value: 'conditional', label: 'Conditional Pass' },
                  { value: 'pending', label: 'Pending Review' }
                ])}
                {renderInput('Audit Expiry Date', 'latest_audit_expiry_date', 'date')}
                {renderInput('Audit Report Date', 'latest_audit_report_date', 'date')}
                {renderSelect('Audit Status', 'latest_audit_status', [
                  { value: 'draft', label: 'Draft' },
                  { value: 'finalized', label: 'Finalized' },
                  { value: 'published', label: 'Published' },
                  { value: 'archived', label: 'Archived' }
                ])}
                {renderInput('Editing Status', 'latest_audit_editing_status')}
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Images & Attachments</h3>
                <div style={styles.sectionHint}>Upload supporting documents and files</div>
              </div>
              <div style={styles.formGrid}>
                {renderInput('Image Type', 'image_type')}
                {renderInput('Image Description', 'image_description')}
                {renderFileInput('Image File', 'image_file', 'image/*')}
                {renderInput('Last Modified By', 'image_last_modified_by')}
                {renderInput('Last Modified On', 'image_last_modified_on', 'datetime-local')}
                
                {renderInput('Attachment Type', 'attachment_type')}
                {renderInput('Attachment Description', 'attachment_description')}
                {renderFileInput('Attachment File', 'attachment_file')}
                {renderInput('Last Modified By', 'attachment_last_modified_by')}
                {renderInput('Last Modified On', 'attachment_last_modified_on', 'datetime-local')}
                
                {renderInput('Shared File Name', 'shared_file_name')}
                {renderInput('Shared File Type', 'shared_file_type')}
                {renderInput('Shared File Description', 'shared_file_description')}
                {renderFileInput('Shared File', 'shared_file')}
                {renderInput('Shared File Details', 'shared_file_details')}
                {renderSelect('Shared File Status', 'shared_file_status', [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'archived', label: 'Archived' }
                ])}
                {renderInput('Effective From', 'shared_file_effective_from', 'date')}
                {renderInput('Effective To', 'shared_file_effective_to', 'date')}
                {renderTextarea('Notes', 'shared_file_notes')}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div style={styles.formActions}>
          <div style={styles.requiredHint}>
            <span style={styles.requiredStar}>*</span> Required fields
          </div>
          <div style={styles.actionButtons}>
            <button
              type="button"
              onClick={() => navigate('/suppliersCSR')}
              style={styles.cancelButton}
              disabled={updating}
              onMouseEnter={(e) => {
                if (!updating) {
                  e.currentTarget.style.backgroundColor = styles.cancelButtonHover.backgroundColor;
                  e.currentTarget.style.borderColor = styles.cancelButtonHover.borderColor;
                }
              }}
              onMouseLeave={(e) => {
                if (!updating) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = styles.cancelButton.borderColor;
                }
              }}
            >
              Cancel
            </button>
            {activeTab !== 'basic' && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                  setActiveTab(tabs[currentIndex - 1].id);
                }}
                style={styles.previousButton}
                disabled={updating || loading}
                onMouseEnter={(e) => {
                  if (!updating && !loading) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!updating && !loading) {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = styles.previousButton.borderColor;
                  }
                }}
              >
                ← Previous
              </button>
            )}
            {activeTab !== 'images' ? (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                  setActiveTab(tabs[currentIndex + 1].id);
                }}
                style={styles.nextButton}
                disabled={updating || loading}
                onMouseEnter={(e) => {
                  if (!updating && !loading) {
                    e.currentTarget.style.backgroundColor = styles.nextButtonHover.backgroundColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!updating && !loading) {
                    e.currentTarget.style.backgroundColor = styles.nextButton.backgroundColor;
                  }
                }}
              >
                Next →
              </button>
            ) : (
              <button 
                type="submit" 
                style={{
                  ...styles.submitButton,
                  ...(updating ? styles.submitButtonLoading : {})
                }}
                disabled={updating || loading}
                onMouseEnter={(e) => {
                  if (!updating && !loading) {
                    e.currentTarget.style.backgroundColor = styles.submitButtonHover.backgroundColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!updating && !loading) {
                    e.currentTarget.style.backgroundColor = styles.submitButton.backgroundColor;
                  }
                }}
              >
                {updating ? (
                  <>
                    <span style={styles.spinner}></span>
                    Updating...
                  </>
                ) : 'Update Supplier'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    padding: '0',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '2rem',
    backgroundColor: 'white',
    borderBottom: '1px solid #e2e8f0',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0.5rem 0 0.25rem 0',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#64748b',
    margin: '0',
  },
  backButton: {
    padding: '0.5rem',
    backgroundColor: 'transparent',
    color: '#64748b',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.5rem',
    height: '2.5rem',
    marginBottom: '0.5rem',
    transition: 'background-color 0.2s',
  },
  backButtonHover: {
    backgroundColor: '#f1f5f9',
  },
  progress: {
    backgroundColor: '#f1f5f9',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
  },
  progressText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#475569',
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '1rem 2rem',
    borderRadius: '8px',
    margin: '0 2rem 1rem 2rem',
    border: '1px solid #fecaca',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  errorIcon: {
    fontSize: '1.25rem',
  },
  errorMessage: {
    fontSize: '0.875rem',
    marginTop: '0.25rem',
    whiteSpace: 'pre-wrap',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    gap: '1rem',
  },
  spinner: {
    width: '2.5rem',
    height: '2.5rem',
    border: '3px solid #e2e8f0',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '1rem',
    color: '#64748b',
    fontWeight: '500',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: '12px',
    margin: '0 2rem 2rem 2rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    overflow: 'hidden',
  },
  tabsContainer: {
    borderBottom: '1px solid #e2e8f0',
    position: 'relative',
  },
  tabs: {
    display: 'flex',
    overflowX: 'auto',
    padding: '0 2rem',
    gap: '0.25rem',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  tabsScrollbar: {
    display: 'none',
  },
  tabButton: {
    padding: '1rem 1.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#64748b',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  activeTab: {
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  tabIcon: {
    fontSize: '1rem',
  },
  tabLabel: {
    fontSize: '0.875rem',
  },
  tabIndicator: {
    height: '3px',
    backgroundColor: '#e2e8f0',
    position: 'relative',
  },
  tabIndicatorBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    transition: 'width 0.3s ease',
  },
  tabContent: {
    padding: '2rem',
    minHeight: '500px',
  },
  formSection: {
    marginBottom: '0',
  },
  sectionHeader: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: '0 0 0.5rem 0',
    color: '#1e293b',
  },
  subSectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    margin: '2rem 0 0.5rem 0',
    color: '#334155',
  },
  sectionHint: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
  subSection: {
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '1px solid #e2e8f0',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  formGroup: {
    marginBottom: '0',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#374151',
    fontSize: '0.875rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
    color: '#374151',
    cursor: 'pointer',
    gap: '0.75rem',
  },
  checkboxText: {
    fontWeight: '500',
    fontSize: '0.875rem',
    marginBottom: '0.125rem',
  },
  checkboxDescription: {
    fontSize: '0.75rem',
    color: '#6b7280',
    lineHeight: '1.4',
  },
  checkboxGroup: {
    gridColumn: '1 / -1',
    marginTop: '1rem',
  },
  checkboxGroupTitle: {
    fontWeight: '600',
    fontSize: '0.875rem',
    color: '#374151',
    marginBottom: '1rem',
  },
  requiredStar: {
    color: '#ef4444',
    marginLeft: '2px',
  },
  input: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    backgroundColor: 'white',
  },
  inputHover: {
    borderColor: '#9ca3af',
  },
  inputFocus: {
    outline: 'none',
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputDisabled: {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  fieldError: {
    fontSize: '0.75rem',
    color: '#ef4444',
    marginTop: '0.25rem',
  },
  select: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    backgroundColor: 'white',
    transition: 'all 0.2s',
  },
  textarea: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    resize: 'vertical',
    minHeight: '5rem',
    transition: 'all 0.2s',
  },
  checkbox: {
    marginTop: '0.25rem',
    height: '1rem',
    width: '1rem',
    accentColor: '#3b82f6',
  },
  fileInputWrapper: {
    width: '100%',
  },
  fileInputLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    cursor: 'pointer',
  },
  fileInput: {
    display: 'none',
  },
  fileInputButton: {
    padding: '0.625rem 1rem',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.2s',
  },
  fileInputButtonHover: {
    backgroundColor: '#e5e7eb',
  },
  fileName: {
    fontSize: '0.875rem',
    color: '#6b7280',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: '1',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  requiredHint: {
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  actionButtons: {
    display: 'flex',
    gap: '1rem',
  },
  cancelButton: {
    padding: '0.625rem 1.5rem',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  cancelButtonHover: {
    backgroundColor: '#f9fafb',
    borderColor: '#9ca3af',
  },
  previousButton: {
    padding: '0.625rem 1.5rem',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  nextButton: {
    padding: '0.625rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  nextButtonHover: {
    backgroundColor: '#2563eb',
  },
  submitButton: {
    padding: '0.625rem 1.5rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  submitButtonHover: {
    backgroundColor: '#059669',
  },
  submitButtonLoading: {
    backgroundColor: '#6b7280',
    cursor: 'not-allowed',
  },
};

// Add CSS animation
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default EditSupplierCSR;