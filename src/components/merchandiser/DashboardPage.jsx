// DashboardPage.jsx - COMPLETE FIXED VERSION
// Fixes: Fast loading, customer selection works, years show correctly

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiTrendingUp,
  FiBarChart2,
  FiDollarSign,
  FiActivity,
  FiArrowUp,
  FiArrowDown,
  FiRefreshCw,
  FiPieChart,
  FiShoppingBag,
  FiTruck,
  FiCalendar,
} from "react-icons/fi";
import Sidebar from "../merchandiser/Sidebar.jsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  LabelList,
  Line,
} from "recharts";
import axios from "axios";
import {
  getOrderMonthlyData,
  getOrderYearlyData,
  getCustomerData,
  getGarmentCustomerComparison,
  getToken,
  getCustomers,
} from "../../api/merchandiser.js";

// ============================================================================
// CACHE MANAGER - 5 minutes TTL
// ============================================================================
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_PREFIX = "dashboard_cache_";

const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) return data;
    localStorage.removeItem(CACHE_PREFIX + key);
    return null;
  } catch {
    return null;
  }
};

const setCachedData = (key, data) => {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch {}
};

const clearCache = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) localStorage.removeItem(key);
  });
};

// ============================================================================
// SAFE NUMBER HELPER
// ============================================================================
const safeNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

