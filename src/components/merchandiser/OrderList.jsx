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
  getCustomers,
  updateOrder,
  getDepartments,
  getSuppliers,
  getOrderStatsWithFilters,
  getGarmentOptions,
  exportOrdersToExcel,
  exportOrdersToExcelFiltered,
} from "../../api/merchandiser";
import Sidebar from "../merchandiser/Sidebar";
import { canViewOrderPricing, canManageOrders, isMerchandiserProduction, getDisplayShipmentDate } from "../../utils/accessControl";
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
  FaGripVertical,
  FaClock,
  FaShip, // Added for shipped orders icon
  FaBoxOpen, // Added for not shipped icon
} from "react-icons/fa";

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Utility functions
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
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  } catch {
    return "";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  } catch {
    return "—";
  }
};

const getRelativeTime = (date) => {
  if (!date) return "";
  try {
    const now = new Date();
    const shipmentDate = new Date(date);

    // Reset time portions to compare dates only (not times)
    now.setHours(0, 0, 0, 0);
    shipmentDate.setHours(0, 0, 0, 0);

    const diffTime = shipmentDate - now;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Future dates
    if (diffDays > 0) {
      if (diffDays === 1) return "Tomorrow";
      if (diffDays < 7) return `in ${diffDays} days`;
      if (diffDays < 30) return `in ${Math.floor(diffDays / 7)} weeks`;
      if (diffDays < 365) return `in ${Math.floor(diffDays / 30)} months`;
      return `in ${Math.floor(diffDays / 365)} years`;
    }

    // Past dates
    const absDays = Math.abs(diffDays);
    if (absDays === 0) return "Today";
    if (absDays === 1) return "Yesterday";
    if (absDays < 7) return `${absDays} days ago`;
    if (absDays < 30) return `${Math.floor(absDays / 7)} weeks ago`;
    if (absDays < 365) return `${Math.floor(absDays / 30)} months ago`;
    return `${Math.floor(absDays / 365)} years ago`;
  } catch {
    return "";
  }
};

const getCustomerDisplayName = (customer) => {
  if (!customer) return "—";
  if (typeof customer === "object" && customer !== null) {
    if (customer.customer_name) return customer.customer_name;
    if (customer.hrms_customer_name) return customer.hrms_customer_name;
    if (customer.name) {
      if (typeof customer.name === "object") {
        return (
          customer.name.customer_name ||
          customer.name.name ||
          `Customer ${customer.id}`
        );
      }
      return customer.name;
    }
    if (customer.customer_display) return customer.customer_display;
    if (customer.customer) return customer.customer;
    return `Customer ${customer.id || ""}`;
  }
  return customer;
};

// FIXED: Function to get supplier display name from order
const getSupplierDisplayName = (order, supplierOptionsMap) => {
  if (!order) return "—";

  // Check for supplier_name directly on order
  if (
    order.supplier_name &&
    order.supplier_name !== "—" &&
    order.supplier_name !== "null" &&
    order.supplier_name !== ""
  ) {
    return order.supplier_name;
  }

  // Check for supplier_display
  if (order.supplier_display && order.supplier_display !== "—") {
    return order.supplier_display;
  }

  // Check for supplier object
  if (order.supplier) {
    if (typeof order.supplier === "object") {
      if (order.supplier.supplier_name) return order.supplier.supplier_name;
      if (order.supplier.name) return order.supplier.name;
      if (order.supplier.display_name) return order.supplier.display_name;
      if (order.supplier.id && supplierOptionsMap[order.supplier.id]) {
        return supplierOptionsMap[order.supplier.id];
      }
      if (order.supplier.id) return `Supplier ${order.supplier.id}`;
    } else if (typeof order.supplier === "string") {
      const supplierId = order.supplier;
      // Look up in supplierOptionsMap
      if (supplierOptionsMap[supplierId]) {
        return supplierOptionsMap[supplierId];
      }
      if (supplierOptionsMap[String(supplierId)]) {
        return supplierOptionsMap[String(supplierId)];
      }
      if (!supplierId.match(/^\d+$/)) return supplierId;
      return `Supplier ${supplierId}`;
    }
  }

  return "—";
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
    rowBg: "#f1f1e9",
    icon: <FaCheckCircle />,
    label: "Running",
  },
  Active: {
    color: "#3b82f6",
    bg: "#dbeafe",
    rowBg: "#f1f1e9",
    icon: <FaCheckCircle />,
    label: "Active",
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
    rowBg: "#f1f1e9",
    icon: <FaHourglassHalf />,
    label: "Pending",
  },
  Cancelled: {
    color: "#ef4444",
    bg: "#fee2e2",
    rowBg: "#f1f1e9",
    icon: <FaBan />,
    label: "Cancelled",
  },
  Draft: {
    color: "#6b7280",
    bg: "#f3f4f6",
    rowBg: "#f1f1e9",
    icon: <FaFileAlt />,
    label: "Draft",
  },
};

// Column keys carrying monetary data - hidden from users without order
// pricing access (see utils/accessControl.js), regardless of what's saved
// in their localStorage column preferences.
const PRICING_COLUMN_KEYS = [
  "unit_price",
  "total_value",
  "shipped_value",
  "factory_value",
];

