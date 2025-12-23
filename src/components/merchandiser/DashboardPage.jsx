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
} from "react-icons/fi";
import axios from "axios";

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // To read URL query parameters
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

  // Initialize filters from URL query parameters
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

      console.log("Fetching dashboard data from:", DASHBOARD_API_URL);

      const response = await axios.get(DASHBOARD_API_URL);
      console.log("API response data:", response.data);

      if (response.data && response.data.success) {
        const data = response.data.data || {};
        console.log("Dashboard data loaded successfully:", data);

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
      console.log("API call failed, using fallback data:", apiErr);
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

    // Update URL query parameters
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
    totalOrderValue: 45280 * 15, // Estimate: 45280 units * $15/unit = $679,200
    totalOrderValueConfirmed: 32000 * 15, // Estimate: 32000 units * $15/unit = $480,000
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
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    inquiryCounts: [45, 52, 48, 60, 55, 65],
    quantitiesAll: [45000, 52000, 48000, 75000, 68000, 92000],
    quantitiesConfirmed: [32000, 45000, 38000, 60000, 52000, 78000],
  });

  const getFallbackSupplierPerformance = () => ({
    suppliers: [
      "Supplier A",
      "Supplier B",
      "Supplier C",
      "Supplier D",
      "Supplier E",
    ],
    inquiryCounts: [45, 38, 32, 28, 25],
    confirmedCounts: [35, 30, 25, 22, 20],
  });

  const getFallbackRecentActivity = () => [
    {
      id: 1,
      type: "inquiry",
      title: "Inquiry: INQ-2024-001",
      description: "T-Shirt for Customer A",
      status: "pending",
      date: "2024-01-15",
      garment_type: "knit",
    },
    {
      id: 2,
      type: "inquiry",
      title: "Inquiry: INQ-2024-002",
      description: "Jacket for Customer B",
      status: "confirmed",
      date: "2024-01-14",
      garment_type: "woven",
    },
    {
      id: 3,
      type: "inquiry",
      title: "Inquiry: INQ-2024-003",
      description: "Sweater for Customer C",
      status: "quoted",
      date: "2024-01-13",
      garment_type: "sweater",
    },
  ];

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const stats = [
    {
      title: "Total Inquiries",
      value: dashboardData.totalInquiries,
      icon: <FiPackage size={24} />,
      link: "/inquiries",
      color: "#2563eb",
      description: "All inquiries",
    },
    {
      title: "Total Inquiry Quantity",
      value: dashboardData.totalOrderQuantity.toLocaleString(),
      icon: <FiTrendingUp size={24} />,
      link: "/inquiries",
      color: "#059669",
      description: "Total pieces",
    },
    {
      title: "Confirmed Inquiry Quantity",
      value: dashboardData.totalOrderQuantityConfirmed.toLocaleString(),
      icon: <FiCheckCircle size={24} />,
      link: "/inquiries?status=confirmed",
      color: "#dc2626",
      description: "Confirmed pieces",
    },
    {
      title: "Confirmed Inquiries",
      value: dashboardData.statusBreakdown.confirmed,
      icon: <FiCheckCircle size={24} />,
      link: "/inquiries?status=confirmed",
      color: "#dc2626",
      description: "Confirmed orders",
    },
    {
      title: "Confirmed Inquiry Value",
      value: dashboardData.totalOrderValueConfirmed
        ? `$${(dashboardData.totalOrderValueConfirmed / 1000).toFixed(1)}k`
        : "N/A",
      icon: <FiCheckCircle size={24} />,
      link: "/inquiries?status=confirmed",
      color: "#16a34a",
      description: dashboardData.totalOrderValueConfirmed
        ? `Total: $${dashboardData.totalOrderValueConfirmed.toLocaleString()}`
        : "No value data",
    },
  ];

  const quickActions = [
    {
      title: "Create New Inquiry",
      icon: <FiPackage size={20} />,
      link: "/inquiries/add",
    },
    {
      title: "Manage Suppliers",
      icon: <FiUsers size={20} />,
      link: "/suppliers",
    },
    {
      title: "View Reports",
      icon: <FiBarChart2 size={20} />,
      link: "/reports",
    },
    {
      title: "Customer Management",
      icon: <FiBriefcase size={20} />,
      link: "/customers",
    },
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
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
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
        backgroundColor: ["#FF6384", "#FF9F40", "#4BC0C0"],
        hoverBackgroundColor: ["#FF6384", "#FF9F40", "#4BC0C0"],
        borderWidth: 0,
      },
    ],
  };

  const validateMonthlyData = (dataArray, fallback) => {
    if (
      Array.isArray(dataArray) &&
      dataArray.length > 0 &&
      dataArray.every(
        (val) => typeof val === "number" && !isNaN(val) && val >= 0
      )
    ) {
      return dataArray.map((val) => Number(val));
    }
    console.warn("Invalid monthly data, using fallback:", dataArray);
    return fallback.map((val) => Number(val));
  };

  const getDynamicTicks = (quantitiesAll, quantitiesConfirmed) => {
    const allValues = [...quantitiesAll, ...quantitiesConfirmed];
    const maxValue = Math.max(...allValues, 10000);
    const tickStep = maxValue > 50000 ? 20000 : 5000;
    const ticks = [0];
    let current = tickStep;
    while (current <= maxValue * 1.1) {
      ticks.push(current);
      current += tickStep;
    }
    return ticks;
  };

  const monthlyChartLabels =
    monthlyStats?.months?.length > 0 &&
    monthlyStats.months.every((m) => m && typeof m === "string")
      ? monthlyStats.months
      : getFallbackMonthlyStats().months;

  const monthlyChartDataValuesAll = validateMonthlyData(
    monthlyStats?.quantitiesAll,
    getFallbackMonthlyStats().quantitiesAll
  );

  const monthlyChartDataValuesConfirmed = validateMonthlyData(
    monthlyStats?.quantitiesConfirmed,
    getFallbackMonthlyStats().quantitiesConfirmed
  );

  const dynamicTicks = getDynamicTicks(
    monthlyChartDataValuesAll,
    monthlyChartDataValuesConfirmed
  );

  const monthlyChartData = {
    labels: monthlyChartLabels,
    datasets: [
      {
        label: "Total Order Quantity",
        data: monthlyChartDataValuesAll,
        borderColor: "#36A2EB",
        backgroundColor: "rgba(54, 162, 235, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#36A2EB",
        pointBorderColor: "#36A2EB",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Confirmed Order Quantity",
        data: monthlyChartDataValuesConfirmed,
        borderColor: "#4BC0C0",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#4BC0C0",
        pointBorderColor: "#4BC0C0",
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
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.raw || 0;
            return `${label}: ${value.toLocaleString()} pieces`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Months",
          font: {
            size: 14,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: Math.max(...dynamicTicks),
        ticks: {
          callback: function (value) {
            if (dynamicTicks.includes(value)) {
              if (value === 0) return "0";
              if (value >= 1000) return value / 1000 + "k";
              return value;
            }
            return null;
          },
          values: dynamicTicks,
        },
        title: {
          display: true,
          text: "Order Quantity (Pieces)",
          font: {
            size: 14,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    animation: {
      duration: 1000,
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  const supplierChartLabels =
    supplierPerformance?.suppliers?.length > 0
      ? supplierPerformance.suppliers
      : getFallbackSupplierPerformance().suppliers;

  const supplierInquiryCounts =
    supplierPerformance?.inquiryCounts?.length > 0
      ? supplierPerformance.inquiryCounts
      : getFallbackSupplierPerformance().inquiryCounts;

  const supplierConfirmedCounts =
    supplierPerformance?.confirmedCounts?.length > 0
      ? supplierPerformance.confirmedCounts
      : getFallbackSupplierPerformance().confirmedCounts;

  const supplierChartData = {
    labels: supplierChartLabels,
    datasets: [
      {
        label: "Total Inquiries",
        data: supplierInquiryCounts,
        backgroundColor: "#36A2EB",
        borderWidth: 0,
      },
      {
        label: "Confirmed",
        data: supplierConfirmedCounts,
        backgroundColor: "#4BC0C0",
        borderWidth: 0,
      },
    ],
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

  const handleMonthlyChartClick = (event, elements) => {
    const queryParams = new URLSearchParams();
    if (filters.year !== new Date().getFullYear().toString())
      queryParams.append("year", filters.year);
    if (filters.season !== "all") queryParams.append("season", filters.season);
    navigate(`/inquiries?${queryParams.toString()}`);
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
          generateLabels: function (chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const total = data.datasets[0].data.reduce(
                (sum, val) => sum + (val || 0),
                0
              );
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i] || 0;
                const percentage =
                  total > 0 ? Math.round((value / total) * 100) : 0;
                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor
                    ? data.datasets[0].borderColor[i]
                    : "#fff",
                  lineWidth: data.datasets[0].borderWidth || 0,
                  hidden:
                    isNaN(data.datasets[0].data[i]) ||
                    chart.getDatasetMeta(0).data[i].hidden,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce(
              (sum, val) => sum + (val || 0),
              0
            );
            const percentage =
              total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    animation: {
      duration: 1000,
    },
    hover: {
      animationDuration: 400,
    },
    elements: {
      arc: {
        hoverOffset: 8,
        borderWidth: 2,
        borderColor: "#fff",
      },
    },
  };

  const barChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.raw || 0;
            return `${label}: ${value} inquiries`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    animation: {
      duration: 1000,
    },
    hover: {
      animationDuration: 400,
    },
  };

  const Spinner = () => (
    <div
      style={{
        border: "4px solid #f3f3f3",
        borderTop: "4px solid #36A2EB",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        animation: "spin 2s linear infinite",
        margin: "20px auto",
      }}
    />
  );

  if (loading) {
    return (
      <div
        style={{ display: "flex", height: "100vh", backgroundColor: "#DCEEF3" }}
      >
        <style>
          {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
        </style>
        <Sidebar />
        <div
          style={{
            flex: 1,
            padding: "1.5rem",
            backgroundColor: "#DCEEF3",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <h3 style={{ marginBottom: "20px", color: "#333" }}>
            Loading Dashboard Data...
          </h3>
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", height: "100vh", backgroundColor: "#DCEEF3" }}
    >
      <div style={{ display: "flex" }}>
        <Sidebar />
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        <header
          style={{
            backgroundColor: "#DCEEF3",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              padding: "1rem 1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#374151",
                margin: 0,
              }}
            >
              Merchandising Dashboard
            </h1>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                fontWeight: 500,
              }}
            >
              {formattedDate}
            </div>
          </div>
        </header>

        <div
          style={{
            margin: "1rem 1.5rem",
            padding: "1rem",
            backgroundColor: "white",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <FiFilter size={18} color="#6b7280" />
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Filters:
              </span>
            </div>

            <div>
              <label
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                  display: "block",
                }}
              >
                Year
              </label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange("year", e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  backgroundColor: "white",
                  minWidth: "100px",
                }}
              >
                <option value="all">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                  display: "block",
                }}
              >
                Season
              </label>
              <select
                value={filters.season}
                onChange={(e) => handleFilterChange("season", e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  backgroundColor: "white",
                  minWidth: "120px",
                }}
              >
                {seasonOptions.map((season) => (
                  <option key={season.value} value={season.value}>
                    {season.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginLeft: "auto" }}>
              <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                Showing: {filters.year === "all" ? "All Years" : filters.year} •{" "}
                {filters.season === "all"
                  ? "All Seasons"
                  : seasonOptions.find((s) => s.value === filters.season)
                      ?.label}
              </span>
            </div>
          </div>
        </div>

        {apiError ? (
          <div
            style={{
              margin: "1rem 1.5rem",
              padding: "1rem",
              backgroundColor: "#fef3c7",
              border: "1px solid #f59e0b",
              borderRadius: "0.5rem",
              color: "#92400e",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <FiAlertCircle size={18} />
            <div style={{ flex: 1 }}>
              <strong>Demo Mode:</strong> Using sample data.
              <div style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                Real data will load when API is available at:
                http://119.148.51.38:8000/api/merchandiser/api/dashboard/data/
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              margin: "1rem 1.5rem",
              padding: "1rem",
              backgroundColor: "#dcfce7",
              border: "1px solid #16a34a",
              borderRadius: "0.5rem",
              color: "#166534",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <FiCheckCircle size={18} />
            <div style={{ flex: 1 }}>
              <strong>Live Data:</strong> Showing data for{" "}
              {filters.year === "all" ? "all years" : filters.year} •{" "}
              {filters.season === "all"
                ? "all seasons"
                : seasonOptions.find((s) => s.value === filters.season)?.label}
            </div>
          </div>
        )}

        <main style={{ padding: "1.5rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "rgb(177, 222, 233)",
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  border: "1px solid #e5e7eb",
                  transition: "all 0.3s ease-in-out",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                }}
                onClick={() => (window.location.href = stat.link)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "#6b7280",
                        margin: 0,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {stat.title}
                    </p>
                    <p
                      style={{
                        fontSize: "1.875rem",
                        fontWeight: 700,
                        margin: 0,
                        color: stat.color,
                        lineHeight: "1.2",
                      }}
                    >
                      {stat.value}
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "#6b7280",
                        margin: "0.25rem 0 0 0",
                      }}
                    >
                      {stat.description}
                    </p>
                  </div>
                  <div
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "#eff6ff",
                      borderRadius: "0.75rem",
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "1rem",
              }}
            >
              Quick Actions
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  style={{
                    backgroundColor: "#B9D6F2",
                    padding: "1rem",
                    borderRadius: "1rem",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    border: "1px solid #e5e7eb",
                    transition: "all 0.3s ease-in-out",
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                  }}
                >
                  <div
                    style={{
                      marginRight: "0.75rem",
                      padding: "0.5rem",
                      backgroundColor: "#eff6ff",
                      borderRadius: "0.375rem",
                      color: "#2563eb",
                    }}
                  >
                    {action.icon}
                  </div>
                  <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                    {action.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                backgroundColor: "#A7D5E1",
                borderRadius: "1rem",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                border: "1px solid #e5e7eb",
                padding: "1.5rem",
                overflow: "hidden",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "1rem",
                }}
              >
                Garment Type Distribution
              </h2>
              <div
                style={{
                  height: "280px",
                  width: "100%",
                  position: "relative",
                }}
                className="chart-container"
              >
                <CChart
                  type="doughnut"
                  data={garmentChartData}
                  options={pieChartOptions}
                  onClick={handleGarmentChartClick}
                  style={{ maxHeight: "280px", maxWidth: "100%" }}
                />
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#72BBCE",
                borderRadius: "1rem",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                border: "1px solid #e5e7eb",
                padding: "1.5rem",
                overflow: "hidden",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "1rem",
                }}
              >
                Inquiry Status
              </h2>
              <div
                style={{
                  height: "280px",
                  width: "100%",
                  position: "relative",
                }}
                className="chart-container"
              >
                <CChart
                  type="pie"
                  data={statusChartData}
                  options={pieChartOptions}
                  onClick={handleStatusChartClick}
                  style={{ maxHeight: "280px", maxWidth: "100%" }}
                />
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#63B0E3",
                borderRadius: "1rem",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                border: "1px solid #e5e7eb",
                padding: "1.5rem",
                overflow: "hidden",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "1rem",
                }}
              >
                Monthly Order Trends
              </h2>
              <div
                style={{
                  height: "280px",
                  width: "100%",
                  position: "relative",
                }}
                className="chart-container"
              >
                <CChart
                  type="line"
                  data={monthlyChartData}
                  options={lineChartOptions}
                  onClick={handleMonthlyChartClick}
                  style={{ maxHeight: "280px", maxWidth: "100%" }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <div
              style={{
                backgroundColor: "#72BBCE",
                borderRadius: "1rem",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                border: "1px solid #e5e7eb",
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#6b7280",
                  margin: 0,
                }}
              >
                Confirmation Rate
              </h3>
              <p
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#059669",
                  margin: "0.5rem 0",
                }}
              >
                {dashboardData.totalInquiries > 0
                  ? Math.round(
                      (dashboardData.statusBreakdown.confirmed /
                        dashboardData.totalInquiries) *
                        100
                    )
                  : 0}
                %
              </p>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
                {dashboardData.statusBreakdown.confirmed} of{" "}
                {dashboardData.totalInquiries} inquiries
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#63B0E3",
                borderRadius: "1rem",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                border: "1px solid #e5e7eb",
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#6b7280",
                  margin: 0,
                }}
              >
                Active Suppliers
              </h3>
              <p
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#2563eb",
                  margin: "0.5rem 0",
                }}
              >
                {dashboardData.supplierStats.active}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
                of {dashboardData.supplierStats.total} total
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#A7D5E1",
                borderRadius: "1rem",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                border: "1px solid #e5e7eb",
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#6b7280",
                  margin: 0,
                }}
              >
                Recent Inquiries
              </h3>
              <p
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#d97706",
                  margin: "0.5rem 0",
                }}
              >
                {dashboardData.recentInquiries}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
                Last 30 days
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#B9D6F2",
                borderRadius: "1rem",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                border: "1px solid #e5e7eb",
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#6b7280",
                  margin: 0,
                }}
              >
                Total Customers
              </h3>
              <p
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#7c3aed",
                  margin: "0.5rem 0",
                }}
              >
                {dashboardData.customerStats.totalCustomers}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
                {dashboardData.customerStats.totalBuyers} buyers
              </p>
            </div>
          </div>
        </main>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .chart-container {
            position: relative;
            height: 280px !important;
            width: 100% !important;
          }
          .chart-container canvas {
            max-height: 280px !important;
            height: 280px !important;
            width: 100% !important;
          }
        `}
      </style>
    </div>
  );
};

export default DashboardPage;
