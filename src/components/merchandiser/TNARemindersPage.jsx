// src/pages/TNARemindersPage.jsx
//
// TNA Reminders — redesigned
// - Real page-by-page pagination (page numbers, prev/next, page size) instead of "load more"
// - Order Style and PO Number are shown on every card (Order Number has been removed)
// - Component split into small, named pieces + a single organized styles sheet

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaSearch,
  FaCheck,
  FaExclamationTriangle,
  FaTag,
} from "react-icons/fa";

/* ────────────────────────────────────────────────────────────────────────
   API CLIENT
   ──────────────────────────────────────────────────────────────────────── */

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

/* ────────────────────────────────────────────────────────────────────────
   CONFIG
   ──────────────────────────────────────────────────────────────────────── */

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

const URGENCY = {
  overdue: { label: "Overdue", color: "#b91c1c", bg: "#fee2e2", accent: "#dc2626" },
  urgent: { label: "Urgent", color: "#b45309", bg: "#fef3c7", accent: "#f59e0b" },
  upcoming: { label: "Upcoming", color: "#1d4ed8", bg: "#dbeafe", accent: "#2563eb" },
};

const getUrgencyMeta = (level) => URGENCY[level] || URGENCY.upcoming;

/* ────────────────────────────────────────────────────────────────────────
   HELPERS
   ──────────────────────────────────────────────────────────────────────── */

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatTimeUntil(daysUntil) {
  if (daysUntil == null) return "";
  if (daysUntil < 0) return `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"} overdue`;
  if (daysUntil === 0) return "Due today";
  if (daysUntil === 1) return "Due tomorrow";
  return `${daysUntil} days to go`;
}

function formatReminderType(type) {
  if (!type) return "General";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCount(n) {
  if (n > 999) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

// Single place to adjust if the API's field names differ from these guesses.
// Order Number is intentionally not surfaced here — the card leads with
// Order Style instead, with PO Number as a secondary reference.
function getOrderIdentifiers(reminder) {
  const style = reminder.order_style || reminder.style || null;

  const poNumber =
    reminder.order_po || reminder.po_number || reminder.poNumber || null;

  const fallbackId = `TNA-${reminder.tna_id ?? reminder.id}`;

  return { style, poNumber, fallbackId };
}

// Builds a compact page-number list with "…" gaps, e.g. 1 … 4 5 [6] 7 8 … 42
function buildPageRange(current, total, siblings = 1) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const keep = new Set([1, total, current]);
  for (let i = 1; i <= siblings; i++) {
    if (current - i > 1) keep.add(current - i);
    if (current + i < total) keep.add(current + i);
  }

  const sorted = [...keep].sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("gap");
    out.push(p);
    prev = p;
  }
  return out;
}

/* ────────────────────────────────────────────────────────────────────────
   REMINDER CARD
   ──────────────────────────────────────────────────────────────────────── */

const ReminderCard = React.memo(({ reminder, onDismiss }) => {
  const urgency = getUrgencyMeta(reminder.urgency_level);
  const { style, poNumber, fallbackId } = getOrderIdentifiers(reminder);
  const isOverdue = reminder.urgency_level === "overdue";

  return (
    <article className="reminder-card" style={{ ...styles.card, borderLeftColor: urgency.accent }}>
      <div style={styles.cardHeader}>
        <div style={styles.identity}>
          <div style={styles.styleRow}>
            <span style={{ ...styles.styleIconWrap, background: urgency.bg }}>
              <FaTag style={{ ...styles.styleIcon, color: urgency.accent }} aria-hidden="true" />
            </span>
            <span style={style ? styles.styleValue : styles.styleValueMissing}>
              {style || fallbackId}
            </span>
            {poNumber && <span style={styles.poChip}>PO {poNumber}</span>}
          </div>
        </div>

        <div style={styles.headerRight}>
          <span style={{ ...styles.urgencyBadge, color: urgency.color, background: urgency.bg }}>
            {isOverdue && <FaExclamationTriangle style={{ marginRight: 5, fontSize: 10 }} />}
            {urgency.label}
          </span>
          <button
            style={styles.dismissBtn}
            className="dismiss-btn"
            onClick={() => onDismiss(reminder.id)}
            title="Dismiss reminder"
            aria-label="Dismiss reminder"
          >
            <FaTimes size={13} />
          </button>
        </div>
      </div>

      <p style={styles.message}>{reminder.message}</p>

      <div style={styles.cardFooter}>
        <span style={{ ...styles.timeChip, color: urgency.color, background: urgency.bg }}>
          {formatTimeUntil(reminder.days_until)}
        </span>
        <span style={styles.metaChip}>{formatReminderType(reminder.reminder_type)}</span>
        {reminder.supplier && <span style={styles.metaChip}>{reminder.supplier}</span>}
        <span style={styles.dateChip}>
          <FaCalendar style={{ marginRight: 5, fontSize: 11 }} aria-hidden="true" />
          {formatDate(reminder.reminder_date)}
        </span>
      </div>
    </article>
  );
});
ReminderCard.displayName = "ReminderCard";

