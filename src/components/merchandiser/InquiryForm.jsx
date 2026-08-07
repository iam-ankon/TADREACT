// InquiryForm.jsx - Complete Fixed Version with Department Field Working for CREATE and EDIT

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";

const InquiryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const supplierDropdownRef = useRef(null);
  const supplierInputRef = useRef(null);

  // ==================== DROPDOWN DATA STATES ====================
  const [buyers, setBuyers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [departments, setDepartments] = useState([]);

  // ==================== SUPPLIER PRICES STATE ====================
  const [supplierPrices, setSupplierPrices] = useState({});

  // ==================== FILE UPLOAD STATES ====================
  const [multipleAttachments, setMultipleAttachments] = useState([]);
  const [multipleImages, setMultipleImages] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [renamingFile, setRenamingFile] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [deletedAttachments, setDeletedAttachments] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);

  // ==================== COLOR & SIZE STATES ====================
  const [sizeType, setSizeType] = useState("numeric");
  const [sizeRange, setSizeRange] = useState("");
  const [availableSizes, setAvailableSizes] = useState([]);
  const [colorSizeGroups, setColorSizeGroups] = useState([]);
  const [deletedGroupIds, setDeletedGroupIds] = useState([]);

  const alphaSizes = [
    "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL", "9XL", "10XL",
  ];

  // ==================== FORM DATA ====================
  const [formData, setFormData] = useState({
    inquiry_no: "",
    season: "",
    year: new Date().getFullYear().toString(),
    repeat_of: "",
    same_style: "",
    buyer: "",
    shipment_date: "",
    wgr: "",
    with_hanger: "",
    program: "",
    order_type: "",
    garment: "",
    gender: "",
    item: "",
    fabrication: "",
    received_date: new Date().toISOString().split("T")[0],
    proposed_shipment_date: "",
    techrefdate: "",
    confirmed_price_date: "",
    remarks: "",
    remarks1: "",
    target_price: "",
    offer_price: "",
    confirmed_price: "",
    current_status: "pending",
    customer: "",
    order_no: "",
    order_quantity: "",
    value: "",
    texweave_price: "",
    pdm_key: "",
    short_description: "",
    sap_articale_no: "",
    suppliers: [],
    development_sample_status: "",
    development_sample_date: "",
    development_sample_courrier_reference: "",
    department: null, // CHANGE: Use null instead of empty string
  });

  // ==================== FILTERED SUPPLIERS ====================
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
      (supplier.email &&
        supplier.email.toLowerCase().includes(supplierSearchTerm.toLowerCase())),
  );

  // ==================== OPTION LISTS ====================
  const orderTypeOptions = [
    { value: "advertisement", label: "Advertisement" },
    { value: "programmer", label: "Programmer" },
  ];

  const genderOptions = [
    { value: "all", label: "All" },
    { value: "blanks", label: "Blanks" },
    { value: "ladies", label: "Ladies" },
    { value: "mens", label: "Mens" },
    { value: "boy", label: "Boy" },
    { value: "girls", label: "Girls" },
    { value: "mama", label: "Mama" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "quoted", label: "Quoted" },
    { value: "confirmed", label: "Confirmed" },
  ];

  const developmentSampleStatusOptions = [
    { value: "No", label: "No" },
    { value: "Yes", label: "Yes" },
  ];

  const garmentOptions = [
    { value: "all", label: "All" },
    { value: "knit", label: "Knit" },
    { value: "woven", label: "Woven" },
    { value: "sweater", label: "Sweater" },
    { value: "underwear", label: "Underwear" },
  ];

  const seasonOptions = [
    { value: "spring", label: "Spring" },
    { value: "summer", label: "Summer" },
    { value: "autumn", label: "Autumn" },
    { value: "winter", label: "Winter" },
  ];

  const withHangerOptions = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  // Helper function to detect size type from sizes array
  const detectSizeTypeAndRange = (sizes) => {
    if (!sizes || sizes.length === 0) return { type: "numeric", range: "" };

    const firstSize = sizes[0].size;
    if (alphaSizes.includes(firstSize)) {
      return { type: "alpha", range: "all" };
    }

    const numericSizes = sizes
      .map((s) => parseInt(s.size))
      .filter((n) => !isNaN(n));
    if (numericSizes.length > 0) {
      const minSize = Math.min(...numericSizes);
      const maxSize = Math.max(...numericSizes);
      return { type: "numeric", range: `${minSize}-${maxSize}` };
    }

    return { type: "numeric", range: "" };
  };

  const generateAvailableSizes = (type, range) => {
    if (type === "alpha" && range === "all") {
      return alphaSizes.map((size) => ({ size, quantity: 0 }));
    }

    if (type === "numeric" && range.includes("-")) {
      const [start, end] = range.split("-").map(Number);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        const sizes = [];
        for (let i = start; i <= end; i++) {
          if (i % 2 === 0) {
            sizes.push({ size: i.toString(), quantity: 0 });
          }
        }
        return sizes;
      }
    }

    return [];
  };

  const convertBackendGroupsToFrontend = (backendGroups, availableSizesList) => {
    if (!backendGroups || backendGroups.length === 0) {
      return [
        {
          id: Date.now(),
          color: "",
          sizes: availableSizesList.map((s) => ({ ...s, quantity: 0 })),
          total: 0,
        },
      ];
    }

    return backendGroups.map((group, idx) => {
      const groupSizes = availableSizesList.map((availSize) => {
        const existingSize = group.size_quantities?.find(
          (sq) => sq.size === availSize.size,
        );
        return {
          size: availSize.size,
          quantity: existingSize ? existingSize.quantity : 0,
        };
      });

      return {
        id: group.id || idx + 1,
        color: group.color || "",
        sizes: groupSizes,
        total: group.total || groupSizes.reduce((sum, s) => sum + s.quantity, 0),
      };
    });
  };

  // ==================== FETCH INITIAL DATA ====================
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [buyersRes, customersRes, suppliersRes, departmentsRes] = await Promise.all([
          axios.get("http://119.148.51.38:8000/api/merchandiser/api/buyer/"),
          axios.get("http://119.148.51.38:8000/api/merchandiser/api/customer/"),
          axios.get("http://119.148.51.38:8000/api/csr/api/supplier/"),
          axios.get("http://119.148.51.38:8000/api/merchandiser/api/department/"),
        ]);

        setBuyers(buyersRes.data || []);
        console.log("✅ Buyers loaded:", buyersRes.data?.length || 0);

        // Transform departments
        const transformedDepartments = (departmentsRes.data || []).map((dept) => ({
          id: dept.id,
          name: dept.name || dept.department_display || `Department ${dept.id}`,
        }));
        transformedDepartments.sort((a, b) => a.name.localeCompare(b.name));
        setDepartments(transformedDepartments);
        console.log("✅ Departments loaded:", transformedDepartments);

        // Transform customers
        const transformedCustomers = (customersRes.data || []).map((cust) => {
          let displayName = "";

          if (cust.hrms_customer_name && cust.hrms_customer_name !== "null") {
            displayName = cust.hrms_customer_name;
          } else if (cust.customer_name && cust.customer_name !== "null") {
            displayName = cust.customer_name;
          } else if (cust.name) {
            if (typeof cust.name === "object") {
              displayName = cust.name.customer_name || cust.name.name || `Customer ${cust.id}`;
            } else if (typeof cust.name === "string" && cust.name !== "null") {
              displayName = cust.name;
            } else {
              displayName = `Customer ${cust.id}`;
            }
          } else if (cust.name && cust.name.customer_name) {
            displayName = cust.name.customer_name;
          } else {
            displayName = `Customer ${cust.id}`;
          }

          return {
            id: cust.id,
            name: displayName,
            display_name: displayName,
            customer_name: displayName,
          };
        });
        setCustomers(transformedCustomers);
        console.log("✅ Customers loaded:", transformedCustomers.length);

        // Transform suppliers
        const transformedSuppliers = (suppliersRes.data || []).map((sup) => ({
          id: sup.id,
          name: sup.supplier_name || sup.name || `Supplier ${sup.id}`,
          email: sup.email || "",
        }));
        setSuppliers(transformedSuppliers);
        console.log("✅ Suppliers loaded:", transformedSuppliers.length);

        if (isEditMode) {
          await fetchInquiryData(transformedSuppliers);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        alert("Error loading data. Please refresh the page.");
        setLoading(false);
      }
    };

    const fetchInquiryData = async (transformedSuppliers) => {
      try {
        const inquiryRes = await axios.get(
          `http://119.148.51.38:8000/api/merchandiser/api/inquiry/${id}/`,
        );
        const inquiryData = inquiryRes.data;
        console.log("📋 Fetched inquiry data:", inquiryData);

        // Extract customer ID
        let customerId = null;
        if (inquiryData.customer) {
          if (typeof inquiryData.customer === "object") {
            customerId = inquiryData.customer.id?.toString() || null;
          } else {
            customerId = inquiryData.customer.toString();
          }
        }

        // ========== FIXED: Extract department ID ==========
        let departmentId = null;
        if (inquiryData.department) {
          if (typeof inquiryData.department === "object") {
            departmentId = inquiryData.department.id?.toString() || null;
          } else {
            departmentId = inquiryData.department.toString();
          }
          console.log("📋 Department ID extracted from inquiry:", departmentId);
        } else {
          console.log("⚠️ No department found in inquiry data");
        }

        // Extract buyer ID
        let buyerId = null;
        if (inquiryData.buyer) {
          if (typeof inquiryData.buyer === "object") {
            buyerId = inquiryData.buyer.id?.toString() || null;
          } else {
            buyerId = inquiryData.buyer.toString();
          }
        }

        // Set form data
        setFormData({
          ...inquiryData,
          received_date: inquiryData.received_date
            ? inquiryData.received_date.split("T")[0]
            : "",
          shipment_date: inquiryData.shipment_date
            ? inquiryData.shipment_date.split("T")[0]
            : "",
          proposed_shipment_date: inquiryData.proposed_shipment_date
            ? inquiryData.proposed_shipment_date.split("T")[0]
            : "",
          techrefdate: inquiryData.techrefdate
            ? inquiryData.techrefdate.split("T")[0]
            : "",
          confirmed_price_date: inquiryData.confirmed_price_date
            ? inquiryData.confirmed_price_date.split("T")[0]
            : "",
          buyer: buyerId,
          customer: customerId,
          suppliers: inquiryData.suppliers?.map((s) => s.id) || [],
          department: departmentId, // Set department ID
        });
        console.log("📋 Form data set with department:", departmentId);

        // Set supplier prices
        const initialSupplierPrices = {};
        if (inquiryData.supplier_prices && inquiryData.supplier_prices.length > 0) {
          inquiryData.supplier_prices.forEach((price) => {
            const supplierId = price.supplier;
            initialSupplierPrices[supplierId] = {
              price: price.price ? price.price.toString() : "",
              name: transformedSuppliers.find((s) => s.id === supplierId)?.name ||
                `Supplier ${supplierId}`,
            };
          });
        }
        setSupplierPrices(initialSupplierPrices);

        // Set existing files
        setExistingAttachments(inquiryData.multiple_attachments || []);
        setExistingImages(inquiryData.multiple_images || []);

        // Set color size groups
        if (inquiryData.color_size_groups && inquiryData.color_size_groups.length > 0) {
          const allSizes = [];
          inquiryData.color_size_groups.forEach((group) => {
            if (group.size_quantities) {
              group.size_quantities.forEach((sq) => {
                if (!allSizes.includes(sq.size)) {
                  allSizes.push(sq.size);
                }
              });
            }
          });

          allSizes.sort((a, b) => {
            if (alphaSizes.includes(a) && alphaSizes.includes(b)) {
              return alphaSizes.indexOf(a) - alphaSizes.indexOf(b);
            }
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            return 0;
          });

          const { type, range } = detectSizeTypeAndRange(
            allSizes.map((s) => ({ size: s, quantity: 0 })),
          );
          setSizeType(type);
          setSizeRange(range);

          const newAvailableSizes = generateAvailableSizes(type, range);
          setAvailableSizes(newAvailableSizes);

          const convertedGroups = convertBackendGroupsToFrontend(
            inquiryData.color_size_groups,
            newAvailableSizes,
          );
          setColorSizeGroups(convertedGroups);
        } else {
          setColorSizeGroups([
            { id: Date.now(), color: "", sizes: [], total: 0 },
          ]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching inquiry:", error);
        alert("Error loading inquiry data. Please try again.");
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditMode]);

  // ==================== FORM HANDLERS ====================
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle numeric fields
    if (
      name === "wgr" ||
      name === "order_quantity" ||
      name === "target_price" ||
      name === "offer_price" ||
      name === "confirmed_price" ||
      name === "texweave_price"
    ) {
      const numValue = value === "" ? null : parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        [name]: isNaN(numValue) ? null : numValue,
      }));

      // Auto-update status when confirmed price is set
      if (name === "confirmed_price" && value !== "" && parseFloat(value) > 0) {
        setFormData((prev) => ({
          ...prev,
          current_status: "confirmed",
        }));
      } else if (
        name === "confirmed_price" &&
        (value === "" || parseFloat(value) === 0)
      ) {
        setFormData((prev) => ({
          ...prev,
          current_status: "pending",
        }));
      }

      // Auto-calculate value
      setTimeout(() => {
        setFormData((current) => {
          const confirmedPrice =
            name === "confirmed_price"
              ? value === "" || value === null
                ? 0
                : parseFloat(value)
              : current.confirmed_price || 0;

          const orderQty =
            name === "order_quantity"
              ? value === "" || value === null
                ? 0
                : parseFloat(value)
              : current.order_quantity || 0;

          const calculatedValue = confirmedPrice * orderQty;

          return {
            ...current,
            value:
              isNaN(calculatedValue) || calculatedValue === 0
                ? null
                : calculatedValue,
          };
        });
      }, 0);
    } else {
      // For department field, handle null properly
      if (name === "department") {
        setFormData((prev) => ({ ...prev, [name]: value === "" ? null : value }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value === "" ? null : value }));
      }
    }
  };

  // ==================== SUPPLIER HANDLERS ====================
  const handleSupplierChange = (supplierId) => {
    const id = parseInt(supplierId);
    setFormData((prev) => {
      const currentSuppliers = prev.suppliers || [];
      let newSuppliers;

      if (currentSuppliers.includes(id)) {
        newSuppliers = currentSuppliers.filter((s) => s !== id);
        setSupplierPrices((prevPrices) => {
          const newPrices = { ...prevPrices };
          delete newPrices[id];
          return newPrices;
        });
      } else {
        newSuppliers = [...currentSuppliers, id];
        const supplier = suppliers.find((s) => s.id === id);
        setSupplierPrices((prevPrices) => ({
          ...prevPrices,
          [id]: { price: "", name: supplier?.name || `Supplier ${id}` },
        }));
      }

      return {
        ...prev,
        suppliers: newSuppliers,
      };
    });
  };

  const handleSupplierPriceChange = (supplierId, price) => {
    setSupplierPrices((prev) => ({
      ...prev,
      [supplierId]: { ...prev[supplierId], price: price === "" ? null : price },
    }));
  };

  const getSelectedSupplierNames = () => {
    if (!formData.suppliers || formData.suppliers.length === 0) return "";
    return formData.suppliers
      .map((id) => {
        const supplier = suppliers.find((s) => s.id === id);
        return supplier?.name || `Supplier ${id}`;
      })
      .join(", ");
  };

  // ==================== FILE UPLOAD HANDLERS ====================
  const handleMultipleFilesUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (type === "attachments") {
      const newAttachments = files.map((file) => ({
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        isNew: true,
        preview: null,
      }));
      setMultipleAttachments((prev) => [...prev, ...newAttachments]);
    } else if (type === "images") {
      const newImages = files.map((file) => ({
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        isNew: true,
        preview: URL.createObjectURL(file),
      }));
      setMultipleImages((prev) => [...prev, ...newImages]);
    }
  };

  const handleRemoveExistingFile = async (type, filePath) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this ${type === "attachments" ? "attachment" : "image"}?`,
      )
    ) {
      return;
    }

    try {
      const filename = filePath.split("/").pop();
      const response = await axios.delete(
        `http://119.148.51.38:8000/api/merchandiser/api/inquiry/${id}/delete-file/`,
        {
          params: {
            file_path: filename,
            file_type: type,
          },
        },
      );

      if (response.data.success) {
        if (type === "attachments") {
          setExistingAttachments((prev) =>
            prev.filter((f) => {
              const existingFilename = f.split("/").pop();
              return existingFilename !== filename;
            }),
          );
          setDeletedAttachments((prev) => [...prev, filePath]);
        } else {
          setExistingImages((prev) =>
            prev.filter((f) => {
              const existingFilename = f.split("/").pop();
              return existingFilename !== filename;
            }),
          );
          setDeletedImages((prev) => [...prev, filePath]);
        }
        alert("File deleted successfully!");
      } else {
        alert(
          "Failed to delete file: " + (response.data.error || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert(
        `Failed to delete file: ${error.response?.data?.error || error.message}`,
      );
    }
  };

  const handleRemoveNewFile = (type, index) => {
    if (type === "attachments") {
      setMultipleAttachments((prev) => prev.filter((_, i) => i !== index));
    } else {
      const imageToRemove = multipleImages[index];
      if (imageToRemove.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      setMultipleImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Rename handlers
  const openRenameModal = (type, identifier, currentName, isExisting = false) => {
    const nameWithoutExt = currentName.split(".").slice(0, -1).join(".");
    setNewFileName(nameWithoutExt);
    setRenamingFile({ type, identifier, isExisting });
  };

  const handleRenameExistingFile = async (type, filePath, newName) => {
    if (!newName || newName.trim() === "") {
      alert("Please enter a valid name");
      return;
    }

    try {
      const response = await axios.post(
        `http://119.148.51.38:8000/api/merchandiser/api/inquiry/${id}/rename-file/`,
        {
          file_path: filePath,
          file_type: type,
          new_name: newName.trim(),
        },
      );

      if (response.data.success) {
        if (type === "attachments") {
          setExistingAttachments((prev) =>
            prev.map((f) => (f === filePath ? response.data.new_path : f)),
          );
        } else {
          setExistingImages((prev) =>
            prev.map((f) => (f === filePath ? response.data.new_path : f)),
          );
        }
        alert("File renamed successfully!");
      } else {
        alert(
          "Failed to rename file: " + (response.data.error || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error renaming file:", error);
      alert("Failed to rename file. Please try again.");
    }
    setRenamingFile(null);
    setNewFileName("");
  };

  const handleRenameNewFile = (type, index, newName) => {
    if (!newName || newName.trim() === "") {
      alert("Please enter a valid name");
      return;
    }

    const file =
      type === "attachments"
        ? multipleAttachments[index]
        : multipleImages[index];
    const oldExtension = file.name.split(".").pop();
    const newFileNameOnly = `${newName.trim()}.${oldExtension}`;

    if (type === "attachments") {
      setMultipleAttachments((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, name: newFileNameOnly } : item,
        ),
      );
    } else {
      setMultipleImages((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, name: newFileNameOnly } : item,
        ),
      );
    }
    setRenamingFile(null);
    setNewFileName("");
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http")) return filePath;
    if (filePath.startsWith("/")) return `http://119.148.51.38:8000${filePath}`;
    return `http://119.148.51.38:8000/${filePath}`;
  };

  // ==================== COLOR & SIZE HANDLERS ====================
  const handleSizeTypeChange = (e) => {
    const newSizeType = e.target.value;
    setSizeType(newSizeType);
    setSizeRange("");
    setAvailableSizes([]);
    setColorSizeGroups([{ id: Date.now(), color: "", sizes: [], total: 0 }]);
  };

  const handleSizeRangeChange = (e) => {
    const value = e.target.value;
    setSizeRange(value);

    if (sizeType === "numeric") {
      if (value.includes("-")) {
        const [start, end] = value.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          const sizes = [];
          for (let i = start; i <= end; i++) {
            if (i % 2 === 0) {
              sizes.push({ size: i.toString(), quantity: 0 });
            }
          }
          setAvailableSizes(sizes);
          setColorSizeGroups([
            {
              id: Date.now(),
              color: "",
              sizes: sizes.map((size) => ({ size: size.size, quantity: 0 })),
              total: 0,
            },
          ]);
        }
      } else {
        setAvailableSizes([]);
        setColorSizeGroups([
          { id: Date.now(), color: "", sizes: [], total: 0 },
        ]);
      }
    } else if (sizeType === "alpha") {
      if (value === "all") {
        const sizes = alphaSizes.map((size) => ({ size, quantity: 0 }));
        setAvailableSizes(sizes);
        setColorSizeGroups([
          {
            id: Date.now(),
            color: "",
            sizes: sizes.map((size) => ({ size: size.size, quantity: 0 })),
            total: 0,
          },
        ]);
      } else {
        setAvailableSizes([]);
        setColorSizeGroups([
          { id: Date.now(), color: "", sizes: [], total: 0 },
        ]);
      }
    }
  };

  const addColorGroup = () => {
    setColorSizeGroups((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        color: "",
        sizes: availableSizes.map((size) => ({ ...size, quantity: 0 })),
        total: 0,
      },
    ]);
  };

  const removeColorGroup = (groupId) => {
    const groupToDelete = colorSizeGroups.find((g) => g.id === groupId);
    if (
      groupToDelete?.id &&
      typeof groupToDelete.id === "number" &&
      groupToDelete.id < 1000000
    ) {
      setDeletedGroupIds((prev) => [...prev, groupToDelete.id]);
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

  // ==================== SUBMIT HANDLER - FIXED ====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const {
        buyer,
        customer,
        suppliers: formSuppliers,
        department,
        ...restFormData
      } = formData;

      console.log("🔍 SUBMIT DEBUG:");
      console.log("  - department value:", department);
      console.log("  - department type:", typeof department);
      console.log("  - is null?", department === null);
      console.log("  - is undefined?", department === undefined);
      console.log("  - is empty string?", department === "");

      const payload = {};

      const allFields = [
        "inquiry_no",
        "season",
        "year",
        "repeat_of",
        "same_style",
        "shipment_date",
        "wgr",
        "with_hanger",
        "program",
        "order_type",
        "garment",
        "gender",
        "item",
        "fabrication",
        "received_date",
        "proposed_shipment_date",
        "techrefdate",
        "confirmed_price_date",
        "remarks",
        "remarks1",
        "target_price",
        "offer_price",
        "confirmed_price",
        "current_status",
        "order_no",
        "order_quantity",
        "texweave_price",
        "pdm_key",
        "short_description",
        "sap_articale_no",
        "development_sample_status",
        "development_sample_date",
        "development_sample_courrier_reference",
      ];

      for (const field of allFields) {
        const value = restFormData[field];
        payload[field] =
          value === "" || value === null || value === undefined ? null : value;
      }

      if (restFormData.wgr !== undefined && restFormData.wgr !== "") {
        payload.wgr =
          restFormData.wgr === null ? null : parseFloat(restFormData.wgr);
      }
      if (restFormData.order_quantity !== undefined && restFormData.order_quantity !== "") {
        payload.order_quantity =
          restFormData.order_quantity === null
            ? null
            : parseInt(restFormData.order_quantity);
      }
      if (restFormData.target_price !== undefined && restFormData.target_price !== "") {
        payload.target_price =
          restFormData.target_price === null
            ? null
            : parseFloat(restFormData.target_price);
      }
      if (restFormData.offer_price !== undefined && restFormData.offer_price !== "") {
        payload.offer_price =
          restFormData.offer_price === null
            ? null
            : parseFloat(restFormData.offer_price);
      }
      if (restFormData.confirmed_price !== undefined && restFormData.confirmed_price !== "") {
        payload.confirmed_price =
          restFormData.confirmed_price === null
            ? null
            : parseFloat(restFormData.confirmed_price);
      }
      if (restFormData.texweave_price !== undefined && restFormData.texweave_price !== "") {
        payload.texweave_price =
          restFormData.texweave_price === null
            ? null
            : parseFloat(restFormData.texweave_price);
      }

      // ========== SET FOREIGN KEYS ==========
      payload.buyer_id = buyer && buyer !== "" ? parseInt(buyer) : null;
      payload.customer_id = customer && customer !== "" ? parseInt(customer) : null;
      
      // ========== FIX: Department ID ==========
      // Check if department has a valid value
      if (department !== null && department !== undefined && department !== "" && department !== "null" && department !== "undefined") {
        payload.department_id = parseInt(department);
        console.log("✅ Department ID set to:", payload.department_id);
      } else {
        payload.department_id = null;
        console.log("⚠️ Department ID set to null");
      }
      
      payload.supplier_ids = formSuppliers && formSuppliers.length > 0 ? formSuppliers : [];

      console.log("📋 Final payload department_id:", payload.department_id);

      // Supplier prices
      const supplierPricesData = (formSuppliers || []).map((supplierId) => ({
        supplier: supplierId,
        price: supplierPrices[supplierId]?.price
          ? parseFloat(supplierPrices[supplierId].price)
          : null,
      }));
      if (supplierPricesData.length > 0 || formSuppliers?.length > 0) {
        payload.supplier_prices = supplierPricesData;
      }

      // Color size groups
      const colorGroupsData = colorSizeGroups
        .filter((group) => group.color && group.color.trim() !== "")
        .map((group) => ({
          color: group.color,
          size_quantities: group.sizes
            .filter((size) => size.quantity > 0)
            .map((size) => ({
              size: size.size.toString(),
              quantity: parseInt(size.quantity) || 0,
            })),
        }))
        .filter((group) => group.size_quantities.length > 0);

      payload.color_size_groups = colorGroupsData.length > 0 ? colorGroupsData : [];
      payload.grand_total = calculateGrandTotal() > 0 ? calculateGrandTotal() : 0;

      // Delete tracking for edit mode
      if (isEditMode) {
        if (deletedGroupIds.length > 0) {
          payload.deleted_color_size_group_ids = deletedGroupIds;
        }
        if (deletedAttachments.length > 0) {
          payload.deleted_attachments = deletedAttachments;
        }
        if (deletedImages.length > 0) {
          payload.deleted_images = deletedImages;
        }
      }

      console.log("📋 Full payload:", JSON.stringify(payload, null, 2));

      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(payload));

      // Append files
      multipleAttachments.forEach((file) => {
        formDataToSend.append("multiple_attachments_upload", file.file);
      });

      multipleImages.forEach((file) => {
        formDataToSend.append("multiple_images_upload", file.file);
      });

      let response;
      if (isEditMode) {
        response = await axios.put(
          `http://119.148.51.38:8000/api/merchandiser/api/inquiry/${id}/`,
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
      } else {
        response = await axios.post(
          `http://119.148.51.38:8000/api/merchandiser/api/inquiry/`,
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
      }

      if (response.status === 200 || response.status === 201) {
        alert(
          isEditMode
            ? "Inquiry updated successfully!"
            : "Inquiry created successfully!",
        );
        navigate("/inquiries");
      }
    } catch (error) {
      console.error("Error saving inquiry:", error);
      console.error("Error response:", error.response?.data);

      let errorMessage = `Failed to ${isEditMode ? "update" : "create"} inquiry.`;
      if (error.response?.data) {
        if (typeof error.response.data === "object") {
          errorMessage += "\n\n" + JSON.stringify(error.response.data, null, 2);
        } else {
          errorMessage += "\n\n" + error.response.data;
        }
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== RENAME MODAL ====================
  const renderRenameModal = () => {
    if (!renamingFile) return null;

    return (
      <div style={styles.modalOverlay} onClick={() => setRenamingFile(null)}>
        <div style={styles.renameModal} onClick={(e) => e.stopPropagation()}>
          <h4 style={styles.renameTitle}>Rename File</h4>
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            style={styles.renameInput}
            placeholder="Enter new name (without extension)"
            autoFocus
          />
          <div style={styles.renameActions}>
            <button
              onClick={() => setRenamingFile(null)}
              style={styles.renameCancelBtn}
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (renamingFile.isExisting) {
                  await handleRenameExistingFile(
                    renamingFile.type,
                    renamingFile.identifier,
                    newFileName,
                  );
                } else {
                  if (renamingFile.type === "attachments") {
                    handleRenameNewFile(
                      "attachments",
                      renamingFile.identifier,
                      newFileName,
                    );
                  } else if (renamingFile.type === "images") {
                    handleRenameNewFile(
                      "images",
                      renamingFile.identifier,
                      newFileName,
                    );
                  }
                  setRenamingFile(null);
                }
              }}
              style={styles.renameSaveBtn}
              type="button"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER HELPERS ====================
  const renderField = (label, name, type = "text", placeholder = "") => (
    <div style={styles.inputGroup}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name] === null ? "" : formData[name] || ""}
        onChange={handleChange}
        style={styles.input}
        placeholder={placeholder}
      />
    </div>
  );

  const renderTextArea = (label, name, rows = 3) => (
    <div style={styles.inputGroupFull}>
      <label style={styles.label}>{label}</label>
      <textarea
        name={name}
        value={formData[name] === null ? "" : formData[name] || ""}
        onChange={handleChange}
        style={styles.textarea}
        rows={rows}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  );

  const renderSelect = (label, name, options) => {
    const safeOptions = Array.isArray(options) ? options : [];

    return (
      <div style={styles.inputGroup}>
        <label style={styles.label}>{label}</label>
        <select
          name={name}
          value={
            formData[name] === null ? "" : formData[name]?.toString() || ""
          }
          onChange={handleChange}
          style={styles.select}
        >
          <option value="">Select {label}</option>
          {safeOptions.map((option) => (
            <option
              key={option.value || option.id}
              value={option.value?.toString() || option.id?.toString() || ""}
            >
              {option.label ||
                option.name ||
                option.display_name ||
                option.customer_name ||
                `${label} ${option.id}`}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderDateField = (label, name) => (
    <div style={styles.inputGroup}>
      <label style={styles.label}>{label}</label>
      <input
        type="date"
        name={name}
        value={formData[name] === null ? "" : formData[name] || ""}
        onChange={handleChange}
        style={styles.input}
      />
    </div>
  );

  const renderExistingAttachments = () => {
    if (!existingAttachments || existingAttachments.length === 0) return null;

    return (
      <div style={styles.fileSection}>
        <label style={styles.label}>Existing Attachments</label>
        <div style={styles.fileList}>
          {existingAttachments.map((filePath, index) => {
            const fileName = filePath.split("/").pop();
            const fileUrl = getFileUrl(filePath);

            return (
              <div key={index} style={styles.fileItem}>
                <div style={styles.fileIcon}>📄</div>
                <div style={styles.fileInfo}>
                  <div style={styles.fileName}>{fileName}</div>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.fileDownloadLink}
                  >
                    📥 Download
                  </a>
                </div>
                <div style={styles.fileActions}>
                  <button
                    onClick={() =>
                      openRenameModal("attachments", filePath, fileName, true)
                    }
                    style={styles.fileActionBtn}
                    type="button"
                    title="Rename"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() =>
                      handleRemoveExistingFile("attachments", filePath)
                    }
                    style={styles.fileActionBtnDelete}
                    type="button"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderExistingImages = () => {
    if (!existingImages || existingImages.length === 0) return null;

    return (
      <div style={styles.fileSection}>
        <label style={styles.label}>Existing Images</label>
        <div style={styles.imageGrid}>
          {existingImages.map((filePath, index) => {
            const fileName = filePath.split("/").pop();
            const imageUrl = getFileUrl(filePath);

            return (
              <div key={index} style={styles.imageCard}>
                <img
                  src={imageUrl}
                  alt={fileName}
                  style={styles.imagePreview}
                />
                <div style={styles.imageOverlay}>
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.imageActionBtn}
                  >
                    👁️
                  </a>
                  <button
                    onClick={() =>
                      openRenameModal("images", filePath, fileName, true)
                    }
                    style={styles.imageActionBtn}
                    type="button"
                    title="Rename"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleRemoveExistingFile("images", filePath)}
                    style={styles.imageActionBtnDelete}
                    type="button"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
                <div style={styles.imageName}>
                  {fileName.length > 20
                    ? fileName.substring(0, 20) + "..."
                    : fileName}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNewAttachments = () => {
    if (multipleAttachments.length === 0) return null;

    return (
      <div style={styles.fileSection}>
        <label style={styles.label}>New Attachments</label>
        <div style={styles.fileList}>
          {multipleAttachments.map((file, index) => (
            <div key={index} style={styles.fileItem}>
              <div style={styles.fileIcon}>📄</div>
              <div style={styles.fileInfo}>
                <div style={styles.fileName}>{file.name}</div>
                <div style={styles.fileSize}>
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <div style={styles.fileActions}>
                <button
                  onClick={() =>
                    openRenameModal("new_attachments", index, file.name, false)
                  }
                  style={styles.fileActionBtn}
                  type="button"
                  title="Rename"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleRemoveNewFile("attachments", index)}
                  style={styles.fileActionBtnDelete}
                  type="button"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderNewImages = () => {
    if (multipleImages.length === 0) return null;

    return (
      <div style={styles.fileSection}>
        <label style={styles.label}>New Images</label>
        <div style={styles.imageGrid}>
          {multipleImages.map((image, index) => (
            <div key={index} style={styles.imageCard}>
              <img
                src={image.preview}
                alt={image.name}
                style={styles.imagePreview}
              />
              <div style={styles.imageOverlay}>
                <button
                  onClick={() =>
                    openRenameModal("new_images", index, image.name, false)
                  }
                  style={styles.imageActionBtn}
                  type="button"
                  title="Rename"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleRemoveNewFile("images", index)}
                  style={styles.imageActionBtnDelete}
                  type="button"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
              <div style={styles.imageName}>
                {image.name.length > 20
                  ? image.name.substring(0, 20) + "..."
                  : image.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMultipleAttachmentsUpload = () => (
    <div style={styles.fileSection}>
      <label style={styles.label}>Add New Attachments</label>
      <div
        style={styles.uploadArea}
        onClick={() => fileInputRef.current?.click()}
      >
        <span style={styles.uploadIcon}>📎</span>
        <span>Click to upload multiple attachments</span>
        <small>Supports: PDF, DOC, DOCX, XLS, XLSX, etc.</small>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={(e) => handleMultipleFilesUpload(e, "attachments")}
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
      />
    </div>
  );

  const renderMultipleImagesUpload = () => (
    <div style={styles.fileSection}>
      <label style={styles.label}>Add New Images</label>
      <div
        style={styles.uploadArea}
        onClick={() => imageInputRef.current?.click()}
      >
        <span style={styles.uploadIcon}>🖼️</span>
        <span>Click to upload multiple images</span>
        <small>Supports: JPG, PNG, GIF, WEBP</small>
      </div>
      <input
        type="file"
        ref={imageInputRef}
        multiple
        accept="image/*"
        onChange={(e) => handleMultipleFilesUpload(e, "images")}
        style={{ display: "none" }}
      />
    </div>
  );

  const renderSupplierPriceInputs = () => {
    if (!formData.suppliers || formData.suppliers.length === 0) {
      return (
        <div style={styles.inputGroupFull}>
          <label style={styles.label}>Supplier Prices</label>
          <div style={styles.helperText}>
            No suppliers selected. Add suppliers above to set prices.
          </div>
        </div>
      );
    }

    return (
      <div style={styles.inputGroupFull}>
        <label style={styles.label}>Supplier Prices</label>
        <div style={styles.supplierPriceGrid}>
          {formData.suppliers.map((supplierId) => {
            const supplier = suppliers.find((s) => s.id === supplierId);
            if (!supplier) return null;
            const priceData = supplierPrices[supplierId] || {
              price: "",
              name: supplier.name,
            };
            return (
              <div key={`price-${supplierId}`} style={styles.supplierPriceCard}>
                <span style={styles.supplierPriceName}>{supplier.name}</span>
                <input
                  type="number"
                  step="0.01"
                  value={priceData.price === null ? "" : priceData.price || ""}
                  onChange={(e) =>
                    handleSupplierPriceChange(supplierId, e.target.value)
                  }
                  style={styles.supplierPriceInput}
                  placeholder="Enter price"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading inquiry data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>📝</div>
            <div>
              <h1 style={styles.headerTitle}>
                {isEditMode ? "Edit Inquiry" : "Create New Inquiry"}
              </h1>
              <p style={styles.headerSubtitle}>
                {isEditMode
                  ? `Update inquiry #${formData.inquiry_no || id}`
                  : "Fill in the details to create a new inquiry"}
              </p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button
              onClick={() => navigate("/inquiries")}
              style={styles.cancelBtn}
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitBtn}
            >
              {isSubmitting
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Update Inquiry"
                : "Create Inquiry"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* SECTION 1: BASIC INFORMATION */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📋</span>
              Basic Information
            </h3>
            <div style={styles.formGrid}>
              {renderField("Inquiry Number", "inquiry_no", "text", "e.g., INQ-2024-001")}
              {renderSelect("Order Type", "order_type", orderTypeOptions)}
              {renderSelect("Garment Type", "garment", garmentOptions)}
              {renderSelect("Gender", "gender", genderOptions)}
              {renderSelect("Season", "season", seasonOptions)}
              {renderField("Program", "program", "text", "Program name")}
              {renderField("WGR", "wgr", "number", "Weight/Grade Ratio")}
              {renderField("Year", "year", "text", "e.g., 2024")}
              {renderField("Repeat Of", "repeat_of", "text", "Repeat order reference")}
              {renderField("Style Name", "same_style", "text", "Style name/number")}
              {renderField("Item", "item", "text", "Item description")}
              {renderField("Fabrication", "fabrication", "text", "Fabrication details")}
              {renderSelect("With Hanger", "with_hanger", withHangerOptions)}
              {renderField("Order Quantity", "order_quantity", "number", "Total order quantity")}
              {renderField("SAP Article No", "sap_articale_no", "text", "SAP article number")}
              {renderField("PDM Key", "pdm_key", "text", "PDM system key")}
              {renderTextArea("Short Description", "short_description", 6)}
            </div>
          </div>

          {/* DEVELOPMENT SAMPLE INFORMATION */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>🧪</span>
              Development Sample
            </h3>
            <div style={styles.formGrid}>
              {renderSelect("Status", "development_sample_status", developmentSampleStatusOptions)}
              {renderDateField("Date", "development_sample_date")}
              {renderTextArea("Courier Reference", "development_sample_courrier_reference", 4)}
            </div>
          </div>

          {/* SECTION 2: DATES */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📅</span>
              Dates
            </h3>
            <div style={styles.formGrid}>
              {renderDateField("Received Date", "received_date")}
              {renderDateField("Shipment Date", "shipment_date")}
              {renderDateField("Proposed Shipment Date", "proposed_shipment_date")}
              {renderDateField("Tech Ref Date", "techrefdate")}
              {renderDateField("Confirmed Price Date", "confirmed_price_date")}
            </div>
          </div>

          {/* SECTION 3: PRICING */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>💰</span>
              Pricing
            </h3>
            <div style={styles.formGrid}>
              {renderField("Target Price", "target_price", "number", "USD")}
              {renderField("Offer Price", "offer_price", "number", "USD")}
              {renderField("Confirmed Price", "confirmed_price", "number", "USD")}
              {renderField("Texweave Price", "texweave_price", "number", "USD")}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Value (Order Quantity x Confirmed Price)
                </label>
                <input
                  type="number"
                  name="value"
                  value={formData.value === null ? "" : formData.value || ""}
                  readOnly
                  style={{
                    ...styles.input,
                    backgroundColor: "#f3f4f6",
                    cursor: "not-allowed",
                  }}
                  placeholder="Auto-calculated"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: COLOR & SIZING */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <span style={styles.sectionIcon}>🎨</span>
                Color & Sizing
              </h3>
              <button
                onClick={addColorGroup}
                type="button"
                style={styles.addButton}
              >
                + Add Color
              </button>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Size Type</label>
                <select
                  value={sizeType}
                  onChange={handleSizeTypeChange}
                  style={styles.select}
                >
                  <option value="numeric">Numeric Sizes (Even numbers only)</option>
                  <option value="alpha">Alpha Sizes (XS, S, M, L, XL, XXL, XXXL, 4XL, 5XL, 6XL, 7XL, 8XL, 9XL, 10XL)</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  {sizeType === "numeric" ? "Size Range" : "Size Selection"}
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

            {availableSizes.length > 0 && (
              <div style={styles.tableWrapper}>
                <table style={styles.colorSizeTable}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Color</th>
                      {availableSizes.map((size) => (
                        <th key={size.size} style={styles.tableHeader}>
                          Size {size.size}
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
                            placeholder="Color name"
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
                          {colorSizeGroups.length > 1 && (
                            <button
                              onClick={() => removeColorGroup(group.id)}
                              type="button"
                              style={styles.removeButton}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={styles.tableFooter}>
                        <strong>GRAND TOTAL</strong>
                      </td>
                      {availableSizes.map((size) => {
                        const sizeTotal = colorSizeGroups.reduce(
                          (sum, group) =>
                            sum +
                            (group.sizes.find((s) => s.size === size.size)
                              ?.quantity || 0),
                          0,
                        );
                        return (
                          <td key={size.size} style={styles.tableFooter}>
                            <strong>{sizeTotal}</strong>
                          </td>
                        );
                      })}
                      <td style={styles.tableFooter}>
                        <strong>{calculateGrandTotal()}</strong>
                      </td>
                      <td style={styles.tableFooter}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 5: FILES */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📁</span>
              Files
            </h3>

            {renderExistingAttachments()}
            {renderExistingImages()}
            {renderMultipleAttachmentsUpload()}
            {renderMultipleImagesUpload()}
            {renderNewAttachments()}
            {renderNewImages()}
          </div>

          {/* SECTION 6: BUYER, CUSTOMER, DEPARTMENT & SUPPLIERS */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>👥</span>
              Buyer, Customer, Department & Suppliers
            </h3>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Buyer</label>
                <select
                  name="buyer"
                  value={formData.buyer === null ? "" : formData.buyer?.toString() || ""}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="">Select Buyer</option>
                  {buyers.map((buyer) => (
                    <option key={buyer.id} value={buyer.id.toString()}>
                      {buyer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Customer</label>
                <select
                  name="customer"
                  value={formData.customer === null ? "" : formData.customer?.toString() || ""}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="">Select Customer</option>
                  {Array.isArray(customers) &&
                    customers.map((customer) => {
                      let customerName = "";
                      if (customer) {
                        customerName =
                          customer.display_name ||
                          customer.name ||
                          customer.customer_name ||
                          `Customer ${customer.id}`;
                      }
                      return (
                        <option
                          key={customer?.id || Math.random()}
                          value={customer?.id?.toString() || ""}
                        >
                          {customerName}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* ========== DEPARTMENT FIELD ========== */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Department</label>
                <select
                  name="department"
                  value={formData.department === null || formData.department === "" ? "" : formData.department?.toString() || ""}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <small style={styles.helperText}>
                  Select the department for this inquiry
                </small>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Suppliers</label>
                <div style={{ position: "relative" }}>
                  <input
                    ref={supplierInputRef}
                    type="text"
                    value={getSelectedSupplierNames()}
                    onClick={() => {
                      setShowSupplierDropdown(!showSupplierDropdown);
                      setSupplierSearchTerm("");
                    }}
                    style={styles.input}
                    placeholder="Select suppliers..."
                    readOnly
                  />
                  {showSupplierDropdown && (
                    <div
                      ref={supplierDropdownRef}
                      style={styles.supplierDropdown}
                    >
                      <div style={styles.supplierSearchContainer}>
                        <input
                          type="text"
                          value={supplierSearchTerm}
                          onChange={(e) =>
                            setSupplierSearchTerm(e.target.value)
                          }
                          style={styles.supplierSearchInput}
                          placeholder="🔍 Search by name or email..."
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                      <div style={styles.supplierList}>
                        {filteredSuppliers.length === 0 ? (
                          <div style={styles.noSupplierResult}>
                            No suppliers matching "{supplierSearchTerm}"
                          </div>
                        ) : (
                          filteredSuppliers.map((supplier) => (
                            <label
                              key={supplier.id}
                              style={styles.supplierCheckbox}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  formData.suppliers?.includes(supplier.id) ||
                                  false
                                }
                                onChange={() =>
                                  handleSupplierChange(supplier.id)
                                }
                              />
                              <span>{supplier.name}</span>
                              {supplier.email && (
                                <small style={styles.supplierEmail}>
                                  ({supplier.email})
                                </small>
                              )}
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <small style={styles.helperText}>
                  Selected: {formData.suppliers?.length || 0} supplier(s)
                </small>
              </div>

              {renderSupplierPriceInputs()}
            </div>
          </div>

          {/* SECTION 7: REMARKS */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📝</span>
              Remarks & Status
            </h3>
            <div style={styles.formGrid}>
              {renderSelect("Current Status", "current_status", statusOptions)}

              <div style={styles.inputGroupFull}>
                <label style={styles.label}>General Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks === null ? "" : formData.remarks || ""}
                  onChange={handleChange}
                  style={styles.textarea}
                  rows={3}
                  placeholder="General remarks about this inquiry"
                />
              </div>

              <div style={styles.inputGroupFull}>
                <label style={styles.label}>Additional Remarks</label>
                <textarea
                  name="remarks1"
                  value={formData.remarks1 === null ? "" : formData.remarks1 || ""}
                  onChange={handleChange}
                  style={styles.textarea}
                  rows={3}
                  placeholder="Additional remarks for internal use"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {renderRenameModal()}
    </div>
  );
};

// ==================== STYLES ====================
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f0f2f5",
    fontFamily: "'Inter', sans-serif",
  },
  mainContent: {
    flex: 1,
    padding: "24px 32px",
    overflow: "auto",
    maxHeight: "100vh",
  },
  loadingContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "16px" },
  headerIcon: {
    fontSize: "32px",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  headerSubtitle: { fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" },
  headerActions: { display: "flex", gap: "12px" },
  cancelBtn: {
    padding: "10px 20px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontWeight: "500",
    cursor: "pointer",
  },
  submitBtn: {
    padding: "10px 24px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
  },
  section: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sectionIcon: { fontSize: "20px" },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  inputGroupFull: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    gridColumn: "span 2",
  },
  label: { fontSize: "13px", fontWeight: "600", color: "#475569" },
  input: {
    padding: "10px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  select: {
    padding: "10px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    background: "white",
    cursor: "pointer",
  },
  textarea: {
    padding: "10px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    resize: "vertical",
    fontFamily: "inherit",
  },
  helperText: { fontSize: "11px", color: "#64748b", marginTop: "4px" },
  addButton: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  removeButton: {
    padding: "4px 10px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },
  tableWrapper: { overflowX: "auto", marginTop: "20px" },
  colorSizeTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  tableHeader: {
    padding: "12px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
    borderBottom: "2px solid #e2e8f0",
    fontWeight: "600",
    color: "#475569",
  },
  tableCell: {
    padding: "10px 12px",
    textAlign: "center",
    borderBottom: "1px solid #f1f5f9",
  },
  tableFooter: {
    padding: "12px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    fontWeight: "600",
  },
  colorInput: {
    width: "100px",
    padding: "6px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "13px",
  },
  quantityInput: {
    width: "70px",
    padding: "6px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "13px",
    textAlign: "center",
  },
  totalInput: {
    width: "80px",
    padding: "6px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "13px",
    textAlign: "center",
    backgroundColor: "#f3f4f6",
  },
  supplierDropdown: {
    position: "absolute",
    zIndex: 1000,
    width: "100%",
    maxHeight: "320px",
    overflowY: "auto",
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    marginTop: "4px",
  },
  supplierSearchContainer: {
    padding: "8px",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    backgroundColor: "white",
    zIndex: 1,
  },
  supplierSearchInput: {
    width: "100%",
    padding: "8px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    outline: "none",
  },
  supplierList: { padding: "8px" },
  supplierCheckbox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    cursor: "pointer",
  },
  supplierEmail: { fontSize: "11px", color: "#64748b", marginLeft: "8px" },
  noSupplierResult: {
    padding: "20px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
  },
  supplierPriceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "12px",
    marginTop: "8px",
  },
  supplierPriceCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  supplierPriceName: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#0f172a",
  },
  supplierPriceInput: {
    width: "120px",
    padding: "8px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    textAlign: "right",
  },
  fileSection: { gridColumn: "span 2" },
  uploadArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "30px",
    border: "2px dashed #cbd5e1",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
    backgroundColor: "#f8fafc",
  },
  uploadIcon: { fontSize: "32px" },
  progressBar: {
    width: "100%",
    height: "6px",
    background: "#e2e8f0",
    borderRadius: "3px",
    overflow: "hidden",
    marginTop: "12px",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    transition: "width 0.3s",
  },
  fileList: {
    marginTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "200px",
    overflowY: "auto",
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  fileIcon: { fontSize: "24px" },
  fileInfo: { flex: 1 },
  fileName: { fontSize: "13px", fontWeight: "500", color: "#0f172a" },
  fileSize: { fontSize: "11px", color: "#64748b" },
  fileDownloadLink: {
    fontSize: "11px",
    color: "#3b82f6",
    textDecoration: "none",
    display: "inline-block",
  },
  fileActions: { display: "flex", gap: "8px" },
  fileActionBtn: {
    padding: "6px 10px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  fileActionBtnDelete: {
    padding: "6px 10px",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#dc2626",
  },
  imageGrid: {
    marginTop: "16px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "12px",
    maxHeight: "300px",
    overflowY: "auto",
  },
  imageCard: {
    position: "relative",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    backgroundColor: "#f8fafc",
  },
  imagePreview: { width: "100%", height: "100px", objectFit: "cover" },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    opacity: 0,
    transition: "opacity 0.2s",
  },
  imageActionBtn: {
    padding: "6px 10px",
    background: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    textDecoration: "none",
  },
  imageActionBtnDelete: {
    padding: "6px 10px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  imageName: {
    padding: "6px",
    fontSize: "10px",
    textAlign: "center",
    color: "#64748b",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "white",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  renameModal: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    width: "400px",
    maxWidth: "90%",
  },
  renameTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 16px 0",
  },
  renameInput: {
    width: "100%",
    padding: "12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    marginBottom: "20px",
  },
  renameActions: { display: "flex", justifyContent: "flex-end", gap: "12px" },
  renameCancelBtn: {
    padding: "8px 16px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  renameSaveBtn: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

// Add CSS animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .image-card:hover .image-overlay { opacity: 1; }
    .upload-area:hover { border-color: #3b82f6; background-color: #eff6ff; }
    .supplier-search-input:focus { border-color: #3b82f6; }
    input:focus, select:focus, textarea:focus { border-color: #3b82f6; outline: none; }
  `;
  document.head.appendChild(style);
}

export default InquiryForm;