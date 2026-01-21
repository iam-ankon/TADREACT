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
  const [selectedYear, setSelectedYear] = useState("");
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

  useEffect(() => {
    const saved = localStorage.getItem("inquirySelectedYear");
    if (saved) setSelectedYear(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("inquirySelectedYear", selectedYear);
  }, [selectedYear]);

  // Save/load Season filter
  useEffect(() => {
    const saved = localStorage.getItem("inquirySelectedSeason");
    if (saved) setSelectedSeason(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("inquirySelectedSeason", selectedSeason);
  }, [selectedSeason]);

  // Save/load Group filter
  useEffect(() => {
    const saved = localStorage.getItem("inquirySelectedGroup");
    if (saved) setSelectedGroup(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("inquirySelectedGroup", selectedGroup);
  }, [selectedGroup]);

  // Save/load Supplier filter
  useEffect(() => {
    const saved = localStorage.getItem("inquirySelectedSupplier");
    if (saved) setSelectedSupplier(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("inquirySelectedSupplier", selectedSupplier);
  }, [selectedSupplier]);

  // Save/load Status filter
  useEffect(() => {
    const saved = localStorage.getItem("inquirySelectedStatus");
    if (saved) setSelectedStatus(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("inquirySelectedStatus", selectedStatus);
  }, [selectedStatus]);

  // Save/load Month filter
  useEffect(() => {
    const saved = localStorage.getItem("inquirySelectedMonth");
    if (saved) setSelectedMonth(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("inquirySelectedMonth", selectedMonth);
  }, [selectedMonth]);

  // Save/load Style filter
  useEffect(() => {
    const saved = localStorage.getItem("inquirySelectedStyle");
    if (saved) setSelectedStyle(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("inquirySelectedStyle", selectedStyle);
  }, [selectedStyle]);

  // Save/load With Image filter
  useEffect(() => {
    const saved = localStorage.getItem("inquiryWithImage");
    if (saved) setWithImage(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("inquiryWithImage", withImage.toString());
  }, [withImage]);

  // Save/load Date Wise Shipment filter
  useEffect(() => {
    const saved = localStorage.getItem("inquiryDateWiseShipment");
    if (saved) setDateWiseShipment(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "inquiryDateWiseShipment",
      dateWiseShipment.toString()
    );
  }, [dateWiseShipment]);

  // Save/load Date From filter
  useEffect(() => {
    const saved = localStorage.getItem("inquiryDateFrom");
    if (saved) setDateFrom(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("inquiryDateFrom", dateFrom);
  }, [dateFrom]);

  // Save/load Date To filter
  useEffect(() => {
    const saved = localStorage.getItem("inquiryDateTo");
    if (saved) setDateTo(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("inquiryDateTo", dateTo);
  }, [dateTo]);

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

  const filtered = inquiries.filter((i) => {
    // Existing text search
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

    // Existing year search (from searchYears)
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

    // Existing season filter (from selectedSeasons)
    const seasonPassed =
      selectedSeasons.length === 0
        ? true
        : selectedSeasons.includes(i.season?.toLowerCase() || "");

    // Existing garment filter (from selectedGarments)
    const garmentPassed =
      selectedGarments.length === 0
        ? true
        : selectedGarments.includes(i.garment?.toLowerCase() || "");

    // ========== NEW FILTERS ==========

    // Year filter (from dropdown)
    const yearDropdownPassed = !selectedYear
      ? true
      : String(i.year || "") === selectedYear;

    // Season filter (from dropdown)
    const seasonDropdownPassed = !selectedSeason
      ? true
      : (i.season || "").toLowerCase() === selectedSeason.toLowerCase();

    // Group filter
    const groupPassed = !selectedGroup
      ? true
      : (i.group || "").toLowerCase() === selectedGroup.toLowerCase();

    // Supplier filter
    const supplierPassed = !selectedSupplier
      ? true
      : {
          // Check if any supplier in supplier_prices matches
          supplierMatch: (i.supplier_prices || []).some(
            (sp) => sp.supplier_id?.toString() === selectedSupplier
          ),
          // Or check other supplier fields if they exist
          directMatch: i.supplier?.toString() === selectedSupplier,
        }.supplierMatch || false;

    // Status filter
    const statusPassed = !selectedStatus
      ? true
      : (i.current_status || "").toLowerCase() === selectedStatus.toLowerCase();

    // Month filter (shipment month)
    const monthPassed = !selectedMonth
      ? true
      : {
          // Extract month from shipment_date
          date: i.shipment_date ? new Date(i.shipment_date) : null,
          condition: selectedMonth ? parseInt(selectedMonth) : null,
        }.date?.getMonth() +
          1 ===
        parseInt(selectedMonth);

    // Style filter
    const stylePassed = !selectedStyle
      ? true
      : (i.same_style?.styles || "")
          .toLowerCase()
          .includes(selectedStyle.toLowerCase());

    // With Image filter
    const imagePassed = !withImage ? true : !!i.image;

    // Date range filter
    const dateRangePassed = !dateWiseShipment
      ? true
      : {
          shipmentDate: i.shipment_date ? new Date(i.shipment_date) : null,
          fromDate: dateFrom ? new Date(dateFrom) : null,
          toDate: dateTo ? new Date(dateTo) : null,
        }.shipmentDate >= new Date(dateFrom || "1900-01-01") &&
        new Date(i.shipment_date || "9999-12-31") <=
          new Date(dateTo || "9999-12-31");

    // Return combined result
    return (
      textSearchPassed &&
      yearPassed &&
      seasonPassed &&
      garmentPassed &&
      yearDropdownPassed &&
      seasonDropdownPassed &&
      groupPassed &&
      supplierPassed &&
      statusPassed &&
      monthPassed &&
      stylePassed &&
      imagePassed &&
      dateRangePassed
    );
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
    setSelectedYear("");
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

    // Clear localStorage for all filters
    localStorage.removeItem("inquirySearchTerm");
    localStorage.removeItem("inquirySearchYears");
    localStorage.removeItem("inquirySelectedSeasons");
    localStorage.removeItem("inquirySelectedGarments");
    localStorage.removeItem("inquirySelectedYear");
    localStorage.removeItem("inquirySelectedSeason");
    localStorage.removeItem("inquirySelectedGroup");
    localStorage.removeItem("inquirySelectedSupplier");
    localStorage.removeItem("inquirySelectedStatus");
    localStorage.removeItem("inquirySelectedMonth");
    localStorage.removeItem("inquirySelectedStyle");
    localStorage.removeItem("inquiryWithImage");
    localStorage.removeItem("inquiryDateWiseShipment");
    localStorage.removeItem("inquiryDateFrom");
    localStorage.removeItem("inquiryDateTo");

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
    pending: "linear-gradient(135deg, #ff9800, #ffb74d)",
    quoted: "linear-gradient(135deg, #2196F3, #64b5f6)",
    confirmed: "linear-gradient(135deg, #4CAF50, #81c784)",
    running: "linear-gradient(135deg, #4CAF50, #81c784)",
    default: "linear-gradient(135deg, #9E9E9E, #bdbdbd)",
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
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <h1 style={styles.headerTitle}>📝 Inquiry Management</h1>
              <p style={styles.headerSubtitle}>
                Manage and track all inquiries
              </p>
            </div>
            <div style={styles.headerActions}>
              <Link
                to="/inquiries/attachments"
                style={styles.headerButtonSecondary}
              >
                <span style={styles.buttonIcon}>📎</span>
                Attachments
              </Link>
              <Link to="/inquiries/add" style={styles.headerButtonPrimary}>
                <span style={styles.buttonIcon}>+</span>
                New Inquiry
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div style={styles.filterSection}>
          <div style={styles.filterHeader}>
            <h3 style={styles.filterTitle}>Filters</h3>
            <div style={styles.filterBadge}>{filtered.length} results</div>
          </div>

          <div style={styles.filterGrid}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Years</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
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
                placeholder="Enter style..."
              />
            </div>
          </div>

          {/* Checkbox filters */}
          <div style={styles.checkboxSection}>
            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <div style={styles.customCheckbox}>
                  <input
                    type="checkbox"
                    checked={withImage}
                    onChange={(e) => setWithImage(e.target.checked)}
                    style={styles.checkboxInput}
                  />
                  <span style={styles.checkboxBox}></span>
                </div>
                <span style={styles.checkboxText}>With Image</span>
              </label>

              <label style={styles.checkboxLabel}>
                <div style={styles.customCheckbox}>
                  <input
                    type="checkbox"
                    checked={dateWiseShipment}
                    onChange={(e) => setDateWiseShipment(e.target.checked)}
                    style={styles.checkboxInput}
                  />
                  <span style={styles.checkboxBox}></span>
                </div>
                <span style={styles.checkboxText}>Date Wise Shipment</span>
              </label>
            </div>

            <div style={styles.dateRangeGroup}>
              <div style={styles.dateInputGroup}>
                <label style={styles.dateLabel}>From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={styles.dateInput}
                />
              </div>
              <div style={styles.dateInputGroup}>
                <label style={styles.dateLabel}>To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={styles.dateInput}
                />
              </div>
            </div>
          </div>

          {/* Summary options */}
          <div style={styles.summarySection}>
            <h4 style={styles.summaryTitle}>Summary Options</h4>
            <div style={styles.summaryOptions}>
              <label style={styles.summaryOption}>
                <input
                  type="checkbox"
                  checked={showDetails}
                  onChange={(e) => setShowDetails(e.target.checked)}
                  style={styles.summaryCheckbox}
                />
                Details
              </label>
              <label style={styles.summaryOption}>
                <input
                  type="checkbox"
                  checked={showSampleStatus}
                  onChange={(e) => setShowSampleStatus(e.target.checked)}
                  style={styles.summaryCheckbox}
                />
                Sample Status
              </label>
              <label style={styles.summaryOption}>
                <input
                  type="checkbox"
                  checked={showAttachments}
                  onChange={(e) => setShowAttachments(e.target.checked)}
                  style={styles.summaryCheckbox}
                />
                Attachments
              </label>
              <label style={styles.summaryOption}>
                <input
                  type="checkbox"
                  checked={showEmailCommunications}
                  onChange={(e) => setShowEmailCommunications(e.target.checked)}
                  style={styles.summaryCheckbox}
                />
                Email Communications
              </label>
            </div>
          </div>

          {/* Search bar */}
          <div style={styles.searchSection}>
            <div style={styles.searchWrapper}>
              <div style={styles.searchIcon}>🔍</div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
                placeholder="Search inquiries by number, style, fabrication..."
              />
            </div>
            <div style={styles.searchButtons}>
              <button
                onClick={() => fetchInquiries()}
                style={styles.searchButton}
              >
                Search
              </button>
              <button onClick={clearAllFilters} style={styles.clearButton}>
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Selection banner */}
        {selectedInquiries.length > 0 && (
          <div style={styles.selectionBanner}>
            <div style={styles.selectionContent}>
              <div style={styles.selectionInfo}>
                <div style={styles.selectionBadge}>
                  {selectedInquiries.length} selected
                </div>
                <div style={styles.selectionStats}>
                  <span style={styles.statItem}>
                    Qty: {selectionTotals.totalQuantity.toLocaleString()}
                  </span>
                  <span style={styles.statItem}>
                    Value: ${selectionTotals.totalValue.toFixed(2)}
                  </span>
                </div>
              </div>
              <div style={styles.selectionActions}>
                <button onClick={openEmailModal} style={styles.emailButton}>
                  <span style={styles.emailIcon}>📧</span>
                  Send Email
                </button>
                <button
                  onClick={() => {
                    setSelectedInquiries([]);
                    setSelectedSuppliers({});
                  }}
                  style={styles.clearSelectionButton}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main table */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <div style={styles.tableTitle}>
              <span style={styles.tableTitleText}>Inquiries</span>
              <span style={styles.tableCount}>{filtered.length} items</span>
            </div>
            <div style={styles.tableActions}>
              <div style={styles.tableSummary}>
                Total Value: <strong>${totalValue.toFixed(2)}</strong>
              </div>
            </div>
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
                      style={styles.checkboxInput}
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
                      <div style={styles.loadingContent}>
                        <div style={styles.spinner}></div>
                        Loading inquiries...
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((inquiry, index) => (
                    <tr
                      key={inquiry.id}
                      style={{
                        ...styles.tr,
                        backgroundColor: index % 2 === 0 ? "#fafafa" : "white",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f5f7fa";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          index % 2 === 0 ? "#fafafa" : "white";
                      }}
                    >
                      <td style={styles.td}>
                        <label style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={isInquirySelected(inquiry.id)}
                            onChange={() => toggleSelectInquiry(inquiry.id)}
                            style={styles.checkboxInput}
                          />
                          <span style={styles.checkboxBox}></span>
                        </label>
                      </td>
                      <td style={styles.td}>
                        {getImageUrl(inquiry.image) ? (
                          <div style={styles.imageContainer}>
                            <img
                              src={getImageUrl(inquiry.image)}
                              alt="Inquiry"
                              style={styles.productImage}
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                            <div style={styles.imageFallback}>No Image</div>
                          </div>
                        ) : (
                          <div style={styles.imagePlaceholder}>
                            <div style={styles.imageIcon}>🖼️</div>
                          </div>
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
                        <div style={styles.fabricationCell}>
                          {inquiry.fabrication?.fabrication || "-"}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.quantityCell}>
                          {inquiry.order_quantity?.toLocaleString() || "-"}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.dateCell}>
                          {formatDate(inquiry.shipment_date)}
                        </div>
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
                        <div style={styles.confirmedPriceCell}>
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
                            background:
                              statusColors[inquiry.current_status] ||
                              statusColors.default,
                          }}
                        >
                          {inquiry.current_status || "pending"}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.remarksContainer}>
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
                                handleRemarks1Save(
                                  inquiry.id,
                                  inquiry.remarks1
                                );
                              }
                            }}
                            style={{
                              ...styles.remarksInput,
                              borderColor: editingRemarks[inquiry.id]
                                ? "#007bff"
                                : "#e0e0e0",
                            }}
                            placeholder="Add remarks..."
                          />
                          {editingRemarks[inquiry.id] && (
                            <div style={styles.remarksHint}>
                              Press Enter to save
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => openModal(inquiry)}
                            style={styles.actionButton}
                            title="Negotiate"
                          >
                            <span style={styles.buttonIcon}>💬</span>
                          </button>
                          <Link
                            to={`/inquiries/${inquiry.id}`}
                            style={styles.actionButton}
                            title="View"
                          >
                            <span style={styles.buttonIcon}>👁️</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(inquiry.id)}
                            style={styles.deleteButton}
                            title="Delete"
                          >
                            <span style={styles.buttonIcon}>🗑️</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="15" style={styles.emptyCell}>
                      <div style={styles.emptyContent}>
                        <div style={styles.emptyIcon}>📭</div>
                        <div style={styles.emptyText}>No inquiries found</div>
                        <div style={styles.emptySubtext}>
                          Try adjusting your search filters
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
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
                          : styles.paginationButtonNumber
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
                Page {currentPage} of {totalPages} • {filtered.length} total
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
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${
                          (emailProgress.sent / emailProgress.total) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
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
                    <div style={styles.inputWithIcon}>
                      <span style={styles.inputIcon}>✉️</span>
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
                            style={styles.checkboxInput}
                          />
                          <span style={styles.customCheckboxBox}></span>
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
                            <div style={styles.inquiryItemIcon}>📄</div>
                            <div style={styles.inquiryItemText}>
                              {inquiry.inquiry_no}
                            </div>
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
                    <div style={styles.detailImagePlaceholder}>
                      <div style={styles.detailImageIcon}>🖼️</div>
                    </div>
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
                          background:
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
                    <div style={styles.inputWithIcon}>
                      <span style={styles.inputIcon}>💰</span>
                      <input
                        type="number"
                        step="0.01"
                        value={buyerPrice}
                        onChange={(e) => setBuyerPrice(e.target.value)}
                        style={styles.formInput}
                        placeholder="Enter buyer price"
                      />
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Supplier Price ($)</label>
                    <div style={styles.inputWithIcon}>
                      <span style={styles.inputIcon}>💼</span>
                      <input
                        type="number"
                        step="0.01"
                        value={supplierPrice}
                        onChange={(e) => setSupplierPrice(e.target.value)}
                        style={styles.formInput}
                        placeholder="Enter supplier price"
                      />
                    </div>
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
                    + Add Negotiation Round
                  </button>
                </div>

                <div style={styles.negotiationSection}>
                  <div style={styles.sectionHeader}>
                    <h4 style={styles.sectionTitle}>
                      Pending Rounds ({pendingNegotiations.length})
                    </h4>
                    {pendingNegotiations.length > 0 && (
                      <div style={styles.pendingBadge}>Unsaved</div>
                    )}
                  </div>
                  <div style={styles.pendingList}>
                    {pendingNegotiations.map((negotiation, index) => (
                      <div key={negotiation.id} style={styles.pendingItem}>
                        <div style={styles.pendingHeader}>
                          <div style={styles.pendingRound}>
                            <span style={styles.roundNumber}>
                              Round {pendingNegotiations.length - index}
                            </span>
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
                              <span style={styles.priceLabel}>Buyer:</span>
                              <span style={styles.priceValue}>
                                ${negotiation.buyer_price}
                              </span>
                            </div>
                          )}
                          {negotiation.supplier_price && (
                            <div style={styles.priceTag}>
                              <span style={styles.priceLabel}>Supplier:</span>
                              <span style={styles.priceValue}>
                                ${negotiation.supplier_price}
                              </span>
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
                    style={styles.checkboxInput}
                  />
                  <span style={styles.customCheckboxBox}></span>
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
// Modern Styles with Scrollbars
// =====================
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: "hidden",
  },
  mainContent: {
    flex: 1,
    padding: "24px",
    backgroundColor: "white",
    margin: "16px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    overflow: "auto",
    maxHeight: "calc(100vh - 32px)",
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "24px",
    marginBottom: "24px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.2)",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  headerLeft: {},
  headerTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
  },
  headerSubtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    opacity: 0.9,
    fontWeight: "400",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  headerButtonSecondary: {
    background: "rgba(255,255,255,0.15)",
    color: "white",
    padding: "10px 20px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    border: "1px solid rgba(255,255,255,0.3)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    fontWeight: "500",
  },
  headerButtonPrimary: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    padding: "10px 24px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    fontWeight: "500",
    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
  },
  buttonIcon: {
    fontSize: "16px",
  },
  filterSection: {
    background: "white",
    border: "1px solid #e2e8f0",
    padding: "24px",
    marginBottom: "24px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    overflow: "hidden",
  },
  filterHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  filterTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1a202c",
    margin: 0,
  },
  filterBadge: {
    background: "#edf2f7",
    color: "#4a5568",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
    maxHeight: "120px",
    overflowY: "auto",
    paddingRight: "8px",
  },
  filterGroup: {},
  filterLabel: {
    display: "block",
    fontSize: "12px",
    color: "#718096",
    marginBottom: "6px",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  filterSelect: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "white",
    color: "#2d3748",
    transition: "all 0.2s ease",
    outline: "none",
    cursor: "pointer",
  },
  filterInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "white",
    color: "#2d3748",
    transition: "all 0.2s ease",
    outline: "none",
  },
  checkboxSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "20px 0",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "8px",
  },
  checkboxGroup: {
    display: "flex",
    gap: "24px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#4a5568",
    cursor: "pointer",
    userSelect: "none",
  },
  customCheckbox: {
    position: "relative",
    display: "inline-block",
  },
  checkboxInput: {
    position: "absolute",
    opacity: 0,
    cursor: "pointer",
  },
  checkboxBox: {
    width: "16px",
    height: "16px",
    border: "2px solid #cbd5e0",
    borderRadius: "4px",
    display: "inline-block",
    transition: "all 0.2s ease",
  },
  checkboxText: {
    fontSize: "14px",
  },
  dateRangeGroup: {
    display: "flex",
    gap: "16px",
  },
  dateInputGroup: {},
  dateLabel: {
    display: "block",
    fontSize: "12px",
    color: "#718096",
    marginBottom: "6px",
    fontWeight: "500",
  },
  dateInput: {
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    minWidth: "140px",
  },
  summarySection: {
    margin: "20px 0",
    padding: "16px",
    background: "#f0f9ff",
    borderRadius: "8px",
    border: "1px solid #bae6fd",
  },
  summaryTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0369a1",
    margin: "0 0 12px",
  },
  summaryOptions: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
  },
  summaryOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#0c4a6e",
    cursor: "pointer",
  },
  summaryCheckbox: {
    width: "14px",
    height: "14px",
    cursor: "pointer",
  },
  searchSection: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
    alignItems: "center",
  },
  searchWrapper: {
    flex: 1,
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
    color: "#a0aec0",
  },
  searchInput: {
    width: "100%",
    padding: "12px 12px 12px 40px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "white",
    color: "#2d3748",
    transition: "all 0.2s ease",
    outline: "none",
  },
  searchButtons: {
    display: "flex",
    gap: "8px",
  },
  searchButton: {
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    padding: "12px 24px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },
  clearButton: {
    background: "#f1f5f9",
    color: "#64748b",
    padding: "12px 24px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },
  selectionBanner: {
    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    border: "1px solid #93c5fd",
    padding: "16px",
    marginBottom: "20px",
    borderRadius: "8px",
  },
  selectionContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  selectionInfo: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },
  selectionBadge: {
    background: "#3b82f6",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
  selectionStats: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
  },
  statItem: {
    fontSize: "13px",
    color: "#1e40af",
    fontWeight: "500",
  },
  selectionActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  emailButton: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },
  emailIcon: {
    fontSize: "16px",
  },
  clearSelectionButton: {
    background: "#fef2f2",
    color: "#dc2626",
    padding: "10px 20px",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },
  tableContainer: {
    marginTop: "20px",
    overflow: "hidden",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    marginBottom: "16px",
    borderBottom: "2px solid #e2e8f0",
    flexWrap: "wrap",
    gap: "12px",
  },
  tableTitle: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  tableTitleText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1a202c",
  },
  tableCount: {
    background: "#edf2f7",
    color: "#4a5568",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
  },
  tableActions: {},
  tableSummary: {
    fontSize: "14px",
    color: "#4a5568",
    whiteSpace: "nowrap",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    maxHeight: "calc(100vh - 400px)",
    position: "relative",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: "1400px",
  },
  th: {
    background: "#f8fafc",
    color: "#4a5568",
    padding: "16px 12px",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  tr: {
    transition: "background-color 0.2s ease",
  },
  td: {
    padding: "16px 12px",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "left",
    fontSize: "13px",
    color: "#4a5568",
    verticalAlign: "middle",
  },
  loadingCell: {
    padding: "60px 20px",
    textAlign: "center",
  },
  loadingContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  emptyCell: {
    padding: "60px 20px",
    textAlign: "center",
  },
  emptyContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  emptyIcon: {
    fontSize: "48px",
    color: "#cbd5e0",
  },
  emptyText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#718096",
  },
  emptySubtext: {
    fontSize: "14px",
    color: "#a0aec0",
  },
  imageContainer: {
    position: "relative",
    width: "48px",
    height: "48px",
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  imageFallback: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "#f8fafc",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    color: "#a0aec0",
    border: "1px dashed #cbd5e0",
  },
  imagePlaceholder: {
    width: "48px",
    height: "48px",
    background: "#f8fafc",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px dashed #cbd5e0",
  },
  imageIcon: {
    fontSize: "20px",
    color: "#a0aec0",
  },
  inquiryNo: {
    fontWeight: "600",
    color: "#1a202c",
    fontSize: "13px",
  },
  styleCell: {
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "#4a5568",
  },
  fabricationCell: {
    color: "#4a5568",
  },
  quantityCell: {
    fontWeight: "600",
    color: "#1a202c",
  },
  dateCell: {
    color: "#4a5568",
  },
  priceCell: {
    fontWeight: "600",
    color: "#3b82f6",
  },
  confirmedPriceCell: {
    fontWeight: "600",
    color: "#10b981",
  },
  valueCell: {
    fontWeight: "700",
    color: "#8b5cf6",
  },
  supplierPrices: {
    maxWidth: "120px",
  },
  supplierPriceItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
    fontSize: "11px",
  },
  noPrices: {
    color: "#a0aec0",
    fontSize: "11px",
    fontStyle: "italic",
  },
  morePrices: {
    fontSize: "10px",
    color: "#718096",
    marginTop: "4px",
  },
  statusBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    textAlign: "center",
    minWidth: "80px",
  },
  remarksContainer: {
    position: "relative",
    minWidth: "200px",
  },
  remarksInput: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #e0e0e0",
    fontSize: "12px",
    resize: "vertical",
    minHeight: "60px",
    outline: "none",
    backgroundColor: "#fafafa",
    transition: "all 0.2s ease",
    color: "#4a5568",
  },
  remarksHint: {
    position: "absolute",
    bottom: "-18px",
    left: "0",
    fontSize: "10px",
    color: "#3b82f6",
    opacity: 0.8,
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  actionButton: {
    background: "white",
    border: "1px solid #e2e8f0",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    textDecoration: "none",
    color: "#4a5568",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
  },
  deleteButton: {
    background: "white",
    border: "1px solid #fecaca",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#dc2626",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "24px",
    gap: "12px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "8px",
    flexWrap: "wrap",
  },
  paginationButton: {
    padding: "10px 16px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    color: "#4a5568",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap",
  },
  paginationButtonNumber: {
    padding: "10px 14px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    color: "#4a5568",
    transition: "all 0.2s ease",
    minWidth: "40px",
  },
  paginationButtonActive: {
    padding: "10px 14px",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    minWidth: "40px",
    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
  },
  pageNumbers: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  paginationInfo: {
    fontSize: "13px",
    color: "#718096",
    marginLeft: "16px",
    whiteSpace: "nowrap",
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
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "white",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
  },
  negotiationModal: {
    background: "white",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "800px",
    maxHeight: "90vh",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    padding: "24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    flexShrink: 0,
  },
  modalTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#1a202c",
    fontWeight: "600",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#718096",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    transition: "all 0.2s ease",
  },
  modalContent: {
    padding: "24px",
    overflow: "auto",
    flex: 1,
  },
  modalFooter: {
    padding: "20px 24px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f8fafc",
    flexShrink: 0,
  },
  progressSection: {
    padding: "40px 20px",
    textAlign: "center",
  },
  progressBar: {
    width: "100%",
    height: "8px",
    background: "#e2e8f0",
    borderRadius: "4px",
    overflow: "hidden",
    marginBottom: "16px",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
  progressText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a202c",
    marginBottom: "8px",
  },
  currentTask: {
    fontSize: "14px",
    color: "#718096",
  },
  formGroup: {
    marginBottom: "20px",
  },
  formLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
  },
  formLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  inputWithIcon: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
    color: "#9ca3af",
  },
  formInput: {
    width: "100%",
    padding: "12px 12px 12px 40px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "white",
    color: "#374151",
    transition: "all 0.2s ease",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "white",
    color: "#374151",
    transition: "all 0.2s ease",
    outline: "none",
    resize: "vertical",
    minHeight: "100px",
  },
  selectAllButton: {
    background: "transparent",
    color: "#3b82f6",
    border: "1px solid #3b82f6",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },
  suppliersList: {
    maxHeight: "200px",
    overflowY: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "#fafafa",
    padding: "8px",
  },
  supplierItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    borderBottom: "1px solid #f0f0f0",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  customCheckboxBox: {
    width: "16px",
    height: "16px",
    border: "2px solid #cbd5e0",
    borderRadius: "4px",
    display: "inline-block",
    marginRight: "10px",
    transition: "all 0.2s ease",
    flexShrink: 0,
  },
  supplierInfo: {
    marginLeft: "10px",
    overflow: "hidden",
  },
  supplierName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  supplierEmail: {
    fontSize: "12px",
    color: "#9ca3af",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  inquiriesList: {
    maxHeight: "120px",
    overflowY: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "12px",
    background: "#fafafa",
  },
  inquiryItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 0",
    fontSize: "13px",
    color: "#374151",
  },
  inquiryItemIcon: {
    fontSize: "14px",
    color: "#9ca3af",
    flexShrink: 0,
  },
  inquiryItemText: {
    fontWeight: "500",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  secondaryButton: {
    background: "#f3f4f6",
    color: "#374151",
    padding: "12px 24px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    padding: "12px 24px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
    whiteSpace: "nowrap",
  },
  inquiryDetails: {
    display: "flex",
    gap: "24px",
    marginBottom: "24px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "12px",
    flexWrap: "wrap",
  },
  inquiryImage: {
    flexShrink: 0,
  },
  detailImage: {
    width: "100px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  detailImagePlaceholder: {
    width: "100px",
    height: "100px",
    background: "#f1f5f9",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    fontSize: "12px",
    border: "2px dashed #cbd5e0",
  },
  detailImageIcon: {
    fontSize: "32px",
    color: "#94a3b8",
  },
  inquiryInfo: {
    flex: 1,
    minWidth: "300px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "16px",
  },
  infoItem: {},
  infoLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },
  negotiationSections: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  negotiationSection: {
    padding: "20px",
    background: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a202c",
    margin: "0 0 20px",
    flexShrink: 0,
  },
  pendingBadge: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    flexShrink: 0,
  },
  inputGroup: {
    marginBottom: "16px",
    flexShrink: 0,
  },
  inputLabel: {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    color: "#4b5563",
    fontWeight: "500",
  },
  addButton: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s ease",
    marginTop: "8px",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  pendingList: {
    maxHeight: "200px",
    overflowY: "auto",
    flex: 1,
  },
  pendingItem: {
    padding: "16px",
    background: "#fffbeb",
    borderRadius: "8px",
    border: "1px solid #fde68a",
    marginBottom: "12px",
  },
  pendingHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  pendingRound: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  roundNumber: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#92400e",
  },
  pendingStatus: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
  },
  removeButton: {
    background: "transparent",
    border: "none",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "16px",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    transition: "all 0.2s ease",
    flexShrink: 0,
  },
  pendingPrices: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  priceTag: {
    background: "white",
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#374151",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid #e5e7eb",
  },
  priceLabel: {
    color: "#6b7280",
  },
  priceValue: {
    fontWeight: "600",
    color: "#059669",
  },
  pendingComment: {
    padding: "12px",
    background: "#fef3c7",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#92400e",
    borderLeft: "3px solid #f59e0b",
    wordBreak: "break-word",
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
};

// Add CSS animation and custom scrollbar styles
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(
  `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`,
  styleSheet.cssRules.length
);

// Custom scrollbar styles
styleSheet.insertRule(
  `
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
`,
  styleSheet.cssRules.length
);

styleSheet.insertRule(
  `
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
`,
  styleSheet.cssRules.length
);

styleSheet.insertRule(
  `
  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
`,
  styleSheet.cssRules.length
);

styleSheet.insertRule(
  `
  ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`,
  styleSheet.cssRules.length
);

// For Firefox
styleSheet.insertRule(
  `
  * {
    scrollbar-width: thin;
    scrollbar-color: #c1c1c1 #f1f1f1;
  }
`,
  styleSheet.cssRules.length
);

export default Inquiry;