// ============================================================================
// MULTI-YEAR SELECT COMPONENT
// ============================================================================
const MultiYearSelect = ({ selectedYears, onChange, availableYears }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleYear = (year) => {
    let newSelection;
    if (year === "all") {
      newSelection = ["all"];
    } else {
      let currentWithoutAll = selectedYears.filter((y) => y !== "all");
      if (currentWithoutAll.includes(year)) {
        newSelection = currentWithoutAll.filter((y) => y !== year);
        if (newSelection.length === 0) newSelection = ["all"];
      } else {
        newSelection = [...currentWithoutAll, year];
      }
    }
    onChange(newSelection);
  };

  const getDisplayText = () => {
    if (selectedYears.includes("all")) return `📅 All Years`;
    if (selectedYears.length === 1) return `📅 ${selectedYears[0]}`;
    return `📅 ${selectedYears.length} Years Selected`;
  };

  const yearsList =
    Array.isArray(availableYears) && availableYears.length > 0
      ? availableYears
      : [];

  return (
    <div ref={selectRef} style={{ position: "relative", minWidth: 200 }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "8px 12px",
          borderRadius: "0.5rem",
          border: "1px solid #e2e8f0",
          backgroundColor: "white",
          fontSize: "0.85rem",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>{getDisplayText()}</span>
        <span style={{ fontSize: 10 }}>{isOpen ? "▲" : "▼"}</span>
      </div>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            marginTop: 4,
            zIndex: 1000,
            maxHeight: 250,
            overflowY: "auto",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        >
          <div
            onClick={() => toggleYear("all")}
            style={{
              padding: "10px 12px",
              cursor: "pointer",
              backgroundColor: selectedYears.includes("all")
                ? "#ede9fe"
                : "white",
              fontWeight: selectedYears.includes("all") ? 600 : 400,
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            {selectedYears.includes("all") ? "✓ " : "  "}All Years
          </div>
          {yearsList.length === 0 ? (
            <div style={{ padding: "12px", color: "#94a3b8" }}>
              No years available
            </div>
          ) : (
            yearsList.map((year) => (
              <div
                key={year}
                onClick={() => toggleYear(year)}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  backgroundColor: selectedYears.includes(year)
                    ? "#f3f4f6"
                    : "white",
                  fontWeight: selectedYears.includes(year) ? 600 : 400,
                }}
              >
                {selectedYears.includes(year) ? "✓ " : "  "}
                {year}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MULTI-CUSTOMER SELECT COMPONENT
// ============================================================================
const MultiCustomerSelect = ({
  selectedCustomers,
  onChange,
  customersList,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCustomer = (customerId) => {
    let newSelection;
    if (customerId === "all") {
      newSelection = ["all"];
    } else {
      let currentWithoutAll = selectedCustomers.filter((c) => c !== "all");
      if (currentWithoutAll.includes(customerId)) {
        newSelection = currentWithoutAll.filter((c) => c !== customerId);
        if (newSelection.length === 0) newSelection = ["all"];
      } else {
        newSelection = [...currentWithoutAll, customerId];
      }
    }
    onChange(newSelection);
  };

  const getDisplayText = () => {
    if (selectedCustomers.includes("all"))
      return `👥 All Customers (${customersList.length})`;
    if (selectedCustomers.length === 1) {
      const customer = customersList.find(
        (c) => String(c.id) === String(selectedCustomers[0]),
      );
      return `👥 ${customer?.name || selectedCustomers[0]}`;
    }
    return `👥 ${selectedCustomers.length} Customers Selected`;
  };

  const isSelected = (customerId) => {
    if (selectedCustomers.includes("all")) return true;
    return selectedCustomers.includes(String(customerId));
  };

  const customersArray = Array.isArray(customersList) ? customersList : [];

  return (
    <div ref={selectRef} style={{ position: "relative", minWidth: 260 }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "8px 12px",
          borderRadius: "0.5rem",
          border: "1px solid #e2e8f0",
          backgroundColor: "white",
          fontSize: "0.85rem",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>{getDisplayText()}</span>
        <span style={{ fontSize: 10 }}>{isOpen ? "▲" : "▼"}</span>
      </div>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            marginTop: 4,
            zIndex: 1000,
            maxHeight: 350,
            overflowY: "auto",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              fontSize: "0.7rem",
              color: "#64748b",
              textAlign: "center",
            }}
          >
            💡 Click to select/deselect multiple customers
          </div>
          <div
            onClick={() => toggleCustomer("all")}
            style={{
              padding: "10px 12px",
              cursor: "pointer",
              backgroundColor: selectedCustomers.includes("all")
                ? "#ede9fe"
                : "white",
              fontWeight: selectedCustomers.includes("all") ? 600 : 400,
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: "2px solid #8b5cf6",
                backgroundColor: selectedCustomers.includes("all")
                  ? "#8b5cf6"
                  : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {selectedCustomers.includes("all") && (
                <span style={{ color: "white", fontSize: 12 }}>✓</span>
              )}
            </div>
            <span>All Customers ({customersArray.length})</span>
          </div>
          <div style={{ borderBottom: "1px solid #e2e8f0", margin: "4px 0" }} />
          {customersArray.length === 0 ? (
            <div
              style={{ padding: "12px", color: "#94a3b8", textAlign: "center" }}
            >
              No customers available
            </div>
          ) : (
            customersArray.map((customer) => (
              <div
                key={customer.id}
                onClick={() => toggleCustomer(String(customer.id))}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  backgroundColor:
                    isSelected(customer.id) &&
                    !selectedCustomers.includes("all")
                      ? "#f3f4f6"
                      : "white",
                  fontWeight:
                    isSelected(customer.id) &&
                    !selectedCustomers.includes("all")
                      ? 600
                      : 400,
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: "2px solid #cbd5e1",
                    backgroundColor:
                      isSelected(customer.id) &&
                      !selectedCustomers.includes("all")
                        ? "#8b5cf6"
                        : "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSelected(customer.id) &&
                    !selectedCustomers.includes("all") && (
                      <span style={{ color: "white", fontSize: 12 }}>✓</span>
                    )}
                </div>
                <span>{customer.name}</span>
              </div>
            ))
          )}
          {!selectedCustomers.includes("all") &&
            selectedCustomers.length > 0 && (
              <div
                onClick={() => onChange(["all"])}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  borderTop: "1px solid #e2e8f0",
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  textAlign: "center",
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span>✕</span> Clear All ({selectedCustomers.length} selected)
              </div>
            )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================
const StatsCard = React.memo(
  ({ stat, index, hoveredCard, setHoveredCard, navigate }) => (
    <div
      style={{
        background: stat.gradient,
        padding: "1.5rem",
        borderRadius: "1rem",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform:
          hoveredCard === `order-${index}`
            ? "translateY(-5px) scale(1.02)"
            : "translateY(0)",
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {stat.changeType === "increase" ? (
                <FiArrowUp size={12} />
              ) : (
                <FiArrowDown size={12} />
              )}
              {stat.change}
            </span>
            <span
              style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)" }}
            >
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
  ),
);

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================
const SkeletonCard = () => (
  <div
    style={{
      background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
      padding: "1.5rem",
      borderRadius: "1rem",
      height: "140px",
      position: "relative",
      overflow: "hidden",
      animation: "pulse 1.5s ease-in-out infinite",
    }}
  />
);

const SkeletonChart = ({ height = 400 }) => (
  <div
    style={{
      height,
      background: "#f8fafc",
      borderRadius: "1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "pulse 1.5s ease-in-out infinite",
    }}
  >
    <div
      style={{
        width: "80%",
        height: "60%",
        background: "#e2e8f0",
        borderRadius: "0.5rem",
      }}
    />
  </div>
);

// ============================================================================
// ORDER MONTHLY CHART COMPONENT
// ============================================================================
// Enhanced OrderMonthlyChart that handles multi-customer comparison
const OrderMonthlyChart = React.memo(
  ({ data, loading, selectedMetric, multiYearData = null }) => {
    if (loading) return <SkeletonChart height={400} />;

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Check if we have multi-customer data (keys are customer names not years)
    const hasMultiCustomerData =
      multiYearData &&
      Object.keys(multiYearData).length > 0 &&
      !Object.keys(multiYearData).some((key) => key.match(/^\d{4}$/)); // Not years, so must be customers

    const hasMultiYearData =
      multiYearData &&
      Object.keys(multiYearData).length > 1 &&
      Object.keys(multiYearData).some((key) => key.match(/^\d{4}$/));

    const yearColors = {
      quantity: {
        2020: "#a78bfa",
        2021: "#8b5cf6",
        2022: "#7c3aed",
        2023: "#6d28d9",
        2024: "#5b21b6",
        2025: "#4c1d95",
        2026: "#4338ca",
      },
      value: {
        2020: "#fca5a5",
        2021: "#f87171",
        2022: "#ef4444",
        2023: "#dc2626",
        2024: "#b91c1c",
        2025: "#991b1b",
        2026: "#7f1d1d",
      },
    };

    const customerColors = [
      "#8b5cf6",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
      "#6366f1",
      "#14b8a6",
      "#f97316",
      "#d946ef",
      "#f43f5e",
      "#0ea5e9",
      "#a3e635",
      "#fb7185",
    ];

    const getYearColor = (year, type) => {
      const colors =
        type === "quantity" ? yearColors.quantity : yearColors.value;
      return colors[year] || (type === "quantity" ? "#8b5cf6" : "#ef4444");
    };

    // Build chart data for multi-customer comparison
    const buildMultiCustomerChartData = () => {
      if (!hasMultiCustomerData) return null;

      const customers = Object.keys(multiYearData);
      return months.map((month, idx) => {
        const dataPoint = { month };
        customers.forEach((customer) => {
          dataPoint[`quantity_${customer}`] =
            multiYearData[customer]?.quantities?.[idx] || 0;
          dataPoint[`value_${customer}`] =
            multiYearData[customer]?.values?.[idx] || 0;
        });
        return dataPoint;
      });
    };

    const buildMultiYearChartData = () => {
      if (!hasMultiYearData) return null;

      const years = Object.keys(multiYearData);
      return months.map((month) => ({
        month: month,
        ...years.reduce((acc, year) => {
          const yearData = multiYearData[year];
          const monthIndex = months.indexOf(month);
          acc[`quantity_${year}`] = yearData?.quantities?.[monthIndex] || 0;
          acc[`value_${year}`] = yearData?.values?.[monthIndex] || 0;
          acc[`count_${year}`] = yearData?.counts?.[monthIndex] || 0;
          return acc;
        }, {}),
      }));
    };

    const buildAggregatedChartData = () => {
      const quantities = data?.quantities || Array(12).fill(0);
      const values = data?.values || Array(12).fill(0);
      const counts = data?.counts || Array(12).fill(0);
      return months.map((month, idx) => ({
        month,
        quantity: safeNumber(quantities[idx], 0),
        value: safeNumber(values[idx], 0),
        count: safeNumber(counts[idx], 0),
      }));
    };

    let chartData;
    let isMultiCustomerMode = false;
    let comparisonItems = [];

    if (hasMultiCustomerData) {
      chartData = buildMultiCustomerChartData();
      isMultiCustomerMode = true;
      comparisonItems = Object.keys(multiYearData);
    } else if (hasMultiYearData) {
      chartData = buildMultiYearChartData();
      comparisonItems = Object.keys(multiYearData);
    } else {
      chartData = buildAggregatedChartData();
    }

    if (!chartData || chartData.length === 0) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: 400,
            color: "#64748b",
          }}
        >
          <FiBarChart2 size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p style={{ fontSize: 14, margin: 0 }}>No monthly data available</p>
        </div>
      );
    }

    // Calculate max value for domain
    let maxValue = 0;
    if (hasMultiCustomerData) {
      Object.keys(multiYearData).forEach((customer) => {
        const quantities = multiYearData[customer]?.quantities || [];
        const values = multiYearData[customer]?.values || [];
        maxValue = Math.max(maxValue, ...quantities, ...values);
      });
    } else if (hasMultiYearData) {
      Object.keys(multiYearData).forEach((year) => {
        const quantities = multiYearData[year]?.quantities || [];
        const values = multiYearData[year]?.values || [];
        maxValue = Math.max(maxValue, ...quantities, ...values);
      });
    } else {
      maxValue = Math.max(
        ...chartData.map((d) => d.quantity),
        ...chartData.map((d) => d.value),
        1,
      );
    }
    const domainMax = maxValue * 1.1;

    // Calculate totals
    let totalQuantity = 0;
    let totalValue = 0;

    if (hasMultiCustomerData) {
      Object.keys(multiYearData).forEach((customer) => {
        totalQuantity +=
          multiYearData[customer]?.quantities?.reduce(
            (s, v) => s + safeNumber(v, 0),
            0,
          ) || 0;
        totalValue +=
          multiYearData[customer]?.values?.reduce(
            (s, v) => s + safeNumber(v, 0),
            0,
          ) || 0;
      });
    } else if (hasMultiYearData) {
      Object.keys(multiYearData).forEach((year) => {
        totalQuantity +=
          multiYearData[year]?.quantities?.reduce(
            (s, v) => s + safeNumber(v, 0),
            0,
          ) || 0;
        totalValue +=
          multiYearData[year]?.values?.reduce(
            (s, v) => s + safeNumber(v, 0),
            0,
          ) || 0;
      });
    } else {
      totalQuantity = chartData.reduce((sum, item) => sum + item.quantity, 0);
      totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
    }

    // Multi-Customer or Multi-Year Tooltip
    const ComparisonTooltip = ({ active, payload, label, isCustomerMode }) => {
      if (active && payload && payload.length > 0) {
        const dataMap = {};
        payload.forEach((item) => {
          const match = item.dataKey?.match(/(quantity|value)_(.+)/);
          if (match) {
            const [, type, name] = match;
            if (!dataMap[name]) dataMap[name] = {};
            dataMap[name][type] = item.value;
          }
        });

        return (
          <div
            style={{
              backgroundColor: "white",
              padding: "12px 16px",
              borderRadius: 12,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
              maxWidth: 350,
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                marginBottom: 8,
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: 4,
              }}
            >
              {label}
            </p>
            {Object.keys(dataMap)
              .sort()
              .map((name, idx) => (
                <div key={name} style={{ marginTop: 8 }}>
                  <strong
                    style={{
                      color: isCustomerMode
                        ? customerColors[idx % customerColors.length]
                        : getYearColor(name, "quantity"),
                    }}
                  >
                    {isCustomerMode ? name : `Year ${name}`}
                  </strong>
                  {(selectedMetric === "both" ||
                    selectedMetric === "quantity") && (
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        color: "#8b5cf6",
                        fontSize: 12,
                      }}
                    >
                      📦 Quantity:{" "}
                      {(
                        safeNumber(dataMap[name].quantity) * 1000000
                      ).toLocaleString()}{" "}
                      units
                    </p>
                  )}
                  {(selectedMetric === "both" ||
                    selectedMetric === "value") && (
                    <p
                      style={{
                        margin: "2px 0 0 0",
                        color: "#ef4444",
                        fontSize: 12,
                      }}
                    >
                      💰 Value: $
                      {(
                        safeNumber(dataMap[name].value) * 1000000
                      ).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
          </div>
        );
      }
      return null;
    };

    // Regular Tooltip
    const RegularTooltip = ({ active, payload }) => {
      if (active && payload?.[0]) {
        const d = payload[0].payload;
        return (
          <div
            style={{
              backgroundColor: "white",
              padding: "12px 16px",
              borderRadius: 12,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>{d.month}</p>
            {(selectedMetric === "both" || selectedMetric === "quantity") && (
              <p style={{ margin: "8px 0 0 0", color: "#8b5cf6" }}>
                📦 Quantity:{" "}
                {(safeNumber(d.quantity) * 1000000).toLocaleString()} units
              </p>
            )}
            {(selectedMetric === "both" || selectedMetric === "value") && (
              <p style={{ margin: "4px 0 0 0", color: "#ef4444" }}>
                💰 Value: ${(safeNumber(d.value) * 1000000).toLocaleString()}
              </p>
            )}
            <p style={{ margin: "4px 0 0 0", color: "#64748b" }}>
              📋 Orders: {safeNumber(d.count)}
            </p>
          </div>
        );
      }
      return null;
    };

    // Render Multi-Customer or Multi-Year Comparison Chart
    if (hasMultiCustomerData || hasMultiYearData) {
      const items = comparisonItems;
      const isCustomerMode = hasMultiCustomerData;

      return (
        <div>
          <div style={{ minHeight: 450, width: "100%" }}>
            <ResponsiveContainer width="100%" height={450}>
              <BarChart
                data={chartData}
                margin={{ top: 50, right: 50, left: 60, bottom: 20 }}
                barGap={2}
                barCategoryGap="15%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#8b5cf6"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${safeNumber(v).toFixed(1)}M`}
                  domain={[0, domainMax]}
                  label={{
                    value: "Quantity (Units in Millions)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: "#8b5cf6" },
                    offset: -10,
                  }}
                />
                {(selectedMetric === "both" || selectedMetric === "value") && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#ef4444"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${safeNumber(v).toFixed(1)}M`}
                    domain={[0, domainMax]}
                    label={{
                      value: "Value (USD in Millions)",
                      angle: 90,
                      position: "insideRight",
                      style: { fontSize: 11, fill: "#ef4444" },
                      offset: -10,
                    }}
                  />
                )}
                <Tooltip
                  content={
                    <ComparisonTooltip isCustomerMode={isCustomerMode} />
                  }
                />
                <Legend
                  iconSize={12}
                  wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                  verticalAlign="top"
                  height={50}
                />

                {items.map((item, idx) => {
                  const bars = [];
                  const barColor = isCustomerMode
                    ? customerColors[idx % customerColors.length]
                    : getYearColor(item, "quantity");
                  const valueColor = isCustomerMode
                    ? customerColors[idx % customerColors.length]
                    : getYearColor(item, "value");
                  const displayName = isCustomerMode ? item : `Year ${item}`;

                  if (
                    selectedMetric === "both" ||
                    selectedMetric === "quantity"
                  ) {
                    bars.push(
                      <Bar
                        key={`quantity_${item}`}
                        yAxisId="left"
                        dataKey={`quantity_${item}`}
                        name={`${displayName} - Quantity`}
                        fill={barColor}
                        radius={[4, 4, 0, 0]}
                        barSize={selectedMetric === "both" ? 25 : 45}
                      >
                        <LabelList
                          dataKey={`quantity_${item}`}
                          position="top"
                          content={(props) => {
                            const { x, y, width, value } = props;
                            const safeValue = safeNumber(value);
                            if (safeValue === 0 || isNaN(y)) return null;
                            return (
                              <text
                                x={x + width / 2}
                                y={y - 8}
                                fill={barColor}
                                textAnchor="middle"
                                fontSize={9}
                                fontWeight={600}
                              >
                                {safeValue >= 1
                                  ? safeValue.toFixed(1) + "M"
                                  : (safeValue * 1000).toFixed(0) + "K"}
                              </text>
                            );
                          }}
                        />
                      </Bar>,
                    );
                  }
                  if (selectedMetric === "both" || selectedMetric === "value") {
                    bars.push(
                      <Bar
                        key={`value_${item}`}
                        yAxisId="right"
                        dataKey={`value_${item}`}
                        name={`${displayName} - Value`}
                        fill={valueColor}
                        radius={[4, 4, 0, 0]}
                        barSize={selectedMetric === "both" ? 25 : 45}
                      >
                        <LabelList
                          dataKey={`value_${item}`}
                          position="top"
                          content={(props) => {
                            const { x, y, width, value } = props;
                            const safeValue = safeNumber(value);
                            if (safeValue === 0 || isNaN(y)) return null;
                            return (
                              <text
                                x={x + width / 2}
                                y={y - 8}
                                fill={valueColor}
                                textAnchor="middle"
                                fontSize={9}
                                fontWeight={600}
                              >
                                $
                                {safeValue >= 1
                                  ? safeValue.toFixed(1) + "M"
                                  : (safeValue * 1000).toFixed(0) + "K"}
                              </text>
                            );
                          }}
                        />
                      </Bar>,
                    );
                  }
                  return bars;
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              backgroundColor: "#f8fafc",
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                Total Quantity:
              </span>{" "}
              <strong style={{ color: "#8b5cf6" }}>
                {(totalQuantity * 1000000).toLocaleString()} units
              </strong>
            </div>
            <div>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                Total Value:
              </span>{" "}
              <strong style={{ color: "#ef4444" }}>
                ${(totalValue * 1000000).toLocaleString()}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: 12, color: "#64748b" }}>Comparing:</span>{" "}
              <strong style={{ color: "#3b82f6" }}>
                {items.length} {isCustomerMode ? "customers" : "years"}
              </strong>
            </div>
          </div>
        </div>
      );
    }

    // Render Regular Single Series Chart
    return (
      <div>
        <div style={{ height: 400, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 40, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="left"
                stroke="#8b5cf6"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${safeNumber(v).toFixed(1)}M`}
                domain={[0, domainMax]}
              />
              {(selectedMetric === "both" || selectedMetric === "value") && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#ef4444"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${safeNumber(v).toFixed(1)}M`}
                  domain={[0, domainMax]}
                />
              )}
              <Tooltip content={<RegularTooltip />} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />

              {(selectedMetric === "both" || selectedMetric === "quantity") && (
                <Bar
                  yAxisId="left"
                  dataKey="quantity"
                  name="Order Quantity"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                >
                  <LabelList
                    dataKey="quantity"
                    position="top"
                    content={(props) => {
                      const { x, y, width, value } = props;
                      const safeValue = safeNumber(value);
                      if (safeValue === 0 || isNaN(y)) return null;
                      return (
                        <text
                          x={x + width / 2}
                          y={y - 8}
                          fill="#6d28d9"
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={600}
                        >
                          {safeValue >= 1
                            ? safeValue.toFixed(1) + "M"
                            : (safeValue * 1000).toFixed(0) + "K"}
                        </text>
                      );
                    }}
                  />
                </Bar>
              )}
              {(selectedMetric === "both" || selectedMetric === "value") && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="value"
                  name="Order Value"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: "#ef4444", r: 5 }}
                >
                  <LabelList
                    dataKey="value"
                    position="top"
                    content={(props) => {
                      const { cx, cy, value } = props;
                      const safeValue = safeNumber(value);
                      if (safeValue === 0 || isNaN(cy)) return null;
                      return (
                        <text
                          x={cx}
                          y={cy - 12}
                          fill="#b91c1c"
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={600}
                        >
                          $
                          {safeValue >= 1
                            ? safeValue.toFixed(1) + "M"
                            : (safeValue * 1000).toFixed(0) + "K"}
                        </text>
                      );
                    }}
                  />
                </Line>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            backgroundColor: "#f8fafc",
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Total Quantity:
            </span>{" "}
            <strong style={{ color: "#8b5cf6" }}>
              {(totalQuantity * 1000000).toLocaleString()} units
            </strong>
          </div>
          <div>
            <span style={{ fontSize: 12, color: "#64748b" }}>Total Value:</span>{" "}
            <strong style={{ color: "#ef4444" }}>
              ${(totalValue * 1000000).toLocaleString()}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Total Orders:
            </span>{" "}
            <strong style={{ color: "#3b82f6" }}>
              {chartData
                .reduce((sum, item) => sum + item.count, 0)
                .toLocaleString()}
            </strong>
          </div>
        </div>
      </div>
    );
  },
);

// ============================================================================
// YEARLY CHART COMPONENT
// ============================================================================
const YearlyChart = React.memo(({ data, loading, selectedMetric }) => {
  if (loading) return <SkeletonChart height={400} />;

  const years = data?.years || [];
  const quantities = data?.quantities || [];
  const values = data?.values || [];
  const counts = data?.counts || [];

  const chartData = years.map((year, idx) => ({
    year: year || `Year ${idx + 1}`,
    quantity: safeNumber(quantities[idx], 0),
    value: safeNumber(values[idx], 0),
    count: safeNumber(counts[idx], 0),
  }));
  const maxQuantity = Math.max(...chartData.map((d) => d.quantity), 0);
  const maxValue = Math.max(...chartData.map((d) => d.value), 0);
  const globalMax = Math.max(maxQuantity, maxValue, 1);
  const domainMax = globalMax * 1.1;

  const totalQuantity = chartData.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0 || (totalQuantity === 0 && totalValue === 0)) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
          color: "#64748b",
        }}
      >
        <FiTrendingUp size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
        <p style={{ fontSize: 14, margin: 0 }}>No yearly data available</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ height: 400, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 40, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              stroke="#3b82f6"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${safeNumber(v).toFixed(1)}M`}
              domain={[0, domainMax]}
            />
            {(selectedMetric === "both" || selectedMetric === "value") && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f59e0b"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${safeNumber(v).toFixed(1)}M`}
                domain={[0, domainMax]}
              />
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.[0]) {
                  const d = payload[0].payload;
                  return (
                    <div
                      style={{
                        backgroundColor: "white",
                        padding: "12px 16px",
                        borderRadius: 12,
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: 600 }}>{d.year}</p>
                      {(selectedMetric === "both" ||
                        selectedMetric === "quantity") && (
                        <p style={{ margin: "8px 0 0 0", color: "#3b82f6" }}>
                          📦 Quantity:{" "}
                          {(safeNumber(d.quantity) * 1000000).toLocaleString()}{" "}
                          units
                        </p>
                      )}
                      {(selectedMetric === "both" ||
                        selectedMetric === "value") && (
                        <p style={{ margin: "4px 0 0 0", color: "#f59e0b" }}>
                          💰 Value: $
                          {(safeNumber(d.value) * 1000000).toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            {(selectedMetric === "both" || selectedMetric === "quantity") && (
              <Bar
                yAxisId="left"
                dataKey="quantity"
                name="Order Quantity"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={60}
              >
                <LabelList
                  dataKey="quantity"
                  position="top"
                  content={(props) => {
                    const { x, y, width, value } = props;
                    const safeValue = safeNumber(value);
                    if (safeValue === 0 || isNaN(y)) return null;
                    return (
                      <text
                        x={x + width / 2}
                        y={y - 8}
                        fill="#1e40af"
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={600}
                      >
                        {safeValue >= 1
                          ? safeValue.toFixed(1) + "M"
                          : (safeValue * 1000).toFixed(0) + "K"}
                      </text>
                    );
                  }}
                />
              </Bar>
            )}
            {(selectedMetric === "both" || selectedMetric === "value") && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="value"
                name="Order Value"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: "#f59e0b", r: 6 }}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                  content={(props) => {
                    const { cx, cy, value } = props;
                    const safeValue = safeNumber(value);
                    if (safeValue === 0 || isNaN(cy)) return null;
                    return (
                      <text
                        x={cx}
                        y={cy - 12}
                        fill="#b45309"
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={600}
                      >
                        $
                        {safeValue >= 1
                          ? safeValue.toFixed(1) + "M"
                          : (safeValue * 1000).toFixed(0) + "K"}
                      </text>
                    );
                  }}
                />
              </Line>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div
        style={{
          marginTop: 16,
          padding: "12px 16px",
          backgroundColor: "#f8fafc",
          borderRadius: 8,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Total Quantity:
          </span>{" "}
          <strong style={{ color: "#3b82f6" }}>
            {(totalQuantity * 1000000).toLocaleString()} units
          </strong>
        </div>
        <div>
          <span style={{ fontSize: 12, color: "#64748b" }}>Total Value:</span>{" "}
          <strong style={{ color: "#f59e0b" }}>
            ${(totalValue * 1000000).toLocaleString()}
          </strong>
        </div>
        <div>
          <span style={{ fontSize: 12, color: "#64748b" }}>Years Range:</span>{" "}
          <strong style={{ color: "#8b5cf6" }}>
            {years[0]} - {years[years.length - 1]}
          </strong>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// CUSTOMER CHART COMPONENT
// ============================================================================
const CustomerChart = React.memo(
  ({ data, loading, selectedMetric, sortBy, onSortChange }) => {
    if (loading) return <SkeletonChart height={500} />;

    if (!data?.customers || data.customers.length === 0) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: 400,
            color: "#64748b",
          }}
        >
          <FiUsers size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p style={{ fontSize: 14, margin: 0 }}>No customer data available</p>
        </div>
      );
    }

    const chartData = data.customers.map((customer, idx) => ({
      customer:
        (customer || "").length > 25
          ? (customer || "").substring(0, 22) + "..."
          : customer || "Unknown",
      fullName: customer || "Unknown",
      quantity: safeNumber(data.quantities?.[idx], 0),
      value: safeNumber(data.values?.[idx], 0),
      count: safeNumber(data.counts?.[idx], 0),
    }));

    const maxQuantity = Math.max(...chartData.map((d) => d.quantity), 0);
    const maxValue = Math.max(...chartData.map((d) => d.value), 0);
    const globalMax = Math.max(maxQuantity, maxValue, 1);
    const domainMax = globalMax * 1.1;
    const totalQuantity = chartData.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div>
        <div style={{ height: 500, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 50, right: 30, left: 20, bottom: 120 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="customer"
                stroke="#64748b"
                tick={{ fontSize: 10, angle: -45, textAnchor: "end", dy: 10 }}
                interval={0}
                height={100}
              />
              <YAxis
                yAxisId="left"
                stroke="#8b5cf6"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1
                    ? safeNumber(v).toFixed(1) + "M"
                    : (safeNumber(v) * 1000).toFixed(0) + "K"
                }
                domain={[0, domainMax]}
              />
              {(selectedMetric === "both" || selectedMetric === "value") && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#ef4444"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1
                      ? `$${safeNumber(v).toFixed(1)}M`
                      : `$${(safeNumber(v) * 1000).toFixed(0)}K`
                  }
                  domain={[0, domainMax]}
                />
              )}
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    const d = payload[0].payload;
                    return (
                      <div
                        style={{
                          backgroundColor: "white",
                          padding: "12px 16px",
                          borderRadius: 12,
                          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          {d.fullName}
                        </p>
                        {(selectedMetric === "both" ||
                          selectedMetric === "quantity") && (
                          <p style={{ margin: "8px 0 0 0", color: "#8b5cf6" }}>
                            📦 Quantity:{" "}
                            {(
                              safeNumber(d.quantity) * 1000000
                            ).toLocaleString()}{" "}
                            units
                          </p>
                        )}
                        {(selectedMetric === "both" ||
                          selectedMetric === "value") && (
                          <p style={{ margin: "4px 0 0 0", color: "#ef4444" }}>
                            💰 Value: $
                            {(safeNumber(d.value) * 1000000).toLocaleString()}
                          </p>
                        )}
                        <p style={{ margin: "4px 0 0 0", color: "#64748b" }}>
                          📋 Orders: {safeNumber(d.count)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                iconSize={10}
                wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                verticalAlign="top"
                height={36}
              />
              {(selectedMetric === "both" || selectedMetric === "quantity") && (
                <Bar
                  yAxisId="left"
                  dataKey="quantity"
                  name="Order Quantity"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  barSize={45}
                >
                  <LabelList
                    dataKey="quantity"
                    position="top"
                    content={(props) => {
                      const { x, y, width, value } = props;
                      const safeValue = safeNumber(value);
                      if (safeValue === 0 || isNaN(y)) return null;
                      return (
                        <text
                          x={x + width / 2}
                          y={y - 8}
                          fill="#6d28d9"
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight={600}
                        >
                          {safeValue >= 1
                            ? safeValue.toFixed(1) + "M"
                            : (safeValue * 1000).toFixed(0) + "K"}
                        </text>
                      );
                    }}
                  />
                </Bar>
              )}
              {(selectedMetric === "both" || selectedMetric === "value") && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="value"
                  name="Order Value"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{
                    fill: "#ef4444",
                    r: 5,
                    strokeWidth: 2,
                    stroke: "white",
                  }}
                  activeDot={{ r: 7 }}
                >
                  <LabelList
                    dataKey="value"
                    position="top"
                    content={(props) => {
                      const { cx, cy, value } = props;
                      const safeValue = safeNumber(value);
                      if (safeValue === 0 || isNaN(cy)) return null;
                      return (
                        <text
                          x={cx}
                          y={cy - 12}
                          fill="#b91c1c"
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight={600}
                        >
                          $
                          {safeValue >= 1
                            ? safeValue.toFixed(1) + "M"
                            : (safeValue * 1000).toFixed(0) + "K"}
                        </text>
                      );
                    }}
                  />
                </Line>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            backgroundColor: "#f8fafc",
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Total Customers:
            </span>{" "}
            <strong style={{ fontSize: 14, color: "#8b5cf6" }}>
              {data.customers.length}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Total Quantity:
            </span>{" "}
            <strong style={{ fontSize: 14, color: "#8b5cf6" }}>
              {(totalQuantity * 1000000).toLocaleString()} units
            </strong>
          </div>
          <div>
            <span style={{ fontSize: 12, color: "#64748b" }}>Total Value:</span>{" "}
            <strong style={{ fontSize: 14, color: "#ef4444" }}>
              ${(totalValue * 1000000).toLocaleString()}
            </strong>
          </div>
        </div>
      </div>
    );
  },
);

// ============================================================================
// GARMENT CUSTOMER COMPARISON CHART - FIXED VERSION
// ============================================================================
const GarmentCustomerComparisonChart = React.memo(
  ({
    data,
    loading,
    selectedYears,
    selectedCustomers,
    onYearChange,
    onCustomerChange,
    availableYears,
  }) => {
    if (loading) return <SkeletonChart height={450} />;

    const garmentCustomerData = data?.garmentCustomerData || [];

    if (garmentCustomerData.length === 0) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: 450,
            color: "#64748b",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <FiPieChart size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>
            No customer comparison data available
          </p>
          <p style={{ fontSize: 12, marginTop: 8, color: "#94a3b8" }}>
            Try selecting different years or customers
          </p>
        </div>
      );
    }

    const garmentDisplayNames = {
      knit: "Knit",
      woven: "Woven",
      sweater: "Sweater",
      underwear: "Underwear",
    };
    const garments = [
      ...new Set(garmentCustomerData.map((item) => item.garment)),
    ];
    const allCustomersFromData = [
      ...new Set(garmentCustomerData.map((item) => item.customerName)),
    ];
    const customersDropdownList = data?.customers || [];

    // FIXED: Better handling of customer selection
    let customersToShow = [];
    const isAllSelected = selectedCustomers.includes("all");

    if (isAllSelected) {
      customersToShow = allCustomersFromData;
    } else if (selectedCustomers && selectedCustomers.length > 0) {
      // Convert selected customer IDs to names
      const selectedNames = selectedCustomers
        .map((customerId) => {
          const customer = customersDropdownList.find(
            (c) => String(c.id) === String(customerId),
          );
          return customer ? customer.name : null;
        })
        .filter((name) => name !== null);

      customersToShow = allCustomersFromData.filter((customer) =>
        selectedNames.includes(customer),
      );

      // If no match, fallback to all customers
      if (customersToShow.length === 0 && allCustomersFromData.length > 0) {
        customersToShow = allCustomersFromData;
      }
    }

    if (customersToShow.length === 0 && allCustomersFromData.length > 0) {
      customersToShow = allCustomersFromData;
    }

    const chartData = garments.map((garment) => {
      const dataPoint = {
        garment: garmentDisplayNames[garment] || garment,
        fullGarmentName: garment,
      };
      customersToShow.forEach((customer) => {
        const item = garmentCustomerData.find(
          (d) => d.garment === garment && d.customerName === customer,
        );
        dataPoint[customer] = item ? safeNumber(item.avgUnitPrice, 0) : 0;
      });
      return dataPoint;
    });

    const colors = [
      "#8b5cf6",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
    ];
    let maxPrice = 0;
    chartData.forEach((item) => {
      customersToShow.forEach((customer) => {
        maxPrice = Math.max(maxPrice, item[customer] || 0);
      });
    });
    const domainMax = maxPrice * 1.2 || 10;

    return (
      <div>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
            alignItems: "center",
            padding: "12px 16px",
            backgroundColor: "#f8fafc",
            borderRadius: "0.75rem",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FiCalendar size={14} color="#64748b" />
            <span
              style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}
            >
              Filter:
            </span>
          </div>
          <MultiYearSelect
            selectedYears={selectedYears}
            onChange={onYearChange}
            availableYears={availableYears}
          />
          <MultiCustomerSelect
            selectedCustomers={selectedCustomers}
            onChange={onCustomerChange}
            customersList={customersDropdownList}
          />
          {customersToShow.length > 0 && (
            <div
              style={{
                marginLeft: "auto",
                fontSize: "0.8rem",
                color: "#10b981",
                backgroundColor: "#d1fae5",
                padding: "4px 12px",
                borderRadius: "20px",
                fontWeight: 500,
              }}
            >
              📊 Comparing {customersToShow.length} customer
              {customersToShow.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {customersToShow.length > 0 && chartData.length > 0 ? (
          <div style={{ height: 450, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 50, right: 50, left: 60, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="garment"
                  stroke="#64748b"
                  tick={{ fontSize: 12, fontWeight: 500 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#10b981"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${safeNumber(v).toFixed(2)}`}
                  domain={[0, domainMax]}
                  label={{
                    value: "Average Unit Price (USD)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12, fill: "#10b981", fontWeight: 500 },
                    offset: -15,
                  }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length > 0) {
                      return (
                        <div
                          style={{
                            backgroundColor: "white",
                            padding: "12px 16px",
                            borderRadius: 12,
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <p
                            style={{ margin: 0, fontWeight: 700, fontSize: 14 }}
                          >
                            {label}
                          </p>
                          {payload.map((entry, idx) => (
                            <div key={idx} style={{ marginTop: 8 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 2,
                                    backgroundColor: entry.color,
                                  }}
                                />
                                <span style={{ fontWeight: 600 }}>
                                  {entry.name}
                                </span>
                                <strong style={{ color: entry.color }}>
                                  ${entry.value?.toFixed(2)}
                                </strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  iconSize={12}
                  wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                  verticalAlign="top"
                  height={50}
                />
                {customersToShow.map((customer, idx) => (
                  <Bar
                    key={customer}
                    dataKey={customer}
                    name={
                      customer.length > 20
                        ? customer.substring(0, 17) + "..."
                        : customer
                    }
                    fill={colors[idx % colors.length]}
                    radius={[6, 6, 0, 0]}
                    barSize={45}
                  >
                    <LabelList
                      dataKey={customer}
                      position="top"
                      content={(props) => {
                        const { x, y, width, value } = props;
                        const val = safeNumber(value);
                        if (val === 0 || isNaN(y)) return null;
                        return (
                          <text
                            x={x + width / 2}
                            y={y - 8}
                            fill={colors[idx % colors.length]}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight={700}
                          >
                            ${val.toFixed(2)}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 400,
            }}
          >
            <p style={{ color: "#64748b" }}>
              Select customers to compare unit prices...
            </p>
          </div>
        )}
      </div>
    );
  },
);

const addStyles = () => {
  if (!document.getElementById("dashboard-styles")) {
    const style = document.createElement("style");
    style.id = "dashboard-styles";
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`;
    document.head.appendChild(style);
  }
};

// ============================================================================
// MAIN DASHBOARD COMPONENT - OPTIMIZED
// ============================================================================
const DashboardPage = () => {
  const navigate = useNavigate();
  const initialLoadDone = useRef(false);

  // Data states with cache
  const [dashboardData, setDashboardData] = useState(
    () => getCachedData("dashboard") || null,
  );
  const [orderMonthlyData, setOrderMonthlyData] = useState(
    () =>
      getCachedData("order_monthly") || {
        months: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        quantities: Array(12).fill(0),
        values: Array(12).fill(0),
        counts: Array(12).fill(0),
      },
  );
  const [multiYearMonthlyData, setMultiYearMonthlyData] = useState(null);
  const [yearlyData, setYearlyData] = useState(
    () =>
      getCachedData("yearly") || {
        years: [],
        quantities: [],
        values: [],
        counts: [],
        customers: [],
        availableYears: [],
      },
  );
  const [customerData, setCustomerData] = useState(
    () =>
      getCachedData("customer") || {
        customers: [],
        quantities: [],
        values: [],
        counts: [],
        availableYears: [],
      },
  );
  const [garmentData, setGarmentData] = useState(
    () =>
      getCachedData("garment") || {
        garments: [],
        customers: [],
        garmentCustomerData: [],
        availableYears: [],
      },
  );

  const [availableYearsList, setAvailableYearsList] = useState(
    () => getCachedData("available_years") || [],
  );
  const [masterCustomerList, setMasterCustomerList] = useState(
    () => getCachedData("master_customer_list") || [],
  );
  const [availableCustomerYears, setAvailableCustomerYears] = useState(
    () => getCachedData("available_customer_years") || [],
  );

  // Loading states
  const [loading, setLoading] = useState(!dashboardData);
  const [loadingMonthly, setLoadingMonthly] = useState(
    !orderMonthlyData?.quantities?.[0],
  );
  const [loadingYearly, setLoadingYearly] = useState(
    !yearlyData?.years?.length,
  );
  const [loadingCustomer, setLoadingCustomer] = useState(
    !customerData?.customers?.length,
  );
  const [loadingGarment, setLoadingGarment] = useState(
    !garmentData?.garmentCustomerData?.length,
  );

  // Filter states
  const [selectedYears, setSelectedYears] = useState(["all"]);
  const [selectedYearsForYearly, setSelectedYearsForYearly] = useState(["all"]);
  const [selectedYearsForGarment, setSelectedYearsForGarment] = useState([
    "all",
  ]);
  const [selectedYearsForCustomer, setSelectedYearsForCustomer] = useState([
    "all",
  ]);
  const [selectedCustomers, setSelectedCustomers] = useState(["all"]);
  const [selectedYearlyCustomers, setSelectedYearlyCustomers] = useState([
    "all",
  ]);
  const [selectedGarmentCustomers, setSelectedGarmentCustomers] = useState([
    "all",
  ]);
  const [selectedCustomerCustomers, setSelectedCustomerCustomers] = useState([
    "all",
  ]);
  const [selectedMetric, setSelectedMetric] = useState("both");
  const [selectedYearlyMetric, setSelectedYearlyMetric] = useState("both");
  const [selectedCustomerGraphMetric, setSelectedCustomerGraphMetric] =
    useState("both");
  const [sortBy, setSortBy] = useState("quantity");
  const [hoveredCard, setHoveredCard] = useState(null);

  const API_BASE_URL = "http://119.148.51.38:8000/api/merchandiser/api";
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    addStyles();
  }, []);

  const getAuthHeaders = useCallback(() => {
    const token = getToken();
    return {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    };
  }, []);

  // ========== FETCH MASTER CUSTOMER LIST ==========
  const fetchMasterCustomerList = useCallback(async () => {
    const cached = getCachedData("master_customer_list");
    if (cached && cached.length > 0) {
      setMasterCustomerList(cached);
      return cached;
    }
    try {
      const response = await getCustomers(1, 1000, true);
      if (response.data && response.data.length > 0) {
        const mappedCustomers = response.data.map((c) => ({
          id: c.id,
          name: c.customer_name || c.hrms_customer_name || `Customer ${c.id}`,
        }));
        mappedCustomers.sort((a, b) => a.name.localeCompare(b.name));
        setMasterCustomerList(mappedCustomers);
        setCachedData("master_customer_list", mappedCustomers);
        return mappedCustomers;
      }
    } catch (error) {
      console.error("Error fetching master customer list:", error);
    }
    return [];
  }, []);

  // ========== FETCH AVAILABLE YEARS ==========
  const fetchAvailableYears = useCallback(async () => {
    const cached = getCachedData("available_years");
    if (cached && cached.length > 0) {
      setAvailableYearsList(cached);
      return cached;
    }
    try {
      // Get years from orders
      const response = await axios.get(
        `${API_BASE_URL}/orders/yearly-data/`,
        getAuthHeaders(),
      );
      if (response.data?.success && response.data.data?.availableYears) {
        const years = response.data.data.availableYears;
        setAvailableYearsList(years);
        setCachedData("available_years", years);
        return years;
      }
    } catch (error) {
      console.error("Error fetching available years:", error);
    }
    // Fallback years
    const fallbackYears = ["2024", "2023", "2022", "2021", "2020"];
    setAvailableYearsList(fallbackYears);
    return fallbackYears;
  }, [getAuthHeaders]);

  // ========== FETCH DASHBOARD STATS ONLY (Fast) ==========
  const fetchDashboardStats = useCallback(async () => {
    const cached = getCachedData("dashboard_stats");
    if (cached) {
      setDashboardData(cached);
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(
        `${API_BASE_URL}/dashboard/data/`,
        getAuthHeaders(),
      );
      if (response.data?.success) {
        const data = response.data.data;
        const statsData = {
          totalInquiries: safeNumber(data.totalInquiries, 0),
          totalOrderQuantityAll: safeNumber(data.totalOrderQuantityAll, 0),
          totalOrderQuantityConfirmed: safeNumber(
            data.totalOrderQuantityConfirmed,
            0,
          ),
          totalOrderValueAll: safeNumber(data.totalOrderValueAll, 0),
          totalOrderValueConfirmed: safeNumber(
            data.totalOrderValueConfirmed,
            0,
          ),
          statusBreakdown: data.statusBreakdown || {
            pending: 0,
            quoted: 0,
            confirmed: 0,
          },
          garmentBreakdown: data.garmentBreakdown || {},
          recentInquiries: safeNumber(data.recentInquiries, 0),
          supplierStats: data.supplierStats || { total: 0, active: 0 },
          customerStats: data.customerStats || {
            totalCustomers: 0,
            totalBuyers: 0,
          },
          orderStats: data.orderStats || {},
        };
        setDashboardData(statsData);
        setCachedData("dashboard_stats", statsData);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
    setLoading(false);
  }, [getAuthHeaders]);

  // ========== FETCH ALL CHART DATA IN PARALLEL ==========
  const fetchChartData = useCallback(async () => {
    // Monthly data
    const monthlyCached = getCachedData("order_monthly");
    if (monthlyCached && monthlyCached.quantities?.some((v) => v > 0)) {
      setOrderMonthlyData(monthlyCached);
      setLoadingMonthly(false);
    } else {
      setLoadingMonthly(true);
      try {
        const result = await getOrderMonthlyData("all", null);
        if (result?.success && result.data) {
          const monthly = {
            months: result.data.months || [],
            quantities: (result.data.quantities || []).map((v) =>
              safeNumber(v, 0),
            ),
            values: (result.data.values || []).map((v) => safeNumber(v, 0)),
            counts: (result.data.counts || []).map((v) => safeNumber(v, 0)),
            availableYears: result.data.availableYears || [],
            customers: result.data.customers || [],
          };
          setOrderMonthlyData(monthly);
          setCachedData("order_monthly", monthly);
        }
      } catch (error) {
        console.error("Error fetching monthly data:", error);
      }
      setLoadingMonthly(false);
    }

    // Yearly data
    const yearlyCached = getCachedData("yearly");
    if (yearlyCached && yearlyCached.years?.length > 0) {
      setYearlyData(yearlyCached);
      setLoadingYearly(false);
    } else {
      setLoadingYearly(true);
      try {
        const result = await getOrderYearlyData("all", null);
        if (result?.success && result.data) {
          const yearly = {
            years: result.data.years || [],
            quantities: (result.data.quantities || []).map((v) =>
              safeNumber(v, 0),
            ),
            values: (result.data.values || []).map((v) => safeNumber(v, 0)),
            counts: (result.data.counts || []).map((v) => safeNumber(v, 0)),
            customers: result.data.customers || [],
            availableYears: result.data.availableYears || [],
          };
          setYearlyData(yearly);
          setCachedData("yearly", yearly);
        }
      } catch (error) {
        console.error("Error fetching yearly data:", error);
      }
      setLoadingYearly(false);
    }

    // Customer data
    const customerCached = getCachedData("customer");
    if (customerCached && customerCached.customers?.length > 0) {
      setCustomerData(customerCached);
      setLoadingCustomer(false);
    } else {
      setLoadingCustomer(true);
      try {
        const result = await getCustomerData("all", null);
        if (result?.success && result.data) {
          const rawData = result.data;
          const combined = (rawData.customers || []).map((c, i) => ({
            customer: c,
            quantity: safeNumber(rawData.quantities?.[i], 0) / 1000000,
            value: safeNumber(rawData.values?.[i], 0) / 1000000,
            count: safeNumber(rawData.counts?.[i], 0),
          }));
          if (sortBy === "quantity")
            combined.sort((a, b) => b.quantity - a.quantity);
          else if (sortBy === "value")
            combined.sort((a, b) => b.value - a.value);
          else combined.sort((a, b) => b.count - a.count);

          const customerDataObj = {
            customers: combined.map((c) => c.customer),
            quantities: combined.map((c) => c.quantity),
            values: combined.map((c) => c.value),
            counts: combined.map((c) => c.count),
            availableYears: rawData.availableYears || [],
          };
          setCustomerData(customerDataObj);
          setCachedData("customer", customerDataObj);
          if (rawData.availableYears?.length) {
            setAvailableCustomerYears(rawData.availableYears);
            setCachedData("available_customer_years", rawData.availableYears);
          }
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      }
      setLoadingCustomer(false);
    }

    // Garment data - FIXED: Ensure we have master customer list first
    const garmentCached = getCachedData("garment");
    if (garmentCached && garmentCached.garmentCustomerData?.length > 0) {
      setGarmentData(garmentCached);
      setLoadingGarment(false);
    } else {
      setLoadingGarment(true);
      try {
        // Wait for master customer list if not loaded
        let customers = masterCustomerList;
        if (customers.length === 0) {
          customers = await fetchMasterCustomerList();
        }

        const result = await getGarmentCustomerComparison("all", null);
        if (result?.success && result.data) {
          const garmentCustomerData = [];
          if (result.data.data && Array.isArray(result.data.data)) {
            for (const item of result.data.data) {
              garmentCustomerData.push({
                garment: item.garment,
                customerId: item.customer_id,
                customerName: item.customer_name,
                avgUnitPrice: safeNumber(item.avg_unit_price, 0),
                totalQuantity: safeNumber(item.total_quantity, 0),
                totalValue: safeNumber(item.total_value, 0),
              });
            }
          }
          const garmentDataObj = {
            garments: result.data.garments || [],
            customers: customers,
            garmentCustomerData: garmentCustomerData,
            availableYears: result.data.availableYears || [],
          };
          setGarmentData(garmentDataObj);
          setCachedData("garment", garmentDataObj);
        }
      } catch (error) {
        console.error("Error fetching garment data:", error);
      }
      setLoadingGarment(false);
    }
  }, [fetchMasterCustomerList, masterCustomerList, sortBy]);

  // ========== INITIAL LOAD - PARALLEL FETCHING ==========
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;

      // Fetch all data in parallel (non-blocking)
      fetchAvailableYears();
      fetchDashboardStats();
      fetchMasterCustomerList();
      fetchChartData();
    }
  }, [
    fetchAvailableYears,
    fetchDashboardStats,
    fetchMasterCustomerList,
    fetchChartData,
  ]);

  // ========== FILTER HANDLERS ==========
  const handleYearSelection = useCallback(
    async (years, type) => {
      if (type === "monthly") {
        setSelectedYears(years);
        setLoadingMonthly(true);
        const hasMultipleYears = !years.includes("all") && years.length > 1;
        if (hasMultipleYears) {
          const multiYearData = {};
          for (const year of years) {
            const result = await getOrderMonthlyData([year], selectedCustomers);
            if (result?.success && result.data) {
              multiYearData[year] = {
                quantities: result.data.quantities || [],
                values: result.data.values || [],
                counts: result.data.counts || [],
              };
            }
          }
          setMultiYearMonthlyData(multiYearData);
          setOrderMonthlyData(null);
        } else {
          const yearsParam = years.includes("all") ? "all" : years.join("|");
          const result = await getOrderMonthlyData(
            yearsParam,
            selectedCustomers,
          );
          if (result?.success && result.data) {
            setOrderMonthlyData({
              months: result.data.months || [],
              quantities: (result.data.quantities || []).map((v) =>
                safeNumber(v, 0),
              ),
              values: (result.data.values || []).map((v) => safeNumber(v, 0)),
              counts: (result.data.counts || []).map((v) => safeNumber(v, 0)),
            });
            setMultiYearMonthlyData(null);
          }
        }
        setLoadingMonthly(false);
      } else if (type === "yearly") {
        setSelectedYearsForYearly(years);
        setLoadingYearly(true);
        const yearsParam = years.includes("all") ? "all" : years.join("|");
        const result = await getOrderYearlyData(
          yearsParam,
          selectedYearlyCustomers,
        );
        if (result?.success && result.data) {
          setYearlyData({
            years: result.data.years || [],
            quantities: (result.data.quantities || []).map((v) =>
              safeNumber(v, 0),
            ),
            values: (result.data.values || []).map((v) => safeNumber(v, 0)),
            counts: (result.data.counts || []).map((v) => safeNumber(v, 0)),
          });
        }
        setLoadingYearly(false);
      } else if (type === "garment") {
        setSelectedYearsForGarment(years);
        setLoadingGarment(true);
        const yearsParam = years.includes("all") ? "all" : years.join("|");
        const result = await getGarmentCustomerComparison(
          yearsParam,
          selectedGarmentCustomers,
        );
        if (result?.success && result.data) {
          const garmentCustomerData = [];
          if (result.data.data && Array.isArray(result.data.data)) {
            for (const item of result.data.data) {
              garmentCustomerData.push({
                garment: item.garment,
                customerId: item.customer_id,
                customerName: item.customer_name,
                avgUnitPrice: safeNumber(item.avg_unit_price, 0),
                totalQuantity: safeNumber(item.total_quantity, 0),
                totalValue: safeNumber(item.total_value, 0),
              });
            }
          }
          setGarmentData((prev) => ({ ...prev, garmentCustomerData }));
        }
        setLoadingGarment(false);
      } else if (type === "customer") {
        setSelectedYearsForCustomer(years);
        setLoadingCustomer(true);
        const yearsParam = years.includes("all") ? "all" : years.join("|");
        const result = await getCustomerData(
          yearsParam,
          selectedCustomerCustomers,
        );
        if (result?.success && result.data) {
          const rawData = result.data;
          const combined = (rawData.customers || []).map((c, i) => ({
            customer: c,
            quantity: safeNumber(rawData.quantities?.[i], 0) / 1000000,
            value: safeNumber(rawData.values?.[i], 0) / 1000000,
            count: safeNumber(rawData.counts?.[i], 0),
          }));
          if (sortBy === "quantity")
            combined.sort((a, b) => b.quantity - a.quantity);
          else if (sortBy === "value")
            combined.sort((a, b) => b.value - a.value);
          else combined.sort((a, b) => b.count - a.count);

          setCustomerData({
            customers: combined.map((c) => c.customer),
            quantities: combined.map((c) => c.quantity),
            values: combined.map((c) => c.value),
            counts: combined.map((c) => c.count),
            availableYears: rawData.availableYears || [],
          });
          if (rawData.availableYears?.length)
            setAvailableCustomerYears(rawData.availableYears);
        }
        setLoadingCustomer(false);
      }
    },
    [
      selectedCustomers,
      selectedYearlyCustomers,
      selectedGarmentCustomers,
      selectedCustomerCustomers,
      sortBy,
    ],
  );

  const handleCustomerSelection = useCallback(
    async (customerIds, type) => {
      if (type === "garment") {
        setSelectedGarmentCustomers(customerIds);
        setLoadingGarment(true);
        const yearsParam = selectedYearsForGarment.includes("all")
          ? "all"
          : selectedYearsForGarment.join("|");
        const result = await getGarmentCustomerComparison(
          yearsParam,
          customerIds,
        );
        if (result?.success && result.data) {
          const garmentCustomerData = [];
          if (result.data.data && Array.isArray(result.data.data)) {
            for (const item of result.data.data) {
              garmentCustomerData.push({
                garment: item.garment,
                customerId: item.customer_id,
                customerName: item.customer_name,
                avgUnitPrice: safeNumber(item.avg_unit_price, 0),
              });
            }
          }
          setGarmentData((prev) => ({ ...prev, garmentCustomerData }));
        }
        setLoadingGarment(false);
      }
      if (type === "monthly") {
        setSelectedCustomers(customerIds);
        setLoadingMonthly(true);
        const yearsParam = selectedYears.includes("all")
          ? "all"
          : selectedYears.join("|");
        const result = await getOrderMonthlyData(yearsParam, customerIds);
        if (result?.success && result.data) {
          setOrderMonthlyData({
            months: result.data.months || [],
            quantities: (result.data.quantities || []).map((v) =>
              safeNumber(v, 0),
            ),
            values: (result.data.values || []).map((v) => safeNumber(v, 0)),
            counts: (result.data.counts || []).map((v) => safeNumber(v, 0)),
          });
        }
        setLoadingMonthly(false);
      }
      if (type === "yearly") {
        setSelectedYearlyCustomers(customerIds);
        setLoadingYearly(true);
        const yearsParam = selectedYearsForYearly.includes("all")
          ? "all"
          : selectedYearsForYearly.join("|");
        const result = await getOrderYearlyData(yearsParam, customerIds);
        if (result?.success && result.data) {
          setYearlyData({
            years: result.data.years || [],
            quantities: (result.data.quantities || []).map((v) =>
              safeNumber(v, 0),
            ),
            values: (result.data.values || []).map((v) => safeNumber(v, 0)),
            counts: (result.data.counts || []).map((v) => safeNumber(v, 0)),
          });
        }
        setLoadingYearly(false);
      }
      if (type === "customer") {
        setSelectedCustomerCustomers(customerIds);
        setLoadingCustomer(true);
        const yearsParam = selectedYearsForCustomer.includes("all")
          ? "all"
          : selectedYearsForCustomer.join("|");
        const result = await getCustomerData(yearsParam, customerIds);
        if (result?.success && result.data) {
          const rawData = result.data;
          const combined = (rawData.customers || []).map((c, i) => ({
            customer: c,
            quantity: safeNumber(rawData.quantities?.[i], 0) / 1000000,
            value: safeNumber(rawData.values?.[i], 0) / 1000000,
            count: safeNumber(rawData.counts?.[i], 0),
          }));
          if (sortBy === "quantity")
            combined.sort((a, b) => b.quantity - a.quantity);
          else if (sortBy === "value")
            combined.sort((a, b) => b.value - a.value);
          else combined.sort((a, b) => b.count - a.count);

          setCustomerData({
            customers: combined.map((c) => c.customer),
            quantities: combined.map((c) => c.quantity),
            values: combined.map((c) => c.value),
            counts: combined.map((c) => c.count),
            availableYears: rawData.availableYears || [],
          });
        }
        setLoadingCustomer(false);
      }
    },
    [
      selectedYears,
      selectedYearsForYearly,
      selectedYearsForCustomer,
      selectedYearsForGarment,
      sortBy,
    ],
  );

  const handleSortChange = useCallback(
    (sortType) => {
      setSortBy(sortType);
      if (customerData.customers?.length) {
        const combined = customerData.customers.map((c, i) => ({
          customer: c,
          quantity: customerData.quantities[i] || 0,
          value: customerData.values[i] || 0,
          count: customerData.counts[i] || 0,
        }));
        if (sortType === "quantity")
          combined.sort((a, b) => b.quantity - a.quantity);
        else if (sortType === "value")
          combined.sort((a, b) => b.value - a.value);
        else combined.sort((a, b) => b.count - a.count);
        setCustomerData((prev) => ({
          ...prev,
          customers: combined.map((c) => c.customer),
          quantities: combined.map((c) => c.quantity),
          values: combined.map((c) => c.value),
          counts: combined.map((c) => c.count),
        }));
      }
    },
    [customerData],
  );

  const refreshAllData = useCallback(() => {
    clearCache();
    // Reset all data
    setDashboardData(null);
    setOrderMonthlyData(null);
    setYearlyData(null);
    setCustomerData(null);
    setGarmentData(null);
    setAvailableYearsList([]);
    setMasterCustomerList([]);
    // Refetch
    fetchAvailableYears();
    fetchDashboardStats();
    fetchMasterCustomerList();
    fetchChartData();
  }, [
    fetchAvailableYears,
    fetchDashboardStats,
    fetchMasterCustomerList,
    fetchChartData,
  ]);

  const orderStats = useMemo(() => {
    const stats = dashboardData?.orderStats || {};
    const runningOrders =
      stats.statusBreakdown?.running || stats.statusBreakdown?.active || 0;
    const totalOrderValue = safeNumber(stats.totalOrderValue, 0);
    const shippedValue = safeNumber(stats.shippedValue, 0);
    return [
      {
        title: "Total Orders",
        value: safeNumber(stats.totalOrders, 0).toLocaleString(),
        icon: <FiShoppingBag size={24} />,
        link: "/orders",
        gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        changeType: "increase",
        change: "",
        description: "",
      },
      {
        title: "Order Value",
        value:
          totalOrderValue > 0
            ? `$${(totalOrderValue / 1000000).toFixed(1)}M`
            : "$0",
        icon: <FiDollarSign size={24} />,
        link: "/orders",
        gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        changeType: "increase",
        change: "",
        description: "",
      },
      {
        title: "Shipped Value",
        value:
          shippedValue > 0 ? `$${(shippedValue / 1000000).toFixed(1)}M` : "$0",
        icon: <FiTruck size={24} />,
        link: "/orders?status=Shipped",
        gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        changeType: "increase",
        change: "",
        description: "",
      },
      {
        title: "Active Orders",
        value: `${runningOrders}`,
        icon: <FiActivity size={24} />,
        link: "/orders?status=Running",
        gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
        change: `${Math.round((runningOrders / (stats.totalOrders || 1)) * 100)}%`,
        changeType: "increase",
        description: "of total orders",
      },
    ];
  }, [dashboardData]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#f0f2f5",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, overflow: "auto", padding: "0 1.5rem" }}>
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
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                margin: 0,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ORDER Dashboard
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                color: "#64748b",
                margin: "0.5rem 0 0 0",
              }}
            >
              Track orders, customers, and garment performance
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={refreshAllData}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0.5rem 1rem",
                borderRadius: "2rem",
                border: "1px solid #e2e8f0",
                backgroundColor: "white",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              <FiRefreshCw size={16} /> Refresh
            </button>
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
          </div>
        </header>

        <h3
          style={{
            marginBottom: "1rem",
            fontSize: "1rem",
            color: "#64748b",
            fontWeight: 600,
          }}
        >
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
          {loading || !dashboardData
            ? Array(4)
                .fill()
                .map((_, i) => <SkeletonCard key={i} />)
            : orderStats.map((stat, index) => (
                <StatsCard
                  key={index}
                  stat={stat}
                  index={index}
                  hoveredCard={hoveredCard}
                  setHoveredCard={setHoveredCard}
                  navigate={navigate}
                />
              ))}
        </div>

        {/* Monthly Order Chart */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: 12,
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
                gap: 8,
              }}
            >
              <FiBarChart2 color="#8b5cf6" /> Order Quantity & Value by Month
            </h3>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <MultiYearSelect
                selectedYears={selectedYears}
                onChange={(years) => handleYearSelection(years, "monthly")}
                availableYears={availableYearsList}
              />
              <MultiCustomerSelect
                selectedCustomers={selectedCustomers}
                onChange={(customers) =>
                  handleCustomerSelection(customers, "monthly")
                }
                customersList={masterCustomerList}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setSelectedMetric("both")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "0.5rem",
                    border:
                      selectedMetric === "both"
                        ? "2px solid #8b5cf6"
                        : "1px solid #e2e8f0",
                    backgroundColor:
                      selectedMetric === "both" ? "#ede9fe" : "white",
                    color: selectedMetric === "both" ? "#6d28d9" : "#64748b",
                  }}
                >
                  Both
                </button>
                <button
                  onClick={() => setSelectedMetric("quantity")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "0.5rem",
                    border:
                      selectedMetric === "quantity"
                        ? "2px solid #10b981"
                        : "1px solid #e2e8f0",
                    backgroundColor:
                      selectedMetric === "quantity" ? "#d1fae5" : "white",
                    color:
                      selectedMetric === "quantity" ? "#047857" : "#64748b",
                  }}
                >
                  Quantity
                </button>
                <button
                  onClick={() => setSelectedMetric("value")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "0.5rem",
                    border:
                      selectedMetric === "value"
                        ? "2px solid #ef4444"
                        : "1px solid #e2e8f0",
                    backgroundColor:
                      selectedMetric === "value" ? "#fee2e2" : "white",
                    color: selectedMetric === "value" ? "#b91c1c" : "#64748b",
                  }}
                >
                  Value
                </button>
              </div>
            </div>
          </div>
          <OrderMonthlyChart
            data={orderMonthlyData}
            loading={loadingMonthly}
            selectedMetric={selectedMetric}
            multiYearData={multiYearMonthlyData}
          />
        </div>

        {/* Yearly Order Chart */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: 12,
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
                gap: 8,
              }}
            >
              <FiTrendingUp color="#10b981" /> Order Quantity & Value by Year
            </h3>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <MultiYearSelect
                selectedYears={selectedYearsForYearly}
                onChange={(years) => handleYearSelection(years, "yearly")}
                availableYears={
                  yearlyData.availableYears?.length
                    ? yearlyData.availableYears
                    : availableYearsList
                }
              />
              <MultiCustomerSelect
                selectedCustomers={selectedYearlyCustomers}
                onChange={(customers) =>
                  handleCustomerSelection(customers, "yearly")
                }
                customersList={masterCustomerList}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setSelectedYearlyMetric("both")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "0.5rem",
                    border:
                      selectedYearlyMetric === "both"
                        ? "2px solid #10b981"
                        : "1px solid #e2e8f0",
                    backgroundColor:
                      selectedYearlyMetric === "both" ? "#d1fae5" : "white",
                    color:
                      selectedYearlyMetric === "both" ? "#047857" : "#64748b",
                  }}
                >
                  Both
                </button>
                <button
                  onClick={() => setSelectedYearlyMetric("quantity")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "0.5rem",
                    border:
                      selectedYearlyMetric === "quantity"
                        ? "2px solid #3b82f6"
                        : "1px solid #e2e8f0",
                    backgroundColor:
                      selectedYearlyMetric === "quantity" ? "#dbeafe" : "white",
                    color:
                      selectedYearlyMetric === "quantity"
                        ? "#1e40af"
                        : "#64748b",
                  }}
                >
                  Quantity
                </button>
                <button
                  onClick={() => setSelectedYearlyMetric("value")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "0.5rem",
                    border:
                      selectedYearlyMetric === "value"
                        ? "2px solid #f59e0b"
                        : "1px solid #e2e8f0",
                    backgroundColor:
                      selectedYearlyMetric === "value" ? "#fed7aa" : "white",
                    color:
                      selectedYearlyMetric === "value" ? "#b45309" : "#64748b",
                  }}
                >
                  Value
                </button>
              </div>
            </div>
          </div>
          <YearlyChart
            data={yearlyData}
            loading={loadingYearly}
            selectedMetric={selectedYearlyMetric}
          />
        </div>

        {/* Customer Performance Chart */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: 12,
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
                gap: 8,
              }}
            >
              <FiUsers color="#8b5cf6" /> Customer Performance Comparison
            </h3>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <MultiYearSelect
                selectedYears={selectedYearsForCustomer}
                onChange={(years) => handleYearSelection(years, "customer")}
                availableYears={availableCustomerYears}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleSortChange("quantity")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "0.5rem",
                    border:
                      sortBy === "quantity"
                        ? "2px solid #8b5cf6"
                        : "1px solid #e2e8f0",
                    backgroundColor:
                      sortBy === "quantity" ? "#ede9fe" : "white",
                    color: sortBy === "quantity" ? "#6d28d9" : "#64748b",
                  }}
                >
                  Sort by Quantity
                </button>
                <button
                  onClick={() => handleSortChange("value")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "0.5rem",
                    border:
                      sortBy === "value"
                        ? "2px solid #ef4444"
                        : "1px solid #e2e8f0",
                    backgroundColor: sortBy === "value" ? "#fee2e2" : "white",
                    color: sortBy === "value" ? "#b91c1c" : "#64748b",
                  }}
                >
                  Sort by Value
                </button>
                <button
                  onClick={() => handleSortChange("count")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "0.5rem",
                    border:
                      sortBy === "count"
                        ? "2px solid #10b981"
                        : "1px solid #e2e8f0",
                    backgroundColor: sortBy === "count" ? "#d1fae5" : "white",
                    color: sortBy === "count" ? "#047857" : "#64748b",
                  }}
                >
                  Sort by Orders
                </button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setSelectedCustomerGraphMetric("both")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "0.5rem",
                    border:
                      selectedCustomerGraphMetric === "both"
                        ? "2px solid #8b5cf6"
                        : "1px solid #e2e8f0",
                    backgroundColor:
                      selectedCustomerGraphMetric === "both"
                        ? "#ede9fe"
                        : "white",
                    color:
                      selectedCustomerGraphMetric === "both"
                        ? "#6d28d9"
                        : "#64748b",
                  }}
                >
                  Both
                </button>
                <button
                  onClick={() => setSelectedCustomerGraphMetric("quantity")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "0.5rem",
                    border:
                      selectedCustomerGraphMetric === "quantity"
                        ? "2px solid #8b5cf6"
                        : "1px solid #e2e8f0",
                    backgroundColor:
                      selectedCustomerGraphMetric === "quantity"
                        ? "#ede9fe"
                        : "white",
                    color:
                      selectedCustomerGraphMetric === "quantity"
                        ? "#6d28d9"
                        : "#64748b",
                  }}
                >
                  Quantity
                </button>
                <button
                  onClick={() => setSelectedCustomerGraphMetric("value")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "0.5rem",
                    border:
                      selectedCustomerGraphMetric === "value"
                        ? "2px solid #ef4444"
                        : "1px solid #e2e8f0",
                    backgroundColor:
                      selectedCustomerGraphMetric === "value"
                        ? "#fee2e2"
                        : "white",
                    color:
                      selectedCustomerGraphMetric === "value"
                        ? "#b91c1c"
                        : "#64748b",
                  }}
                >
                  Value
                </button>
              </div>
            </div>
          </div>
          <CustomerChart
            data={customerData}
            loading={loadingCustomer}
            selectedMetric={selectedCustomerGraphMetric}
            sortBy={sortBy}
            onSortChange={handleSortChange}
          />
        </div>

        {/* Garment Customer Comparison Chart */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#1e293b",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FiPieChart color="#f59e0b" /> Garment Type Analysis - Customer
              Comparison (Unit Price)
            </h3>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>
              Compare unit prices across different customers for each garment
              type
            </p>
          </div>
          <GarmentCustomerComparisonChart
            data={garmentData}
            loading={loadingGarment}
            selectedYears={selectedYearsForGarment}
            selectedCustomers={selectedGarmentCustomers}
            onYearChange={(years) => handleYearSelection(years, "garment")}
            onCustomerChange={(customers) =>
              handleCustomerSelection(customers, "garment")
            }
            availableYears={
              garmentData.availableYears?.length
                ? garmentData.availableYears
                : availableYearsList
            }
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
