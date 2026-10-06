// AddOrder.jsx - Single Page Version

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  createOrder,
  getCustomers,
  getDepartments,
  uploadOrderFiles,
  getSuppliers,
} from "../../api/merchandiser";
import Sidebar from "../merchandiser/Sidebar";
import { canViewOrderPricing, canViewOrderAttachments, canManageOrders } from "../../utils/accessControl";
import { orderFormStyles, ORDER_FORM_CSS, delayColor } from "./orderFormTheme";
import QuickDateInput from "./QuickDateInput";
import {
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaInfoCircle,
  FaDollarSign,
  FaTruck,
  FaFlask,
  FaCheckCircle,
  FaUser,
  FaPlus,
  FaTrash,
  FaPalette,
  FaPaperclip,
  FaImage,
  FaFileAlt,
  FaSpinner,
  FaEdit as FaEditIcon,
  FaCheck,
  FaCloudUploadAlt,
  FaEye,
  FaPercent,
  FaSearch,
  FaDownload,
} from "react-icons/fa";

const statusOptions = [
  { value: "Running", label: "Running" },
  { value: "Active", label: "Active" },
  { value: "Shipped", label: "Shipped" },
  { value: "Pending", label: "Pending" },
  { value: "Cancelled", label: "Cancelled" },
];

const garmentOptions = [
  "lingerie",
  "knit",
  "woven",
  "sweater",
  "underwear",
  "socks",
  "shoes",
  "non textile",
];

const genderOptions = [
  "Ladies",
  "Men's",
  "Kids",
  "Mama",
  "Big Size",
  "All",
  "Blanks",
  "Boys",
  "Girls",
];

const orderTypeOptions = [
  { value: "regular", label: "Regular" },
  { value: "advertisement", label: "Advertisement" },
  { value: "programmer", label: "Programmer" },
];

const seasonOptions = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "autumn", label: "Autumn" },
  { value: "winter", label: "Winter" },
  { value: "autumn_opening", label: "Autumn Opening" },
  { value: "boost_aw", label: "Boost AW" },
  { value: "boost_ss", label: "Boost SS" },
  { value: "main_spring", label: "Main Spring" },
  { value: "spring_opening", label: "Spring Opening" },
];

// Commission is not tied to any specific buyer — any order can use either
// method, chosen freely per-order via this dropdown.
const commissionCalcMethodOptions = [
  { value: "manual_percent", label: "Manual Commission Percentage" },
  { value: "unit_price_minus_factory", label: "Unit Price − Factory Price" },
];

const sizeTypeOptions = [
  { value: "numeric", label: "Numeric Sizes (Even numbers only)" },
  { value: "alpha", label: "Alpha Sizes (XS-10XL)" },
];

const alphaSizes = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "4XL",
  "5XL",
  "6XL",
  "7XL",
  "8XL",
  "9XL",
  "10XL",
];