/* ────────────────────────────────────────────────────────────────────────
   YEAR FILTER (self-contained dropdown w/ search + click-outside)
   ──────────────────────────────────────────────────────────────────────── */

function YearFilter({ selectedYear, availableYears, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredYears = useMemo(() => {
    if (!search) return availableYears;
    return availableYears.filter((y) => y.toString().includes(search));
  }, [availableYears, search]);

  const select = (year) => {
    onChange(year);
    setOpen(false);
    setSearch("");
  };

  return (
    <div style={styles.yearWrapper} ref={ref}>
      <button
        style={{ ...styles.yearBtn, ...(selectedYear !== "all" ? styles.yearBtnActive : {}) }}
        onClick={() => setOpen((o) => !o)}
      >
        <FaCalendar style={{ marginRight: 6 }} aria-hidden="true" />
        {selectedYear === "all" ? "All years" : selectedYear}
        {selectedYear !== "all" && (
          <FaTimes
            style={styles.yearClearIcon}
            onClick={(e) => {
              e.stopPropagation();
              select("all");
            }}
          />
        )}
        {open ? <FaChevronUp style={styles.chevron} /> : <FaChevronDown style={styles.chevron} />}
      </button>

      {open && (
        <div style={styles.yearDropdown}>
          <div style={styles.yearSearchRow}>
            <FaSearch style={{ color: "#94a3b8", fontSize: 13 }} aria-hidden="true" />
            <input
              autoFocus
              type="text"
              placeholder="Search year…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.yearSearchInput}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div style={styles.yearList}>
            <div
              style={{ ...styles.yearOption, ...(selectedYear === "all" ? styles.yearOptionActive : {}) }}
              onClick={() => select("all")}
            >
              <span>All years</span>
              {selectedYear === "all" && <FaCheck style={{ color: "#2563eb" }} />}
            </div>
            {filteredYears.length > 0 ? (
              filteredYears.map((year) => (
                <div
                  key={year}
                  style={{
                    ...styles.yearOption,
                    ...(selectedYear === year.toString() ? styles.yearOptionActive : {}),
                  }}
                  onClick={() => select(year.toString())}
                >
                  <span>{year}</span>
                  {selectedYear === year.toString() && <FaCheck style={{ color: "#2563eb" }} />}
                </div>
              ))
            ) : (
              <div style={styles.yearEmpty}>No years found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   PAGINATION
   ──────────────────────────────────────────────────────────────────────── */

function Pagination({ page, totalPages, totalCount, pageSize, onPageChange, onPageSizeChange, disabled }) {
  const pages = useMemo(() => buildPageRange(page, totalPages), [page, totalPages]);

  return (
    <div style={styles.pagination}>
      <div style={styles.pageSizeGroup}>
        <label htmlFor="page-size" style={styles.pageSizeLabel}>Rows per page</label>
        <select
          id="page-size"
          style={styles.pageSizeSelect}
          value={pageSize}
          disabled={disabled}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div style={styles.pageNav}>
        <button
          className="page-nav-btn"
          style={styles.pageNavBtn}
          disabled={disabled || page === 1}
          onClick={() => onPageChange(1)}
          title="First page"
          aria-label="First page"
        >
          <FaAngleDoubleLeft size={12} />
        </button>
        <button
          className="page-nav-btn"
          style={styles.pageNavBtn}
          disabled={disabled || page === 1}
          onClick={() => onPageChange(page - 1)}
          title="Previous page"
          aria-label="Previous page"
        >
          <FaChevronLeft size={12} />
        </button>

        {pages.map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} style={styles.pageGap}>…</span>
          ) : (
            <button
              key={p}
              className="page-num-btn"
              style={{ ...styles.pageNumBtn, ...(p === page ? styles.pageNumBtnActive : {}) }}
              disabled={disabled}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          className="page-nav-btn"
          style={styles.pageNavBtn}
          disabled={disabled || page === totalPages}
          onClick={() => onPageChange(page + 1)}
          title="Next page"
          aria-label="Next page"
        >
          <FaChevronRight size={12} />
        </button>
        <button
          className="page-nav-btn"
          style={styles.pageNavBtn}
          disabled={disabled || page === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last page"
          aria-label="Last page"
        >
          <FaAngleDoubleRight size={12} />
        </button>
      </div>

      <span style={styles.pageSummary}>
        Page {page} of {totalPages} • {totalCount.toLocaleString()} total
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   STATE VIEWS
   ──────────────────────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div style={styles.centerState}>
      <FaSpinner style={styles.spinnerIcon} />
      <span>Loading reminders…</span>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={styles.panelState}>
      <FaExclamationTriangle style={styles.errorIcon} />
      <h3 style={styles.stateTitle}>Failed to load reminders</h3>
      <p style={styles.stateBody}>{message}</p>
      <button style={styles.retryBtn} onClick={onRetry}>Try again</button>
    </div>
  );
}

function EmptyState({ selectedYear, onClearYear }) {
  return (
    <div style={styles.panelState}>
      <FaCheckCircle style={styles.emptyIcon} />
      <h3 style={styles.stateTitle}>No reminders</h3>
      <p style={styles.stateBody}>
        {selectedYear !== "all"
          ? `No reminders found for ${selectedYear}.`
          : "All your TNA dates are on track."}
      </p>
      {selectedYear !== "all" && (
        <button style={styles.clearYearBtn} onClick={onClearYear}>Show all years</button>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ──────────────────────────────────────────────────────────────────────── */

export default function TNARemindersPage() {
  // Data for the current page only — pagination is server-driven.
  const [reminders, setReminders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Urgency filter applies to the reminders on the current page.
  const [filter, setFilter] = useState("all");

  // Year filter (server-side).
  const [selectedYear, setSelectedYear] = useState("all");
  const [availableYears, setAvailableYears] = useState([]);

  const didInit = useRef(false);

  const fetchAvailableYears = useCallback(async () => {
    try {
      const response = await api.get("tna/reminders/years/");
      setAvailableYears(response.data.years || []);
    } catch (err) {
      console.error("Error fetching available years:", err);
    }
  }, []);

  const loadPage = useCallback(async (pageNum, size, year) => {
    try {
      setLoading(true);
      setError(null);

      const params = { page: pageNum, page_size: size };
      if (year !== "all" && year) params.shipment_year = year;

      const { data } = await api.get("tna/reminders/", { params });

      setReminders(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.max(1, data.total_pages || 1));
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error fetching reminders:", err);
      setError(err.message || "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    loadPage(page, pageSize, selectedYear);
    fetchAvailableYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload whenever page, page size, or year changes (after initial mount)
  useEffect(() => {
    if (!didInit.current) return;
    loadPage(page, pageSize, selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, selectedYear]);

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setPage(1);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  const handleRefresh = () => {
    loadPage(page, pageSize, selectedYear);
    fetchAvailableYears();
  };

  const dismissReminder = async (id) => {
    try {
      await api.post(`tna/reminders/${id}/mark-read/`);
      const remaining = reminders.length - 1;
      if (remaining === 0 && page > 1) {
        setPage((p) => p - 1); // effect above reloads automatically
      } else {
        loadPage(page, pageSize, selectedYear); // backfill this page
      }
    } catch (err) {
      console.error("Error dismissing reminder:", err);
      alert("Failed to dismiss reminder. Please try again.");
    }
  };

  const dismissAll = async () => {
    if (totalCount === 0) return;
    if (!window.confirm(`Dismiss all ${totalCount.toLocaleString()} reminders? This cannot be undone.`)) return;

    try {
      await api.post("tna/reminders/mark-all-read/");
      setPage(1);
      loadPage(1, pageSize, selectedYear);
    } catch (err) {
      console.error("Error dismissing all reminders:", err);
      alert("Failed to dismiss all reminders. Please try again.");
    }
  };

  const filteredReminders = useMemo(() => {
    if (filter === "urgent") {
      return reminders.filter((r) => r.urgency_level === "urgent" || r.urgency_level === "overdue");
    }
    if (filter === "overdue") {
      return reminders.filter((r) => r.urgency_level === "overdue");
    }
    return reminders;
  }, [reminders, filter]);

  const urgentCount = useMemo(
    () => reminders.filter((r) => r.urgency_level === "urgent" || r.urgency_level === "overdue").length,
    [reminders]
  );
  const overdueCount = useMemo(
    () => reminders.filter((r) => r.urgency_level === "overdue").length,
    [reminders]
  );

  return (
    <div style={styles.page}>
      <Sidebar />
      <main style={styles.main}>
        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerIconWrap}>
              <FaBell style={styles.headerIcon} aria-hidden="true" />
            </span>
            <div>
              <h1 style={styles.headerTitle}>TNA Reminders</h1>
              <p style={styles.headerSubtitle}>Upcoming and overdue Time &amp; Action dates</p>
            </div>
            <span style={styles.headerBadge}>
              {formatCount(totalCount)} {totalCount === 1 ? "reminder" : "reminders"}
            </span>
          </div>
          <div style={styles.headerActions}>
            {lastRefresh && (
              <span style={styles.lastRefresh}>Updated {lastRefresh.toLocaleTimeString()}</span>
            )}
            {totalCount > 0 && (
              <button style={styles.dismissAllBtn} className="dismiss-all-btn" onClick={dismissAll}>
                Dismiss all
              </button>
            )}
            <button style={styles.refreshBtn} className="refresh-btn" onClick={handleRefresh} disabled={loading}>
              <FaSync style={{ marginRight: 6, ...(loading ? styles.spinning : {}) }} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div style={styles.filterBar}>
          <div style={styles.filterGroup}>
            {[
              { key: "all", label: "All", count: reminders.length },
              { key: "urgent", label: "Urgent", count: urgentCount },
              { key: "overdue", label: "Overdue", count: overdueCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                style={{ ...styles.filterBtn, ...(filter === key ? styles.filterBtnActive : {}) }}
                onClick={() => setFilter(key)}
              >
                {label}
                <span
                  style={{
                    ...styles.filterCount,
                    ...(filter === key ? styles.filterCountActive : {}),
                  }}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          <YearFilter
            selectedYear={selectedYear}
            availableYears={availableYears}
            onChange={handleYearChange}
          />
        </div>

        {/* ── Content ── */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={handleRefresh} />
        ) : filteredReminders.length === 0 ? (
          <EmptyState selectedYear={selectedYear} onClearYear={() => handleYearChange("all")} />
        ) : (
          <>
            <div style={styles.resultInfo}>
              <span>
                Showing {filteredReminders.length} of {reminders.length} on this page
                {selectedYear !== "all" && ` • ${selectedYear}`}
                {filter !== "all" && ` • ${filter}`}
              </span>
              <span style={styles.resultInfoBadge}>Latest first</span>
            </div>

            <div style={styles.cardList}>
              {filteredReminders.map((reminder) => (
                <ReminderCard key={reminder.id} reminder={reminder} onDismiss={dismissReminder} />
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              disabled={loading}
            />
          </>
        )}
      </main>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   STYLES
   ──────────────────────────────────────────────────────────────────────── */

const MONO = "ui-monospace, SFMono-Regular, 'JetBrains Mono', Menlo, Consolas, monospace";

const styles = {
  // Layout ----------------------------------------------------------------
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  main: {
    flex: 1,
    padding: "28px 32px 40px",
    overflow: "auto",
    maxHeight: "100vh",
  },

  // Header ------------------------------------------------------------------
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "14px" },
  headerIconWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #2563eb, #4f46e5)",
    boxShadow: "0 6px 16px -4px rgba(37,99,235,0.45)",
    flexShrink: 0,
  },
  headerIcon: { fontSize: "18px", color: "white" },
  headerTitle: { fontSize: "21px", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" },
  headerSubtitle: { fontSize: "12.5px", color: "#94a3b8", margin: "2px 0 0" },
  headerBadge: {
    padding: "4px 12px",
    background: "#eef2ff",
    color: "#4338ca",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 700,
    marginLeft: "4px",
  },
  headerActions: { display: "flex", gap: "10px", alignItems: "center" },
  lastRefresh: { fontSize: "12px", color: "#94a3b8" },
  dismissAllBtn: {
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#dc2626",
    background: "white",
    border: "1px solid #fecaca",
    cursor: "pointer",
    transition: "background 0.15s ease, box-shadow 0.15s ease",
  },
  refreshBtn: {
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
    background: "white",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "background 0.15s ease, box-shadow 0.15s ease",
  },
  spinning: { animation: "spin 1s linear infinite" },

  // Filter bar --------------------------------------------------------------
  filterBar: {
    display: "flex",
    gap: "12px",
    marginBottom: "18px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  filterGroup: {
    display: "flex",
    gap: "2px",
    flexWrap: "wrap",
    background: "#eef1f6",
    padding: "3px",
    borderRadius: "10px",
  },
  filterBtn: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "7px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#64748b",
    background: "transparent",
    border: "1px solid transparent",
    cursor: "pointer",
    transition: "background 0.15s ease, color 0.15s ease",
  },
  filterBtnActive: {
    color: "#2563eb",
    background: "white",
    boxShadow: "0 1px 3px rgba(15,23,42,0.12)",
  },
  filterCount: {
    padding: "1px 7px",
    borderRadius: "10px",
    background: "rgba(100,116,139,0.14)",
    fontSize: "11px",
    fontWeight: 700,
  },
  filterCountActive: { background: "#eff6ff", color: "#2563eb" },

  // Year dropdown -----------------------------------------------------------
  yearWrapper: { position: "relative", marginLeft: "auto" },
  yearBtn: {
    display: "flex",
    alignItems: "center",
    padding: "7px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
    background: "white",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    gap: "4px",
  },
  yearBtnActive: { color: "#2563eb", borderColor: "#2563eb", background: "#eff6ff" },
  yearClearIcon: { marginLeft: "4px", color: "#94a3b8", cursor: "pointer", fontSize: "12px" },
  chevron: { marginLeft: "4px", fontSize: "10px" },
  yearDropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    boxShadow: "0 12px 24px -8px rgba(15,23,42,0.18)",
    zIndex: 1000,
    minWidth: "190px",
    overflow: "hidden",
  },
  yearSearchRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 12px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  yearSearchInput: { flex: 1, border: "none", outline: "none", fontSize: "13px", background: "transparent" },
  yearList: { maxHeight: "240px", overflowY: "auto", padding: "4px 0" },
  yearOption: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 14px",
    fontSize: "13px",
    cursor: "pointer",
  },
  yearOptionActive: { background: "#eff6ff", color: "#2563eb", fontWeight: 600 },
  yearEmpty: { padding: "18px", textAlign: "center", color: "#94a3b8", fontSize: "13px" },

  // Result info bar -----------------------------------------------------------
  resultInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 2px",
    marginBottom: "14px",
    fontSize: "13px",
    color: "#64748b",
  },
  resultInfoBadge: {
    padding: "3px 10px",
    background: "#f1f5f9",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#475569",
  },

  // Card list -----------------------------------------------------------------
  cardList: { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "16px 18px",
    borderLeft: "4px solid #2563eb",
    boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
    transition: "box-shadow 0.15s ease, transform 0.15s ease",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "10px",
    flexWrap: "wrap",
  },
  identity: { display: "flex", flexDirection: "column", gap: "5px", minWidth: 0 },
  styleRow: { display: "flex", alignItems: "center", gap: "9px", flexWrap: "wrap" },
  styleIconWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "7px",
    flexShrink: 0,
  },
  styleIcon: { fontSize: "12px" },
  styleValue: { fontFamily: MONO, fontSize: "15.5px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" },
  styleValueMissing: { fontFamily: MONO, fontSize: "15.5px", fontWeight: 600, color: "#94a3b8", fontStyle: "italic" },
  poChip: {
    fontFamily: MONO,
    fontSize: "11.5px",
    fontWeight: 600,
    color: "#475569",
    background: "#f1f5f9",
    padding: "3px 9px",
    borderRadius: "6px",
  },

  headerRight: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  urgencyBadge: { fontSize: "11px", fontWeight: 700, padding: "3px 12px", borderRadius: "20px", whiteSpace: "nowrap" },
  dismissBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
  },

  message: { fontSize: "14px", color: "#334155", margin: "0 0 10px", lineHeight: 1.5 },

  cardFooter: { display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" },
  timeChip: {
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "11.5px",
    fontWeight: 700,
  },
  metaChip: {
    padding: "3px 10px",
    borderRadius: "12px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "11.5px",
    fontWeight: 500,
  },
  dateChip: {
    display: "flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "11.5px",
    fontWeight: 500,
    marginLeft: "auto",
  },

  // Pagination ------------------------------------------------------------------
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    padding: "14px 18px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
  },
  pageSizeGroup: { display: "flex", alignItems: "center", gap: "8px" },
  pageSizeLabel: { fontSize: "12px", color: "#64748b" },
  pageSizeSelect: {
    padding: "5px 8px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#334155",
    background: "white",
  },
  pageNav: { display: "flex", alignItems: "center", gap: "4px" },
  pageNavBtn: {
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#475569",
    cursor: "pointer",
    transition: "background 0.15s ease, border-color 0.15s ease",
  },
  pageNumBtn: {
    minWidth: "30px",
    height: "30px",
    padding: "0 6px",
    borderRadius: "6px",
    border: "1px solid transparent",
    background: "transparent",
    color: "#475569",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s ease, color 0.15s ease",
  },
  pageNumBtnActive: { background: "#2563eb", color: "white" },
  pageGap: { padding: "0 4px", color: "#cbd5e1", fontSize: "13px" },
  pageSummary: { fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" },

  // States ------------------------------------------------------------------------
  centerState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "70px 20px",
    color: "#64748b",
    fontSize: "14px",
  },
  spinnerIcon: { animation: "spin 1s linear infinite", fontSize: "24px", color: "#2563eb" },
  panelState: {
    textAlign: "center",
    padding: "60px 20px",
    background: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  errorIcon: { fontSize: "40px", color: "#f59e0b" },
  emptyIcon: { fontSize: "40px", color: "#10b981" },
  stateTitle: { margin: "14px 0 4px", color: "#0f172a", fontSize: "16px", fontWeight: 700 },
  stateBody: { color: "#64748b", margin: 0, fontSize: "14px" },
  retryBtn: {
    marginTop: "16px",
    padding: "9px 22px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "white",
    background: "#2563eb",
    border: "none",
    cursor: "pointer",
  },
  clearYearBtn: {
    marginTop: "12px",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#2563eb",
    background: "transparent",
    border: "1px solid #2563eb",
    cursor: "pointer",
  },
};

// Global keyframes / hover states (injected once)
if (typeof document !== "undefined" && !document.getElementById("tna-reminders-styles")) {
  const styleElement = document.createElement("style");
  styleElement.id = "tna-reminders-styles";
  styleElement.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .dismiss-btn:hover { color: #dc2626; background: #fee2e2; }
    .reminder-card:hover { box-shadow: 0 8px 20px -6px rgba(15,23,42,0.14); transform: translateY(-1px); }
    .refresh-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
    .dismiss-all-btn:hover { background: #fef2f2; }
    .page-nav-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
    .page-nav-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .page-num-btn:hover:not(:disabled) { background: #f1f5f9; }
  `;
  document.head.appendChild(styleElement);
}