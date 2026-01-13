import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSupplier } from "../../api/supplierApi";

const AddSupplierCSR = () => {
  const navigate = useNavigate();

  // State for form data based on the new Supplier model from Excel
  const [formData, setFormData] = useState({
    // Basic Information from General Information sheet
    sl_no: "",
    supplier_name: "",
    supplier_id: "",
    location: "",
    supplier_category: "",
    year_of_establishment: "",
    
    // Building Type
    rented_building: false,
    share_building: false,
    own_property: false,
    
    // Ownership and Contact Details
    ownership_details: "",
    factory_main_contact: "",
    factory_merchandiser_contact: "",
    factory_hr_compliance_contact: "",
    
    // Building Details
    building_details: "",
    total_area: "",
    
    // Manpower
    manpower_workers_male: "",
    manpower_workers_female: "",
    manpower_staff_male: "",
    manpower_staff_female: "",
    total_manpower: "",
    
    // Production Information
    production_process: "",
    manufacturing_item: "",
    capacity_per_month: "",
    business_by_market: "",
    
    // Customer Information
    existing_customer: "",
    number_of_sewing_line: "",
    total_number_of_machineries: "",
    
    // Financial Information
    yearly_turnover_usd: "",
    
    // Other Details
    weekly_holiday: "Friday",
    bgmea_number: "",
    rsc: "",
    tad_group_order_status: "",
    
    // Certifications (from Certifications sheet)
    bsci_last_audit_date: "",
    bsci_rating: "",
    bsci_validity: "",
    bsci_validity_days_remaining: "",
    bsci_status: "",
    
    sedex_last_audit_date: "",
    sedex_rating: "",
    sedex_validity: "",
    sedex_validity_days_remaining: "",
    sedex_status: "",
    
    wrap_last_audit_date: "",
    wrap_rating: "",
    wrap_validity: "",
    wrap_validity_days_remaining: "",
    wrap_status: "",
    
    security_audit_last_date: "",
    security_audit_rating: "",
    security_audit_validity: "",
    security_audit_validity_days_remaining: "",
    security_audit_status: "",
    
    oeko_tex_validity: "",
    oeko_tex_validity_days_remaining: "",
    oeko_tex_status: "",
    
    gots_validity: "",
    gots_validity_days_remaining: "",
    gots_status: "",
    
    ocs_validity: "",
    ocs_validity_days_remaining: "",
    ocs_status: "",
    
    grs_validity: "",
    grs_validity_days_remaining: "",
    grs_status: "",
    
    rcs_validity: "",
    rcs_validity_days_remaining: "",
    rcs_status: "",
    
    iso_9001_validity: "",
    iso_9001_validity_days_remaining: "",
    iso_9001_status: "",
    
    iso_14001_validity: "",
    iso_14001_validity_days_remaining: "",
    iso_14001_status: "",
    
    certification_remarks: "",
    
    // Legal License Information (from License sheet)
    trade_license_validity: "",
    trade_license_days_remaining: "",
    
    factory_license_validity: "",
    factory_license_days_remaining: "",
    
    fire_license_validity: "",
    fire_license_days_remaining: "",
    
    membership_validity: "",
    membership_days_remaining: "",
    
    group_insurance_validity: "",
    group_insurance_days_remaining: "",
    
    boiler_no: "",
    boiler_license_validity: "",
    boiler_license_days_remaining: "",
    
    berc_license_validity: "",
    berc_days_remaining: "",
    
    license_remarks: "",
    
    // Fire Safety Information (from Fire safety sheet)
    last_fire_training_by_fscd: "",
    fscd_next_fire_training_date: "",
    last_fire_drill_record_by_fscd: "",
    fscd_next_drill_date: "",
    total_fire_fighter_rescue_first_aider_fscd: "",
    fire_safety_remarks: "",
    
    // Wages & Benefit Information (from Wages & benefit sheet)
    minimum_wages_paid: false,
    earn_leave_status: false,
    service_benefit: false,
    maternity_benefit: false,
    yearly_increment: false,
    festival_bonus: false,
    salary_due_status: false,
    due_salary_month: "",
    
    // Environmental Information (from Environment sheet)
    water_test_report_doe: "",
    zdhc_water_test_report: "",
    higg_fem_self_assessment_score: "",
    higg_fem_verification_assessment_score: "",
    behive_chemical_inventory: false,
    
    // Accord RSC Information (from Accord RSC sheet)
    rsc_id: "",
    progress_rate: "",
    
    // Structural Safety
    structural_initial_audit_date: "",
    structural_initial_findings: "",
    structural_last_follow_up_audit_date: "",
    structural_total_findings: "",
    structural_total_corrected: "",
    structural_total_in_progress: "",
    structural_total_pending_verification: "",
    
    // Fire Safety (from Accord RSC)
    fire_initial_audit_date: "",
    fire_initial_findings: "",
    fire_last_follow_up_audit_date: "",
    fire_total_findings: "",
    fire_total_corrected: "",
    fire_total_in_progress: "",
    fire_total_pending_verification: "",
    
    // Electrical Safety
    electrical_initial_audit_date: "",
    electrical_initial_findings: "",
    electrical_last_follow_up_audit_date: "",
    electrical_total_findings: "",
    electrical_total_corrected: "",
    electrical_total_in_progress: "",
    electrical_total_pending_verification: "",
    
    // PC & Safety Committee Information (from PC & Safety Committee sheet)
    last_pc_election_date: "",
    last_pc_meeting_date: "",
    last_safety_committee_formation_date: "",
    last_safety_committee_meeting_date: "",
    
    // CSR Information (from CSR sheet)
    donation_local_community: false,
    tree_plantation_local_community: false,
    sanitary_napkin_status: false,
    fair_shop: false,
    any_gift_provided_during_festival: false,
    
    // Additional contact fields if needed
    email: "",
    phone: "",
  });

  // State for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [touchedFields, setTouchedFields] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    let processedValue = value;

    // For text inputs, convert empty string to null
    if (type !== "checkbox" && type !== "file" && value === "") {
      processedValue = null;
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "file"
          ? files[0]
          : processedValue,
    }));

    // Mark field as touched
    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log("Sending form data:", formData);

      // Calculate total manpower if not provided
      if (!formData.total_manpower) {
        const total = (
          (parseInt(formData.manpower_workers_male) || 0) +
          (parseInt(formData.manpower_workers_female) || 0) +
          (parseInt(formData.manpower_staff_male) || 0) +
          (parseInt(formData.manpower_staff_female) || 0)
        );
        formData.total_manpower = total > 0 ? total : "";
      }

      // Create FormData for file uploads (if any)
      const formDataToSend = new FormData();

      // Append all form data
      Object.keys(formData).forEach((key) => {
        const value = formData[key];

        if (value !== null && value !== undefined && value !== "") {
          if (value instanceof File) {
            formDataToSend.append(key, value);
          } else if (typeof value === "boolean") {
            formDataToSend.append(key, value.toString());
          } else {
            formDataToSend.append(key, value);
          }
        }
      });

      console.log("FormData entries:");
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      // Use the API service to create supplier
      const response = await createSupplier(formDataToSend);

      console.log("Supplier created successfully:", response.data);
      alert("Supplier added successfully!");
      navigate("/suppliersCSR");
    } catch (error) {
      console.error("Error adding supplier:", error);

      // Extract error message from response
      let errorMessage = "Error adding supplier. Please try again.";

      if (error.response?.data) {
        const errorData = error.response.data;

        if (typeof errorData === "object") {
          errorMessage = Object.entries(errorData)
            .map(
              ([field, errors]) =>
                `${field}: ${
                  Array.isArray(errors) ? errors.join(", ") : errors
                }`
            )
            .join("\n");
        } else {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "basic", label: "General Info", icon: "🏢" },
    { id: "building", label: "Building & Manpower", icon: "🏭" },
    { id: "production", label: "Production", icon: "⚙️" },
    { id: "certifications", label: "Certifications", icon: "📜" },
    { id: "licenses", label: "Licenses", icon: "📋" },
    { id: "safety", label: "Safety", icon: "🚨" },
    { id: "compliance", label: "Compliance", icon: "✅" },
    { id: "environment", label: "Environment", icon: "🌱" },
    { id: "rsc", label: "RSC Audit", icon: "🔍" },
    { id: "csr", label: "CSR", icon: "🤝" },
  ];

  // Helper function to render input fields
  const renderInput = (label, name, type = "text", placeholder = "") => {
    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>{label}</label>
        <input
          type={type}
          name={name}
          value={formData[name] || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            ...styles.input,
            ...(isLoading ? styles.inputDisabled : {}),
          }}
          disabled={isLoading}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        />
      </div>
    );
  };

  const renderSelect = (label, name, options) => {
    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>{label}</label>
        <select
          name={name}
          value={formData[name] || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            ...styles.select,
            ...(isLoading ? styles.inputDisabled : {}),
          }}
          disabled={isLoading}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderCheckbox = (label, name, description = "") => (
    <div style={styles.formGroup}>
      <label style={styles.checkboxLabel}>
        <input
          type="checkbox"
          name={name}
          checked={formData[name] || false}
          onChange={handleChange}
          style={styles.checkbox}
          disabled={isLoading}
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

  const renderTextarea = (label, name, rows = 3) => {
    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>{label}</label>
        <textarea
          name={name}
          value={formData[name] || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            ...styles.textarea,
            ...(isLoading ? styles.inputDisabled : {}),
          }}
          rows={rows}
          disabled={isLoading}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <button
            onClick={() => navigate("/suppliersCSR")}
            style={styles.backButton}
            disabled={isLoading}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                styles.backButtonHover.backgroundColor)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            ←
          </button>
          <h1 style={styles.title}>Add New Supplier/Factory</h1>
          <p style={styles.subtitle}>
            Fill in the supplier/factory details based on Excel structure
          </p>
        </div>
        <div style={styles.progress}>
          <span style={styles.progressText}>
            {tabs.findIndex((tab) => tab.id === activeTab) + 1} of {tabs.length}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorAlert}>
          <div style={styles.errorIcon}>⚠️</div>
          <div>
            <strong>Error Adding Supplier</strong>
            <div style={styles.errorMessage}>{error}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Tab Navigation */}
        <div style={styles.tabsContainer}>
          <div style={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === tab.id ? styles.activeTab : {}),
                }}
                disabled={isLoading}
                onMouseEnter={(e) => {
                  if (!isLoading && activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = "transparent";
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
                width: `${
                  ((tabs.findIndex((tab) => tab.id === activeTab) + 1) /
                    tabs.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {activeTab === "basic" && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>General Information</h3>
                <div style={styles.sectionHint}>
                  Basic factory/supplier details
                </div>
              </div>
              <div style={styles.formGrid}>
                {renderInput("SL No", "sl_no", "number")}
                {renderInput("Supplier/Factory Name", "supplier_name", "text")}
                {renderInput("Supplier ID", "supplier_id", "text")}
                {renderTextarea("Location", "location", 2)}
                {renderSelect("Supplier Category", "supplier_category", [
                  { value: "Woven", label: "Woven" },
                  { value: "Sweater", label: "Sweater" },
                  { value: "Knit & Lingerie", label: "Knit & Lingerie" },
                  { value: "Knit", label: "Knit" },
                  { value: "Lingerie", label: "Lingerie" },
                ])}
                {renderInput("Year of Establishment", "year_of_establishment", "number")}
                {renderTextarea("Ownership Details", "ownership_details", 3)}
                {renderTextarea("Factory Main Contact", "factory_main_contact", 2)}
                {renderTextarea("Factory Merchandiser Contact", "factory_merchandiser_contact", 2)}
                {renderTextarea("Factory HR/Compliance Contact", "factory_hr_compliance_contact", 2)}
                {renderInput("Email", "email", "email")}
                {renderInput("Phone", "phone", "tel")}
              </div>
            </div>
          )}

          {activeTab === "building" && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Building & Manpower Details</h3>
                <div style={styles.sectionHint}>
                  Facility and workforce information
                </div>
              </div>
              <div style={styles.formGrid}>
                {renderCheckbox("Rented Building", "rented_building")}
                {renderCheckbox("Share Building", "share_building")}
                {renderCheckbox("Own Property", "own_property")}
                {renderTextarea("Building Details", "building_details", 3)}
                {renderInput("Total Area (sq ft)", "total_area", "number")}
                
                <div style={styles.subSection}>
                  <h4 style={styles.subSectionTitle}>Manpower</h4>
                  {renderInput("Workers - Male", "manpower_workers_male", "number")}
                  {renderInput("Workers - Female", "manpower_workers_female", "number")}
                  {renderInput("Staff - Male", "manpower_staff_male", "number")}
                  {renderInput("Staff - Female", "manpower_staff_female", "number")}
                  {renderInput("Total Manpower", "total_manpower", "number")}
                </div>
              </div>
            </div>
          )}

          {activeTab === "production" && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Production Information</h3>
                <div style={styles.sectionHint}>
                  Manufacturing and business details
                </div>
              </div>
              <div style={styles.formGrid}>
                {renderTextarea("Production Process", "production_process", 3)}
                {renderTextarea("Manufacturing Items", "manufacturing_item", 3)}
                {renderInput("Capacity per Month", "capacity_per_month")}
                {renderInput("Business by Market", "business_by_market")}
                {renderTextarea("Existing Customers", "existing_customer", 3)}
                {renderInput("Number of Sewing Lines", "number_of_sewing_line", "number")}
                {renderInput("Total Number of Machineries", "total_number_of_machineries", "number")}
                {renderInput("Yearly Turnover (USD)", "yearly_turnover_usd", "number")}
                {renderSelect("Weekly Holiday", "weekly_holiday", [
                  { value: "Friday", label: "Friday" },
                  { value: "Saturday", label: "Saturday" },
                  { value: "Sunday", label: "Sunday" },
                ])}
                {renderInput("BGMEA Number", "bgmea_number")}
                {renderInput("RSC", "rsc")}
                {renderInput("TAD Group Order Status", "tad_group_order_status")}
              </div>
            </div>
          )}

          {activeTab === "certifications" && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Certifications</h3>
                <div style={styles.sectionHint}>
                  Social and product certifications
                </div>
              </div>
              <div style={styles.formGrid}>
                {/* BSCI */}
                <div style={styles.subSection}>
                  <h4 style={styles.subSectionTitle}>BSCI</h4>
                  {renderInput("Last Audit Date", "bsci_last_audit_date", "date")}
                  {renderInput("Rating", "bsci_rating")}
                  {renderInput("Validity", "bsci_validity", "date")}
                  {renderInput("Days Remaining", "bsci_validity_days_remaining", "number")}
                  {renderInput("Status", "bsci_status")}
                </div>

                {/* SEDEX */}
                <div style={styles.subSection}>
                  <h4 style={styles.subSectionTitle}>SEDEX</h4>
                  {renderInput("Last Audit Date", "sedex_last_audit_date", "date")}
                  {renderInput("Rating", "sedex_rating")}
                  {renderInput("Validity", "sedex_validity", "date")}
                  {renderInput("Days Remaining", "sedex_validity_days_remaining", "number")}
                  {renderInput("Status", "sedex_status")}
                </div>

                {/* WRAP */}
                <div style={styles.subSection}>
                  <h4 style={styles.subSectionTitle}>WRAP</h4>
                  {renderInput("Last Audit Date", "wrap_last_audit_date", "date")}
                  {renderInput("Rating", "wrap_rating")}
                  {renderInput("Validity", "wrap_validity", "date")}
                  {renderInput("Days Remaining", "wrap_validity_days_remaining", "number")}
                  {renderInput("Status", "wrap_status")}
                </div>

                {/* Security Audit */}
                <div style={styles.subSection}>
                  <h4 style={styles.subSectionTitle}>Security Audit (CTPAT/GSV)</h4>
                  {renderInput("Last Audit Date", "security_audit_last_date", "date")}
                  {renderInput("Rating", "security_audit_rating")}
                  {renderInput("Validity", "security_audit_validity", "date")}
                  {renderInput("Days Remaining", "security_audit_validity_days_remaining", "number")}
                  {renderInput("Status", "security_audit_status")}
                </div>

                {/* Other Certifications */}
                <div style={styles.subSection}>
                  <h4 style={styles.subSectionTitle}>Other Certifications</h4>
                  {renderInput("Oeko-Tex Validity", "oeko_tex_validity", "date")}
                  {renderInput("GOTS Validity", "gots_validity", "date")}
                  {renderInput("OCS Validity", "ocs_validity", "date")}
                  {renderInput("GRS Validity", "grs_validity", "date")}
                  {renderInput("RCS Validity", "rcs_validity", "date")}
                  {renderInput("ISO 9001 Validity", "iso_9001_validity", "date")}
                  {renderInput("ISO 14001 Validity", "iso_14001_validity", "date")}
                </div>

                {renderTextarea("Certification Remarks", "certification_remarks", 3)}
              </div>
            </div>
          )}

          {activeTab === "licenses" && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Legal Licenses</h3>
                <div style={styles.sectionHint}>
                  Government and regulatory licenses
                </div>
              </div>
              <div style={styles.formGrid}>
                {renderInput("Trade License Validity", "trade_license_validity", "date")}
                {renderInput("Trade License Days Remaining", "trade_license_days_remaining", "number")}
                {renderInput("Factory License Validity", "factory_license_validity", "date")}
                {renderInput("Factory License Days Remaining", "factory_license_days_remaining", "number")}
                {renderInput("Fire License Validity", "fire_license_validity", "date")}
                {renderInput("Fire License Days Remaining", "fire_license_days_remaining", "number")}
                {renderInput("Membership Validity", "membership_validity", "date")}
                {renderInput("Membership Days Remaining", "membership_days_remaining", "number")}
                {renderInput("Group Insurance Validity", "group_insurance_validity", "date")}
                {renderInput("Group Insurance Days Remaining", "group_insurance_days_remaining", "number")}
                {renderInput("Boiler No", "boiler_no")}
                {renderInput("Boiler License Validity", "boiler_license_validity", "date")}
                {renderInput("Boiler License Days Remaining", "boiler_license_days_remaining", "number")}
                {renderInput("BERC License Validity", "berc_license_validity", "date")}
                {renderInput("BERC Days Remaining", "berc_days_remaining", "number")}
                {renderTextarea("License Remarks", "license_remarks", 3)}
              </div>
            </div>
          )}

          {activeTab === "safety" && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Fire Safety</h3>
                <div style={styles.sectionHint}>
                  Fire safety training and equipment
                </div>
              </div>
              <div style={styles.formGrid}>
                {renderInput("Last Fire Training by FSCD", "last_fire_training_by_fscd", "date")}
                {renderInput("FSCD Next Fire Training Date", "fscd_next_fire_training_date", "date")}
                {renderInput("Last Fire Drill Record by FSCD", "last_fire_drill_record_by_fscd", "date")}
                {renderInput("FSCD Next Drill Date", "fscd_next_drill_date", "date")}
                {renderInput("Total Fire Fighter/Rescue/First Aider (FSCD)", "total_fire_fighter_rescue_first_aider_fscd", "number")}
                {renderTextarea("Fire Safety Remarks", "fire_safety_remarks", 3)}
              </div>
            </div>
          )}

          {activeTab === "compliance" && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Wages & Benefits Compliance</h3>
                <div style={styles.sectionHint}>
                  Labor compliance and benefits status
                </div>
              </div>
              <div style={styles.formGrid}>
                {renderCheckbox("Minimum Wages Paid", "minimum_wages_paid")}
                {renderCheckbox("Earn Leave Status", "earn_leave_status")}
                {renderCheckbox("Service Benefit", "service_benefit")}
                {renderCheckbox("Maternity Benefit", "maternity_benefit")}
                {renderCheckbox("Yearly Increment", "yearly_increment")}
                {renderCheckbox("Festival Bonus", "festival_bonus")}
                {renderCheckbox("Salary Due Status", "salary_due_status")}
                {renderInput("Due Salary Month", "due_salary_month")}
                
                <div style={styles.subSection}>
                  <h4 style={styles.subSectionTitle}>PC & Safety Committee</h4>
                  {renderInput("Last PC Election Date", "last_pc_election_date", "date")}
                  {renderInput("Last PC Meeting Date", "last_pc_meeting_date", "date")}
                  {renderInput("Last Safety Committee Formation Date", "last_safety_committee_formation_date", "date")}
                  {renderInput("Last Safety Committee Meeting Date", "last_safety_committee_meeting_date", "date")}
                </div>
              </div>
            </div>
          )}

          {activeTab === "environment" && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Environmental Compliance</h3>
                <div style={styles.sectionHint}>
                  Environmental test reports and assessments
                </div>
              </div>
              <div style={styles.formGrid}>
                {renderInput("Water Test Report DOE", "water_test_report_doe", "date")}
                {renderInput("ZDHC Water Test Report", "zdhc_water_test_report", "date")}
                {renderInput("Higg FEM Self Assessment Score", "higg_fem_self_assessment_score", "number")}
                {renderInput("Higg FEM Verification Assessment Score", "higg_fem_verification_assessment_score", "number")}
                {renderCheckbox("Behive Chemical Inventory", "behive_chemical_inventory")}
              </div>
            </div>
          )}

          {activeTab === "rsc" && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>RSC Audit Details</h3>
                <div style={styles.sectionHint}>
                  Accord RSC audit findings
                </div>
              </div>
              <div style={styles.formGrid}>
                {renderInput("RSC ID", "rsc_id")}
                {renderInput("Progress Rate", "progress_rate", "number")}
                
                <div style={styles.subSection}>
                  <h4 style={styles.subSectionTitle}>Structural Safety</h4>
                  {renderInput("Initial Audit Date", "structural_initial_audit_date", "date")}
                  {renderInput("Initial Findings", "structural_initial_findings", "number")}
                  {renderInput("Last Follow Up Audit Date", "structural_last_follow_up_audit_date", "date")}
                  {renderInput("Total Findings", "structural_total_findings", "number")}
                  {renderInput("Total Corrected", "structural_total_corrected", "number")}
                  {renderInput("Total In Progress", "structural_total_in_progress", "number")}
                  {renderInput("Total Pending Verification", "structural_total_pending_verification", "number")}
                </div>

                <div style={styles.subSection}>
                  <h4 style={styles.subSectionTitle}>Fire Safety</h4>
                  {renderInput("Initial Audit Date", "fire_initial_audit_date", "date")}
                  {renderInput("Initial Findings", "fire_initial_findings", "number")}
                  {renderInput("Last Follow Up Audit Date", "fire_last_follow_up_audit_date", "date")}
                  {renderInput("Total Findings", "fire_total_findings", "number")}
                  {renderInput("Total Corrected", "fire_total_corrected", "number")}
                  {renderInput("Total In Progress", "fire_total_in_progress", "number")}
                  {renderInput("Total Pending Verification", "fire_total_pending_verification", "number")}
                </div>

                <div style={styles.subSection}>
                  <h4 style={styles.subSectionTitle}>Electrical Safety</h4>
                  {renderInput("Initial Audit Date", "electrical_initial_audit_date", "date")}
                  {renderInput("Initial Findings", "electrical_initial_findings", "number")}
                  {renderInput("Last Follow Up Audit Date", "electrical_last_follow_up_audit_date", "date")}
                  {renderInput("Total Findings", "electrical_total_findings", "number")}
                  {renderInput("Total Corrected", "electrical_total_corrected", "number")}
                  {renderInput("Total In Progress", "electrical_total_in_progress", "number")}
                  {renderInput("Total Pending Verification", "electrical_total_pending_verification", "number")}
                </div>
              </div>
            </div>
          )}

          {activeTab === "csr" && (
            <div style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Corporate Social Responsibility</h3>
                <div style={styles.sectionHint}>
                  CSR activities and community engagement
                </div>
              </div>
              <div style={styles.formGrid}>
                {renderCheckbox("Donation to Local Community", "donation_local_community")}
                {renderCheckbox("Tree Plantation in Local Community", "tree_plantation_local_community")}
                {renderCheckbox("Sanitary Napkin Status", "sanitary_napkin_status")}
                {renderCheckbox("Fair Shop", "fair_shop")}
                {renderCheckbox("Any Gift Provided During Festival", "any_gift_provided_during_festival")}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div style={styles.formActions}>
          <div style={styles.requiredHint}>All fields are optional</div>
          <div style={styles.actionButtons}>
            <button
              type="button"
              onClick={() => navigate("/suppliersCSR")}
              style={styles.cancelButton}
              disabled={isLoading}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor =
                    styles.cancelButtonHover.backgroundColor;
                  e.currentTarget.style.borderColor =
                    styles.cancelButtonHover.borderColor;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor =
                    styles.cancelButton.borderColor;
                }
              }}
            >
              Cancel
            </button>
            {activeTab !== "basic" && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = tabs.findIndex(
                    (tab) => tab.id === activeTab
                  );
                  setActiveTab(tabs[currentIndex - 1].id);
                }}
                style={styles.previousButton}
                disabled={isLoading}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                    e.currentTarget.style.borderColor = "#9ca3af";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = "white";
                    e.currentTarget.style.borderColor =
                      styles.previousButton.borderColor;
                  }
                }}
              >
                ← Previous
              </button>
            )}
            {activeTab !== "csr" ? (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = tabs.findIndex(
                    (tab) => tab.id === activeTab
                  );
                  setActiveTab(tabs[currentIndex + 1].id);
                }}
                style={styles.nextButton}
                disabled={isLoading}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor =
                      styles.nextButtonHover.backgroundColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor =
                      styles.nextButton.backgroundColor;
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
                  ...(isLoading ? styles.submitButtonLoading : {}),
                }}
                disabled={isLoading}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor =
                      styles.submitButtonHover.backgroundColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor =
                      styles.submitButton.backgroundColor;
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <span style={styles.spinner}></span>
                    Saving...
                  </>
                ) : (
                  "Save Supplier"
                )}
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
    padding: "0",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "2rem",
    backgroundColor: "white",
    borderBottom: "1px solid #e2e8f0",
  },
  title: {
    fontSize: "1.875rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0.5rem 0 0.25rem 0",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#64748b",
    margin: "0",
  },
  backButton: {
    padding: "0.5rem",
    backgroundColor: "transparent",
    color: "#64748b",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.5rem",
    height: "2.5rem",
    marginBottom: "0.5rem",
    transition: "background-color 0.2s",
  },
  backButtonHover: {
    backgroundColor: "#f1f5f9",
  },
  progress: {
    backgroundColor: "#f1f5f9",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
  },
  progressText: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#475569",
  },
  errorAlert: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    padding: "1rem 2rem",
    borderRadius: "8px",
    margin: "0 2rem 1rem 2rem",
    border: "1px solid #fecaca",
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
  },
  errorIcon: {
    fontSize: "1.25rem",
  },
  errorMessage: {
    fontSize: "0.875rem",
    marginTop: "0.25rem",
    whiteSpace: "pre-wrap",
  },
  form: {
    backgroundColor: "white",
    borderRadius: "12px",
    margin: "0 2rem 2rem 2rem",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    overflow: "hidden",
  },
  tabsContainer: {
    borderBottom: "1px solid #e2e8f0",
    position: "relative",
  },
  tabs: {
    display: "flex",
    overflowX: "auto",
    padding: "0 2rem",
    gap: "0.25rem",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  tabsScrollbar: {
    display: "none",
  },
  tabButton: {
    padding: "1rem 1.5rem",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "8px 8px 0 0",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#64748b",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  activeTab: {
    color: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  tabIcon: {
    fontSize: "1rem",
  },
  tabLabel: {
    fontSize: "0.875rem",
  },
  tabIndicator: {
    height: "3px",
    backgroundColor: "#e2e8f0",
    position: "relative",
  },
  tabIndicatorBar: {
    height: "100%",
    backgroundColor: "#3b82f6",
    transition: "width 0.3s ease",
  },
  tabContent: {
    padding: "2rem",
    minHeight: "500px",
  },
  formSection: {
    marginBottom: "0",
  },
  sectionHeader: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    margin: "0 0 0.5rem 0",
    color: "#1e293b",
  },
  subSectionTitle: {
    fontSize: "1.125rem",
    fontWeight: "600",
    margin: "2rem 0 0.5rem 0",
    color: "#334155",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "0.5rem",
  },
  sectionHint: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  subSection: {
    marginTop: "1.5rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid #e2e8f0",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  formGroup: {
    marginBottom: "0",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "500",
    color: "#374151",
    fontSize: "0.875rem",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "0.5rem",
    color: "#374151",
    cursor: "pointer",
    gap: "0.75rem",
  },
  checkboxText: {
    fontWeight: "500",
    fontSize: "0.875rem",
    marginBottom: "0.125rem",
  },
  checkboxDescription: {
    fontSize: "0.75rem",
    color: "#6b7280",
    lineHeight: "1.4",
  },
  checkboxGroup: {
    gridColumn: "1 / -1",
    marginTop: "1rem",
  },
  checkboxGroupTitle: {
    fontWeight: "600",
    fontSize: "0.875rem",
    color: "#374151",
    marginBottom: "1rem",
  },
  requiredStar: {
    color: "#ef4444",
    marginLeft: "2px",
  },
  input: {
    width: "100%",
    padding: "0.625rem 0.875rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.875rem",
    transition: "all 0.2s",
    backgroundColor: "white",
  },
  inputHover: {
    borderColor: "#9ca3af",
  },
  inputFocus: {
    outline: "none",
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  inputDisabled: {
    backgroundColor: "#f9fafb",
    color: "#9ca3af",
    cursor: "not-allowed",
  },
  fieldError: {
    fontSize: "0.75rem",
    color: "#ef4444",
    marginTop: "0.25rem",
  },
  select: {
    width: "100%",
    padding: "0.625rem 0.875rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.875rem",
    backgroundColor: "white",
    transition: "all 0.2s",
  },
  textarea: {
    width: "100%",
    padding: "0.625rem 0.875rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.875rem",
    resize: "vertical",
    minHeight: "5rem",
    transition: "all 0.2s",
  },
  checkbox: {
    marginTop: "0.25rem",
    height: "1rem",
    width: "1rem",
    accentColor: "#3b82f6",
  },
  formActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem 2rem",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  requiredHint: {
    fontSize: "0.75rem",
    color: "#6b7280",
  },
  actionButtons: {
    display: "flex",
    gap: "1rem",
  },
  cancelButton: {
    padding: "0.625rem 1.5rem",
    backgroundColor: "transparent",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  cancelButtonHover: {
    backgroundColor: "#f9fafb",
    borderColor: "#9ca3af",
  },
  previousButton: {
    padding: "0.625rem 1.5rem",
    backgroundColor: "white",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  nextButton: {
    padding: "0.625rem 1.5rem",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  nextButtonHover: {
    backgroundColor: "#2563eb",
  },
  submitButton: {
    padding: "0.625rem 1.5rem",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  submitButtonHover: {
    backgroundColor: "#059669",
  },
  submitButtonLoading: {
    backgroundColor: "#6b7280",
    cursor: "not-allowed",
  },
  spinner: {
    width: "1rem",
    height: "1rem",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

// Add CSS animation
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(
  `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`,
  styleSheet.cssRules.length
);

export default AddSupplierCSR;