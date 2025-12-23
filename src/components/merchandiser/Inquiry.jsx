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

  // Store initial filter values to detect actual changes
  const initialSearchTerm = React.useRef(searchTerm);
  const initialSearchYears = React.useRef(searchYears);
  const initialSelectedSeasons = React.useRef(selectedSeasons);
  const initialSelectedGarments = React.useRef(selectedGarments);

  // 2. Then, save search filters to localStorage
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
    console.log("Saved currentPage to localStorage:", currentPage);
  }, [currentPage]);

  // Fetch inquiries and suppliers on mount
  useEffect(() => {
    fetchInquiries();
    fetchSuppliers();
  }, []);

  // 5. Reset currentPage to 1 only when search filters actually change
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
      console.log("Search filters changed, resetting currentPage to 1", {
        searchTerm,
        searchYears,
        selectedSeasons,
        selectedGarments,
        searchTermChanged,
        searchYearsChanged,
        seasonsChanged,
        garmentsChanged,
      });

      // Update initial values after detecting a change
      initialSearchTerm.current = searchTerm;
      initialSearchYears.current = searchYears;
      initialSelectedSeasons.current = selectedSeasons;
      initialSelectedGarments.current = selectedGarments;
    }
  }, [searchTerm, searchYears, selectedSeasons, selectedGarments]);

  // 6. Now define filtered after all states are initialized
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
            console.log("Search term match for inquiry", i.inquiry_no, ":", {
              term,
              inquiryNoMatch,
              orderTypeMatch,
              garmentMatch,
              fabricationMatch,
              styleMatch,
              sameStyle: i.same_style,
            });
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

    const filterResult =
      textSearchPassed && yearPassed && seasonPassed && garmentPassed;
    console.log("Filter result for inquiry", i.inquiry_no, ":", {
      textSearchPassed,
      yearPassed,
      seasonPassed,
      garmentPassed,
      filterResult,
    });
    return filterResult;
  });

  // Adjust currentPage if it exceeds totalPages after inquiries are loaded
  // 7. Adjust currentPage if it exceeds totalPages after inquiries are loaded
  useEffect(() => {
    if (inquiries.length > 0) {
      const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
        localStorage.setItem("inquiryCurrentPage", totalPages.toString());
        console.log(
          `Adjusted currentPage to ${totalPages} because it exceeded totalPages`
        );
      }
    }
  }, [filtered.length, itemsPerPage, currentPage, inquiries.length]);

  useEffect(() => {
    fetchInquiries();
    fetchSuppliers();
  }, []);

  // 8. Clear filters function
  const clearAllFilters = () => {
    setSearchTerm("");
    setSearchYears("");
    setSelectedSeasons([]);
    setSelectedGarments([]);
    // Also clear from localStorage
    localStorage.removeItem("inquirySearchTerm");
    localStorage.removeItem("inquirySearchYears");
    localStorage.removeItem("inquirySelectedSeasons");
    localStorage.removeItem("inquirySelectedGarments");
    setCurrentPage(1);

    console.log("All filters cleared");
  };

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
      console.log("Search filters changed, resetting currentPage to 1");

      // Update initial values after detecting a change
      initialSearchTerm.current = searchTerm;
      initialSearchYears.current = searchYears;
      initialSelectedSeasons.current = selectedSeasons;
      initialSelectedGarments.current = selectedGarments;
    }
  }, [searchTerm, searchYears, selectedSeasons, selectedGarments]);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get("/supplier/");
      setAvailableSuppliers(response.data);
      console.log("Fetched suppliers:", response.data);
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
      console.log(`Updated remarks1 for inquiry ${inquiryId}: ${remarks1}`);
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
            error: "Inquiry not found in local state",
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
                error: "No valid supplier email found",
              });
              emailCount++;
              continue;
            }

            const payload = {
              from_email: emailData.from_email,
              custom_message: emailData.custom_message || "",
              supplier_email: supplier.email,
            };

            console.log(
              "Sending email for inquiry:",
              inquiryId,
              "to supplier:",
              supplier.name,
              "email:",
              supplier.email
            );

            const response = await api.post(
              `/inquiries/${inquiryId}/send-email/`,
              payload
            );

            if (response.data.success) {
              results.success++;
              console.log("Email sent successfully:", response.data);
            } else {
              results.failed++;
              results.errors.push({
                inquiry: inquiry.inquiry_no || `ID: ${inquiryId}`,
                supplier: supplier.name,
                error: response.data.message || "Unknown error",
              });
            }
          } catch (error) {
            console.error(
              "Email sending error for inquiry",
              inquiryId,
              "supplier",
              supplier?.name || supplierId,
              ":",
              error
            );
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
      alert(
        `Failed to send bulk emails: ${
          error.message || "Unknown error"
        }. Please check the console for details.`
      );
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
    console.log("Opening modal for inquiry:", inquiry);
    try {
      const response = await api.get(`/inquiry/${inquiry.id}/`);
      console.log("Fetched inquiry data:", response.data);
      if (!response.data.email_logs) {
        console.warn("No email_logs field in API response");
      }
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
      alert(
        "Failed to load inquiry details. Please check the console for details."
      );
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

        try {
          await api.post(`/negotiation/`, payload);
        } catch (negotiationError) {
          let errorMessage = "Failed to save negotiation";
          if (negotiationError.response && negotiationError.response.data) {
            if (negotiationError.response.data.error) {
              errorMessage = negotiationError.response.data.error;
            } else if (negotiationError.response.data.detail) {
              errorMessage = negotiationError.response.data.detail;
            } else if (negotiationError.response.status === 403) {
              errorMessage =
                "Authentication failed. Please ensure you are logged in and have proper permissions.";
            }
          }
          throw new Error(errorMessage);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (updateStatusToConfirmed) {
        try {
          const updatePayload = {
            current_status: "confirmed",
          };
          await api.patch(`/inquiry/${selectedInquiry.id}/`, updatePayload);
        } catch (statusError) {
          let statusErrorMessage =
            "Negotiations saved but status update failed: ";
          if (statusError.response?.data?.detail) {
            statusErrorMessage += statusError.response.data.detail;
          } else {
            statusErrorMessage += statusError.message;
          }
          alert(statusErrorMessage);
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
      const successMessage =
        `${pendingNegotiations.length} negotiation round(s) saved successfully!` +
        (updateStatusToConfirmed ? " Status updated to confirmed." : "");
      alert(successMessage);
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
      console.log("Fetched inquiries:", res.data);

      const inquiriesWithProcessedPrices = res.data.map((inquiry) => ({
        ...inquiry,
        supplier_prices: (inquiry.supplier_prices || []).filter(
          (item) => item.price !== null && item.price !== undefined
        ),
      }));

      console.log("Processed inquiries:", inquiriesWithProcessedPrices);
      setInquiries(inquiriesWithProcessedPrices);
    } catch (err) {
      console.error("fetchInquiries error:", err);
      alert("Failed to fetch inquiries. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  const renderSupplierPrices = (inquiry) => {
    console.log(
      `Rendering supplier prices for inquiry ${inquiry.id}:`,
      inquiry.supplier_prices
    );

    const prices = (inquiry.supplier_prices || [])
      .filter((item) => item.price !== null && item.price !== undefined)
      .sort((a, b) => a.price - b.price); // Sort prices in ascending order

    console.log(`Sorted supplier prices for inquiry ${inquiry.id}:`, prices);

    if (prices.length === 0) {
      return (
        <div
          style={{ color: "#999", fontStyle: "italic", fontSize: "0.75rem" }}
        >
          No prices
        </div>
      );
    }

    return (
      <div style={{ maxWidth: "200px" }}>
        {prices.slice(0, 3).map((priceItem, index) => (
          <div
            key={priceItem.id || index}
            style={{
              marginBottom: "2px",
              padding: "2px 4px",
              backgroundColor: index % 2 === 0 ? "#f5f5f5" : "transparent",
              borderRadius: "2px",
              fontSize: "0.75rem",
            }}
          >
            <span style={{ fontWeight: "bold" }}>
              {priceItem.supplier_name || "Unknown Supplier"}:
            </span>{" "}
            $
            {priceItem.price !== null && priceItem.price !== undefined
              ? priceItem.price
              : "N/A"}
          </div>
        ))}
        {prices.length > 3 && (
          <div style={{ fontSize: "0.7rem", color: "#666", marginTop: "2px" }}>
            +{prices.length - 3} more...
          </div>
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
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Recent";
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString();
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

  const responsiveStyles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#A7D5E1",
    },
    mainContent: {
      padding: "1.5rem",
      flex: 1,
      boxSizing: "border-box",
      overflowY: "auto",
      width: "100%",
    },
    responsiveFlex: {
      display: "flex",
      flexWrap: "wrap",
      gap: "15px",
      alignItems: "flex-end",
      marginBottom: "20px",
    },
    responsiveColumn: {
      flex: "1 1 300px",
      minWidth: "250px",
    },
  };

  console.log("Render state:", {
    filteredLength: filtered.length,
    currentPage,
    currentItemsLength: currentItems.length,
    totalPages,
  });

  return (
    <div style={responsiveStyles.container}>
      <Sidebar />
      <div style={responsiveStyles.mainContent}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <div style={responsiveStyles.responsiveFlex}>
            <div style={responsiveStyles.responsiveColumn}>
              <h1 style={{ fontSize: "1.625rem", margin: 0 }}>
                📝 Inquiry List
              </h1>
            </div>
            <div
              style={{
                ...responsiveStyles.responsiveColumn,
                display: "flex",
                gap: "0.625rem",
                flexWrap: "wrap",
              }}
            >
              <Link to="/inquiries/attachments" style={buttonStyleBlue}>
                📎 All Attachments
              </Link>
              <Link to="/inquiries/add" style={buttonStyleGreen}>
                ➕ Add New Inquiry
              </Link>
            </div>
          </div>

          {selectedInquiries.length > 0 && (
            <div
              style={{
                background: "linear-gradient(90deg, #1976D2, #1565C0)",
                color: "white",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                marginBottom: "1.125rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.625rem",
              }}
            >
              <div style={{ fontWeight: 600 }}>
                📧 {selectedInquiries.length} inquiry(s) selected
              </div>
              <div
                style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}
              >
                <button
                  onClick={openEmailModal}
                  style={{
                    background: "#4CAF50",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  📤 Send Email to Suppliers
                </button>
                <button
                  onClick={() => {
                    setSelectedInquiries([]);
                    setSelectedSuppliers({});
                  }}
                  style={{
                    background: "transparent",
                    color: "white",
                    border: "1px solid white",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  ✕ Clear Selection
                </button>
              </div>
            </div>
          )}

          <div style={{ marginBottom: "1.125rem" }}>
            <div style={responsiveStyles.responsiveFlex}>
              <div style={responsiveStyles.responsiveColumn}>
                <input
                  placeholder="🔍 Search by Inquiry No or Style ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    ...searchInputStyle,
                    width: "100%",
                    maxWidth: "300px",
                  }}
                />
              </div>

              <div style={responsiveStyles.responsiveColumn}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#666",
                    marginTop: "0.25rem",
                  }}
                >
                  Separate years with spaces
                </div>
                <input
                  placeholder="📅 Years (space separated: 2024 2025) ..."
                  value={searchYears}
                  onChange={(e) => setSearchYears(e.target.value)}
                  style={{
                    ...searchInputStyle,
                    width: "100%",
                    maxWidth: "250px",
                  }}
                />
              </div>

              <div style={responsiveStyles.responsiveColumn}>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      ...searchInputStyle,
                      width: "100%",
                      maxWidth: "200px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                  >
                    <span>
                      {selectedSeasons.length === 0
                        ? "All Seasons"
                        : `${selectedSeasons.length} selected`}
                    </span>
                    <span>▼</span>
                  </div>

                  {showSeasonDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "white",
                        border: "1px solid #ddd",
                        borderRadius: "0.375rem",
                        zIndex: 1000,
                        maxHeight: "200px",
                        overflowY: "auto",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      {["spring", "summer", "autumn", "winter"].map(
                        (season) => (
                          <div
                            key={season}
                            style={{
                              padding: "0.5rem",
                              cursor: "pointer",
                              backgroundColor: selectedSeasons.includes(season)
                                ? "#e3f2fd"
                                : "white",
                              borderBottom: "1px solid #f0f0f0",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                            onClick={() => {
                              if (selectedSeasons.includes(season)) {
                                setSelectedSeasons((prev) =>
                                  prev.filter((s) => s !== season)
                                );
                              } else {
                                setSelectedSeasons((prev) => [...prev, season]);
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSeasons.includes(season)}
                              onChange={() => {}}
                              style={{ margin: 0 }}
                            />
                            <span style={{ textTransform: "capitalize" }}>
                              {season}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={responsiveStyles.responsiveColumn}>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      ...searchInputStyle,
                      width: "100%",
                      maxWidth: "200px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    onClick={() => setShowGarmentDropdown(!showGarmentDropdown)}
                  >
                    <span>
                      {selectedGarments.length === 0
                        ? "All Garments"
                        : `${selectedGarments.length} selected`}
                    </span>
                    <span>▼</span>
                  </div>

                  {showGarmentDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "white",
                        border: "1px solid #ddd",
                        borderRadius: "0.375rem",
                        zIndex: 1000,
                        maxHeight: "200px",
                        overflowY: "auto",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      {["all", "knit", "woven", "sweater", "underwear"].map(
                        (garment) => (
                          <div
                            key={garment}
                            style={{
                              padding: "0.5rem",
                              cursor: "pointer",
                              backgroundColor: selectedGarments.includes(
                                garment
                              )
                                ? "#e3f2fd"
                                : "white",
                              borderBottom: "1px solid #f0f0f0",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                            onClick={() => {
                              if (selectedGarments.includes(garment)) {
                                setSelectedGarments((prev) =>
                                  prev.filter((g) => g !== garment)
                                );
                              } else {
                                setSelectedGarments((prev) => [
                                  ...prev,
                                  garment,
                                ]);
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedGarments.includes(garment)}
                              onChange={() => {}}
                              style={{ margin: 0 }}
                            />
                            <span style={{ textTransform: "capitalize" }}>
                              {garment}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr
                  style={{
                    background: "#f3f6f9",
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                  }}
                >
                  <th
                    style={{
                      ...cellStyle,
                      width: "2.5rem",
                      textAlign: "center",
                      position: "sticky",
                      top: 0,
                      background: "#f3f6f9",
                      zIndex: 101,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedInquiries.length > 0 &&
                        selectedInquiries.length === currentItems.length
                      }
                      onChange={toggleSelectAll}
                      style={{
                        width: "1rem",
                        height: "1rem",
                        cursor: "pointer",
                      }}
                    />
                  </th>
                  <th
                    style={{
                      ...cellStyle,
                      textAlign: "center",
                      fontWeight: 600,
                      width: "5rem",
                      position: "sticky",
                      top: 0,
                      background: "#f3f6f9",
                      zIndex: 101,
                    }}
                  >
                    Image
                  </th>
                  {[
                    "Inquiry No",
                    "Style Name",
                    "Fabrication",
                    "Order Qty",
                    "Shipment Date",
                    "Target Price",
                    "Offer Price",
                    "Confirmed Price",
                    "Value",
                    "Supplier Prices",
                    "Status",
                    "Remarks",
                    "Actions",
                  ].map((t, idx) => (
                    <th
                      key={idx}
                      style={{
                        ...cellStyle,
                        textAlign: "center",
                        fontWeight: 600,
                        minWidth:
                          idx === 11 ? "15rem" : idx === 10 ? "1rem" : "auto",
                        position: "sticky",
                        top: 0,
                        background: "#f3f6f9",
                        zIndex: 101,
                      }}
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="13"
                      style={{ ...cellStyle, textAlign: "center" }}
                    >
                      Loading inquiries...
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((inquiry) => (
                    <tr
                      key={inquiry.id}
                      style={{
                        borderBottom: "1px solid #eee",
                        background: isInquirySelected(inquiry.id)
                          ? "#e3f2fd"
                          : "transparent",
                      }}
                    >
                      <td style={{ ...cellStyle, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isInquirySelected(inquiry.id)}
                          onChange={() => toggleSelectInquiry(inquiry.id)}
                          style={{
                            width: "1rem",
                            height: "1rem",
                            cursor: "pointer",
                          }}
                        />
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          padding: "0.25rem",
                        }}
                      >
                        {getImageUrl(inquiry.image) ? (
                          <img
                            src={getImageUrl(inquiry.image)}
                            alt="Inquiry"
                            style={{
                              width: "3rem",
                              height: "3rem",
                              objectFit: "cover",
                              borderRadius: "0.25rem",
                              border: "1px solid #ddd",
                              cursor: "pointer",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "3rem",
                              height: "3rem",
                              background: "#f5f5f5",
                              borderRadius: "0.25rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#999",
                              fontSize: "0.625rem",
                              border: "1px dashed #ddd",
                            }}
                          >
                            No Image
                          </div>
                        )}
                      </td>
                      <td style={cellStyle}>{inquiry.inquiry_no || "-"}</td>
                      <td style={cellStyle}>
                        <div
                          title={
                            inquiry.same_style
                              ? JSON.stringify(inquiry.same_style)
                              : "No style data"
                          }
                          style={{
                            cursor: inquiry.same_style ? "help" : "default",
                          }}
                        >
                          {inquiry.same_style && inquiry.same_style.styles ? (
                            inquiry.same_style.styles
                          ) : (
                            <span
                              style={{ color: "#d32f2f", fontStyle: "italic" }}
                            >
                              No Style
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        {inquiry.fabrication?.fabrication || "-"}
                      </td>
                      <td style={cellStyle}>{inquiry.order_quantity || "-"}</td>
                      <td style={cellStyle}>
                        {formatDate(inquiry.shipment_date)}
                      </td>
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600, color: "#1976D2" }}>
                          ${inquiry.target_price || "-"}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600, color: "#FF9800" }}>
                          ${inquiry.offer_price || "-"}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600, color: "#4CAF50" }}>
                          ${inquiry.confirmed_price || "-"}
                        </div>
                      </td>
                      {/* Add this new Value cell */}
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600, color: "#9C27B0" }}>
                          ${inquiry.value || "-"}
                        </div>
                      </td>
                      <td style={cellStyle}>{renderSupplierPrices(inquiry)}</td>
                      <td style={{ ...cellStyle, textAlign: "center" }}>
                        <span
                          style={{
                            padding: "0.375rem 0.75rem",
                            borderRadius: "1.125rem",
                            color: "#fff",
                            backgroundColor:
                              statusColors[inquiry.current_status] ||
                              statusColors.default,
                            textTransform: "capitalize",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            display: "inline-block",
                            minWidth: "80px",
                          }}
                        >
                          {inquiry.current_status || "pending"}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <textarea
                          rows={3}
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
                            ...inputStyle,
                            width: "100%",
                            minHeight: "3.75rem",
                            padding: "0.375rem 0.5rem",
                            fontSize: "0.8125rem",
                            border: editingRemarks[inquiry.id]
                              ? "1px solid #1976D2"
                              : "1px solid #ddd",
                            resize: "vertical",
                            boxSizing: "border-box",
                          }}
                          placeholder="Enter remarks..."
                        />
                      </td>
                      <td style={{ ...cellStyle, textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                            alignItems: "center",
                          }}
                        >
                          <button
                            onClick={() => openModal(inquiry)}
                            style={linkButtonStyle}
                          >
                            💬 Negotiate
                          </button>
                          <Link
                            to={`/inquiries/${inquiry.id}`}
                            style={linkStyle}
                          >
                            🔍 View
                          </Link>
                          <button
                            onClick={() => handleDelete(inquiry.id)}
                            style={deleteButtonStyle}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="13"
                      style={{
                        ...cellStyle,
                        textAlign: "center",
                        color: "#777",
                      }}
                    >
                      No inquiries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination and Summary Section */}
          {filtered.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "15px",
                flexWrap: "wrap",
                gap: "1rem",
                padding: "0.5rem 0",
              }}
            >
              {/* Pagination Section */}
              <div style={styles.pagination}>
                <button
                  onClick={() => {
                    const newPage = Math.max(currentPage - 1, 1);
                    setCurrentPage(newPage);
                    console.log("Navigated to Previous page:", newPage);
                  }}
                  disabled={currentPage === 1}
                  style={pagerBtn}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setCurrentPage(n);
                        console.log(
                          "Navigated to page:",
                          n,
                          "Filtered inquiries:",
                          filtered.length
                        );
                      }}
                      style={n === currentPage ? activePagerBtn : pagerBtn}
                    >
                      {n}
                    </button>
                  )
                )}
                <button
                  onClick={() => {
                    const newPage = Math.min(currentPage + 1, totalPages);
                    setCurrentPage(newPage);
                    console.log("Navigated to Next page:", newPage);
                  }}
                  disabled={currentPage === totalPages}
                  style={pagerBtn}
                >
                  Next
                </button>
                <div
                  style={{
                    marginLeft: "1rem",
                    fontSize: "0.875rem",
                    color: "#666",
                  }}
                >
                  Page {currentPage} of {totalPages} | Total Inquiries:{" "}
                  {filtered.length}
                </div>
              </div>

              {/* Selection Summary - Right Side */}
              {selectedInquiries.length > 0 && (
                <div
                  style={{
                    background: "linear-gradient(90deg, #4CAF50, #45a049)",
                    color: "white",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    minWidth: "280px",
                  }}
                >
                  <span>📊 Selection:</span>
                  <span>{selectedInquiries.length} items</span>
                  <span>|</span>
                  <span>
                    📦{" "}
                    {selectedInquiries
                      .reduce((total, inquiryId) => {
                        const inquiry = inquiries.find(
                          (inq) => inq.id === inquiryId
                        );
                        return total + (inquiry?.order_quantity || 0);
                      }, 0)
                      .toLocaleString()}{" "}
                    pcs
                  </span>
                  <span>|</span>
                  <span>
                    💰 $
                    {selectedInquiries
                      .reduce((total, inquiryId) => {
                        const inquiry = inquiries.find(
                          (inq) => inq.id === inquiryId
                        );
                        // Calculate value: order_quantity × (confirmed_price OR target_price)
                        const quantity = inquiry?.order_quantity || 0;
                        const price =
                          inquiry?.confirmed_price ||
                          inquiry?.target_price ||
                          0;
                        return total + quantity * price;
                      }, 0)
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </span>
                </div>
              )}
            </div>
          )}

          {showEmailModal && (
            <div style={modalOverlayStyle}>
              <div
                style={{
                  ...emailModalStyle,
                  width: "min(90vw, 50rem)",
                  maxWidth: "90vw",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.25rem",
                  }}
                >
                  <h3
                    style={{ margin: 0, color: "#1976D2", fontSize: "1.25rem" }}
                  >
                    📧 Send Bulk Email to Suppliers
                  </h3>
                  <button onClick={closeEmailModal} style={closeBtnStyle}>
                    ✕
                  </button>
                </div>

                {sendingEmail && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div
                      style={{
                        background: "#e3f2fd",
                        padding: "1rem",
                        borderRadius: "0.375rem",
                      }}
                    >
                      <div style={{ marginBottom: "0.5rem", fontWeight: 600 }}>
                        Progress: {emailProgress.sent} / {emailProgress.total}{" "}
                        emails sent
                      </div>
                      {emailProgress.currentInquiry && (
                        <div style={{ color: "#666" }}>
                          Currently sending:{" "}
                          {emailProgress.currentInquiry.inquiry_no}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!sendingEmail && (
                  <>
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={labelStyle}>Your Email Address *</label>
                      <input
                        type="email"
                        value={emailData.from_email}
                        onChange={(e) =>
                          setEmailData((prev) => ({
                            ...prev,
                            from_email: e.target.value,
                          }))
                        }
                        style={inputStyle}
                        placeholder="your.email@company.com"
                      />
                    </div>

                    <div style={{ marginBottom: "1.25rem" }}>
                      <label style={labelStyle}>
                        Custom Message (Optional)
                      </label>
                      <textarea
                        rows={4}
                        value={emailData.custom_message}
                        onChange={(e) =>
                          setEmailData((prev) => ({
                            ...prev,
                            custom_message: e.target.value,
                          }))
                        }
                        style={{ ...inputStyle, minHeight: "6.25rem" }}
                        placeholder="Enter a custom message for all suppliers. Leave empty to use the default message."
                      />
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#666",
                          marginTop: "0.25rem",
                        }}
                      >
                        If left empty, a default message with inquiry details
                        will be used.
                      </div>
                    </div>

                    <div style={{ marginBottom: "1.25rem" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <label style={labelStyle}>
                          Select Suppliers to Email *
                        </label>
                        <button
                          onClick={toggleSelectAllSuppliers}
                          style={{
                            background: "transparent",
                            border: "1px solid #1976D2",
                            color: "#1976D2",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                          }}
                        >
                          {availableSuppliers.length > 0 &&
                          availableSuppliers.every(
                            (supplier) => selectedSuppliers[supplier.id]
                          )
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      </div>
                      <div
                        style={{
                          maxHeight: "12.5rem",
                          overflowY: "auto",
                          border: "1px solid #ddd",
                          borderRadius: "0.375rem",
                          padding: "0.75rem",
                          background: "#f9f9f9",
                        }}
                      >
                        {availableSuppliers.length > 0 ? (
                          availableSuppliers.map((supplier) => (
                            <div
                              key={supplier.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "0.5rem 0.25rem",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              <input
                                type="checkbox"
                                id={`supplier-${supplier.id}`}
                                checked={!!selectedSuppliers[supplier.id]}
                                onChange={() =>
                                  toggleSupplierSelection(supplier.id)
                                }
                                style={{ marginRight: "0.5rem" }}
                              />
                              <label
                                htmlFor={`supplier-${supplier.id}`}
                                style={{ flex: 1, cursor: "pointer" }}
                              >
                                <div style={{ fontWeight: 600 }}>
                                  {supplier.name}
                                </div>
                                <div
                                  style={{ fontSize: "0.75rem", color: "#666" }}
                                >
                                  {supplier.email || "No email"}
                                </div>
                              </label>
                            </div>
                          ))
                        ) : (
                          <div
                            style={{
                              textAlign: "center",
                              color: "#666",
                              padding: "1.25rem",
                            }}
                          >
                            No suppliers available. Please add suppliers first.
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#666",
                          marginTop: "0.25rem",
                        }}
                      >
                        Selected: {getSelectedSupplierIds().length} supplier(s)
                        - {getSelectedSupplierNames()}
                      </div>
                    </div>

                    <div style={{ marginBottom: "1.25rem" }}>
                      <label style={labelStyle}>
                        Selected Inquiries ({selectedInquiries.length}):
                      </label>
                      <div
                        style={{
                          maxHeight: "9.375rem",
                          overflowY: "auto",
                          border: "1px solid #ddd",
                          borderRadius: "0.375rem",
                          padding: "0.75rem",
                          background: "#f9f9f9",
                        }}
                      >
                        {selectedInquiries.map((id) => {
                          const inquiry = inquiries.find(
                            (inq) => inq.id === id
                          );
                          return inquiry ? (
                            <div
                              key={id}
                              style={{
                                padding: "0.25rem 0",
                                borderBottom: "1px solid #eee",
                                fontSize: "0.8125rem",
                              }}
                            >
                              • {inquiry.inquiry_no}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                  }}
                >
                  <button
                    onClick={closeEmailModal}
                    style={secondaryBtn}
                    disabled={sendingEmail}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendBulkEmails}
                    style={{
                      ...primaryBtn,
                      background: sendingEmail ? "#ccc" : "#4CAF50",
                      minWidth: "12.5rem",
                    }}
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

          {showModal && selectedInquiry && (
            <div style={modalOverlayStyle}>
              <div
                style={{
                  ...modalStyle,
                  width: "min(90vw, 68.75rem)",
                  maxWidth: "90vw",
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
                    style={{ margin: 0, color: "#1976D2", fontSize: "1.25rem" }}
                  >
                    💬 Negotiation — Inquiry #{selectedInquiry.inquiry_no}
                  </h3>
                  <button onClick={closeModal} style={closeBtnStyle}>
                    ✕
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: "1.25rem",
                    marginBottom: "1.25rem",
                    padding: "1rem",
                    background: "#f8f9fa",
                    borderRadius: "0.5rem",
                  }}
                >
                  <div>
                    {getImageUrl(selectedInquiry.image) ? (
                      <img
                        src={getImageUrl(selectedInquiry.image)}
                        alt="Inquiry"
                        style={{
                          width: "7.5rem",
                          height: "7.5rem",
                          objectFit: "cover",
                          borderRadius: "0.5rem",
                          border: "2px solid #ddd",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        width: "7.5rem",
                        height: "7.5rem",
                        background: "#e9ecef",
                        borderRadius: "0.5rem",
                        display: getImageUrl(selectedInquiry.image)
                          ? "none"
                          : "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#6c757d",
                        fontSize: "0.75rem",
                      }}
                    >
                      No Image
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(10rem, 1fr))",
                        gap: "0.9375rem",
                      }}
                    >
                      <div>
                        <strong style={detailLabelStyle}>
                          Order Quantity:
                        </strong>
                        <span style={detailValueStyle}>
                          {selectedInquiry.order_quantity || "0"}
                        </span>
                      </div>
                      <div>
                        <strong style={detailLabelStyle}>Customer:</strong>
                        <span style={detailValueStyle}>
                          {getCustomerName(selectedInquiry.customer)}
                        </span>
                      </div>
                      <div>
                        <strong style={detailLabelStyle}>Supplier:</strong>
                        <span style={detailValueStyle}>
                          {selectedInquiry.supplier_name ||
                            selectedInquiry.supplier?.name ||
                            "No Supplier"}
                        </span>
                      </div>
                      <div>
                        <strong style={detailLabelStyle}>
                          Current Target Price:
                        </strong>
                        <span style={{ ...detailValueStyle, color: "#1976D2" }}>
                          ${selectedInquiry.target_price || "0"}
                        </span>
                      </div>
                      <div>
                        <strong style={detailLabelStyle}>
                          Current Confirmed Price:
                        </strong>
                        <span style={{ ...detailValueStyle, color: "#4CAF50" }}>
                          ${selectedInquiry.confirmed_price || "0"}
                        </span>
                      </div>
                      <div>
                        <strong style={detailLabelStyle}>Garment Type:</strong>
                        <span style={detailValueStyle}>
                          {selectedInquiry.garment || "-"}
                        </span>
                      </div>
                      <div>
                        <strong style={detailLabelStyle}>Fabrication:</strong>
                        <span style={detailValueStyle}>
                          {selectedInquiry.fabrication?.fabrication || "-"}
                        </span>
                      </div>
                      <div>
                        <strong style={detailLabelStyle}>Status:</strong>
                        <span
                          style={{
                            ...detailValueStyle,
                            color: "#fff",
                            backgroundColor:
                              statusColors[selectedInquiry.current_status] ||
                              statusColors.default,
                            padding: "0.125rem 0.5rem",
                            borderRadius: "0.75rem",
                            fontSize: "0.75rem",
                          }}
                        >
                          {selectedInquiry.current_status || "pending"}
                        </span>
                      </div>
                      <div>
                        <strong style={detailLabelStyle}>Order Type:</strong>
                        <span style={detailValueStyle}>
                          {selectedInquiry.order_type || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <h4
                      style={{ margin: 0, color: "#1976D2", fontSize: "1rem" }}
                    >
                      📧 Suppliers Emailed
                    </h4>
                    <button
                      onClick={() =>
                        setShowSuppliersEmailed(!showSuppliersEmailed)
                      }
                      style={{
                        background: showSuppliersEmailed
                          ? "#2196F3"
                          : "#f3f3f3",
                        color: showSuppliersEmailed ? "#fff" : "#111",
                        padding: "0.5rem 1rem",
                        borderRadius: "0.375rem",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                      }}
                    >
                      {showSuppliersEmailed
                        ? "Hide Suppliers Emailed"
                        : "Show Suppliers Emailed"}
                    </button>
                  </div>
                  {showSuppliersEmailed && (
                    <div style={historyCardStyle}>
                      {selectedInquiry.email_logs ? (
                        selectedInquiry.email_logs.length > 0 ? (
                          <div
                            style={{ maxHeight: "12.5rem", overflowY: "auto" }}
                          >
                            {selectedInquiry.email_logs
                              .filter((log) => log.success)
                              .map((log, index) => (
                                <div key={index} style={historyItemStyle}>
                                  <div style={historyHeaderStyle}>
                                    <span style={historyDateStyle}>
                                      {formatDateTime(log.sent_at)}
                                    </span>
                                    <span style={historyUserStyle}>
                                      To:{" "}
                                      {log.supplier?.name || "Unknown Supplier"}{" "}
                                      ({log.email})
                                    </span>
                                  </div>
                                  <div style={historyCommentStyle}>
                                    From: {log.from_email}
                                    {log.custom_message && (
                                      <div style={{ marginTop: "0.5rem" }}>
                                        Message: "{log.custom_message}"
                                      </div>
                                    )}
                                  </div>
                                  {index <
                                    selectedInquiry.email_logs.filter(
                                      (log) => log.success
                                    ).length -
                                      1 && (
                                    <div style={historyDividerStyle}></div>
                                  )}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: "1.25rem",
                              textAlign: "center",
                              color: "#777",
                            }}
                          >
                            No emails sent for this inquiry yet.
                          </div>
                        )
                      ) : (
                        <div
                          style={{
                            padding: "1.25rem",
                            textAlign: "center",
                            color: "#d32f2f",
                          }}
                        >
                          Error: Email logs not loaded. Please try reopening the
                          modal.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
                    gap: "1.25rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        marginBottom: "0.75rem",
                        color: "#1976D2",
                        fontSize: "1rem",
                      }}
                    >
                      New Negotiation Round
                    </h4>
                    <div style={priceCardStyle}>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={labelStyle}>Buyer Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={buyerPrice}
                          onChange={(e) => setBuyerPrice(e.target.value)}
                          style={inputStyle}
                          placeholder="Enter new buyer price"
                        />
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={labelStyle}>Supplier Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={supplierPrice}
                          onChange={(e) => setSupplierPrice(e.target.value)}
                          style={inputStyle}
                          placeholder="Enter new supplier price"
                        />
                      </div>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={labelStyle}>Comment</label>
                        <textarea
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          style={{ ...inputStyle, minHeight: "3.75rem" }}
                          placeholder="Add negotiation comments..."
                        />
                      </div>
                      <button
                        onClick={addPendingNegotiation}
                        style={addNegotiationBtn}
                        disabled={!buyerPrice && !supplierPrice && !comment}
                      >
                        ➕ Add Negotiation Round
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4
                      style={{
                        marginBottom: "0.75rem",
                        color: "#FF9800",
                        fontSize: "1rem",
                      }}
                    >
                      Pending Negotiation Rounds ({pendingNegotiations.length})
                    </h4>
                    <div style={pendingCardStyle}>
                      {pendingNegotiations.length > 0 ? (
                        <div
                          style={{ maxHeight: "18.75rem", overflowY: "auto" }}
                        >
                          {pendingNegotiations.map((negotiation, index) => (
                            <div key={negotiation.id} style={pendingItemStyle}>
                              <div style={pendingHeaderStyle}>
                                <span style={pendingDateStyle}>
                                  Round {pendingNegotiations.length - index}
                                  <span
                                    style={{
                                      color: "#4CAF50",
                                      marginLeft: "0.5rem",
                                    }}
                                  >
                                    ✓ (Will be saved)
                                  </span>
                                </span>
                                <button
                                  onClick={() =>
                                    removePendingNegotiation(negotiation.id)
                                  }
                                  style={removeBtnStyle}
                                >
                                  ✕
                                </button>
                              </div>
                              <div style={pendingPricesStyle}>
                                {negotiation.buyer_price && (
                                  <span style={pendingPriceItem}>
                                    Buyer:{" "}
                                    <strong>${negotiation.buyer_price}</strong>
                                  </span>
                                )}
                                {negotiation.supplier_price && (
                                  <span
                                    style={{
                                      ...pendingPriceItem,
                                      background: "#e8f5e8",
                                    }}
                                  >
                                    Supplier:{" "}
                                    <strong>
                                      ${negotiation.supplier_price}
                                    </strong>
                                  </span>
                                )}
                              </div>
                              {negotiation.comment && (
                                <div style={pendingCommentStyle}>
                                  "{negotiation.comment}"
                                </div>
                              )}
                              {index < pendingNegotiations.length - 1 && (
                                <div style={pendingDividerStyle}></div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "1.25rem",
                            textAlign: "center",
                            color: "#777",
                          }}
                        >
                          No pending negotiations. Add negotiation rounds above.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <h4
                      style={{ margin: 0, color: "#1976D2", fontSize: "1rem" }}
                    >
                      Saved Negotiation History
                    </h4>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button
                        onClick={clearNegotiationHistory}
                        style={clearHistoryBtn}
                        disabled={
                          !selectedInquiry?.negotiations ||
                          selectedInquiry.negotiations.length === 0
                        }
                      >
                        🗑️ Clear History
                      </button>
                      <button
                        onClick={() =>
                          setShowSavedNegotiations(!showSavedNegotiations)
                        }
                        style={{
                          background: showSavedNegotiations
                            ? "#2196F3"
                            : "#f3f3f3",
                          color: showSavedNegotiations ? "#fff" : "#111",
                          padding: "0.5rem 1rem",
                          borderRadius: "0.375rem",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.8125rem",
                        }}
                      >
                        {showSavedNegotiations
                          ? "Hide Negotiation History"
                          : "Show Negotiation History"}
                      </button>
                    </div>
                  </div>
                  {showSavedNegotiations && (
                    <div style={historyCardStyle}>
                      {selectedInquiry.negotiations &&
                      selectedInquiry.negotiations.length > 0 ? (
                        <div
                          style={{ maxHeight: "18.75rem", overflowY: "auto" }}
                        >
                          {selectedInquiry.negotiations.map(
                            (negotiation, index) => (
                              <div
                                key={negotiation.id || index}
                                style={historyItemStyle}
                              >
                                <div style={historyHeaderStyle}>
                                  <span style={historyDateStyle}>
                                    {formatDateTime(negotiation.created_at)}
                                  </span>
                                  <span style={historyUserStyle}>
                                    by {negotiation.created_by || "System"}
                                  </span>
                                </div>
                                <div style={historyPricesStyle}>
                                  {negotiation.buyer_price && (
                                    <span style={historyPriceItem}>
                                      Buyer:{" "}
                                      <strong>
                                        ${negotiation.buyer_price}
                                      </strong>
                                    </span>
                                  )}
                                  {negotiation.supplier_price && (
                                    <span
                                      style={{
                                        ...historyPriceItem,
                                        background: "#e8f5e8",
                                      }}
                                    >
                                      Supplier:{" "}
                                      <strong>
                                        ${negotiation.supplier_price}
                                      </strong>
                                    </span>
                                  )}
                                </div>
                                {negotiation.comment && (
                                  <div style={historyCommentStyle}>
                                    "{negotiation.comment}"
                                  </div>
                                )}
                                {index <
                                  selectedInquiry.negotiations.length - 1 && (
                                  <div style={historyDividerStyle}></div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "1.25rem",
                            textAlign: "center",
                            color: "#777",
                          }}
                        >
                          No saved negotiation history yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                  }}
                >
                  <div style={{ color: "#666", fontSize: "0.875rem", flex: 1 }}>
                    {pendingNegotiations.length > 0 && (
                      <div>
                        <div>
                          All {pendingNegotiations.length} round(s) will be
                          saved to negotiation history
                        </div>
                        {updateStatusToConfirmed && (
                          <div
                            style={{
                              color: "#4CAF50",
                              fontWeight: "bold",
                              marginTop: "0.25rem",
                            }}
                          >
                            ✓ Status will be updated to "Confirmed"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 0.75rem",
                        background: updateStatusToConfirmed
                          ? "#e8f5e8"
                          : "#f8f9fa",
                        borderRadius: "0.375rem",
                        border: `1px solid ${
                          updateStatusToConfirmed ? "#4CAF50" : "#ddd"
                        }`,
                      }}
                    >
                      <input
                        type="checkbox"
                        id="updateStatus"
                        checked={updateStatusToConfirmed}
                        onChange={(e) =>
                          setUpdateStatusToConfirmed(e.target.checked)
                        }
                        style={{
                          width: "1rem",
                          height: "1rem",
                          cursor: "pointer",
                          accentColor: "#4CAF50",
                        }}
                      />
                      <label
                        htmlFor="updateStatus"
                        style={{
                          fontSize: "0.875rem",
                          color: updateStatusToConfirmed ? "#2e7d32" : "#333",
                          cursor: "pointer",
                          fontWeight: updateStatusToConfirmed
                            ? "600"
                            : "normal",
                        }}
                      >
                        Update status to "Confirmed"
                      </label>
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button onClick={closeModal} style={secondaryBtn}>
                        Cancel
                      </button>
                      <button
                        onClick={saveAllNegotiations}
                        style={primaryBtn}
                        disabled={saving || pendingNegotiations.length === 0}
                      >
                        {saving ? "Saving..." : `Save All Rounds`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =====================
// Enhanced Styles for Responsiveness
// =====================
const styles = {
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    marginTop: "15px",
    backgroundColor: "#fff",
    borderRadius: "6px",
    boxShadow: "0 0 10px rgba(0,0,0,0.05)",
    maxHeight: "calc(100vh - 230px)", // Add this to limit height and enable scrolling
    overflowY: "auto", // Add this for vertical scrolling
  },
  table: {
    width: "100%",
    minWidth: "1200px",
    borderCollapse: "collapse",
    fontFamily: "Segoe UI, sans-serif",
    fontSize: "14px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    marginTop: "15px",
    flexWrap: "wrap",
    gap: "0.25rem",
  },
};

const cellStyle = {
  border: "1px solid #d1dbe8",
  padding: "10px",
  textAlign: "center",
  verticalAlign: "middle",
};

// Keep all your existing style constants but update for responsiveness
const buttonStyleBlue = {
  background: "linear-gradient(90deg, #2196F3, #1976D2)",
  color: "#fff",
  padding: "0.625rem 0.875rem",
  borderRadius: "0.375rem",
  textDecoration: "none",
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  display: "inline-block",
  textAlign: "center",
  whiteSpace: "nowrap",
};

const buttonStyleGreen = {
  background: "linear-gradient(90deg, #4caf50, #45a049)",
  color: "#fff",
  padding: "0.625rem 0.875rem",
  borderRadius: "0.375rem",
  textDecoration: "none",
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  display: "inline-block",
  textAlign: "center",
  whiteSpace: "nowrap",
};

const searchInputStyle = {
  padding: "0.5rem", // Reduced padding for a smaller appearance
  borderRadius: "0.375rem", // Slightly smaller border radius
  border: "1px solid #ddd",
  fontSize: "0.875rem",
  boxSizing: "border-box",
  maxWidth: "300px", // Set a maximum width
};

const linkButtonStyle = {
  background: "none",
  border: "none",
  color: "#1976D2",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.75rem",
  padding: "0.25rem 0.5rem",
  whiteSpace: "nowrap",
};

const linkStyle = {
  color: "#1976D2",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "0.75rem",
  padding: "0.25rem 0.5rem",
  whiteSpace: "nowrap",
};

const deleteButtonStyle = {
  background: "none",
  border: "none",
  color: "#d32f2f",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "0.75rem",
  padding: "0.25rem 0.5rem",
  whiteSpace: "nowrap",
};

// Keep all your existing modal and other styles exactly as they were
const priceCardStyle = {
  background: "#f8f9fa",
  padding: "1rem",
  borderRadius: "0.5rem",
  border: "1px solid #e9ecef",
};

const pendingCardStyle = {
  background: "#fff3e0",
  padding: "1rem",
  borderRadius: "0.5rem",
  border: "2px dashed #FF9800",
  maxHeight: "25rem",
};

const detailLabelStyle = {
  display: "block",
  fontSize: "0.75rem",
  color: "#666",
  marginBottom: "0.25rem",
};

const detailValueStyle = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "#333",
};

const historyCardStyle = {
  background: "#f8f9fa",
  padding: "1rem",
  borderRadius: "0.5rem",
  border: "1px solid #e9ecef",
  maxHeight: "25rem",
};

const historyItemStyle = {
  padding: "0.75rem",
  background: "#fff",
  borderRadius: "0.375rem",
  marginBottom: "0.5rem",
};

const pendingItemStyle = {
  padding: "0.75rem",
  background: "#fff",
  borderRadius: "0.375rem",
  marginBottom: "0.5rem",
  border: "1px solid #FF9800",
};

const historyHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "0.5rem",
};

const pendingHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "0.5rem",
};

const historyDateStyle = {
  fontWeight: 600,
  color: "#495057",
  fontSize: "0.8125rem",
};

const pendingDateStyle = {
  fontWeight: 700,
  color: "#FF9800",
  fontSize: "0.8125rem",
};

const historyUserStyle = {
  color: "#6c757d",
  fontSize: "0.75rem",
};

const historyPricesStyle = {
  display: "flex",
  gap: "0.75rem",
  marginBottom: "0.5rem",
  flexWrap: "wrap",
};

const pendingPricesStyle = {
  display: "flex",
  gap: "0.75rem",
  marginBottom: "0.5rem",
  flexWrap: "wrap",
};

const historyPriceItem = {
  padding: "0.25rem 0.5rem",
  background: "#e3f2fd",
  borderRadius: "0.25rem",
  fontSize: "0.8125rem",
  fontWeight: 600,
};

const pendingPriceItem = {
  padding: "0.25rem 0.5rem",
  background: "#ffe0b2",
  borderRadius: "0.25rem",
  fontSize: "0.8125rem",
  fontWeight: 600,
};

const historyCommentStyle = {
  padding: "0.5rem",
  background: "#f8f9fa",
  borderRadius: "0.25rem",
  fontStyle: "italic",
  color: "#495057",
  fontSize: "0.8125rem",
  borderLeft: "3px solid #2196F3",
};

const pendingCommentStyle = {
  padding: "0.5rem",
  background: "#fff8e1",
  borderRadius: "0.25rem",
  fontStyle: "italic",
  color: "#5d4037",
  fontSize: "0.8125rem",
  borderLeft: "3px solid #FF9800",
};

const historyDividerStyle = {
  height: "1px",
  background: "#e9ecef",
  margin: "0.75rem 0",
};

const pendingDividerStyle = {
  height: "1px",
  background: "#ffe0b2",
  margin: "0.75rem 0",
};

const removeBtnStyle = {
  background: "none",
  border: "none",
  color: "#d32f2f",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: "bold",
};

const clearHistoryBtn = {
  background: "#d32f2f",
  color: "#fff",
  padding: "0.5rem 1rem",
  borderRadius: "0.375rem",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.8125rem",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalStyle = {
  maxHeight: "90vh",
  background: "#fff",
  borderRadius: "0.5rem",
  padding: "1.25rem",
  boxShadow: "0 0.75rem 2.5rem rgba(0,0,0,0.25)",
  overflowY: "auto",
  boxSizing: "border-box",
};

const emailModalStyle = {
  maxHeight: "90vh",
  background: "#fff",
  borderRadius: "0.5rem",
  padding: "1.25rem",
  boxShadow: "0 0.75rem 2.5rem rgba(0,0,0,0.25)",
  overflowY: "auto",
  boxSizing: "border-box",
};

const closeBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "1.125rem",
  color: "#666",
};

const inputStyle = {
  width: "100%",
  padding: "0.625rem",
  borderRadius: "0.375rem",
  border: "1px solid #ddd",
  fontSize: "0.875rem",
  boxSizing: "border-box",
};

const primaryBtn = {
  background: "#4CAF50",
  color: "#fff",
  padding: "0.625rem 1.25rem",
  borderRadius: "0.375rem",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.875rem",
  minWidth: "12.5rem",
};

const secondaryBtn = {
  background: "#f3f3f3",
  color: "#111",
  padding: "0.625rem 1.25rem",
  borderRadius: "0.375rem",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.875rem",
  minWidth: "6.25rem",
};

const addNegotiationBtn = {
  background: "#FF9800",
  color: "#fff",
  padding: "0.625rem 1rem",
  borderRadius: "0.375rem",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.875rem",
  width: "100%",
};

const pagerBtn = {
  padding: "0.5rem 0.75rem",
  margin: "0 0.25rem",
  borderRadius: "0.375rem",
  border: "1px solid #ddd",

  cursor: "pointer",
  fontSize: "0.875rem",
};

const activePagerBtn = {
  ...pagerBtn,
  background: "#4caf50",
  color: "#fff",
  border: "1px solid #4caf50",
};

const labelStyle = {
  display: "block",
  marginBottom: "0.375rem",
  fontWeight: 600,
  color: "#495057",
  fontSize: "0.875rem",
};

export default Inquiry;
