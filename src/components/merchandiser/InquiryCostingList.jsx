// InquiryCostingList.jsx - FIXED for customer and buyer name display

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://119.148.51.38:8000/api/merchandiser/api";

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  const csrfToken = getCookie("csrftoken");
  if (csrfToken) {
    config.headers["X-CSRFToken"] = csrfToken;
  }
  return config;
});

// Helper function to safely format numbers
const safeFormatNumber = (value, decimals = 3) => {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? "—" : `$${num.toFixed(decimals)}`;
};

const safeNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

const InquiryCostingList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [costings, setCostings] = useState([]);
  const [filteredCostings, setFilteredCostings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [garmentTypeFilter, setGarmentTypeFilter] = useState("all");
  const [sortField, setSortField] = useState("inquiry_no");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  // Summary statistics
  const [summary, setSummary] = useState({
    totalInquiries: 0,
    totalValue: 0,
    averageDzPrice: 0,
    averagePcsPrice: 0,
    byGarmentType: {
      knit: { count: 0, avgPrice: 0 },
      woven: { count: 0, avgPrice: 0 },
      sweater: { count: 0, avgPrice: 0 },
    },
  });

  // FIXED: Fetch all inquiries with proper customer/buyer name extraction
  const fetchAllInquiries = async () => {
    let allInquiries = [];
    let nextUrl = "/inquiry/?page_size=100";

    try {
      while (nextUrl) {
        const response = await api.get(nextUrl);

        // Handle paginated response
        if (response.data && response.data.results) {
          allInquiries = [...allInquiries, ...response.data.results];
          nextUrl = response.data.next;
        } else if (Array.isArray(response.data)) {
          allInquiries = [...allInquiries, ...response.data];
          nextUrl = null;
        } else {
          nextUrl = null;
        }
      }

      console.log(`✅ Fetched ${allInquiries.length} inquiries`);
      
      // Debug: Log first inquiry to see structure
      if (allInquiries.length > 0) {
        console.log("Sample inquiry data:", {
          id: allInquiries[0].id,
          inquiry_no: allInquiries[0].inquiry_no,
          customer_name: allInquiries[0].customer_name,
          buyer_name: allInquiries[0].buyer_name,
          customer: allInquiries[0].customer,
          buyer: allInquiries[0].buyer
        });
      }
      
      return allInquiries;
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      throw error;
    }
  };

  // FIXED: Extract customer name from inquiry object
  const extractCustomerName = (inquiry) => {
    // First try the serializer's customer_name field
    if (inquiry.customer_name && inquiry.customer_name !== "-") {
      return inquiry.customer_name;
    }
    
    // Then try nested customer object
    if (inquiry.customer) {
      if (typeof inquiry.customer === "object") {
        if (inquiry.customer.customer_name) return inquiry.customer.customer_name;
        if (inquiry.customer.name) {
          if (typeof inquiry.customer.name === "object" && inquiry.customer.name.customer_name) {
            return inquiry.customer.name.customer_name;
          }
          if (typeof inquiry.customer.name === "string") return inquiry.customer.name;
        }
      }
      if (typeof inquiry.customer === "string") return inquiry.customer;
    }
    
    return "—";
  };

  // FIXED: Extract buyer name from inquiry object
  const extractBuyerName = (inquiry) => {
    // First try the serializer's buyer_name field
    if (inquiry.buyer_name && inquiry.buyer_name !== "-") {
      return inquiry.buyer_name;
    }
    
    // Then try nested buyer object
    if (inquiry.buyer) {
      if (typeof inquiry.buyer === "object") {
        if (inquiry.buyer.name) return inquiry.buyer.name;
        if (inquiry.buyer.buyer_name) return inquiry.buyer.buyer_name;
      }
      if (typeof inquiry.buyer === "string") return inquiry.buyer;
    }
    
    return "—";
  };

  // FIXED: Fetch costing data with batch processing
  const fetchCostings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch all inquiries with pagination handling
      const inquiries = await fetchAllInquiries();

      console.log(`Found ${inquiries.length} total inquiries`);

      if (inquiries.length === 0) {
        setCostings([]);
        setFilteredCostings([]);
        setLoading(false);
        return;
      }

      // 2. Extract all inquiry IDs
      const inquiryIds = inquiries.map((inq) => inq.id);

      // 3. Fetch costing for each inquiry (batch processing)
      let costingMap = {};
      const BATCH_SIZE = 20;

      for (let i = 0; i < inquiryIds.length; i += BATCH_SIZE) {
        const batchIds = inquiryIds.slice(i, i + BATCH_SIZE);

        // Try bulk endpoint for each batch
        try {
          const idsParam = batchIds.join(",");
          const costingRes = await api.get(
            `/inquiry-costing/bulk-by-inquiries/?inquiry_ids=${idsParam}`,
          );
          if (
            costingRes.data &&
            costingRes.data.success &&
            costingRes.data.costings
          ) {
            costingMap = { ...costingMap, ...costingRes.data.costings };
          }
        } catch (bulkError) {
          // If bulk fails, try individual requests
          for (const inquiryId of batchIds) {
            try {
              const singleRes = await api.get(
                `/inquiry-costing/by-inquiry/?inquiry_id=${inquiryId}`,
              );
              if (singleRes.data && singleRes.data.id) {
                costingMap[inquiryId] = singleRes.data;
              }
            } catch (singleError) {
              // No costing for this inquiry - skip
            }
          }
        }

        console.log(
          `Processed ${Math.min(i + BATCH_SIZE, inquiryIds.length)}/${inquiryIds.length} inquiries...`,
        );
      }

      console.log(
        `✅ Loaded costing for ${Object.keys(costingMap).length} inquiries`,
      );

      // 4. Combine inquiry and costing data
      const combinedCostings = [];

      for (const inquiry of inquiries) {
        const costing = costingMap[inquiry.id];

        // Only include inquiries that have costing data
        if (costing && costing.id) {
          // Extract customer and buyer names using the helper functions
          const customerName = extractCustomerName(inquiry);
          const buyerName = extractBuyerName(inquiry);

          combinedCostings.push({
            id: costing.id,
            inquiry_id: inquiry.id,
            inquiry_no: inquiry.inquiry_no || `INQ-${inquiry.id}`,
            customer_name: customerName,
            buyer_name: buyerName,
            item: inquiry.item || "—",
            model_name: costing.model_name || inquiry.same_style || "",
            order_quantity: inquiry.order_quantity || 0,
            target_price: inquiry.target_price,
            confirmed_price: inquiry.confirmed_price,
            offer_price: inquiry.offer_price,
            status: inquiry.current_status || "pending",
            garment: inquiry.garment || "knit",
            garment_type: costing.garment_type || inquiry.garment || "knit",
            created_at: inquiry.received_date || inquiry.created_at,
            updated_at: inquiry.updated_at,
            // Costing fields with safe defaults
            dz_price: safeNumber(costing.dz_price),
            price_in_pcs: safeNumber(costing.price_in_pcs),
            total_fabric_price: safeNumber(costing.total_fabric_price),
            accessories: safeNumber(costing.accessories),
            cm: safeNumber(costing.cm),
            yarn_price: safeNumber(costing.yarn_price),
            knitting: safeNumber(costing.knitting),
            dyeing: safeNumber(costing.dyeing),
            aop: safeNumber(costing.aop),
            woven_fabric_price: safeNumber(costing.woven_fabric_price),
            consumption_dz: safeNumber(costing.consumption_dz),
            fabric_price_multiplier: safeNumber(
              costing.fabric_price_multiplier,
            ),
          });
        }
      }

      console.log(
        `✅ Found ${combinedCostings.length} inquiries with costing data`,
      );
      console.log("Sample combined costing:", combinedCostings[0]);

      setCostings(combinedCostings);
      setFilteredCostings(combinedCostings);
      setTotalItems(combinedCostings.length);

      // Calculate summary statistics
      calculateSummary(combinedCostings);
    } catch (error) {
      console.error("Error fetching costings:", error);
      setError("Failed to load costing data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate summary statistics
  const calculateSummary = (data) => {
    const total = data.length;
    let totalValue = 0;
    let totalDzPrice = 0;
    let totalPcsPrice = 0;
    let dzPriceCount = 0;
    let pcsPriceCount = 0;

    const byType = {
      knit: { total: 0, sum: 0, count: 0 },
      woven: { total: 0, sum: 0, count: 0 },
      sweater: { total: 0, sum: 0, count: 0 },
    };

    data.forEach((costing) => {
      // Total value calculation - use safe numbers
      const dzPrice = safeNumber(costing.dz_price);
      const pcsPrice = safeNumber(costing.price_in_pcs);
      const orderQty = safeNumber(costing.order_quantity);

      if (orderQty > 0 && dzPrice > 0) {
        totalValue += (orderQty / 12) * dzPrice;
      } else if (orderQty > 0 && pcsPrice > 0) {
        totalValue += orderQty * pcsPrice;
      }

      // Dz price average
      if (dzPrice > 0) {
        totalDzPrice += dzPrice;
        dzPriceCount++;
      }

      // Pcs price average
      if (pcsPrice > 0) {
        totalPcsPrice += pcsPrice;
        pcsPriceCount++;
      }

      // By garment type
      const type = costing.garment_type || "knit";
      if (byType[type]) {
        byType[type].count++;
        if (dzPrice > 0) byType[type].sum += dzPrice;
      }
    });

    setSummary({
      totalInquiries: total,
      totalValue: totalValue,
      averageDzPrice: dzPriceCount > 0 ? totalDzPrice / dzPriceCount : 0,
      averagePcsPrice: pcsPriceCount > 0 ? totalPcsPrice / pcsPriceCount : 0,
      byGarmentType: {
        knit: {
          count: byType.knit.count,
          avgPrice:
            byType.knit.count > 0 ? byType.knit.sum / byType.knit.count : 0,
        },
        woven: {
          count: byType.woven.count,
          avgPrice:
            byType.woven.count > 0 ? byType.woven.sum / byType.woven.count : 0,
        },
        sweater: {
          count: byType.sweater.count,
          avgPrice:
            byType.sweater.count > 0
              ? byType.sweater.sum / byType.sweater.count
              : 0,
        },
      },
    });
  };

  // Navigation handlers
  const handleInquiryClick = (inquiryId) => {
    navigate(`/inquiries/${inquiryId}`);
  };

  const handleViewDetailsClick = (inquiryId) => {
    navigate(`/inquiries/${inquiryId}/costing`);
  };

  // Filter and sort data
  useEffect(() => {
    let filtered = [...costings];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (costing) =>
          (costing.inquiry_no &&
            costing.inquiry_no.toLowerCase().includes(term)) ||
          (costing.customer_name &&
            costing.customer_name.toLowerCase().includes(term)) ||
          (costing.buyer_name &&
            costing.buyer_name.toLowerCase().includes(term)) ||
          (costing.item && costing.item.toLowerCase().includes(term)) ||
          (costing.model_name &&
            costing.model_name.toLowerCase().includes(term)),
      );
    }

    // Apply garment type filter
    if (garmentTypeFilter !== "all") {
      filtered = filtered.filter(
        (costing) => costing.garment_type === garmentTypeFilter,
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";

      // Handle numeric values
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      // Handle string values
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
      if (sortDirection === "asc") {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

    setFilteredCostings(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  }, [searchTerm, garmentTypeFilter, sortField, sortDirection, costings]);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle row selection
  const handleSelectRow = (id) => {
    setSelectedRows((prev) => {
      if (prev.includes(id)) {
        return prev.filter((rowId) => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      const currentPageIds = paginatedCostings.map((c) => c.id);
      setSelectedRows(currentPageIds);
    }
    setSelectAll(!selectAll);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedCostings = filteredCostings.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectAll(false);
    setSelectedRows([]);
  };

  // Export to CSV
  const exportToCSV = () => {
    const dataToExport =
      selectedRows.length > 0
        ? costings.filter((c) => selectedRows.includes(c.id))
        : filteredCostings;

    const headers = [
      "Inquiry No",
      "Customer",
      "Buyer",
      "Item",
      "Garment Type",
      "Model Name",
      "DZ Price",
      "Price in Pcs",
      "Total Fabric Price",
      "Accessories",
      "CM",
      "Status",
      "Created At",
    ];

    const csvRows = [headers];

    dataToExport.forEach((costing) => {
      csvRows.push([
        costing.inquiry_no || "—",
        costing.customer_name || "—",
        costing.buyer_name || "—",
        costing.item || "—",
        costing.garment_type || "—",
        costing.model_name || "—",
        costing.dz_price ? `$${costing.dz_price.toFixed(3)}` : "—",
        costing.price_in_pcs ? `$${costing.price_in_pcs.toFixed(3)}` : "—",
        costing.total_fabric_price
          ? `$${costing.total_fabric_price.toFixed(3)}`
          : "—",
        costing.accessories ? `$${costing.accessories.toFixed(3)}` : "—",
        costing.cm ? `$${costing.cm.toFixed(3)}` : "—",
        costing.status || "—",
        costing.created_at
          ? new Date(costing.created_at).toLocaleDateString()
          : "—",
      ]);
    });

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inquiry_costings_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { background: "#fef3c7", color: "#92400e", label: "Pending" },
      quoted: { background: "#dbeafe", color: "#1e40af", label: "Quoted" },
      confirmed: {
        background: "#d1fae5",
        color: "#065f46",
        label: "Confirmed",
      },
    };
    const style = statusStyles[status] || statusStyles.pending;
    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "600",
          background: style.background,
          color: style.color,
        }}
      >
        {style.label}
      </span>
    );
  };

  // Get garment type badge
  const getGarmentBadge = (type) => {
    const typeStyles = {
      knit: { background: "#e0f2fe", color: "#0369a1", icon: "🧶" },
      woven: { background: "#fce7f3", color: "#be185d", icon: "👕" },
      sweater: { background: "#fed7aa", color: "#9a3412", icon: "🧥" },
    };
    const style = typeStyles[type] || typeStyles.knit;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "500",
          background: style.background,
          color: style.color,
        }}
      >
        <span>{style.icon}</span>
        <span>{type?.charAt(0).toUpperCase() + type?.slice(1)}</span>
      </span>
    );
  };

  useEffect(() => {
    fetchCostings();
  }, [fetchCostings]);

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.mainContent}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Loading costing data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.mainContent}>
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>⚠️</div>
            <h2 style={styles.errorTitle}>Error Loading Data</h2>
            <p style={styles.errorMessage}>{error}</p>
            <button onClick={fetchCostings} style={styles.btnPrimary}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div>
              <h1 style={styles.headerTitle}>Inquiry Costing List</h1>
              <p style={styles.headerSubtitle}>
                View and manage all inquiry costing data across garment types
              </p>
            </div>
            <div style={styles.headerActions}>
              <button onClick={exportToCSV} style={styles.btnSecondary}>
                📊 Export CSV
              </button>
              <button onClick={fetchCostings} style={styles.btnSecondary}>
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>📋</div>
            <div>
              <div style={styles.summaryValue}>{summary.totalInquiries}</div>
              <div style={styles.summaryLabel}>Total Costings</div>
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>💰</div>
            <div>
              <div style={styles.summaryValue}>
                $
                {summary.totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div style={styles.summaryLabel}>Total Value</div>
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>🏷️</div>
            <div>
              <div style={styles.summaryValue}>
                ${summary.averageDzPrice.toFixed(3)}
              </div>
              <div style={styles.summaryLabel}>Avg DZ Price</div>
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>📦</div>
            <div>
              <div style={styles.summaryValue}>
                ${summary.averagePcsPrice.toFixed(3)}
              </div>
              <div style={styles.summaryLabel}>Avg Pcs Price</div>
            </div>
          </div>
        </div>

        {/* Garment Type Stats */}
        {summary.totalInquiries > 0 && (
          <div style={styles.garmentStatsGrid}>
            <div style={styles.garmentStatCard}>
              <span style={styles.garmentStatIcon}>🧶</span>
              <div>
                <div style={styles.garmentStatValue}>
                  {summary.byGarmentType.knit.count}
                </div>
                <div style={styles.garmentStatLabel}>Knit Costings</div>
                <div style={styles.garmentStatSub}>
                  Avg: ${summary.byGarmentType.knit.avgPrice.toFixed(3)}
                </div>
              </div>
            </div>
            <div style={styles.garmentStatCard}>
              <span style={styles.garmentStatIcon}>👕</span>
              <div>
                <div style={styles.garmentStatValue}>
                  {summary.byGarmentType.woven.count}
                </div>
                <div style={styles.garmentStatLabel}>Woven Costings</div>
                <div style={styles.garmentStatSub}>
                  Avg: ${summary.byGarmentType.woven.avgPrice.toFixed(3)}
                </div>
              </div>
            </div>
            <div style={styles.garmentStatCard}>
              <span style={styles.garmentStatIcon}>🧥</span>
              <div>
                <div style={styles.garmentStatValue}>
                  {summary.byGarmentType.sweater.count}
                </div>
                <div style={styles.garmentStatLabel}>Sweater Costings</div>
                <div style={styles.garmentStatSub}>
                  Avg: ${summary.byGarmentType.sweater.avgPrice.toFixed(3)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={styles.filtersBar}>
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search by inquiry no, customer, buyer, item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Garment Type:</label>
            <select
              value={garmentTypeFilter}
              onChange={(e) => setGarmentTypeFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Types</option>
              <option value="knit">🧶 Knit</option>
              <option value="woven">👕 Woven</option>
              <option value="sweater">🧥 Sweater</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Items per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={styles.filterSelect}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          {selectedRows.length > 0 && (
            <button onClick={exportToCSV} style={styles.btnExportSelected}>
              📥 Export Selected ({selectedRows.length})
            </button>
          )}
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          {filteredCostings.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={{ ...styles.th, width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={selectAll && paginatedCostings.length > 0}
                      onChange={handleSelectAll}
                      style={styles.checkbox}
                    />
                  </th>
                  <th
                    style={styles.th}
                    onClick={() => handleSort("inquiry_no")}
                  >
                    Inquiry No{" "}
                    {sortField === "inquiry_no" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={styles.th}
                    onClick={() => handleSort("customer_name")}
                  >
                    Customer{" "}
                    {sortField === "customer_name" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={styles.th}
                    onClick={() => handleSort("buyer_name")}
                  >
                    Buyer{" "}
                    {sortField === "buyer_name" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th style={styles.th} onClick={() => handleSort("item")}>
                    Item{" "}
                    {sortField === "item" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th style={styles.th}>Garment</th>
                  <th style={styles.th} onClick={() => handleSort("dz_price")}>
                    DZ Price{" "}
                    {sortField === "dz_price" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={styles.th}
                    onClick={() => handleSort("price_in_pcs")}
                  >
                    Pcs Price{" "}
                    {sortField === "price_in_pcs" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th style={styles.th} onClick={() => handleSort("status")}>
                    Status{" "}
                    {sortField === "status" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCostings.map((costing) => (
                  <tr key={costing.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(costing.id)}
                        onChange={() => handleSelectRow(costing.id)}
                        style={styles.checkbox}
                      />
                    </td>
                    <td style={styles.td}>
                      <span
                        style={styles.inquiryLink}
                        onClick={() => handleInquiryClick(costing.inquiry_id)}
                      >
                        {costing.inquiry_no}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span title={costing.customer_name}>
                        {costing.customer_name && costing.customer_name.length > 30
                          ? costing.customer_name.substring(0, 30) + "..."
                          : costing.customer_name}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {costing.buyer_name}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.itemCell}>
                        {costing.item}
                        {costing.model_name && (
                          <span style={styles.modelName}>
                            ({costing.model_name})
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {getGarmentBadge(costing.garment_type)}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.priceCell}>
                        {safeFormatNumber(costing.dz_price, 3)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.priceCell}>
                        {safeFormatNumber(costing.price_in_pcs, 3)}
                      </span>
                    </td>
                    <td style={styles.td}>{getStatusBadge(costing.status)}</td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() =>
                            handleViewDetailsClick(costing.inquiry_id)
                          }
                          style={styles.viewDetailsBtn}
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.emptyTable}>
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📭</span>
                <p>
                  No costing data found. Create costings from inquiry pages
                  first.
                </p>
                <button
                  onClick={() => navigate("/inquiries")}
                  style={styles.btnPrimary}
                >
                  Go to Inquiries
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && filteredCostings.length > 0 && (
          <div style={styles.pagination}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                ...styles.pageBtn,
                ...(currentPage === 1 ? styles.pageBtnDisabled : {}),
              }}
            >
              ← Previous
            </button>

            <div style={styles.pageNumbers}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      ...styles.pageNumber,
                      ...(currentPage === pageNum
                        ? styles.pageNumberActive
                        : {}),
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                ...styles.pageBtn,
                ...(currentPage === totalPages ? styles.pageBtnDisabled : {}),
              }}
            >
              Next →
            </button>
          </div>
        )}

        {/* Footer info */}
        {filteredCostings.length > 0 && (
          <div style={styles.footerInfo}>
            Showing {indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, totalItems)} of {totalItems} entries
            {selectedRows.length > 0 && ` | ${selectedRows.length} selected`}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f0f2f5",
    fontFamily: "'Inter', sans-serif",
  },
  mainContent: {
    flex: 1,
    padding: "20px",
    overflow: "auto",
    maxHeight: "100vh",
  },
  header: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: "14px",
    padding: "20px 24px",
    marginBottom: "20px",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "white",
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.7)",
    marginTop: "6px",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnSecondary: {
    background: "white",
    color: "#475569",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  btnExportSelected: {
    background: "#3b82f6",
    color: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "20px",
  },
  summaryCard: {
    background: "white",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  summaryIcon: {
    fontSize: "32px",
  },
  summaryValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
  },
  summaryLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px",
  },
  garmentStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "20px",
  },
  garmentStatCard: {
    background: "white",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  garmentStatIcon: {
    fontSize: "32px",
  },
  garmentStatValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
  },
  garmentStatLabel: {
    fontSize: "12px",
    color: "#64748b",
  },
  garmentStatSub: {
    fontSize: "11px",
    color: "#10b981",
    marginTop: "4px",
  },
  filtersBar: {
    background: "white",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  searchBox: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "0 12px",
  },
  searchIcon: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  searchInput: {
    flex: 1,
    padding: "10px 12px",
    border: "none",
    background: "transparent",
    fontSize: "13px",
    outline: "none",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  filterLabel: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#475569",
  },
  filterSelect: {
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "12px",
    background: "white",
    cursor: "pointer",
  },
  tableContainer: {
    background: "white",
    borderRadius: "12px",
    overflow: "auto",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1000px",
  },
  tableHeader: {
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  th: {
    padding: "14px 12px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    cursor: "pointer",
    userSelect: "none",
  },
  tableRow: {
    borderBottom: "1px solid #e2e8f0",
    transition: "background 0.2s",
  },
  td: {
    padding: "12px",
    fontSize: "13px",
    color: "#334155",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },
  inquiryLink: {
    fontWeight: "600",
    color: "#3b82f6",
    cursor: "pointer",
    textDecoration: "underline",
    textDecorationStyle: "dotted",
    textUnderlineOffset: "2px",
    transition: "color 0.2s",
  },
  itemCell: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  modelName: {
    fontSize: "10px",
    color: "#94a3b8",
  },
  priceCell: {
    fontWeight: "600",
    color: "#10b981",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  viewDetailsBtn: {
    background: "#3b82f6",
    color: "white",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    fontSize: "11px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    padding: "16px",
    background: "white",
    borderRadius: "12px",
  },
  pageBtn: {
    padding: "8px 16px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "12px",
    cursor: "pointer",
  },
  pageBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  pageNumbers: {
    display: "flex",
    gap: "6px",
  },
  pageNumber: {
    padding: "8px 12px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },
  pageNumberActive: {
    background: "#3b82f6",
    color: "white",
    borderColor: "#3b82f6",
  },
  footerInfo: {
    marginTop: "12px",
    fontSize: "12px",
    color: "#64748b",
    textAlign: "center",
  },
  emptyTable: {
    textAlign: "center",
    padding: "60px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  emptyIcon: {
    fontSize: "48px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "400px",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "400px",
    textAlign: "center",
  },
  errorIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  errorTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#dc2626",
    marginBottom: "8px",
  },
  errorMessage: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "20px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "12px",
  },
};

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .clickable-row:hover { background: #f8fafc; cursor: pointer; }`;
  document.head.appendChild(style);
}

export default InquiryCostingList;