const AddOrder = () => {
  const navigate = useNavigate();

  // Merchandiser - Production is view-only on Orders; block direct
  // navigation to this form even via URL (see accessControl.js).
  useEffect(() => {
    if (!canManageOrders()) {
      navigate("/orders", { replace: true });
    }
  }, [navigate]);

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });

  // Form data
  const [formData, setFormData] = useState({
    style: "",
    po_no: "",
    pdm_no: "",
    department_id: "",
    customer_id: "",
    garment: "",
    season: "",
    ref_no: "",
    supplier_id: "",
    supplier_name: "",
    shipment_month: "",
    gender: "",
    item: "",
    fabrication: "",
    size_range: "",
    wgr: "",
    order_type: "",
    prev_ref: "",
    invoice_no: "",
    repeat_of: "",
    unit_price: "",
    total_qty: "",
    total_value: "",
    estimated_commission: "",
    actual_commission: "",
    commission_calc_method: "manual_percent",
    commission_percent: "",
    factory_price: "",
    commission_rate: "",
    commission_rec_date: null,
    status: "Running",
    shipped_qty: 0,
    shipped_value: 0,
    group_name: "",
    final_inspection_date: null,
    dpi_date: null,
    ex_factory: null,
    etd: null,
    eta: null,
    shipment_date: null,
    ic_issue_date: null,
    factory_ship_date: null,
    cargo_handover_date: null,
    factory_value: "",
    remarks: "",
    shipment_delay: "",
    actual_shipment_deviation: "",
    delay_from_ex_factory: "", // Added for formula 4
    delay_from_etd: "", // Added for formula 5
  });

  // Color & Sizing State
  const [sizeType, setSizeType] = useState("numeric");
  const [sizeRange, setSizeRange] = useState("");
  const [availableSizes, setAvailableSizes] = useState([]);
  const [colorSizeGroups, setColorSizeGroups] = useState([]);

  // File upload state
  const [pendingFiles, setPendingFiles] = useState({
    attachments: [],
    images: [],
    sampleFiles: [],
  });

  // Rename state
  const [renamingFile, setRenamingFile] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [showRenameModal, setShowRenameModal] = useState(false);

  // Image preview
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Data lists
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);

  // Searchable dropdown states
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierSearchRef = useRef(null);
  const supplierDropdownRef = useRef(null);

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()),
  );

  useEffect(() => {
    fetchCustomers();
    fetchDepartments();
    fetchSuppliers();
  }, []);

  // ==================== FORMULA 1: Estimated Commission ====================
  // Manual Commission Percentage (existing/default behavior):
  //   Estimated Commission = Total Value × Commission Percent
  // Unit Price − Factory Price:
  //   Commission Rate = Unit Price − Factory Price (auto-calculated, not entered)
  //   Estimated Commission = Total Quantity × Commission Rate
  useEffect(() => {
    const totalValue = parseFloat(formData.total_value);

    if (formData.commission_calc_method === "unit_price_minus_factory") {
      const unitPrice = parseFloat(formData.unit_price);
      const factoryPrice = parseFloat(formData.factory_price);
      const totalQty = parseFloat(formData.total_qty);
      const rateValid = !isNaN(unitPrice) && !isNaN(factoryPrice);
      const rate = rateValid ? unitPrice - factoryPrice : null;

      setFormData((prev) => ({
        ...prev,
        commission_rate: rateValid ? rate.toFixed(4) : "",
        estimated_commission:
          rateValid && !isNaN(totalQty) && totalQty > 0
            ? (rate * totalQty).toFixed(2)
            : "",
      }));
      return;
    }

    const commissionPercent = parseFloat(formData.commission_percent);
    if (
      !isNaN(commissionPercent) &&
      !isNaN(totalValue) &&
      commissionPercent > 0 &&
      totalValue > 0
    ) {
      const estimatedCommission = (commissionPercent / 100) * totalValue;
      setFormData((prev) => ({
        ...prev,
        commission_rate: "",
        estimated_commission: estimatedCommission.toFixed(2),
      }));
    } else if (
      formData.commission_percent === "" ||
      formData.commission_percent === "0" ||
      formData.total_value === "" ||
      formData.total_value === "0"
    ) {
      setFormData((prev) => ({
        ...prev,
        commission_rate: "",
        estimated_commission: "",
      }));
    }
  }, [
    formData.commission_calc_method,
    formData.commission_percent,
    formData.total_value,
    formData.total_qty,
    formData.unit_price,
    formData.factory_price,
  ]);

  // ==================== FORMULA 2 & 3: Actual Commission & Shipped Value & Factory Value ====================
  useEffect(() => {
    const shippedQty = parseFloat(formData.shipped_qty);
    const unitPrice = parseFloat(formData.unit_price);

    if (
      !isNaN(shippedQty) &&
      !isNaN(unitPrice) &&
      shippedQty > 0 &&
      unitPrice > 0
    ) {
      const shippedValue = shippedQty * unitPrice;
      const factoryValue = shippedQty * unitPrice;

      let actualCommission = "";
      if (formData.commission_calc_method === "unit_price_minus_factory") {
        const factoryPrice = parseFloat(formData.factory_price);
        if (!isNaN(factoryPrice)) {
          const rate = unitPrice - factoryPrice;
          actualCommission = (rate * shippedQty).toFixed(2);
        }
      } else {
        const commissionPercent = parseFloat(formData.commission_percent);
        if (!isNaN(commissionPercent) && commissionPercent > 0) {
          actualCommission = ((commissionPercent / 100) * shippedValue).toFixed(2);
        }
      }

      setFormData((prev) => ({
        ...prev,
        shipped_value: shippedValue.toFixed(2),
        factory_value: factoryValue.toFixed(2),
        actual_commission: actualCommission,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        shipped_value: "",
        factory_value: "",
        actual_commission: "",
      }));
    }
  }, [
    formData.commission_calc_method,
    formData.commission_percent,
    formData.factory_price,
    formData.shipped_qty,
    formData.unit_price,
  ]);

  // ==================== FORMULA 4: Delay from Ex-Factory = Shipment Date - Ex-Factory Date ====================
  useEffect(() => {
    if (formData.shipment_date && formData.ex_factory) {
      const shipmentDate = new Date(formData.shipment_date);
      const exFactoryDate = new Date(formData.ex_factory);

      if (
        shipmentDate &&
        exFactoryDate &&
        !isNaN(shipmentDate) &&
        !isNaN(exFactoryDate)
      ) {
        const diffTime = shipmentDate - exFactoryDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // FIX: Show negative values (early shipment)
        setFormData((prev) => ({
          ...prev,
          delay_from_ex_factory: diffDays,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          delay_from_ex_factory: "",
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        delay_from_ex_factory: "",
      }));
    }
  }, [formData.shipment_date, formData.ex_factory]);

  // ==================== FORMULA 5: Delay from ETD = Shipment Date - ETD ====================
  useEffect(() => {
    if (formData.shipment_date && formData.etd) {
      const shipmentDate = new Date(formData.shipment_date);
      const etdDate = new Date(formData.etd);

      if (shipmentDate && etdDate && !isNaN(shipmentDate) && !isNaN(etdDate)) {
        const diffTime = shipmentDate - etdDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // FIX: Show negative values (early shipment)
        setFormData((prev) => ({
          ...prev,
          delay_from_etd: diffDays,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          delay_from_etd: "",
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        delay_from_etd: "",
      }));
    }
  }, [formData.shipment_date, formData.etd]);

  // Auto-calculate total value from unit price and total quantity
  useEffect(() => {
    const unitPrice = parseFloat(formData.unit_price);
    const totalQty = parseFloat(formData.total_qty);

    if (
      !isNaN(unitPrice) &&
      !isNaN(totalQty) &&
      unitPrice > 0 &&
      totalQty > 0
    ) {
      const totalValue = unitPrice * totalQty;
      setFormData((prev) => ({
        ...prev,
        total_value: totalValue.toFixed(2),
      }));
    }
  }, [formData.unit_price, formData.total_qty]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        supplierDropdownRef.current &&
        !supplierDropdownRef.current.contains(event.target) &&
        supplierSearchRef.current &&
        !supplierSearchRef.current.contains(event.target)
      ) {
        setIsSupplierDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await getCustomers(1, 500, false);
      if (response && response.data) {
        let customersData = [];
        if (response.data.results) {
          customersData = response.data.results;
        } else if (Array.isArray(response.data)) {
          customersData = response.data;
        } else {
          customersData = [response.data];
        }

        const customersList = customersData.map((customer) => ({
          id: customer.id,
          name:
            customer.hrms_customer_name ||
            customer.customer_name ||
            (typeof customer.name === "object"
              ? customer.name.customer_name || customer.name.name
              : customer.name) ||
            `Customer ${customer.id}`,
        }));

        const uniqueCustomers = [];
        const seenIds = new Set();
        for (const customer of customersList) {
          if (!seenIds.has(customer.id)) {
            seenIds.add(customer.id);
            uniqueCustomers.push(customer);
          }
        }
        uniqueCustomers.sort((a, b) => a.name.localeCompare(b.name));
        setCustomers(uniqueCustomers);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await getSuppliers(1, 500, { all: true });
      if (response && response.data) {
        let suppliersList = [];
        if (Array.isArray(response.data)) {
          suppliersList = response.data.map((supplier) => ({
            id: supplier.id,
            name:
              supplier.supplier_name ||
              supplier.name ||
              `Supplier ${supplier.id}`,
          }));
        } else if (response.data.results) {
          suppliersList = response.data.results.map((supplier) => ({
            id: supplier.id,
            name:
              supplier.supplier_name ||
              supplier.name ||
              `Supplier ${supplier.id}`,
          }));
        }
        suppliersList.sort((a, b) => a.name.localeCompare(b.name));
        setSuppliers(suppliersList);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setSuppliersLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await getDepartments(1, 500, false);
      if (response && response.data) {
        let departmentsList = [];
        if (Array.isArray(response.data)) {
          departmentsList = response.data.map((dept) => ({
            id: dept.id,
            name: dept.name || dept.department_name || `Department ${dept.id}`,
          }));
        } else if (response.data.results) {
          departmentsList = response.data.results.map((dept) => ({
            id: dept.id,
            name: dept.name || dept.department_name || `Department ${dept.id}`,
          }));
        }
        setDepartments(departmentsList);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSupplierSelect = (supplierId, supplierName) => {
    setFormData((prev) => ({
      ...prev,
      supplier_id: supplierId,
      supplier_name: supplierName,
    }));
    setSupplierSearchTerm(supplierName);
    setIsSupplierDropdownOpen(false);
  };

  const handleSupplierSearchChange = (e) => {
    setSupplierSearchTerm(e.target.value);
    setIsSupplierDropdownOpen(true);
    if (e.target.value === "") {
      setFormData((prev) => ({ ...prev, supplier_id: "", supplier_name: "" }));
    }
  };

  const handleDateChange = (name, date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  // ==================== COLOR & SIZING HANDLERS ====================
  const handleSizeTypeChange = (e) => {
    const newSizeType = e.target.value;
    setSizeType(newSizeType);
    setSizeRange("");
    setAvailableSizes([]);
    setColorSizeGroups([]);
  };

  const handleSizeRangeChange = (e) => {
    const value = e.target.value;
    setSizeRange(value);
    setFormData((prev) => ({ ...prev, size_range: value }));

    if (sizeType === "numeric") {
      if (value.includes("-")) {
        const [start, end] = value.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          const sizes = [];
          for (let i = start; i <= end; i++) {
            if (i % 2 === 0) {
              sizes.push(i.toString());
            }
          }
          if (sizes.length > 0) {
            setAvailableSizes(sizes);
            setColorSizeGroups([
              {
                id: Date.now(),
                color: "",
                sizes: sizes.map((size) => ({ size, quantity: 0 })),
                total: 0,
              },
            ]);
          } else {
            setAvailableSizes([]);
            setColorSizeGroups([]);
            setSnackbar({
              open: true,
              message:
                "No even numbers found. Please use even numbers like 2,4,6...",
              type: "warning",
            });
          }
        } else {
          setAvailableSizes([]);
          setColorSizeGroups([]);
        }
      } else {
        setAvailableSizes([]);
        setColorSizeGroups([]);
      }
    } else if (sizeType === "alpha") {
      if (value === "all") {
        setAvailableSizes([...alphaSizes]);
        setColorSizeGroups([
          {
            id: Date.now(),
            color: "",
            sizes: alphaSizes.map((size) => ({ size, quantity: 0 })),
            total: 0,
          },
        ]);
      } else {
        setAvailableSizes([]);
        setColorSizeGroups([]);
      }
    }
  };

  const addColorGroup = () => {
    if (availableSizes.length === 0) {
      setSnackbar({
        open: true,
        message: "Please select size range first",
        type: "warning",
      });
      return;
    }
    setColorSizeGroups((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        color: "",
        sizes: availableSizes.map((size) => ({ size, quantity: 0 })),
        total: 0,
      },
    ]);
  };

  const removeColorGroup = (groupId) => {
    if (colorSizeGroups.length === 1) {
      setSnackbar({
        open: true,
        message: "At least one color group is required",
        type: "warning",
      });
      return;
    }
    setColorSizeGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const handleColorChange = (groupId, value) => {
    setColorSizeGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, color: value } : group,
      ),
    );
  };

  const handleQuantityChange = (groupId, size, value) => {
    setColorSizeGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          const newSizes = group.sizes.map((s) =>
            s.size === size ? { ...s, quantity: parseInt(value) || 0 } : s,
          );
          const newTotal = newSizes.reduce((sum, s) => sum + s.quantity, 0);
          return { ...group, sizes: newSizes, total: newTotal };
        }
        return group;
      }),
    );
  };

  const calculateGrandTotal = () => {
    return colorSizeGroups.reduce((sum, group) => sum + (group.total || 0), 0);
  };

  const getSizeTotal = (size) => {
    return colorSizeGroups.reduce(
      (sum, group) =>
        sum + (group.sizes.find((s) => s.size === size)?.quantity || 0),
      0,
    );
  };

  // ==================== FILE HANDLERS ====================
  const addPendingImages = (files) => {
    const newImages = files.map((file, idx) => ({
      id: Date.now() + idx + Math.random(),
      file: file,
      name: file.name,
      type: "image",
      preview: URL.createObjectURL(file),
    }));
    setPendingFiles((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    addPendingImages(files);
    e.target.value = null;
  };

  const handleAttachmentSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file, idx) => ({
      id: Date.now() + idx + Math.random(),
      file: file,
      name: file.name,
      type: "attachment",
    }));
    setPendingFiles((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments],
    }));
    e.target.value = null;
  };

  // Lets a copied image (screenshot, "Copy Image" from a browser, etc.) be
  // pasted straight into Product Images with Ctrl/Cmd+V, without needing to
  // save it to disk first and browse for it.
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles = Array.from(items)
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter(Boolean);

      if (imageFiles.length === 0) return;

      e.preventDefault();
      const namedFiles = imageFiles.map((file, idx) =>
        file.name && file.name !== "image.png"
          ? file
          : new File(
              [file],
              `pasted-image-${Date.now()}-${idx}.${(file.type.split("/")[1] || "png")}`,
              { type: file.type },
            ),
      );
      addPendingImages(namedFiles);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleSampleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newSampleFiles = files.map((file, idx) => ({
      id: Date.now() + idx + Math.random(),
      file: file,
      name: file.name,
      type: "sample_file",
    }));
    setPendingFiles((prev) => ({
      ...prev,
      sampleFiles: [...prev.sampleFiles, ...newSampleFiles],
    }));
    e.target.value = null;
  };

  const removePendingFile = (type, id) => {
    if (type === "images") {
      const imageToRemove = pendingFiles.images.find((img) => img.id === id);
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
    }
    setPendingFiles((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item.id !== id),
    }));
  };

  const openRenameModal = (type, id, currentName) => {
    const nameWithoutExt =
      currentName.substring(0, currentName.lastIndexOf(".")) || currentName;
    setRenamingFile({ type, id, currentName, isPending: true });
    setNewFileName(nameWithoutExt);
    setShowRenameModal(true);
  };

  const renamePendingFile = () => {
    if (!newFileName.trim()) {
      setSnackbar({
        open: true,
        message: "Please enter a valid file name",
        type: "warning",
      });
      return;
    }

    const { type, id, currentName } = renamingFile;
    const extension = currentName.substring(currentName.lastIndexOf("."));
    const newFullName = newFileName + extension;

    setPendingFiles((prev) => ({
      ...prev,
      [type]: prev[type].map((item) => {
        if (item.id === id) {
          const renamedFile = new File([item.file], newFullName, {
            type: item.file.type,
          });
          if (type === "images" && item.preview) {
            URL.revokeObjectURL(item.preview);
          }
          return {
            ...item,
            name: newFullName,
            file: renamedFile,
            preview:
              type === "images"
                ? URL.createObjectURL(renamedFile)
                : item.preview,
          };
        }
        return item;
      }),
    }));

    setShowRenameModal(false);
    setRenamingFile(null);
    setNewFileName("");
    setSnackbar({
      open: true,
      message: "File renamed successfully!",
      type: "success",
    });
  };

  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);
  const [isDraggingSampleFile, setIsDraggingSampleFile] = useState(false);

  const handleDrop = (type, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "image") setIsDraggingImage(false);
    else if (type === "sample_file") setIsDraggingSampleFile(false);
    else setIsDraggingAttachment(false);

    const files = Array.from(e.dataTransfer.files);

    if (type === "image") {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      const newImages = imageFiles.map((file, idx) => ({
        id: Date.now() + idx + Math.random(),
        file: file,
        name: file.name,
        type: "image",
        preview: URL.createObjectURL(file),
      }));
      setPendingFiles((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
    } else if (type === "sample_file") {
      const newSampleFiles = files.map((file, idx) => ({
        id: Date.now() + idx + Math.random(),
        file: file,
        name: file.name,
        type: "sample_file",
      }));
      setPendingFiles((prev) => ({
        ...prev,
        sampleFiles: [...prev.sampleFiles, ...newSampleFiles],
      }));
    } else {
      const newAttachments = files.map((file, idx) => ({
        id: Date.now() + idx + Math.random(),
        file: file,
        name: file.name,
        type: "attachment",
      }));
      setPendingFiles((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments],
      }));
    }
  };

  const validateForm = () => {
    if (!formData.style || !formData.po_no || !formData.customer_id) {
      setSnackbar({
        open: true,
        message: "Please fill all required fields (Order NO, PO Number, Customer)",
        type: "warning",
      });
      return false;
    }
    return true;
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formattedColorGroups = colorSizeGroups
        .filter((g) => g.color && g.color.trim())
        .map((g) => ({
          color: g.color.trim(),
          total: g.total,
          size_quantities: g.sizes
            .filter((s) => s.quantity > 0)
            .map((s) => ({ size: s.size, quantity: s.quantity })),
        }))
        .filter((g) => g.size_quantities.length > 0);

      const submitData = {
        style: formData.style,
        po_no: formData.po_no,
        pdm_no: formData.pdm_no || null,
        department_id: formData.department_id
          ? parseInt(formData.department_id)
          : null,
        customer_id: formData.customer_id
          ? parseInt(formData.customer_id)
          : null,
        garment: formData.garment || null,
        season: formData.season || null,
        ref_no: formData.ref_no || null,
        supplier_id: formData.supplier_id
          ? parseInt(formData.supplier_id)
          : null,
        shipment_month: formData.shipment_month || null,
        gender: formData.gender || null,
        item: formData.item || null,
        fabrication: formData.fabrication || null,
        size_range: formData.size_range || null,
        wgr: formData.wgr || null,
        order_type: formData.order_type || null,
        prev_ref: formData.prev_ref || null,
        invoice_no: formData.invoice_no || null,
        repeat_of: formData.repeat_of || null,
        unit_price: formData.unit_price
          ? parseFloat(formData.unit_price)
          : null,
        total_qty: formData.total_qty ? parseInt(formData.total_qty) : null,
        total_value: formData.total_value
          ? parseFloat(formData.total_value)
          : null,
        estimated_commission: formData.estimated_commission
          ? parseFloat(formData.estimated_commission)
          : null,
        actual_commission: formData.actual_commission
          ? parseFloat(formData.actual_commission)
          : null,
        commission_calc_method: formData.commission_calc_method || "manual_percent",
        commission_percent: formData.commission_percent
          ? parseFloat(formData.commission_percent)
          : null,
        factory_price: formData.factory_price
          ? parseFloat(formData.factory_price)
          : null,
        commission_rate: formData.commission_rate
          ? parseFloat(formData.commission_rate)
          : null,
        commission_rec_date:
          formData.commission_rec_date?.toISOString().split("T")[0] || null,
        status: formData.status,
        shipped_qty: parseInt(formData.shipped_qty) || 0,
        shipped_value: parseFloat(formData.shipped_value) || 0,
        group_name: formData.group_name || null,
        final_inspection_date:
          formData.final_inspection_date?.toISOString().split("T")[0] || null,
        dpi_date: formData.dpi_date?.toISOString().split("T")[0] || null,
        ex_factory: formData.ex_factory?.toISOString().split("T")[0] || null,
        etd: formData.etd?.toISOString().split("T")[0] || null,
        eta: formData.eta?.toISOString().split("T")[0] || null,
        shipment_date:
          formData.shipment_date?.toISOString().split("T")[0] || null,
        ic_issue_date:
          formData.ic_issue_date?.toISOString().split("T")[0] || null,
        factory_ship_date:
          formData.factory_ship_date?.toISOString().split("T")[0] || null,
        cargo_handover_date:
          formData.cargo_handover_date?.toISOString().split("T")[0] || null,
        factory_value: formData.factory_value
          ? parseFloat(formData.factory_value)
          : null,
        remarks: formData.remarks || null,
        shipment_delay: formData.shipment_delay
          ? parseInt(formData.shipment_delay)
          : null,
        actual_shipment_deviation: formData.actual_shipment_deviation
          ? parseInt(formData.actual_shipment_deviation)
          : null,
        delay_from_ex_factory: formData.delay_from_ex_factory
          ? parseInt(formData.delay_from_ex_factory)
          : null,
        delay_from_etd: formData.delay_from_etd
          ? parseInt(formData.delay_from_etd)
          : null,
        size_type: sizeType,
        grand_total: calculateGrandTotal(),
        color_size_groups: formattedColorGroups,
      };

      console.log("Submitting data:", submitData);
      const response = await createOrder(submitData);

      if (
        pendingFiles.attachments.length ||
        pendingFiles.images.length ||
        pendingFiles.sampleFiles.length
      ) {
        const uploadData = new FormData();
        pendingFiles.attachments.forEach((item) =>
          uploadData.append("attachments", item.file),
        );
        pendingFiles.images.forEach((item) =>
          uploadData.append("images", item.file),
        );
        pendingFiles.sampleFiles.forEach((item) =>
          uploadData.append("sample_files", item.file),
        );
        await uploadOrderFiles(response.data.id, uploadData);
      }

      setSnackbar({
        open: true,
        message: "Order created successfully!",
        type: "success",
      });
      setTimeout(() => navigate(`/orders/${response.data.id}`), 1500);
    } catch (error) {
      console.error("Error:", error);
      let errorMsg = "Error creating order";
      if (error.response?.data) {
        if (typeof error.response.data === "object") {
          const firstError = Object.values(error.response.data)[0];
          errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
        }
      }
      setSnackbar({ open: true, message: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const renderColorSizeTable = () => {
    if (availableSizes.length === 0) {
      return (
        <div style={styles.emptyState}>
          <span>📏</span>
          <p>
            Please select size type and range above to add colors and quantities
          </p>
        </div>
      );
    }

    if (colorSizeGroups.length === 0) {
      return (
        <div style={styles.emptyState}>
          <span>🎨</span>
          <p>Click "Add Color" to add color groups</p>
        </div>
      );
    }

    return (
      <div style={styles.tableWrapper}>
        <table style={styles.colorSizeTable}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Color/Size</th>
              {availableSizes.map((size) => (
                <th key={size} style={styles.tableHeader}>
                  {size}
                </th>
              ))}
              <th style={styles.tableHeader}>Total</th>
              <th style={styles.tableHeader}>Action</th>
            </tr>
          </thead>
          <tbody>
            {colorSizeGroups.map((group) => (
              <tr key={group.id}>
                <td style={styles.tableCell}>
                  <input
                    type="text"
                    value={group.color || ""}
                    onChange={(e) =>
                      handleColorChange(group.id, e.target.value)
                    }
                    style={styles.colorInput}
                    placeholder="Enter color name"
                  />
                </td>
                {group.sizes.map((size) => (
                  <td key={size.size} style={styles.tableCell}>
                    <input
                      type="number"
                      min="0"
                      value={size.quantity || 0}
                      onChange={(e) =>
                        handleQuantityChange(
                          group.id,
                          size.size,
                          e.target.value,
                        )
                      }
                      style={styles.quantityInput}
                    />
                  </td>
                ))}
                <td style={styles.tableCell}>
                  <input
                    type="number"
                    value={group.total || 0}
                    readOnly
                    style={styles.totalInput}
                  />
                </td>
                <td style={styles.tableCell}>
                  <button
                    onClick={() => removeColorGroup(group.id)}
                    type="button"
                    style={styles.removeButton}
                    disabled={colorSizeGroups.length === 1}
                  >
                    <FaTrash /> Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={styles.tableFooter}>
                <strong>GRAND TOTAL</strong>
              </td>
              {availableSizes.map((size) => (
                <td key={size} style={styles.tableFooter}>
                  <strong>{getSizeTotal(size)}</strong>
                </td>
              ))}
              <td style={styles.tableFooter}>
                <strong>{calculateGrandTotal()}</strong>
              </td>
              <td style={styles.tableFooter}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div style={styles.appContainer} className="ord-form">
      <style>{ORDER_FORM_CSS}</style>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={styles.addOrderContainer}>
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
                <p style={styles.pageSubtitle}>Fill in all the details below</p>
              </div>
            </div>
            <button
              style={styles.btnCancel}
              onClick={() => navigate("/orders")}
            >
              <FaTimes /> Cancel
            </button>
          </div>

          <div style={styles.formCard}>
            <div style={styles.formContent}>
              {/* Basic Information Section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <FaInfoCircle style={styles.sectionIcon} />
                  <h2 style={styles.sectionTitle}>Basic Information</h2>
                </div>
                <div style={styles.formGrid}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>
                      Style<span style={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="pdm_no"
                      value={formData.pdm_no}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>
                      Order NO <span style={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="style"
                      value={formData.style}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>
                      PO Number <span style={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="po_no"
                      value={formData.po_no}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Department</label>
                    <select
                      name="department_id"
                      value={formData.department_id || ""}
                      onChange={handleChange}
                      style={styles.select}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>
                      Customer <span style={styles.required}>*</span>
                    </label>
                    <select
                      name="customer_id"
                      value={formData.customer_id || ""}
                      onChange={handleChange}
                      style={styles.select}
                    >
                      <option value="">Select Customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Supplier</label>
                    <div
                      style={styles.searchableSelectContainer}
                      ref={supplierSearchRef}
                    >
                      <div style={styles.searchableSelectInputWrapper}>
                        <FaSearch style={styles.searchIcon} />
                        <input
                          type="text"
                          placeholder="Search supplier..."
                          value={supplierSearchTerm}
                          onChange={handleSupplierSearchChange}
                          onFocus={() => setIsSupplierDropdownOpen(true)}
                          style={styles.searchableSelectInput}
                        />
                        {formData.supplier_id && (
                          <button
                            style={styles.clearSelectionBtn}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                supplier_id: "",
                                supplier_name: "",
                              }));
                              setSupplierSearchTerm("");
                            }}
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                      {isSupplierDropdownOpen && (
                        <div
                          style={styles.searchableDropdown}
                          ref={supplierDropdownRef}
                        >
                          {filteredSuppliers.map((supplier) => (
                            <div
                              key={supplier.id}
                              style={{
                                ...styles.dropdownItem,
                                ...(formData.supplier_id === supplier.id
                                  ? styles.dropdownItemSelected
                                  : {}),
                              }}
                              onClick={() =>
                                handleSupplierSelect(supplier.id, supplier.name)
                              }
                            >
                              <FaUser style={styles.dropdownItemIcon} />
                              <div style={styles.dropdownItemContent}>
                                <span style={styles.dropdownItemName}>
                                  {supplier.name}
                                </span>
                              </div>
                              {formData.supplier_id === supplier.id && (
                                <FaCheck style={styles.dropdownItemCheck} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>WGR</label>
                    <input
                      type="text"
                      name="wgr"
                      value={formData.wgr}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Garment</label>
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
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      style={styles.select}
                    >
                      <option value="">Select gender</option>
                      {genderOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Item</label>
                    <input
                      type="text"
                      name="item"
                      value={formData.item}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Season</label>
                    <select
                      name="season"
                      value={formData.season}
                      onChange={handleChange}
                      style={styles.select}
                    >
                      <option value="">Select season</option>
                      {seasonOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Repeat Ref No</label>
                    <input
                      type="text"
                      name="ref_no"
                      value={formData.ref_no}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Shipment Month</label>
                    <input
                      type="text"
                      name="shipment_month"
                      value={formData.shipment_month}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Fabrication</label>
                    <input
                      type="text"
                      name="fabrication"
                      value={formData.fabrication}
                      onChange={handleChange}
                      autoComplete="on"
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Quantity Section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <FaDollarSign style={styles.sectionIcon} />
                  <h2 style={styles.sectionTitle}>Pricing & Quantity</h2>
                </div>
                <div style={styles.formGrid}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Total Quantity</label>
                    <input
                      type="number"
                      name="total_qty"
                      value={formData.total_qty}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  {canViewOrderPricing() && (
                    <div style={styles.formField}>
                      <label style={styles.formLabel}>Unit Price ($)</label>
                      <input
                        type="number"
                        name="unit_price"
                        value={formData.unit_price}
                        onChange={handleChange}
                        step="0.01"
                        style={styles.input}
                      />
                    </div>
                  )}
                  {canViewOrderPricing() && (
                    <div style={styles.formField}>
                      <label style={styles.formLabel}>Total Value ($)</label>
                      <input
                        type="number"
                        name="total_value"
                        value={formData.total_value}
                        readOnly
                        style={{
                          ...styles.input,
                          backgroundColor: "#f5f7fa",
                          cursor: "not-allowed",
                        }}
                      />
                    </div>
                  )}
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Shipped Quantity</label>
                    <input
                      type="number"
                      name="shipped_qty"
                      value={formData.shipped_qty}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  {canViewOrderPricing() && (
                    <div style={styles.formField}>
                      <label style={styles.formLabel}>Shipped Value ($)</label>
                      <input
                        type="number"
                        name="shipped_value"
                        value={formData.shipped_value}
                        readOnly
                        style={{
                          ...styles.input,
                          backgroundColor: "#f5f7fa",
                          cursor: "not-allowed",
                        }}
                      />
                    </div>
                  )}
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Status</label>
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
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Order Type</label>
                    <select
                      name="order_type"
                      value={formData.order_type}
                      onChange={handleChange}
                      style={styles.select}
                    >
                      <option value="">Select Order Type</option>
                      {orderTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Previous Ref #</label>
                    <input
                      type="text"
                      name="prev_ref"
                      value={formData.prev_ref}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Invoice No</label>
                    <input
                      type="text"
                      name="invoice_no"
                      value={formData.invoice_no}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Repeat Of</label>
                    <input
                      type="text"
                      name="repeat_of"
                      value={formData.repeat_of}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Group Name</label>
                    <input
                      type="text"
                      name="group_name"
                      value={formData.group_name}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>

              {/* Color & Sizing Section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <FaPalette style={styles.sectionIcon} />
                  <h2 style={styles.sectionTitle}>Color & Sizing</h2>
                  {availableSizes.length > 0 && (
                    <button
                      onClick={addColorGroup}
                      type="button"
                      style={styles.addButton}
                    >
                      <FaPlus /> Add Color
                    </button>
                  )}
                </div>
                <div style={styles.formGrid}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Size Type</label>
                    <select
                      value={sizeType}
                      onChange={handleSizeTypeChange}
                      style={styles.select}
                    >
                      {sizeTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>
                      {sizeType === "numeric"
                        ? "Size Range (e.g., 2-10)"
                        : "Size Selection"}
                    </label>
                    {sizeType === "numeric" ? (
                      <input
                        type="text"
                        value={sizeRange}
                        onChange={handleSizeRangeChange}
                        placeholder="e.g., 2-10 (even numbers only)"
                        style={styles.input}
                      />
                    ) : (
                      <select
                        value={sizeRange}
                        onChange={handleSizeRangeChange}
                        style={styles.select}
                      >
                        <option value="">Select Size Range</option>
                        <option value="all">All Alpha Sizes (XS-10XL)</option>
                      </select>
                    )}
                  </div>
                </div>
                {renderColorSizeTable()}
              </div>

              {/* Dates & Shipping Section - FIXED */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <FaTruck style={styles.sectionIcon} />
                  <h2 style={styles.sectionTitle}>Dates & Shipping</h2>
                </div>
                <div style={styles.formGrid}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Factory Ship Date</label>
                    <QuickDateInput
                      value={formData.factory_ship_date}
                      onChange={(d) => handleDateChange("factory_ship_date", d)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Shipment Date</label>
                    <QuickDateInput
                      value={formData.shipment_date}
                      onChange={(d) => handleDateChange("shipment_date", d)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>DPI</label>
                    <QuickDateInput
                      value={formData.dpi_date}
                      onChange={(d) => handleDateChange("dpi_date", d)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Final Inspection Date</label>
                    <QuickDateInput
                      value={formData.final_inspection_date}
                      onChange={(d) => handleDateChange("final_inspection_date", d)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Ex-Factory Date</label>
                    <QuickDateInput
                      value={formData.ex_factory}
                      onChange={(d) => handleDateChange("ex_factory", d)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Cargo Handover Date</label>
                    <QuickDateInput
                      value={formData.cargo_handover_date}
                      onChange={(d) => handleDateChange("cargo_handover_date", d)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Delay from Ex-Factory (Days)</label>
                    <input
                      type="number"
                      name="delay_from_ex_factory"
                      value={formData.delay_from_ex_factory}
                      readOnly
                      style={{
                        ...styles.input,
                        backgroundColor: "#f5f7fa",
                        cursor: "not-allowed",
                        color: delayColor(formData.delay_from_ex_factory),
                      }}
                      placeholder="Auto-calculated"
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Delay from ETD (Days)</label>
                    <input
                      type="number"
                      name="delay_from_etd"
                      value={formData.delay_from_etd}
                      readOnly
                      style={{
                        ...styles.input,
                        backgroundColor: "#f5f7fa",
                        cursor: "not-allowed",
                        color: delayColor(formData.delay_from_etd),
                      }}
                      placeholder="Auto-calculated"
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>ETD</label>
                    <QuickDateInput
                      value={formData.etd}
                      onChange={(d) => handleDateChange("etd", d)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>ETA</label>
                    <QuickDateInput
                      value={formData.eta}
                      onChange={(d) => handleDateChange("eta", d)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>IC Issue Date</label>
                    <QuickDateInput
                      value={formData.ic_issue_date}
                      onChange={(d) => handleDateChange("ic_issue_date", d)}
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>

              {/* Commission & Values Section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <FaPercent style={styles.sectionIcon} />
                  <h2 style={styles.sectionTitle}>Commission & Values</h2>
                </div>
                <div style={styles.formGrid}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Commission Calculation Method</label>
                    <select
                      name="commission_calc_method"
                      value={formData.commission_calc_method}
                      onChange={handleChange}
                      style={styles.select}
                    >
                      {commissionCalcMethodOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.commission_calc_method ===
                  "unit_price_minus_factory" ? (
                    <>
                      <div style={styles.formField}>
                        <label style={styles.formLabel}>Factory Price ($)</label>
                        <input
                          type="number"
                          name="factory_price"
                          value={formData.factory_price}
                          onChange={handleChange}
                          step="0.0001"
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.formField}>
                        <label style={styles.formLabel}>Commission Rate ($)</label>
                        <input
                          type="number"
                          name="commission_rate"
                          value={formData.commission_rate}
                          readOnly
                          placeholder="Auto: Unit Price − Factory Price"
                          style={{
                            ...styles.input,
                            backgroundColor: "#f5f7fa",
                            cursor: "not-allowed",
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div style={styles.formField}>
                      <label style={styles.formLabel}>Commission Percent (%)</label>
                      <input
                        type="number"
                        name="commission_percent"
                        value={formData.commission_percent}
                        onChange={handleChange}
                        step="0.01"
                        style={styles.input}
                      />
                    </div>
                  )}
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Estimated Commission ($)</label>
                    <input
                      type="number"
                      name="estimated_commission"
                      value={formData.estimated_commission}
                      readOnly
                      style={{
                        ...styles.input,
                        backgroundColor: "#f5f7fa",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Actual Commission ($)</label>
                    <input
                      type="number"
                      name="actual_commission"
                      value={formData.actual_commission}
                      readOnly
                      style={{
                        ...styles.input,
                        backgroundColor: "#f5f7fa",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Commission Receipt Date</label>
                    <QuickDateInput
                      value={formData.commission_rec_date}
                      onChange={(d) => handleDateChange("commission_rec_date", d)}
                      style={styles.input}
                    />
                  </div>
                  {canViewOrderPricing() && (
                    <div style={styles.formField}>
                      <label style={styles.formLabel}>Factory Value ($)</label>
                      <input
                        type="number"
                        name="factory_value"
                        value={formData.factory_value}
                        readOnly
                        style={{
                          ...styles.input,
                          backgroundColor: "#f5f7fa",
                          cursor: "not-allowed",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks Section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <FaFlask style={styles.sectionIcon} />
                  <h2 style={styles.sectionTitle}>Remarks</h2>
                </div>
                <div style={styles.formGrid}>
                  <div style={styles.formFieldFull}>
                    <label style={styles.formLabel}>Remarks</label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      rows={3}
                      style={styles.textarea}
                    />
                  </div>
                </div>
              </div>

              {/* Files & Images Section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <FaPaperclip style={styles.sectionIcon} />
                  <h2 style={styles.sectionTitle}>Files & Images</h2>
                </div>
                <div style={styles.filesUploadSection}>
                  <div
                    style={{
                      ...styles.uploadArea,
                      ...(isDraggingImage && styles.uploadAreaDragging),
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(false);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop("image", e)}
                  >
                    <label style={styles.uploadLabel}>
                      <FaImage /> Product Images
                    </label>
                    <div style={styles.dropZone}>
                      <FaCloudUploadAlt style={styles.dropZoneIcon} />
                      <p>Drag & drop images here or click to browse</p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: "none" }}
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" style={styles.browseButton}>
                        Browse Files
                      </label>
                    </div>
                    {pendingFiles.images.map((item) => (
                      <div key={item.id} style={styles.fileItem}>
                        <div
                          style={styles.imageThumbnail}
                          onClick={() => {
                            setSelectedImage(item.preview);
                            setShowImageViewer(true);
                          }}
                        >
                          <img
                            src={item.preview}
                            alt={item.name}
                            style={styles.thumbnailImg}
                          />
                        </div>
                        <div style={styles.fileInfo}>
                          <span style={styles.fileName}>{item.name}</span>
                          <span style={styles.fileSize}>
                            {(item.file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <div style={styles.fileActions}>
                          <button
                            onClick={() =>
                              openRenameModal("images", item.id, item.name)
                            }
                            style={styles.renameFileBtn}
                          >
                            <FaEditIcon /> Rename
                          </button>
                          <button
                            onClick={() => removePendingFile("images", item.id)}
                            style={styles.removeFileBtn}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {canViewOrderAttachments() && (
                    <div
                      style={{
                        ...styles.uploadArea,
                        ...(isDraggingAttachment && styles.uploadAreaDragging),
                        marginTop: "32px",
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setIsDraggingAttachment(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingAttachment(false);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop("attachment", e)}
                    >
                      <label style={styles.uploadLabel}>
                        <FaFileAlt /> Documents & Attachments
                      </label>
                      <div style={styles.dropZone}>
                        <FaCloudUploadAlt style={styles.dropZoneIcon} />
                        <p>Drag & drop files here or click to browse</p>
                        <input
                          type="file"
                          multiple
                          onChange={handleAttachmentSelect}
                          style={{ display: "none" }}
                          id="attachment-upload"
                        />
                        <label
                          htmlFor="attachment-upload"
                          style={styles.browseButton}
                        >
                          Browse Files
                        </label>
                      </div>
                      {pendingFiles.attachments.map((item) => (
                        <div key={item.id} style={styles.fileItem}>
                          <FaFileAlt style={styles.fileIcon} />
                          <div style={styles.fileInfo}>
                            <span style={styles.fileName}>{item.name}</span>
                            <span style={styles.fileSize}>
                              {(item.file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <div style={styles.fileActions}>
                            <button
                              onClick={() =>
                                openRenameModal("attachments", item.id, item.name)
                              }
                              style={styles.renameFileBtn}
                            >
                              <FaEditIcon /> Rename
                            </button>
                            <button
                              onClick={() =>
                                removePendingFile("attachments", item.id)
                              }
                              style={styles.removeFileBtn}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sample Files - separate from Attachments; shown to
                      Merchandiser - Production in its own view-only tab on
                      the Detail page, but they never reach this Add page to
                      upload/rename/remove them. */}
                  <div
                    style={{
                      ...styles.uploadArea,
                      ...(isDraggingSampleFile && styles.uploadAreaDragging),
                      marginTop: "32px",
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setIsDraggingSampleFile(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingSampleFile(false);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop("sample_file", e)}
                  >
                    <label style={styles.uploadLabel}>
                      <FaFileAlt /> Sample Files
                    </label>
                    <div style={styles.dropZone}>
                      <FaCloudUploadAlt style={styles.dropZoneIcon} />
                      <p>Drag & drop files here or click to browse</p>
                      <input
                        type="file"
                        multiple
                        onChange={handleSampleFileSelect}
                        style={{ display: "none" }}
                        id="sample-file-upload"
                      />
                      <label
                        htmlFor="sample-file-upload"
                        style={styles.browseButton}
                      >
                        Browse Files
                      </label>
                    </div>
                    {pendingFiles.sampleFiles.map((item) => (
                      <div key={item.id} style={styles.fileItem}>
                        <FaFileAlt style={styles.fileIcon} />
                        <div style={styles.fileInfo}>
                          <span style={styles.fileName}>{item.name}</span>
                          <span style={styles.fileSize}>
                            {(item.file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <div style={styles.fileActions}>
                          <button
                            onClick={() =>
                              openRenameModal(
                                "sampleFiles",
                                item.id,
                                item.name,
                              )
                            }
                            style={styles.renameFileBtn}
                          >
                            <FaEditIcon /> Rename
                          </button>
                          <button
                            onClick={() =>
                              removePendingFile("sampleFiles", item.id)
                            }
                            style={styles.removeFileBtn}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                style={styles.btnCancel}
                onClick={() => navigate("/orders")}
              >
                <FaTimes /> Cancel
              </button>
              <button
                style={styles.btnPrimary}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner
                      style={{ animation: "spin 1s linear infinite" }}
                    />{" "}
                    Creating...
                  </>
                ) : (
                  <>
                    <FaSave /> Create Order
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Rename Modal */}
          {showRenameModal && renamingFile && (
            <div
              style={styles.modalOverlay}
              onClick={() => setShowRenameModal(false)}
            >
              <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Rename File</h3>
                  <button
                    style={styles.modalClose}
                    onClick={() => setShowRenameModal(false)}
                  >
                    <FaTimes />
                  </button>
                </div>
                <div style={styles.modalBody}>
                  <div style={styles.renameSection}>
                    <label style={styles.formLabel}>Current Name:</label>
                    <div style={styles.currentFileName}>
                      {renamingFile.currentName}
                    </div>
                  </div>
                  <div style={styles.renameSection}>
                    <label style={styles.formLabel}>New Name (without extension):</label>
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="Enter new file name"
                      style={styles.renameInput}
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === "Enter") renamePendingFile();
                      }}
                    />
                    <div style={styles.fileExtensionHint}>
                      Extension will remain: .
                      {renamingFile.currentName.split(".").pop()}
                    </div>
                  </div>
                </div>
                <div style={styles.modalFooter}>
                  <button
                    style={styles.modalCancel}
                    onClick={() => setShowRenameModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    style={styles.modalSubmit}
                    onClick={renamePendingFile}
                  >
                    <FaCheck /> Rename
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Image Viewer Modal */}
          {showImageViewer && selectedImage && (
            <div
              style={styles.modalOverlay}
              onClick={() => {
                setShowImageViewer(false);
                setSelectedImage(null);
              }}
            >
              <div
                style={styles.imageViewerModal}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={styles.imageViewerHeader}>
                  <h3 style={styles.modalTitle}>Image Preview</h3>
                  <button
                    style={styles.modalClose}
                    onClick={() => {
                      setShowImageViewer(false);
                      setSelectedImage(null);
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>
                <div style={styles.imageViewerBody}>
                  <img
                    src={selectedImage}
                    alt="Preview"
                    style={styles.fullImage}
                  />
                </div>
                <div style={styles.imageViewerFooter}>
                  <a href={selectedImage} download style={styles.modalSubmit}>
                    <FaDownload /> Download
                  </a>
                </div>
              </div>
            </div>
          )}

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
                onClick={() =>
                  setSnackbar((prev) => ({ ...prev, open: false }))
                }
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

const styles = orderFormStyles;

const styleSheet = document.createElement("style");
styleSheet.textContent = `@keyframes spin { to { transform: rotate(360deg); } } input:focus, select:focus, textarea:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); } button:hover { transform: translateY(-1px); } .dropdownItem:hover { background-color: #f8fafc; }`;
document.head.appendChild(styleSheet);

export default AddOrder;
