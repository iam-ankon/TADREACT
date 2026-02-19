import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CChart } from "@coreui/react-chartjs";
import Sidebar from "../merchandiser/Sidebar.jsx";
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
} from "react-icons/fi";
import axios from "axios";

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState({
    totalInquiries: 0,
    totalOrderQuantity: 0,
    totalOrderQuantityConfirmed: 0,
    totalOrderValue: 0,
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
  });

  const [monthlyStats, setMonthlyStats] = useState({
    months: [],
    inquiryCounts: [],
    quantitiesAll: [],
    quantitiesConfirmed: [],
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

  const queryParams = new URLSearchParams(location.search);
  const initialYear =
    queryParams.get("year") || new Date().getFullYear().toString();
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

  const fetchDashboardData = async (year = null, season = null) => {
    try {
      setLoading(true);
      setError(null);
      setApiError(false);

      const API_BASE_URL = "http://119.148.51.38:8000/api/merchandiser/api";
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
          totalOrderQuantity: data.totalOrderQuantityAll || 0,
          totalOrderQuantityConfirmed: data.totalOrderQuantityConfirmed || 0,
          totalOrderValue: data.totalOrderValueAll || 0,
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
        });

        setMonthlyStats(
          data.monthlyStats || {
            months: [],
            inquiryCounts: [],
            quantitiesAll: [],
            quantitiesConfirmed: [],
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

        if (data.availableYears) {
          setAvailableYears(data.availableYears);
        }
        if (data.availableSeasons) {
          setAvailableSeasons(data.availableSeasons);
        }
      } else {
        throw new Error(
          "API returned error: " + (response.data?.error || "Unknown error")
        );
      }
    } catch (apiErr) {
      setApiError(true);
      setDashboardData(getFallbackData());
      setMonthlyStats(getFallbackMonthlyStats());
      setSupplierPerformance(getFallbackSupplierPerformance());
      setRecentActivity(getFallbackRecentActivity());

      setAvailableYears(["2024", "2023", "2022"]);
      setAvailableSeasons(["spring", "summer", "autumn", "winter"]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...filters,
      [filterType]: value,
    };
    setFilters(newFilters);

    const queryParams = new URLSearchParams();
    if (newFilters.year !== new Date().getFullYear().toString()) {
      queryParams.set("year", newFilters.year);
    }
    if (newFilters.season !== "all") {
      queryParams.set("season", newFilters.season);
    }
    const queryString = queryParams.toString();
    navigate(`${location.pathname}${queryString ? `?${queryString}` : ""}`, {
      replace: true,
    });

    fetchDashboardData(newFilters.year, newFilters.season);
  };

  useEffect(() => {
    fetchDashboardData(filters.year, filters.season);
  }, []);

  const getFallbackData = () => ({
    totalInquiries: 156,
    totalOrderQuantity: 45280,
    totalOrderQuantityConfirmed: 32000,
    totalOrderValue: 679200,
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
  });

  const getFallbackMonthlyStats = () => ({
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    inquiryCounts: [45, 52, 48, 60, 55, 65, 70, 68, 72, 80, 75, 85],
    quantitiesAll: [45000, 52000, 48000, 75000, 68000, 92000, 88000, 95000, 102000, 110000, 105000, 115000],
    quantitiesConfirmed: [32000, 45000, 38000, 60000, 52000, 78000, 72000, 80000, 85000, 92000, 88000, 95000],
  });

  const getFallbackSupplierPerformance = () => ({
    suppliers: ["Supplier A", "Supplier B", "Supplier C", "Supplier D", "Supplier E", "Supplier F"],
    inquiryCounts: [45, 38, 32, 28, 25, 22],
    confirmedCounts: [35, 30, 25, 22, 20, 18],
  });

  const getFallbackRecentActivity = () => [
    { id: 1, type: "inquiry", title: "INQ-2024-001", description: "Cotton T-Shirts - Customer A", status: "pending", date: "2024-01-15", garment_type: "knit" },
    { id: 2, type: "inquiry", title: "INQ-2024-002", description: "Denim Jackets - Customer B", status: "confirmed", date: "2024-01-14", garment_type: "woven" },
    { id: 3, type: "inquiry", title: "INQ-2024-003", description: "Wool Sweaters - Customer C", status: "quoted", date: "2024-01-13", garment_type: "sweater" },
    { id: 4, type: "inquiry", title: "INQ-2024-004", description: "Sports Underwear - Customer D", status: "pending", date: "2024-01-12", garment_type: "underwear" },
    { id: 5, type: "inquiry", title: "INQ-2024-005", description: "Polo Shirts - Customer E", status: "confirmed", date: "2024-01-11", garment_type: "knit" },
  ];

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const stats = [
    {
      title: "Total Inquiries",
      value: dashboardData.totalInquiries,
      icon: <FiPackage size={24} />,
      link: "/inquiries",
      color: "#3b82f6",
      bgColor: "#eff6ff",
      change: "+12.5%",
      changeType: "increase",
      description: "vs last month",
    },
    {
      title: "Total Quantity",
      value: dashboardData.totalOrderQuantity.toLocaleString(),
      icon: <FiTrendingUp size={24} />,
      link: "/inquiries",
      color: "#10b981",
      bgColor: "#ecfdf5",
      change: "+8.2%",
      changeType: "increase",
      description: "vs last month",
    },
    {
      title: "Confirmed Quantity",
      value: dashboardData.totalOrderQuantityConfirmed.toLocaleString(),
      icon: <FiCheckCircle size={24} />,
      link: "/inquiries?status=confirmed",
      color: "#f59e0b",
      bgColor: "#fffbeb",
      change: "+15.3%",
      changeType: "increase",
      description: "vs last month",
    },
    {
      title: "Order Value",
      value: dashboardData.totalOrderValueConfirmed
        ? `$${(dashboardData.totalOrderValueConfirmed / 1000).toFixed(1)}K`
        : "N/A",
      icon: <FiDollarSign size={24} />,
      link: "/inquiries?status=confirmed",
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
      change: "+5.7%",
      changeType: "increase",
      description: "vs last month",
    },
  ];

  const quickActions = [
    { title: "New Inquiry", icon: <FiPackage size={20} />, link: "/inquiries/add", color: "#3b82f6" },
    { title: "Add Supplier", icon: <FiUsers size={20} />, link: "/suppliers/add", color: "#10b981" },
    { title: "View Reports", icon: <FiBarChart2 size={20} />, link: "/reports", color: "#f59e0b" },
    { title: "Add Customer", icon: <FiBriefcase size={20} />, link: "/customers/add", color: "#8b5cf6" },
  ];

  const garmentChartData = {
    labels: ["Woven", "Knit", "Sweater", "Underwear"],
    datasets: [
      {
        data: [
          dashboardData?.garmentBreakdown?.woven?.total || 0,
          dashboardData?.garmentBreakdown?.knit?.total || 0,
          dashboardData?.garmentBreakdown?.sweater?.total || 0,
          dashboardData?.garmentBreakdown?.underwear?.total || 0,
        ],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
        hoverBackgroundColor: ["#2563eb", "#059669", "#d97706", "#7c3aed"],
        borderWidth: 0,
      },
    ],
  };

  const statusChartData = {
    labels: ["Pending", "Quoted", "Confirmed"],
    datasets: [
      {
        data: [
          dashboardData?.statusBreakdown?.pending || 0,
          dashboardData?.statusBreakdown?.quoted || 0,
          dashboardData?.statusBreakdown?.confirmed || 0,
        ],
        backgroundColor: ["#f59e0b", "#8b5cf6", "#10b981"],
        hoverBackgroundColor: ["#d97706", "#7c3aed", "#059669"],
        borderWidth: 0,
      },
    ],
  };

  const getFilteredMonthlyData = () => {
    const months = monthlyStats?.months || [];
    const quantitiesAll = monthlyStats?.quantitiesAll || [];
    const quantitiesConfirmed = monthlyStats?.quantitiesConfirmed || [];
    
    if (timeRange === "3months") return { months: months.slice(-3), quantitiesAll: quantitiesAll.slice(-3), quantitiesConfirmed: quantitiesConfirmed.slice(-3) };
    if (timeRange === "6months") return { months: months.slice(-6), quantitiesAll: quantitiesAll.slice(-6), quantitiesConfirmed: quantitiesConfirmed.slice(-6) };
    if (timeRange === "12months") return { months: months.slice(-12), quantitiesAll: quantitiesAll.slice(-12), quantitiesConfirmed: quantitiesConfirmed.slice(-12) };
    return { months, quantitiesAll, quantitiesConfirmed };
  };

  const filteredMonthly = getFilteredMonthlyData();

  const monthlyChartData = {
    labels: filteredMonthly.months,
    datasets: [
      {
        label: "Total Quantity",
        data: filteredMonthly.quantitiesAll,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Confirmed Quantity",
        data: filteredMonthly.quantitiesConfirmed,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#f9fafb",
        bodyColor: "#e5e7eb",
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw.toLocaleString()} pcs`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#6b7280" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          color: "#6b7280",
          callback: (value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value,
        },
      },
    },
    interaction: { intersect: false, mode: "index" },
    animation: { duration: 1000 },
  };

  const supplierChartData = {
    labels: supplierPerformance?.suppliers?.slice(0, 5) || [],
    datasets: [
      {
        label: "Inquiries",
        data: supplierPerformance?.inquiryCounts?.slice(0, 5) || [],
        backgroundColor: "#3b82f6",
        borderRadius: 4,
      },
      {
        label: "Confirmed",
        data: supplierPerformance?.confirmedCounts?.slice(0, 5) || [],
        backgroundColor: "#10b981",
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#f9fafb",
        bodyColor: "#e5e7eb",
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#6b7280" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: { color: "#6b7280" },
      },
    },
    animation: { duration: 1000 },
  };

  const pieChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          usePointStyle: true,
          color: "#4b5563",
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const total = data.datasets[0].data.reduce((sum, val) => sum + (val || 0), 0);
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i] || 0;
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: "#fff",
                  lineWidth: 2,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#f9fafb",
        bodyColor: "#e5e7eb",
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((sum, val) => sum + (val || 0), 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    animation: { duration: 1000 },
    hover: { animationDuration: 400 },
  };

  const handleGarmentChartClick = (event, elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const garmentTypes = ["woven", "knit", "sweater", "underwear"];
      const selectedGarment = garmentTypes[index];
      const queryParams = new URLSearchParams();
      queryParams.append("garment_type", selectedGarment);
      if (filters.year !== new Date().getFullYear().toString())
        queryParams.append("year", filters.year);
      if (filters.season !== "all")
        queryParams.append("season", filters.season);
      navigate(`/inquiries?${queryParams.toString()}`);
    }
  };

  const handleStatusChartClick = (event, elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const statuses = ["pending", "quoted", "confirmed"];
      const selectedStatus = statuses[index];
      const queryParams = new URLSearchParams();
      queryParams.append("status", selectedStatus);
      if (filters.year !== new Date().getFullYear().toString())
        queryParams.append("year", filters.year);
      if (filters.season !== "all")
        queryParams.append("season", filters.season);
      navigate(`/inquiries?${queryParams.toString()}`);
    }
  };

  const spinnerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "256px",
  };

  const spinnerInnerStyle = {
    width: "48px",
    height: "48px",
    border: "3px solid #e5e7eb",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", backgroundColor: "#f9fafb" }}>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <Sidebar />
        <div style={spinnerStyle}>
          <div style={spinnerInnerStyle}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f9fafb", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <Sidebar />
      
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Header */}
        <header style={{ 
        
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
        
        }}>
          <div style={{ padding: "16px 32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#111827", margin: "0 0 4px 0" }}>
                  Merchandising Dashboard
                </h1>
                <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>{formattedDate}</p>
              </div>
              
              <div style={{ display: "flex", gap: "12px" }}>
                <button style={{
                  padding: "8px",
                  color: "#9ca3af",
                  background: "none",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#4b5563";
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9ca3af";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}>
                  <FiRefreshCw size={20} />
                </button>
                <button style={{
                  padding: "8px",
                  color: "#9ca3af",
                  background: "none",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#4b5563";
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9ca3af";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}>
                  <FiDownload size={20} />
                </button>
                <button style={{
                  padding: "8px",
                  color: "#9ca3af",
                  background: "none",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#4b5563";
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9ca3af";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}>
                  <FiMoreVertical size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div style={{ padding: "16px 32px" }}>
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "12px", 
            boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", 
            border: "1px solid #e5e7eb",
            padding: "16px"
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FiFilter style={{ color: "#9ca3af" }} size={18} />
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#374151" }}>Filters:</span>
              </div>

              <select
                value={filters.year}
                onChange={(e) => handleFilterChange("year", e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: "white",
                  cursor: "pointer"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#d1d5db"}
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
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: "white",
                  cursor: "pointer"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#d1d5db"}
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
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: "white",
                  cursor: "pointer",
                  marginLeft: "auto"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#d1d5db"}
              >
                {timeRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {apiError && (
              <div style={{
                marginTop: "16px",
                padding: "12px",
                backgroundColor: "#fffbeb",
                border: "1px solid #fcd34d",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#b45309",
                fontSize: "14px"
              }}>
                <FiAlertCircle size={18} />
                <span>Using sample data. Connect to API for live data.</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <main style={{ padding: "0 32px 32px 32px" }}>
          {/* Stats Grid */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(1, 1fr)",
            gap: "24px",
            marginBottom: "32px"
          }}>
            <style>{`
              @media (min-width: 768px) {
                .stats-grid {
                  grid-template-columns: repeat(2, 1fr) !important;
                }
              }
              @media (min-width: 1024px) {
                .stats-grid {
                  grid-template-columns: repeat(4, 1fr) !important;
                }
              }
            `}</style>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
              {stats.map((stat, index) => (
                <div
                  key={index}
                  onClick={() => (window.location.href = stat.link)}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                    border: "1px solid #e5e7eb",
                    padding: "24px",
                    cursor: "pointer",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0,0,0,0.05)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div style={{ 
                      padding: "12px", 
                      borderRadius: "8px", 
                      backgroundColor: stat.bgColor 
                    }}>
                      <div style={{ color: stat.color }}>{stat.icon}</div>
                    </div>
                    <span style={{ 
                      fontSize: "12px", 
                      fontWeight: 500, 
                      color: "#9ca3af",
                      transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#4b5563"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}>
                      View all →
                    </span>
                  </div>
                  
                  <p style={{ fontSize: "14px", color: "#4b5563", margin: "0 0 4px 0" }}>{stat.title}</p>
                  <p style={{ fontSize: "30px", fontWeight: "bold", color: "#111827", margin: "0 0 8px 0" }}>{stat.value}</p>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ 
                      fontSize: "12px", 
                      fontWeight: 500, 
                      padding: "2px 8px", 
                      borderRadius: "9999px",
                      backgroundColor: stat.changeType === "increase" ? "#ecfdf5" : "#fef2f2",
                      color: stat.changeType === "increase" ? "#047857" : "#b91c1c",
                      display: "flex",
                      alignItems: "center",
                      gap: "2px"
                    }}>
                      {stat.changeType === "increase" ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
                      {stat.change}
                    </span>
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>{stat.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>Quick Actions</h2>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(4, 1fr)", 
              gap: "16px" 
            }}>
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                    border: "1px solid #e5e7eb",
                    padding: "16px",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0,0,0,0.05)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ 
                      padding: "8px", 
                      borderRadius: "8px", 
                      backgroundColor: `${action.color}20`,
                      transition: "background-color 0.2s"
                    }}>
                      <div style={{ color: action.color }}>{action.icon}</div>
                    </div>
                    <span style={{ 
                      fontWeight: 500, 
                      color: "#374151",
                      transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#111827"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#374151"}>
                      {action.title}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Charts Grid */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(2, 1fr)", 
            gap: "24px",
            marginBottom: "32px"
          }}>
            {/* Monthly Trends */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "12px", 
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", 
              border: "1px solid #e5e7eb",
              padding: "24px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Monthly Order Trends</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "9999px", backgroundColor: "#3b82f6" }}></span>
                    <span style={{ fontSize: "12px", color: "#4b5563" }}>Total</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "9999px", backgroundColor: "#10b981" }}></span>
                    <span style={{ fontSize: "12px", color: "#4b5563" }}>Confirmed</span>
                  </div>
                </div>
              </div>
              <div style={{ height: "320px" }}>
                <CChart
                  type="line"
                  data={monthlyChartData}
                  options={lineChartOptions}
                />
              </div>
            </div>

            {/* Supplier Performance */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "12px", 
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", 
              border: "1px solid #e5e7eb",
              padding: "24px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Top Suppliers</h2>
                <Link to="/suppliers" style={{ 
                  fontSize: "14px", 
                  color: "#3b82f6", 
                  textDecoration: "none",
                  fontWeight: 500
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#2563eb"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#3b82f6"}>
                  View all →
                </Link>
              </div>
              <div style={{ height: "320px" }}>
                <CChart
                  type="bar"
                  data={supplierChartData}
                  options={barChartOptions}
                />
              </div>
            </div>

            {/* Garment Distribution */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "12px", 
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", 
              border: "1px solid #e5e7eb",
              padding: "24px"
            }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "24px" }}>Garment Distribution</h2>
              <div style={{ height: "256px" }}>
                <CChart
                  type="doughnut"
                  data={garmentChartData}
                  options={pieChartOptions}
                  onClick={handleGarmentChartClick}
                />
              </div>
            </div>

            {/* Status Distribution */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "12px", 
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", 
              border: "1px solid #e5e7eb",
              padding: "24px"
            }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "24px" }}>Inquiry Status</h2>
              <div style={{ height: "256px" }}>
                <CChart
                  type="pie"
                  data={statusChartData}
                  options={pieChartOptions}
                  onClick={handleStatusChartClick}
                />
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(4, 1fr)", 
            gap: "24px",
            marginBottom: "32px"
          }}>
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "12px", 
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", 
              border: "1px solid #e5e7eb",
              padding: "24px"
            }}>
              <p style={{ fontSize: "14px", color: "#4b5563", margin: "0 0 8px 0" }}>Confirmation Rate</p>
              <p style={{ fontSize: "30px", fontWeight: "bold", color: "#111827", margin: "0 0 8px 0" }}>
                {dashboardData.totalInquiries > 0
                  ? Math.round((dashboardData.statusBreakdown.confirmed / dashboardData.totalInquiries) * 100)
                  : 0}%
              </p>
              <div style={{ width: "100%", backgroundColor: "#e5e7eb", borderRadius: "9999px", height: "8px" }}>
                <div style={{ 
                  backgroundColor: "#10b981", 
                  borderRadius: "9999px", 
                  height: "8px",
                  width: `${dashboardData.totalInquiries > 0
                    ? (dashboardData.statusBreakdown.confirmed / dashboardData.totalInquiries) * 100
                    : 0}%`,
                  transition: "width 0.5s"
                }} />
              </div>
            </div>

            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "12px", 
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", 
              border: "1px solid #e5e7eb",
              padding: "24px"
            }}>
              <p style={{ fontSize: "14px", color: "#4b5563", margin: "0 0 8px 0" }}>Active Suppliers</p>
              <p style={{ fontSize: "30px", fontWeight: "bold", color: "#111827", margin: "0 0 4px 0" }}>{dashboardData.supplierStats.active}</p>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>of {dashboardData.supplierStats.total} total</p>
            </div>

            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "12px", 
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", 
              border: "1px solid #e5e7eb",
              padding: "24px"
            }}>
              <p style={{ fontSize: "14px", color: "#4b5563", margin: "0 0 8px 0" }}>Recent Inquiries</p>
              <p style={{ fontSize: "30px", fontWeight: "bold", color: "#111827", margin: "0 0 4px 0" }}>{dashboardData.recentInquiries}</p>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Last 30 days</p>
            </div>

            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "12px", 
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", 
              border: "1px solid #e5e7eb",
              padding: "24px"
            }}>
              <p style={{ fontSize: "14px", color: "#4b5563", margin: "0 0 8px 0" }}>Total Customers</p>
              <p style={{ fontSize: "30px", fontWeight: "bold", color: "#111827", margin: "0 0 4px 0" }}>{dashboardData.customerStats.totalCustomers}</p>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>{dashboardData.customerStats.totalBuyers} buyers</p>
            </div>
          </div>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Recent Activity</h2>
                <Link to="/inquiries" style={{ 
                  fontSize: "14px", 
                  color: "#3b82f6", 
                  textDecoration: "none",
                  fontWeight: 500
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#2563eb"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#3b82f6"}>
                  View all →
                </Link>
              </div>
              <div style={{ 
                backgroundColor: "white", 
                borderRadius: "12px", 
                boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", 
                border: "1px solid #e5e7eb",
                overflow: "hidden"
              }}>
                {recentActivity.map((activity, index) => (
                  <div
                    key={activity.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px",
                      borderBottom: index !== recentActivity.length - 1 ? "1px solid #f3f4f6" : "none",
                      cursor: "pointer",
                      transition: "background-color 0.2s"
                    }}
                    onClick={() => navigate(`/inquiries/${activity.id}`)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ 
                        width: "8px", 
                        height: "8px", 
                        borderRadius: "9999px",
                        backgroundColor: activity.status === "confirmed" ? "#10b981" :
                                      activity.status === "quoted" ? "#8b5cf6" : "#f59e0b"
                      }} />
                      <div>
                        <p style={{ fontWeight: 500, color: "#111827", margin: "0 0 4px 0" }}>{activity.title}</p>
                        <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>{activity.description}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{ 
                        fontSize: "12px", 
                        padding: "4px 8px", 
                        borderRadius: "9999px",
                        backgroundColor: activity.status === "confirmed" ? "#ecfdf5" :
                                       activity.status === "quoted" ? "#f5f3ff" : "#fffbeb",
                        color: activity.status === "confirmed" ? "#047857" :
                              activity.status === "quoted" ? "#6d28d9" : "#b45309"
                      }}>
                        {activity.status}
                      </span>
                      <span style={{ fontSize: "14px", color: "#9ca3af" }}>{activity.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;