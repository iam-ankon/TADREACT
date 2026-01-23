import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebars from "./sidebars";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  Mail,
  Phone,
  Calendar,
  Hash,
  TrendingUp,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  BarChart3,
  File,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Award,
  Target,
  Star,
  Percent,
  Grid,
  List,
  TrendingDown,
  Building,
} from "lucide-react";
import {
  getPerformanceAppraisals,
  deletePerformanceAppraisal,
} from "../../api/employeeApi";

const PerformanceAppraisal = () => {
  const [appraisals, setAppraisals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAppraisal, setExpandedAppraisal] = useState(null);
  const [sortBy, setSortBy] = useState("rating");
  const [sortOrder, setSortOrder] = useState("desc");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const navigate = useNavigate();

  /* ------------------------------------------------------------------ *
   *  1. Load saved state + fetch Appraisals
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const savedSearch = localStorage.getItem("appraisalListSearchQuery") || "";
    setSearchQuery(savedSearch);

    const fetchAppraisals = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getPerformanceAppraisals();
        const data = response.data || [];
        setAppraisals(data);
      } catch (err) {
        console.error("Error fetching appraisals:", err);
        setError({
          message: "Failed to load performance appraisals. Please try again.",
          type: "fetch",
          details: err.message
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAppraisals();
  }, []);

  /* ------------------------------------------------------------------ *
   *  2. Memoized computed values
   * ------------------------------------------------------------------ */
  const departments = useMemo(() => {
    return [...new Set(appraisals.map((a) => a.department_name).filter(Boolean))];
  }, [appraisals]);

  const stats = useMemo(() => {
    const totalAppraisals = appraisals.length;
    const avgRating = appraisals.length > 0 
      ? appraisals.reduce((sum, a) => sum + (a.overall_rating || a.rating || 0), 0) / appraisals.length 
      : 0;
    const excellent = appraisals.filter((a) => (a.overall_rating || a.rating || 0) >= 4.5).length;
    const good = appraisals.filter((a) => (a.overall_rating || a.rating || 0) >= 3.5 && (a.overall_rating || a.rating || 0) < 4.5).length;
    const average = appraisals.filter((a) => (a.overall_rating || a.rating || 0) >= 2.5 && (a.overall_rating || a.rating || 0) < 3.5).length;
    const poor = appraisals.filter((a) => (a.overall_rating || a.rating || 0) < 2.5).length;

    return { 
      totalAppraisals, 
      avgRating: avgRating.toFixed(1), 
      excellent, 
      good, 
      average, 
      poor,
      departments 
    };
  }, [appraisals]);

  const filteredAppraisals = useMemo(() => {
    let filtered = [...appraisals];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (appraisal) =>
          appraisal.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          appraisal.employee_id?.toString().includes(searchQuery) ||
          appraisal.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          appraisal.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter(
        (appraisal) => appraisal.department_name === departmentFilter
      );
    }

    // Apply rating filter
    if (ratingFilter !== "all") {
      filtered = filtered.filter((appraisal) => {
        const rating = appraisal.overall_rating || appraisal.rating || 0;
        if (ratingFilter === "excellent") return rating >= 4.5;
        if (ratingFilter === "good") return rating >= 3.5 && rating < 4.5;
        if (ratingFilter === "average") return rating >= 2.5 && rating < 3.5;
        if (ratingFilter === "poor") return rating < 2.5;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "department":
          aValue = a.department_name?.toLowerCase() || "";
          bValue = b.department_name?.toLowerCase() || "";
          break;
        case "rating":
          aValue = a.overall_rating || a.rating || 0;
          bValue = b.overall_rating || b.rating || 0;
          break;
        case "designation":
          aValue = a.designation?.toLowerCase() || "";
          bValue = b.designation?.toLowerCase() || "";
          break;
        case "date":
          aValue = new Date(a.created_at || Date.now());
          bValue = new Date(b.created_at || Date.now());
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      return sortOrder === "asc"
        ? aValue > bValue
          ? 1
          : -1
        : aValue < bValue
        ? 1
        : -1;
    });

    return filtered;
  }, [appraisals, searchQuery, departmentFilter, ratingFilter, sortBy, sortOrder]);

  /* ------------------------------------------------------------------ *
   *  3. Save search state
   * ------------------------------------------------------------------ */
  useEffect(() => {
    localStorage.setItem("appraisalListSearchQuery", searchQuery);
  }, [searchQuery]);

  /* ------------------------------------------------------------------ *
   *  Handlers
   * ------------------------------------------------------------------ */
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this performance appraisal?")) return;
    try {
      await deletePerformanceAppraisal(id);
      setAppraisals((prev) => prev.filter((appraisal) => appraisal.id !== id));
      setShowDeleteConfirm(null);
    } catch (e) {
      console.error("Delete error:", e);
      alert("Failed to delete performance appraisal. Please try again.");
    }
  }, []);

  const handleEdit = useCallback((id) => navigate(`/edit-appraisal/${id}`), [navigate]);
  const handleView = useCallback((id) => navigate(`/appraisal-details/${id}`), [navigate]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const toggleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }, [sortBy, sortOrder]);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPerformanceAppraisals();
      const data = response.data || [];
      setAppraisals(data);
    } catch (err) {
      console.error("Error refreshing appraisals:", err);
      setError({
        message: "Failed to refresh performance appraisals.",
        type: "refresh",
        details: err.message
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExport = useCallback(() => {
    try {
      const data = filteredAppraisals.map(appraisal => ({
        Name: appraisal.name || "N/A",
        'Employee ID': appraisal.employee_id || "N/A",
        Department: appraisal.department_name || "N/A",
        Designation: appraisal.designation || "N/A",
        Rating: (appraisal.overall_rating || appraisal.rating || 0).toFixed(1),
        Status: getRatingConfig(appraisal.overall_rating || appraisal.rating).label,
        Date: appraisal.created_at ? new Date(appraisal.created_at).toLocaleDateString() : "N/A"
      }));
      
      // Create CSV content
      const csvContent = [
        Object.keys(data[0] || {}).join(","),
        ...data.map(row => Object.values(row).map(value => `"${value}"`).join(","))
      ].join("\n");
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `performance-appraisals-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert("Export completed successfully!");
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export data. Please try again.");
    }
  }, [filteredAppraisals]);

  // Helper function to get rating configuration
  const getRatingConfig = useCallback((rating) => {
    if (rating >= 4.5) return {
      bg: "#10B981",
      light: "#D1FAE5",
      label: "Excellent",
      color: "#10B981"
    };
    if (rating >= 3.5) return {
      bg: "#3B82F6",
      light: "#DBEAFE",
      label: "Good",
      color: "#3B82F6"
    };
    if (rating >= 2.5) return {
      bg: "#F59E0B",
      light: "#FEF3C7",
      label: "Average",
      color: "#F59E0B"
    };
    return {
      bg: "#EF4444",
      light: "#FEE2E2",
      label: "Needs Improvement",
      color: "#EF4444"
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#F8FAFC",
        overflow: "hidden",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebars />

      <div
        style={{
          flex: 1,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          maxHeight: "100vh",
        }}
      >
        {/* Modern Header with Stats */}
        <div style={{ marginBottom: "24px", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  padding: "14px",
                  background:
                    "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                  borderRadius: "16px",
                  boxShadow: "0 4px 20px rgba(139, 92, 246, 0.3)",
                }}
              >
                <TrendingUp style={{ color: "white" }} size={28} />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#111827",
                    margin: "0 0 4px 0",
                    letterSpacing: "-0.025em",
                  }}
                >
                  Performance Appraisal
                </h2>
                <p
                  style={{
                    color: "#6B7280",
                    fontSize: "14px",
                    margin: 0,
                  }}
                >
                  Track and evaluate employee performance metrics
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <StatsDisplay stats={stats} />
          </div>

          {/* Action Bar */}
          <ActionBar
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            clearSearch={clearSearch}
            departmentFilter={departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
            ratingFilter={ratingFilter}
            setRatingFilter={setRatingFilter}
            toggleSort={toggleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            viewMode={viewMode}
            setViewMode={setViewMode}
            refreshData={refreshData}
            handleExport={handleExport}
            departments={departments}
          />
        </div>

        {/* Search Info */}
        {searchQuery && (
          <div
            style={{
              backgroundColor: "#F5F3FF",
              padding: "12px 20px",
              borderRadius: "10px",
              marginBottom: "20px",
              border: "1px solid #DDD6FE",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px",
              fontWeight: "500",
              flexShrink: 0,
            }}
          >
            <span>
              Found {filteredAppraisals.length} appraisal(s) matching "{searchQuery}"
            </span>
            <button
              onClick={clearSearch}
              style={{
                backgroundColor: "#8B5CF6",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <X size={12} />
              Clear search
            </button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorDisplay error={error} refreshData={refreshData} />
        )}

        {/* Appraisals Display Area with Scrollbar */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            minHeight: "0",
          }}
        >
          {filteredAppraisals.length === 0 ? (
            <EmptyState searchQuery={searchQuery} />
          ) : viewMode === "grid" ? (
            <GridView
              appraisals={filteredAppraisals}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              expandedAppraisal={expandedAppraisal}
              setExpandedAppraisal={setExpandedAppraisal}
              getRatingConfig={getRatingConfig}
            />
          ) : (
            <ListView
              appraisals={filteredAppraisals}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              getRatingConfig={getRatingConfig}
            />
          )}
        </div>

        {/* Summary Footer */}
        {filteredAppraisals.length > 0 && (
          <SummaryFooter
            filteredAppraisals={filteredAppraisals}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        handleDelete={handleDelete}
      />

      {/* Global Styles */}
      <GlobalStyles />
    </div>
  );
};

// =================== Sub-Components ===================

const LoadingScreen = () => (
  <div
    style={{
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#F8FAFC",
    }}
  >
    <Sidebars />
    <div
      style={{
        flex: 1,
        padding: "48px",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div>
        <div
          style={{
            display: "inline-block",
            animation: "spin 1s linear infinite",
            width: "48px",
            height: "48px",
            border: "3px solid rgba(139, 92, 246, 0.2)",
            borderTopColor: "#8B5CF6",
            borderRadius: "50%",
          }}
        ></div>
        <p
          style={{ marginTop: "16px", color: "#6B7280", fontSize: "14px" }}
        >
          Loading performance appraisals...
        </p>
      </div>
    </div>
  </div>
);

const StatsDisplay = ({ stats }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
      marginTop: "8px",
    }}
  >
    <StatItem icon={<Hash size={16} />} color="#8B5CF6" value={stats.totalAppraisals} label="Total Appraisals" bg="#F5F3FF" border="#DDD6FE" />
    <StatItem icon={<Star size={16} />} color="#10B981" value={stats.avgRating} label="Avg Rating" bg="#ECFDF5" border="#A7F3D0" />
    <StatItem icon={<Award size={16} />} color="#0EA5E9" value={stats.excellent} label="Excellent" bg="#F0F9FF" border="#BAE6FD" />
    {/* <StatItem icon={<TrendingDown size={16} />} color="#EF4444" value={stats.poor} label="Needs Improvement" bg="#FEF2F2" border="#FECACA" /> */}
    <StatItem icon={<Target size={16} />} color="#F59E0B" value={stats.good} label="Good" bg="#FFFBEB" border="#FDE68A" />
  </div>
);

const StatItem = ({ icon, color, value, label, bg, border }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 16px",
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: "10px",
      fontSize: "14px",
      minWidth: "150px",
    }}
  >
    <div style={{ color }}>
      {icon}
    </div>
    <div>
      <div
        style={{
          fontWeight: "600",
          color: "#374151",
          fontSize: "16px",
        }}
      >
        {value}
      </div>
      <div style={{ color: "#6B7280", fontSize: "12px" }}>
        {label}
      </div>
    </div>
  </div>
);

const ActionBar = ({
  searchQuery,
  handleSearchChange,
  clearSearch,
  departmentFilter,
  setDepartmentFilter,
  ratingFilter,
  setRatingFilter,
  toggleSort,
  sortBy,
  sortOrder,
  viewMode,
  setViewMode,
  refreshData,
  handleExport,
  departments
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    }}
  >
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        justifyContent: "space-between",
      }}
    >
      {/* Search and Filters */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minWidth: "300px",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <SearchInput
          searchQuery={searchQuery}
          handleSearchChange={handleSearchChange}
          clearSearch={clearSearch}
        />
        
        <FilterSelect
          value={departmentFilter}
          onChange={setDepartmentFilter}
          options={["all", ...departments]}
          icon={<Building size={16} />}
          label="🏢 All Departments"
        />
        
        {/* <FilterSelect
          value={ratingFilter}
          onChange={setRatingFilter}
          options={[
            { value: "all", label: "⭐ All Ratings" },
            { value: "excellent", label: "⭐⭐⭐⭐⭐ Excellent (4.5+)" },
            { value: "good", label: "⭐⭐⭐⭐ Good (3.5-4.4)" },
            { value: "average", label: "⭐⭐⭐ Average (2.5-3.4)" },
            { value: "poor", label: "⭐⭐ Poor (<2.5)" }
          ]}
          icon={<Star size={16} />}
          label="⭐ All Ratings"
        /> */}
        
        <SortButton
          onClick={() => toggleSort("rating")}
          sortOrder={sortOrder}
        />
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        <ActionButton icon={<RefreshCw size={16} />} label="Refresh" onClick={refreshData} />
        <ActionButton icon={<Download size={16} />} label="Export" onClick={handleExport} />
        <Link to="/add-newAppraisal" style={{ textDecoration: "none" }}>
          <PrimaryButton icon={<Plus size={18} />} label="New Appraisal" />
        </Link>
      </div>
    </div>
  </div>
);

const SearchInput = ({ searchQuery, handleSearchChange, clearSearch }) => (
  <div style={{ position: "relative", flex: 1 }}>
    <Search
      style={{
        position: "absolute",
        left: "16px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "#9CA3AF",
      }}
      size={20}
    />
    <input
      type="text"
      placeholder="Search by name, ID, designation, or department..."
      style={{
        width: "100%",
        padding: "12px 16px 12px 48px",
        background: "white",
        border: "1px solid rgba(209, 213, 219, 0.8)",
        borderRadius: "12px",
        fontSize: "14px",
        outline: "none",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "#8B5CF6";
        e.target.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "rgba(209, 213, 219, 0.8)";
        e.target.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
      }}
      value={searchQuery}
      onChange={handleSearchChange}
    />
    {searchQuery && (
      <button
        onClick={clearSearch}
        style={{
          position: "absolute",
          right: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: "#9CA3AF",
          cursor: "pointer",
          padding: "4px",
        }}
        aria-label="Clear search"
      >
        <X size={16} />
      </button>
    )}
  </div>
);

const FilterSelect = ({ value, onChange, options, icon, label }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 16px",
      background: "white",
      border: "1px solid rgba(209, 213, 219, 0.8)",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      minWidth: "140px",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(209, 213, 219, 0.8)")}
  >
    {icon}
    <select
      style={{
        border: "none",
        background: "transparent",
        fontSize: "14px",
        color: "#374151",
        outline: "none",
        width: "100%",
        cursor: "pointer",
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filter options"
    >
      {options.map(option => (
        <option key={typeof option === 'object' ? option.value : option} value={typeof option === 'object' ? option.value : option}>
          {typeof option === 'object' ? option.label : (option === 'all' ? label : option)}
        </option>
      ))}
    </select>
  </div>
);

const SortButton = ({ onClick, sortOrder }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 16px",
      background: "white",
      border: "1px solid rgba(209, 213, 219, 0.8)",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontSize: "14px",
      color: "#374151",
      whiteSpace: "nowrap",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(209, 213, 219, 0.8)")}
    aria-label="Sort appraisals"
  >
    <ArrowUpDown size={16} />
    Sort
    {sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
  </button>
);

const ViewToggle = ({ viewMode, setViewMode }) => (
  <div
    style={{
      display: "flex",
      background: "rgba(243, 244, 246, 0.8)",
      borderRadius: "10px",
      padding: "4px",
      border: "1px solid rgba(209, 213, 219, 0.5)",
    }}
  >
    <button
      onClick={() => setViewMode("grid")}
      style={{
        padding: "8px 16px",
        background: viewMode === "grid" ? "white" : "transparent",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "500",
        color: viewMode === "grid" ? "#8B5CF6" : "#6B7280",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: viewMode === "grid" ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
      aria-label="Grid view"
    >
      <Grid size={14} />
      Grid
    </button>
    <button
      onClick={() => setViewMode("list")}
      style={{
        padding: "8px 16px",
        background: viewMode === "list" ? "white" : "transparent",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "500",
        color: viewMode === "list" ? "#8B5CF6" : "#6B7280",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: viewMode === "list" ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
      aria-label="List view"
    >
      <List size={14} />
      List
    </button>
  </div>
);

const ActionButton = ({ icon, label, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{
      padding: "10px 16px",
      background: "white",
      border: "1px solid rgba(209, 213, 219, 0.8)",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.2s ease",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(209, 213, 219, 0.8)")}
    aria-label={label}
  >
    {icon}
    {label}
  </motion.button>
);

const PrimaryButton = ({ icon, label }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    style={{
      padding: "12px 24px",
      background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)";
      e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.6)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)";
      e.currentTarget.style.boxShadow = "0 4px 14px rgba(139, 92, 246, 0.4)";
    }}
    aria-label={label}
  >
    {icon}
    {label}
  </motion.button>
);

const ErrorDisplay = ({ error, refreshData }) => (
  <div
    style={{
      backgroundColor: "#FEF2F2",
      padding: "16px 20px",
      borderRadius: "10px",
      marginBottom: "20px",
      border: "1px solid #FECACA",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexShrink: 0,
    }}
  >
    <AlertCircle size={20} color="#EF4444" />
    <span style={{ color: "#EF4444", fontSize: "14px" }}>{error.message}</span>
    <button
      onClick={refreshData}
      style={{
        marginLeft: "auto",
        padding: "6px 12px",
        background: "#EF4444",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontSize: "12px",
        cursor: "pointer",
      }}
    >
      Retry
    </button>
  </div>
);

const EmptyState = ({ searchQuery }) => (
  <div
    style={{
      textAlign: "center",
      padding: "64px 24px",
      background: "white",
      borderRadius: "16px",
      border: "1px solid rgba(229, 231, 235, 0.5)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        background: "#F3F4F6",
        marginBottom: "24px",
      }}
    >
      <TrendingUp style={{ color: "#9CA3AF" }} size={32} />
    </div>
    <h3
      style={{
        fontSize: "20px",
        fontWeight: "600",
        color: "#111827",
        margin: "0 0 8px 0",
      }}
    >
      No performance appraisals found
    </h3>
    <p
      style={{
        color: "#6B7280",
        fontSize: "14px",
        margin: "0 0 24px 0",
        maxWidth: "400px",
      }}
    >
      {searchQuery
        ? "Try adjusting your search criteria."
        : "Add your first performance appraisal to get started."}
    </p>
    <Link to="/add-newAppraisal" style={{ textDecoration: "none" }}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          padding: "12px 32px",
          background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(139, 92, 246, 0.4)";
        }}
      >
        Add First Appraisal
      </motion.button>
    </Link>
  </div>
);

const GridView = ({ appraisals, onEdit, onDelete, onView, expandedAppraisal, setExpandedAppraisal, getRatingConfig }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: "20px",
      padding: "4px",
      height: "100%",
      overflowY: "auto",
      overflowX: "hidden",
    }}
  >
    {appraisals.map((appraisal) => (
      <AppraisalCard
        key={appraisal.id}
        appraisal={appraisal}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        expandedAppraisal={expandedAppraisal}
        setExpandedAppraisal={setExpandedAppraisal}
        getRatingConfig={getRatingConfig}
      />
    ))}
  </div>
);

const ListView = ({ appraisals, onEdit, onDelete, onView, getRatingConfig }) => (
  <div
    style={{
      background: "white",
      borderRadius: "16px",
      border: "1px solid rgba(229, 231, 235, 0.5)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}
  >
    {/* List Header */}
    <div
      style={{
        padding: "16px 20px",
        background: "#F9FAFB",
        borderBottom: "1px solid #E5E7EB",
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: "16px",
        fontSize: "12px",
        fontWeight: "600",
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        position: "sticky",
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      <div>Employee</div>
      <div>Department</div>
      <div>Designation</div>
      <div>Actions</div>
    </div>

    {/* List Content with Scroll */}
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        maxHeight: "calc(100vh - 400px)",
      }}
    >
      {appraisals.map((appraisal, index) => (
        <AppraisalListItem
          key={appraisal.id}
          appraisal={appraisal}
          index={index}
          onEdit={() => onEdit(appraisal.id)}
          onDelete={() => onDelete(appraisal.id)}
          onView={() => onView(appraisal.id)}
          getRatingConfig={getRatingConfig}
        />
      ))}
    </div>
  </div>
);

const SummaryFooter = ({ filteredAppraisals, sortBy, sortOrder }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      marginTop: "20px",
      padding: "16px 20px",
      background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
      color: "white",
      borderRadius: "12px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexShrink: 0,
    }}
  >
    <div>
      <div
        style={{
          fontSize: "14px",
          fontWeight: "600",
          marginBottom: "4px",
        }}
      >
        Showing {filteredAppraisals.length} performance appraisals
      </div>
      <div
        style={{
          fontSize: "12px",
          opacity: 0.8,
        }}
      >
        Sorted by {sortBy} • {sortOrder === "asc" ? "Ascending" : "Descending"}
      </div>
    </div>
    <div style={{ display: "flex", gap: "12px" }}>
      <button
        style={{
          padding: "8px 16px",
          background: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "8px",
          color: "white",
          fontSize: "13px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")}
      >
        Generate Report
      </button>
      <button
        style={{
          padding: "8px 16px",
          background: "white",
          color: "#1E293B",
          border: "none",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
      >
        <BarChart3 size={14} />
        View Analytics
      </button>
    </div>
  </motion.div>
);

const DeleteConfirmationModal = ({ showDeleteConfirm, setShowDeleteConfirm, handleDelete }) => (
  <AnimatePresence>
    {showDeleteConfirm && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "16px",
        }}
        onClick={() => setShowDeleteConfirm(null)}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px",
            maxWidth: "400px",
            width: "100%",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            Confirm Deletion
          </h3>
          <p
            style={{
              color: "#6B7280",
              fontSize: "14px",
              marginBottom: "24px",
            }}
          >
            Are you sure you want to delete this performance appraisal? This action
            cannot be undone.
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => setShowDeleteConfirm(null)}
              style={{
                padding: "10px 20px",
                background: "white",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(showDeleteConfirm)}
              style={{
                padding: "10px 20px",
                background: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const GlobalStyles = () => (
  <style>{`
    /* Custom scrollbar for Webkit browsers (Chrome, Safari, Edge) */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #a1a1a1;
    }

    /* For Firefox */
    * {
      scrollbar-width: thin;
      scrollbar-color: #c1c1c1 #f1f1f1;
    }

    /* Spin animation for loading */
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Smooth scrolling */
    .scroll-container {
      scroll-behavior: smooth;
    }
  `}</style>
);

// =================== Appraisal Card Component (Grid View) ===================
const AppraisalCard = ({
  appraisal,
  onEdit,
  onDelete,
  onView,
  expandedAppraisal,
  setExpandedAppraisal,
  getRatingConfig,
}) => {
  const rating = appraisal.overall_rating || appraisal.rating || 0;
  const ratingConfig = getRatingConfig(rating);

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} style={{ color: "#FBBF24", fontSize: "16px" }}>★</span>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<span key={i} style={{ color: "#FBBF24", fontSize: "16px" }}>☆</span>);
      } else {
        stars.push(<span key={i} style={{ color: "#D1D5DB", fontSize: "16px" }}>★</span>);
      }
    }
    return stars;
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      style={{
        background: "white",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(229, 231, 235, 0.5)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        height: "fit-content",
      }}
      onClick={() => setExpandedAppraisal(expandedAppraisal === appraisal.id ? null : appraisal.id)}
    >
      {/* Card Header */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #F3F4F6",
          background: expandedAppraisal === appraisal.id ? "#F9FAFB" : "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                padding: "12px",
                background: ratingConfig.light,
                borderRadius: "12px",
                color: ratingConfig.bg,
              }}
            >
              <User size={20} />
            </div>
            <div style={{ overflow: "hidden" }}>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 4px 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {appraisal.name || "Unknown Employee"}
              </h4>
              <div
                style={{
                  fontSize: "13px",
                  color: "#6B7280",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>ID: #{appraisal.id}</span>
                {appraisal.employee_id && <span>• {appraisal.employee_id}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Rating Display */}
        <div style={{ marginTop: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "2px" }}>
              {getRatingStars(rating)}
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: ratingConfig.bg,
              }}
            >
              {rating.toFixed(1)}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginLeft: "auto",
              }}
            >
              / 5.0
            </div>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              height: "6px",
              background: "#E5E7EB",
              borderRadius: "3px",
              overflow: "hidden",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(rating / 5) * 100}%`,
                background: ratingConfig.bg,
                borderRadius: "3px",
                transition: "width 0.5s ease",
              }}
            ></div>
          </div>
        </div>

        {/* Appraisal Info */}
        <div style={{ marginTop: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
              fontSize: "13px",
            }}
          >
            <Building size={14} style={{ color: ratingConfig.bg, flexShrink: 0 }} />
            <span
              style={{
                color: "#6B7280",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {appraisal.department_name || "No department"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
              fontSize: "13px",
            }}
          >
            <Briefcase size={14} style={{ color: ratingConfig.bg, flexShrink: 0 }} />
            <span style={{ color: "#6B7280" }}>
              {appraisal.designation || "No designation"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
            }}
          >
            <Calendar size={14} style={{ color: ratingConfig.bg, flexShrink: 0 }} />
            <span style={{ color: "#6B7280" }}>
              {appraisal.created_at ? new Date(appraisal.created_at).toLocaleDateString() : "No date"}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "10px",
              background: ratingConfig.light,
              borderRadius: "8px",
              fontSize: "11px",
              color: ratingConfig.bg,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              {rating.toFixed(1)}
            </div>
            <div>Rating</div>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onView(appraisal.id);
            }}
            style={{
              textAlign: "center",
              padding: "10px",
              background: "#F5F3FF",
              border: "none",
              borderRadius: "8px",
              fontSize: "11px",
              color: "#8B5CF6",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#EDE9FE")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F5F3FF")}
            aria-label="View details"
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              View
            </div>
            <div>Details</div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "10px",
              background: ratingConfig.light,
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: ratingConfig.bg,
                marginBottom: "4px",
              }}
            >
              {ratingConfig.label.split(" ")[0]}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#6B7280",
              }}
            >
              Status
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div
        style={{
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #F3F4F6",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(appraisal.id);
          }}
          style={{
            padding: "8px 14px",
            background: "#F3F4F6",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "500",
            color: "#3B82F6",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#E5E7EB")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#F3F4F6")}
          aria-label="Edit appraisal"
        >
          <Edit size={14} />
          Edit
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(appraisal.id);
            }}
            style={{
              padding: "8px",
              background: "#FEF2F2",
              border: "none",
              borderRadius: "8px",
              color: "#EF4444",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF2F2")}
            aria-label="Delete appraisal"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(appraisal.id);
            }}
            style={{
              padding: "8px",
              background: "#EFF6FF",
              border: "none",
              borderRadius: "8px",
              color: "#3B82F6",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#DBEAFE")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#EFF6FF")}
            aria-label="View appraisal"
          >
            <Eye size={14} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expandedAppraisal === appraisal.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "#F9FAFB",
              borderTop: "1px solid #E5E7EB",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Eye size={14} />
                Performance Details
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6B7280",
                  lineHeight: "1.6",
                  margin: "0 0 12px 0",
                }}
              >
                <div>
                  <strong>Employee ID:</strong> {appraisal.employee_id || "N/A"}
                </div>
                <div>
                  <strong>Department:</strong> {appraisal.department_name || "N/A"}
                </div>
                <div>
                  <strong>Designation:</strong> {appraisal.designation || "N/A"}
                </div>
                <div>
                  <strong>Overall Rating:</strong> {rating.toFixed(1)}/5.0
                </div>
                <div>
                  <strong>Status:</strong> {ratingConfig.label}
                </div>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#9CA3AF",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Hash size={12} />
                Appraisal ID: #{appraisal.id}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// =================== Appraisal List Item Component (List View) ===================
