// CommissionList.jsx — Fixed commission calculation with accurate count
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
import Sidebar from "../merchandiser/Sidebar";
import {
  getOrders,
  getOrderStatsWithFilters,
  getCustomers,
  getCommissionStats,
  getDepartments,
  getSuppliers, // <-- ADD THIS IMPORT for supplier options
} from "../../api/merchandiser";
import { canViewOrderPricing } from "../../utils/accessControl";

// Commission/pricing columns hidden from designations that must not see
// money values (e.g. Merchandiser - Production) — see accessControl.js.
const MONEY_COLUMN_KEYS = [
  "unit_price",
  "total_value",
  "estimated_commission",
  "actual_commission",
  "variance",
];

// ========== UTILITY FUNCTIONS ==========
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

// Get supplier display name
const getSupplierDisplayName = (supplier) => {
  if (!supplier) return "—";
  if (typeof supplier === "object" && supplier !== null) {
    if (supplier.supplier_name) return supplier.supplier_name;
    if (supplier.name) {
      if (typeof supplier.name === "object") {
        return supplier.name.supplier_name || supplier.name.name || `Supplier ${supplier.id}`;
      }
      return supplier.name;
    }
    if (supplier.display_name) return supplier.display_name;
    if (supplier.supplier_display) return supplier.supplier_display;
    if (supplier.code) return supplier.code;
    if (supplier.supplier_code) return supplier.supplier_code;
    return `Supplier ${supplier.id || ""}`;
  }
  return supplier;
};

// Format value in millions, lakhs, or thousands based on value
const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (num === 0) return "$0.00";
  
  const absNum = Math.abs(num);
  
  // Check for millions (1,000,000+)
  if (absNum >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  }
  // Check for lakhs (100,000+)
  if (absNum >= 100000) {
    return `$${(num / 100000).toFixed(2)}L`;
  }
  // Check for thousands (1,000+)
  if (absNum >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
};

