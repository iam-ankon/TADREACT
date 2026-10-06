// CommissionList.jsx — Commission dashboard (KPIs, monthly trend, records).
// Visual language matches the rest of the TAD redesign (sticky header,
// white cards, Inter, blue primary - see agentTheme.js); styles are scoped
// under .cm-app in COMMISSION_CSS at the bottom of this file.
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
import {
  FiShoppingBag,
  FiDollarSign,
  FiPercent,
  FiCreditCard,
  FiTrendingUp,
  FiTrendingDown,
  FiSearch,
  FiX,
  FiDownload,
  FiColumns,
  FiEdit2,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiInbox,
  FiAlertTriangle,
} from "react-icons/fi";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import Sidebar from "../merchandiser/Sidebar";
import {
  getOrders,
  getOrderStatsWithFilters,
  getCustomers,
  getCommissionStats,
  getDepartments,
  getSuppliers,
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

// Chart series colours: categorical slots 1-2 of the dataviz palette
// (validated pair). Marks only - text stays in text colours.
const SERIES = {
  est: { label: "Estimated", color: "#2a78d6" },
  act: { label: "Actual", color: "#eb6834" },
};

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

// $1.13B / $32.8M / $4.2K - compact money for KPIs and chart axis.
const compactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});
const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  return Number.isFinite(num) ? compactMoney.format(num) : "—";
};
const axisMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

// Full money for table cells: $27,059.60
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const firstPo = (po) => {
  if (!po) return "—";
  if (Array.isArray(po)) return po[0] || "—";
  if (typeof po === "string" && po.includes(",")) return po.split(",")[0].trim() || po;
  return po;
};

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const gap = row.act - row.est;
  return (
    <div className="cm-tooltip">
      <div className="cm-tooltip-title">{label}</div>
      {["est", "act"].map((k) => (
        <div key={k} className="cm-tooltip-row">
          <i className="cm-swatch" style={{ background: SERIES[k].color }} />
          {SERIES[k].label}
          <b>{formatCurrency(row[k])}</b>
        </div>
      ))}
      <div className="cm-tooltip-row cm-tooltip-foot">
        Variance <b>{`${gap < 0 ? "−" : "+"}${formatCurrency(Math.abs(gap))}`}</b>
      </div>
    </div>
  );
};

// Amount above each bar ($12.3K); empty months get no label.
const barLabel = (v) => (Number(v) ? axisMoney.format(v) : "");

const CommissionTrend = ({ data }) => (
  <ResponsiveContainer width="100%" height={280}>
    <ReBarChart data={data} margin={{ top: 22, right: 8, left: 4, bottom: 0 }} barCategoryGap="28%" barGap={2}>
      <CartesianGrid vertical={false} stroke="#eef1f5" />
      <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e6eaf0" }} tickLine={false} />
      <YAxis
        tickFormatter={(v) => axisMoney.format(v)}
        tick={{ fontSize: 12, fill: "#64748b" }}
        axisLine={false}
        tickLine={false}
        width={64}
      />
      <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
      <Bar dataKey="est" fill={SERIES.est.color} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false}>
        <LabelList dataKey="est" position="top" formatter={barLabel} style={{ fontSize: 10.5, fontWeight: 600, fill: SERIES.est.color, stroke: "#fff", strokeWidth: 3, paintOrder: "stroke" }} />
      </Bar>
      <Bar dataKey="act" fill={SERIES.act.color} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false}>
        <LabelList dataKey="act" position="top" formatter={barLabel} style={{ fontSize: 10.5, fontWeight: 600, fill: SERIES.act.color, stroke: "#fff", strokeWidth: 3, paintOrder: "stroke" }} />
      </Bar>
    </ReBarChart>
  </ResponsiveContainer>
);

const STATUS_CLASS = {
  Running: "blue",
  Active: "green",
  Received: "green",
  Shipped: "grey",
  Pending: "amber",
  Cancelled: "red",
};

