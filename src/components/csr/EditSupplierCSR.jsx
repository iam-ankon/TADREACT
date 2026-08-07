import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getSupplierById,
  updateSupplier,
  getChainSupplies,
  createChainSupply,
  updateChainSupply,
  deleteChainSupply,
  getChainSupplies1,
  createChainSupply1,
  updateChainSupply1,
  deleteChainSupply1,
} from "../../api/supplierApi";

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
  { value: "Socks", label: "Socks" },
  { value: "Bags & Luggage", label: "Bags & Luggage" },
  { value: "Tent", label: "Tent" },
];

const holidayOptions = [
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" },
  { value: "Sunday", label: "Sunday" },
];

const getFallbackImageDataUrl = () => {
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
};

const extractCleanPath = (url) => {
  if (!url) return '';
  if (typeof url !== 'string') {
    if (Array.isArray(url)) {
      return url.length > 0 ? extractCleanPath(url[0]) : '';
    }
    url = String(url);
  }
  
  let cleanPath = url.trim();
  
  if (cleanPath.includes('119.148.51.38:8000') || cleanPath.startsWith('http')) {
    try {
      const urlObj = new URL(cleanPath);
      cleanPath = urlObj.pathname;
    } catch (e) {
      const mediaIndex = cleanPath.indexOf('/media/');
      if (mediaIndex !== -1) {
        cleanPath = cleanPath.substring(mediaIndex + 1);
      } else {
        const docIndex = cleanPath.search(/supplier_documents|building_images|fire_safety_images/);
        if (docIndex !== -1) {
          cleanPath = cleanPath.substring(docIndex);
        }
      }
    }
  }
  
  cleanPath = cleanPath.replace(/^\/media\/+/, '');
  cleanPath = cleanPath.replace(/\/media\/media\//g, '/media/');
  cleanPath = cleanPath.replace(/media\/media\//g, 'media/');
  cleanPath = cleanPath.replace(/^\/+/g, '');
  cleanPath = cleanPath.replace(/^https?:\/\/[^/]+\//, '');
  
  if (cleanPath.includes('http')) {
    const match = cleanPath.match(/(?:supplier_documents|building_images|fire_safety_images)\/.*/);
    if (match) {
      cleanPath = match[0];
    } else {
      const parts = cleanPath.split('/');
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i] && (parts[i].includes('.') || parts[i] === 'supplier_documents' || parts[i] === 'building_images' || parts[i] === 'fire_safety_images')) {
          cleanPath = parts.slice(i).join('/');
          break;
        }
      }
    }
  }
  
  cleanPath = cleanPath.replace(/\/+$/, '');
  cleanPath = cleanPath.replace(/^media\//, '');
  
  if (!cleanPath || cleanPath === '/') return '';
  
  return cleanPath;
};

const getCorrectFileUrl = (url) => {
  if (!url) return null;
  const backendUrl = "http://119.148.51.38:8000";
  const cleanPath = extractCleanPath(url);
  if (!cleanPath) return null;
  return `${backendUrl}/media/${cleanPath}`;
};

const calculateDaysRemaining = (validityDate) => {
  if (!validityDate) return "";

  let validity;
  if (typeof validityDate === "string" && validityDate.includes("-")) {
    validity = new Date(validityDate);
  } else {
    validity = new Date(validityDate);
  }

  if (isNaN(validity.getTime())) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  validity.setHours(0, 0, 0, 0);

  const diffTime = validity - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

const calculateStatusFromDaysRemaining = (daysRemaining) => {
  if (
    daysRemaining === "" ||
    daysRemaining === null ||
    daysRemaining === undefined
  )
    return "";
  const days = parseInt(daysRemaining);
  if (isNaN(days)) return "";
  if (days < 0) return "expired";
  if (days === 0) return "expiring_today";
  if (days <= 30) return "expiring_soon";
  return "valid";
};

const EditSupplierCSR = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    sl_no: "",
    supplier_name: "",
    supplier_id: "",
    location: "",
    location_factory: "",
    bank_name: "",
    bank_account: "",
    bank_branch: "",
    bank_bin: "",
    bank_branch_address: "",
    bank_swift_code: "",
    supplier_category: "",
    year_of_establishment: "",
    sister_concern: "",
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
    other_gender_workers: "",
    disabled_workers: "",
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
    bkmea_number: "",
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
    other_certificate_1_name: "",
    other_certificate_2_name: "",
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
    drinking_water_license_validity: "",
    drinking_water_license_days_remaining: "",
    last_fire_training_by_fscd: "",
    fscd_next_fire_training_date: "",
    last_fire_drill_record_by_fscd: "",
    fscd_next_drill_date: "",
    total_fire_fighter_rescue_first_aider_fscd: "",
    fire_safety_remarks: "",
    fire_safety_detection: "",
    fire_safety_protection: "",
    fire_door: "",
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
    zdhc_enrollment_status: false,
    higg_fem_self_assessment_score: "",
    higg_fem_verification_assessment_score: "",
    behive_chemical_inventory: false,
    co2_report: "",
    solar_energy: "",
    green_energy: "",
    rsc_id: "",
    progress_rate: "",
    escalation_status: false,
    no_color_certificate: false,
    recognitoion_letter: false,
    structural_initial_audit_date: "",
    structural_last_follow_up_audit_date: "",
    fire_initial_audit_date: "",
    fire_last_follow_up_audit_date: "",
    electrical_initial_audit_date: "",
    electrical_last_follow_up_audit_date: "",
    last_pc_election_date: "",
    last_pc_meeting_date: "",
    last_safety_committee_formation_date: "",
    last_safety_committee_meeting_date: "",
    donation_local_community: false,
    tree_plantation_local_community: false,
    sanitary_napkin_status: false,
    fair_shop: false,
    any_gift_provided_during_festival: false,
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
    zero_tolerance_walkthrough_allowed: false,
    zero_tolerance_no_underage_workers: false,
    zero_tolerance_no_suspected_young_workers: false,
    zero_tolerance_minimum_wage_guaranteed: false,
    zero_tolerance_authentic_records: false,
    zero_tolerance_no_forced_labor: false,
    zero_tolerance_walkthrough_findings: "",
    zero_tolerance_no_underage_findings: "",
    zero_tolerance_no_suspected_young_findings: "",
    zero_tolerance_minimum_wage_findings: "",
    zero_tolerance_authentic_records_findings: "",
    zero_tolerance_no_forced_labor_findings: "",
    fire_fighting_equipment_sufficient: false,
    fire_fighting_trained_personnel: false,
    fire_fighting_hose_system: false,
    fire_fighting_equipment_sufficient_findings: "",
    fire_fighting_trained_personnel_findings: "",
    fire_fighting_hose_system_findings: "",
    fire_alarm_system_present: false,
    fire_alarm_audible_all_areas: false,
    fire_alarm_visual_noisy_areas: false,
    fire_alarm_ips_backup: false,
    fire_alarm_smoke_detectors: false,
    fire_alarm_switches_marked: false,
    fire_alarm_system_present_findings: "",
    fire_alarm_audible_all_areas_findings: "",
    fire_alarm_visual_noisy_areas_findings: "",
    fire_alarm_ips_backup_findings: "",
    fire_alarm_smoke_detectors_findings: "",
    fire_alarm_switches_marked_findings: "",
    emergency_lights_installed: false,
    emergency_lights_ips_backup: false,
    emergency_lights_installed_findings: "",
    emergency_lights_ips_backup_findings: "",
    drinking_water_sufficient: false,
    drinking_water_test_report_valid: false,
    drinking_water_parameters_acceptable: false,
    drinking_water_arsenic_limit: false,
    drinking_water_sufficient_findings: "",
    drinking_water_test_report_valid_findings: "",
    drinking_water_parameters_acceptable_findings: "",
    drinking_water_arsenic_limit_findings: "",
    pa_system_present: false,
    pa_system_audible_all_areas: false,
    pa_system_present_findings: "",
    pa_system_audible_all_areas_findings: "",
    emergency_exits_two_per_floor: false,
    emergency_exits_trained_workers: false,
    emergency_exits_two_per_floor_findings: "",
    emergency_exits_trained_workers_findings: "",
    grievance_policy_developed: false,
    grievance_workers_aware: false,
    grievance_committee_established: false,
    grievance_complain_box_installed: false,
    grievance_policy_developed_findings: "",
    grievance_workers_aware_findings: "",
    grievance_committee_established_findings: "",
    grievance_complain_box_installed_findings: "",
    wet_process_unit_exists: false,
    wet_process_environmental_licenses: false,
    wet_process_wastewater_treatment_plant: false,
    wet_process_wtp_functional: false,
    wet_process_valid_test_report: false,
    wet_process_parameters_within_limits: false,
    wet_process_ph_within_limits: false,
    wet_process_unit_exists_findings: "",
    wet_process_environmental_licenses_findings: "",
    wet_process_wastewater_treatment_plant_findings: "",
    wet_process_wtp_functional_findings: "",
    wet_process_valid_test_report_findings: "",
    wet_process_parameters_within_limits_findings: "",
    wet_process_ph_within_limits_findings: "",
    no_physical_harassment: false,
    no_sexual_harassment: false,
    no_psychological_harassment: false,
    no_verbal_harassment: false,
    no_physical_harassment_findings: "",
    no_sexual_harassment_findings: "",
    no_psychological_harassment_findings: "",
    no_verbal_harassment_findings: "",
    first_visit_date: "",
    first_visit_status: "",
    first_visit_findings: "",
    first_visit_completed: false,
    email: "",
    phone: "",
    osh_committee_safety: false,
    osh_safety_policy: false,
    iso_45001_validity: "",
    iso_45001_validity_days_remaining: "",
    tier2_suppliers: [],
    tier3_suppliers: [],
    created_at: "",
    updated_at: "",
  });

  const [selectedTier2Suppliers, setSelectedTier2Suppliers] = useState([]);
  const [selectedTier3Suppliers, setSelectedTier3Suppliers] = useState([]);
  const [allTier2Supplies, setAllTier2Supplies] = useState([]);
  const [allTier3Supplies, setAllTier3Supplies] = useState([]);
  const [showTier2Modal, setShowTier2Modal] = useState(false);
  const [showTier3Modal, setShowTier3Modal] = useState(false);
  const [editingTier2, setEditingTier2] = useState(null);
  const [editingTier3, setEditingTier3] = useState(null);
  const [newChainSupply, setNewChainSupply] = useState({
    name: "",
    contract_number: "",
    address: "",
  });

  const [files, setFiles] = useState({
    card_image: null,
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
    trade_license_file: null,
    factory_license_file: null,
    fire_license_file: null,
    membership_file: null,
    group_insurance_file: null,
    boiler_license_file: null,
    berc_license_file: null,
    drinking_water_license_file: null,
    environmental_compliance_certificate: null,
    environmental_audit_report: null,
    compliance_certificate: null,
    grievance_policy_document: null,
    emergency_evacuation_plan: null,
    safety_protocols_document: null,
    health_safety_policy: null,
    risk_assessment_report: null,
    safety_audit_report: null,
    fire_training_certificate: null,
    fire_drill_record: null,
    fire_safety_audit_report: null,
    initial_audit_report: null,
    initial_fire_audit_report: null,
    initial_electrical_audit_report: null,
    rsc_certificate: null,
    structural_safety_report: null,
    electrical_safety_report: null,
    fire_safety_report: null,
    pc_election_document: null,
    pc_meeting_minutes: null,
    safety_committee_formation_document: null,
    safety_committee_meeting_minutes: null,
    osh_file: null,
    image: null,
    fire_image: null,
  });

  const multipleFilesRef = useRef({
    additional_document_1: [],
    additional_document_2: [],
    additional_document_3: [],
    additional_document_4: [],
  });

  const existingMultipleFilesRef = useRef({
    additional_document_1: [],
    additional_document_2: [],
    additional_document_3: [],
    additional_document_4: [],
  });

  const [multiFileTrigger, setMultiFileTrigger] = useState(false);

  const [deletedFiles, setDeletedFiles] = useState({});
  const [deletedBuildingImages, setDeletedBuildingImages] = useState([]);
  const [deletedFireImages, setDeletedFireImages] = useState([]);
  const [buildingImages, setBuildingImages] = useState([]);
  const [buildingImagePreviews, setBuildingImagePreviews] = useState([]);
  const [existingBuildingImages, setExistingBuildingImages] = useState([]);
  const [fireImages, setFireImages] = useState([]);
  const [fireImagePreviews, setFireImagePreviews] = useState([]);
  const [existingFireImages, setExistingFireImages] = useState([]);
  const [existingFiles, setExistingFiles] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [touchedFields, setTouchedFields] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  const tabs = [
    { id: "basic", label: "General Info", icon: "🏢" },
    { id: "supplyChain", label: "Supply Chain", icon: "🔗" },
    { id: "building", label: "Building & Manpower", icon: "🏭" },
    { id: "production", label: "Production", icon: "⚙️" },
    { id: "certifications", label: "Certifications", icon: "📜" },
    { id: "licenses", label: "Licenses", icon: "📋" },
    { id: "safety", label: "Fire Safety", icon: "🚨" },
    { id: "pcSafety", label: "PC & Safety Committee", icon: "👥" },
    { id: "osh", label: "OHS Committee", icon: "🛡️" },
    { id: "environment", label: "Environment", icon: "🌱" },
    { id: "rsc", label: "RSC Audit", icon: "🔍" },
    { id: "csr", label: "CSR & Compliance", icon: "🤝" },
    { id: "compliance", label: "Factory Evaluation", icon: "✅" },
    { id: "documents", label: "Documents", icon: "📎" },
  ];

  const dateFieldsWithValidity = [
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
    "iso_45001_validity",
    "trade_license_validity",
    "factory_license_validity",
    "fire_license_validity",
    "membership_validity",
    "group_insurance_validity",
    "boiler_license_validity",
    "berc_license_validity",
    "drinking_water_license_validity",
  ];

  useEffect(() => {
    const updateDaysRemainingAndStatus = () => {
      const updates = {};

      dateFieldsWithValidity.forEach((dateField) => {
        const validityDate = formData[dateField];
        if (validityDate) {
          let daysRemainingField = dateField.replace(
            "_validity",
            "_validity_days_remaining"
          );
          let statusField = dateField.replace("_validity", "_status");

          if (dateField === "trade_license_validity") {
            daysRemainingField = "trade_license_days_remaining";
            statusField = "trade_license_status";
          } else if (dateField === "factory_license_validity") {
            daysRemainingField = "factory_license_days_remaining";
            statusField = "factory_license_status";
          } else if (dateField === "fire_license_validity") {
            daysRemainingField = "fire_license_days_remaining";
            statusField = "fire_license_status";
          } else if (dateField === "membership_validity") {
            daysRemainingField = "membership_days_remaining";
            statusField = "membership_status";
          } else if (dateField === "group_insurance_validity") {
            daysRemainingField = "group_insurance_days_remaining";
            statusField = "group_insurance_status";
          } else if (dateField === "boiler_license_validity") {
            daysRemainingField = "boiler_license_days_remaining";
            statusField = "boiler_license_status";
          } else if (dateField === "berc_license_validity") {
            daysRemainingField = "berc_days_remaining";
            statusField = "berc_status";
          } else if (dateField === "drinking_water_license_validity") {
            daysRemainingField = "drinking_water_license_days_remaining";
            statusField = "drinking_water_license_status";
          }

          const daysRemaining = calculateDaysRemaining(validityDate);
          updates[daysRemainingField] = daysRemaining;

          const status = calculateStatusFromDaysRemaining(daysRemaining);
          updates[statusField] = status;
        } else {
          let daysRemainingField = dateField.replace(
            "_validity",
            "_validity_days_remaining"
          );

          if (dateField === "trade_license_validity") {
            daysRemainingField = "trade_license_days_remaining";
          } else if (dateField === "factory_license_validity") {
            daysRemainingField = "factory_license_days_remaining";
          } else if (dateField === "fire_license_validity") {
            daysRemainingField = "fire_license_days_remaining";
          } else if (dateField === "membership_validity") {
            daysRemainingField = "membership_days_remaining";
          } else if (dateField === "group_insurance_validity") {
            daysRemainingField = "group_insurance_days_remaining";
          } else if (dateField === "boiler_license_validity") {
            daysRemainingField = "boiler_license_days_remaining";
          } else if (dateField === "berc_license_validity") {
            daysRemainingField = "berc_days_remaining";
          } else if (dateField === "drinking_water_license_validity") {
            daysRemainingField = "drinking_water_license_days_remaining";
          }

          updates[daysRemainingField] = "";
        }
      });

      if (Object.keys(updates).length > 0) {
        setFormData((prev) => ({ ...prev, ...updates }));
      }
    };

    updateDaysRemainingAndStatus();
  }, [
    formData.bsci_validity,
    formData.sedex_validity,
    formData.wrap_validity,
    formData.security_audit_validity,
    formData.oeko_tex_validity,
    formData.gots_validity,
    formData.ocs_validity,
    formData.grs_validity,
    formData.rcs_validity,
    formData.iso_9001_validity,
    formData.iso_14001_validity,
    formData.iso_45001_validity,
    formData.trade_license_validity,
    formData.factory_license_validity,
    formData.fire_license_validity,
    formData.membership_validity,
    formData.group_insurance_validity,
    formData.boiler_license_validity,
    formData.berc_license_validity,
    formData.drinking_water_license_validity,
  ]);

  const handleRemoveFile = (fieldName) => {
    if (existingFiles[fieldName]) {
      setDeletedFiles((prev) => ({ ...prev, [fieldName]: true }));
    }
    setFiles((prev) => ({ ...prev, [fieldName]: null }));
    setExistingFiles((prev) => ({ ...prev, [fieldName]: null }));
    const fileInput = document.getElementById(`file-${fieldName}`);
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleRemoveBuildingImage = (index) => {
    setBuildingImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(buildingImagePreviews[index]);
    setBuildingImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveFireImage = (index) => {
    setFireImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(fireImagePreviews[index]);
    setFireImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllBuildingImages = () => {
    if (buildingImagePreviews.length === 0) return;
    if (
      window.confirm(`Clear all ${buildingImagePreviews.length} new images?`)
    ) {
      buildingImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      setBuildingImages([]);
      setBuildingImagePreviews([]);
    }
  };

  const handleClearAllFireImages = () => {
    if (fireImagePreviews.length === 0) return;
    if (window.confirm(`Clear all ${fireImagePreviews.length} new images?`)) {
      fireImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      setFireImages([]);
      setFireImagePreviews([]);
    }
  };

  const removeExistingBuildingImage = (imageUrl) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      const imagePath = imageUrl.replace(
        "http://119.148.51.38:8000/media/",
        ""
      );
      setDeletedBuildingImages((prev) => [...prev, imagePath]);
      setExistingBuildingImages((prev) =>
        prev.filter((url) => url !== imageUrl)
      );
    }
  };

  const removeExistingFireImage = (imageUrl) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      const imagePath = imageUrl.replace(
        "http://119.148.51.38:8000/media/",
        ""
      );
      setDeletedFireImages((prev) => [...prev, imagePath]);
      setExistingFireImages((prev) => prev.filter((url) => url !== imageUrl));
    }
  };

  const handleMultiFileChange = (fieldName) => (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const existing = multipleFilesRef.current[fieldName] || [];
    const updated = [...existing, ...files];
    multipleFilesRef.current[fieldName] = updated;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: updated.map((f) => f.name),
    }));

    setMultiFileTrigger((prev) => !prev);
    e.target.value = "";
  };

  const removeMultiFile = (fieldName, index) => {
    const files = multipleFilesRef.current[fieldName] || [];
    const updated = files.filter((_, i) => i !== index);
    multipleFilesRef.current[fieldName] = updated;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: updated.map((f) => f.name),
    }));
    setMultiFileTrigger((prev) => !prev);
  };

  const clearMultiFiles = (fieldName, label) => {
    const files = multipleFilesRef.current[fieldName] || [];
    if (files.length === 0) return;
    if (!confirm(`Remove all new files from ${label}?`)) return;
    multipleFilesRef.current[fieldName] = [];
    setFormData((prev) => ({
      ...prev,
      [fieldName]: [],
    }));
    setMultiFileTrigger((prev) => !prev);
  };

  const removeExistingMultiFile = (fieldName, filePath, label) => {
    if (!confirm(`Remove "${filePath.split('/').pop()}" from ${label}?`)) return;

    const deletedKey = `deleted_${fieldName}`;
    
    setDeletedFiles((prev) => {
      const current = prev[deletedKey] || [];
      if (current.includes(filePath)) return prev;
      return { ...prev, [deletedKey]: [...current, filePath] };
    });

    const existing = existingMultipleFilesRef.current[fieldName] || [];
    existingMultipleFilesRef.current[fieldName] = existing.filter(
      (path) => path !== filePath
    );

    setFormData((prev) => ({
      ...prev,
      [fieldName]: existingMultipleFilesRef.current[fieldName].map((p) => p.split('/').pop()),
    }));

    setMultiFileTrigger((prev) => !prev);
  };

  const fetchAllChainSupplies = async () => {
    try {
      const tier2Res = await getChainSupplies();
      setAllTier2Supplies(tier2Res.data.results || tier2Res.data || []);
      const tier3Res = await getChainSupplies1();
      setAllTier3Supplies(tier3Res.data.results || tier3Res.data || []);
    } catch (err) {
      console.error("Failed to fetch chain supplies:", err);
    }
  };

  const handleAddTier2Supplier = (supplier) => {
    if (!selectedTier2Suppliers.find((s) => s.id === supplier.id)) {
      setSelectedTier2Suppliers((prev) => [...prev, supplier]);
      setFormData((prev) => ({
        ...prev,
        tier2_suppliers: [...prev.tier2_suppliers, supplier.id],
      }));
    }
    setShowTier2Modal(false);
  };

  const handleAddTier3Supplier = (supplier) => {
    if (!selectedTier3Suppliers.find((s) => s.id === supplier.id)) {
      setSelectedTier3Suppliers((prev) => [...prev, supplier]);
      setFormData((prev) => ({
        ...prev,
        tier3_suppliers: [...prev.tier3_suppliers, supplier.id],
      }));
    }
    setShowTier3Modal(false);
  };

  const handleRemoveTier2Supplier = (supplierId) => {
    setSelectedTier2Suppliers((prev) =>
      prev.filter((s) => s.id !== supplierId)
    );
    setFormData((prev) => ({
      ...prev,
      tier2_suppliers: prev.tier2_suppliers.filter((id) => id !== supplierId),
    }));
  };

  const handleRemoveTier3Supplier = (supplierId) => {
    setSelectedTier3Suppliers((prev) =>
      prev.filter((s) => s.id !== supplierId)
    );
    setFormData((prev) => ({
      ...prev,
      tier3_suppliers: prev.tier3_suppliers.filter((id) => id !== supplierId),
    }));
  };

  const handleEditTier2 = (supplier) => {
    setEditingTier2(supplier);
    setNewChainSupply({
      name: supplier.name,
      contract_number: supplier.contract_number || "",
      address: supplier.address || "",
    });
    setShowTier2Modal(true);
  };

  const handleEditTier3 = (supplier) => {
    setEditingTier3(supplier);
    setNewChainSupply({
      name: supplier.name,
      contract_number: supplier.contract_number || "",
      address: supplier.address || "",
    });
    setShowTier3Modal(true);
  };

  const handleDeleteTier2 = async (supplierId, supplierName) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${supplierName}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteChainSupply(supplierId);
        handleRemoveTier2Supplier(supplierId);
        const tier2Res = await getChainSupplies();
        setAllTier2Supplies(tier2Res.data.results || tier2Res.data || []);
        alert("Supplier deleted successfully!");
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete supplier. Please check console.");
      }
    }
  };

  const handleDeleteTier3 = async (supplierId, supplierName) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${supplierName}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteChainSupply1(supplierId);
        handleRemoveTier3Supplier(supplierId);
        const tier3Res = await getChainSupplies1();
        setAllTier3Supplies(tier3Res.data.results || tier3Res.data || []);
        alert("Supplier deleted successfully!");
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete supplier. Please check console.");
      }
    }
  };

  const handleNewChainInputChange = (e) => {
    const { name, value } = e.target;
    setNewChainSupply((prev) => ({ ...prev, [name]: value }));
  };

  const createNewChainSupplyHandler = async (isTier2) => {
    if (!newChainSupply.name.trim()) {
      alert("Name is required!");
      return;
    }
    try {
      let response;
      if (isTier2) {
        if (editingTier2) {
          response = await updateChainSupply(editingTier2.id, newChainSupply);
          setSelectedTier2Suppliers((prev) =>
            prev.map((s) =>
              s.id === editingTier2.id ? { ...s, ...newChainSupply } : s
            )
          );
        } else {
          response = await createChainSupply(newChainSupply);
          const newSupplier = response.data;
          setSelectedTier2Suppliers((prev) => [...prev, newSupplier]);
          setFormData((prev) => ({
            ...prev,
            tier2_suppliers: [...prev.tier2_suppliers, newSupplier.id],
          }));
        }
        const tier2Res = await getChainSupplies();
        setAllTier2Supplies(tier2Res.data.results || tier2Res.data || []);
      } else {
        if (editingTier3) {
          response = await updateChainSupply1(editingTier3.id, newChainSupply);
          setSelectedTier3Suppliers((prev) =>
            prev.map((s) =>
              s.id === editingTier3.id ? { ...s, ...newChainSupply } : s
            )
          );
        } else {
          response = await createChainSupply1(newChainSupply);
          const newSupplier = response.data;
          setSelectedTier3Suppliers((prev) => [...prev, newSupplier]);
          setFormData((prev) => ({
            ...prev,
            tier3_suppliers: [...prev.tier3_suppliers, newSupplier.id],
          }));
        }
        const tier3Res = await getChainSupplies1();
        setAllTier3Supplies(tier3Res.data.results || tier3Res.data || []);
      }
      setNewChainSupply({ name: "", contract_number: "", address: "" });
      setEditingTier2(null);
      setEditingTier3(null);
      setShowTier2Modal(false);
      setShowTier3Modal(false);
      alert(
        editingTier2 || editingTier3
          ? "Supplier updated successfully!"
          : `New ${isTier2 ? "Tier 2" : "Tier 3"} Chain Supply created and selected!`
      );
    } catch (err) {
      console.error("Operation failed:", err);
      alert("Failed to process supplier. Please check console.");
    }
  };

  const handleBuildingImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setBuildingImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setBuildingImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleFireImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setFireImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setFireImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const fetchSupplierData = async () => {
    setIsLoading(true);
    try {
      const response = await getSupplierById(id);
      const supplierData = response.data;
      const updatedFormData = { ...formData };

      console.log("📦 Supplier Data:", supplierData);

      Object.keys(supplierData).forEach((key) => {
        if (updatedFormData.hasOwnProperty(key)) {
          if (supplierData[key] === null || supplierData[key] === undefined) {
            updatedFormData[key] = "";
          } else {
            updatedFormData[key] = supplierData[key];
          }
        }
      });

      dateFieldsWithValidity.forEach((dateField) => {
        const validityDate = updatedFormData[dateField];
        if (validityDate) {
          let daysRemainingField = dateField.replace(
            "_validity",
            "_validity_days_remaining"
          );

          if (dateField === "trade_license_validity") {
            daysRemainingField = "trade_license_days_remaining";
          } else if (dateField === "factory_license_validity") {
            daysRemainingField = "factory_license_days_remaining";
          } else if (dateField === "fire_license_validity") {
            daysRemainingField = "fire_license_days_remaining";
          } else if (dateField === "membership_validity") {
            daysRemainingField = "membership_days_remaining";
          } else if (dateField === "group_insurance_validity") {
            daysRemainingField = "group_insurance_days_remaining";
          } else if (dateField === "boiler_license_validity") {
            daysRemainingField = "boiler_license_days_remaining";
          } else if (dateField === "berc_license_validity") {
            daysRemainingField = "berc_days_remaining";
          } else if (dateField === "drinking_water_license_validity") {
            daysRemainingField = "drinking_water_license_days_remaining";
          }

          updatedFormData[daysRemainingField] =
            calculateDaysRemaining(validityDate);
        }
      });

      if (
        supplierData.tier2_suppliers_detail &&
        Array.isArray(supplierData.tier2_suppliers_detail)
      ) {
        const tier2Details = supplierData.tier2_suppliers_detail;
        updatedFormData.tier2_suppliers = tier2Details.map((s) => s.id);
        setSelectedTier2Suppliers(tier2Details);
      } else {
        setSelectedTier2Suppliers([]);
        updatedFormData.tier2_suppliers = [];
      }

      if (
        supplierData.tier3_suppliers_detail &&
        Array.isArray(supplierData.tier3_suppliers_detail)
      ) {
        const tier3Details = supplierData.tier3_suppliers_detail;
        updatedFormData.tier3_suppliers = tier3Details.map((s) => s.id);
        setSelectedTier3Suppliers(tier3Details);
      } else {
        setSelectedTier3Suppliers([]);
        updatedFormData.tier3_suppliers = [];
      }

      for (let i = 1; i <= 4; i++) {
        const fieldName = `additional_document_${i}`;
        const urlsField = `${fieldName}_urls`;
        
        let fileUrls = [];
        
        if (supplierData[urlsField] && Array.isArray(supplierData[urlsField])) {
          fileUrls = supplierData[urlsField];
        } else if (supplierData[fieldName]) {
          if (Array.isArray(supplierData[fieldName])) {
            fileUrls = supplierData[fieldName];
          } else if (typeof supplierData[fieldName] === 'string') {
            try {
              const parsed = JSON.parse(supplierData[fieldName]);
              if (Array.isArray(parsed)) {
                fileUrls = parsed;
              } else {
                fileUrls = [supplierData[fieldName]];
              }
            } catch {
              fileUrls = [supplierData[fieldName]];
            }
          }
        }
        
        if (fileUrls.length > 0) {
          const cleanUrls = fileUrls.map(url => {
            let cleanPath = extractCleanPath(url);
            if (!cleanPath || cleanPath.includes('http')) {
              const match = String(url).match(/(supplier_documents|building_images|fire_safety_images)\/.*/);
              if (match) {
                cleanPath = match[0];
              } else {
                const parts = String(url).split('/media/');
                if (parts.length > 1) {
                  cleanPath = parts[parts.length - 1];
                }
              }
            }
            return cleanPath;
          }).filter(path => path && !path.includes('http') && !path.includes('119.148.51.38'));
          
          existingMultipleFilesRef.current[fieldName] = cleanUrls;
          updatedFormData[fieldName] = cleanUrls.map(u => u.split('/').pop());
        } else {
          existingMultipleFilesRef.current[fieldName] = [];
          updatedFormData[fieldName] = [];
        }
      }

      setFormData(updatedFormData);

      const existingFilesData = {};
      const fileFields = [
        "card_image",
        "bsci_certificate",
        "sedex_certificate",
        "wrap_certificate",
        "security_audit_certificate",
        "oeko_tex_certificate",
        "gots_certificate",
        "ocs_certificate",
        "grs_certificate",
        "rcs_certificate",
        "iso_9001_certificate",
        "iso_14001_certificate",
        "other_certificate_1",
        "other_certificate_2",
        "trade_license_file",
        "factory_license_file",
        "fire_license_file",
        "membership_file",
        "group_insurance_file",
        "boiler_license_file",
        "berc_license_file",
        "drinking_water_license_file",
        "fire_training_certificate",
        "fire_drill_record",
        "fire_safety_audit_report",
        "initial_audit_report",
        "initial_fire_audit_report",
        "initial_electrical_audit_report",
        "structural_safety_report",
        "electrical_safety_report",
        "fire_safety_report",
        "rsc_certificate",
        "pc_election_document",
        "pc_meeting_minutes",
        "safety_committee_formation_document",
        "safety_committee_meeting_minutes",
        "environmental_compliance_certificate",
        "environmental_audit_report",
        "compliance_certificate",
        "grievance_policy_document",
        "emergency_evacuation_plan",
        "safety_protocols_document",
        "health_safety_policy",
        "risk_assessment_report",
        "safety_audit_report",
        "osh_file",
        "image",
        "fire_image",
      ];

      fileFields.forEach((field) => {
        if (supplierData[field]) {
          existingFilesData[field] = supplierData[field];
        }
      });
      setExistingFiles(existingFilesData);

      let buildingImagesData = supplierData.building_images_json;
      let fireImagesData = supplierData.fire_images_json;

      if (typeof buildingImagesData === "string") {
        try {
          buildingImagesData = JSON.parse(buildingImagesData);
        } catch (e) {}
      }
      if (typeof fireImagesData === "string") {
        try {
          fireImagesData = JSON.parse(fireImagesData);
        } catch (e) {}
      }

      if (
        buildingImagesData &&
        Array.isArray(buildingImagesData) &&
        buildingImagesData.length > 0
      ) {
        setExistingBuildingImages(
          buildingImagesData.map((img) => getCorrectFileUrl(img))
        );
      } else {
        setExistingBuildingImages([]);
      }

      if (
        fireImagesData &&
        Array.isArray(fireImagesData) &&
        fireImagesData.length > 0
      ) {
        setExistingFireImages(
          fireImagesData.map((img) => getCorrectFileUrl(img))
        );
      } else {
        setExistingFireImages([]);
      }

      setDeletedFiles({});
      setDeletedBuildingImages([]);
      setDeletedFireImages([]);
    } catch (err) {
      console.error("Error fetching supplier:", err);
      setError("Failed to load supplier data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
    fetchAllChainSupplies();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;

    if (type === "checkbox") {
      processedValue = checked;
    } else if (value === "") {
      processedValue = null;
    } else {
      processedValue = value;
    }

    setFormData((prev) => {
      const newData = { ...prev, [name]: processedValue };

      if (dateFieldsWithValidity.includes(name)) {
        let daysRemainingField = name.replace(
          "_validity",
          "_validity_days_remaining"
        );
        let statusField = name.replace("_validity", "_status");

        if (name === "trade_license_validity") {
          daysRemainingField = "trade_license_days_remaining";
          statusField = "trade_license_status";
        } else if (name === "factory_license_validity") {
          daysRemainingField = "factory_license_days_remaining";
          statusField = "factory_license_status";
        } else if (name === "fire_license_validity") {
          daysRemainingField = "fire_license_days_remaining";
          statusField = "fire_license_status";
        } else if (name === "membership_validity") {
          daysRemainingField = "membership_days_remaining";
          statusField = "membership_status";
        } else if (name === "group_insurance_validity") {
          daysRemainingField = "group_insurance_days_remaining";
          statusField = "group_insurance_status";
        } else if (name === "boiler_license_validity") {
          daysRemainingField = "boiler_license_days_remaining";
          statusField = "boiler_license_status";
        } else if (name === "berc_license_validity") {
          daysRemainingField = "berc_days_remaining";
          statusField = "berc_status";
        } else if (name === "drinking_water_license_validity") {
          daysRemainingField = "drinking_water_license_days_remaining";
          statusField = "drinking_water_license_status";
        }

        if (processedValue) {
          const daysRemaining = calculateDaysRemaining(processedValue);
          newData[daysRemainingField] = daysRemaining;
          if (statusField && !statusField.includes("_status")) {
            newData[statusField] =
              calculateStatusFromDaysRemaining(daysRemaining);
          }
        } else {
          newData[daysRemainingField] = "";
          if (statusField && !statusField.includes("_status")) {
            newData[statusField] = "";
          }
        }
      }

      const allDateFields = [
        "last_fire_training_by_fscd",
        "fscd_next_fire_training_date",
        "last_fire_drill_record_by_fscd",
        "fscd_next_drill_date",
        "water_test_report_doe",
        "zdhc_water_test_report",
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
        "last_grievance_resolution_date",
        "last_safety_audit_date",
        "first_visit_date",
        "bsci_last_audit_date",
        "sedex_last_audit_date",
        "wrap_last_audit_date",
        "security_audit_last_date",
      ];

      if (allDateFields.includes(name) && (!value || value === "")) {
        newData[name] = null;
      }
      return newData;
    });

    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    if (error) setError(null);
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    if (file) {
      if (existingFiles[name]) {
        setDeletedFiles((prev) => ({ ...prev, [name]: true }));
      }
      setFiles((prev) => ({ ...prev, [name]: file }));
      setExistingFiles((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
  };

  const handleViewFile = (e, url) => {
    e.preventDefault();
    e.stopPropagation();
    const correctUrl = getCorrectFileUrl(url);
    window.open(correctUrl, "_blank", "noopener,noreferrer");
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.supplier_name?.trim())
      errors.supplier_name = "Supplier name is required";
    if (!formData.email?.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Email is invalid";
    if (!formData.phone?.trim()) errors.phone = "Phone is required";
    if (!formData.location?.trim()) errors.location = "Location is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const prepareFormData = () => {
    const formDataToSend = new FormData();

    console.log("📦 Preparing form data...");
    console.log("🗑️ Deleted files state:", deletedFiles);

    if (Object.keys(deletedFiles).length > 0) {
      const singleFileDeletions = {};
      const multipleFileDeletions = {};
      
      Object.keys(deletedFiles).forEach(key => {
        if (key.startsWith('deleted_additional_document_')) {
          multipleFileDeletions[key] = deletedFiles[key];
        } else {
          singleFileDeletions[key] = deletedFiles[key];
        }
      });
      
      if (Object.keys(singleFileDeletions).length > 0) {
        formDataToSend.append(
          "deleted_files",
          JSON.stringify(Object.keys(singleFileDeletions))
        );
        console.log("🗑️ Single file deletions:", Object.keys(singleFileDeletions));
      }
      
      Object.keys(multipleFileDeletions).forEach(key => {
        const paths = multipleFileDeletions[key];
        if (Array.isArray(paths) && paths.length > 0) {
          formDataToSend.append(key, JSON.stringify(paths));
          console.log(`🗑️ Sending ${key}:`, paths);
        }
      });
    }

    const FIELDS_TO_EXCLUDE = [
      "created_at",
      "updated_at",
      "trade_license_status",
      "factory_license_status",
      "fire_license_status",
      "membership_status",
      "group_insurance_status",
      "berc_status",
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
      "iso_45001_validity_days_remaining",
      "trade_license_days_remaining",
      "factory_license_days_remaining",
      "fire_license_days_remaining",
      "membership_days_remaining",
      "group_insurance_days_remaining",
      "boiler_license_days_remaining",
      "berc_days_remaining",
      "drinking_water_license_days_remaining",
      "bsci_status",
      "sedex_status",
      "wrap_status",
      "security_audit_status",
      "oeko_tex_status",
      "gots_status",
      "ocs_status",
      "grs_status",
      "rcs_status",
      "iso_9001_status",
      "iso_14001_status",
    ];

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
      "iso_45001_validity",
      "trade_license_validity",
      "factory_license_validity",
      "fire_license_validity",
      "membership_validity",
      "group_insurance_validity",
      "boiler_license_validity",
      "berc_license_validity",
      "drinking_water_license_validity",
      "last_fire_training_by_fscd",
      "fscd_next_fire_training_date",
      "last_fire_drill_record_by_fscd",
      "fscd_next_drill_date",
      "water_test_report_doe",
      "zdhc_water_test_report",
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
      "last_grievance_resolution_date",
      "last_safety_audit_date",
      "first_visit_date",
    ];

    const singleFileFields = [
      "card_image",
      "bsci_certificate",
      "sedex_certificate",
      "wrap_certificate",
      "security_audit_certificate",
      "oeko_tex_certificate",
      "gots_certificate",
      "ocs_certificate",
      "grs_certificate",
      "rcs_certificate",
      "iso_9001_certificate",
      "iso_14001_certificate",
      "other_certificate_1",
      "other_certificate_2",
      "trade_license_file",
      "factory_license_file",
      "fire_license_file",
      "membership_file",
      "group_insurance_file",
      "boiler_license_file",
      "berc_license_file",
      "drinking_water_license_file",
      "fire_training_certificate",
      "fire_drill_record",
      "fire_safety_audit_report",
      "initial_audit_report",
      "initial_fire_audit_report",
      "initial_electrical_audit_report",
      "structural_safety_report",
      "electrical_safety_report",
      "fire_safety_report",
      "rsc_certificate",
      "pc_election_document",
      "pc_meeting_minutes",
      "safety_committee_formation_document",
      "safety_committee_meeting_minutes",
      "environmental_compliance_certificate",
      "environmental_audit_report",
      "compliance_certificate",
      "grievance_policy_document",
      "emergency_evacuation_plan",
      "safety_protocols_document",
      "health_safety_policy",
      "risk_assessment_report",
      "safety_audit_report",
      "osh_file",
      "image",
      "fire_image",
    ];

    const formatDateToYMD = (dateValue) => {
      if (!dateValue) return null;
      if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ) {
        return dateValue;
      }
      try {
        let date;
        if (typeof dateValue === "string" && dateValue.includes("/")) {
          const parts = dateValue.split("/");
          if (parts.length === 3) {
            date = new Date(parts[2], parts[0] - 1, parts[1]);
          } else {
            date = new Date(dateValue);
          }
        } else {
          date = new Date(dateValue);
        }
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }
      } catch (e) {
        console.error(`Error formatting date ${dateValue}:`, e);
      }
      return null;
    };

    for (const [key, value] of Object.entries(formData)) {
      if (FIELDS_TO_EXCLUDE.includes(key)) continue;
      if (singleFileFields.includes(key)) continue;
      if (key === "tier2_suppliers" || key === "tier3_suppliers") continue;
      if (key.startsWith("additional_document_") && 
          key !== "additional_document_1_name" && 
          key !== "additional_document_2_name" && 
          key !== "additional_document_3_name" && 
          key !== "additional_document_4_name") continue;

      if (dateFields.includes(key)) {
        if (!value || value === null || value === "" || value === undefined) {
          formDataToSend.append(key, "");
        } else {
          const formattedDate = formatDateToYMD(value);
          if (formattedDate) {
            formDataToSend.append(key, formattedDate);
          } else {
            formDataToSend.append(key, "");
          }
        }
      } else if (typeof value === "boolean") {
        formDataToSend.append(key, value.toString());
      } else if (typeof value === "number") {
        formDataToSend.append(key, String(value));
      } else if (typeof value === "string") {
        formDataToSend.append(key, value || "");
      } else if (value && typeof value === "object") {
        formDataToSend.append(key, JSON.stringify(value));
      } else if (value === null || value === undefined) {
        formDataToSend.append(key, "");
      }
    }

    formDataToSend.append(
      "tier2_suppliers",
      JSON.stringify(formData.tier2_suppliers || [])
    );
    formDataToSend.append(
      "tier3_suppliers",
      JSON.stringify(formData.tier3_suppliers || [])
    );

    buildingImages.forEach((image) =>
      formDataToSend.append("building_images", image)
    );
    fireImages.forEach((image) => formDataToSend.append("fire_images", image));

    for (const [key, file] of Object.entries(files)) {
      if (file && file instanceof File && singleFileFields.includes(key)) {
        formDataToSend.append(key, file);
      }
    }

    for (let i = 1; i <= 4; i++) {
      const fieldName = `additional_document_${i}`;
      const deletedKey = `deleted_${fieldName}`;
      
      const deletedPaths = deletedFiles[deletedKey] || [];
      const existingPaths = existingMultipleFilesRef.current[fieldName] || [];
      
      const keptPaths = existingPaths.filter(path => !deletedPaths.includes(path));
      
      if (keptPaths.length > 0) {
        formDataToSend.append(`existing_${fieldName}`, JSON.stringify(keptPaths));
        console.log(`📁 Keeping ${keptPaths.length} files in ${fieldName}:`, keptPaths);
      }
    }

    for (let i = 1; i <= 4; i++) {
      const fieldName = `additional_document_${i}`;
      const fileFieldName = `${fieldName}_files`;
      const newFiles = multipleFilesRef.current[fieldName] || [];
      
      if (newFiles.length > 0) {
        newFiles.forEach((file) => {
          formDataToSend.append(fileFieldName, file);
        });
        console.log(`📤 Uploading ${newFiles.length} new files to ${fieldName}`);
      }
    }

    if (existingBuildingImages.length > 0) {
      const keepImages = existingBuildingImages.map((url) =>
        url.replace(/^.*?\/media\//, "")
      );
      formDataToSend.append(
        "existing_building_images",
        JSON.stringify(keepImages)
      );
    }
    
    if (existingFireImages.length > 0) {
      const keepImages = existingFireImages.map((url) =>
        url.replace(/^.*?\/media\//, "")
      );
      formDataToSend.append("existing_fire_images", JSON.stringify(keepImages));
    }

    const total =
      (parseInt(formData.manpower_workers_male) || 0) +
      (parseInt(formData.manpower_workers_female) || 0) +
      (parseInt(formData.other_gender_workers) || 0) +
      (parseInt(formData.disabled_workers) || 0) +
      (parseInt(formData.manpower_staff_male) || 0) +
      (parseInt(formData.manpower_staff_female) || 0);

    if (total > 0) {
      formDataToSend.append("total_manpower", total.toString());
    }

    console.log("📦 FormData entries:");
    for (let [key, value] of formDataToSend.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    return formDataToSend;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError("Please fill in all required fields");
      setActiveTab("basic");
      return;
    }
    setIsUpdating(true);
    setError(null);
    try {
      const formDataToSend = prepareFormData();
      await updateSupplier(id, formDataToSend);
      alert("Supplier updated successfully!");
      navigate(`/suppliersCSR/${id}`);
    } catch (err) {
      console.error("Update error:", err);
      let errorMessage = "Error updating supplier. Please try again.";
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === "object") {
          const errorMessages = [];
          for (const [field, errors] of Object.entries(errorData)) {
            if (Array.isArray(errors)) {
              errorMessages.push(`${field}: ${errors.join(", ")}`);
            } else if (typeof errors === "string") {
              errorMessages.push(`${field}: ${errors}`);
            }
          }
          errorMessage = errorMessages.join("\n");
        } else {
          errorMessage = String(errorData);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNext = () => {
    if (activeTab === "basic") {
      if (!formData.supplier_name || !formData.email || !formData.phone) {
        setError("Please fill in all required fields in General Information");
        return;
      }
    }
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
      window.scrollTo(0, 0);
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderInput = (
    label,
    name,
    type = "text",
    isRequired = false,
    rows = null,
    isReadOnly = false,
  ) => {
    let value = formData[name];
    if (value === null || value === undefined) value = "";

    const isError =
      (touchedFields[name] && isRequired && !value) || validationErrors[name];
    const errorMessage = validationErrors[name];
    const Component = rows ? "textarea" : "input";
    const isDaysRemaining =
      name.includes("_days_remaining") ||
      name.includes("_validity_days_remaining");
    const isStatusField = name.includes("_status");

    let displayValue = value;
    if (isStatusField && value) {
      displayValue = value.charAt(0).toUpperCase() + value.slice(1);
    }

    return (
      <div style={formGroupStyle}>
        <label style={labelStyle}>
          {label} {isRequired && <span style={{ color: colors.error }}>*</span>}
          {isDaysRemaining && (
            <span style={autoUpdateBadgeStyle} title="Auto-updates daily">
              🔄
            </span>
          )}
          {isStatusField && (
            <span
              style={autoUpdateBadgeStyle}
              title="Auto-calculated from days remaining"
            >
              ⚡
            </span>
          )}
        </label>
        <Component
          type={type}
          name={name}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            ...inputStyle,
            ...(isError ? inputErrorStyle : {}),
            ...(isUpdating || isLoading ? inputDisabledStyle : {}),
            ...(rows ? textareaStyle : {}),
            ...(isDaysRemaining || isStatusField
              ? daysRemainingFieldStyle
              : {}),
            ...(isReadOnly || isDaysRemaining || isStatusField
              ? readOnlyFieldStyle
              : {}),
          }}
          disabled={
            isUpdating ||
            isLoading ||
            isDaysRemaining ||
            isStatusField ||
            isReadOnly
          }
          placeholder={
            isDaysRemaining
              ? "Auto-calculated from validity date"
              : isStatusField
                ? "Auto-calculated from days remaining"
                : `Enter ${label.toLowerCase()}`
          }
          rows={rows}
          readOnly={isDaysRemaining || isStatusField || isReadOnly}
        />
        {errorMessage && <div style={fieldErrorStyle}>{errorMessage}</div>}
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

  const renderMultiFileUpload = (label, fieldName) => {
    const newFiles = multipleFilesRef.current[fieldName] || [];
    const existingFilesList = existingMultipleFilesRef.current[fieldName] || [];
    const deletedKey = `deleted_${fieldName}`;
    const deletedPaths = deletedFiles[deletedKey] || [];

    const visibleExistingFiles = existingFilesList.filter(
      path => !deletedPaths.includes(path)
    );

    const getFileName = (path) => {
      if (!path) return 'Unknown file';
      if (path.includes('/')) {
        return path.split('/').pop();
      }
      return path;
    };

    return (
      <div style={formGroupStyle}>
        <label style={labelStyle}>
          {label}
          <span style={{ fontSize: '0.7rem', color: colors.textMuted, marginLeft: '0.5rem' }}>
            (Multiple files)
          </span>
        </label>

        {visibleExistingFiles.length > 0 && (
          <div style={existingMultiFileListStyle}>
            <div style={fileListHeaderStyle}>
              <span>Existing Files ({visibleExistingFiles.length})</span>
            </div>
            <div style={fileListStyle}>
              {visibleExistingFiles.map((filePath, idx) => {
                const fileName = getFileName(filePath);
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                const fullUrl = getCorrectFileUrl(filePath);
                return (
                  <div key={`existing-${idx}`} style={fileListItemStyle}>
                    <span style={fileIconStyle}>
                      {isImage ? '🖼️' : '📄'}
                    </span>
                    <span style={fileListNameStyle}>{fileName}</span>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(fullUrl, "_blank", "noopener,noreferrer");
                      }}
                      style={viewLinkStyle}
                    >
                      View
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const currentDeleted = deletedFiles[deletedKey] || [];
                        const newDeleted = [...currentDeleted, filePath];
                        setDeletedFiles(prev => ({
                          ...prev,
                          [deletedKey]: newDeleted
                        }));
                        setMultiFileTrigger(prev => !prev);
                      }}
                      style={removeMultiFileButtonStyle}
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {deletedPaths.length > 0 && (
          <div style={deletedMultiFileListStyle}>
            <div style={fileListHeaderStyle}>
              <span>Marked for Deletion ({deletedPaths.length})</span>
            </div>
            <div style={fileListStyle}>
              {deletedPaths.map((filePath, idx) => {
                const fileName = getFileName(filePath);
                return (
                  <div key={`deleted-${idx}`} style={deletedFileListItemStyle}>
                    <span>🗑️</span>
                    <span style={fileListNameStyle}>{fileName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedDeleted = deletedPaths.filter(p => p !== filePath);
                        if (updatedDeleted.length === 0) {
                          const newDeleted = { ...deletedFiles };
                          delete newDeleted[deletedKey];
                          setDeletedFiles(newDeleted);
                        } else {
                          setDeletedFiles(prev => ({
                            ...prev,
                            [deletedKey]: updatedDeleted
                          }));
                        }
                        setMultiFileTrigger(prev => !prev);
                      }}
                      style={undoButtonStyle}
                    >
                      Undo
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={fileInputWrapperStyle}>
          <input
            type="file"
            name={fieldName}
            onChange={handleMultiFileChange(fieldName)}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            multiple
            style={fileInputStyle}
            disabled={isUpdating || isLoading}
            id={`file-${fieldName}`}
          />
          <label htmlFor={`file-${fieldName}`} style={fileInputLabelStyle}>
            {newFiles.length > 0 ? `${newFiles.length} new file(s) selected` : 'Choose multiple files'}
          </label>
        </div>

        {newFiles.length > 0 && (
          <div style={newMultiFileListStyle}>
            <div style={fileListHeaderStyle}>
              <span>New Files ({newFiles.length})</span>
              <button
                type="button"
                onClick={() => clearMultiFiles(fieldName, label)}
                style={clearAllButtonStyle}
              >
                Clear All
              </button>
            </div>
            <div style={fileListStyle}>
              {newFiles.map((file, idx) => {
                const isImage = file.type?.startsWith('image/');
                return (
                  <div key={`new-${idx}`} style={fileListItemStyle}>
                    <span style={fileIconStyle}>
                      {isImage ? '🖼️' : '📄'}
                    </span>
                    <span style={fileListNameStyle}>{file.name}</span>
                    <span style={fileListSizeStyle}>
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    {isImage && (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        style={miniThumbnailStyle}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMultiFile(fieldName, idx)}
                      style={removeMultiFileButtonStyle}
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFileInput = (label, name, accept = "*") => {
    const file = files[name];
    const existingFile = existingFiles[name];
    const displayUrl = existingFile ? getCorrectFileUrl(existingFile) : null;
    const isImage =
      accept.includes("image") ||
      name === "image" ||
      name === "fire_image" ||
      name === "card_image";
    const hasNewFile = !!file;
    const isMarkedForDeletion = deletedFiles[name];

    return (
      <div style={formGroupStyle}>
        <label style={labelStyle}>{label}</label>
        {displayUrl && !file && !isMarkedForDeletion && isImage && (
          <div style={existingImagePreviewStyle}>
            <img
              src={displayUrl}
              alt={`Existing ${label}`}
              style={existingImageStyle}
              onError={(e) => {
                e.target.src = getFallbackImageDataUrl();
              }}
            />
            <div style={existingImageActionsStyle}>
              <a
                href="#"
                onClick={(e) => handleViewFile(e, displayUrl)}
                style={viewLinkStyle}
              >
                View Full Size
              </a>
              <button
                type="button"
                onClick={() => handleRemoveFile(name)}
                style={removeFileButtonStyle}
              >
                Remove
              </button>
            </div>
          </div>
        )}
        {displayUrl && !file && !isMarkedForDeletion && !isImage && (
          <div style={existingFileStyle}>
            <span>📄</span>
            <span>Existing file: </span>
            <a
              href="#"
              onClick={(e) => handleViewFile(e, displayUrl)}
              style={existingFileLinkStyle}
            >
              View
            </a>
            <button
              type="button"
              onClick={() => handleRemoveFile(name)}
              style={removeFileButtonStyle}
            >
              Remove
            </button>
          </div>
        )}
        {isMarkedForDeletion && (
          <div style={deletedFileStyle}>
            <span>🗑️</span>
            <span>Marked for deletion</span>
            <button
              type="button"
              onClick={() => {
                setDeletedFiles((prev) => {
                  const newDeleted = { ...prev };
                  delete newDeleted[name];
                  return newDeleted;
                });
                setExistingFiles((prev) => ({ ...prev, [name]: displayUrl }));
              }}
              style={undoButtonStyle}
            >
              Undo
            </button>
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
            {hasNewFile
              ? file.name
              : displayUrl && !isMarkedForDeletion
                ? "Replace file"
                : "Choose file"}
          </label>
          {hasNewFile && (
            <button
              type="button"
              onClick={() => handleRemoveFile(name)}
              style={removeFileButtonStyle}
              title="Remove file"
            >
              ✕ Remove
            </button>
          )}
        </div>
        {hasNewFile && (
          <div style={filePreviewStyle}>
            {isImage ? (
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                style={newImagePreviewStyle}
              />
            ) : (
              <span>📄</span>
            )}
            <span>{file.name}</span>
            <span style={fileSizeStyle}>
              {(file.size / 1024).toFixed(2)} KB
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderMultipleImageUpload = (
    label,
    name,
    images,
    previews,
    onRemove,
    onChange,
    existingImages = [],
    onRemoveExisting,
  ) => (
    <div style={formGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={fileInputWrapperStyle}>
        <input
          type="file"
          name={name}
          onChange={onChange}
          accept="image/*"
          multiple
          style={fileInputStyle}
          disabled={isUpdating || isLoading}
          id={`file-${name}`}
        />
        <label htmlFor={`file-${name}`} style={fileInputLabelStyle}>
          Choose multiple images
        </label>
      </div>
      {existingImages.length > 0 && (
        <div>
          <div style={imageCountHeaderStyle}>
            <span>Existing Images ({existingImages.length}):</span>
          </div>
          <div style={imageGridStyle}>
            {existingImages.map((imageUrl, index) => (
              <div key={`existing-${index}`} style={imagePreviewContainerStyle}>
                <img
                  src={getCorrectFileUrl(imageUrl)}
                  alt={`Existing ${index + 1}`}
                  style={imagePreviewStyle}
                  onError={(e) => {
                    e.target.src = getFallbackImageDataUrl();
                  }}
                />
                <button
                  type="button"
                  onClick={() => onRemoveExisting(imageUrl)}
                  style={removeImageButtonStyle}
                  title="Remove image"
                >
                  ×
                </button>
                <div style={imageInfoStyle}>Existing Image</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {previews.length > 0 && (
        <div>
          <div style={imageCountHeaderStyle}>
            <span>New Images ({previews.length}):</span>
            <button
              type="button"
              onClick={
                name === "building_images"
                  ? handleClearAllBuildingImages
                  : handleClearAllFireImages
              }
              style={clearAllButtonStyle}
            >
              Clear All
            </button>
          </div>
          <div style={imageGridStyle}>
            {previews.map((preview, index) => (
              <div key={index} style={imagePreviewContainerStyle}>
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  style={imagePreviewStyle}
                />
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  style={removeImageButtonStyle}
                  title="Remove image"
                >
                  ×
                </button>
                <div style={imageInfoStyle}>
                  {images[index]?.name}
                  <span style={fileSizeStyle}>
                    {" "}
                    ({(images[index]?.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

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
            false,
            null,
            true,
          )}
          {renderInput("Status", `${prefix}_status`, "text", false, null, true)}
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
            false,
            null,
            true,
          )}
          {renderInput("Status", `${prefix}_status`, "text", false, null, true)}
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
          {renderInput(
            "Days Remaining",
            `${prefix}_days_remaining`,
            "number",
            false,
            null,
            true,
          )}
          {renderFileInput("File", `${prefix}_file`, ".pdf,.jpg,.png")}
        </div>
      </div>
    </div>
  );

  const renderAuditSection = (prefix, label) => (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <h4 style={cardTitleStyle}>{label}</h4>
      </div>
      <div style={cardBodyStyle}>
        <div style={formGridStyle}>
          {renderInput(
            "Initial Audit Date",
            `${prefix}_initial_audit_date`,
            "date",
          )}
        </div>
        <div style={formGridStyle}>
          {prefix === "structural" &&
            renderFileInput(
              "Initial Audit Report",
              "initial_audit_report",
              ".pdf",
            )}
          {prefix === "fire" &&
            renderFileInput(
              "Initial Fire Audit Report",
              "initial_fire_audit_report",
              ".pdf",
            )}
          {prefix === "electrical" &&
            renderFileInput(
              "Initial Electrical Audit Report",
              "initial_electrical_audit_report",
              ".pdf",
            )}
        </div>
        <div style={formGridStyle}>
          {renderInput(
            "Last Follow-up Audit Date",
            `${prefix}_last_follow_up_audit_date`,
            "date",
          )}
        </div>
        <div style={formGridStyle}>
          {prefix === "structural" &&
            renderFileInput(
              "Last Follow-up Report",
              "structural_safety_report",
              ".pdf",
            )}
          {prefix === "fire" &&
            renderFileInput(
              "Last Follow-up Report",
              "fire_safety_report",
              ".pdf",
            )}
          {prefix === "electrical" &&
            renderFileInput(
              "Last Follow-up Report",
              "electrical_safety_report",
              ".pdf",
            )}
        </div>
      </div>
    </div>
  );

  const renderSupplyChainTab = () => (
    <div style={formSectionStyle}>
      <div style={sectionHeaderStyle}>
        <h3 style={sectionTitleStyle}>
          <span style={sectionIconStyle}>🔗</span> Supply Chain Information
        </h3>
        <p style={sectionDescriptionStyle}>
          Manage Tier 2 and Tier 3 suppliers (add, edit, or delete)
        </p>
      </div>
      <div style={twoColumnGridStyle}>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h4 style={cardTitleStyle}>Tier 2 Factories</h4>
            <p style={cardSubtitleStyle}>
              Washing, printing, embroidery, accessories factories
            </p>
          </div>
          <div style={cardBodyStyle}>
            <div style={checkboxListContainerStyle}>
              <div style={checkboxListHeaderStyle}>
                <span>Associated Tier 2 Suppliers</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTier2(null);
                    setNewChainSupply({
                      name: "",
                      contract_number: "",
                      address: "",
                    });
                    setShowTier2Modal(true);
                  }}
                  style={createNewButtonStyle}
                >
                  + Add New
                </button>
              </div>
              <div style={checkboxListStyle}>
                {selectedTier2Suppliers.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No Tier 2 suppliers associated. Click "Add New" to add one.
                  </div>
                ) : (
                  selectedTier2Suppliers.map((cs) => (
                    <div key={cs.id} style={selectedItemStyle}>
                      <div style={selectedItemContentStyle}>
                        <div style={checkboxItemNameStyle}>
                          {cs.name || `Supplier ${cs.id}`}
                          {cs.contract_number && (
                            <span style={checkboxItemBadgeStyle}>
                              {cs.contract_number}
                            </span>
                          )}
                        </div>
                        {cs.address && (
                          <div style={checkboxItemAddressStyle}>
                            📍 {cs.address}
                          </div>
                        )}
                      </div>
                      <div style={selectedItemActionsStyle}>
                        <button
                          type="button"
                          onClick={() => handleEditTier2(cs)}
                          style={editSelectedButtonStyle}
                        >
                          ✎ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTier2(cs.id, cs.name)}
                          style={deleteSelectedButtonStyle}
                        >
                          🗑 Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTier2Supplier(cs.id)}
                          style={removeSelectedButtonStyle}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {selectedTier2Suppliers.length > 0 && (
                <div style={selectedCountStyle}>
                  ✓ {selectedTier2Suppliers.length} supplier(s) associated
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h4 style={cardTitleStyle}>Tier 3 Factories</h4>
            <p style={cardSubtitleStyle}>
              Fabric / Yarn suppliers (local & international)
            </p>
          </div>
          <div style={cardBodyStyle}>
            <div style={checkboxListContainerStyle}>
              <div style={checkboxListHeaderStyle}>
                <span>Associated Tier 3 Suppliers</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTier3(null);
                    setNewChainSupply({
                      name: "",
                      contract_number: "",
                      address: "",
                    });
                    setShowTier3Modal(true);
                  }}
                  style={createNewButtonStyle}
                >
                  + Add New
                </button>
              </div>
              <div style={checkboxListStyle}>
                {selectedTier3Suppliers.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No Tier 3 suppliers associated. Click "Add New" to add one.
                  </div>
                ) : (
                  selectedTier3Suppliers.map((cs) => (
                    <div key={cs.id} style={selectedItemStyle}>
                      <div style={selectedItemContentStyle}>
                        <div style={checkboxItemNameStyle}>
                          {cs.name || `Supplier ${cs.id}`}
                          {cs.contract_number && (
                            <span style={checkboxItemBadgeStyle}>
                              {cs.contract_number}
                            </span>
                          )}
                        </div>
                        {cs.address && (
                          <div style={checkboxItemAddressStyle}>
                            📍 {cs.address}
                          </div>
                        )}
                      </div>
                      <div style={selectedItemActionsStyle}>
                        <button
                          type="button"
                          onClick={() => handleEditTier3(cs)}
                          style={editSelectedButtonStyle}
                        >
                          ✎ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTier3(cs.id, cs.name)}
                          style={deleteSelectedButtonStyle}
                        >
                          🗑 Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTier3Supplier(cs.id)}
                          style={removeSelectedButtonStyle}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {selectedTier3Suppliers.length > 0 && (
                <div style={selectedCountStyle}>
                  ✓ {selectedTier3Suppliers.length} supplier(s) associated
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {(showTier2Modal || showTier3Modal) && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={modalTitleStyle}>
              {editingTier2 || editingTier3 ? "Edit" : "Create New"}{" "}
              {showTier2Modal ? "Tier 2" : "Tier 3"} Supplier
            </h3>
            <div style={formGroupStyle}>
              <label style={labelStyle}>
                Name <span style={{ color: colors.error }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={newChainSupply.name}
                onChange={handleNewChainInputChange}
                style={inputStyle}
                placeholder="e.g. ABC Washing Ltd."
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Contact Number</label>
              <input
                type="text"
                name="contract_number"
                value={newChainSupply.contract_number}
                onChange={handleNewChainInputChange}
                style={inputStyle}
                placeholder="Optional"
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Address</label>
              <textarea
                name="address"
                value={newChainSupply.address}
                onChange={handleNewChainInputChange}
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                placeholder="Full address of the factory"
              />
            </div>
            <div style={modalActionsStyle}>
              <button
                type="button"
                onClick={() => {
                  setShowTier2Modal(false);
                  setShowTier3Modal(false);
                  setEditingTier2(null);
                  setEditingTier3(null);
                  setNewChainSupply({
                    name: "",
                    contract_number: "",
                    address: "",
                  });
                }}
                style={modalCancelButtonStyle}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => createNewChainSupplyHandler(showTier2Modal)}
                style={modalCreateButtonStyle}
                disabled={!newChainSupply.name.trim()}
              >
                {editingTier2 || editingTier3 ? "Update" : "Create & Add"}
              </button>
            </div>
          </div>
        </div>
      )}
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
                width: `${((tabs.findIndex((tab) => tab.id === activeTab) + 1) / tabs.length) * 100}%`,
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
            {/* BASIC TAB */}
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
                  {renderInput("Supplier ID", "supplier_id", "text")}
                  {renderInput(
                    "Head Office Address",
                    "location",
                    "text",
                    true,
                    3,
                  )}
                  {renderInput(
                    "Factory Location (City/Region)",
                    "location_factory",
                    "text",
                    false,
                    3,
                  )}
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
                  {renderInput("Email", "email", "email", true)}
                  {renderInput("Phone", "phone", "tel", true)}
                  {renderSelect(
                    "Weekly Holiday",
                    "weekly_holiday",
                    holidayOptions,
                  )}
                  {renderInput("Sister Concern", "sister_concern")}
                  {renderInput("BGMEA Number", "bgmea_number")}
                  {renderInput("BKMEA Number", "bkmea_number")}
                  {renderInput("RSC ID", "rsc")}
                  {renderFileInput("Visiting Card", "card_image", "image/*")}
                  <div style={fullWidthStyle}>
                    <div style={subSectionTitleStyle}>Bank Details</div>
                  </div>
                  {renderInput("Bank Name", "bank_name")}
                  {renderInput("Bank Account", "bank_account")}
                  {renderInput("Bank Branch", "bank_branch")}
                  {renderInput("Bank BIN", "bank_bin")}
                  {renderInput("Bank Swift Code", "bank_swift_code")}
                  {renderInput(
                    "Bank Branch Address",
                    "bank_branch_address",
                    "text",
                    false,
                    3,
                  )}
                </div>
              </div>
            )}

            {/* SUPPLY CHAIN TAB */}
            {activeTab === "supplyChain" && renderSupplyChainTab()}

            {/* BUILDING TAB */}
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
                  {renderFileInput("Main Building Image", "image", "image/*")}
                  <div style={fullWidthStyle}>
                    {renderMultipleImageUpload(
                      "Additional Building Images",
                      "building_images",
                      buildingImages,
                      buildingImagePreviews,
                      handleRemoveBuildingImage,
                      handleBuildingImagesChange,
                      existingBuildingImages,
                      removeExistingBuildingImage,
                    )}
                  </div>
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
                      "Workers - Other Gender",
                      "other_gender_workers",
                      "number",
                    )}
                    {renderInput(
                      "Workers - Disabled",
                      "disabled_workers",
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
                    {renderInput(
                      "Total Manpower",
                      "total_manpower",
                      "number",
                      false,
                      null,
                      true,
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCTION TAB */}
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
                  {renderInput("Order Status", "tad_group_order_status")}
                </div>
              </div>
            )}

            {/* CERTIFICATIONS TAB */}
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

            {/* LICENSES TAB */}
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
                          false,
                          null,
                          true,
                        )}
                        {renderFileInput(
                          "Boiler License File",
                          "boiler_license_file",
                          ".pdf,.jpg,.png",
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                      <h4 style={cardTitleStyle}>BERC License</h4>
                    </div>
                    <div style={cardBodyStyle}>
                      <div style={formGridStyle}>
                        {renderInput(
                          "Validity",
                          "berc_license_validity",
                          "date",
                        )}
                        {renderInput(
                          "Days Remaining",
                          "berc_days_remaining",
                          "number",
                          false,
                          null,
                          true,
                        )}
                        {renderFileInput(
                          "BERC License File",
                          "berc_license_file",
                          ".pdf,.jpg,.png",
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                      <h4 style={cardTitleStyle}>
                        Drinking Water Test License
                      </h4>
                    </div>
                    <div style={cardBodyStyle}>
                      <div style={formGridStyle}>
                        {renderInput(
                          "Validity",
                          "drinking_water_license_validity",
                          "date",
                        )}
                        {renderInput(
                          "Days Remaining",
                          "drinking_water_license_days_remaining",
                          "number",
                          false,
                          null,
                          true,
                        )}
                        {renderFileInput(
                          "License File",
                          "drinking_water_license_file",
                          ".pdf,.jpg,.png",
                        )}
                      </div>
                    </div>
                  </div>
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

            {/* FIRE SAFETY TAB */}
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
                  {renderInput("Fire Door Count", "fire_door", "number")}
                  {renderInput(
                    "Fire Safety Detection",
                    "fire_safety_detection",
                    "text",
                  )}
                  {renderInput(
                    "Fire Safety Protection",
                    "fire_safety_protection",
                    "text",
                  )}
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
                  {renderFileInput(
                    "Main Fire Safety Image",
                    "fire_image",
                    "image/*",
                  )}
                  <div style={fullWidthStyle}>
                    {renderMultipleImageUpload(
                      "Additional Fire Safety Images",
                      "fire_images",
                      fireImages,
                      fireImagePreviews,
                      handleRemoveFireImage,
                      handleFireImagesChange,
                      existingFireImages,
                      removeExistingFireImage,
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

            {/* PC & SAFETY COMMITTEE TAB */}
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

            {/* OHS COMMITTEE TAB */}
            {activeTab === "osh" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>🛡️</span> OHS Committee
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Occupational Safety and Health Committee information
                  </p>
                </div>
                <div style={cardsContainerStyle}>
                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                      <h4 style={cardTitleStyle}>OHS Committee Details</h4>
                    </div>
                    <div style={cardBodyStyle}>
                      <div style={checkboxGridStyle}>
                        {renderCheckbox(
                          "OHS Committee Formed",
                          "osh_committee_safety",
                          "Check if OHS committee has been formed",
                        )}
                        {renderCheckbox(
                          "OHS Safety Policy Available",
                          "osh_safety_policy",
                          "Check if OHS safety policy document is available",
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                      <h4 style={cardTitleStyle}>ISO 45001 Certification</h4>
                    </div>
                    <div style={cardBodyStyle}>
                      <div style={formGridStyle}>
                        {renderInput(
                          "ISO 45001 Validity",
                          "iso_45001_validity",
                          "date",
                        )}
                        {renderInput(
                          "Days Remaining",
                          "iso_45001_validity_days_remaining",
                          "number",
                          false,
                          null,
                          true,
                        )}
                        {renderFileInput(
                          "OHS Committee Document",
                          "osh_file",
                          ".pdf,.jpg,.png",
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ENVIRONMENT TAB */}
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
                  {renderInput("CPI2 Report", "co2_report", "text")}
                  {renderInput("Solar Energy", "solar_energy", "text")}
                  {renderInput("Green Energy", "green_energy", "text")}
                  <div style={fullWidthStyle}>
                    {renderCheckbox(
                      "ZDHC Enrollment Status",
                      "zdhc_enrollment_status",
                    )}
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

            {/* RSC AUDIT TAB */}
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
                  <div style={fullWidthStyle}>
                    <div style={checkboxGridStyle}>
                      {renderCheckbox("Escalation Status", "escalation_status")}
                      {renderCheckbox(
                        "No Color Certificate",
                        "no_color_certificate",
                      )}
                      {renderCheckbox(
                        "Recognition Letter",
                        "recognitoion_letter",
                      )}
                    </div>
                  </div>
                  {renderFileInput(
                    "RSC Certificate",
                    "rsc_certificate",
                    ".pdf,.jpg,.png",
                  )}
                </div>
                <div style={cardsContainerStyle}>
                  {renderAuditSection("structural", "Structural Safety")}
                  {renderAuditSection("fire", "Fire Safety")}
                  {renderAuditSection("electrical", "Electrical Safety")}
                </div>
              </div>
            )}

            {/* CSR & COMPLIANCE TAB */}
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
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>✅</span> Compliance & Wages
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Wage compliance and benefits information
                  </p>
                </div>
                <div style={checkboxGridStyle}>
                  {renderCheckbox("Minimum Wages Paid", "minimum_wages_paid")}
                  {renderCheckbox("Earn Leave Status", "earn_leave_status")}
                  {renderCheckbox("Service Benefit", "service_benefit")}
                  {renderCheckbox("Maternity Benefit", "maternity_benefit")}
                  {renderCheckbox("Yearly Increment", "yearly_increment")}
                  {renderCheckbox("Festival Bonus", "festival_bonus")}
                  {renderCheckbox("Salary Due Status", "salary_due_status")}
                </div>
                {formData.salary_due_status && (
                  <div style={formGridStyle}>
                    {renderInput(
                      "Due Salary Month",
                      "due_salary_month",
                      "text",
                    )}
                  </div>
                )}
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>⚖️</span> Grievance
                    Management
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Grievance mechanism and resolution
                  </p>
                </div>
                <div style={cardsContainerStyle}>
                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                      <h4 style={cardTitleStyle}>Grievance Details</h4>
                    </div>
                    <div style={cardBodyStyle}>
                      <div style={checkboxGridStyle}>
                        {renderCheckbox(
                          "Grievance Policy Developed",
                          "grievance_policy_developed",
                        )}
                        {renderCheckbox(
                          "Workers Aware of Grievance Procedure",
                          "grievance_workers_aware",
                        )}
                        {renderCheckbox(
                          "Grievance Committee Established",
                          "grievance_committee_established",
                        )}
                        {renderCheckbox(
                          "Complain Box Installed",
                          "grievance_complain_box_installed",
                        )}
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
                </div>
              </div>
            )}

            {/* FACTORY EVALUATION / COMPLIANCE TAB */}
            {activeTab === "compliance" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>✅</span> Zero Tolerance &
                    Compliance Checklist
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Critical compliance requirements and facility safety
                    checklist
                  </p>
                </div>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <h4 style={cardTitleStyle}>Zero Tolerance Policy</h4>
                  </div>
                  <div style={cardBodyStyle}>
                    {(() => {
                      const renderChecklistItem = (
                        label,
                        cbName,
                        findingsName,
                      ) => (
                        <div style={checklistItemStyle}>
                          <div style={checklistCheckboxStyle}>
                            {renderCheckbox(label, cbName)}
                          </div>
                          <div style={checklistFindingsStyle}>
                            {renderInput(
                              "Findings",
                              findingsName,
                              "text",
                              false,
                              2,
                            )}
                          </div>
                        </div>
                      );
                      return (
                        <>
                          {renderChecklistItem(
                            "Factory allows a full facility walkthrough",
                            "zero_tolerance_walkthrough_allowed",
                            "zero_tolerance_walkthrough_findings",
                          )}
                          {renderChecklistItem(
                            "No underage person(s) are working in the facility",
                            "zero_tolerance_no_underage_workers",
                            "zero_tolerance_no_underage_findings",
                          )}
                          {renderChecklistItem(
                            "No suspected young looking person(s) are working without authentic age verification",
                            "zero_tolerance_no_suspected_young_workers",
                            "zero_tolerance_no_suspected_young_findings",
                          )}
                          {renderChecklistItem(
                            "Minimum wage is guaranteed for all employees",
                            "zero_tolerance_minimum_wage_guaranteed",
                            "zero_tolerance_minimum_wage_findings",
                          )}
                          {renderChecklistItem(
                            "Presented records are authentic and not falsified",
                            "zero_tolerance_authentic_records",
                            "zero_tolerance_authentic_records_findings",
                          )}
                          {renderChecklistItem(
                            "Absence of Forced Labor is confirmed",
                            "zero_tolerance_no_forced_labor",
                            "zero_tolerance_no_forced_labor_findings",
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <h4 style={cardTitleStyle}>Fire Fighting Equipment</h4>
                  </div>
                  <div style={cardBodyStyle}>
                    {(() => {
                      const renderChecklistItem = (
                        label,
                        cbName,
                        findingsName,
                      ) => (
                        <div style={checklistItemStyle}>
                          <div style={checklistCheckboxStyle}>
                            {renderCheckbox(label, cbName)}
                          </div>
                          <div style={checklistFindingsStyle}>
                            {renderInput(
                              "Findings",
                              findingsName,
                              "text",
                              false,
                              2,
                            )}
                          </div>
                        </div>
                      );
                      return (
                        <>
                          {renderChecklistItem(
                            "Sufficient fire fighting equipment as per local law",
                            "fire_fighting_equipment_sufficient",
                            "fire_fighting_equipment_sufficient_findings",
                          )}
                          {renderChecklistItem(
                            "Sufficient trained fire fighters assigned",
                            "fire_fighting_trained_personnel",
                            "fire_fighting_trained_personnel_findings",
                          )}
                          {renderChecklistItem(
                            "Fire hose/stand pipe system with sufficient water pressure",
                            "fire_fighting_hose_system",
                            "fire_fighting_hose_system_findings",
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <h4 style={cardTitleStyle}>Fire Alarm System</h4>
                  </div>
                  <div style={cardBodyStyle}>
                    {(() => {
                      const renderChecklistItem = (
                        label,
                        cbName,
                        findingsName,
                      ) => (
                        <div style={checklistItemStyle}>
                          <div style={checklistCheckboxStyle}>
                            {renderCheckbox(label, cbName)}
                          </div>
                          <div style={checklistFindingsStyle}>
                            {renderInput(
                              "Findings",
                              findingsName,
                              "text",
                              false,
                              2,
                            )}
                          </div>
                        </div>
                      );
                      return (
                        <>
                          {renderChecklistItem(
                            "Fire alarm system present",
                            "fire_alarm_system_present",
                            "fire_alarm_system_present_findings",
                          )}
                          {renderChecklistItem(
                            "Fire alarm audible in all areas",
                            "fire_alarm_audible_all_areas",
                            "fire_alarm_audible_all_areas_findings",
                          )}
                          {renderChecklistItem(
                            "Visual fire alarm in noisy sections",
                            "fire_alarm_visual_noisy_areas",
                            "fire_alarm_visual_noisy_areas_findings",
                          )}
                          {renderChecklistItem(
                            "Fire alarm connected with instant power supply",
                            "fire_alarm_ips_backup",
                            "fire_alarm_ips_backup_findings",
                          )}
                          {renderChecklistItem(
                            "Sufficient smoke detectors with power backup",
                            "fire_alarm_smoke_detectors",
                            "fire_alarm_smoke_detectors_findings",
                          )}
                          {renderChecklistItem(
                            "Fire alarm switches installed and marked with instructions",
                            "fire_alarm_switches_marked",
                            "fire_alarm_switches_marked_findings",
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <h4 style={cardTitleStyle}>Emergency Lights</h4>
                  </div>
                  <div style={cardBodyStyle}>
                    {(() => {
                      const renderChecklistItem = (
                        label,
                        cbName,
                        findingsName,
                      ) => (
                        <div style={checklistItemStyle}>
                          <div style={checklistCheckboxStyle}>
                            {renderCheckbox(label, cbName)}
                          </div>
                          <div style={checklistFindingsStyle}>
                            {renderInput(
                              "Findings",
                              findingsName,
                              "text",
                              false,
                              2,
                            )}
                          </div>
                        </div>
                      );
                      return (
                        <>
                          {renderChecklistItem(
                            "Sufficient emergency lights in workplace and stairway",
                            "emergency_lights_installed",
                            "emergency_lights_installed_findings",
                          )}
                          {renderChecklistItem(
                            "Emergency lights connected with instant power supply",
                            "emergency_lights_ips_backup",
                            "emergency_lights_ips_backup_findings",
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <h4 style={cardTitleStyle}>Drinking Water</h4>
                  </div>
                  <div style={cardBodyStyle}>
                    {(() => {
                      const renderChecklistItem = (
                        label,
                        cbName,
                        findingsName,
                      ) => (
                        <div style={checklistItemStyle}>
                          <div style={checklistCheckboxStyle}>
                            {renderCheckbox(label, cbName)}
                          </div>
                          <div style={checklistFindingsStyle}>
                            {renderInput(
                              "Findings",
                              findingsName,
                              "text",
                              false,
                              2,
                            )}
                          </div>
                        </div>
                      );
                      return (
                        <>
                          {renderChecklistItem(
                            "Drinking water point sufficient and accessible",
                            "drinking_water_sufficient",
                            "drinking_water_sufficient_findings",
                          )}
                          {renderChecklistItem(
                            "Water test report valid",
                            "drinking_water_test_report_valid",
                            "drinking_water_test_report_valid_findings",
                          )}
                          {renderChecklistItem(
                            "Water parameters in acceptable limits",
                            "drinking_water_parameters_acceptable",
                            "drinking_water_parameters_acceptable_findings",
                          )}
                          <div style={subSectionIndentStyle}>
                            <h5 style={subSectionHeaderStyle}>
                              Water Quality Parameters
                            </h5>
                            {renderChecklistItem(
                              "Arsenic within limits",
                              "drinking_water_arsenic_limit",
                              "drinking_water_arsenic_limit_findings",
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <h4 style={cardTitleStyle}>Public Announce System</h4>
                  </div>
                  <div style={cardBodyStyle}>
                    {(() => {
                      const renderChecklistItem = (
                        label,
                        cbName,
                        findingsName,
                      ) => (
                        <div style={checklistItemStyle}>
                          <div style={checklistCheckboxStyle}>
                            {renderCheckbox(label, cbName)}
                          </div>
                          <div style={checklistFindingsStyle}>
                            {renderInput(
                              "Findings",
                              findingsName,
                              "text",
                              false,
                              2,
                            )}
                          </div>
                        </div>
                      );
                      return (
                        <>
                          {renderChecklistItem(
                            "Public Announce system present",
                            "pa_system_present",
                            "pa_system_present_findings",
                          )}
                          {renderChecklistItem(
                            "PA system audible covering all areas with IPS backup",
                            "pa_system_audible_all_areas",
                            "pa_system_audible_all_areas_findings",
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <h4 style={cardTitleStyle}>Emergency Exits</h4>
                  </div>
                  <div style={cardBodyStyle}>
                    {(() => {
                      const renderChecklistItem = (
                        label,
                        cbName,
                        findingsName,
                      ) => (
                        <div style={checklistItemStyle}>
                          <div style={checklistCheckboxStyle}>
                            {renderCheckbox(label, cbName)}
                          </div>
                          <div style={checklistFindingsStyle}>
                            {renderInput(
                              "Findings",
                              findingsName,
                              "text",
                              false,
                              2,
                            )}
                          </div>
                        </div>
                      );
                      return (
                        <>
                          {renderChecklistItem(
                            "Two exits in each floor, not locked or obstructed",
                            "emergency_exits_two_per_floor",
                            "emergency_exits_two_per_floor_findings",
                          )}
                          {renderChecklistItem(
                            "Workers trained on fire drills and emergency evacuation",
                            "emergency_exits_trained_workers",
                            "emergency_exits_trained_workers_findings",
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <h4 style={cardTitleStyle}>Wet Process Unit</h4>
                  </div>
                  <div style={cardBodyStyle}>
                    {(() => {
                      const renderChecklistItem = (
                        label,
                        cbName,
                        findingsName,
                      ) => (
                        <div style={checklistItemStyle}>
                          <div style={checklistCheckboxStyle}>
                            {renderCheckbox(label, cbName)}
                          </div>
                          <div style={checklistFindingsStyle}>
                            {renderInput(
                              "Findings",
                              findingsName,
                              "text",
                              false,
                              2,
                            )}
                          </div>
                        </div>
                      );
                      return (
                        <>
                          {renderChecklistItem(
                            "Factory has a wet process unit",
                            "wet_process_unit_exists",
                            "wet_process_unit_exists_findings",
                          )}
                          {renderChecklistItem(
                            "Legally required valid environmental licenses/permits",
                            "wet_process_environmental_licenses",
                            "wet_process_environmental_licenses_findings",
                          )}
                          {renderChecklistItem(
                            "Wastewater treatment plant with inlet/outlet meter",
                            "wet_process_wastewater_treatment_plant",
                            "wet_process_wastewater_treatment_plant_findings",
                          )}
                          {renderChecklistItem(
                            "Wastewater treatment plant functional",
                            "wet_process_wtp_functional",
                            "wet_process_wtp_functional_findings",
                          )}
                          {renderChecklistItem(
                            "Valid wastewater test report",
                            "wet_process_valid_test_report",
                            "wet_process_valid_test_report_findings",
                          )}
                          {renderChecklistItem(
                            "Wastewater parameters within legal limits",
                            "wet_process_parameters_within_limits",
                            "wet_process_parameters_within_limits_findings",
                          )}
                          <div style={subSectionIndentStyle}>
                            <h5 style={subSectionHeaderStyle}>
                              Wastewater Parameters
                            </h5>
                            {renderChecklistItem(
                              "Wastewater pH within limits",
                              "wet_process_ph_within_limits",
                              "wet_process_ph_within_limits_findings",
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <h4 style={cardTitleStyle}>Harassment Prevention</h4>
                  </div>
                  <div style={cardBodyStyle}>
                    {(() => {
                      const renderChecklistItem = (
                        label,
                        cbName,
                        findingsName,
                      ) => (
                        <div style={checklistItemStyle}>
                          <div style={checklistCheckboxStyle}>
                            {renderCheckbox(label, cbName)}
                          </div>
                          <div style={checklistFindingsStyle}>
                            {renderInput(
                              "Findings",
                              findingsName,
                              "text",
                              false,
                              2,
                            )}
                          </div>
                        </div>
                      );
                      return (
                        <>
                          {renderChecklistItem(
                            "No evidence of physical harassment",
                            "no_physical_harassment",
                            "no_physical_harassment_findings",
                          )}
                          {renderChecklistItem(
                            "No evidence of sexual harassment",
                            "no_sexual_harassment",
                            "no_sexual_harassment_findings",
                          )}
                          {renderChecklistItem(
                            "No evidence of psychological harassment",
                            "no_psychological_harassment",
                            "no_psychological_harassment_findings",
                          )}
                          {renderChecklistItem(
                            "No evidence of verbal harassment",
                            "no_verbal_harassment",
                            "no_verbal_harassment_findings",
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <h4 style={cardTitleStyle}>First Visit Checklist</h4>
                  </div>
                  <div style={cardBodyStyle}>
                    <div style={formGridStyle}>
                      {renderInput(
                        "First Visit Date",
                        "first_visit_date",
                        "date",
                      )}
                      {renderSelect(
                        "First Visit Status",
                        "first_visit_status",
                        [
                          { value: "correct", label: "Correct" },
                          { value: "incorrect", label: "Incorrect" },
                          { value: "pending", label: "Pending" },
                        ],
                      )}
                      {renderInput(
                        "First Visit Findings",
                        "first_visit_findings",
                        "text",
                        false,
                        3,
                      )}
                      {renderCheckbox(
                        "First Visit Completed",
                        "first_visit_completed",
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === "documents" && (
              <div style={formSectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>
                    <span style={sectionIconStyle}>📎</span> Additional Documents
                  </h3>
                  <p style={sectionDescriptionStyle}>
                    Safety documents and general files (multiple files supported per category)
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
                      <p style={cardSubtitleStyle}>Upload multiple files per category (PDF, JPG, PNG)</p>
                    </div>
                    <div style={cardBodyStyle}>
                      <div style={formGridStyle}>
                        <div style={fullWidthStyle}>
                          {renderMultiFileUpload(
                            "Additional Document 1",
                            "additional_document_1",
                          )}
                        </div>
                        <div style={fullWidthStyle}>
                          {renderMultiFileUpload(
                            "Additional Document 2",
                            "additional_document_2",
                          )}
                        </div>
                        <div style={fullWidthStyle}>
                          {renderMultiFileUpload(
                            "Additional Document 3",
                            "additional_document_3",
                          )}
                        </div>
                        <div style={fullWidthStyle}>
                          {renderMultiFileUpload(
                            "Additional Document 4",
                            "additional_document_4",
                          )}
                        </div>
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
                        <span style={spinnerSmallStyle}></span> Updating...
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

// ==================== STYLES ====================

const containerStyle = {
  backgroundColor: "#f3f4f6",
  minHeight: "100vh",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const twoColumnGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
  gap: "2rem",
};

const checklistItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  padding: "1rem",
  borderBottom: `1px solid ${colors.border}`,
};

const checklistCheckboxStyle = { flex: 1 };
const checklistFindingsStyle = { marginLeft: "1.5rem" };
const subSectionIndentStyle = {
  marginLeft: "1.5rem",
  marginTop: "1rem",
  paddingLeft: "1rem",
  borderLeft: `2px solid ${colors.primary}`,
};

const subSectionHeaderStyle = {
  fontSize: "0.875rem",
  fontWeight: "600",
  color: colors.primary,
  marginBottom: "1rem",
};

const headerStyle = {
  backgroundColor: colors.background,
  padding: "2rem 4rem",
  borderBottom: `1px solid ${colors.border}`,
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
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
};

const backArrowStyle = { fontSize: "1.125rem" };
const titleSectionStyle = { flex: 1 };
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

const progressSectionStyle = { maxWidth: "400px" };
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

const errorIconStyle = { fontSize: "1.25rem" };
const errorContentStyle = { flex: 1 };
const errorMessageStyle = {
  fontSize: "0.875rem",
  whiteSpace: "pre-wrap",
  marginTop: "0.25rem",
};

const contentWrapperStyle = { margin: "0 auto", padding: "2rem 3rem" };

const tabsContainerStyle = {
  backgroundColor: colors.background,
  borderRadius: "12px 12px 0 0",
  borderBottom: `1px solid ${colors.border}`,
  overflowX: "auto",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const tabsStyle = { display: "flex", padding: "0 1rem", gap: "0.25rem" };

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
};

const activeTabStyle = { color: colors.primary, fontWeight: "600" };
const activeTabIndicatorStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: "2px",
  backgroundColor: colors.primary,
  borderRadius: "2px 2px 0 0",
};

const tabIconStyle = { fontSize: "1rem" };

const formStyle = {
  backgroundColor: colors.background,
  borderRadius: "0 0 12px 12px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
};

const tabContentStyle = { padding: "2.5rem" };
const formSectionStyle = { animation: "fadeIn 0.3s ease" };

const sectionHeaderStyle = { marginBottom: "2rem" };

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

const sectionIconStyle = { fontSize: "1.5rem" };
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
  gap: "2.5rem",
  padding: "1.5rem 1.5rem",
};

const fullWidthStyle = { gridColumn: "1 / -1" };
const formGroupStyle = { display: "flex", flexDirection: "column" };

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

const daysRemainingFieldStyle = {
  backgroundColor: colors.light,
  color: colors.textSecondary,
  cursor: "not-allowed",
};

const readOnlyFieldStyle = {
  backgroundColor: colors.light,
  color: colors.textPrimary,
  cursor: "not-allowed",
  fontWeight: "500",
};

const inputStyle = {
  padding: "0.625rem 0.875rem",
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  fontSize: "0.875rem",
  transition: "all 0.2s",
  outline: "none",
};

const textareaStyle = { minHeight: "100px", resize: "vertical" };
const inputErrorStyle = { borderColor: colors.error };
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

const checkboxWrapperStyle = { marginBottom: "0.5rem" };

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

const checkboxContentStyle = { flex: 1 };
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
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
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

const fileSizeStyle = { marginLeft: "auto", color: colors.textMuted };
const dividerStyle = {
  height: "1px",
  backgroundColor: colors.border,
  margin: "2rem 0",
};

const cardsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
  gap: "5rem",
};

const cardStyle = {
  backgroundColor: colors.background,
  border: `1px solid ${colors.border}`,
  borderRadius: "12px",
  overflow: "hidden",
  transition: "all 0.2s",
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

const cardBodyStyle = { padding: "1.5rem" };
const cardSubtitleStyle = {
  fontSize: "0.75rem",
  color: colors.textMuted,
  marginTop: "0.25rem",
  marginBottom: 0,
};

const formActionsStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1.5rem 2.5rem",
  borderTop: `1px solid ${colors.border}`,
  backgroundColor: colors.light,
};

const requiredHintStyle = { fontSize: "0.75rem", color: colors.textSecondary };
const actionButtonsStyle = { display: "flex", gap: "1rem" };
const navigationButtonsStyle = { display: "flex", gap: "0.75rem" };

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

const imageGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
  gap: "1rem",
  marginTop: "1rem",
};

const imagePreviewContainerStyle = {
  position: "relative",
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  padding: "0.5rem",
  backgroundColor: colors.light,
};

const imagePreviewStyle = {
  width: "100%",
  height: "120px",
  objectFit: "cover",
  borderRadius: "4px",
};

const removeImageButtonStyle = {
  position: "absolute",
  top: "0.25rem",
  right: "0.25rem",
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  backgroundColor: colors.danger,
  color: "white",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1rem",
  fontWeight: "bold",
};

const imageInfoStyle = {
  fontSize: "0.75rem",
  marginTop: "0.5rem",
  color: colors.textSecondary,
  wordBreak: "break-all",
};

const existingImagePreviewStyle = {
  marginBottom: "0.75rem",
  padding: "0.5rem",
  backgroundColor: colors.light,
  borderRadius: "8px",
  border: `1px solid ${colors.border}`,
  textAlign: "center",
};

const existingImageStyle = {
  maxWidth: "100%",
  maxHeight: "150px",
  objectFit: "contain",
  borderRadius: "4px",
  marginBottom: "0.5rem",
};

const existingImageActionsStyle = {
  display: "flex",
  gap: "1rem",
  justifyContent: "center",
  marginTop: "0.5rem",
};

const viewLinkStyle = {
  color: colors.primary,
  textDecoration: "none",
  fontSize: "0.75rem",
  cursor: "pointer",
};

const removeFileButtonStyle = {
  marginLeft: "0.5rem",
  padding: "0.25rem 0.75rem",
  backgroundColor: colors.danger,
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: "500",
  transition: "all 0.2s",
  whiteSpace: "nowrap",
};

const newImagePreviewStyle = {
  width: "40px",
  height: "40px",
  objectFit: "cover",
  borderRadius: "4px",
  marginRight: "0.5rem",
};

const imageCountHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "0.5rem",
  marginBottom: "0.5rem",
  fontSize: "0.75rem",
  color: colors.textSecondary,
};

const clearAllButtonStyle = {
  padding: "0.25rem 0.75rem",
  backgroundColor: colors.warning,
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.7rem",
  fontWeight: "500",
  transition: "all 0.2s",
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

const deletedFileStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.75rem",
  color: colors.warning,
  marginBottom: "0.5rem",
  padding: "0.5rem",
  backgroundColor: colors.warningLight,
  borderRadius: "6px",
  border: `1px solid ${colors.warning}`,
};

const undoButtonStyle = {
  marginLeft: "auto",
  padding: "0.25rem 0.75rem",
  backgroundColor: colors.primary,
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.7rem",
  fontWeight: "500",
};

const existingFileLinkStyle = {
  color: colors.success,
  textDecoration: "none",
  marginLeft: "0.25rem",
  fontWeight: "500",
};

const checkboxListContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const checkboxListHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "0.5rem",
  fontSize: "0.875rem",
  fontWeight: "500",
  color: colors.textSecondary,
};

const createNewButtonStyle = {
  padding: "0.5rem 1rem",
  backgroundColor: colors.primary,
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: "500",
  transition: "all 0.2s",
};

const checkboxListStyle = {
  maxHeight: "400px",
  overflowY: "auto",
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  backgroundColor: colors.background,
};

const emptyStateStyle = {
  padding: "2rem",
  textAlign: "center",
  color: colors.textMuted,
  fontSize: "0.875rem",
};

const selectedCountStyle = {
  fontSize: "0.75rem",
  color: colors.success,
  fontWeight: "500",
  padding: "0.5rem",
  backgroundColor: colors.successLight,
  borderRadius: "6px",
  textAlign: "center",
};

const selectedItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.75rem 1rem",
  borderBottom: `1px solid ${colors.border}`,
  backgroundColor: colors.successLight,
  flexWrap: "wrap",
  gap: "0.5rem",
};

const selectedItemContentStyle = { flex: 1 };

const selectedItemActionsStyle = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
};

const editSelectedButtonStyle = {
  padding: "0.25rem 0.75rem",
  backgroundColor: colors.info,
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: "500",
  transition: "all 0.2s",
};

const deleteSelectedButtonStyle = {
  padding: "0.25rem 0.75rem",
  backgroundColor: colors.warning,
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: "500",
  transition: "all 0.2s",
};

const removeSelectedButtonStyle = {
  padding: "0.25rem 0.75rem",
  backgroundColor: colors.danger,
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: "500",
  transition: "all 0.2s",
};

const checkboxItemNameStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const checkboxItemBadgeStyle = {
  fontSize: "0.7rem",
  padding: "0.125rem 0.375rem",
  backgroundColor: colors.infoLight,
  color: colors.info,
  borderRadius: "4px",
};

const checkboxItemAddressStyle = {
  fontSize: "0.7rem",
  color: colors.textSecondary,
  marginTop: "0.25rem",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
};

const modalContentStyle = {
  backgroundColor: colors.background,
  borderRadius: "12px",
  width: "480px",
  maxWidth: "95%",
  padding: "2rem",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
  border: `1px solid ${colors.border}`,
  maxHeight: "90vh",
  overflowY: "auto",
};

const modalTitleStyle = {
  margin: "0 0 1.5rem 0",
  color: colors.textPrimary,
  fontSize: "1.25rem",
  fontWeight: "600",
};

const modalActionsStyle = { display: "flex", gap: "12px", marginTop: "1.5rem" };

const modalCancelButtonStyle = {
  flex: 1,
  padding: "0.625rem 1.5rem",
  backgroundColor: "transparent",
  color: colors.textSecondary,
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "0.875rem",
  transition: "all 0.2s",
};

const modalCreateButtonStyle = {
  flex: 1,
  padding: "0.625rem 1.5rem",
  backgroundColor: colors.success,
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "0.875rem",
  transition: "all 0.2s",
};

// ==================== MULTI FILE STYLES ====================

const existingMultiFileListStyle = {
  marginBottom: "0.5rem",
  border: `1px solid ${colors.success}`,
  borderRadius: "8px",
  overflow: "hidden",
};

const deletedMultiFileListStyle = {
  marginBottom: "0.5rem",
  border: `1px solid ${colors.warning}`,
  borderRadius: "8px",
  overflow: "hidden",
};

const newMultiFileListStyle = {
  marginTop: "0.5rem",
  border: `1px solid ${colors.primary}`,
  borderRadius: "8px",
  overflow: "hidden",
};

const fileListStyle = {
  maxHeight: "150px",
  overflowY: "auto",
  padding: "0.5rem",
};

const fileListItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.5rem",
  backgroundColor: colors.background,
  borderRadius: "6px",
  border: `1px solid ${colors.border}`,
  marginBottom: "0.25rem",
};

const deletedFileListItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.5rem",
  backgroundColor: colors.warningLight,
  borderRadius: "6px",
  border: `1px solid ${colors.warning}`,
  marginBottom: "0.25rem",
  color: colors.warning,
};

const fileIconStyle = {
  fontSize: "1.25rem",
};

const fileListNameStyle = {
  flex: 1,
  fontSize: "0.8rem",
  color: colors.textPrimary,
  wordBreak: "break-all",
};

const fileListSizeStyle = {
  fontSize: "0.7rem",
  color: colors.textMuted,
  marginRight: "0.5rem",
};

const removeMultiFileButtonStyle = {
  background: "none",
  border: "none",
  color: colors.danger,
  cursor: "pointer",
  fontSize: "1.1rem",
  fontWeight: "bold",
  padding: "0 0.25rem",
  lineHeight: 1,
};

const miniThumbnailStyle = {
  width: "40px",
  height: "40px",
  objectFit: "cover",
  borderRadius: "4px",
  border: `1px solid ${colors.border}`,
};

const fileListHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.5rem 0.75rem",
  backgroundColor: colors.light,
  borderBottom: `1px solid ${colors.border}`,
  fontSize: "0.75rem",
  color: colors.textSecondary,
};

// ==================== END MULTI FILE STYLES ====================

// Add animation styles
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  if (
    !styleSheet.cssRules.length ||
    !styleSheet.cssRules[styleSheet.cssRules.length - 1].name === "spin"
  ) {
    styleSheet.insertRule(
      `@keyframes spin { to { transform: rotate(360deg); } }`,
      styleSheet.cssRules.length,
    );
    styleSheet.insertRule(
      `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`,
      styleSheet.cssRules.length,
    );
  }
}

export default EditSupplierCSR;