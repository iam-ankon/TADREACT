import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSupplierById, updateSupplier } from "../../api/supplierApi";

const colors = {
  primary: "#0066cc",
  primaryDark: "#0052a3",
  success: "#059669",
  danger: "#dc2626",
  warning: "#d97706",
  info: "#0891b2",
  light: "#f9fafb",
  dark: "#111827",
  gray: "#6b7280",
  muted: "#9ca3af",
  border: "#d1d5db",
  error: "#ef4444",
};

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "valid", label: "Valid" },
  { value: "pending", label: "Pending" },
  { value: "in progress", label: "In Progress" },
  { value: "expired", label: "Expired" },
  { value: "invalid", label: "Invalid" },
  { value: "cancelled", label: "Cancelled" },
  { value: "", label: "Unknown" },
];

const categoryOptions = [
  { value: "Woven", label: "Woven" },
  { value: "Sweater", label: "Sweater" },
  { value: "Knit & Lingerie", label: "Knit & Lingerie" },
  { value: "Knit", label: "Knit" },
  { value: "Lingerie", label: "Lingerie" },
];

const holidayOptions = [
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" },
  { value: "Sunday", label: "Sunday" },
];

const EditSupplierCSR = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    sl_no: "",
    supplier_name: "",
    supplier_id: "",
    location: "",
    supplier_category: "",
    year_of_establishment: "",
    rented_building: false,
    share_building: false,
    own_property: false,
    ownership_details: "",
    factory_main_contact: "",
    factory_merchandiser_contact: "",
    factory_hr_compliance_contact: "",
    building_details: "",
    total_area: "",
    manpower_workers_male: "",
    manpower_workers_female: "",
    manpower_staff_male: "",
    manpower_staff_female: "",
    total_manpower: "",
    production_process: "",
    manufacturing_item: "",
    capacity_per_month: "",
    business_by_market: "",
    existing_customer: "",
    number_of_sewing_line: "",
    total_number_of_machineries: "",
    yearly_turnover_usd: "",
    weekly_holiday: "Friday",
    bgmea_number: "",
    rsc: "",
    tad_group_order_status: "",
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
    last_fire_training_by_fscd: "",
    fscd_next_fire_training_date: "",
    last_fire_drill_record_by_fscd: "",
    fscd_next_drill_date: "",
    total_fire_fighter_rescue_first_aider_fscd: "",
    fire_safety_remarks: "",
    minimum_wages_paid: false,
    earn_leave_status: false,
    service_benefit: false,
    maternity_benefit: false,
    yearly_increment: false,
    festival_bonus: false,
    salary_due_status: false,
    due_salary_month: "",
    water_test_report_doe: "",
    zdhc_water_test_report: "",
    higg_fem_self_assessment_score: "",
    higg_fem_verification_assessment_score: "",
    behive_chemical_inventory: false,
    rsc_id: "",
    progress_rate: "",
    structural_initial_audit_date: "",
    structural_initial_findings: "",
    structural_last_follow_up_audit_date: "",
    structural_total_findings: "",
    structural_total_corrected: "",
    structural_total_in_progress: "",
    structural_total_pending_verification: "",
    fire_initial_audit_date: "",
    fire_initial_findings: "",
    fire_last_follow_up_audit_date: "",
    fire_total_findings: "",
    fire_total_corrected: "",
    fire_total_in_progress: "",
    fire_total_pending_verification: "",
    electrical_initial_audit_date: "",
    electrical_initial_findings: "",
    electrical_last_follow_up_audit_date: "",
    electrical_total_findings: "",
    electrical_total_corrected: "",
    electrical_total_in_progress: "",
    electrical_total_pending_verification: "",
    last_pc_election_date: "",
    last_pc_meeting_date: "",
    last_safety_committee_formation_date: "",
    last_safety_committee_meeting_date: "",
    donation_local_community: false,
    tree_plantation_local_community: false,
    sanitary_napkin_status: false,
    fair_shop: false,
    any_gift_provided_during_festival: false,
    email: "",
    phone: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [touchedFields, setTouchedFields] = useState({});

  useEffect(() => {
    fetchSupplierData();
  }, [id]);

  const fetchSupplierData = async () => {
    setIsLoading(true);
    try {
      const response = await getSupplierById(id);
      
      // Format date fields for input type="date"
      const formattedData = { ...response.data };
      const dateFields = [
        'bsci_last_audit_date', 'bsci_validity',
        'sedex_last_audit_date', 'sedex_validity',
        'wrap_last_audit_date', 'wrap_validity',
        'security_audit_last_date', 'security_audit_validity',
        'oeko_tex_validity', 'gots_validity', 'ocs_validity',
        'grs_validity', 'rcs_validity', 'iso_9001_validity',
        'iso_14001_validity', 'trade_license_validity',
        'factory_license_validity', 'fire_license_validity',
        'membership_validity', 'group_insurance_validity',
        'boiler_license_validity', 'berc_license_validity',
        'last_fire_training_by_fscd', 'fscd_next_fire_training_date',
        'last_fire_drill_record_by_fscd', 'fscd_next_drill_date',
        'structural_initial_audit_date', 'structural_last_follow_up_audit_date',
        'fire_initial_audit_date', 'fire_last_follow_up_audit_date',
        'electrical_initial_audit_date', 'electrical_last_follow_up_audit_date',
        'last_pc_election_date', 'last_pc_meeting_date',
        'last_safety_committee_formation_date', 'last_safety_committee_meeting_date'
      ];

      dateFields.forEach(field => {
        if (formattedData[field]) {
          const date = new Date(formattedData[field]);
          if (!isNaN(date.getTime())) {
            formattedData[field] = date.toISOString().split('T')[0];
          }
        }
      });

      setFormData(formattedData);
    } catch (err) {
      console.error("Error fetching supplier:", err);
      setError("Failed to load supplier data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value === "" ? null : value;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : processedValue,
    }));

    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    if (error) setError(null);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async () => {
    // Only submit if we're on the last tab (CSR)
    if (activeTab !== "csr") {
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      // Calculate total manpower
      const formDataCopy = { ...formData };
      if (!formDataCopy.total_manpower) {
        const total =
          (parseInt(formDataCopy.manpower_workers_male) || 0) +
          (parseInt(formDataCopy.manpower_workers_female) || 0) +
          (parseInt(formDataCopy.manpower_staff_male) || 0) +
          (parseInt(formDataCopy.manpower_staff_female) || 0);
        formDataCopy.total_manpower = total > 0 ? total : null;
      }

      const formDataToSend = new FormData();
      Object.entries(formDataCopy).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          formDataToSend.append(
            key,
            typeof value === "boolean" ? value.toString() : value
          );
        }
      });

      await updateSupplier(id, formDataToSend);
      alert("Supplier updated successfully!");
      navigate("/suppliersCSR");
    } catch (err) {
      let errorMessage = "Error updating supplier. Please try again.";
      if (err.response?.data) {
        const errorData = err.response.data;
        errorMessage =
          typeof errorData === "object"
            ? Object.entries(errorData)
                .map(
                  ([field, errors]) =>
                    `${field}: ${
                      Array.isArray(errors) ? errors.join(", ") : errors
                    }`
                )
                .join("\n")
            : errorData;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNext = () => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id);
  };

  const handlePrevious = () => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id);
  };

  // Tabs array matching AddSupplierCSR
  const tabs = [
    { id: "basic", label: "General Info", icon: "🏢" },
    { id: "building", label: "Building & Manpower", icon: "🏭" },
    { id: "production", label: "Production", icon: "⚙️" },
    { id: "certifications", label: "Certifications", icon: "📜" },
    { id: "licenses", label: "Licenses", icon: "📋" },
    { id: "safety", label: "Safety", icon: "🚨" },
    { id: "compliance", label: "Compliance", icon: "✅" },
    { id: "pcSafety", label: "PC & Safety Committee", icon: "👥" },
    { id: "environment", label: "Environment", icon: "🌱" },
    { id: "rsc", label: "RSC Audit", icon: "🔍" },
    { id: "csr", label: "CSR", icon: "🤝" },
  ];

  const renderInput = (
    label,
    name,
    type = "text",
    isRequired = false,
    rows = null
  ) => {
    const value = formData[name] ?? "";
    const isError = touchedFields[name] && isRequired && !value;
    const Component = rows ? "textarea" : "input";

    return (
      <div style={formGroupStyle}>
        <label style={labelStyle}>
          {label} {isRequired && <span style={{ color: colors.error }}>*</span>}
        </label>
        <Component
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            ...inputStyle,
            ...(isError ? inputErrorStyle : {}),
            ...((isUpdating || isLoading) ? inputDisabledStyle : {}),
          }}
          disabled={isUpdating || isLoading}
          placeholder={`Enter ${label.toLowerCase()}`}
          rows={rows}
        />
        {isError && <div style={fieldErrorStyle}>This field is required</div>}
      </div>
    );
  };

  const renderSelect = (label, name, options, isRequired = false) => {
    const value = formData[name] ?? "";
    const isError = touchedFields[name] && isRequired && !value;

    return (
      <div style={formGroupStyle}>
        <label style={labelStyle}>
          {label} {isRequired && <span style={{ color: colors.error }}>*</span>}
        </label>
        <select
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            ...selectStyle,
            ...(isError ? inputErrorStyle : {}),
            ...((isUpdating || isLoading) ? inputDisabledStyle : {}),
          }}
          disabled={isUpdating || isLoading}
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {isError && <div style={fieldErrorStyle}>This field is required</div>}
      </div>
    );
  };

  const renderCheckbox = (label, name, description = "") => (
    <div style={checkboxGroupStyle}>
      <label style={checkboxLabelStyle}>
        <input
          type="checkbox"
          name={name}
          checked={formData[name] || false}
          onChange={handleChange}
          style={checkboxStyle}
          disabled={isUpdating || isLoading}
        />
        <div>
          <div style={checkboxTextStyle}>{label}</div>
          {description && (
            <div style={checkboxDescriptionStyle}>{description}</div>
          )}
        </div>
      </label>
    </div>
  );

  const renderCertificationGroup = (prefix, label) => (
    <div style={subSectionStyle}>
      <h4 style={subSectionTitleStyle}>{label}</h4>
      <div style={formGridStyle}>
        {renderInput("Last Audit Date", `${prefix}_last_audit_date`, "date")}
        {renderInput("Rating", `${prefix}_rating`)}
        {renderInput("Validity", `${prefix}_validity`, "date")}
        {renderInput(
          "Days Remaining",
          `${prefix}_validity_days_remaining`,
          "number"
        )}
        {renderSelect("Status", `${prefix}_status`, statusOptions)}
      </div>
    </div>
  );

  const renderSimpleCertGroup = (prefix, label) => (
    <div style={subSectionStyle}>
      <h4 style={subSectionTitleStyle}>{label}</h4>
      <div style={formGridStyle}>
        {renderInput("Validity", `${prefix}_validity`, "date")}
        {renderInput(
          "Days Remaining",
          `${prefix}_validity_days_remaining`,
          "number"
        )}
        {renderSelect("Status", `${prefix}_status`, statusOptions)}
      </div>
    </div>
  );

  const renderLicenseGroup = (prefix, label) => (
    <div style={formGroupStyle}>
      <h4 style={subSectionTitleStyle}>{label}</h4>
      <div style={formGridStyle}>
        {renderInput("Validity", `${prefix}_validity`, "date")}
        {renderInput("Days Remaining", `${prefix}_days_remaining`, "number")}
      </div>
    </div>
  );

  const renderAuditSection = (prefix, label) => (
    <div style={subSectionStyle}>
      <h4 style={subSectionTitleStyle}>{label}</h4>
      <div style={formGridStyle}>
        {renderInput(
          "Initial Audit Date",
          `${prefix}_initial_audit_date`,
          "date"
        )}
        {renderInput(
          "Initial Findings",
          `${prefix}_initial_findings`,
          "number"
        )}
        {renderInput(
          "Last Follow-up Audit Date",
          `${prefix}_last_follow_up_audit_date`,
          "date"
        )}
        {renderInput("Total Findings", `${prefix}_total_findings`, "number")}
        {renderInput("Total Corrected", `${prefix}_total_corrected`, "number")}
        {renderInput(
          "Total In Progress",
          `${prefix}_total_in_progress`,
          "number"
        )}
        {renderInput(
          "Total Pending Verification",
          `${prefix}_total_pending_verification`,
          "number"
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <div style={loadingTextStyle}>Loading supplier data...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={headerContentStyle}>
          <button
            onClick={() => navigate("/suppliersCSR")}
            style={backButtonStyle}
            disabled={isUpdating || isLoading}
          >
            <span style={backArrowStyle}>←</span>
            <span>Back</span>
          </button>
          <div style={titleSectionStyle}>
            <h1 style={titleStyle}>Edit Supplier</h1>
            <p style={subtitleStyle}>
              Update all sections to modify supplier/factory information
            </p>
          </div>
        </div>
        <div style={progressSectionStyle}>
          <div style={progressTextStyle}>
            Step {tabs.findIndex((tab) => tab.id === activeTab) + 1} of{" "}
            {tabs.length}
          </div>
          <div style={progressBarStyle}>
            <div
              style={{
                ...progressFillStyle,
                width: `${(
                  ((tabs.findIndex((tab) => tab.id === activeTab) + 1) / tabs.length) *
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div style={errorAlertStyle}>
          <div style={errorIconStyle}>⚠️</div>
          <div>
            <strong>Error Updating Supplier</strong>
            <div style={errorMessageStyle}>{error}</div>
          </div>
        </div>
      )}

      <div style={contentWrapperStyle}>
        <div style={tabsContainerStyle}>
          <div style={tabsStyle}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...tabButtonStyle,
                  ...(activeTab === tab.id ? activeTabStyle : {}),
                }}
                disabled={isUpdating || isLoading}
                type="button"
              >
                <span style={tabIconStyle}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={formStyle}>
          <div style={tabContentStyle}>
            {activeTab === "basic" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>🏢</span> General Information
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Basic factory/supplier details and contact information
                  </p>
                </div>
                <div style={formGridStyle}>
                  {renderInput("SL No", "sl_no", "number")}
                  {renderInput("Supplier/Factory Name", "supplier_name")}
                  {renderInput("Supplier ID", "supplier_id")}
                  {renderInput("Location", "location", "text", false, 3)}
                  {renderSelect(
                    "Supplier Category",
                    "supplier_category",
                    categoryOptions
                  )}
                  {renderInput(
                    "Year of Establishment",
                    "year_of_establishment",
                    "number"
                  )}
                  {renderInput(
                    "Ownership Details",
                    "ownership_details",
                    "text",
                    false,
                    3
                  )}
                  {renderInput(
                    "Factory Main Contact",
                    "factory_main_contact",
                    "text",
                    false,
                    2
                  )}
                  {renderInput(
                    "Factory Merchandiser Contact",
                    "factory_merchandiser_contact",
                    "text",
                    false,
                    2
                  )}
                  {renderInput(
                    "Factory HR/Compliance Contact",
                    "factory_hr_compliance_contact",
                    "text",
                    false,
                    2
                  )}
                  {renderInput("Email", "email", "email")}
                  {renderInput("Phone", "phone", "tel")}
                </div>
              </div>
            )}

            {activeTab === "building" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>🏭</span> Building & Manpower
                    Details
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Facility infrastructure and workforce information
                  </p>
                </div>
                <div style={formGridStyle}>
                  <div style={checkboxGroupContainerStyle}>
                    <div style={checkboxGroupTitleStyle}>Building Type</div>
                    <div style={checkboxGridStyle}>
                      {renderCheckbox("Rented Building", "rented_building")}
                      {renderCheckbox("Share Building", "share_building")}
                      {renderCheckbox("Own Property", "own_property")}
                    </div>
                  </div>
                  {renderInput(
                    "Building Details",
                    "building_details",
                    "text",
                    false,
                    3
                  )}
                  {renderInput("Total Area (sq ft)", "total_area", "number")}
                  <div style={subSectionStyle}>
                    <h4 style={subSectionTitleStyle}>Manpower Details</h4>
                    <div style={formGridStyle}>
                      {renderInput(
                        "Workers - Male",
                        "manpower_workers_male",
                        "number"
                      )}
                      {renderInput(
                        "Workers - Female",
                        "manpower_workers_female",
                        "number"
                      )}
                      {renderInput(
                        "Staff - Male",
                        "manpower_staff_male",
                        "number"
                      )}
                      {renderInput(
                        "Staff - Female",
                        "manpower_staff_female",
                        "number"
                      )}
                      {renderInput(
                        "Total Manpower",
                        "total_manpower",
                        "number"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "production" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>⚙️</span> Production
                    Information
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Manufacturing capabilities and business operations
                  </p>
                </div>
                <div style={formGridStyle}>
                  {renderInput(
                    "Production Process",
                    "production_process",
                    "text",
                    false,
                    3
                  )}
                  {renderInput(
                    "Manufacturing Items",
                    "manufacturing_item",
                    "text",
                    false,
                    3
                  )}
                  {renderInput("Capacity per Month", "capacity_per_month")}
                  {renderInput("Business by Market", "business_by_market")}
                  {renderInput(
                    "Existing Customers",
                    "existing_customer",
                    "text",
                    false,
                    3
                  )}
                  {renderInput(
                    "Number of Sewing Lines",
                    "number_of_sewing_line",
                    "number"
                  )}
                  {renderInput(
                    "Total Number of Machineries",
                    "total_number_of_machineries",
                    "number"
                  )}
                  {renderInput(
                    "Yearly Turnover (USD)",
                    "yearly_turnover_usd",
                    "number"
                  )}
                  {renderSelect(
                    "Weekly Holiday",
                    "weekly_holiday",
                    holidayOptions
                  )}
                  {renderInput("BGMEA Number", "bgmea_number")}
                  {renderInput("RSC", "rsc")}
                  {renderInput(
                    "TAD Group Order Status",
                    "tad_group_order_status"
                  )}
                </div>
              </div>
            )}

            {activeTab === "certifications" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>📜</span> Certifications
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Audit and certification details
                  </p>
                </div>
                <div style={formGridStyle}>
                  {renderCertificationGroup("bsci", "BSCI")}
                  {renderCertificationGroup("sedex", "Sedex")}
                  {renderCertificationGroup("wrap", "WRAP")}
                  {renderCertificationGroup("security_audit", "Security Audit")}
                  {renderSimpleCertGroup("oeko_tex", "Oeko-Tex")}
                  {renderSimpleCertGroup("gots", "GOTS")}
                  {renderSimpleCertGroup("ocs", "OCS")}
                  {renderSimpleCertGroup("grs", "GRS")}
                  {renderSimpleCertGroup("rcs", "RCS")}
                  {renderSimpleCertGroup("iso_9001", "ISO 9001")}
                  {renderSimpleCertGroup("iso_14001", "ISO 14001")}
                  {renderInput(
                    "Certification Remarks",
                    "certification_remarks",
                    "text",
                    false,
                    3
                  )}
                </div>
              </div>
            )}

            {activeTab === "licenses" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>📋</span> Legal Licenses
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    License and membership information
                  </p>
                </div>
                <div style={formGridStyle}>
                  {renderLicenseGroup("trade_license", "Trade License")}
                  {renderLicenseGroup("factory_license", "Factory License")}
                  {renderLicenseGroup("fire_license", "Fire License")}
                  {renderLicenseGroup("membership", "Membership")}
                  {renderLicenseGroup("group_insurance", "Group Insurance")}
                  <div style={subSectionStyle}>
                    <h4 style={subSectionTitleStyle}>Boiler License</h4>
                    <div style={formGridStyle}>
                      {renderInput("Boiler No", "boiler_no")}
                      {renderInput(
                        "Validity",
                        "boiler_license_validity",
                        "date"
                      )}
                      {renderInput(
                        "Days Remaining",
                        "boiler_license_days_remaining",
                        "number"
                      )}
                    </div>
                  </div>
                  {renderLicenseGroup("berc_license", "BERC License")}
                  {renderInput(
                    "License Remarks",
                    "license_remarks",
                    "text",
                    false,
                    3
                  )}
                </div>
              </div>
            )}

            {activeTab === "safety" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>🚨</span> Fire Safety
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Fire safety training and drill records
                  </p>
                </div>
                <div style={formGridStyle}>
                  {renderInput(
                    "Last Fire Training by FSCD",
                    "last_fire_training_by_fscd",
                    "date"
                  )}
                  {renderInput(
                    "Next Fire Training Date (FSCD)",
                    "fscd_next_fire_training_date",
                    "date"
                  )}
                  {renderInput(
                    "Last Fire Drill Record by FSCD",
                    "last_fire_drill_record_by_fscd",
                    "date"
                  )}
                  {renderInput(
                    "Next Drill Date (FSCD)",
                    "fscd_next_drill_date",
                    "date"
                  )}
                  {renderInput(
                    "Total Fire Fighter/Rescue/First Aider (FSCD)",
                    "total_fire_fighter_rescue_first_aider_fscd",
                    "number"
                  )}
                  {renderInput(
                    "Fire Safety Remarks",
                    "fire_safety_remarks",
                    "text",
                    false,
                    3
                  )}
                </div>
              </div>
            )}

            {activeTab === "compliance" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>✅</span> Wages & Compliance
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Wages, benefits, and committee information
                  </p>
                </div>
                <div style={formGridStyle}>
                  <div style={subSectionStyle}>
                    <h4 style={subSectionTitleStyle}>Wages & Benefits</h4>
                    <div style={checkboxGridStyle}>
                      {renderCheckbox(
                        "Minimum Wages Paid",
                        "minimum_wages_paid"
                      )}
                      {renderCheckbox("Earn Leave Status", "earn_leave_status")}
                      {renderCheckbox("Service Benefit", "service_benefit")}
                      {renderCheckbox("Maternity Benefit", "maternity_benefit")}
                      {renderCheckbox("Yearly Increment", "yearly_increment")}
                      {renderCheckbox("Festival Bonus", "festival_bonus")}
                      {renderCheckbox("Salary Due Status", "salary_due_status")}
                    </div>
                    {renderInput("Due Salary Month", "due_salary_month")}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pcSafety" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>👥</span> PC & Safety Committee
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Participation Committee and Safety Committee information
                  </p>
                </div>
                <div style={formGridStyle}>
                  <div style={subSectionStyle}>
                    <h4 style={subSectionTitleStyle}>Participation Committee</h4>
                    <div style={formGridStyle}>
                      {renderInput(
                        "Last PC Election Date",
                        "last_pc_election_date",
                        "date"
                      )}
                      {renderInput(
                        "Last PC Meeting Date",
                        "last_pc_meeting_date",
                        "date"
                      )}
                    </div>
                  </div>
                  <div style={subSectionStyle}>
                    <h4 style={subSectionTitleStyle}>Safety Committee</h4>
                    <div style={formGridStyle}>
                      {renderInput(
                        "Last Safety Committee Formation Date",
                        "last_safety_committee_formation_date",
                        "date"
                      )}
                      {renderInput(
                        "Last Safety Committee Meeting Date",
                        "last_safety_committee_meeting_date",
                        "date"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "environment" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>🌱</span> Environmental
                    Information
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Environmental reports and assessments
                  </p>
                </div>
                <div style={formGridStyle}>
                  {renderInput(
                    "Water Test Report (DOE)",
                    "water_test_report_doe"
                  )}
                  {renderInput(
                    "ZDHC Water Test Report",
                    "zdhc_water_test_report"
                  )}
                  {renderInput(
                    "Higg FEM Self Assessment Score",
                    "higg_fem_self_assessment_score",
                    "number"
                  )}
                  {renderInput(
                    "Higg FEM Verification Assessment Score",
                    "higg_fem_verification_assessment_score",
                    "number"
                  )}
                  {renderCheckbox(
                    "Behive Chemical Inventory",
                    "behive_chemical_inventory"
                  )}
                </div>
              </div>
            )}

            {activeTab === "rsc" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>🔍</span> Accord RSC
                    Information
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    RSC audit and safety findings
                  </p>
                </div>
                <div style={formGridStyle}>
                  {renderInput("RSC ID", "rsc_id")}
                  {renderInput("Progress Rate", "progress_rate", "number")}
                  {renderAuditSection("structural", "Structural Safety")}
                  {renderAuditSection("fire", "Fire Safety")}
                  {renderAuditSection("electrical", "Electrical Safety")}
                </div>
              </div>
            )}

            {activeTab === "csr" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>🤝</span> CSR Information
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Corporate social responsibility activities
                  </p>
                </div>
                <div style={formGridStyle}>
                  {renderCheckbox(
                    "Donation to Local Community",
                    "donation_local_community"
                  )}
                  {renderCheckbox(
                    "Tree Plantation in Local Community",
                    "tree_plantation_local_community"
                  )}
                  {renderCheckbox(
                    "Sanitary Napkin Status",
                    "sanitary_napkin_status"
                  )}
                  {renderCheckbox("Fair Shop", "fair_shop")}
                  {renderCheckbox(
                    "Any Gift Provided During Festival",
                    "any_gift_provided_during_festival"
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={formActionsStyle}>
            <div style={requiredHintStyle}>
              <span style={{ color: colors.error }}>*</span> Required fields
            </div>
            <div style={actionButtonsStyle}>
              <button
                type="button"
                onClick={() => navigate("/suppliersCSR")}
                style={cancelButtonStyle}
                disabled={isUpdating || isLoading}
              >
                Cancel
              </button>
              <div style={navigationButtonsStyle}>
                {activeTab !== "basic" && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    style={previousButtonStyle}
                    disabled={isUpdating || isLoading}
                  >
                    ← Previous
                  </button>
                )}

                {activeTab !== "csr" ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    style={nextButtonStyle}
                    disabled={isUpdating || isLoading}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    style={{
                      ...submitButtonStyle,
                      ...(isUpdating
                        ? {
                            backgroundColor: colors.gray,
                            cursor: "not-allowed",
                          }
                        : {}),
                    }}
                    disabled={isUpdating || isLoading}
                  >
                    {isUpdating ? "Updating..." : "Update Supplier"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Style constants (copied from AddSupplierCSR.jsx)
const containerStyle = {
  backgroundColor: colors.light,
  minHeight: "100vh",
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const headerStyle = {
  backgroundColor: "white",
  padding: "1.5rem 2rem",
  borderBottom: `1px solid ${colors.border}`,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const headerContentStyle = {
  display: "flex",
  alignItems: "center",
  gap: "1.5rem",
  marginBottom: "1rem",
};

const backButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.5rem 1rem",
  backgroundColor: "transparent",
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: "500",
  color: colors.gray,
  transition: "background-color 0.2s",
};

const backArrowStyle = {
  fontSize: "1.125rem",
};

const titleSectionStyle = {
  flex: 1,
};

const titleStyle = {
  fontSize: "1.5rem",
  fontWeight: "600",
  color: colors.dark,
  margin: "0 0 0.25rem 0",
};

const subtitleStyle = {
  fontSize: "0.875rem",
  color: colors.gray,
  margin: 0,
};

const progressSectionStyle = {
  maxWidth: "400px",
};

const progressTextStyle = {
  fontSize: "0.75rem",
  fontWeight: "500",
  color: colors.gray,
  marginBottom: "0.5rem",
};

const progressBarStyle = {
  height: "6px",
  backgroundColor: colors.border,
  borderRadius: "3px",
  overflow: "hidden",
};

const progressFillStyle = {
  height: "100%",
  backgroundColor: colors.primary,
  transition: "width 0.3s",
};

const loadingContainerStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  gap: "1rem",
};

const spinnerStyle = {
  width: "2.5rem",
  height: "2.5rem",
  border: `3px solid ${colors.border}`,
  borderTopColor: colors.primary,
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const loadingTextStyle = {
  fontSize: "1rem",
  color: colors.gray,
  fontWeight: "500",
};

const errorAlertStyle = {
  backgroundColor: "#fef2f2",
  color: colors.danger,
  padding: "1rem 2rem",
  borderRadius: "8px",
  margin: "1rem 2rem",
  border: `1px solid #fecaca`,
  display: "flex",
  alignItems: "flex-start",
  gap: "0.75rem",
};

const errorIconStyle = {
  fontSize: "1.25rem",
};

const errorMessageStyle = {
  fontSize: "0.875rem",
  whiteSpace: "pre-wrap",
};

const contentWrapperStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "2rem",
};

const tabsContainerStyle = {
  backgroundColor: "white",
  borderRadius: "12px 12px 0 0",
  borderBottom: `1px solid ${colors.border}`,
  overflowX: "auto",
};

const tabsStyle = {
  display: "flex",
  padding: "0 1.5rem",
  gap: "0.25rem",
};

const tabButtonStyle = {
  padding: "1rem 1.5rem",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: "500",
  color: colors.gray,
  transition: "color 0.2s",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  position: "relative",
};

const activeTabStyle = {
  color: colors.primary,
  fontWeight: "600",
};

const tabIconStyle = {
  fontSize: "1rem",
};

const formStyle = {
  backgroundColor: "white",
  borderRadius: "0 0 12px 12px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
};

const tabContentStyle = {
  padding: "2rem",
};

const formSectionStyle = {
  animation: "fadeIn 0.3s",
};

const sectionHeaderStyle = {
  marginBottom: "2rem",
  borderBottom: `1px solid ${colors.border}`,
  paddingBottom: "1rem",
};

const sectionTitleStyle = {
  fontSize: "1.25rem",
  fontWeight: "600",
  color: colors.dark,
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const sectionIconStyle = {
  fontSize: "1.25rem",
};

const sectionDescriptionStyle = {
  fontSize: "0.875rem",
  color: colors.gray,
};

const subSectionStyle = {
  marginTop: "2rem",
};

const subSectionTitleStyle = {
  fontSize: "1.125rem",
  fontWeight: "600",
  color: colors.dark,
  marginBottom: "1rem",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "1.5rem",
};

const formGroupStyle = {
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  fontSize: "0.875rem",
  fontWeight: "500",
  color: colors.dark,
  marginBottom: "0.5rem",
};

const inputStyle = {
  padding: "0.75rem",
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  fontSize: "0.875rem",
  transition: "border-color 0.2s",
};

const inputErrorStyle = {
  borderColor: colors.error,
};

const inputDisabledStyle = {
  backgroundColor: colors.light,
  color: colors.muted,
  cursor: "not-allowed",
};

const fieldErrorStyle = {
  fontSize: "0.75rem",
  color: colors.error,
  marginTop: "0.25rem",
};

const selectStyle = {
  padding: "0.75rem",
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  fontSize: "0.875rem",
  backgroundColor: "white",
};

const checkboxGroupContainerStyle = {
  gridColumn: "1 / -1",
};

const checkboxGroupTitleStyle = {
  fontSize: "0.875rem",
  fontWeight: "600",
  color: colors.dark,
  marginBottom: "1rem",
};

const checkboxGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "1rem",
};

const checkboxGroupStyle = {
  marginBottom: "0.5rem",
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "0.75rem",
  cursor: "pointer",
};

const checkboxStyle = {
  height: "1rem",
  width: "1rem",
  accentColor: colors.primary,
};

const checkboxTextStyle = {
  fontSize: "0.875rem",
  fontWeight: "500",
};

const checkboxDescriptionStyle = {
  fontSize: "0.75rem",
  color: colors.gray,
};

const formActionsStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1.5rem 2rem",
  borderTop: `1px solid ${colors.border}`,
  backgroundColor: colors.light,
};

const requiredHintStyle = {
  fontSize: "0.75rem",
  color: colors.gray,
};

const actionButtonsStyle = {
  display: "flex",
  gap: "1rem",
};

const navigationButtonsStyle = {
  display: "flex",
  gap: "1rem",
};

const cancelButtonStyle = {
  padding: "0.75rem 1.5rem",
  backgroundColor: "transparent",
  color: colors.gray,
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
  transition: "background-color 0.2s",
};

const previousButtonStyle = {
  padding: "0.75rem 1.5rem",
  backgroundColor: "white",
  color: colors.dark,
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
  transition: "background-color 0.2s",
};

const nextButtonStyle = {
  padding: "0.75rem 1.5rem",
  backgroundColor: colors.primary,
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
  transition: "background-color 0.2s",
};

const submitButtonStyle = {
  padding: "0.75rem 1.5rem",
  backgroundColor: colors.success,
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
  transition: "background-color 0.2s",
};

// Add CSS animation
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`, styleSheet.cssRules.length);

export default EditSupplierCSR;