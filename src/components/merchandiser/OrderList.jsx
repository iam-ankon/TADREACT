// pages/orders/OrderList.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  getOrders,
  deleteOrder,
  getOrderStatsWithFilters,
  getCustomers,
  updateOrder,
} from "../../api/merchandiser";
import Sidebar from "../merchandiser/Sidebar";
import {
  FaPlus,
  FaTrash,
  FaSearch,
  FaChevronDown,
  FaTimes,
  FaFilter,
  FaDownload,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEdit,
  FaChevronLeft,
  FaChevronRight,
  FaBoxes,
  FaDollarSign,
  FaTruck,
  FaCheckCircle,
  FaHourglassHalf,
  FaBan,
  FaFileAlt,
  FaClipboardList,
  FaBuilding,
  FaUser,
  FaTag,
  FaCalendar,
  FaChartLine,
  FaCalendarWeek,
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaColumns,
  FaSave,
  FaStickyNote,
  FaGripVertical,
} from "react-icons/fa";

// Utility functions (keep existing ones)
const formatCurrency = (value) => {
  if (!value && value !== 0) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value) => {
  if (!value && value !== 0) return "N/A";
  return new Intl.NumberFormat("en-US").format(value);
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  } catch {
    return "";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  } catch {
    return "—";
  }
};

const getRelativeTime = (date) => {
  if (!date) return "";
  try {
    const now = new Date();
    const past = new Date(date);
    const diffTime = Math.abs(now - past);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return "";
  }
};

const getCustomerDisplayName = (customer) => {
  if (!customer) return "—";
  if (typeof customer === "object" && customer !== null) {
    return (
      customer.customer_display ||
      customer.customer_name ||
      customer.name ||
      `Customer ${customer.id || ""}`
    );
  }
  return customer;
};

const getSupplierDisplayName = (supplier) => {
  if (!supplier) return "—";
  if (typeof supplier === "object" && supplier !== null) {
    return (
      supplier.supplier_name || supplier.name || `Supplier ${supplier.id || ""}`
    );
  }
  return supplier;
};

