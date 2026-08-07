// InquiryCosting.jsx - Complete with Knit, Woven, Sweater modes + Garment Type Locking

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";
import { useParams, useNavigate } from "react-router-dom";

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
  const token = getCookie("csrftoken");
  if (token) {
    config.headers["X-CSRFToken"] = token;
  }
  return config;
});

const getCustomerDisplayName = (customer) => {
  if (!customer) return "-";
  if (typeof customer === "object") {
    if (customer.customer_name) return customer.customer_name;
    if (customer.name) {
      if (typeof customer.name === "object" && customer.name.customer_name) {
        return customer.name.customer_name;
      }
      if (typeof customer.name === "string") return customer.name;
    }
    if (customer.hrms_customer_name) return customer.hrms_customer_name;
    if (customer.display_name) return customer.display_name;
    return `Cust ${customer.id}`;
  }
  return customer.toString() || "-";
};

const getBuyerDisplayName = (buyer) => {
  if (!buyer) return "-";
  if (typeof buyer === "object") {
    return buyer.name || `Buyer ${buyer.id}`;
  }
  return buyer.toString() || "-";
};

// Image Zoom Modal Component
const ImageZoomModal = ({
  imageUrl,
  isOpen,
  onClose,
  onSaveRotation,
  initialRotation = 0,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(initialRotation);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((prev) => {
      const newZoom = Math.min(Math.max(prev + delta, 0.5), 5);
      if (newZoom === 0.5) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 5));
  const handleZoomOut = () =>
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 0.25, 0.5);
      if (newZoom === 0.5) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  const handleRotateLeft = () => setRotation((prev) => (prev - 90) % 360);
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };
  const handleSaveRotation = () => onSaveRotation && onSaveRotation(rotation);

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      const container = imageContainerRef.current;
      if (container) {
        const maxX = (container.clientWidth * (zoomLevel - 1)) / 2;
        const maxY = (container.clientHeight * (zoomLevel - 1)) / 2;
        setPosition({
          x: Math.min(Math.max(newX, -maxX), maxX),
          y: Math.min(Math.max(newY, -maxY), maxY),
        });
      }
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const container = imageContainerRef.current;
    if (container && isOpen) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setZoomLevel(1);
      setRotation(initialRotation);
      setPosition({ x: 0, y: 0 });
    }
    return () => (document.body.style.overflow = "unset");
  }, [isOpen, initialRotation]);

  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>Image Preview</h3>
          <button style={modalStyles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>
        <div style={modalStyles.toolbar}>
          <button onClick={handleZoomOut} style={modalStyles.toolBtn}>
            🔍−
          </button>
          <span style={modalStyles.zoomLevel}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button onClick={handleZoomIn} style={modalStyles.toolBtn}>
            🔍+
          </button>
          <button onClick={handleRotateLeft} style={modalStyles.toolBtn}>
            ↺
          </button>
          <button onClick={handleRotateRight} style={modalStyles.toolBtn}>
            ↻
          </button>
          <button onClick={handleReset} style={modalStyles.toolBtn}>
            ⟳ Reset
          </button>
          {onSaveRotation && (
            <button
              onClick={handleSaveRotation}
              style={{ ...modalStyles.toolBtn, background: "#10b981" }}
            >
              💾 Save Rotation
            </button>
          )}
          {zoomLevel > 1 && (
            <span style={modalStyles.dragHint}>✋ Drag to pan</span>
          )}
          <span style={modalStyles.wheelHint}>🖱️ Scroll to zoom</span>
        </div>
        <div
          ref={imageContainerRef}
          style={modalStyles.imageContainer}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={imageUrl}
            alt="Zoomed"
            style={{
              ...modalStyles.image,
              transform: `scale(${zoomLevel}) rotate(${rotation}deg) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
              cursor:
                zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default",
            }}
          />
        </div>
      </div>
    </div>
  );
};

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    width: "90vw",
    height: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    borderBottom: "1px solid #334155",
  },
  title: { color: "white", fontSize: "16px", fontWeight: "600", margin: 0 },
  closeBtn: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "28px",
    cursor: "pointer",
    padding: "0 8px",
    lineHeight: 1,
    borderRadius: "4px",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 20px",
    backgroundColor: "#0f172a",
    borderBottom: "1px solid #334155",
    flexWrap: "wrap",
  },
  toolBtn: {
    background: "#334155",
    border: "none",
    color: "white",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  zoomLevel: {
    color: "#94a3b8",
    fontSize: "13px",
    minWidth: "50px",
    textAlign: "center",
  },
  dragHint: {
    marginLeft: "auto",
    color: "#64748b",
    fontSize: "11px",
    fontStyle: "italic",
  },
  wheelHint: { color: "#64748b", fontSize: "11px", fontStyle: "italic" },
  imageContainer: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "grab",
  },
  image: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    transition: "transform 0.1s ease-out",
    willChange: "transform",
  },
};

const InquiryCosting = () => {
  const { inquiryId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [inquiry, setInquiry] = useState(null);
  const [allImages, setAllImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [supplierPrices, setSupplierPrices] = useState([]);
  const [suppliersData, setSuppliersData] = useState([]);

  // Garment type locking states
  const [isGarmentLocked, setIsGarmentLocked] = useState(false);
  const [garmentType, setGarmentType] = useState("knit");

  // Image zoom modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [currentImageRotation, setCurrentImageRotation] = useState(0);
  const [imageRotations, setImageRotations] = useState({});

  const [costing, setCosting] = useState({
    yarn_price: "",
    knitting: "",
    dyeing: "",
    aop: "",
    p_l: "",
    woven_fabric_price: "",
    sweater_yarn_weight: "",
    sweater_gauge: "",
    sweater_knitting_charge: "",
    sweater_linking: "",
    sweater_washing: "",
    sweater_yarn_rate: "",
    sweater_consumption: "",
    consumption_dz: "",
    accessories: "",
    print_emb: "",
    wash: "",
    cm: "",
    test_com: "",
    others: "",
    fabric_price_multiplier: "0",
    fabric_price_dz: "",
    total_fabric_price: "",
    dz_price: "",
    price_in_pcs: "",
  });

  const [displayFields, setDisplayFields] = useState({
    inquiry_no: "",
    model_name: "",
    wgr: "",
    buyer: "",
    pdm_key: "",
    short_description: "",
    fabrication: "",
    size_range: "",
    colours: "",
    handover_date: "",
    total_quantity: "",
    target_price: "",
    offer_price: "",
    confirmed_price: "",
    texweave_price: "",
    value: "",
    price_list_all_supplier: "",
    repeat_price: "",
    remarks: "",
  });

  const [colorSizeGroups, setColorSizeGroups] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);

  // Load saved rotations
  useEffect(() => {
    const savedRotations = localStorage.getItem(`image_rotations_${inquiryId}`);
    if (savedRotations) {
      try {
        setImageRotations(JSON.parse(savedRotations));
      } catch (e) {
        console.error(e);
      }
    }
  }, [inquiryId]);

  const saveRotationToStorage = useCallback(
    (imageUrl, rotation) => {
      const newRotations = { ...imageRotations, [imageUrl]: rotation };
      setImageRotations(newRotations);
      localStorage.setItem(
        `image_rotations_${inquiryId}`,
        JSON.stringify(newRotations),
      );
    },
    [imageRotations, inquiryId],
  );

  const handleImageClick = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setCurrentImageRotation(imageRotations[imageUrl] || 0);
    setIsModalOpen(true);
  };

  const handleSaveRotation = (rotation) => {
    saveRotationToStorage(modalImageUrl, rotation);
    setCurrentImageRotation(rotation);
  };

  const formatSupplierPricesForDisplay = (prices, suppliers) => {
    if (!prices || prices.length === 0) return "";
    const supplierNameMap = {};
    if (suppliers && suppliers.length > 0) {
      suppliers.forEach((supplier) => {
        supplierNameMap[supplier.id] =
          supplier.supplier_name || supplier.name || `Supplier ${supplier.id}`;
      });
    }
    const lines = [];
    for (const sp of prices) {
      let supplierName = null;
      if (sp.supplier_name) supplierName = sp.supplier_name;
      else if (
        sp.supplier &&
        typeof sp.supplier === "object" &&
        sp.supplier.supplier_name
      )
        supplierName = sp.supplier.supplier_name;
      else if (
        sp.supplier &&
        typeof sp.supplier === "object" &&
        sp.supplier.name
      )
        supplierName = sp.supplier.name;
      else if (sp.supplier_id && supplierNameMap[sp.supplier_id])
        supplierName = supplierNameMap[sp.supplier_id];
      else if (
        sp.supplier &&
        typeof sp.supplier === "number" &&
        supplierNameMap[sp.supplier]
      )
        supplierName = supplierNameMap[sp.supplier];
      else if (sp.supplier && typeof sp.supplier === "string")
        supplierName = sp.supplier;
      else
        supplierName = `Supplier ${sp.supplier || sp.supplier_id || sp.id || "?"}`;
      const price = parseFloat(sp.price || 0).toFixed(3);
      lines.push(`${supplierName} $${price}`);
    }
    return lines.join("\n");
  };

  useEffect(() => {
    if (!inquiryId) {
      setError("No inquiry ID provided.");
      setLoading(false);
      return;
    }
    const idNum = parseInt(inquiryId, 10);
    if (isNaN(idNum)) {
      setError(`Invalid inquiry ID: ${inquiryId}`);
      setLoading(false);
      return;
    }
    fetchData();
  }, [inquiryId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const idNum = parseInt(inquiryId, 10);
      const inquiryRes = await api.get(`/inquiry/${idNum}/`);
      const inquiryData = inquiryRes.data;
      setInquiry(inquiryData);

      if (inquiryData.suppliers && inquiryData.suppliers.length > 0) {
        setSuppliersData(inquiryData.suppliers);
      }

      let supplierPricesList = [];
      if (
        inquiryData.supplier_prices &&
        inquiryData.supplier_prices.length > 0
      ) {
        supplierPricesList = inquiryData.supplier_prices;
        setSupplierPrices(supplierPricesList);
        const formattedPrices = formatSupplierPricesForDisplay(
          supplierPricesList,
          inquiryData.suppliers,
        );
        if (
          formattedPrices &&
          (!displayFields.price_list_all_supplier ||
            displayFields.price_list_all_supplier === "")
        ) {
          setDisplayFields((prev) => ({
            ...prev,
            price_list_all_supplier: formattedPrices,
          }));
        }
      }

      if (
        inquiryData.multiple_images &&
        inquiryData.multiple_images.length > 0
      ) {
        const imageUrls = inquiryData.multiple_images.map((img) => {
          if (img.startsWith("http")) return img;
          if (img.startsWith("/")) return `http://119.148.51.38:8000${img}`;
          return `http://119.148.51.38:8000/${img}`;
        });
        setAllImages(imageUrls);
        setSelectedImage(imageUrls[0]);
      }

      // Handle garment type locking based on inquiry garment
      if (inquiryData.garment) {
        const garmentLower = inquiryData.garment.toLowerCase();
        if (garmentLower === "woven") {
          setGarmentType("woven");
          setIsGarmentLocked(true);
        } else if (garmentLower === "sweater") {
          setGarmentType("sweater");
          setIsGarmentLocked(true);
        } else if (garmentLower === "knit") {
          setGarmentType("knit");
          setIsGarmentLocked(true);
        } else {
          setGarmentType("knit");
          setIsGarmentLocked(false);
        }
      } else {
        setIsGarmentLocked(false);
      }

      if (
        inquiryData.color_size_groups &&
        inquiryData.color_size_groups.length > 0
      ) {
        setColorSizeGroups(inquiryData.color_size_groups);
        const total = inquiryData.color_size_groups.reduce(
          (sum, group) => sum + (group.total || 0),
          0,
        );
        setGrandTotal(total);
      }

      setDisplayFields((prev) => ({
        ...prev,
        inquiry_no: inquiryData.inquiry_no || "",
        model_name: inquiryData.same_style || inquiryData.item || "",
        wgr: inquiryData.wgr || "",
        buyer: getBuyerDisplayName(inquiryData.buyer),
        pdm_key: inquiryData.pdm_key || "",
        short_description: inquiryData.short_description || "",
        fabrication: inquiryData.fabrication || "",
        handover_date: inquiryData.received_date || "",
        total_quantity: inquiryData.order_quantity || "",
        target_price: inquiryData.target_price || "",
        offer_price: inquiryData.offer_price || "",
        confirmed_price: inquiryData.confirmed_price || "",
        texweave_price: inquiryData.texweave_price || "",
        value: inquiryData.value || "",
        price_list_all_supplier:
          prev.price_list_all_supplier ||
          inquiryData.price_list_all_supplier ||
          "",
        remarks: inquiryData.remarks || "",
      }));

      try {
        const costingRes = await api.get(
          `/inquiry-costing/by-inquiry/?inquiry_id=${idNum}`,
        );
        if (costingRes.data && Object.keys(costingRes.data).length > 0) {
          setCosting((prev) => ({
            ...prev,
            yarn_price: costingRes.data.yarn_price || "",
            knitting: costingRes.data.knitting || "",
            dyeing: costingRes.data.dyeing || "",
            aop: costingRes.data.aop || "",
            p_l: costingRes.data.p_l || "",
            woven_fabric_price: costingRes.data.woven_fabric_price || "",
            sweater_yarn_weight: costingRes.data.sweater_yarn_weight || "",
            sweater_gauge: costingRes.data.sweater_gauge || "",
            sweater_knitting_charge:
              costingRes.data.sweater_knitting_charge || "",
            sweater_linking: costingRes.data.sweater_linking || "",
            sweater_washing: costingRes.data.sweater_washing || "",
            sweater_yarn_rate: costingRes.data.sweater_yarn_rate || "",
            sweater_consumption: costingRes.data.sweater_consumption || "",
            consumption_dz: costingRes.data.consumption_dz || "",
            accessories: costingRes.data.accessories || "",
            print_emb: costingRes.data.print_emb || "",
            wash: costingRes.data.wash || "",
            cm: costingRes.data.cm || "",
            test_com: costingRes.data.test_com || "",
            others: costingRes.data.others || "",
            fabric_price_multiplier:
              costingRes.data.fabric_price_multiplier || "0",
          }));

          if (costingRes.data.model_name) {
            setDisplayFields((prev) => ({
              ...prev,
              model_name: costingRes.data.model_name || prev.model_name,
              wgr: costingRes.data.wgr_display || prev.wgr,
              buyer: costingRes.data.buyer_display || prev.buyer,
              pdm_key: costingRes.data.pdm_key || prev.pdm_key,
              short_description:
                costingRes.data.short_description || prev.short_description,
              fabrication: costingRes.data.fabrication || prev.fabrication,
              size_range: costingRes.data.size_range || prev.size_range,
              colours: costingRes.data.colours || prev.colours,
              handover_date:
                costingRes.data.handover_date || prev.handover_date,
              total_quantity:
                costingRes.data.total_quantity || prev.total_quantity,
              price_list_all_supplier:
                costingRes.data.price_list_all_supplier ||
                prev.price_list_all_supplier,
              repeat_price: costingRes.data.repeat_price || prev.repeat_price,
              remarks: costingRes.data.costing_remarks || prev.remarks,
            }));
          }
        }
      } catch (e) {
        console.log("No existing costing found, using defaults");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 404) {
        setError(`Inquiry with ID ${inquiryId} not found.`);
      } else {
        setError("Failed to load inquiry data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculation functions
  const calculateFabricPriceDz = useCallback(() => {
    if (garmentType !== "knit") return "";
    const yarn = parseFloat(costing.yarn_price) || 0;
    const knitting = parseFloat(costing.knitting) || 0;
    const dyeing = parseFloat(costing.dyeing) || 0;
    const aop = parseFloat(costing.aop) || 0;
    const multiplier = parseFloat(costing.fabric_price_multiplier) || 0;
    return ((yarn + knitting + dyeing + aop) * (1 + multiplier / 100)).toFixed(
      2,
    );
  }, [
    garmentType,
    costing.yarn_price,
    costing.knitting,
    costing.dyeing,
    costing.aop,
    costing.fabric_price_multiplier,
  ]);

  const calculateSweaterYarnCostDz = useCallback(() => {
    if (garmentType !== "sweater") return "";
    const yarnRate = parseFloat(costing.sweater_yarn_rate) || 0;
    const consumption = parseFloat(costing.sweater_consumption) || 0;
    return (yarnRate * consumption).toFixed(2);
  }, [garmentType, costing.sweater_yarn_rate, costing.sweater_consumption]);

  const calculateSweaterFabricPriceDz = useCallback(() => {
    if (garmentType !== "sweater") return "";
    const yarnCostDz = parseFloat(calculateSweaterYarnCostDz()) || 0;
    const knittingCharge =
      (parseFloat(costing.sweater_knitting_charge) || 0) * 12;
    const linking = (parseFloat(costing.sweater_linking) || 0) * 12;
    const washing = (parseFloat(costing.sweater_washing) || 0) * 12;
    const multiplier = parseFloat(costing.fabric_price_multiplier) || 0;
    const totalKnitting = knittingCharge + linking + washing;
    return ((yarnCostDz + totalKnitting) * (1 + multiplier / 100)).toFixed(2);
  }, [
    garmentType,
    costing.sweater_knitting_charge,
    costing.sweater_linking,
    costing.sweater_washing,
    costing.fabric_price_multiplier,
    calculateSweaterYarnCostDz,
  ]);

  const calculateTotalFabricPrice = useCallback(() => {
    if (garmentType === "knit") {
      const fabricPriceDz = parseFloat(calculateFabricPriceDz()) || 0;
      const consumption = parseFloat(costing.consumption_dz) || 0;
      return (fabricPriceDz * consumption).toFixed(2);
    } else if (garmentType === "sweater") {
      return parseFloat(calculateSweaterFabricPriceDz())?.toFixed(2) || "0.00";
    } else {
      const wovenPrice = parseFloat(costing.woven_fabric_price) || 0;
      const consumption = parseFloat(costing.consumption_dz) || 0;
      const multiplier = parseFloat(costing.fabric_price_multiplier) || 0;
      const adjustedPrice = wovenPrice * (1 + multiplier / 100);
      return (adjustedPrice * consumption).toFixed(2);
    }
  }, [
    garmentType,
    costing.consumption_dz,
    costing.woven_fabric_price,
    costing.fabric_price_multiplier,
    calculateFabricPriceDz,
    calculateSweaterFabricPriceDz,
  ]);

  const calculateDzPrice = useCallback(() => {
    const totalFabric = parseFloat(calculateTotalFabricPrice()) || 0;
    const accessories = parseFloat(costing.accessories) || 0;
    const printEmb = parseFloat(costing.print_emb) || 0;
    const wash = parseFloat(costing.wash) || 0;
    const cm = parseFloat(costing.cm) || 0;
    const testCom = parseFloat(costing.test_com) || 0;
    const others = parseFloat(costing.others) || 0;
    return (
      totalFabric +
      accessories +
      printEmb +
      wash +
      cm +
      testCom +
      others
    ).toFixed(2);
  }, [
    calculateTotalFabricPrice,
    costing.accessories,
    costing.print_emb,
    costing.wash,
    costing.cm,
    costing.test_com,
    costing.others,
  ]);

  const calculatePriceInPcs = useCallback(() => {
    const dzPrice = parseFloat(calculateDzPrice()) || 0;
    return (dzPrice / 12).toFixed(2);
  }, [calculateDzPrice]);

  useEffect(() => {
    let fabricPriceDz = "";
    if (garmentType === "knit") fabricPriceDz = calculateFabricPriceDz();
    else if (garmentType === "sweater")
      fabricPriceDz = calculateSweaterFabricPriceDz();
    setCosting((prev) => ({
      ...prev,
      fabric_price_dz: fabricPriceDz,
      total_fabric_price: calculateTotalFabricPrice(),
      dz_price: calculateDzPrice(),
      price_in_pcs: calculatePriceInPcs(),
    }));
  }, [
    garmentType,
    costing.yarn_price,
    costing.knitting,
    costing.dyeing,
    costing.aop,
    costing.woven_fabric_price,
    costing.consumption_dz,
    costing.accessories,
    costing.print_emb,
    costing.wash,
    costing.cm,
    costing.test_com,
    costing.others,
    costing.fabric_price_multiplier,
    costing.sweater_yarn_rate,
    costing.sweater_consumption,
    costing.sweater_knitting_charge,
    costing.sweater_linking,
    costing.sweater_washing,
    calculateFabricPriceDz,
    calculateSweaterFabricPriceDz,
    calculateTotalFabricPrice,
    calculateDzPrice,
    calculatePriceInPcs,
  ]);

  const handleCostingChange = (field, value) =>
    setCosting((prev) => ({ ...prev, [field]: value }));
  const handleDisplayChange = (field, value) =>
    setDisplayFields((prev) => ({ ...prev, [field]: value }));

  const handleGarmentTypeChange = (type) => {
    if (isGarmentLocked) return; // Don't allow change if locked
    setGarmentType(type);
    if (type === "knit") {
      setCosting((prev) => ({
        ...prev,
        woven_fabric_price: "",
        sweater_yarn_weight: "",
        sweater_gauge: "",
        sweater_knitting_charge: "",
        sweater_linking: "",
        sweater_washing: "",
        sweater_yarn_rate: "",
        sweater_consumption: "",
      }));
    } else if (type === "woven") {
      setCosting((prev) => ({
        ...prev,
        yarn_price: "",
        knitting: "",
        dyeing: "",
        aop: "",
        fabric_price_dz: "",
        sweater_yarn_weight: "",
        sweater_gauge: "",
        sweater_knitting_charge: "",
        sweater_linking: "",
        sweater_washing: "",
        sweater_yarn_rate: "",
        sweater_consumption: "",
      }));
    } else {
      setCosting((prev) => ({
        ...prev,
        yarn_price: "",
        knitting: "",
        dyeing: "",
        aop: "",
        woven_fabric_price: "",
      }));
    }
  };

  const handleSave = async () => {
    if (!inquiryId) {
      alert("Cannot save: No inquiry ID");
      return;
    }
    setSaving(true);
    try {
      const idNum = parseInt(inquiryId, 10);
      const payload = {
        inquiry: idNum,
        garment_type: garmentType,
        yarn_price: costing.yarn_price ? parseFloat(costing.yarn_price) : null,
        knitting: costing.knitting ? parseFloat(costing.knitting) : null,
        dyeing: costing.dyeing ? parseFloat(costing.dyeing) : null,
        aop: costing.aop ? parseFloat(costing.aop) : null,
        p_l: costing.p_l ? parseFloat(costing.p_l) : null,
        woven_fabric_price: costing.woven_fabric_price
          ? parseFloat(costing.woven_fabric_price)
          : null,
        sweater_yarn_weight: costing.sweater_yarn_weight
          ? parseFloat(costing.sweater_yarn_weight)
          : null,
        sweater_gauge: costing.sweater_gauge || null,
        sweater_knitting_charge: costing.sweater_knitting_charge
          ? parseFloat(costing.sweater_knitting_charge)
          : null,
        sweater_linking: costing.sweater_linking
          ? parseFloat(costing.sweater_linking)
          : null,
        sweater_washing: costing.sweater_washing
          ? parseFloat(costing.sweater_washing)
          : null,
        sweater_yarn_rate: costing.sweater_yarn_rate
          ? parseFloat(costing.sweater_yarn_rate)
          : null,
        sweater_consumption: costing.sweater_consumption
          ? parseFloat(costing.sweater_consumption)
          : null,
        consumption_dz: costing.consumption_dz
          ? parseFloat(costing.consumption_dz)
          : null,
        accessories: costing.accessories
          ? parseFloat(costing.accessories)
          : null,
        print_emb: costing.print_emb ? parseFloat(costing.print_emb) : null,
        wash: costing.wash ? parseFloat(costing.wash) : null,
        cm: costing.cm ? parseFloat(costing.cm) : null,
        test_com: costing.test_com ? parseFloat(costing.test_com) : null,
        others: costing.others ? parseFloat(costing.others) : null,
        fabric_price_multiplier: costing.fabric_price_multiplier
          ? parseFloat(costing.fabric_price_multiplier)
          : 0,
        fabric_price_dz: costing.fabric_price_dz
          ? parseFloat(costing.fabric_price_dz)
          : null,
        total_fabric_price: costing.total_fabric_price
          ? parseFloat(costing.total_fabric_price)
          : null,
        dz_price: costing.dz_price ? parseFloat(costing.dz_price) : null,
        price_in_pcs: costing.price_in_pcs
          ? parseFloat(costing.price_in_pcs)
          : null,
        model_name: displayFields.model_name,
        wgr_display: displayFields.wgr,
        buyer_display: displayFields.buyer,
        pdm_key: displayFields.pdm_key,
        short_description: displayFields.short_description,
        fabrication: displayFields.fabrication,
        size_range: displayFields.size_range,
        colours: displayFields.colours,
        handover_date: displayFields.handover_date || null,
        total_quantity: displayFields.total_quantity
          ? parseInt(displayFields.total_quantity)
          : null,
        price_list_all_supplier: displayFields.price_list_all_supplier,
        repeat_price: displayFields.repeat_price,
        costing_remarks: displayFields.remarks,
      };
      const response = await api.post(`/inquiry-costing/`, payload);
      if (response.status === 200 || response.status === 201)
        alert("Costing saved successfully!");
    } catch (error) {
      console.error("Error saving costing:", error);
      alert(
        `Error: ${error.response?.data?.error || error.message || "Failed to save costing"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") return "-";
    const num = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(num) ? "-" : `$${num.toFixed(3)}`;
  };

  const getSupplierPricePlaceholder = () =>
    supplierPrices.length > 0
      ? "Supplier prices loaded from inquiry"
      : "Esq $1.30\nRobin $1.65\nBG $1.82";
  const getImageRotation = (imageUrl) => imageRotations[imageUrl] || 0;

  if (error) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.mainContent}>
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>⚠️</div>
            <h2 style={styles.errorTitle}>Error Loading Costing</h2>
            <p style={styles.errorMessage}>{error}</p>
            <button
              onClick={() => navigate("/inquiries")}
              style={styles.btnPrimary}
            >
              Go to Inquiries
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <div style={styles.headerBadge}>💰</div>
              <h1 style={styles.headerTitle}>
                Inquiry Costing —{" "}
                {displayFields.inquiry_no || `ID: ${inquiryId}`}
              </h1>
            </div>
            <div style={styles.headerActions}>
              <button
                onClick={() => navigate(`/inquiries`)}
                style={styles.btnSecondary}
              >
                ← Back to Inquiry
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={styles.btnPrimary}
              >
                {saving ? "Saving..." : "Save Costing"}
              </button>
            </div>
          </div>
          <p style={styles.headerSubtitle}>
            Calculate fabric, accessories, and production costs using{" "}
            {isGarmentLocked ? garmentType : "knit, woven, or sweater"} formulas
          </p>
        </div>

        {/* Garment Type Selector - Conditionally Rendered */}
        {!isGarmentLocked ? (
          <div style={styles.modeSelector}>
            <div style={styles.modeSelectorLabel}>Garment Type:</div>
            <div style={styles.modeButtons}>
              <button
                onClick={() => handleGarmentTypeChange("knit")}
                style={{
                  ...styles.modeButton,
                  ...(garmentType === "knit" ? styles.modeButtonActive : {}),
                }}
              >
                🧶 Knit
              </button>
              <button
                onClick={() => handleGarmentTypeChange("woven")}
                style={{
                  ...styles.modeButton,
                  ...(garmentType === "woven" ? styles.modeButtonActive : {}),
                }}
              >
                👕 Woven
              </button>
              <button
                onClick={() => handleGarmentTypeChange("sweater")}
                style={{
                  ...styles.modeButton,
                  ...(garmentType === "sweater" ? styles.modeButtonActive : {}),
                }}
              >
                🧥 Sweater
              </button>
            </div>
            <div style={styles.modeInfo}>
              {garmentType === "knit"
                ? "Knit mode: Fabric price = (Yarn + Knitting + Dyeing + AOP) × (1 + Multiplier%) × Consumption"
                : garmentType === "woven"
                  ? "Woven mode: Fabric price × (1 + Multiplier%) × Consumption"
                  : "Sweater mode: (Yarn Cost + Knitting + Linking + Washing) × (1 + Multiplier%)"}
            </div>
          </div>
        ) : (
          // Locked garment type indicator
          <div style={styles.lockedGarmentInfo}>
            <div style={styles.lockedGarmentBadge}>
              <span style={{ fontSize: "18px" }}>
                {garmentType === "knit" && "🧶"}
                {garmentType === "woven" && "👕"}
                {garmentType === "sweater" && "🧥"}
              </span>
              <span style={styles.lockedGarmentText}>
                Garment Type:{" "}
                {garmentType?.charAt(0).toUpperCase() + garmentType?.slice(1)}
              </span>
              <span style={styles.lockedIcon}>🔒</span>
            </div>
            <div style={styles.modeInfo}>
              {garmentType === "knit"
                ? "Knit mode: Fabric price = (Yarn + Knitting + Dyeing + AOP) × (1 + Multiplier%) × Consumption"
                : garmentType === "woven"
                  ? "Woven mode: Fabric price × (1 + Multiplier%) × Consumption"
                  : "Sweater mode: (Yarn Cost + Knitting + Linking + Washing) × (1 + Multiplier%)"}
            </div>
          </div>
        )}

        {/* Three Column Layout - Same as before */}
        <div style={styles.threeColumnLayout}>
          {/* LEFT COLUMN - Images and Basic Info */}
          <div style={styles.leftColumn}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                📸 Images{" "}
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "normal",
                    marginLeft: "8px",
                    color: "#64748b",
                  }}
                >
                  (Click to zoom & rotate | Mouse wheel to zoom)
                </span>
              </h3>
              {selectedImage && (
                <div
                  style={styles.mainImageContainer}
                  onClick={() => handleImageClick(selectedImage)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleImageClick(selectedImage)
                  }
                >
                  <img
                    src={selectedImage}
                    alt="Main"
                    style={{
                      ...styles.mainImage,
                      transform: `rotate(${getImageRotation(selectedImage)}deg)`,
                      transition: "transform 0.2s ease",
                    }}
                  />
                </div>
              )}
              {allImages.length > 0 && (
                <div style={styles.thumbnailContainer}>
                  {allImages.map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        ...styles.thumbnailWrapper,
                        ...(selectedImage === img
                          ? styles.thumbnailWrapperActive
                          : {}),
                      }}
                      onClick={() => setSelectedImage(img)}
                    >
                      <img
                        src={img}
                        alt={`Thumb ${idx}`}
                        style={{
                          ...styles.thumbnail,
                          transform: `rotate(${getImageRotation(img)}deg)`,
                        }}
                      />
                      {getImageRotation(img) !== 0 && (
                        <div style={styles.rotatedBadge}>
                          ↻ {getImageRotation(img)}°
                        </div>
                      )}
                      <div style={styles.thumbnailZoomIcon}>🔍</div>
                    </div>
                  ))}
                </div>
              )}
              {allImages.length === 0 && (
                <div style={styles.noImagePlaceholder}>No images available</div>
              )}
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>📋 Basic Information</h3>
              <div style={styles.infoItem}>
                <label>Inquiry No:</label>
                <span>
                  <strong>{displayFields.inquiry_no || "-"}</strong>
                </span>
              </div>
              <div style={styles.infoItem}>
                <label>Model Name:</label>
                <input
                  type="text"
                  value={displayFields.model_name}
                  onChange={(e) =>
                    handleDisplayChange("model_name", e.target.value)
                  }
                  style={styles.infoInput}
                />
              </div>
              <div style={styles.infoItem}>
                <label>WGR:</label>
                <input
                  type="text"
                  value={displayFields.wgr}
                  onChange={(e) => handleDisplayChange("wgr", e.target.value)}
                  style={styles.infoInput}
                />
              </div>
              <div style={styles.infoItem}>
                <label>Buyer:</label>
                <input
                  type="text"
                  value={displayFields.buyer}
                  onChange={(e) => handleDisplayChange("buyer", e.target.value)}
                  style={styles.infoInput}
                />
              </div>
              <div style={styles.infoItem}>
                <label>PDM Key:</label>
                <input
                  type="text"
                  value={displayFields.pdm_key}
                  onChange={(e) =>
                    handleDisplayChange("pdm_key", e.target.value)
                  }
                  style={styles.infoInput}
                />
              </div>
              <div style={styles.infoItemFull}>
                <label>Short Description:</label>
                <textarea
                  value={displayFields.short_description}
                  onChange={(e) =>
                    handleDisplayChange("short_description", e.target.value)
                  }
                  style={styles.infoTextarea}
                  rows={5}
                />
              </div>
              <div style={styles.infoItemFull}>
                <label>Fabrication:</label>
                <textarea
                  value={displayFields.fabrication}
                  onChange={(e) =>
                    handleDisplayChange("fabrication", e.target.value)
                  }
                  style={styles.infoTextarea}
                  rows={5}
                />
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>🎨 Color & Sizing</h3>
              {colorSizeGroups.length > 0 ? (
                <div style={styles.colorSizeTable}>
                  <table style={styles.miniTable}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "8px" }}>
                          Color
                        </th>
                        <th style={{ textAlign: "left", padding: "8px" }}>
                          Sizes (Size:Qty)
                        </th>
                        <th style={{ textAlign: "right", padding: "8px" }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {colorSizeGroups.map((group, idx) => (
                        <tr
                          key={idx}
                          style={{ borderBottom: "1px solid #e2e8f0" }}
                        >
                          <td
                            style={{
                              padding: "8px",
                              verticalAlign: "top",
                              textAlign: "left",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: "12px",
                                height: "12px",
                                backgroundColor: group.color || "#ccc",
                                borderRadius: "2px",
                                marginRight: "8px",
                              }}
                            ></span>
                            {group.color || "-"}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              verticalAlign: "top",
                              textAlign: "left",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                              }}
                            >
                              {group.size_quantities?.map((sq, sizeIdx) => (
                                <span key={sizeIdx} style={styles.sizeBadge}>
                                  {sq.size}: {sq.quantity}
                                </span>
                              )) || "-"}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              textAlign: "right",
                              fontWeight: "bold",
                            }}
                          >
                            {group.total?.toLocaleString() || 0}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: "#f1f5f9", fontWeight: "bold" }}>
                        <td
                          colSpan="2"
                          style={{ padding: "10px", textAlign: "right" }}
                        >
                          Grand Total:
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            textAlign: "right",
                            fontWeight: "bold",
                          }}
                        >
                          {grandTotal?.toLocaleString() || 0}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={styles.emptyState}>
                  No color/size data available
                </div>
              )}
            </div>
          </div>

          {/* MIDDLE COLUMN - Pricing Information */}
          <div style={styles.middleColumn}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>💰 Pricing Information</h3>
              <div style={styles.pricingGrid}>
                <div style={styles.pricingCard}>
                  <div style={styles.pricingLabel}>Target Price</div>
                  <div style={styles.pricingValue}>
                    {formatPrice(displayFields.target_price)}
                  </div>
                  <small>Buyer's target</small>
                </div>
                <div style={styles.pricingCard}>
                  <div style={styles.pricingLabel}>Offer Price</div>
                  <div style={{ ...styles.pricingValue, color: "#3b82f6" }}>
                    {formatPrice(displayFields.offer_price)}
                  </div>
                  <small>Texweave offer</small>
                </div>
                <div style={styles.pricingCard}>
                  <div style={styles.pricingLabel}>Confirmed Price</div>
                  <div style={{ ...styles.pricingValue, color: "#10b981" }}>
                    {formatPrice(displayFields.confirmed_price)}
                  </div>
                  <small>Final confirmed</small>
                </div>
                <div style={styles.pricingCard}>
                  <div style={styles.pricingLabel}>Texweave Price</div>
                  <div style={{ ...styles.pricingValue, color: "#8b5cf6" }}>
                    {formatPrice(displayFields.texweave_price)}
                  </div>
                  <small>Internal cost</small>
                </div>
              </div>
              <div style={styles.infoItem}>
                <label>Total Quantity (Pcs):</label>
                <input
                  type="number"
                  value={displayFields.total_quantity}
                  onChange={(e) =>
                    handleDisplayChange("total_quantity", e.target.value)
                  }
                  style={styles.infoInput}
                />
              </div>
              <div style={styles.infoItem}>
                <label>Total Value ($):</label>
                <input
                  type="text"
                  value={displayFields.value}
                  style={{ ...styles.infoInput, background: "#f1f5f9" }}
                  readOnly
                  disabled
                />
              </div>
              <div style={styles.infoItem}>
                <label>Handover Date:</label>
                <input
                  type="date"
                  value={displayFields.handover_date?.split("T")[0] || ""}
                  onChange={(e) =>
                    handleDisplayChange("handover_date", e.target.value)
                  }
                  style={styles.infoInput}
                />
              </div>
            </div>

            {/* Fabric Cost Sections - Conditionally Rendered */}
            {(garmentType === "knit" || garmentType === "woven") && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>🧵 Fabric Cost</h3>
                <div style={styles.costingItemFull}>
                  <label>Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={costing.fabric_price_multiplier}
                    onChange={(e) =>
                      handleCostingChange(
                        "fabric_price_multiplier",
                        e.target.value,
                      )
                    }
                    style={styles.costingInput}
                    placeholder="Enter percentage (e.g., 12 for +12%)"
                  />
                  <small style={styles.formulaHint}>
                    Multiplier applied to fabric cost before consumption
                  </small>
                </div>
                {garmentType === "knit" && (
                  <div style={styles.costingGrid}>
                    <div style={styles.costingItem}>
                      <label>Yarn Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={costing.yarn_price}
                        onChange={(e) =>
                          handleCostingChange("yarn_price", e.target.value)
                        }
                        style={styles.costingInput}
                        placeholder="0.00"
                      />
                    </div>
                    <div style={styles.costingItem}>
                      <label>Knitting ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={costing.knitting}
                        onChange={(e) =>
                          handleCostingChange("knitting", e.target.value)
                        }
                        style={styles.costingInput}
                        placeholder="0.00"
                      />
                    </div>
                    <div style={styles.costingItem}>
                      <label>Dyeing ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={costing.dyeing}
                        onChange={(e) =>
                          handleCostingChange("dyeing", e.target.value)
                        }
                        style={styles.costingInput}
                        placeholder="0.00"
                      />
                    </div>
                    <div style={styles.costingItem}>
                      <label>AOP ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={costing.aop}
                        onChange={(e) =>
                          handleCostingChange("aop", e.target.value)
                        }
                        style={styles.costingInput}
                        placeholder="0.00"
                      />
                    </div>
                    <div style={styles.costingItemFull}>
                      <label>Fabric Price DZ ($)</label>
                      <input
                        type="text"
                        value={costing.fabric_price_dz}
                        style={{
                          ...styles.costingInput,
                          ...styles.readonlyInput,
                          ...styles.resultHighlight,
                        }}
                        readOnly
                        disabled
                      />
                      <small style={styles.formulaHint}>
                        = (Yarn + Knitting + Dyeing + AOP) × (1 +
                        Multiplier/100)
                      </small>
                    </div>
                  </div>
                )}
                {garmentType === "woven" && (
                  <div style={styles.costingGrid}>
                    <div style={styles.costingItemFull}>
                      <label>Woven Fabric Price ($/DZ)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={costing.woven_fabric_price}
                        onChange={(e) =>
                          handleCostingChange(
                            "woven_fabric_price",
                            e.target.value,
                          )
                        }
                        style={styles.costingInput}
                        placeholder="0.00"
                      />
                      <small style={styles.formulaHint}>
                        Will be multiplied by (1 + Multiplier/100)
                      </small>
                    </div>
                  </div>
                )}
                <div style={styles.costingGrid}>
                  <div style={styles.costingItem}>
                    <label>Consumption (per DZ)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costing.consumption_dz}
                      onChange={(e) =>
                        handleCostingChange("consumption_dz", e.target.value)
                      }
                      style={styles.costingInput}
                      placeholder="0.00"
                    />
                  </div>
                  <div style={styles.costingItem}>
                    <label>Total Fabric Price ($/DZ)</label>
                    <input
                      type="text"
                      value={costing.total_fabric_price}
                      style={{
                        ...styles.costingInput,
                        ...styles.readonlyInput,
                        ...styles.resultHighlight,
                      }}
                      readOnly
                      disabled
                    />
                    <small style={styles.formulaHint}>
                      {garmentType === "knit"
                        ? "= Fabric Price DZ × Consumption"
                        : "= (Woven Price × (1+Multiplier%)) × Consumption"}
                    </small>
                  </div>
                </div>
              </div>
            )}

            {garmentType === "sweater" && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>🧥 Sweater Cost Calculation</h3>
                <div style={styles.costingItemFull}>
                  <label>Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={costing.fabric_price_multiplier}
                    onChange={(e) =>
                      handleCostingChange(
                        "fabric_price_multiplier",
                        e.target.value,
                      )
                    }
                    style={styles.costingInput}
                    placeholder="Enter percentage (e.g., 12 for +12%)"
                  />
                  <small style={styles.formulaHint}>
                    Multiplier applied to total sweater cost
                  </small>
                </div>
                <div style={styles.costingGrid}>
                  <div style={styles.costingItem}>
                    <label>Yarn Rate ($/kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costing.sweater_yarn_rate}
                      onChange={(e) =>
                        handleCostingChange("sweater_yarn_rate", e.target.value)
                      }
                      style={styles.costingInput}
                      placeholder="0.00"
                    />
                    <small style={styles.formulaHint}>
                      Price per kilogram of yarn
                    </small>
                  </div>
                  <div style={styles.costingItem}>
                    <label>Yarn Consumption (kg/doz)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costing.sweater_consumption}
                      onChange={(e) =>
                        handleCostingChange(
                          "sweater_consumption",
                          e.target.value,
                        )
                      }
                      style={styles.costingInput}
                      placeholder="0.00"
                    />
                    <small style={styles.formulaHint}>
                      Kilograms per dozen pieces
                    </small>
                  </div>
                  <div style={styles.costingItem}>
                    <label>Yarn Weight (g/pc)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costing.sweater_yarn_weight}
                      onChange={(e) =>
                        handleCostingChange(
                          "sweater_yarn_weight",
                          e.target.value,
                        )
                      }
                      style={styles.costingInput}
                      placeholder="Optional"
                    />
                    <small style={styles.formulaHint}>
                      Grams per piece (optional)
                    </small>
                  </div>
                  <div style={styles.costingItem}>
                    <label>Gauge (GG)</label>
                    <select
                      value={costing.sweater_gauge}
                      onChange={(e) =>
                        handleCostingChange("sweater_gauge", e.target.value)
                      }
                      style={styles.costingInput}
                    >
                      <option value="">Select Gauge</option>
                      <option value="3GG">3GG</option>
                      <option value="5GG">5GG</option>
                      <option value="7GG">7GG</option>
                      <option value="10GG">10GG</option>
                      <option value="12GG">12GG</option>
                      <option value="14GG">14GG</option>
                      <option value="16GG">16GG</option>
                    </select>
                    <small style={styles.formulaHint}>
                      Knitting machine gauge
                    </small>
                  </div>
                </div>
                <div style={styles.costingGrid}>
                  <div style={styles.costingItem}>
                    <label>Knitting Charge ($/pc)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costing.sweater_knitting_charge}
                      onChange={(e) =>
                        handleCostingChange(
                          "sweater_knitting_charge",
                          e.target.value,
                        )
                      }
                      style={styles.costingInput}
                      placeholder="0.00"
                    />
                    <small style={styles.formulaHint}>
                      Per piece, auto-converted to dozen
                    </small>
                  </div>
                  <div style={styles.costingItem}>
                    <label>Linking/Finishing ($/pc)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costing.sweater_linking}
                      onChange={(e) =>
                        handleCostingChange("sweater_linking", e.target.value)
                      }
                      style={styles.costingInput}
                      placeholder="0.00"
                    />
                  </div>
                  <div style={styles.costingItem}>
                    <label>Washing ($/pc)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costing.sweater_washing}
                      onChange={(e) =>
                        handleCostingChange("sweater_washing", e.target.value)
                      }
                      style={styles.costingInput}
                      placeholder="0.00"
                    />
                  </div>
                  <div style={styles.costingItemFull}>
                    <label>Sweater Cost per DZ ($)</label>
                    <input
                      type="text"
                      value={costing.fabric_price_dz}
                      style={{
                        ...styles.costingInput,
                        ...styles.readonlyInput,
                        ...styles.resultHighlight,
                      }}
                      readOnly
                      disabled
                    />
                    <small style={styles.formulaHint}>
                      = (Yarn Cost + Knitting + Linking + Washing) × (1 +
                      Multiplier/100)
                      <br />
                      Yarn Cost = Yarn Rate × Consumption (kg/doz)
                    </small>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Production Costs and Results */}
          <div style={styles.rightColumn}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                ⚙️ Production & Other Costs ($/DZ)
              </h3>
              <div style={styles.costingGrid}>
                <div style={styles.costingItem}>
                  <label>Accessories (Acc)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costing.accessories}
                    onChange={(e) =>
                      handleCostingChange("accessories", e.target.value)
                    }
                    style={styles.costingInput}
                    placeholder="0.00"
                  />
                </div>
                <div style={styles.costingItem}>
                  <label>Print / Embroidery</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costing.print_emb}
                    onChange={(e) =>
                      handleCostingChange("print_emb", e.target.value)
                    }
                    style={styles.costingInput}
                    placeholder="0.00"
                  />
                </div>
                <div style={styles.costingItem}>
                  <label>Wash</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costing.wash}
                    onChange={(e) =>
                      handleCostingChange("wash", e.target.value)
                    }
                    style={styles.costingInput}
                    placeholder="0.00"
                  />
                </div>
                <div style={styles.costingItem}>
                  <label>CM (Cut & Make)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costing.cm}
                    onChange={(e) => handleCostingChange("cm", e.target.value)}
                    style={styles.costingInput}
                    placeholder="0.00"
                  />
                </div>
                <div style={styles.costingItem}>
                  <label>Test + Commission</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costing.test_com}
                    onChange={(e) =>
                      handleCostingChange("test_com", e.target.value)
                    }
                    style={styles.costingInput}
                    placeholder="0.00"
                  />
                </div>
                <div style={styles.costingItem}>
                  <label>Others</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costing.others}
                    onChange={(e) =>
                      handleCostingChange("others", e.target.value)
                    }
                    style={styles.costingInput}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div style={styles.resultsSection}>
              <h3 style={styles.sectionTitle}>📊 Costing Results</h3>
              <div style={styles.resultsGrid}>
                <div style={styles.resultCard}>
                  <div style={styles.resultLabel}>DZ Price</div>
                  <div style={styles.resultValue}>
                    ${costing.dz_price || "0.00"}
                  </div>
                  <small style={styles.resultHint}>
                    = Total Fabric + Acc + Print/Emb + Wash + CM + Test+Com +
                    Others
                    <br />
                    <span style={{ color: "#dc2626" }}>(P/L excluded)</span>
                  </small>
                </div>
                <div style={styles.resultCard}>
                  <div style={styles.resultLabel}>Price in Pcs</div>
                  <div style={styles.resultValue}>
                    ${costing.price_in_pcs || "0.00"}
                  </div>
                  <small style={styles.resultHint}>= DZ Price ÷ 12</small>
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>📝 Additional Information</h3>
              <div style={styles.costingItemFull}>
                <label>Price List All Supplier</label>
                <textarea
                  value={displayFields.price_list_all_supplier}
                  onChange={(e) =>
                    handleDisplayChange(
                      "price_list_all_supplier",
                      e.target.value,
                    )
                  }
                  style={styles.infoTextarea}
                  rows={4}
                  placeholder={getSupplierPricePlaceholder()}
                />
                {supplierPrices.length > 0 && (
                  <small
                    style={{
                      color: "#10b981",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    ✓ {supplierPrices.length} supplier price(s) loaded
                  </small>
                )}
              </div>
              <div style={styles.costingItem}>
                <label>Repeat Price</label>
                <input
                  type="text"
                  value={displayFields.repeat_price}
                  onChange={(e) =>
                    handleDisplayChange("repeat_price", e.target.value)
                  }
                  style={styles.costingInput}
                  placeholder="e.g., $1.69/Esquire"
                />
              </div>
              <div style={styles.costingItemFull}>
                <label>Remarks</label>
                <textarea
                  value={displayFields.remarks}
                  onChange={(e) =>
                    handleDisplayChange("remarks", e.target.value)
                  }
                  style={styles.infoTextarea}
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImageZoomModal
        imageUrl={modalImageUrl}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveRotation={handleSaveRotation}
        initialRotation={currentImageRotation}
      />
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
  headerActions: { display: "flex", gap: "8px" },
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
  },

  // Locked Garment Type Styles
  lockedGarmentInfo: {
    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
    borderRadius: "12px",
    padding: "12px 20px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    border: "1px solid #fbbf24",
  },
  lockedGarmentBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "white",
    padding: "6px 14px",
    borderRadius: "30px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  lockedGarmentText: { fontSize: "13px", fontWeight: "600", color: "#92400e" },
  lockedIcon: { fontSize: "12px", color: "#f59e0b" },

  modeSelector: {
    background: "white",
    borderRadius: "12px",
    padding: "12px 16px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  modeSelectorLabel: { fontSize: "13px", fontWeight: "600", color: "#0f172a" },
  modeButtons: { display: "flex", gap: "8px" },
  modeButton: {
    padding: "6px 16px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
  },
  modeButtonActive: {
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "white",
    border: "none",
  },
  modeInfo: {
    fontSize: "11px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "4px 10px",
    borderRadius: "12px",
  },

  threeColumnLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "20px",
  },
  leftColumn: { display: "flex", flexDirection: "column", gap: "20px" },
  middleColumn: { display: "flex", flexDirection: "column", gap: "20px" },
  rightColumn: { display: "flex", flexDirection: "column", gap: "20px" },
  section: {
    background: "white",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 12px 0",
    paddingBottom: "8px",
    borderBottom: "1px solid #e2e8f0",
  },

  mainImageContainer: {
    marginBottom: "12px",
    textAlign: "center",
    position: "relative",
    cursor: "pointer",
    transition: "transform 0.2s",
    "&:hover": { transform: "scale(1.02)" },
  },
  mainImage: {
    maxWidth: "100%",
    maxHeight: "300px",
    borderRadius: "8px",
    objectFit: "cover",
  },
  thumbnailContainer: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  thumbnailWrapper: {
    position: "relative",
    cursor: "pointer",
    border: "2px solid transparent",
    borderRadius: "6px",
    transition: "all 0.2s",
  },
  thumbnailWrapperActive: {
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 2px rgba(59,130,246,0.3)",
  },
  thumbnail: {
    width: "50px",
    height: "40px",
    objectFit: "cover",
    borderRadius: "4px",
  },
  rotatedBadge: {
    position: "absolute",
    top: "2px",
    left: "2px",
    background: "rgba(0,0,0,0.6)",
    color: "white",
    fontSize: "8px",
    padding: "2px 4px",
    borderRadius: "3px",
  },
  thumbnailZoomIcon: {
    position: "absolute",
    bottom: "2px",
    right: "2px",
    background: "rgba(0,0,0,0.5)",
    borderRadius: "3px",
    padding: "2px",
    fontSize: "10px",
    color: "white",
  },
  noImagePlaceholder: {
    textAlign: "center",
    padding: "40px",
    background: "#f1f5f9",
    borderRadius: "8px",
    color: "#94a3b8",
  },

  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    gap: "10px",
  },
  infoItemFull: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "10px",
  },
  infoInput: {
    padding: "6px 10px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    flex: 1,
  },
  infoTextarea: {
    padding: "6px 10px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    resize: "vertical",
    fontFamily: "monospace",
  },

  colorSizeTable: { marginBottom: "12px", overflowX: "auto" },
  miniTable: { width: "100%", borderCollapse: "collapse", fontSize: "11px" },
  sizeBadge: {
    display: "inline-block",
    padding: "2px 6px",
    background: "#e2e8f0",
    borderRadius: "12px",
    fontSize: "10px",
    color: "#334155",
  },

  pricingGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "16px",
  },
  pricingCard: {
    background: "#f8fafc",
    borderRadius: "8px",
    padding: "10px",
    textAlign: "center",
  },
  pricingLabel: {
    fontSize: "10px",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  pricingValue: { fontSize: "16px", fontWeight: "700", color: "#f59e0b" },

  costingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  },
  costingItem: { display: "flex", flexDirection: "column", gap: "4px" },
  costingItemFull: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    gridColumn: "span 2",
  },
  costingInput: {
    padding: "8px 10px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "12px",
    background: "white",
  },
  readonlyInput: { background: "#f1f5f9", fontWeight: "500" },
  resultHighlight: {
    background: "#ecfdf5",
    borderColor: "#10b981",
    color: "#065f46",
    fontWeight: "600",
  },
  formulaHint: { fontSize: "9px", color: "#94a3b8", marginTop: "2px" },

  resultsSection: {
    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    borderRadius: "12px",
    padding: "16px",
  },
  resultsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  resultCard: {
    background: "white",
    borderRadius: "10px",
    padding: "14px",
    textAlign: "center",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  resultLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: "6px",
  },
  resultValue: { fontSize: "28px", fontWeight: "700", color: "#10b981" },
  resultHint: {
    fontSize: "9px",
    color: "#94a3b8",
    marginTop: "6px",
    display: "block",
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
  errorIcon: { fontSize: "48px", marginBottom: "16px" },
  errorTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#dc2626",
    marginBottom: "8px",
  },
  errorMessage: { fontSize: "14px", color: "#64748b", marginBottom: "20px" },
  emptyState: {
    textAlign: "center",
    padding: "20px",
    color: "#94a3b8",
    fontSize: "12px",
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
  style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

export default InquiryCosting;
