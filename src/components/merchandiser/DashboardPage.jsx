// DashboardPage.jsx - Complete file with export (Updated with Order Data and Line Graphs)

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiUsers,
  FiPackage,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiBarChart2,
  FiBriefcase,
  FiAlertCircle,
  FiFilter,
  FiCalendar,
  FiDollarSign,
  FiActivity,
  FiArrowUp,
  FiArrowDown,
  FiMoreVertical,
  FiDownload,
  FiRefreshCw,
  FiPieChart,
  FiShoppingBag,
  FiTruck,
  FiTarget,
  FiAward,
  FiHome,
} from "react-icons/fi";
import Sidebar from "../merchandiser/Sidebar.jsx";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts";
import axios from "axios";

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "white",
          padding: "10px 14px",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: "#1e293b" }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, margin: "5px 0 0 0", fontSize: "13px" }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState({
    totalInquiries: 0,
    totalOrderQuantityAll: 0,
    totalOrderQuantityConfirmed: 0,
    totalOrderValueAll: 0,
    totalOrderValueConfirmed: 0,
    statusBreakdown: {
      pending: 0,
      quoted: 0,
      confirmed: 0,
    },
    garmentBreakdown: {
      woven: { total: 0, confirmed: 0, pending: 0, quoted: 0 },
      knit: { total: 0, confirmed: 0, pending: 0, quoted: 0 },
      sweater: { total: 0, confirmed: 0, pending: 0, quoted: 0 },
      underwear: { total: 0, confirmed: 0, pending: 0, quoted: 0 },
      all: { total: 0, confirmed: 0, pending: 0, quoted: 0 },
    },
    supplierStats: {
      total: 0,
      active: 0,
    },
    customerStats: {
      totalCustomers: 0,
      totalBuyers: 0,
    },
    recentInquiries: 0,
    orderStats: {
      totalOrders: 0,
      totalOrderValue: 0,
      totalOrderQuantity: 0,
      shippedValue: 0,
      shippedQuantity: 0,
      statusBreakdown: {
        running: 0,
        shipped: 0,
        pending: 0,
        cancelled: 0,
      },
      garmentBreakdown: {
        knit: { total: 0, quantity: 0, value: 0 },
        woven: { total: 0, quantity: 0, value: 0 },
        sweater: { total: 0, quantity: 0, value: 0 },
        underwear: { total: 0, quantity: 0, value: 0 },
      },
      recentOrders: 0,
    },
  });

  const [monthlyStats, setMonthlyStats] = useState({
    months: [],
    inquiryCounts: [],
    quantitiesAll: [],
    quantitiesConfirmed: [],
    valuesAll: [],
    valuesConfirmed: [],
  });

  const [orderMonthlyStats, setOrderMonthlyStats] = useState({
    months: [],
    orderCounts: [],
    orderQuantities: [],
    orderValues: [],
    shippedCounts: [],
    shippedQuantities: [],
    shippedValues: [],
  });

  const [supplierPerformance, setSupplierPerformance] = useState({
    suppliers: [],
    inquiryCounts: [],
    confirmedCounts: [],
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiError, setApiError] = useState(false);
  const [timeRange, setTimeRange] = useState("6months");
  const [selectedChart, setSelectedChart] = useState("quantity");
  const [selectedOrderChart, setSelectedOrderChart] = useState("orders");
  const [hoveredCard, setHoveredCard] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const initialYear = queryParams.get("year") || "all";
  const initialSeason = queryParams.get("season") || "all";
  const [filters, setFilters] = useState({
    year: initialYear,
    season: initialSeason,
  });

  const [availableYears, setAvailableYears] = useState([]);
  const [availableSeasons, setAvailableSeasons] = useState([]);

  const seasonOptions = [
    { value: "all", label: "All Seasons" },
    { value: "spring", label: "Spring" },
    { value: "summer", label: "Summer" },
    { value: "autumn", label: "Autumn" },
    { value: "winter", label: "Winter" },
  ];

  const timeRangeOptions = [
    { value: "3months", label: "Last 3 Months" },
    { value: "6months", label: "Last 6 Months" },
    { value: "12months", label: "Last 12 Months" },
    { value: "ytd", label: "Year to Date" },
  ];

  const API_BASE_URL = "http://119.148.51.38:8000/api/merchandiser/api";

  const fetchDashboardData = async (year = null, season = null) => {
    try {
      setLoading(true);
      setError(null);
      setApiError(false);

      let DASHBOARD_API_URL = `${API_BASE_URL}/dashboard/data/`;
      const params = new URLSearchParams();

      if (year && year !== "all") params.append("year", year);
      if (season && season !== "all") params.append("season", season);

      if (params.toString()) {
        DASHBOARD_API_URL += `?${params.toString()}`;
      }

      const response = await axios.get(DASHBOARD_API_URL);

      if (response.data && response.data.success) {
        const data = response.data.data || {};

        setDashboardData({
          totalInquiries: data.totalInquiries || 0,
          totalOrderQuantityAll: data.totalOrderQuantityAll || 0,
          totalOrderQuantityConfirmed: data.totalOrderQuantityConfirmed || 0,
          totalOrderValueAll: data.totalOrderValueAll || 0,
          totalOrderValueConfirmed: data.totalOrderValueConfirmed || 0,
          statusBreakdown: data.statusBreakdown || {
            pending: 0,
            quoted: 0,
            confirmed: 0,
          },
          garmentBreakdown: data.garmentBreakdown || {
            woven: { total: 0, confirmed: 0, pending: 0, quoted: 0 },
            knit: { total: 0, confirmed: 0, pending: 0, quoted: 0 },
            sweater: { total: 0, confirmed: 0, pending: 0, quoted: 0 },
            underwear: { total: 0, confirmed: 0, pending: 0, quoted: 0 },
            all: { total: 0, confirmed: 0, pending: 0, quoted: 0 },
          },
          recentInquiries: data.recentInquiries || 0,
          supplierStats: data.supplierStats || { total: 0, active: 0 },
          customerStats: data.customerStats || {
            totalCustomers: 0,
            totalBuyers: 0,
          },
          orderStats: data.orderStats || {
            totalOrders: 0,
            totalOrderValue: 0,
            totalOrderQuantity: 0,
            shippedValue: 0,
            shippedQuantity: 0,
            statusBreakdown: {
              running: 0,
              shipped: 0,
              pending: 0,
              cancelled: 0,
            },
            garmentBreakdown: {
              knit: { total: 0, quantity: 0, value: 0 },
              woven: { total: 0, quantity: 0, value: 0 },
              sweater: { total: 0, quantity: 0, value: 0 },
              underwear: { total: 0, quantity: 0, value: 0 },
            },
            recentOrders: 0,
          },
        });

        setMonthlyStats(
          data.monthlyStats || {
            months: [],
            inquiryCounts: [],
            quantitiesAll: [],
            quantitiesConfirmed: [],
            valuesAll: [],
            valuesConfirmed: [],
          }
        );

        setOrderMonthlyStats(
          data.orderMonthlyStats || {
            months: [],
            orderCounts: [],
            orderQuantities: [],
            orderValues: [],
            shippedCounts: [],
            shippedQuantities: [],
            shippedValues: [],
          }
        );

        setSupplierPerformance(
          data.supplierPerformance || {
            suppliers: [],
            inquiryCounts: [],
            confirmedCounts: [],
          }
        );

        setRecentActivity(data.recentActivity || []);
        setAvailableYears(data.availableYears || []);
        setAvailableSeasons(data.availableSeasons || []);
      } else {
        throw new Error("API returned error: " + (response.data?.error || "Unknown error"));
      }
    } catch (apiErr) {
      console.error("Error fetching dashboard data:", apiErr);
      setApiError(true);
      setError(apiErr.message);
      setDashboardData(getFallbackData());
      setMonthlyStats(getFallbackMonthlyStats());
      setOrderMonthlyStats(getFallbackOrderMonthlyStats());
      setSupplierPerformance(getFallbackSupplierPerformance());
      setRecentActivity(getFallbackRecentActivity());
      setAvailableYears(["2024", "2023", "2022"]);
      setAvailableSeasons(["spring", "summer", "autumn", "winter"]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);

    const queryParams = new URLSearchParams();
    if (newFilters.year !== "all") queryParams.set("year", newFilters.year);
    if (newFilters.season !== "all") queryParams.set("season", newFilters.season);

    navigate(`${location.pathname}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`, { replace: true });
    fetchDashboardData(newFilters.year, newFilters.season);
  };

  useEffect(() => {
    fetchDashboardData(filters.year, filters.season);
  }, []);

  const getFallbackData = () => ({
    totalInquiries: 156,
    totalOrderQuantityAll: 45280,
    totalOrderQuantityConfirmed: 32000,
    totalOrderValueAll: 679200,
    totalOrderValueConfirmed: 480000,
    statusBreakdown: { pending: 50, quoted: 35, confirmed: 71 },
    garmentBreakdown: {
      woven: { total: 42, confirmed: 28, pending: 14, quoted: 0 },
      knit: { total: 67, confirmed: 45, pending: 22, quoted: 0 },
      sweater: { total: 25, confirmed: 18, pending: 7, quoted: 0 },
      underwear: { total: 22, confirmed: 15, pending: 7, quoted: 0 },
      all: { total: 156, confirmed: 106, pending: 50, quoted: 0 },
    },
    supplierStats: { total: 45, active: 38 },
    customerStats: { totalCustomers: 28, totalBuyers: 15 },
    recentInquiries: 23,
    orderStats: {
      totalOrders: 89,
      totalOrderValue: 1250000,
      totalOrderQuantity: 125000,
      shippedValue: 450000,
      shippedQuantity: 45000,
      statusBreakdown: {
        running: 45,
        shipped: 32,
        pending: 12,
        cancelled: 0,
      },
      garmentBreakdown: {
        knit: { total: 35, quantity: 52000, value: 520000 },
        woven: { total: 28, quantity: 38000, value: 380000 },
        sweater: { total: 18, quantity: 25000, value: 250000 },
        underwear: { total: 8, quantity: 10000, value: 100000 },
      },
      recentOrders: 12,
    },
  });

  const getFallbackMonthlyStats = () => ({
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    inquiryCounts: [45, 52, 48, 60, 55, 65, 70, 68, 72, 80, 75, 85],
    quantitiesAll: [45000, 52000, 48000, 75000, 68000, 92000, 88000, 95000, 102000, 110000, 105000, 115000],
    quantitiesConfirmed: [32000, 45000, 38000, 60000, 52000, 78000, 72000, 80000, 85000, 92000, 88000, 95000],
    valuesAll: [450000, 520000, 480000, 750000, 680000, 920000, 880000, 950000, 1020000, 1100000, 1050000, 1150000],
    valuesConfirmed: [320000, 450000, 380000, 600000, 520000, 780000, 720000, 800000, 850000, 920000, 880000, 950000],
  });

  const getFallbackOrderMonthlyStats = () => ({
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    orderCounts: [12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40],
    orderQuantities: [12000, 15000, 18000, 20000, 22000, 25000, 28000, 30000, 32000, 35000, 38000, 40000],
    orderValues: [120000, 150000, 180000, 200000, 220000, 250000, 280000, 300000, 320000, 350000, 380000, 400000],
    shippedCounts: [8, 10, 12, 14, 15, 18, 20, 22, 24, 26, 28, 30],
    shippedQuantities: [8000, 10000, 12000, 14000, 15000, 18000, 20000, 22000, 24000, 26000, 28000, 30000],
    shippedValues: [80000, 100000, 120000, 140000, 150000, 180000, 200000, 220000, 240000, 260000, 280000, 300000],
  });

  const getFallbackSupplierPerformance = () => ({
    suppliers: ["Supplier A", "Supplier B", "Supplier C", "Supplier D", "Supplier E"],
    inquiryCounts: [45, 38, 32, 28, 25],
    confirmedCounts: [35, 30, 25, 22, 20],
  });

  const getFallbackRecentActivity = () => [
    { id: 1, type: "inquiry", title: "INQ-001", description: "Cotton T-Shirts", status: "pending", date: "2024-01-15", garment_type: "knit" },
    { id: 2, type: "order", title: "PO-001", description: "Denim Jackets - Qty: 5000", status: "Running", date: "2024-01-14", garment_type: "woven" },
    { id: 3, type: "inquiry", title: "INQ-003", description: "Wool Sweaters", status: "quoted", date: "2024-01-13", garment_type: "sweater" },
    { id: 4, type: "order", title: "PO-002", description: "Cotton Shirts - Qty: 8000", status: "Shipped", date: "2024-01-12", garment_type: "knit" },
  ];

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const inquiryStats = [
    {
      title: "Total Inquiries",
      value: dashboardData.totalInquiries,
      icon: <FiPackage size={24} />,
      link: "/inquiries",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      change: "+12.5%",
      changeType: "increase",
      description: "vs last month",
    },
    {
      title: "Total Quantity",
      value: dashboardData.totalOrderQuantityAll.toLocaleString(),
      icon: <FiTrendingUp size={24} />,
      link: "/inquiries",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      change: "+8.2%",
      changeType: "increase",
      description: "vs last month",
    },
    {
      title: "Confirmed Quantity",
      value: dashboardData.totalOrderQuantityConfirmed.toLocaleString(),
      icon: <FiCheckCircle size={24} />,
      link: "/inquiries?status=confirmed",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      change: "+15.3%",
      changeType: "increase",
      description: "vs last month",
    },
    {
      title: "Order Value",
      value: dashboardData.totalOrderValueConfirmed ? `$${(dashboardData.totalOrderValueConfirmed / 1000).toFixed(1)}K` : "N/A",
      icon: <FiDollarSign size={24} />,
      link: "/inquiries?status=confirmed",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      change: "+5.7%",
      changeType: "increase",
      description: "vs last month",
    },
  ];

  const orderStats = [
    {
      title: "Total Orders",
      value: dashboardData.orderStats?.totalOrders || 0,
      icon: <FiShoppingBag size={24} />,
      link: "/orders",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      change: "+10.2%",
      changeType: "increase",
      description: "vs last month",
    },
    {
      title: "Order Value",
      value: dashboardData.orderStats?.totalOrderValue ? `$${(dashboardData.orderStats.totalOrderValue / 1000).toFixed(1)}K` : "$0K",
      icon: <FiDollarSign size={24} />,
      link: "/orders",
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      change: "+6.8%",
      changeType: "increase",
      description: "vs last month",
    },
    {
      title: "Shipped Value",
      value: dashboardData.orderStats?.shippedValue ? `$${(dashboardData.orderStats.shippedValue / 1000).toFixed(1)}K` : "$0K",
      icon: <FiTruck size={24} />,
      link: "/orders?status=Shipped",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      change: "+15.3%",
      changeType: "increase",
      description: "vs last month",
    },
    {
      title: "Running Orders",
      value: `${dashboardData.orderStats?.statusBreakdown?.running || 0}`,
      icon: <FiActivity size={24} />,
      link: "/orders?status=Running",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      change: `${Math.round((dashboardData.orderStats?.statusBreakdown?.running || 0) / (dashboardData.orderStats?.totalOrders || 1) * 100)}%`,
      changeType: "increase",
      description: "of total orders",
    },
  ];

  const quickActions = [
    { title: "New Inquiry", icon: <FiPackage size={20} />, link: "/inquiries/add", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    { title: "New Order", icon: <FiShoppingBag size={20} />, link: "/orders/add", gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
    { title: "Add Supplier", icon: <FiUsers size={20} />, link: "/suppliers/add", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
    { title: "View Reports", icon: <FiBarChart2 size={20} />, link: "/reports", gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
  ];

  // Garment distribution pie data
  const garmentPieData = [
    { name: "Woven", value: dashboardData.garmentBreakdown?.woven?.total || 0, color: "#667eea" },
    { name: "Knit", value: dashboardData.garmentBreakdown?.knit?.total || 0, color: "#10b981" },
    { name: "Sweater", value: dashboardData.garmentBreakdown?.sweater?.total || 0, color: "#f59e0b" },
    { name: "Underwear", value: dashboardData.garmentBreakdown?.underwear?.total || 0, color: "#ef4444" },
  ].filter(item => item.value > 0);

  // Status distribution pie data
  const statusPieData = [
    { name: "Pending", value: dashboardData.statusBreakdown?.pending || 0, color: "#f59e0b" },
    { name: "Quoted", value: dashboardData.statusBreakdown?.quoted || 0, color: "#8b5cf6" },
    { name: "Confirmed", value: dashboardData.statusBreakdown?.confirmed || 0, color: "#10b981" },
  ].filter(item => item.value > 0);

  // Order status distribution pie data
  const orderStatusPieData = [
    { name: "Running", value: dashboardData.orderStats?.statusBreakdown?.running || 0, color: "#3b82f6" },
    { name: "Shipped", value: dashboardData.orderStats?.statusBreakdown?.shipped || 0, color: "#10b981" },
    { name: "Pending", value: dashboardData.orderStats?.statusBreakdown?.pending || 0, color: "#f59e0b" },
    { name: "Cancelled", value: dashboardData.orderStats?.statusBreakdown?.cancelled || 0, color: "#ef4444" },
  ].filter(item => item.value > 0);

  const getFilteredMonthlyData = () => {
    const months = monthlyStats?.months || [];
    const quantitiesAll = monthlyStats?.quantitiesAll || [];
    const quantitiesConfirmed = monthlyStats?.quantitiesConfirmed || [];
    const valuesAll = monthlyStats?.valuesAll || [];
    const valuesConfirmed = monthlyStats?.valuesConfirmed || [];

    if (timeRange === "3months") {
      return {
        months: months.slice(-3),
        quantitiesAll: quantitiesAll.slice(-3),
        quantitiesConfirmed: quantitiesConfirmed.slice(-3),
        valuesAll: valuesAll.slice(-3),
        valuesConfirmed: valuesConfirmed.slice(-3),
      };
    }
    if (timeRange === "6months") {
      return {
        months: months.slice(-6),
        quantitiesAll: quantitiesAll.slice(-6),
        quantitiesConfirmed: quantitiesConfirmed.slice(-6),
        valuesAll: valuesAll.slice(-6),
        valuesConfirmed: valuesConfirmed.slice(-6),
      };
    }
    if (timeRange === "12months") {
      return {
        months: months.slice(-12),
        quantitiesAll: quantitiesAll.slice(-12),
        quantitiesConfirmed: quantitiesConfirmed.slice(-12),
        valuesAll: valuesAll.slice(-12),
        valuesConfirmed: valuesConfirmed.slice(-12),
      };
    }
    return { months, quantitiesAll, quantitiesConfirmed, valuesAll, valuesConfirmed };
  };

  const filteredMonthly = getFilteredMonthlyData();

  // Supplier performance bar data
  const supplierBarData = supplierPerformance?.suppliers?.slice(0, 5).map((supplier, index) => ({
    name: supplier,
    inquiries: supplierPerformance.inquiryCounts?.[index] || 0,
    confirmed: supplierPerformance.confirmedCounts?.[index] || 0,
  })) || [];

  const handleGarmentChartClick = (data, index) => {
    const garmentTypes = ["woven", "knit", "sweater", "underwear"];
    const selectedGarment = garmentTypes[index];
    const queryParams = new URLSearchParams();
    queryParams.append("garment_type", selectedGarment);
    if (filters.year !== "all") queryParams.append("year", filters.year);
    if (filters.season !== "all") queryParams.append("season", filters.season);
    navigate(`/inquiries?${queryParams.toString()}`);
  };

  const handleStatusChartClick = (data, index) => {
    const statuses = ["pending", "quoted", "confirmed"];
    const selectedStatus = statuses[index];
    const queryParams = new URLSearchParams();
    queryParams.append("status", selectedStatus);
    if (filters.year !== "all") queryParams.append("year", filters.year);
    if (filters.season !== "all") queryParams.append("season", filters.season);
    navigate(`/inquiries?${queryParams.toString()}`);
  };

  const handleOrderStatusChartClick = (data, index) => {
    const statuses = ["Running", "Shipped", "Pending", "Cancelled"];
    const selectedStatus = statuses[index];
    navigate(`/orders?status=${selectedStatus}`);
  };

  // Confirmation rate calculation
  const confirmationRate = dashboardData.totalInquiries > 0
    ? Math.round((dashboardData.statusBreakdown.confirmed / dashboardData.totalInquiries) * 100)
    : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", backgroundColor: "#f0f2f5" }}>
        <Sidebar />
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "3px solid #e2e8f0", borderTopColor: "#667eea", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f0f2f5", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, overflow: "auto", padding: "0 1.5rem" }}>
        {/* Header */}
        <header
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            borderRadius: "1rem",
            margin: "1.5rem 0",
            padding: "1.5rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "#1e293b",
                margin: 0,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Merchandising Dashboard
            </h1>
            <p style={{ fontSize: "0.95rem", color: "#64748b", margin: "0.5rem 0 0 0" }}>
              Track your inquiries, orders, and supplier performance
            </p>
          </div>
          <div
            style={{
              fontSize: "1rem",
              color: "#1e293b",
              backgroundColor: "#f8fafc",
              padding: "0.75rem 1.5rem",
              borderRadius: "2rem",
              fontWeight: 600,
              border: "1px solid #e2e8f0",
            }}
          >
            {formattedDate}
          </div>
        </header>

        {/* Filters */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiFilter style={{ color: "#94a3b8" }} size={18} />
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#334155" }}>Filters:</span>
            </div>

            <select
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              <option value="all">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select
              value={filters.season}
              onChange={(e) => handleFilterChange("season", e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              {seasonOptions.map((season) => (
                <option key={season.value} value={season.value}>{season.label}</option>
              ))}
            </select>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "white",
                cursor: "pointer",
                marginLeft: "auto",
              }}
            >
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <button
              onClick={() => fetchDashboardData(filters.year, filters.season)}
              style={{
                padding: "8px 12px",
                borderRadius: "0.5rem",
                border: "1px solid #e2e8f0",
                background: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={() => {
                const csvContent = [
                  ["Metric", "Value"],
                  ["Total Inquiries", dashboardData.totalInquiries],
                  ["Total Quantity", dashboardData.totalOrderQuantityAll],
                  ["Confirmed Quantity", dashboardData.totalOrderQuantityConfirmed],
                  ["Total Value", `$${dashboardData.totalOrderValueAll}`],
                  ["Confirmed Value", `$${dashboardData.totalOrderValueConfirmed}`],
                  ["Total Orders", dashboardData.orderStats?.totalOrders],
                  ["Total Order Value", `$${dashboardData.orderStats?.totalOrderValue}`],
                  ["Shipped Value", `$${dashboardData.orderStats?.shippedValue}`],
                  ["Running Orders", dashboardData.orderStats?.statusBreakdown?.running],
                  ["Shipped Orders", dashboardData.orderStats?.statusBreakdown?.shipped],
                ].map(row => row.join(",")).join("\n");

                const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `dashboard_export_${new Date().toISOString().split("T")[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: "0.5rem",
                border: "1px solid #e2e8f0",
                background: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FiDownload size={16} />
              Export
            </button>
          </div>

          {apiError && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                backgroundColor: "#fffbeb",
                border: "1px solid #fcd34d",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#b45309",
                fontSize: "14px",
              }}
            >
              <FiAlertCircle size={18} />
              <span>Using sample data. Connect to API for live data.</span>
            </div>
          )}
        </div>

        {/* Inquiry Stats Cards */}
        <h3 style={{ marginBottom: "1rem", fontSize: "1rem", color: "#64748b", fontWeight: 600 }}>
          Inquiry Statistics
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {inquiryStats.map((stat, index) => (
            <div
              key={index}
              style={{
                background: stat.gradient,
                padding: "1.5rem",
                borderRadius: "1rem",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: hoveredCard === `inquiry-${index}` ? "translateY(-5px) scale(1.02)" : "translateY(0)",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={() => setHoveredCard(`inquiry-${index}`)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => navigate(stat.link)}
            >
              <div
                style={{
                  position: "absolute",
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  transition: "all 0.3s ease",
                  transform: hoveredCard === `inquiry-${index}` ? "scale(1.2)" : "scale(1)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.9)",
                      margin: 0,
                    }}
                  >
                    {stat.title}
                  </p>
                  <p
                    style={{
                      fontSize: "2.2rem",
                      fontWeight: 700,
                      margin: "0.5rem 0 0 0",
                      color: "white",
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "2px 8px",
                        borderRadius: "20px",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {stat.changeType === "increase" ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
                      {stat.change}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)" }}>
                      {stat.description}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: "1rem",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(5px)",
                  }}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Stats Cards */}
        <h3 style={{ marginBottom: "1rem", fontSize: "1rem", color: "#64748b", fontWeight: 600 }}>
          Order Statistics
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {orderStats.map((stat, index) => (
            <div
              key={index}
              style={{
                background: stat.gradient,
                padding: "1.5rem",
                borderRadius: "1rem",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: hoveredCard === `order-${index}` ? "translateY(-5px) scale(1.02)" : "translateY(0)",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={() => setHoveredCard(`order-${index}`)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => navigate(stat.link)}
            >
              <div
                style={{
                  position: "absolute",
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  transition: "all 0.3s ease",
                  transform: hoveredCard === `order-${index}` ? "scale(1.2)" : "scale(1)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.9)",
                      margin: 0,
                    }}
                  >
                    {stat.title}
                  </p>
                  <p
                    style={{
                      fontSize: "2.2rem",
                      fontWeight: 700,
                      margin: "0.5rem 0 0 0",
                      color: "white",
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "2px 8px",
                        borderRadius: "20px",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {stat.changeType === "increase" ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
                      {stat.change}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)" }}>
                      {stat.description}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: "1rem",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(5px)",
                  }}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "#1e293b",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <FiTrendingUp />
            Quick Actions
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1rem",
            }}
          >
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                style={{
                  backgroundColor: "white",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  border: "1px solid #f1f5f9",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "inherit",
                  textAlign: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                  e.currentTarget.style.borderColor = "#f1f5f9";
                }}
              >
                <div
                  style={{
                    padding: "0.75rem",
                    background: `linear-gradient(135deg, ${action.gradient.split(',')[0].split('(')[1] || '#667eea'}20, ${action.gradient.split(',')[1]?.split(')')[0] || '#764ba2'}20)`,
                    borderRadius: "0.5rem",
                    color: action.gradient.includes("667eea") ? "#667eea" : action.gradient.includes("10b981") ? "#10b981" : action.gradient.includes("f59e0b") ? "#f59e0b" : "#8b5cf6",
                    marginBottom: "0.5rem",
                  }}
                >
                  {action.icon}
                </div>
                <span style={{ fontWeight: 500, fontSize: "0.85rem" }}>
                  {action.title}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Charts Section - First Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {/* Inquiry Monthly Trends Chart */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FiBarChart2 color="#667eea" />
                Monthly Inquiry Trends
              </h3>
              <select
                value={selectedChart}
                onChange={(e) => setSelectedChart(e.target.value)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "white",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                <option value="quantity">Quantity Trend</option>
                <option value="value">Value Trend</option>
              </select>
            </div>

            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={filteredMonthly.months.map((month, idx) => ({
                    month,
                    total: selectedChart === "quantity"
                      ? filteredMonthly.quantitiesAll?.[idx] || 0
                      : (filteredMonthly.valuesAll?.[idx] || 0) / 1000,
                    confirmed: selectedChart === "quantity"
                      ? filteredMonthly.quantitiesConfirmed?.[idx] || 0
                      : (filteredMonthly.valuesConfirmed?.[idx] || 0) / 1000,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    label={{
                      value: selectedChart === "quantity" ? "Quantity (units)" : "Value (K USD)",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#64748b", fontSize: 12 },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  <Bar
                    dataKey="total"
                    name="Total"
                    fill="#667eea"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Line
                    type="monotone"
                    dataKey="confirmed"
                    name="Confirmed"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Trends Line Chart */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FiTrendingUp color="#3b82f6" />
                Monthly Order Trends
              </h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  value={selectedOrderChart}
                  onChange={(e) => setSelectedOrderChart(e.target.value)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "white",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  <option value="orders">Orders Count</option>
                  <option value="orderValue">Order Value (K USD)</option>
                  <option value="orderQuantity">Order Quantity (K)</option>
                </select>
              </div>
            </div>

            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={orderMonthlyStats.months.map((month, idx) => ({
                    month,
                    total: selectedOrderChart === "orderValue" 
                      ? (orderMonthlyStats.orderValues?.[idx] || 0) / 1000 
                      : selectedOrderChart === "orderQuantity"
                      ? (orderMonthlyStats.orderQuantities?.[idx] || 0) / 1000
                      : (orderMonthlyStats.orderCounts?.[idx] || 0),
                    shipped: selectedOrderChart === "orderValue"
                      ? (orderMonthlyStats.shippedValues?.[idx] || 0) / 1000
                      : selectedOrderChart === "orderQuantity"
                      ? (orderMonthlyStats.shippedQuantities?.[idx] || 0) / 1000
                      : (orderMonthlyStats.shippedCounts?.[idx] || 0),
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    label={{
                      value: selectedOrderChart === "orderValue" ? "Value (K USD)" : selectedOrderChart === "orderQuantity" ? "Quantity (K units)" : "Orders Count",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#64748b", fontSize: 12 },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total Orders"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="shipped"
                    name="Shipped"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Section - Second Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {/* Supplier Performance Chart */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FiUsers color="#8b5cf6" />
                Top Suppliers Performance
              </h3>
              <Link
                to="/suppliers"
                style={{
                  fontSize: "0.85rem",
                  color: "#8b5cf6",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                View all →
              </Link>
            </div>

            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={supplierBarData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  <Bar
                    dataKey="inquiries"
                    name="Total Inquiries"
                    fill="#667eea"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="confirmed"
                    name="Confirmed Orders"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Garment Distribution Pie Chart */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <FiPieChart color="#f59e0b" />
              Garment Distribution (Inquiries)
            </h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={garmentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={handleGarmentChartClick}
                    cursor="pointer"
                    isAnimationActive={false}
                  >
                    {garmentPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Section - Third Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {/* Inquiry Status Distribution Pie Chart */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <FiActivity color="#10b981" />
              Inquiry Status
            </h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={handleStatusChartClick}
                    cursor="pointer"
                    isAnimationActive={false}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Status Distribution Pie Chart */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <FiShoppingBag color="#3b82f6" />
              Order Status
            </h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={handleOrderStatusChartClick}
                    cursor="pointer"
                    isAnimationActive={false}
                  >
                    {orderStatusPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Stats Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 8px 0" }}>
              Confirmation Rate
            </p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#1e293b", margin: "0 0 12px 0" }}>
              {confirmationRate}%
            </p>
            <div
              style={{
                width: "100%",
                backgroundColor: "#e2e8f0",
                borderRadius: "20px",
                height: "8px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  backgroundColor: "#10b981",
                  borderRadius: "20px",
                  height: "8px",
                  width: `${confirmationRate}%`,
                  transition: "width 0.5s",
                }}
              />
            </div>
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "8px" }}>
              {dashboardData.statusBreakdown.confirmed} of {dashboardData.totalInquiries} inquiries confirmed
            </p>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 8px 0" }}>
              Active Suppliers
            </p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#1e293b", margin: "0 0 4px 0" }}>
              {dashboardData.supplierStats.active}
            </p>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
              of {dashboardData.supplierStats.total} total suppliers
            </p>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 8px 0" }}>
              Recent Activity
            </p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#1e293b", margin: "0 0 4px 0" }}>
              {dashboardData.recentInquiries + (dashboardData.orderStats?.recentOrders || 0)}
            </p>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
              Last 30 days
            </p>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 8px 0" }}>
              Total Customers
            </p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#1e293b", margin: "0 0 4px 0" }}>
              {dashboardData.customerStats.totalCustomers}
            </p>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
              {dashboardData.customerStats.totalBuyers} active buyers
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #f1f5f9",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "white",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FiClock />
                Recent Activity
              </h2>
            </div>
            <div>
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div
                  key={activity.id}
                  style={{
                    padding: "1rem 1.5rem",
                    borderBottom: index < 4 ? "1px solid #f1f5f9" : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onClick={() => navigate(activity.type === 'order' ? `/orders/${activity.id}` : `/inquiries/${activity.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: activity.type === 'order'
                          ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                          : activity.status === "confirmed"
                          ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                          : activity.status === "quoted"
                          ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                          : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: "1rem",
                      }}
                    >
                      {activity.type === 'order' ? 'PO' : activity.title?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 600, margin: 0, fontSize: "0.9rem" }}>
                        {activity.title}
                      </h3>
                      <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                        {activity.description}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "2px 8px",
                        borderRadius: "20px",
                        backgroundColor: activity.type === 'order'
                          ? activity.status === "Shipped"
                            ? "#d1fae5"
                            : activity.status === "Running"
                            ? "#dbeafe"
                            : "#fed7aa"
                          : activity.status === "confirmed"
                          ? "#d1fae5"
                          : activity.status === "quoted"
                          ? "#ede9fe"
                          : "#fed7aa",
                        color: activity.type === 'order'
                          ? activity.status === "Shipped"
                            ? "#047857"
                            : activity.status === "Running"
                            ? "#1e40af"
                            : "#b45309"
                          : activity.status === "confirmed"
                          ? "#047857"
                          : activity.status === "quoted"
                          ? "#6d28d9"
                          : "#b45309",
                      }}
                    >
                      {activity.type === 'order' ? `Order: ${activity.status}` : activity.status}
                    </span>
                    <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "4px 0 0 0" }}>
                      {activity.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                padding: "0.75rem 1.5rem",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <Link
                to="/inquiries"
                style={{
                  color: "#667eea",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                View All Inquiries & Orders
                <FiArrowUp size={14} style={{ transform: "rotate(45deg)" }} />
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f5f9;
          }
          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}
      </style>
    </div>
  );
};

export default DashboardPage;