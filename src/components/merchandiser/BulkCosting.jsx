// BulkCosting.jsx - FIXED for customer and buyer name display

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";
import { useNavigate, Link } from "react-router-dom";

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

// ========== FIXED: Helper functions for customer and buyer name extraction ==========
const getCustomerName = (inquiry) => {
  if (!inquiry) return "—";
  
  // Method 1: Use the serializer's customer_name field (most reliable)
  if (inquiry.customer_name && inquiry.customer_name !== "-") {
    return inquiry.customer_name;
  }
  
  // Method 2: Check nested customer object
  if (inquiry.customer) {
    if (typeof inquiry.customer === "object") {
      if (inquiry.customer.customer_name) return inquiry.customer.customer_name;
      if (inquiry.customer.name) {
        if (typeof inquiry.customer.name === "object" && inquiry.customer.name.customer_name) {
          return inquiry.customer.name.customer_name;
        }
        if (typeof inquiry.customer.name === "string") return inquiry.customer.name;
      }
      if (inquiry.customer.hrms_customer_name) return inquiry.customer.hrms_customer_name;
      if (inquiry.customer.display_name) return inquiry.customer.display_name;
      return `Customer ${inquiry.customer.id}`;
    }
    if (typeof inquiry.customer === "string") return inquiry.customer;
  }
  
  return "—";
};

const getBuyerName = (inquiry) => {
  if (!inquiry) return "—";
  
  // Method 1: Use the serializer's buyer_name field
  if (inquiry.buyer_name && inquiry.buyer_name !== "-") {
    return inquiry.buyer_name;
  }
  
  // Method 2: Check nested buyer object
  if (inquiry.buyer) {
    if (typeof inquiry.buyer === "object") {
      if (inquiry.buyer.name) return inquiry.buyer.name;
      if (inquiry.buyer.buyer_name) return inquiry.buyer.buyer_name;
    }
    if (typeof inquiry.buyer === "string") return inquiry.buyer;
  }
  
  return "—";
};

// localStorage keys - ONLY FOR UI PREFERENCES (not costing data)
const STORAGE_KEYS = {
  SEARCH_TERM: "bulk_costing_search_term",
  GARMENT_FILTER: "bulk_costing_garment_filter",
  STATUS_FILTER: "bulk_costing_status_filter",
  SORT_FIELD: "bulk_costing_sort_field",
  SORT_DIRECTION: "bulk_costing_sort_direction",
  ITEMS_PER_PAGE: "bulk_costing_items_per_page",
  SHOW_FILTERS: "bulk_costing_show_filters",
};

// Image Modal Component
const ImageModal = ({ imageUrl, isOpen, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 4));
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div style={modalStyles.headerIcon}>🖼️</div>
          <h3 style={modalStyles.title}>Image Preview</h3>
          <button style={modalStyles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div style={modalStyles.toolbar}>
          <button
            onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.5))}
            style={modalStyles.toolBtn}
          >
            Zoom Out
          </button>
          <span style={modalStyles.zoomLevel}>{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((prev) => Math.min(prev + 0.25, 4))}
            style={modalStyles.toolBtn}
          >
            Zoom In
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPosition({ x: 0, y: 0 });
            }}
            style={modalStyles.toolBtn}
          >
            Reset
          </button>
          {zoom > 1 && <span style={modalStyles.dragHint}>Drag to pan</span>}
        </div>
        <div
          style={modalStyles.imageContainer}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={imageUrl}
            alt="Preview"
            style={{
              ...modalStyles.image,
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
            }}
          />
        </div>
      </div>
    </div>
  );
};

