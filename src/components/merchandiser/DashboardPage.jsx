// DashboardPage.jsx - WITH SEARCH FUNCTIONALITY FOR SUPPLIER DROPDOWNS
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
  FiSearch,
  FiX,
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
  getSuppliers,
} from "../../api/merchandiser.js";
import { isMerchandiserProduction } from "../../utils/accessControl";

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

const safeNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

// ============================================================================
// API BASE URL
// ============================================================================
const API_BASE_URL = "http://119.148.51.38:8000/api/merchandiser/api";

// ============================================================================
// MULTI-YEAR SELECT COMPONENT
// ============================================================================
const MultiYearSelect = ({ selectedYears, onChange, availableYears }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
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

  const filteredYears = yearsList.filter((year) =>
    String(year).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={selectRef} style={{ position: "relative", minWidth: 180 }}>
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
            maxHeight: 300,
            overflowY: "auto",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #e2e8f0",
              position: "sticky",
              top: 0,
              backgroundColor: "white",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#f1f5f9",
                borderRadius: "0.5rem",
                padding: "4px 10px",
              }}
            >
              <FiSearch size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search years..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "0.85rem",
                  width: "100%",
                  padding: "6px 0",
                  color: "#1e293b",
                }}
              />
              {searchTerm && (
                <FiX
                  size={14}
                  color="#94a3b8"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                  }}
                />
              )}
            </div>
          </div>
          <div
            onClick={() => {
              toggleYear("all");
              setSearchTerm("");
            }}
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
          {filteredYears.length === 0 ? (
            <div style={{ padding: "12px", color: "#94a3b8", textAlign: "center" }}>
              No years found
            </div>
          ) : (
            filteredYears.map((year) => (
              <div
                key={year}
                onClick={() => {
                  toggleYear(year);
                  setSearchTerm("");
                }}
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
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
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

  const filteredCustomers = customersArray.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={selectRef} style={{ position: "relative", minWidth: 220 }}>
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
              borderBottom: "1px solid #e2e8f0",
              position: "sticky",
              top: 0,
              backgroundColor: "white",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#f1f5f9",
                borderRadius: "0.5rem",
                padding: "4px 10px",
              }}
            >
              <FiSearch size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "0.85rem",
                  width: "100%",
                  padding: "6px 0",
                  color: "#1e293b",
                }}
              />
              {searchTerm && (
                <FiX
                  size={14}
                  color="#94a3b8"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                  }}
                />
              )}
            </div>
          </div>
          <div
            onClick={() => {
              toggleCustomer("all");
              setSearchTerm("");
            }}
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
          {filteredCustomers.length === 0 ? (
            <div style={{ padding: "12px", color: "#94a3b8", textAlign: "center" }}>
              No customers found
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => {
                  toggleCustomer(String(customer.id));
                  setSearchTerm("");
                }}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  backgroundColor:
                    isSelected(customer.id) && !selectedCustomers.includes("all")
                      ? "#f3f4f6"
                      : "white",
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
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MULTI-SUPPLIER SELECT COMPONENT WITH SEARCH
// ============================================================================
const MultiSupplierSelect = ({
  selectedSuppliers,
  onChange,
  suppliersList,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSupplier = (supplierId) => {
    let newSelection;
    if (supplierId === "all") {
      newSelection = ["all"];
    } else {
      let currentWithoutAll = selectedSuppliers.filter((s) => s !== "all");
      if (currentWithoutAll.includes(supplierId)) {
        newSelection = currentWithoutAll.filter((s) => s !== supplierId);
        if (newSelection.length === 0) newSelection = ["all"];
      } else {
        newSelection = [...currentWithoutAll, supplierId];
      }
    }
    onChange(newSelection);
  };

  const getDisplayText = () => {
    if (selectedSuppliers.includes("all"))
      return `🏭 All Suppliers (${suppliersList.length})`;
    if (selectedSuppliers.length === 1) {
      const supplier = suppliersList.find(
        (s) => String(s.id) === String(selectedSuppliers[0]),
      );
      return `🏭 ${supplier?.name || supplier?.supplier_name || selectedSuppliers[0]}`;
    }
    return `🏭 ${selectedSuppliers.length} Suppliers Selected`;
  };

  const isSelected = (supplierId) => {
    if (selectedSuppliers.includes("all")) return true;
    return selectedSuppliers.includes(String(supplierId));
  };

  const suppliersArray = Array.isArray(suppliersList) ? suppliersList : [];

  const filteredSuppliers = suppliersArray.filter((supplier) =>
    (supplier.name || supplier.supplier_name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={selectRef} style={{ position: "relative", minWidth: 220 }}>
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
              borderBottom: "1px solid #e2e8f0",
              position: "sticky",
              top: 0,
              backgroundColor: "white",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#f1f5f9",
                borderRadius: "0.5rem",
                padding: "4px 10px",
              }}
            >
              <FiSearch size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "0.85rem",
                  width: "100%",
                  padding: "6px 0",
                  color: "#1e293b",
                }}
              />
              {searchTerm && (
                <FiX
                  size={14}
                  color="#94a3b8"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                  }}
                />
              )}
            </div>
          </div>
          <div
            onClick={() => {
              toggleSupplier("all");
              setSearchTerm("");
            }}
            style={{
              padding: "10px 12px",
              cursor: "pointer",
              backgroundColor: selectedSuppliers.includes("all")
                ? "#ede9fe"
                : "white",
              fontWeight: selectedSuppliers.includes("all") ? 600 : 400,
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
                backgroundColor: selectedSuppliers.includes("all")
                  ? "#8b5cf6"
                  : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {selectedSuppliers.includes("all") && (
                <span style={{ color: "white", fontSize: 12 }}>✓</span>
              )}
            </div>
            <span>All Suppliers ({suppliersArray.length})</span>
          </div>
          {filteredSuppliers.length === 0 ? (
            <div style={{ padding: "12px", color: "#94a3b8", textAlign: "center" }}>
              No suppliers found
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                onClick={() => {
                  toggleSupplier(String(supplier.id));
                  setSearchTerm("");
                }}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  backgroundColor:
                    isSelected(supplier.id) &&
                    !selectedSuppliers.includes("all")
                      ? "#f3f4f6"
                      : "white",
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
                      isSelected(supplier.id) &&
                      !selectedSuppliers.includes("all")
                        ? "#8b5cf6"
                        : "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSelected(supplier.id) &&
                    !selectedSuppliers.includes("all") && (
                      <span style={{ color: "white", fontSize: 12 }}>✓</span>
                    )}
                </div>
                <span>{supplier.name || supplier.supplier_name}</span>
              </div>
            ))
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
            {stat.change && (
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
            )}
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

    const getYearColor = (year, type) => {
      const colors =
        type === "quantity" ? yearColors.quantity : yearColors.value;
      return colors[year] || (type === "quantity" ? "#8b5cf6" : "#ef4444");
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

    let chartData = hasMultiYearData
      ? buildMultiYearChartData()
      : buildAggregatedChartData();

    if (!chartData || chartData.length === 0 || chartData.every(d => d.quantity === 0 && d.value === 0)) {
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
          <p style={{ fontSize: 12, marginTop: 8, color: "#94a3b8" }}>
            Try adjusting your filters or check if data exists
          </p>
        </div>
      );
    }

    let maxValue = 0;
    if (hasMultiYearData) {
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
    const domainMax = maxValue * 1.1 || 1;

    let totalQuantity = 0;
    let totalValue = 0;

    if (hasMultiYearData) {
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
  const domainMax = globalMax * 1.1 || 1;

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
        <p style={{ fontSize: 12, marginTop: 8, color: "#94a3b8" }}>
          Try adjusting your filters
        </p>
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
          <p style={{ fontSize: 12, marginTop: 8, color: "#94a3b8" }}>
            Try adjusting your filters
          </p>
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
    const domainMax = globalMax * 1.1 || 1;
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
      </div>
    );
  },
);

