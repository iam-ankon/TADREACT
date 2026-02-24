import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSupplierById, updateSupplier } from "../../api/supplierApi";

const colors = {
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  primaryLight: "#3b82f6",
  success: "#059669",
  successLight: "#d1fae5",
  danger: "#dc2626",
  dangerLight: "#fee2e2",
  warning: "#d97706",
  warningLight: "#fef3c7",
  info: "#0891b2",
  infoLight: "#cffafe",
  light: "#f9fafb",
  dark: "#111827",
  gray: "#6b7280",
  muted: "#9ca3af",
  border: "#e5e7eb",
  borderDark: "#d1d5db",
  error: "#ef4444",
  background: "#ffffff",
  cardBg: "#f9fafb",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
};

const statusOptions = [
  { value: "active", label: "Active", color: colors.success },
  { value: "valid", label: "Valid", color: colors.success },
  { value: "pending", label: "Pending", color: colors.warning },
  { value: "in progress", label: "In Progress", color: colors.info },
  { value: "expired", label: "Expired", color: colors.danger },
  { value: "invalid", label: "Invalid", color: colors.danger },
  { value: "cancelled", label: "Cancelled", color: colors.gray },
  { value: "", label: "Unknown", color: colors.muted },
];

const complianceStatusOptions = [
  { value: "compliant", label: "Compliant", color: colors.success },
  { value: "non_compliant", label: "Non-Compliant", color: colors.danger },
  { value: "under_review", label: "Under Review", color: colors.warning },
  { value: "conditional", label: "Conditional Approval", color: colors.info },
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
    // Basic Information
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

    // Certifications
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
    other_certificate_1_name: "",
    other_certificate_2_name: "",

    // Licenses
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

    // Fire Safety
    last_fire_training_by_fscd: "",
    fscd_next_fire_training_date: "",
    last_fire_drill_record_by_fscd: "",
    fscd_next_drill_date: "",
    total_fire_fighter_rescue_first_aider_fscd: "",
    fire_safety_remarks: "",

    // Wages & Compliance
    minimum_wages_paid: false,
    earn_leave_status: false,
    service_benefit: false,
    maternity_benefit: false,
    yearly_increment: false,
    festival_bonus: false,
    salary_due_status: false,
    due_salary_month: "",

    // Environmental
    water_test_report_doe: "",
    zdhc_water_test_report: "",
    higg_fem_self_assessment_score: "",
    higg_fem_verification_assessment_score: "",
    behive_chemical_inventory: false,

    // RSC Audit
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

    // PC & Safety Committee
    last_pc_election_date: "",
    last_pc_meeting_date: "",
    last_safety_committee_formation_date: "",
    last_safety_committee_meeting_date: "",

    // CSR
    donation_local_community: false,
    tree_plantation_local_community: false,
    sanitary_napkin_status: false,
    fair_shop: false,
    any_gift_provided_during_festival: false,

    // NEW: Compliance & Safety
    compliance_status: "under_review",
    compliance_remarks: "",
    grievance_mechanism: false,
    grievance_resolution_procedure: "",
    last_grievance_resolution_date: "",
    grievance_resolution_rate: "",
    grievance_remarks: "",
    safety_training_frequency: "",
    last_safety_audit_date: "",
    safety_measures_remarks: "",

    // Contact Information
    email: "",
    phone: "",
  });

  // File states
  const [files, setFiles] = useState({
    // Certificate files
    bsci_certificate: null,
    sedex_certificate: null,
    wrap_certificate: null,
    security_audit_certificate: null,
    oeko_tex_certificate: null,
    gots_certificate: null,
    ocs_certificate: null,
    grs_certificate: null,
    rcs_certificate: null,
    iso_9001_certificate: null,
    iso_14001_certificate: null,
    other_certificate_1: null,
    other_certificate_2: null,

    // License files
    trade_license_file: null,
    factory_license_file: null,
    fire_license_file: null,
    membership_file: null,
    group_insurance_file: null,
    boiler_license_file: null,
    berc_license_file: null,

    // Environmental files
    environmental_compliance_certificate: null,
    environmental_audit_report: null,

    // Compliance & Safety files
    compliance_certificate: null,
    grievance_policy_document: null,
    emergency_evacuation_plan: null,
    safety_protocols_document: null,
    health_safety_policy: null,
    risk_assessment_report: null,
    safety_audit_report: null,

    // General documents
    profile_picture: null,
    additional_document_1: null,
    additional_document_2: null,
    additional_document_3: null,
    additional_document_4: null,

    // Fire Safety file URLs
    fire_training_certificate: null,
    fire_drill_record: null,
    fire_safety_audit_report: null,

    // RSC file URLs
    rsc_certificate: null,
    structural_safety_report: null,
    electrical_safety_report: null,
    fire_safety_report: null,

    // PC & Safety Committee file URLs
    pc_election_document: null,
    pc_meeting_minutes: null,
    safety_committee_formation_document: null,
    safety_committee_meeting_minutes: null,
  });

  // Existing file URLs for display
  const [existingFiles, setExistingFiles] = useState({});

  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [touchedFields, setTouchedFields] = useState({});
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  // Function to calculate days remaining
  const calculateDaysRemaining = (validityDate) => {
    if (!validityDate) return "";

    const today = new Date();
    const validity = new Date(validityDate);

    // Reset time part for accurate day calculation
    today.setHours(0, 0, 0, 0);
    validity.setHours(0, 0, 0, 0);

    const diffTime = validity - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays.toString();
  };

  // Function to update all days remaining fields
  const updateAllDaysRemaining = () => {
    const dateFields = [
      { field: "bsci_validity", daysField: "bsci_validity_days_remaining" },
      { field: "sedex_validity", daysField: "sedex_validity_days_remaining" },
      { field: "wrap_validity", daysField: "wrap_validity_days_remaining" },
      {
        field: "security_audit_validity",
        daysField: "security_audit_validity_days_remaining",
      },
      {
        field: "oeko_tex_validity",
        daysField: "oeko_tex_validity_days_remaining",
      },
      { field: "gots_validity", daysField: "gots_validity_days_remaining" },
      { field: "ocs_validity", daysField: "ocs_validity_days_remaining" },
      { field: "grs_validity", daysField: "grs_validity_days_remaining" },
      { field: "rcs_validity", daysField: "rcs_validity_days_remaining" },
      {
        field: "iso_9001_validity",
        daysField: "iso_9001_validity_days_remaining",
      },
      {
        field: "iso_14001_validity",
        daysField: "iso_14001_validity_days_remaining",
      },
      {
        field: "trade_license_validity",
        daysField: "trade_license_days_remaining",
      },
      {
        field: "factory_license_validity",
        daysField: "factory_license_days_remaining",
      },
      {
        field: "fire_license_validity",
        daysField: "fire_license_days_remaining",
      },
      { field: "membership_validity", daysField: "membership_days_remaining" },
      {
        field: "group_insurance_validity",
        daysField: "group_insurance_days_remaining",
      },
      {
        field: "boiler_license_validity",
        daysField: "boiler_license_days_remaining",
      },
      { field: "berc_license_validity", daysField: "berc_days_remaining" },
    ];

    setFormData((prev) => {
      const updatedData = { ...prev };
      let hasUpdates = false;

      dateFields.forEach(({ field, daysField }) => {
        if (updatedData[field]) {
          const newValue = calculateDaysRemaining(updatedData[field]);
          if (updatedData[daysField] !== newValue) {
            updatedData[daysField] = newValue;
            hasUpdates = true;
          }
        }
      });

      // Only update state if there are changes
      if (hasUpdates) {
        setLastUpdateTime(new Date());
        return updatedData;
      }
      return prev;
    });
  };

  // Effect for real-time updates
  useEffect(() => {
    // Initial calculation
    updateAllDaysRemaining();

    // Set up interval to recalculate periodically (every hour)
    const calculateInterval = setInterval(
      () => {
        console.log("Recalculating days remaining...");
        updateAllDaysRemaining();
      },
      60 * 60 * 1000,
    ); // Every hour

    // Also recalculate when the component becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Tab became visible, recalculating days remaining...");
        updateAllDaysRemaining();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Recalculate at midnight
    const now = new Date();
    const timeUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0) -
      now;

    const midnightTimeout = setTimeout(() => {
      console.log("Midnight reached, recalculating days remaining...");
      updateAllDaysRemaining();

      // Then set up daily interval
      setInterval(
        () => {
          updateAllDaysRemaining();
        },
        24 * 60 * 60 * 1000,
      ); // Every 24 hours
    }, timeUntilMidnight);

    return () => {
      clearInterval(calculateInterval);
      clearTimeout(midnightTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Also recalculate when validity dates change
  useEffect(() => {
    // This effect runs whenever formData changes
    // But we need to avoid infinite loops by checking if the change was from a validity field
    const validityFields = [
      "bsci_validity",
      "sedex_validity",
      "wrap_validity",
      "security_audit_validity",
      "oeko_tex_validity",
      "gots_validity",
      "ocs_validity",
      "grs_validity",
      "rcs_validity",
      "iso_9001_validity",
      "iso_14001_validity",
      "trade_license_validity",
      "factory_license_validity",
      "fire_license_validity",
      "membership_validity",
      "group_insurance_validity",
      "boiler_license_validity",
      "berc_license_validity",
    ];

    // Check if any validity field was just updated
    const justUpdatedValidity = validityFields.some((field) => {
      return touchedFields[field];
    });

    if (justUpdatedValidity) {
      updateAllDaysRemaining();
    }
  }, [formData]); // This runs whenever formData changes

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
        "bsci_last_audit_date",
        "bsci_validity",
        "sedex_last_audit_date",
        "sedex_validity",
        "wrap_last_audit_date",
        "wrap_validity",
        "security_audit_last_date",
        "security_audit_validity",
        "oeko_tex_validity",
        "gots_validity",
        "ocs_validity",
        "grs_validity",
        "rcs_validity",
        "iso_9001_validity",
        "iso_14001_validity",
        "trade_license_validity",
        "factory_license_validity",
        "fire_license_validity",
        "membership_validity",
        "group_insurance_validity",
        "boiler_license_validity",
        "berc_license_validity",
        "last_fire_training_by_fscd",
        "fscd_next_fire_training_date",
        "last_fire_drill_record_by_fscd",
        "fscd_next_drill_date",
        "structural_initial_audit_date",
        "structural_last_follow_up_audit_date",
        "fire_initial_audit_date",
        "fire_last_follow_up_audit_date",
        "electrical_initial_audit_date",
        "electrical_last_follow_up_audit_date",
        "last_pc_election_date",
        "last_pc_meeting_date",
        "last_safety_committee_formation_date",
        "last_safety_committee_meeting_date",
        "water_test_report_doe",
        "zdhc_water_test_report",
        "last_grievance_resolution_date",
        "last_safety_audit_date",
      ];

      dateFields.forEach((field) => {
        if (formattedData[field]) {
          const date = new Date(formattedData[field]);
          if (!isNaN(date.getTime())) {
            formattedData[field] = date.toISOString().split("T")[0];
          }
        }
      });

      // Recalculate days remaining based on current date
      const daysRemainingFields = [
        "bsci_validity_days_remaining",
        "sedex_validity_days_remaining",
        "wrap_validity_days_remaining",
        "security_audit_validity_days_remaining",
        "oeko_tex_validity_days_remaining",
        "gots_validity_days_remaining",
        "ocs_validity_days_remaining",
        "grs_validity_days_remaining",
        "rcs_validity_days_remaining",
        "iso_9001_validity_days_remaining",
        "iso_14001_validity_days_remaining",
        "trade_license_days_remaining",
        "factory_license_days_remaining",
        "fire_license_days_remaining",
        "membership_days_remaining",
        "group_insurance_days_remaining",
        "boiler_license_days_remaining",
        "berc_days_remaining",
      ];

      daysRemainingFields.forEach((field) => {
        const baseField = field
          .replace("_days_remaining", "")
          .replace("_validity_days_remaining", "_validity");
        if (formattedData[baseField]) {
          formattedData[field] = calculateDaysRemaining(
            formattedData[baseField],
          );
        }
      });

      setFormData(formattedData);

      // Store existing file URLs for display
      const fileFields = {
        bsci_certificate: formattedData.bsci_certificate_url,
        sedex_certificate: formattedData.sedex_certificate_url,
        wrap_certificate: formattedData.wrap_certificate_url,
        security_audit_certificate:
          formattedData.security_audit_certificate_url,
        oeko_tex_certificate: formattedData.oeko_tex_certificate_url,
        gots_certificate: formattedData.gots_certificate_url,
        ocs_certificate: formattedData.ocs_certificate_url,
        grs_certificate: formattedData.grs_certificate_url,
        rcs_certificate: formattedData.rcs_certificate_url,
        iso_9001_certificate: formattedData.iso_9001_certificate_url,
        iso_14001_certificate: formattedData.iso_14001_certificate_url,
        trade_license_file: formattedData.trade_license_file_url,
        factory_license_file: formattedData.factory_license_file_url,
        fire_license_file: formattedData.fire_license_file_url,
        membership_file: formattedData.membership_file_url,
        group_insurance_file: formattedData.group_insurance_file_url,
        boiler_license_file: formattedData.boiler_license_file_url,
        berc_license_file: formattedData.berc_license_file_url,
        environmental_compliance_certificate:
          formattedData.environmental_compliance_certificate_url,
        environmental_audit_report:
          formattedData.environmental_audit_report_url,
        compliance_certificate: formattedData.compliance_certificate_url,
        grievance_policy_document: formattedData.grievance_policy_document_url,
        emergency_evacuation_plan: formattedData.emergency_evacuation_plan_url,
        safety_protocols_document: formattedData.safety_protocols_document_url,
        health_safety_policy: formattedData.health_safety_policy_url,
        risk_assessment_report: formattedData.risk_assessment_report_url,
        safety_audit_report: formattedData.safety_audit_report_url,
        profile_picture: formattedData.profile_picture_url,
        additional_document_1: formattedData.additional_document_1_url,
        additional_document_2: formattedData.additional_document_2_url,
        additional_document_3: formattedData.additional_document_3_url,
        additional_document_4: formattedData.additional_document_4_url,
        fire_training_certificate: formattedData.fire_training_certificate_url,
        fire_drill_record: formattedData.fire_drill_record_url,
        fire_safety_audit_report: formattedData.fire_safety_audit_report_url,
        rsc_certificate: formattedData.rsc_certificate_url,
        structural_safety_report: formattedData.structural_safety_report_url,
        electrical_safety_report: formattedData.electrical_safety_report_url,
        fire_safety_report: formattedData.fire_safety_report_url,
        pc_election_document: formattedData.pc_election_document_url,
        pc_meeting_minutes: formattedData.pc_meeting_minutes_url,
        safety_committee_formation_document:
          formattedData.safety_committee_formation_document_url,
        safety_committee_meeting_minutes:
          formattedData.safety_committee_meeting_minutes_url,
      };

      setExistingFiles(fileFields);
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

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : processedValue,
      };

      // Auto-calculate days remaining when validity date changes
      if (name.includes("_validity") && !name.includes("days_remaining")) {
        const daysRemainingField = name.replace(
          "_validity",
          "_validity_days_remaining",
        );
        const calculatedDays = calculateDaysRemaining(value);
        newData[daysRemainingField] = calculatedDays;
      }

      // Handle specific cases for different field patterns
      if (name === "bsci_validity") {
        newData.bsci_validity_days_remaining = calculateDaysRemaining(value);
      } else if (name === "sedex_validity") {
        newData.sedex_validity_days_remaining = calculateDaysRemaining(value);
      } else if (name === "wrap_validity") {
        newData.wrap_validity_days_remaining = calculateDaysRemaining(value);
      } else if (name === "security_audit_validity") {
        newData.security_audit_validity_days_remaining =
          calculateDaysRemaining(value);
      } else if (name === "oeko_tex_validity") {
        newData.oeko_tex_validity_days_remaining =
          calculateDaysRemaining(value);
      } else if (name === "gots_validity") {
        newData.gots_validity_days_remaining = calculateDaysRemaining(value);
      } else if (name === "ocs_validity") {
        newData.ocs_validity_days_remaining = calculateDaysRemaining(value);
      } else if (name === "grs_validity") {
        newData.grs_validity_days_remaining = calculateDaysRemaining(value);
      } else if (name === "rcs_validity") {
        newData.rcs_validity_days_remaining = calculateDaysRemaining(value);
      } else if (name === "iso_9001_validity") {
        newData.iso_9001_validity_days_remaining =
          calculateDaysRemaining(value);
      } else if (name === "iso_14001_validity") {
        newData.iso_14001_validity_days_remaining =
          calculateDaysRemaining(value);
      } else if (name === "trade_license_validity") {
        newData.trade_license_days_remaining = calculateDaysRemaining(value);
      } else if (name === "factory_license_validity") {
        newData.factory_license_days_remaining = calculateDaysRemaining(value);
      } else if (name === "fire_license_validity") {
        newData.fire_license_days_remaining = calculateDaysRemaining(value);
      } else if (name === "membership_validity") {
        newData.membership_days_remaining = calculateDaysRemaining(value);
      } else if (name === "group_insurance_validity") {
        newData.group_insurance_days_remaining = calculateDaysRemaining(value);
      } else if (name === "boiler_license_validity") {
        newData.boiler_license_days_remaining = calculateDaysRemaining(value);
      } else if (name === "berc_license_validity") {
        newData.berc_days_remaining = calculateDaysRemaining(value);
      }

      return newData;
    });

    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    if (error) setError(null);
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];

    setFiles((prev) => ({
      ...prev,
      [name]: file,
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async () => {
    if (activeTab !== "documents") {
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      // Create a deep copy of formData
      const formDataCopy = JSON.parse(JSON.stringify(formData));

      // Calculate total manpower if not provided
      if (!formDataCopy.total_manpower) {
        const total =
          (parseInt(formDataCopy.manpower_workers_male) || 0) +
          (parseInt(formDataCopy.manpower_workers_female) || 0) +
          (parseInt(formDataCopy.manpower_staff_male) || 0) +
          (parseInt(formDataCopy.manpower_staff_female) || 0);
        formDataCopy.total_manpower = total > 0 ? total : null;
      }

      // CRITICAL: Recalculate ALL days_remaining fields before submitting
      // This ensures the backend receives the current values
      const dateFields = [
        // Certifications
        { field: "bsci_validity", daysField: "bsci_validity_days_remaining" },
        { field: "sedex_validity", daysField: "sedex_validity_days_remaining" },
        { field: "wrap_validity", daysField: "wrap_validity_days_remaining" },
        {
          field: "security_audit_validity",
          daysField: "security_audit_validity_days_remaining",
        },
        {
          field: "oeko_tex_validity",
          daysField: "oeko_tex_validity_days_remaining",
        },
        { field: "gots_validity", daysField: "gots_validity_days_remaining" },
        { field: "ocs_validity", daysField: "ocs_validity_days_remaining" },
        { field: "grs_validity", daysField: "grs_validity_days_remaining" },
        { field: "rcs_validity", daysField: "rcs_validity_days_remaining" },
        {
          field: "iso_9001_validity",
          daysField: "iso_9001_validity_days_remaining",
        },
        {
          field: "iso_14001_validity",
          daysField: "iso_14001_validity_days_remaining",
        },

        // Licenses
        {
          field: "trade_license_validity",
          daysField: "trade_license_days_remaining",
        },
        {
          field: "factory_license_validity",
          daysField: "factory_license_days_remaining",
        },
        {
          field: "fire_license_validity",
          daysField: "fire_license_days_remaining",
        },
        {
          field: "membership_validity",
          daysField: "membership_days_remaining",
        },
        {
          field: "group_insurance_validity",
          daysField: "group_insurance_days_remaining",
        },
        {
          field: "boiler_license_validity",
          daysField: "boiler_license_days_remaining",
        },
        { field: "berc_license_validity", daysField: "berc_days_remaining" },
      ];

      // Recalculate each days_remaining field
      dateFields.forEach(({ field, daysField }) => {
        if (formDataCopy[field]) {
          formDataCopy[daysField] = calculateDaysRemaining(formDataCopy[field]);
        }
      });

      console.log("Submitting with recalculated values:", {
        bsci_validity: formDataCopy.bsci_validity,
        bsci_days: formDataCopy.bsci_validity_days_remaining,
        trade_license: formDataCopy.trade_license_validity,
        trade_days: formDataCopy.trade_license_days_remaining,
      });

      const formDataToSend = new FormData();

      // Add ALL form data (including recalculated days_remaining)
      Object.entries(formDataCopy).forEach(([key, value]) => {
        // Only append if value exists and is not empty
        if (value !== null && value !== undefined && value !== "") {
          // Convert booleans to strings
          const finalValue =
            typeof value === "boolean" ? value.toString() : value;
          formDataToSend.append(key, finalValue);
        }
      });

      // Add files
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formDataToSend.append(key, file);
        }
      });

      // Log what we're sending
      console.log("Sending FormData entries:");
      for (let pair of formDataToSend.entries()) {
        if (!(pair[1] instanceof File))  {
          console.log(pair[0] + ": " + pair[1]);
        }
      }

      const response = await updateSupplier(id, formDataToSend);
      console.log("Update response:", response.data);

      alert("Supplier updated successfully!");
      navigate("/suppliersCSR");
    } catch (err) {
      console.error("Update error:", err);
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
                    }`,
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

  // Updated tabs array with new Documents tab
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
    { id: "documents", label: "Documents", icon: "📎" },
  ];

  const renderInput = (
    label,
    name,
    type = "text",
    isRequired = false,
    rows = null,
  ) => {
    const value = formData[name] ?? "";
    const isError = touchedFields[name] && isRequired && !formData[name];
    const Component = rows ? "textarea" : "input";

    // For days remaining fields, show a subtle indicator that they're auto-updating
    const isDaysRemaining =
      name.includes("_days_remaining") ||
      name.includes("_validity_days_remaining");

    // Add a small refresh icon for days remaining fields
    const showAutoUpdate =
      isDaysRemaining &&
      formData[
        name
          .replace("_days_remaining", "")
          .replace("_validity_days_remaining", "_validity")
      ];

    return (
      <div style={formGroupStyle}>
        <label style={labelStyle}>
          {label} {isRequired && <span style={{ color: colors.error }}>*</span>}
          {showAutoUpdate && (
            <span style={autoUpdateBadgeStyle} title="Auto-updates daily">
              🔄
            </span>
          )}
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
            ...(isUpdating || isLoading ? inputDisabledStyle : {}),
            ...(rows ? textareaStyle : {}),
            ...(isDaysRemaining ? daysRemainingFieldStyle : {}),
          }}
          disabled={isUpdating || isLoading || isDaysRemaining} // Disable days remaining fields from manual editing
          placeholder={
            isDaysRemaining ? "Auto-calculated" : `Enter ${label.toLowerCase()}`
          }
          rows={rows}
          readOnly={isDaysRemaining}
        />
        {isError && <div style={fieldErrorStyle}>This field is required</div>}
        {isDaysRemaining && value && (
          <div style={autoUpdateHintStyle}>
            Last updated: {lastUpdateTime.toLocaleTimeString()}
          </div>
        )}
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
            ...(isUpdating || isLoading ? inputDisabledStyle : {}),
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
    <div style={checkboxWrapperStyle}>
      <label style={checkboxLabelStyle}>
        <input
          type="checkbox"
          name={name}
          checked={formData[name] || false}
          onChange={handleChange}
          style={checkboxStyle}
          disabled={isUpdating || isLoading}
        />
        <div style={checkboxContentStyle}>
          <div style={checkboxTextStyle}>{label}</div>
          {description && (
            <div style={checkboxDescriptionStyle}>{description}</div>
          )}
        </div>
      </label>
    </div>
  );

  const renderFileInput = (label, name, accept = "*") => {
    const file = files[name];
    const existingFile = existingFiles[name];

    return (
      <div style={formGroupStyle}>
        <label style={labelStyle}>{label}</label>
        {existingFile && (
          <div style={existingFileStyle}>
            <span>📄</span>
            <span>Existing file: </span>
            <a
              href={existingFile}
              target="_blank"
              rel="noopener noreferrer"
              style={existingFileLinkStyle}
            >
              View
            </a>
          </div>
        )}
        <div style={fileInputWrapperStyle}>
          <input
            type="file"
            name={name}
            onChange={handleFileChange}
            accept={accept}
            style={fileInputStyle}
            disabled={isUpdating || isLoading}
            id={`file-${name}`}
          />
          <label htmlFor={`file-${name}`} style={fileInputLabelStyle}>
            {file ? file.name : existingFile ? "Replace file" : "Choose file"}
          </label>
        </div>
        {file && (
          <div style={filePreviewStyle}>
            <span>📄</span>
            <span>{file.name}</span>
            <span style={fileSizeStyle}>
              {(file.size / 1024).toFixed(2)} KB
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderCertificationGroup = (prefix, label) => (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <h4 style={cardTitleStyle}>{label}</h4>
      </div>
      <div style={cardBodyStyle}>
        <div style={formGridStyle}>
          {renderInput("Last Audit Date", `${prefix}_last_audit_date`, "date")}
          {renderInput("Rating", `${prefix}_rating`)}
          {renderInput("Validity", `${prefix}_validity`, "date")}
          {renderInput(
            "Days Remaining",
            `${prefix}_validity_days_remaining`,
            "number",
          )}
          {renderSelect("Status", `${prefix}_status`, statusOptions)}
          {renderFileInput(
            "Certificate",
            `${prefix}_certificate`,
            ".pdf,.jpg,.png",
          )}
        </div>
      </div>
    </div>
  );

  const renderSimpleCertGroup = (prefix, label) => (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <h4 style={cardTitleStyle}>{label}</h4>
      </div>
      <div style={cardBodyStyle}>
        <div style={formGridStyle}>
          {renderInput("Validity", `${prefix}_validity`, "date")}
          {renderInput(
            "Days Remaining",
            `${prefix}_validity_days_remaining`,
            "number",
          )}
          {renderSelect("Status", `${prefix}_status`, statusOptions)}
          {renderFileInput(
            "Certificate",
            `${prefix}_certificate`,
            ".pdf,.jpg,.png",
          )}
        </div>
      </div>
    </div>
  );

  const renderLicenseGroup = (prefix, label) => (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <h4 style={cardTitleStyle}>{label}</h4>
      </div>
      <div style={cardBodyStyle}>
        <div style={formGridStyle}>
          {renderInput("Validity", `${prefix}_validity`, "date")}
          {renderInput("Days Remaining", `${prefix}_days_remaining`, "number")}
          {renderFileInput("File", `${prefix}_file`, ".pdf,.jpg,.png")}
        </div>
      </div>
    </div>
  );

  const renderAuditSectionWithFiles = (prefix, label) => (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <h4 style={cardTitleStyle}>{label}</h4>
      </div>

      {/* Audit Details */}
      <div style={cardBodyStyle}>
        <div style={formGridStyle}>
          {renderInput(
            "Initial Audit Date",
            `${prefix}_initial_audit_date`,
            "date",
          )}
          {renderInput(
            "Initial Findings",
            `${prefix}_initial_findings`,
            "number",
          )}
          {renderInput(
            "Last Follow-up Audit Date",
            `${prefix}_last_follow_up_audit_date`,
            "date",
          )}
          {renderInput("Total Findings", `${prefix}_total_findings`, "number")}
          {renderInput(
            "Total Corrected",
            `${prefix}_total_corrected`,
            "number",
          )}
          {renderInput(
            "Total In Progress",
            `${prefix}_total_in_progress`,
            "number",
          )}
          {renderInput(
            "Total Pending Verification",
            `${prefix}_total_pending_verification`,
            "number",
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div style={cardBodyStyle}>
        <div style={formGridStyle}>
          {prefix === "structural" &&
            renderFileInput(
              "Structural Safety Report",
              "structural_safety_report",
              ".pdf",
            )}
          {prefix === "fire" &&
            renderFileInput("Fire Safety Report", "fire_safety_report", ".pdf")}
          {prefix === "electrical" &&
            renderFileInput(
              "Electrical Safety Report",
              "electrical_safety_report",
              ".pdf",
            )}
        </div>
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
                width: `${
                  ((tabs.findIndex((tab) => tab.id === activeTab) + 1) /
                    tabs.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div style={errorAlertStyle}>
          <div style={errorIconStyle}>⚠️</div>
          <div style={errorContentStyle}>
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
                {activeTab === tab.id && (
                  <div style={activeTabIndicatorStyle} />
                )}
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
                  {renderInput(
                    "Supplier/Factory Name",
                    "supplier_name",
                    "text",
                    true,
                  )}
                  {renderInput("Supplier ID", "supplier_id", "text", true)}
                  {renderInput("Location", "location", "text", false, 3)}
                  {renderSelect(
                    "Supplier Category",
                    "supplier_category",
                    categoryOptions,
                  )}
                  {renderInput(
                    "Year of Establishment",
                    "year_of_establishment",
                    "number",
                  )}
                  {renderInput(
                    "Ownership Details",
                    "ownership_details",
                    "text",
                    false,
                    3,
                  )}
                  {renderInput(
                    "Factory Main Contact",
                    "factory_main_contact",
                    "text",
                    false,
                    2,
                  )}
                  {renderInput(
                    "Factory Merchandiser Contact",
                    "factory_merchandiser_contact",
                    "text",
                    false,
                    2,
                  )}
                  {renderInput(
                    "Factory HR/Compliance Contact",
                    "factory_hr_compliance_contact",
                    "text",
                    false,
                    2,
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
                  <div style={fullWidthStyle}>
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
                    3,
                  )}
                  {renderInput("Total Area (sq ft)", "total_area", "number")}
                </div>
                <div style={dividerStyle} />
                <div>
                  <h4 style={subSectionTitleStyle}>Manpower Details</h4>
                  <div style={formGridStyle}>
                    {renderInput(
                      "Workers - Male",
                      "manpower_workers_male",
                      "number",
                    )}
                    {renderInput(
                      "Workers - Female",
                      "manpower_workers_female",
                      "number",
                    )}
                    {renderInput(
                      "Staff - Male",
                      "manpower_staff_male",
                      "number",
                    )}
                    {renderInput(
                      "Staff - Female",
                      "manpower_staff_female",
                      "number",
                    )}
                    {renderInput("Total Manpower", "total_manpower", "number")}
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
                    3,
                  )}
                  {renderInput(
                    "Manufacturing Items",
                    "manufacturing_item",
                    "text",
                    false,
                    3,
                  )}
                  {renderInput("Capacity per Month", "capacity_per_month")}
                  {renderInput("Business by Market", "business_by_market")}
                  {renderInput(
                    "Existing Customers",
                    "existing_customer",
                    "text",
                    false,
                    3,
                  )}
                  {renderInput(
                    "Number of Sewing Lines",
                    "number_of_sewing_line",
                    "number",
                  )}
                  {renderInput(
                    "Total Number of Machineries",
                    "total_number_of_machineries",
                    "number",
                  )}
                  {renderInput(
                    "Yearly Turnover (USD)",
                    "yearly_turnover_usd",
                    "number",
                  )}
                  {renderSelect(
                    "Weekly Holiday",
                    "weekly_holiday",
                    holidayOptions,
                  )}
                  {renderInput("BGMEA Number", "bgmea_number")}
                  {renderInput("RSC", "rsc")}
                  {renderInput(
                    "TAD Group Order Status",
                    "tad_group_order_status",
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
                <div style={cardsContainerStyle}>
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

                  {/* Additional Certificates */}
                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                      <h4 style={cardTitleStyle}>Additional Certificates</h4>
                    </div>
                    <div style={cardBodyStyle}>
                      <div style={formGridStyle}>
                        {renderInput(
                          "Certificate 1 Name",
                          "other_certificate_1_name",
                        )}
                        {renderFileInput(
                          "Certificate 1 File",
                          "other_certificate_1",
                          ".pdf,.jpg,.png",
                        )}
                        {renderInput(
                          "Certificate 2 Name",
                          "other_certificate_2_name",
                        )}
                        {renderFileInput(
                          "Certificate 2 File",
                          "other_certificate_2",
                          ".pdf,.jpg,.png",
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={fullWidthStyle}>
                    {renderInput(
                      "Certification Remarks",
                      "certification_remarks",
                      "text",
                      false,
                      3,
                    )}
                  </div>
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
                <div style={cardsContainerStyle}>
                  {renderLicenseGroup("trade_license", "Trade License")}
                  {renderLicenseGroup("factory_license", "Factory License")}
                  {renderLicenseGroup("fire_license", "Fire License")}
                  {renderLicenseGroup("membership", "Membership")}
                  {renderLicenseGroup("group_insurance", "Group Insurance")}

                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                      <h4 style={cardTitleStyle}>Boiler License</h4>
                    </div>
                    <div style={cardBodyStyle}>
                      <div style={formGridStyle}>
                        {renderInput("Boiler No", "boiler_no")}
                        {renderInput(
                          "Validity",
                          "boiler_license_validity",
                          "date",
                        )}
                        {renderInput(
                          "Days Remaining",
                          "boiler_license_days_remaining",
                          "number",
                        )}
                        {renderFileInput(
                          "Boiler License File",
                          "boiler_license_file",
                          ".pdf,.jpg,.png",
                        )}
                      </div>
                    </div>
                  </div>

                  {renderLicenseGroup("berc_license", "BERC License")}

                  <div style={fullWidthStyle}>
                    {renderInput(
                      "License Remarks",
                      "license_remarks",
                      "text",
                      false,
                      3,
                    )}
                  </div>
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
                    "date",
                  )}
                  {renderInput(
                    "Next Fire Training Date (FSCD)",
                    "fscd_next_fire_training_date",
                    "date",
                  )}
                  {renderInput(
                    "Last Fire Drill Record by FSCD",
                    "last_fire_drill_record_by_fscd",
                    "date",
                  )}
                  {renderInput(
                    "Next Drill Date (FSCD)",
                    "fscd_next_drill_date",
                    "date",
                  )}
                  {renderInput(
                    "Total Fire Fighter/Rescue/First Aider (FSCD)",
                    "total_fire_fighter_rescue_first_aider_fscd",
                    "number",
                  )}
                </div>

                <div style={dividerStyle} />

                <div>
                  <h4 style={subSectionTitleStyle}>Fire Safety Documents</h4>
                  <div style={formGridStyle}>
                    {renderFileInput(
                      "Fire Training Certificate",
                      "fire_training_certificate",
                      ".pdf,.jpg,.png",
                    )}
                    {renderFileInput(
                      "Fire Drill Record",
                      "fire_drill_record",
                      ".pdf,.jpg,.png",
                    )}
                    {renderFileInput(
                      "Fire Safety Audit Report",
                      "fire_safety_audit_report",
                      ".pdf,.jpg,.png",
                    )}
                  </div>
                </div>

                <div style={dividerStyle} />

                <div style={fullWidthStyle}>
                  {renderInput(
                    "Fire Safety Remarks",
                    "fire_safety_remarks",
                    "text",
                    false,
                    3,
                  )}
                </div>
              </div>
            )}

            {activeTab === "compliance" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>✅</span> Compliance &
                    Grievance
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Compliance status and grievance management
                  </p>
                </div>

                <div style={cardsContainerStyle}>
                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                      <h4 style={cardTitleStyle}>Compliance Status</h4>
                    </div>
                    <div style={cardBodyStyle}>
                      <div style={formGridStyle}>
                        {renderSelect(
                          "Compliance Status",
                          "compliance_status",
                          complianceStatusOptions,
                        )}
                        {renderFileInput(
                          "Compliance Certificate",
                          "compliance_certificate",
                          ".pdf,.jpg,.png",
                        )}
                        <div style={fullWidthStyle}>
                          {renderInput(
                            "Compliance Remarks",
                            "compliance_remarks",
                            "text",
                            false,
                            3,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                      <h4 style={cardTitleStyle}>Grievance Management</h4>
                    </div>
                    <div style={cardBodyStyle}>
                      <div style={checkboxGridStyle}>
                        {renderCheckbox(
                          "Grievance Mechanism Available",
                          "grievance_mechanism",
                        )}
                      </div>
                      <div style={formGridStyle}>
                        {renderFileInput(
                          "Grievance Policy Document",
                          "grievance_policy_document",
                          ".pdf",
                        )}
                        {renderInput(
                          "Grievance Resolution Procedure",
                          "grievance_resolution_procedure",
                          "text",
                          false,
                          3,
                        )}
                        {renderInput(
                          "Last Grievance Resolution Date",
                          "last_grievance_resolution_date",
                          "date",
                        )}
                        {renderInput(
                          "Grievance Resolution Rate (%)",
                          "grievance_resolution_rate",
                          "number",
                        )}
                        {renderInput(
                          "Grievance Remarks",
                          "grievance_remarks",
                          "text",
                          false,
                          3,
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pcSafety" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>👥</span> PC & Safety
                    Committee
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Participation Committee and Safety Committee information
                  </p>
                </div>

                <div style={cardsContainerStyle}>
                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                      <h4 style={cardTitleStyle}>Participation Committee</h4>
                    </div>
                    <div style={cardBodyStyle}>
                      <div style={formGridStyle}>
                        {renderInput(
                          "Last PC Election Date",
                          "last_pc_election_date",
                          "date",
                        )}
                        {renderFileInput(
                          "PC Election Document",
                          "pc_election_document",
                          ".pdf,.jpg,.png",
                        )}
                        {renderInput(
                          "Last PC Meeting Date",
                          "last_pc_meeting_date",
                          "date",
                        )}
                        {renderFileInput(
                          "PC Meeting Minutes",
                          "pc_meeting_minutes",
                          ".pdf,.jpg,.png",
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                      <h4 style={cardTitleStyle}>Safety Committee</h4>
                    </div>
                    <div style={cardBodyStyle}>
                      <div style={formGridStyle}>
                        {renderInput(
                          "Last Safety Committee Formation Date",
                          "last_safety_committee_formation_date",
                          "date",
                        )}
                        {renderFileInput(
                          "Formation Document",
                          "safety_committee_formation_document",
                          ".pdf,.jpg,.png",
                        )}
                        {renderInput(
                          "Last Safety Committee Meeting Date",
                          "last_safety_committee_meeting_date",
                          "date",
                        )}
                        {renderFileInput(
                          "Meeting Minutes",
                          "safety_committee_meeting_minutes",
                          ".pdf,.jpg,.png",
                        )}
                      </div>
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
                    "water_test_report_doe",
                    "date",
                  )}
                  {renderInput(
                    "ZDHC Water Test Report",
                    "zdhc_water_test_report",
                    "date",
                  )}
                  {renderInput(
                    "Higg FEM Self Assessment Score",
                    "higg_fem_self_assessment_score",
                    "number",
                  )}
                  {renderInput(
                    "Higg FEM Verification Assessment Score",
                    "higg_fem_verification_assessment_score",
                    "number",
                  )}
                  <div style={fullWidthStyle}>
                    {renderCheckbox(
                      "Behive Chemical Inventory",
                      "behive_chemical_inventory",
                    )}
                  </div>
                </div>

                <div style={dividerStyle} />

                <div>
                  <h4 style={subSectionTitleStyle}>Environmental Documents</h4>
                  <div style={formGridStyle}>
                    {renderFileInput(
                      "Environmental Compliance Certificate",
                      "environmental_compliance_certificate",
                      ".pdf,.jpg,.png",
                    )}
                    {renderFileInput(
                      "Environmental Audit Report",
                      "environmental_audit_report",
                      ".pdf,.jpg,.png",
                    )}
                  </div>
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
                </div>

                <div style={cardsContainerStyle}>
                  {renderAuditSectionWithFiles(
                    "structural",
                    "Structural Safety",
                  )}
                  {renderAuditSectionWithFiles("fire", "Fire Safety")}
                  {renderAuditSectionWithFiles(
                    "electrical",
                    "Electrical Safety",
                  )}
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
                <div style={checkboxGridStyle}>
                  {renderCheckbox(
                    "Donation to Local Community",
                    "donation_local_community",
                  )}
                  {renderCheckbox(
                    "Tree Plantation in Local Community",
                    "tree_plantation_local_community",
                  )}
                  {renderCheckbox(
                    "Sanitary Napkin Status",
                    "sanitary_napkin_status",
                  )}
                  {renderCheckbox("Fair Shop", "fair_shop")}
                  {renderCheckbox(
                    "Any Gift Provided During Festival",
                    "any_gift_provided_during_festival",
                  )}
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>📎</span> Additional
                    Documents
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Safety documents and general files
                  </p>
                </div>

                <div style={cardsContainerStyle}>
                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                      <h4 style={cardTitleStyle}>Safety Documents</h4>
                    </div>
                    <div style={cardBodyStyle}>
                      <div style={formGridStyle}>
                        {renderFileInput(
                          "Emergency Evacuation Plan",
                          "emergency_evacuation_plan",
                          ".pdf,.jpg,.png",
                        )}
                        {renderFileInput(
                          "Safety Protocols Document",
                          "safety_protocols_document",
                          ".pdf,.jpg,.png",
                        )}
                        {renderFileInput(
                          "Health & Safety Policy",
                          "health_safety_policy",
                          ".pdf,.jpg,.png",
                        )}
                        {renderFileInput(
                          "Risk Assessment Report",
                          "risk_assessment_report",
                          ".pdf,.jpg,.png",
                        )}
                        {renderInput(
                          "Safety Training Frequency",
                          "safety_training_frequency",
                        )}
                        {renderInput(
                          "Last Safety Audit Date",
                          "last_safety_audit_date",
                          "date",
                        )}
                        {renderFileInput(
                          "Safety Audit Report",
                          "safety_audit_report",
                          ".pdf,.jpg,.png",
                        )}
                        <div style={fullWidthStyle}>
                          {renderInput(
                            "Safety Measures Remarks",
                            "safety_measures_remarks",
                            "text",
                            false,
                            3,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                      <h4 style={cardTitleStyle}>General Documents</h4>
                    </div>
                    <div style={cardBodyStyle}>
                      <div style={formGridStyle}>
                        {renderFileInput(
                          "Profile Picture",
                          "profile_picture",
                          "image/*",
                        )}
                        {renderFileInput(
                          "Additional Document 1",
                          "additional_document_1",
                        )}
                        {renderFileInput(
                          "Additional Document 2",
                          "additional_document_2",
                        )}
                        {renderFileInput(
                          "Additional Document 3",
                          "additional_document_3",
                        )}
                        {renderFileInput(
                          "Additional Document 4",
                          "additional_document_4",
                        )}
                      </div>
                    </div>
                  </div>
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

                {activeTab !== "documents" ? (
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
                      ...(isUpdating ? submitButtonDisabledStyle : {}),
                    }}
                    disabled={isUpdating || isLoading}
                  >
                    {isUpdating ? (
                      <span style={buttonContentStyle}>
                        <span style={spinnerSmallStyle}></span>
                        Updating...
                      </span>
                    ) : (
                      "Update Supplier"
                    )}
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

// Style constants - Modern Professional Design
const containerStyle = {
  backgroundColor: "#f3f4f6",
  minHeight: "100vh",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const headerStyle = {
  backgroundColor: colors.background,
  padding: "2rem 3rem",
  borderBottom: `1px solid ${colors.border}`,
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
};

const headerContentStyle = {
  display: "flex",
  alignItems: "center",
  gap: "1.5rem",
  marginBottom: "1.5rem",
};

const backButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.625rem 1.25rem",
  backgroundColor: "transparent",
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: "500",
  color: colors.gray,
  transition: "all 0.2s",
  ":hover": {
    backgroundColor: colors.light,
    borderColor: colors.borderDark,
  },
};

const backArrowStyle = {
  fontSize: "1.125rem",
};

const titleSectionStyle = {
  flex: 1,
};

const titleStyle = {
  fontSize: "1.875rem",
  fontWeight: "600",
  color: colors.textPrimary,
  margin: "0 0 0.25rem 0",
  letterSpacing: "-0.025em",
};

const subtitleStyle = {
  fontSize: "0.875rem",
  color: colors.textSecondary,
  margin: 0,
};

const progressSectionStyle = {
  maxWidth: "400px",
};

const progressTextStyle = {
  fontSize: "0.75rem",
  fontWeight: "600",
  color: colors.textSecondary,
  marginBottom: "0.5rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const progressBarStyle = {
  height: "8px",
  backgroundColor: colors.border,
  borderRadius: "4px",
  overflow: "hidden",
};

const progressFillStyle = {
  height: "100%",
  backgroundColor: colors.primary,
  transition: "width 0.3s ease",
  borderRadius: "4px",
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
  width: "3rem",
  height: "3rem",
  border: `3px solid ${colors.border}`,
  borderTopColor: colors.primary,
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

const loadingTextStyle = {
  fontSize: "1rem",
  color: colors.textSecondary,
  fontWeight: "500",
};

const errorAlertStyle = {
  backgroundColor: colors.dangerLight,
  color: colors.danger,
  padding: "1rem 2rem",
  borderRadius: "12px",
  margin: "1.5rem 3rem",
  border: `1px solid ${colors.danger}`,
  display: "flex",
  alignItems: "flex-start",
  gap: "0.75rem",
  boxShadow: "0 4px 6px -1px rgba(220, 38, 38, 0.1)",
};

const errorIconStyle = {
  fontSize: "1.25rem",
};

const errorContentStyle = {
  flex: 1,
};

const errorMessageStyle = {
  fontSize: "0.875rem",
  whiteSpace: "pre-wrap",
  marginTop: "0.25rem",
};

const contentWrapperStyle = {
  margin: "0 auto",
  padding: "2rem 3rem",
};

const tabsContainerStyle = {
  backgroundColor: colors.background,
  borderRadius: "12px 12px 0 0",
  borderBottom: `1px solid ${colors.border}`,
  overflowX: "auto",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const tabsStyle = {
  display: "flex",
  padding: "0 1rem",
  gap: "0.25rem",
};

const tabButtonStyle = {
  padding: "1rem 1.5rem",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: "500",
  color: colors.textSecondary,
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  position: "relative",
  whiteSpace: "nowrap",
  ":hover": {
    color: colors.textPrimary,
  },
};

const activeTabStyle = {
  color: colors.primary,
  fontWeight: "600",
};

const activeTabIndicatorStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: "2px",
  backgroundColor: colors.primary,
  borderRadius: "2px 2px 0 0",
};

const tabIconStyle = {
  fontSize: "1rem",
};

const formStyle = {
  backgroundColor: colors.background,
  borderRadius: "0 0 12px 12px",
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
};

const tabContentStyle = {
  padding: "2.5rem",
};

const formSectionStyle = {
  animation: "fadeIn 0.3s ease",
};

const sectionHeaderStyle = {
  marginBottom: "2rem",
};

const sectionTitleStyle = {
  fontSize: "1.5rem",
  fontWeight: "600",
  color: colors.textPrimary,
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  marginBottom: "0.5rem",
  letterSpacing: "-0.025em",
};

const sectionIconStyle = {
  fontSize: "1.5rem",
};

const sectionDescriptionStyle = {
  fontSize: "0.875rem",
  color: colors.textSecondary,
};

const subSectionTitleStyle = {
  fontSize: "1.125rem",
  fontWeight: "600",
  color: colors.textPrimary,
  marginBottom: "1.5rem",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: "1.5rem",
};

const fullWidthStyle = {
  gridColumn: "1 / -1",
};

const formGroupStyle = {
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  fontSize: "0.875rem",
  fontWeight: "500",
  color: colors.textSecondary,
  marginBottom: "0.5rem",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const autoUpdateBadgeStyle = {
  fontSize: "0.75rem",
  color: colors.info,
  marginLeft: "0.25rem",
  cursor: "help",
};

const autoUpdateHintStyle = {
  fontSize: "0.7rem",
  color: colors.textMuted,
  marginTop: "0.25rem",
  textAlign: "right",
};

const daysRemainingFieldStyle = {
  backgroundColor: colors.light,
  color: colors.textSecondary,
  cursor: "not-allowed",
};

const inputStyle = {
  padding: "0.625rem 0.875rem",
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  fontSize: "0.875rem",
  transition: "all 0.2s",
  outline: "none",
  ":focus": {
    borderColor: colors.primary,
    boxShadow: `0 0 0 3px ${colors.primary}20`,
  },
};

const textareaStyle = {
  minHeight: "100px",
  resize: "vertical",
};

const inputErrorStyle = {
  borderColor: colors.error,
  ":focus": {
    borderColor: colors.error,
    boxShadow: `0 0 0 3px ${colors.error}20`,
  },
};

const inputDisabledStyle = {
  backgroundColor: colors.light,
  color: colors.textMuted,
  cursor: "not-allowed",
};

const fieldErrorStyle = {
  fontSize: "0.75rem",
  color: colors.error,
  marginTop: "0.25rem",
};

const selectStyle = {
  ...inputStyle,
  backgroundColor: colors.background,
  cursor: "pointer",
};

const checkboxWrapperStyle = {
  marginBottom: "0.5rem",
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "0.75rem",
  cursor: "pointer",
};

const checkboxStyle = {
  width: "1rem",
  height: "1rem",
  marginTop: "0.125rem",
  accentColor: colors.primary,
  cursor: "pointer",
};

const checkboxContentStyle = {
  flex: 1,
};

const checkboxTextStyle = {
  fontSize: "0.875rem",
  fontWeight: "500",
  color: colors.textPrimary,
};

const checkboxDescriptionStyle = {
  fontSize: "0.75rem",
  color: colors.textSecondary,
  marginTop: "0.125rem",
};

const checkboxGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "1rem",
  padding: "0.5rem 0",
};

const checkboxGroupTitleStyle = {
  fontSize: "0.875rem",
  fontWeight: "600",
  color: colors.textPrimary,
  marginBottom: "1rem",
};

const fileInputWrapperStyle = {
  position: "relative",
};

const fileInputStyle = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  border: 0,
};

const fileInputLabelStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.625rem 1rem",
  backgroundColor: colors.light,
  border: `1px dashed ${colors.border}`,
  borderRadius: "8px",
  fontSize: "0.875rem",
  color: colors.textSecondary,
  cursor: "pointer",
  transition: "all 0.2s",
  width: "100%",
  ":hover": {
    backgroundColor: colors.border,
    borderColor: colors.borderDark,
  },
};

const filePreviewStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.75rem",
  color: colors.textSecondary,
  marginTop: "0.5rem",
  padding: "0.5rem",
  backgroundColor: colors.light,
  borderRadius: "6px",
  border: `1px solid ${colors.border}`,
};

const fileSizeStyle = {
  marginLeft: "auto",
  color: colors.textMuted,
};

const existingFileStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.75rem",
  color: colors.success,
  marginBottom: "0.5rem",
  padding: "0.5rem",
  backgroundColor: colors.successLight,
  borderRadius: "6px",
  border: `1px solid ${colors.success}`,
};

const existingFileLinkStyle = {
  color: colors.success,
  textDecoration: "none",
  marginLeft: "0.25rem",
  fontWeight: "500",
  ":hover": {
    textDecoration: "underline",
  },
};

const dividerStyle = {
  height: "1px",
  backgroundColor: colors.border,
  margin: "2rem 0",
};

const cardsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
  gap: "1.5rem",
};

const cardStyle = {
  backgroundColor: colors.background,
  border: `1px solid ${colors.border}`,
  borderRadius: "12px",
  overflow: "hidden",
  transition: "all 0.2s",
  ":hover": {
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
};

const cardHeaderStyle = {
  padding: "1rem 1.5rem",
  backgroundColor: colors.light,
  borderBottom: `1px solid ${colors.border}`,
};

const cardTitleStyle = {
  fontSize: "1rem",
  fontWeight: "600",
  color: colors.textPrimary,
  margin: 0,
};

const cardBodyStyle = {
  padding: "1.5rem",
};

const formActionsStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1.5rem 2.5rem",
  borderTop: `1px solid ${colors.border}`,
  backgroundColor: colors.light,
};

const requiredHintStyle = {
  fontSize: "0.75rem",
  color: colors.textSecondary,
};

const actionButtonsStyle = {
  display: "flex",
  gap: "1rem",
};

const navigationButtonsStyle = {
  display: "flex",
  gap: "0.75rem",
};

const cancelButtonStyle = {
  padding: "0.625rem 1.5rem",
  backgroundColor: "transparent",
  color: colors.textSecondary,
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "0.875rem",
  transition: "all 0.2s",
  ":hover": {
    backgroundColor: colors.background,
    borderColor: colors.borderDark,
  },
};

const previousButtonStyle = {
  padding: "0.625rem 1.5rem",
  backgroundColor: colors.background,
  color: colors.textPrimary,
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "0.875rem",
  transition: "all 0.2s",
  ":hover": {
    backgroundColor: colors.light,
    borderColor: colors.borderDark,
  },
};

const nextButtonStyle = {
  padding: "0.625rem 1.5rem",
  backgroundColor: colors.primary,
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "0.875rem",
  transition: "all 0.2s",
  ":hover": {
    backgroundColor: colors.primaryDark,
  },
};

const submitButtonStyle = {
  padding: "0.625rem 1.5rem",
  backgroundColor: colors.success,
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "0.875rem",
  transition: "all 0.2s",
  ":hover": {
    backgroundColor: "#047857",
  },
};

const submitButtonDisabledStyle = {
  backgroundColor: colors.gray,
  cursor: "not-allowed",
};

const buttonContentStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const spinnerSmallStyle = {
  width: "1rem",
  height: "1rem",
  border: `2px solid ${colors.border}`,
  borderTopColor: "white",
  borderRadius: "50%",
  animation: "spin 0.6s linear infinite",
};

// Add CSS animations
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  styleSheet.insertRule(
    `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `,
    styleSheet.cssRules.length,
  );

  styleSheet.insertRule(
    `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
    styleSheet.cssRules.length,
  );
}

export default EditSupplierCSR;
