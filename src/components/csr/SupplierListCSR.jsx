// SupplierListCSR.jsx - Updated with new compliance logic
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiBell,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiClock,
  FiEdit2,
  FiEye,
  FiInbox,
  FiLayers,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { getSuppliers, deleteSupplier } from "../../api/supplierApi";

// Enhanced color system with better contrast and professional palette
const colors = {
  primary: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
  },
  secondary: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  danger: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
  info: {
    50: "#ecfeff",
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4",
    600: "#0891b2",
    700: "#0e7490",
    800: "#155e75",
    900: "#164e63",
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
};

// Notification days
const NOTIFICATION_DAYS = [90, 75, 60, 45, 30, 15];

// UPDATED: COMPLIANCE STATUS - Based on new rules
// Compliant: All documents valid with >30 days remaining
// Under Review: Documents expiring within 30 days (days <= 30 AND > 0)
// Non-Compliant: Expired documents (days <= 0)
const getComplianceStatus = (supplier) => {
  const daysRemainingList = [
    supplier.bsci_validity_days_remaining,
    supplier.sedex_validity_days_remaining,
    supplier.wrap_validity_days_remaining,
    supplier.trade_license_days_remaining,
    supplier.factory_license_days_remaining,
    supplier.fire_license_days_remaining,
    supplier.oeko_tex_validity_days_remaining,
    supplier.gots_validity_days_remaining,
    supplier.iso_9001_validity_days_remaining,
    supplier.iso_14001_validity_days_remaining,
    supplier.iso_45001_validity_days_remaining,
  ].filter((days) => days !== null && days !== undefined);

  // Check for expired items (days <= 0)
  const hasExpiredItems = daysRemainingList.some((days) => days <= 0);

  // Check for items expiring within 30 days (days > 0 AND days <= 30)
  const hasExpiringWithin30Days = daysRemainingList.some(
    (days) => days > 0 && days <= 30,
  );

  // Non-Compliant: Expired items
  if (hasExpiredItems) {
    return "non_compliant";
  }

  // Under Review: Items expiring within 30 days
  if (hasExpiringWithin30Days) {
    return "under_review";
  }

  // Compliant: All documents valid with >30 days remaining
  if (daysRemainingList.length > 0) {
    return "compliant";
  }

  // Default: No documents - considered under review
  return "under_review";
};

// UPDATED: Get detailed compliance reason based on new rules
const getComplianceReason = (supplier) => {
  const daysRemainingList = [
    { field: "BSCI", days: supplier.bsci_validity_days_remaining },
    { field: "SEDEX", days: supplier.sedex_validity_days_remaining },
    { field: "WRAP", days: supplier.wrap_validity_days_remaining },
    { field: "Trade License", days: supplier.trade_license_days_remaining },
    { field: "Factory License", days: supplier.factory_license_days_remaining },
    { field: "Fire License", days: supplier.fire_license_days_remaining },
    { field: "Oeko-Tex", days: supplier.oeko_tex_validity_days_remaining },
    { field: "GOTS", days: supplier.gots_validity_days_remaining },
    { field: "ISO 9001", days: supplier.iso_9001_validity_days_remaining },
    { field: "ISO 14001", days: supplier.iso_14001_validity_days_remaining },
  ].filter((item) => item.days !== null && item.days !== undefined);

  // Check for expired items first
  const expired = daysRemainingList.filter((item) => item.days <= 0);
  if (expired.length > 0) {
    return `Expired: ${expired.map((e) => e.field).join(", ")}`;
  }

  // Check for items expiring within 30 days
  const expiringWithin30 = daysRemainingList.filter(
    (item) => item.days <= 30 && item.days > 0,
  );
  if (expiringWithin30.length > 0) {
    return `Expiring ≤30 days: ${expiringWithin30.map((c) => `${c.field} (${c.days}d)`).join(", ")}`;
  }

  // Check for items expiring within 60 days (just for info)
  const expiringWithin60 = daysRemainingList.filter(
    (item) => item.days <= 60 && item.days > 30,
  );
  if (expiringWithin60.length > 0) {
    return `Expiring soon: ${expiringWithin60.map((w) => `${w.field} (${w.days}d)`).join(", ")}`;
  }

  return "All documents valid (>30 days remaining)";
};

// Status styles for compliance status
const complianceStatusStyles = {
  compliant: {
    bg: colors.success[50],
    text: colors.success[700],
    border: colors.success[200],
    label: "Compliant",
    icon: <FiCheckCircle />,
    dot: colors.success[500],
  },
  non_compliant: {
    bg: colors.danger[50],
    text: colors.danger[700],
    border: colors.danger[200],
    label: "Non-Compliant",
    icon: <FiAlertTriangle />,
    dot: colors.danger[500],
  },
  under_review: {
    bg: colors.warning[50],
    text: colors.warning[700],
    border: colors.warning[200],
    label: "Under Review",
    icon: <FiClock />,
    dot: colors.warning[500],
  },
};

