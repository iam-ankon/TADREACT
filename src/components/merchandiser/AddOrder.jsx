// pages/orders/AddOrder.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder, getCustomers, } from "../../api/merchandiser";
import Sidebar from "../merchandiser/Sidebar";
import {
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaChevronRight,
  FaChevronLeft,
  FaInfoCircle,
  FaDollarSign,
  FaTruck,
  FaFlask,
  FaCheckCircle,
  FaBuilding,
  FaUser,
  FaBoxes,
  FaCalendarAlt,
  FaIndustry,
  FaRuler,
  FaChartLine,
  FaClipboardList,
  FaShoppingCart,
} from "react-icons/fa";

const statusOptions = [
  { value: "Running", label: "Running", color: "#10b981", bg: "#d1fae5" },
  { value: "Shipped", label: "Shipped", color: "#3b82f6", bg: "#dbeafe" },
  { value: "Pending", label: "Pending", color: "#f59e0b", bg: "#fed7aa" },
  { value: "Cancelled", label: "Cancelled", color: "#ef4444", bg: "#fee2e2" },
];

const garmentOptions = [
  "T-Shirt",
  "Polo Shirt",
  "Henley",
  "Tank Top",
  "Shirt",
  "Blouse",
  "Dress",
  "Skirt",
  "Pants",
  "Jeans",
  "Shorts",
  "Jacket",
  "Hoodie",
  "Sweater",
  "Cardigan",
  "Vest",
  "Jumpsuit",
  "Romper",
  "Activewear",
  "Swimwear",
  "Underwear",
  "Socks",
  "Accessories",
];

const steps = [
  { id: 0, label: "Basic Information", icon: <FaInfoCircle /> },
  { id: 1, label: "Pricing & Quantity", icon: <FaDollarSign /> },
  { id: 2, label: "Dates & Shipping", icon: <FaTruck /> },
  { id: 3, label: "Test Results", icon: <FaFlask /> },
];

