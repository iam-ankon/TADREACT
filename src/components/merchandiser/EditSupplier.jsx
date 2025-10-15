import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../merchandiser/Sidebar.jsx";
import { useNavigate, useParams } from "react-router-dom";

const EditSupplier = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [existingFiles, setExistingFiles] = useState({
    agreement_contract_file: null,
    agreement_vendor_signing_copy: null,
    attachment: null,
    image_file: null,
    attachment_file: null,
    shared_file: null,
  });
  const [activeTab, setActiveTab] = useState("basic");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm();
  // Inline CSS Styles
  const styles = {
    mainContainer: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f3f4f6",
    },
    contentContainer: {
      flex: 1,
      padding: "1rem",
      marginLeft: "0",
      overflowY: "auto",
      maxHeight: "100vh", // Adjust based on sidebar width
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
      minHeight: "100px",
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
      appearance: "none",
      backgroundImage:
        'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 0.5rem center",
      backgroundSize: "0.65rem auto",
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
      "&:hover": {
        backgroundColor: "#1d4ed8",
      },
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
  };
  // Fetch supplier data on component mount
  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://119.148.51.38:8000/api/merchandiser/api/supplier/${id}/`
        );
        const data = response.data;

        // Format dates for date inputs
        const formattedData = {
          ...data,
          issue_date: data.issue_date ? data.issue_date.split("T")[0] : "",
          expiry_date: data.expiry_date ? data.expiry_date.split("T")[0] : "",
          factory_related_since: data.factory_related_since
            ? data.factory_related_since.split("T")[0]
            : "",
          latest_audit_date: data.latest_audit_date
            ? data.latest_audit_date.split("T")[0]
            : "",
          latest_audit_expiry_date: data.latest_audit_expiry_date
            ? data.latest_audit_expiry_date.split("T")[0]
            : "",
          latest_audit_report_date: data.latest_audit_report_date
            ? data.latest_audit_report_date.split("T")[0]
            : "",
          deactivation_date: data.deactivation_date
            ? data.deactivation_date.split("T")[0]
            : "",
          planned_inactivation_date: data.planned_inactivation_date
            ? data.planned_inactivation_date.split("T")[0]
            : "",
          contract_sign_date: data.contract_sign_date
            ? data.contract_sign_date.split("T")[0]
            : "",
          agreement_signature_due_date: data.agreement_signature_due_date
            ? data.agreement_signature_due_date.split("T")[0]
            : "",
          agreement_expiry_date: data.agreement_expiry_date
            ? data.agreement_expiry_date.split("T")[0]
            : "",
          agreement_accepted_on: data.agreement_accepted_on
            ? data.agreement_accepted_on.split("T")[0]
            : "",
          shared_file_effective_from: data.shared_file_effective_from
            ? data.shared_file_effective_from.split("T")[0]
            : "",
          shared_file_effective_to: data.shared_file_effective_to
            ? data.shared_file_effective_to.split("T")[0]
            : "",
          image_last_modified_on: data.image_last_modified_on
            ? data.image_last_modified_on.slice(0, 16)
            : "",
          attachment_last_modified_on: data.attachment_last_modified_on
            ? data.attachment_last_modified_on.slice(0, 16)
            : "",
        };

        reset(formattedData);
        setExistingFiles({
          agreement_contract_file: data.agreement_contract_file || null,
          agreement_vendor_signing_copy:
            data.agreement_vendor_signing_copy || null,
          attachment: data.attachment || null,
          image_file: data.image_file || null,
          attachment_file: data.attachment_file || null,
          shared_file: data.shared_file || null,
        });
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

    // Append all non-file fields
    Object.keys(data).forEach((key) => {
      if (
        key !== "agreement_contract_file" &&
        key !== "agreement_vendor_signing_copy" &&
        key !== "attachment" &&
        key !== "image_file" &&
        key !== "attachment_file" &&
        key !== "shared_file"
      ) {
        formData.append(key, data[key] || "");
      }
    });

    // Only append files if they were actually selected
    if (data.agreement_contract_file instanceof File) {
      formData.append("agreement_contract_file", data.agreement_contract_file);
    }

    if (data.agreement_vendor_signing_copy instanceof File) {
      formData.append(
        "agreement_vendor_signing_copy",
        data.agreement_vendor_signing_copy
      );
    }

    if (data.attachment instanceof File) {
      formData.append("attachment", data.attachment);
    }

    if (data.image_file instanceof File) {
      formData.append("image_file", data.image_file);
    }
    if (data.attachment_file instanceof File) {
      formData.append("attachment_file", data.attachment_file);
    }

    if (data.shared_file instanceof File) {
      formData.append("shared_file", data.shared_file);
    }

    // Handle file uploads
    const appendFileIfExists = (fieldName, fileData) => {
      if (fileData && fileData[0] instanceof File) {
        formData.append(fieldName, fileData[0]);
      }
    };

    appendFileIfExists("agreement_contract_file", data.agreement_contract_file);
    appendFileIfExists(
      "agreement_vendor_signing_copy",
      data.agreement_vendor_signing_copy
    );
    appendFileIfExists("attachment", data.attachment);
    appendFileIfExists("image_file", data.image_file);
    appendFileIfExists("attachment_file", data.attachment_file);
    appendFileIfExists("shared_file", data.shared_file);

    try {
      await axios.put(
        `http://119.148.51.38:8000/api/merchandiser/api/supplier/${id}/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Supplier updated successfully");
      setTimeout(() => {
        navigate("/suppliers");
      }, 1500);
    } catch (error) {
      console.error("Update error:", error.response?.data || error.message);
      toast.error("Failed to update supplier. Check input data and try again.");
    }
  };

  // Tabs for different sections
  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <div style={styles.gridContainer}>
            {/* Vendor Information */}
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>Vendor Information</h3>
              <div style={styles.flexCol}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Vendor ID</label>
                  <input
                    type="text"
                    {...register("vendor_id")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Reference No</label>
                  <input
                    type="text"
                    {...register("reference_no")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Short Name</label>
                  <input
                    type="text"
                    {...register("short_name")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Local Name</label>
                  <input
                    type="text"
                    {...register("local_name")}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Company Names */}
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>Company Names</h3>
              <div style={styles.flexCol}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Name</label>
                  <input
                    type="text"
                    {...register("name", { required: "Name is required" })}
                    style={styles.input}
                  />
                  {errors.name && (
                    <p style={styles.errorText}>{errors.name.message}</p>
                  )}
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Name 1</label>
                  <input
                    type="text"
                    {...register("name_1")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Name 2</label>
                  <input
                    type="text"
                    {...register("name_2")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Name 3</label>
                  <input
                    type="text"
                    {...register("name_3")}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Vendor Status */}
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>Vendor Status</h3>
              <div style={styles.flexCol}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Vendor Type</label>
                  <input
                    type="text"
                    {...register("vendor_type")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Holding Group</label>
                  <input
                    type="text"
                    {...register("holding_group")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Business Registration No :</label>
                  <input
                    type="text"
                    {...register("business_type")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Place of Incorporation:</label>
                  <input
                    type="text"
                    {...register("place_of_incorporation")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.flexRow}>
                  <input
                    type="checkbox"
                    {...register("vendor_access_creation")}
                    style={styles.checkbox}
                  />
                  <label style={styles.checkboxLabel}>
                    Vendor Access Creation
                  </label>
                </div>
              </div>
            </div>

            {/* General Contact */}
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>General Contact</h3>
              <div style={styles.flexCol}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>About us:</label>
                  <input
                    type="text"
                    {...register("about_us")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Company Tel. No</label>
                  <input
                    type="text"
                    {...register("company_phone")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Company Email:</label>
                  <input
                    type="email"
                    {...register("email")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Company Website:</label>
                  <input
                    type="url"
                    {...register("website")}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>General</h3>
              <div style={styles.flexCol}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Preferred Language:</label>
                  <input
                    type="text"
                    {...register("preferred_language")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Deactivation date:</label>
                  <input
                    type="date"
                    {...register("deactivation_date")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Planned inactivation date:</label>
                  <input
                    type="date"
                    {...register("planned_inactivation_date")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Vendor Rating:</label>
                  <input
                    type="text"
                    {...register("vendor_rating")}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>Group</h3>
              <div style={styles.flexCol}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Purchasing Group:</label>
                  <input
                    type="text"
                    {...register("purchasing_group")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Contract Sign Date:</label>
                  <input
                    type="date"
                    {...register("contract_sign_date")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Deactivation Reason:</label>
                  <input
                    type="text"
                    {...register("deactivation_reason")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Capability:</label>
                  <input
                    type="text"
                    {...register("capability")}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case "address":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Address (Default)</h3>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Address Type</label>
                <input
                  type="text"
                  {...register("address_type")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Country/Region</label>
                <input
                  type="text"
                  {...register("address_country_region")}
                  style={styles.input}
                />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Street</label>
                <textarea
                  {...register("address_street")}
                  rows={2}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Town/City</label>
                <input
                  type="text"
                  {...register("address_town_city")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>GPS Longitude</label>
                <input
                  type="text"
                  {...register("address_gps_lng")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>GPS Latitude</label>
                <input
                  type="text"
                  {...register("address_gps_lat")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Postal Code</label>
                <input
                  type="text"
                  {...register("address_postal_code")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Port of Loading/Discharge</label>
                <input
                  type="text"
                  {...register("address_port_of_loading_discharge")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Language</label>
                <input
                  type="text"
                  {...register("address_language")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>GPS Description</label>
                <textarea
                  {...register("address_gps_text")}
                  rows={2}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Inactive Address</label>
                <input
                  type="checkbox"
                  {...register("address_inactive")}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>EU Country</label>
                <input
                  type="checkbox"
                  {...register("address_eu_country")}
                  style={styles.checkbox}
                />
              </div>
            </div>

            <h3 style={{ ...styles.cardTitle, marginTop: "2rem" }}>
              Contact 1 (Default)
            </h3>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Contact Type</label>
                <input
                  type="text"
                  {...register("contact1_type")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Texweave Access</label>
                <input
                  type="checkbox"
                  {...register("contact1_texweave_access")}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Title</label>
                <input
                  type="text"
                  {...register("contact1_title")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>First Name</label>
                <input
                  type="text"
                  {...register("contact1_first_name")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Name</label>
                <input
                  type="text"
                  {...register("contact1_last_name")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Position</label>
                <input
                  type="text"
                  {...register("contact1_position")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Telephone</label>
                <input
                  type="text"
                  {...register("contact1_tel")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Mobile</label>
                <input
                  type="text"
                  {...register("contact1_mobile")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  {...register("contact1_email")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Department</label>
                <input
                  type="text"
                  {...register("contact1_department")}
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        );
      case "Shipment_Terms":
        return (
          <div style={styles.gridContainer}>
            {/* Address */}
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>Shipment Terms</h3>
              <div style={styles.flexCol}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Incoterm:</label>
                  <input
                    type="text"
                    {...register("incoterm")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Avg. Lead Time (days):</label>
                  <input
                    type="number"
                    {...register("avg_lead_time_days")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Payment Method:</label>
                  <input
                    type="text"
                    {...register("payment_method")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Payment Term:</label>
                  <input
                    type="text"
                    {...register("payment_term")}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Default Contact Person */}
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>Cash</h3>
              <div style={styles.flexCol}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Currency:</label>
                  <input
                    type="text"
                    {...register("currency")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Cash Discount:</label>
                  <input
                    type="text"
                    {...register("cash_discount")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Liability Insurance:</label>
                  <input
                    type="text"
                    {...register("liability_insurance")}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Export License No.:</label>
                  <input
                    type="text"
                    {...register("export_license_no")}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case "agreements":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Agreements</h3>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Agreement Code</label>
                <input
                  type="text"
                  {...register("agreement_code")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Agreement Name</label>
                <input
                  type="text"
                  {...register("agreement_name")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Agreement Type</label>
                <input
                  type="text"
                  {...register("agreement_type")}
                  style={styles.input}
                />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Agreement Description</label>
                <textarea
                  {...register("agreement_description")}
                  rows={3}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Agreement Status</label>
                <select {...register("agreement_status")} style={styles.select}>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Document Status</label>
                <select
                  {...register("agreement_doc_status")}
                  style={styles.select}
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Signature Due Date</label>
                <input
                  type="date"
                  {...register("agreement_signature_due_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Expiry Date</label>
                <input
                  type="date"
                  {...register("agreement_expiry_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Accepted On</label>
                <input
                  type="date"
                  {...register("agreement_accepted_on")}
                  style={styles.input}
                />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Instruction to Vendor</label>
                <textarea
                  {...register("agreement_instruction_to_vendor")}
                  rows={3}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Vendor Action Required</label>
                <input
                  type="checkbox"
                  {...register("agreement_vendor_action_required")}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Contract File</label>
                {existingFiles.agreement_contract_file && (
                  <div style={{ marginBottom: "5px" }}>
                    <p>
                      Current file:{" "}
                      <a
                        href={existingFiles.agreement_contract_file}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      Leave blank to keep existing file
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  {...register("agreement_contract_file")}
                  style={styles.input}
                  onChange={(e) => {
                    // Clear the field if no file selected
                    if (e.target.files.length === 0) {
                      setValue("agreement_contract_file", null);
                    }
                  }}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Vendor Signing Copy</label>
                {existingFiles.agreement_vendor_signing_copy && (
                  <div style={{ marginBottom: "5px" }}>
                    <p>
                      Current file:{" "}
                      <a
                        href={existingFiles.agreement_vendor_signing_copy}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      Leave blank to keep existing file
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  {...register("agreement_vendor_signing_copy")}
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        );
      case "qa":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>QA Assessment</h3>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>QA Rank</label>
                <input
                  type="text"
                  {...register("qa_rank")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Assessment Level</label>
                <input
                  type="text"
                  {...register("qa_assessment_level")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Risk Level</label>
                <input
                  type="text"
                  {...register("qa_risk_level")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Performance Level</label>
                <input
                  type="text"
                  {...register("qa_performance_level")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>QA Score</label>
                <input
                  type="text"
                  {...register("qa_score")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Disposal Licensing</label>
                <input
                  type="text"
                  {...register("qa_disposal_licensing")}
                  style={styles.input}
                />
              </div>
              <div style={styles.flexRow}>
                <input
                  type="checkbox"
                  {...register("qa_accredited")}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>QA Accredited</label>
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>QA Summary</label>
                <textarea
                  {...register("qa_summary")}
                  rows={3}
                  style={styles.textarea}
                />
              </div>
            </div>
          </div>
        );
      case "classification":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Classification</h3>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Classification Code</label>
                <input
                  type="text"
                  {...register("classification_code")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Classification Name</label>
                <input
                  type="text"
                  {...register("classification_name")}
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        );
      case "Financial_Details":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Financial Details</h3>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Account Name</label>
                <input
                  type="text"
                  {...register("account_name")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Account No.</label>
                <input
                  type="text"
                  {...register("account_no")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Account No. 2</label>
                <input
                  type="text"
                  {...register("account_no_2")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Bank Key</label>
                <input
                  type="text"
                  {...register("bank_key")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Bank Name</label>
                <input
                  type="text"
                  {...register("bank_name")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Country of bank</label>
                <input
                  type="text"
                  {...register("country_of_bank")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Bank Code / Swift Code</label>
                <input
                  type="text"
                  {...register("bank_code_swift_code")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Discount Rate</label>
                <input
                  type="text"
                  {...register("discount_rate")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Annual Turnover</label>
                <input
                  type="text"
                  {...register("total_annual_turnover")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Export Annual Turnover</label>
                <input
                  type="text"
                  {...register("export_annual_turnover")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Credit Report</label>
                <input
                  type="text"
                  {...register("credit_report")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Credit Limit</label>
                <input
                  type="text"
                  {...register("credit_limit")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Agent Payment</label>
                <input
                  type="text"
                  {...register("agent_payment")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Super Bonus</label>
                <input
                  type="text"
                  {...register("super_bonus")}
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
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Certification Type</label>
                <input
                  type="text"
                  {...register("certification_type")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Certification Name</label>
                <input
                  type="text"
                  {...register("certification_name")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Certification Number</label>
                <input
                  type="text"
                  {...register("certification_number")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Issue Date</label>
                <input
                  type="date"
                  {...register("issue_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Expiry Date</label>
                <input
                  type="date"
                  {...register("expiry_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Status</label>
                <input
                  type="text"
                  {...register("status")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Institute Country</label>
                <input
                  type="text"
                  {...register("institute_country")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  {...register("notes")}
                  style={{ ...styles.input, height: "80px" }}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Attachment</label>
                {existingFiles.attachment && (
                  <div style={{ marginBottom: "5px" }}>
                    <p>
                      Current file:{" "}
                      <a
                        href={existingFiles.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  {...register("attachment")}
                  style={styles.input}
                  onChange={(e) => {
                    if (e.target.files.length === 0) {
                      setValue("attachment", null);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );
      case "factories":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Factory Details</h3>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Factory Name</label>
                <input
                  type="text"
                  {...register("factory_name")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Factory ID</label>
                <input
                  type="text"
                  {...register("factory_id")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Factory Type</label>
                <input
                  type="text"
                  {...register("factory_type")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Factory Status</label>
                <input
                  type="text"
                  {...register("factory_status")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Document Status</label>
                <input
                  type="text"
                  {...register("factory_doc_status")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Vendor Ref</label>
                <input
                  type="text"
                  {...register("factory_vendor_ref")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Vendor Reverse Ref</label>
                <input
                  type="text"
                  {...register("factory_vendor_reverse_ref")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Capacity</label>
                <input
                  type="text"
                  {...register("factory_capacity")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Related Factory</label>
                <input
                  type="text"
                  {...register("factory_related")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Related Since</label>
                <input
                  type="date"
                  {...register("factory_related_since")}
                  style={styles.input}
                />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Factory Note</label>
                <textarea
                  {...register("factory_note")}
                  rows={2}
                  style={styles.textarea}
                />
              </div>

              {/* Boolean Fields */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Default Factory</label>
                <input
                  type="checkbox"
                  {...register("factory_default")}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Sync</label>
                <input
                  type="checkbox"
                  {...register("factory_sync")}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit: Social</label>
                <input
                  type="checkbox"
                  {...register("audit_social")}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit: 1st Enlistment</label>
                <input
                  type="checkbox"
                  {...register("audit_1st_enlistment")}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit: 2nd Enlistment</label>
                <input
                  type="checkbox"
                  {...register("audit_2nd_enlistment")}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit: Qualification Visit</label>
                <input
                  type="checkbox"
                  {...register("audit_qualification_visit")}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit: KIK CSR</label>
                <input
                  type="checkbox"
                  {...register("audit_kik_csr")}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit: Environmental</label>
                <input
                  type="checkbox"
                  {...register("audit_environmental")}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit: QC Visit</label>
                <input
                  type="checkbox"
                  {...register("audit_qc_visit")}
                  style={styles.checkbox}
                />
              </div>
            </div>
          </div>
        );
      case "latest_audit_report":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Latest Audit Report</h3>
            <div style={styles.gridContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit Report No</label>
                <input
                  type="text"
                  {...register("latest_audit_report_no")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit Version</label>
                <input
                  type="text"
                  {...register("latest_audit_version")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit Type</label>
                <input
                  type="text"
                  {...register("latest_audit_report_type")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit Customer</label>
                <input
                  type="text"
                  {...register("latest_audit_customer")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit Date</label>
                <input
                  type="date"
                  {...register("latest_audit_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Auditor</label>
                <input
                  type="text"
                  {...register("latest_auditor")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit Party</label>
                <input
                  type="text"
                  {...register("latest_audit_party")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit Result</label>
                <input
                  type="text"
                  {...register("latest_audit_result")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit Expiry Date</label>
                <input
                  type="date"
                  {...register("latest_audit_expiry_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit Report Date</label>
                <input
                  type="date"
                  {...register("latest_audit_report_date")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Audit Status</label>
                <input
                  type="text"
                  {...register("latest_audit_status")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Editing Status</label>
                <input
                  type="text"
                  {...register("latest_audit_editing_status")}
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        );
      case "images_attachments":
        return (
          <div style={styles.cardContainer}>
            <h3 style={styles.cardTitle}>Images & Attachments</h3>
            <div style={styles.gridContainer}>
              {/* Images Section */}
              <div style={styles.sectionHeader}>Image Information</div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Image Type</label>
                <input
                  type="text"
                  {...register("image_type")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Image Description</label>
                <input
                  type="text"
                  {...register("image_description")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Image File</label>
                {existingFiles.image_file && (
                  <div style={{ marginBottom: "5px" }}>
                    <p>
                      Current file:{" "}
                      <a
                        href={existingFiles.image_file}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  {...register("image_file")}
                  style={styles.input}
                  onChange={(e) => {
                    if (e.target.files.length === 0) {
                      setValue("image_file", null);
                    }
                  }}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Modified By</label>
                <input
                  type="text"
                  {...register("image_last_modified_by")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Modified On</label>
                <input
                  type="datetime-local"
                  {...register("image_last_modified_on")}
                  style={styles.input}
                />
              </div>

              {/* Attachments Section */}
              <div style={styles.sectionHeader}>Attachment Information</div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Attachment Type</label>
                <input
                  type="text"
                  {...register("attachment_type")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Attachment Description</label>
                <input
                  type="text"
                  {...register("attachment_description")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Attachment File</label>
                {existingFiles.attachment_file && (
                  <div style={{ marginBottom: "5px" }}>
                    <p>
                      Current file:{" "}
                      <a
                        href={existingFiles.attachment_file}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  {...register("attachment_file")}
                  style={styles.input}
                  onChange={(e) => {
                    if (e.target.files.length === 0) {
                      setValue("attachment_file", null);
                    }
                  }}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Modified By</label>
                <input
                  type="text"
                  {...register("attachment_last_modified_by")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Modified On</label>
                <input
                  type="datetime-local"
                  {...register("attachment_last_modified_on")}
                  style={styles.input}
                />
              </div>

              {/* Shared Files Section */}
              <div style={styles.sectionHeader}>Shared File Information</div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Shared File Name</label>
                <input
                  type="text"
                  {...register("shared_file_name")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Shared File Type</label>
                <input
                  type="text"
                  {...register("shared_file_type")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Shared File Description</label>
                <input
                  type="text"
                  {...register("shared_file_description")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Shared File</label>
                {existingFiles.shared_file && (
                  <div style={{ marginBottom: "5px" }}>
                    <p>
                      Current file:{" "}
                      <a
                        href={existingFiles.shared_file}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  {...register("shared_file")}
                  style={styles.input}
                  onChange={(e) => {
                    if (e.target.files.length === 0) {
                      setValue("shared_file", null);
                    }
                  }}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Shared File Details</label>
                <input
                  type="text"
                  {...register("shared_file_details")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Shared File Status</label>
                <input
                  type="text"
                  {...register("shared_file_status")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Effective From</label>
                <input
                  type="date"
                  {...register("shared_file_effective_from")}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Effective To</label>
                <input
                  type="date"
                  {...register("shared_file_effective_to")}
                  style={styles.input}
                />
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Notes</label>
                <textarea
                  {...register("shared_file_notes")}
                  style={{ ...styles.input, height: "100px" }}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={styles.mainContainer}>
        <Sidebar />
        <div style={styles.contentContainer}>
          <p style={styles.loadingText}>Loading supplier data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.mainContainer}>
      <Sidebar />

      <div style={styles.contentContainer}>
        <h1 style={styles.header}>Edit Supplier</h1>

        {/* Form */}
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>Edit Supplier Information</h2>

          {/* Tabs */}
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
                ...(activeTab === "address" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("address")}
            >
              Address & Contact
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "Shipment_Terms" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("Shipment_Terms")}
            >
              Shipment Terms
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "agreements" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("agreements")}
            >
              Agreements
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "classification" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("classification")}
            >
              Classification
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "Financial_Details" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("Financial_Details")}
            >
              Financial Details
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
                ...(activeTab === "factories" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("factories")}
            >
              Factories
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "qa" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("qa")}
            >
              QA Assessment
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "latest_audit_report"
                  ? styles.activeTab
                  : {}),
              }}
              onClick={() => setActiveTab("latest_audit_report")}
            >
              Audit Report
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "images_attachments" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("images_attachments")}
            >
              Images & Attachments
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
