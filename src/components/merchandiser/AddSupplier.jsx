// AddSupplier.jsx - UPDATED VERSION with correct field mappings
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
    setValue,
  } = useForm();

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

  const onSubmit = async (data) => {
    // Calculate total manpower if not provided
    if (!data.total_manpower) {
      const total = 
        (parseInt(data.manpower_workers_male) || 0) +
        (parseInt(data.manpower_workers_female) || 0) +
        (parseInt(data.manpower_staff_male) || 0) +
        (parseInt(data.manpower_staff_female) || 0);
      data.total_manpower = total > 0 ? total : null;
    }

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
    { key: "production", label: "Production" },
    { key: "certifications", label: "Certifications" },
    { key: "licenses", label: "Licenses" },
    { key: "safety", label: "Fire Safety" },
    { key: "compliance", label: "Compliance" },
    { key: "environment", label: "Environment" },
    { key: "rsc", label: "RSC Audit" },
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
                <select {...register("supplier_category")} style={styles.select}>
                  <option value="">Select Category</option>
                  <option value="Woven">Woven</option>
                  <option value="Sweater">Sweater</option>
                  <option value="Knit & Lingerie">Knit & Lingerie</option>
                  <option value="Knit">Knit</option>
                  <option value="Lingerie">Lingerie</option>
                </select>
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
                <label style={styles.label}>Factory Main Contact</label>
                <input
                  type="text"
                  {...register("factory_main_contact")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Factory Merchandiser Contact</label>
                <input
                  type="text"
                  {...register("factory_merchandiser_contact")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Factory HR/Compliance Contact</label>
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
          </div>
        );

      case "production":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Production Information</h3>
            
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
                      <option value="active">Active</option>
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
                      <option value="active">Active</option>
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
                      <option value="active">Active</option>
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
                      <option value="active">Active</option>
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
                      <option value="active">Active</option>
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
                      <option value="active">Active</option>
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
                      <option value="active">Active</option>
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
        );

      case "licenses":
        return (
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