// Check if supplier has expiring certifications (within notification days)
const hasExpiringCertifications = (supplier) => {
  const daysFields = [
    "bsci_validity_days_remaining",
    "sedex_validity_days_remaining",
    "wrap_validity_days_remaining",
    "security_audit_validity_days_remaining",
    "oeko_tex_validity_days_remaining",
    "gots_validity_days_remaining",
    "ocs_validity_days_remaining",
    "grs_validity_days_remaining",
    "rcs_validity_days_remaining",
    "iso_9001_validity_days_remaining",
    "iso_14001_validity_days_remaining",
    "trade_license_days_remaining",
    "factory_license_days_remaining",
    "fire_license_days_remaining",
    "membership_days_remaining",
    "group_insurance_days_remaining",
    "boiler_license_days_remaining",
    "berc_days_remaining",
    "drinking_water_license_days_remaining",
  ];

  return daysFields.some((field) => {
    const days = supplier[field];
    return (
      days !== null && days !== undefined && NOTIFICATION_DAYS.includes(days)
    );
  });
};

// Get expiring certifications list
const getExpiringCertifications = (supplier) => {
  const expiring = [];
  const certMap = [
    { field: "bsci_validity_days_remaining", name: "BSCI" },
    { field: "sedex_validity_days_remaining", name: "SEDEX" },
    { field: "wrap_validity_days_remaining", name: "WRAP" },
    { field: "security_audit_validity_days_remaining", name: "CTPAT" },
    { field: "oeko_tex_validity_days_remaining", name: "Oeko-Tex" },
    { field: "gots_validity_days_remaining", name: "GOTS" },
    { field: "ocs_validity_days_remaining", name: "OCS" },
    { field: "grs_validity_days_remaining", name: "GRS" },
    { field: "rcs_validity_days_remaining", name: "RCS" },
    { field: "iso_9001_validity_days_remaining", name: "ISO 9001" },
    { field: "iso_14001_validity_days_remaining", name: "ISO 14001" },
    { field: "trade_license_days_remaining", name: "Trade License" },
    { field: "factory_license_days_remaining", name: "Factory License" },
    { field: "fire_license_days_remaining", name: "Fire License" },
    { field: "membership_days_remaining", name: "Membership" },
    { field: "group_insurance_days_remaining", name: "Group Insurance" },
    { field: "boiler_license_days_remaining", name: "Boiler License" },
    { field: "berc_days_remaining", name: "BERC License" },
    {
      field: "drinking_water_license_days_remaining",
      name: "Drinking Water License",
    },
  ];

  certMap.forEach((cert) => {
    const days = supplier[cert.field];
    if (
      days !== null &&
      days !== undefined &&
      NOTIFICATION_DAYS.includes(days)
    ) {
      expiring.push({ type: cert.name, days });
    }
  });

  return expiring;
};

// Get unique categories from suppliers
const getUniqueCategories = (suppliers) => {
  const categories = new Set();
  suppliers.forEach((supplier) => {
    if (supplier.supplier_category) {
      categories.add(supplier.supplier_category);
    }
  });
  return Array.from(categories).sort();
};

