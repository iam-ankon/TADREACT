// TNADashboard.jsx - Updated with OrderList-like layout
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import TNAReminderBadge from "../merchandiser/TNAReminderBadge.jsx";
import Sidebar from "../merchandiser/Sidebar.jsx";
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
  FaCalendar,
  FaCheckCircle,
  FaHourglassHalf,
  FaTag,
  FaEye,
  FaEyeSlash,
  FaColumns,
  FaGripVertical,
  FaBuilding,
  FaUser,
  FaCalendarWeek,
  FaChartLine,
  FaBoxes,
  FaDollarSign,
  FaTruck,
  FaBan,
  FaFileAlt,
  FaClipboardList,
  FaCheck,
  FaCalendarAlt,
  FaClock,
  FaShip,
} from "react-icons/fa";
import { getSuppliers } from "../../api/merchandiser";

const getAuthToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

const api = axios.create({
  baseURL: "http://119.148.51.38:8000/api/merchandiser/api/",
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getDaysToShipment = (shipmentDate) => {
  if (!shipmentDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const shipment = new Date(shipmentDate);
  const diffTime = shipment - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getOrderStatus = (shipmentDate) => {
  const days = getDaysToShipment(shipmentDate);
  if (days === null) return "unknown";
  if (days < 0) return "overdue";
  if (days <= 15) return "at_risk";
  return "on_track";
};

const getDaysDisplay = (shipmentDate) => {
  const days = getDaysToShipment(shipmentDate);
  if (days === null) return { text: "-", color: "#64748b", bg: "#f1f5f9" };
  if (days < 0)
    return {
      text: `${Math.abs(days)} days overdue`,
      color: "#dc2626",
      bg: "#fee2e2",
    };
  if (days === 0) return { text: "Today", color: "#f59e0b", bg: "#fef3c7" };
  if (days === 1)
    return { text: "1 day left", color: "#10b981", bg: "#dcfce7" };
  if (days <= 7)
    return { text: `${days} days left`, color: "#f59e0b", bg: "#fef3c7" };
  return { text: `${days} days left`, color: "#10b981", bg: "#dcfce7" };
};

const getStatusBadgeStyle = (shipmentDate) => {
  const status = getOrderStatus(shipmentDate);
  const statusConfig = {
    on_track: { text: "On Track", color: "#10b981", bg: "#d1fae5", icon: "✅" },
    at_risk: { text: "At Risk", color: "#f59e0b", bg: "#fef3c7", icon: "⚠️" },
    overdue: { text: "Overdue", color: "#dc2626", bg: "#fee2e2", icon: "🔴" },
    unknown: { text: "Unknown", color: "#64748b", bg: "#f1f5f9", icon: "❓" },
  };
  return statusConfig[status];
};

// Column configuration
const ALL_COLUMNS = [
  {
    key: "order_number",
    label: "Order Number",
    sortable: true,
    sortKey: "order_number",
    width: "150px",
    frozen: true,
    minWidth: "120px",
  },
  {
    key: "supplier",
    label: "Supplier",
    sortable: true,
    sortKey: "supplier",
    width: "160px",
    minWidth: "120px",
  },
  {
    key: "item",
    label: "Item",
    sortable: true,
    sortKey: "item",
    width: "180px",
    minWidth: "100px",
  },
  {
    key: "fabric_type",
    label: "Fabric Type",
    sortable: true,
    sortKey: "fabric_type",
    width: "130px",
    minWidth: "110px",
  },
  {
    key: "shipment_date",
    label: "Shipment Date",
    sortable: true,
    sortKey: "shipment_date",
    width: "130px",
    minWidth: "110px",
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    sortKey: "status",
    width: "120px",
    minWidth: "100px",
  },
  {
    key: "days_left",
    label: "Days Left",
    sortable: true,
    sortKey: "days_left",
    width: "120px",
    minWidth: "100px",
    align: "center",
  },
  {
    key: "fabric_etd",
    label: "Fabric ETD",
    sortable: true,
    sortKey: "fabric_etd",
    width: "110px",
    minWidth: "90px",
  },
  {
    key: "fabric_eta",
    label: "Fabric ETA",
    sortable: true,
    sortKey: "fabric_eta",
    width: "110px",
    minWidth: "90px",
  },
  {
    key: "fabric_booking",
    label: "Fabric Booking",
    sortable: true,
    sortKey: "fabric_booking_date",
    width: "120px",
    minWidth: "100px",
  },
  {
    key: "production_start",
    label: "Production Start",
    sortable: true,
    sortKey: "production_start_date",
    width: "130px",
    minWidth: "110px",
  },
  {
    key: "execution_time",
    label: "Execution Time",
    sortable: true,
    sortKey: "execution_time",
    width: "120px",
    minWidth: "100px",
    align: "center",
  },
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    width: "180px",
    minWidth: "160px",
  },
];

const fabricTypeOptions = [
  { value: "imported", label: "Imported", icon: "🌍" },
  { value: "local", label: "Local", icon: "🏠" },
];

const statusOptions = [
  { value: "on_track", label: "On Track", icon: "✅" },
  { value: "at_risk", label: "At Risk", icon: "⚠️" },
  { value: "overdue", label: "Overdue", icon: "🔴" },
];

export default function TNADashboard() {
  const navigate = useNavigate();

  // ========== STATE DECLARATIONS ==========
  const [tnaList, setTnaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isFiltering, setIsFiltering] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "shipment_date",
    direction: "desc",
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // UI state - Load from localStorage
  const [showStats, setShowStats] = useState(() => {
    const saved = localStorage.getItem("tnaShowStats");
    return saved !== null ? saved === "true" : true;
  });
  const [showFilters, setShowFilters] = useState(() => {
    const saved = localStorage.getItem("tnaShowFilters");
    return saved !== null ? saved === "true" : true;
  });

  // Column state
  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem("tnaColumnOrder");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return ALL_COLUMNS.map((col) => col.key);
      }
    }
    return ALL_COLUMNS.map((col) => col.key);
  });
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem("tnaVisibleColumns");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [
          "order_number",
          "supplier",
          "item",
          "fabric_type",
          "shipment_date",
          "status",
          "days_left",
          "actions",
        ];
      }
    }
    return [
      "order_number",
      "supplier",
      "item",
      "fabric_type",
      "shipment_date",
      "status",
      "days_left",
      "actions",
    ];
  });
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem("tnaColumnWidths");
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
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Filter state
  const [selectedFabricTypes, setSelectedFabricTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [selectedShipmentYears, setSelectedShipmentYears] = useState([]);
  const [selectedShipmentMonths, setSelectedShipmentMonths] = useState([]);
  const [minValueFilter, setMinValueFilter] = useState("");
  const [maxValueFilter, setMaxValueFilter] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Dropdown states
  const [showFabricTypeDropdown, setShowFabricTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [fabricTypeSearchTerm, setFabricTypeSearchTerm] = useState("");
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [yearSearch, setYearSearch] = useState("");

  // Supplier options from API
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [supplierOptionsMap, setSupplierOptionsMap] = useState({});

  // Stats state
  const [stats, setStats] = useState({
    total_tna: 0,
    overdue: 0,
    at_risk: 0,
    on_track: 0,
    imported: 0,
    local: 0,
  });

  // Refs
  const fabricTypeDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const supplierDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);
  const columnSelectorRef = useRef(null);
  const searchInputRef = useRef(null);
  const filterTimeoutRef = useRef(null);
  const isFirstFetchDone = useRef(false);
  const isFetchingRef = useRef(false);
  const tableContainerRef = useRef(null);
  const isRestoringFilters = useRef(true);
  const debouncedFetchRef = useRef(null);

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
  const [availableYears, setAvailableYears] = useState(() => {
    const currentYear = new Date().getFullYear();
    return [String(currentYear), String(currentYear + 1)];
  });

  // ========== HELPER FUNCTIONS ==========
  const orderedVisibleColumns = useMemo(() => {
    const visible = columnOrder.filter((key) => visibleColumns.includes(key));
    const missing = visibleColumns.filter((key) => !visible.includes(key));
    return [...visible, ...missing];
  }, [columnOrder, visibleColumns]);

  // PDM No. (starts with "P") is the single canonical order reference
  // shown for a TNA record; the stored order_number snapshot and po_no
  // can hold multiple comma-separated PO numbers, so they're only a
  // fallback for orders that don't have a PDM No. yet.
  const getOrderNoDisplay = useCallback((tna) => {
    if (!tna) return "";
    return (
      tna.order_number ||
      (tna.id ? `TNA-${tna.id}` : "")
    );
  }, []);

  const getSupplierDisplayName = useCallback(
    (tna) => {
      if (!tna) return "—";

      if (typeof tna.supplier === "string" && tna.supplier) {
        return tna.supplier;
      }

      if (typeof tna.supplier === "object" && tna.supplier !== null) {
        if (tna.supplier.supplier_name) return tna.supplier.supplier_name;
        if (tna.supplier.name) return tna.supplier.name;
        if (tna.supplier.display_name) return tna.supplier.display_name;
        if (tna.supplier.id && supplierOptionsMap[tna.supplier.id]) {
          return supplierOptionsMap[tna.supplier.id];
        }
        if (tna.supplier.id) return `Supplier ${tna.supplier.id}`;
      }

      if (tna.supplier_id && supplierOptionsMap[tna.supplier_id]) {
        return supplierOptionsMap[tna.supplier_id];
      }

      if (
        typeof tna.supplier === "string" &&
        !isNaN(tna.supplier) &&
        supplierOptionsMap[tna.supplier]
      ) {
        return supplierOptionsMap[tna.supplier];
      }

      if (
        tna.supplier &&
        typeof tna.supplier === "number" &&
        supplierOptionsMap[tna.supplier]
      ) {
        return supplierOptionsMap[tna.supplier];
      }

      return "—";
    },
    [supplierOptionsMap],
  );

  // ========== BUILD FILTERS ==========
  const buildFilters = useCallback(() => {
    const filters = {};

    if (searchInputValue && searchInputValue.trim()) {
      filters.search = searchInputValue.trim();
    }

    if (selectedFabricTypes.length > 0) {
      filters.fabric_type = selectedFabricTypes.join("|");
    }
    if (selectedStatuses.length > 0) {
      filters.status = selectedStatuses.join("|");
    }
    if (selectedSuppliers.length > 0) {
      filters.supplier = selectedSuppliers.join("|");
    }
    if (selectedShipmentYears.length > 0) {
      filters.shipment_year = selectedShipmentYears.join("|");
    }
    if (selectedShipmentMonths.length > 0) {
      const monthNameToNumber = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12,
      };
      const monthNumbers = selectedShipmentMonths
        .map((m) => monthNameToNumber[m])
        .filter(Boolean);
      if (monthNumbers.length) {
        filters.shipment_month = monthNumbers.join("|");
      }
    }
    if (minValueFilter) filters.min_value = minValueFilter;
    if (maxValueFilter) filters.max_value = maxValueFilter;

    let sortKey = sortConfig.key;
    if (sortKey === "status") sortKey = "shipment_date";
    if (sortKey === "days_left") sortKey = "shipment_date";
    filters.ordering =
      sortConfig.direction === "desc" ? `-${sortKey}` : sortKey;

    return filters;
  }, [
    searchInputValue,
    selectedFabricTypes,
    selectedStatuses,
    selectedSuppliers,
    selectedShipmentYears,
    selectedShipmentMonths,
    minValueFilter,
    maxValueFilter,
    sortConfig,
  ]);

  // ========== FETCH STATS ==========
  const fetchStats = useCallback(async () => {
    try {
      const filters = buildFilters();
      const params = new URLSearchParams();

      Object.keys(filters).forEach((key) => {
        if (filters[key] && filters[key] !== "") {
          params.append(key, filters[key]);
        }
      });

      const url = `tna/stats/${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await api.get(url);
      setStats(response.data);
    } catch (err) {
      console.error("❌ Error fetching stats:", err);
    }
  }, [buildFilters]);

  // ========== FETCH TNA DATA ==========
  const fetchTNA = useCallback(
    async (page = 1, customFilters = null) => {
      if (isFetchingRef.current) {
        return;
      }

      try {
        isFetchingRef.current = true;
        setLoading(true);
        setIsFiltering(true);

        const filters = customFilters || buildFilters();
        const params = new URLSearchParams({
          page,
          page_size: itemsPerPage,
        });

        Object.keys(filters).forEach((key) => {
          if (filters[key] && filters[key] !== "") {
            params.append(key, filters[key]);
          }
        });

        const url = `tna/?${params.toString()}`;
        const response = await api.get(url);

        let data = [];
        let total = 0;

        if (response.data && response.data.results) {
          data = response.data.results;
          total = response.data.count;
        } else if (Array.isArray(response.data)) {
          data = response.data;
          total = data.length;
        }

        setTnaList(data);
        setTotalItems(total);
        setTotalPages(Math.ceil(total / itemsPerPage));
        setCurrentPage(page);

        fetchStats();
      } catch (err) {
        console.error("❌ Error fetching TNA:", err);
        setError("Failed to load TNA data");
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
        setIsFiltering(false);
        isFetchingRef.current = false;
        isFirstFetchDone.current = true;
      }
    },
    [itemsPerPage, buildFilters, fetchStats],
  );

  useEffect(() => {
    if (isFirstFetchDone.current) {
      fetchStats();
    }
  }, [tnaList, fetchStats]);

  // ========== FETCH SUPPLIER OPTIONS ==========
  const fetchSupplierOptions = useCallback(async (searchTerm = "") => {
    try {
      const filters = {};
      if (searchTerm && searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      const response = await getSuppliers(1, 500, { filters });

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
            supplier.supplier_display ||
            `Supplier ${id}`;
          transformedSuppliers.push({
            id: id,
            display_name: name,
            supplier_name: name,
            name: name,
          });
          map[id] = name;
          map[String(id)] = name;
        });

      transformedSuppliers.sort((a, b) =>
        (a.display_name || "").localeCompare(b.display_name || ""),
      );

      setSupplierOptions(transformedSuppliers);
      setSupplierOptionsMap(map);
    } catch (err) {
      console.error("❌ Error fetching suppliers:", err);
      setSupplierOptions([]);
      setSupplierOptionsMap({});
    }
  }, []);

  // ========== EFFECTS ==========

  // Restore saved filters from localStorage
  useEffect(() => {
    const savedSearchQuery = localStorage.getItem("tnaSearchQuery");
    const savedFabricTypes = localStorage.getItem("tnaFabricTypes");
    const savedStatuses = localStorage.getItem("tnaStatuses");
    const savedSuppliers = localStorage.getItem("tnaSuppliers");
    const savedYears = localStorage.getItem("tnaSelectedYears");
    const savedMonths = localStorage.getItem("tnaSelectedMonths");
    const savedMinValue = localStorage.getItem("tnaMinValue");
    const savedMaxValue = localStorage.getItem("tnaMaxValue");
    const savedItemsPerPage = localStorage.getItem("tnaItemsPerPage");
    const savedSortKey = localStorage.getItem("tnaSortKey");
    const savedSortDirection = localStorage.getItem("tnaSortDirection");

    if (savedSearchQuery) setSearchInputValue(savedSearchQuery);
    if (savedFabricTypes) {
      try {
        setSelectedFabricTypes(JSON.parse(savedFabricTypes));
      } catch (e) {}
    }
    if (savedStatuses) {
      try {
        setSelectedStatuses(JSON.parse(savedStatuses));
      } catch (e) {}
    }
    if (savedSuppliers) {
      try {
        setSelectedSuppliers(JSON.parse(savedSuppliers));
      } catch (e) {}
    }
    if (savedYears) {
      try {
        setSelectedShipmentYears(JSON.parse(savedYears));
      } catch (e) {}
    }
    if (savedMonths) {
      try {
        setSelectedShipmentMonths(JSON.parse(savedMonths));
      } catch (e) {}
    }
    if (savedMinValue) setMinValueFilter(savedMinValue);
    if (savedMaxValue) setMaxValueFilter(savedMaxValue);
    if (savedItemsPerPage) setItemsPerPage(parseInt(savedItemsPerPage));
    if (savedSortKey && savedSortDirection)
      setSortConfig({ key: savedSortKey, direction: savedSortDirection });

    isRestoringFilters.current = false;
    fetchSupplierOptions();
    fetchTNA(1);
  }, []);

  // Re-fetch whenever filters/sort change
  useEffect(() => {
    if (isRestoringFilters.current) return;

    if (debouncedFetchRef.current) clearTimeout(debouncedFetchRef.current);
    debouncedFetchRef.current = setTimeout(() => {
      fetchTNA(1);
    }, 400);

    return () => {
      if (debouncedFetchRef.current) clearTimeout(debouncedFetchRef.current);
    };
  }, [
    searchInputValue,
    selectedFabricTypes,
    selectedStatuses,
    selectedSuppliers,
    selectedShipmentYears,
    selectedShipmentMonths,
    minValueFilter,
    maxValueFilter,
    sortConfig,
    itemsPerPage,
    fetchTNA,
  ]);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem("tnaSearchQuery", searchInputValue);
    localStorage.setItem("tnaFabricTypes", JSON.stringify(selectedFabricTypes));
    localStorage.setItem("tnaStatuses", JSON.stringify(selectedStatuses));
    localStorage.setItem("tnaSuppliers", JSON.stringify(selectedSuppliers));
    localStorage.setItem(
      "tnaSelectedYears",
      JSON.stringify(selectedShipmentYears),
    );
    localStorage.setItem(
      "tnaSelectedMonths",
      JSON.stringify(selectedShipmentMonths),
    );
    localStorage.setItem("tnaMinValue", minValueFilter);
    localStorage.setItem("tnaMaxValue", maxValueFilter);
    localStorage.setItem("tnaItemsPerPage", itemsPerPage.toString());
    localStorage.setItem("tnaSortKey", sortConfig.key);
    localStorage.setItem("tnaSortDirection", sortConfig.direction);
  }, [
    searchInputValue,
    selectedFabricTypes,
    selectedStatuses,
    selectedSuppliers,
    selectedShipmentYears,
    selectedShipmentMonths,
    minValueFilter,
    maxValueFilter,
    itemsPerPage,
    sortConfig,
  ]);

  // Persist UI preferences
  useEffect(() => {
    localStorage.setItem("tnaShowStats", showStats.toString());
    localStorage.setItem("tnaShowFilters", showFilters.toString());
    localStorage.setItem("tnaColumnOrder", JSON.stringify(columnOrder));
    localStorage.setItem("tnaVisibleColumns", JSON.stringify(visibleColumns));
    localStorage.setItem("tnaColumnWidths", JSON.stringify(columnWidths));
  }, [showStats, showFilters, columnOrder, visibleColumns, columnWidths]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        fabricTypeDropdownRef.current &&
        !fabricTypeDropdownRef.current.contains(event.target)
      ) {
        setShowFabricTypeDropdown(false);
        setFabricTypeSearchTerm("");
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
        setStatusSearchTerm("");
      }
      if (
        supplierDropdownRef.current &&
        !supplierDropdownRef.current.contains(event.target)
      ) {
        setShowSupplierDropdown(false);
        setSupplierSearchTerm("");
      }
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target)
      ) {
        setShowYearDropdown(false);
        setYearSearch("");
      }
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

  // Update available years from data
  useEffect(() => {
    if (tnaList.length > 0) {
      const years = new Set();
      tnaList.forEach((tna) => {
        if (tna.shipment_date) {
          const year = new Date(tna.shipment_date).getFullYear();
          years.add(year);
        }
      });
      const sortedYears = Array.from(years)
        .sort((a, b) => b - a)
        .map((y) => String(y));
      if (sortedYears.length > 0) {
        setAvailableYears(sortedYears);
      }
    }
  }, [tnaList]);

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

  // Column drag and drop - FIXED
  const handleDragStart = (e, columnKey, index) => {
    if (resizingColumn) {
      e.preventDefault();
      return;
    }
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

  // FIXED: handleDrop with proper splice logic
  const handleDrop = (e, targetColumnKey, targetIndex) => {
    e.preventDefault();
    
    // If no drag operation or dragging to same column, do nothing
    if (!draggedColumn || draggedColumn.key === targetColumnKey) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    // Check if the dragged column exists in the current order
    if (!columnOrder.includes(draggedColumn.key)) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    // Check if source column is frozen
    const sourceColumn = ALL_COLUMNS.find(
      (col) => col.key === draggedColumn.key,
    );
    if (sourceColumn?.frozen) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    // Get the current order and find the dragged column's index
    const currentOrder = [...columnOrder];
    const draggedIndex = currentOrder.indexOf(draggedColumn.key);

    // If dragged index is -1 or same as target, do nothing
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    // Remove the dragged column from its current position
    currentOrder.splice(draggedIndex, 1);

    // Adjust target index if removal affected it
    const adjustedTargetIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;
    
    // Insert the column at the new position
    currentOrder.splice(adjustedTargetIndex, 0, draggedColumn.key);

    // Update state with new order
    setColumnOrder(currentOrder);
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  // Filter handlers
  const toggleFabricType = (value) => {
    setSelectedFabricTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const toggleStatus = (value) => {
    setSelectedStatuses((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const toggleSupplier = (supplier) => {
    const name =
      supplier.display_name || supplier.supplier_name || supplier.name;
    setSelectedSuppliers((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  };

  const toggleYear = (year) => {
    const yearStr = year.toString();
    setSelectedShipmentYears((prev) =>
      prev.includes(yearStr)
        ? prev.filter((y) => y !== yearStr)
        : [...prev, yearStr],
    );
  };

  const toggleMonth = (month) => {
    setSelectedShipmentMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month],
    );
  };

  const clearAllFilters = () => {
    setSearchInputValue("");
    setSelectedFabricTypes([]);
    setSelectedStatuses([]);
    setSelectedSuppliers([]);
    setSelectedShipmentYears([]);
    setSelectedShipmentMonths([]);
    setMinValueFilter("");
    setMaxValueFilter("");
    setFabricTypeSearchTerm("");
    setStatusSearchTerm("");
    setSupplierSearchTerm("");
    setYearSearch("");
  };

  const getFabricTypeDisplayText = () => {
    if (selectedFabricTypes.length === 0) return "All Fabric Types";
    if (selectedFabricTypes.length === 1) {
      const option = fabricTypeOptions.find(
        (o) => o.value === selectedFabricTypes[0],
      );
      return option ? option.label : selectedFabricTypes[0];
    }
    return `${selectedFabricTypes.length} types selected`;
  };

  const getStatusDisplayText = () => {
    if (selectedStatuses.length === 0) return "All Status";
    if (selectedStatuses.length === 1) {
      const option = statusOptions.find((o) => o.value === selectedStatuses[0]);
      return option ? option.label : selectedStatuses[0];
    }
    return `${selectedStatuses.length} statuses selected`;
  };

  const getSupplierDisplayText = () => {
    if (selectedSuppliers.length === 0) return "All Suppliers";
    if (selectedSuppliers.length === 1) return selectedSuppliers[0];
    return `${selectedSuppliers.length} suppliers selected`;
  };

  const getShipmentDisplayText = () => {
    if (
      selectedShipmentYears.length === 0 &&
      selectedShipmentMonths.length === 0
    )
      return "Shipment Date";
    if (
      selectedShipmentYears.length > 0 &&
      selectedShipmentMonths.length === 0
    ) {
      if (selectedShipmentYears.length === 1) return selectedShipmentYears[0];
      return `${selectedShipmentYears.length} years selected`;
    }
    if (
      selectedShipmentYears.length === 0 &&
      selectedShipmentMonths.length > 0
    ) {
      if (selectedShipmentMonths.length === 1) return selectedShipmentMonths[0];
      return `${selectedShipmentMonths.length} months selected`;
    }
    return `${selectedShipmentYears.length} year(s), ${selectedShipmentMonths.length} month(s)`;
  };

  const filteredFabricTypes = useMemo(() => {
    if (!fabricTypeSearchTerm) return fabricTypeOptions;
    return fabricTypeOptions.filter((opt) =>
      opt.label.toLowerCase().includes(fabricTypeSearchTerm.toLowerCase()),
    );
  }, [fabricTypeSearchTerm]);

  const filteredStatuses = useMemo(() => {
    if (!statusSearchTerm) return statusOptions;
    return statusOptions.filter((opt) =>
      opt.label.toLowerCase().includes(statusSearchTerm.toLowerCase()),
    );
  }, [statusSearchTerm]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchTerm) return supplierOptions;
    return supplierOptions.filter((s) =>
      (s.display_name || s.supplier_name || s.name || "")
        .toLowerCase()
        .includes(supplierSearchTerm.toLowerCase()),
    );
  }, [supplierOptions, supplierSearchTerm]);

  const filteredYears = useMemo(() => {
    if (!yearSearch) return availableYears;
    return availableYears.filter((y) =>
      y.toString().includes(yearSearch.toLowerCase()),
    );
  }, [yearSearch, availableYears]);

  const handleSort = (key) => {
    let sortKey = key;
    if (key === "status") sortKey = "shipment_date";
    if (key === "days_left") sortKey = "shipment_date";
    setSortConfig((prev) => ({
      key: sortKey,
      direction:
        prev.key === sortKey && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
    if (selectAll) setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(tnaList.map((t) => t.id));
    }
    setSelectAll(!selectAll);
  };

  const handleDelete = async (tna, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete TNA record for "${getOrderNoDisplay(tna)}"?`)) {
      try {
        await api.delete(`tna/${tna.id}/`);
        fetchTNA(currentPage);
        fetchStats();
      } catch (err) {
        console.error("Error deleting TNA:", err);
        alert("Failed to delete TNA record");
      }
    }
  };

  const handleExport = async () => {
    const tnasToExport =
      selectedRows.length > 0 ? selectedRows : tnaList.map((t) => t.id);
    if (tnasToExport.length === 0) return alert("No records to export");

    try {
      const exportData = tnaList.filter((t) => tnasToExport.includes(t.id));
      const csvContent = convertToCSV(exportData);
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `TNA_Export_${tnasToExport.length}_records.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      if (selectedRows.length) {
        setSelectedRows([]);
        setSelectAll(false);
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export data");
    }
  };

  const convertToCSV = (data) => {
    const headers = [
      "Order #",
      "Supplier",
      "Item",
      "Fabric Type",
      "Shipment Date",
      "Status",
      "Days Left",
      "Fabric ETD",
      "Fabric ETA",
    ];
    const rows = data.map((t) => [
      getOrderNoDisplay(t),
      getSupplierDisplayName(t),
      t.item || "",
      t.fabric_type === "imported" ? "Imported" : "Local",
      t.shipment_date ? formatDate(t.shipment_date) : "",
      getStatusBadgeStyle(t.shipment_date).text,
      getDaysDisplay(t.shipment_date).text,
      t.fabric_etd ? formatDate(t.fabric_etd) : "",
      t.fabric_eta ? formatDate(t.fabric_eta) : "",
    ]);
    const csvRows = [headers, ...rows];
    return csvRows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
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
      "order_number",
      "supplier",
      "item",
      "fabric_type",
      "shipment_date",
      "status",
      "days_left",
      "actions",
    ]);
  };

  const resetColumnOrder = () =>
    setColumnOrder(ALL_COLUMNS.map((col) => col.key));
  const resetColumnWidths = () => {
    const defaultWidths = {};
    ALL_COLUMNS.forEach((col) => {
      defaultWidths[col.key] = col.width || "150px";
    });
    setColumnWidths(defaultWidths);
  };

  const getSortIcon = (key) => {
    let sortKey = key;
    if (key === "status") sortKey = "shipment_date";
    if (key === "days_left") sortKey = "shipment_date";
    if (sortConfig.key !== sortKey) return <FaSort className="sort-icon" />;
    return sortConfig.direction === "asc" ? (
      <FaSortUp className="sort-icon active" />
    ) : (
      <FaSortDown className="sort-icon active" />
    );
  };

  const activeFilterCount = [
    searchInputValue,
    selectedFabricTypes.length,
    selectedStatuses.length,
    selectedSuppliers.length,
    selectedShipmentYears.length,
    selectedShipmentMonths.length,
    minValueFilter,
    maxValueFilter,
  ].filter(Boolean).length;

  const handlePageChange = (page) => fetchTNA(page);

  const handleItemsPerPageChange = (e) => {
    const newSize = parseInt(e.target.value);
    setItemsPerPage(newSize);
    fetchTNA(1);
  };

  const renderCell = (tna, columnKey) => {
    const daysInfo = getDaysDisplay(tna.shipment_date);
    const statusInfo = getStatusBadgeStyle(tna.shipment_date);
    const supplierName = getSupplierDisplayName(tna);

    switch (columnKey) {
      case "order_number":
        return (
          <strong style={{ color: "#2563eb" }}>
            {getOrderNoDisplay(tna) || `TNA-${tna.id}`}
          </strong>
        );
      case "supplier":
        return (
          <div style={styles.companyInfo}>
            <FaUser style={styles.icon} />
            <span>{supplierName}</span>
          </div>
        );
      case "item":
        return (
          <div
            title={tna.item}
            style={{
              maxWidth: "180px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {tna.item || "—"}
          </div>
        );
      case "fabric_type":
        return (
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 500,
              backgroundColor:
                tna.fabric_type === "imported" ? "#8b5cf6" : "#f59e0b",
              color: "white",
            }}
          >
            {tna.fabric_type === "imported" ? "🌍 Imported" : "🏠 Local"}
          </span>
        );
      case "shipment_date":
        return (
          <div style={styles.dateInfo}>
            <FaCalendar style={styles.icon} />
            <span>{formatDate(tna.shipment_date)}</span>
          </div>
        );
      case "status":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 500,
              backgroundColor: statusInfo.bg,
              color: statusInfo.color,
            }}
          >
            {statusInfo.icon} {statusInfo.text}
          </span>
        );
      case "days_left":
        return (
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 500,
              backgroundColor: daysInfo.bg,
              color: daysInfo.color,
            }}
          >
            {daysInfo.text}
          </span>
        );
      case "fabric_etd":
        return formatDate(tna.fabric_etd);
      case "fabric_eta":
        return formatDate(tna.fabric_eta);
      case "fabric_booking":
        return formatDate(tna.fabric_booking_date);
      case "production_start":
        return formatDate(tna.production_start_date);
      case "execution_time":
        return tna.execution_time !== null ? `${tna.execution_time} days` : "—";
      case "actions":
        return (
          <div
            style={styles.actionButtons}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                ...styles.actionBtn,
                ...styles.actionBtnEdit,
                borderWidth: "1px",
                borderStyle: "solid",
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/edit-tna/${tna.id}`);
              }}
              title="Edit TNA"
            >
              <FaEdit />
            </button>
            <button
              style={{
                ...styles.actionBtn,
                ...styles.actionBtnTna,
                borderWidth: "1px",
                borderStyle: "solid",
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/tna-details/${tna.id}`);
              }}
              title="View TNA Details"
            >
              <FaClock />
            </button>
            <button
              style={{
                ...styles.actionBtn,
                ...styles.actionBtnDelete,
                borderWidth: "1px",
                borderStyle: "solid",
              }}
              onClick={(e) => handleDelete(tna, e)}
              title="Delete TNA"
            >
              <FaTrash />
            </button>
          </div>
        );
      default:
        return "—";
    }
  };

  const removeSupplier = (name) => {
    setSelectedSuppliers((prev) => prev.filter((s) => s !== name));
  };

  const clearAllSuppliers = () => {
    setSelectedSuppliers([]);
    setSupplierSearchTerm("");
  };

  const clearAllYearsAndMonths = () => {
    setSelectedShipmentYears([]);
    setSelectedShipmentMonths([]);
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
              <option value={200}>200 per page</option>
              <option value={500}>500 per page</option>
            </select>
          </div>
          <div style={styles.paginationButtons}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={styles.paginationButton}
            >
              <FaChevronDown style={{ transform: "rotate(90deg)" }} size={12} />
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
              <FaChevronDown
                style={{ transform: "rotate(-90deg)" }}
                size={12}
              />
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
            <p style={{ color: "#64748b" }}>Loading TNA data...</p>
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
        <div style={styles.tnaDashboard}>
          {/* Header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerLeft}>
              <h1 style={styles.pageTitle}>TNA (Time & Action)</h1>
              <div style={styles.headerBadge}>
                <FaCalendar />
                <span>{totalItems} Total</span>
              </div>
            </div>
            <div style={styles.headerActions}>
              <button
                style={styles.btnSecondary}
                onClick={() => navigate("/tna-reminders")}
              >
                <FaCalendarAlt /> TNA REMINDER
              </button>
              <TNAReminderBadge />
              <button
                style={styles.btnExport}
                onClick={handleExport}
                disabled={loading || tnaList.length === 0}
              >
                <FaDownload />{" "}
                {selectedRows.length > 0
                  ? `Export ${selectedRows.length} Selected`
                  : "Export All"}
              </button>
              <Link to="/create-tna" style={styles.btnPrimary}>
                <FaPlus /> New TNA
              </Link>
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
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconBlue }}>
                    <FaClipboardList />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Total TNAs</span>
                    <span style={styles.statValue}>{stats.total_tna}</span>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconRed }}>
                    <FaBan />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Overdue</span>
                    <span style={styles.statValue}>{stats.overdue}</span>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconOrange }}>
                    <FaHourglassHalf />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>At Risk</span>
                    <span style={styles.statValue}>{stats.at_risk}</span>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconGreen }}>
                    <FaCheckCircle />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>On Track</span>
                    <span style={styles.statValue}>{stats.on_track}</span>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconPurple }}>
                    🌍
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Imported Fabric</span>
                    <span style={styles.statValue}>{stats.imported}</span>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, ...styles.statIconTeal }}>
                    🏠
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Local Fabric</span>
                    <span style={styles.statValue}>{stats.local}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters Section */}
          <div style={styles.statsSection}>
            <div style={styles.statsHeader}>
              <h3 style={styles.statsTitle}>Filters</h3>
              <button
                style={styles.toggleStatsBtn}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? <FaEyeSlash /> : <FaEye />}
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
            {showFilters && (
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
                  {/* SEARCH INPUT */}
                  <div style={styles.searchWrapperSmall} ref={searchInputRef}>
                    <FaSearch style={styles.searchIconSmall} />
                    <input
                      type="text"
                      placeholder="Search by Order #, Supplier, Item..."
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

                  {/* Fabric Type Filter */}
                  <div style={styles.filterWrapper} ref={fabricTypeDropdownRef}>
                    <div
                      style={{
                        ...styles.filterSelect,
                        ...(showFabricTypeDropdown
                          ? styles.filterSelectActive
                          : {}),
                      }}
                      onClick={() =>
                        setShowFabricTypeDropdown(!showFabricTypeDropdown)
                      }
                    >
                      <FaTag style={{ color: "#94a3b8", marginRight: "8px" }} />
                      <span
                        style={
                          selectedFabricTypes.length === 0
                            ? styles.placeholder
                            : {}
                        }
                      >
                        {getFabricTypeDisplayText()}
                      </span>
                      {selectedFabricTypes.length > 0 && (
                        <FaTimes
                          style={styles.clearIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFabricTypes([]);
                          }}
                        />
                      )}
                      <FaChevronDown style={styles.chevron} />
                    </div>
                    {showFabricTypeDropdown && (
                      <div style={styles.dropdownMenuMultiSelect}>
                        <div style={styles.dropdownSearch}>
                          <FaSearch
                            style={{ color: "#94a3b8", fontSize: "14px" }}
                          />
                          <input
                            type="text"
                            placeholder="Search fabric types..."
                            value={fabricTypeSearchTerm}
                            onChange={(e) =>
                              setFabricTypeSearchTerm(e.target.value)
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
                                setSelectedFabricTypes(
                                  fabricTypeOptions.map((o) => o.value),
                                )
                              }
                            >
                              Select All
                            </button>
                            <button
                              style={styles.multiSelectActionBtn}
                              onClick={() => setSelectedFabricTypes([])}
                            >
                              Clear All
                            </button>
                          </div>
                          {filteredFabricTypes.map((option) => {
                            const isSelected = selectedFabricTypes.includes(
                              option.value,
                            );
                            return (
                              <div
                                key={option.value}
                                style={{
                                  ...styles.dropdownOptionMultiSelect,
                                  ...(isSelected
                                    ? styles.dropdownOptionSelected
                                    : {}),
                                }}
                                onClick={() => toggleFabricType(option.value)}
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
                                <span>
                                  {option.icon} {option.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
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
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    >
                      <FaCheckCircle
                        style={{ color: "#94a3b8", marginRight: "8px" }}
                      />
                      <span
                        style={
                          selectedStatuses.length === 0
                            ? styles.placeholder
                            : {}
                        }
                      >
                        {getStatusDisplayText()}
                      </span>
                      {selectedStatuses.length > 0 && (
                        <FaTimes
                          style={styles.clearIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStatuses([]);
                          }}
                        />
                      )}
                      <FaChevronDown style={styles.chevron} />
                    </div>
                    {showStatusDropdown && (
                      <div style={styles.dropdownMenuMultiSelect}>
                        <div style={styles.dropdownSearch}>
                          <FaSearch
                            style={{ color: "#94a3b8", fontSize: "14px" }}
                          />
                          <input
                            type="text"
                            placeholder="Search status..."
                            value={statusSearchTerm}
                            onChange={(e) =>
                              setStatusSearchTerm(e.target.value)
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
                                setSelectedStatuses(
                                  statusOptions.map((o) => o.value),
                                )
                              }
                            >
                              Select All
                            </button>
                            <button
                              style={styles.multiSelectActionBtn}
                              onClick={() => setSelectedStatuses([])}
                            >
                              Clear All
                            </button>
                          </div>
                          {filteredStatuses.map((option) => {
                            const isSelected = selectedStatuses.includes(
                              option.value,
                            );
                            return (
                              <div
                                key={option.value}
                                style={{
                                  ...styles.dropdownOptionMultiSelect,
                                  ...(isSelected
                                    ? styles.dropdownOptionSelected
                                    : {}),
                                }}
                                onClick={() => toggleStatus(option.value)}
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
                                <span>
                                  {option.icon} {option.label}
                                </span>
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
                        ...(showSupplierDropdown
                          ? styles.filterSelectActive
                          : {}),
                      }}
                      onClick={() => {
                        setShowSupplierDropdown(!showSupplierDropdown);
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
                    {showSupplierDropdown && (
                      <div style={styles.dropdownMenuMultiSelect}>
                        <div style={styles.dropdownSearch}>
                          <FaSearch
                            style={{ color: "#94a3b8", fontSize: "14px" }}
                          />
                          <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={supplierSearchTerm}
                            onChange={(e) => {
                              setSupplierSearchTerm(e.target.value);
                              if (e.target.value.length > 2) {
                                fetchSupplierOptions(e.target.value);
                              }
                            }}
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
                                  (s) =>
                                    s.display_name || s.supplier_name || s.name,
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
                          {filteredSuppliers.map((supplier) => {
                            const name =
                              supplier.display_name ||
                              supplier.supplier_name ||
                              supplier.name;
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
                                onClick={() => toggleSupplier(supplier)}
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
                          {filteredSuppliers.length === 0 && (
                            <div
                              style={{
                                padding: "20px",
                                textAlign: "center",
                                color: "#94a3b8",
                              }}
                            >
                              {supplierSearchTerm
                                ? "No suppliers found"
                                : "Loading suppliers..."}
                            </div>
                          )}
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
                      onClick={() => setShowYearDropdown(!showYearDropdown)}
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
                        {getShipmentDisplayText()}
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
                                </div>
                                {isYearSelected && (
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
                                            onClick={() => toggleMonth(month)}
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
                                    {selectedShipmentMonths.length > 0 && (
                                      <div style={styles.selectedMonthsTags}>
                                        {selectedShipmentMonths.map((month) => (
                                          <span
                                            key={month}
                                            style={styles.selectedMonthTag}
                                          >
                                            {month}
                                            <button
                                              style={
                                                styles.selectedMonthTagRemove
                                              }
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleMonth(month);
                                              }}
                                            >
                                              <FaTimes size={10} />
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Advanced Filters Button */}
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

                  {/* Column Selector Button */}
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

                {/* Selected Tags */}
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

                {/* Advanced Filters */}
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

                {/* Active Filter Tags */}
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
                    {selectedFabricTypes.map((type) => (
                      <span key={type} style={styles.filterTag}>
                        Fabric:{" "}
                        {fabricTypeOptions.find((o) => o.value === type)?.label}
                        <button
                          style={styles.filterTagButton}
                          onClick={() => toggleFabricType(type)}
                        >
                          <FaTimes />
                        </button>
                      </span>
                    ))}
                    {selectedStatuses.map((status) => (
                      <span key={status} style={styles.filterTag}>
                        Status:{" "}
                        {statusOptions.find((o) => o.value === status)?.label}
                        <button
                          style={styles.filterTagButton}
                          onClick={() => toggleStatus(status)}
                        >
                          <FaTimes />
                        </button>
                      </span>
                    ))}
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
                          onClick={() => toggleMonth(month)}
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
                  TNA List
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
                              resetColumnWidths();
                            }}
                            title="Drag to resize"
                          />
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {tnaList.length > 0 ? (
                    tnaList.map((tna) => {
                      const isSelected = selectedRows.includes(tna.id);
                      return (
                        <tr
                          key={tna.id}
                          style={{
                            ...styles.orderRow,
                            ...(isSelected ? styles.orderRowSelected : {}),
                            backgroundColor: isSelected ? "#eff6ff" : "white",
                            cursor: "pointer",
                          }}
                          onClick={() => navigate(`/tna-details/${tna.id}`)}
                        >
                          <td
                            style={{
                              ...styles.checkboxCellBody,
                              backgroundColor: isSelected ? "#eff6ff" : "white",
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
                                onChange={(e) => handleSelectRow(tna.id, e)}
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
                            return (
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
                                        backgroundColor: isSelected
                                          ? "#eff6ff"
                                          : "white",
                                        zIndex: 5,
                                      }
                                    : {}),
                                  backgroundColor: isSelected
                                    ? "#eff6ff"
                                    : "white",
                                }}
                                onClick={(e) => {
                                  if (columnKey === "actions")
                                    e.stopPropagation();
                                }}
                              >
                                {renderCell(tna, columnKey)}
                              </td>
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
                          <FaCalendar style={styles.emptyIcon} />
                          <h4 style={{ fontSize: "18px", color: "#334155" }}>
                            No TNA records found
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
}

// ========== STYLES ==========
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
  tnaDashboard: {
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
    textDecoration: "none",
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
  btnSecondary: {
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
    padding: "12px 16px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0",
    flexShrink: 0,
  },
  statsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
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
    padding: "4px 12px",
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
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
  },
  statCard: {
    background: "#f8fafc",
    borderRadius: "10px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
    transition: "all 0.2s",
  },
  statIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },
  statContent: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  statLabel: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#64748b",
    marginBottom: "4px",
  },
  statValue: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.2,
  },
  statIconBlue: { background: "#dbeafe", color: "#2563eb" },
  statIconRed: { background: "#fee2e2", color: "#ef4444" },
  statIconOrange: { background: "#fed7aa", color: "#f59e0b" },
  statIconGreen: { background: "#d1fae5", color: "#10b981" },
  statIconPurple: { background: "#ede9fe", color: "#7c3aed" },
  statIconTeal: { background: "#ccfbf1", color: "#14b8a6" },

  filtersSection: {
    padding: "4px 0 0 0",
  },
  filtersHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  filtersTitle: { display: "flex", alignItems: "center", gap: "8px" },
  clearFilters: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    background: "#f1f5f9",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
    borderRadius: "6px",
    color: "#475569",
    fontSize: "13px",
    cursor: "pointer",
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "10px",
    marginBottom: "12px",
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
    padding: "10px 14px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    fontWeight: 600,
    fontSize: "13px",
    color: "#334155",
  },
  resetColumnsBtn: {
    padding: "3px 8px",
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
    padding: "6px 0",
  },
  columnCheckboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 14px",
    fontSize: "13px",
    cursor: "pointer",
  },
  columnCheckbox: { width: "16px", height: "16px", cursor: "pointer" },
  dropdownSearch: {
    padding: "8px 12px",
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
  dropdownOptionsMultiSelect: { maxHeight: "300px", overflowY: "auto" },
  dropdownOptionMultiSelect: {
    padding: "6px 12px",
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
    padding: "6px 12px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  multiSelectActionBtn: {
    flex: 1,
    padding: "3px 8px",
    fontSize: "12px",
    fontWeight: 500,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
    borderRadius: "4px",
    background: "white",
    cursor: "pointer",
    color: "#475569",
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
  yearsList: { maxHeight: "400px", overflowY: "auto" },
  yearItem: { borderBottom: "1px solid #f1f5f9" },
  yearHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 14px",
    backgroundColor: "#ffffff",
  },
  yearCheckboxWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    flex: 1,
  },
  yearLabel: { fontSize: "13px", fontWeight: 500, color: "#1e293b" },
  monthsContainer: {
    padding: "8px 14px",
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
  },
  monthsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "4px",
    maxHeight: "150px",
    overflowY: "auto",
  },
  monthItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 6px",
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
  selectedMonthsTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginTop: "6px",
    paddingTop: "6px",
    borderTop: "1px solid #e2e8f0",
  },
  selectedMonthTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 6px 2px 8px",
    background: "#eff6ff",
    borderRadius: "12px",
    fontSize: "11px",
    color: "#2563eb",
  },
  selectedMonthTagRemove: {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    padding: "2px",
    display: "flex",
    alignItems: "center",
  },
  selectedTagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "6px",
    marginTop: "8px",
    paddingTop: "8px",
    borderTop: "1px solid #e2e8f0",
  },
  selectedTagsLabel: { fontSize: "12px", fontWeight: 500, color: "#64748b" },
  selectedTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "3px 8px 3px 10px",
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
  advancedFilters: {
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid #e2e8f0",
  },
  advancedFilterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
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
    width: "110px",
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
    gap: "6px",
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid #e2e8f0",
  },
  filterTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "3px 8px",
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
    padding: "10px 16px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
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
    minWidth: "900px",
    tableLayout: "auto",
  },
  tableHeaderCell: {
    padding: "8px 10px",
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
    padding: "8px 8px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    left: 0,
    top: 0,
    zIndex: 11,
  },
  checkboxCellBody: {
    width: "48px",
    textAlign: "center",
    padding: "8px 8px",
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
    padding: "8px 10px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "13px",
    color: "#334155",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    position: "relative",
  },
  orderRow: { transition: "background 0.2s", cursor: "pointer" },
  orderRowSelected: { background: "#eff6ff" },
  companyInfo: { display: "flex", alignItems: "center", gap: "6px" },
  dateInfo: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  icon: { color: "#94a3b8", fontSize: "12px" },

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
    padding: "8px 20px",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    flexShrink: 0,
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
    gap: "20px",
    flexWrap: "wrap",
  },
  pageSizeSelector: { display: "flex", alignItems: "center", gap: "8px" },
  pageSizeLabel: { fontSize: "14px", color: "#4a5568" },
  pageSizeSelect: {
    padding: "5px 8px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "white",
    cursor: "pointer",
    outline: "none",
  },
  paginationButtons: { display: "flex", alignItems: "center", gap: "4px" },
  paginationButton: {
    padding: "5px 10px",
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
    minWidth: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  paginationButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
    borderWidth: "1px",
    borderStyle: "solid",
    color: "white",
  },
  paginationEllipsis: {
    padding: "6px 4px",
    color: "#6b7280",
    fontSize: "14px",
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  tbody tr:hover td { background-color: inherit !important; }
  * { box-sizing: border-box; }
  .sort-icon { margin-left: 4px; font-size: 12px; color: #94a3b8; }
  .sort-icon.active { color: #2563eb; }
  .action-btn:hover { background: #e2e8f0; color: #334155; }
  .filter-select:hover { border-color: #2563eb; }
  .checkbox:hover input ~ .checkmark { border-color: #2563eb; }
  .checkbox input:checked ~ .checkmark { background-color: #2563eb; border-color: #2563eb; }
  .dropdown-option-multi-select:hover { background: #f1f5f9; }
  .clear-filters:hover { background: #e2e8f0; color: #ef4444; }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: #cbd5e1; }
  .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
  .btn-export:hover { background: #f9fafb; border-color: #cbd5e1; }
  .search-input-small:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1); }
  .month-item:hover { background: #e2e8f0; }
  .table-header-cell.sortable:hover { color: #2563eb; }
  .pagination-button:hover:not(:disabled) { background-color: #f7fafc; border-color: #94a3b8; }
  .pagination-button:disabled { opacity: 0.5; cursor: not-allowed; }
  .multi-select-action-btn:hover { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
  .toggle-stats-btn:hover { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
  .column-checkbox-label:hover { background: #f1f5f9; }
  .reset-columns-btn:hover { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
  th .resize-handle:hover { background-color: #2563eb; width: 2px; }
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
  .months-grid::-webkit-scrollbar { width: 4px; }
  .months-grid::-webkit-scrollbar-track { background: #f1f5f9; }
  .months-grid::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
`;
document.head.appendChild(styleSheet);