// Column configuration
const ALL_COLUMNS = [
  {
    key: "images",
    label: "Images",
    sortable: false,
    width: "120px",
    minWidth: "100px",
  },
  {
    key: "pdm_no_style",
    label: "PDM No / Style",
    sortable: true,
    sortKey: "po_no",
    width: "180px",
    frozen: true,
  },
  {
    key: "po_no_only",
    label: "PO No",
    sortable: true,
    sortKey: "po_no",
    width: "120px",
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
  {
    key: "delay_from_ex_factory",
    label: "Delay from Ex-Factory",
    sortable: true,
    sortKey: "delay_from_ex_factory",
    width: "160px",
    align: "right",
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
  { key: "actions", label: "Actions", sortable: false, width: "140px" },
];

const OrderList = () => {
  const navigate = useNavigate();

  // ========== STATE DECLARATIONS ==========

  const [searchInputValue, setSearchInputValue] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRemarksId, setEditingRemarksId] = useState(null);
  const [editingRemarksValue, setEditingRemarksValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hoveredRowId, setHoveredRowId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // UI state - FIXED: Load from localStorage with proper defaults
  const [showStats, setShowStats] = useState(() => {
    const saved = localStorage.getItem("orderShowStats");
    return saved !== null ? saved === "true" : true;
  });

  const [showStat, setShowStat] = useState(() => {
    const saved = localStorage.getItem("orderShowStat");
    return saved !== null ? saved === "true" : true;
  });

  // Column order state
  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem("orderColumnOrder");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return ALL_COLUMNS.map((col) => col.key);
      }
    }
    return ALL_COLUMNS.map((col) => col.key);
  });

  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem("orderVisibleColumns");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [
          "images",
          "pdm_no_style",
          "po_no_only",
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
      }
    }
    return [
      "images",
      "pdm_no_style",
      "po_no_only",
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
    const saved = localStorage.getItem("orderColumnWidths");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        const defaultWidths = {};
        ALL_COLUMNS.forEach((col) => {
          defaultWidths[col.key] = col.width || "150px";
        });
        return defaultWidths;
      }
    }
    const defaultWidths = {};
    ALL_COLUMNS.forEach((col) => {
      defaultWidths[col.key] = col.width || "150px";
    });
    return defaultWidths;
  });
  const [resizingColumn, setResizingColumn] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Stats state - enhanced with shipped/not shipped metrics
  const [stats, setStats] = useState({
    total_orders: 0,
    total_value: 0,
    total_quantity: 0,
    avg_price_per_unit: 0,
    // New shipped/not shipped metrics
    shipped_orders: 0,
    shipped_quantity: 0,
    shipped_value: 0,
    not_shipped_orders: 0,
    not_shipped_quantity: 0,
    not_shipped_value: 0,
    shipment_percentage: 0,
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

  // Filter state
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [supplierOptionsMap, setSupplierOptionsMap] = useState({});
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const supplierDropdownRef = useRef(null);

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] =
    useState(false);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");

  const [selectedGarments, setSelectedGarments] = useState([]);
  const [isGarmentDropdownOpen, setIsGarmentDropdownOpen] = useState(false);
  const [garmentSearchTerm, setGarmentSearchTerm] = useState("");
  const [garmentOptions, setGarmentOptions] = useState([]);

  const [customerOptions, setCustomerOptions] = useState([]);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  const [selectedShipmentYears, setSelectedShipmentYears] = useState(() => {
    try {
      const saved = localStorage.getItem("selectedShipmentYears");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [selectedShipmentMonths, setSelectedShipmentMonths] = useState(() => {
    try {
      const saved = localStorage.getItem("selectedShipmentMonths");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [minValueFilter, setMinValueFilter] = useState("");
  const [maxValueFilter, setMaxValueFilter] = useState("");

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusSearch, setStatusSearch] = useState("");
  const [yearSearch, setYearSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "shipment_date",
    direction: "desc",
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [expandedYears, setExpandedYears] = useState({});

  // Refs
  const statusDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);
  const customerDropdownRef = useRef(null);
  const departmentDropdownRef = useRef(null);
  const garmentDropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const filterTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);
  const isFirstFetchDone = useRef(false);

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
  const availableYears = (() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2013; year <= currentYear + 2; year++) years.push(year);
    return years;
  })();

  const orderedVisibleColumns = useMemo(() => {
    // Columns that are both in columnOrder and visible — preserving drag order
    const visible = columnOrder.filter((key) => visibleColumns.includes(key));
    // Any visible columns not yet in columnOrder (edge case: newly added columns)
    const missing = visibleColumns.filter((key) => !columnOrder.includes(key));
    // Deduplicate to prevent duplicates when dragging the remarks column
    const combined = [...visible, ...missing];
    const deduped = combined.filter((key, idx) => combined.indexOf(key) === idx);
    // Strip pricing columns for users without order pricing access, even
    // if an old localStorage preference still has them turned on.
    return canViewOrderPricing()
      ? deduped
      : deduped.filter((key) => !PRICING_COLUMN_KEYS.includes(key));
  }, [columnOrder, visibleColumns]);

  // ========== BUILD FILTERS OBJECT ==========

  const buildFilters = useCallback(() => {
    const filters = {};

    if (searchInputValue && searchInputValue.trim()) {
      filters.search = searchInputValue.trim();
    }
    if (statusFilter) filters.status = statusFilter;
    if (selectedCustomers.length)
      filters.customer = selectedCustomers.join("|");

    // FIXED: Send supplier IDs instead of names
    if (selectedSuppliers.length > 0) {
      // Get supplier IDs from selected supplier names
      const supplierIds = selectedSuppliers
        .map((name) => {
          const supplier = supplierOptions.find(
            (s) => (s.display_name || s.supplier_name) === name,
          );
          return supplier ? supplier.id : name;
        })
        .filter((id) => id);

      if (supplierIds.length) {
        filters.supplier = supplierIds.join("|");
      }
    }

    if (selectedGarments.length) filters.garment = selectedGarments.join("|");
    if (selectedDepartments.length)
      filters.department = selectedDepartments.join("|");
    if (selectedShipmentYears.length)
      filters.shipment_year = selectedShipmentYears.join("|");
    if (selectedShipmentMonths.length)
      filters.shipment_month = selectedShipmentMonths.join("|");
    if (minValueFilter) filters.min_value = minValueFilter;
    if (maxValueFilter) filters.max_value = maxValueFilter;

    let sortKey = sortConfig.key;
    if (sortKey === "customer") sortKey = "customer";
    if (sortKey === "supplier") sortKey = "supplier";
    filters.ordering =
      sortConfig.direction === "desc" ? `-${sortKey}` : sortKey;

    return filters;
  }, [
    searchInputValue,
    statusFilter,
    selectedCustomers,
    selectedSuppliers,
    supplierOptions,
    selectedGarments,
    selectedDepartments,
    selectedShipmentYears,
    selectedShipmentMonths,
    minValueFilter,
    maxValueFilter,
    sortConfig,
  ]);
  // ========== FETCH ORDERS FROM SERVER ==========
  const fetchOrders = useCallback(
    async (page = 1, customFilters = null) => {
      try {
        setLoading(true);
        setIsFiltering(true);

        const filters = customFilters || buildFilters();
        const response = await getOrders(page, itemsPerPage, { filters });

        setOrders(response.data || []);
        setTotalItems(response.pagination?.count || 0);
        setTotalPages(response.pagination?.total_pages || 1);
        setCurrentPage(page);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
        setIsFiltering(false);
        isFirstFetchDone.current = true;
      }
    },
    [itemsPerPage, buildFilters],
  );

// ========== FETCH STATS FROM SERVER ==========
const fetchStats = useCallback(async () => {
  try {
    const filters = buildFilters();
    const response = await getOrderStatsWithFilters(filters);
    
    // The API should return these values directly
    // If the API doesn't provide them, we need to fetch ALL orders to calculate
    let shippedOrders = 0;
    let shippedQuantity = 0;
    let shippedValue = 0;
    let notShippedOrders = 0;
    let notShippedQuantity = 0;
    let notShippedValue = 0;

    // Check if the API response already has these fields
    if (response.shipped_orders !== undefined) {
      // Use API data if available
      shippedOrders = response.shipped_orders || 0;
      shippedQuantity = response.shipped_quantity || 0;
      shippedValue = response.shipped_value || 0;
      notShippedOrders = response.not_shipped_orders || 0;
      notShippedQuantity = response.not_shipped_quantity || 0;
      notShippedValue = response.not_shipped_value || 0;
    } else {
      // Otherwise fetch ALL orders to calculate stats properly
      // This is a one-time fetch for stats, not for display
      try {
        // Fetch all orders with the same filters, but with a large page size
        const allOrdersResponse = await getOrders(1, 99999, { filters });
        const allOrders = allOrdersResponse.data || [];
        
        allOrders.forEach(order => {
          const isShipped = order.status === "Shipped";
          const qty = Number(order.total_qty) || 0;
          const value = Number(order.total_value) || 0;
          
          if (isShipped) {
            shippedOrders++;
            shippedQuantity += qty;
            shippedValue += value;
          } else if (order.status !== "Cancelled") {
            // Only count non-cancelled orders as "not shipped"
            notShippedOrders++;
            notShippedQuantity += qty;
            notShippedValue += value;
          }
        });
      } catch (error) {
        console.error("Error fetching all orders for stats:", error);
        // Fallback: use current page data only (limited)
        orders.forEach(order => {
          const isShipped = order.status === "Shipped";
          const qty = Number(order.total_qty) || 0;
          const value = Number(order.total_value) || 0;
          
          if (isShipped) {
            shippedOrders++;
            shippedQuantity += qty;
            shippedValue += value;
          } else if (order.status !== "Cancelled") {
            notShippedOrders++;
            notShippedQuantity += qty;
            notShippedValue += value;
          }
        });
      }
    }

    const totalOrders = response.total_orders || 0;
    const shipmentPercentage = totalOrders > 0 
      ? Math.round((shippedOrders / totalOrders) * 100) 
      : 0;

    setStats({
      ...response,
      shipped_orders: shippedOrders,
      shipped_quantity: shippedQuantity,
      shipped_value: shippedValue,
      not_shipped_orders: notShippedOrders,
      not_shipped_quantity: notShippedQuantity,
      not_shipped_value: notShippedValue,
      shipment_percentage: shipmentPercentage,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
}, [buildFilters]);

  // ========== HANDLE FILTER CHANGE ==========
  const handleFilterChange = useCallback(() => {
    fetchOrders(1);
    fetchStats();
  }, [fetchOrders, fetchStats]);

  // ========== DEBOUNCED SEARCH ==========
  const debouncedFilterChange = useCallback(() => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    filterTimeoutRef.current = setTimeout(() => {
      handleFilterChange();
    }, 500);
  }, [handleFilterChange]);

  // Add this helper function for image display
  const renderOrderImages = (order) => {
    // Check if order has multiple_images
    const images = order.multiple_images || [];

    // Also check for images in the nested object if it exists
    const allImages = [...images];

    if (allImages.length === 0) {
      return (
        <div style={styles.noImageContainer}>
          <FaFileAlt style={styles.noImageIcon} />
          <span style={styles.noImageText}>No images</span>
        </div>
      );
    }

    // Display first image as thumbnail
    const firstImage = allImages[0];
    const imageUrl = firstImage.startsWith("/media/")
      ? firstImage
      : `/media/${firstImage}`;
    const remainingCount = allImages.length - 1;

    return (
      <div style={styles.imageContainer}>
        <img
          src={imageUrl}
          alt={`Order ${order.id}`}
          style={styles.imageThumbnail}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.parentElement.innerHTML = `
            <div style="${Object.entries(styles.imageError)
              .map(([k, v]) => `${k}:${v}`)
              .join(";")}">
              <span>📷</span>
            </div>
          `;
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Open image in new tab or modal
            window.open(imageUrl, "_blank");
          }}
        />
        {remainingCount > 0 && (
          <span style={styles.imageCount}>+{remainingCount}</span>
        )}
      </div>
    );
  };

  // ========== EFFECTS ==========
  useEffect(() => {
    fetchOrders(1);
    fetchStats();
  }, []);

  // Update stats when orders change (for shipped/not shipped calculations)
  useEffect(() => {
    if (orders.length > 0) {
      fetchStats();
    }
  }, [orders]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    debouncedFilterChange();

    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [
    searchInputValue,
    statusFilter,
    selectedCustomers,
    selectedSuppliers,
    selectedGarments,
    selectedDepartments,
    selectedShipmentYears,
    selectedShipmentMonths,
    minValueFilter,
    maxValueFilter,
    sortConfig,
    debouncedFilterChange,
  ]);

  // Load dropdown options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [customersRes, suppliersRes, departmentsRes] = await Promise.all([
          getCustomers(1, 1000, false),
          getSuppliers(1, 500, { all: true }),
          getDepartments(1, 500, false),
        ]);

        setCustomerOptions(
          customersRes.data?.results || customersRes.data || [],
        );

        // Process supplier options and create map for quick lookup
        let suppliersList =
          suppliersRes.data?.results || suppliersRes.data || [];
        const transformedSuppliers = [];
        const map = {};

        suppliersList.forEach((supplier) => {
          const id = supplier.id;
          const name =
            supplier.supplier_name || supplier.name || `Supplier ${id}`;
          transformedSuppliers.push({
            id: id,
            display_name: name,
            supplier_name: name,
          });
          map[id] = name;
          map[String(id)] = name;
        });

        setSupplierOptions(transformedSuppliers);
        setSupplierOptionsMap(map);

        setDepartmentOptions(
          (departmentsRes.data?.results || departmentsRes.data || []).map(
            (d) => d.name || d.department,
          ),
        );
      } catch (error) {
        console.error("Error loading options:", error);
      }
    };
    loadOptions();
  }, []);

  // Load saved state from localStorage
  useEffect(() => {
    const savedSearchQuery = localStorage.getItem("orderSearchQuery");
    const savedStatusFilter = localStorage.getItem("orderStatusFilter");
    const savedCustomerFilter = localStorage.getItem("orderCustomerFilter");
    const savedSupplierFilter = localStorage.getItem("orderSupplierFilter");
    const savedGarmentFilter = localStorage.getItem("orderGarmentFilter");
    const savedDepartmentFilter = localStorage.getItem("orderDepartmentFilter");
    const savedMinValue = localStorage.getItem("orderMinValue");
    const savedMaxValue = localStorage.getItem("orderMaxValue");
    const savedItemsPerPage = localStorage.getItem("orderItemsPerPage");
    const savedSortKey = localStorage.getItem("orderSortKey");
    const savedSortDirection = localStorage.getItem("orderSortDirection");
    // Note: showStats and showStat are loaded from the initial useState above

    if (savedSearchQuery) setSearchInputValue(savedSearchQuery);
    if (savedStatusFilter) setStatusFilter(savedStatusFilter);
    if (savedCustomerFilter && savedCustomerFilter !== "") {
      setSelectedCustomers(savedCustomerFilter.split(",").filter((c) => c));
    }
    if (savedSupplierFilter && savedSupplierFilter !== "") {
      setSelectedSuppliers(savedSupplierFilter.split(",").filter((s) => s));
    }
    if (savedGarmentFilter && savedGarmentFilter !== "") {
      setSelectedGarments(savedGarmentFilter.split(",").filter((g) => g));
    }
    if (savedDepartmentFilter && savedDepartmentFilter !== "") {
      setSelectedDepartments(savedDepartmentFilter.split(",").filter((d) => d));
    }
    // selectedShipmentYears and selectedShipmentMonths are restored directly
    // in useState initializers above, so no need to set them here again.
    if (savedMinValue) setMinValueFilter(savedMinValue);
    if (savedMaxValue) setMaxValueFilter(savedMaxValue);
    if (savedItemsPerPage) setItemsPerPage(parseInt(savedItemsPerPage));
    if (savedSortKey && savedSortDirection) {
      setSortConfig({ key: savedSortKey, direction: savedSortDirection });
    }
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    if (isInitialMount.current) return;

    localStorage.setItem("orderSearchQuery", searchInputValue);
    localStorage.setItem("orderStatusFilter", statusFilter);
    localStorage.setItem("orderCustomerFilter", selectedCustomers.join(","));
    localStorage.setItem("orderSupplierFilter", selectedSuppliers.join(","));
    localStorage.setItem("orderGarmentFilter", selectedGarments.join(","));
    localStorage.setItem(
      "orderDepartmentFilter",
      selectedDepartments.join(","),
    );
    localStorage.setItem(
      "selectedShipmentYears",
      JSON.stringify(selectedShipmentYears),
    );
    localStorage.setItem(
      "selectedShipmentMonths",
      JSON.stringify(selectedShipmentMonths),
    );
    localStorage.setItem("orderMinValue", minValueFilter);
    localStorage.setItem("orderMaxValue", maxValueFilter);
    localStorage.setItem("orderItemsPerPage", itemsPerPage.toString());
    localStorage.setItem("orderSortKey", sortConfig.key);
    localStorage.setItem("orderSortDirection", sortConfig.direction);
  }, [
    searchInputValue,
    statusFilter,
    selectedCustomers,
    selectedSuppliers,
    selectedGarments,
    selectedDepartments,
    selectedShipmentYears,
    selectedShipmentMonths,
    minValueFilter,
    maxValueFilter,
    itemsPerPage,
    sortConfig,
  ]);

  // Save showStats and showStat to localStorage separately
  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem("orderShowStats", showStats.toString());
    }
  }, [showStats]);

  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem("orderShowStat", showStat.toString());
    }
  }, [showStat]);

  useEffect(() => {
    if (!isInitialMount.current)
      localStorage.setItem("orderColumnOrder", JSON.stringify(columnOrder));
  }, [columnOrder]);

  useEffect(() => {
    if (!isInitialMount.current)
      localStorage.setItem(
        "orderVisibleColumns",
        JSON.stringify(visibleColumns),
      );
  }, [visibleColumns]);

  useEffect(() => {
    if (!isInitialMount.current)
      localStorage.setItem("orderColumnWidths", JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Column resize handlers
  const handleMouseDown = (e, columnKey, currentWidth) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    setStartX(e.clientX);
    let widthValue =
      typeof currentWidth === "string"
        ? parseInt(currentWidth.match(/(\d+)/)?.[0] || "150", 10)
        : 150;
    setStartWidth(widthValue);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!resizingColumn) return;
      const newWidth = Math.max(60, startWidth + (e.clientX - startX));
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

  const resetColumnWidths = () => {
    const defaultWidths = {};
    ALL_COLUMNS.forEach((col) => {
      defaultWidths[col.key] = col.width || "150px";
    });
    setColumnWidths(defaultWidths);
  };

  const resetColumnWidth = (columnKey) => {
    const defaultColumn = ALL_COLUMNS.find((col) => col.key === columnKey);
    setColumnWidths((prev) => ({
      ...prev,
      [columnKey]: defaultColumn?.width || "150px",
    }));
  };

  const toggleColumn = (columnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey],
    );
  };

  const resetColumns = () => {
    setVisibleColumns([
      "pdm_no_style",
      "po_no_only",
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

  const resetColumnOrder = () =>
    setColumnOrder(ALL_COLUMNS.map((col) => col.key));

  // Drag and drop handlers
  const handleDragStart = (e, columnKey, index) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", columnKey);
    setDraggedColumn({ key: columnKey, index });
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
    if (dragOverColumn?.key !== columnKey)
      setDragOverColumn({ key: columnKey, index });
  };

  const handleDrop = (e, targetColumnKey, targetIndex) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn.key === targetColumnKey) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }
    const sourceColumn = ALL_COLUMNS.find(
      (col) => col.key === draggedColumn.key,
    );
    if (sourceColumn?.frozen) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }
    const newColumnOrder = [...columnOrder];
    newColumnOrder.splice(draggedColumn.index, 1);
    newColumnOrder.splice(targetIndex, 0, draggedColumn.key);
    setColumnOrder(newColumnOrder);
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  // Dropdown handlers
  const fetchCustomerOptions = useCallback(async () => {
    try {
      const response = await getCustomers(1, 2000, false);
      if (response && response.data) {
        let customersList = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        const transformedCustomers = customersList.map((customer) => ({
          ...customer,
          display_name: getCustomerDisplayName(customer),
          id: customer.id,
        }));
        setCustomerOptions(transformedCustomers);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  }, []);

  const fetchSupplierOptions = useCallback(async (searchTerm = "") => {
    try {
      const filters = {};
      if (searchTerm && searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }
      const response = await getSuppliers(1, 100, { filters });
      let suppliersList = response?.data || [];

      const transformedSuppliers = [];
      const map = {};

      suppliersList
        .filter((s) => s && (s.id || s.pk))
        .forEach((supplier) => {
          const id = supplier.id || supplier.pk;
          const name =
            supplier.supplier_name ||
            supplier.name ||
            supplier.display_name ||
            `Supplier ${id}`;
          transformedSuppliers.push({
            id: id,
            display_name: name,
            supplier_name: name,
          });
          map[id] = name;
          map[String(id)] = name;
        });

      transformedSuppliers.sort((a, b) =>
        (a.display_name || "").localeCompare(b.display_name || ""),
      );

      setSupplierOptions(transformedSuppliers);
      setSupplierOptionsMap(map);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSupplierOptions([]);
      setSupplierOptionsMap({});
    }
  }, []);

  const fetchDepartmentOptions = useCallback(async () => {
    try {
      const response = await getDepartments(1, 500, false);
      let departments = [];
      if (response?.data?.results)
        departments = response.data.results
          .map((d) => d.department || d.name)
          .filter(Boolean);
      else if (Array.isArray(response?.data))
        departments = response.data
          .map((d) => d.department || d.name)
          .filter(Boolean);
      setDepartmentOptions(departments.sort());
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  }, []);

  const fetchGarmentOptions = useCallback(async () => {
    try {
      const garments = await getGarmentOptions();
      setGarmentOptions(garments);
    } catch (error) {
      console.error("Error fetching garments:", error);
      setGarmentOptions(["Knit", "Woven", "Sweater", "Underwear"]);
    }
  }, []);

  useEffect(() => {
    if (isCustomerDropdownOpen && customerOptions.length === 0)
      fetchCustomerOptions();
  }, [isCustomerDropdownOpen, fetchCustomerOptions, customerOptions.length]);

  useEffect(() => {
    if (isSupplierDropdownOpen && supplierOptions.length === 0)
      fetchSupplierOptions();
  }, [isSupplierDropdownOpen, fetchSupplierOptions, supplierOptions.length]);

  useEffect(() => {
    fetchSupplierOptions();
  }, [fetchSupplierOptions]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current?.contains(event.target)) return;
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      )
        setShowStatusDropdown(false);
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target)
      )
        setShowYearDropdown(false);
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target)
      )
        setIsCustomerDropdownOpen(false);
      if (
        supplierDropdownRef.current &&
        !supplierDropdownRef.current.contains(event.target)
      )
        setIsSupplierDropdownOpen(false);
      if (
        departmentDropdownRef.current &&
        !departmentDropdownRef.current.contains(event.target)
      )
        setIsDepartmentDropdownOpen(false);
      if (
        garmentDropdownRef.current &&
        !garmentDropdownRef.current.contains(event.target)
      )
        setIsGarmentDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered options for dropdowns
  const filteredCustomerOptions = useMemo(() => {
    if (!customerSearchTerm) return customerOptions;
    const searchLower = customerSearchTerm.toLowerCase();
    return customerOptions.filter((c) =>
      (c.display_name || getCustomerDisplayName(c))
        .toLowerCase()
        .includes(searchLower),
    );
  }, [customerOptions, customerSearchTerm]);

  const isCustomerSelected = (customer) =>
    selectedCustomers.includes(
      customer.display_name || getCustomerDisplayName(customer),
    );
  const toggleCustomerSelection = (customer) => {
    const name = customer.display_name || getCustomerDisplayName(customer);
    setSelectedCustomers((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };
  const removeCustomer = (name) =>
    setSelectedCustomers((prev) => prev.filter((c) => c !== name));
  const clearAllCustomers = () => {
    setSelectedCustomers([]);
    setCustomerSearchTerm("");
  };
  const getCustomerDisplayText = () => {
    if (selectedCustomers.length === 0) return "All Customers";
    if (selectedCustomers.length === 1) return selectedCustomers[0];
    return `${selectedCustomers.length} customers selected`;
  };

  const filteredSupplierOptions = useMemo(() => {
    if (!supplierSearchTerm) return supplierOptions;
    const searchLower = supplierSearchTerm.toLowerCase();
    return supplierOptions.filter((s) =>
      (s.display_name || s.supplier_name || "")
        .toLowerCase()
        .includes(searchLower),
    );
  }, [supplierOptions, supplierSearchTerm]);

  const isSupplierSelected = (supplier) =>
    selectedSuppliers.includes(supplier.display_name || supplier.supplier_name);
  const toggleSupplierSelection = (supplier) => {
    const name = supplier.display_name || supplier.supplier_name;
    setSelectedSuppliers((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  };
  const removeSupplier = (name) =>
    setSelectedSuppliers((prev) => prev.filter((s) => s !== name));
  const clearAllSuppliers = () => {
    setSelectedSuppliers([]);
    setSupplierSearchTerm("");
  };
  const getSupplierDisplayText = () => {
    if (selectedSuppliers.length === 0) return "All Suppliers";
    if (selectedSuppliers.length === 1) return selectedSuppliers[0];
    return `${selectedSuppliers.length} suppliers selected`;
  };

  const filteredDepartmentOptions = useMemo(() => {
    if (!departmentSearchTerm) return departmentOptions;
    return departmentOptions.filter((d) =>
      d.toLowerCase().includes(departmentSearchTerm.toLowerCase()),
    );
  }, [departmentOptions, departmentSearchTerm]);

  const isDepartmentSelected = (dept) => selectedDepartments.includes(dept);
  const toggleDepartmentSelection = (dept) => {
    setSelectedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept],
    );
  };
  const removeDepartment = (dept) =>
    setSelectedDepartments((prev) => prev.filter((d) => d !== dept));
  const clearAllDepartments = () => {
    setSelectedDepartments([]);
    setDepartmentSearchTerm("");
  };
  const getDepartmentDisplayText = () => {
    if (selectedDepartments.length === 0) return "All Departments";
    if (selectedDepartments.length === 1) return selectedDepartments[0];
    return `${selectedDepartments.length} departments selected`;
  };

  const filteredGarmentOptions = useMemo(() => {
    if (!garmentSearchTerm) return garmentOptions;
    return garmentOptions.filter((g) =>
      g.toLowerCase().includes(garmentSearchTerm.toLowerCase()),
    );
  }, [garmentOptions, garmentSearchTerm]);

  const isGarmentSelected = (garment) => selectedGarments.includes(garment);
  const toggleGarmentSelection = (garment) => {
    setSelectedGarments((prev) =>
      prev.includes(garment)
        ? prev.filter((g) => g !== garment)
        : [...prev, garment],
    );
  };
  const removeGarment = (garment) =>
    setSelectedGarments((prev) => prev.filter((g) => g !== garment));
  const clearAllGarments = () => {
    setSelectedGarments([]);
    setGarmentSearchTerm("");
  };
  const getGarmentDisplayText = () => {
    if (selectedGarments.length === 0) return "All Garments";
    if (selectedGarments.length === 1) return selectedGarments[0];
    return `${selectedGarments.length} garments selected`;
  };

  // Shipment date handlers
  const toggleYear = (year) => {
    const yearStr = year.toString();
    setSelectedShipmentYears((prev) =>
      prev.includes(yearStr)
        ? prev.filter((y) => y !== yearStr)
        : [...prev, yearStr],
    );
  };

  const toggleMonthForYear = (month) => {
    setSelectedShipmentMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month],
    );
  };

  const clearAllYearsAndMonths = () => {
    setSelectedShipmentYears([]);
    setSelectedShipmentMonths([]);
  };

  const toggleYearExpansion = (year, e) => {
    e.stopPropagation();
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const getDisplayText = () => {
    if (
      selectedShipmentYears.length === 0 &&
      selectedShipmentMonths.length === 0
    )
      return "Shipment Date";
    if (
      selectedShipmentYears.length > 0 &&
      selectedShipmentMonths.length === 0
    ) {
      if (selectedShipmentYears.length === 1)
        return `${selectedShipmentYears[0]}`;
      return `${selectedShipmentYears.length} years selected`;
    }
    if (
      selectedShipmentYears.length === 0 &&
      selectedShipmentMonths.length > 0
    ) {
      if (selectedShipmentMonths.length === 1)
        return `${selectedShipmentMonths[0]}`;
      return `${selectedShipmentMonths.length} months selected`;
    }
    return `${selectedShipmentYears.length} year(s), ${selectedShipmentMonths.length} month(s)`;
  };

  const filteredStatuses = useMemo(
    () =>
      Object.keys(statusConfig).filter((s) =>
        s.toLowerCase().includes(statusSearch.toLowerCase()),
      ),
    [statusSearch],
  );
  const filteredYears = useMemo(
    () =>
      availableYears.filter((y) =>
        y.toString().includes(yearSearch.toLowerCase()),
      ),
    [yearSearch, availableYears],
  );

  // Merchandiser - Production can't see the main `remarks` field (written
  // by other merchandisers) but has its own `production_remarks` field,
  // which everyone else can see alongside the main remarks.
  const remarksFieldForUser = () =>
    isMerchandiserProduction() ? "production_remarks" : "remarks";

  const handleSaveRemarks = async (orderId, newRemarks) => {
    const field = remarksFieldForUser();
    try {
      await updateOrder(orderId, { [field]: newRemarks });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, [field]: newRemarks } : order,
        ),
      );
      setEditingRemarksId(null);
      setEditingRemarksValue("");
    } catch (error) {
      console.error("Error saving remarks:", error);
    }
  };

  const handleEditRemarks = (order, e) => {
    e.stopPropagation();
    setEditingRemarksId(order.id);
    setEditingRemarksValue(order[remarksFieldForUser()] || "");
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingRemarksId(null);
    setEditingRemarksValue("");
  };

  const activeFilterCount = [
    statusFilter,
    selectedCustomers.length,
    selectedSuppliers.length,
    selectedGarments.length,
    selectedDepartments.length,
    minValueFilter,
    maxValueFilter,
    selectedShipmentYears.length,
    selectedShipmentMonths.length,
    searchInputValue,
  ].filter(Boolean).length;

  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const handleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
    if (selectAll) setSelectAll(false);
  };

  const handleDelete = async (order) => {
    if (window.confirm("Delete this order?")) {
      try {
        await deleteOrder(order.id);
        fetchOrders(currentPage);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const getValueFontSize = (value) => {
    if (!value) return "24px";
    const len = Math.abs(value).toString().length;
    if (len > 12) return "18px";
    if (len > 10) return "20px";
    if (len > 8) return "22px";
    return "24px";
  };

  const handleExport = useCallback(async () => {
    try {
      setLoading(true);

      // Selected rows → ID-based export (existing per-order sheets)
      if (selectedRows.length > 0) {
        const response = await exportOrdersToExcel(selectedRows);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Orders_Export_${selectedRows.length}_selected.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        setSelectedRows([]);
        setSelectAll(false);
        return;
      }

      // Export All → filter-based flat sheet, no pagination cap,
      // respects every active filter including shipment year/month.
      const filters = buildFilters();
      const response = await exportOrdersToExcelFiltered(filters);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const yearLabel = selectedShipmentYears.length > 0
        ? `_${selectedShipmentYears.join("-")}` : "";
      link.setAttribute(
        "download",
        `Orders_Export${yearLabel}_${totalItems}_orders.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [orders, selectedRows, buildFilters, selectedShipmentYears, totalItems]);

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      // If currently all selected, deselect all
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      // Select all orders on current page
      const currentOrderIds = orders.map((order) => order.id);
      setSelectedRows(currentOrderIds);
      setSelectAll(true);
    }
  }, [orders, selectAll]);

  const clearAllFilters = useCallback(() => {
    setSearchInputValue("");
    setStatusFilter("");
    setSelectedCustomers([]);
    setCustomerSearchTerm("");
    setSelectedSuppliers([]);
    setSupplierSearchTerm("");
    setSelectedGarments([]);
    setGarmentSearchTerm("");
    setSelectedDepartments([]);
    setDepartmentSearchTerm("");
    setSelectedShipmentYears([]);
    setSelectedShipmentMonths([]);
    setExpandedYears({});
    setMinValueFilter("");
    setMaxValueFilter("");
  }, []);

  const handlePageChange = (page) => fetchOrders(page);
  const handleItemsPerPageChange = (e) => {
    const newSize = parseInt(e.target.value);
    setItemsPerPage(newSize);
    fetchOrders(1);
  };

  const getSortIcon = (key) =>
    sortConfig.key !== key ? (
      <FaSort className="sort-icon" />
    ) : sortConfig.direction === "asc" ? (
      <FaSortUp className="sort-icon active" />
    ) : (
      <FaSortDown className="sort-icon active" />
    );

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.Draft;
    return (
      <span
        style={{
          ...styles.badge,
          backgroundColor: config.bg,
          color: config.color,
        }}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Add this helper function at the top
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If it's already a full URL
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    // If it starts with /media/
    if (imagePath.startsWith("/media/")) {
      // Use the same base URL as your API
      return `http://119.148.51.38:8000${imagePath}`;
    }

    // If it starts with media/ (no leading slash)
    if (imagePath.startsWith("media/")) {
      return `http://119.148.51.38:8000/${imagePath}`;
    }

    // Default: add /media/ prefix
    return `http://119.148.51.38:8000/media/${imagePath}`;
  };

  const getRowBackgroundColor = (status, isSelected) =>
    isSelected ? "#6a88af" : (statusConfig[status] || statusConfig.Draft).rowBg;

  const getOrderSupplierDisplay = useCallback(
    (order) => {
      if (!order) return "—";

      // Check for supplier_name directly on order
      if (
        order.supplier_name &&
        order.supplier_name !== "—" &&
        order.supplier_name !== "null" &&
        order.supplier_name !== ""
      ) {
        return order.supplier_name;
      }

      // Check for supplier_display
      if (order.supplier_display && order.supplier_display !== "—") {
        return order.supplier_display;
      }

      // Check for supplier object
      if (order.supplier) {
        if (typeof order.supplier === "object") {
          if (order.supplier.supplier_name) {
            return order.supplier.supplier_name;
          }
          if (order.supplier.name) {
            return order.supplier.name;
          }
          if (order.supplier.display_name) {
            return order.supplier.display_name;
          }
          if (order.supplier.id && supplierOptionsMap[order.supplier.id]) {
            return supplierOptionsMap[order.supplier.id];
          }
        } else if (typeof order.supplier === "string") {
          const supplierId = order.supplier;
          if (supplierOptionsMap[supplierId]) {
            return supplierOptionsMap[supplierId];
          }
          if (supplierOptionsMap[String(supplierId)]) {
            return supplierOptionsMap[String(supplierId)];
          }
          if (!supplierId.match(/^\d+$/)) {
            return supplierId;
          }

          return `Supplier ${supplierId}`;
        }
      }

      // Check for supplier_id field
      if (order.supplier_id && supplierOptionsMap[order.supplier_id]) {
        return supplierOptionsMap[order.supplier_id];
      }

      return "—";
    },
    [supplierOptionsMap],
  );

  const renderCell = (order, columnKey, tna) => {
    switch (columnKey) {
      case "pdm_no_style":
        return (
          <div style={styles.orderInfo}>
            <div style={styles.orderDetails}>
              <div style={styles.orderPoNo}>{order.style || "N/A"}</div>
              <div style={styles.orderStyle}>
                <FaTag style={styles.icon} />
                {order.pdm_no || "No Style No"}
              </div>
            </div>
          </div>
        );
      case "po_no_only":
        return (
          <div style={styles.orderInfo}>
            <FaTag style={styles.icon} />
            <span>{order.po_no || "—"}</span>
          </div>
        );
      case "customer":
        return (
          <div style={styles.companyInfo}>
            <FaBuilding style={styles.icon} />
            <span>
              {getCustomerDisplayName(order.customer_name || order.customer)}
            </span>
          </div>
        );
      case "supplier":
        return (
          <div style={styles.companyInfo}>
            <FaUser style={styles.icon} />
            <span>{getOrderSupplierDisplay(order)}</span>
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
      case "shipment_date": {
        const displayShipmentDate = getDisplayShipmentDate(order);
        return (
          <div style={styles.dateInfo}>
            <FaCalendar style={styles.icon} />
            {displayShipmentDate ? (
              <>
                <span>{formatDateForDisplay(displayShipmentDate)}</span>
                <span style={styles.relativeDate}>
                  ({getRelativeTime(displayShipmentDate)})
                </span>
              </>
            ) : (
              "—"
            )}
          </div>
        );
      }
      case "status":
        return getStatusBadge(order.status);
      case "style":
        return order.style || "—";
      case "department":
        return order.department_name || order.department || "—";
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
      case "delay_from_ex_factory": {
        // Use the ETD delay field instead
        const delay = order.delay_from_ex_factory;
        if (delay === null || delay === undefined || delay === "") return "—";
        const days = Number(delay);
        if (isNaN(days)) return "—";
        return (
          <span
            style={{
              fontWeight: 600,
              color: days > 0 ? "#ef4444" : days === 0 ? "#10b981" : "#f59e0b",
              background:
                days > 0 ? "#fee2e2" : days === 0 ? "#d1fae5" : "#fef3c7",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "12px",
            }}
          >
            {days}
          </span>
        );
      }
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
                data-remarks-id={order.id}
                value={editingRemarksValue}
                onChange={(e) => setEditingRemarksValue(e.target.value)}
                style={styles.remarksTextarea}
                rows={3}
                autoFocus
                placeholder="Add remarks..."
              />
              <div style={styles.remarksInlineActions}>
                <button
                  style={styles.remarksSaveBtn}
                  onClick={() =>
                    handleSaveRemarks(order.id, editingRemarksValue)
                  }
                >
                  <FaCheck size={12} />
                </button>
                <button
                  style={styles.remarksCancelBtn}
                  onClick={handleCancelEdit}
                >
                  <FaTimes size={12} />
                </button>
              </div>
            </div>
          );
        }
        // Merchandiser - Production only sees/edits its own remarks
        // channel, not the main `remarks` field written by others.
        if (isMerchandiserProduction()) {
          return (
            <div style={styles.remarksCell} onClick={(e) => e.stopPropagation()}>
              <div style={styles.remarksDisplay}>
                <span style={styles.remarksText}>
                  {order.production_remarks || (
                    <span style={styles.noRemarks}>No remarks</span>
                  )}
                </span>
                <button
                  style={styles.editRemarksBtn}
                  onClick={(e) => handleEditRemarks(order, e)}
                >
                  <FaEdit size={12} />
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
              >
                <FaEdit size={12} />
              </button>
            </div>
            {order.production_remarks && (
              <div style={styles.remarksText} title="Left by Merchandiser - Production">
                <strong>Production:</strong> {order.production_remarks}
              </div>
            )}
          </div>
        );
      
      case "actions":
        // Try to find TNA ID in various possible locations
        let tnaId = null;

        // Check order.tna (from the new serializer)
        if (order.tna?.id) {
          tnaId = order.tna.id;
        } else if (order.tna_id) {
          tnaId = order.tna_id;
        } else if (order.tnaId) {
          tnaId = order.tnaId;
        } else if (order.TNA?.id) {
          tnaId = order.TNA.id;
        } else {
        }

        // ========== TNA BUTTON CONDITIONS ==========
        // 1. Must be "Running" status
        const isRunning = order.status === "Running";

        // 2. Must have a shipment date
        const hasShipmentDate =
          order.shipment_date !== null &&
          order.shipment_date !== undefined &&
          order.shipment_date !== "";

        // 3. TNA is enabled only if Running AND has shipment date
        const isTnaEnabled = isRunning && hasShipmentDate;

        // Build disable reason for tooltip
        let disableReason = "";
        if (!isRunning) {
          disableReason = `TNA only available for 'Running' orders. This order is '${order.status}'.`;
        } else if (!hasShipmentDate) {
          disableReason =
            "TNA requires a shipment date. Please add a shipment date to this order.";
        } else if (tnaId) {
          disableReason = `View TNA (ID: ${tnaId})`;
        } else {
          disableReason = "No TNA available - click to create";
        }

        return (
          <div
            style={styles.actionButtons}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                ...styles.actionBtn,
                ...styles.actionBtnTna,
                borderWidth: "1px",
                borderStyle: "solid",
                ...(!isTnaEnabled ? styles.actionBtnDisabled : {}),
              }}
              onClick={(e) => {
                e.stopPropagation();
                console.log("TNA Button clicked for order:", order.id);
                console.log("TNA ID:", tnaId);
                console.log("isTnaEnabled:", isTnaEnabled);

                if (isTnaEnabled) {
                  if (tnaId) {
                    const tnaUrl = `/tna-details/${tnaId}`;
                    console.log(`Navigating to: ${tnaUrl}`);
                    navigate(tnaUrl);
                  } else {
                    // No TNA found - navigate to create TNA page
                    console.log(
                      `No TNA found for order ${order.id} - navigating to create TNA`,
                    );
                    navigate(`/tna/create/${order.id}`);
                  }
                } else {
                  // Show appropriate error message
                  if (!isRunning) {
                    alert(
                      `TNA is only available for 'Running' orders. This order is '${order.status}'.`,
                    );
                  } else if (!hasShipmentDate) {
                    alert(
                      `Please add a shipment date to this order before creating TNA.`,
                    );
                  } else {
                    alert(`TNA is not available for this order.`);
                  }
                }
              }}
              title={disableReason}
              disabled={!isTnaEnabled}
            >
              <FaClock />
            </button>
            {canManageOrders() && (
              <button
                style={{
                  ...styles.actionBtn,
                  ...styles.actionBtnEdit,
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/orders/edit/${order.id}`);
                }}
                title="Edit Order"
              >
                <FaEdit />
              </button>
            )}
            {canManageOrders() && (
              <button
                style={{
                  ...styles.actionBtn,
                  ...styles.actionBtnDelete,
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(order);
                }}
                title="Delete Order"
              >
                <FaTrash />
              </button>
            )}
          </div>
        );

      case "images":
        const images = order.multiple_images || [];
        if (images.length === 0) {
          return (
            <div style={styles.noImageContainer}>
              <FaFileAlt style={styles.noImageIcon} />
              <span style={styles.noImageText}>No images</span>
            </div>
          );
        }

        const firstImage = images[0];
        const imageUrl = getFullImageUrl(firstImage);
        const remainingCount = images.length - 1;


        return (
          <div style={styles.imageContainer}>
            <img
              src={imageUrl}
              alt={`Order ${order.id}`}
              style={styles.imageThumbnail}
              className="order-image-thumbnail"
              onError={(e) => {
                console.error("Image failed to load:", imageUrl);
                e.target.style.display = "none";
                const parent = e.target.parentElement;
                const errorDiv = document.createElement("div");
                errorDiv.style.cssText = `
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f1f5f9;
            border-radius: 6px;
            color: #94a3b8;
            font-size: 20px;
          `;
                errorDiv.textContent = "📷";
                parent.appendChild(errorDiv);
              }}
              onClick={(e) => {
                e.stopPropagation();
                window.open(imageUrl, "_blank");
              }}
            />
            {remainingCount > 0 && (
              <span style={styles.imageCount}>+{remainingCount}</span>
            )}
          </div>
        );
      default:
        return "—";
    }
  };

  const Pagination = () => {
    const pageNumbers = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage + 1 < 5) startPage = Math.max(1, endPage - 4);
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
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
            {pageNumbers.map((n) => (
              <button
                key={n}
                onClick={() => handlePageChange(n)}
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === n ? styles.paginationButtonActive : {}),
                }}
              >
                {n}
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
          {/* Header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerLeft}>
              <h1 style={styles.pageTitle}>Orders</h1>
              <div style={styles.headerBadge}>
                <FaBoxes />
                <span>{totalItems} Total</span>
              </div>
            </div>
            <div style={styles.headerActions}>
              {canViewOrderPricing() && (
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
              )}
              {canManageOrders() && (
                <button
                  style={styles.btnPrimary}
                  onClick={() => navigate("/orders/add")}
                >
                  <FaPlus /> Add Order
                </button>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div style={styles.statsSection}>
            <div style={styles.statsHeader}>
              <h3 style={styles.statsTitle}>Statistics Overview</h3>
              <button
                style={styles.toggleStatsBtn}
                onClick={() => setShowStats(!showStats)}
              >
                {showStats ? <FaEyeSlash /> : <FaEye />}
                {showStats ? "Hide Stats" : "Show Stats"}
              </button>
            </div>
            {showStats && (
              <div style={styles.statsGrid}>
                {/* Stats cards - same as before */}
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
                {canViewOrderPricing() && (
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
                )}

                {/* NEW: Shipped Orders Card */}
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconEmerald }}>
                    <FaTruck />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Orders Shipped</span>
                    <span style={styles.statValue}>
                      {formatNumber(stats.shipped_orders)}
                    </span>
                    <div style={styles.statSubInfo}>
                      Qty: {formatNumber(stats.shipped_quantity)}
                    </div>
                    {canViewOrderPricing() && (
                      <div style={styles.statSmallInfo}>
                        Value: {formatCurrency(stats.shipped_value)}
                      </div>
                    )}
                  </div>
                </div>

                {/* NEW: Not Shipped Orders Card */}
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconOrange }}>
                    <FaBoxOpen />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Orders Not Shipped</span>
                    <span style={styles.statValue}>
                      {formatNumber(stats.not_shipped_orders)}
                    </span>
                    <div style={styles.statSubInfo}>
                      Qty: {formatNumber(stats.not_shipped_quantity)}
                    </div>
                    {canViewOrderPricing() && (
                      <div style={styles.statSmallInfo}>
                        Value: {formatCurrency(stats.not_shipped_value)}
                      </div>
                    )}
                  </div>
                </div>

                {/* NEW: Shipment Percentage Card */}
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconPurple }}>
                    <FaChartLine />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Shipment Progress</span>
                    <span style={styles.statValue}>
                      {stats.shipment_percentage}%
                    </span>
                    <div style={styles.statSubInfo}>
                      {stats.shipped_orders} of {stats.total_orders} orders shipped
                    </div>
                    <div style={styles.statSmallInfo}>
                      <div style={{
                        width: "100%",
                        height: "6px",
                        background: "#e2e8f0",
                        borderRadius: "3px",
                        overflow: "hidden",
                        marginTop: "4px"
                      }}>
                        <div style={{
                          width: `${stats.shipment_percentage}%`,
                          height: "100%",
                          background: stats.shipment_percentage >= 70 ? "#10b981" : 
                                     stats.shipment_percentage >= 40 ? "#f59e0b" : "#ef4444",
                          borderRadius: "3px",
                          transition: "width 0.5s ease"
                        }} />
                      </div>
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
                    {canViewOrderPricing() && (
                      <>
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
                      </>
                    )}
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
                    {canViewOrderPricing() && (
                      <>
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
                      </>
                    )}
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
                    {canViewOrderPricing() && (
                      <>
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
                      </>
                    )}
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
                    {canViewOrderPricing() && (
                      <>
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
                      </>
                    )}
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
              >
                {showStat ? <FaEyeSlash /> : <FaEye />}
                {showStat ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
            {showStat && (
              <div style={styles.filtersSection}>
                {/* Filter controls - same as before */}
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
                  {/* SEARCH INPUT */}
                  <div style={styles.searchWrapperSmall} ref={searchInputRef}>
                    <FaSearch style={styles.searchIconSmall} />
                    <input
                      type="text"
                      placeholder="Search orders by PO No, Style, Customer, Supplier, Item..."
                      value={searchInputValue}
                      onChange={(e) => setSearchInputValue(e.target.value)}
                      style={styles.searchInputSmall}
                    />
                    {searchInputValue && (
                      <button
                        style={styles.clearSearchSmall}
                        onClick={() => setSearchInputValue("")}
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
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
                        setIsSupplierDropdownOpen(false);
                        setIsDepartmentDropdownOpen(false);
                        setIsGarmentDropdownOpen(false);
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

                  {/* Customer Filter */}
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
                        setIsSupplierDropdownOpen(false);
                        setIsDepartmentDropdownOpen(false);
                        setIsGarmentDropdownOpen(false);
                        if (customerOptions.length === 0)
                          fetchCustomerOptions();
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
                                const allNames = customerOptions.map(
                                  (c) =>
                                    c.display_name || getCustomerDisplayName(c),
                                );
                                setSelectedCustomers(allNames);
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
                          {filteredCustomerOptions.map((customer) => {
                            const name =
                              customer.display_name ||
                              getCustomerDisplayName(customer);
                            const isSelected = selectedCustomers.includes(name);
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
                                  toggleCustomerSelection(customer)
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
                                <span>{name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Supplier Filter */}
                  <div style={styles.filterWrapper} ref={supplierDropdownRef}>
                    <div
                      style={{
                        ...styles.filterSelect,
                        ...(isSupplierDropdownOpen
                          ? styles.filterSelectActive
                          : {}),
                      }}
                      onClick={() => {
                        setIsSupplierDropdownOpen(!isSupplierDropdownOpen);
                        setShowStatusDropdown(false);
                        setShowYearDropdown(false);
                        setIsCustomerDropdownOpen(false);
                        setIsDepartmentDropdownOpen(false);
                        setIsGarmentDropdownOpen(false);
                        if (supplierOptions.length === 0)
                          fetchSupplierOptions();
                      }}
                    >
                      <FaUser
                        style={{ color: "#94a3b8", marginRight: "8px" }}
                      />
                      <span
                        style={
                          selectedSuppliers.length === 0
                            ? styles.placeholder
                            : {}
                        }
                      >
                        {getSupplierDisplayText()}
                      </span>
                      {selectedSuppliers.length > 0 && (
                        <FaTimes
                          style={styles.clearIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            clearAllSuppliers();
                          }}
                        />
                      )}
                      <FaChevronDown style={styles.chevron} />
                    </div>
                    {isSupplierDropdownOpen && (
                      <div style={styles.dropdownMenuMultiSelect}>
                        <div style={styles.dropdownSearch}>
                          <FaSearch
                            style={{ color: "#94a3b8", fontSize: "14px" }}
                          />
                          <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={supplierSearchTerm}
                            onChange={(e) =>
                              setSupplierSearchTerm(e.target.value)
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
                                const allNames = supplierOptions.map(
                                  (s) => s.display_name || s.supplier_name,
                                );
                                setSelectedSuppliers(allNames);
                              }}
                            >
                              Select All
                            </button>
                            <button
                              style={styles.multiSelectActionBtn}
                              onClick={clearAllSuppliers}
                            >
                              Clear All
                            </button>
                          </div>
                          {filteredSupplierOptions.map((supplier) => {
                            const name =
                              supplier.display_name || supplier.supplier_name;
                            const isSelected = selectedSuppliers.includes(name);
                            return (
                              <div
                                key={supplier.id}
                                style={{
                                  ...styles.dropdownOptionMultiSelect,
                                  ...(isSelected
                                    ? styles.dropdownOptionSelected
                                    : {}),
                                }}
                                onClick={() =>
                                  toggleSupplierSelection(supplier)
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
                                <FaUser
                                  style={{
                                    marginRight: "8px",
                                    fontSize: "12px",
                                  }}
                                />
                                <span>{name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shipment Date Filter */}
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
                        setIsSupplierDropdownOpen(false);
                        setIsDepartmentDropdownOpen(false);
                        setIsGarmentDropdownOpen(false);
                      }}
                    >
                      <FaCalendarWeek
                        style={{ color: "#94a3b8", marginRight: "8px" }}
                      />
                      <span
                        style={
                          selectedShipmentYears.length > 0 ||
                          selectedShipmentMonths.length > 0
                            ? {}
                            : styles.placeholder
                        }
                      >
                        {getDisplayText()}
                      </span>
                      {(selectedShipmentYears.length > 0 ||
                        selectedShipmentMonths.length > 0) && (
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
                          {filteredYears.map((year) => {
                            const yearStr = year.toString();
                            const isYearSelected =
                              selectedShipmentYears.includes(yearStr);
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
                                        ...(isYearSelected
                                          ? styles.customCheckboxChecked
                                          : {}),
                                      }}
                                    >
                                      {isYearSelected && <FaCheck size={10} />}
                                    </div>
                                    <span style={styles.yearLabel}>{year}</span>
                                  </div>
                                  {isYearSelected && (
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
                                {isExpanded && isYearSelected && (
                                  <div style={styles.monthsContainer}>
                                    <div style={styles.monthsGrid}>
                                      {months.map((month) => {
                                        const isMonthSelected =
                                          selectedShipmentMonths.includes(
                                            month,
                                          );
                                        return (
                                          <div
                                            key={month}
                                            style={styles.monthItem}
                                            onClick={() =>
                                              toggleMonthForYear(month)
                                            }
                                          >
                                            <div
                                              style={{
                                                ...styles.monthCheckbox,
                                                ...(isMonthSelected
                                                  ? styles.monthCheckboxChecked
                                                  : {}),
                                              }}
                                            >
                                              {isMonthSelected && (
                                                <FaCheck size={8} />
                                              )}
                                            </div>
                                            <span style={styles.monthName}>
                                              {month.substring(0, 3)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Garment Filter */}
                  <div style={styles.filterWrapper} ref={garmentDropdownRef}>
                    <div
                      style={{
                        ...styles.filterSelect,
                        ...(isGarmentDropdownOpen
                          ? styles.filterSelectActive
                          : {}),
                      }}
                      onClick={() => {
                        setIsGarmentDropdownOpen(!isGarmentDropdownOpen);
                        setShowStatusDropdown(false);
                        setShowYearDropdown(false);
                        setIsCustomerDropdownOpen(false);
                        setIsSupplierDropdownOpen(false);
                        setIsDepartmentDropdownOpen(false);
                        if (garmentOptions.length === 0) fetchGarmentOptions();
                      }}
                    >
                      <FaTag style={{ color: "#94a3b8", marginRight: "8px" }} />
                      <span
                        style={
                          selectedGarments.length === 0
                            ? styles.placeholder
                            : {}
                        }
                      >
                        {getGarmentDisplayText()}
                      </span>
                      {selectedGarments.length > 0 && (
                        <FaTimes
                          style={styles.clearIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            clearAllGarments();
                          }}
                        />
                      )}
                      <FaChevronDown style={styles.chevron} />
                    </div>
                    {isGarmentDropdownOpen && (
                      <div style={styles.dropdownMenuMultiSelect}>
                        <div style={styles.dropdownSearch}>
                          <FaSearch
                            style={{ color: "#94a3b8", fontSize: "14px" }}
                          />
                          <input
                            type="text"
                            placeholder="Search garments..."
                            value={garmentSearchTerm}
                            onChange={(e) =>
                              setGarmentSearchTerm(e.target.value)
                            }
                            style={styles.dropdownSearchInput}
                            autoFocus
                          />
                        </div>
                        <div style={styles.dropdownOptionsMultiSelect}>
                          <div style={styles.multiSelectActions}>
                            <button
                              style={styles.multiSelectActionBtn}
                              onClick={() =>
                                setSelectedGarments([...garmentOptions])
                              }
                            >
                              Select All
                            </button>
                            <button
                              style={styles.multiSelectActionBtn}
                              onClick={clearAllGarments}
                            >
                              Clear All
                            </button>
                          </div>
                          {filteredGarmentOptions.map((garment) => {
                            const isSelected =
                              selectedGarments.includes(garment);
                            return (
                              <div
                                key={garment}
                                style={{
                                  ...styles.dropdownOptionMultiSelect,
                                  ...(isSelected
                                    ? styles.dropdownOptionSelected
                                    : {}),
                                }}
                                onClick={() => toggleGarmentSelection(garment)}
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
                                <FaTag
                                  style={{
                                    marginRight: "8px",
                                    fontSize: "12px",
                                  }}
                                />
                                <span>{garment}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Department Filter */}
                  <div style={styles.filterWrapper} ref={departmentDropdownRef}>
                    <div
                      style={{
                        ...styles.filterSelect,
                        ...(isDepartmentDropdownOpen
                          ? styles.filterSelectActive
                          : {}),
                      }}
                      onClick={() => {
                        setIsDepartmentDropdownOpen(!isDepartmentDropdownOpen);
                        setShowStatusDropdown(false);
                        setShowYearDropdown(false);
                        setIsCustomerDropdownOpen(false);
                        setIsSupplierDropdownOpen(false);
                        setIsGarmentDropdownOpen(false);
                        if (departmentOptions.length === 0)
                          fetchDepartmentOptions();
                      }}
                    >
                      <FaBuilding
                        style={{ color: "#94a3b8", marginRight: "8px" }}
                      />
                      <span
                        style={
                          selectedDepartments.length === 0
                            ? styles.placeholder
                            : {}
                        }
                      >
                        {getDepartmentDisplayText()}
                      </span>
                      {selectedDepartments.length > 0 && (
                        <FaTimes
                          style={styles.clearIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            clearAllDepartments();
                          }}
                        />
                      )}
                      <FaChevronDown style={styles.chevron} />
                    </div>
                    {isDepartmentDropdownOpen && (
                      <div style={styles.dropdownMenuMultiSelect}>
                        <div style={styles.dropdownSearch}>
                          <FaSearch
                            style={{ color: "#94a3b8", fontSize: "14px" }}
                          />
                          <input
                            type="text"
                            placeholder="Search departments..."
                            value={departmentSearchTerm}
                            onChange={(e) =>
                              setDepartmentSearchTerm(e.target.value)
                            }
                            style={styles.dropdownSearchInput}
                            autoFocus
                          />
                        </div>
                        <div style={styles.dropdownOptionsMultiSelect}>
                          <div style={styles.multiSelectActions}>
                            <button
                              style={styles.multiSelectActionBtn}
                              onClick={() =>
                                setSelectedDepartments([...departmentOptions])
                              }
                            >
                              Select All
                            </button>
                            <button
                              style={styles.multiSelectActionBtn}
                              onClick={clearAllDepartments}
                            >
                              Clear All
                            </button>
                          </div>
                          {filteredDepartmentOptions.map((dept) => {
                            const isSelected =
                              selectedDepartments.includes(dept);
                            return (
                              <div
                                key={dept}
                                style={{
                                  ...styles.dropdownOptionMultiSelect,
                                  ...(isSelected
                                    ? styles.dropdownOptionSelected
                                    : {}),
                                }}
                                onClick={() => toggleDepartmentSelection(dept)}
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
                                <span>{dept}</span>
                              </div>
                            );
                          })}
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
                              Reset Visible
                            </button>
                            <button
                              style={styles.resetColumnsBtn}
                              onClick={resetColumnOrder}
                            >
                              Reset Order
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
                          {ALL_COLUMNS.filter(
                            (column) =>
                              canViewOrderPricing() ||
                              !PRICING_COLUMN_KEYS.includes(column.key),
                          ).map((column) => (
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
                    {selectedCustomers.map((c, i) => (
                      <span key={i} style={styles.selectedTag}>
                        {c}
                        <button
                          style={styles.selectedTagRemove}
                          onClick={() => removeCustomer(c)}
                        >
                          <FaTimes size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {selectedSuppliers.length > 0 && (
                  <div style={styles.selectedTagsContainer}>
                    <span style={styles.selectedTagsLabel}>
                      Selected suppliers:
                    </span>
                    {selectedSuppliers.map((s, i) => (
                      <span key={i} style={styles.selectedTag}>
                        {s}
                        <button
                          style={styles.selectedTagRemove}
                          onClick={() => removeSupplier(s)}
                        >
                          <FaTimes size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {selectedGarments.length > 0 && (
                  <div style={styles.selectedTagsContainer}>
                    <span style={styles.selectedTagsLabel}>
                      Selected garments:
                    </span>
                    {selectedGarments.map((g, i) => (
                      <span key={i} style={styles.selectedTag}>
                        {g}
                        <button
                          style={styles.selectedTagRemove}
                          onClick={() => removeGarment(g)}
                        >
                          <FaTimes size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {selectedDepartments.length > 0 && (
                  <div style={styles.selectedTagsContainer}>
                    <span style={styles.selectedTagsLabel}>
                      Selected departments:
                    </span>
                    {selectedDepartments.map((d, i) => (
                      <span key={i} style={styles.selectedTag}>
                        {d}
                        <button
                          style={styles.selectedTagRemove}
                          onClick={() => removeDepartment(d)}
                        >
                          <FaTimes size={10} />
                        </button>
                      </span>
                    ))}
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
                    {searchInputValue && (
                      <span style={styles.filterTag}>
                        Search: {searchInputValue}
                        <button
                          style={styles.filterTagButton}
                          onClick={() => setSearchInputValue("")}
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
                    {selectedSuppliers.length > 0 && (
                      <span style={styles.filterTag}>
                        Suppliers: {selectedSuppliers.length} selected
                        <button
                          style={styles.filterTagButton}
                          onClick={clearAllSuppliers}
                        >
                          <FaTimes />
                        </button>
                      </span>
                    )}
                    {selectedGarments.length > 0 && (
                      <span style={styles.filterTag}>
                        Garments: {selectedGarments.length} selected
                        <button
                          style={styles.filterTagButton}
                          onClick={clearAllGarments}
                        >
                          <FaTimes />
                        </button>
                      </span>
                    )}
                    {selectedDepartments.length > 0 && (
                      <span style={styles.filterTag}>
                        Departments: {selectedDepartments.length} selected
                        <button
                          style={styles.filterTagButton}
                          onClick={clearAllDepartments}
                        >
                          <FaTimes />
                        </button>
                      </span>
                    )}
                    {selectedShipmentYears.map((year) => (
                      <span key={year} style={styles.filterTag}>
                        Year: {year}
                        <button
                          style={styles.filterTagButton}
                          onClick={() => toggleYear(year)}
                        >
                          <FaTimes />
                        </button>
                      </span>
                    ))}
                    {selectedShipmentMonths.map((month) => (
                      <span key={month} style={styles.filterTag}>
                        Month: {month}
                        <button
                          style={styles.filterTagButton}
                          onClick={() => toggleMonthForYear(month)}
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
                <thead>
                  <tr>
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
                          onChange={handleSelectAll}
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
                            ...(column.frozen
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
                          draggable={!column.frozen}
                          onDragStart={(e) =>
                            !column.frozen &&
                            handleDragStart(e, columnKey, index)
                          }
                          onDragOver={(e) =>
                            !column.frozen &&
                            handleDragOver(e, columnKey, index)
                          }
                          onDrop={(e) =>
                            !column.frozen && handleDrop(e, columnKey, index)
                          }
                          onDragEnd={handleDragEnd}
                        >
                          <div style={styles.columnHeaderContent}>
                            {!column.frozen && (
                              <FaGripVertical
                                style={styles.dragHandle}
                                size={12}
                              />
                            )}
                            <span>{column.label}</span>
                          </div>
                          {column.sortable && getSortIcon(column.sortKey)}
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
                            title="Drag to resize"
                          />
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
                          onMouseEnter={() => setHoveredRowId(order.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <td
                            style={{
                              ...styles.checkboxCellBody,
                              backgroundColor:
                                hoveredRowId === order.id
                                  ? rowBgColor
                                  : rowBgColor,
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
                            return (
                              column && (
                                <td
                                  key={columnKey}
                                  style={{
                                    ...styles.tableCell,
                                    ...(column.align === "right"
                                      ? { textAlign: "right" }
                                      : {}),
                                    ...(column.frozen
                                      ? {
                                          position: "sticky",
                                          left: "48px",
                                          backgroundColor: rowBgColor,
                                          zIndex: 5,
                                        }
                                      : {}),
                                  }}
                                  onClick={(e) => {
                                    if (columnKey === "actions")
                                      e.stopPropagation();
                                  }}
                                >
                                  {renderCell(order, columnKey, order.tna)}
                                </td>
                              )
                            );
                          })}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
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

// Styles (keep all your existing styles)
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
  headerLeft: { display: "flex", alignItems: "center", gap: "16px" },
  pageTitle: { fontSize: "28px", fontWeight: 600, color: "#0f172a", margin: 0 },
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
  headerActions: { display: "flex", gap: "12px" },
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
    background: "white",
    color: "#475569",
  },
  btnActiveSmall: {
    background: "#eff6ff",
    borderColor: "#2563eb",
    borderWidth: "1px",
    borderStyle: "solid",
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
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
    lineHeight: "1.3",
  },
  statSubInfo: { fontSize: "13px", color: "#475569", marginTop: "2px" },
  statSmallInfo: { fontSize: "11px", color: "#64748b", marginTop: "4px" },
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
  filtersTitle: { display: "flex", alignItems: "center", gap: "8px" },
  clearFilters: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    background: "#f1f5f9",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
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
  searchWrapperSmall: { position: "relative" },
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
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
  filterWrapper: { position: "relative" },
  filterSelect: {
    height: "36px",
    padding: "0 10px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
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
    borderWidth: "1px",
    borderStyle: "solid",
  },
  placeholder: { color: "#94a3b8" },
  chevron: { color: "#94a3b8", fontSize: "10px", marginLeft: "auto" },
  clearIcon: { color: "#94a3b8", cursor: "pointer", fontSize: "10px" },
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
  columnCheckbox: { width: "16px", height: "16px", cursor: "pointer" },
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
  dropdownOptions: { maxHeight: "250px", overflowY: "auto" },
  dropdownOptionsMultiSelect: { maxHeight: "300px", overflowY: "auto" },
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
  dropdownOptionSelected: { background: "#eff6ff", color: "#2563eb" },
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
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
  selectedTagsLabel: { fontSize: "12px", fontWeight: 500, color: "#64748b" },
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
    padding: "2px",
    borderRadius: "50%",
  },
  yearsList: { maxHeight: "450px", overflowY: "auto" },
  yearItem: { borderBottom: "1px solid #f1f5f9" },
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
  yearLabel: { fontSize: "13px", fontWeight: 500, color: "#1e293b" },
  expandButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
  },
  monthsContainer: {
    padding: "10px 14px",
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
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
  monthName: { fontSize: "12px", color: "#334155" },
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
  advancedFilterLabel: { fontSize: "13px", fontWeight: 500, color: "#334155" },
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#334155",
  },
  filterTagButton: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
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
  tableTitle: { display: "flex", alignItems: "center", gap: "12px" },
  resultCount: {
    padding: "4px 10px",
    background: "#f1f5f9",
    borderRadius: "20px",
    fontSize: "13px",
    color: "#475569",
  },
  selectionInfo: { fontSize: "14px", color: "#2563eb", fontWeight: 500 },
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
  sortable: { cursor: "pointer", userSelect: "none" },
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
  resizeHandleActive: { backgroundColor: "#2563eb", width: "2px" },
  dragHandle: {
    cursor: "grab",
    color: "#94a3b8",
    marginRight: "6px",
    opacity: 0.6,
  },
  columnHeaderContent: { display: "flex", alignItems: "center", gap: "4px" },
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
  orderRow: { cursor: "pointer" },
  orderInfo: { display: "flex", alignItems: "center", gap: "12px" },
  orderDetails: { display: "flex", flexDirection: "column" },
  orderPoNo: { fontWeight: 600, color: "#2563eb" },
  orderStyle: {
    fontSize: "12px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  icon: { color: "#94a3b8", fontSize: "12px" },
  companyInfo: { display: "flex", alignItems: "center", gap: "6px" },
  shippedInfo: { fontSize: "11px", color: "#10b981", marginTop: "2px" },
  totalValue: { fontWeight: 600, color: "#059669" },
  dateInfo: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  relativeDate: { fontSize: "11px", color: "#94a3b8" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 500,
  },

  actionButtons: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    justifyContent: "flex-start",
    flexWrap: "nowrap",
  },
  actionBtn: {
    padding: "0",
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    borderWidth: "1px",
    borderStyle: "solid",
    background: "white",
    color: "#64748b",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    minWidth: "32px",
    minHeight: "32px",
    borderColor: "#e2e8f0",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    position: "relative",
  },
  actionBtnTna: {
    color: "#8b5cf6",
    borderColor: "#8b5cf6",
    borderWidth: "1px",
    borderStyle: "solid",
    background: "white",
  },
  actionBtnEdit: {
    color: "#f59e0b",
    borderColor: "#f59e0b",
    borderWidth: "1px",
    borderStyle: "solid",
    background: "white",
  },
  actionBtnDelete: {
    color: "#ef4444",
    borderColor: "#ef4444",
    borderWidth: "1px",
    borderStyle: "solid",
    background: "white",
  },
  actionBtnDisabled: {
    opacity: "0.5",
    cursor: "not-allowed",
    borderColor: "#d1d5db",
    color: "#9ca3af",
  },

  remarksCell: { maxWidth: "300px", minWidth: "180px" },
  remarksDisplay: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "4px 8px",
    borderRadius: "6px",
    backgroundColor: "#f8fafc",
  },
  remarksText: {
    fontSize: "12px",
    color: "#334155",
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: "1.4",
    flex: 1,
  },
  noRemarks: { color: "#94a3b8", fontStyle: "italic" },
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
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    textAlign: "center",
  },
  emptyIcon: { fontSize: "48px", color: "#cbd5e1" },
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
  pageSizeSelector: { display: "flex", alignItems: "center", gap: "8px" },
  pageSizeLabel: { fontSize: "14px", color: "#4a5568" },
  pageSizeSelect: {
    padding: "6px 8px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "white",
    cursor: "pointer",
    outline: "none",
  },
  paginationButtons: { display: "flex", alignItems: "center", gap: "6px" },
  paginationButton: {
    padding: "6px 10px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#d1d5db",
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
    borderWidth: "1px",
    borderStyle: "solid",
    color: "white",
  },
  paginationEllipsis: {
    padding: "8px 4px",
    color: "#6b7280",
    fontSize: "14px",
  },
  // Image column styles
  imageContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "2px 0",
  },
  imageThumbnail: {
    width: "50px",
    height: "50px",
    objectFit: "cover",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    transition: "transform 0.2s",
    "&:hover": {
      transform: "scale(1.1)",
    },
  },
  imageCount: {
    fontSize: "11px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 8px",
    borderRadius: "12px",
    fontWeight: 500,
  },
  noImageContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#94a3b8",
  },
  noImageIcon: {
    fontSize: "16px",
    color: "#cbd5e1",
  },
  noImageText: {
    fontSize: "12px",
  },
  imageError: {
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    borderRadius: "6px",
    color: "#94a3b8",
    fontSize: "20px",
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  tbody tr:hover td { background-color: inherit !important; }
  @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
  * { box-sizing: border-box; }
  .sort-icon { margin-left: 4px; font-size: 12px; color: #94a3b8; }
  .sort-icon.active { color: #2563eb; }
  .action-btn:hover { background: #e2e8f0; color: #334155; }
  .filter-select:hover, .filter-select.active { border-color: #2563eb; }
  .checkbox:hover input ~ .checkmark { border-color: #2563eb; }
  .checkbox input:checked ~ .checkmark { background-color: #2563eb; border-color: #2563eb; }
  .dropdown-option:hover, .dropdown-option-multi-select:hover { background: #f1f5f9; }
  .clear-filters:hover { background: #e2e8f0; color: #ef4444; }
  .clear-search:hover, .clear-icon:hover, .filter-tag button:hover { color: #ef4444; }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: #cbd5e1; }
  .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
  .btn-export:hover, .btn-outline:hover { background: #f9fafb; border-color: #cbd5e1; }
  .search-input-small:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1); }
  .filter-input:focus, .dropdown-search input:focus { outline: none; }
  .select-all-months-btn:hover { background: #2563eb; color: white; }
  .month-item:hover { background: #e2e8f0; }
  .table-header-cell.sortable:hover { color: #2563eb; }
  .pagination-button:hover:not(:disabled) { background-color: #f7fafc; border-color: #94a3b8; }
  .pagination-button:disabled { opacity: 0.5; cursor: not-allowed; }
  .multi-select-action-btn:hover { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
  .toggle-stats-btn:hover { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
  .column-checkbox-label:hover { background: #f1f5f9; }
  .reset-columns-btn:hover { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
  .edit-remarks-btn:hover { background: #e2e8f0; color: #2563eb; }
  .remarks-save-btn:hover { background: #059669; }
  .remarks-cancel-btn:hover { background: #dc2626; }
  th .resize-handle:hover { background-color: #2563eb; width: 2px; }
  th .resize-handle:active { background-color: #1d4ed8; width: 2px; }
  th:hover .resize-handle { background-color: #94a3b8; width: 2px; }
  th[draggable="true"] { cursor: grab; }
  th[draggable="true"]:active { cursor: grabbing; }
  .table-container::-webkit-scrollbar { width: 8px; height: 8px; }
  .table-container::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
  .table-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .table-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .years-list::-webkit-scrollbar { width: 6px; }
  .years-list::-webkit-scrollbar-track { background: #f1f5f9; }
  .years-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .months-grid::-webkit-scrollbar, .column-selector-list::-webkit-scrollbar { width: 4px; }
  .months-grid::-webkit-scrollbar-track, .column-selector-list::-webkit-scrollbar-track { background: #f1f5f9; }
  .months-grid::-webkit-scrollbar-thumb, .column-selector-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  @media (min-width: 1920px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
  @media (max-width: 1440px) { .stats-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); } }
  @media (max-width: 1024px) { .filters-grid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); } }
`;
document.head.appendChild(styleSheet);

export default OrderList;