const SupplierListCSR = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [actionError, setActionError] = useState("");

  // Parse URL params on mount and when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get("status");
    const expiringParam = params.get("filter");
    const categoryParam = params.get("category");

    let newFilterStatus = "all";
    let newFilterExpiring = false;
    let newFilterCategory = "all";

    if (statusParam === "compliant") {
      newFilterStatus = "compliant";
    } else if (statusParam === "non_compliant") {
      newFilterStatus = "non_compliant";
    } else if (statusParam === "under_review") {
      newFilterStatus = "under_review";
    } else if (expiringParam === "expiring" || expiringParam === "critical") {
      newFilterExpiring = true;
    }

    if (categoryParam && categoryParam !== "all") {
      newFilterCategory = categoryParam;
    }

    setFilterStatus(newFilterStatus);
    setFilterExpiring(newFilterExpiring);
    setFilterCategory(newFilterCategory);
    setCurrentPage(1);

    fetchSuppliers();
  }, [location.search]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await getSuppliers();
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get compliance stats for the header
  const getComplianceStats = () => {
    let compliant = 0;
    let nonCompliant = 0;
    let underReview = 0;

    suppliers.forEach((supplier) => {
      const status = getComplianceStatus(supplier);
      if (status === "compliant") compliant++;
      else if (status === "non_compliant") nonCompliant++;
      else underReview++;
    });

    return { compliant, nonCompliant, underReview };
  };

  const stats = getComplianceStats();
  const expiringCount = suppliers.filter(hasExpiringCertifications).length;
  const uniqueCategories = getUniqueCategories(suppliers);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedSuppliers = (suppliersList) => {
    if (!sortConfig.key) return suppliersList;

    return [...suppliersList].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "compliance_status") {
        aValue = getComplianceStatus(a);
        bValue = getComplianceStatus(b);
      }

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!supplier) return false;

    if (filterExpiring && !hasExpiringCertifications(supplier)) {
      return false;
    }

    if (filterStatus !== "all") {
      const complianceStatus = getComplianceStatus(supplier);
      if (complianceStatus !== filterStatus) {
        return false;
      }
    }

    if (filterCategory !== "all") {
      const supplierCategory = supplier.supplier_category;
      if (supplierCategory !== filterCategory) {
        return false;
      }
    }

    const name = (supplier.supplier_name || supplier.name || "").toLowerCase();
    const vendorId = String(
      supplier.supplier_id || supplier.vendor_id || "",
    ).toLowerCase();
    const email = (supplier.email || "").toLowerCase();
    const location = (supplier.location || "").toLowerCase();
    const category = (supplier.supplier_category || "").toLowerCase();
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !search ||
      name.includes(search) ||
      vendorId.includes(search) ||
      email.includes(search) ||
      location.includes(search) ||
      category.includes(search);

    return matchesSearch;
  });

  const sortedSuppliers = getSortedSuppliers(filteredSuppliers);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSuppliers.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(sortedSuppliers.length / itemsPerPage);

  // After deletes or filter changes, don't leave the user on an empty page.
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?"))
      return;

    try {
      setDeletingId(id);
      setActionError("");
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      setSelectedSuppliers((prev) => prev.filter((s) => s !== id));
    } catch (error) {
      console.error("Error deleting supplier:", error);
      setActionError("Could not delete the supplier. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSuppliers.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedSuppliers.length} suppliers?`,
      )
    )
      return;

    // Remove each supplier from the list as soon as its delete succeeds, so
    // a failure halfway through doesn't leave deleted rows on screen.
    setActionError("");
    const failed = [];
    for (const id of selectedSuppliers) {
      try {
        await deleteSupplier(id);
        setSuppliers((prev) => prev.filter((s) => s.id !== id));
      } catch (error) {
        console.error("Error deleting supplier:", id, error);
        failed.push(id);
      }
    }
    setSelectedSuppliers(failed);
    if (failed.length > 0) {
      setActionError(
        `${failed.length} supplier(s) could not be deleted. They are still selected - try again.`,
      );
    }
  };

  const handleSelectAll = () => {
    if (selectedSuppliers.length === currentItems.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(currentItems.map((s) => s.id));
    }
  };

  const handleSelect = (id) => {
    setSelectedSuppliers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterExpiring(false);
    setFilterCategory("all");
    setCurrentPage(1);
    window.history.replaceState({}, "", "/suppliersCSR");
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FiChevronDown className="sl-sort-idle" />;
    return sortConfig.direction === "asc" ? <FiChevronUp /> : <FiChevronDown />;
  };

  const getStatusBadge = (supplier) => {
    const status = getComplianceStatus(supplier);
    const style =
      complianceStatusStyles[status] || complianceStatusStyles.under_review;
    return { status, style };
  };

  const handleCategoryChange = (category) => {
    setFilterCategory(category);
    setCurrentPage(1);
    const params = new URLSearchParams(location.search);
    if (category && category !== "all") {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    navigate(`/suppliersCSR?${params.toString()}`, { replace: true });
  };

  const handleStatusFilter = (status) => {
    const params = new URLSearchParams();
    if (filterCategory !== "all") params.set("category", filterCategory);
    if (status !== "all") {
      params.set("status", status);
    }
    navigate(`/suppliersCSR?${params.toString()}`, { replace: true });
  };

  const handleExpiringFilter = () => {
    const params = new URLSearchParams();
    if (filterCategory !== "all") params.set("category", filterCategory);
    params.set("filter", "expiring");
    navigate(`/suppliersCSR?${params.toString()}`, { replace: true });
  };


  const hasFilters =
    searchTerm || filterStatus !== "all" || filterExpiring || filterCategory !== "all";

  const activeChips = [
    filterStatus !== "all" && {
      key: "status",
      label: complianceStatusStyles[filterStatus]?.label || filterStatus,
      onRemove: () => handleStatusFilter("all"),
    },
    filterExpiring && {
      key: "expiring",
      label: "Expiring documents",
      onRemove: () => handleStatusFilter("all"),
    },
    filterCategory !== "all" && {
      key: "category",
      label: `Category: ${filterCategory}`,
      onRemove: () => handleCategoryChange("all"),
    },
    searchTerm && {
      key: "search",
      label: `Search: "${searchTerm}"`,
      onRemove: () => setSearchTerm(""),
    },
  ].filter(Boolean);

  const kpis = [
    {
      key: "all",
      label: "Total Suppliers",
      hint: "In the CSR register",
      value: suppliers.length,
      icon: <FiLayers />,
      tone: "blue",
      active: filterStatus === "all" && !filterExpiring,
      onClick: () => handleStatusFilter("all"),
    },
    {
      key: "compliant",
      label: "Compliant",
      hint: "> 30 days remaining",
      value: stats.compliant,
      icon: <FiCheckCircle />,
      tone: "green",
      active: filterStatus === "compliant",
      onClick: () => handleStatusFilter("compliant"),
    },
    {
      key: "under_review",
      label: "Under Review",
      hint: "Expiring within 30 days",
      value: stats.underReview,
      icon: <FiClock />,
      tone: "amber",
      active: filterStatus === "under_review",
      onClick: () => handleStatusFilter("under_review"),
    },
    {
      key: "non_compliant",
      label: "Non-Compliant",
      hint: "Expired documents",
      value: stats.nonCompliant,
      icon: <FiAlertTriangle />,
      tone: "red",
      active: filterStatus === "non_compliant",
      onClick: () => handleStatusFilter("non_compliant"),
    },
    {
      key: "expiring",
      label: "Need Attention",
      hint: "At a reminder milestone",
      value: expiringCount,
      icon: <FiBell />,
      tone: "violet",
      active: filterExpiring,
      onClick: handleExpiringFilter,
    },
  ];

  const daysTone = (days) => (days <= 30 ? "red" : days <= 60 ? "amber" : "blue");

  const initials = (name) =>
    (name || "?")
      .replace(/[^A-Za-z0-9 ]/g, " ")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?";

  const pageButtons = () => {
    const pages = [];
    const count = Math.min(5, totalPages);
    for (let i = 0; i < count; i++) {
      let page;
      if (totalPages <= 5 || currentPage <= 3) page = i + 1;
      else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
      else page = currentPage - 2 + i;
      pages.push(page);
    }
    return pages;
  };

  const SortHeader = ({ label, sortKey }) => (
    <th
      className={`sl-th sl-sortable ${sortConfig.key === sortKey ? "sorted" : ""}`}
      onClick={() => handleSort(sortKey)}
      aria-sort={
        sortConfig.key === sortKey
          ? sortConfig.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <span className="sl-th-inner">
        {label}
        {getSortIcon(sortKey)}
      </span>
    </th>
  );

  return (
    <div className="csr-sl">
      <style>{SUPPLIER_LIST_CSS}</style>

      {/* Header */}
      <header className="sl-header">
        <div>
          <div className="sl-eyebrow">CSR Compliance</div>
          <h1 className="sl-title">
            Suppliers
            <span className="sl-count">{suppliers.length}</span>
          </h1>
          <p className="sl-subtitle">
            Audit certificates, licences and compliance status across your supplier network.
          </p>
        </div>
        <div className="sl-header-actions">
          <button
            type="button"
            className="sl-btn sl-btn-ghost"
            onClick={fetchSuppliers}
            disabled={loading}
            title="Reload suppliers"
          >
            <FiRefreshCw className={loading ? "sl-spin" : ""} />
            Refresh
          </button>
          <Link to="/add-supplierCSR" className="sl-btn sl-btn-primary">
            <FiPlus />
            Add Supplier
          </Link>
        </div>
      </header>

      <div className="sl-body">
        {/* KPI cards */}
        <div className="sl-kpis">
          {kpis.map((k) => (
            <button
              type="button"
              key={k.key}
              className={`sl-kpi tone-${k.tone} ${k.active ? "active" : ""}`}
              onClick={k.onClick}
              disabled={loading}
            >
              <span className="sl-kpi-icon">{k.icon}</span>
              <span className="sl-kpi-text">
                <span className="sl-kpi-value">{loading ? "–" : k.value}</span>
                <span className="sl-kpi-label">{k.label}</span>
                <span className="sl-kpi-hint">{k.hint}</span>
              </span>
            </button>
          ))}
        </div>

        {actionError && (
          <div className="sl-alert" role="alert">
            <FiAlertTriangle />
            <span>{actionError}</span>
            <button type="button" className="sl-icon-btn" onClick={() => setActionError("")} title="Dismiss">
              <FiX />
            </button>
          </div>
        )}

        {/* Table card with toolbar */}
        <section className="sl-card">
          <div className="sl-toolbar">
            <div className="sl-search">
              <FiSearch className="sl-search-icon" />
              <input
                type="text"
                placeholder="Search by name, ID, email, location or category"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="sl-search-clear"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  title="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>

            <select
              className="sl-select"
              value={filterExpiring ? "expiring" : filterStatus}
              onChange={(e) =>
                e.target.value === "expiring"
                  ? handleExpiringFilter()
                  : handleStatusFilter(e.target.value)
              }
              aria-label="Compliance status"
            >
              <option value="all">All statuses</option>
              <option value="compliant">Compliant (&gt; 30 days)</option>
              <option value="under_review">Under Review (≤ 30 days)</option>
              <option value="non_compliant">Non-Compliant (expired)</option>
              <option value="expiring">Need attention (reminder due)</option>
            </select>

            <select
              className="sl-select"
              value={filterCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              aria-label="Category"
            >
              <option value="all">All categories</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {activeChips.length > 0 && (
            <div className="sl-chips">
              <span className="sl-chips-label">
                {filteredSuppliers.length} result{filteredSuppliers.length === 1 ? "" : "s"} for
              </span>
              {activeChips.map((chip) => (
                <span key={chip.key} className="sl-chip">
                  {chip.label}
                  <button type="button" onClick={chip.onRemove} title="Remove filter">
                    <FiX />
                  </button>
                </span>
              ))}
              <button type="button" className="sl-link-btn" onClick={clearAllFilters}>
                Clear all
              </button>
            </div>
          )}

          {selectedSuppliers.length > 0 && (
            <div className="sl-bulk">
              <span>
                <strong>{selectedSuppliers.length}</strong> selected
              </span>
              <div className="sl-bulk-actions">
                <button type="button" className="sl-link-btn" onClick={() => setSelectedSuppliers([])}>
                  Clear selection
                </button>
                <button type="button" className="sl-btn sl-btn-danger" onClick={handleBulkDelete}>
                  <FiTrash2 />
                  Delete selected
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="sl-state">
              <div className="sl-spinner" />
              <p>Loading suppliers…</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="sl-state">
              <div className="sl-state-icon">
                <FiInbox />
              </div>
              <h3>No suppliers found</h3>
              <p>{hasFilters ? "Try adjusting or clearing your filters." : "Add your first supplier to get started."}</p>
              {hasFilters ? (
                <button type="button" className="sl-btn sl-btn-ghost" onClick={clearAllFilters}>
                  Clear filters
                </button>
              ) : (
                <Link to="/add-supplierCSR" className="sl-btn sl-btn-primary">
                  <FiPlus />
                  Add Supplier
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="sl-table-wrap">
                <table className="sl-table">
                  <thead>
                    <tr>
                      <th className="sl-th sl-th-check">
                        <input
                          type="checkbox"
                          checked={
                            selectedSuppliers.length === currentItems.length && currentItems.length > 0
                          }
                          onChange={handleSelectAll}
                          aria-label="Select all on this page"
                        />
                      </th>
                      <SortHeader label="SL" sortKey="sl_no" />
                      <SortHeader label="Supplier" sortKey="supplier_name" />
                      <SortHeader label="Location" sortKey="location" />
                      <SortHeader label="Category" sortKey="supplier_category" />
                      <SortHeader label="Compliance" sortKey="compliance_status" />
                      <th className="sl-th">Upcoming expiries</th>
                      <th className="sl-th sl-th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((supplier, index) => {
                      const { status, style: statusStyle } = getStatusBadge(supplier);
                      const expiringCerts = getExpiringCertifications(supplier);
                      const complianceReason = getComplianceReason(supplier);
                      const name = supplier.supplier_name || supplier.name || "Unnamed";
                      const selected = selectedSuppliers.includes(supplier.id);

                      return (
                        <tr
                          key={supplier.id}
                          className={`sl-row status-${status} ${selected ? "selected" : ""}`}
                        >
                          <td className="sl-td sl-td-check">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => handleSelect(supplier.id)}
                              aria-label={`Select ${name}`}
                            />
                          </td>
                          <td className="sl-td">
                            <span className="sl-sl">{supplier.sl_no || indexOfFirstItem + index + 1}</span>
                          </td>
                          <td className="sl-td">
                            <Link to={`/suppliersCSR/${supplier.id}`} className="sl-supplier">
                              <span className="sl-avatar">{initials(name)}</span>
                              <span className="sl-supplier-text">
                                <span className="sl-supplier-name">{name}</span>
                                {supplier.email && (
                                  <span className="sl-supplier-email">{supplier.email}</span>
                                )}
                              </span>
                            </Link>
                          </td>
                          <td className="sl-td">
                            {supplier.location ? (
                              <span className="sl-location">
                                <FiMapPin />
                                {supplier.location}
                              </span>
                            ) : (
                              <span className="sl-muted">—</span>
                            )}
                          </td>
                          <td className="sl-td">
                            {supplier.supplier_category ? (
                              <span className="sl-pill">{supplier.supplier_category}</span>
                            ) : (
                              <span className="sl-muted">—</span>
                            )}
                          </td>
                          <td className="sl-td">
                            <span
                              className="sl-status"
                              style={{
                                background: statusStyle.bg,
                                color: statusStyle.text,
                                borderColor: statusStyle.border,
                              }}
                            >
                              {statusStyle.icon}
                              {statusStyle.label}
                            </span>
                            {status !== "compliant" && (
                              <div className={`sl-reason status-${status}`} title={complianceReason}>
                                {complianceReason}
                              </div>
                            )}
                          </td>
                          <td className="sl-td">
                            {expiringCerts.length > 0 ? (
                              <div className="sl-expiring">
                                {expiringCerts.slice(0, 3).map((cert) => (
                                  <span
                                    key={cert.type}
                                    className={`sl-exp tone-${daysTone(cert.days)}`}
                                    title={`${cert.type} - ${cert.days} days remaining`}
                                  >
                                    {cert.type}
                                    <b>{cert.days}d</b>
                                  </span>
                                ))}
                                {expiringCerts.length > 3 && (
                                  <span
                                    className="sl-more"
                                    title={expiringCerts
                                      .slice(3)
                                      .map((c) => `${c.type} (${c.days}d)`)
                                      .join(", ")}
                                  >
                                    +{expiringCerts.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="sl-muted">—</span>
                            )}
                          </td>
                          <td className="sl-td sl-td-actions">
                            <div className="sl-actions">
                              <Link to={`/suppliersCSR/${supplier.id}`} className="sl-icon-btn" title="View">
                                <FiEye />
                              </Link>
                              <Link to={`/edit-supplier/${supplier.id}`} className="sl-icon-btn" title="Edit">
                                <FiEdit2 />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDelete(supplier.id)}
                                disabled={deletingId === supplier.id}
                                className="sl-icon-btn danger"
                                title="Delete"
                              >
                                {deletingId === supplier.id ? <span className="sl-spinner sm" /> : <FiTrash2 />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="sl-pagination">
                <div className="sl-page-info">
                  Showing <strong>{indexOfFirstItem + 1}</strong>–
                  <strong>{Math.min(indexOfLastItem, filteredSuppliers.length)}</strong> of{" "}
                  <strong>{filteredSuppliers.length}</strong>
                  <label className="sl-page-size">
                    Rows
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="sl-pages">
                  <button
                    type="button"
                    className="sl-page"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    title="Previous page"
                  >
                    <FiChevronLeft />
                  </button>
                  {pageButtons().map((page) => (
                    <button
                      type="button"
                      key={page}
                      className={`sl-page ${currentPage === page ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="sl-ellipsis">…</span>
                      <button type="button" className="sl-page" onClick={() => setCurrentPage(totalPages)}>
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="sl-page"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    title="Next page"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

// Scoped under .csr-sl; same tokens as the CSR dashboard / department sidebar.
const SUPPLIER_LIST_CSS = `
.csr-sl {
  --c-bg: #f3f5f9;
  --c-surface: #ffffff;
  --c-soft: #f8fafc;
  --c-border: #e6eaf0;
  --c-border-strong: #d5dbe4;
  --c-text: #0f172a;
  --c-text-2: #334155;
  --c-muted: #64748b;
  --c-faint: #94a3b8;
  --c-primary: #2563eb;
  --c-primary-dark: #1d4ed8;
  --c-primary-soft: #eef4ff;
  --c-green: #15803d; --c-green-soft: #f0fdf4; --c-green-line: #bbf7d0;
  --c-amber: #b45309; --c-amber-soft: #fffbeb; --c-amber-line: #fde68a;
  --c-red: #b91c1c;   --c-red-soft: #fef2f2;   --c-red-line: #fecaca;
  --c-violet: #6d28d9; --c-violet-soft: #f5f3ff;
  --c-blue: #1d4ed8;  --c-blue-soft: #eff6ff;  --c-blue-line: #bfdbfe;
  min-height: 100vh;
  background: var(--c-bg);
  color: var(--c-text);
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
  font-size: 14px;
}
.csr-sl *, .csr-sl *::before, .csr-sl *::after { box-sizing: border-box; }

/* Header */
.csr-sl .sl-header {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  padding: 20px 28px 18px;
  background: rgba(255,255,255,0.94);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--c-border);
}
.csr-sl .sl-eyebrow {
  font-size: 11.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
  color: var(--c-primary); margin-bottom: 4px;
}
.csr-sl .sl-title {
  display: flex; align-items: center; gap: 10px;
  margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: var(--c-text);
}
.csr-sl .sl-count {
  font-size: 12.5px; font-weight: 600; color: var(--c-primary-dark);
  background: var(--c-primary-soft); border: 1px solid #dbe6fe; border-radius: 999px; padding: 2px 10px;
}
.csr-sl .sl-subtitle { margin: 4px 0 0; color: var(--c-muted); font-size: 13.5px; }
.csr-sl .sl-header-actions { display: flex; gap: 10px; }

/* Buttons */
.csr-sl .sl-btn {
  display: inline-flex; align-items: center; gap: 8px;
  height: 38px; padding: 0 16px; border-radius: 10px;
  font-size: 13.5px; font-weight: 600; text-decoration: none; cursor: pointer;
  border: 1px solid transparent; transition: background .15s, border-color .15s, box-shadow .15s, color .15s;
  white-space: nowrap;
}
.csr-sl .sl-btn:disabled { opacity: .6; cursor: not-allowed; }
.csr-sl .sl-btn-primary { background: var(--c-primary); color: #fff; box-shadow: 0 1px 2px rgba(37,99,235,.25); }
.csr-sl .sl-btn-primary:hover { background: var(--c-primary-dark); }
.csr-sl .sl-btn-ghost { background: var(--c-surface); color: var(--c-text-2); border-color: var(--c-border-strong); }
.csr-sl .sl-btn-ghost:hover:not(:disabled) { background: var(--c-soft); }
.csr-sl .sl-btn-danger { background: var(--c-red); color: #fff; height: 34px; padding: 0 14px; }
.csr-sl .sl-btn-danger:hover { background: #991b1b; }
.csr-sl .sl-link-btn {
  background: none; border: none; padding: 0; cursor: pointer;
  color: var(--c-primary); font-size: 13px; font-weight: 600;
}
.csr-sl .sl-link-btn:hover { text-decoration: underline; }
.csr-sl .sl-icon-btn {
  width: 32px; height: 32px; display: inline-grid; place-items: center;
  border-radius: 8px; border: 1px solid var(--c-border); background: var(--c-surface);
  color: var(--c-muted); cursor: pointer; text-decoration: none; transition: all .15s;
}
.csr-sl .sl-icon-btn:hover:not(:disabled) { color: var(--c-primary); border-color: #c7d7fe; background: var(--c-primary-soft); }
.csr-sl .sl-icon-btn.danger:hover:not(:disabled) { color: var(--c-red); border-color: var(--c-red-line); background: var(--c-red-soft); }
.csr-sl .sl-icon-btn:disabled { opacity: .6; cursor: not-allowed; }
.csr-sl button:focus-visible, .csr-sl a:focus-visible, .csr-sl input:focus-visible, .csr-sl select:focus-visible {
  outline: 2px solid var(--c-primary); outline-offset: 2px;
}

.csr-sl .sl-body { padding: 22px 28px 32px; max-width: 1600px; margin: 0 auto; }

/* KPI cards */
.csr-sl .sl-kpis {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin-bottom: 18px;
}
.csr-sl .sl-kpi {
  display: flex; align-items: center; gap: 14px; text-align: left;
  padding: 16px; border-radius: 14px; cursor: pointer;
  background: var(--c-surface); border: 1px solid var(--c-border);
  box-shadow: 0 1px 2px rgba(15,23,42,.04);
  transition: border-color .15s, box-shadow .15s, transform .15s;
  font: inherit; color: inherit;
}
.csr-sl .sl-kpi:hover:not(:disabled) { border-color: var(--c-border-strong); box-shadow: 0 4px 14px rgba(15,23,42,.06); transform: translateY(-1px); }
.csr-sl .sl-kpi.active { border-color: var(--kpi-color); box-shadow: 0 0 0 3px var(--kpi-ring); }
.csr-sl .sl-kpi-icon {
  flex-shrink: 0; width: 42px; height: 42px; border-radius: 11px;
  display: grid; place-items: center; font-size: 19px;
  color: var(--kpi-color); background: var(--kpi-soft);
}
.csr-sl .sl-kpi-text { display: flex; flex-direction: column; min-width: 0; }
.csr-sl .sl-kpi-value { font-size: 24px; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
.csr-sl .sl-kpi-label { font-size: 13px; font-weight: 600; color: var(--c-text-2); margin-top: 2px; }
.csr-sl .sl-kpi-hint { font-size: 11.5px; color: var(--c-faint); margin-top: 1px; }
.csr-sl .tone-blue   { --kpi-color: var(--c-blue);   --kpi-soft: var(--c-blue-soft);   --kpi-ring: rgba(37,99,235,.12); }
.csr-sl .tone-green  { --kpi-color: var(--c-green);  --kpi-soft: var(--c-green-soft);  --kpi-ring: rgba(21,128,61,.12); }
.csr-sl .tone-amber  { --kpi-color: var(--c-amber);  --kpi-soft: var(--c-amber-soft);  --kpi-ring: rgba(180,83,9,.12); }
.csr-sl .tone-red    { --kpi-color: var(--c-red);    --kpi-soft: var(--c-red-soft);    --kpi-ring: rgba(185,28,28,.12); }
.csr-sl .tone-violet { --kpi-color: var(--c-violet); --kpi-soft: var(--c-violet-soft); --kpi-ring: rgba(109,40,217,.12); }

/* Alert */
.csr-sl .sl-alert {
  display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
  padding: 10px 12px 10px 14px; border-radius: 10px;
  background: var(--c-red-soft); border: 1px solid var(--c-red-line); color: var(--c-red); font-weight: 500;
}
.csr-sl .sl-alert span { flex: 1; }

/* Card + toolbar */
.csr-sl .sl-card {
  background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 14px;
  box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden;
}
.csr-sl .sl-toolbar {
  display: grid; grid-template-columns: minmax(240px, 1fr) 220px 200px; gap: 10px;
  padding: 14px 16px; border-bottom: 1px solid var(--c-border);
}
.csr-sl .sl-search { position: relative; }
.csr-sl .sl-search input {
  width: 100%; height: 38px; padding: 0 34px 0 36px;
  border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-surface);
  font-size: 13.5px; color: var(--c-text); outline: none; transition: border-color .15s, box-shadow .15s;
}
.csr-sl .sl-search input:focus { border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.csr-sl .sl-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--c-faint); }
.csr-sl .sl-search-clear {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  width: 22px; height: 22px; display: grid; place-items: center;
  border: none; border-radius: 6px; background: var(--c-soft); color: var(--c-muted); cursor: pointer;
}
.csr-sl .sl-select {
  height: 38px; padding: 0 12px; border: 1px solid var(--c-border-strong); border-radius: 10px;
  background: var(--c-surface); color: var(--c-text-2); font-size: 13.5px; cursor: pointer; outline: none;
}
.csr-sl .sl-select:focus { border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }

.csr-sl .sl-chips {
  display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
  padding: 10px 16px; border-bottom: 1px solid var(--c-border); background: var(--c-soft);
}
.csr-sl .sl-chips-label { font-size: 12.5px; color: var(--c-muted); }
.csr-sl .sl-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 4px 3px 10px; border-radius: 999px;
  background: var(--c-primary-soft); border: 1px solid #dbe6fe; color: var(--c-primary-dark);
  font-size: 12.5px; font-weight: 600;
}
.csr-sl .sl-chip button {
  width: 18px; height: 18px; display: grid; place-items: center;
  border: none; border-radius: 999px; background: transparent; color: inherit; cursor: pointer;
}
.csr-sl .sl-chip button:hover { background: #dbe6fe; }

.csr-sl .sl-bulk {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 16px; background: #fff7ed; border-bottom: 1px solid #fed7aa; color: #9a3412; font-size: 13.5px;
}
.csr-sl .sl-bulk-actions { display: flex; align-items: center; gap: 14px; }

/* Table */
.csr-sl .sl-table-wrap { overflow-x: auto; }
.csr-sl .sl-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.csr-sl .sl-th {
  position: sticky; top: 0; z-index: 1;
  padding: 11px 14px; text-align: left; white-space: nowrap;
  background: var(--c-soft); border-bottom: 1px solid var(--c-border);
  font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--c-muted);
}
.csr-sl .sl-sortable { cursor: pointer; user-select: none; }
.csr-sl .sl-sortable:hover, .csr-sl .sl-sortable.sorted { color: var(--c-text); }
.csr-sl .sl-th-inner { display: inline-flex; align-items: center; gap: 4px; }
.csr-sl .sl-sort-idle { opacity: .35; }
.csr-sl .sl-th-check, .csr-sl .sl-td-check { width: 44px; padding-right: 0; }
.csr-sl .sl-th-actions, .csr-sl .sl-td-actions { text-align: right; }
.csr-sl input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: var(--c-primary); }

.csr-sl .sl-td {
  padding: 12px 14px; border-bottom: 1px solid var(--c-border);
  color: var(--c-text-2); vertical-align: middle;
}
.csr-sl .sl-row { transition: background .12s; }
.csr-sl .sl-row:hover { background: #f8fafd; }
.csr-sl .sl-row.selected { background: var(--c-primary-soft); }
.csr-sl .sl-row:last-child .sl-td { border-bottom: none; }
/* status accent on the left edge instead of tinting the whole row */
.csr-sl .sl-row .sl-td-check { box-shadow: inset 3px 0 0 transparent; }
.csr-sl .sl-row.status-non_compliant .sl-td-check { box-shadow: inset 3px 0 0 #ef4444; }
.csr-sl .sl-row.status-under_review .sl-td-check { box-shadow: inset 3px 0 0 #f59e0b; }

.csr-sl .sl-sl {
  display: inline-block; min-width: 30px; text-align: center;
  font-size: 12px; font-weight: 600; color: var(--c-muted);
  background: var(--c-soft); border: 1px solid var(--c-border); border-radius: 6px; padding: 2px 6px;
}
.csr-sl .sl-supplier { display: flex; align-items: center; gap: 11px; text-decoration: none; color: inherit; min-width: 220px; }
.csr-sl .sl-avatar {
  flex-shrink: 0; width: 34px; height: 34px; border-radius: 9px;
  display: grid; place-items: center; font-size: 12.5px; font-weight: 700;
  color: var(--c-primary-dark); background: linear-gradient(135deg, #eef4ff, #e0e7ff);
  border: 1px solid #dbe6fe;
}
.csr-sl .sl-supplier-text { display: flex; flex-direction: column; min-width: 0; }
.csr-sl .sl-supplier-name { font-weight: 600; color: var(--c-text); line-height: 1.3; }
.csr-sl .sl-supplier:hover .sl-supplier-name { color: var(--c-primary); }
.csr-sl .sl-supplier-email { font-size: 12px; color: var(--c-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px; }
.csr-sl .sl-location { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--c-text-2); }
.csr-sl .sl-location svg { color: var(--c-faint); flex-shrink: 0; }
.csr-sl .sl-pill {
  display: inline-block; padding: 3px 10px; border-radius: 999px;
  background: #f1f5f9; border: 1px solid var(--c-border); color: var(--c-text-2);
  font-size: 12px; font-weight: 500; white-space: nowrap;
}
.csr-sl .sl-muted { color: var(--c-faint); }

.csr-sl .sl-status {
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
  padding: 3px 10px; border-radius: 999px; border: 1px solid;
  font-size: 12px; font-weight: 600;
}
.csr-sl .sl-reason {
  margin-top: 5px; max-width: 240px; font-size: 11.5px; line-height: 1.35;
  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.csr-sl .sl-reason.status-non_compliant { color: var(--c-red); }
.csr-sl .sl-reason.status-under_review { color: var(--c-amber); }

.csr-sl .sl-expiring { display: flex; flex-wrap: wrap; gap: 5px; max-width: 280px; }
.csr-sl .sl-exp {
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
  padding: 2px 4px 2px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 600;
  color: var(--kpi-color); background: var(--kpi-soft); border: 1px solid var(--kpi-ring);
}
.csr-sl .sl-exp b { font-weight: 700; background: rgba(255,255,255,.7); border-radius: 4px; padding: 0 4px; }
.csr-sl .sl-more { font-size: 11.5px; color: var(--c-muted); align-self: center; cursor: help; }
.csr-sl .sl-actions { display: inline-flex; gap: 6px; }

/* Pagination */
.csr-sl .sl-pagination {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
  padding: 12px 16px; border-top: 1px solid var(--c-border); background: var(--c-surface);
}
.csr-sl .sl-page-info { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; font-size: 13px; color: var(--c-muted); }
.csr-sl .sl-page-info strong { color: var(--c-text); font-weight: 600; }
.csr-sl .sl-page-size { display: inline-flex; align-items: center; gap: 6px; margin-left: 14px; }
.csr-sl .sl-page-size select {
  height: 30px; padding: 0 6px; border: 1px solid var(--c-border-strong); border-radius: 8px;
  background: var(--c-surface); color: var(--c-text-2); font-size: 13px;
}
.csr-sl .sl-pages { display: flex; align-items: center; gap: 4px; }
.csr-sl .sl-page {
  min-width: 34px; height: 34px; padding: 0 8px; display: inline-grid; place-items: center;
  border-radius: 8px; border: 1px solid var(--c-border); background: var(--c-surface);
  color: var(--c-text-2); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s;
}
.csr-sl .sl-page:hover:not(:disabled):not(.active) { background: var(--c-soft); border-color: var(--c-border-strong); }
.csr-sl .sl-page.active { background: var(--c-primary); border-color: var(--c-primary); color: #fff; }
.csr-sl .sl-page:disabled { opacity: .45; cursor: not-allowed; }
.csr-sl .sl-ellipsis { color: var(--c-faint); padding: 0 4px; }

/* Loading / empty */
.csr-sl .sl-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 64px 24px; color: var(--c-muted); }
.csr-sl .sl-state h3 { margin: 0 0 6px; font-size: 16px; color: var(--c-text); }
.csr-sl .sl-state p { margin: 0 0 18px; font-size: 13.5px; }
.csr-sl .sl-state-icon {
  width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center;
  font-size: 24px; color: var(--c-faint); background: var(--c-soft); border: 1px solid var(--c-border); margin-bottom: 14px;
}
.csr-sl .sl-spinner {
  width: 34px; height: 34px; border-radius: 50%;
  border: 3px solid var(--c-border); border-top-color: var(--c-primary);
  animation: sl-spin .8s linear infinite; margin-bottom: 14px;
}
.csr-sl .sl-spinner.sm { width: 14px; height: 14px; border-width: 2px; margin: 0; }
.csr-sl .sl-spin { animation: sl-spin .8s linear infinite; }
@keyframes sl-spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .csr-sl .sl-toolbar { grid-template-columns: 1fr 1fr; }
  .csr-sl .sl-search { grid-column: 1 / -1; }
  .csr-sl .sl-header, .csr-sl .sl-body { padding-left: 16px; padding-right: 16px; }
}
`;

// Add global styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    background-color: ${colors.gray[50]};
  }
`;
document.head.appendChild(styleSheet);

export default SupplierListCSR;
