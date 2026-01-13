// AddSupplier.jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../merchandiser/Sidebar.jsx";
import { useNavigate } from "react-router-dom";

const AddSupplier = () => {
  const [activeTab, setActiveTab] = useState("basic");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const styles = {
    mainContainer: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f3f4f6",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
      "&:hover": {
        color: "#2563eb",
      },
      whiteSpace: "nowrap",
      flexShrink: 0,
    },
    activeTab: {
      color: "#2563eb",
      borderBottomColor: "#2563eb",
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
      gridColumn: "1 / -1",
    },
    cardTitle: {
      fontWeight: "600",
      marginBottom: "1.25rem",
      fontSize: "1rem",
      color: "#111827",
      borderBottom: "1px solid #e5e7eb",
      paddingBottom: "0.5rem",
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
      "&:focus": {
        outline: "none",
        borderColor: "#2563eb",
        boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
      },
    },
    textarea: {
      width: "100%",
      padding: "0.5rem 0.75rem",
      borderRadius: "0.375rem",
      border: "1px solid #d1d5db",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      fontSize: "0.875rem",
      minHeight: "80px",
      resize: "vertical",
      "&:focus": {
        outline: "none",
        borderColor: "#2563eb",
        boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
      },
    },
    select: {
      width: "100%",
      padding: "0.5rem 0.75rem",
      borderRadius: "0.375rem",
      border: "1px solid #d1d5db",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      fontSize: "0.875rem",
      "&:focus": {
        outline: "none",
        borderColor: "#2563eb",
        boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
      },
    },
    checkbox: {
      height: "1rem",
      width: "1rem",
      borderRadius: "0.25rem",
      border: "1px solid #d1d5db",
      cursor: "pointer",
      "&:focus": {
        outline: "none",
        borderColor: "#2563eb",
        boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
      },
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
      "&:hover": {
        backgroundColor: "#f3f4f6",
      },
      width: "120px",
    },
    submitButton: {
      padding: "6px 12px",
      border: "1px solid transparent",
      borderRadius: "0.375rem",
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "white",
      backgroundColor: "#2563eb",
      cursor: "pointer",
      transition: "background-color 0.2s",
      "&:hover": {
        backgroundColor: "#1d4ed8",
      },
      width: "120px",
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
    sectionHeader: {
      fontSize: "0.875rem",
      fontWeight: "600",
      color: "#4b5563",
      margin: "1rem 0 0.5rem 0",
      paddingBottom: "0.25rem",
      borderBottom: "1px solid #e5e7eb",
    },
    checkboxGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "0.5rem",
      marginBottom: "1rem",
    },
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    
    // Convert boolean fields properly
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === 'boolean') {
        formData.append(key, data[key] ? 'true' : 'false');
      } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });

    try {
      await axios.post(
        `http://119.148.51.38:8000/api/merchandiser/api/supplier/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success("Supplier added successfully");
      setTimeout(() => navigate("/suppliers"), 1500);
    } catch (error) {
      const serverErrors = error.response?.data;
      if (serverErrors) {
        for (const key in serverErrors) {
          toast.error(`${key}: ${serverErrors[key][0]}`);
        }
      } else {
        toast.error("Failed to add supplier. Check input data and try again.");
      }
      console.error("Create error:", serverErrors || error.message);
    }
  };

  const tabs = [
    { key: "basic", label: "Basic Information" },
    { key: "building", label: "Building & Manpower" },
    { key: "production", label: "Production & Financial" },
    { key: "certifications", label: "Certifications" },
    { key: "licenses", label: "Licenses" },
    { key: "safety", label: "Safety & Compliance" },
    { key: "csr", label: "CSR & Wages" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Basic Information</h3>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>SL No</label>
                <input
                  type="number"
                  {...register("sl_no")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Supplier Name / Factory Name *</label>
                <input
                  type="text"
                  {...register("supplier_name", { required: "Supplier name is required" })}
                  style={styles.input}
                />
                {errors.supplier_name && (
                  <p style={styles.errorText}>{errors.supplier_name.message}</p>
                )}
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Supplier ID *</label>
                <input
                  type="text"
                  {...register("supplier_id", { required: "Supplier ID is required" })}
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
                  style={styles.textarea}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Supplier Category</label>
                <input
                  type="text"
                  {...register("supplier_category")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Year of Establishment</label>
                <input
                  type="number"
                  {...register("year_of_establishment")}
                  style={styles.input}
                  min="1900"
                  max="2100"
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Ownership Details</label>
                <textarea
                  {...register("ownership_details")}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Weekly Holiday</label>
                <input
                  type="text"
                  {...register("weekly_holiday")}
                  style={styles.input}
                  defaultValue="Friday"
                />
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

      case "building":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Building & Manpower Information</h3>
            
            <div style={styles.sectionHeader}>Building Type</div>
            <div style={styles.checkboxGrid}>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("rented_building")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Rented building</label>
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("share_building")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Share building</label>
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("own_property")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Own Property</label>
              </div>
            </div>

            <div style={styles.sectionHeader}>Building Details</div>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Area (sq ft)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("total_area")}
                  style={styles.input}
                  min="0"
                />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Building Details</label>
                <textarea
                  {...register("building_details")}
                  style={styles.textarea}
                />
              </div>
            </div>

            <div style={styles.sectionHeader}>Contact Persons</div>
            <div style={styles.gridContainer}>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Factory Main Contact Person</label>
                <textarea
                  {...register("factory_main_contact")}
                  style={styles.textarea}
                />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Factory Merchandiser Department Contact</label>
                <textarea
                  {...register("factory_merchandiser_contact")}
                  style={styles.textarea}
                />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Factory HR/Compliance Contact Person</label>
                <textarea
                  {...register("factory_hr_compliance_contact")}
                  style={styles.textarea}
                />
              </div>
            </div>

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
                  style={styles.input}
                  min="0"
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
          </div>
        );

      case "production":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Production & Financial Information</h3>
            
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
                <label style={styles.label}>Manufacturing Item</label>
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
                <label style={styles.label}>Number of Sewing Line</label>
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
            </div>

            <div style={styles.sectionHeader}>Customer Information</div>
            <div style={styles.gridContainer}>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Existing Customer (%)</label>
                <textarea
                  {...register("existing_customer")}
                  style={styles.textarea}
                />
              </div>
            </div>

            <div style={styles.sectionHeader}>Financial Information</div>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Yearly Turnover (in USD)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("yearly_turnover_usd")}
                  style={styles.input}
                  min="0"
                />
              </div>
            </div>
          </div>
        );

      case "certifications":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Certifications</h3>
            
            <div style={styles.sectionHeader}>BSCI</div>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Audit Date</label>
                <input
                  type="date"
                  {...register("bsci_last_audit_date")}
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
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Days Remaining</label>
                <input
                  type="number"
                  {...register("bsci_validity_days_remaining")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Status</label>
                <input
                  type="text"
                  {...register("bsci_status")}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.sectionHeader}>SEDEX</div>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Audit Date</label>
                <input
                  type="date"
                  {...register("sedex_last_audit_date")}
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
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Days Remaining</label>
                <input
                  type="number"
                  {...register("sedex_validity_days_remaining")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Status</label>
                <input
                  type="text"
                  {...register("sedex_status")}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.sectionHeader}>WRAP</div>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Audit Date</label>
                <input
                  type="date"
                  {...register("wrap_last_audit_date")}
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
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Days Remaining</label>
                <input
                  type="number"
                  {...register("wrap_validity_days_remaining")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Status</label>
                <input
                  type="text"
                  {...register("wrap_status")}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.sectionHeader}>Other Certifications</div>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Security Audit Last Date</label>
                <input
                  type="date"
                  {...register("security_audit_last_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>OEKO-TEX Validity</label>
                <input
                  type="date"
                  {...register("oeko_tex_validity")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>GOTS Validity</label>
                <input
                  type="date"
                  {...register("gots_validity")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>ISO 9001-2015 Validity</label>
                <input
                  type="date"
                  {...register("iso_9001_validity")}
                  style={styles.input}
                />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Certification Remarks</label>
                <textarea
                  {...register("certification_remarks")}
                  style={styles.textarea}
                />
              </div>
            </div>
          </div>
        );

      case "licenses":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>License Information</h3>
            
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Trade License Validity</label>
                <input
                  type="date"
                  {...register("trade_license_validity")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Factory License Validity</label>
                <input
                  type="date"
                  {...register("factory_license_validity")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Fire License Validity</label>
                <input
                  type="date"
                  {...register("fire_license_validity")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Membership Validity</label>
                <input
                  type="date"
                  {...register("membership_validity")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Group Insurance Validity</label>
                <input
                  type="date"
                  {...register("group_insurance_validity")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Boiler License Validity</label>
                <input
                  type="date"
                  {...register("boiler_license_validity")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Boiler No</label>
                <input
                  type="text"
                  {...register("boiler_no")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>BERC License Validity</label>
                <input
                  type="date"
                  {...register("berc_license_validity")}
                  style={styles.input}
                />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>License Remarks</label>
                <textarea
                  {...register("license_remarks")}
                  style={styles.textarea}
                />
              </div>
            </div>
          </div>
        );

      case "safety":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Safety & Compliance Information</h3>
            
            <div style={styles.sectionHeader}>Fire Safety</div>
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
                <label style={styles.label}>FSCD Next Fire Training Date</label>
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
                <label style={styles.label}>FSCD Next Drill Date</label>
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

            <div style={styles.sectionHeader}>Accord RSC</div>
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

            <div style={styles.sectionHeader}>Environmental</div>
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
                <label style={styles.label}>ZDHC Water test Report</label>
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
                <label style={styles.label}>Behive Chemical Inventory</label>
                <input
                  type="checkbox"
                  {...register("behive_chemical_inventory")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Enabled</label>
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
                <label style={styles.checkboxLabel}>Donation Local Community</label>
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("tree_plantation_local_community")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>Tree Plantation local community</label>
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

      default:
        return null;
    }
  };

  return (
    <div style={styles.mainContainer}>
      <Sidebar />
      <div style={styles.contentContainer}>
        <h1 style={styles.header}>Add Supplier</h1>
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>New Supplier Information</h2>
          <div style={styles.tabContainer}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === tab.key ? styles.activeTab : {}),
                }}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
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
                Save Supplier
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSupplier;