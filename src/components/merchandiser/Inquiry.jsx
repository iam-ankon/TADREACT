import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";
import { Link } from "react-router-dom";

const API_BASE = "http://119.148.51.38:8000/api/merchandiser/api";

// --- CSRF helper ---
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

// Create axios instance with enhanced configuration
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

// Enhanced request interceptor
api.interceptors.request.use((config) => {
  const token = getCookie("csrftoken");
  if (token) {
    config.headers["X-CSRFToken"] = token;
  }
  config.headers["X-Requested-With"] = "XMLHttpRequest";
  return config;
});

// Enhanced response interceptor with auth handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response || error);
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.warn("Authentication issue detected");
      const isLoggedIn =
        document.cookie.includes("sessionid") ||
        document.cookie.includes("csrftoken");
      if (!isLoggedIn) {
        alert("Your session has expired. Please log in again.");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

const Inquiry = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem("inquirySearchTerm") || "";
  });
  const [searchYears, setSearchYears] = useState(() => {
    return localStorage.getItem("inquirySearchYears") || "";
  });
  const [selectedSeasons, setSelectedSeasons] = useState(() => {
    const saved = localStorage.getItem("inquirySelectedSeasons");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedGarments, setSelectedGarments] = useState(() => {
    const saved = localStorage.getItem("inquirySelectedGarments");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem("inquiryCurrentPage");
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  const [itemsPerPage] = useState(10);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [buyerPrice, setBuyerPrice] = useState("");
  const [supplierPrice, setSupplierPrice] = useState("");
  const [comment, setComment] = useState("");
  const [pendingNegotiations, setPendingNegotiations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [updateStatusToConfirmed, setUpdateStatusToConfirmed] = useState(false);
  const [showSuppliersEmailed, setShowSuppliersEmailed] = useState(true);
  const [showSavedNegotiations, setShowSavedNegotiations] = useState(true);
  const [selectedInquiries, setSelectedInquiries] = useState([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    from_email: "",
    custom_message: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailProgress, setEmailProgress] = useState({
    sent: 0,
    total: 0,
    currentInquiry: null,
  });
  const [selectedSuppliers, setSelectedSuppliers] = useState({});
  const [availableSuppliers, setAvailableSuppliers] = useState([]);
  const [editingRemarks, setEditingRemarks] = useState({});

  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [showGarmentDropdown, setShowGarmentDropdown] = useState(false);

  // New filter states from screenshot
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [withImage, setWithImage] = useState(false);
  const [dateWiseShipment, setDateWiseShipment] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [showSampleStatus, setShowSampleStatus] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmailCommunications, setShowEmailCommunications] = useState(false);

  // Store initial filter values to detect actual changes
  const initialSearchTerm = React.useRef(searchTerm);
  const initialSearchYears = React.useRef(searchYears);
  const initialSelectedSeasons = React.useRef(selectedSeasons);
  const initialSelectedGarments = React.useRef(selectedGarments);

  // Save search filters to localStorage
  useEffect(() => {
    localStorage.setItem("inquirySearchTerm", searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem("inquirySearchYears", searchYears);
  }, [searchYears]);

  useEffect(() => {
    localStorage.setItem(
      "inquirySelectedSeasons",
      JSON.stringify(selectedSeasons)
    );
  }, [selectedSeasons]);

  useEffect(() => {
    localStorage.setItem(
      "inquirySelectedGarments",
      JSON.stringify(selectedGarments)
    );
  }, [selectedGarments]);

  // Save current page to localStorage
  useEffect(() => {
    localStorage.setItem("inquiryCurrentPage", currentPage.toString());
  }, [currentPage]);

  // Fetch inquiries and suppliers on mount
  useEffect(() => {
    fetchInquiries();
    fetchSuppliers();
  }, []);

  // Reset currentPage to 1 when search filters change
  useEffect(() => {
    const searchTermChanged = searchTerm !== initialSearchTerm.current;
    const searchYearsChanged = searchYears !== initialSearchYears.current;
    const seasonsChanged =
      JSON.stringify(selectedSeasons) !==
      JSON.stringify(initialSelectedSeasons.current);
    const garmentsChanged =
      JSON.stringify(selectedGarments) !==
      JSON.stringify(initialSelectedGarments.current);

    if (
      searchTermChanged ||
      searchYearsChanged ||
      seasonsChanged ||
      garmentsChanged
    ) {
      setCurrentPage(1);
      localStorage.setItem("inquiryCurrentPage", "1");

      // Update initial values
      initialSearchTerm.current = searchTerm;
      initialSearchYears.current = searchYears;
      initialSelectedSeasons.current = selectedSeasons;
      initialSelectedGarments.current = selectedGarments;
    }
  }, [searchTerm, searchYears, selectedSeasons, selectedGarments]);

  // Define filtered inquiries
  const filtered = inquiries.filter((i) => {
    const textSearchPassed = !searchTerm.trim()
      ? true
      : (() => {
          const searchTerms = searchTerm
            .toLowerCase()
            .split(" ")
            .filter((term) => term.length > 0);

          if (searchTerms.length === 0) return true;

          return searchTerms.some((term) => {
            const inquiryNoMatch = String(i.inquiry_no || "")
              .toLowerCase()
              .includes(term);
            const orderTypeMatch = (i.order_type || "")
              .toLowerCase()
              .includes(term);
            const garmentMatch = (i.garment || "").toLowerCase().includes(term);
            const fabricationMatch = (i.fabrication?.fabrication || "")
              .toLowerCase()
              .includes(term);
            const styleMatch = (i.same_style?.styles || "")
              .toLowerCase()
              .includes(term);
            return (
              inquiryNoMatch ||
              orderTypeMatch ||
              garmentMatch ||
              fabricationMatch ||
              styleMatch
            );
          });
        })();

    const yearPassed = !searchYears.trim()
      ? true
      : (() => {
          const yearsToSearch = searchYears
            .split(" ")
            .filter((year) => year.trim().length > 0)
            .map((year) => year.trim());

          if (yearsToSearch.length === 0) return true;

          return yearsToSearch.some((year) =>
            String(i.year || "")
              .toLowerCase()
              .includes(year.toLowerCase())
          );
        })();

    const seasonPassed =
      selectedSeasons.length === 0
        ? true
        : selectedSeasons.includes(i.season?.toLowerCase() || "");

    const garmentPassed =
      selectedGarments.length === 0
        ? true
        : selectedGarments.includes(i.garment?.toLowerCase() || "");

    return textSearchPassed && yearPassed && seasonPassed && garmentPassed;
  });

  // Adjust currentPage if it exceeds totalPages
  useEffect(() => {
    if (inquiries.length > 0) {
      const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
        localStorage.setItem("inquiryCurrentPage", totalPages.toString());
      }
    }
  }, [filtered.length, itemsPerPage, currentPage, inquiries.length]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setSearchYears("");
    setSelectedSeasons([]);
    setSelectedGarments([]);
    setSelectedYear("2024");
    setSelectedSeason("");
    setSelectedGroup("");
    setSelectedSupplier("");
    setSelectedStatus("");
    setSelectedMonth("");
    setSelectedStyle("");
    setWithImage(false);
    setDateWiseShipment(false);
    setDateFrom("");
    setDateTo("");
    localStorage.removeItem("inquirySearchTerm");
    localStorage.removeItem("inquirySearchYears");
    localStorage.removeItem("inquirySelectedSeasons");
    localStorage.removeItem("inquirySelectedGarments");
    setCurrentPage(1);
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get("/supplier/");
      setAvailableSuppliers(response.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      alert("Failed to load suppliers list.");
    }
  };

  const updateRemarks1 = async (inquiryId, remarks1) => {
    try {
      const response = await api.patch(`/inquiry/${inquiryId}/`, { remarks1 });
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId
            ? { ...inq, remarks1: response.data.remarks1 }
            : inq
        )
      );
      setEditingRemarks((prev) => ({ ...prev, [inquiryId]: false }));
    } catch (error) {
      console.error("Error updating remarks1:", error);
      alert("Failed to save remarks. Please try again.");
    }
  };

  const handleRemarks1Change = (inquiryId, value) => {
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId ? { ...inq, remarks1: value } : inq
      )
    );
  };

  const handleRemarks1Save = (inquiryId, remarks1) => {
    if (editingRemarks[inquiryId]) {
      updateRemarks1(inquiryId, remarks1);
    }
  };

  const toggleSelectInquiry = (inquiryId) => {
    setSelectedInquiries((prev) => {
      if (prev.includes(inquiryId)) {
        return prev.filter((id) => id !== inquiryId);
      } else {
        return [...prev, inquiryId];
      }
    });
  };

  const toggleSelectAll = () => {
    const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
    const currentItemIds = currentItems.map((item) => item.id);

    if (
      selectedInquiries.length === currentItemIds.length &&
      currentItemIds.length > 0
    ) {
      setSelectedInquiries([]);
      setSelectedSuppliers({});
    } else {
      setSelectedInquiries(currentItemIds);
    }
  };

  const openEmailModal = () => {
    if (selectedInquiries.length === 0) {
      alert("Please select at least one inquiry to send.");
      return;
    }

    setSelectedSuppliers({});
    setEmailData({
      from_email: "",
      custom_message: "",
    });
    setShowEmailModal(true);
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setEmailData({
      from_email: "",
      custom_message: "",
    });
    setEmailProgress({
      sent: 0,
      total: 0,
      currentInquiry: null,
    });
    setSelectedSuppliers({});
  };

  const toggleSupplierSelection = (supplierId) => {
    setSelectedSuppliers((prev) => ({
      ...prev,
      [supplierId]: !prev[supplierId],
    }));
  };

  const toggleSelectAllSuppliers = () => {
    const allSelected =
      availableSuppliers.length > 0 &&
      availableSuppliers.every((supplier) => selectedSuppliers[supplier.id]);

    if (allSelected) {
      setSelectedSuppliers({});
    } else {
      const allSuppliersSelected = {};
      availableSuppliers.forEach((supplier) => {
        allSuppliersSelected[supplier.id] = true;
      });
      setSelectedSuppliers(allSuppliersSelected);
    }
  };

  const getSelectedSupplierIds = () => {
    return Object.keys(selectedSuppliers).filter((id) => selectedSuppliers[id]);
  };

  const getSelectedSupplierNames = () => {
    const selectedIds = getSelectedSupplierIds();
    return availableSuppliers
      .filter((supplier) => selectedIds.includes(supplier.id.toString()))
      .map((supplier) => supplier.name)
      .join(", ");
  };

  const sendBulkEmails = async () => {
    if (selectedInquiries.length === 0) {
      alert("No inquiries selected.");
      return;
    }

    if (!emailData.from_email) {
      alert("Please enter your email address.");
      return;
    }

    const selectedSupplierIds = getSelectedSupplierIds();
    if (selectedSupplierIds.length === 0) {
      alert("Please select at least one supplier to send emails to.");
      return;
    }

    setSendingEmail(true);
    setEmailProgress({
      sent: 0,
      total: selectedInquiries.length * selectedSupplierIds.length,
      currentInquiry: null,
    });

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      let emailCount = 0;

      for (const inquiryId of selectedInquiries) {
        const inquiry = inquiries.find((inq) => inq.id === inquiryId);

        if (!inquiry) {
          results.failed++;
          results.errors.push({
            inquiry: `ID: ${inquiryId}`,
            supplier: "N/A",
            error: "Inquiry not found",
          });
          emailCount += selectedSupplierIds.length;
          continue;
        }

        setEmailProgress((prev) => ({
          ...prev,
          currentInquiry: inquiry,
        }));

        for (const supplierId of selectedSupplierIds) {
          const supplier = availableSuppliers.find(
            (s) => s.id.toString() === supplierId
          );

          if (!supplier) {
            results.failed++;
            results.errors.push({
              inquiry: inquiry.inquiry_no || `ID: ${inquiryId}`,
              supplier: `Supplier ID: ${supplierId}`,
              error: "Supplier not found",
            });
            emailCount++;
            continue;
          }

          try {
            if (!supplier.email || !supplier.email.includes("@")) {
              results.failed++;
              results.errors.push({
                inquiry: inquiry.inquiry_no || `ID: ${inquiryId}`,
                supplier: supplier.name || `Supplier ID: ${supplierId}`,
                error: "No valid email",
              });
              emailCount++;
              continue;
            }

            const payload = {
              from_email: emailData.from_email,
              custom_message: emailData.custom_message || "",
              supplier_email: supplier.email,
            };

            const response = await api.post(
              `/inquiries/${inquiryId}/send-email/`,
              payload
            );

            if (response.data.success) {
              results.success++;
            } else {
              results.failed++;
              results.errors.push({
                inquiry: inquiry.inquiry_no || `ID: ${inquiryId}`,
                supplier: supplier.name,
                error: response.data.message || "Unknown error",
              });
            }
          } catch (error) {
            results.failed++;
            results.errors.push({
              inquiry: inquiry.inquiry_no || `ID: ${inquiryId}`,
              supplier: supplier?.name || `Supplier ID: ${supplierId}`,
              error:
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Failed to send email",
            });
          }

          emailCount++;
          setEmailProgress((prev) => ({ ...prev, sent: emailCount }));
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      await fetchInquiries();

      let resultMessage = `Email sending completed!\n\n`;
      resultMessage += `✅ Successfully sent: ${results.success}\n`;
      resultMessage += `❌ Failed: ${results.failed}\n`;

      if (results.errors.length > 0) {
        resultMessage += `\nErrors:\n`;
        results.errors.slice(0, 5).forEach((error) => {
          resultMessage += `• ${error.inquiry} - ${error.supplier}: ${error.error}\n`;
        });
        if (results.errors.length > 5) {
          resultMessage += `• ... and ${
            results.errors.length - 5
          } more errors\n`;
        }
      }

      alert(resultMessage);

      if (results.failed === 0) {
        setSelectedInquiries([]);
        setSelectedSuppliers({});
        closeEmailModal();
      }
    } catch (error) {
      console.error("Bulk email error:", error);
      alert(`Failed to send bulk emails: ${error.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const getSelectedInquiriesCount = () => {
    return selectedInquiries.length;
  };

  const isInquirySelected = (inquiryId) => {
    return selectedInquiries.includes(inquiryId);
  };

  const openModal = async (inquiry) => {
    try {
      const response = await api.get(`/inquiry/${inquiry.id}/`);
      setSelectedInquiry(response.data);
      setBuyerPrice("");
      setSupplierPrice("");
      setComment("");
      setPendingNegotiations([]);
      setShowModal(true);
      setUpdateStatusToConfirmed(false);
      setShowSuppliersEmailed(true);
      setShowSavedNegotiations(true);
    } catch (error) {
      console.error("Error fetching inquiry:", error);
      alert("Failed to load inquiry details.");
    }
  };

  const clearNegotiationHistory = async () => {
    if (
      !selectedInquiry ||
      !window.confirm(
        "Are you sure you want to clear ALL negotiation history for this inquiry? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const res = await api.delete(
        `/negotiation/clear-history/${selectedInquiry.id}/`
      );
      alert(res.data.message);
      const refreshedInquiry = await api.get(`/inquiry/${selectedInquiry.id}/`);
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === selectedInquiry.id ? refreshedInquiry.data : inq
        )
      );
      setSelectedInquiry(refreshedInquiry.data);
    } catch (err) {
      console.error("Error clearing negotiation history:", err);
      let errorMessage = "Failed to clear negotiation history.";
      if (err.response && err.response.data) {
        if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        }
      }
      alert(errorMessage);
    }
  };

  const saveAllNegotiations = async () => {
    if (!selectedInquiry) return;

    if (pendingNegotiations.length === 0) {
      alert("No pending negotiations to save.");
      return;
    }

    setSaving(true);
    try {
      for (const negotiation of pendingNegotiations) {
        const payload = {
          inquiry: selectedInquiry.id,
          buyer_price: negotiation.buyer_price,
          supplier_price: negotiation.supplier_price,
          comment: negotiation.comment,
        };

        await api.post(`/negotiation/`, payload);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (updateStatusToConfirmed) {
        try {
          const updatePayload = {
            current_status: "confirmed",
          };
          await api.patch(`/inquiry/${selectedInquiry.id}/`, updatePayload);
        } catch (statusError) {
          console.warn("Status update failed:", statusError);
        }
      }

      try {
        const refreshedInquiry = await api.get(
          `/inquiry/${selectedInquiry.id}/`
        );
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === selectedInquiry.id ? refreshedInquiry.data : inq
          )
        );
        setSelectedInquiry(refreshedInquiry.data);
      } catch (refreshError) {
        console.warn("Failed to refresh inquiry:", refreshError);
      }

      closeModal();
      alert(
        `${pendingNegotiations.length} negotiation round(s) saved successfully!` +
          (updateStatusToConfirmed ? " Status updated to confirmed." : "")
      );
    } catch (err) {
      console.error("Error saving negotiations:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/inquiry/`);
      const inquiriesWithProcessedPrices = res.data.map((inquiry) => ({
        ...inquiry,
        supplier_prices: (inquiry.supplier_prices || []).filter(
          (item) => item.price !== null && item.price !== undefined
        ),
      }));
      setInquiries(inquiriesWithProcessedPrices);
    } catch (err) {
      console.error("fetchInquiries error:", err);
      alert("Failed to fetch inquiries.");
    } finally {
      setLoading(false);
    }
  };

  const renderSupplierPrices = (inquiry) => {
    const prices = (inquiry.supplier_prices || [])
      .filter((item) => {
        const price = item.price;
        return (
          price !== null && price !== undefined && !isNaN(parseFloat(price))
        );
      })
      .map((item) => ({
        ...item,
        price: parseFloat(item.price),
      }))
      .sort((a, b) => a.price - b.price);

    if (prices.length === 0) {
      return <div style={styles.noPrices}>No prices</div>;
    }

    return (
      <div style={styles.supplierPrices}>
        {prices.slice(0, 2).map((priceItem, index) => (
          <div key={priceItem.id || index} style={styles.supplierPriceItem}>
            <span style={styles.supplierName}>
              {priceItem.supplier_name?.substring(0, 10) || "Supplier"}:
            </span>{" "}
            <span style={styles.priceValue}>
              $
              {typeof priceItem.price === "number"
                ? priceItem.price.toFixed(2)
                : "N/A"}
            </span>
          </div>
        ))}
        {prices.length > 2 && (
          <div style={styles.morePrices}>+{prices.length - 2} more...</div>
        )}
      </div>
    );
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedInquiry(null);
    setBuyerPrice("");
    setSupplierPrice("");
    setComment("");
    setPendingNegotiations([]);
    setUpdateStatusToConfirmed(false);
    setShowSuppliersEmailed(true);
    setShowSavedNegotiations(true);
  };

  const addPendingNegotiation = () => {
    if (!buyerPrice && !supplierPrice && !comment) {
      alert("Please enter at least one price or comment.");
      return;
    }

    const newNegotiation = {
      id: Date.now(),
      buyer_price: buyerPrice ? parseFloat(buyerPrice) : null,
      supplier_price: supplierPrice ? parseFloat(supplierPrice) : null,
      comment: comment || "",
      created_at: new Date().toISOString(),
      created_by: "User",
      isPending: true,
    };

    setPendingNegotiations((prev) => [newNegotiation, ...prev]);
    setBuyerPrice("");
    setSupplierPrice("");
    setComment("");
  };

  const removePendingNegotiation = (id) => {
    setPendingNegotiations((prev) => prev.filter((neg) => neg.id !== id));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete this inquiry?")) return;
    try {
      await api.delete(`/inquiry/${id}/`);
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      alert("Inquiry deleted successfully!");
    } catch (err) {
      console.error("delete error", err);
      alert("Delete failed.");
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  const statusColors = {
    pending: "#FF9800",
    quoted: "#2196F3",
    confirmed: "#4CAF50",
    running: "#4CAF50",
    default: "#9E9E9E",
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Recent";
    try {
      return new Date(dateTimeString).toLocaleString();
    } catch {
      return dateTimeString;
    }
  };

  const getImageUrl = (imageField) => {
    if (!imageField) return null;
    if (typeof imageField === "string") {
      if (imageField.startsWith("http")) {
        return imageField;
      }
      return `http://119.148.51.38:8000${imageField}`;
    }
    return null;
  };

  const getCustomerName = (customer) => {
    if (!customer) return "-";
    if (typeof customer === "object") {
      return customer.name || "-";
    }
    return customer.toString() || "-";
  };

  // Calculate selection totals
  const selectionTotals = selectedInquiries.reduce(
    (acc, inquiryId) => {
      const inquiry = inquiries.find((inq) => inq.id === inquiryId);
      if (inquiry) {
        const quantity = parseFloat(inquiry.order_quantity) || 0;
        const targetPrice = parseFloat(inquiry.target_price) || 0;
        const confirmedPrice = parseFloat(inquiry.confirmed_price) || 0;
        const price = confirmedPrice || targetPrice;
        acc.totalQuantity += quantity;
        acc.totalValue += quantity * price;
        acc.count++;
      }
      return acc;
    },
    { count: 0, totalQuantity: 0, totalValue: 0 }
  );

  // Calculate total value for display
  const totalValue = filtered.reduce((sum, inquiry) => {
    const quantity = parseFloat(inquiry.order_quantity) || 0;
    const targetPrice = parseFloat(inquiry.target_price) || 0;
    const confirmedPrice = parseFloat(inquiry.confirmed_price) || 0;
    const price = confirmedPrice || targetPrice;
    return sum + quantity * price;
  }, 0);

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        {/* Header similar to screenshot */}
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>📝 Inquiry Management System</h2>
          <div style={styles.headerActions}>
            <Link to="/inquiries/attachments" style={styles.headerButton}>
              📎 Attachments
            </Link>
            <Link to="/inquiries/add" style={styles.headerButtonPrimary}>
              ➕ Add New Inquiry
            </Link>
          </div>
        </div>

        {/* Filter Section similar to screenshot */}
        <div style={styles.filterSection}>
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Years</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i; // Start from 2 years ago
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Season</label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Seasons</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="autumn">Autumn</option>
                <option value="winter">Winter</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">Select Group</option>
                <option value="group1">Group 1</option>
                <option value="group2">Group 2</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Supplier</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">Select Supplier</option>
                {availableSuppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="quoted">Quoted</option>
                <option value="confirmed">Confirmed</option>
                <option value="running">Running</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Style</label>
              <input
                type="text"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                style={styles.filterInput}
                placeholder="Style..."
              />
            </div>
          </div>

          {/* Checkbox filters */}
          <div style={styles.checkboxFilterRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={withImage}
                onChange={(e) => setWithImage(e.target.checked)}
                style={styles.checkbox}
              />
              With Image
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={dateWiseShipment}
                onChange={(e) => setDateWiseShipment(e.target.checked)}
                style={styles.checkbox}
              />
              Date Wise Shipment
            </label>

            <div style={styles.dateRangeGroup}>
              <label style={styles.dateLabel}>From (mm/dd/yyyy)</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={styles.dateInput}
              />
            </div>

            <div style={styles.dateRangeGroup}>
              <label style={styles.dateLabel}>To (mm/dd/yyyy)</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={styles.dateInput}
              />
            </div>
          </div>

          {/* Summary options */}
          <div style={styles.summaryOptions}>
            <div style={styles.summaryTitle}>Summary</div>
            <div style={styles.summaryCheckboxes}>
              <label style={styles.summaryCheckboxLabel}>
                <input
                  type="checkbox"
                  checked={showDetails}
                  onChange={(e) => setShowDetails(e.target.checked)}
                  style={styles.smallCheckbox}
                />
                Details
              </label>
              <label style={styles.summaryCheckboxLabel}>
                <input
                  type="checkbox"
                  checked={showSampleStatus}
                  onChange={(e) => setShowSampleStatus(e.target.checked)}
                  style={styles.smallCheckbox}
                />
                Sample Status
              </label>
              <label style={styles.summaryCheckboxLabel}>
                <input
                  type="checkbox"
                  checked={showAttachments}
                  onChange={(e) => setShowAttachments(e.target.checked)}
                  style={styles.smallCheckbox}
                />
                Attachments
              </label>
              <label style={styles.summaryCheckboxLabel}>
                <input
                  type="checkbox"
                  checked={showEmailCommunications}
                  onChange={(e) => setShowEmailCommunications(e.target.checked)}
                  style={styles.smallCheckbox}
                />
                Email Communications
              </label>
            </div>
          </div>

          {/* Search bar */}
          <div style={styles.searchBar}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
              placeholder="Enter text to search..."
            />
            <button
              onClick={() => fetchInquiries()}
              style={styles.searchButton}
            >
              Find
            </button>
            <button onClick={clearAllFilters} style={styles.clearButton}>
              Clear
            </button>
          </div>
        </div>

        {/* Selection banner */}
        {selectedInquiries.length > 0 && (
          <div style={styles.selectionBanner}>
            <span style={styles.selectionText}>
              {selectedInquiries.length} inquiry(s) selected
            </span>
            <div style={styles.selectionActions}>
              <button onClick={openEmailModal} style={styles.emailButton}>
                📧 Send Email
              </button>
              <button
                onClick={() => {
                  setSelectedInquiries([]);
                  setSelectedSuppliers({});
                }}
                style={styles.clearSelectionButton}
              >
                ✕ Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Main table */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <span>Shipment Date -</span>
            <span style={styles.resultCount}>
              {filtered.length} items found
            </span>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    <input
                      type="checkbox"
                      checked={
                        selectedInquiries.length > 0 &&
                        selectedInquiries.length === currentItems.length
                      }
                      onChange={toggleSelectAll}
                      style={styles.checkbox}
                    />
                  </th>
                  <th style={styles.th}>Image</th>
                  <th style={styles.th}>Inquiry No</th>
                  <th style={styles.th}>Style</th>
                  <th style={styles.th}>Fabrication</th>
                  <th style={styles.th}>Order Qty</th>
                  <th style={styles.th}>Shipment Date</th>
                  <th style={styles.th}>Target Price</th>
                  <th style={styles.th}>Offer Price</th>
                  <th style={styles.th}>Confirmed Price</th>
                  <th style={styles.th}>Value</th>
                  <th style={styles.th}>Supplier Prices</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Remarks</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="15" style={styles.loadingCell}>
                      Loading inquiries...
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((inquiry, index) => (
                    <tr
                      key={inquiry.id}
                      style={{
                        ...styles.tr,
                        backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white",
                      }}
                    >
                      <td style={styles.td}>
                        <input
                          type="checkbox"
                          checked={isInquirySelected(inquiry.id)}
                          onChange={() => toggleSelectInquiry(inquiry.id)}
                          style={styles.checkbox}
                        />
                      </td>
                      <td style={styles.td}>
                        {getImageUrl(inquiry.image) ? (
                          <img
                            src={getImageUrl(inquiry.image)}
                            alt="Inquiry"
                            style={styles.productImage}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div style={styles.imagePlaceholder}>No Image</div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.inquiryNo}>
                          {inquiry.inquiry_no || "-"}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.styleCell}>
                          {inquiry.same_style?.styles || "No Style"}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {inquiry.fabrication?.fabrication || "-"}
                      </td>
                      <td style={styles.td}>
                        {inquiry.order_quantity?.toLocaleString() || "-"}
                      </td>
                      <td style={styles.td}>
                        {formatDate(inquiry.shipment_date)}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.priceCell}>
                          $
                          {typeof inquiry.target_price === "number"
                            ? inquiry.target_price.toFixed(2)
                            : "-"}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.priceCell}>
                          $
                          {typeof inquiry.offer_price === "number"
                            ? inquiry.offer_price.toFixed(2)
                            : "-"}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.priceCell}>
                          $
                          {typeof inquiry.confirmed_price === "number"
                            ? inquiry.confirmed_price.toFixed(2)
                            : "-"}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.valueCell}>
                          $
                          {typeof inquiry.value === "number"
                            ? inquiry.value.toFixed(2)
                            : "0.00"}
                        </div>
                      </td>
                      <td style={styles.td}>{renderSupplierPrices(inquiry)}</td>
                      <td style={styles.td}>
                        <div
                          style={{
                            ...styles.statusBadge,
                            backgroundColor:
                              statusColors[inquiry.current_status] ||
                              statusColors.default,
                          }}
                        >
                          {inquiry.current_status || "pending"}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <textarea
                          rows={2}
                          value={inquiry.remarks1 || ""}
                          onChange={(e) =>
                            handleRemarks1Change(inquiry.id, e.target.value)
                          }
                          onFocus={() =>
                            setEditingRemarks((prev) => ({
                              ...prev,
                              [inquiry.id]: true,
                            }))
                          }
                          onBlur={() =>
                            handleRemarks1Save(inquiry.id, inquiry.remarks1)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleRemarks1Save(inquiry.id, inquiry.remarks1);
                            }
                          }}
                          style={{
                            ...styles.remarksInput,
                            borderColor: editingRemarks[inquiry.id]
                              ? "#007bff"
                              : "#ccc",
                          }}
                          placeholder="Add remarks..."
                        />
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => openModal(inquiry)}
                            style={styles.actionButton}
                            title="Negotiate"
                          >
                            💬
                          </button>
                          <Link
                            to={`/inquiries/${inquiry.id}`}
                            style={styles.actionButton}
                            title="View"
                          >
                            👁️
                          </Link>
                          <button
                            onClick={() => handleDelete(inquiry.id)}
                            style={styles.deleteButton}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="15" style={styles.emptyCell}>
                      No inquiries found. Try adjusting your search filters.
                    </td>
                  </tr>
                )}
              </tbody>
              {/* Summary row */}
              {filtered.length > 0 && (
                <tfoot>
                  <tr style={styles.summaryRow}>
                    <td colSpan="10" style={styles.summaryLabel}>
                      Total:
                    </td>
                    <td style={styles.summaryValue}>
                      ${totalValue.toFixed(2)}
                    </td>
                    <td colSpan="4" style={styles.summaryNote}>
                      {filtered.length} items
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                style={styles.paginationButton}
              >
                ← Previous
              </button>
              <div style={styles.pageNumbers}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => setCurrentPage(n)}
                      style={
                        n === currentPage
                          ? styles.paginationButtonActive
                          : styles.paginationButton
                      }
                    >
                      {n}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(currentPage + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                style={styles.paginationButton}
              >
                Next →
              </button>
              <div style={styles.paginationInfo}>
                Page {currentPage} of {totalPages} | Total: {filtered.length}{" "}
                items
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📧 Send Email to Suppliers</h3>
              <button onClick={closeEmailModal} style={styles.closeButton}>
                ✕
              </button>
            </div>

            <div style={styles.modalContent}>
              {sendingEmail ? (
                <div style={styles.progressSection}>
                  <div style={styles.progressText}>
                    Sending {emailProgress.sent} of {emailProgress.total} emails
                  </div>
                  {emailProgress.currentInquiry && (
                    <div style={styles.currentTask}>
                      Currently: {emailProgress.currentInquiry.inquiry_no}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Your Email Address *</label>
                    <input
                      type="email"
                      value={emailData.from_email}
                      onChange={(e) =>
                        setEmailData((prev) => ({
                          ...prev,
                          from_email: e.target.value,
                        }))
                      }
                      style={styles.formInput}
                      placeholder="your.email@company.com"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Custom Message (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={emailData.custom_message}
                      onChange={(e) =>
                        setEmailData((prev) => ({
                          ...prev,
                          custom_message: e.target.value,
                        }))
                      }
                      style={styles.textarea}
                      placeholder="Enter a custom message..."
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <div style={styles.formLabelRow}>
                      <label style={styles.formLabel}>Select Suppliers *</label>
                      <button
                        onClick={toggleSelectAllSuppliers}
                        style={styles.selectAllButton}
                      >
                        {availableSuppliers.length > 0 &&
                        availableSuppliers.every(
                          (supplier) => selectedSuppliers[supplier.id]
                        )
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>
                    <div style={styles.suppliersList}>
                      {availableSuppliers.map((supplier) => (
                        <label key={supplier.id} style={styles.supplierItem}>
                          <input
                            type="checkbox"
                            checked={!!selectedSuppliers[supplier.id]}
                            onChange={() =>
                              toggleSupplierSelection(supplier.id)
                            }
                            style={styles.checkbox}
                          />
                          <div style={styles.supplierInfo}>
                            <div style={styles.supplierName}>
                              {supplier.name}
                            </div>
                            <div style={styles.supplierEmail}>
                              {supplier.email || "No email"}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Selected Inquiries ({selectedInquiries.length})
                    </label>
                    <div style={styles.inquiriesList}>
                      {selectedInquiries.map((id) => {
                        const inquiry = inquiries.find((inq) => inq.id === id);
                        return inquiry ? (
                          <div key={id} style={styles.inquiryItem}>
                            {inquiry.inquiry_no}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={closeEmailModal}
                style={styles.secondaryButton}
                disabled={sendingEmail}
              >
                Cancel
              </button>
              <button
                onClick={sendBulkEmails}
                style={styles.primaryButton}
                disabled={
                  sendingEmail ||
                  !emailData.from_email ||
                  getSelectedSupplierIds().length === 0
                }
              >
                {sendingEmail
                  ? "Sending..."
                  : `Send ${getSelectedInquiriesCount()} × ${
                      getSelectedSupplierIds().length
                    } Emails`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Negotiation Modal */}
      {showModal && selectedInquiry && (
        <div style={styles.modalOverlay}>
          <div style={styles.negotiationModal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                💬 Negotiation — {selectedInquiry.inquiry_no}
              </h3>
              <button onClick={closeModal} style={styles.closeButton}>
                ✕
              </button>
            </div>

            <div style={styles.modalContent}>
              {/* Inquiry Details */}
              <div style={styles.inquiryDetails}>
                <div style={styles.inquiryImage}>
                  {getImageUrl(selectedInquiry.image) ? (
                    <img
                      src={getImageUrl(selectedInquiry.image)}
                      alt="Inquiry"
                      style={styles.detailImage}
                    />
                  ) : (
                    <div style={styles.detailImagePlaceholder}>No Image</div>
                  )}
                </div>
                <div style={styles.inquiryInfo}>
                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <label style={styles.infoLabel}>Order Quantity</label>
                      <div style={styles.infoValue}>
                        {selectedInquiry.order_quantity?.toLocaleString() ||
                          "0"}
                      </div>
                    </div>
                    <div style={styles.infoItem}>
                      <label style={styles.infoLabel}>Customer</label>
                      <div style={styles.infoValue}>
                        {getCustomerName(selectedInquiry.customer)}
                      </div>
                    </div>
                    <div style={styles.infoItem}>
                      <label style={styles.infoLabel}>Target Price</label>
                      <div style={{ ...styles.infoValue, color: "#007bff" }}>
                        $
                        {typeof selectedInquiry.target_price === "number"
                          ? selectedInquiry.target_price.toFixed(2)
                          : "0.00"}
                      </div>
                    </div>
                    <div style={styles.infoItem}>
                      <label style={styles.infoLabel}>Confirmed Price</label>
                      <div style={{ ...styles.infoValue, color: "#28a745" }}>
                        $
                        {typeof selectedInquiry.confirmed_price === "number"
                          ? selectedInquiry.confirmed_price.toFixed(2)
                          : "0.00"}
                      </div>
                    </div>
                    <div style={styles.infoItem}>
                      <label style={styles.infoLabel}>Status</label>
                      <div
                        style={{
                          ...styles.statusBadge,
                          backgroundColor:
                            statusColors[selectedInquiry.current_status] ||
                            statusColors.default,
                        }}
                      >
                        {selectedInquiry.current_status || "pending"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Negotiation Sections */}
              <div style={styles.negotiationSections}>
                <div style={styles.negotiationSection}>
                  <h4 style={styles.sectionTitle}>New Negotiation Round</h4>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Buyer Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={buyerPrice}
                      onChange={(e) => setBuyerPrice(e.target.value)}
                      style={styles.formInput}
                      placeholder="Enter buyer price"
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Supplier Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={supplierPrice}
                      onChange={(e) => setSupplierPrice(e.target.value)}
                      style={styles.formInput}
                      placeholder="Enter supplier price"
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Comment</label>
                    <textarea
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      style={styles.textarea}
                      placeholder="Add negotiation comments..."
                    />
                  </div>
                  <button
                    onClick={addPendingNegotiation}
                    style={styles.addButton}
                    disabled={!buyerPrice && !supplierPrice && !comment}
                  >
                    Add Negotiation Round
                  </button>
                </div>

                <div style={styles.negotiationSection}>
                  <h4 style={styles.sectionTitle}>
                    Pending Rounds ({pendingNegotiations.length})
                  </h4>
                  <div style={styles.pendingList}>
                    {pendingNegotiations.map((negotiation, index) => (
                      <div key={negotiation.id} style={styles.pendingItem}>
                        <div style={styles.pendingHeader}>
                          <div style={styles.pendingRound}>
                            Round {pendingNegotiations.length - index}
                            <span style={styles.pendingStatus}>Pending</span>
                          </div>
                          <button
                            onClick={() =>
                              removePendingNegotiation(negotiation.id)
                            }
                            style={styles.removeButton}
                          >
                            ✕
                          </button>
                        </div>
                        <div style={styles.pendingPrices}>
                          {negotiation.buyer_price && (
                            <div style={styles.priceTag}>
                              Buyer: <strong>${negotiation.buyer_price}</strong>
                            </div>
                          )}
                          {negotiation.supplier_price && (
                            <div style={styles.priceTag}>
                              Supplier:{" "}
                              <strong>${negotiation.supplier_price}</strong>
                            </div>
                          )}
                        </div>
                        {negotiation.comment && (
                          <div style={styles.pendingComment}>
                            {negotiation.comment}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <div style={styles.footerLeft}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={updateStatusToConfirmed}
                    onChange={(e) =>
                      setUpdateStatusToConfirmed(e.target.checked)
                    }
                    style={styles.checkbox}
                  />
                  Update status to "Confirmed"
                </label>
              </div>
              <div style={styles.footerRight}>
                <button onClick={closeModal} style={styles.secondaryButton}>
                  Cancel
                </button>
                <button
                  onClick={saveAllNegotiations}
                  style={styles.primaryButton}
                  disabled={saving || pendingNegotiations.length === 0}
                >
                  {saving ? "Saving..." : "Save All Rounds"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================
// Traditional Styles
// =====================
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  mainContent: {
    flex: 1,
    padding: "15px",
    backgroundColor: "#fff",
    margin: "10px",
    borderRadius: "3px",
    boxShadow: "0 0 5px rgba(0,0,0,0.1)",
    position: "relative", // Add this
    overflow: "hidden", // Add this
  },
  header: {
    background: "#3a7bd5",
    color: "white",
    padding: "12px 15px",
    marginBottom: "15px",
    borderRadius: "3px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "bold",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
  },
  headerButton: {
    background: "#5a9bff",
    color: "white",
    padding: "6px 12px",
    borderRadius: "3px",
    textDecoration: "none",
    fontSize: "13px",
    border: "none",
    cursor: "pointer",
  },
  headerButtonPrimary: {
    background: "#28a745",
    color: "white",
    padding: "6px 12px",
    borderRadius: "3px",
    textDecoration: "none",
    fontSize: "13px",
    border: "none",
    cursor: "pointer",
  },
  filterSection: {
    background: "#f8f9fa",
    border: "1px solid #ddd",
    padding: "15px",
    marginBottom: "15px",
    borderRadius: "3px",
  },
  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "10px",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    minWidth: "120px",
  },
  filterLabel: {
    fontSize: "11px",
    color: "#666",
    marginBottom: "3px",
    fontWeight: "bold",
  },
  filterSelect: {
    padding: "5px",
    border: "1px solid #ccc",
    borderRadius: "3px",
    fontSize: "12px",
    backgroundColor: "white",
  },
  filterInput: {
    padding: "5px",
    border: "1px solid #ccc",
    borderRadius: "3px",
    fontSize: "12px",
    width: "100px",
  },
  checkboxFilterRow: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginTop: "10px",
    padding: "10px",
    background: "#f0f0f0",
    borderRadius: "3px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "12px",
    color: "#333",
  },
  checkbox: {
    margin: 0,
  },
  dateRangeGroup: {
    display: "flex",
    flexDirection: "column",
  },
  dateLabel: {
    fontSize: "11px",
    color: "#666",
    marginBottom: "3px",
  },
  dateInput: {
    padding: "5px",
    border: "1px solid #ccc",
    borderRadius: "3px",
    fontSize: "12px",
    width: "120px",
  },
  summaryOptions: {
    marginTop: "10px",
    padding: "10px",
    background: "#e8f4fd",
    borderRadius: "3px",
  },
  summaryTitle: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: "5px",
  },
  summaryCheckboxes: {
    display: "flex",
    gap: "15px",
  },
  summaryCheckboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "12px",
    color: "#333",
  },
  smallCheckbox: {
    margin: 0,
    transform: "scale(0.8)",
  },
  searchBar: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  searchInput: {
    flex: 1,
    padding: "6px 10px",
    border: "1px solid #ccc",
    borderRadius: "3px",
    fontSize: "12px",
  },
  searchButton: {
    background: "#007bff",
    color: "white",
    padding: "6px 15px",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
  },
  clearButton: {
    background: "#6c757d",
    color: "white",
    padding: "6px 15px",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
  },
  selectionBanner: {
    background: "#e8f4fd",
    border: "1px solid #b3d7ff",
    padding: "10px 15px",
    marginBottom: "15px",
    borderRadius: "3px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectionText: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#007bff",
  },
  selectionActions: {
    display: "flex",
    gap: "10px",
  },
  emailButton: {
    background: "#28a745",
    color: "white",
    padding: "5px 10px",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
  },
  clearSelectionButton: {
    background: "#dc3545",
    color: "white",
    padding: "5px 10px",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
  },
  tableContainer: {
    marginTop: "15px",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "2px solid #4a6fa5",
    marginBottom: "5px",
  },
  resultCount: {
    fontSize: "12px",
    color: "#666",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
    minWidth: "1400px",
  },
  th: {
    background: "#4a6fa5",
    color: "white",
    padding: "8px 5px",
    border: "1px solid #3a5f8f",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "11px",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #ddd",
  },
  td: {
    padding: "6px 5px",
    border: "1px solid #ddd",
    textAlign: "center",
    fontSize: "11px",
    verticalAlign: "middle",
  },
  loadingCell: {
    padding: "30px",
    textAlign: "center",
    color: "#666",
    fontSize: "13px",
  },
  emptyCell: {
    padding: "30px",
    textAlign: "center",
    color: "#999",
    fontSize: "13px",
  },
  productImage: {
    width: "40px",
    height: "40px",
    objectFit: "cover",
    borderRadius: "3px",
    border: "1px solid #ddd",
  },
  imagePlaceholder: {
    width: "40px",
    height: "40px",
    background: "#f5f5f5",
    borderRadius: "3px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
    color: "#999",
    border: "1px dashed #ddd",
  },
  inquiryNo: {
    fontWeight: "bold",
    color: "#333",
  },
  styleCell: {
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  priceCell: {
    fontWeight: "bold",
  },
  valueCell: {
    fontWeight: "bold",
    color: "#8b5cf6",
  },
  supplierPrices: {
    maxWidth: "120px",
  },
  supplierPriceItem: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "2px",
    fontSize: "10px",
  },
  supplierName: {
    color: "#555",
  },
  priceValue: {
    fontWeight: "bold",
    color: "#333",
  },
  noPrices: {
    color: "#999",
    fontSize: "10px",
    fontStyle: "italic",
  },
  morePrices: {
    fontSize: "9px",
    color: "#666",
    marginTop: "2px",
  },
  statusBadge: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "10px",
    fontSize: "10px",
    fontWeight: "bold",
    color: "white",
    textTransform: "uppercase",
  },
  remarksInput: {
    width: "100%",
    padding: "4px",
    borderRadius: "3px",
    border: "1px solid #ccc",
    fontSize: "11px",
    resize: "vertical",
    minHeight: "50px",
    outline: "none",
  },
  actionButtons: {
    display: "flex",
    gap: "5px",
    justifyContent: "center",
  },
  actionButton: {
    background: "transparent",
    border: "1px solid #ccc",
    padding: "3px 6px",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "11px",
    textDecoration: "none",
    color: "#333",
  },
  deleteButton: {
    background: "transparent",
    border: "1px solid #ffcccc",
    padding: "3px 6px",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "11px",
    color: "#dc3545",
  },
  summaryRow: {
    background: "#e8f4fd",
    fontWeight: "bold",
    borderTop: "2px solid #4a6fa5",
  },
  summaryLabel: {
    padding: "8px",
    textAlign: "right",
    fontSize: "12px",
    color: "#333",
  },
  summaryValue: {
    padding: "8px",
    textAlign: "center",
    fontSize: "12px",
    color: "#28a745",
    fontWeight: "bold",
  },
  summaryNote: {
    padding: "8px",
    textAlign: "center",
    fontSize: "11px",
    color: "#666",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "15px",
    gap: "10px",
  },
  paginationButton: {
    padding: "5px 10px",
    background: "white",
    border: "1px solid #ddd",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
  },
  paginationButtonActive: {
    padding: "5px 10px",
    background: "#007bff",
    color: "white",
    border: "1px solid #007bff",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
  },
  pageNumbers: {
    display: "flex",
    gap: "5px",
  },
  paginationInfo: {
    fontSize: "12px",
    color: "#666",
    marginLeft: "10px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    background: "white",
    borderRadius: "3px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 0 10px rgba(0,0,0,0.3)",
  },
  negotiationModal: {
    background: "white",
    borderRadius: "3px",
    width: "90%",
    maxWidth: "800px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 0 10px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    padding: "15px",
    borderBottom: "1px solid #ddd",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f8f9fa",
  },
  modalTitle: {
    margin: 0,
    fontSize: "16px",
    color: "#333",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#666",
  },
  modalContent: {
    padding: "15px",
  },
  modalFooter: {
    padding: "15px",
    borderTop: "1px solid #ddd",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f8f9fa",
  },
  progressSection: {
    padding: "20px",
    textAlign: "center",
  },
  progressText: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "5px",
  },
  currentTask: {
    fontSize: "12px",
    color: "#666",
  },
  formGroup: {
    marginBottom: "15px",
  },
  formLabel: {
    display: "block",
    marginBottom: "5px",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#333",
  },
  formLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "5px",
  },
  formInput: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "3px",
    fontSize: "13px",
  },
  textarea: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "3px",
    fontSize: "13px",
    resize: "vertical",
    minHeight: "80px",
  },
  selectAllButton: {
    background: "transparent",
    color: "#007bff",
    border: "1px solid #007bff",
    padding: "4px 8px",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
  },
  suppliersList: {
    maxHeight: "200px",
    overflowY: "auto",
    border: "1px solid #ddd",
    borderRadius: "3px",
  },
  supplierItem: {
    display: "flex",
    alignItems: "center",
    padding: "8px",
    borderBottom: "1px solid #eee",
  },
  supplierInfo: {
    marginLeft: "10px",
  },
  supplierEmail: {
    fontSize: "12px",
    color: "#666",
  },
  inquiriesList: {
    maxHeight: "100px",
    overflowY: "auto",
    border: "1px solid #ddd",
    borderRadius: "3px",
    padding: "8px",
  },
  inquiryItem: {
    padding: "4px 0",
    fontSize: "12px",
    color: "#333",
  },
  secondaryButton: {
    background: "#6c757d",
    color: "white",
    padding: "8px 15px",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "13px",
  },
  primaryButton: {
    background: "#007bff",
    color: "white",
    padding: "8px 15px",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "13px",
  },
  inquiryDetails: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px",
    padding: "15px",
    background: "#f8f9fa",
    borderRadius: "3px",
  },
  inquiryImage: {
    flexShrink: 0,
  },
  detailImage: {
    width: "80px",
    height: "80px",
    objectFit: "cover",
    borderRadius: "3px",
    border: "1px solid #ddd",
  },
  detailImagePlaceholder: {
    width: "80px",
    height: "80px",
    background: "#f5f5f5",
    borderRadius: "3px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#999",
    fontSize: "11px",
    border: "1px dashed #ddd",
  },
  inquiryInfo: {
    flex: 1,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "10px",
  },
  infoItem: {},
  infoLabel: {
    fontSize: "11px",
    color: "#666",
    marginBottom: "3px",
  },
  infoValue: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#333",
  },
  negotiationSections: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  negotiationSection: {
    padding: "15px",
    background: "#f8f9fa",
    borderRadius: "3px",
    border: "1px solid #ddd",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
    margin: "0 0 15px 0",
  },
  inputGroup: {
    marginBottom: "10px",
  },
  inputLabel: {
    display: "block",
    marginBottom: "5px",
    fontSize: "12px",
    color: "#333",
  },
  addButton: {
    width: "100%",
    padding: "8px",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "13px",
  },
  pendingList: {
    maxHeight: "200px",
    overflowY: "auto",
  },
  pendingItem: {
    padding: "10px",
    background: "white",
    borderRadius: "3px",
    border: "1px solid #ffc107",
    marginBottom: "10px",
  },
  pendingHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  pendingRound: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#333",
  },
  pendingStatus: {
    background: "#fff3cd",
    color: "#856404",
    padding: "2px 6px",
    borderRadius: "10px",
    fontSize: "10px",
    marginLeft: "8px",
  },
  removeButton: {
    background: "transparent",
    border: "none",
    color: "#dc3545",
    cursor: "pointer",
    fontSize: "14px",
  },
  pendingPrices: {
    display: "flex",
    gap: "10px",
    marginBottom: "8px",
  },
  priceTag: {
    background: "#f8f9fa",
    padding: "5px 10px",
    borderRadius: "3px",
    fontSize: "12px",
    color: "#333",
  },
  pendingComment: {
    padding: "8px",
    background: "#fff3cd",
    borderRadius: "3px",
    fontSize: "12px",
    color: "#856404",
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    display: "flex",
    gap: "10px",
  },
};

export default Inquiry;
