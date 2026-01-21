// WeeklyAttendanceGraph.jsx
import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { getWeeklyAttendanceStats } from "../../api/employeeApi";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiUsers,
  FiClock,
  FiRefreshCw,
  FiAlertCircle,
  FiDownload,
} from "react-icons/fi";

const WeeklyAttendanceGraph = () => {
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("7"); // '7', '14', '30'

  const graphRef = useRef(null);

  const fetchWeeklyStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange) + 1);

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      const response = await getWeeklyAttendanceStats(startDateStr, endDateStr);

      if (response.data && response.data.daily_stats) {
        setWeeklyData(response.data);
      } else {
        throw new Error("Invalid data structure received from API");
      }
    } catch (err) {
      console.error("Error fetching weekly stats:", err);
      setError(err.message || "Failed to load weekly attendance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyStats();
  }, [timeRange]);

  const handleDownload = async () => {
    if (!graphRef.current) return;

    try {
      // Force layout recalculation
      const element = graphRef.current;

      // Temporary fix for some browsers
      element.style.transform = "scale(1)";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,

        // Critical fixes for cropping
        width: element.offsetWidth,
        height: element.offsetHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,

        // Additional safety
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,

        // Sometimes needed
        allowTaint: true,
        removeContainer: true,
      });

      const link = document.createElement("a");
      link.download = `Weekly_Attendance_${timeRange}days_${
        new Date().toISOString().split("T")[0]
      }.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to capture graph. Try refreshing the page first.");
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading weekly attendance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <FiAlertCircle size={24} />
        <h4>Unable to Load Data</h4>
        <p>{error}</p>
        <button onClick={fetchWeeklyStats} style={styles.retryButton}>
          <FiRefreshCw /> Retry
        </button>
      </div>
    );
  }

  if (!weeklyData || !weeklyData.daily_stats) {
    return (
      <div style={styles.noDataContainer}>
        <FiCalendar size={48} style={{ color: "#9ca3af" }} />
        <h4>No Attendance Data Available</h4>
        <button onClick={fetchWeeklyStats} style={styles.retryButton}>
          Refresh
        </button>
      </div>
    );
  }

  const { daily_stats, weekly_summary, date_range } = weeklyData;
  const hasActualData = daily_stats.some((day) => day.total_attendance > 0);

  if (!hasActualData) {
    return (
      <div style={styles.noDataContainer}>
        <FiClock size={48} style={{ color: "#9ca3af" }} />
        <h4>No Recent Attendance Records</h4>
        <p>
          No attendance found from {date_range.start_date} to{" "}
          {date_range.end_date}
        </p>
        <div style={styles.timeRangeButtons}>
          {["7", "14", "30"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                ...styles.rangeButton,
                ...(timeRange === range ? styles.activeRangeButton : {}),
              }}
            >
              {range} days
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>
            <FiCalendar style={{ marginRight: 8 }} />
            Weekly On-Time Attendance Trend
          </h3>
          <p style={styles.subtitle}>
            {date_range.start_date} to {date_range.end_date} • {date_range.days}{" "}
            days
          </p>
        </div>

        <div style={styles.controls}>
          <div style={styles.timeRangeButtons}>
            {["7", "14", "30"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  ...styles.rangeButton,
                  ...(timeRange === range ? styles.activeRangeButton : {}),
                }}
              >
                {range} days
              </button>
            ))}
          </div>

          <button
            onClick={fetchWeeklyStats}
            style={styles.refreshButton}
            title="Refresh"
          >
            <FiRefreshCw />
          </button>

          <button
            onClick={handleDownload}
            style={styles.downloadButton}
            title="Download as PNG"
            disabled={loading}
          >
            <FiDownload /> Save
          </button>
        </div>
      </div>

      {/* This is the section that will be captured */}
      <div ref={graphRef}>
        {/* Summary Cards */}
        <div style={styles.summaryCards}>
          <div style={styles.summaryCard}>
            <div
              style={{
                ...styles.summaryIcon,
                backgroundColor: "#dbeafe",
                color: "#1d4ed8",
              }}
            >
              <FiUsers />
            </div>
            <div>
              <div style={styles.summaryValue}>
                {weekly_summary.total_attendance}
              </div>
              <div style={styles.summaryLabel}>Total Attendance</div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div
              style={{
                ...styles.summaryIcon,
                backgroundColor: "#dcfce7",
                color: "#16a34a",
              }}
            >
              <FiClock />
            </div>
            <div>
              <div style={styles.summaryValue}>
                {weekly_summary.weekly_percentage}%
              </div>
              <div style={styles.summaryLabel}>On-Time Rate</div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div
              style={{
                ...styles.summaryIcon,
                backgroundColor: "#fef3c7",
                color: "#d97706",
              }}
            >
              {weekly_summary.weekly_percentage >= 80 ? (
                <FiTrendingUp />
              ) : (
                <FiTrendingDown />
              )}
            </div>
            <div>
              <div style={styles.summaryValue}>
                {weekly_summary.average_daily_percentage}%
              </div>
              <div style={styles.summaryLabel}>Daily Avg</div>
            </div>
          </div>
        </div>

        {/* Graph */}
        <div style={styles.graphContainer}>
          <div style={styles.graphHeader}>
            <h4 style={styles.graphTitle}>Daily On-Time Percentage</h4>
            <div style={styles.legend}>
              <div style={styles.legendItem}>
                <div
                  style={{ ...styles.legendColor, backgroundColor: "#10b981" }}
                />
                <span>On-Time</span>
              </div>
              <div style={styles.legendItem}>
                <div
                  style={{ ...styles.legendColor, backgroundColor: "#ef4444" }}
                />
                <span>Late</span>
              </div>
            </div>
          </div>

          <div style={styles.graph}>
            {daily_stats.map((day) => (
              <div key={day.date} style={styles.barContainer}>
                <div style={styles.barLabels}>
                  <div style={styles.dayLabel}>{day.day}</div>
                  <div style={styles.dateLabel}>{day.date.split("-")[2]}</div>
                  <div style={styles.percentageLabel}>
                    {day.on_time_percentage}%
                  </div>
                </div>

                <div style={styles.barBackground}>
                  <div
                    style={{
                      ...styles.lateBar,
                      width: `${day.late_percentage}%`,
                    }}
                  />
                  <div
                    style={{
                      ...styles.onTimeBar,
                      width: `${day.on_time_percentage}%`,
                      opacity: day.total_attendance > 0 ? 1 : 0.3,
                    }}
                  >
                    {day.on_time_percentage > 20 && (
                      <span style={styles.barValue}>
                        {day.on_time_percentage}%
                      </span>
                    )}
                  </div>
                </div>

                <div style={styles.dayDetails}>
                  <div style={styles.detailItem}>
                    <span>Total:</span>{" "}
                    <strong>{day.total_attendance || 0}</strong>
                  </div>
                  <div style={styles.detailItem}>
                    <span>On-Time:</span>{" "}
                    <strong style={{ color: "#10b981" }}>
                      {day.on_time_count}
                    </strong>
                  </div>
                  <div style={styles.detailItem}>
                    <span>Late:</span>{" "}
                    <strong style={{ color: "#ef4444" }}>
                      {day.late_count}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Optional footer text in the image */}
      <div
        style={{
          textAlign: "center",
          color: "#6b7280",
          fontSize: "0.85rem",
          marginTop: "1rem",
        }}
      >
        Generated on {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: "1.5rem",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
    display: "flex",
    alignItems: "center",
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "#64748b",
    marginTop: "0.25rem",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  timeRangeButtons: {
    display: "flex",
    gap: "0.5rem",
    backgroundColor: "#f1f5f9",
    padding: "0.25rem",
    borderRadius: "0.5rem",
  },
  rangeButton: {
    padding: "0.375rem 0.75rem",
    border: "none",
    background: "transparent",
    borderRadius: "0.25rem",
    fontSize: "0.75rem",
    color: "#64748b",
    cursor: "pointer",
  },
  activeRangeButton: {
    backgroundColor: "white",
    color: "#3b82f6",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  refreshButton: {
    padding: "0.5rem",
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "0.375rem",
    cursor: "pointer",
    color: "#64748b",
  },
  downloadButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#059669",
    color: "white",
    border: "none",
    borderRadius: "0.375rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.875rem",
  },
  summaryCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  summaryCard: {
    backgroundColor: "#f8fafc",
    padding: "1rem",
    borderRadius: "0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    border: "1px solid #e2e8f0",
  },
  summaryIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
  },
  summaryValue: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1e293b",
  },
  summaryLabel: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  graphContainer: {
    marginBottom: "1rem",
  },
  graphHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    flexWrap: "wrap",
  },
  graphTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    margin: 0,
  },
  legend: {
    display: "flex",
    gap: "1.25rem",
    fontSize: "0.875rem",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  legendColor: {
    width: "14px",
    height: "14px",
    borderRadius: "3px",
  },
  graph: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  barContainer: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  barLabels: {
    width: "80px",
    textAlign: "right",
  },
  dayLabel: { fontWeight: "600" },
  dateLabel: { fontSize: "0.75rem", color: "#9ca3af" },
  percentageLabel: { fontWeight: "600", marginTop: "2px" },
  barBackground: {
    flex: 1,
    height: "36px",
    backgroundColor: "#fee2e2",
    borderRadius: "6px",
    position: "relative",
    overflow: "hidden",
  },
  lateBar: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    backgroundColor: "#fecaca",
  },
  onTimeBar: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    backgroundColor: "#10b981",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    transition: "width 0.5s ease",
  },
  barValue: {
    color: "white",
    fontWeight: "600",
    paddingRight: "8px",
    fontSize: "0.8rem",
  },
  dayDetails: {
    width: "160px",
    fontSize: "0.8rem",
  },
  detailItem: {
    display: "flex",
    justifyContent: "space-between",
  },
  loadingContainer: {
    padding: "3rem",
    textAlign: "center",
    color: "#64748b",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 1rem",
  },
  errorContainer: { padding: "2rem", textAlign: "center", color: "#dc2626" },
  noDataContainer: { padding: "3rem", textAlign: "center", color: "#6b7280" },
  retryButton: {
    marginTop: "1rem",
    padding: "0.6rem 1.2rem",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

// Add spin animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default WeeklyAttendanceGraph;
