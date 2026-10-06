import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../merchandiser/Sidebar.jsx";
import { withSupplierFormTheme, SUPPLIER_FORM_CSS } from "./supplierFormTheme";
import { useNavigate, useParams } from "react-router-dom";

const DOCUMENT_FIELDS = [
  ["bsci_certificate", "BSCI Certificate"],
  ["sedex_certificate", "Sedex Certificate"],
  ["wrap_certificate", "WRAP Certificate"],
  ["security_audit_certificate", "Security Audit Certificate"],
  ["oeko_tex_certificate", "OEKO-TEX Certificate"],
  ["gots_certificate", "GOTS Certificate"],
  ["ocs_certificate", "OCS Certificate"],
  ["grs_certificate", "GRS Certificate"],
  ["rcs_certificate", "RCS Certificate"],
  ["iso_9001_certificate", "ISO 9001 Certificate"],
  ["iso_14001_certificate", "ISO 14001 Certificate"],
  ["trade_license_file", "Trade License File"],
  ["factory_license_file", "Factory License File"],
  ["fire_license_file", "Fire License File"],
  ["membership_file", "Membership File"],
  ["group_insurance_file", "Group Insurance File"],
  ["boiler_license_file", "Boiler License File"],
  ["berc_license_file", "BERC License File"],
  ["environmental_compliance_certificate", "Environmental Compliance Certificate"],
  ["environmental_audit_report", "Environmental Audit Report"],
  ["compliance_certificate", "Compliance Certificate"],
  ["grievance_policy_document", "Grievance Policy Document"],
  ["emergency_evacuation_plan", "Emergency Evacuation Plan"],
  ["safety_protocols_document", "Safety Protocols Document"],
  ["health_safety_policy", "Health Safety Policy"],
  ["risk_assessment_report", "Risk Assessment Report"],
  ["safety_audit_report", "Safety Audit Report"],
  ["profile_picture", "Profile Picture"],
  ["additional_document_1", "Additional Document 1"],
  ["additional_document_2", "Additional Document 2"],
  ["additional_document_3", "Additional Document 3"],
  ["additional_document_4", "Additional Document 4"],
  ["fire_training_certificate", "Fire Training Certificate"],
  ["fire_drill_record", "Fire Drill Record"],
  ["fire_safety_audit_report", "Fire Safety Audit Report"],
  ["rsc_certificate", "RSC Certificate"],
  ["structural_safety_report", "Structural Safety Report"],
  ["electrical_safety_report", "Electrical Safety Report"],
  ["fire_safety_report", "Fire Safety Report"],
  ["pc_election_document", "PC Election Document"],
  ["pc_meeting_minutes", "PC Meeting Minutes"],
  ["safety_committee_formation_document", "Safety Committee Formation Document"],
  ["safety_committee_meeting_minutes", "Safety Committee Meeting Minutes"],
];