const truncateText = (text, maxLength) => {
  if (!text) return "—";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const statusConfig = {
  Running: {
    color: "#10b981",
    bg: "#d1fae5",
    rowBg: "#dfe591",
    icon: <FaCheckCircle />,
    label: "Running",
  },
  Shipped: {
    color: "#10b981",
    bg: "#dbeafe",
    rowBg: "#91e5c9",
    icon: <FaTruck />,
    label: "Shipped",
  },
  Pending: {
    color: "#f59e0b",
    bg: "#fed7aa",
    rowBg: "#fffbeb",
    icon: <FaHourglassHalf />,
    label: "Pending",
  },
  Cancelled: {
    color: "#ef4444",
    bg: "#fee2e2",
    rowBg: "#fef2f2",
    icon: <FaBan />,
    label: "Cancelled",
  },
  Draft: {
    color: "#6b7280",
    bg: "#f3f4f6",
    rowBg: "#f9fafb",
    icon: <FaFileAlt />,
    label: "Draft",
  },
};

// Column configuration - ALL fields from Order model
const ALL_COLUMNS = [
  {
    key: "po_no_style",
    label: "PO No / Style",
    sortable: true,
    sortKey: "po_no",
    width: "180px",
    frozen: true, // Mark this column as frozen
  },
  {
    key: "customer",
    label: "Customer",
    sortable: true,
    sortKey: "customer",
    width: "150px",
  },
  {
    key: "supplier",
    label: "Supplier",
    sortable: true,
    sortKey: "supplier",
    width: "150px",
  },
  {
    key: "garment",
    label: "Garment",
    sortable: true,
    sortKey: "garment",
    width: "100px",
  },
  {
    key: "quantity",
    label: "Quantity",
    sortable: true,
    sortKey: "total_qty",
    align: "right",
    width: "100px",
  },
  {
    key: "unit_price",
    label: "Unit Price",
    sortable: true,
    sortKey: "unit_price",
    align: "right",
    width: "100px",
  },
  {
    key: "total_value",
    label: "Total Value",
    sortable: true,
    sortKey: "total_value",
    align: "right",
    width: "120px",
  },
  {
    key: "shipment_date",
    label: "Shipment Date",
    sortable: true,
    sortKey: "shipment_date",
    width: "120px",
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    sortKey: "status",
    width: "100px",
  },
  {
    key: "style",
    label: "Style",
    sortable: true,
    sortKey: "style",
    width: "120px",
  },
  {
    key: "department",
    label: "Department",
    sortable: true,
    sortKey: "department",
    width: "120px",
  },
  {
    key: "ref_no",
    label: "Ref No",
    sortable: true,
    sortKey: "ref_no",
    width: "120px",
  },
  {
    key: "shipment_month",
    label: "Shipment Month",
    sortable: true,
    sortKey: "shipment_month",
    width: "120px",
  },
  {
    key: "gender",
    label: "Gender",
    sortable: true,
    sortKey: "gender",
    width: "100px",
  },
  {
    key: "item",
    label: "Item",
    sortable: true,
    sortKey: "item",
    width: "120px",
  },
  {
    key: "fabrication",
    label: "Fabrication",
    sortable: true,
    sortKey: "fabrication",
    width: "120px",
  },
  {
    key: "size_range",
    label: "Size Range",
    sortable: true,
    sortKey: "size_range",
    width: "100px",
  },
  { key: "wgr", label: "WGR", sortable: true, sortKey: "wgr", width: "80px" },
  {
    key: "final_inspection_date",
    label: "Final Inspection Date",
    sortable: true,
    sortKey: "final_inspection_date",
    width: "130px",
  },
  {
    key: "ex_factory",
    label: "Ex-Factory",
    sortable: true,
    sortKey: "ex_factory",
    width: "100px",
  },
  { key: "etd", label: "ETD", sortable: true, sortKey: "etd", width: "100px" },
  { key: "eta", label: "ETA", sortable: true, sortKey: "eta", width: "100px" },
  {
    key: "shipped_qty",
    label: "Shipped Qty",
    sortable: true,
    sortKey: "shipped_qty",
    align: "right",
    width: "100px",
  },
  {
    key: "shipped_value",
    label: "Shipped Value",
    sortable: true,
    sortKey: "shipped_value",
    align: "right",
    width: "120px",
  },
  {
    key: "physical_test",
    label: "Physical Test",
    sortable: false,
    width: "120px",
  },
  {
    key: "chemical_test",
    label: "Chemical Test",
    sortable: false,
    width: "120px",
  },
  {
    key: "during_production_inspection",
    label: "During Production Inspection",
    sortable: false,
    width: "150px",
  },
  {
    key: "final_random_inspection",
    label: "Final Random Inspection",
    sortable: false,
    width: "150px",
  },
  {
    key: "factory_value",
    label: "Factory Value",
    sortable: true,
    sortKey: "factory_value",
    align: "right",
    width: "120px",
  },
  {
    key: "group_name",
    label: "Group Name",
    sortable: true,
    sortKey: "group_name",
    width: "120px",
  },
  { key: "remarks", label: "Remarks", sortable: false, width: "250px" },
  { key: "actions", label: "Actions", sortable: false, width: "100px" },
];

const OrderList = () => {
  const navigate = useNavigate();
  const [editingRemarksId, setEditingRemarksId] = useState(null);
  const [editingRemarksValue, setEditingRemarksValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("sidebarsOpenState");
    return stored !== null ? JSON.parse(stored) : true;
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    try {
      const saved = localStorage.getItem("orderItemsPerPage");
      return saved ? parseInt(saved) : 100;
    } catch {
      return 100;
    }
  });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // UI state for stats visibility
  const [showStats, setShowStats] = useState(() => {
    try {
      const saved = localStorage.getItem("orderShowStats");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [showStat, setShowStat] = useState(() => {
    try {
      const saved = localStorage.getItem("orderShowStats");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Column order state for drag and drop
  const [columnOrder, setColumnOrder] = useState(() => {
    try {
      const saved = localStorage.getItem("orderColumnOrder");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    // Default order: the keys in order they appear in ALL_COLUMNS
    return ALL_COLUMNS.map((col) => col.key);
  });

  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem("orderVisibleColumns");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    // Default: show essential columns
    return [
      "po_no_style",
      "customer",
      "supplier",
      "garment",
      "quantity",
      "unit_price",
      "total_value",
      "shipment_date",
      "status",
      "remarks",
      "actions",
    ];
  });
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const columnSelectorRef = useRef(null);

  // Column resize state
  const [columnWidths, setColumnWidths] = useState(() => {
    try {
      const saved = localStorage.getItem("orderColumnWidths");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    const defaultWidths = {};
    ALL_COLUMNS.forEach((col) => {
      defaultWidths[col.key] = col.width || "150px";
    });
    return defaultWidths;
  });
  const [resizingColumn, setResizingColumn] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Data state (keep all existing state)
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total_orders: 0,
    total_value: 0,
    total_quantity: 0,
    avg_price_per_unit: 0,
    garment_stats: {
      knit: {
        total_orders: 0,
        total_quantity: 0,
        total_value: 0,
        avg_price: 0,
      },
      woven: {
        total_orders: 0,
        total_quantity: 0,
        total_value: 0,
        avg_price: 0,
      },
      sweater: {
        total_orders: 0,
        total_quantity: 0,
        total_value: 0,
        avg_price: 0,
      },
      underwear: {
        total_orders: 0,
        total_quantity: 0,
        total_value: 0,
        avg_price: 0,
      },
      other: {
        total_orders: 0,
        total_quantity: 0,
        total_value: 0,
        avg_price: 0,
      },
    },
  });

  // Filter state (keep all existing filter state)
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      return localStorage.getItem("orderSearchQuery") || "";
    } catch {
      return "";
    }
  });
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(() => {
    try {
      return localStorage.getItem("orderSearchQuery") || "";
    } catch {
      return "";
    }
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    try {
      return localStorage.getItem("orderStatusFilter") || "";
    } catch {
      return "";
    }
  });
  const [selectedCustomers, setSelectedCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem("orderCustomerFilter");
      if (saved && saved !== "") {
        if (saved.includes(",")) {
          return saved.split(",");
        }
        return saved ? [saved] : [];
      }
      return [];
    } catch {
      return [];
    }
  });
  const [supplierFilter, setSupplierFilter] = useState(() => {
    try {
      return localStorage.getItem("orderSupplierFilter") || "";
    } catch {
      return "";
    }
  });
  const [garmentFilter, setGarmentFilter] = useState(() => {
    try {
      return localStorage.getItem("orderGarmentFilter") || "";
    } catch {
      return "";
    }
  });

  const [customerOptions, setCustomerOptions] = useState([]);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  const [selectedYearsWithMonths, setSelectedYearsWithMonths] = useState(() => {
    try {
      const saved = localStorage.getItem("selectedYearsWithMonths");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [minValueFilter, setMinValueFilter] = useState(() => {
    try {
      return localStorage.getItem("orderMinValue") || "";
    } catch {
      return "";
    }
  });
  const [maxValueFilter, setMaxValueFilter] = useState(() => {
    try {
      return localStorage.getItem("orderMaxValue") || "";
    } catch {
      return "";
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(() => {
    try {
      const saved = localStorage.getItem("orderShowAdvancedFilters");
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [statusSearch, setStatusSearch] = useState("");
  const [yearSearch, setYearSearch] = useState("");
  const [sortConfig, setSortConfig] = useState(() => {
    try {
      return {
        key: localStorage.getItem("orderSortKey") || "shipment_date",
        direction: localStorage.getItem("orderSortDirection") || "desc",
      };
    } catch {
      return { key: "shipment_date", direction: "desc" };
    }
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [searchTerms, setSearchTerms] = useState([]);
  const [expandedYears, setExpandedYears] = useState({});

  // Refs
  const statusDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);
  const customerDropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const filterTimeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);
  const isFirstFetchDone = useRef(false);
  const tableHeaderRef = useRef(null);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2013; year <= currentYear + 2; year++) {
      years.push(year);
    }
    return years;
  };

  const availableYears = getAvailableYears();
  const customerFilterString = useMemo(() => {
    if (selectedCustomers.length === 0) return "";
    return selectedCustomers.join("|");
  }, [selectedCustomers]);

  // Get ordered and visible columns
  const orderedVisibleColumns = useMemo(() => {
    // Filter to only visible columns
    const visible = columnOrder.filter((key) => visibleColumns.includes(key));
    // Add any visible columns that might not be in columnOrder (shouldn't happen, but safe)
    const missing = visibleColumns.filter((key) => !columnOrder.includes(key));
    return [...visible, ...missing];
  }, [columnOrder, visibleColumns]);

  // Save column order to localStorage
  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem("orderColumnOrder", JSON.stringify(columnOrder));
    }
  }, [columnOrder]);

  // Save column visibility to localStorage
  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem(
        "orderVisibleColumns",
        JSON.stringify(visibleColumns),
      );
    }
  }, [visibleColumns]);

  // Save column widths to localStorage
  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem("orderColumnWidths", JSON.stringify(columnWidths));
    }
  }, [columnWidths]);

  // Close column selector on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        columnSelectorRef.current &&
        !columnSelectorRef.current.contains(event.target)
      ) {
        setShowColumnSelector(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Column resize handlers
  const handleMouseDown = (e, columnKey, currentWidth) => {
    e.preventDefault();
    e.stopPropagation();

    setResizingColumn(columnKey);
    setStartX(e.clientX);
    let widthValue = currentWidth;
    if (typeof currentWidth === "string") {
      const match = currentWidth.match(/(\d+)/);
      if (match) {
        widthValue = parseInt(match[0], 10);
      } else {
        widthValue = 150;
      }
    }
    setStartWidth(widthValue);

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!resizingColumn) return;

      const deltaX = e.clientX - startX;
      const newWidth = Math.max(60, startWidth + deltaX);
      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: `${newWidth}px`,
      }));
    },
    [resizingColumn, startX, startWidth],
  );

  const handleMouseUp = useCallback(() => {
    setResizingColumn(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  // Add/remove mouse event listeners
  useEffect(() => {
    if (resizingColumn) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizingColumn, handleMouseMove, handleMouseUp]);

  // Reset column widths to default
  const resetColumnWidths = () => {
    const defaultWidths = {};
    ALL_COLUMNS.forEach((col) => {
      defaultWidths[col.key] = col.width || "150px";
    });
    setColumnWidths(defaultWidths);
  };

  // Reset individual column width on double click
  const resetColumnWidth = (columnKey) => {
    const defaultColumn = ALL_COLUMNS.find((col) => col.key === columnKey);
    setColumnWidths((prev) => ({
      ...prev,
      [columnKey]: defaultColumn?.width || "150px",
    }));
  };

  const toggleColumn = (columnKey) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnKey)) {
        return prev.filter((key) => key !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  const resetColumns = () => {
    setVisibleColumns([
      "po_no_style",
      "customer",
      "supplier",
      "garment",
      "quantity",
      "unit_price",
      "total_value",
      "shipment_date",
      "status",
      "remarks",
    ]);
  };

  // Drag and drop handlers for columns
  const handleDragStart = (e, columnKey, index) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", columnKey);
    setDraggedColumn({ key: columnKey, index });

    // Set drag image
    const dragImage = document.createElement("div");
    dragImage.textContent = columnKey;
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e, columnKey, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== columnKey) {
      setDragOverColumn({ key: columnKey, index });
    }
  };

  const handleDrop = (e, targetColumnKey, targetIndex) => {
    e.preventDefault();

    if (!draggedColumn) return;

    const sourceKey = draggedColumn.key;
    const sourceIndex = draggedColumn.index;
    const targetKey = targetColumnKey;

    if (sourceKey === targetKey) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    // Don't allow dragging frozen column
    const sourceColumn = ALL_COLUMNS.find((col) => col.key === sourceKey);
    if (sourceColumn?.frozen) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    // Reorder columns
    const newColumnOrder = [...columnOrder];
    newColumnOrder.splice(sourceIndex, 1);
    newColumnOrder.splice(targetIndex, 0, sourceKey);

    setColumnOrder(newColumnOrder);
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  // Keep existing functions (fetchCustomerOptions, useEffect hooks, etc.)
  const fetchCustomerOptions = useCallback(async () => {
    try {
      const response = await getCustomers(1, 500, false);
      if (response && response.data) {
        setCustomerOptions(response.data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  }, []);

  useEffect(() => {
    if (isCustomerDropdownOpen && customerOptions.length === 0) {
      fetchCustomerOptions();
    }
  }, [isCustomerDropdownOpen, fetchCustomerOptions, customerOptions.length]);

  const filteredCustomerOptions = useMemo(() => {
    if (!customerSearchTerm) return customerOptions;
    const searchLower = customerSearchTerm.toLowerCase();
    return customerOptions.filter((customer) => {
      const customerName = getCustomerDisplayName(customer);
      return customerName.toLowerCase().includes(searchLower);
    });
  }, [customerOptions, customerSearchTerm]);

  const isCustomerSelected = (customerName) => {
    return selectedCustomers.includes(customerName);
  };

  const toggleCustomerSelection = (customerName) => {
    setSelectedCustomers((prev) => {
      if (prev.includes(customerName)) {
        return prev.filter((c) => c !== customerName);
      } else {
        return [...prev, customerName];
      }
    });
  };

  const removeCustomer = (customerName) => {
    setSelectedCustomers((prev) => prev.filter((c) => c !== customerName));
  };

  const clearAllCustomers = () => {
    setSelectedCustomers([]);
    setCustomerSearchTerm("");
  };

  const getCustomerDisplayText = () => {
    if (selectedCustomers.length === 0) return "All Customers";
    if (selectedCustomers.length === 1) return selectedCustomers[0];
    return `${selectedCustomers.length} customers selected`;
  };

  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      const terms = debouncedSearchQuery.trim().split(/\s+/);
      setSearchTerms(terms);
    } else {
      setSearchTerms([]);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem(
        "orderShowAdvancedFilters",
        JSON.stringify(showAdvancedFilters),
      );
    }
  }, [showAdvancedFilters]);

  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem("orderShowStats", JSON.stringify(showStats));
    }
  }, [showStats]);

  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem("orderShowStats", JSON.stringify(showStat));
    }
  }, [showStat]);

  const buildFilterParams = useCallback(() => {
    const params = {};

    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      const searchTerms = debouncedSearchQuery.trim().split(/\s+/);
      if (searchTerms.length === 1) {
        params.search = debouncedSearchQuery.trim();
      } else {
        params.search = searchTerms.join("|");
      }
    }

    if (statusFilter && statusFilter !== "") {
      params.status = statusFilter;
    }

    if (customerFilterString && customerFilterString !== "") {
      params.customer = customerFilterString;
    }

    if (supplierFilter && supplierFilter.trim()) {
      params.supplier = supplierFilter.trim();
    }

    if (garmentFilter && garmentFilter.trim()) {
      params.garment = garmentFilter.trim();
    }

    if (selectedYearsWithMonths && selectedYearsWithMonths.length > 0) {
      const yearMonthFilters = [];
      selectedYearsWithMonths.forEach((item) => {
        if (item.months && item.months.length > 0) {
          item.months.forEach((month) => {
            yearMonthFilters.push(`${item.year}-${month}`);
          });
        }
      });
      if (yearMonthFilters.length > 0) {
        params.year_month = yearMonthFilters.join("|");
      }
    }

    if (minValueFilter && minValueFilter !== "") {
      params.min_value = parseFloat(minValueFilter);
    }
    if (maxValueFilter && maxValueFilter !== "") {
      params.max_value = parseFloat(maxValueFilter);
    }

    if (sortConfig.key) {
      const orderPrefix = sortConfig.direction === "desc" ? "-" : "";
      params.ordering = `${orderPrefix}${sortConfig.key}`;
    }

    return params;
  }, [
    debouncedSearchQuery,
    statusFilter,
    customerFilterString,
    supplierFilter,
    garmentFilter,
    selectedYearsWithMonths,
    minValueFilter,
    maxValueFilter,
    sortConfig,
  ]);

  const toggleYear = (year) => {
    const yearStr = year.toString();
    const existingIndex = selectedYearsWithMonths.findIndex(
      (item) => item.year === yearStr,
    );

    if (existingIndex >= 0) {
      setSelectedYearsWithMonths((prev) =>
        prev.filter((item) => item.year !== yearStr),
      );
      setExpandedYears((prev) => {
        const { [yearStr]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setSelectedYearsWithMonths((prev) => [
        ...prev,
        { year: yearStr, months: [] },
      ]);
    }
  };

  const toggleMonthForYear = (year, month) => {
    setSelectedYearsWithMonths((prev) => {
      const yearIndex = prev.findIndex((item) => item.year === year);
      if (yearIndex === -1) return prev;

      const updated = [...prev];
      const currentMonths = updated[yearIndex].months || [];

      if (currentMonths.includes(month)) {
        const newMonths = currentMonths.filter((m) => m !== month);
        if (newMonths.length === 0) {
          return prev.filter((item) => item.year !== year);
        }
        updated[yearIndex] = { ...updated[yearIndex], months: newMonths };
      } else {
        updated[yearIndex] = {
          ...updated[yearIndex],
          months: [...currentMonths, month],
        };
      }

      return updated;
    });
  };

  const selectAllMonthsForYear = (year) => {
    setSelectedYearsWithMonths((prev) => {
      const yearIndex = prev.findIndex((item) => item.year === year);
      if (yearIndex === -1) return prev;

      const updated = [...prev];
      const currentMonths = updated[yearIndex].months || [];

      if (currentMonths.length === months.length) {
        return prev.filter((item) => item.year !== year);
      } else {
        updated[yearIndex] = { ...updated[yearIndex], months: [...months] };
        return updated;
      }
    });
  };

  const clearAllYearsAndMonths = () => {
    setSelectedYearsWithMonths([]);
    setExpandedYears({});
  };

  const toggleYearExpansion = (year, e) => {
    e.stopPropagation();
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const getDisplayText = () => {
    if (selectedYearsWithMonths.length === 0) return "Shipment Date";

    const parts = selectedYearsWithMonths.map((item) => {
      if (item.months.length === 12) return `${item.year} (All)`;
      if (item.months.length === 0) return `${item.year}`;
      return `${item.year} (${item.months.length} month${item.months.length > 1 ? "s" : ""})`;
    });

    if (parts.length === 1) return parts[0];
    return `${parts.length} years selected`;
  };

  const handleSaveRemarks = async (orderId, newRemarks) => {
    try {
      await updateOrder(orderId, { remarks: newRemarks });
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, remarks: newRemarks } : order,
        ),
      );
      setEditingRemarksId(null);
      setEditingRemarksValue("");
    } catch (error) {
      console.error("Error saving remarks:", error);
      setError("Failed to save remarks. Please try again.");
    }
  };

  const handleEditRemarks = (order, e) => {
    e.stopPropagation();
    setEditingRemarksId(order.id);
    setEditingRemarksValue(order.remarks || "");
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingRemarksId(null);
    setEditingRemarksValue("");
  };

  const activeFilterCount =
    [
      statusFilter,
      selectedCustomers.length > 0 ? 1 : 0,
      supplierFilter,
      garmentFilter,
      minValueFilter,
      maxValueFilter,
      ...(selectedYearsWithMonths.length > 0 ? [1] : []),
    ].filter(Boolean).length + (searchQuery ? 1 : 0);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setIsFiltering(true);

      const filters = buildFilterParams();
      const response = await getOrders(currentPage, itemsPerPage, filters);

      let ordersData = [];
      let total = 0;

      if (response && response.data) {
        if (Array.isArray(response.data)) {
          ordersData = response.data;
          total = response.pagination?.count || ordersData.length;
        } else if (
          response.data.results &&
          Array.isArray(response.data.results)
        ) {
          ordersData = response.data.results;
          total = response.data.count || 0;
        } else if (typeof response.data === "object") {
          ordersData = [response.data];
          total = 1;
        } else {
          ordersData = [];
          total = 0;
        }
      } else if (Array.isArray(response)) {
        ordersData = response;
        total = response.length;
      } else {
        ordersData = [];
        total = 0;
      }

      setOrders(ordersData);
      setTotalItems(total);
      setTotalPages(
        response.pagination?.total_pages ||
          Math.ceil(total / itemsPerPage) ||
          1,
      );

      const statsData = await getOrderStatsWithFilters(filters);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
      setOrders([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setIsFiltering(false);
      isFirstFetchDone.current = true;
    }
  }, [currentPage, itemsPerPage, buildFilterParams]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    filterTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem("orderSearchQuery", searchQuery);
        localStorage.setItem("orderStatusFilter", statusFilter);
        localStorage.setItem(
          "orderCustomerFilter",
          selectedCustomers.join(","),
        );
        localStorage.setItem("orderSupplierFilter", supplierFilter);
        localStorage.setItem("orderGarmentFilter", garmentFilter);
        localStorage.setItem(
          "selectedYearsWithMonths",
          JSON.stringify(selectedYearsWithMonths),
        );
        localStorage.setItem("orderMinValue", minValueFilter);
        localStorage.setItem("orderMaxValue", maxValueFilter);
        localStorage.setItem("orderItemsPerPage", itemsPerPage.toString());
        localStorage.setItem("orderSortKey", sortConfig.key);
        localStorage.setItem("orderSortDirection", sortConfig.direction);
      } catch (err) {
        console.error("Error saving to localStorage:", err);
      }
    }, 300);
    return () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    };
  }, [
    searchQuery,
    statusFilter,
    selectedCustomers,
    supplierFilter,
    garmentFilter,
    selectedYearsWithMonths,
    minValueFilter,
    maxValueFilter,
    itemsPerPage,
    sortConfig,
  ]);

  useEffect(() => {
    if (isFirstFetchDone.current) {
      setCurrentPage(1);
    }
  }, [
    debouncedSearchQuery,
    statusFilter,
    customerFilterString,
    supplierFilter,
    garmentFilter,
    selectedYearsWithMonths,
    minValueFilter,
    maxValueFilter,
    sortConfig,
  ]);

  useEffect(() => {
    if (selectAll) {
      setSelectedRows(orders.map((order) => order.id));
    } else if (selectedRows.length === orders.length && orders.length > 0) {
      setSelectedRows([]);
    }
  }, [selectAll, orders]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchInputRef.current &&
        searchInputRef.current.contains(event.target)
      ) {
        return;
      }

      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
      }
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target)
      ) {
        setShowYearDropdown(false);
      }
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target)
      ) {
        setIsCustomerDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStatuses = useMemo(() => {
    return Object.keys(statusConfig).filter((status) =>
      status.toLowerCase().includes(statusSearch.toLowerCase()),
    );
  }, [statusSearch]);

  const filteredYears = useMemo(() => {
    return availableYears.filter((year) =>
      year.toString().includes(yearSearch.toLowerCase()),
    );
  }, [yearSearch, availableYears]);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedRows((prev) => {
      if (prev.includes(id)) {
        return prev.filter((rowId) => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
    if (selectAll) setSelectAll(false);
  };

  const handleDelete = async (order) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteOrder(order.id);
        fetchOrders();
      } catch (error) {
        console.error("Error deleting order:", error);
        setError("Failed to delete order. Please try again.");
      }
    }
  };

  const getValueFontSize = (value) => {
    if (!value) return "24px";
    const numStr = Math.abs(value).toString();
    if (numStr.length > 12) return "18px";
    if (numStr.length > 10) return "20px";
    if (numStr.length > 8) return "22px";
    return "24px";
  };

  const handleExport = useCallback(async () => {
    const ordersToExport =
      selectedRows.length > 0 ? selectedRows : orders.map((order) => order.id);

    if (ordersToExport.length === 0) {
      alert("No orders to export");
      return;
    }

    try {
      setLoading(true);

      const { exportOrdersToExcel } = await import("../../api/merchandiser");

      console.log(`Exporting ${ordersToExport.length} orders to Excel...`);

      const response = await exportOrdersToExcel(ordersToExport);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `Orders_Export_${ordersToExport.length}_orders.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^*]=["']?([^"']+)["']?/,
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      if (selectedRows.length > 0) {
        setSelectedRows([]);
        setSelectAll(false);
      }

      console.log("✅ Export completed successfully");
    } catch (error) {
      console.error("❌ Error exporting orders:", error);
      setError("Failed to export orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [orders, selectedRows]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setStatusFilter("");
    setSelectedCustomers([]);
    setCustomerSearchTerm("");
    setSupplierFilter("");
    setGarmentFilter("");
    setSelectedYearsWithMonths([]);
    setExpandedYears({});
    setMinValueFilter("");
    setMaxValueFilter("");
    setCurrentPage(1);
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    const newValue = parseInt(e.target.value);
    setItemsPerPage(newValue);
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="sort-icon" />;
    return sortConfig.direction === "asc" ? (
      <FaSortUp className="sort-icon active" />
    ) : (
      <FaSortDown className="sort-icon active" />
    );
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.Draft;
    return (
      <span
        style={{
          ...styles.badge,
          ...styles.statusBadge,
          backgroundColor: config.bg,
          color: config.color,
        }}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getRowBackgroundColor = (status, isSelected) => {
    if (isSelected) return "#6a88af";
    const config = statusConfig[status] || statusConfig.Draft;
    return config.rowBg;
  };

  const renderCell = (order, columnKey) => {
    switch (columnKey) {
      case "po_no_style":
        return (
          <div style={styles.orderInfo}>
            <div style={styles.orderDetails}>
              <div style={styles.orderPoNo}>{order.style || "N/A"}</div>
              <div style={styles.orderStyle}>
                <FaTag style={styles.icon} />
                {order.po_no || "No Style"}
              </div>
            </div>
          </div>
        );
      case "customer":
        return (
          <div style={styles.companyInfo}>
            <FaBuilding style={styles.icon} />
            <span>{getCustomerDisplayName(order.customer)}</span>
          </div>
        );
      case "supplier":
        return (
          <div style={styles.companyInfo}>
            <FaUser style={styles.icon} />
            <span>{getSupplierDisplayName(order.supplier)}</span>
          </div>
        );
      case "garment":
        return order.garment || "—";
      case "quantity":
        return (
          <div>
            <span style={{ fontWeight: 500 }}>
              {formatNumber(order.total_qty)}
            </span>
            {order.shipped_qty > 0 && (
              <div style={styles.shippedInfo}>
                {((order.shipped_qty / order.total_qty) * 100).toFixed(0)}%
                shipped
              </div>
            )}
          </div>
        );
      case "unit_price":
        return formatCurrency(order.unit_price);
      case "total_value":
        return (
          <span style={styles.totalValue}>
            {formatCurrency(order.total_value)}
          </span>
        );
      case "shipment_date":
        return (
          <div style={styles.dateInfo}>
            <FaCalendar style={styles.icon} />
            {order.shipment_date ? (
              <>
                <span>{formatDateForDisplay(order.shipment_date)}</span>
                <span style={styles.relativeDate}>
                  ({getRelativeTime(order.shipment_date)})
                </span>
              </>
            ) : (
              "—"
            )}
          </div>
        );
      case "status":
        return getStatusBadge(order.status);
      case "style":
        return order.style || "—";
      case "department":
        return order.department || "—";
      case "ref_no":
        return order.ref_no || "—";
      case "shipment_month":
        return order.shipment_month || "—";
      case "gender":
        return order.gender || "—";
      case "item":
        return order.item || "—";
      case "fabrication":
        return order.fabrication || "—";
      case "size_range":
        return order.size_range || "—";
      case "wgr":
        return order.wgr || "—";
      case "final_inspection_date":
        return formatDate(order.final_inspection_date);
      case "ex_factory":
        return formatDate(order.ex_factory);
      case "etd":
        return formatDate(order.etd);
      case "eta":
        return formatDate(order.eta);
      case "shipped_qty":
        return formatNumber(order.shipped_qty);
      case "shipped_value":
        return formatCurrency(order.shipped_value);
      case "physical_test":
        return truncateText(order.physical_test, 30);
      case "chemical_test":
        return truncateText(order.chemical_test, 30);
      case "during_production_inspection":
        return truncateText(order.during_production_inspection, 30);
      case "final_random_inspection":
        return truncateText(order.final_random_inspection, 30);
      case "factory_value":
        return formatCurrency(order.factory_value);
      case "group_name":
        return order.group_name || "—";
      case "remarks":
        if (editingRemarksId === order.id) {
          return (
            <div
              style={styles.remarksInlineEdit}
              onClick={(e) => e.stopPropagation()}
            >
              <textarea
                value={editingRemarksValue}
                onChange={(e) => setEditingRemarksValue(e.target.value)}
                style={styles.remarksTextarea}
                rows={2}
                autoFocus
                placeholder="Add remarks..."
              />
              <div style={styles.remarksInlineActions}>
                <button
                  style={styles.remarksSaveBtn}
                  onClick={() =>
                    handleSaveRemarks(order.id, editingRemarksValue)
                  }
                  title="Save"
                >
                  <FaCheck size={12} />
                </button>
                <button
                  style={styles.remarksCancelBtn}
                  onClick={handleCancelEdit}
                  title="Cancel"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            </div>
          );
        }
        return (
          <div style={styles.remarksCell} onClick={(e) => e.stopPropagation()}>
            <div style={styles.remarksDisplay}>
              <span style={styles.remarksText}>
                {order.remarks || (
                  <span style={styles.noRemarks}>No remarks</span>
                )}
              </span>
              <button
                style={styles.editRemarksBtn}
                onClick={(e) => handleEditRemarks(order, e)}
                title="Edit remarks"
              >
                <FaEdit size={12} />
              </button>
            </div>
          </div>
        );
      case "actions":
        return (
          <div
            style={styles.actionButtons}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{ ...styles.actionBtn, ...styles.actionBtnEdit }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/edit/${order.id}`);
              }}
              title="Edit Order"
            >
              <FaEdit />
            </button>
            <button
              style={{ ...styles.actionBtn, ...styles.actionBtnDelete }}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(order);
              }}
              title="Delete Order"
            >
              <FaTrash />
            </button>
          </div>
        );
      default:
        return "—";
    }
  };

  const Pagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div style={styles.paginationContainer}>
        <div style={styles.paginationInfo}>
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
          records
          {isFiltering && <span style={styles.filteringIndicator}> ⟳</span>}
        </div>
        <div style={styles.paginationControls}>
          <div style={styles.pageSizeSelector}>
            <span style={styles.pageSizeLabel}>Show:</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              style={styles.pageSizeSelect}
            >
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
          <div style={styles.paginationButtons}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={styles.paginationButton}
            >
              <FaChevronLeft size={12} />
            </button>
            {startPage > 1 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  style={styles.paginationButton}
                >
                  1
                </button>
                {startPage > 2 && (
                  <span style={styles.paginationEllipsis}>...</span>
                )}
              </>
            )}
            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => handlePageChange(number)}
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === number
                    ? styles.paginationButtonActive
                    : {}),
                }}
              >
                {number}
              </button>
            ))}
            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span style={styles.paginationEllipsis}>...</span>
                )}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  style={styles.paginationButton}
                >
                  {totalPages}
                </button>
              </>
            )}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={styles.paginationButton}
            >
              <FaChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !isFirstFetchDone.current) {
    return (
      <div style={styles.appContainer}>
        <Sidebar />
        <div style={styles.mainContent}>
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p style={{ color: "#64748b" }}>Loading order data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.appContainer}>
        <Sidebar />
        <div style={styles.mainContent}>
          <div style={styles.errorState}>
            <div style={styles.errorIcon}>!</div>
            <h3
              style={{
                fontSize: "18px",
                color: "#0f172a",
                marginBottom: "8px",
              }}
            >
              Unable to load data
            </h3>
            <p style={{ color: "#64748b", marginBottom: "20px" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={styles.btnPrimary}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={styles.orderDashboard}>
          {/* Header Section */}
          <div style={styles.pageHeader}>
            <div style={styles.headerLeft}>
              <h1 style={styles.pageTitle}>Orders</h1>
              <div style={styles.headerBadge}>
                <FaBoxes />
                <span>{totalItems} Total</span>
              </div>
            </div>
            <div style={styles.headerActions}>
              <button
                style={styles.btnExport}
                onClick={handleExport}
                disabled={loading || orders.length === 0}
              >
                <FaDownload />
                {selectedRows.length > 0
                  ? `Export ${selectedRows.length} Selected`
                  : "Export All"}
              </button>
              <button
                style={styles.btnPrimary}
                onClick={() => navigate("/orders/add")}
              >
                <FaPlus /> Add Order
              </button>
            </div>
          </div>

          {/* Stats Section with Toggle Button */}
          <div style={styles.statsSection}>
            <div style={styles.statsHeader}>
              <h3 style={styles.statsTitle}>Statistics Overview</h3>
              <button
                style={styles.toggleStatsBtn}
                onClick={() => setShowStats(!showStats)}
                title={showStats ? "Hide statistics" : "Show statistics"}
              >
                {showStats ? <FaEyeSlash /> : <FaEye />}
                {showStats ? "Hide Stats" : "Show Stats"}
              </button>
            </div>
            {showStats && (
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconBlue }}>
                    <FaClipboardList />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Total Orders</span>
                    <span style={styles.statValue}>
                      {formatNumber(stats.total_orders)}
                    </span>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconTeal }}>
                    <FaBoxes />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Total Quantity</span>
                    <span style={styles.statValue}>
                      {formatNumber(stats.total_quantity)}
                    </span>
                    <div style={styles.statSubInfo}>
                      units across all orders
                    </div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconGreen }}>
                    <FaDollarSign />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Total Value</span>
                    <span
                      style={{
                        ...styles.statValue,
                        fontSize: getValueFontSize(stats.total_value),
                      }}
                    >
                      {formatCurrency(stats.total_value)}
                    </span>
                    <div style={styles.statSubInfo}>
                      Avg: {formatCurrency(stats.avg_price_per_unit)}/unit
                    </div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconPurple }}>
                    <FaChartLine />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Knit</span>
                    <div style={styles.statSubInfo}>
                      Qty:{" "}
                      {formatNumber(
                        stats.garment_stats?.knit?.total_quantity || 0,
                      )}
                    </div>
                    <div style={styles.statSubInfo}>
                      Value:{" "}
                      {formatCurrency(
                        stats.garment_stats?.knit?.total_value || 0,
                      )}
                    </div>
                    <div style={styles.statSmallInfo}>
                      Avg:{" "}
                      {formatCurrency(
                        stats.garment_stats?.knit?.avg_price || 0,
                      )}
                      /unit
                    </div>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconOrange }}>
                    <FaChartLine />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Woven</span>
                    <div style={styles.statSubInfo}>
                      Qty:{" "}
                      {formatNumber(
                        stats.garment_stats?.woven?.total_quantity || 0,
                      )}
                    </div>
                    <div style={styles.statSubInfo}>
                      Value:{" "}
                      {formatCurrency(
                        stats.garment_stats?.woven?.total_value || 0,
                      )}
                    </div>
                    <div style={styles.statSmallInfo}>
                      Avg:{" "}
                      {formatCurrency(
                        stats.garment_stats?.woven?.avg_price || 0,
                      )}
                      /unit
                    </div>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div
                    style={{ ...styles.statIcon, ...styles.statIconEmerald }}
                  >
                    <FaChartLine />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Sweater</span>
                    <div style={styles.statSubInfo}>
                      Qty:{" "}
                      {formatNumber(
                        stats.garment_stats?.sweater?.total_quantity || 0,
                      )}
                    </div>
                    <div style={styles.statSubInfo}>
                      Value:{" "}
                      {formatCurrency(
                        stats.garment_stats?.sweater?.total_value || 0,
                      )}
                    </div>
                    <div style={styles.statSmallInfo}>
                      Avg:{" "}
                      {formatCurrency(
                        stats.garment_stats?.sweater?.avg_price || 0,
                      )}
                      /unit
                    </div>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconRed }}>
                    <FaChartLine />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Underwear</span>
                    <div style={styles.statSubInfo}>
                      Qty:{" "}
                      {formatNumber(
                        stats.garment_stats?.underwear?.total_quantity || 0,
                      )}
                    </div>
                    <div style={styles.statSubInfo}>
                      Value:{" "}
                      {formatCurrency(
                        stats.garment_stats?.underwear?.total_value || 0,
                      )}
                    </div>
                    <div style={styles.statSmallInfo}>
                      Avg:{" "}
                      {formatCurrency(
                        stats.garment_stats?.underwear?.avg_price || 0,
                      )}
                      /unit
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters Section */}
          <div style={styles.statsSection}>
            <div style={styles.statsHeader}>
              <h3 style={styles.statsTitle}>Filter</h3>
              <button
                style={styles.toggleStatsBtn}
                onClick={() => setShowStat(!showStat)}
                title={showStat ? "Hide statistics" : "Show statistics"}
              >
                {showStat ? <FaEyeSlash /> : <FaEye />}
                {showStat ? "Hide Stats" : "Show Stats"}
              </button>
            </div>
            {showStat && (
              <div style={styles.filtersSection}>
                <div style={styles.filtersHeader}>
                  <div style={styles.filtersTitle}>
                    <FaFilter style={{ color: "#94a3b8" }} />
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#334155",
                      }}
                    >
                      Filters
                    </h3>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      style={styles.clearFilters}
                      onClick={clearAllFilters}
                    >
                      <FaTimes /> Clear all
                    </button>
                  )}
                </div>

                <div style={styles.filtersGrid}>
                  <div style={styles.searchWrapperSmall} ref={searchInputRef}>
                    <FaSearch style={styles.searchIconSmall} />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={styles.searchInputSmall}
                    />
                    {searchQuery && (
                      <button
                        style={styles.clearSearchSmall}
                        onClick={() => setSearchQuery("")}
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>

                  <div style={styles.filterWrapper} ref={statusDropdownRef}>
                    <div
                      style={{
                        ...styles.filterSelect,
                        ...(showStatusDropdown
                          ? styles.filterSelectActive
                          : {}),
                      }}
                      onClick={() => {
                        setShowStatusDropdown(!showStatusDropdown);
                        setShowYearDropdown(false);
                        setIsCustomerDropdownOpen(false);
                      }}
                    >
                      <span style={statusFilter ? {} : styles.placeholder}>
                        {statusFilter
                          ? statusConfig[statusFilter]?.label || statusFilter
                          : "All Status"}
                      </span>
                      <FaChevronDown style={styles.chevron} />
                    </div>
                    {showStatusDropdown && (
                      <div style={styles.dropdownMenu}>
                        <div style={styles.dropdownSearch}>
                          <FaSearch
                            style={{ color: "#94a3b8", fontSize: "14px" }}
                          />
                          <input
                            type="text"
                            placeholder="Search status..."
                            value={statusSearch}
                            onChange={(e) => setStatusSearch(e.target.value)}
                            style={styles.dropdownSearchInput}
                            autoFocus
                          />
                        </div>
                        <div style={styles.dropdownOptions}>
                          <div
                            style={{
                              ...styles.dropdownOption,
                              ...(!statusFilter
                                ? styles.dropdownOptionSelected
                                : {}),
                            }}
                            onClick={() => {
                              setStatusFilter("");
                              setShowStatusDropdown(false);
                            }}
                          >
                            All Status
                          </div>
                          {filteredStatuses.map((status) => (
                            <div
                              key={status}
                              style={{
                                ...styles.dropdownOption,
                                ...(statusFilter === status
                                  ? styles.dropdownOptionSelected
                                  : {}),
                              }}
                              onClick={() => {
                                setStatusFilter(status);
                                setShowStatusDropdown(false);
                              }}
                            >
                              {statusConfig[status]?.icon}
                              <span style={{ marginLeft: "8px" }}>
                                {statusConfig[status]?.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={styles.filterWrapper} ref={customerDropdownRef}>
                    <div
                      style={{
                        ...styles.filterSelect,
                        ...(isCustomerDropdownOpen
                          ? styles.filterSelectActive
                          : {}),
                      }}
                      onClick={() => {
                        setIsCustomerDropdownOpen(!isCustomerDropdownOpen);
                        setShowStatusDropdown(false);
                        setShowYearDropdown(false);
                      }}
                    >
                      <FaBuilding
                        style={{ color: "#94a3b8", marginRight: "8px" }}
                      />
                      <span
                        style={
                          selectedCustomers.length === 0
                            ? styles.placeholder
                            : {}
                        }
                      >
                        {getCustomerDisplayText()}
                      </span>
                      {selectedCustomers.length > 0 && (
                        <FaTimes
                          style={styles.clearIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            clearAllCustomers();
                          }}
                        />
                      )}
                      <FaChevronDown style={styles.chevron} />
                    </div>
                    {isCustomerDropdownOpen && (
                      <div style={styles.dropdownMenuMultiSelect}>
                        <div style={styles.dropdownSearch}>
                          <FaSearch
                            style={{ color: "#94a3b8", fontSize: "14px" }}
                          />
                          <input
                            type="text"
                            placeholder="Search customers..."
                            value={customerSearchTerm}
                            onChange={(e) =>
                              setCustomerSearchTerm(e.target.value)
                            }
                            style={styles.dropdownSearchInput}
                            autoFocus
                          />
                        </div>
                        <div style={styles.dropdownOptionsMultiSelect}>
                          <div style={styles.multiSelectActions}>
                            <button
                              style={styles.multiSelectActionBtn}
                              onClick={() => {
                                const allCustomerNames = customerOptions.map(
                                  (c) => getCustomerDisplayName(c),
                                );
                                setSelectedCustomers(allCustomerNames);
                              }}
                            >
                              Select All
                            </button>
                            <button
                              style={styles.multiSelectActionBtn}
                              onClick={clearAllCustomers}
                            >
                              Clear All
                            </button>
                          </div>
                          {filteredCustomerOptions.length > 0 ? (
                            filteredCustomerOptions.map((customer) => {
                              const customerName =
                                getCustomerDisplayName(customer);
                              const isSelected =
                                isCustomerSelected(customerName);
                              return (
                                <div
                                  key={customer.id}
                                  style={{
                                    ...styles.dropdownOptionMultiSelect,
                                    ...(isSelected
                                      ? styles.dropdownOptionSelected
                                      : {}),
                                  }}
                                  onClick={() =>
                                    toggleCustomerSelection(customerName)
                                  }
                                >
                                  <div
                                    style={{
                                      ...styles.customCheckbox,
                                      ...(isSelected
                                        ? styles.customCheckboxChecked
                                        : {}),
                                    }}
                                  >
                                    {isSelected && <FaCheck size={10} />}
                                  </div>
                                  <FaBuilding
                                    style={{
                                      marginRight: "8px",
                                      fontSize: "12px",
                                    }}
                                  />
                                  <span>{customerName}</span>
                                </div>
                              );
                            })
                          ) : (
                            <div style={styles.noResultsMessage}>
                              <span>No customers found</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={styles.filterWrapper}>
                    <div style={styles.filterSelect}>
                      <FaUser
                        style={{ color: "#94a3b8", marginRight: "8px" }}
                      />
                      <input
                        type="text"
                        placeholder="Supplier"
                        value={supplierFilter}
                        onChange={(e) => setSupplierFilter(e.target.value)}
                        style={styles.filterInput}
                      />
                      {supplierFilter && (
                        <FaTimes
                          style={styles.clearIcon}
                          onClick={() => setSupplierFilter("")}
                        />
                      )}
                    </div>
                  </div>

                  <div style={styles.filterWrapper}>
                    <div style={styles.filterSelect}>
                      <FaTag style={{ color: "#94a3b8", marginRight: "8px" }} />
                      <input
                        type="text"
                        placeholder="Garment"
                        value={garmentFilter}
                        onChange={(e) => setGarmentFilter(e.target.value)}
                        style={styles.filterInput}
                      />
                      {garmentFilter && (
                        <FaTimes
                          style={styles.clearIcon}
                          onClick={() => setGarmentFilter("")}
                        />
                      )}
                    </div>
                  </div>

                  <div style={styles.filterWrapper} ref={yearDropdownRef}>
                    <div
                      style={{
                        ...styles.filterSelect,
                        ...(showYearDropdown ? styles.filterSelectActive : {}),
                      }}
                      onClick={() => {
                        setShowYearDropdown(!showYearDropdown);
                        setShowStatusDropdown(false);
                        setIsCustomerDropdownOpen(false);
                      }}
                    >
                      <FaCalendarWeek
                        style={{ color: "#94a3b8", marginRight: "8px" }}
                      />
                      <span
                        style={
                          selectedYearsWithMonths.length > 0
                            ? {}
                            : styles.placeholder
                        }
                      >
                        {getDisplayText()}
                      </span>
                      {selectedYearsWithMonths.length > 0 && (
                        <FaTimes
                          style={styles.clearIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            clearAllYearsAndMonths();
                          }}
                        />
                      )}
                      <FaChevronDown style={styles.chevron} />
                    </div>
                    {showYearDropdown && (
                      <div style={styles.yearMonthDropdown}>
                        <div style={styles.dropdownSearch}>
                          <FaSearch
                            style={{ color: "#94a3b8", fontSize: "14px" }}
                          />
                          <input
                            type="text"
                            placeholder="Search year..."
                            value={yearSearch}
                            onChange={(e) => setYearSearch(e.target.value)}
                            style={styles.dropdownSearchInput}
                            autoFocus
                          />
                        </div>
                        <div style={styles.yearsList}>
                          {filteredYears.length > 0 ? (
                            filteredYears.map((year) => {
                              const yearStr = year.toString();
                              const selectedYearData =
                                selectedYearsWithMonths.find(
                                  (item) => item.year === yearStr,
                                );
                              const isSelected = !!selectedYearData;
                              const selectedMonths =
                                selectedYearData?.months || [];
                              const isExpanded = expandedYears[yearStr];

                              return (
                                <div key={year} style={styles.yearItem}>
                                  <div style={styles.yearHeader}>
                                    <div
                                      style={styles.yearCheckboxWrapper}
                                      onClick={() => toggleYear(year)}
                                    >
                                      <div
                                        style={{
                                          ...styles.customCheckbox,
                                          ...(isSelected
                                            ? styles.customCheckboxChecked
                                            : {}),
                                        }}
                                      >
                                        {isSelected && <FaCheck size={10} />}
                                      </div>
                                      <span style={styles.yearLabel}>
                                        {year}
                                      </span>
                                      {selectedMonths.length > 0 && (
                                        <span style={styles.monthCount}>
                                          ({selectedMonths.length} month
                                          {selectedMonths.length !== 1
                                            ? "s"
                                            : ""}
                                          )
                                        </span>
                                      )}
                                    </div>
                                    {isSelected && (
                                      <button
                                        style={styles.expandButton}
                                        onClick={(e) =>
                                          toggleYearExpansion(yearStr, e)
                                        }
                                      >
                                        <FaChevronDown
                                          size={12}
                                          style={{
                                            transform: isExpanded
                                              ? "rotate(180deg)"
                                              : "none",
                                            transition: "transform 0.2s",
                                          }}
                                        />
                                      </button>
                                    )}
                                  </div>
                                  {isExpanded && isSelected && (
                                    <div style={styles.monthsContainer}>
                                      <button
                                        style={styles.selectAllMonthsBtn}
                                        onClick={() =>
                                          selectAllMonthsForYear(yearStr)
                                        }
                                      >
                                        {selectedMonths.length === 12
                                          ? "Deselect All"
                                          : "Select All"}{" "}
                                        Months
                                      </button>
                                      <div style={styles.monthsGrid}>
                                        {months.map((month) => (
                                          <div
                                            key={month}
                                            style={styles.monthItem}
                                            onClick={() =>
                                              toggleMonthForYear(yearStr, month)
                                            }
                                          >
                                            <div
                                              style={{
                                                ...styles.monthCheckbox,
                                                ...(selectedMonths.includes(
                                                  month,
                                                )
                                                  ? styles.monthCheckboxChecked
                                                  : {}),
                                              }}
                                            >
                                              {selectedMonths.includes(
                                                month,
                                              ) && <FaCheck size={8} />}
                                            </div>
                                            <span style={styles.monthName}>
                                              {month.substring(0, 3)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div style={styles.noResultsMessage}>
                              <span>
                                No years found matching "{yearSearch}"
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    style={{
                      ...styles.btnOutlineSmall,
                      ...(showAdvancedFilters ? styles.btnActiveSmall : {}),
                    }}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <FaFilter /> Advanced
                    <FaChevronDown
                      style={{
                        marginLeft: "8px",
                        transform: showAdvancedFilters
                          ? "rotate(180deg)"
                          : "none",
                      }}
                    />
                  </button>

                  <div style={styles.filterWrapper} ref={columnSelectorRef}>
                    <button
                      style={{
                        ...styles.btnOutlineSmall,
                        ...(showColumnSelector ? styles.btnActiveSmall : {}),
                      }}
                      onClick={() => setShowColumnSelector(!showColumnSelector)}
                    >
                      <FaColumns /> Columns
                      <FaChevronDown
                        style={{
                          marginLeft: "8px",
                          transform: showColumnSelector
                            ? "rotate(180deg)"
                            : "none",
                        }}
                      />
                    </button>
                    {showColumnSelector && (
                      <div style={styles.columnSelectorDropdown}>
                        <div style={styles.columnSelectorHeader}>
                          <span>Select Columns to Display</span>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              style={styles.resetColumnsBtn}
                              onClick={resetColumns}
                            >
                              Reset Columns
                            </button>
                            <button
                              style={styles.resetColumnsBtn}
                              onClick={resetColumnWidths}
                            >
                              Reset Widths
                            </button>
                          </div>
                        </div>
                        <div style={styles.columnSelectorList}>
                          {ALL_COLUMNS.map((column) => (
                            <label
                              key={column.key}
                              style={styles.columnCheckboxLabel}
                            >
                              <input
                                type="checkbox"
                                checked={visibleColumns.includes(column.key)}
                                onChange={() => toggleColumn(column.key)}
                                style={styles.columnCheckbox}
                              />
                              <span>{column.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedCustomers.length > 0 && (
                  <div style={styles.selectedTagsContainer}>
                    <span style={styles.selectedTagsLabel}>
                      Selected customers:
                    </span>
                    {selectedCustomers.map((customer, index) => (
                      <span key={index} style={styles.selectedTag}>
                        {customer}
                        <button
                          style={styles.selectedTagRemove}
                          onClick={() => removeCustomer(customer)}
                        >
                          <FaTimes size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {searchTerms.length > 0 && (
                  <div style={styles.searchTermsContainer}>
                    <span style={styles.searchTermsLabel}>Searching for:</span>
                    {searchTerms.map((term, index) => (
                      <span key={index} style={styles.searchTermTag}>
                        {term}
                      </span>
                    ))}
                    <span style={styles.searchLogicHint}>
                      (Matches ANY of these terms)
                    </span>
                  </div>
                )}

                {showAdvancedFilters && (
                  <div style={styles.advancedFilters}>
                    <div style={styles.advancedFilterGroup}>
                      <label style={styles.advancedFilterLabel}>
                        Value Range (USD)
                      </label>
                      <div style={styles.rangeInputs}>
                        <input
                          type="number"
                          placeholder="Min Value"
                          value={minValueFilter}
                          onChange={(e) => setMinValueFilter(e.target.value)}
                          style={styles.rangeInput}
                        />
                        <span style={{ color: "#64748b" }}>to</span>
                        <input
                          type="number"
                          placeholder="Max Value"
                          value={maxValueFilter}
                          onChange={(e) => setMaxValueFilter(e.target.value)}
                          style={styles.rangeInput}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeFilterCount > 0 && (
                  <div style={styles.activeFilters}>
                    {searchQuery && (
                      <span style={styles.filterTag}>
                        Search: {searchQuery}
                        <button
                          style={styles.filterTagButton}
                          onClick={() => setSearchQuery("")}
                        >
                          <FaTimes />
                        </button>
                      </span>
                    )}
                    {statusFilter && (
                      <span style={styles.filterTag}>
                        Status: {statusConfig[statusFilter]?.label}
                        <button
                          style={styles.filterTagButton}
                          onClick={() => setStatusFilter("")}
                        >
                          <FaTimes />
                        </button>
                      </span>
                    )}
                    {selectedCustomers.length > 0 && (
                      <span style={styles.filterTag}>
                        Customers: {selectedCustomers.length} selected
                        <button
                          style={styles.filterTagButton}
                          onClick={clearAllCustomers}
                        >
                          <FaTimes />
                        </button>
                      </span>
                    )}
                    {supplierFilter && (
                      <span style={styles.filterTag}>
                        Supplier: {supplierFilter}
                        <button
                          style={styles.filterTagButton}
                          onClick={() => setSupplierFilter("")}
                        >
                          <FaTimes />
                        </button>
                      </span>
                    )}
                    {garmentFilter && (
                      <span style={styles.filterTag}>
                        Garment: {garmentFilter}
                        <button
                          style={styles.filterTagButton}
                          onClick={() => setGarmentFilter("")}
                        >
                          <FaTimes />
                        </button>
                      </span>
                    )}
                    {selectedYearsWithMonths.map((item) => (
                      <span key={item.year} style={styles.filterTag}>
                        {item.year}:{" "}
                        {item.months.length === 12
                          ? "All months"
                          : item.months.join(", ")}
                        <button
                          style={styles.filterTagButton}
                          onClick={() => toggleYear(item.year)}
                        >
                          <FaTimes />
                        </button>
                      </span>
                    ))}
                    {(minValueFilter || maxValueFilter) && (
                      <span style={styles.filterTag}>
                        Value: {minValueFilter || "0"} - {maxValueFilter || "∞"}
                        <button
                          style={styles.filterTagButton}
                          onClick={() => {
                            setMinValueFilter("");
                            setMaxValueFilter("");
                          }}
                        >
                          <FaTimes />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Table Section */}
          <div style={styles.tableSection}>
            <div style={styles.tableHeader}>
              <div style={styles.tableTitle}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  Order List
                </h3>
                <span style={styles.resultCount}>
                  {totalItems} total records
                </span>
              </div>
              {selectedRows.length > 0 && (
                <div style={styles.selectionInfo}>
                  {selectedRows.length} selected
                </div>
              )}
            </div>

            <div style={styles.tableContainer}>
              <table style={styles.orderTable}>
                <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                  <tr style={{ position: "sticky", top: 0, zIndex: 10 }}>
                    <th
                      style={{
                        ...styles.checkboxCell,
                        position: "sticky",
                        left: 0,
                        top: 0,
                        zIndex: 11,
                        background: "#f8fafc",
                      }}
                    >
                      <label style={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={() => setSelectAll(!selectAll)}
                          style={styles.checkboxInput}
                        />
                        <span style={styles.checkmark}></span>
                      </label>
                    </th>
                    {orderedVisibleColumns.map((columnKey, index) => {
                      const column = ALL_COLUMNS.find(
                        (col) => col.key === columnKey,
                      );
                      if (!column) return null;
                      const isFrozen = column.frozen;
                      return (
                        <th
                          key={columnKey}
                          onClick={
                            column.sortable
                              ? () => handleSort(column.sortKey)
                              : undefined
                          }
                          style={{
                            ...styles.tableHeaderCell,
                            ...(column.sortable ? styles.sortable : {}),
                            ...(column.align === "right"
                              ? { textAlign: "right" }
                              : {}),
                            width:
                              columnWidths[columnKey] ||
                              column.width ||
                              "150px",
                            position: "relative",
                            ...(isFrozen
                              ? {
                                  position: "sticky",
                                  left: "48px",
                                  zIndex: 12,
                                  background: "#f8fafc",
                                }
                              : {
                                  position: "sticky",
                                  top: 0,
                                  zIndex: 10,
                                  background: "#f8fafc",
                                }),
                          }}
                          draggable={!isFrozen}
                          onDragStart={(e) =>
                            !isFrozen && handleDragStart(e, columnKey, index)
                          }
                          onDragOver={(e) =>
                            !isFrozen && handleDragOver(e, columnKey, index)
                          }
                          onDrop={(e) =>
                            !isFrozen && handleDrop(e, columnKey, index)
                          }
                          onDragEnd={handleDragEnd}
                        >
                          <div style={styles.columnHeaderContent}>
                            {!isFrozen && (
                              <FaGripVertical
                                style={styles.dragHandle}
                                size={12}
                              />
                            )}
                            <span>{column.label}</span>
                          </div>
                          {column.sortable && getSortIcon(column.sortKey)}

                          {/* Resize handle */}
                          <div
                            style={{
                              ...styles.resizeHandle,
                              ...(resizingColumn === columnKey
                                ? styles.resizeHandleActive
                                : {}),
                            }}
                            onMouseDown={(e) =>
                              handleMouseDown(
                                e,
                                columnKey,
                                columnWidths[columnKey] || column.width,
                              )
                            }
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              resetColumnWidth(columnKey);
                            }}
                            title="Drag to resize, double-click to reset"
                          />
                          {dragOverColumn?.key === columnKey && !isFrozen && (
                            <div style={styles.dragIndicator} />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((order) => {
                      const isSelected = selectedRows.includes(order.id);
                      const rowBgColor = getRowBackgroundColor(
                        order.status,
                        isSelected,
                      );
                      return (
                        <tr
                          key={order.id}
                          style={{
                            ...styles.orderRow,
                            ...(isSelected ? styles.orderRowSelected : {}),
                            backgroundColor: rowBgColor,
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            console.log("Row clicked!", order.id);
                            navigate(`/orders/${order.id}`);
                          }}
                        >
                          <td
                            style={{
                              ...styles.checkboxCellBody,
                              backgroundColor: rowBgColor,
                              position: "sticky",
                              left: 0,
                              zIndex: 5,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label style={styles.checkbox}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleSelectRow(order.id, e)}
                                style={styles.checkboxInput}
                              />
                              <span style={styles.checkmark}>
                                {isSelected && (
                                  <FaCheck
                                    size={10}
                                    style={{
                                      position: "absolute",
                                      top: "3px",
                                      left: "3px",
                                    }}
                                  />
                                )}
                              </span>
                            </label>
                          </td>
                          {orderedVisibleColumns.map((columnKey) => {
                            const column = ALL_COLUMNS.find(
                              (col) => col.key === columnKey,
                            );
                            if (!column) return null;
                            const isFrozen = column.frozen;
                            return (
                              <td
                                key={columnKey}
                                style={{
                                  ...styles.tableCell,
                                  ...(column.align === "right"
                                    ? { textAlign: "right" }
                                    : {}),
                                  ...(isFrozen
                                    ? {
                                        position: "sticky",
                                        left: "48px",
                                        backgroundColor: rowBgColor,
                                        zIndex: 5,
                                      }
                                    : {}),
                                }}
                                onClick={(e) => {
                                  if (columnKey === "actions") {
                                    e.stopPropagation();
                                  }
                                }}
                              >
                                {renderCell(order, columnKey)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ) : (
                    <tr style={styles.emptyRow}>
                      <td
                        colSpan={orderedVisibleColumns.length + 1}
                        style={{ padding: "60px 20px", textAlign: "center" }}
                      >
                        <div style={styles.emptyState}>
                          <FaBoxes style={styles.emptyIcon} />
                          <h4 style={{ fontSize: "18px", color: "#334155" }}>
                            No orders found
                          </h4>
                          <p style={{ color: "#64748b", marginBottom: "8px" }}>
                            Try adjusting your search or filters
                          </p>
                          <button
                            style={styles.btnOutline}
                            onClick={clearAllFilters}
                          >
                            Clear filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalItems > 0 && <Pagination />}
          </div>
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
    padding: "10px 45px",
    overflowY: "auto",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  orderDashboard: {
    maxWidth: "1800px",
    width: "100%",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: "20px",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: 600,
    color: "#0f172a",
    margin: 0,
  },
  headerBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    background: "white",
    borderRadius: "20px",
    fontSize: "14px",
    color: "#475569",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "none",
    background: "#2563eb",
    color: "white",
  },
  btnExport: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#334155",
  },
  btnOutline: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0 16px",
    height: "40px",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#475569",
  },
  btnOutlineSmall: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "0 12px",
    height: "36px",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#475569",
  },
  btnActiveSmall: {
    background: "#eff6ff",
    borderColor: "#2563eb",
    color: "#2563eb",
  },
  statsSection: {
    background: "white",
    borderRadius: "12px",
    padding: "10px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0",
  },
  statsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1px",
  },
  statsTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#334155",
    margin: 0,
  },
  toggleStatsBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#475569",
    marginBottom: "1px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  statCard: {
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s",
    minWidth: "0",
  },
  statIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    flexShrink: 0,
  },
  statContent: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: "0",
    overflow: "hidden",
  },
  statLabel: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#64748b",
    marginBottom: "8px",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "4px",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    lineHeight: "1.3",
  },
  statSubInfo: {
    fontSize: "13px",
    color: "#475569",
    marginTop: "2px",
    wordBreak: "break-word",
  },
  statSmallInfo: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "4px",
    wordBreak: "break-word",
  },
  statIconBlue: { background: "#dbeafe", color: "#2563eb" },
  statIconTeal: { background: "#ccfbf1", color: "#14b8a6" },
  statIconGreen: { background: "#d1fae5", color: "#10b981" },
  statIconEmerald: { background: "#d1fae5", color: "#059669" },
  statIconPurple: { background: "#ede9fe", color: "#7c3aed" },
  statIconOrange: { background: "#fed7aa", color: "#f59e0b" },
  statIconRed: { background: "#fee2e2", color: "#ef4444" },
  filtersSection: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0",
  },
  filtersHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  filtersTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  clearFilters: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    color: "#475569",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  searchWrapperSmall: {
    position: "relative",
  },
  searchIconSmall: {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "12px",
  },
  searchInputSmall: {
    width: "100%",
    height: "36px",
    padding: "0 28px 0 32px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "13px",
    transition: "all 0.2s",
    outline: "none",
  },
  clearSearchSmall: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
  },
  filterWrapper: {
    position: "relative",
  },
  filterSelect: {
    height: "36px",
    padding: "0 10px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    background: "white",
    transition: "all 0.2s",
    gap: "6px",
    fontSize: "13px",
  },
  filterSelectActive: {
    borderColor: "#2563eb",
  },
  filterInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "13px",
    background: "transparent",
  },
  placeholder: {
    color: "#94a3b8",
  },
  chevron: {
    color: "#94a3b8",
    fontSize: "10px",
    marginLeft: "auto",
  },
  clearIcon: {
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "10px",
  },
  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
    maxHeight: "300px",
    overflow: "hidden",
  },
  dropdownMenuMultiSelect: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
    maxHeight: "400px",
    overflow: "hidden",
    minWidth: "280px",
  },
  yearMonthDropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
    width: "340px",
    maxHeight: "500px",
    overflow: "hidden",
  },
  columnSelectorDropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    right: 0,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
    width: "280px",
    maxHeight: "400px",
    overflow: "hidden",
  },
  columnSelectorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    fontWeight: 600,
    fontSize: "13px",
    color: "#334155",
  },
  resetColumnsBtn: {
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: 500,
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
    background: "white",
    cursor: "pointer",
    color: "#475569",
  },
  columnSelectorList: {
    maxHeight: "340px",
    overflowY: "auto",
    padding: "8px 0",
  },
  columnCheckboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 16px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  columnCheckbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },
  dropdownSearch: {
    padding: "10px 12px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dropdownSearchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "13px",
  },
  dropdownOptions: {
    maxHeight: "250px",
    overflowY: "auto",
  },
  dropdownOptionsMultiSelect: {
    maxHeight: "300px",
    overflowY: "auto",
  },
  dropdownOption: {
    padding: "8px 12px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
  },
  dropdownOptionMultiSelect: {
    padding: "8px 12px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dropdownOptionSelected: {
    background: "#eff6ff",
    color: "#2563eb",
  },
  multiSelectActions: {
    display: "flex",
    gap: "8px",
    padding: "8px 12px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  multiSelectActionBtn: {
    flex: 1,
    padding: "4px 8px",
    fontSize: "12px",
    fontWeight: 500,
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "#475569",
  },
  selectedTagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #e2e8f0",
  },
  selectedTagsLabel: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#64748b",
  },
  selectedTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px 4px 12px",
    background: "#eff6ff",
    border: "1px solid #2563eb",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#2563eb",
  },
  selectedTagRemove: {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px",
    borderRadius: "50%",
  },
  yearsList: {
    maxHeight: "450px",
    overflowY: "auto",
  },
  yearItem: {
    borderBottom: "1px solid #f1f5f9",
  },
  yearHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    backgroundColor: "#ffffff",
  },
  yearCheckboxWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    flex: 1,
  },
  customCheckbox: {
    width: "16px",
    height: "16px",
    border: "2px solid #cbd5e1",
    borderRadius: "4px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    transition: "all 0.2s",
  },
  customCheckboxChecked: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
    color: "white",
  },
  yearLabel: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#1e293b",
  },
  monthCount: {
    fontSize: "11px",
    color: "#64748b",
    marginLeft: "6px",
  },
  expandButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    transition: "color 0.2s",
  },
  monthsContainer: {
    padding: "10px 14px",
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
  },
  selectAllMonthsBtn: {
    width: "100%",
    padding: "6px",
    marginBottom: "10px",
    backgroundColor: "#eff6ff",
    border: "1px solid #2563eb",
    borderRadius: "6px",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  monthsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "6px",
    maxHeight: "180px",
    overflowY: "auto",
  },
  monthItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 6px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    transition: "background 0.2s",
  },
  monthCheckbox: {
    width: "12px",
    height: "12px",
    border: "2px solid #cbd5e1",
    borderRadius: "3px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  monthCheckboxChecked: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
    color: "white",
  },
  monthName: {
    fontSize: "12px",
    color: "#334155",
  },
  noResultsMessage: {
    padding: "28px 16px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
  },
  searchTermsContainer: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #e2e8f0",
  },
  searchTermsLabel: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#64748b",
  },
  searchTermTag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    background: "#eff6ff",
    border: "1px solid #2563eb",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#2563eb",
  },
  searchLogicHint: {
    fontSize: "11px",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  advancedFilters: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #e2e8f0",
  },
  advancedFilterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  advancedFilterLabel: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#334155",
  },
  rangeInputs: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  rangeInput: {
    width: "120px",
    height: "34px",
    padding: "0 10px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "13px",
    outline: "none",
  },
  activeFilters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #e2e8f0",
  },
  filterTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#334155",
  },
  filterTagButton: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px",
    fontSize: "10px",
  },
  tableSection: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  tableHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableTitle: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  resultCount: {
    padding: "4px 10px",
    background: "#f1f5f9",
    borderRadius: "20px",
    fontSize: "13px",
    color: "#475569",
  },
  selectionInfo: {
    fontSize: "14px",
    color: "#2563eb",
    fontWeight: 500,
  },
  tableContainer: {
    overflowX: "auto",
    overflowY: "auto",
    flex: 1,
    minHeight: "400px",
    maxHeight: "calc(100vh - 327px)",
    position: "relative",
  },
  orderTable: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px",
    tableLayout: "fixed",
  },
  tableHeaderCell: {
    padding: "12px 12px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: 600,
    color: "#64748b",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  checkboxCell: {
    width: "48px",
    textAlign: "center",
    padding: "12px 12px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    left: 0,
    zIndex: 11,
  },
  checkboxCellBody: {
    width: "48px",
    textAlign: "center",
    padding: "12px 12px",
    borderBottom: "1px solid #f1f5f9",
    position: "sticky",
    left: 0,
    zIndex: 5,
  },
  thead: {
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  tableHeaderRow: {
    position: "sticky",
    top: 0,
    zIndex: 10,
  },

  sortable: {
    cursor: "pointer",
    userSelect: "none",
  },
  resizeHandle: {
    position: "absolute",
    right: "0",
    top: "0",
    width: "4px",
    height: "100%",
    cursor: "col-resize",
    backgroundColor: "transparent",
    transition: "background-color 0.2s",
    zIndex: 20,
  },
  resizeHandleActive: {
    backgroundColor: "#2563eb",
    width: "2px",
  },
  dragHandle: {
    cursor: "grab",
    color: "#94a3b8",
    marginRight: "6px",
    opacity: 0.6,
    transition: "opacity 0.2s",
  },
  columnHeaderContent: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  dragIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "3px",
    height: "100%",
    backgroundColor: "#2563eb",
    animation: "pulse 0.5s ease-in-out",
  },
  checkbox: {
    position: "relative",
    display: "inline-block",
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  checkboxInput: {
    position: "absolute",
    opacity: 0,
    cursor: "pointer",
    height: 0,
    width: 0,
  },
  checkmark: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "18px",
    width: "18px",
    backgroundColor: "white",
    border: "2px solid #cbd5e1",
    borderRadius: "4px",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tableCell: {
    padding: "12px 12px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "13px",
    color: "#334155",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    position: "relative",
  },
  orderRow: {
    transition: "background 0.2s",
    cursor: "pointer",
  },
  orderRowSelected: {},
  orderInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  orderDetails: {
    display: "flex",
    flexDirection: "column",
  },
  orderPoNo: {
    fontWeight: 600,
    color: "#2563eb",
  },
  orderStyle: {
    fontSize: "12px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  icon: {
    color: "#94a3b8",
    fontSize: "12px",
  },
  companyInfo: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  shippedInfo: {
    fontSize: "11px",
    color: "#10b981",
    marginTop: "2px",
  },
  totalValue: {
    fontWeight: 600,
    color: "#059669",
  },
  dateInfo: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  relativeDate: {
    fontSize: "11px",
    color: "#94a3b8",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 500,
  },
  statusBadge: {},
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  actionBtn: {
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#64748b",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  actionBtnEdit: {
    color: "#f59e0b",
    borderColor: "#f59e0b",
  },
  actionBtnDelete: {
    color: "#ef4444",
    borderColor: "#ef4444",
  },
  remarksCell: {
    maxWidth: "300px",
    minWidth: "180px",
  },
  remarksDisplay: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "4px 8px",
    borderRadius: "6px",
    backgroundColor: "#f8fafc",
    transition: "all 0.2s",
  },
  remarksText: {
    fontSize: "12px",
    color: "#334155",
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: "1.4",
    flex: 1,
  },
  noRemarks: {
    color: "#94a3b8",
    fontStyle: "italic",
  },
  editRemarksBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    flexShrink: 0,
  },
  remarksInlineEdit: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "4px 0",
  },
  remarksTextarea: {
    width: "100%",
    padding: "8px",
    border: "1px solid #2563eb",
    borderRadius: "6px",
    fontSize: "12px",
    fontFamily: "inherit",
    resize: "vertical",
    outline: "none",
    backgroundColor: "white",
  },
  remarksInlineActions: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
  },
  remarksSaveBtn: {
    background: "#10b981",
    border: "none",
    color: "white",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    fontWeight: 500,
  },
  remarksCancelBtn: {
    background: "#ef4444",
    border: "none",
    color: "white",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    fontWeight: 500,
  },
  emptyRow: {
    textAlign: "center",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "48px",
    color: "#cbd5e1",
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    textAlign: "center",
    flex: 1,
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginBottom: "20px",
  },
  errorState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    textAlign: "center",
    flex: 1,
  },
  errorIcon: {
    width: "48px",
    height: "48px",
    background: "#fee2e2",
    color: "#ef4444",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "16px",
  },
  paginationContainer: {
    padding: "5px 20px",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  paginationInfo: {
    fontSize: "14px",
    color: "#4a5568",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  filteringIndicator: {
    fontSize: "14px",
    color: "#4299e1",
    animation: "spin 1s linear infinite",
    display: "inline-block",
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    flexWrap: "wrap",
  },
  pageSizeSelector: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  pageSizeLabel: {
    fontSize: "14px",
    color: "#4a5568",
  },
  pageSizeSelect: {
    padding: "6px 8px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "white",
    cursor: "pointer",
    outline: "none",
  },
  paginationButtons: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  paginationButton: {
    padding: "6px 10px",
    border: "1px solid #d1d5db",
    backgroundColor: "white",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#4a5568",
    cursor: "pointer",
    transition: "all 0.2s ease",
    minWidth: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1px",
  },
  paginationButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
    color: "white",
  },
  paginationEllipsis: {
    padding: "8px 4px",
    color: "#6b7280",
    fontSize: "14px",
  },
};

// Add keyframe animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
  }
  
  * {
    box-sizing: border-box;
  }
  
  .sort-icon {
    margin-left: 4px;
    font-size: 12px;
    color: #94a3b8;
  }
  
  .sort-icon.active {
    color: #2563eb;
  }
  
  .order-row:hover {
    background: #f8fafc;
  }
  
  .action-btn:hover {
    background: #e2e8f0;
    color: #334155;
  }
  
  .filter-select:hover, .filter-select.active {
    border-color: #2563eb;
  }
  
  .checkbox:hover input ~ .checkmark {
    border-color: #2563eb;
  }
  
  .checkbox input:checked ~ .checkmark {
    background-color: #2563eb;
    border-color: #2563eb;
  }
  
  .checkbox input:checked ~ .checkmark:after {
    display: block;
  }
  
  .checkbox .checkmark:after {
    left: 5px;
    top: 1px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    content: "";
    position: absolute;
    display: none;
  }
  
  .dropdown-option:hover {
    background: #f1f5f9;
  }
  
  .dropdown-option-multi-select:hover {
    background: #f1f5f9;
  }
  
  .clear-filters:hover {
    background: #e2e8f0;
    color: #ef4444;
  }
  
  .clear-search:hover {
    color: #ef4444;
  }
  
  .clear-icon:hover {
    color: #ef4444;
  }
  
  .filter-tag button:hover {
    color: #ef4444;
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
  }
  
  .btn-primary:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .btn-export:hover {
    background: #f9fafb;
    border-color: #cbd5e1;
  }
  
  .btn-outline:hover {
    background: #f1f5f9;
  }
  
  .search-input-small:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }
  
  .filter-input:focus {
    outline: none;
  }
  
  .dropdown-search input:focus {
    outline: none;
  }
  
  .select-all-months-btn:hover {
    background: #2563eb;
    color: white;
  }
  
  .month-item:hover {
    background: #e2e8f0;
  }
  
  .table-header-cell.sortable:hover {
    color: #2563eb;
  }
  
  .pagination-button:hover:not(:disabled) {
    background-color: #f7fafc;
    border-color: #94a3b8;
  }
  
  .pagination-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .multi-select-action-btn:hover {
    background: #eff6ff;
    border-color: #2563eb;
    color: #2563eb;
  }
  
  .toggle-stats-btn:hover {
    background: #eff6ff;
    border-color: #2563eb;
    color: #2563eb;
  }
  
  .column-checkbox-label:hover {
    background: #f1f5f9;
  }
  
  .reset-columns-btn:hover {
    background: #eff6ff;
    border-color: #2563eb;
    color: #2563eb;
  }
  
  .edit-remarks-btn:hover {
    background: #e2e8f0;
    color: #2563eb;
  }
  
  .remarks-save-btn:hover {
    background: #059669;
  }
  
  .remarks-cancel-btn:hover {
    background: #dc2626;
  }
  
  th .resize-handle:hover {
    background-color: #2563eb;
    width: 2px;
  }
  
  th .resize-handle:active {
    background-color: #1d4ed8;
    width: 2px;
  }
  
  th .resize-handle {
    cursor: col-resize;
  }
  
  th:hover .resize-handle {
    background-color: #94a3b8;
    width: 2px;
  }
  
  th[draggable="true"] {
    cursor: grab;
  }
  
  th[draggable="true"]:active {
    cursor: grabbing;
  }
  
  /* Custom scrollbar styles */
  .table-container::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .table-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  .table-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  
  .table-container::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  .years-list::-webkit-scrollbar {
    width: 6px;
  }
  
  .years-list::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  .years-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .months-grid::-webkit-scrollbar {
    width: 4px;
  }
  
  .column-selector-list::-webkit-scrollbar {
    width: 6px;
  }
  
  .column-selector-list::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  .column-selector-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  /* Responsive adjustments */
  @media (min-width: 1920px) {
    .stats-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  @media (max-width: 1440px) {
    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }
  }
  
  @media (max-width: 1024px) {
    .filters-grid {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
  }
`;
document.head.appendChild(styleSheet);

export default OrderList;