const BulkCosting = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  
  // UI preferences - saved to localStorage (these are fine)
  const [searchTerm, setSearchTerm] = useState(
    () => localStorage.getItem(STORAGE_KEYS.SEARCH_TERM) || "",
  );
  const [garmentTypeFilter, setGarmentTypeFilter] = useState(
    () => localStorage.getItem(STORAGE_KEYS.GARMENT_FILTER) || "all",
  );
  const [statusFilter, setStatusFilter] = useState(
    () => localStorage.getItem(STORAGE_KEYS.STATUS_FILTER) || "all",
  );
  const [sortField, setSortField] = useState(
    () => localStorage.getItem(STORAGE_KEYS.SORT_FIELD) || "inquiry_no",
  );
  const [sortDirection, setSortDirection] = useState(
    () => localStorage.getItem(STORAGE_KEYS.SORT_DIRECTION) || "asc",
  );
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ITEMS_PER_PAGE);
    return saved ? parseInt(saved) : 25;
  });
  const [showFilters, setShowFilters] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_FILTERS);
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // NO localStorage for these - always fresh from backend
  const [savingRows, setSavingRows] = useState({});
  const [costingData, setCostingData] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [imageModal, setImageModal] = useState({ isOpen: false, url: "" });
  const [imageErrors, setImageErrors] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Save UI preferences to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEARCH_TERM, searchTerm);
  }, [searchTerm]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GARMENT_FILTER, garmentTypeFilter);
  }, [garmentTypeFilter]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STATUS_FILTER, statusFilter);
  }, [statusFilter]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SORT_FIELD, sortField);
  }, [sortField]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SORT_DIRECTION, sortDirection);
  }, [sortDirection]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS_PER_PAGE, itemsPerPage.toString());
  }, [itemsPerPage]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOW_FILTERS, JSON.stringify(showFilters));
  }, [showFilters]);

  // Get first image from inquiry
  const getFirstImage = (inquiry) => {
    if (inquiry.multiple_images && inquiry.multiple_images.length > 0) {
      let imgUrl = inquiry.multiple_images[0];
      if (imgUrl.startsWith("/")) {
        imgUrl = `http://119.148.51.38:8000${imgUrl}`;
      }
      return imgUrl;
    }
    return null;
  };

  // FIXED: Fetch all inquiries with pagination handling
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
        });
      }
      
      return allInquiries;
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      throw error;
    }
  };

  // FIXED: Fetch all costing data with pagination handling
  const fetchAllCostings = async (inquiryIds) => {
    if (inquiryIds.length === 0) return {};
    
    let costingMap = {};
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < inquiryIds.length; i += BATCH_SIZE) {
      const batchIds = inquiryIds.slice(i, i + BATCH_SIZE);
      const idsParam = batchIds.join(',');
      
      try {
        const response = await api.get(`/inquiry-costing/bulk-by-inquiries/?inquiry_ids=${idsParam}`);
        if (response.data && response.data.success && response.data.costings) {
          costingMap = { ...costingMap, ...response.data.costings };
        }
      } catch (error) {
        console.warn(`Failed to fetch costing for batch ${i}:`, error);
        // Try individual requests for this batch
        for (const inquiryId of batchIds) {
          try {
            const singleRes = await api.get(`/inquiry-costing/by-inquiry/?inquiry_id=${inquiryId}`);
            if (singleRes.data && singleRes.data.id) {
              costingMap[inquiryId] = singleRes.data;
            }
          } catch (singleError) {
            // No costing for this inquiry
          }
        }
      }
    }
    
    console.log(`✅ Loaded costing for ${Object.keys(costingMap).length} inquiries`);
    return costingMap;
  };

  // ========== CALCULATION FUNCTIONS ==========
  const calculateKnitFabricPriceDz = (data) => {
    const yarn = parseFloat(data.yarn_price) || 0;
    const knitting = parseFloat(data.knitting) || 0;
    const dyeing = parseFloat(data.dyeing) || 0;
    const aop = parseFloat(data.aop) || 0;
    const multiplier = parseFloat(data.fabric_price_multiplier) || 0;
    return ((yarn + knitting + dyeing + aop) * (1 + multiplier / 100)).toFixed(2);
  };

  const calculateSweaterYarnCostDz = (data) => {
    const yarnRate = parseFloat(data.sweater_yarn_rate) || 0;
    const consumption = parseFloat(data.sweater_consumption) || 0;
    return (yarnRate * consumption).toFixed(2);
  };

  const calculateSweaterFabricPriceDz = (data) => {
    const yarnCostDz = parseFloat(calculateSweaterYarnCostDz(data)) || 0;
    const knittingChargePc = parseFloat(data.sweater_knitting_charge) || 0;
    const linkingPc = parseFloat(data.sweater_linking) || 0;
    const washingPc = parseFloat(data.sweater_washing) || 0;
    const multiplier = parseFloat(data.fabric_price_multiplier) || 0;
    const totalKnittingDz = (knittingChargePc + linkingPc + washingPc) * 12;
    return ((yarnCostDz + totalKnittingDz) * (1 + multiplier / 100)).toFixed(2);
  };

  const calculateTotalFabricPrice = (data) => {
    const consumption = parseFloat(data.consumption_dz) || 0;
    const multiplier = parseFloat(data.fabric_price_multiplier) || 0;

    if (data.garment_type === "knit") {
      const fabricPriceDz = parseFloat(calculateKnitFabricPriceDz(data)) || 0;
      return (fabricPriceDz * consumption).toFixed(2);
    } else if (data.garment_type === "woven") {
      const wovenPrice = parseFloat(data.woven_fabric_price) || 0;
      const adjustedPrice = wovenPrice * (1 + multiplier / 100);
      return (adjustedPrice * consumption).toFixed(2);
    } else if (data.garment_type === "sweater") {
      return calculateSweaterFabricPriceDz(data);
    }
    return "0.00";
  };

  const calculateDzPrice = (data) => {
    const totalFabric = parseFloat(calculateTotalFabricPrice(data)) || 0;
    const accessories = parseFloat(data.accessories) || 0;
    const printEmb = parseFloat(data.print_emb) || 0;
    const wash = parseFloat(data.wash) || 0;
    const cm = parseFloat(data.cm) || 0;
    const testCom = parseFloat(data.test_com) || 0;
    const others = parseFloat(data.others) || 0;
    return (totalFabric + accessories + printEmb + wash + cm + testCom + others).toFixed(2);
  };

  const calculatePriceInPcs = (data) => {
    const dzPrice = parseFloat(calculateDzPrice(data)) || 0;
    return (dzPrice / 12).toFixed(2);
  };

  // Fetch data - ALWAYS from backend, NO localStorage for costing data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch all inquiries with pagination handling
      const inquiriesData = await fetchAllInquiries();
      
      if (inquiriesData.length === 0) {
        setInquiries([]);
        setFilteredInquiries([]);
        setLoading(false);
        return;
      }
      
      // 2. Extract all inquiry IDs
      const inquiryIds = inquiriesData.map(inq => inq.id);
      
      // 3. Fetch costing data
      const costingMap = await fetchAllCostings(inquiryIds);
      
      // 4. Combine data with FIXED customer/buyer name extraction
      const combinedData = inquiriesData.map((inquiry) => {
        const backendCosting = costingMap[inquiry.id];
        
        const inquiryGarment = inquiry.garment && 
          ["knit", "woven", "sweater"].includes(inquiry.garment) 
          ? inquiry.garment 
          : "knit";
        
        // FIXED: Use the helper functions for customer and buyer names
        const customerDisplayName = getCustomerName(inquiry);
        const buyerDisplayName = getBuyerName(inquiry);
        
        return {
          ...inquiry,
          ...(backendCosting || {}),
          inquiry_id: inquiry.id,
          id: inquiry.id,
          costing_id: backendCosting?.id,
          has_costing: !!backendCosting,
          display_garment_type: inquiryGarment,
          first_image: getFirstImage(inquiry),
          customer_display_name: customerDisplayName,
          buyer_display_name: buyerDisplayName,
          style_model: inquiry.same_style || inquiry.item || "—",
        };
      });
      
      setInquiries(combinedData);
      setFilteredInquiries(combinedData);
      setTotalItems(combinedData.length);
      
      // 5. Build costing data state from BACKEND ONLY (no localStorage)
      const newCostingData = {};
      
      combinedData.forEach((inquiry) => {
        const forcedGarmentType = inquiry.display_garment_type;
        
        if (inquiry.has_costing) {
          // Use backend data
          newCostingData[inquiry.id] = {
            garment_type: forcedGarmentType,
            yarn_price: inquiry.yarn_price || "",
            knitting: inquiry.knitting || "",
            dyeing: inquiry.dyeing || "",
            aop: inquiry.aop || "",
            woven_fabric_price: inquiry.woven_fabric_price || "",
            sweater_yarn_rate: inquiry.sweater_yarn_rate || "",
            sweater_consumption: inquiry.sweater_consumption || "",
            sweater_knitting_charge: inquiry.sweater_knitting_charge || "",
            sweater_linking: inquiry.sweater_linking || "",
            sweater_washing: inquiry.sweater_washing || "",
            sweater_yarn_weight: inquiry.sweater_yarn_weight || "",
            sweater_gauge: inquiry.sweater_gauge || "",
            consumption_dz: inquiry.consumption_dz || "",
            accessories: inquiry.accessories || "",
            print_emb: inquiry.print_emb || "",
            wash: inquiry.wash || "",
            cm: inquiry.cm || "",
            test_com: inquiry.test_com || "",
            others: inquiry.others || "",
            fabric_price_multiplier: inquiry.fabric_price_multiplier || "0",
          };
        } else {
          // Empty state for inquiries without costing
          newCostingData[inquiry.id] = {
            garment_type: forcedGarmentType,
            yarn_price: "",
            knitting: "",
            dyeing: "",
            aop: "",
            woven_fabric_price: "",
            sweater_yarn_rate: "",
            sweater_consumption: "",
            sweater_knitting_charge: "",
            sweater_linking: "",
            sweater_washing: "",
            sweater_yarn_weight: "",
            sweater_gauge: "",
            consumption_dz: "",
            accessories: "",
            print_emb: "",
            wash: "",
            cm: "",
            test_com: "",
            others: "",
            fabric_price_multiplier: "0",
          };
        }
      });
      
      setCostingData(newCostingData);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter and sort - FIXED to use correct fields
  useEffect(() => {
    let filtered = [...inquiries];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (inquiry) =>
          inquiry.inquiry_no?.toLowerCase().includes(term) ||
          inquiry.style_model?.toLowerCase().includes(term) ||
          inquiry.item?.toLowerCase().includes(term) ||
          inquiry.customer_display_name?.toLowerCase().includes(term) ||
          inquiry.buyer_display_name?.toLowerCase().includes(term),
      );
    }

    if (garmentTypeFilter !== "all") {
      filtered = filtered.filter(
        (inquiry) => inquiry.display_garment_type === garmentTypeFilter,
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (inquiry) => inquiry.current_status === statusFilter,
      );
    }

    filtered.sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";

      if (sortField === "inquiry_no" || sortField === "style_model" || sortField === "item" || sortField === "customer_display_name") {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    setFilteredInquiries(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  }, [searchTerm, garmentTypeFilter, statusFilter, sortField, sortDirection, inquiries]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleCostingChange = (inquiryId, field, value) => {
    if (field === "garment_type") {
      const validGarmentTypes = ["knit", "woven", "sweater"];
      if (!validGarmentTypes.includes(value)) {
        const inquiry = inquiries.find((i) => i.id === inquiryId);
        value = inquiry?.display_garment_type || "knit";
      }
    }

    setCostingData((prev) => ({
      ...prev,
      [inquiryId]: { ...prev[inquiryId], [field]: value },
    }));
  };

  const toggleExpandRow = (inquiryId) => {
    setExpandedRows((prev) => ({ ...prev, [inquiryId]: !prev[inquiryId] }));
  };

  const showNotification = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const saveCosting = async (inquiryId) => {
    setSavingRows((prev) => ({ ...prev, [inquiryId]: true }));

    try {
      const data = costingData[inquiryId];
      const inquiry = inquiries.find((i) => i.id === inquiryId);

      const payload = {
        inquiry: inquiryId,
        garment_type: data.garment_type,
        yarn_price: data.yarn_price ? parseFloat(data.yarn_price) : null,
        knitting: data.knitting ? parseFloat(data.knitting) : null,
        dyeing: data.dyeing ? parseFloat(data.dyeing) : null,
        aop: data.aop ? parseFloat(data.aop) : null,
        woven_fabric_price: data.woven_fabric_price ? parseFloat(data.woven_fabric_price) : null,
        sweater_yarn_rate: data.sweater_yarn_rate ? parseFloat(data.sweater_yarn_rate) : null,
        sweater_consumption: data.sweater_consumption ? parseFloat(data.sweater_consumption) : null,
        sweater_knitting_charge: data.sweater_knitting_charge ? parseFloat(data.sweater_knitting_charge) : null,
        sweater_linking: data.sweater_linking ? parseFloat(data.sweater_linking) : null,
        sweater_washing: data.sweater_washing ? parseFloat(data.sweater_washing) : null,
        sweater_yarn_weight: data.sweater_yarn_weight ? parseFloat(data.sweater_yarn_weight) : null,
        sweater_gauge: data.sweater_gauge || null,
        consumption_dz: data.consumption_dz ? parseFloat(data.consumption_dz) : null,
        accessories: data.accessories ? parseFloat(data.accessories) : null,
        print_emb: data.print_emb ? parseFloat(data.print_emb) : null,
        wash: data.wash ? parseFloat(data.wash) : null,
        cm: data.cm ? parseFloat(data.cm) : null,
        test_com: data.test_com ? parseFloat(data.test_com) : null,
        others: data.others ? parseFloat(data.others) : null,
        fabric_price_multiplier: data.fabric_price_multiplier ? parseFloat(data.fabric_price_multiplier) : 0,
        model_name: inquiry.same_style || inquiry.item,
        wgr_display: inquiry.wgr,
        buyer_display: inquiry.buyer_display_name || getBuyerName(inquiry),
        pdm_key: inquiry.pdm_key,
        short_description: inquiry.short_description,
        fabrication: inquiry.fabrication,
        total_quantity: inquiry.order_quantity,
        price_list_all_supplier: "",
        costing_remarks: "",
      };

      const response = await api.post(`/inquiry-costing/`, payload);

      if (response.status === 200 || response.status === 201) {
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === inquiryId
              ? { ...inq, has_costing: true, costing_id: response.data.id }
              : inq,
          ),
        );
        showNotification(`Costing saved for ${inquiry.inquiry_no || inquiryId}`, "success");
        // Refresh data after save to show updated values
        fetchData();
      }
    } catch (error) {
      console.error("Error saving costing:", error);
      showNotification(`Error: ${error.response?.data?.error || error.message}`, "error");
    } finally {
      setSavingRows((prev) => ({ ...prev, [inquiryId]: false }));
    }
  };

  const saveAllCostings = async () => {
    let successCount = 0;
    let failCount = 0;
    setSaving(true);

    for (const inquiry of filteredInquiries) {
      try {
        const data = costingData[inquiry.id];
        const payload = {
          inquiry: inquiry.id,
          garment_type: data.garment_type,
          yarn_price: data.yarn_price ? parseFloat(data.yarn_price) : null,
          knitting: data.knitting ? parseFloat(data.knitting) : null,
          dyeing: data.dyeing ? parseFloat(data.dyeing) : null,
          aop: data.aop ? parseFloat(data.aop) : null,
          woven_fabric_price: data.woven_fabric_price ? parseFloat(data.woven_fabric_price) : null,
          sweater_yarn_rate: data.sweater_yarn_rate ? parseFloat(data.sweater_yarn_rate) : null,
          sweater_consumption: data.sweater_consumption ? parseFloat(data.sweater_consumption) : null,
          sweater_knitting_charge: data.sweater_knitting_charge ? parseFloat(data.sweater_knitting_charge) : null,
          sweater_linking: data.sweater_linking ? parseFloat(data.sweater_linking) : null,
          sweater_washing: data.sweater_washing ? parseFloat(data.sweater_washing) : null,
          sweater_yarn_weight: data.sweater_yarn_weight ? parseFloat(data.sweater_yarn_weight) : null,
          sweater_gauge: data.sweater_gauge || null,
          consumption_dz: data.consumption_dz ? parseFloat(data.consumption_dz) : null,
          accessories: data.accessories ? parseFloat(data.accessories) : null,
          print_emb: data.print_emb ? parseFloat(data.print_emb) : null,
          wash: data.wash ? parseFloat(data.wash) : null,
          cm: data.cm ? parseFloat(data.cm) : null,
          test_com: data.test_com ? parseFloat(data.test_com) : null,
          others: data.others ? parseFloat(data.others) : null,
          fabric_price_multiplier: data.fabric_price_multiplier ? parseFloat(data.fabric_price_multiplier) : 0,
          model_name: inquiry.same_style || inquiry.item,
          wgr_display: inquiry.wgr,
          buyer_display: inquiry.buyer_display_name || getBuyerName(inquiry),
          pdm_key: inquiry.pdm_key,
          short_description: inquiry.short_description,
          fabrication: inquiry.fabrication,
          total_quantity: inquiry.order_quantity,
          price_list_all_supplier: "",
          costing_remarks: "",
        };

        await api.post(`/inquiry-costing/`, payload);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    setSaving(false);
    showNotification(`Saved ${successCount} of ${filteredInquiries.length} inquiries. Failed: ${failCount}`, successCount > 0 ? "success" : "error");
    fetchData();
  };

  const refreshData = () => {
    fetchData();
    showNotification("Data refreshed from server", "success");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setGarmentTypeFilter("all");
    setStatusFilter("all");
    setSortField("inquiry_no");
    setSortDirection("asc");
    showNotification("Filters cleared!", "success");
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: "#fef3c7", color: "#d97706", icon: "⏳", label: "Pending" },
      quoted: { bg: "#dbeafe", color: "#2563eb", icon: "📝", label: "Quoted" },
      confirmed: { bg: "#d1fae5", color: "#059669", icon: "✅", label: "Confirmed" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "10px",
          fontWeight: "600",
          background: config.bg,
          color: config.color,
        }}
      >
        {config.icon} {config.label}
      </span>
    );
  };

  const getGarmentBadge = (type) => {
    const garmentConfig = {
      knit: { bg: "#e0f2fe", color: "#0369a1", icon: "🧶", label: "Knit" },
      woven: { bg: "#fce7f3", color: "#be185d", icon: "👕", label: "Woven" },
      sweater: { bg: "#fed7aa", color: "#9a3412", icon: "🧥", label: "Sweater" },
    };
    const config = garmentConfig[type] || garmentConfig.knit;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "10px",
          fontWeight: "500",
          background: config.bg,
          color: config.color,
        }}
      >
        {config.icon} {config.label}
      </span>
    );
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedInquiries = filteredInquiries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
            <button onClick={fetchData} style={styles.btnPrimary}>
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
        {/* Toast Notification */}
        {showToast && (
          <div
            style={{
              ...styles.toast,
              background: toastType === "error" ? "#ef4444" : "#10b981",
            }}
          >
            <span>{toastType === "error" ? "⚠️" : "✅"}</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <div style={styles.headerBadge}>💰</div>
              <h1 style={styles.headerTitle}>Bulk Costing</h1>
            </div>
            <div style={styles.headerActions}>
              <Link to="/inquiries" style={styles.btnSecondary}>
                ← Back to Inquiries
              </Link>
              <button onClick={refreshData} style={styles.btnSecondary}>
                🔄 Refresh
              </button>
              <button
                onClick={saveAllCostings}
                disabled={saving}
                style={styles.btnPrimary}
              >
                {saving ? "Saving..." : "💾 Save All"}
              </button>
            </div>
          </div>
          <p style={styles.headerSubtitle}>
            Edit all costing fields directly in the table — changes saved to server
          </p>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📋</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{inquiries.length.toLocaleString()}</span>
              <span style={styles.statLabel}>Total Inquiries</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{inquiries.filter((i) => i.has_costing).length.toLocaleString()}</span>
              <span style={styles.statLabel}>Costing Completed</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏳</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{inquiries.filter((i) => !i.has_costing).length.toLocaleString()}</span>
              <span style={styles.statLabel}>Pending Costing</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🎯</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{filteredInquiries.length.toLocaleString()}</span>
              <span style={styles.statLabel}>Filtered Results</span>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div style={styles.filterSection}>
          <div style={styles.filterHeader} onClick={() => setShowFilters(!showFilters)}>
            <div style={styles.filterHeaderLeft}>
              <span style={styles.filterIcon}>🔍</span>
              <h3 style={styles.filterTitle}>Advanced Filters</h3>
              <span style={styles.filterBadge}>{filteredInquiries.length} results</span>
            </div>
            <button style={styles.filterToggle}>{showFilters ? "▲" : "▼"}</button>
          </div>
          {showFilters && (
            <div style={styles.filterBody}>
              <div style={styles.filterGrid}>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.filterInput}
                    placeholder="Search by inquiry, style, customer, buyer..."
                  />
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Garment Type</label>
                  <select
                    value={garmentTypeFilter}
                    onChange={(e) => setGarmentTypeFilter(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="all">All Types</option>
                    <option value="knit">Knit</option>
                    <option value="woven">Woven</option>
                    <option value="sweater">Sweater</option>
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="quoted">Quoted</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Rows per page</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    style={styles.filterSelect}
                  >
                    <option value="15">15</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
              <div style={styles.filterActions}>
                <button onClick={clearFilters} style={styles.btnClear}>
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeaderFixed}>
            <div style={styles.tableTitle}>
              <h3>Costing List</h3>
              <span style={styles.tableCount}>{filteredInquiries.length} items</span>
            </div>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}></th>
                  <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => handleSort("inquiry_no")}>
                    Inquiry No {sortField === "inquiry_no" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => handleSort("style_model")}>
                    Style/Model {sortField === "style_model" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => handleSort("customer_display_name")}>
                    Customer {sortField === "customer_display_name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th style={styles.th}>Buyer</th>
                  <th style={styles.th}>Garment</th>
                  <th style={styles.th}>Costing Fields</th>
                  <th style={styles.th}>Consumption</th>
                  <th style={styles.th}>Acc / CM</th>
                  <th style={styles.th}>DZ Price</th>
                  <th style={styles.th}>Pcs Price</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInquiries.map((inquiry) => {
                  const data = costingData[inquiry.id] || {};
                  const garmentType = data.garment_type || inquiry.display_garment_type;
                  const isExpanded = expandedRows[inquiry.id];
                  const isSaving = savingRows[inquiry.id];
                  const hasImage = inquiry.first_image && !imageErrors[inquiry.id];

                  return (
                    <React.Fragment key={inquiry.id}>
                      <tr style={styles.tr}>
                        <td style={styles.td}>
                          <button onClick={() => toggleExpandRow(inquiry.id)} style={styles.expandBtn}>
                            {isExpanded ? "▲" : "▼"}
                          </button>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.inquiryCell}>
                            {hasImage && (
                              <img
                                src={inquiry.first_image}
                                alt="thumb"
                                style={styles.thumbnail}
                                onError={() => setImageErrors((prev) => ({ ...prev, [inquiry.id]: true }))}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImageModal({ isOpen: true, url: inquiry.first_image });
                                }}
                              />
                            )}
                            <div>
                              <div style={styles.inquiryNo} onClick={() => navigate(`/inquiries/${inquiry.id}`)}>
                                {inquiry.inquiry_no || `INQ-${inquiry.id}`}
                              </div>
                              <div style={styles.badgeRow}>{getStatusBadge(inquiry.current_status)}</div>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.styleModel} title={inquiry.style_model}>
                            {inquiry.style_model}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.customerName} title={inquiry.customer_display_name}>
                            {inquiry.customer_display_name}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.buyerName} title={inquiry.buyer_display_name}>
                            {inquiry.buyer_display_name}
                          </div>
                        </td>
                        <td style={styles.td}>
                          {getGarmentBadge(inquiry.display_garment_type)}
                        </td>
                        <td style={styles.td}>
                          {garmentType === "knit" && (
                            <div className="fields-grid">
                              <div className="field-item">
                                <label>Yarn</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={data.yarn_price || ""}
                                  onChange={(e) => handleCostingChange(inquiry.id, "yarn_price", e.target.value)}
                                  placeholder="$"
                                />
                              </div>
                              <div className="field-item">
                                <label>Knit</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={data.knitting || ""}
                                  onChange={(e) => handleCostingChange(inquiry.id, "knitting", e.target.value)}
                                  placeholder="$"
                                />
                              </div>
                              <div className="field-item">
                                <label>Dye</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={data.dyeing || ""}
                                  onChange={(e) => handleCostingChange(inquiry.id, "dyeing", e.target.value)}
                                  placeholder="$"
                                />
                              </div>
                              <div className="field-item">
                                <label>AOP</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={data.aop || ""}
                                  onChange={(e) => handleCostingChange(inquiry.id, "aop", e.target.value)}
                                  placeholder="$"
                                />
                              </div>
                              <div className="field-item">
                                <label>%</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={data.fabric_price_multiplier || "0"}
                                  onChange={(e) => handleCostingChange(inquiry.id, "fabric_price_multiplier", e.target.value)}
                                  placeholder="%"
                                />
                              </div>
                            </div>
                          )}
                          {garmentType === "woven" && (
                            <div className="fields-grid two-cols">
                              <div className="field-item">
                                <label>Fabric $/DZ</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={data.woven_fabric_price || ""}
                                  onChange={(e) => handleCostingChange(inquiry.id, "woven_fabric_price", e.target.value)}
                                  placeholder="$"
                                />
                              </div>
                              <div className="field-item">
                                <label>%</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={data.fabric_price_multiplier || "0"}
                                  onChange={(e) => handleCostingChange(inquiry.id, "fabric_price_multiplier", e.target.value)}
                                  placeholder="%"
                                />
                              </div>
                            </div>
                          )}
                          {garmentType === "sweater" && (
                            <div className="fields-grid sweater-grid">
                              <div className="field-item">
                                <label>Yarn $/kg</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={data.sweater_yarn_rate || ""}
                                  onChange={(e) => handleCostingChange(inquiry.id, "sweater_yarn_rate", e.target.value)}
                                  placeholder="$"
                                />
                              </div>
                              <div className="field-item">
                                <label>Consump kg/doz</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={data.sweater_consumption || ""}
                                  onChange={(e) => handleCostingChange(inquiry.id, "sweater_consumption", e.target.value)}
                                  placeholder="kg"
                                />
                              </div>
                              <div className="field-item">
                                <label>Knit $/pc</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={data.sweater_knitting_charge || ""}
                                  onChange={(e) => handleCostingChange(inquiry.id, "sweater_knitting_charge", e.target.value)}
                                  placeholder="$"
                                />
                              </div>
                              <div className="field-item">
                                <label>Link $/pc</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={data.sweater_linking || ""}
                                  onChange={(e) => handleCostingChange(inquiry.id, "sweater_linking", e.target.value)}
                                  placeholder="$"
                                />
                              </div>
                              <div className="field-item">
                                <label>Wash $/pc</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={data.sweater_washing || ""}
                                  onChange={(e) => handleCostingChange(inquiry.id, "sweater_washing", e.target.value)}
                                  placeholder="$"
                                />
                              </div>
                              <div className="field-item">
                                <label>Yarn Wt g/pc</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={data.sweater_yarn_weight || ""}
                                  onChange={(e) => handleCostingChange(inquiry.id, "sweater_yarn_weight", e.target.value)}
                                  placeholder="g"
                                />
                              </div>
                              <div className="field-item">
                                <label>Gauge</label>
                                <select
                                  value={data.sweater_gauge || ""}
                                  onChange={(e) => handleCostingChange(inquiry.id, "sweater_gauge", e.target.value)}
                                  style={styles.gaugeSelect}
                                >
                                  <option value="">Select</option>
                                  <option value="3GG">3GG</option>
                                  <option value="5GG">5GG</option>
                                  <option value="7GG">7GG</option>
                                  <option value="10GG">10GG</option>
                                  <option value="12GG">12GG</option>
                                  <option value="14GG">14GG</option>
                                  <option value="16GG">16GG</option>
                                </select>
                              </div>
                              <div className="field-item">
                                <label>%</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={data.fabric_price_multiplier || "0"}
                                  onChange={(e) => handleCostingChange(inquiry.id, "fabric_price_multiplier", e.target.value)}
                                  placeholder="%"
                                />
                              </div>
                            </div>
                          )}
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            step="0.01"
                            value={data.consumption_dz || ""}
                            onChange={(e) => handleCostingChange(inquiry.id, "consumption_dz", e.target.value)}
                            className="small-input"
                            placeholder="0.00"
                          />
                        </td>
                        <td style={styles.td}>
                          <div className="fields-grid two-cols">
                            <div className="field-item">
                              <label>Acc</label>
                              <input
                                type="number"
                                step="0.01"
                                value={data.accessories || ""}
                                onChange={(e) => handleCostingChange(inquiry.id, "accessories", e.target.value)}
                                placeholder="$"
                              />
                            </div>
                            <div className="field-item">
                              <label>CM</label>
                              <input
                                type="number"
                                step="0.01"
                                value={data.cm || ""}
                                onChange={(e) => handleCostingChange(inquiry.id, "cm", e.target.value)}
                                placeholder="$"
                              />
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.priceValue}>${calculateDzPrice(data)}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.priceValue}>${calculatePriceInPcs(data)}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionButtons}>
                            <button onClick={() => saveCosting(inquiry.id)} disabled={isSaving} className="save-btn" title="Save Costing">
                              {isSaving ? "⏳" : "💾"}
                            </button>
                            <button onClick={() => navigate(`/inquiries/${inquiry.id}/costing`)} className="costing-btn" title="Full Costing Page">
                              📊
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr style={styles.expandedRow}>
                          <td colSpan="12" style={styles.expandedCell}>
                            <div style={styles.expandedContent}>
                              <div style={styles.expandedSection}>
                                <h4>🎨 Additional Production Costs ($/DZ)</h4>
                                <div className="expanded-grid">
                                  <div className="expanded-field">
                                    <label>Print/Embroidery:</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={data.print_emb || ""}
                                      onChange={(e) => handleCostingChange(inquiry.id, "print_emb", e.target.value)}
                                      placeholder="$"
                                    />
                                  </div>
                                  <div className="expanded-field">
                                    <label>Wash:</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={data.wash || ""}
                                      onChange={(e) => handleCostingChange(inquiry.id, "wash", e.target.value)}
                                      placeholder="$"
                                    />
                                  </div>
                                  <div className="expanded-field">
                                    <label>Test + Commission:</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={data.test_com || ""}
                                      onChange={(e) => handleCostingChange(inquiry.id, "test_com", e.target.value)}
                                      placeholder="$"
                                    />
                                  </div>
                                  <div className="expanded-field">
                                    <label>Others:</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={data.others || ""}
                                      onChange={(e) => handleCostingChange(inquiry.id, "others", e.target.value)}
                                      placeholder="$"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div style={styles.expandedSection}>
                                <h4>📊 Cost Summary</h4>
                                <div style={styles.summaryCard}>
                                  <div>
                                    <span>Fabric Cost:</span>
                                    <strong>${calculateTotalFabricPrice(data)}</strong>
                                  </div>
                                  <div>
                                    <span>Accessories:</span>
                                    <strong>${(parseFloat(data.accessories) || 0).toFixed(2)}</strong>
                                  </div>
                                  <div>
                                    <span>CM Cost:</span>
                                    <strong>${(parseFloat(data.cm) || 0).toFixed(2)}</strong>
                                  </div>
                                  <div className="total">
                                    <span>Total DZ Price:</span>
                                    <strong>${calculateDzPrice(data)}</strong>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredInquiries.length > 0 && (
            <div style={styles.pagination}>
              <div style={styles.paginationLeft}>
                <span style={styles.paginationInfo}>📊 Total: {filteredInquiries.length} inquiries</span>
              </div>
              <div style={styles.paginationControls}>
                <button
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  style={styles.paginationButton}
                >
                  ← Prev
                </button>
                <div style={styles.pageNumbers}>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={pageNum === currentPage ? styles.paginationButtonActive : styles.paginationButtonNumber}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={styles.paginationButton}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={styles.footerInfo}>
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} entries
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal imageUrl={imageModal.url} isOpen={imageModal.isOpen} onClose={() => setImageModal({ isOpen: false, url: "" })} />
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
    padding: "16px 20px",
    overflow: "auto",
    maxHeight: "100vh",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#f0f2f5",
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
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "400px",
    textAlign: "center",
  },
  errorIcon: { fontSize: "48px", marginBottom: "16px" },
  errorTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#dc2626",
    marginBottom: "8px",
  },
  errorMessage: { fontSize: "14px", color: "#64748b", marginBottom: "20px" },
  toast: {
    position: "fixed",
    bottom: "30px",
    right: "30px",
    color: "white",
    padding: "10px 16px",
    borderRadius: "10px",
    fontSize: "12px",
    zIndex: 10001,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    animation: "slideIn 0.3s ease",
  },
  header: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: "14px",
    padding: "16px 20px",
    marginBottom: "16px",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    flexWrap: "wrap",
    gap: "10px",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "10px" },
  headerBadge: {
    background: "rgba(255,255,255,0.15)",
    borderRadius: "10px",
    padding: "6px 10px",
    fontSize: "18px",
  },
  headerTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "white",
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.7)",
    margin: 0,
  },
  headerActions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  btnPrimary: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    padding: "6px 14px",
    borderRadius: "8px",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnSecondary: {
    background: "white",
    color: "#475569",
    padding: "6px 14px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    marginBottom: "16px",
  },
  statCard: {
    background: "white",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  statIcon: {
    fontSize: "24px",
    background: "#f0f2f5",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
  },
  statInfo: { display: "flex", flexDirection: "column" },
  statValue: { fontSize: "20px", fontWeight: "700", color: "#0f172a" },
  statLabel: { fontSize: "11px", color: "#64748b", marginTop: "2px" },
  filterSection: {
    background: "white",
    borderRadius: "12px",
    marginBottom: "16px",
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  filterHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    cursor: "pointer",
    borderBottom: "1px solid #e2e8f0",
  },
  filterHeaderLeft: { display: "flex", alignItems: "center", gap: "8px" },
  filterIcon: { fontSize: "14px" },
  filterTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  filterBadge: {
    background: "#e2e8f0",
    padding: "2px 6px",
    borderRadius: "12px",
    fontSize: "10px",
    color: "#475569",
  },
  filterToggle: {
    background: "none",
    border: "none",
    fontSize: "12px",
    cursor: "pointer",
  },
  filterBody: { padding: "12px" },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
    marginBottom: "10px",
  },
  filterGroup: { display: "flex", flexDirection: "column", gap: "3px" },
  filterLabel: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
  },
  filterInput: {
    padding: "6px 8px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    background: "white",
  },
  filterSelect: {
    padding: "6px 8px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    background: "white",
  },
  filterActions: { display: "flex", justifyContent: "flex-end" },
  btnClear: {
    background: "white",
    color: "#64748b",
    padding: "6px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "500",
    cursor: "pointer",
  },
  tableContainer: {
    background: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 200px)",
    minHeight: "550px",
  },
  tableWrapper: {
    flex: 1,
    overflow: "auto",
    minHeight: "450px",
    maxHeight: "calc(100vh - 220px)",
  },
  tableHeaderFixed: {
    padding: "10px 14px",
    borderBottom: "1px solid #e2e8f0",
    background: "white",
    flexShrink: 0,
  },
  tableTitle: { display: "flex", alignItems: "center", gap: "8px" },
  tableCount: {
    background: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "12px",
    fontSize: "10px",
    color: "#475569",
    marginBottom: "0px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1500px",
    fontSize: "11px",
    marginBottom: "0px",
  },
  th: {
    padding: "5px 10px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "600",
    color: "#475569",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  tr: { borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" },
  td: {
    padding: "5px 10px",
    fontSize: "11px",
    color: "#334155",
    verticalAlign: "top",
  },
  expandBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: "10px",
  },
  inquiryCell: { display: "flex", alignItems: "center", gap: "8px" },
  thumbnail: {
    width: "36px",
    height: "36px",
    objectFit: "cover",
    borderRadius: "6px",
    cursor: "pointer",
    border: "1px solid #e2e8f0",
  },
  inquiryNo: {
    fontWeight: "600",
    color: "#3b82f6",
    cursor: "pointer",
    fontSize: "12px",
  },
  badgeRow: { marginTop: "4px" },
  styleModel: { fontWeight: "500", fontSize: "12px", marginBottom: "4px" },
  customerName: {
    fontWeight: "500",
    fontSize: "12px",
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  buyerName: {
    fontSize: "11px",
    color: "#6b7280",
    maxWidth: "120px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  priceValue: { fontWeight: "700", color: "#10b981", fontSize: "13px" },
  actionButtons: { display: "flex", gap: "6px" },
  expandedRow: { background: "#f8fafc" },
  expandedCell: { padding: "16px 20px", borderTop: "1px solid #e2e8f0" },
  expandedContent: { display: "flex", gap: "24px", flexWrap: "wrap" },
  expandedSection: { flex: 1, minWidth: "250px" },
  summaryCard: {
    background: "#f1f5f9",
    borderRadius: "10px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "6px",
    padding: "12px",
    borderTop: "1px solid #e2e8f0",
    background: "white",
    flexShrink: 0,
    flexWrap: "wrap",
  },
  paginationLeft: { display: "flex", alignItems: "center" },
  paginationControls: { display: "flex", alignItems: "center", gap: "6px" },
  paginationInfo: {
    fontSize: "11px",
    color: "#475569",
    fontWeight: "500",
    background: "#f1f5f9",
    padding: "4px 10px",
    borderRadius: "6px",
  },
  paginationButton: {
    padding: "4px 10px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "11px",
  },
  paginationButtonNumber: {
    padding: "4px 8px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "11px",
  },
  paginationButtonActive: {
    padding: "4px 8px",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "11px",
  },
  pageNumbers: { display: "flex", gap: "3px" },
  footerInfo: {
    marginTop: "12px",
    fontSize: "11px",
    color: "#64748b",
    textAlign: "center",
  },
};

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.85)",
    zIndex: 20000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: "white",
    borderRadius: "16px",
    width: "90vw",
    maxWidth: "800px",
    height: "85vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "14px 18px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f8fafc",
  },
  headerIcon: { fontSize: "18px" },
  title: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
    flex: 1,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#94a3b8",
    padding: "4px",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 16px",
    backgroundColor: "#f1f5f9",
    borderBottom: "1px solid #e2e8f0",
  },
  toolBtn: {
    background: "white",
    border: "1px solid #e2e8f0",
    padding: "4px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
  },
  zoomLevel: {
    fontSize: "12px",
    fontWeight: "500",
    minWidth: "50px",
    textAlign: "center",
  },
  dragHint: { marginLeft: "auto", fontSize: "10px", color: "#64748b" },
  imageContainer: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f172a",
    cursor: "grab",
  },
  image: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    transition: "transform 0.1s ease-out",
  },
};

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    
    .fields-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
    }
    .fields-grid.two-cols {
      grid-template-columns: repeat(2, 1fr);
    }
    .fields-grid.sweater-grid {
      grid-template-columns: repeat(4, 1fr);
    }
    .field-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .field-item label {
      font-size: 8px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .field-item input, .field-item select {
      width: 100%;
      padding: 6px 4px;
      font-size: 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      text-align: center;
      background: white;
      transition: all 0.2s;
    }
    .field-item input:focus, .field-item select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.1);
    }
    .small-input {
      width: 70px;
      padding: 6px 8px;
      font-size: 11px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      text-align: center;
      background: white;
    }
    .small-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.1);
    }
    .save-btn, .costing-btn {
      background: #3b82f6;
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      border: none;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .costing-btn {
      background: #8b5cf6;
    }
    .save-btn:hover, .costing-btn:hover {
      transform: translateY(-1px);
      opacity: 0.9;
    }
    .expanded-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .expanded-field {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .expanded-field label {
      font-size: 11px;
      color: #64748b;
      min-width: 110px;
    }
    .expanded-field input {
      flex: 1;
      padding: 6px 8px;
      font-size: 11px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .expanded-field input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.1);
    }
    .summary-card div {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }
    .summary-card .total {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid #e2e8f0;
      font-weight: 600;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}

export default BulkCosting;