const AddOrder = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("sidebarsOpenState");
    return stored !== null ? JSON.parse(stored) : true;
  });

  const [formData, setFormData] = useState({
    style: "",
    po_no: "",
    department: "",
    customer: "",
    garment: "",
    ref_no: "",
    supplier: "",
    shipment_month: "",
    gender: "",
    item: "",
    fabrication: "",
    size_range: "",
    wgr: "",
    unit_price: "",
    total_qty: "",
    total_value: "",
    factory_value: "",
    status: "Running",
    shipped_qty: 0,
    shipped_value: 0,
    final_inspection_date: null,
    ex_factory: null,
    etd: null,
    eta: null,
    shipment_date: null,
    physical_test: "",
    chemical_test: "",
    during_production_inspection: "",
    final_random_inspection: "",
    group_name: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [errors, setErrors] = useState({});

  // Add state for customers
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await getCustomers(1, 100, false);
      if (response && response.data) {
        console.log("🔍 Customer API Response:", response.data);
        console.log("📊 First customer object:", response.data[0]);
        console.log(
          "📋 Customer object keys:",
          response.data[0] ? Object.keys(response.data[0]) : "No customers",
        );
        setCustomers(response.data);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error("❌ Error fetching customers:", error);
      setSnackbar({
        open: true,
        message: "Error loading customers",
        type: "error",
      });
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem("sidebarsOpenState");
      setIsSidebarOpen(stored !== null ? JSON.parse(stored) : true);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "unit_price" || name === "total_qty") {
      const unitPrice =
        name === "unit_price"
          ? parseFloat(value)
          : parseFloat(formData.unit_price);
      const quantity =
        name === "total_qty" ? parseInt(value) : parseInt(formData.total_qty);
      if (
        !isNaN(unitPrice) &&
        !isNaN(quantity) &&
        unitPrice > 0 &&
        quantity > 0
      ) {
        setFormData((prev) => ({
          ...prev,
          total_value: (unitPrice * quantity).toFixed(2),
        }));
      }
    }
  };

  const handleDateChange = (name, date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const validateStep = () => {
    if (activeStep === 0) {
      const required = ["style", "po_no", "customer", "supplier"];
      const missing = required.filter((field) => !formData[field]);
      if (missing.length) {
        setSnackbar({
          open: true,
          message: "Please fill in all required fields",
          type: "warning",
        });
        return false;
      }
    } else if (activeStep === 1) {
      if (
        !formData.unit_price ||
        !formData.total_qty ||
        !formData.total_value
      ) {
        setSnackbar({
          open: true,
          message: "Please enter valid pricing information",
          type: "warning",
        });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (
      !formData.style ||
      !formData.po_no ||
      !formData.customer ||
      !formData.supplier
    ) {
      setSnackbar({
        open: true,
        message: "Please fill in all required fields",
        type: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const formattedData = {
        ...formData,
        final_inspection_date:
          formData.final_inspection_date?.toISOString().split("T")[0] || null,
        ex_factory: formData.ex_factory?.toISOString().split("T")[0] || null,
        etd: formData.etd?.toISOString().split("T")[0] || null,
        eta: formData.eta?.toISOString().split("T")[0] || null,
        shipment_date:
          formData.shipment_date?.toISOString().split("T")[0] || null,
        unit_price: parseFloat(formData.unit_price) || null,
        total_qty: parseInt(formData.total_qty) || null,
        total_value: parseFloat(formData.total_value) || null,
        shipped_qty: parseInt(formData.shipped_qty) || 0,
        shipped_value: parseFloat(formData.shipped_value) || 0,
        factory_value: parseFloat(formData.factory_value) || null,
        // Ensure customer is sent as integer
        customer: formData.customer ? parseInt(formData.customer) : null,
      };

      const response = await createOrder(formattedData);
      setSnackbar({
        open: true,
        message: "Order created successfully!",
        type: "success",
      });
      setTimeout(() => navigate(`/orders/${response.data.id}`), 1500);
    } catch (error) {
      console.error("Error creating order:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Error creating order",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div style={styles.stepContent}>
            <div style={styles.formGrid}>
              <div style={styles.formField}>
                <label style={styles.formLabel}>
                  Style <span style={styles.required}>*</span>
                </label>
                <div style={styles.inputWrapper}>
                  <FaBoxes style={styles.inputIcon} />
                  <input
                    type="text"
                    name="style"
                    value={formData.style}
                    onChange={handleChange}
                    placeholder="Enter style name"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>
                  PO Number <span style={styles.required}>*</span>
                </label>
                <div style={styles.inputWrapper}>
                  <FaClipboardList style={styles.inputIcon} />
                  <input
                    type="text"
                    name="po_no"
                    value={formData.po_no}
                    onChange={handleChange}
                    placeholder="Enter PO number"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Department</label>
                <div style={styles.inputWrapper}>
                  <FaBuilding style={styles.inputIcon} />
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Enter department"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Updated Customer field - Now a dropdown */}
              <div style={styles.formField}>
                <label style={styles.formLabel}>
                  Customer <span style={styles.required}>*</span>
                </label>
                <div style={styles.inputWrapper}>
                  <FaBuilding style={styles.inputIcon} />
                  <select
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    style={styles.select}
                    disabled={customersLoading}
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => {
                      // Try different possible fields that might contain the customer name
                      let displayName = "";

                      if (customer.customer_name) {
                        displayName = customer.customer_name;
                      } else if (customer.name) {
                        // If name is an object (ForeignKey), try to get customer_name from it
                        if (
                          typeof customer.name === "object" &&
                          customer.name !== null
                        ) {
                          displayName =
                            customer.name.customer_name ||
                            customer.name.name ||
                            `Customer ${customer.id}`;
                        } else if (typeof customer.name === "string") {
                          displayName = customer.name;
                        } else {
                          displayName = `Customer ${customer.id}`;
                        }
                      } else if (customer.customer_display_name) {
                        displayName = customer.customer_display_name;
                      } else {
                        displayName = `Customer ${customer.id}`;
                      }

                      return (
                        <option key={customer.id} value={customer.id}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                </div>
                {customersLoading && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      marginTop: "4px",
                    }}
                  >
                    Loading customers...
                  </div>
                )}
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Garment</label>
                <div style={styles.inputWrapper}>
                  <FaShoppingCart style={styles.inputIcon} />
                  <select
                    name="garment"
                    value={formData.garment}
                    onChange={handleChange}
                    style={styles.select}
                  >
                    <option value="">Select garment type</option>
                    {garmentOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Ref No</label>
                <div style={styles.inputWrapper}>
                  <FaClipboardList style={styles.inputIcon} />
                  <input
                    type="text"
                    name="ref_no"
                    value={formData.ref_no}
                    onChange={handleChange}
                    placeholder="Enter reference number"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>
                  Supplier <span style={styles.required}>*</span>
                </label>
                <div style={styles.inputWrapper}>
                  <FaIndustry style={styles.inputIcon} />
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    placeholder="Enter supplier name"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Shipment Month</label>
                <div style={styles.inputWrapper}>
                  <FaCalendarAlt style={styles.inputIcon} />
                  <input
                    type="text"
                    name="shipment_month"
                    value={formData.shipment_month}
                    onChange={handleChange}
                    placeholder="e.g., January 2024"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Gender</label>
                <div style={styles.inputWrapper}>
                  <FaUser style={styles.inputIcon} />
                  <input
                    type="text"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    placeholder="Enter gender"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Item</label>
                <div style={styles.inputWrapper}>
                  <FaShoppingCart style={styles.inputIcon} />
                  <input
                    type="text"
                    name="item"
                    value={formData.item}
                    onChange={handleChange}
                    placeholder="Enter item name"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formFieldFull}>
                <label style={styles.formLabel}>Fabrication</label>
                <div style={styles.inputWrapper}>
                  <FaIndustry style={styles.inputIcon} />
                  <textarea
                    name="fabrication"
                    value={formData.fabrication}
                    onChange={handleChange}
                    placeholder="Enter fabrication details..."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Size Range</label>
                <div style={styles.inputWrapper}>
                  <FaRuler style={styles.inputIcon} />
                  <input
                    type="text"
                    name="size_range"
                    value={formData.size_range}
                    onChange={handleChange}
                    placeholder="e.g., S-XXL"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>WGR</label>
                <div style={styles.inputWrapper}>
                  <FaChartLine style={styles.inputIcon} />
                  <input
                    type="text"
                    name="wgr"
                    value={formData.wgr}
                    onChange={handleChange}
                    placeholder="Enter WGR"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div style={styles.stepContent}>
            <div style={styles.formGrid}>
              <div style={styles.formField}>
                <label style={styles.formLabel}>
                  Unit Price ($) <span style={styles.required}>*</span>
                </label>
                <div style={styles.inputWrapper}>
                  <FaDollarSign style={styles.inputIcon} />
                  <input
                    type="number"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>
                  Total Quantity <span style={styles.required}>*</span>
                </label>
                <div style={styles.inputWrapper}>
                  <FaBoxes style={styles.inputIcon} />
                  <input
                    type="number"
                    name="total_qty"
                    value={formData.total_qty}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>
                  Total Value ($) <span style={styles.required}>*</span>
                </label>
                <div style={styles.inputWrapper}>
                  <FaDollarSign style={styles.inputIcon} />
                  <input
                    type="number"
                    name="total_value"
                    value={formData.total_value}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Factory Value ($)</label>
                <div style={styles.inputWrapper}>
                  <FaIndustry style={styles.inputIcon} />
                  <input
                    type="number"
                    name="factory_value"
                    value={formData.factory_value}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Status</label>
                <div style={styles.inputWrapper}>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    style={styles.select}
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Shipped Quantity</label>
                <div style={styles.inputWrapper}>
                  <FaTruck style={styles.inputIcon} />
                  <input
                    type="number"
                    name="shipped_qty"
                    value={formData.shipped_qty}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Shipped Value ($)</label>
                <div style={styles.inputWrapper}>
                  <FaDollarSign style={styles.inputIcon} />
                  <input
                    type="number"
                    name="shipped_value"
                    value={formData.shipped_value}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
            <div style={styles.infoMessage}>
              <FaCheckCircle style={{ color: "#10b981", marginRight: "8px" }} />
              <span>
                Total value auto-calculated from unit price × quantity
              </span>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={styles.stepContent}>
            <div style={styles.formGrid}>
              <div style={styles.formField}>
                <label style={styles.formLabel}>Final Inspection Date</label>
                <div style={styles.inputWrapper}>
                  <FaCalendarAlt style={styles.inputIcon} />
                  <input
                    type="date"
                    name="final_inspection_date"
                    value={
                      formData.final_inspection_date
                        ? formData.final_inspection_date
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleDateChange(
                        "final_inspection_date",
                        e.target.value ? new Date(e.target.value) : null,
                      )
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Ex-Factory Date</label>
                <div style={styles.inputWrapper}>
                  <FaIndustry style={styles.inputIcon} />
                  <input
                    type="date"
                    name="ex_factory"
                    value={
                      formData.ex_factory
                        ? formData.ex_factory.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleDateChange(
                        "ex_factory",
                        e.target.value ? new Date(e.target.value) : null,
                      )
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>ETD</label>
                <div style={styles.inputWrapper}>
                  <FaTruck style={styles.inputIcon} />
                  <input
                    type="date"
                    name="etd"
                    value={
                      formData.etd
                        ? formData.etd.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleDateChange(
                        "etd",
                        e.target.value ? new Date(e.target.value) : null,
                      )
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>ETA</label>
                <div style={styles.inputWrapper}>
                  <FaTruck style={styles.inputIcon} />
                  <input
                    type="date"
                    name="eta"
                    value={
                      formData.eta
                        ? formData.eta.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleDateChange(
                        "eta",
                        e.target.value ? new Date(e.target.value) : null,
                      )
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Shipment Date</label>
                <div style={styles.inputWrapper}>
                  <FaCalendarAlt style={styles.inputIcon} />
                  <input
                    type="date"
                    name="shipment_date"
                    value={
                      formData.shipment_date
                        ? formData.shipment_date.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleDateChange(
                        "shipment_date",
                        e.target.value ? new Date(e.target.value) : null,
                      )
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Group Name</label>
                <div style={styles.inputWrapper}>
                  <FaUser style={styles.inputIcon} />
                  <input
                    type="text"
                    name="group_name"
                    value={formData.group_name}
                    onChange={handleChange}
                    placeholder="Enter group name"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div style={styles.stepContent}>
            <div style={styles.formGrid}>
              <div style={styles.formFieldFull}>
                <label style={styles.formLabel}>Physical Test</label>
                <div style={styles.inputWrapper}>
                  <FaFlask style={styles.inputIcon} />
                  <textarea
                    name="physical_test"
                    value={formData.physical_test}
                    onChange={handleChange}
                    placeholder="Enter physical test results..."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>
              </div>

              <div style={styles.formFieldFull}>
                <label style={styles.formLabel}>Chemical Test</label>
                <div style={styles.inputWrapper}>
                  <FaFlask style={styles.inputIcon} />
                  <textarea
                    name="chemical_test"
                    value={formData.chemical_test}
                    onChange={handleChange}
                    placeholder="Enter chemical test results..."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>
              </div>

              <div style={styles.formFieldFull}>
                <label style={styles.formLabel}>
                  During Production Inspection
                </label>
                <div style={styles.inputWrapper}>
                  <FaClipboardList style={styles.inputIcon} />
                  <textarea
                    name="during_production_inspection"
                    value={formData.during_production_inspection}
                    onChange={handleChange}
                    placeholder="Enter production inspection details..."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>
              </div>

              <div style={styles.formFieldFull}>
                <label style={styles.formLabel}>Final Random Inspection</label>
                <div style={styles.inputWrapper}>
                  <FaClipboardList style={styles.inputIcon} />
                  <textarea
                    name="final_random_inspection"
                    value={formData.final_random_inspection}
                    onChange={handleChange}
                    placeholder="Enter final inspection results..."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>
              </div>

              <div style={styles.formFieldFull}>
                <label style={styles.formLabel}>Remarks</label>
                <div style={styles.inputWrapper}>
                  <FaInfoCircle style={styles.inputIcon} />
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Enter any additional remarks..."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.appContainer}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={styles.addOrderContainer}>
          {/* Header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerLeft}>
              <button
                style={styles.backButton}
                onClick={() => navigate("/orders")}
              >
                <FaArrowLeft />
              </button>
              <div>
                <h1 style={styles.pageTitle}>Create New Order</h1>
                <p style={styles.pageSubtitle}>
                  Fill in the details below to create a new order
                </p>
              </div>
            </div>
            <button
              style={styles.btnCancel}
              onClick={() => navigate("/orders")}
            >
              <FaTimes style={{ marginRight: "8px" }} /> Cancel
            </button>
          </div>

          {/* Stepper */}
          <div style={styles.stepperContainer}>
            {steps.map((step, index) => (
              <div
                key={step.id}
                style={{
                  ...styles.stepItem,
                  ...(activeStep === index ? styles.stepItemActive : {}),
                  ...(activeStep > index ? styles.stepItemCompleted : {}),
                }}
                onClick={() => activeStep > index && setActiveStep(index)}
              >
                <div style={styles.stepIcon}>
                  {activeStep > index ? <FaCheckCircle /> : step.icon}
                </div>
                <div style={styles.stepLabel}>{step.label}</div>
                {index < steps.length - 1 && (
                  <div style={styles.stepConnector} />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div style={styles.formCard}>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div style={styles.navigationButtons}>
              <button
                style={{
                  ...styles.btnOutline,
                  visibility: activeStep === 0 ? "hidden" : "visible",
                }}
                onClick={handleBack}
                disabled={activeStep === 0}
              >
                <FaChevronLeft style={{ marginRight: "8px" }} /> Back
              </button>
              {activeStep === steps.length - 1 ? (
                <button
                  style={styles.btnPrimary}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    "Creating..."
                  ) : (
                    <>
                      <FaSave style={{ marginRight: "8px" }} /> Create Order
                    </>
                  )}
                </button>
              ) : (
                <button style={styles.btnPrimary} onClick={handleNext}>
                  Continue <FaChevronRight style={{ marginLeft: "8px" }} />
                </button>
              )}
            </div>
          </div>

          {/* Snackbar */}
          {snackbar.open && (
            <div
              style={{
                ...styles.snackbar,
                backgroundColor:
                  snackbar.type === "success"
                    ? "#10b981"
                    : snackbar.type === "error"
                      ? "#ef4444"
                      : "#f59e0b",
              }}
            >
              <span>{snackbar.message}</span>
              <button
                onClick={() => setSnackbar({ ...snackbar, open: false })}
                style={styles.snackbarClose}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  appContainer: {
    display: "flex",
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#0f172a",
    height: "100vh",
    overflow: "hidden",
  },
  mainContent: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    height: "100vh",
  },
  addOrderContainer: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "#475569",
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: 600,
    color: "#0f172a",
    margin: 0,
    marginBottom: "4px",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  btnCancel: {
    display: "flex",
    alignItems: "center",
    padding: "8px 20px",
    borderRadius: "8px",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#475569",
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    padding: "10px 24px",
    borderRadius: "8px",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "none",
    background: "#2563eb",
    color: "white",
  },
  btnOutline: {
    display: "flex",
    alignItems: "center",
    padding: "10px 24px",
    borderRadius: "8px",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#475569",
  },
  stepperContainer: {
    display: "flex",
    justifyContent: "space-between",
    background: "white",
    borderRadius: "16px",
    padding: "24px 32px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
    position: "relative",
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    flex: 1,
    cursor: "pointer",
  },
  stepItemActive: {
    cursor: "default",
  },
  stepItemCompleted: {
    cursor: "pointer",
  },
  stepIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#f1f5f9",
    border: "2px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    color: "#94a3b8",
    transition: "all 0.2s",
  },
  stepLabel: {
    fontSize: "13px",
    fontWeight: 500,
    marginTop: "8px",
    color: "#64748b",
  },
  stepConnector: {
    position: "absolute",
    top: "20px",
    left: "calc(50% + 20px)",
    width: "calc(100% - 40px)",
    height: "2px",
    background: "#e2e8f0",
    zIndex: 0,
  },
  formCard: {
    background: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  stepContent: {
    padding: "32px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
  },
  formField: {
    display: "flex",
    flexDirection: "column",
  },
  formFieldFull: {
    display: "flex",
    flexDirection: "column",
    gridColumn: "span 2",
  },
  formLabel: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#334155",
    marginBottom: "6px",
  },
  required: {
    color: "#ef4444",
  },
  inputWrapper: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "16px",
  },
  input: {
    width: "100%",
    height: "44px",
    padding: "0 12px 0 38px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  select: {
    width: "100%",
    height: "44px",
    padding: "0 12px 0 38px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    background: "white",
    fontFamily: "inherit",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px 10px 38px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical",
  },
  infoMessage: {
    marginTop: "24px",
    padding: "12px 16px",
    background: "#f0fdf4",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    fontSize: "13px",
    color: "#166534",
  },
  navigationButtons: {
    display: "flex",
    justifyContent: "space-between",
    padding: "20px 32px",
    borderTop: "1px solid #e2e8f0",
    background: "#fafafa",
  },
  snackbar: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    padding: "12px 20px",
    borderRadius: "10px",
    color: "white",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    zIndex: 1000,
    animation: "slideIn 0.3s ease",
  },
  snackbarClose: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "20px",
    cursor: "pointer",
    padding: "0 4px",
  },
};

// Add keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  input:focus, select:focus, textarea:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  button:hover {
    transform: translateY(-1px);
  }
  
  .btn-primary:hover {
    background: #1d4ed8;
  }
  
  .btn-outline:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
  
  .back-button:hover, .btn-cancel:hover {
    background: #f1f5f9;
  }
`;
document.head.appendChild(styleSheet);

export default AddOrder;
