// Inquiry.jsx - Updated with Department Column

import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBuilding,
  FaCheck,
  FaTimes,
  FaSearch,
  FaChevronDown,
  FaUsers,
} from "react-icons/fa";

const API_BASE = "http://119.148.51.38:8000/api/merchandiser/api";
const API_BASE1 = "http://119.148.51.38:8000/api/csr/api";

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

const api1 = axios.create({
  baseURL: API_BASE1,
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

const truncateName = (name, maxLength = 10) => {
  if (!name) return "-";
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + "..";
};

const truncateByPercentage = (text, percentage = 50) => {
  if (!text) return "-";
  if (percentage <= 0) return "...";
  if (percentage >= 100) return text;
  const truncateLength = Math.floor(text.length * (percentage / 100));
  if (truncateLength >= text.length) return text;
  return text.substring(0, truncateLength) + "...";
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") return "-";
  const num = typeof price === "string" ? parseFloat(price) : price;
  return isNaN(num) ? "-" : `$${num.toFixed(3)}`;
};

const Inquiry = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(() => {
    const saved = localStorage.getItem("inquiryShowFilters");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const tableBodyRef = useRef(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem("inquirySearchTerm") || "";
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem("inquiryCurrentPage");
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  const [itemsPerPage] = useState(100);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [buyerPrice, setBuyerPrice] = useState("");
  const [supplierPrice, setSupplierPrice] = useState("");
  const [comment, setComment] = useState("");
  const [pendingNegotiations, setPendingNegotiations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [updateStatusToConfirmed, setUpdateStatusToConfirmed] = useState(false);
  const [selectedInquiries, setSelectedInquiries] = useState(() => {
    const saved = localStorage.getItem("inquirySelectedInquiries");
    return saved ? JSON.parse(saved) : [];
  });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    from_email: "",
    to_email: "",
    custom_message: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [editingRemarks, setEditingRemarks] = useState({});
  const [savedNegotiations, setSavedNegotiations] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);

  // Customer filter states
  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState(() => {
    const saved = localStorage.getItem("inquirySelectedCustomers");
    return saved ? JSON.parse(saved) : [];
  });
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const customerDropdownRef = useRef(null);
  const customerSelectRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Department filter states
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState(() => {
    const saved = localStorage.getItem("inquirySelectedDepartments");
    return saved ? JSON.parse(saved) : [];
  });
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");
  const departmentDropdownRef = useRef(null);
  const departmentSelectRef = useRef(null);
  const [departmentDropdownPosition, setDepartmentDropdownPosition] = useState({ top: 0, left: 0 });

  // Pagination and stats state
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalValue, setTotalValue] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [totalConfirmedCount, setTotalConfirmedCount] = useState(0);
  const [totalQuotedCount, setTotalQuotedCount] = useState(0);
  const [availableYears, setAvailableYears] = useState([]);

  // Filter states
  const [selectedYear, setSelectedYear] = useState(() => {
    return localStorage.getItem("inquirySelectedYear") || "";
  });
  const [selectedSeason, setSelectedSeason] = useState(() => {
    return localStorage.getItem("inquirySelectedSeason") || "";
  });
  const [selectedSupplier, setSelectedSupplier] = useState(() => {
    return localStorage.getItem("inquirySelectedSupplier") || "";
  });
  const [selectedStatus, setSelectedStatus] = useState(() => {
    return localStorage.getItem("inquirySelectedStatus") || "";
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return localStorage.getItem("inquirySelectedMonth") || "";
  });
  const [selectedGarment, setSelectedGarment] = useState(() => {
    return localStorage.getItem("inquirySelectedGarment") || "";
  });

  const garmentOptions = [
    { value: "knit", label: "Knit" },
    { value: "woven", label: "Woven" },
    { value: "sweater", label: "Sweater" },
    { value: "underwear", label: "Underwear" },
  ];

  const seasons = ["spring", "summer", "autumn", "winter"];
  const statuses = ["pending", "quoted", "confirmed"];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem("inquirySelectedGarment", selectedGarment);
  }, [selectedGarment]);

  useEffect(() => {
    localStorage.setItem("inquiryShowFilters", JSON.stringify(showFilters));
  }, [showFilters]);

  useEffect(() => {
    localStorage.setItem("inquirySearchTerm", searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem("inquiryCurrentPage", currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem(
      "inquirySelectedInquiries",
      JSON.stringify(selectedInquiries),
    );
  }, [selectedInquiries]);

  useEffect(() => {
    localStorage.setItem("inquirySelectedYear", selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    localStorage.setItem("inquirySelectedSeason", selectedSeason);
  }, [selectedSeason]);

  useEffect(() => {
    localStorage.setItem("inquirySelectedSupplier", selectedSupplier);
  }, [selectedSupplier]);

  useEffect(() => {
    localStorage.setItem("inquirySelectedStatus", selectedStatus);
  }, [selectedStatus]);

  useEffect(() => {
    localStorage.setItem("inquirySelectedMonth", selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    localStorage.setItem(
      "inquirySelectedCustomers",
      JSON.stringify(selectedCustomers),
    );
  }, [selectedCustomers]);

  useEffect(() => {
    localStorage.setItem(
      "inquirySelectedDepartments",
      JSON.stringify(selectedDepartments),
    );
  }, [selectedDepartments]);

  // Fetch customers for filter dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get("/customer/?page_size=1000");
        let customersList = [];
        if (response.data?.results) {
          customersList = response.data.results;
        } else if (Array.isArray(response.data)) {
          customersList = response.data;
        }

        const formattedCustomers = customersList.map((customer) => ({
          id: customer.id,
          name:
            customer.hrms_customer_name ||
            customer.customer_name ||
            `Customer ${customer.id}`,
          display_name:
            customer.hrms_customer_name ||
            customer.customer_name ||
            `Customer ${customer.id}`,
        }));

        formattedCustomers.sort((a, b) => a.name.localeCompare(b.name));
        setCustomerOptions(formattedCustomers);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch departments for filter dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get("/department/?page_size=1000");
        let departmentsList = [];
        if (response.data?.results) {
          departmentsList = response.data.results;
        } else if (Array.isArray(response.data)) {
          departmentsList = response.data;
        }

        const formattedDepartments = departmentsList.map((dept) => ({
          id: dept.id,
          name: dept.name || dept.department_display || `Department ${dept.id}`,
        }));

        formattedDepartments.sort((a, b) => a.name.localeCompare(b.name));
        setDepartmentOptions(formattedDepartments);
        console.log("📋 Fetched departments:", formattedDepartments);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await api1.get("/supplier/");
        setAllSuppliers(response.data);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const username = localStorage.getItem("username");

      console.log("🔐 Auth Check:", { token: !!token, username });

      if (!token) {
        console.error("No token found! Redirecting to login...");
        navigate("/login");
        return;
      }

      api.defaults.headers.common["Authorization"] = `Token ${token}`;
      api1.defaults.headers.common["Authorization"] = `Token ${token}`;
    };

    checkAuth();
  }, [navigate]);

  // Handle click outside customer dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target)
      ) {
        setIsCustomerDropdownOpen(false);
        setCustomerSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle click outside department dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        departmentDropdownRef.current &&
        !departmentDropdownRef.current.contains(event.target)
      ) {
        setIsDepartmentDropdownOpen(false);
        setDepartmentSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update customer dropdown position
  useEffect(() => {
    const updatePosition = () => {
      if (isCustomerDropdownOpen && customerSelectRef.current) {
        const rect = customerSelectRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        });
      }
    };

    if (isCustomerDropdownOpen) {
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isCustomerDropdownOpen]);

  // Update department dropdown position
  useEffect(() => {
    const updatePosition = () => {
      if (isDepartmentDropdownOpen && departmentSelectRef.current) {
        const rect = departmentSelectRef.current.getBoundingClientRect();
        setDepartmentDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        });
      }
    };

    if (isDepartmentDropdownOpen) {
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isDepartmentDropdownOpen]);

  // Fetch stats and available years when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (
      selectedGarment &&
      selectedGarment !== "all" &&
      selectedGarment !== ""
    ) {
      params.append("garment", selectedGarment);
    }
    if (selectedSeason && selectedSeason !== "all" && selectedSeason !== "") {
      params.append("season", selectedSeason);
    }
    if (searchTerm && searchTerm.trim()) {
      params.append("search", searchTerm.trim());
    }
    if (selectedYear && selectedYear !== "all" && selectedYear !== "") {
      params.append("year", selectedYear);
    }
    if (selectedStatus && selectedStatus !== "all" && selectedStatus !== "") {
      params.append("current_status", selectedStatus);
    }
    if (selectedCustomers && selectedCustomers.length > 0) {
      params.append("customer", selectedCustomers.join("|"));
    }
    if (selectedDepartments && selectedDepartments.length > 0) {
      params.append("department", selectedDepartments.join("|"));
    }
    fetchStatsAndYears(params);
  }, [
    selectedGarment,
    selectedSeason,
    searchTerm,
    selectedYear,
    selectedStatus,
    selectedCustomers,
    selectedDepartments,
  ]);

  // Fetch inquiries when page or filters change
  useEffect(() => {
    fetchInquiries();
  }, [
    currentPage,
    selectedYear,
    selectedSeason,
    selectedStatus,
    selectedGarment,
    searchTerm,
    selectedCustomers,
    selectedDepartments,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedYear,
    selectedSeason,
    selectedStatus,
    selectedGarment,
    searchTerm,
    selectedCustomers,
    selectedDepartments,
  ]);

  const fetchStatsAndYears = async (filterParams) => {
    try {
      const params = new URLSearchParams(filterParams);
      params.delete("page");
      params.delete("page_size");

      const response = await api.get(
        `/inquiry/?${params.toString()}&page_size=10000`,
      );

      if (response.data && response.data.results) {
        const allInquiries = response.data.results;

        const totalQty = allInquiries.reduce((sum, inquiry) => {
          return sum + (parseFloat(inquiry.order_quantity) || 0);
        }, 0);
        setTotalQuantity(totalQty);

        const totalVal = allInquiries.reduce((sum, inquiry) => {
          let value = 0;
          if (
            inquiry.value !== undefined &&
            inquiry.value !== null &&
            !isNaN(parseFloat(inquiry.value))
          ) {
            value = parseFloat(inquiry.value);
          } else if (inquiry.confirmed_price && inquiry.order_quantity) {
            value =
              parseFloat(inquiry.confirmed_price) *
              parseFloat(inquiry.order_quantity);
          }
          return sum + value;
        }, 0);
        setTotalValue(totalVal);

        const pending = allInquiries.filter(
          (i) => i.current_status === "pending",
        ).length;
        const confirmed = allInquiries.filter(
          (i) => i.current_status === "confirmed",
        ).length;
        const quoted = allInquiries.filter(
          (i) => i.current_status === "quoted",
        ).length;

        setTotalPendingCount(pending);
        setTotalConfirmedCount(confirmed);
        setTotalQuotedCount(quoted);

        const years = [
          ...new Set(
            allInquiries
              .map((i) => i.year)
              .filter((y) => y && y !== "null" && y !== "undefined"),
          ),
        ];
        years.sort((a, b) => parseInt(b) - parseInt(a));
        setAvailableYears(years);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("page_size", itemsPerPage);

      if (searchTerm && searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      if (
        selectedGarment &&
        selectedGarment !== "all" &&
        selectedGarment !== ""
      ) {
        params.append("garment", selectedGarment);
      }

      if (selectedYear && selectedYear !== "all" && selectedYear !== "") {
        params.append("year", selectedYear);
      }

      if (selectedSeason && selectedSeason !== "all" && selectedSeason !== "") {
        params.append("season", selectedSeason);
      }

      if (selectedStatus && selectedStatus !== "all" && selectedStatus !== "") {
        params.append("current_status", selectedStatus);
      }

      if (selectedCustomers && selectedCustomers.length > 0) {
        params.append("customer", selectedCustomers.join("|"));
      }

      if (selectedDepartments && selectedDepartments.length > 0) {
        params.append("department", selectedDepartments.join("|"));
      }

      const url = `/inquiry/?${params.toString()}`;
      console.log("📦 Fetching with filters:", url);

      const response = await api.get(url);

      let fetchedInquiries = [];
      let total = 0;

      if (response.data && response.data.results) {
        fetchedInquiries = response.data.results;
        total = response.data.count || 0;
      } else if (Array.isArray(response.data)) {
        fetchedInquiries = response.data;
        total = response.data.length;
      }

      let filteredResults = fetchedInquiries;

      if (selectedMonth && selectedMonth !== "all" && selectedMonth !== "") {
        const monthNum = parseInt(selectedMonth);
        filteredResults = filteredResults.filter((inquiry) => {
          if (!inquiry.shipment_date) return false;
          const date = new Date(inquiry.shipment_date);
          return date.getMonth() + 1 === monthNum;
        });
      }

      if (
        selectedSupplier &&
        selectedSupplier !== "all" &&
        selectedSupplier !== ""
      ) {
        filteredResults = filteredResults.filter((inquiry) => {
          const supplierPrices = inquiry.supplier_prices_display || [];
          return supplierPrices.some(
            (sp) =>
              sp.supplier_id?.toString() === selectedSupplier ||
              sp.supplier?.toString() === selectedSupplier,
          );
        });
      }

      setInquiries(filteredResults);
      setTotalCount(total);
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (err) {
      console.error("fetchInquiries error:", err);
      alert(
        "Failed to fetch inquiries: " +
          (err.response?.data?.error || err.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const getCustomerDisplayText = () => {
    if (selectedCustomers.length === 0) return "All Customers";
    if (selectedCustomers.length === 1) {
      const customer = customerOptions.find(
        (c) => c.id.toString() === selectedCustomers[0],
      );
      return customer ? customer.name : "1 customer selected";
    }
    return `${selectedCustomers.length} customers selected`;
  };

  const getDepartmentDisplayText = () => {
    if (selectedDepartments.length === 0) return "All Departments";
    if (selectedDepartments.length === 1) {
      const dept = departmentOptions.find(
        (d) => d.id.toString() === selectedDepartments[0],
      );
      return dept ? dept.name : "1 department selected";
    }
    return `${selectedDepartments.length} departments selected`;
  };

  const isDepartmentSelected = (deptId) => {
    return selectedDepartments.includes(deptId.toString());
  };

  const toggleDepartmentSelection = (deptId) => {
    setSelectedDepartments((prev) => {
      const idStr = deptId.toString();
      if (prev.includes(idStr)) {
        return prev.filter((id) => id !== idStr);
      } else {
        return [...prev, idStr];
      }
    });
  };

  const removeDepartment = (deptId) => {
    setSelectedDepartments((prev) =>
      prev.filter((id) => id !== deptId.toString()),
    );
  };

  const clearAllDepartments = () => {
    setSelectedDepartments([]);
    setDepartmentSearchTerm("");
  };

  const selectAllDepartments = () => {
    setSelectedDepartments(departmentOptions.map((d) => d.id.toString()));
  };

  const filteredDepartmentOptions = useMemo(() => {
    if (!departmentSearchTerm) return departmentOptions;
    const searchLower = departmentSearchTerm.toLowerCase();
    return departmentOptions.filter((dept) =>
      dept.name.toLowerCase().includes(searchLower),
    );
  }, [departmentOptions, departmentSearchTerm]);

  const isCustomerSelected = (customerId) => {
    return selectedCustomers.includes(customerId.toString());
  };

  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers((prev) => {
      const idStr = customerId.toString();
      if (prev.includes(idStr)) {
        return prev.filter((id) => id !== idStr);
      } else {
        return [...prev, idStr];
      }
    });
  };

  const removeCustomer = (customerId) => {
    setSelectedCustomers((prev) =>
      prev.filter((id) => id !== customerId.toString()),
    );
  };

  const clearAllCustomers = () => {
    setSelectedCustomers([]);
    setCustomerSearchTerm("");
  };

  const selectAllCustomers = () => {
    setSelectedCustomers(customerOptions.map((c) => c.id.toString()));
  };

  const filteredCustomerOptions = useMemo(() => {
    if (!customerSearchTerm) return customerOptions;
    const searchLower = customerSearchTerm.toLowerCase();
    return customerOptions.filter((customer) =>
      customer.name.toLowerCase().includes(searchLower),
    );
  }, [customerOptions, customerSearchTerm]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedYear("");
    setSelectedSeason("");
    setSelectedSupplier("");
    setSelectedStatus("");
    setSelectedMonth("");
    setSelectedGarment("");
    setSelectedCustomers([]);
    setSelectedDepartments([]);
    setCustomerSearchTerm("");
    setDepartmentSearchTerm("");
    setCurrentPage(1);
  };

  const renderSupplierPrices = (inquiry) => {
    const prices = inquiry.supplier_prices_display || [];

    if (!prices || prices.length === 0) {
      return <div style={styles.noPrices}>-</div>;
    }

    const validPrices = prices
      .filter(
        (item) =>
          item.price !== null &&
          item.price !== undefined &&
          !isNaN(parseFloat(item.price)),
      )
      .sort((a, b) => a.price - b.price);

    if (validPrices.length === 0) {
      return <div style={styles.noPrices}>-</div>;
    }

    return (
      <div style={styles.supplierPrices}>
        {validPrices.map((priceItem, index) => {
          let fullName = priceItem.supplier_name || "Unknown";
          const shortName = truncateName(fullName, 5);
          return (
            <div
              key={priceItem.id || index}
              style={styles.supplierPriceItem}
              title={fullName}
            >
              <strong style={styles.supplierName}>{shortName}:</strong>
              <span style={styles.priceValue}>
                ${priceItem.price.toFixed(3)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const updateRemarks1 = async (inquiryId, remarks1) => {
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({ remarks1: remarks1 }));
      const response = await api.put(`/inquiry/${inquiryId}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 200) {
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === inquiryId
              ? { ...inq, remarks1: response.data.remarks1 }
              : inq,
          ),
        );
      }
      setEditingRemarks((prev) => ({ ...prev, [inquiryId]: false }));
    } catch (error) {
      console.error("Error updating remarks1:", error);
      alert("Failed to save remarks. Please try again.");
    }
  };

  const handleRemarks1Change = (inquiryId, value) => {
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId ? { ...inq, remarks1: value } : inq,
      ),
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
    if (selectedInquiries.length === inquiries.length && inquiries.length > 0) {
      setSelectedInquiries([]);
    } else {
      setSelectedInquiries(inquiries.map((item) => item.id));
    }
  };

  const openEmailModal = () => {
    if (selectedInquiries.length === 0) {
      alert("Please select at least one inquiry to send.");
      return;
    }
    setEmailData({ from_email: "", to_email: "", custom_message: "" });
    setShowEmailModal(true);
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setEmailData({ from_email: "", to_email: "", custom_message: "" });
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
    if (!emailData.to_email) {
      alert("Please enter recipient email address.");
      return;
    }
    setSendingEmail(true);
    const results = { success: 0, failed: 0 };
    try {
      for (const inquiryId of selectedInquiries) {
        const inquiry = inquiries.find((inq) => inq.id === inquiryId);
        if (!inquiry) {
          results.failed++;
          continue;
        }
        try {
          const payload = {
            from_email: emailData.from_email,
            custom_message: emailData.custom_message || "",
            supplier_email: emailData.to_email,
          };
          const response = await api.post(
            `/inquiries/${inquiryId}/send-email/`,
            payload,
          );
          if (response.data.success) {
            results.success++;
          } else {
            results.failed++;
          }
        } catch (error) {
          results.failed++;
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      await fetchInquiries();
      alert(
        `Email sending completed!\n✅ Success: ${results.success}\n❌ Failed: ${results.failed}`,
      );
      if (results.failed === 0) {
        setSelectedInquiries([]);
        closeEmailModal();
      }
    } catch (error) {
      console.error("Bulk email error:", error);
      alert(`Failed to send bulk emails: ${error.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const isInquirySelected = (inquiryId) =>
    selectedInquiries.includes(inquiryId);

  const openModal = async (inquiry) => {
    try {
      const response = await api.get(`/inquiry/${inquiry.id}/`);
      setSelectedInquiry(response.data);
      setSavedNegotiations(response.data.negotiations || []);
      setBuyerPrice("");
      setSupplierPrice("");
      setComment("");
      setPendingNegotiations([]);
      setShowModal(true);
      setUpdateStatusToConfirmed(response.data.current_status === "confirmed");
    } catch (error) {
      console.error("Error fetching inquiry:", error);
      alert("Failed to load inquiry details.");
    }
  };

  const deleteNegotiation = async (negotiationId) => {
    if (
      !window.confirm("Are you sure you want to delete this negotiation round?")
    ) {
      return;
    }

    try {
      const response = await api.delete(`/negotiation/${negotiationId}/`);

      if (response.status === 204) {
        setSavedNegotiations((prev) =>
          prev.filter((neg) => neg.id !== negotiationId),
        );
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === selectedInquiry?.id
              ? {
                  ...inq,
                  negotiations:
                    inq.negotiations?.filter(
                      (neg) => neg.id !== negotiationId,
                    ) || [],
                }
              : inq,
          ),
        );
        alert("Negotiation round deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting negotiation:", error);
      alert("Failed to delete negotiation round. Please try again.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedInquiry(null);
    setSavedNegotiations([]);
    setBuyerPrice("");
    setSupplierPrice("");
    setComment("");
    setPendingNegotiations([]);
    setUpdateStatusToConfirmed(false);
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
      created_by: "Current User",
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
      await fetchInquiries();
      const refreshedInquiry = await api.get(`/inquiry/${selectedInquiry.id}/`);
      setSelectedInquiry(refreshedInquiry.data);
      setSavedNegotiations(refreshedInquiry.data.negotiations || []);
      setPendingNegotiations([]);
      alert(
        `${pendingNegotiations.length} negotiation round(s) saved successfully!`,
      );
    } catch (err) {
      console.error("Error saving negotiations:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateStatusOnly = async (inquiryId, newStatus) => {
    try {
      const validStatuses = ["pending", "quoted", "confirmed"];
      if (!validStatuses.includes(newStatus)) {
        console.error("Invalid status:", newStatus);
        return false;
      }
      const response = await api.patch(`/inquiry/${inquiryId}/update-status/`, {
        current_status: newStatus,
      });
      if (response.status === 200) {
        await fetchInquiries();
        if (selectedInquiry && selectedInquiry.id === inquiryId) {
          const refreshedInquiry = await api.get(`/inquiry/${inquiryId}/`);
          setSelectedInquiry(refreshedInquiry.data);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error updating status:", err);
      alert(
        `Error updating status: ${err.response?.data?.error || err.message}`,
      );
      return false;
    }
  };

  const handleStatusCheckboxChange = async (e) => {
    const isChecked = e.target.checked;
    setUpdateStatusToConfirmed(isChecked);
    if (selectedInquiry) {
      const newStatus = isChecked ? "confirmed" : "pending";
      await updateStatusOnly(selectedInquiry.id, newStatus);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete this inquiry?")) return;
    try {
      await api.delete(`/inquiry/${id}/`);
      await fetchInquiries();
      alert("Inquiry deleted successfully!");
    } catch (err) {
      console.error("delete error", err);
      alert("Delete failed.");
    }
  };

  const handleRowClick = (inquiryId) => {
    navigate(`/inquiries/${inquiryId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getFirstImage = (inquiry) => {
    if (inquiry.multiple_images && inquiry.multiple_images.length > 0) {
      const imagePath = inquiry.multiple_images[0];
      if (imagePath) {
        if (imagePath.startsWith("http")) return imagePath;
        if (imagePath.startsWith("/"))
          return `http://119.148.51.38:8000${imagePath}`;
        return `http://119.148.51.38:8000/${imagePath}`;
      }
    }
    return null;
  };

  const getInquiryValue = (inquiry) => {
    if (
      inquiry.value !== undefined &&
      inquiry.value !== null &&
      !isNaN(parseFloat(inquiry.value))
    ) {
      return parseFloat(inquiry.value);
    } else if (inquiry.confirmed_price && inquiry.order_quantity) {
      return (
        parseFloat(inquiry.confirmed_price) * parseFloat(inquiry.order_quantity)
      );
    }
    return 0;
  };

  const selectionTotals = selectedInquiries.reduce(
    (acc, inquiryId) => {
      const inquiry = inquiries.find((inq) => inq.id === inquiryId);
      if (inquiry) {
        const value = getInquiryValue(inquiry);
        const quantity = parseFloat(inquiry.order_quantity) || 0;
        acc.totalQuantity += quantity;
        acc.totalValue += value;
        acc.count++;
      }
      return acc;
    },
    { count: 0, totalQuantity: 0, totalValue: 0 },
  );

  const availableSuppliers = React.useMemo(() => {
    const supplierMap = new Map();
    inquiries.forEach((inquiry) => {
      const prices = inquiry.supplier_prices_display || [];
      prices.forEach((price) => {
        if (price.supplier_id && !supplierMap.has(price.supplier_id)) {
          supplierMap.set(price.supplier_id, {
            id: price.supplier_id,
            name: price.supplier_name || `Supplier ${price.supplier_id}`,
          });
        }
      });
    });
    return Array.from(supplierMap.values());
  }, [inquiries]);

  const statusColors = {
    pending: "linear-gradient(135deg, #f59e0b, #f97316)",
    quoted: "linear-gradient(135deg, #3b82f6, #06b6d4)",
    confirmed: "linear-gradient(135deg, #10b981, #059669)",
    default: "linear-gradient(135deg, #6b7280, #4b5563)",
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <div style={styles.headerBadge}>📋</div>
              <h1 style={styles.headerTitle}>Inquiry Management</h1>
            </div>
            <div style={styles.headerActions}>
              <Link to="/inquiries/add" style={styles.btnPrimary}>
                + New Inquiry
              </Link>
              <Link to="/development-samples" style={styles.btnDevelopment}>
                🧪 Development Sample
              </Link>
              <Link to="/inquiry-costing-list" style={styles.btnCosting}>
                📊 Costing List
              </Link>
              <Link to="/bulk-costing" style={styles.btnBulkCosting}>
                📈 Bulk Costing
              </Link>
            </div>
          </div>
          <p style={styles.headerSubtitle}>
            Manage, track, and negotiate inquiries across all suppliers
          </p>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>
                {totalCount.toLocaleString()}
              </span>
              <span style={styles.statLabel}>Total Inquiries</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>💰</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>
                $
                {totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                })}
              </span>
              <span style={styles.statLabel}>Total Value</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📦</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>
                {totalQuantity.toLocaleString()}
              </span>
              <span style={styles.statLabel}>Total Quantity</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏳</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>
                {totalPendingCount.toLocaleString()}
              </span>
              <span style={styles.statLabel}>Pending</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>
                {totalConfirmedCount.toLocaleString()}
              </span>
              <span style={styles.statLabel}>Confirmed</span>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div style={styles.filterSection}>
          <div
            style={styles.filterHeader}
            onClick={() => setShowFilters(!showFilters)}
          >
            <div style={styles.filterHeaderLeft}>
              <span style={styles.filterIcon}>🔍</span>
              <h3 style={styles.filterTitle}>Advanced Filters</h3>
              <span style={styles.filterBadge}>{totalCount} results</span>
            </div>
            <button style={styles.filterToggle}>
              {showFilters ? "▲" : "▼"}
            </button>
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
                    placeholder="Search by Inquiry No, Customer, Buyer..."
                  />
                </div>

                {/* Customer Filter */}
                <div style={styles.filterWrapper} ref={customerDropdownRef}>
                  <label style={styles.filterLabel}>Customer</label>
                  <div
                    ref={customerSelectRef}
                    style={{
                      ...styles.filterSelect,
                      ...(isCustomerDropdownOpen
                        ? styles.filterSelectActive
                        : {}),
                    }}
                    onClick={() => {
                      if (!isCustomerDropdownOpen) {
                        const rect =
                          customerSelectRef.current?.getBoundingClientRect();
                        if (rect) {
                          setDropdownPosition({
                            top: rect.bottom + window.scrollY + 4,
                            left: rect.left + window.scrollX,
                          });
                        }
                      }
                      setIsCustomerDropdownOpen(!isCustomerDropdownOpen);
                    }}
                  >
                    <FaBuilding
                      style={{ color: "#94a3b8", marginRight: "8px" }}
                    />
                    <span
                      style={
                        selectedCustomers.length === 0 ? styles.placeholder : {}
                      }
                    >
                      {getCustomerDisplayText()}
                    </span>
                    {selectedCustomers.length > 0 && (
                      <FaTimes
                        style={styles.clearIcon}
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAllCustomers();
                        }}
                      />
                    )}
                    <FaChevronDown style={styles.chevron} />
                  </div>
                  {isCustomerDropdownOpen && (
                    <div
                      style={{
                        ...styles.dropdownMenuMultiSelect,
                        position: "fixed",
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                      }}
                    >
                      <div style={styles.dropdownSearch}>
                        <FaSearch
                          style={{ color: "#94a3b8", fontSize: "14px" }}
                        />
                        <input
                          type="text"
                          placeholder="Search customers..."
                          value={customerSearchTerm}
                          onChange={(e) =>
                            setCustomerSearchTerm(e.target.value)
                          }
                          style={styles.dropdownSearchInput}
                          autoFocus
                        />
                      </div>
                      <div style={styles.dropdownOptionsMultiSelect}>
                        <div style={styles.multiSelectActions}>
                          <button
                            style={styles.multiSelectActionBtn}
                            onClick={selectAllCustomers}
                          >
                            Select All
                          </button>
                          <button
                            style={styles.multiSelectActionBtn}
                            onClick={clearAllCustomers}
                          >
                            Clear All
                          </button>
                        </div>
                        {filteredCustomerOptions.map((customer) => {
                          const isSelected = isCustomerSelected(customer.id);
                          return (
                            <div
                              key={customer.id}
                              style={{
                                ...styles.dropdownOptionMultiSelect,
                                ...(isSelected
                                  ? styles.dropdownOptionSelected
                                  : {}),
                              }}
                              onClick={() =>
                                toggleCustomerSelection(customer.id)
                              }
                            >
                              <div
                                style={{
                                  ...styles.customCheckbox,
                                  ...(isSelected
                                    ? styles.customCheckboxChecked
                                    : {}),
                                }}
                              >
                                {isSelected && <FaCheck size={10} />}
                              </div>
                              <FaBuilding
                                style={{ marginRight: "8px", fontSize: "12px" }}
                              />
                              <span>{customer.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Department Filter */}
                <div style={styles.filterWrapper} ref={departmentDropdownRef}>
                  <label style={styles.filterLabel}>Department</label>
                  <div
                    ref={departmentSelectRef}
                    style={{
                      ...styles.filterSelect,
                      ...(isDepartmentDropdownOpen
                        ? styles.filterSelectActive
                        : {}),
                    }}
                    onClick={() => {
                      if (!isDepartmentDropdownOpen) {
                        const rect =
                          departmentSelectRef.current?.getBoundingClientRect();
                        if (rect) {
                          setDepartmentDropdownPosition({
                            top: rect.bottom + window.scrollY + 4,
                            left: rect.left + window.scrollX,
                          });
                        }
                      }
                      setIsDepartmentDropdownOpen(!isDepartmentDropdownOpen);
                    }}
                  >
                    <FaUsers
                      style={{ color: "#94a3b8", marginRight: "8px" }}
                    />
                    <span
                      style={
                        selectedDepartments.length === 0 ? styles.placeholder : {}
                      }
                    >
                      {getDepartmentDisplayText()}
                    </span>
                    {selectedDepartments.length > 0 && (
                      <FaTimes
                        style={styles.clearIcon}
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAllDepartments();
                        }}
                      />
                    )}
                    <FaChevronDown style={styles.chevron} />
                  </div>
                  {isDepartmentDropdownOpen && (
                    <div
                      style={{
                        ...styles.dropdownMenuMultiSelect,
                        position: "fixed",
                        top: departmentDropdownPosition.top,
                        left: departmentDropdownPosition.left,
                      }}
                    >
                      <div style={styles.dropdownSearch}>
                        <FaSearch
                          style={{ color: "#94a3b8", fontSize: "14px" }}
                        />
                        <input
                          type="text"
                          placeholder="Search departments..."
                          value={departmentSearchTerm}
                          onChange={(e) =>
                            setDepartmentSearchTerm(e.target.value)
                          }
                          style={styles.dropdownSearchInput}
                          autoFocus
                        />
                      </div>
                      <div style={styles.dropdownOptionsMultiSelect}>
                        <div style={styles.multiSelectActions}>
                          <button
                            style={styles.multiSelectActionBtn}
                            onClick={selectAllDepartments}
                          >
                            Select All
                          </button>
                          <button
                            style={styles.multiSelectActionBtn}
                            onClick={clearAllDepartments}
                          >
                            Clear All
                          </button>
                        </div>
                        {filteredDepartmentOptions.map((dept) => {
                          const isSelected = isDepartmentSelected(dept.id);
                          return (
                            <div
                              key={dept.id}
                              style={{
                                ...styles.dropdownOptionMultiSelect,
                                ...(isSelected
                                  ? styles.dropdownOptionSelected
                                  : {}),
                              }}
                              onClick={() =>
                                toggleDepartmentSelection(dept.id)
                              }
                            >
                              <div
                                style={{
                                  ...styles.customCheckbox,
                                  ...(isSelected
                                    ? styles.customCheckboxChecked
                                    : {}),
                                }}
                              >
                                {isSelected && <FaCheck size={10} />}
                              </div>
                              <FaUsers
                                style={{ marginRight: "8px", fontSize: "12px" }}
                              />
                              <span>{dept.name}</span>
                            </div>
                          );
                        })}
                        {filteredDepartmentOptions.length === 0 && (
                          <div style={styles.emptyDropdownMessage}>
                            No departments found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Garment</label>
                  <select
                    value={selectedGarment}
                    onChange={(e) => setSelectedGarment(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="">All</option>
                    {garmentOptions.map((garment) => (
                      <option key={garment.value} value={garment.value}>
                        {garment.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="">All</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Season</label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="">All</option>
                    {seasons.map((season) => (
                      <option key={season} value={season}>
                        {season.charAt(0).toUpperCase() + season.slice(1)}
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
                    <option value="">All</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Shipment Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="">All</option>
                    {months.map((month, index) => (
                      <option key={index + 1} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Supplier</label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="">All</option>
                    {availableSuppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {truncateName(supplier.name, 20)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected customers tags */}
              {selectedCustomers.length > 0 && (
                <div style={styles.selectedTagsContainer}>
                  <span style={styles.selectedTagsLabel}>
                    Selected customers:
                  </span>
                  {selectedCustomers.map((customerId) => {
                    const customer = customerOptions.find(
                      (c) => c.id.toString() === customerId,
                    );
                    return customer ? (
                      <span key={customerId} style={styles.selectedTag}>
                        {customer.name}
                        <button
                          style={styles.selectedTagRemove}
                          onClick={() => removeCustomer(customerId)}
                        >
                          <FaTimes size={10} />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {/* Selected departments tags */}
              {selectedDepartments.length > 0 && (
                <div style={styles.selectedTagsContainer}>
                  <span style={styles.selectedTagsLabel}>
                    Selected departments:
                  </span>
                  {selectedDepartments.map((deptId) => {
                    const dept = departmentOptions.find(
                      (d) => d.id.toString() === deptId,
                    );
                    return dept ? (
                      <span key={deptId} style={styles.selectedTag}>
                        {dept.name}
                        <button
                          style={styles.selectedTagRemove}
                          onClick={() => removeDepartment(deptId)}
                        >
                          <FaTimes size={10} />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              <div style={styles.searchButtons}>
                <button onClick={clearAllFilters} style={styles.btnClear}>
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
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
                  <span>
                    📦 Qty: {selectionTotals.totalQuantity.toLocaleString()}
                  </span>
                  <span>
                    💰 Value: ${selectionTotals.totalValue.toFixed(3)}
                  </span>
                </div>
              </div>
              <div style={styles.selectionActions}>
                <button onClick={openEmailModal} style={styles.btnEmail}>
                  📧 Send Email
                </button>
                <button
                  onClick={() => setSelectedInquiries([])}
                  style={styles.btnClearSelection}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeaderFixed}>
            <div style={styles.tableTitle}>
              <h3>Inquiry List</h3>
              <span style={styles.tableCount}>{totalCount} items</span>
            </div>
          </div>
          <div style={styles.tableWrapper} ref={tableBodyRef}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    <input
                      type="checkbox"
                      checked={
                        selectedInquiries.length === inquiries.length &&
                        inquiries.length > 0
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th style={styles.th}>Img</th>
                  <th style={styles.th}>Inquiry No</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Buyer</th>
                  <th style={styles.th}>Dept</th>
                  <th style={styles.th}>Style/Model</th>
                  <th style={styles.th}>Quality</th>
                  <th style={styles.th}>Garment</th>
                  <th style={styles.th}>Qty</th>
                  <th style={styles.th}>Ship/Plan Delivery</th>
                  <th style={styles.th}>Target</th>
                  <th style={styles.th}>Offer</th>
                  <th style={styles.th}>Confirmed</th>
                  <th style={styles.th}>Texweave</th>
                  <th style={styles.th}>Value</th>
                  <th style={styles.th}>Suppliers</th>
                  <th style={styles.th}>Size</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Remarks</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="21" style={styles.loadingCell}>
                      <div style={styles.spinner}></div>
                      <span>Loading...</span>
                    </td>
                  </tr>
                ) : inquiries.length > 0 ? (
                  inquiries.map((inquiry) => {
                    const thumbnailImage = getFirstImage(inquiry);
                    const inquiryValue = getInquiryValue(inquiry);
                    return (
                      <tr
                        key={inquiry.id}
                        style={styles.tr}
                        onClick={() => handleRowClick(inquiry.id)}
                        className="clickable-row"
                      >
                        <td
                          style={styles.td}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isInquirySelected(inquiry.id)}
                            onChange={() => toggleSelectInquiry(inquiry.id)}
                          />
                        </td>
                        <td
                          style={styles.td}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {thumbnailImage ? (
                            <img
                              src={thumbnailImage}
                              alt="Inquiry"
                              style={styles.productImage}
                            />
                          ) : (
                            <div style={styles.imagePlaceholder}>🖼️</div>
                          )}
                        </td>
                        <td style={styles.td}>
                          <strong>{inquiry.inquiry_no || "-"}</strong>
                        </td>
                        <td style={styles.tdcustomer}>
                          <strong title={inquiry.customer_name}>
                            {inquiry.customer_name || "-"}
                          </strong>
                        </td>
                        <td style={styles.td}>{inquiry.buyer_name || "-"}</td>
                        {/* ========== NEW: Department column ========== */}
                        <td style={styles.td}>
                          <span style={styles.departmentBadge}>
                            {inquiry.department_name || "-"}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {truncateName(inquiry.same_style, 12) || "-"}
                        </td>
                        <td style={styles.textTd}>
                          {truncateByPercentage(inquiry.fabrication, 50) || "-"}
                        </td>
                        <td style={styles.td}>
                          {truncateName(inquiry.garment, 8) || "-"}
                        </td>
                        <td
                          style={{
                            ...styles.td,
                            color: "#10b981",
                            fontWeight: "600",
                          }}
                        >
                          {inquiry.order_quantity?.toLocaleString() || "-"}
                        </td>
                        <td style={styles.td}>
                          {formatDate(inquiry.shipment_date)}
                        </td>
                        <td
                          style={{
                            ...styles.td,
                            color: "#f59e0b",
                            fontWeight: "600",
                          }}
                        >
                          {formatPrice(inquiry.target_price)}
                        </td>
                        <td
                          style={{
                            ...styles.td,
                            color: "#3b82f6",
                            fontWeight: "600",
                          }}
                        >
                          {formatPrice(inquiry.offer_price)}
                        </td>
                        <td
                          style={{
                            ...styles.td,
                            color: "#10b981",
                            fontWeight: "600",
                          }}
                        >
                          {formatPrice(inquiry.confirmed_price)}
                        </td>
                        <td
                          style={{
                            ...styles.td,
                            color: "#8b5cf6",
                            fontWeight: "600",
                          }}
                        >
                          {formatPrice(inquiry.texweave_price)}
                        </td>
                        <td
                          style={{
                            ...styles.td,
                            color: "#ef4444",
                            fontWeight: "600",
                          }}
                        >
                          ${inquiryValue.toFixed(3)}
                        </td>
                        <td style={styles.td}>
                          {renderSupplierPrices(inquiry)}
                        </td>
                        <td style={styles.td}>
                          <span style={styles.colorSizeRange}>
                            {inquiry.size_range_display || "-"}
                          </span>
                        </td>
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
                        <td
                          style={styles.td}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <textarea
                            rows={5}
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
                            style={styles.remarksInput}
                            placeholder="..."
                          />
                        </td>
                        <td
                          style={styles.td}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={styles.actionButtons}>
                            <button
                              onClick={() => openModal(inquiry)}
                              style={styles.actionButton}
                              title="Negotiate"
                            >
                              💬
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/inquiries/${inquiry.id}/costing`)
                              }
                              style={styles.costingButton}
                              title="View Costing"
                            >
                              💰
                            </button>
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="21" style={styles.emptyCell}>
                      No inquiries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <div style={styles.paginationLeft}>
                <span style={styles.paginationInfo}>
                  Page {currentPage} of {totalPages} | Total Inquiries:{" "}
                  {totalCount} | Total Qty: {totalQuantity.toLocaleString()}
                </span>
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
                  {(() => {
                    const maxVisible = 5;
                    let startPage = Math.max(
                      1,
                      currentPage - Math.floor(maxVisible / 2),
                    );
                    let endPage = Math.min(
                      totalPages,
                      startPage + maxVisible - 1,
                    );
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }
                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) pages.push(i);
                    return pages.map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={
                          pageNum === currentPage
                            ? styles.paginationButtonActive
                            : styles.paginationButtonNumber
                        }
                      >
                        {pageNum}
                      </button>
                    ));
                  })()}
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div style={styles.modalOverlay} onClick={closeEmailModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderIcon}>📧</div>
              <h3 style={styles.modalTitle}>Send Inquiry Email</h3>
              <button onClick={closeEmailModal} style={styles.modalClose}>
                ✕
              </button>
            </div>
            <div style={styles.modalContent}>
              {sendingEmail ? (
                <div style={styles.sendingContainer}>
                  <div style={styles.spinnerSmall}></div>
                  <p>Sending emails...</p>
                </div>
              ) : (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>From Email *</label>
                    <input
                      type="email"
                      value={emailData.from_email}
                      onChange={(e) =>
                        setEmailData({
                          ...emailData,
                          from_email: e.target.value,
                        })
                      }
                      placeholder="your.email@company.com"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>To Email *</label>
                    <input
                      type="email"
                      value={emailData.to_email}
                      onChange={(e) =>
                        setEmailData({ ...emailData, to_email: e.target.value })
                      }
                      placeholder="supplier@company.com"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Message (Optional)</label>
                    <textarea
                      rows={4}
                      value={emailData.custom_message}
                      onChange={(e) =>
                        setEmailData({
                          ...emailData,
                          custom_message: e.target.value,
                        })
                      }
                      style={styles.formTextarea}
                      placeholder="Write your message here..."
                    />
                  </div>
                  <div style={styles.selectedInquiriesList}>
                    <label style={styles.formLabel}>
                      Selected ({selectedInquiries.length})
                    </label>
                    <div style={styles.selectedList}>
                      {selectedInquiries.map((id) => {
                        const inquiry = inquiries.find((i) => i.id === id);
                        return inquiry ? (
                          <div key={id} style={styles.selectedItem}>
                            <span>📄</span>
                            <span>{inquiry.inquiry_no}</span>
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
                  !emailData.to_email ||
                  selectedInquiries.length === 0
                }
              >
                {sendingEmail ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Negotiation Modal */}
      {showModal && selectedInquiry && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div
            style={styles.negotiationModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderIcon}>💬</div>
              <h3 style={styles.modalTitle}>
                Negotiation — {selectedInquiry.inquiry_no}
              </h3>
              <button onClick={closeModal} style={styles.modalClose}>
                ✕
              </button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.inquirySummary}>
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Order Qty</span>
                    <span style={styles.summaryValue}>
                      {selectedInquiry.order_quantity?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Customer</span>
                    <span style={styles.summaryValue}>
                      {selectedInquiry.customer_name || "-"}
                    </span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Buyer</span>
                    <span style={styles.summaryValue}>
                      {selectedInquiry.buyer_name || "-"}
                    </span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Status</span>
                    <span
                      style={{
                        ...styles.statusBadgeSmall,
                        background:
                          statusColors[selectedInquiry.current_status] ||
                          statusColors.default,
                      }}
                    >
                      {selectedInquiry.current_status || "pending"}
                    </span>
                  </div>
                </div>
              </div>

              {savedNegotiations.length > 0 && (
                <div style={styles.savedNegotiationsSection}>
                  <h4 style={styles.sectionTitle}>
                    📜 History ({savedNegotiations.length})
                  </h4>
                  <div style={styles.savedList}>
                    {savedNegotiations.map((neg, index) => (
                      <div key={neg.id} style={styles.savedItem}>
                        <div style={styles.savedHeader}>
                          <span style={styles.savedRound}>
                            Round {savedNegotiations.length - index}
                          </span>
                          <span style={styles.savedDate}>
                            {new Date(neg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div style={styles.savedPrices}>
                          {neg.buyer_price && (
                            <span style={styles.buyerPriceTag}>
                              💰 Buyer: $
                              {parseFloat(neg.buyer_price).toFixed(3)}
                            </span>
                          )}
                          {neg.supplier_price && (
                            <span style={styles.supplierPriceTag}>
                              🏭 Supplier: $
                              {parseFloat(neg.supplier_price).toFixed(3)}
                            </span>
                          )}
                        </div>
                        {neg.comment && (
                          <div style={styles.savedComment}>
                            💬 {neg.comment}
                          </div>
                        )}
                        <div style={styles.savedFooter}>
                          <div style={styles.savedBy}>
                            By: {neg.created_by || "System"}
                          </div>
                          <button
                            onClick={() => deleteNegotiation(neg.id)}
                            style={styles.deleteNegotiationBtn}
                            title="Delete this round"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.negotiationSections}>
                <div style={styles.negotiationSection}>
                  <h4 style={styles.sectionTitle}>➕ New Round</h4>
                  <div style={styles.inputGroup}>
                    <label>Buyer Price ($)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={buyerPrice}
                      onChange={(e) => setBuyerPrice(e.target.value)}
                      style={styles.formInput}
                      placeholder="Enter buyer price"
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label>Supplier Price ($)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={supplierPrice}
                      onChange={(e) => setSupplierPrice(e.target.value)}
                      style={styles.formInput}
                      placeholder="Enter supplier price"
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label>Comment</label>
                    <textarea
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      style={styles.formTextarea}
                      placeholder="Add comments..."
                    />
                  </div>
                  <button
                    onClick={addPendingNegotiation}
                    disabled={!buyerPrice && !supplierPrice && !comment}
                    style={styles.addButton}
                  >
                    + Add to Pending
                  </button>
                </div>

                <div style={styles.negotiationSection}>
                  <h4 style={styles.sectionTitle}>
                    ⏳ Pending ({pendingNegotiations.length})
                  </h4>
                  <div style={styles.pendingList}>
                    {pendingNegotiations.length === 0 ? (
                      <div style={styles.emptyPending}>
                        No pending negotiations
                      </div>
                    ) : (
                      pendingNegotiations.map((negotiation, index) => (
                        <div key={negotiation.id} style={styles.pendingItem}>
                          <div style={styles.pendingHeader}>
                            <span style={styles.pendingRound}>
                              Round {pendingNegotiations.length - index}
                            </span>
                            <button
                              onClick={() =>
                                removePendingNegotiation(negotiation.id)
                              }
                              style={styles.removePendingBtn}
                            >
                              ✕
                            </button>
                          </div>
                          <div style={styles.pendingPrices}>
                            {negotiation.buyer_price && (
                              <span>
                                💰 Buyer: ${negotiation.buyer_price.toFixed(3)}
                              </span>
                            )}
                            {negotiation.supplier_price && (
                              <span>
                                🏭 Supplier: $
                                {negotiation.supplier_price.toFixed(3)}
                              </span>
                            )}
                          </div>
                          {negotiation.comment && (
                            <div style={styles.pendingComment}>
                              💬 {negotiation.comment}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <div style={styles.footerCheckbox}>
                <input
                  type="checkbox"
                  id="statusCheckbox"
                  checked={updateStatusToConfirmed}
                  onChange={handleStatusCheckboxChange}
                />
                <label htmlFor="statusCheckbox" style={{ cursor: "pointer" }}>
                  Update to "Confirmed"
                </label>
              </div>
              <div style={styles.footerButtons}>
                <button onClick={closeModal} style={styles.secondaryButton}>
                  Cancel
                </button>
                <button
                  onClick={saveAllNegotiations}
                  disabled={saving || pendingNegotiations.length === 0}
                  style={styles.primaryButton}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========== UPDATED STYLES - Added departmentBadge ==========
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
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  btnDevelopment: {
    background: "linear-gradient(135deg, #f6ec5c, #6d28d9)",
    color: "white",
    padding: "6px 14px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  btnCosting: {
    background: "linear-gradient(135deg, #5cf664, #6d28d9)",
    color: "white",
    padding: "6px 14px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  btnBulkCosting: {
    background: "linear-gradient(135deg, #3aede4, #5b21b6)",
    color: "white",
    padding: "6px 14px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
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
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    overflow: "visible",
    position: "relative",
    zIndex: 100,
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
  filterBody: { padding: "12px", overflow: "visible", position: "relative" },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
    marginBottom: "10px",
    position: "relative",
    zIndex: 1,
  },
  filterWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    position: "relative",
    zIndex: 101,
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    position: "relative",
  },
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
    width: "100%",
    boxSizing: "border-box",
  },
  filterSelect: {
    padding: "6px 8px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    background: "white",
    width: "100%",
    boxSizing: "border-box",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    position: "relative",
  },
  filterSelectActive: {
    borderColor: "#2563eb",
    borderWidth: "1.5px",
    borderStyle: "solid",
  },
  searchButtons: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "10px",
  },
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
  dropdownMenuMultiSelect: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    zIndex: 99999,
    maxHeight: "400px",
    overflow: "hidden",
    minWidth: "300px",
    width: "auto",
  },
  dropdownSearch: {
    padding: "10px 12px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dropdownSearchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "13px",
  },
  dropdownOptionsMultiSelect: {
    maxHeight: "300px",
    overflowY: "auto",
  },
  dropdownOptionMultiSelect: {
    padding: "8px 12px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dropdownOptionSelected: {
    background: "#eff6ff",
    color: "#2563eb",
  },
  multiSelectActions: {
    display: "flex",
    gap: "8px",
    padding: "8px 12px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  multiSelectActionBtn: {
    flex: 1,
    padding: "4px 8px",
    fontSize: "12px",
    fontWeight: 500,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
    borderRadius: "4px",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "#475569",
  },
  customCheckbox: {
    width: "16px",
    height: "16px",
    border: "2px solid #cbd5e1",
    borderRadius: "4px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    transition: "all 0.2s",
  },
  customCheckboxChecked: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
    color: "white",
  },
  placeholder: { color: "#94a3b8" },
  chevron: { color: "#94a3b8", fontSize: "10px", marginLeft: "auto" },
  clearIcon: {
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "10px",
    marginLeft: "auto",
  },
  selectedTagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #e2e8f0",
  },
  selectedTagsLabel: { fontSize: "12px", fontWeight: 500, color: "#64748b" },
  selectedTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px 4px 12px",
    background: "#eff6ff",
    border: "1px solid #2563eb",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#2563eb",
  },
  selectedTagRemove: {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    padding: "2px",
    borderRadius: "50%",
  },
  emptyDropdownMessage: {
    padding: "16px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
  },
  selectionBanner: {
    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    borderRadius: "8px",
    padding: "8px 12px",
    marginBottom: "12px",
  },
  selectionContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  },
  selectionInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  selectionBadge: {
    background: "#3b82f6",
    color: "white",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
  },
  selectionStats: {
    display: "flex",
    gap: "10px",
    fontSize: "11px",
    color: "#1e40af",
    fontWeight: "500",
  },
  selectionActions: { display: "flex", gap: "6px" },
  btnEmail: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    padding: "5px 12px",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    fontSize: "11px",
    cursor: "pointer",
  },
  btnClearSelection: {
    background: "white",
    color: "#dc2626",
    padding: "5px 12px",
    border: "1.5px solid #fecaca",
    borderRadius: "6px",
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
    zIndex: 5,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1400px",
    fontSize: "11px",
    position: "relative",
  },
  th: {
    padding: "10px 12px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "600",
    color: "#475569",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    borderTop: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  tableTitle: { display: "flex", alignItems: "center", gap: "8px" },
  tableCount: {
    background: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "12px",
    fontSize: "10px",
    color: "#475569",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background 0.2s",
    "&:hover": { background: "#f8fafc" },
  },
  td: { padding: "8px 10px", fontSize: "11px", color: "#334155" },
  tdcustomer: {
    padding: "8px 10px",
    fontSize: "11px",
    color: "#334155",
    minWidth: "100px",
    maxWidth: "100px",
  },
  textTd: {
    padding: "8px 10px",
    fontSize: "11px",
    color: "#334155",
    whiteSpace: "normal",
    wordBreak: "break-word",
    minWidth: "100px",
    maxWidth: "170px",
    verticalAlign: "top",
  },
  // ========== NEW: Department badge style ==========
  departmentBadge: {
    display: "inline-block",
    padding: "2px 8px",
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "500",
  },
  productImage: {
    width: "28px",
    height: "28px",
    objectFit: "cover",
    borderRadius: "4px",
  },
  imagePlaceholder: {
    width: "28px",
    height: "28px",
    background: "#f1f5f9",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
  },
  colorSizeRange: {
    display: "inline-block",
    padding: "2px 4px",
    background: "#f1f5f9",
    borderRadius: "8px",
    fontSize: "9px",
    fontWeight: "500",
    color: "#475569",
  },
  statusBadge: {
    display: "inline-block",
    padding: "2px 6px",
    borderRadius: "12px",
    fontSize: "9px",
    fontWeight: "600",
    color: "white",
    textTransform: "capitalize",
  },
  statusBadgeSmall: {
    display: "inline-block",
    padding: "2px 5px",
    borderRadius: "10px",
    fontSize: "9px",
    fontWeight: "600",
    color: "white",
  },
  remarksInput: {
    width: "100%",
    minWidth: "150px",
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1.5px solid #e2e8f0",
    fontSize: "11px",
    resize: "vertical",
    minHeight: "24px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  actionButtons: { display: "flex", gap: "4px" },
  actionButton: {
    background: "white",
    border: "1px solid #e2e8f0",
    padding: "3px 6px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
  },
  costingButton: {
    background: "white",
    border: "1px solid #10b981",
    padding: "3px 6px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
    color: "#10b981",
  },
  deleteButton: {
    background: "white",
    border: "1px solid #fecaca",
    padding: "3px 6px",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#dc2626",
    fontSize: "11px",
  },
  supplierPrices: { fontSize: "8px" },
  supplierPriceItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "3px",
    fontSize: "8px",
    marginBottom: "1px",
  },
  supplierName: {
    color: "#64748b",
    maxWidth: "40px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  priceValue: { fontWeight: "600", color: "#0f172a" },
  noPrices: { color: "#94a3b8", fontSize: "8px", fontStyle: "italic" },
  loadingCell: { padding: "30px", textAlign: "center" },
  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 8px",
  },
  spinnerSmall: {
    width: "18px",
    height: "18px",
    border: "2px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 8px",
  },
  emptyCell: { padding: "30px", textAlign: "center", color: "#94a3b8" },
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
    fontSize: "12px",
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
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "450px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  negotiationModal: {
    background: "white",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "850px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalHeader: {
    padding: "14px 18px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f8fafc",
  },
  modalHeaderIcon: { fontSize: "18px" },
  modalTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
    flex: 1,
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "#94a3b8",
    padding: "4px",
  },
  modalContent: { padding: "16px", overflow: "auto", flex: 1 },
  modalFooter: {
    padding: "12px 16px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f8fafc",
  },
  formGroup: { marginBottom: "12px" },
  formLabel: {
    display: "block",
    marginBottom: "4px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#334155",
  },
  formInput: {
    width: "100%",
    padding: "7px 8px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
  },
  formTextarea: {
    width: "100%",
    padding: "7px 8px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    resize: "vertical",
    fontFamily: "inherit",
  },
  selectedInquiriesList: { marginTop: "10px" },
  selectedList: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "6px",
    maxHeight: "80px",
    overflowY: "auto",
    background: "#f8fafc",
  },
  selectedItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 0",
    fontSize: "11px",
  },
  sendingContainer: { textAlign: "center", padding: "20px" },
  primaryButton: {
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "white",
    padding: "7px 14px",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "12px",
  },
  secondaryButton: {
    background: "white",
    color: "#475569",
    padding: "7px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "6px",
    fontWeight: "500",
    cursor: "pointer",
    fontSize: "12px",
  },
  inquirySummary: {
    background: "#f8fafc",
    borderRadius: "10px",
    padding: "10px",
    marginBottom: "16px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
  },
  summaryItem: { display: "flex", flexDirection: "column", gap: "3px" },
  summaryLabel: {
    fontSize: "9px",
    color: "#64748b",
    textTransform: "uppercase",
  },
  summaryValue: { fontSize: "12px", fontWeight: "600", color: "#0f172a" },
  savedNegotiationsSection: { marginBottom: "16px" },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 10px 0",
  },
  savedList: {
    maxHeight: "180px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  savedItem: {
    background: "#f0fdf4",
    borderRadius: "8px",
    padding: "8px",
    border: "1px solid #bbf7d0",
  },
  savedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "5px",
  },
  savedRound: { fontWeight: "600", color: "#065f46", fontSize: "11px" },
  savedDate: { fontSize: "9px", color: "#64748b" },
  savedPrices: { display: "flex", gap: "10px", marginBottom: "5px" },
  buyerPriceTag: { fontSize: "10px", color: "#1d4ed8", fontWeight: "500" },
  supplierPriceTag: { fontSize: "10px", color: "#b45309", fontWeight: "500" },
  savedComment: {
    fontSize: "10px",
    color: "#334155",
    padding: "5px",
    background: "#fef3c7",
    borderRadius: "5px",
    marginTop: "5px",
  },
  savedBy: { fontSize: "8px", color: "#64748b", marginTop: "3px" },
  savedFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "8px",
    paddingTop: "5px",
    borderTop: "1px solid #e2e8f0",
  },
  deleteNegotiationBtn: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "4px",
    padding: "2px 8px",
    fontSize: "10px",
    cursor: "pointer",
    color: "#dc2626",
  },
  negotiationSections: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  negotiationSection: {
    background: "white",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  inputGroup: { padding: "10px", borderBottom: "1px solid #f1f5f9" },
  addButton: {
    width: "calc(100% - 20px)",
    margin: "10px",
    padding: "6px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "11px",
  },
  pendingList: { maxHeight: "250px", overflowY: "auto", padding: "8px" },
  pendingItem: {
    background: "#fffbeb",
    borderRadius: "8px",
    padding: "8px",
    marginBottom: "8px",
    border: "1px solid #fde68a",
  },
  pendingHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "5px",
  },
  pendingRound: { fontWeight: "600", color: "#d97706", fontSize: "11px" },
  removePendingBtn: {
    background: "none",
    border: "none",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "11px",
    padding: "3px",
  },
  pendingPrices: {
    display: "flex",
    gap: "10px",
    marginBottom: "5px",
    fontSize: "10px",
  },
  pendingComment: {
    fontSize: "10px",
    padding: "5px",
    background: "#fef3c7",
    borderRadius: "5px",
    marginTop: "5px",
  },
  emptyPending: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "20px",
    fontSize: "11px",
  },
  footerCheckbox: { display: "flex", alignItems: "center", gap: "5px" },
  footerButtons: { display: "flex", gap: "8px" },
};

// Add CSS animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .clickable-row:hover { background: #f8fafc; }
  `;
  document.head.appendChild(style);
}

export default Inquiry;