const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const CommissionList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    const filters = { has_commission: "1" };

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
        const code = s.supplier_code || s.code || "";
        const display = code ? `${name} (${code})` : name;
        return (
          display === supplierFilter ||
          name === supplierFilter ||
          code === supplierFilter
        );
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

        const commissionOrders = response.data || [];

        setOrders(commissionOrders);
        setTotalItems(response.pagination?.count || 0);
        setTotalPages(response.pagination?.total_pages || 1);
        setCurrentPage(page);

      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    },
    [rowsPerPage, buildFilters],
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

  // KPI cards (money KPIs stripped for designations that must not see
  // pricing/commission values).
  const commissionRate = totalAllValue > 0 ? (totalEst / totalAllValue) * 100 : null;
  const collectedPct = totalEst > 0 ? (totalAct / totalEst) * 100 : null;
  const allKpis = [
    {
      key: "orders",
      label: "Orders",
      display: totalAllOrders.toLocaleString("en-US"),
      foot: `${totalOrdersWithCommission.toLocaleString("en-US")} with commission`,
      icon: <FiShoppingBag />,
      tint: ["#eef4ff", "#2563eb"],
    },
    {
      key: "value",
      money: true,
      label: "Order value",
      display: formatValue(totalAllValue),
      foot: formatCurrency(totalAllValue),
      icon: <FiDollarSign />,
      tint: ["#ecfdf5", "#047857"],
    },
    {
      key: "est",
      money: true,
      label: "Estimated commission",
      display: formatValue(totalEst),
      foot: commissionRate === null ? "—" : `${commissionRate.toFixed(2)}% of order value`,
      icon: <FiPercent />,
      tint: ["#eef4ff", SERIES.est.color],
    },
    {
      key: "act",
      money: true,
      label: "Actual commission",
      display: formatValue(totalAct),
      foot: collectedPct === null ? "No estimate to compare" : `${collectedPct.toFixed(1)}% of estimate received`,
      icon: <FiCreditCard />,
      tint: ["#fff4ed", SERIES.act.color],
      meter: collectedPct,
    },
    {
      key: "variance",
      money: true,
      label: "Variance",
      display: `${variance < 0 ? "−" : variance > 0 ? "+" : ""}${formatValue(Math.abs(variance))}`,
      foot: variance < 0 ? "Actual below estimate" : variance > 0 ? "Actual above estimate" : "On estimate",
      icon: variance < 0 ? <FiTrendingDown /> : <FiTrendingUp />,
      tint: variance < 0 ? ["#fef2f2", "#b91c1c"] : ["#f0fdf4", "#15803d"],
      tone: variance < 0 ? "neg" : variance > 0 ? "pos" : "",
    },
  ];
  const kpis = canViewOrderPricing() ? allKpis : allKpis.filter((k) => !k.money);

  const filtersOn =
    !!searchInputValue ||
    [supplierFilter, customerFilter, departmentFilter, statusFilter].some((f) => f && f !== "All") ||
    !!selectedMonth ||
    !!selectedYear;
  const clearFilters = () => {
    setSearchInputValue("");
    setSupplierFilter("All");
    setCustomerFilter("All");
    setDepartmentFilter("All");
    setStatusFilter("All");
    setSelectedMonth("");
    setSelectedYear("");
    setCurrentPage(1);
  };

  // Plain-text value of a cell, shared by the table and the CSV export.
  const cellText = (order, columnKey) => {
    switch (columnKey) {
      case "order_no":
        return getOrderNo(order);
      case "po_no":
        return firstPo(order.po_no);
      case "customer":
        return getCustomerName(order);
      case "department":
        return getDepartmentName(order);
      case "supplier":
        return getSupplierName(order);
      case "quantity":
        return order.total_qty ? Number(order.total_qty).toLocaleString("en-US") : "—";
      case "unit_price":
        return order.unit_price ? `$${Number(order.unit_price).toFixed(2)}` : "—";
      case "total_value":
        return formatCurrency(order.total_value);
      case "estimated_commission":
        return formatCurrency(order.estimated_commission);
      case "actual_commission":
        return formatCurrency(order.actual_commission);
      case "variance": {
        const v =
          order.estimated_commission && order.actual_commission
            ? Number(order.actual_commission) - Number(order.estimated_commission)
            : null;
        return v === null ? "—" : `${v < 0 ? "−" : "+"}${formatCurrency(Math.abs(v))}`;
      }
      case "status":
        return order.status || "—";
      default:
        return "—";
    }
  };

  // Render cell content
  const renderCell = (order, columnKey) => {
    switch (columnKey) {
      case "order_no":
        return (
          <Link to={`/commissions/${order.id}`} className="cm-order-link" onClick={(e) => e.stopPropagation()}>
            {getOrderNo(order)}
          </Link>
        );
      case "variance": {
        const text = cellText(order, columnKey);
        if (text === "—") return <span className="cm-faint">—</span>;
        return <span className={text.startsWith("−") ? "cm-neg" : "cm-pos"}>{text}</span>;
      }
      case "actual_commission":
      case "estimated_commission":
      case "total_value":
      case "unit_price": {
        const text = cellText(order, columnKey);
        return text === "—" ? <span className="cm-faint">—</span> : text;
      }
      case "status":
        return <span className={`cm-status ${STATUS_CLASS[order.status] || "grey"}`}>{order.status || "—"}</span>;
      case "actions":
        return (
          <div className="cm-row-actions" onClick={(e) => e.stopPropagation()}>
            <Link to={`/commissions/${order.id}`} className="cm-icon-btn" title="View">
              <FiEye />
            </Link>
            {canViewOrderPricing() && (
              <Link to={`/commissions/edit/${order.id}`} className="cm-icon-btn" title="Edit commission">
                <FiEdit2 />
              </Link>
            )}
          </div>
        );
      default:
        return cellText(order, columnKey);
    }
  };

  // Export every record matching the current filters (all pages, visible
  // columns) as CSV.
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const filters = buildFilters();
      const pageSize = 500;
      let page = 1;
      let rows = [];
      for (;;) {
        const res = await getOrders(page, pageSize, { filters });
        rows = rows.concat(res.data || []);
        if (!res.pagination?.next || (res.data || []).length < pageSize || page >= 100) break;
        page += 1;
      }
      const cols = orderedVisibleColumns.filter((c) => c.key !== "actions");
      const lines = [cols.map((c) => csvCell(c.label)).join(",")];
      rows.forEach((o) => {
        lines.push(cols.map((c) => {
          const t = cellText(o, c.key);
          return csvCell(t === "—" ? "" : t);
        }).join(","));
      });
      const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `commissions_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed:", e);
      window.alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      fetchOrders(page);
    }
  };

  // Escape closes the summary drawer.
  useEffect(() => {
    if (!selectedOrder) return undefined;
    const onKey = (e) => e.key === "Escape" && setSelectedOrder(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedOrder]);

  const pageNumbers = (() => {
    const pages = [];
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    for (let p = start; p <= Math.min(totalPages, start + 4); p++) pages.push(p);
    return pages;
  })();

  const filterSelect = (id, label, value, onChange, options) => (
    <div className="cm-field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCurrentPage(1);
        }}
      >
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );

  if (error)
    return (
      <div className="cm-shell">
        <style>{COMMISSION_CSS}</style>
        <Sidebar />
        <div className="cm-app">
          <div className="cm-error">
            <FiAlertTriangle />
            <h2>Couldn't load commission data</h2>
            <p>{error}</p>
            <button type="button" className="cm-btn primary" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );

  const firstRow = orders.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const lastRow = Math.min(currentPage * rowsPerPage, totalItems);

  return (
    <div className="cm-shell">
      <style>{COMMISSION_CSS}</style>
      <Sidebar />
      <div className="cm-app">
        <header className="cm-header">
          <div>
            <div className="cm-eyebrow">Merchandising · Reports</div>
            <h1 className="cm-title">Commissions</h1>
            <p className="cm-subtitle">Estimated vs. actual commission across orders, by shipment month.</p>
          </div>
          <div className="cm-actions">
            <button type="button" className="cm-btn ghost" onClick={handleExport} disabled={exporting || totalItems === 0}>
              <FiDownload /> {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </header>

        <div className="cm-body">
          {/* ── Filters ── */}
          <section className="cm-card cm-filters">
            <div className="cm-search">
              <FiSearch />
              <input
                type="text"
                placeholder="Search order no. or PO no."
                value={searchInputValue}
                onChange={(e) => {
                  setSearchInputValue(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Search orders"
              />
              {searchInputValue && (
                <button type="button" className="clear" onClick={() => setSearchInputValue("")} aria-label="Clear search">
                  <FiX />
                </button>
              )}
            </div>
            {filterSelect("cm-customer", "Customer", customerFilter, setCustomerFilter, [
              ["All", "All customers"],
              ...customerOptions.map((c) => {
                const name = c.customer_name || c.display_name || c.name || `Customer ${c.id}`;
                return [name, name];
              }),
            ])}
            {filterSelect("cm-supplier", "Supplier", supplierFilter, setSupplierFilter, [
              ["All", "All suppliers"],
              ...supplierOptions.map((s) => {
                const name = s.supplier_name || s.name || s.display_name || `Supplier ${s.id}`;
                const code = s.supplier_code || s.code || "";
                const display = code ? `${name} (${code})` : name;
                return [display, display];
              }),
            ])}
            {filterSelect("cm-dept", "Department", departmentFilter, setDepartmentFilter,
              departmentOptions.map((d) => [d, d === "All" ? "All departments" : d]))}
            {filterSelect("cm-month", "Ship month", selectedMonth || "All", (v) => setSelectedMonth(v === "All" ? "" : v),
              availableMonths.map((m) => [m, m === "All" ? "All months" : m]))}
            {filterSelect("cm-year", "Ship year", selectedYear || "All", (v) => setSelectedYear(v === "All" ? "" : v),
              availableYears.map((y) => [y, y === "All" ? "All years" : y]))}
            {filterSelect("cm-status", "Status", statusFilter, setStatusFilter,
              ["All", "Running", "Active", "Shipped", "Pending", "Cancelled"].map((s) => [s, s === "All" ? "All statuses" : s]))}
            {filtersOn && (
              <button type="button" className="cm-btn ghost cm-clear" onClick={clearFilters}>
                <FiX /> Clear
              </button>
            )}
          </section>

          {/* ── KPIs ── */}
          <div className="cm-kpis">
            {kpis.map((k) => (
              <div key={k.key} className="cm-card cm-kpi">
                <div className="cm-kpi-top">
                  <span className="cm-kpi-label">{k.label}</span>
                  <span className="cm-kpi-icon" style={{ background: k.tint[0], color: k.tint[1] }}>
                    {k.icon}
                  </span>
                </div>
                <div className={`cm-kpi-value ${k.tone || ""}`}>
                  {loadingCommission && k.key !== "orders" ? <span className="cm-skel" style={{ width: 90, height: 26 }} /> : k.display}
                </div>
                {k.meter !== undefined && k.meter !== null && (
                  <div className="cm-meter">
                    <span style={{ width: `${Math.min(100, k.meter)}%`, background: SERIES.act.color }} />
                  </div>
                )}
                <div className="cm-kpi-foot">{k.foot}</div>
              </div>
            ))}
          </div>

          {/* ── Trend (money - hidden where pricing is restricted) ── */}
          {canViewOrderPricing() && (
            <section className="cm-card">
              <div className="cm-card-head">
                <div>
                  <h2 className="cm-card-title">Monthly commission</h2>
                  <p className="cm-card-sub">Last 12 shipment months with commission · hover a month for exact figures</p>
                </div>
                <div className="cm-legend">
                  {["est", "act"].map((k) => (
                    <span key={k}>
                      <i className="cm-swatch" style={{ background: SERIES[k].color }} />
                      {SERIES[k].label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="cm-card-body">
                {loadingCommission && chartData.length === 0 ? (
                  <span className="cm-skel" style={{ display: "block", height: 280 }} />
                ) : chartData.length === 0 ? (
                  <div className="cm-empty">
                    <FiInbox />
                    <b>No commission in this selection</b>
                    <span>Try a different filter.</span>
                  </div>
                ) : (
                  <CommissionTrend data={chartData} />
                )}
              </div>
            </section>
          )}

          {/* ── Records ── */}
          <section className="cm-card cm-records">
            <div className="cm-card-head">
              <div>
                <h2 className="cm-card-title">
                  Commission records <span className="cm-count">{totalItems.toLocaleString("en-US")}</span>
                </h2>
                <p className="cm-card-sub">Click a row for a quick summary</p>
              </div>
              <div className="cm-colpick" ref={columnSelectorRef}>
                <button
                  type="button"
                  className={`cm-btn ghost sm ${showColumnSelector ? "on" : ""}`}
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                >
                  <FiColumns /> Columns
                </button>
                {showColumnSelector && (
                  <div className="cm-colpick-menu">
                    <div className="cm-colpick-head">
                      <span>Show columns</span>
                      <button type="button" className="cm-link" onClick={resetColumns}>
                        Reset
                      </button>
                    </div>
                    {selectableColumns.map((column) => (
                      <label key={column.key}>
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(column.key)}
                          onChange={() => toggleColumn(column.key)}
                        />
                        {column.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="cm-table-wrap">
              <table className="cm-table">
                <thead>
                  <tr>
                    {orderedVisibleColumns.map((column) => (
                      <th key={column.key} className={column.align === "right" ? "num" : ""}>
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={loading ? "is-loading" : ""}>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={orderedVisibleColumns.length}>
                        <div className="cm-empty">
                          <FiInbox />
                          <b>{loading ? "Loading records…" : "No commission records found"}</b>
                          {!loading && filtersOn && (
                            <button type="button" className="cm-link" onClick={clearFilters}>
                              Clear filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr
                        key={order.id}
                        className={selectedOrder?.id === order.id ? "selected" : ""}
                        onClick={() => setSelectedOrder(order)}
                      >
                        {orderedVisibleColumns.map((column) => (
                          <td key={column.key} className={column.align === "right" ? "num" : ""}>
                            {renderCell(order, column.key)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="cm-pager">
              <span className="cm-note">
                {firstRow.toLocaleString("en-US")}–{lastRow.toLocaleString("en-US")} of {totalItems.toLocaleString("en-US")}
              </span>
              <div className="cm-pages">
                <button
                  type="button"
                  className="cm-page"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Previous page"
                >
                  <FiChevronLeft />
                </button>
                {pageNumbers[0] > 1 && (
                  <>
                    <button type="button" className="cm-page" onClick={() => handlePageChange(1)}>1</button>
                    {pageNumbers[0] > 2 && <span className="cm-ellipsis">…</span>}
                  </>
                )}
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`cm-page ${currentPage === p ? "active" : ""}`}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                ))}
                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="cm-ellipsis">…</span>}
                    <button type="button" className="cm-page" onClick={() => handlePageChange(totalPages)}>
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="cm-page"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Next page"
                >
                  <FiChevronRight />
                </button>
              </div>
              <label className="cm-rows">
                Rows
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        </div>
      </div>

      {/* ── Quick summary drawer ── */}
      {selectedOrder && (
        <>
          <div className="cm-scrim" onClick={() => setSelectedOrder(null)} />
          <aside className="cm-drawer" role="dialog" aria-label="Order summary">
            <div className="cm-drawer-head">
              <div>
                <div className="cm-eyebrow">Order</div>
                <div className="cm-drawer-title">{getOrderNo(selectedOrder)}</div>
              </div>
              <button type="button" className="cm-icon-btn" onClick={() => setSelectedOrder(null)} aria-label="Close">
                <FiX />
              </button>
            </div>
            <div className="cm-drawer-body">
              <dl className="cm-dl">
                <dt>PO No.</dt>
                <dd>{firstPo(selectedOrder.po_no)}</dd>
                <dt>Customer</dt>
                <dd>{getCustomerName(selectedOrder)}</dd>
                <dt>Department</dt>
                <dd>{getDepartmentName(selectedOrder)}</dd>
                <dt>Supplier</dt>
                <dd>{getSupplierName(selectedOrder)}</dd>
                <dt>Status</dt>
                <dd>
                  <span className={`cm-status ${STATUS_CLASS[selectedOrder.status] || "grey"}`}>
                    {selectedOrder.status || "—"}
                  </span>
                </dd>
              </dl>
              <div className="cm-drawer-section">Quantity & value</div>
              <dl className="cm-dl">
                <dt>Quantity</dt>
                <dd>{cellText(selectedOrder, "quantity")}</dd>
                {canViewOrderPricing() && (
                  <>
                    <dt>Unit price</dt>
                    <dd>{cellText(selectedOrder, "unit_price")}</dd>
                    <dt>Order value</dt>
                    <dd>{cellText(selectedOrder, "total_value")}</dd>
                  </>
                )}
              </dl>
              {canViewOrderPricing() && (
                <>
                  <div className="cm-drawer-section">Commission</div>
                  <dl className="cm-dl">
                    <dt>Estimated</dt>
                    <dd>{cellText(selectedOrder, "estimated_commission")}</dd>
                    <dt>Actual</dt>
                    <dd>{cellText(selectedOrder, "actual_commission")}</dd>
                    <dt>Variance</dt>
                    <dd>{renderCell(selectedOrder, "variance")}</dd>
                    <dt>Received on</dt>
                    <dd>{fmtDate(selectedOrder.commission_rec_date)}</dd>
                  </dl>
                </>
              )}
              {selectedOrder.remarks && (
                <>
                  <div className="cm-drawer-section">Remarks</div>
                  <p className="cm-remarks">{selectedOrder.remarks}</p>
                </>
              )}
            </div>
            <div className="cm-drawer-foot">
              <Link to={`/commissions/${selectedOrder.id}`} className="cm-btn ghost">
                <FiEye /> Full details
              </Link>
              {canViewOrderPricing() && (
                <Link to={`/commissions/edit/${selectedOrder.id}`} className="cm-btn primary">
                  <FiEdit2 /> Edit commission
                </Link>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

const COMMISSION_CSS = `
.cm-shell { display: flex; height: 100vh; overflow: hidden; background: #f3f5f9; width: 100%; }
.cm-app {
  --c-bg: #f3f5f9; --c-surface: #fff; --c-soft: #f8fafc; --c-border: #e6eaf0; --c-border-strong: #d5dbe4;
  --c-text: #0f172a; --c-text-2: #334155; --c-muted: #64748b; --c-faint: #94a3b8;
  --c-primary: #2563eb; --c-primary-dark: #1d4ed8; --c-primary-soft: #eef4ff;
  --c-green: #15803d; --c-red: #b91c1c;
  flex: 1; min-width: 0; height: 100vh; overflow-y: auto; background: var(--c-bg); color: var(--c-text);
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; font-size: 14px;
}
.cm-app *, .cm-app *::before, .cm-app *::after, .cm-drawer, .cm-drawer * { box-sizing: border-box; }
.cm-app button:focus-visible, .cm-app a:focus-visible, .cm-app select:focus-visible, .cm-app input:focus-visible,
.cm-drawer a:focus-visible, .cm-drawer button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }

.cm-header {
  position: sticky; top: 0; z-index: 20; display: flex; align-items: flex-end; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; padding: 18px 28px 16px; background: rgba(255,255,255,.94);
  backdrop-filter: blur(8px); border-bottom: 1px solid var(--c-border);
}
.cm-eyebrow { font-size: 11.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #2563eb; margin-bottom: 4px; }
.cm-title { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
.cm-subtitle { margin: 4px 0 0; color: var(--c-muted); font-size: 13.5px; }
.cm-actions { display: flex; gap: 8px; }
.cm-body { padding: 22px 28px 36px; display: flex; flex-direction: column; gap: 18px; }

.cm-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 38px; padding: 0 15px;
  border-radius: 10px; font: inherit; font-family: "Inter", "Segoe UI", system-ui, sans-serif; font-size: 13.5px; font-weight: 600;
  cursor: pointer; white-space: nowrap; border: 1px solid transparent; text-decoration: none; transition: background .15s, border-color .15s;
}
.cm-btn:disabled { opacity: .55; cursor: not-allowed; }
.cm-btn.primary { background: #2563eb; color: #fff; box-shadow: 0 1px 2px rgba(37,99,235,.25); }
.cm-btn.primary:hover { background: #1d4ed8; }
.cm-btn.ghost { background: #fff; color: #334155; border-color: #d5dbe4; }
.cm-btn.ghost:hover:not(:disabled), .cm-btn.ghost.on { background: #f8fafc; border-color: #c7d2e0; }
.cm-btn.sm { height: 32px; padding: 0 12px; font-size: 12.5px; border-radius: 8px; }
.cm-link { border: none; background: none; padding: 0; font: inherit; font-size: 12.5px; font-weight: 600; color: #2563eb; cursor: pointer; }
.cm-icon-btn {
  width: 30px; height: 30px; display: inline-grid; place-items: center; border-radius: 8px; flex-shrink: 0;
  border: 1px solid var(--c-border, #e6eaf0); background: #fff; color: #64748b; cursor: pointer; text-decoration: none; transition: all .15s;
}
.cm-icon-btn:hover { color: #2563eb; border-color: #c7d7fe; background: #eef4ff; }

.cm-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); min-width: 0; }
.cm-card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; border-bottom: 1px solid var(--c-border); flex-wrap: wrap; }
.cm-card-title { margin: 0; font-size: 14.5px; font-weight: 650; display: flex; align-items: center; gap: 8px; }
.cm-card-sub { margin: 2px 0 0; font-size: 12.5px; color: var(--c-muted); }
.cm-card-body { padding: 16px 18px; }
.cm-count { font-size: 12px; font-weight: 600; color: #1d4ed8; background: #eef4ff; border: 1px solid #dbe6fe; border-radius: 999px; padding: 1px 9px; }

.cm-filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; padding: 14px 18px; }
.cm-search { position: relative; flex: 1 1 240px; max-width: 320px; align-self: flex-end; }
.cm-search input { width: 100%; height: 38px; padding: 0 32px 0 36px; border: 1px solid var(--c-border-strong); border-radius: 10px; font: inherit; font-size: 13.5px; color: var(--c-text); outline: none; background: #fff; }
.cm-search input:focus, .cm-field select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.cm-search > svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--c-faint); }
.cm-search .clear { position: absolute; right: 7px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; display: grid; place-items: center; border: none; border-radius: 6px; background: var(--c-soft); color: var(--c-muted); cursor: pointer; }
.cm-field { display: flex; flex-direction: column; gap: 5px; flex: 1 1 150px; min-width: 140px; max-width: 220px; }
.cm-field label { font-size: 11px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: var(--c-muted); }
.cm-field select { height: 38px; padding: 0 10px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: #fff; font: inherit; font-size: 13.5px; color: var(--c-text); outline: none; text-overflow: ellipsis; }
.cm-clear { align-self: flex-end; }

.cm-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
.cm-kpi { padding: 16px 18px; display: flex; flex-direction: column; gap: 9px; }
.cm-kpi-top { display: flex; align-items: center; justify-content: space-between; }
.cm-kpi-label { font-size: 12.5px; font-weight: 600; color: var(--c-muted); }
.cm-kpi-icon { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; font-size: 16px; }
.cm-kpi-value { font-size: 26px; font-weight: 700; letter-spacing: -.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }
.cm-kpi-value.neg { color: var(--c-red); }
.cm-kpi-value.pos { color: var(--c-green); }
.cm-kpi-foot { font-size: 12.5px; color: var(--c-muted); }
.cm-meter { height: 6px; border-radius: 999px; background: #eef1f5; overflow: hidden; }
.cm-meter > span { display: block; height: 100%; border-radius: 999px; }

.cm-legend { display: flex; gap: 16px; font-size: 12.5px; color: var(--c-text-2); }
.cm-legend span { display: inline-flex; align-items: center; gap: 6px; }
.cm-swatch { width: 10px; height: 10px; border-radius: 3px; display: inline-block; flex-shrink: 0; }
.cm-tooltip { background: #fff; border: 1px solid #e6eaf0; border-radius: 10px; padding: 10px 12px; box-shadow: 0 10px 24px -10px rgba(15,23,42,.3); font-size: 12.5px; min-width: 200px; font-family: "Inter", "Segoe UI", system-ui, sans-serif; }
.cm-tooltip-title { font-weight: 650; margin-bottom: 6px; color: #0f172a; }
.cm-tooltip-row { display: flex; align-items: center; gap: 8px; color: #334155; padding: 1px 0; }
.cm-tooltip-row b { margin-left: auto; font-variant-numeric: tabular-nums; color: #0f172a; }
.cm-tooltip-foot { border-top: 1px solid #e6eaf0; margin-top: 4px; padding-top: 5px; }

.cm-records { overflow: visible; }
.cm-colpick { position: relative; }
.cm-colpick-menu { position: absolute; right: 0; top: calc(100% + 6px); z-index: 30; width: 220px; background: #fff; border: 1px solid #e6eaf0; border-radius: 12px; box-shadow: 0 16px 32px -12px rgba(15,23,42,.3); padding: 6px; }
.cm-colpick-head { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px 8px; font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: #64748b; }
.cm-colpick-menu label { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; font-size: 13px; color: #334155; cursor: pointer; }
.cm-colpick-menu label:hover { background: #f8fafc; }

.cm-table-wrap { overflow-x: auto; }
.cm-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.cm-table th { padding: 10px 14px; text-align: left; white-space: nowrap; background: var(--c-soft); border-bottom: 1px solid var(--c-border); font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--c-muted); }
.cm-table td { padding: 11px 14px; border-bottom: 1px solid var(--c-border); color: var(--c-text-2); font-size: 13.5px; vertical-align: middle; white-space: nowrap; max-width: 260px; overflow: hidden; text-overflow: ellipsis; }
.cm-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.cm-table tbody tr { cursor: pointer; transition: background .12s; }
.cm-table tbody tr:hover td { background: #f8fafd; }
.cm-table tbody tr.selected td { background: #eef4ff; }
.cm-table tbody.is-loading { opacity: .55; }
.cm-order-link { color: #2563eb; font-weight: 600; text-decoration: none; }
.cm-order-link:hover { text-decoration: underline; }
.cm-faint { color: var(--c-faint); }
.cm-neg { color: var(--c-red); font-weight: 600; }
.cm-pos { color: var(--c-green); font-weight: 600; }
.cm-row-actions { display: flex; gap: 6px; }
.cm-status { display: inline-block; font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 999px; border: 1px solid; }
.cm-status.blue { color: #1d4ed8; background: #eef4ff; border-color: #dbe6fe; }
.cm-status.green { color: #15803d; background: #f0fdf4; border-color: #bbf7d0; }
.cm-status.amber { color: #a16207; background: #fefce8; border-color: #fde68a; }
.cm-status.red { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
.cm-status.grey { color: #475569; background: #f8fafc; border-color: #e6eaf0; }

.cm-pager { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 12px 18px; border-top: 1px solid var(--c-border); }
.cm-note { font-size: 12.5px; color: var(--c-muted); font-variant-numeric: tabular-nums; }
.cm-pages { display: flex; align-items: center; gap: 4px; }
.cm-page { min-width: 32px; height: 32px; padding: 0 8px; display: inline-grid; place-items: center; border: 1px solid var(--c-border); border-radius: 8px; background: #fff; color: var(--c-text-2); font: inherit; font-size: 13px; font-weight: 550; cursor: pointer; }
.cm-page:hover:not(:disabled) { border-color: #c7d7fe; color: #2563eb; }
.cm-page.active { background: #2563eb; border-color: #2563eb; color: #fff; }
.cm-page:disabled { opacity: .45; cursor: not-allowed; }
.cm-ellipsis { color: var(--c-faint); padding: 0 2px; }
.cm-rows { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--c-muted); }
.cm-rows select { height: 32px; padding: 0 8px; border: 1px solid var(--c-border-strong); border-radius: 8px; background: #fff; font: inherit; font-size: 13px; }

.cm-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px 20px; color: var(--c-muted); font-size: 13.5px; text-align: center; white-space: normal; }
.cm-empty svg { font-size: 26px; color: var(--c-faint); }
.cm-empty b { color: var(--c-text-2); }
.cm-skel { display: inline-block; border-radius: 8px; background: linear-gradient(90deg, #eef1f5 25%, #f6f8fa 50%, #eef1f5 75%); background-size: 200% 100%; animation: cm-shimmer 1.2s infinite; }
@keyframes cm-shimmer { to { background-position: -200% 0; } }

.cm-error { max-width: 420px; margin: 18vh auto 0; text-align: center; background: #fff; border: 1px solid #e6eaf0; border-radius: 14px; padding: 36px 28px; }
.cm-error svg { font-size: 30px; color: #b91c1c; }
.cm-error h2 { margin: 10px 0 6px; font-size: 18px; }
.cm-error p { margin: 0 0 18px; color: #64748b; }

.cm-scrim { position: fixed; inset: 0; background: rgba(15,23,42,.18); z-index: 900; }
.cm-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; width: 380px; max-width: 92vw; z-index: 901; background: #fff;
  border-left: 1px solid #e6eaf0; box-shadow: -18px 0 40px -20px rgba(15,23,42,.35); display: flex; flex-direction: column;
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; font-size: 14px; color: #0f172a;
  animation: cm-slide .18s ease-out;
}
@keyframes cm-slide { from { transform: translateX(24px); opacity: 0; } }
.cm-drawer-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 18px 20px 14px; border-bottom: 1px solid #e6eaf0; }
.cm-drawer-title { font-size: 19px; font-weight: 700; letter-spacing: -.01em; }
.cm-drawer-body { flex: 1; overflow-y: auto; padding: 8px 20px 16px; }
.cm-drawer-section { margin: 16px 0 6px; font-size: 11.5px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: #64748b; }
.cm-dl { display: grid; grid-template-columns: 120px 1fr; gap: 8px 12px; margin: 10px 0 0; font-size: 13.5px; }
.cm-dl dt { color: #64748b; }
.cm-dl dd { margin: 0; color: #0f172a; font-weight: 500; text-align: right; font-variant-numeric: tabular-nums; word-break: break-word; }
.cm-remarks { margin: 6px 0 0; color: #334155; font-size: 13.5px; line-height: 1.5; white-space: pre-wrap; }
.cm-drawer-foot { display: flex; gap: 8px; justify-content: flex-end; padding: 14px 20px; border-top: 1px solid #e6eaf0; }
`;

export default CommissionList;