// Format value for chart axis labels (millions, lakhs, thousands)
const formatAxisValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  const absNum = Math.abs(num);
  
  if (absNum >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (absNum >= 100000) {
    return `${(num / 100000).toFixed(1)}L`;
  }
  if (absNum >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toFixed(0);
};

// Format currency for small values
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmt = (v) =>
  v == null || v === ""
    ? "—"
    : `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const BarChart = ({ data, onBarClick }) => {
  const canvasRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(data.length - 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.parentElement?.getBoundingClientRect();
    const containerWidth = rect ? rect.width - 40 : 800;

    const dpr = window.devicePixelRatio || 1;
    const W = Math.min(containerWidth, 860);
    const H = 200;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);

    const paddingLeft = 36,
      paddingBottom = 28,
      paddingTop = 28,
      paddingRight = 10;
    const chartW = W - paddingLeft - paddingRight;
    const chartH = H - paddingBottom - paddingTop;
    ctx.clearRect(0, 0, W, H);

    const maxVal = data.reduce((max, d) => Math.max(max, d.est, d.act), 0) * 1.15 || 80000;
    const ySteps = 4;
    
    // Calculate step value based on magnitude
    let stepValue;
    const maxValAbs = Math.abs(maxVal);
    if (maxValAbs >= 1000000) {
      stepValue = Math.ceil(maxValAbs / 1000000 / ySteps) * 1000000;
    } else if (maxValAbs >= 100000) {
      stepValue = Math.ceil(maxValAbs / 100000 / ySteps) * 100000;
    } else if (maxValAbs >= 1000) {
      stepValue = Math.ceil(maxValAbs / 1000 / ySteps) * 1000;
    } else {
      stepValue = Math.ceil(maxValAbs / ySteps);
    }
    if (stepValue === 0) stepValue = maxValAbs / ySteps || 1000;

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Inter,sans-serif";
    ctx.textAlign = "right";

    for (let i = 0; i <= ySteps; i++) {
      const v = i * stepValue;
      const y = paddingTop + chartH - (i / ySteps) * chartH;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(W - paddingRight, y);
      ctx.stroke();
      ctx.fillText(formatAxisValue(v), paddingLeft - 4, y + 3);
    }

    const barW = Math.min((chartW / data.length) * 0.32, 20);
    const gap = Math.min((chartW / data.length) * 0.08, 5);
    const slotW = chartW / data.length;

    const barPositions = [];

    data.forEach((d, i) => {
      const x = paddingLeft + i * slotW + slotW * 0.1;
      const isSelected = i === selectedIndex;

      const estH = (d.est / maxVal) * chartH;
      const actH = (d.act / maxVal) * chartH;

      barPositions.push({
        index: i,
        x: x,
        y: paddingTop,
        width: barW * 2 + gap,
        height: chartH,
      });

      ctx.fillStyle = isSelected ? "#1d4ed8" : "#2563eb";
      ctx.fillRect(x, paddingTop + chartH - estH, barW, estH);
      if (d.est > 0) {
        ctx.fillStyle = isSelected ? "#1d4ed8" : "#2563eb";
        ctx.font = "bold 8px Inter,sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          formatAxisValue(d.est),
          x + barW / 2,
          paddingTop + chartH - estH - 3,
        );
      }

      ctx.fillStyle = isSelected ? "#15803d" : "#16a34a";
      ctx.fillRect(x + barW + gap, paddingTop + chartH - actH, barW, actH);
      if (d.act > 0) {
        ctx.fillStyle = isSelected ? "#15803d" : "#16a34a";
        ctx.font = "bold 8px Inter,sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          formatAxisValue(d.act),
          x + barW + gap + barW / 2,
          paddingTop + chartH - actH - 3,
        );
      }

      if (isSelected) {
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 2, paddingTop, barW * 2 + gap + 4, chartH);
      }

      ctx.fillStyle = isSelected ? "#2563eb" : "#64748b";
      ctx.font = isSelected
        ? "bold 9px Inter,sans-serif"
        : "9px Inter,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(d.label, x + barW + gap / 2, H - 6);
    });

    canvas._barPositions = barPositions;
  }, [data, selectedIndex]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dpr = window.devicePixelRatio || 1;
    const scaleX = canvas.width / dpr / canvas.clientWidth;
    const scaleY = canvas.height / dpr / canvas.clientHeight;
    const clickX = x * scaleX;
    const clickY = y * scaleY;

    const barPositions = canvas._barPositions || [];

    for (const bar of barPositions) {
      if (
        clickX >= bar.x &&
        clickX <= bar.x + bar.width &&
        clickY >= bar.y &&
        clickY <= bar.y + bar.height
      ) {
        setSelectedIndex(bar.index);
        if (onBarClick) {
          onBarClick(data[bar.index], bar.index);
        }
        break;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: 200,
        maxWidth: "100%",
        cursor: "pointer",
      }}
      onClick={handleCanvasClick}
    />
  );
};

/* ── Icons ── */
const IconCart = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ width: 22, height: 22, flexShrink: 0 }}
  >
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);
const IconDollar = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ width: 22, height: 22, flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H10a1.5 1.5 0 000 3H15" />
  </svg>
);
const IconPct = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ width: 22, height: 22, flexShrink: 0 }}
  >
    <circle cx="9" cy="9" r="2" />
    <circle cx="15" cy="15" r="2" />
    <path d="M5 19L19 5" />
  </svg>
);
const IconWallet = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ width: 22, height: 22, flexShrink: 0 }}
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M16 12h2" />
  </svg>
);
const IconUpDown = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ width: 22, height: 22, flexShrink: 0 }}
  >
    <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);
const IconSearch = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="#94a3b8"
    strokeWidth="1.8"
    style={{
      width: 15,
      height: 15,
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      flexShrink: 0,
    }}
  >
    <circle cx="9" cy="9" r="5.5" />
    <path d="M14 14l2.5 2.5" strokeLinecap="round" />
  </svg>
);
const IconCal = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="#475569"
    strokeWidth="1.8"
    style={{ width: 14, height: 14, flexShrink: 0 }}
  >
    <rect x="3" y="4" width="14" height="13" rx="2" />
    <path d="M7 2v4M13 2v4M3 8h14" />
  </svg>
);
const IconChev = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="#475569"
    strokeWidth="2"
    style={{ width: 12, height: 12, flexShrink: 0 }}
  >
    <path d="M4 6l4 4 4-4" />
  </svg>
);
const IconFilter = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="#475569"
    strokeWidth="1.8"
    style={{ width: 16, height: 16, flexShrink: 0 }}
  >
    <path d="M3 5h14M6 10h8M9 15h2" />
  </svg>
);
const IconExcel = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="#16a34a"
    strokeWidth="1.8"
    style={{ width: 16, height: 16, flexShrink: 0 }}
  >
    <rect x="3" y="3" width="14" height="14" rx="2" />
    <path d="M7 7l6 6M13 7l-6 6" />
  </svg>
);
const IconImport = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="#2563eb"
    strokeWidth="1.8"
    style={{ width: 16, height: 16, flexShrink: 0 }}
  >
    <path d="M10 3v10M6 9l4 4 4-4M4 15h12" />
  </svg>
);
const IconEdit = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="#475569"
    strokeWidth="1.5"
    style={{ width: 14, height: 14, flexShrink: 0 }}
  >
    <path d="M11 2l3 3-8 8H3v-3l8-8z" />
  </svg>
);
const IconTrash = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="#ef4444"
    strokeWidth="1.5"
    style={{ width: 14, height: 14, flexShrink: 0 }}
  >
    <path d="M3 5h10M7 3h2M5 5l1 8h4l1-8" />
  </svg>
);
const IconEye = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="#2563eb"
    strokeWidth="1.5"
    style={{ width: 14, height: 14, flexShrink: 0 }}
  >
    <circle cx="8" cy="8" r="2" />
    <path d="M1.5 8C3 4.5 5 3 8 3s5 1.5 6.5 5C13 12.5 11 14 8 14s-5-1.5-6.5-6z" />
  </svg>
);
const IconClose = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="#94a3b8"
    strokeWidth="2"
    style={{ width: 14, height: 14, flexShrink: 0 }}
  >
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);
const IconGrid = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="#475569"
    strokeWidth="1.8"
    style={{ width: 16, height: 16, flexShrink: 0 }}
  >
    <rect x="3" y="3" width="6" height="6" rx="1" />
    <rect x="11" y="3" width="6" height="6" rx="1" />
    <rect x="3" y="11" width="6" height="6" rx="1" />
    <rect x="11" y="11" width="6" height="6" rx="1" />
  </svg>
);

// Supplier search icon
const IconSupplier = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="#94a3b8"
    strokeWidth="1.8"
    style={{
      width: 15,
      height: 15,
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      flexShrink: 0,
    }}
  >
    <path d="M2 18a6 6 0 0112 0M8 2a4 4 0 100 8 4 4 0 000-8z" />
    <path d="M14 12a4 4 0 018 0M16 16l2 2" />
  </svg>
);

const CommissionList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChartMonth, setSelectedChartMonth] = useState(null);
  const [searchInputValue, setSearchInputValue] = useState(() => {
    return localStorage.getItem("commissionSearch") || "";
  });
  // Supplier filter - works like customer dropdown
  const [supplierFilter, setSupplierFilter] = useState(() => {
    return localStorage.getItem("commissionSupplierFilter") || "All";
  });
  const [customerFilter, setCustomerFilter] = useState(() => {
    return localStorage.getItem("commissionCustomerFilter") || "All";
  });
  const [departmentFilter, setDepartmentFilter] = useState(() => {
    return localStorage.getItem("commissionDepartmentFilter") || "All";
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    return localStorage.getItem("commissionStatusFilter") || "All";
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    return parseInt(localStorage.getItem("commissionRowsPerPage")) || 10;
  });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
  const [chartData, setChartData] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState(["All"]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [commissionStats, setCommissionStats] = useState({
    total_est: 0,
    total_act: 0,
    orders_with_commission: 0,
  });
  const [loadingCommission, setLoadingCommission] = useState(true);
  const filterTimeoutRef = useRef(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return localStorage.getItem("commissionSelectedMonth") || "";
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    return localStorage.getItem("commissionSelectedYear") || "";
  });
  const [availableMonths, setAvailableMonths] = useState(["All"]);
  const [availableYears, setAvailableYears] = useState(["All"]);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem("commissionVisibleColumns");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [
          "order_no",
          "po_no",
          "customer",
          "department",
          "supplier",
          "quantity",
          "unit_price",
          "total_value",
          "estimated_commission",
          "actual_commission",
          "variance",
          "status",
          "actions",
        ];
      }
    }
    return [
      "order_no",
      "po_no",
      "customer",
      "department",
      "supplier",
      "quantity",
      "unit_price",
      "total_value",
      "estimated_commission",
      "actual_commission",
      "variance",
      "status",
      "actions",
    ];
  });

  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const columnSelectorRef = useRef(null);

  const ALL_COLUMNS = [
    { key: "order_no", label: "Order No.", sortable: true, width: "100px" },
    { key: "po_no", label: "PO No.", sortable: true, width: "120px" },
    { key: "customer", label: "Customer", sortable: true, width: "150px" },
    { key: "department", label: "Department", sortable: true, width: "130px" },
    { key: "supplier", label: "Supplier", sortable: true, width: "150px" },
    {
      key: "quantity",
      label: "Qty",
      sortable: true,
      width: "80px",
      align: "right",
    },
    {
      key: "unit_price",
      label: "Unit Price",
      sortable: true,
      width: "100px",
      align: "right",
    },
    {
      key: "total_value",
      label: "Value",
      sortable: true,
      width: "120px",
      align: "right",
    },
    {
      key: "estimated_commission",
      label: "Est. Commission",
      sortable: true,
      width: "130px",
      align: "right",
    },
    {
      key: "actual_commission",
      label: "Actual Commission",
      sortable: true,
      width: "130px",
      align: "right",
    },
    {
      key: "variance",
      label: "Variance",
      sortable: false,
      width: "100px",
      align: "right",
    },
    { key: "status", label: "Status", sortable: true, width: "100px" },
    { key: "actions", label: "Actions", sortable: false, width: "100px" },
  ];

  // Columns a user with this designation is allowed to see at all
  // (money columns are stripped regardless of their saved preferences).
  const selectableColumns = useMemo(() => {
    return canViewOrderPricing()
      ? ALL_COLUMNS
      : ALL_COLUMNS.filter((col) => !MONEY_COLUMN_KEYS.includes(col.key));
  }, []);

  const orderedVisibleColumns = useMemo(() => {
    return selectableColumns.filter((col) => visibleColumns.includes(col.key));
  }, [visibleColumns, selectableColumns]);

  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event) => {
      setIsSidebarOpen(event.detail?.collapsed || false);
    };
    window.addEventListener("sidebarToggle", handleSidebarToggle);
    return () =>
      window.removeEventListener("sidebarToggle", handleSidebarToggle);
  }, []);

  // Get customer name
  const getCustomerName = useCallback((order) => {
    if (!order) return "—";
    return getCustomerDisplayName(order.customer_name || order.customer);
  }, []);

  // Get supplier name
  const getSupplierName = useCallback((order) => {
    if (!order) return "—";
    if (order.supplier_name) return order.supplier_name;
    if (order.supplier_display) return order.supplier_display;
    if (order.supplier) {
      if (typeof order.supplier === "object") {
        return (
          order.supplier.supplier_name ||
          order.supplier.name ||
          order.supplier.display_name ||
          "—"
        );
      }
      if (typeof order.supplier === "string") return order.supplier;
    }
    return "—";
  }, []);

  // Get department name
  const getDepartmentName = useCallback((order) => {
    if (!order) return "—";
    if (order.department) {
      if (typeof order.department === "object") {
        return order.department.name || order.department.department_name || "—";
      }
      if (typeof order.department === "string") return order.department;
    }
    if (order.department_name) return order.department_name;
    if (order.department_display) return order.department_display;
    if (order.dept) return order.dept;
    if (order.dept_name) return order.dept_name;
    return "—";
  }, []);

  // Build filters for API
  const buildFilters = useCallback(() => {
    const filters = {};

    if (searchInputValue && searchInputValue.trim()) {
      filters.search = searchInputValue.trim();
    }
    if (statusFilter && statusFilter !== "All") {
      filters.status = statusFilter;
    }
    if (customerFilter && customerFilter !== "All") {
      const customer = customerOptions.find((c) => {
        const name = c.customer_name || c.display_name || c.name || "";
        return name === customerFilter;
      });
      if (customer) {
        filters.customer = customer.id;
      }
    }
    // Supplier filter - works like customer dropdown
    if (supplierFilter && supplierFilter !== "All") {
      const supplier = supplierOptions.find((s) => {
        const name = s.supplier_name || s.name || s.display_name || "";
        return name === supplierFilter || s.code === supplierFilter || s.supplier_code === supplierFilter;
      });
      if (supplier) {
        filters.supplier = supplier.id;
      }
    }
    if (departmentFilter && departmentFilter !== "All") {
      filters.department = departmentFilter;
    }
    if (selectedMonth && selectedMonth !== "All") {
      filters.shipment_month = selectedMonth;
    }
    if (selectedYear && selectedYear !== "All") {
      filters.shipment_year = selectedYear;
    }

    return filters;
  }, [
    searchInputValue,
    statusFilter,
    customerFilter,
    supplierFilter,
    departmentFilter,
    customerOptions,
    supplierOptions,
    selectedMonth,
    selectedYear,
  ]);

  // Fetch orders with pagination
  const fetchOrders = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const filters = buildFilters();
        const response = await getOrders(page, rowsPerPage, { filters });

        const commissionOrders = (response.data || []).filter(
          (o) =>
            o.estimated_commission !== null &&
            o.estimated_commission !== undefined,
        );

        setOrders(commissionOrders);
        setTotalItems(response.pagination?.count || 0);
        setTotalPages(response.pagination?.total_pages || 1);
        setCurrentPage(page);

        if (commissionOrders.length > 0 && !selectedOrder) {
          setSelectedOrder(commissionOrders[0]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    },
    [rowsPerPage, buildFilters, selectedOrder],
  );

  // Fetch stats (total orders, total value)
  const fetchStats = useCallback(async () => {
    try {
      const filters = buildFilters();
      const response = await getOrderStatsWithFilters(filters);
      setStats(response);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [buildFilters]);

  // Fetch all available years from orders
  const fetchAvailableYears = useCallback(async () => {
    try {
      let allYears = new Set();
      let page = 1;
      let hasMore = true;
      const pageSize = 100;

      while (hasMore && page <= 50) {
        const response = await getOrders(page, pageSize);
        const data = response.data || [];

        data.forEach((o) => {
          if (o.shipment_date) {
            try {
              const date = new Date(o.shipment_date);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                if (year >= 2013 && year <= 2030) {
                  allYears.add(year.toString());
                }
              }
            } catch (e) {}
          }
        });

        hasMore =
          data.length === pageSize && response.pagination?.next !== null;
        page++;
      }

      const currentYear = new Date().getFullYear();
      for (let year = 2013; year <= currentYear + 1; year++) {
        allYears.add(year.toString());
      }

      const sortedYears = [
        "All",
        ...Array.from(allYears).sort((a, b) => b - a),
      ];
      setAvailableYears(sortedYears);

      return sortedYears;
    } catch (error) {
      console.error("Error fetching available years:", error);
      const currentYear = new Date().getFullYear();
      const years = ["All"];
      for (let year = currentYear + 1; year >= 2013; year--) {
        years.push(year.toString());
      }
      setAvailableYears(years);
      return years;
    }
  }, []);

  // Fetch department options from API
  const fetchDepartmentOptions = useCallback(async () => {
    try {
      setLoadingDepartments(true);
      const response = await getDepartments(1, 500, false);

      let departments = [];
      if (response?.data?.results) {
        departments = response.data.results
          .map((d) => d.department || d.name)
          .filter(Boolean);
      } else if (Array.isArray(response?.data)) {
        departments = response.data
          .map((d) => d.department || d.name)
          .filter(Boolean);
      } else if (response?.data && typeof response.data === "object") {
        departments = Object.values(response.data)
          .map((d) => d?.department || d?.name)
          .filter(Boolean);
      }

      const sortedDepts = ["All", ...departments.sort()];
      setDepartmentOptions(sortedDepts);
      setLoadingDepartments(false);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartmentOptions(["All"]);
      setLoadingDepartments(false);
    }
  }, []);

  const handleBarClick = useCallback((dataPoint, index) => {
    setSelectedChartMonth(dataPoint);
  }, []);

  // Fetch commission data using the new API endpoint
  const fetchCommissionData = useCallback(async () => {
    try {
      setLoadingCommission(true);
      const filters = buildFilters();

      const data = await getCommissionStats(filters);


      setCommissionStats({
        total_est: data.total_est || 0,
        total_act: data.total_act || 0,
        orders_with_commission: data.orders_with_commission || 0,
      });

      if (data.available_months && data.available_months.length > 0) {
        setAvailableMonths(data.available_months);
      }

      if (data.available_years && data.available_years.length > 0) {
        setAvailableYears(data.available_years);
      }

      if (data.chart_data && data.chart_data.length > 0) {
        setChartData(data.chart_data);
      } else {
        setChartData([]);
      }
    } catch (error) {
      console.error("Error fetching commission data:", error);
    } finally {
      setLoadingCommission(false);
    }
  }, [buildFilters]);

  // Generate chart data from orders
  const generateChartData = (ordersData) => {
    const monthMap = {};

    ordersData.forEach((order) => {
      if (!order.shipment_date) return;
      try {
        const date = new Date(order.shipment_date);
        if (isNaN(date.getTime())) return;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });

        if (!monthMap[monthKey]) {
          monthMap[monthKey] = {
            label: monthLabel,
            est: 0,
            act: 0,
          };
        }
        monthMap[monthKey].est += Number(order.estimated_commission) || 0;
        monthMap[monthKey].act += Number(order.actual_commission) || 0;
      } catch (e) {}
    });

    const sortedMonths = Object.keys(monthMap).sort();
    const last12Months = sortedMonths.slice(-12);

    return last12Months.map((key) => ({
      label: monthMap[key].label,
      est: Math.round(monthMap[key].est * 100) / 100,
      act: Math.round(monthMap[key].act * 100) / 100,
    }));
  };

  // Load customer options
  const loadCustomerOptions = useCallback(async () => {
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

  // Load supplier options - works like customer dropdown
  const loadSupplierOptions = useCallback(async () => {
    try {
      const response = await getSuppliers(1, 2000, false);
      if (response && response.data) {
        let suppliersList = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        const transformedSuppliers = suppliersList.map((supplier) => ({
          ...supplier,
          display_name: getSupplierDisplayName(supplier),
          id: supplier.id,
        }));
        setSupplierOptions(transformedSuppliers);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  }, []);

  // Debounced filter change
  const debouncedFilterChange = useCallback(() => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    filterTimeoutRef.current = setTimeout(() => {
      fetchOrders(1);
      fetchStats();
      fetchCommissionData();
    }, 500);
  }, [fetchOrders, fetchStats, fetchCommissionData]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadCustomerOptions(),
        loadSupplierOptions(),
        fetchAvailableYears(),
        fetchDepartmentOptions(),
        fetchOrders(1),
        fetchStats(),
        fetchCommissionData(),
      ]);
    };
    loadData();
  }, []);

  // Effect for filter changes
  useEffect(() => {
    debouncedFilterChange();
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [
    searchInputValue,
    supplierFilter,
    statusFilter,
    customerFilter,
    departmentFilter,
    selectedMonth,
    selectedYear,
    debouncedFilterChange,
  ]);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem("commissionSearch", searchInputValue);
    localStorage.setItem("commissionSupplierFilter", supplierFilter);
    localStorage.setItem("commissionCustomerFilter", customerFilter);
    localStorage.setItem("commissionDepartmentFilter", departmentFilter);
    localStorage.setItem("commissionStatusFilter", statusFilter);
    localStorage.setItem("commissionRowsPerPage", rowsPerPage.toString());
    localStorage.setItem("commissionSelectedMonth", selectedMonth);
    localStorage.setItem("commissionSelectedYear", selectedYear);
  }, [
    searchInputValue,
    supplierFilter,
    customerFilter,
    departmentFilter,
    statusFilter,
    rowsPerPage,
    selectedMonth,
    selectedYear,
  ]);

  // Save column visibility
  useEffect(() => {
    localStorage.setItem(
      "commissionVisibleColumns",
      JSON.stringify(visibleColumns),
    );
  }, [visibleColumns]);

  // Click outside handler for column selector
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

  const toggleColumn = (columnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey],
    );
  };

  const resetColumns = () => {
    setVisibleColumns([
      "order_no",
      "po_no",
      "customer",
      "department",
      "supplier",
      "quantity",
      "unit_price",
      "total_value",
      "estimated_commission",
      "actual_commission",
      "variance",
      "status",
      "actions",
    ]);
  };

  const getStatusStyle = (s) =>
    ({
      Running: { bg: "#dbeafe", color: "#1d4ed8" },
      Active: { bg: "#dcfce7", color: "#15803d" },
      Shipped: { bg: "#f1f5f9", color: "#475569" },
      Pending: { bg: "#fef3c7", color: "#b45309" },
      Cancelled: { bg: "#fee2e2", color: "#dc2626" },
      Received: { bg: "#dcfce7", color: "#15803d" },
    })[s] || { bg: "#f1f5f9", color: "#475569" };

  // PDM No. is the single canonical order reference (starts with "P");
  // po_no can hold multiple comma-separated PO numbers, so it's only a
  // fallback for orders that don't have a PDM No. yet.
  const getOrderNo = (o) =>
    o.pdm_no || (o.id ? `ORD${String(o.id).padStart(3, "0")}` : "—");

  // Use commissionStats for KPI values
  const totalEst = commissionStats.total_est || 0;
  const totalAct = commissionStats.total_act || 0;
  const totalOrdersWithCommission = commissionStats.orders_with_commission || 0;
  const variance = totalAct - totalEst;

  const totalAllOrders = stats.total_orders || 0;
  const totalAllValue = stats.total_value || 0;

  const latestMonth =
    chartData.length > 0 ? chartData[chartData.length - 1] : null;

  // KPI cards with million formatting (money KPIs stripped for
  // designations that must not see pricing/commission values).
  const allKpis = [
    {
      label: "Total Orders",
      value: totalAllOrders,
      display: String(totalAllOrders),
      sub: `${totalAllOrders > 0 ? "▲" : "—"} All orders`,
      subUp: true,
      icon: <IconCart />,
      iconBg: "#dbeafe",
      iconColor: "#2563eb",
    },
    {
      label: "Total Value",
      value: totalAllValue,
      display: formatValue(totalAllValue),
      sub: `${totalAllValue > 0 ? "▲" : "—"} All orders`,
      subUp: true,
      icon: <IconDollar />,
      iconBg: "#dcfce7",
      iconColor: "#16a34a",
    },
    {
      label: "Estimated Commission",
      value: totalEst,
      display: formatValue(totalEst),
      sub: `${totalOrdersWithCommission > 0 ? "▲" : "—"} ${totalOrdersWithCommission} orders with commission`,
      subUp: totalEst > 0,
      icon: <IconPct />,
      iconBg: "#fef3c7",
      iconColor: "#d97706",
    },
    {
      label: "Actual Commission",
      value: totalAct,
      display: formatValue(totalAct),
      sub: `${totalAct > 0 ? "▲" : "—"} ${totalAct > 0 ? "Recorded" : "No actual recorded"}`,
      subUp: totalAct >= 0,
      icon: <IconWallet />,
      iconBg: "#ede9fe",
      iconColor: "#7c3aed",
    },
    {
      label: "Variance",
      value: variance,
      display: `${variance < 0 ? "-" : "+"}${formatValue(Math.abs(variance))}`,
      sub: `${variance !== 0 ? (variance < 0 ? "▼" : "▲") : "—"} Est vs Actual`,
      subUp: variance >= 0,
      icon: <IconUpDown />,
      iconBg: "#e0f2fe",
      iconColor: "#0284c7",
      negative: variance < 0,
    },
  ];

  const MONEY_KPI_LABELS = [
    "Total Value",
    "Estimated Commission",
    "Actual Commission",
    "Variance",
  ];
  const kpis = canViewOrderPricing()
    ? allKpis
    : allKpis.filter((k) => !MONEY_KPI_LABELS.includes(k.label));

  // Render cell content
  const renderCell = (order, columnKey) => {
    switch (columnKey) {
      case "order_no":
        return (
          <Link
            to={`/commissions/${order.id}`}
            style={S.link}
            onClick={(e) => e.stopPropagation()}
          >
            {getOrderNo(order)}
          </Link>
        );
      case "po_no": {
        let poNo = order.po_no || "—";
        if (Array.isArray(poNo)) {
          poNo = poNo[0] || "—";
        } else if (typeof poNo === "string" && poNo.includes(",")) {
          const parts = poNo.split(",").map((p) => p.trim());
          poNo = parts[0] || poNo;
        }
        return poNo;
      }
      case "customer": {
        return getCustomerName(order);
      }
      case "department": {
        return getDepartmentName(order);
      }
      case "supplier":
        return getSupplierName(order);
      case "quantity":
        return order.total_qty ? Number(order.total_qty).toLocaleString() : "—";
      case "unit_price":
        return order.unit_price
          ? `$${Number(order.unit_price).toFixed(2)}`
          : "—";
      case "total_value":
        return formatCurrency(order.total_value);
      case "estimated_commission":
        return formatCurrency(order.estimated_commission);
      case "actual_commission":
        return (
          <span style={{ color: "#16a34a", fontWeight: 600 }}>
            {formatCurrency(order.actual_commission)}
          </span>
        );
      case "variance": {
        const v =
          order.estimated_commission && order.actual_commission
            ? Number(order.actual_commission) -
              Number(order.estimated_commission)
            : null;
        return v === null
          ? "—"
          : `${v < 0 ? "-" : "+"}${formatCurrency(Math.abs(v))}`;
      }
      case "status": {
        const st = getStatusStyle(order.status);
        return (
          <span style={{ ...S.badge, background: st.bg, color: st.color }}>
            {order.status || "—"}
          </span>
        );
      }
      case "actions":
        return (
          <div style={S.actionGroup} onClick={(e) => e.stopPropagation()}>
            {canViewOrderPricing() && (
              <Link
                to={`/commissions/edit/${order.id}`}
                style={S.iconAction}
                title="Edit"
              >
                <IconEdit />
              </Link>
            )}
            <button
              style={{ ...S.iconAction, cursor: "pointer", border: "none" }}
              title="Delete"
            >
              <IconTrash />
            </button>
            <Link
              to={`/commissions/${order.id}`}
              style={S.iconAction}
              title="View"
            >
              <IconEye />
            </Link>
          </div>
        );
      default:
        return "—";
    }
  };

  const handlePageChange = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      fetchOrders(page);
    }
  };

  const sidebarWidth = isSidebarOpen ? 240 : 80;

  if (loading && orders.length === 0)
    return (
      <div style={S.app}>
        <Sidebar />
        <div style={S.loaderArea}>
          <div style={S.spinner} />
          <p style={{ color: "#64748b", marginTop: 12, fontSize: 14 }}>
            Loading commission data...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div style={S.app}>
        <Sidebar />
        <div style={S.loaderArea}>
          <div style={S.errorBox}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={S.errorTitle}>Error Loading Data</h2>
            <p style={S.errorText}>{error}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/login";
                }}
                style={S.btnPrimary}
              >
                Go to Login
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{ ...S.btnPrimary, background: "#64748b" }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div style={S.app}>
      <Sidebar />
      <div style={S.main}>
        {/* ── Page Header ── */}
        <div style={S.pageHead}>
          <div>
            <h1 style={S.pageTitle}>Commission Management Dashboard</h1>
            <p style={S.pageSub}>
              Overview of monthly commission performance and records
            </p>
          </div>
          <div style={S.dateChip}>
            <IconCal />
            <span style={S.dateChipText}>
              {latestMonth ? latestMonth.label : "No Data"}
            </span>
            <IconChev />
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div style={S.kpiRow}>
          {kpis.map((k) => (
            <div key={k.label} style={S.kpiCard}>
              <div
                style={{
                  ...S.kpiIcon,
                  background: k.iconBg,
                  color: k.iconColor,
                }}
              >
                {k.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.kpiLabel}>{k.label}</div>
                <div
                  style={{
                    ...S.kpiVal,
                    color: k.negative ? "#dc2626" : "#0f172a",
                  }}
                >
                  {k.display}
                </div>
                <div
                  style={{
                    ...S.kpiSub,
                    color: k.subUp ? "#16a34a" : "#dc2626",
                  }}
                >
                  <span>{k.subUp ? "▲" : "▼"}</span>
                  <span>{k.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Chart Card (money trend — hidden where pricing is restricted) ── */}
        {canViewOrderPricing() && (
        <div style={S.chartCard}>
          <div style={S.chartTop}>
            <span style={S.chartTitle}>Monthly Commission Trend</span>
            <div style={S.chartLegend}>
              <div style={S.legendItem}>
                <span style={{ ...S.legendDot, background: "#2563eb" }}></span>
                Estimated
              </div>
              <div style={S.legendItem}>
                <span style={{ ...S.legendDot, background: "#16a34a" }}></span>
                Actual
              </div>
            </div>
            <div style={S.chartDateChip}>
              <span style={{ fontSize: 12, color: "#475569" }}>
                Last 12 Months
              </span>
              <IconChev />
            </div>
          </div>
          <div style={S.chartWrapper}>
            <div style={S.chartContainer}>
              <BarChart
                data={
                  chartData.length > 0
                    ? chartData
                    : [{ label: "No Data", est: 0, act: 0 }]
                }
                onBarClick={handleBarClick}
              />
            </div>
            <div style={S.chartLegendBox}>
              <div style={S.legendBoxTitle}>
                {selectedChartMonth
                  ? selectedChartMonth.label
                  : latestMonth
                    ? latestMonth.label
                    : "No Data"}
              </div>
              <div style={S.legendBoxRow}>
                <span
                  style={{ ...S.legendBoxDot, background: "#2563eb" }}
                ></span>
                <span style={S.legendBoxLabel}>Estimated:</span>
                <span style={S.legendBoxValue}>
                  {selectedChartMonth
                    ? formatValue(selectedChartMonth.est)
                    : latestMonth
                      ? formatValue(latestMonth.est)
                      : "$0.00"}
                </span>
              </div>
              <div style={S.legendBoxRow}>
                <span
                  style={{ ...S.legendBoxDot, background: "#16a34a" }}
                ></span>
                <span style={S.legendBoxLabel}>Actual:</span>
                <span style={S.legendBoxValue}>
                  {selectedChartMonth
                    ? formatValue(selectedChartMonth.act)
                    : latestMonth
                      ? formatValue(latestMonth.act)
                      : "$0.00"}
                </span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ── Toolbar ── */}
        <div style={S.toolbar}>
          <div
            style={{ position: "relative", minWidth: 180, flex: "0 1 220px" }}
          >
            <IconSearch />
            <input
              style={S.searchInput}
              type="text"
              placeholder="Search by Order No. or PO No..."
              value={searchInputValue}
              onChange={(e) => {
                setSearchInputValue(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchInputValue && (
              <button
                style={S.clearSearchBtn}
                onClick={() => setSearchInputValue("")}
              >
                <IconClose />
              </button>
            )}
          </div>

          {/* Supplier Filter Dropdown - works like customer dropdown */}
          <div style={S.toolDropWrap}>
            <span style={S.toolDropLabel}>Supplier:</span>
            <select
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={S.toolDrop}
            >
              <option value="All">All Suppliers</option>
              {supplierOptions.map((s) => {
                const name = s.supplier_name || s.name || s.display_name || `Supplier ${s.id}`;
                const code = s.supplier_code || s.code || "";
                const display = code ? `${name} (${code})` : name;
                return (
                  <option key={s.id} value={display}>
                    {display}
                  </option>
                );
              })}
            </select>
            <IconChev />
          </div>

          <div style={S.toolDropWrap}>
            <span style={S.toolDropLabel}>Month:</span>
            <select
              value={selectedMonth || "All"}
              onChange={(e) => {
                setSelectedMonth(
                  e.target.value === "All" ? "" : e.target.value,
                );
                setCurrentPage(1);
              }}
              style={S.toolDrop}
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <IconChev />
          </div>

          <div style={S.toolDropWrap}>
            <span style={S.toolDropLabel}>Year:</span>
            <select
              value={selectedYear || "All"}
              onChange={(e) => {
                setSelectedYear(e.target.value === "All" ? "" : e.target.value);
                setCurrentPage(1);
              }}
              style={S.toolDrop}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <IconChev />
          </div>

          <div style={S.toolDropWrap}>
            <span style={S.toolDropLabel}>Customer:</span>
            <select
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={S.toolDrop}
            >
              <option value="All">All Customers</option>
              {customerOptions.map((c) => {
                const name = c.customer_name || c.display_name || c.name || `Customer ${c.id}`;
                return (
                  <option key={c.id} value={name}>
                    {name}
                  </option>
                );
              })}
            </select>
            <IconChev />
          </div>

          <div style={S.toolDropWrap}>
            <span style={S.toolDropLabel}>Department:</span>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={S.toolDrop}
            >
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <IconChev />
          </div>

          <div style={S.toolDropWrap}>
            <span style={S.toolDropLabel}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={S.toolDrop}
            >
              {[
                "All",
                "Running",
                "Active",
                "Shipped",
                "Pending",
                "Cancelled",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <IconChev />
          </div>

          <div style={S.toolActions}>
            <button style={S.btnExcel}>
              <IconExcel /> Export
            </button>
            <button style={S.btnImport}>
              <IconImport /> Import
            </button>

            <div style={{ position: "relative" }} ref={columnSelectorRef}>
              <button
                style={{
                  ...S.btnIcon,
                  ...(showColumnSelector ? S.btnActiveSmall : {}),
                }}
                onClick={() => setShowColumnSelector(!showColumnSelector)}
              >
                <span style={{ fontSize: "14px" }}>☰</span>
              </button>
              {showColumnSelector && (
                <div style={S.columnSelectorDropdown}>
                  <div style={S.columnSelectorHeader}>
                    <span>Select Columns</span>
                    <button style={S.resetColumnsBtn} onClick={resetColumns}>
                      Reset
                    </button>
                  </div>
                  <div style={S.columnSelectorList}>
                    {selectableColumns.map((column) => (
                      <label key={column.key} style={S.columnCheckboxLabel}>
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(column.key)}
                          onChange={() => toggleColumn(column.key)}
                          style={S.columnCheckbox}
                        />
                        <span>{column.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Table + Detail Panel ── */}
        <div style={S.contentRow}>
          <div style={S.tableWrapper}>
            <div style={S.tableContainer}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {orderedVisibleColumns.map((column) => (
                      <th
                        key={column.key}
                        style={{
                          ...S.th,
                          textAlign: column.align || "left",
                          width: column.width,
                        }}
                      >
                        {column.label}
                        {column.sortable && (
                          <span
                            style={{
                              marginLeft: 4,
                              opacity: 0.4,
                              fontSize: 10,
                            }}
                          >
                            ↕
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={orderedVisibleColumns.length}
                        style={{
                          textAlign: "center",
                          padding: "56px",
                          color: "#94a3b8",
                          fontSize: 15,
                        }}
                      >
                        No commission records found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const isSelected = selectedOrder?.id === order.id;
                      return (
                        <tr
                          key={order.id}
                          style={{
                            ...S.tr,
                            background: isSelected ? "#f0f7ff" : undefined,
                          }}
                          onClick={() => setSelectedOrder(order)}
                        >
                          {orderedVisibleColumns.map((column) => (
                            <td
                              key={column.key}
                              style={{
                                ...S.td,
                                textAlign: column.align || "left",
                              }}
                            >
                              {renderCell(order, column.key)}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={S.pgBar}>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Showing{" "}
                {orders.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}{" "}
                to {Math.min(currentPage * rowsPerPage, totalItems)} of{" "}
                {totalItems} entries
              </span>
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  style={S.pgBtn}
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p;
                  if (totalPages <= 5) {
                    p = i + 1;
                  } else if (currentPage <= 3) {
                    p = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    p = totalPages - 4 + i;
                  } else {
                    p = currentPage - 2 + i;
                  }
                  return p <= totalPages ? (
                    <button
                      key={p}
                      style={{
                        ...S.pgBtn,
                        ...(currentPage === p ? S.pgBtnActive : {}),
                      }}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </button>
                  ) : null;
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span style={{ color: "#94a3b8", padding: "0 4px" }}>…</span>
                )}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <button
                    style={S.pgBtn}
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </button>
                )}
                <button
                  style={S.pgBtn}
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  ›
                </button>
              </div>
              <div style={S.pgSelectWrap}>
                <span style={{ fontSize: 13, color: "#64748b" }}>Rows:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                    fetchOrders(1);
                  }}
                  style={S.pgSelect}
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Order Detail Panel ── */}
          {selectedOrder && (
            <div style={S.detailPanel}>
              <div style={S.dpHeader}>
                <span style={S.dpTitle}>Order Details</span>
                <button
                  style={S.dpClose}
                  onClick={() => setSelectedOrder(null)}
                >
                  <IconClose />
                </button>
              </div>

              {[
                ["Order No.", getOrderNo(selectedOrder)],
                [
                  "PO No.",
                  (() => {
                    let poNo = selectedOrder.po_no || "—";
                    if (Array.isArray(poNo)) {
                      poNo = poNo[0] || "—";
                    } else if (typeof poNo === "string" && poNo.includes(",")) {
                      const parts = poNo.split(",").map((p) => p.trim());
                      poNo = parts[0] || poNo;
                    }
                    return poNo;
                  })(),
                ],
                ["Customer", getCustomerName(selectedOrder), true],
                ["Department", getDepartmentName(selectedOrder), true],
                ["Supplier", getSupplierName(selectedOrder), true],
              ].map(([l, v, blue]) => (
                <div key={l} style={S.dpRow}>
                  <span style={S.dpLabel}>{l}</span>
                  <span
                    style={{ ...S.dpVal, color: blue ? "#2563eb" : "#0f172a" }}
                  >
                    {v}
                  </span>
                </div>
              ))}

              <div style={S.dpDivider} />

              {[
                ["Qty", selectedOrder.total_qty || "—"],
                ...(canViewOrderPricing()
                  ? [
                      [
                        "Unit Price",
                        selectedOrder.unit_price
                          ? `$${Number(selectedOrder.unit_price).toFixed(2)}`
                          : "—",
                      ],
                      ["Value", formatCurrency(selectedOrder.total_value)],
                    ]
                  : []),
              ].map(([l, v]) => (
                <div key={l} style={S.dpRow}>
                  <span style={S.dpLabel}>{l}</span>
                  <span style={S.dpVal}>{v}</span>
                </div>
              ))}

              {canViewOrderPricing() && <div style={S.dpDivider} />}

              {canViewOrderPricing() && (() => {
                const v =
                  selectedOrder.estimated_commission &&
                  selectedOrder.actual_commission
                    ? Number(selectedOrder.actual_commission) -
                      Number(selectedOrder.estimated_commission)
                    : null;
                return [
                  [
                    "Est. Commission",
                    formatCurrency(selectedOrder.estimated_commission),
                    null,
                  ],
                  [
                    "Actual Commission",
                    formatCurrency(selectedOrder.actual_commission),
                    "#16a34a",
                  ],
                  [
                    "Variance",
                    v === null
                      ? "—"
                      : `${v < 0 ? "-" : "+"}${formatCurrency(Math.abs(v))}`,
                    v === null ? null : v < 0 ? "#dc2626" : "#16a34a",
                  ],
                ].map(([l, val, c]) => (
                  <div key={l} style={S.dpRow}>
                    <span style={S.dpLabel}>{l}</span>
                    <span
                      style={{
                        ...S.dpVal,
                        color: c || "#0f172a",
                        fontWeight: c ? 600 : 400,
                      }}
                    >
                      {val}
                    </span>
                  </div>
                ));
              })()}

              <div style={S.dpDivider} />

              <div style={S.dpRow}>
                <span style={S.dpLabel}>Status</span>
                <span
                  style={{
                    ...S.badge,
                    ...getStatusStyle(selectedOrder.status),
                    padding: "3px 12px",
                    fontSize: 11,
                  }}
                >
                  {selectedOrder.status || "—"}
                </span>
              </div>
              <div style={S.dpRow}>
                <span style={S.dpLabel}>Order Date</span>
                <span style={S.dpVal}>
                  {fmtDate(selectedOrder.commission_rec_date)}
                </span>
              </div>
              <div style={S.dpRow}>
                <span style={S.dpLabel}>Remarks</span>
                <span style={S.dpVal}>{selectedOrder.remarks || "—"}</span>
              </div>

              <div style={S.dpActions}>
                <Link
                  to={`/commissions/edit/${selectedOrder.id}`}
                  style={S.dpEditBtn}
                >
                  Edit Record
                </Link>
                <button style={S.dpDeleteBtn}>Delete Record</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Styles ── */
const S = {
  app: {
    display: "flex",
    minHeight: "100vh",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
    width: "100%",
    position: "relative",
  },
  main: {
    flex: 1,
    padding: "24px 28px",
    height: "100vh",
    overflowY: "auto",
    backgroundColor: "#f1f5f9",
    boxSizing: "border-box",
    transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  loaderArea: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    height: "100vh",
    width: "100%",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #2563eb",
    borderRadius: "50%",
    animation: "spin .8s linear infinite",
  },
  errorBox: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    padding: "48px",
    textAlign: "center",
    maxWidth: 440,
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
  },
  errorTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },
  errorText: {
    color: "#64748b",
    fontSize: 14,
    marginBottom: 24,
  },

  pageHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  pageTitle: {
    fontSize: "clamp(20px, 2.2vw, 24px)",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  pageSub: {
    fontSize: "clamp(12px, 1.1vw, 14px)",
    color: "#64748b",
    margin: "4px 0 0",
  },
  dateChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    background: "#fff",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    flexShrink: 0,
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: 500,
    color: "#1e293b",
    margin: "0 4px",
  },

  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    background: "#fff",
    borderRadius: 12,
    padding: "14px 16px",
    border: "1px solid #e8ecf2",
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    minWidth: 0,
  },
  kpiIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kpiLabel: {
    fontSize: "clamp(10px, 0.9vw, 12px)",
    color: "#64748b",
    fontWeight: 500,
    marginBottom: 1,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  kpiVal: { fontSize: "clamp(16px, 1.5vw, 20px)", fontWeight: 700 },
  kpiSub: {
    fontSize: "clamp(9px, 0.8vw, 11px)",
    marginTop: 1,
    display: "flex",
    alignItems: "center",
    gap: 3,
  },

  chartCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8ecf2",
    padding: "16px 18px",
    marginBottom: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  chartTop: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  chartTitle: {
    fontSize: "clamp(14px, 1.2vw, 16px)",
    fontWeight: 600,
    color: "#0f172a",
    marginRight: "auto",
  },
  chartLegend: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: "clamp(10px, 0.9vw, 12px)",
    color: "#475569",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    display: "inline-block",
    flexShrink: 0,
  },
  chartDateChip: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 8px",
    border: "1px solid #e8ecf2",
    borderRadius: 8,
    background: "#f8fafc",
    fontSize: "clamp(10px, 0.9vw, 12px)",
    color: "#475569",
    flexShrink: 0,
  },
  chartWrapper: {
    display: "flex",
    gap: 12,
    alignItems: "stretch",
    flexWrap: "wrap",
  },
  chartContainer: {
    flex: 1,
    minWidth: 0,
    width: "100%",
  },
  chartLegendBox: {
    width: "clamp(140px, 15vw, 165px)",
    flexShrink: 0,
    border: "1px solid #e8ecf2",
    borderRadius: 10,
    padding: "12px 14px",
    boxSizing: "border-box",
    background: "#fafcff",
    alignSelf: "flex-start",
  },
  legendBoxTitle: {
    fontWeight: 700,
    fontSize: "clamp(12px, 1vw, 14px)",
    color: "#0f172a",
    marginBottom: 8,
  },
  legendBoxRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  legendBoxDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },
  legendBoxLabel: {
    fontSize: "clamp(10px, 0.9vw, 12px)",
    color: "#64748b",
  },
  legendBoxValue: {
    fontSize: "clamp(10px, 0.9vw, 12px)",
    fontWeight: 600,
    color: "#0f172a",
    marginLeft: "auto",
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#fff",
    padding: "8px 12px",
    borderRadius: 10,
    marginBottom: 14,
    border: "1px solid #e8ecf2",
    flexWrap: "wrap",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  searchInput: {
    paddingLeft: 30,
    paddingRight: 30,
    paddingTop: 6,
    paddingBottom: 6,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: "clamp(12px, 1vw, 13px)",
    color: "#1e293b",
    background: "#f8fafc",
    outline: "none",
    width: "100%",
    minWidth: 140,
    boxSizing: "border-box",
    transition: "all 0.2s",
  },
  clearSearchBtn: {
    position: "absolute",
    right: 8,
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
  },
  toolDropWrap: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    padding: "4px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#f8fafc",
    position: "relative",
    flexShrink: 0,
  },
  toolDropLabel: {
    fontSize: "clamp(10px, 0.8vw, 13px)",
    color: "#475569",
    fontWeight: 500,
    flexShrink: 0,
  },
  toolDrop: {
    border: "none",
    background: "transparent",
    fontSize: "clamp(11px, 0.9vw, 13px)",
    color: "#1e293b",
    fontWeight: 600,
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    paddingRight: 2,
    maxWidth: 120,
  },
  toolActions: {
    marginLeft: "auto",
    display: "flex",
    gap: 5,
    alignItems: "center",
    flexWrap: "wrap",
  },
  btnAdd: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    padding: "6px 12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "clamp(11px, 0.9vw, 13px)",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
    whiteSpace: "nowrap",
  },
  btnExcel: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "5px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    fontSize: "clamp(10px, 0.8vw, 13px)",
    fontWeight: 500,
    color: "#16a34a",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  btnImport: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "5px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    fontSize: "clamp(10px, 0.8vw, 13px)",
    fontWeight: 500,
    color: "#2563eb",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  btnIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    transition: "all 0.2s",
    flexShrink: 0,
  },
  btnActiveSmall: {
    background: "#eff6ff",
    borderColor: "#2563eb",
    color: "#2563eb",
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
    width: "240px",
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
    padding: "4px 10px",
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
    transition: "background 0.2s",
  },
  columnCheckbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },

  contentRow: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    flexWrap: "nowrap",
    width: "100%",
  },
  tableWrapper: {
    flex: 1,
    minWidth: 0,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8ecf2",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  tableContainer: {
    overflowX: "auto",
    overflowY: "auto",
    flex: 1,
    minHeight: "400px",
    maxHeight: "calc(100vh - 327px)",
    position: "relative",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "clamp(11px, 1vw, 13px)",
    minWidth: 700,
  },
  th: {
    padding: "10px 10px",
    background: "#f8fafc",
    borderBottom: "1px solid #e8ecf2",
    textAlign: "left",
    fontWeight: 600,
    color: "#475569",
    fontSize: "clamp(10px, 0.8vw, 12px)",
    whiteSpace: "nowrap",
    userSelect: "none",
    letterSpacing: "0.01em",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  td: {
    padding: "10px 10px",
    color: "#1e293b",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    fontSize: "clamp(11px, 0.9vw, 13px)",
  },
  link: { color: "#2563eb", textDecoration: "none", fontWeight: 500 },
  badge: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 20,
    fontSize: "clamp(10px, 0.8vw, 12px)",
    fontWeight: 600,
    lineHeight: 1.4,
  },
  actionGroup: {
    display: "flex",
    gap: 3,
    alignItems: "center",
  },
  iconAction: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    borderRadius: 6,
    background: "#f8fafc",
    textDecoration: "none",
    border: "none",
    transition: "all 0.15s",
    cursor: "pointer",
    flexShrink: 0,
  },

  pgBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderTop: "1px solid #f1f5f9",
    flexWrap: "wrap",
    gap: 8,
    flexShrink: 0,
  },
  pgBtn: {
    padding: "3px 9px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    background: "#fff",
    fontSize: "clamp(11px, 0.9vw, 13px)",
    color: "#475569",
    cursor: "pointer",
    minWidth: 28,
    transition: "all 0.15s",
  },
  pgBtnActive: { background: "#2563eb", color: "#fff", borderColor: "#2563eb" },
  pgSelectWrap: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: "clamp(11px, 0.9vw, 13px)",
    color: "#64748b",
  },
  pgSelect: {
    padding: "2px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: "clamp(11px, 0.9vw, 13px)",
    color: "#1e293b",
    background: "#fff",
    outline: "none",
  },

  detailPanel: {
    width: "clamp(180px, 20vw, 235px)",
    flexShrink: 0,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e8ecf2",
    padding: "14px 14px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    fontSize: "clamp(10px, 0.9vw, 12px)",
    position: "sticky",
    top: 20,
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
  },
  dpHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "1px solid #f1f5f9",
  },
  dpTitle: {
    fontWeight: 700,
    fontSize: "clamp(12px, 1vw, 14px)",
    color: "#0f172a",
  },
  dpClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    padding: 2,
    borderRadius: 4,
    transition: "all 0.15s",
  },
  dpRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "3px 0",
    gap: 6,
  },
  dpLabel: {
    color: "#64748b",
    fontSize: "clamp(10px, 0.8vw, 12px)",
    fontWeight: 500,
    flexShrink: 0,
  },
  dpVal: {
    color: "#0f172a",
    fontSize: "clamp(10px, 0.8vw, 12px)",
    textAlign: "right",
    wordBreak: "break-word",
    maxWidth: "clamp(80px, 10vw, 130px)",
  },
  dpDivider: { borderTop: "1px solid #f1f5f9", margin: "6px 0" },
  dpActions: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTop: "1px solid #f1f5f9",
  },
  dpEditBtn: {
    textAlign: "center",
    textDecoration: "none",
    display: "block",
    padding: "7px 0",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontSize: "clamp(11px, 0.9vw, 13px)",
    fontWeight: 600,
    transition: "all 0.2s",
  },
  dpDeleteBtn: {
    width: "100%",
    padding: "7px 0",
    borderRadius: 8,
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    fontWeight: 600,
    fontSize: "clamp(11px, 0.9vw, 13px)",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  btnPrimary: {
    padding: "8px 18px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontSize: "clamp(12px, 1vw, 13px)",
    fontWeight: 600,
    transition: "all 0.2s",
  },
};

const _ss = document.createElement("style");
_ss.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  tr:hover td { background: #f8fafc; }
  button:hover, .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  select:hover, input:hover { border-color: #94a3b8; }
  select:focus, input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; overflow: auto; }
  .column-checkbox-label:hover { background: #f1f5f9; }
  .reset-columns-btn:hover { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
  .table-container::-webkit-scrollbar { width: 8px; height: 8px; }
  .table-container::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
  .table-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .table-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .detail-panel::-webkit-scrollbar { width: 4px; }
  .detail-panel::-webkit-scrollbar-track { background: #f1f5f9; }
  .detail-panel::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
`;
document.head.appendChild(_ss);

export default CommissionList;