const EditSupplier = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [existingFiles, setExistingFiles] = useState({});
  const [activeTab, setActiveTab] = useState("basic");
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [newFiles, setNewFiles] = useState({});
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm();

  // Helper function to format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    } catch (e) {
      console.error("Date formatting error:", e);
    }
    return "";
  };

  // Helper function to calculate days remaining
  const calculateDaysRemaining = (validityDate) => {
    if (!validityDate) return "";

    const today = new Date();
    const validity = new Date(validityDate);

    today.setHours(0, 0, 0, 0);
    validity.setHours(0, 0, 0, 0);

    const diffTime = validity - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays.toString();
  };

  // Handle field changes with auto-calculation for days remaining
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-calculate days remaining when validity date changes
    if (name.includes("_validity") && !name.includes("days_remaining")) {
      const daysField = name.replace("_validity", "_validity_days_remaining");
      const calculatedDays = calculateDaysRemaining(value);
      setValue(daysField, calculatedDays);
    }
    
    // Handle specific cases
    if (name === "bsci_validity") {
      setValue("bsci_validity_days_remaining", calculateDaysRemaining(value));
    } else if (name === "sedex_validity") {
      setValue("sedex_validity_days_remaining", calculateDaysRemaining(value));
    } else if (name === "wrap_validity") {
      setValue("wrap_validity_days_remaining", calculateDaysRemaining(value));
    } else if (name === "security_audit_validity") {
      setValue("security_audit_validity_days_remaining", calculateDaysRemaining(value));
    } else if (name === "oeko_tex_validity") {
      setValue("oeko_tex_validity_days_remaining", calculateDaysRemaining(value));
    } else if (name === "gots_validity") {
      setValue("gots_validity_days_remaining", calculateDaysRemaining(value));
    } else if (name === "iso_9001_validity") {
      setValue("iso_9001_validity_days_remaining", calculateDaysRemaining(value));
    } else if (name === "trade_license_validity") {
      setValue("trade_license_days_remaining", calculateDaysRemaining(value));
    } else if (name === "factory_license_validity") {
      setValue("factory_license_days_remaining", calculateDaysRemaining(value));
    } else if (name === "fire_license_validity") {
      setValue("fire_license_days_remaining", calculateDaysRemaining(value));
    } else if (name === "membership_validity") {
      setValue("membership_days_remaining", calculateDaysRemaining(value));
    } else if (name === "group_insurance_validity") {
      setValue("group_insurance_days_remaining", calculateDaysRemaining(value));
    } else if (name === "boiler_license_validity") {
      setValue("boiler_license_days_remaining", calculateDaysRemaining(value));
    } else if (name === "berc_license_validity") {
      setValue("berc_days_remaining", calculateDaysRemaining(value));
    }
  };

  // Helper function to handle file selection
  const handleFileChange = (fieldName, file) => {
    if (file && file instanceof File) {
      setNewFiles((prev) => ({ ...prev, [fieldName]: file }));
      // Also mark as not deleted if it was previously marked for deletion
      setDeletedFiles((prev) => prev.filter((f) => f !== fieldName));
    } else {
      // File was cleared
      setNewFiles((prev) => {
        const newState = { ...prev };
        delete newState[fieldName];
        return newState;
      });
      // If there was an existing file, mark it for deletion
      if (existingFiles[fieldName]) {
        setDeletedFiles((prev) => [...prev, fieldName]);
      }
    }
  };

  // Helper function to check if a file field has a new file
  const hasNewFile = (fieldName) => {
    return !!newFiles[fieldName];
  };

  // Helper function to check if file is deleted
  const isFileDeleted = (fieldName) => {
    return deletedFiles.includes(fieldName);
  };

  // Inline CSS Styles
  const baseStyles = {
    mainContainer: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f3f4f6",
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    contentContainer: {
      flex: 1,
      padding: "1rem",
      marginLeft: "0",
      overflowY: "auto",
      maxHeight: "100vh",
    },
    header: {
      fontSize: "1.875rem",
      fontWeight: "bold",
      marginBottom: "1.5rem",
      color: "#111827",
    },
    formContainer: {
      backgroundColor: "white",
      padding: "1.5rem",
      borderRadius: "0.5rem",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      marginBottom: "2rem",
    },
    formTitle: {
      fontSize: "1.25rem",
      fontWeight: "600",
      marginBottom: "1rem",
      color: "#111827",
    },
    tabContainer: {
      display: "flex",
      borderBottom: "1px solid #e5e7eb",
      marginBottom: "1.5rem",
      gap: "0.5rem",
      flexWrap: "nowrap",
      overflowX: "auto",
    },
    tabButton: {
      padding: "0.5rem 1rem",
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "#6b7280",
      borderBottom: "2px solid transparent",
      transition: "all 0.2s",
      whiteSpace: "nowrap",
      flexShrink: 0,
    },
    activeTab: {
      color: "#2563eb",
    },
    gridContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "1.5rem",
      marginBottom: "1.5rem",
    },
    cardContainer: {
      backgroundColor: "white",
      padding: "1.5rem",
      borderRadius: "0.5rem",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      border: "1px solid #e5e7eb",
    },
    cardTitle: {
      fontWeight: "600",
      marginBottom: "1.25rem",
      fontSize: "1rem",
      color: "#111827",
    },
    inputGroup: {
      marginBottom: "1rem",
    },
    label: {
      display: "block",
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "0.5rem",
    },
    input: {
      width: "100%",
      padding: "0.5rem 0.75rem",
      borderRadius: "0.375rem",
      border: "1px solid #d1d5db",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      fontSize: "0.875rem",
      transition: "border-color 0.2s",
    },
    textarea: {
      width: "100%",
      padding: "0.5rem 0.75rem",
      borderRadius: "0.375rem",
      border: "1px solid #d1d5db",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      fontSize: "0.875rem",
      minHeight: "100px",
      resize: "vertical",
    },
    select: {
      width: "100%",
      padding: "0.5rem 0.75rem",
      borderRadius: "0.375rem",
      border: "1px solid #d1d5db",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      fontSize: "0.875rem",
      appearance: "none",
      backgroundImage:
        'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 0.5rem center",
      backgroundSize: "0.65rem auto",
    },
    checkbox: {
      height: "1rem",
      width: "1rem",
      borderRadius: "0.25rem",
      border: "1px solid #d1d5db",
      cursor: "pointer",
    },
    checkboxLabel: {
      marginLeft: "0.5rem",
      fontSize: "0.875rem",
      color: "#374151",
      cursor: "pointer",
    },
    errorText: {
      color: "#ef4444",
      fontSize: "0.75rem",
      marginTop: "0.25rem",
    },
    formButtons: {
      marginTop: "1.5rem",
      display: "flex",
      justifyContent: "flex-end",
      gap: "1rem",
    },
    cancelButton: {
      padding: "0.5rem 1.25rem",
      border: "1px solid #d1d5db",
      borderRadius: "0.375rem",
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "#374151",
      backgroundColor: "white",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    submitButton: {
      padding: "0.5rem 1.25rem",
      border: "1px solid transparent",
      borderRadius: "0.375rem",
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "white",
      backgroundColor: "#2563eb",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    flexRow: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    flexCol: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    },
    loadingText: {
      textAlign: "center",
      padding: "2rem",
      color: "#6b7280",
    },
    sectionHeader: {
      gridColumn: "1 / -1",
      fontSize: "1rem",
      fontWeight: "600",
      color: "#111827",
      margin: "1rem 0 0.5rem 0",
      paddingBottom: "0.5rem",
      borderBottom: "1px solid #e5e7eb",
    },
    existingFileStyle: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.75rem",
      color: "#059669",
      marginBottom: "0.5rem",
      padding: "0.5rem",
      backgroundColor: "#d1fae5",
      borderRadius: "6px",
      border: "1px solid #059669",
    },
    deleteFileButton: {
      marginLeft: "auto",
      padding: "0.25rem 0.5rem",
      backgroundColor: "#dc2626",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "0.7rem",
    },
    existingFileLinkStyle: {
      color: "#059669",
      textDecoration: "none",
      marginLeft: "0.25rem",
      fontWeight: "500",
    },
    fileStatusText: {
      fontSize: "0.7rem",
      marginTop: "0.25rem",
      color: "#6b7280",
    },
    checkboxGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "0.5rem",
      marginBottom: "1rem",
    },
    cardGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
      gap: "1rem",
      marginBottom: "1rem",
    },
    readOnlyInput: {
      backgroundColor: "#f3f4f6",
      cursor: "not-allowed",
    },
  };
  const styles = withSupplierFormTheme(baseStyles);

  // Fetch supplier data on component mount
  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://119.148.51.38:8000/api/csr/api/supplier/${id}/`,
          { headers: { Authorization: `Token ${localStorage.getItem("token")}` } },
        );
        const data = response.data;

        // Format dates for date inputs
        const formattedData = {
          // Basic Information
          sl_no: data.sl_no || "",
          supplier_name: data.supplier_name || "",
          supplier_id: data.supplier_id || "",
          location: data.location || "",
          supplier_category: data.supplier_category || "",
          year_of_establishment: data.year_of_establishment || "",
          rented_building: data.rented_building || false,
          share_building: data.share_building || false,
          own_property: data.own_property || false,
          ownership_details: data.ownership_details || "",
          factory_main_contact: data.factory_main_contact || "",
          factory_merchandiser_contact: data.factory_merchandiser_contact || "",
          factory_hr_compliance_contact:
            data.factory_hr_compliance_contact || "",
          building_details: data.building_details || "",
          total_area: data.total_area || "",
          manpower_workers_male: data.manpower_workers_male || "",
          manpower_workers_female: data.manpower_workers_female || "",
          manpower_staff_male: data.manpower_staff_male || "",
          manpower_staff_female: data.manpower_staff_female || "",
          total_manpower: data.total_manpower || "",
          production_process: data.production_process || "",
          manufacturing_item: data.manufacturing_item || "",
          capacity_per_month: data.capacity_per_month || "",
          business_by_market: data.business_by_market || "",
          existing_customer: data.existing_customer || "",
          number_of_sewing_line: data.number_of_sewing_line || "",
          total_number_of_machineries: data.total_number_of_machineries || "",
          yearly_turnover_usd: data.yearly_turnover_usd || "",
          weekly_holiday: data.weekly_holiday || "Friday",
          bgmea_number: data.bgmea_number || "",
          rsc: data.rsc || "",
          tad_group_order_status: data.tad_group_order_status || "",

          // Certifications
          bsci_last_audit_date: formatDateForInput(data.bsci_last_audit_date),
          bsci_rating: data.bsci_rating || "",
          bsci_validity: formatDateForInput(data.bsci_validity),
          bsci_validity_days_remaining: calculateDaysRemaining(
            data.bsci_validity,
          ),
          bsci_status: data.bsci_status || "",
          sedex_last_audit_date: formatDateForInput(data.sedex_last_audit_date),
          sedex_rating: data.sedex_rating || "",
          sedex_validity: formatDateForInput(data.sedex_validity),
          sedex_validity_days_remaining: calculateDaysRemaining(
            data.sedex_validity,
          ),
          sedex_status: data.sedex_status || "",
          wrap_last_audit_date: formatDateForInput(data.wrap_last_audit_date),
          wrap_rating: data.wrap_rating || "",
          wrap_validity: formatDateForInput(data.wrap_validity),
          wrap_validity_days_remaining: calculateDaysRemaining(
            data.wrap_validity,
          ),
          wrap_status: data.wrap_status || "",
          security_audit_last_date: formatDateForInput(
            data.security_audit_last_date,
          ),
          security_audit_rating: data.security_audit_rating || "",
          security_audit_validity: formatDateForInput(
            data.security_audit_validity,
          ),
          security_audit_validity_days_remaining: calculateDaysRemaining(
            data.security_audit_validity,
          ),
          security_audit_status: data.security_audit_status || "",
          oeko_tex_validity: formatDateForInput(data.oeko_tex_validity),
          oeko_tex_validity_days_remaining: calculateDaysRemaining(
            data.oeko_tex_validity,
          ),
          oeko_tex_status: data.oeko_tex_status || "",
          gots_validity: formatDateForInput(data.gots_validity),
          gots_validity_days_remaining: calculateDaysRemaining(
            data.gots_validity,
          ),
          gots_status: data.gots_status || "",
          ocs_validity: formatDateForInput(data.ocs_validity),
          ocs_validity_days_remaining: calculateDaysRemaining(
            data.ocs_validity,
          ),
          ocs_status: data.ocs_status || "",
          grs_validity: formatDateForInput(data.grs_validity),
          grs_validity_days_remaining: calculateDaysRemaining(
            data.grs_validity,
          ),
          grs_status: data.grs_status || "",
          rcs_validity: formatDateForInput(data.rcs_validity),
          rcs_validity_days_remaining: calculateDaysRemaining(
            data.rcs_validity,
          ),
          rcs_status: data.rcs_status || "",
          iso_9001_validity: formatDateForInput(data.iso_9001_validity),
          iso_9001_validity_days_remaining: calculateDaysRemaining(
            data.iso_9001_validity,
          ),
          iso_9001_status: data.iso_9001_status || "",
          iso_14001_validity: formatDateForInput(data.iso_14001_validity),
          iso_14001_validity_days_remaining: calculateDaysRemaining(
            data.iso_14001_validity,
          ),
          iso_14001_status: data.iso_14001_status || "",
          certification_remarks: data.certification_remarks || "",
          other_certificate_1_name: data.other_certificate_1_name || "",
          other_certificate_2_name: data.other_certificate_2_name || "",

          // Licenses
          trade_license_validity: formatDateForInput(
            data.trade_license_validity,
          ),
          trade_license_days_remaining: calculateDaysRemaining(
            data.trade_license_validity,
          ),
          factory_license_validity: formatDateForInput(
            data.factory_license_validity,
          ),
          factory_license_days_remaining: calculateDaysRemaining(
            data.factory_license_validity,
          ),
          fire_license_validity: formatDateForInput(data.fire_license_validity),
          fire_license_days_remaining: calculateDaysRemaining(
            data.fire_license_validity,
          ),
          membership_validity: formatDateForInput(data.membership_validity),
          membership_days_remaining: calculateDaysRemaining(
            data.membership_validity,
          ),
          group_insurance_validity: formatDateForInput(
            data.group_insurance_validity,
          ),
          group_insurance_days_remaining: calculateDaysRemaining(
            data.group_insurance_validity,
          ),
          boiler_no: data.boiler_no || "",
          boiler_license_validity: formatDateForInput(
            data.boiler_license_validity,
          ),
          boiler_license_days_remaining: calculateDaysRemaining(
            data.boiler_license_validity,
          ),
          berc_license_validity: formatDateForInput(data.berc_license_validity),
          berc_days_remaining: calculateDaysRemaining(
            data.berc_license_validity,
          ),
          license_remarks: data.license_remarks || "",

          // Fire Safety
          last_fire_training_by_fscd: formatDateForInput(
            data.last_fire_training_by_fscd,
          ),
          fscd_next_fire_training_date: formatDateForInput(
            data.fscd_next_fire_training_date,
          ),
          last_fire_drill_record_by_fscd: formatDateForInput(
            data.last_fire_drill_record_by_fscd,
          ),
          fscd_next_drill_date: formatDateForInput(data.fscd_next_drill_date),
          total_fire_fighter_rescue_first_aider_fscd:
            data.total_fire_fighter_rescue_first_aider_fscd || "",
          fire_safety_remarks: data.fire_safety_remarks || "",

          // Wages & Compliance
          minimum_wages_paid: data.minimum_wages_paid || false,
          earn_leave_status: data.earn_leave_status || false,
          service_benefit: data.service_benefit || false,
          maternity_benefit: data.maternity_benefit || false,
          yearly_increment: data.yearly_increment || false,
          festival_bonus: data.festival_bonus || false,
          salary_due_status: data.salary_due_status || false,
          due_salary_month: data.due_salary_month || "",

          // Environmental
          water_test_report_doe: formatDateForInput(data.water_test_report_doe),
          zdhc_water_test_report: formatDateForInput(
            data.zdhc_water_test_report,
          ),
          higg_fem_self_assessment_score:
            data.higg_fem_self_assessment_score || "",
          higg_fem_verification_assessment_score:
            data.higg_fem_verification_assessment_score || "",
          behive_chemical_inventory: data.behive_chemical_inventory || false,

          // RSC Audit
          rsc_id: data.rsc_id || "",
          progress_rate: data.progress_rate || "",
          structural_initial_audit_date: formatDateForInput(
            data.structural_initial_audit_date,
          ),
          structural_initial_findings: data.structural_initial_findings || "",
          structural_last_follow_up_audit_date: formatDateForInput(
            data.structural_last_follow_up_audit_date,
          ),
          structural_total_findings: data.structural_total_findings || "",
          structural_total_corrected: data.structural_total_corrected || "",
          structural_total_in_progress: data.structural_total_in_progress || "",
          structural_total_pending_verification:
            data.structural_total_pending_verification || "",
          fire_initial_audit_date: formatDateForInput(
            data.fire_initial_audit_date,
          ),
          fire_initial_findings: data.fire_initial_findings || "",
          fire_last_follow_up_audit_date: formatDateForInput(
            data.fire_last_follow_up_audit_date,
          ),
          fire_total_findings: data.fire_total_findings || "",
          fire_total_corrected: data.fire_total_corrected || "",
          fire_total_in_progress: data.fire_total_in_progress || "",
          fire_total_pending_verification:
            data.fire_total_pending_verification || "",
          electrical_initial_audit_date: formatDateForInput(
            data.electrical_initial_audit_date,
          ),
          electrical_initial_findings: data.electrical_initial_findings || "",
          electrical_last_follow_up_audit_date: formatDateForInput(
            data.electrical_last_follow_up_audit_date,
          ),
          electrical_total_findings: data.electrical_total_findings || "",
          electrical_total_corrected: data.electrical_total_corrected || "",
          electrical_total_in_progress: data.electrical_total_in_progress || "",
          electrical_total_pending_verification:
            data.electrical_total_pending_verification || "",

          // PC & Safety Committee
          last_pc_election_date: formatDateForInput(data.last_pc_election_date),
          last_pc_meeting_date: formatDateForInput(data.last_pc_meeting_date),
          last_safety_committee_formation_date: formatDateForInput(
            data.last_safety_committee_formation_date,
          ),
          last_safety_committee_meeting_date: formatDateForInput(
            data.last_safety_committee_meeting_date,
          ),

          // CSR
          donation_local_community: data.donation_local_community || false,
          tree_plantation_local_community:
            data.tree_plantation_local_community || false,
          sanitary_napkin_status: data.sanitary_napkin_status || false,
          fair_shop: data.fair_shop || false,
          any_gift_provided_during_festival:
            data.any_gift_provided_during_festival || false,

          // Compliance & Safety
          compliance_status: data.compliance_status || "under_review",
          compliance_remarks: data.compliance_remarks || "",
          grievance_mechanism: data.grievance_mechanism || false,
          grievance_resolution_procedure:
            data.grievance_resolution_procedure || "",
          last_grievance_resolution_date: formatDateForInput(
            data.last_grievance_resolution_date,
          ),
          grievance_resolution_rate: data.grievance_resolution_rate || "",
          grievance_remarks: data.grievance_remarks || "",
          safety_training_frequency: data.safety_training_frequency || "",
          last_safety_audit_date: formatDateForInput(
            data.last_safety_audit_date,
          ),
          safety_measures_remarks: data.safety_measures_remarks || "",

          // Contact Information
          email: data.email || "",
          phone: data.phone || "",
        };

        reset(formattedData);

        // Store existing file URLs for display
        const fileFields = {
          bsci_certificate: data.bsci_certificate_url,
          sedex_certificate: data.sedex_certificate_url,
          wrap_certificate: data.wrap_certificate_url,
          security_audit_certificate: data.security_audit_certificate_url,
          oeko_tex_certificate: data.oeko_tex_certificate_url,
          gots_certificate: data.gots_certificate_url,
          ocs_certificate: data.ocs_certificate_url,
          grs_certificate: data.grs_certificate_url,
          rcs_certificate: data.rcs_certificate_url,
          iso_9001_certificate: data.iso_9001_certificate_url,
          iso_14001_certificate: data.iso_14001_certificate_url,
          trade_license_file: data.trade_license_file_url,
          factory_license_file: data.factory_license_file_url,
          fire_license_file: data.fire_license_file_url,
          membership_file: data.membership_file_url,
          group_insurance_file: data.group_insurance_file_url,
          boiler_license_file: data.boiler_license_file_url,
          berc_license_file: data.berc_license_file_url,
          environmental_compliance_certificate:
            data.environmental_compliance_certificate_url,
          environmental_audit_report: data.environmental_audit_report_url,
          compliance_certificate: data.compliance_certificate_url,
          grievance_policy_document: data.grievance_policy_document_url,
          emergency_evacuation_plan: data.emergency_evacuation_plan_url,
          safety_protocols_document: data.safety_protocols_document_url,
          health_safety_policy: data.health_safety_policy_url,
          risk_assessment_report: data.risk_assessment_report_url,
          safety_audit_report: data.safety_audit_report_url,
          profile_picture: data.profile_picture_url,
          additional_document_1: data.additional_document_1_url,
          additional_document_2: data.additional_document_2_url,
          additional_document_3: data.additional_document_3_url,
          additional_document_4: data.additional_document_4_url,
          fire_training_certificate: data.fire_training_certificate_url,
          fire_drill_record: data.fire_drill_record_url,
          fire_safety_audit_report: data.fire_safety_audit_report_url,
          rsc_certificate: data.rsc_certificate_url,
          structural_safety_report: data.structural_safety_report_url,
          electrical_safety_report: data.electrical_safety_report_url,
          fire_safety_report: data.fire_safety_report_url,
          pc_election_document: data.pc_election_document_url,
          pc_meeting_minutes: data.pc_meeting_minutes_url,
          safety_committee_formation_document:
            data.safety_committee_formation_document_url,
          safety_committee_meeting_minutes:
            data.safety_committee_meeting_minutes_url,
        };

        setExistingFiles(fileFields);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching supplier:", error);
        toast.error("Failed to load supplier data");
        setLoading(false);
        navigate("/suppliers");
      }
    };

    fetchSupplier();
  }, [id, reset, navigate]);

  const onSubmit = async (data) => {
    const formData = new FormData();

    // Process each field from the form data
    Object.keys(data).forEach((key) => {
      const value = data[key];

      // Skip undefined or null values
      if (value === undefined || value === null) {
        return;
      }

      // Handle file fields - ONLY process if it's actually a File object
      // Check if this is a file field by looking at the key
      const isFileField =
        key.includes("certificate") ||
        key.includes("file") ||
        key === "profile_picture" ||
        key === "card_image" ||
        key === "image" ||
        key.startsWith("additional_document_");

      if (isFileField) {
        // If it's a File object, append it
        if (value instanceof File) {
          formData.append(key, value);
        }
        // Otherwise skip - don't append anything for non-file values
        return;
      }

      // Handle boolean fields - convert to string "true"/"false"
      if (typeof value === "boolean") {
        formData.append(key, value.toString());
        return;
      }

      // Empty strings ARE sent: that is how a cleared field gets saved
      // (the API stores "" as blank/null). Skipping them made it impossible
      // to remove a value.

      // Handle all other fields (including dates as strings and numbers)
      formData.append(key, value);
    });

    // Add new files from our separate tracking
    Object.keys(newFiles).forEach((key) => {
      const file = newFiles[key];
      if (file instanceof File) {
        formData.append(key, file);
      }
    });

    // Add deleted files list
    if (deletedFiles.length > 0) {
      formData.append("deleted_files", JSON.stringify(deletedFiles));
    }

    // Log what we're sending for debugging
    console.log("Sending FormData:");
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(`  ${pair[0]}: File - ${pair[1].name}`);
      } else {
        console.log(`  ${pair[0]}: ${pair[1]}`);
      }
    }

    try {
      const response = await axios.put(
        `http://119.148.51.38:8000/api/csr/api/supplier/${id}/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Token ${localStorage.getItem("token")}`,
          },
        },
      );

      // Land on this supplier's page with a confirmation banner, so the
      // saved values are visible (a toast here vanished with the page).
      navigate(`/suppliers/${id}`, { state: { flash: "Supplier updated successfully." } });
    } catch (error) {
      console.error("Update error:", error);
      console.error("Error response:", error.response?.data);

      let errorMessage =
        "Failed to update supplier. Check input data and try again.";

      if (error.response?.data) {
        const backendErrors = error.response.data;
        if (typeof backendErrors === "object") {
          const errorMessages = [];
          Object.entries(backendErrors).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              errorMessages.push(`${field}: ${errors.join(", ")}`);
            } else {
              errorMessages.push(`${field}: ${errors}`);
            }
          });
          errorMessage = errorMessages.join("; ");
        } else if (typeof backendErrors === "string") {
          errorMessage = backendErrors;
        }
      }

      toast.error(errorMessage);
    }
  };

  // Render existing file with status
  const renderExistingFile = (fieldName) => {
    const fileUrl = existingFiles[fieldName];
    const isDeleted = isFileDeleted(fieldName);
    const hasNew = hasNewFile(fieldName);

    if (!fileUrl && !hasNew) return null;

    if (isDeleted) {
      return (
        <div
          style={{
            ...styles.existingFileStyle,
            backgroundColor: "#fee2e2",
            borderColor: "#dc2626",
            color: "#dc2626",
          }}
        >
          <span>🗑️</span>
          <span>File marked for deletion</span>
        </div>
      );
    }

    if (hasNew) {
      return (
        <div
          style={{
            ...styles.existingFileStyle,
            backgroundColor: "#dbeafe",
            borderColor: "#2563eb",
            color: "#2563eb",
          }}
        >
          <span>📤</span>
          <span>New file selected: {newFiles[fieldName]?.name}</span>
          <button
            type="button"
            onClick={() => handleFileChange(fieldName, null)}
            style={{ ...styles.deleteFileButton, backgroundColor: "#6b7280" }}
          >
            Cancel
          </button>
        </div>
      );
    }

    if (fileUrl) {
      return (
        <div style={styles.existingFileStyle}>
          <span>📄</span>
          <span>Existing file: </span>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.existingFileLinkStyle}
          >
            View
          </a>
          <button
            type="button"
            onClick={() => handleFileChange(fieldName, null)}
            style={styles.deleteFileButton}
          >
            Remove
          </button>
        </div>
      );
    }

    return null;
  };

  // File input component wrapper
  const FileInput = ({ fieldName, registerOptions = {} }) => (
    <div style={styles.inputGroup}>
      <label style={styles.label}>
        {registerOptions.label ||
          fieldName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </label>
      {renderExistingFile(fieldName)}
      <input
        type="file"
        accept={registerOptions.accept || "*/*"}
        style={styles.input}
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          handleFileChange(fieldName, file);
        }}
      />
      {!existingFiles[fieldName] && !hasNewFile(fieldName) && (
        <div style={styles.fileStatusText}>No file uploaded</div>
      )}
    </div>
  );

  // One case per tab. Field markup for Production, Certifications (+ licences),
  // Compliance, Environment, Fire Safety, RSC Audit and CSR is the same as
  // AddSupplier.jsx; files live on the Documents tab (FileInput above).
  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <div style={styles.gridContainer}>
            {/* Basic Information */}
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>Basic Information</h3>
              <div style={styles.flexCol}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>SL No</label>
                  <input
                    type="number"
                    {...register("sl_no")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Supplier/Factory Name *</label>
                  <input
                    type="text"
                    {...register("supplier_name", {
                      required: "Supplier name is required",
                    })}
                    style={styles.input}
                  />
                  {errors.supplier_name && (
                    <p style={styles.errorText}>
                      {errors.supplier_name.message}
                    </p>
                  )}
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Supplier ID *</label>
                  <input
                    type="text"
                    {...register("supplier_id", {
                      required: "Supplier ID is required",
                    })}
                    style={styles.input}
                  />
                  {errors.supplier_id && (
                    <p style={styles.errorText}>{errors.supplier_id.message}</p>
                  )}
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Location</label>
                  <textarea
                    {...register("location")}
                    rows={2}
                    style={styles.textarea}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Supplier Category</label>
                  <select
                    {...register("supplier_category")}
                    style={styles.select}
                  >
                    <option value="">Select Category</option>
                    <option value="Woven">Woven</option>
                    <option value="Sweater">Sweater</option>
                    <option value="Knit & Lingerie">Knit & Lingerie</option>
                    <option value="Knit">Knit</option>
                    <option value="Lingerie">Lingerie</option>
                    <option value="Socks">Socks</option>
                    <option value="Bags & Luggage">Bags & Luggage</option>
                    <option value="Tent">Tent</option>
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Year of Establishment</label>
                  <input
                    type="number"
                    {...register("year_of_establishment")}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>Contact Information</h3>
              <div style={styles.flexCol}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Factory Main Contact</label>
                  <input
                    type="text"
                    {...register("factory_main_contact")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>
                    Factory Merchandiser Contact
                  </label>
                  <input
                    type="text"
                    {...register("factory_merchandiser_contact")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>
                    Factory HR/Compliance Contact
                  </label>
                  <input
                    type="text"
                    {...register("factory_hr_compliance_contact")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    {...register("email")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Phone</label>
                  <input
                    type="tel"
                    {...register("phone")}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Ownership Details */}
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>Ownership Details</h3>
              <div style={styles.flexCol}>
                <div style={styles.flexRow}>
                  <input
                    type="checkbox"
                    {...register("rented_building")}
                    style={styles.checkbox}
                    id="rented_building"
                  />
                  <label htmlFor="rented_building" style={styles.checkboxLabel}>
                    Rented Building
                  </label>
                </div>
                <div style={styles.flexRow}>
                  <input
                    type="checkbox"
                    {...register("share_building")}
                    style={styles.checkbox}
                    id="share_building"
                  />
                  <label htmlFor="share_building" style={styles.checkboxLabel}>
                    Share Building
                  </label>
                </div>
                <div style={styles.flexRow}>
                  <input
                    type="checkbox"
                    {...register("own_property")}
                    style={styles.checkbox}
                    id="own_property"
                  />
                  <label htmlFor="own_property" style={styles.checkboxLabel}>
                    Own Property
                  </label>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Ownership Details</label>
                  <textarea
                    {...register("ownership_details")}
                    rows={2}
                    style={styles.textarea}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Building Details</label>
                  <textarea
                    {...register("building_details")}
                    rows={2}
                    style={styles.textarea}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Total Area (sq ft)</label>
                  <input
                    type="number"
                    {...register("total_area")}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "production":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Production & Manpower</h3>

            <div style={styles.sectionHeader}>Manpower</div>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Workers (Male)</label>
                <input
                  type="number"
                  {...register("manpower_workers_male")}
                  style={styles.input}
                  min="0"
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Workers (Female)</label>
                <input
                  type="number"
                  {...register("manpower_workers_female")}
                  style={styles.input}
                  min="0"
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Staff (Male)</label>
                <input
                  type="number"
                  {...register("manpower_staff_male")}
                  style={styles.input}
                  min="0"
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Staff (Female)</label>
                <input
                  type="number"
                  {...register("manpower_staff_female")}
                  style={styles.input}
                  min="0"
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Manpower (auto-calculated)</label>
                <input
                  type="number"
                  {...register("total_manpower")}
                  style={{...styles.input, ...styles.readOnlyInput}}
                  readOnly
                  value={
                    (parseInt(watch("manpower_workers_male") || 0) +
                    parseInt(watch("manpower_workers_female") || 0) +
                    parseInt(watch("manpower_staff_male") || 0) +
                    parseInt(watch("manpower_staff_female") || 0))
                  }
                />
              </div>
            </div>

            
            <div style={styles.sectionHeader}>Production Details</div>
            <div style={styles.gridContainer}>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Production Process</label>
                <textarea
                  {...register("production_process")}
                  style={styles.textarea}
                />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Manufacturing Items</label>
                <textarea
                  {...register("manufacturing_item")}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Capacity per month</label>
                <input
                  type="text"
                  {...register("capacity_per_month")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Business % by Market</label>
                <input
                  type="text"
                  {...register("business_by_market")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Number of Sewing Lines</label>
                <input
                  type="number"
                  {...register("number_of_sewing_line")}
                  style={styles.input}
                  min="0"
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Number of Machineries</label>
                <input
                  type="number"
                  {...register("total_number_of_machineries")}
                  style={styles.input}
                  min="0"
                />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Existing Customers</label>
                <textarea
                  {...register("existing_customer")}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Yearly Turnover (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("yearly_turnover_usd")}
                  style={styles.input}
                  min="0"
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Weekly Holiday</label>
                <select {...register("weekly_holiday")} style={styles.select}>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>BGMEA Number</label>
                <input
                  type="text"
                  {...register("bgmea_number")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>RSC</label>
                <input
                  type="text"
                  {...register("rsc")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>TAD Group Order Status</label>
                <input
                  type="text"
                  {...register("tad_group_order_status")}
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        );

      case "certifications":
        return (
          <>
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Certifications</h3>
            
            <div style={styles.cardGrid}>
              {/* BSCI */}
              <div style={styles.cardContainer}>
                <h4 style={styles.cardTitle}>BSCI</h4>
                <div style={styles.gridContainer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Last Audit Date</label>
                    <input
                      type="date"
                      {...register("bsci_last_audit_date")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Rating</label>
                    <input
                      type="text"
                      {...register("bsci_rating")}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Validity</label>
                    <input
                      type="date"
                      {...register("bsci_validity")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Remaining</label>
                    <input
                      type="number"
                      {...register("bsci_validity_days_remaining")}
                      style={{...styles.input, ...styles.readOnlyInput}}
                      readOnly
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Status</label>
                    <select {...register("bsci_status")} style={styles.select}>
                      <option value="">Select Status</option>
                      <option value="valid">Valid</option>
                      <option value="pending">Pending</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SEDEX */}
              <div style={styles.cardContainer}>
                <h4 style={styles.cardTitle}>SEDEX</h4>
                <div style={styles.gridContainer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Last Audit Date</label>
                    <input
                      type="date"
                      {...register("sedex_last_audit_date")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Rating</label>
                    <input
                      type="text"
                      {...register("sedex_rating")}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Validity</label>
                    <input
                      type="date"
                      {...register("sedex_validity")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Remaining</label>
                    <input
                      type="number"
                      {...register("sedex_validity_days_remaining")}
                      style={{...styles.input, ...styles.readOnlyInput}}
                      readOnly
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Status</label>
                    <select {...register("sedex_status")} style={styles.select}>
                      <option value="">Select Status</option>
                      <option value="valid">Valid</option>
                      <option value="pending">Pending</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* WRAP */}
              <div style={styles.cardContainer}>
                <h4 style={styles.cardTitle}>WRAP</h4>
                <div style={styles.gridContainer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Last Audit Date</label>
                    <input
                      type="date"
                      {...register("wrap_last_audit_date")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Rating</label>
                    <input
                      type="text"
                      {...register("wrap_rating")}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Validity</label>
                    <input
                      type="date"
                      {...register("wrap_validity")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Remaining</label>
                    <input
                      type="number"
                      {...register("wrap_validity_days_remaining")}
                      style={{...styles.input, ...styles.readOnlyInput}}
                      readOnly
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Status</label>
                    <select {...register("wrap_status")} style={styles.select}>
                      <option value="">Select Status</option>
                      <option value="valid">Valid</option>
                      <option value="pending">Pending</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Security Audit */}
              <div style={styles.cardContainer}>
                <h4 style={styles.cardTitle}>Security Audit</h4>
                <div style={styles.gridContainer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Last Audit Date</label>
                    <input
                      type="date"
                      {...register("security_audit_last_date")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Rating</label>
                    <input
                      type="text"
                      {...register("security_audit_rating")}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Validity</label>
                    <input
                      type="date"
                      {...register("security_audit_validity")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Remaining</label>
                    <input
                      type="number"
                      {...register("security_audit_validity_days_remaining")}
                      style={{...styles.input, ...styles.readOnlyInput}}
                      readOnly
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Status</label>
                    <select {...register("security_audit_status")} style={styles.select}>
                      <option value="">Select Status</option>
                      <option value="valid">Valid</option>
                      <option value="pending">Pending</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Oeko-Tex */}
              <div style={styles.cardContainer}>
                <h4 style={styles.cardTitle}>Oeko-Tex</h4>
                <div style={styles.gridContainer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Validity</label>
                    <input
                      type="date"
                      {...register("oeko_tex_validity")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Remaining</label>
                    <input
                      type="number"
                      {...register("oeko_tex_validity_days_remaining")}
                      style={{...styles.input, ...styles.readOnlyInput}}
                      readOnly
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Status</label>
                    <select {...register("oeko_tex_status")} style={styles.select}>
                      <option value="">Select Status</option>
                      <option value="valid">Valid</option>
                      <option value="pending">Pending</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* GOTS */}
              <div style={styles.cardContainer}>
                <h4 style={styles.cardTitle}>GOTS</h4>
                <div style={styles.gridContainer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Validity</label>
                    <input
                      type="date"
                      {...register("gots_validity")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Remaining</label>
                    <input
                      type="number"
                      {...register("gots_validity_days_remaining")}
                      style={{...styles.input, ...styles.readOnlyInput}}
                      readOnly
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Status</label>
                    <select {...register("gots_status")} style={styles.select}>
                      <option value="">Select Status</option>
                      <option value="valid">Valid</option>
                      <option value="pending">Pending</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ISO 9001 */}
              <div style={styles.cardContainer}>
                <h4 style={styles.cardTitle}>ISO 9001</h4>
                <div style={styles.gridContainer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Validity</label>
                    <input
                      type="date"
                      {...register("iso_9001_validity")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Remaining</label>
                    <input
                      type="number"
                      {...register("iso_9001_validity_days_remaining")}
                      style={{...styles.input, ...styles.readOnlyInput}}
                      readOnly
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Status</label>
                    <select {...register("iso_9001_status")} style={styles.select}>
                      <option value="">Select Status</option>
                      <option value="valid">Valid</option>
                      <option value="pending">Pending</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Certification Remarks</label>
              <textarea
                {...register("certification_remarks")}
                style={styles.textarea}
              />
            </div>
          </div>
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>License Information</h3>
            
            <div style={styles.cardGrid}>
              {/* Trade License */}
              <div style={styles.cardContainer}>
                <h4 style={styles.cardTitle}>Trade License</h4>
                <div style={styles.gridContainer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Validity</label>
                    <input
                      type="date"
                      {...register("trade_license_validity")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Remaining</label>
                    <input
                      type="number"
                      {...register("trade_license_days_remaining")}
                      style={{...styles.input, ...styles.readOnlyInput}}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Factory License */}
              <div style={styles.cardContainer}>
                <h4 style={styles.cardTitle}>Factory License</h4>
                <div style={styles.gridContainer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Validity</label>
                    <input
                      type="date"
                      {...register("factory_license_validity")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Remaining</label>
                    <input
                      type="number"
                      {...register("factory_license_days_remaining")}
                      style={{...styles.input, ...styles.readOnlyInput}}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Fire License */}
              <div style={styles.cardContainer}>
                <h4 style={styles.cardTitle}>Fire License</h4>
                <div style={styles.gridContainer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Validity</label>
                    <input
                      type="date"
                      {...register("fire_license_validity")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Remaining</label>
                    <input
                      type="number"
                      {...register("fire_license_days_remaining")}
                      style={{...styles.input, ...styles.readOnlyInput}}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Membership */}
              <div style={styles.cardContainer}>
                <h4 style={styles.cardTitle}>Membership</h4>
                <div style={styles.gridContainer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Validity</label>
                    <input
                      type="date"
                      {...register("membership_validity")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Remaining</label>
                    <input
                      type="number"
                      {...register("membership_days_remaining")}
                      style={{...styles.input, ...styles.readOnlyInput}}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Group Insurance */}
              <div style={styles.cardContainer}>
                <h4 style={styles.cardTitle}>Group Insurance</h4>
                <div style={styles.gridContainer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Validity</label>
                    <input
                      type="date"
                      {...register("group_insurance_validity")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Remaining</label>
                    <input
                      type="number"
                      {...register("group_insurance_days_remaining")}
                      style={{...styles.input, ...styles.readOnlyInput}}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Boiler License */}
              <div style={styles.cardContainer}>
                <h4 style={styles.cardTitle}>Boiler License</h4>
                <div style={styles.gridContainer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Boiler No</label>
                    <input
                      type="text"
                      {...register("boiler_no")}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Validity</label>
                    <input
                      type="date"
                      {...register("boiler_license_validity")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Remaining</label>
                    <input
                      type="number"
                      {...register("boiler_license_days_remaining")}
                      style={{...styles.input, ...styles.readOnlyInput}}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* BERC License */}
              <div style={styles.cardContainer}>
                <h4 style={styles.cardTitle}>BERC License</h4>
                <div style={styles.gridContainer}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Validity</label>
                    <input
                      type="date"
                      {...register("berc_license_validity")}
                      onChange={handleFieldChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Remaining</label>
                    <input
                      type="number"
                      {...register("berc_days_remaining")}
                      style={{...styles.input, ...styles.readOnlyInput}}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>License Remarks</label>
              <textarea
                {...register("license_remarks")}
                style={styles.textarea}
              />
            </div>
          </div>
          </>
        );

      case "compliance":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Compliance Information</h3>
            
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Compliance Status</label>
                <select {...register("compliance_status")} style={styles.select}>
                  <option value="under_review">Under Review</option>
                  <option value="compliant">Compliant</option>
                  <option value="non_compliant">Non-Compliant</option>
                  <option value="conditional">Conditional Approval</option>
                </select>
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Compliance Remarks</label>
                <textarea
                  {...register("compliance_remarks")}
                  style={styles.textarea}
                />
              </div>
            </div>

            <div style={styles.sectionHeader}>Grievance Management</div>
            <div style={styles.gridContainer}>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("grievance_mechanism")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Grievance Mechanism Available</label>
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Grievance Resolution Procedure</label>
                <textarea
                  {...register("grievance_resolution_procedure")}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Grievance Resolution Date</label>
                <input
                  type="date"
                  {...register("last_grievance_resolution_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Grievance Resolution Rate (%)</label>
                <input
                  type="number"
                  {...register("grievance_resolution_rate")}
                  style={styles.input}
                  min="0"
                  max="100"
                />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Grievance Remarks</label>
                <textarea
                  {...register("grievance_remarks")}
                  style={styles.textarea}
                />
              </div>
            </div>
          </div>
        );

      case "environment":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Environmental Information</h3>
            
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Water Test Report DOE</label>
                <input
                  type="date"
                  {...register("water_test_report_doe")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>ZDHC Water Test Report</label>
                <input
                  type="date"
                  {...register("zdhc_water_test_report")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Higg FEM Self Assessment Score</label>
                <input
                  type="number"
                  {...register("higg_fem_self_assessment_score")}
                  style={styles.input}
                  min="0"
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Higg FEM Verification Assessment Score</label>
                <input
                  type="number"
                  {...register("higg_fem_verification_assessment_score")}
                  style={styles.input}
                  min="0"
                />
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("behive_chemical_inventory")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Behive Chemical Inventory</label>
              </div>
            </div>
          </div>
        );

      case "safety":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Fire Safety</h3>
            
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Fire Training By FSCD</label>
                <input
                  type="date"
                  {...register("last_fire_training_by_fscd")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Next Fire Training Date (FSCD)</label>
                <input
                  type="date"
                  {...register("fscd_next_fire_training_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Fire Drill Record By FSCD</label>
                <input
                  type="date"
                  {...register("last_fire_drill_record_by_fscd")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Next Drill Date (FSCD)</label>
                <input
                  type="date"
                  {...register("fscd_next_drill_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Fire Fighter/Rescue/First Aider (FSCD)</label>
                <input
                  type="number"
                  {...register("total_fire_fighter_rescue_first_aider_fscd")}
                  style={styles.input}
                  min="0"
                />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Fire Safety Remarks</label>
                <textarea
                  {...register("fire_safety_remarks")}
                  style={styles.textarea}
                />
              </div>
            </div>
          </div>
        );

      case "rsc":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Accord RSC Information</h3>
            
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>RSC ID</label>
                <input
                  type="text"
                  {...register("rsc_id")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Progress Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("progress_rate")}
                  style={styles.input}
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div style={styles.sectionHeader}>Structural Safety</div>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Initial Audit Date</label>
                <input
                  type="date"
                  {...register("structural_initial_audit_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Initial Findings</label>
                <input
                  type="number"
                  {...register("structural_initial_findings")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Follow-up Audit Date</label>
                <input
                  type="date"
                  {...register("structural_last_follow_up_audit_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Findings</label>
                <input
                  type="number"
                  {...register("structural_total_findings")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Corrected</label>
                <input
                  type="number"
                  {...register("structural_total_corrected")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total In Progress</label>
                <input
                  type="number"
                  {...register("structural_total_in_progress")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Pending Verification</label>
                <input
                  type="number"
                  {...register("structural_total_pending_verification")}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.sectionHeader}>Fire Safety</div>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Initial Audit Date</label>
                <input
                  type="date"
                  {...register("fire_initial_audit_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Initial Findings</label>
                <input
                  type="number"
                  {...register("fire_initial_findings")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Follow-up Audit Date</label>
                <input
                  type="date"
                  {...register("fire_last_follow_up_audit_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Findings</label>
                <input
                  type="number"
                  {...register("fire_total_findings")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Corrected</label>
                <input
                  type="number"
                  {...register("fire_total_corrected")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total In Progress</label>
                <input
                  type="number"
                  {...register("fire_total_in_progress")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Pending Verification</label>
                <input
                  type="number"
                  {...register("fire_total_pending_verification")}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.sectionHeader}>Electrical Safety</div>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Initial Audit Date</label>
                <input
                  type="date"
                  {...register("electrical_initial_audit_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Initial Findings</label>
                <input
                  type="number"
                  {...register("electrical_initial_findings")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Follow-up Audit Date</label>
                <input
                  type="date"
                  {...register("electrical_last_follow_up_audit_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Findings</label>
                <input
                  type="number"
                  {...register("electrical_total_findings")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Corrected</label>
                <input
                  type="number"
                  {...register("electrical_total_corrected")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total In Progress</label>
                <input
                  type="number"
                  {...register("electrical_total_in_progress")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Pending Verification</label>
                <input
                  type="number"
                  {...register("electrical_total_pending_verification")}
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        );

      case "csr":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>CSR & Wages Information</h3>
            
            <div style={styles.sectionHeader}>Wages & Benefits</div>
            <div style={styles.checkboxGrid}>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("minimum_wages_paid")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Minimum Wages Paid</label>
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("earn_leave_status")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Earn leave status</label>
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("service_benefit")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Service Benefit</label>
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("maternity_benefit")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Maternity Benefit</label>
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("yearly_increment")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Yearly Increment</label>
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("festival_bonus")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Festival Bonus</label>
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("salary_due_status")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Salary Due Status</label>
              </div>
            </div>
            
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Due Salary Month</label>
                <input
                  type="text"
                  {...register("due_salary_month")}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.sectionHeader}>CSR Activities</div>
            <div style={styles.checkboxGrid}>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("donation_local_community")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Donation to Local Community</label>
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("tree_plantation_local_community")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Tree Plantation in Local Community</label>
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("sanitary_napkin_status")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Sanitary Napkin Status</label>
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("fair_shop")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Fair Shop</label>
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("any_gift_provided_during_festival")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Any Gift Provided During Festival</label>
              </div>
            </div>
          </div>
        );

      case "documents":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Documents & Certificates</h3>
            <p style={styles.fileStatusText}>
              View, replace or remove the files saved for this supplier. Changes are applied when you click
              Update Supplier.
            </p>
            <div style={styles.gridContainer}>
              {DOCUMENT_FIELDS.map(([fieldName, label]) => (
                <FileInput key={fieldName} fieldName={fieldName} registerOptions={{ label }} />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={styles.mainContainer} className="sup-form">
      <style>{SUPPLIER_FORM_CSS}</style>
        <Sidebar />
        <div style={styles.contentContainer}>
          <p style={styles.loadingText}>Loading supplier data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.mainContainer} className="sup-form">
      <style>{SUPPLIER_FORM_CSS}</style>
      <ToastContainer position="top-right" autoClose={3500} />
      <Sidebar />

      <div style={styles.contentContainer}>
        <h1 style={styles.header}>Edit Supplier</h1>

        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>Edit Supplier Information</h2>

          <div style={styles.tabContainer}>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "basic" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("basic")}
            >
              Basic Info
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "production" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("production")}
            >
              Production
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "certifications" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("certifications")}
            >
              Certifications
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "compliance" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("compliance")}
            >
              Compliance
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "environment" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("environment")}
            >
              Environment
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "safety" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("safety")}
            >
              Fire Safety
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "rsc" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("rsc")}
            >
              RSC Audit
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "csr" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("csr")}
            >
              CSR
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "documents" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("documents")}
            >
              Documents
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {renderTabContent()}

            <div style={styles.formButtons}>
              <button
                type="button"
                onClick={() => navigate("/suppliers")}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                Update Supplier
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSupplier;