// ============================================================================
// GARMENT CUSTOMER COMPARISON CHART
// ============================================================================
const GarmentCustomerComparisonChart = React.memo(
  ({
    data,
    loading,
    selectedYears,
    selectedCustomers,
    selectedSuppliers,
    onYearChange,
    onCustomerChange,
    onSupplierChange,
    availableYears,
    suppliersList,
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
            Try adjusting your filters
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

    let customersToShow = [];
    const isAllSelected = selectedCustomers.includes("all");

    if (isAllSelected) {
      customersToShow = allCustomersFromData;
    } else if (selectedCustomers && selectedCustomers.length > 0) {
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
          <MultiSupplierSelect
            selectedSuppliers={selectedSuppliers}
            onChange={onSupplierChange}
            suppliersList={suppliersList}
          />
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
        ) : null}
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
// MAIN DASHBOARD COMPONENT
// ============================================================================
const DashboardPage = () => {
  const navigate = useNavigate();

  // Merchandiser - Production doesn't get the Order Dashboard (see
  // merchandiser/Sidebar.jsx) - bounce them to the Order List instead,
  // in case they reach this route directly.
  useEffect(() => {
    if (isMerchandiserProduction()) {
      navigate("/orders", { replace: true });
    }
  }, [navigate]);

  const initialLoadDone = useRef(false);

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
  const [masterSupplierList, setMasterSupplierList] = useState(
    () => getCachedData("master_supplier_list") || [],
  );
  const [availableCustomerYears, setAvailableCustomerYears] = useState(
    () => getCachedData("available_customer_years") || [],
  );

  // Loading states
  const [loading, setLoading] = useState(!dashboardData);
  const [loadingMonthly, setLoadingMonthly] = useState(
    !orderMonthlyData?.quantities?.some(v => v > 0),
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

  // Supplier filter states
  const [selectedSuppliers, setSelectedSuppliers] = useState(["all"]);
  const [selectedYearlySuppliers, setSelectedYearlySuppliers] = useState([
    "all",
  ]);
  const [selectedGarmentSuppliers, setSelectedGarmentSuppliers] = useState([
    "all",
  ]);
  const [selectedCustomerSuppliers, setSelectedCustomerSuppliers] = useState([
    "all",
  ]);

  const [selectedMetric, setSelectedMetric] = useState("both");
  const [selectedYearlyMetric, setSelectedYearlyMetric] = useState("both");
  const [selectedCustomerGraphMetric, setSelectedCustomerGraphMetric] =
    useState("both");
  const [sortBy, setSortBy] = useState("quantity");
  const [hoveredCard, setHoveredCard] = useState(null);

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

  // ========== FETCH MASTER SUPPLIER LIST ==========
  const fetchMasterSupplierList = useCallback(async () => {
    const cached = getCachedData("master_supplier_list");
    if (cached && cached.length > 0) {
      setMasterSupplierList(cached);
      return cached;
    }

    try {
      let suppliers = [];

      try {
        const result = await getSuppliers(1, 1000, { allPages: true });
        if (result.data && result.data.length > 0) {
          suppliers = result.data.map((s) => ({
            id: s.id,
            name: s.name || s.supplier_name || `Supplier ${s.id}`,
          }));
        }
      } catch (err) {
        console.warn("Error fetching suppliers via getSuppliers:", err);
        const response = await axios.get(
          `${API_BASE_URL}/orders/suppliers/`,
          getAuthHeaders(),
        );
        const data = response.data?.results || response.data || [];
        if (Array.isArray(data) && data.length > 0) {
          suppliers = data.map((s) => ({
            id: s.id,
            name: s.name || s.supplier_name || `Supplier ${s.id}`,
          }));
        }
      }

      suppliers.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setMasterSupplierList(suppliers);
      setCachedData("master_supplier_list", suppliers);
      return suppliers;
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
    return [];
  }, [getAuthHeaders]);

  // ========== FETCH AVAILABLE YEARS ==========
  const fetchAvailableYears = useCallback(async () => {
    const cached = getCachedData("available_years");
    if (cached && cached.length > 0) {
      setAvailableYearsList(cached);
      return cached;
    }
    try {
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
    const fallbackYears = ["2026", "2025", "2024", "2023", "2022"];
    setAvailableYearsList(fallbackYears);
    return fallbackYears;
  }, [getAuthHeaders]);

  // ========== FETCH DASHBOARD STATS ONLY ==========
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

  // ========== FETCH ALL CHART DATA ==========
  const fetchChartData = useCallback(async () => {
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

    const garmentCached = getCachedData("garment");
    if (garmentCached && garmentCached.garmentCustomerData?.length > 0) {
      setGarmentData(garmentCached);
      setLoadingGarment(false);
    } else {
      setLoadingGarment(true);
      try {
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

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchAvailableYears();
      fetchDashboardStats();
      fetchMasterCustomerList();
      fetchMasterSupplierList();
      fetchChartData();
    }
  }, [
    fetchAvailableYears,
    fetchDashboardStats,
    fetchMasterCustomerList,
    fetchMasterSupplierList,
    fetchChartData,
  ]);

  // ========== FILTER HANDLERS WITH FIXED PARAMETERS ==========
  
  // Monthly Chart Filter Handler
  const handleMonthlyFilterChange = useCallback(async () => {
    setLoadingMonthly(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      
      if (!selectedYears.includes("all")) {
        params.append("year", selectedYears.join("|"));
      }
      
      if (!selectedCustomers.includes("all")) {
        params.append("customer", selectedCustomers.join("|"));
      }
      
      if (!selectedSuppliers.includes("all")) {
        params.append("supplier", selectedSuppliers.join("|"));
      }
      
      const url = `${API_BASE_URL}/orders/monthly-data/?${params.toString()}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Token ${token}` }
      });
      
      if (response.data?.success && response.data.data) {
        setOrderMonthlyData({
          months: response.data.data.months || [],
          quantities: (response.data.data.quantities || []).map((v) => safeNumber(v, 0)),
          values: (response.data.data.values || []).map((v) => safeNumber(v, 0)),
          counts: (response.data.data.counts || []).map((v) => safeNumber(v, 0)),
        });
      }
    } catch (error) {
      console.error("Error updating monthly chart:", error);
    }
    setLoadingMonthly(false);
  }, [selectedYears, selectedCustomers, selectedSuppliers]);

  // Yearly Chart Filter Handler
  const handleYearlyFilterChange = useCallback(async () => {
    setLoadingYearly(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      
      if (!selectedYearsForYearly.includes("all")) {
        params.append("years", selectedYearsForYearly.join("|"));
      }
      
      if (!selectedYearlyCustomers.includes("all")) {
        params.append("customer", selectedYearlyCustomers.join("|"));
      }
      
      if (!selectedYearlySuppliers.includes("all")) {
        params.append("supplier", selectedYearlySuppliers.join("|"));
      }
      
      const url = `${API_BASE_URL}/orders/yearly-data/?${params.toString()}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Token ${token}` }
      });
      
      if (response.data?.success && response.data.data) {
        setYearlyData({
          years: response.data.data.years || [],
          quantities: (response.data.data.quantities || []).map((v) => safeNumber(v, 0)),
          values: (response.data.data.values || []).map((v) => safeNumber(v, 0)),
          counts: (response.data.data.counts || []).map((v) => safeNumber(v, 0)),
          availableYears: response.data.data.availableYears || [],
        });
      }
    } catch (error) {
      console.error("Error updating yearly chart:", error);
    }
    setLoadingYearly(false);
  }, [selectedYearsForYearly, selectedYearlyCustomers, selectedYearlySuppliers]);

  // Customer Chart Filter Handler
  const handleCustomerFilterChange = useCallback(async () => {
    setLoadingCustomer(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      
      if (!selectedYearsForCustomer.includes("all")) {
        params.append("year", selectedYearsForCustomer.join("|"));
      }
      
      if (!selectedCustomerCustomers.includes("all")) {
        params.append("customer", selectedCustomerCustomers.join("|"));
      }
      
      const url = `${API_BASE_URL}/orders/customer-data/?${params.toString()}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Token ${token}` }
      });
      
      if (response.data?.success && response.data.data) {
        const rawData = response.data.data;
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
    } catch (error) {
      console.error("Error updating customer chart:", error);
    }
    setLoadingCustomer(false);
  }, [selectedYearsForCustomer, selectedCustomerCustomers, sortBy]);

  // Garment Chart Filter Handler
  const handleGarmentFilterChange = useCallback(async () => {
    setLoadingGarment(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      
      if (!selectedYearsForGarment.includes("all")) {
        params.append("years", selectedYearsForGarment.join("|"));
      }
      
      if (!selectedGarmentCustomers.includes("all")) {
        params.append("customers", selectedGarmentCustomers.join("|"));
      }
      
      const url = `${API_BASE_URL}/orders/garment-customer-comparison/?${params.toString()}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Token ${token}` }
      });
      
      if (response.data?.success && response.data.data) {
        const list = (response.data.data.data || []).map((item) => ({
          garment: item.garment,
          customerId: item.customer_id,
          customerName: item.customer_name,
          avgUnitPrice: safeNumber(item.avg_unit_price, 0),
          totalQuantity: safeNumber(item.total_quantity, 0),
          totalValue: safeNumber(item.total_value, 0),
        }));
        setGarmentData((prev) => ({
          ...prev,
          garments: response.data.data.garments || [],
          garmentCustomerData: list,
          availableYears: response.data.data.availableYears || [],
        }));
      }
    } catch (error) {
      console.error("Error updating garment chart:", error);
    }
    setLoadingGarment(false);
  }, [selectedYearsForGarment, selectedGarmentCustomers]);

  // ========== WRAPPER HANDLERS FOR UI ==========
  const handleYearSelection = useCallback((years, type) => {
    if (type === "monthly") {
      setSelectedYears(years);
    } else if (type === "yearly") {
      setSelectedYearsForYearly(years);
    } else if (type === "customer") {
      setSelectedYearsForCustomer(years);
    } else if (type === "garment") {
      setSelectedYearsForGarment(years);
    }
  }, []);

  const handleCustomerSelection = useCallback((customers, type) => {
    if (type === "monthly") {
      setSelectedCustomers(customers);
    } else if (type === "yearly") {
      setSelectedYearlyCustomers(customers);
    } else if (type === "customer") {
      setSelectedCustomerCustomers(customers);
    } else if (type === "garment") {
      setSelectedGarmentCustomers(customers);
    }
  }, []);

  const handleSupplierSelection = useCallback((suppliers, type) => {
    if (type === "monthly") {
      setSelectedSuppliers(suppliers);
    } else if (type === "yearly") {
      setSelectedYearlySuppliers(suppliers);
    } else if (type === "garment") {
      setSelectedGarmentSuppliers(suppliers);
    }
  }, []);

  // Trigger filter changes when selections update
  useEffect(() => {
    if (initialLoadDone.current) {
      handleMonthlyFilterChange();
    }
  }, [selectedYears, selectedCustomers, selectedSuppliers, handleMonthlyFilterChange]);

  useEffect(() => {
    if (initialLoadDone.current) {
      handleYearlyFilterChange();
    }
  }, [selectedYearsForYearly, selectedYearlyCustomers, selectedYearlySuppliers, handleYearlyFilterChange]);

  useEffect(() => {
    if (initialLoadDone.current) {
      handleCustomerFilterChange();
    }
  }, [selectedYearsForCustomer, selectedCustomerCustomers, handleCustomerFilterChange]);

  useEffect(() => {
    if (initialLoadDone.current) {
      handleGarmentFilterChange();
    }
  }, [selectedYearsForGarment, selectedGarmentCustomers, handleGarmentFilterChange]);

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
    setDashboardData(null);
    setOrderMonthlyData(null);
    setYearlyData(null);
    setCustomerData(null);
    setGarmentData(null);
    setAvailableYearsList([]);
    setMasterCustomerList([]);
    setMasterSupplierList([]);
    fetchAvailableYears();
    fetchDashboardStats();
    fetchMasterCustomerList();
    fetchMasterSupplierList();
    fetchChartData();
  }, [
    fetchAvailableYears,
    fetchDashboardStats,
    fetchMasterCustomerList,
    fetchMasterSupplierList,
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
              <MultiSupplierSelect
                selectedSuppliers={selectedSuppliers}
                onChange={(suppliers) =>
                  handleSupplierSelection(suppliers, "monthly")
                }
                suppliersList={masterSupplierList}
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
              <MultiSupplierSelect
                selectedSuppliers={selectedYearlySuppliers}
                onChange={(suppliers) =>
                  handleSupplierSelection(suppliers, "yearly")
                }
                suppliersList={masterSupplierList}
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
            selectedSuppliers={selectedGarmentSuppliers}
            onYearChange={(years) => handleYearSelection(years, "garment")}
            onCustomerChange={(customers) =>
              handleCustomerSelection(customers, "garment")
            }
            onSupplierChange={(suppliers) =>
              handleSupplierSelection(suppliers, "garment")
            }
            availableYears={
              garmentData.availableYears?.length
                ? garmentData.availableYears
                : availableYearsList
            }
            suppliersList={masterSupplierList}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;