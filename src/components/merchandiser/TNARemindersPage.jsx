// src/pages/TNARemindersPage.jsx
// FIXED: Added React import for React.memo

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar";
import {
  FaBell,
  FaCheckCircle,
  FaCalendar,
  FaTimes,
  FaSync,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";

const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

const api = axios.create({
  baseURL: "http://119.148.51.38:8000/api/merchandiser/api/",
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// Component for a single reminder item (memoized for performance)
const ReminderItem = React.memo(({ reminder, onDismiss }) => {
  const status = getStatusBadgeLocal(reminder.urgency_level);
  const reminderDate = new Date(reminder.reminder_date);
  
  return (
    <div
      style={{
        ...styles.reminderCard,
        borderLeftColor: getUrgencyColorLocal(reminder.urgency_level),
      }}
    >
      <div style={styles.reminderCardHeader}>
        <div style={styles.reminderOrderInfo}>
          <span style={styles.reminderOrderNumber}>
            {reminder.order_number || `TNA-${reminder.tna_id}`}
          </span>
          {reminder.supplier && (
            <span style={styles.reminderSupplier}>{reminder.supplier}</span>
          )}
          <span
            style={{
              ...styles.reminderStatus,
              color: status.color,
              backgroundColor: status.bg,
            }}
          >
            {status.text}
          </span>
        </div>
        <div style={styles.reminderActions}>
          <span style={styles.reminderDateBadge}>
            {reminderDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          <button
            style={styles.dismissBtn}
            onClick={() => onDismiss(reminder.id)}
            title="Dismiss reminder"
          >
            <FaTimes size={14} />
          </button>
        </div>
      </div>

      <div style={styles.reminderMessage}>{reminder.message}</div>

      <div style={styles.reminderMeta}>
        <span style={styles.reminderDays}>
          {getTimeTextLocal(reminder.days_until)}
        </span>
        <span style={styles.reminderType}>
          {reminder.reminder_type?.replace('_', ' ') || 'General'}
        </span>
      </div>
    </div>
  );
});

// Local helper functions for memoized component
function getUrgencyColorLocal(level) {
  switch (level) {
    case "overdue": return "#dc2626";
    case "urgent": return "#f59e0b";
    default: return "#2563eb";
  }
}

function getStatusBadgeLocal(level) {
  switch (level) {
    case "overdue": return { text: "Overdue", color: "#dc2626", bg: "#fee2e2" };
    case "urgent": return { text: "Urgent", color: "#f59e0b", bg: "#fef3c7" };
    default: return { text: "Upcoming", color: "#2563eb", bg: "#dbeafe" };
  }
}

function getTimeTextLocal(daysUntil) {
  if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `${daysUntil} days to go`;
}

export default function TNARemindersPage() {
  // Only store a limited window of reminders
  const [visibleReminders, setVisibleReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState("all");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [loadedCount, setLoadedCount] = useState(0);
  
  // Year filter state
  const [selectedYear, setSelectedYear] = useState("all");
  const [availableYears, setAvailableYears] = useState([]);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [yearSearchTerm, setYearSearchTerm] = useState("");
  const [isFetchingYears, setIsFetchingYears] = useState(false);
  
  const yearDropdownRef = useRef(null);
  const initialFetchDone = useRef(false);
  const containerRef = useRef(null);
  const isMounted = useRef(true);

  // Fetch available years from backend
  const fetchAvailableYears = useCallback(async () => {
    if (isFetchingYears) return;
    
    try {
      setIsFetchingYears(true);
      const response = await api.get("tna/reminders/years/");
      const years = response.data.years || [];
      setAvailableYears(years);
    } catch (err) {
      console.error("Error fetching available years:", err);
    } finally {
      setIsFetchingYears(false);
    }
  }, []);

  // Fetch a single page
  const fetchPage = useCallback(async (pageNum) => {
    try {
      const params = { 
        page: pageNum, 
        page_size: 500
      };
      
      if (selectedYear !== "all" && selectedYear) {
        params.shipment_year = selectedYear;
      }
      
      const response = await api.get("tna/reminders/", { params });
      return response.data;
      
    } catch (err) {
      console.error(`Error fetching page ${pageNum}:`, err);
      throw err;
    }
  }, [selectedYear]);

  // Load next batch (incremental loading)
  const loadNextBatch = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await fetchPage(nextPage);
      const newReminders = data.results || [];
      
      setVisibleReminders(prev => {
        const combined = [...prev, ...newReminders];
        return combined.sort((a, b) => {
          const dateA = new Date(a.reminder_date);
          const dateB = new Date(b.reminder_date);
          return dateB - dateA;
        });
      });
      
      setPage(nextPage);
      setHasMore(nextPage < data.total_pages);
      setTotalPages(data.total_pages || 1);
      setLoadedCount(prev => prev + newReminders.length);
      setLastRefresh(new Date());
      
      console.log(`📦 Loaded page ${nextPage}: ${newReminders.length} reminders`);
      
    } catch (err) {
      console.error("Error loading more:", err);
      setError(err.message || "Failed to load more reminders");
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, fetchPage]);

  // Load only first page initially (not all)
  const fetchInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchPage(1);
      const results = data.results || [];
      
      const sorted = [...results].sort((a, b) => {
        const dateA = new Date(a.reminder_date);
        const dateB = new Date(b.reminder_date);
        return dateB - dateA;
      });
      
      setVisibleReminders(sorted);
      setTotalCount(data.count || 0);
      setTotalPages(data.total_pages || 1);
      setPage(1);
      setHasMore(1 < (data.total_pages || 1));
      setLoadedCount(results.length);
      setLastRefresh(new Date());
      
      console.log(`📦 Page 1: ${results.length} reminders, Total: ${data.count}`);
      
    } catch (err) {
      console.error("❌ Error fetching reminders:", err);
      setError(err.message || "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  // Initial fetch
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchInitial();
      fetchAvailableYears();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Re-fetch when year changes
  useEffect(() => {
    if (initialFetchDone.current) {
      setVisibleReminders([]);
      setLoadedCount(0);
      fetchInitial();
    }
  }, [selectedYear]);

  // Click outside year dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setShowYearDropdown(false);
        setYearSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark as read
  const markAsRead = async (reminderId) => {
    try {
      await api.post(`tna/reminders/${reminderId}/mark-read/`);
      setVisibleReminders(prev => prev.filter(r => r.id !== reminderId));
      setTotalCount(prev => prev - 1);
      setLoadedCount(prev => prev - 1);
    } catch (err) {
      console.error("Error marking reminder as read:", err);
      alert("Failed to dismiss reminder. Please try again.");
    }
  };

  const markAllAsRead = async () => {
    if (visibleReminders.length === 0) return;
    
    if (!window.confirm(`Dismiss all ${visibleReminders.length} visible reminders?`)) return;
    
    try {
      await api.post("tna/reminders/mark-all-read/");
      setVisibleReminders([]);
      setTotalCount(0);
      setLoadedCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
      alert("Failed to dismiss all reminders. Please try again.");
    }
  };

  // Apply urgency filter (frontend only)
  const filteredReminders = useMemo(() => {
    let result = visibleReminders;
    
    if (filter === "urgent") {
      result = result.filter(r => r.urgency_level === "urgent" || r.urgency_level === "overdue");
    } else if (filter === "overdue") {
      result = result.filter(r => r.urgency_level === "overdue");
    }
    
    return result;
  }, [visibleReminders, filter]);

  const urgentCount = visibleReminders.filter(
    (r) => r.urgency_level === "urgent" || r.urgency_level === "overdue"
  ).length;
  
  const overdueCount = visibleReminders.filter(
    (r) => r.urgency_level === "overdue"
  ).length;

  // Year filter handlers
  const toggleYear = (year) => {
    setSelectedYear(year);
    setShowYearDropdown(false);
    setYearSearchTerm("");
  };

  const clearYearFilter = () => {
    setSelectedYear("all");
    setShowYearDropdown(false);
    setYearSearchTerm("");
  };

  const getYearDisplayText = () => {
    if (selectedYear === "all") return "All Years";
    return selectedYear;
  };

  const filteredYears = useMemo(() => {
    if (!yearSearchTerm) return availableYears;
    return availableYears.filter(y => 
      y.toString().toLowerCase().includes(yearSearchTerm.toLowerCase())
    );
  }, [availableYears, yearSearchTerm]);

  const refreshData = () => {
    setVisibleReminders([]);
    setLoadedCount(0);
    fetchInitial();
    fetchAvailableYears();
  };

  // Calculate loading percentage
  const loadPercentage = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0;

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <FaBell style={styles.headerIcon} />
            <h1 style={styles.headerTitle}>TNA Reminders</h1>
            <span style={styles.headerBadge}>
              {totalCount > 999 ? `${(totalCount / 1000).toFixed(1)}K` : totalCount} 
              {totalCount === 1 ? " reminder" : " reminders"}
            </span>
          </div>
          <div style={styles.headerActions}>
            {lastRefresh && (
              <span style={styles.lastRefresh}>
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            {visibleReminders.length > 0 && (
              <button style={styles.markAllBtn} onClick={markAllAsRead}>
                Dismiss visible
              </button>
            )}
            <button
              style={styles.refreshBtn}
              onClick={refreshData}
              disabled={loading}
            >
              <FaSync
                style={{
                  marginRight: "6px",
                  ...(loading ? styles.spinning : {}),
                }}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div style={styles.filterBar}>
          <div style={styles.filterGroup}>
            {[
              { key: "all", label: `All (${totalCount > 999 ? (totalCount / 1000).toFixed(1) + 'K' : totalCount})` },
              { key: "urgent", label: `⚠️ Urgent (${urgentCount})` },
              { key: "overdue", label: `🔴 Overdue (${overdueCount})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                style={{
                  ...styles.filterBtn,
                  ...(filter === key ? styles.filterActive : {}),
                }}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Year Filter Dropdown ── */}
          <div style={styles.yearFilterWrapper} ref={yearDropdownRef}>
            <button
              style={{
                ...styles.yearFilterBtn,
                ...(selectedYear !== "all" ? styles.yearFilterActive : {}),
              }}
              onClick={() => setShowYearDropdown(!showYearDropdown)}
            >
              <FaCalendar style={{ marginRight: "6px" }} />
              {getYearDisplayText()}
              {selectedYear !== "all" && (
                <FaTimes
                  style={styles.yearClearBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    clearYearFilter();
                  }}
                />
              )}
              {showYearDropdown ? (
                <FaChevronUp style={{ marginLeft: "6px", fontSize: "10px" }} />
              ) : (
                <FaChevronDown style={{ marginLeft: "6px", fontSize: "10px" }} />
              )}
            </button>

            {showYearDropdown && (
              <div style={styles.yearDropdown}>
                <div style={styles.yearDropdownSearch}>
                  <FaSearch style={{ color: "#94a3b8", fontSize: "14px" }} />
                  <input
                    type="text"
                    placeholder="Search year..."
                    value={yearSearchTerm}
                    onChange={(e) => setYearSearchTerm(e.target.value)}
                    style={styles.yearSearchInput}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div style={styles.yearDropdownList}>
                  <div
                    style={{
                      ...styles.yearOption,
                      ...(selectedYear === "all" ? styles.yearOptionSelected : {}),
                    }}
                    onClick={() => toggleYear("all")}
                  >
                    <span style={{ fontWeight: 500 }}>📅 All Years</span>
                    {selectedYear === "all" && <FaCheck style={{ color: "#2563eb" }} />}
                  </div>
                  
                  {filteredYears.length > 0 ? (
                    filteredYears.map((year) => (
                      <div
                        key={year}
                        style={{
                          ...styles.yearOption,
                          ...(selectedYear === year.toString() ? styles.yearOptionSelected : {}),
                        }}
                        onClick={() => toggleYear(year.toString())}
                      >
                        <span>{year}</span>
                        {selectedYear === year.toString() && <FaCheck style={{ color: "#2563eb" }} />}
                      </div>
                    ))
                  ) : (
                    <div style={styles.yearNoResults}>No years found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Progress Bar ── */}
        {totalCount > 0 && loadedCount < totalCount && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${loadPercentage}%`
                }}
              />
            </div>
            <span style={styles.progressText}>
              {loadPercentage}% loaded ({loadedCount.toLocaleString()} of {totalCount.toLocaleString()})
            </span>
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div style={styles.loading}>
            <FaSpinner style={styles.spinnerIcon} />
            Loading reminders...
          </div>
        ) : error ? (
          <div style={styles.errorState}>
            <FaExclamationTriangle style={styles.errorIcon} />
            <h3 style={{ margin: "12px 0 4px", color: "#0f172a" }}>
              Failed to load reminders
            </h3>
            <p style={{ color: "#64748b", marginBottom: "16px" }}>{error}</p>
            <button style={styles.retryBtn} onClick={refreshData}>
              Try Again
            </button>
          </div>
        ) : filteredReminders.length === 0 ? (
          <div style={styles.emptyState}>
            <FaCheckCircle style={styles.emptyIcon} />
            <h3 style={{ margin: "12px 0 4px", color: "#0f172a" }}>
              No reminders
            </h3>
            <p style={{ color: "#64748b", margin: 0 }}>
              {selectedYear !== "all" 
                ? `No reminders found for ${selectedYear}`
                : "All your TNA dates are on track"}
            </p>
            {selectedYear !== "all" && (
              <button style={styles.clearYearBtn} onClick={clearYearFilter}>
                Show all years
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={styles.resultInfo}>
              <span>
                Showing {filteredReminders.length} reminder{filteredReminders.length !== 1 ? "s" : ""}
                {selectedYear !== "all" && ` for ${selectedYear}`}
                {filter !== "all" && ` (${filter})`}
                {` • Page ${page} of ${totalPages}`}
              </span>
              <span style={styles.resultInfoBadge}>Latest first ↓</span>
            </div>

            <div style={styles.reminderList} ref={containerRef}>
              {filteredReminders.map((reminder) => (
                <ReminderItem 
                  key={reminder.id} 
                  reminder={reminder} 
                  onDismiss={markAsRead}
                />
              ))}
            </div>

            {/* Load More Button - Incremental Loading */}
            {hasMore && (
              <div style={styles.loadMoreContainer}>
                <button
                  style={styles.loadMoreBtn}
                  onClick={loadNextBatch}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <FaSpinner style={styles.spinning} /> Loading more...
                    </>
                  ) : (
                    `Load More (${(totalCount - loadedCount).toLocaleString()} remaining)`
                  )}
                </button>
              </div>
            )}

            <div style={styles.footer}>
              Showing {loadedCount.toLocaleString()} of {totalCount.toLocaleString()} reminders
              {selectedYear !== "all" && ` • Year: ${selectedYear}`}
              {` • ${Math.round((loadedCount / totalCount) * 100)}% loaded`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  mainContent: {
    flex: 1,
    padding: "24px 32px",
    overflow: "auto",
    maxHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "16px" },
  headerIcon: { fontSize: "28px", color: "#2563eb" },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  headerBadge: {
    padding: "4px 12px",
    background: "#e2e8f0",
    borderRadius: "20px",
    fontSize: "14px",
    color: "#475569",
  },
  headerActions: { display: "flex", gap: "12px", alignItems: "center" },
  lastRefresh: { fontSize: "12px", color: "#94a3b8" },
  markAllBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#dc2626",
    background: "white",
    border: "1px solid #dc2626",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  refreshBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
    background: "white",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  spinning: { animation: "spin 1s linear infinite" },
  
  // Progress Bar
  progressContainer: {
    marginBottom: "16px",
    padding: "8px 16px",
    background: "white",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  progressBar: {
    width: "100%",
    height: "6px",
    background: "#e2e8f0",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #2563eb, #10b981)",
    borderRadius: "3px",
    transition: "width 0.5s ease",
  },
  progressText: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px",
    textAlign: "center",
  },
  
  filterBar: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  filterGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  filterBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
    background: "white",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  filterActive: {
    color: "#2563eb",
    borderColor: "#2563eb",
    background: "#eff6ff",
  },
  
  yearFilterWrapper: {
    position: "relative",
    marginLeft: "auto",
  },
  yearFilterBtn: {
    display: "flex",
    alignItems: "center",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
    background: "white",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    transition: "all 0.2s",
    gap: "4px",
  },
  yearFilterActive: {
    color: "#2563eb",
    borderColor: "#2563eb",
    background: "#eff6ff",
  },
  yearClearBtn: {
    marginLeft: "4px",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "12px",
    padding: "2px",
  },
  yearDropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    right: 0,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    zIndex: 1000,
    minWidth: "180px",
    maxHeight: "320px",
    overflow: "hidden",
  },
  yearDropdownSearch: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  yearSearchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "13px",
    padding: "4px 0",
    background: "transparent",
  },
  yearDropdownList: {
    maxHeight: "250px",
    overflowY: "auto",
    padding: "4px 0",
  },
  yearOption: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 14px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  yearOptionSelected: {
    background: "#eff6ff",
    color: "#2563eb",
  },
  yearNoResults: {
    padding: "20px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
  },
  
  resultInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    marginBottom: "16px",
    fontSize: "13px",
    color: "#64748b",
  },
  resultInfoBadge: {
    padding: "2px 10px",
    background: "#f1f5f9",
    borderRadius: "12px",
    fontSize: "11px",
    color: "#475569",
  },
  
  reminderList: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "12px",
    marginBottom: "16px",
  },
  reminderCard: {
    background: "white",
    borderRadius: "12px",
    padding: "16px 20px",
    borderLeft: "4px solid #2563eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    transition: "all 0.2s",
  },
  reminderCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    flexWrap: "wrap",
    gap: "8px",
  },
  reminderOrderInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  reminderOrderNumber: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
  },
  reminderSupplier: {
    fontSize: "13px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 10px",
    borderRadius: "12px",
  },
  reminderStatus: {
    fontSize: "11px",
    fontWeight: "600",
    padding: "2px 12px",
    borderRadius: "20px",
  },
  reminderActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  reminderDateBadge: {
    fontSize: "12px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 10px",
    borderRadius: "12px",
  },
  reminderMessage: { fontSize: "14px", color: "#334155", marginBottom: "8px" },
  reminderMeta: {
    display: "flex",
    gap: "16px",
    fontSize: "12px",
    color: "#64748b",
    flexWrap: "wrap",
  },
  reminderDays: {
    padding: "2px 10px",
    borderRadius: "12px",
    background: "#f1f5f9",
    color: "#475569",
  },
  reminderType: {
    padding: "2px 10px",
    borderRadius: "12px",
    background: "#f1f5f9",
    color: "#475569",
    textTransform: "capitalize",
  },
  dismissBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    transition: "color 0.2s",
  },
  
  loadMoreContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "10px 0 20px 0",
  },
  loadMoreBtn: {
    padding: "10px 32px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#2563eb",
    background: "#eff6ff",
    border: "1px solid #2563eb",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  
  footer: {
    marginTop: "8px",
    paddingTop: "16px",
    borderTop: "1px solid #e2e8f0",
    fontSize: "12px",
    color: "#94a3b8",
    textAlign: "center",
  },
  
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px",
    color: "#64748b",
    gap: "12px",
  },
  spinnerIcon: { animation: "spin 1s linear infinite", fontSize: "24px" },
  errorState: {
    textAlign: "center",
    padding: "60px",
    background: "white",
    borderRadius: "12px",
    border: "1px solid #fee2e2",
  },
  errorIcon: { fontSize: "48px", color: "#f59e0b" },
  retryBtn: {
    padding: "10px 24px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "white",
    background: "#2563eb",
    border: "none",
    cursor: "pointer",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px",
    background: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  emptyIcon: { fontSize: "48px", color: "#10b981", marginBottom: "16px" },
  clearYearBtn: {
    marginTop: "12px",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#2563eb",
    background: "transparent",
    border: "1px solid #2563eb",
    cursor: "pointer",
  },
};

// Inject keyframe animation
const styleElement = document.createElement("style");
styleElement.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .year-option:hover { background: #f1f5f9; }
  .dismiss-btn:hover { color: #dc2626; }
  .load-more-btn:hover { background: #2563eb; color: white; }
`;
document.head.appendChild(styleElement);