const AppraisalListItem = ({
  appraisal,
  index,
  onEdit,
  onDelete,
  onView,
  getRatingConfig,
}) => {
  const rating = appraisal.overall_rating || appraisal.rating || 0;
  const ratingConfig = getRatingConfig(rating);

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} style={{ color: "#FBBF24", fontSize: "14px" }}>★</span>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<span key={i} style={{ color: "#FBBF24", fontSize: "14px" }}>☆</span>);
      } else {
        stars.push(<span key={i} style={{ color: "#D1D5DB", fontSize: "14px" }}>★</span>);
      }
    }
    return <div style={{ display: "flex", gap: "2px" }}>{stars}</div>;
  };

  return (
    <div
      style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        borderBottom: "1px solid #F3F4F6",
        background: index % 2 === 0 ? "white" : "#F9FAFB",
        transition: "background 0.2s ease",
      }}
    >
      {/* Employee Column */}
      <div
        style={{ flex: 2, display: "flex", alignItems: "center", gap: "12px" }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: ratingConfig.light,
            color: ratingConfig.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "600",
            fontSize: "16px",
          }}
        >
          {appraisal.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <div
            style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}
          >
            {appraisal.name || "Unknown Employee"}
          </div>
          {appraisal.employee_id && (
            <div
              style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}
            >
              ID: {appraisal.employee_id}
            </div>
          )}
        </div>
      </div>

      {/* Department Column */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "14px",
            color: "#374151",
            padding: "6px 12px",
            background: "#F3F4F6",
            borderRadius: "6px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Building size={12} />
          {appraisal.department_name || "N/A"}
        </div>
      </div>

      {/* Designation Column */}
      <div
        style={{
          flex: 1,
          fontSize: "14px",
          color: "#374151",
          fontWeight: "500",
        }}
      >
        {appraisal.designation || "N/A"}
      </div>

      {/* Rating Column */}
      {/* <div
        style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}
      >
        <div>{getRatingStars(rating)}</div>
        <div
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: ratingConfig.color,
          }}
        >
          {rating.toFixed(1)}
        </div>
      </div> */}

      {/* Status Column */}
      {/* <div style={{ flex: 1 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            background: ratingConfig.light,
            color: ratingConfig.color,
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          {ratingConfig.label}
        </div>
      </div> */}

      {/* Actions Column */}
      <div style={{ flex: 1, display: "flex", gap: "8px" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          style={{
            padding: "8px 12px",
            background: "#EFF6FF",
            border: "none",
            borderRadius: "6px",
            color: "#3B82F6",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#DBEAFE")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#EFF6FF")}
          aria-label="View appraisal"
        >
          <Eye size={14} />
       
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          style={{
            padding: "8px 12px",
            background: "#FEF3C7",
            border: "none",
            borderRadius: "6px",
            color: "#D97706",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#FDE68A")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF3C7")}
          aria-label="Edit appraisal"
        >
          <Edit size={14} />
         
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            padding: "8px 12px",
            background: "#FEE2E2",
            border: "none",
            borderRadius: "6px",
            color: "#EF4444",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#FECACA")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FEE2E2")}
          aria-label="Delete appraisal"
        >
          <Trash2 size={14} />
       
        </button>
      </div>
    </div>
  );
};

export default PerformanceAppraisal;